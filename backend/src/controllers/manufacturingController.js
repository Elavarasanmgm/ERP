const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const { respondWithFallback, respondFeatureUnavailable } = require('../utils/schemaFallback');

/**
 * Get all bills of materials
 */
const getBoMs = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT TOP 500 bom.BOMId AS BomId, bom.ProductId AS ItemId, i.ItemCode, i.ItemName,
              '1.0' AS Version, CASE WHEN bom.IsActive = 1 THEN 'Active' ELSE 'Inactive' END AS Status,
              bom.CreatedDate
       FROM dbo.BillOfMaterials bom
       JOIN dbo.Items i ON i.ItemId = bom.ProductId
       ORDER BY i.ItemCode DESC`
    );
    res.json(result.recordset);
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
      'SELECT * FROM dbo.BillOfMaterials WHERE BomId = @id',
      { id: parseInt(id) }
    );

    if (bomRes.recordset.length === 0) {
      return res.status(404).json({ error: 'BOM not found' });
    }

    const detailRes = await executeQuery(
      `SELECT bd.BOMDetailId AS BomDetailId, bd.ComponentId AS ComponentItemId, i.ItemCode, i.ItemName,
              bd.Quantity, CAST(NULL AS NVARCHAR(50)) AS UnitOfMeasure
       FROM dbo.BOMDetails bd
       JOIN dbo.Items i ON i.ItemId = bd.ComponentId
       WHERE bd.BOMId = @bom_id`,
      { bom_id: parseInt(id) }
    );

    res.json({
      bom: bomRes.recordset[0],
      details: detailRes.recordset,
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
      `INSERT INTO dbo.BillOfMaterials (ProductId, CreatedDate, IsActive)
       VALUES (@item, GETDATE(), 1)
       SELECT SCOPE_IDENTITY() as id`,
      {
        item: parseInt(itemId),
      }
    );

    logger.info(`BOM created for item ${itemId}`);
    res.status(201).json({ id: result.recordset[0].id, message: 'BOM created' });
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
      `SELECT TOP 500 wo.WorkOrderId, wo.WorkOrderNumber AS OrderNumber, wo.StartDate AS OrderDate, wo.EndDate AS DueDate,
        i.ItemCode, i.ItemName, wo.Quantity, wo.Status, wo.CreatedDate
       FROM dbo.WorkOrders wo
       JOIN dbo.Items i ON i.ItemId = wo.ProductId
       ORDER BY wo.StartDate DESC, wo.CreatedDate DESC`
    );
    res.json(result.recordset);
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
      'SELECT WorkOrderId FROM dbo.WorkOrders WHERE WorkOrderNumber = @num',
      { num: orderNumber }
    );

    if (check.recordset.length > 0) {
      return res.status(400).json({ error: 'Work order number already exists' });
    }

    const result = await executeQuery(
      `INSERT INTO dbo.WorkOrders (WorkOrderNumber, ProductId, Quantity, StartDate, EndDate, Status, CreatedBy, CreatedDate)
       VALUES (@num, @product, @qty, @order_date, @due_date, 'Planned', @user, GETDATE())
       SELECT SCOPE_IDENTITY() as id`,
      {
        num: orderNumber,
        order_date: orderDate,
        due_date: dueDate || null,
        product: parseInt(productItemId),
        qty: parseInt(quantity),
        user: userId,
      }
    );

    logger.info(`Work order created: ${orderNumber}`);
    res.status(201).json({ id: result.recordset[0].id, message: 'Work order created' });
  } catch (err) {
    return respondFeatureUnavailable(res, logger, 'Creating work order', err);
  }
};

module.exports = {
  getBoMs,
  getBOMById,
  createBOM,
  getWorkOrders,
  createWorkOrder,
};
