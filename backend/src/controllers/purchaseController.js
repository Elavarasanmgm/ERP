const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const { nextDocNumber } = require('./settingsController');

// ─── Material Requests ────────────────────────────────────────────────────────

const getMaterialRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    if (status) { params.push(status); where += ` AND mr.status = $${params.length}`; }
    const result = await executeQuery(
      `SELECT mr.id, mr.mr_number, mr.request_date, mr.required_date, mr.request_type,
              mr.reference_type, mr.reference_id, mr.status, mr.notes,
              u.email AS requested_by, a.email AS approved_by
       FROM material_requests mr
       LEFT JOIN users u ON u.userid = mr.requested_by
       LEFT JOIN users a ON a.userid = mr.approved_by
       ${where} ORDER BY mr.request_date DESC LIMIT 500`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getMaterialRequests:', err.message);
    res.status(500).json({ error: 'Failed to fetch material requests' });
  }
};

const getMaterialRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const mr = await executeQuery(
      `SELECT mr.*, u.email AS requested_by_email FROM material_requests mr
       LEFT JOIN users u ON u.userid = mr.requested_by WHERE mr.id=$1`, [id]
    );
    if (mr.rows.length === 0) return res.status(404).json({ error: 'Material request not found' });
    const lines = await executeQuery(
      `SELECT mrl.*, i.itemname AS item_name, i.itemcode AS item_code
       FROM material_request_lines mrl
       LEFT JOIN items i ON i.itemid = mrl.item_id
       WHERE mrl.mr_id=$1 ORDER BY mrl.id`, [id]
    );
    res.json({ ...mr.rows[0], lines: lines.rows });
  } catch (err) {
    logger.error('getMaterialRequestById:', err.message);
    res.status(500).json({ error: 'Failed to fetch material request' });
  }
};

const createMaterialRequest = async (req, res) => {
  try {
    const { request_type, reference_id, reference_type, required_date, notes, lines } = req.body;
    const userId = req.user.userId;
    if (!lines || lines.length === 0) return res.status(400).json({ error: 'At least one item line is required' });

    const mrNumber = await nextDocNumber('MR') || `MR-${Date.now()}`;
    const mr = await executeQuery(
      `INSERT INTO material_requests
        (mr_number, request_date, required_date, request_type, reference_id, reference_type,
         status, requested_by, notes, created_date)
       VALUES ($1,NOW(),$2,$3,$4,$5,'Pending',$6,$7,NOW()) RETURNING id`,
      [mrNumber, required_date || null, request_type || 'Manual',
       reference_id || null, reference_type || null, userId, notes || null]
    );
    const mrId = mr.rows[0].id;

    for (const l of lines) {
      // Check available stock
      const stock = await executeQuery(
        `SELECT COALESCE(SUM(quantity),0) AS available FROM stock WHERE itemid=$1`, [l.item_id]
      );
      const available = Number(stock.rows[0]?.available || 0);
      const shortage = Math.max(0, Number(l.required_qty) - available);
      await executeQuery(
        `INSERT INTO material_request_lines (mr_id, item_id, required_qty, available_qty, shortage_qty, unit, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [mrId, l.item_id, l.required_qty, available, shortage, l.unit || 'NOS', l.notes || null]
      );
    }

    logger.info(`Material Request created: ${mrNumber}`);
    res.status(201).json({ id: mrId, mr_number: mrNumber, message: 'Material Request created' });
  } catch (err) {
    logger.error('createMaterialRequest:', err.message);
    res.status(500).json({ error: 'Failed to create material request' });
  }
};

const approveMaterialRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const check = await executeQuery('SELECT status FROM material_requests WHERE id=$1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Material request not found' });
    if (check.rows[0].status !== 'Pending') return res.status(400).json({ error: 'Only Pending MRs can be approved' });
    await executeQuery(
      `UPDATE material_requests SET status='Approved', approved_by=$1, approved_date=NOW() WHERE id=$2`,
      [userId, id]
    );
    res.json({ message: 'Material Request approved' });
  } catch (err) {
    logger.error('approveMaterialRequest:', err.message);
    res.status(500).json({ error: 'Failed to approve material request' });
  }
};

// ─── Supplier Quotations ──────────────────────────────────────────────────────

const getQuotations = async (req, res) => {
  try {
    const { mr_id } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    if (mr_id) { params.push(mr_id); where += ` AND sq.mr_id = $${params.length}`; }
    const result = await executeQuery(
      `SELECT sq.id, sq.quotation_number, sq.quotation_date, sq.valid_until, sq.status,
              sq.total_amount, sq.currency, sq.delivery_days, sq.payment_terms,
              s.suppliername AS supplier_name, mr.mr_number
       FROM supplier_quotations sq
       LEFT JOIN suppliers s ON s.supplierid = sq.supplier_id
       LEFT JOIN material_requests mr ON mr.id = sq.mr_id
       ${where} ORDER BY sq.quotation_date DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getQuotations:', err.message);
    res.status(500).json({ error: 'Failed to fetch quotations' });
  }
};

const createQuotation = async (req, res) => {
  try {
    const { mr_id, supplier_id, valid_until, delivery_days, payment_terms, currency, notes, lines } = req.body;
    const userId = req.user.userId;
    if (!supplier_id || !lines || lines.length === 0) return res.status(400).json({ error: 'supplier_id and lines are required' });

    const qNumber = await nextDocNumber('QUOTATION') || `QTN-${Date.now()}`;
    let total = 0;
    for (const l of lines) total += Number(l.quantity) * Number(l.unit_price) + Number(l.tax_amount || 0);

    const q = await executeQuery(
      `INSERT INTO supplier_quotations
        (quotation_number, mr_id, supplier_id, quotation_date, valid_until, total_amount,
         currency, delivery_days, payment_terms, status, notes, created_by, created_date)
       VALUES ($1,$2,$3,NOW(),$4,$5,$6,$7,$8,'Received',$9,$10,NOW()) RETURNING id`,
      [qNumber, mr_id || null, supplier_id, valid_until || null, total,
       currency || 'INR', delivery_days || null, payment_terms || null, notes || null, userId]
    );
    const qId = q.rows[0].id;

    for (const l of lines) {
      await executeQuery(
        `INSERT INTO supplier_quotation_lines (quotation_id, item_id, quantity, unit_price, tax_id, tax_amount, line_total, delivery_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [qId, l.item_id, l.quantity, l.unit_price, l.tax_id || null,
         l.tax_amount || 0, Number(l.quantity)*Number(l.unit_price)+Number(l.tax_amount||0),
         l.delivery_date || null]
      );
    }

    res.status(201).json({ id: qId, quotation_number: qNumber, message: 'Quotation recorded' });
  } catch (err) {
    logger.error('createQuotation:', err.message);
    res.status(500).json({ error: 'Failed to create quotation' });
  }
};

const compareQuotations = async (req, res) => {
  try {
    const { mr_id } = req.params;
    const quotations = await executeQuery(
      `SELECT sq.id, sq.quotation_number, sq.total_amount, sq.delivery_days, sq.payment_terms, sq.currency,
              s.suppliername AS supplier_name
       FROM supplier_quotations sq
       LEFT JOIN suppliers s ON s.supplierid = sq.supplier_id
       WHERE sq.mr_id=$1 ORDER BY sq.total_amount ASC`, [mr_id]
    );
    const items = await executeQuery(
      `SELECT sql2.quotation_id, i.itemname, sql2.quantity, sql2.unit_price, sql2.line_total
       FROM supplier_quotation_lines sql2
       JOIN items i ON i.itemid = sql2.item_id
       WHERE sql2.quotation_id IN (
         SELECT id FROM supplier_quotations WHERE mr_id=$1
       )`, [mr_id]
    );
    res.json({ quotations: quotations.rows, item_comparison: items.rows });
  } catch (err) {
    logger.error('compareQuotations:', err.message);
    res.status(500).json({ error: 'Failed to compare quotations' });
  }
};

const selectQuotation = async (req, res) => {
  try {
    const { id } = req.params;  // quotation id
    const userId = req.user.userId;
    const q = await executeQuery('SELECT * FROM supplier_quotations WHERE id=$1', [id]);
    if (q.rows.length === 0) return res.status(404).json({ error: 'Quotation not found' });
    const qData = q.rows[0];

    // Mark this quotation as selected, others as Not Selected
    await executeQuery(`UPDATE supplier_quotations SET status='Selected' WHERE id=$1`, [id]);
    if (qData.mr_id) {
      await executeQuery(
        `UPDATE supplier_quotations SET status='Not Selected' WHERE mr_id=$1 AND id!=$2`,
        [qData.mr_id, id]
      );
    }

    // Auto-create Purchase Order
    const lines = await executeQuery('SELECT * FROM supplier_quotation_lines WHERE quotation_id=$1', [id]);
    const poNumber = await nextDocNumber('PO') || `PO-${Date.now()}`;
    const po = await executeQuery(
      `INSERT INTO purchaseorders
        (ponumber, orderdate, supplierid, totalamount, status, createdby, createddate,
         mr_id, quotation_id, currency)
       VALUES ($1,NOW(),$2,$3,'Pending',$4,NOW(),$5,$6,$7) RETURNING purchaseorderid AS id`,
      [poNumber, qData.supplier_id, qData.total_amount, userId,
       qData.mr_id, id, qData.currency || 'INR']
    );
    const poId = po.rows[0].id;

    for (const l of lines.rows) {
      await executeQuery(
        `INSERT INTO purchaseorderdetails (purchaseorderid, itemid, quantity, unitprice, linetotal)
         VALUES ($1,$2,$3,$4,$5)`,
        [poId, l.item_id, l.quantity, l.unit_price, l.line_total]
      );
    }

    if (qData.mr_id) {
      await executeQuery(`UPDATE material_requests SET status='PO Created' WHERE id=$1`, [qData.mr_id]);
    }

    res.status(201).json({ po_id: poId, po_number: poNumber, message: 'Quotation selected and PO created' });
  } catch (err) {
    logger.error('selectQuotation:', err.message);
    res.status(500).json({ error: 'Failed to select quotation' });
  }
};

// ─── Goods Receipts (GRN) ─────────────────────────────────────────────────────

const getGRNList = async (req, res) => {
  try {
    const { po_id, status } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    if (po_id)  { params.push(po_id);  where += ` AND gr.po_id = $${params.length}`; }
    if (status) { params.push(status); where += ` AND gr.status = $${params.length}`; }
    const result = await executeQuery(
      `SELECT gr.id, gr.grn_number, gr.receipt_date, gr.status, gr.notes,
              s.suppliername AS supplier_name, w.warehousename AS warehouse, po.ponumber AS po_number
       FROM goods_receipts gr
       LEFT JOIN suppliers s ON s.supplierid = gr.supplier_id
       LEFT JOIN warehouses w ON w.warehouseid = gr.warehouse_id
       LEFT JOIN purchaseorders po ON po.purchaseorderid = gr.po_id
       ${where} ORDER BY gr.receipt_date DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getGRNList:', err.message);
    res.status(500).json({ error: 'Failed to fetch GRNs' });
  }
};

const getGRNById = async (req, res) => {
  try {
    const { id } = req.params;
    const grn = await executeQuery(
      `SELECT gr.*, s.suppliername AS supplier_name, w.warehousename AS warehouse, po.ponumber AS po_number
       FROM goods_receipts gr
       LEFT JOIN suppliers s ON s.supplierid = gr.supplier_id
       LEFT JOIN warehouses w ON w.warehouseid = gr.warehouse_id
       LEFT JOIN purchaseorders po ON po.purchaseorderid = gr.po_id
       WHERE gr.id=$1`, [id]
    );
    if (grn.rows.length === 0) return res.status(404).json({ error: 'GRN not found' });
    const lines = await executeQuery(
      `SELECT grl.*, i.itemname AS item_name, i.itemcode AS item_code
       FROM goods_receipt_lines grl
       LEFT JOIN items i ON i.itemid = grl.item_id
       WHERE grl.grn_id=$1 ORDER BY grl.id`, [id]
    );
    res.json({ ...grn.rows[0], lines: lines.rows });
  } catch (err) {
    logger.error('getGRNById:', err.message);
    res.status(500).json({ error: 'Failed to fetch GRN' });
  }
};

const createGRN = async (req, res) => {
  try {
    const { po_id, supplier_id, warehouse_id, notes, lines } = req.body;
    const userId = req.user.userId;
    if (!po_id || !warehouse_id || !lines || lines.length === 0) {
      return res.status(400).json({ error: 'po_id, warehouse_id and lines are required' });
    }
    const grnNumber = await nextDocNumber('GRN') || `GRN-${Date.now()}`;
    const grn = await executeQuery(
      `INSERT INTO goods_receipts (grn_number, receipt_date, po_id, supplier_id, warehouse_id, status, received_by, notes, created_date)
       VALUES ($1,NOW(),$2,$3,$4,'Draft',$5,$6,NOW()) RETURNING id`,
      [grnNumber, po_id, supplier_id || null, warehouse_id, userId, notes || null]
    );
    const grnId = grn.rows[0].id;

    for (const l of lines) {
      await executeQuery(
        `INSERT INTO goods_receipt_lines (grn_id, item_id, po_qty, received_qty, accepted_qty, rejected_qty, location_id, unit_price, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [grnId, l.item_id, l.po_qty || 0, l.received_qty, l.accepted_qty || l.received_qty,
         l.rejected_qty || 0, l.location_id || null, l.unit_price || 0, l.notes || null]
      );
    }

    res.status(201).json({ id: grnId, grn_number: grnNumber, message: 'GRN created as Draft' });
  } catch (err) {
    logger.error('createGRN:', err.message);
    res.status(500).json({ error: 'Failed to create GRN' });
  }
};

const postGRN = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const grn = await executeQuery('SELECT * FROM goods_receipts WHERE id=$1', [id]);
    if (grn.rows.length === 0) return res.status(404).json({ error: 'GRN not found' });
    if (grn.rows[0].status === 'Posted') return res.status(400).json({ error: 'GRN already posted' });

    const lines = await executeQuery('SELECT * FROM goods_receipt_lines WHERE grn_id=$1', [id]);
    const warehouseId = grn.rows[0].warehouse_id;

    // Update stock for each accepted line
    for (const l of lines.rows) {
      const qty = Number(l.accepted_qty);
      if (qty <= 0) continue;

      const existing = await executeQuery(
        'SELECT stockid FROM stock WHERE itemid=$1 AND warehouseid=$2', [l.item_id, warehouseId]
      );
      if (existing.rows.length > 0) {
        await executeQuery(
          `UPDATE stock SET quantity = quantity + $1, lastupdated=NOW(),
           unit_cost=$2, total_value=(quantity+$1)*$2
           WHERE itemid=$3 AND warehouseid=$4`,
          [qty, l.unit_price || 0, l.item_id, warehouseId]
        );
      } else {
        await executeQuery(
          `INSERT INTO stock (itemid, warehouseid, quantity, lastupdated, unit_cost, total_value)
           VALUES ($1,$2,$3,NOW(),$4,$3*$4)`,
          [l.item_id, warehouseId, qty, l.unit_price || 0]
        );
      }
      // Record movement
      await executeQuery(
        `INSERT INTO stock_movements (item_id, warehouse_id, to_location, movement_type, quantity, reference_type, reference_id, moved_by, moved_date)
         VALUES ($1,$2,$3,'GRN_IN',$4,'GRN',$5,$6,NOW())`,
        [l.item_id, warehouseId, l.location_id || null, qty, id, userId]
      );
    }

    await executeQuery(`UPDATE goods_receipts SET status='Posted' WHERE id=$1`, [id]);
    await executeQuery(`UPDATE purchaseorders SET grn_status='Received' WHERE purchaseorderid=$1`, [grn.rows[0].po_id]);

    logger.info(`GRN posted: ${grn.rows[0].grn_number}`);
    res.json({ message: 'GRN posted — stock updated' });
  } catch (err) {
    logger.error('postGRN:', err.message);
    res.status(500).json({ error: 'Failed to post GRN' });
  }
};

module.exports = {
  getMaterialRequests, getMaterialRequestById, createMaterialRequest, approveMaterialRequest,
  getQuotations, createQuotation, compareQuotations, selectQuotation,
  getGRNList, getGRNById, createGRN, postGRN,
};
