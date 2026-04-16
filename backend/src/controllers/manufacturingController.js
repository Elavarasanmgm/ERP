const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const { respondWithFallback, respondFeatureUnavailable } = require('../utils/schemaFallback');

/**
 * Get all bills of materials
 */
const getBoMs = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT bom.bomid AS BomId, bom.productid AS ItemId, i.itemcode AS ItemCode, i.itemname AS ItemName,
              bom.bom_version AS Version, CASE WHEN bom.isactive = true THEN 'Active' ELSE 'Inactive' END AS Status,
              bom.createddate AS CreatedDate
       FROM billofmaterials bom
       JOIN items i ON i.itemid = bom.productid
       ORDER BY i.itemcode DESC`
    );
    res.json(result.rows);
  } catch (err) {
    return respondWithFallback(res, logger, 'Fetching BOMs', err, []);
  }
};

/**
 * Get BOM with detail lines
 */
const getBOMById = async (req, res) => {
  try {
    const { id } = req.params;
    const bomRes = await executeQuery(
      'SELECT * FROM billofmaterials WHERE bomid = $1',
      [parseInt(id)]
    );

    if (bomRes.rows.length === 0) {
      return res.status(404).json({ error: 'BOM not found' });
    }

    const detailRes = await executeQuery(
      `SELECT bd.bomdetailid AS BomDetailId, bd.componentid AS ComponentItemId, i.itemcode AS ItemCode, i.itemname AS ItemName,
              bd.quantity AS Quantity, NULL AS UnitOfMeasure
       FROM bomdetails bd
       JOIN items i ON i.itemid = bd.componentid
       WHERE bd.bomid = $1`,
      [parseInt(id)]
    );

    res.json({
      bom: bomRes.rows[0],
      details: detailRes.rows,
    });
  } catch (err) {
    return respondWithFallback(res, logger, 'Fetching BOM', err, null);
  }
};

/**
 * Create BOM
 */
const createBOM = async (req, res) => {
  try {
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ error: 'Item ID is required' });
    }

    const result = await executeQuery(
      `INSERT INTO billofmaterials (productid, createddate, isactive)
       VALUES ($1, NOW(), true)
       RETURNING bomid as id`,
      [parseInt(itemId)]
    );

    logger.info(`BOM created for item ${itemId}`);
    res.status(201).json({ id: result.rows[0].id, message: 'BOM created' });
  } catch (err) {
    return respondFeatureUnavailable(res, logger, 'Creating BOM', err);
  }
};

/**
 * Get all work orders
 */
const getWorkOrders = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT wo.workorderid AS WorkOrderId, wo.workordernumber AS OrderNumber, wo.startdate AS OrderDate, wo.enddate AS DueDate,
        i.itemcode AS ItemCode, i.itemname AS ItemName, wo.quantity AS Quantity, wo.status AS Status, wo.createddate AS CreatedDate
       FROM workorders wo
       JOIN items i ON i.itemid = wo.productid
       ORDER BY wo.startdate DESC, wo.createddate DESC`
    );
    res.json(result.rows);
  } catch (err) {
    return respondWithFallback(res, logger, 'Fetching work orders', err, []);
  }
};

/**
 * Create work order
 */
const createWorkOrder = async (req, res) => {
  try {
    const { orderNumber, orderDate, dueDate, productItemId, quantity } = req.body;
    const userId = req.user.userId;

    if (!orderNumber || !orderDate || !productItemId || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const check = await executeQuery(
      'SELECT workorderid FROM workorders WHERE workordernumber = $1',
      [orderNumber]
    );

    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'Work order number already exists' });
    }

    const result = await executeQuery(
      `INSERT INTO workorders (workordernumber, productid, quantity, startdate, enddate, status, createdby, createddate)
       VALUES ($1, $2, $3, $4, $5, 'Planned', $6, NOW())
       RETURNING workorderid as id`,
      [orderNumber, parseInt(productItemId), parseInt(quantity), orderDate, dueDate || null, userId]
    );

    logger.info(`Work order created: ${orderNumber}`);
    res.status(201).json({ id: result.rows[0].id, message: 'Work order created' });
  } catch (err) {
    return respondFeatureUnavailable(res, logger, 'Creating work order', err);
  }
};

/**
 * Complete Work Order → consume raw materials from BOM + add finished goods to stock
 */
const completeWorkOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { warehouseId } = req.body;
    const userId = req.user.userId;

    const woRes = await executeQuery(
      `SELECT workorderid, workordernumber, productid, quantity, status FROM workorders WHERE workorderid=$1`,
      [parseInt(id)]
    );
    if (woRes.rows.length === 0) return res.status(404).json({ error: 'Work order not found' });
    const wo = woRes.rows[0];
    if (wo.status === 'Completed') return res.status(400).json({ error: 'Work order already completed' });

    const wh = warehouseId || 1;

    // 1. Find active BOM for this product
    const bomRes = await executeQuery(
      `SELECT bomid FROM billofmaterials WHERE productid=$1 AND isactive=true ORDER BY bomid DESC LIMIT 1`,
      [wo.productid]
    );

    if (bomRes.rows.length > 0) {
      const bomId = bomRes.rows[0].bomid;

      // 2. Get BOM components
      const components = await executeQuery(
        `SELECT componentid AS item_id, quantity AS qty_per_unit FROM bomdetails WHERE bomid=$1`,
        [bomId]
      );

      // 3. Consume raw materials
      for (const comp of components.rows) {
        const totalQty = Number(comp.qty_per_unit) * Number(wo.quantity);
        const stockRow = await executeQuery(
          `SELECT stockid, quantity FROM stock WHERE itemid=$1 AND warehouseid=$2 LIMIT 1`,
          [comp.item_id, wh]
        );
        if (stockRow.rows.length > 0) {
          await executeQuery(
            `UPDATE stock SET quantity = GREATEST(0, quantity - $1), lastupdated=NOW() WHERE itemid=$2 AND warehouseid=$3`,
            [totalQty, comp.item_id, wh]
          );
        }
        await executeQuery(
          `INSERT INTO stock_movements (item_id, warehouse_id, movement_type, quantity, reference_type, reference_id, moved_by, moved_date, notes)
           VALUES ($1,$2,'WO_CONSUMPTION',$3,'WO',$4,$5,NOW(),'Consumed in Work Order')`,
          [comp.item_id, wh, totalQty, id, userId]
        );
      }
    }

    // 4. Add finished goods to stock
    const existing = await executeQuery(
      `SELECT stockid FROM stock WHERE itemid=$1 AND warehouseid=$2`, [wo.productid, wh]
    );
    if (existing.rows.length > 0) {
      await executeQuery(
        `UPDATE stock SET quantity = quantity + $1, lastupdated=NOW() WHERE itemid=$2 AND warehouseid=$3`,
        [wo.quantity, wo.productid, wh]
      );
    } else {
      await executeQuery(
        `INSERT INTO stock (itemid, warehouseid, quantity, opening_qty, unit_cost, total_value, lastupdated)
         VALUES ($1,$2,$3,0,0,0,NOW())`,
        [wo.productid, wh, wo.quantity]
      );
    }
    await executeQuery(
      `INSERT INTO stock_movements (item_id, warehouse_id, movement_type, quantity, reference_type, reference_id, moved_by, moved_date, notes)
       VALUES ($1,$2,'WO_RECEIPT',$3,'WO',$4,$5,NOW(),'Finished goods from Work Order')`,
      [wo.productid, wh, wo.quantity, id, userId]
    );

    // 5. Mark Work Order as Completed
    await executeQuery(
      `UPDATE workorders SET status='Completed' WHERE workorderid=$1`, [parseInt(id)]
    );

    logger.info(`Work order ${wo.workordernumber} completed — materials consumed, finished goods added`);
    res.json({ message: 'Work order completed, BOM materials consumed, finished goods added to stock' });
  } catch (err) {
    return respondFeatureUnavailable(res, logger, 'Completing work order', err);
  }
};



// ─── WIP Kanban ───────────────────────────────────────────────────────────────
const getWIP = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT wo.workorderid AS id, wo.workordernumber AS work_order_number,
              i.itemname AS item_name, i.itemcode AS item_code,
              wo.quantity, wo.status, wo.priority,
              wo.planned_start, wo.planned_end, wo.actual_start,
              CASE
                WHEN wo.status IN ('Planned','Draft')        THEN 'RAW_MATERIAL_ISSUED'
                WHEN wo.status IN ('In Progress','Released') THEN 'IN_PRODUCTION'
                WHEN wo.status = 'Quality Check'             THEN 'QUALITY_CHECK'
                WHEN wo.status = 'Completed'                 THEN 'FINISHED_GOODS'
                WHEN wo.status = 'Dispatched'                THEN 'DISPATCHED'
                ELSE 'RAW_MATERIAL_ISSUED'
              END AS current_stage
       FROM workorders wo
       JOIN items i ON i.itemid = wo.productid
       WHERE wo.status NOT IN ('Cancelled')
       ORDER BY wo.createddate DESC`
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getWIP:', err.message);
    res.status(500).json({ error: 'Failed to fetch WIP data' });
  }
};

// ─── Quality Checks ──────────────────────────────────────────────────────────
// ─── Quality Checks ──────────────────────────────────────────────────────────
const getQualityChecks = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT qc.id, qc.qc_number, qc.check_date AS inspection_date,
              qc.total_qty AS quantity_produced, qc.passed_qty AS quantity_passed,
              qc.failed_qty AS quantity_failed,
              qc.status AS result, qc.remarks, qc.created_date AS created_at,
              wo.workordernumber AS work_order_number,
              i.itemname AS item_name
       FROM quality_checks qc
       LEFT JOIN workorders wo ON wo.workorderid = qc.work_order_id
       LEFT JOIN items i ON i.itemid = qc.item_id
       ORDER BY qc.check_date DESC, qc.created_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    return respondWithFallback(res, logger, 'Fetching quality checks', err, []);
  }
};

const createQualityCheck = async (req, res) => {
  try {
    const { workOrderId, itemId, inspectionDate, inspectorName, quantityProduced, quantityPassed, quantityFailed, result, remarks } = req.body;
    if (!workOrderId) return res.status(400).json({ error: 'Work order is required' });

    const qcNum = `QC-${Date.now()}`;
    const qcResult = await executeQuery(
      `INSERT INTO quality_checks (qc_number, work_order_id, item_id, check_date, total_qty, passed_qty, failed_qty, status, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        qcNum,
        parseInt(workOrderId),
        itemId ? parseInt(itemId) : null,
        inspectionDate || new Date().toISOString().split('T')[0],
        quantityProduced ? Number(quantityProduced) : 0,
        quantityPassed ? Number(quantityPassed) : 0,
        quantityFailed ? Number(quantityFailed) : 0,
        result || 'Pending',
        remarks || null
      ]
    );
    logger.info(`[Manufacturing] Quality check ${qcNum} created for WO ${workOrderId}`);
    res.status(201).json({ id: qcResult.rows[0].id, message: 'Quality check saved' });
  } catch (err) {
    return respondFeatureUnavailable(res, logger, 'Creating quality check', err);
  }
};

module.exports = { getBoMs, getBOMById, createBOM, getWorkOrders, createWorkOrder, completeWorkOrder, getWIP, getQualityChecks, createQualityCheck };
