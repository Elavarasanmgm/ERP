const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const { nextDocNumber } = require('./settingsController');

// ─── Warehouses ───────────────────────────────────────────────────────────────

const getWarehouses = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    let query = `SELECT warehouseid AS id, warehousename AS name, location, createddate, isactive FROM warehouses`;
    if (activeOnly === 'true') {
      query += ` WHERE isactive = true`;
    }
    query += ` ORDER BY warehousename`;
    const result = await executeQuery(query);
    res.json(result.rows);
  } catch (err) {
    logger.error('getWarehouses:', err.message);
    res.status(500).json({ error: 'Failed to fetch warehouses' });
  }
};

const createWarehouse = async (req, res) => {
  try {
    const { name, location, manager_id } = req.body;
    if (!name) return res.status(400).json({ error: 'Warehouse name is required' });
    const result = await executeQuery(
      `INSERT INTO warehouses (warehousename, location, manager, createddate, isactive)
       VALUES ($1, $2, $3, NOW(), true) RETURNING warehouseid AS id`,
      [name, location || null, manager_id || null]
    );
    res.status(201).json({ id: result.rows[0].id, message: 'Warehouse created' });
  } catch (err) {
    logger.error('createWarehouse:', err.message);
    res.status(500).json({ error: 'Failed to create warehouse' });
  }
};

const updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, manager_id, isactive } = req.body;
    await executeQuery(
      `UPDATE warehouses SET warehousename=$1, location=$2, manager=$3, isactive=$4
       WHERE warehouseid=$5`,
      [name, location, manager_id || null, isactive ?? true, id]
    );
    res.json({ message: 'Warehouse updated' });
  } catch (err) {
    logger.error('updateWarehouse:', err.message);
    res.status(500).json({ error: 'Failed to update warehouse' });
  }
};

const deleteWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    // Check if stock exists in this warehouse
    const stockCheck = await executeQuery('SELECT stockid FROM stock WHERE warehouseid=$1 LIMIT 1', [id]);
    if (stockCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete warehouse with existing stock' });
    }
    await executeQuery('DELETE FROM warehouses WHERE warehouseid=$1', [id]);
    res.json({ message: 'Warehouse deleted' });
  } catch (err) {
    logger.error('deleteWarehouse:', err.message);
    res.status(500).json({ error: 'Failed to delete warehouse' });
  }
};

// ─── Items ────────────────────────────────────────────────────────────────────

const getItems = async (req, res) => {
  try {
    const { category_id, subcategory_id, search } = req.query;
    let where = 'WHERE i.isactive = true';
    const params = [];
    if (category_id)    { params.push(category_id);    where += ` AND i.category_id = $${params.length}`; }
    if (subcategory_id) { params.push(subcategory_id); where += ` AND i.subcategory_id = $${params.length}`; }
    if (search) { params.push(`%${search}%`); where += ` AND (i.itemname ILIKE $${params.length} OR i.itemcode ILIKE $${params.length} OR i.item_number ILIKE $${params.length})`; }

    const result = await executeQuery(
      `SELECT i.itemid AS id, i.itemid, i.item_number, i.itemcode AS code, i.itemcode, i.itemname AS name, i.itemname,
              i.description, i.unitprice AS unit_price, i.unitprice, i.unit_of_measure, i.hsn_code,
              i.reorderlevel AS reorder_level,
              c.name AS category, s.name AS subcategory, t.name AS type
       FROM items i
       LEFT JOIN item_categories c ON c.id = i.category_id
       LEFT JOIN item_subcategories s ON s.id = i.subcategory_id
       LEFT JOIN item_types t ON t.id = i.type_id
       ${where} ORDER BY i.itemcode LIMIT 500`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getItems:', err.message);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
};

const getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await executeQuery(
      `SELECT i.*, c.name AS category, s.name AS subcategory, t.name AS type
       FROM items i
       LEFT JOIN item_categories c ON c.id = i.category_id
       LEFT JOIN item_subcategories s ON s.id = i.subcategory_id
       LEFT JOIN item_types t ON t.id = i.type_id
       WHERE i.itemid = $1`, [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('getItemById:', err.message);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
};

const getNextItemNumber = async (req, res) => {
  try {
    const seq = await executeQuery(
      `SELECT prefix, current_number + 1 AS next FROM number_sequences WHERE document_type='ITEM'`
    );
    if (seq.rows.length === 0) return res.json({ next_number: 'ITM-00001' });
    const { prefix, next } = seq.rows[0];
    res.json({ next_number: `${prefix}-${String(next).padStart(5, '0')}` });
  } catch (err) {
    logger.error('getNextItemNumber:', err.message);
    res.status(500).json({ error: 'Failed to get next item number' });
  }
};

const createItem = async (req, res) => {
  try {
    const { itemCode, itemName, description, unitPrice, unit_of_measure, hsn_code, reorderLevel, category_id, subcategory_id, type_id } = req.body;
    if (!itemCode || !itemName) return res.status(400).json({ error: 'itemCode and itemName are required' });

    const check = await executeQuery('SELECT itemid FROM items WHERE itemcode = $1', [itemCode]);
    if (check.rows.length > 0) return res.status(400).json({ error: 'Item code already exists' });

    const itemNumber = await nextDocNumber('ITEM') || `ITM-${Date.now()}`;
    const result = await executeQuery(
      `INSERT INTO items (itemcode, itemname, description, unitprice, unit_of_measure, hsn_code,
        reorderlevel, category_id, subcategory_id, type_id, item_number, isactive, createddate)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true,NOW()) RETURNING itemid AS id`,
      [itemCode, itemName, description || null, unitPrice || 0, unit_of_measure || 'NOS',
       hsn_code || null, reorderLevel || 0, category_id || null, subcategory_id || null, type_id || null, itemNumber]
    );
    logger.info(`Item created: ${itemCode} — ${itemNumber}`);
    res.status(201).json({ id: result.rows[0].id, item_number: itemNumber, message: 'Item created' });
  } catch (err) {
    logger.error('createItem:', err.message);
    res.status(500).json({ error: 'Failed to create item' });
  }
};

const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemName, description, unitPrice, unit_of_measure, hsn_code, reorderLevel, category_id, subcategory_id, type_id, isactive } = req.body;
    await executeQuery(
      `UPDATE items SET itemname=$1, description=$2, unitprice=$3, unit_of_measure=$4,
       hsn_code=$5, reorderlevel=$6, category_id=$7, subcategory_id=$8, type_id=$9, isactive=$10
       WHERE itemid=$11`,
      [itemName, description, unitPrice, unit_of_measure, hsn_code, reorderLevel,
       category_id, subcategory_id, type_id, isactive ?? true, id]
    );
    res.json({ message: 'Item updated' });
  } catch (err) {
    logger.error('updateItem:', err.message);
    res.status(500).json({ error: 'Failed to update item' });
  }
};

// ─── Stock Levels ─────────────────────────────────────────────────────────────

const getStockLevels = async (req, res) => {
  try {
    const { warehouse_id, high_value } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    if (warehouse_id) { params.push(warehouse_id); where += ` AND s.warehouseid = $${params.length}`; }
    if (high_value === 'true') { where += ` AND s.is_high_value = true`; }
    const result = await executeQuery(
      `SELECT s.stockid AS id, i.item_number, i.itemcode AS code, i.itemname AS name,
              s.warehouseid AS warehouse_id, w.warehousename AS warehouse,
              s.quantity, s.unit_cost, s.total_value, s.is_high_value, s.opening_qty,
              sl.location_code, i.reorderlevel AS reorder_level,
              i.unit_of_measure
       FROM stock s
       JOIN items i ON i.itemid = s.itemid
       JOIN warehouses w ON w.warehouseid = s.warehouseid
       LEFT JOIN stock_locations sl ON sl.id = s.location_id
       ${where} ORDER BY i.itemcode, w.warehousename`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getStockLevels:', err.message);
    res.status(500).json({ error: 'Failed to fetch stock' });
  }
};

const adjustStock = async (req, res) => {
  try {
    const { itemId, warehouseId, quantity, unitCost, movementType, reason } = req.body;
    const userId = req.user.userId;
    if (!itemId || warehouseId === undefined || quantity === undefined) {
      return res.status(400).json({ error: 'itemId, warehouseId and quantity are required' });
    }
    const qty    = Number(quantity);
    const cost   = Number(unitCost || 0);
    const mType  = movementType || 'ADJUSTMENT';

    // Upsert: create stock record if it doesn't exist, otherwise add delta
    await executeQuery(
      `INSERT INTO stock (itemid, warehouseid, quantity, unit_cost, total_value, lastupdated)
       VALUES ($1, $2, $3::numeric, $4::numeric, $3::numeric * $4::numeric, NOW())
       ON CONFLICT (itemid, warehouseid) DO UPDATE
         SET quantity    = stock.quantity + $3::numeric,
             unit_cost   = CASE WHEN $4::numeric > 0 THEN $4::numeric ELSE stock.unit_cost END,
             total_value = (stock.quantity + $3::numeric) * COALESCE(NULLIF($4::numeric, 0), stock.unit_cost, 0),
             lastupdated = NOW()`,
      [itemId, warehouseId, qty, cost]
    );

    await executeQuery(
      `INSERT INTO stock_movements (item_id, warehouse_id, movement_type, quantity, reference_type, moved_by, moved_date, notes)
       VALUES ($1, $2, $3, $4, 'MANUAL', $5, NOW(), $6)`,
      [itemId, warehouseId, mType, qty, userId, reason || null]
    );

    res.json({ message: 'Stock updated successfully' });
  } catch (err) {
    logger.error('adjustStock:', err.message);
    res.status(500).json({ error: 'Failed to adjust stock' });
  }
};

// ─── Stock Locations (Rack/Row/Bin) ───────────────────────────────────────────

const getLocations = async (req, res) => {
  try {
    const { warehouse_id } = req.query;
    const params = [];
    let where = 'WHERE sl.is_active = true';
    if (warehouse_id) { params.push(warehouse_id); where += ` AND sl.warehouse_id = $${params.length}`; }
    const result = await executeQuery(
      `SELECT sl.id, sl.warehouse_id, w.warehousename AS warehouse, sl.rack, sl.row, sl.bin,
              sl.location_code, sl.is_active
       FROM stock_locations sl
       JOIN warehouses w ON w.warehouseid = sl.warehouse_id
       ${where} ORDER BY sl.location_code`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getLocations:', err.message);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
};

const createLocation = async (req, res) => {
  try {
    const { warehouse_id, warehouseId, rack, row, bin, locationCode } = req.body;
    const wid = warehouse_id || warehouseId;
    if (!wid || !rack) return res.status(400).json({ error: 'warehouse_id and rack are required' });
    const finalCode = locationCode || [rack, row, bin].filter(Boolean).join('-');
    const result = await executeQuery(
      `INSERT INTO stock_locations (warehouse_id, rack, row, bin, location_code, is_active, created_date)
       VALUES ($1,$2,$3,$4,$5,true,NOW()) RETURNING id`,
      [wid, rack, row || null, bin || null, finalCode]
    );
    res.status(201).json({ id: result.rows[0].id, location_code: finalCode, message: 'Location created' });
  } catch (err) {
    logger.error('createLocation:', err.message);
    res.status(500).json({ error: 'Failed to create location' });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { warehouseId, rack, row, bin, locationCode, is_active } = req.body;
    const finalCode = locationCode || [rack, row, bin].filter(Boolean).join('-');
    
    await executeQuery(
      `UPDATE stock_locations 
       SET warehouse_id=$1, rack=$2, row=$3, bin=$4, location_code=$5, is_active=$6
       WHERE id=$7`,
      [warehouseId, rack, row || null, bin || null, finalCode, is_active ?? true, id]
    );
    res.json({ message: 'Location updated' });
  } catch (err) {
    logger.error('updateLocation:', err.message);
    res.status(500).json({ error: 'Failed to update location' });
  }
};

const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    // Check if in use
    const check = await executeQuery('SELECT stockid FROM stock WHERE location_id = $1 LIMIT 1', [id]);
    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete location: it is currently in use by stock records.' });
    }
    await executeQuery('DELETE FROM stock_locations WHERE id = $1', [id]);
    res.json({ message: 'Location deleted' });
  } catch (err) {
    logger.error('deleteLocation:', err.message);
    res.status(500).json({ error: 'Failed to delete location' });
  }
};

// ─── Opening Stock ────────────────────────────────────────────────────────────

const getOpeningStock = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT os.id, os.item_id, i.itemname AS item_name, i.itemcode AS item_code,
              os.warehouse_id, w.warehousename AS warehouse_name,
              os.location_id, sl.location_code,
              os.quantity, os.unit_cost, os.total_value, os.status, os.entry_date
       FROM opening_stock os
       JOIN items i ON i.itemid = os.item_id
       JOIN warehouses w ON w.warehouseid = os.warehouse_id
       LEFT JOIN stock_locations sl ON sl.id = os.location_id
       ORDER BY os.entry_date DESC, i.itemcode`
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getOpeningStock:', err.message);
    res.status(500).json({ error: 'Failed to fetch opening stock' });
  }
};

// Save draft lines — accepts camelCase from frontend
const postOpeningStock = async (req, res) => {
  try {
    const { lines, entries } = req.body;
    const userId = req.user.userId;
    const rows = lines || entries;
    if (!rows || rows.length === 0) return res.status(400).json({ error: 'lines array is required' });

    // Delete existing draft entries before re-saving
    await executeQuery(`DELETE FROM opening_stock WHERE status='Draft'`, []);

    for (const e of rows) {
      const itemId      = e.item_id      || e.itemId;
      const warehouseId = e.warehouse_id || e.warehouseId;
      const locationId  = e.location_id  || e.locationId  || null;
      const quantity    = Number(e.quantity)  || 0;
      const unitCost    = Number(e.unit_cost  || e.unitCost || 0);
      const totalValue  = quantity * unitCost;
      await executeQuery(
        `INSERT INTO opening_stock (item_id, warehouse_id, location_id, quantity, unit_cost, total_value, status, entry_date, entered_by, created_date)
         VALUES ($1,$2,$3,$4,$5,$6,'Draft',NOW(),$7,NOW())`,
        [itemId, warehouseId, locationId, quantity, unitCost, totalValue, userId]
      );
    }
    res.json({ message: `Draft saved with ${rows.length} lines` });
  } catch (err) {
    logger.error('postOpeningStock:', err.message);
    res.status(500).json({ error: 'Failed to save opening stock draft' });
  }
};

// Post (lock) opening stock — convert draft to Posted and update stock
const postOpeningStockFinal = async (req, res) => {
  try {
    const userId = req.user.userId;
    const draft = await executeQuery(`SELECT * FROM opening_stock WHERE status='Draft'`, []);
    if (draft.rows.length === 0) return res.status(400).json({ error: 'No draft entries to post. Save draft first.' });

    for (const e of draft.rows) {
      const qty        = Math.round(Number(e.quantity || 0));   // stock.quantity is INTEGER
      const unitCost   = Number(e.unit_cost || 0);
      const totalValue = qty * unitCost;
      // Update stock table
      const existing = await executeQuery('SELECT stockid FROM stock WHERE itemid=$1 AND warehouseid=$2', [e.item_id, e.warehouse_id]);
      if (existing.rows.length > 0) {
        await executeQuery(
          `UPDATE stock SET opening_qty=$1, quantity=$1, unit_cost=$2, total_value=$3, lastupdated=NOW() WHERE itemid=$4 AND warehouseid=$5`,
          [qty, unitCost, totalValue, e.item_id, e.warehouse_id]
        );
      } else {
        await executeQuery(
          `INSERT INTO stock (itemid, warehouseid, quantity, opening_qty, unit_cost, total_value, location_id, lastupdated)
           VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
          [e.item_id, e.warehouse_id, qty, qty, unitCost, totalValue, e.location_id || null]
        );
      }
    }
    // Lock all draft entries
    await executeQuery(`UPDATE opening_stock SET status='Posted' WHERE status='Draft'`, []);
    res.json({ message: `Opening stock posted — ${draft.rows.length} items locked` });
  } catch (err) {
    logger.error('postOpeningStockFinal:', err.message);
    res.status(500).json({ error: 'Failed to post opening stock' });
  }
};

// ─── Stock Movements ──────────────────────────────────────────────────────────

const getStockMovements = async (req, res) => {
  try {
    const { item_id, warehouse_id, movement_type } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    if (item_id)       { params.push(item_id);       where += ` AND sm.item_id = $${params.length}`; }
    if (warehouse_id)  { params.push(warehouse_id);  where += ` AND sm.warehouse_id = $${params.length}`; }
    if (movement_type) { params.push(movement_type); where += ` AND sm.movement_type = $${params.length}`; }
    const result = await executeQuery(
      `SELECT sm.id, sm.movement_type, sm.quantity, sm.reference_type, sm.reference_id,
              sm.moved_date, sm.notes,
              i.itemname AS item_name, i.itemcode AS item_code,
              w.warehousename AS warehouse,
              fl.location_code AS from_location, tl.location_code AS to_location
       FROM stock_movements sm
       JOIN items i ON i.itemid = sm.item_id
       JOIN warehouses w ON w.warehouseid = sm.warehouse_id
       LEFT JOIN stock_locations fl ON fl.id = sm.from_location
       LEFT JOIN stock_locations tl ON tl.id = sm.to_location
       ${where} ORDER BY sm.moved_date DESC LIMIT 500`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getStockMovements:', err.message);
    res.status(500).json({ error: 'Failed to fetch stock movements' });
  }
};

const getInventoryReport = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT i.itemcode AS code, i.item_number, i.itemname AS name,
              c.name AS category, i.unit_of_measure, i.unitprice AS unit_price,
              COALESCE(SUM(s.quantity),0) AS total_quantity,
              COALESCE(SUM(s.total_value),0) AS total_value,
              i.reorderlevel AS reorder_level,
              CASE WHEN COALESCE(SUM(s.quantity),0) <= i.reorderlevel THEN true ELSE false END AS below_reorder
       FROM items i
       LEFT JOIN stock s ON s.itemid = i.itemid
       LEFT JOIN item_categories c ON c.id = i.category_id
       WHERE i.isactive = true
       GROUP BY i.itemid, i.itemcode, i.item_number, i.itemname, c.name, i.unit_of_measure, i.unitprice, i.reorderlevel
       ORDER BY i.itemcode`
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getInventoryReport:', err.message);
    res.status(500).json({ error: 'Failed to fetch inventory report' });
  }
};

const getHighValueStock = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT i.itemcode AS code, i.itemname AS name, w.warehousename AS warehouse,
              s.quantity, s.unit_cost, s.total_value, s.high_value_threshold
       FROM stock s
       JOIN items i ON i.itemid = s.itemid
       JOIN warehouses w ON w.warehouseid = s.warehouseid
       WHERE s.is_high_value = true
       ORDER BY s.total_value DESC`
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getHighValueStock:', err.message);
    res.status(500).json({ error: 'Failed to fetch high value stock' });
  }
};

module.exports = {
  getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse,
  getItems, getItemById, getNextItemNumber, createItem, updateItem,
  getStockLevels, adjustStock,
  getLocations, createLocation, updateLocation, deleteLocation,
  getOpeningStock, postOpeningStock, postOpeningStockFinal,
  getStockMovements,
  getInventoryReport, getHighValueStock,
};
