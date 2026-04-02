const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get all warehouses
 */
const getWarehouses = async (req, res) => {
  try {
    const result = await executeQuery(
      'SELECT TOP 100 WarehouseId, WarehouseName, Location FROM dbo.Warehouses ORDER BY WarehouseName'
    );
    res.json(result.recordset);
  } catch (err) {
    logger.error('Error fetching warehouses:', err.message);
    res.status(500).json({ error: 'Failed to fetch warehouses' });
  }
};

/**
 * Get all items
 */
const getItems = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT TOP 500 ItemId, ItemCode, ItemName, CAST(NULL AS NVARCHAR(255)) AS Category, UnitPrice, Description
       FROM dbo.Items
       ORDER BY ItemCode`
    );
    res.json(result.recordset);
  } catch (err) {
    logger.error('Error fetching items:', err.message);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
};

/**
 * Get item by ID
 */
const getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await executeQuery(
      'SELECT * FROM dbo.Items WHERE ItemId = @id',
      { id: parseInt(id) }
    );
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    logger.error('Error fetching item:', err.message);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
};

/**
 * Create new item
 */
const createItem = async (req, res) => {
  try {
    const { itemCode, itemName, category, unitPrice, description } = req.body;

    if (!itemCode || !itemName || !unitPrice) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check code uniqueness
    const check = await executeQuery(
      'SELECT ItemId FROM dbo.Items WHERE ItemCode = @code',
      { code: itemCode }
    );

    if (check.recordset.length > 0) {
      return res.status(400).json({ error: 'Item code already exists' });
    }

    const result = await executeQuery(
      `INSERT INTO dbo.Items (ItemCode, ItemName, UnitPrice, Description, CreatedDate)
       VALUES (@code, @name, @price, @desc, GETDATE())
       SELECT SCOPE_IDENTITY() as id`,
      {
        code: itemCode,
        name: itemName,
        price: parseFloat(unitPrice),
        desc: [category, description].filter(Boolean).join(' - ') || null,
      }
    );

    logger.info(`New item created: ${itemCode}`);
    res.status(201).json({ id: result.recordset[0].id, message: 'Item created' });
  } catch (err) {
    logger.error('Error creating item:', err.message);
    res.status(500).json({ error: 'Failed to create item' });
  }
};

/**
 * Get stock levels
 */
const getStockLevels = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT TOP 500 s.StockId, s.ItemId, i.ItemCode, i.ItemName, s.WarehouseId, w.WarehouseName,
              s.Quantity, i.ReorderLevel, s.LastUpdated AS LastCountDate
       FROM dbo.Stock s
       JOIN dbo.Items i ON i.ItemId = s.ItemId
       JOIN dbo.Warehouses w ON w.WarehouseId = s.WarehouseId
       ORDER BY i.ItemCode, w.WarehouseName`
    );
    res.json(result.recordset);
  } catch (err) {
    logger.error('Error fetching stock:', err.message);
    res.status(500).json({ error: 'Failed to fetch stock' });
  }
};

/**
 * Adjust stock
 */
const adjustStock = async (req, res) => {
  try {
    const { itemId, warehouseId, quantity, reason } = req.body;
    const userId = req.user.userId;

    if (!itemId || warehouseId === undefined || quantity === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check stock exists
    const stockCheck = await executeQuery(
      'SELECT StockId FROM dbo.Stock WHERE ItemId = @item AND WarehouseId = @warehouse',
      { item: parseInt(itemId), warehouse: parseInt(warehouseId) }
    );

    if (stockCheck.recordset.length === 0) {
      return res.status(404).json({ error: 'Stock record not found' });
    }

    // Update stock
    await executeQuery(
      `UPDATE dbo.Stock
       SET Quantity = Quantity + @qty, LastUpdated = GETDATE()
       WHERE ItemId = @item AND WarehouseId = @warehouse`,
      {
        qty: parseInt(quantity),
        item: parseInt(itemId),
        warehouse: parseInt(warehouseId),
      }
    );

    logger.info(`Stock adjusted for item ${itemId}: ${quantity} units (${reason})`);
    res.json({ message: 'Stock adjusted' });
  } catch (err) {
    logger.error('Error adjusting stock:', err.message);
    res.status(500).json({ error: 'Failed to adjust stock' });
  }
};

/**
 * Get inventory report
 */
const getInventoryReport = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT i.ItemCode, i.ItemName, CAST(NULL AS NVARCHAR(255)) AS Category, i.UnitPrice,
              SUM(s.Quantity) as TotalQuantity,
              SUM(s.Quantity * i.UnitPrice) as TotalValue
       FROM dbo.Items i
       LEFT JOIN dbo.Stock s ON s.ItemId = i.ItemId
       GROUP BY i.ItemCode, i.ItemName, i.UnitPrice
       ORDER BY i.ItemCode`
    );
    res.json(result.recordset);
  } catch (err) {
    logger.error('Error fetching inventory report:', err.message);
    res.status(500).json({ error: 'Failed to fetch inventory report' });
  }
};

module.exports = {
  getWarehouses,
  getItems,
  getItemById,
  createItem,
  getStockLevels,
  adjustStock,
  getInventoryReport,
};
