const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const { respondWithFallback, respondFeatureUnavailable } = require('../utils/schemaFallback');

/**
 * Get all sales orders
 */
const getSalesOrders = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT TOP 500 so.SalesOrderId, so.OrderNumber, so.OrderDate, so.DeliveryDate AS DueDate,
        c.CustomerName, so.TotalAmount, so.Status, so.CreatedDate
       FROM dbo.SalesOrders so
       LEFT JOIN dbo.Customers c ON c.CustomerId = so.CustomerId
       ORDER BY so.OrderDate DESC`
    );
    res.json(result.recordset);
  } catch (err) {
    return respondWithFallback(res, logger, 'Fetching sales orders', err, []);
  }
};

/**
 * Get single sales order with detail lines
 */
const getSalesOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const orderRes = await executeQuery(
      'SELECT * FROM dbo.SalesOrders WHERE SalesOrderId = @id',
      { id: parseInt(id) }
    );

    if (orderRes.recordset.length === 0) {
      return res.status(404).json({ error: 'Sales order not found' });
    }

    const detailRes = await executeQuery(
      `SELECT od.SalesOrderDetailId, od.ItemId, i.ItemCode, i.ItemName, od.Quantity, od.UnitPrice, od.LineTotal
       FROM dbo.SalesOrderDetails od
       JOIN dbo.Items i ON i.ItemId = od.ItemId
       WHERE od.SalesOrderId = @order_id`,
      { order_id: parseInt(id) }
    );

    res.json({
      order: orderRes.recordset[0],
      details: detailRes.recordset,
    });
  } catch (err) {
    return respondWithFallback(res, logger, 'Fetching sales order', err, null);
  }
};

/**
 * Create sales order
 */
const createSalesOrder = async (req, res) => {
  try {
    const { orderNumber, orderDate, dueDate, customerId, totalAmount, details } = req.body;
    const userId = req.user.userId;

    if (!orderNumber || !orderDate || !totalAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check order number uniqueness
    const check = await executeQuery(
      'SELECT SalesOrderId FROM dbo.SalesOrders WHERE OrderNumber = @num',
      { num: orderNumber }
    );

    if (check.recordset.length > 0) {
      return res.status(400).json({ error: 'Order number already exists' });
    }

    const result = await executeQuery(
      `INSERT INTO dbo.SalesOrders (OrderNumber, OrderDate, DeliveryDate, CustomerId, TotalAmount, Status, CreatedBy, CreatedDate)
       VALUES (@num, @order_date, @due_date, @cust, @total, 'Pending', @user, GETDATE())
       SELECT SCOPE_IDENTITY() as id`,
      {
        num: orderNumber,
        order_date: orderDate,
        due_date: dueDate || null,
        cust: customerId ? parseInt(customerId) : null,
        total: parseFloat(totalAmount),
        user: userId,
      }
    );

    logger.info(`Sales order created: ${orderNumber}`);
    res.status(201).json({ id: result.recordset[0].id, message: 'Sales order created' });
  } catch (err) {
    return respondFeatureUnavailable(res, logger, 'Creating sales order', err);
  }
};

/**
 * Get all purchase orders
 */
const getPurchaseOrders = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT TOP 500 po.PurchaseOrderId, po.PONumber AS OrderNumber, po.OrderDate, po.DeliveryDate AS DueDate,
        s.SupplierName, po.TotalAmount, po.Status, po.CreatedDate
       FROM dbo.PurchaseOrders po
       LEFT JOIN dbo.Suppliers s ON s.SupplierId = po.SupplierId
       ORDER BY po.OrderDate DESC`
    );
    res.json(result.recordset);
  } catch (err) {
    return respondWithFallback(res, logger, 'Fetching purchase orders', err, []);
  }
};

/**
 * Create purchase order
 */
const createPurchaseOrder = async (req, res) => {
  try {
    const { orderNumber, orderDate, dueDate, supplierId, totalAmount } = req.body;
    const userId = req.user.userId;

    if (!orderNumber || !orderDate || !totalAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check order number uniqueness
    const check = await executeQuery(
      'SELECT PurchaseOrderId FROM dbo.PurchaseOrders WHERE PONumber = @num',
      { num: orderNumber }
    );

    if (check.recordset.length > 0) {
      return res.status(400).json({ error: 'Order number already exists' });
    }

    const result = await executeQuery(
      `INSERT INTO dbo.PurchaseOrders (PONumber, OrderDate, DeliveryDate, SupplierId, TotalAmount, Status, CreatedBy, CreatedDate)
       VALUES (@num, @order_date, @due_date, @supp, @total, 'Pending', @user, GETDATE())
       SELECT SCOPE_IDENTITY() as id`,
      {
        num: orderNumber,
        order_date: orderDate,
        due_date: dueDate || null,
        supp: supplierId ? parseInt(supplierId) : null,
        total: parseFloat(totalAmount),
        user: userId,
      }
    );

    logger.info(`Purchase order created: ${orderNumber}`);
    res.status(201).json({ id: result.recordset[0].id, message: 'Purchase order created' });
  } catch (err) {
    return respondFeatureUnavailable(res, logger, 'Creating purchase order', err);
  }
};

module.exports = {
  getSalesOrders,
  getSalesOrderById,
  createSalesOrder,
  getPurchaseOrders,
  createPurchaseOrder,
};
