const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

// ─── Item Categories ─────────────────────────────────────────────────────────

const getCategories = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    let query = `SELECT id, name, description, is_active, created_date FROM item_categories`;
    if (activeOnly === 'true') query += ` WHERE is_active = true`;
    query += ` ORDER BY name`;
    const result = await executeQuery(query);
    res.json(result.rows);
  } catch (err) {
    logger.error('getCategories:', err.message);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const result = await executeQuery(
      `INSERT INTO item_categories (name, description, is_active, created_date)
       VALUES ($1, $2, true, NOW()) RETURNING id`,
      [name, description || null]
    );
    res.status(201).json({ id: result.rows[0].id, message: 'Category created' });
  } catch (err) {
    logger.error('createCategory:', err.message);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;
    await executeQuery(
      `UPDATE item_categories SET name=$1, description=$2, is_active=$3 WHERE id=$4`,
      [name, description, is_active ?? true, id]
    );
    res.json({ message: 'Category updated' });
  } catch (err) {
    logger.error('updateCategory:', err.message);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

// ─── Item Subcategories ───────────────────────────────────────────────────────

const getSubcategories = async (req, res) => {
  try {
    const { category_id, activeOnly } = req.query;
    let query = `SELECT s.id, s.category_id, c.name AS category_name, s.name, s.description, s.is_active
                 FROM item_subcategories s
                 JOIN item_categories c ON c.id = s.category_id`;
    const params = [];
    const conditions = [];
    if (category_id) { params.push(category_id); conditions.push(`s.category_id = $${params.length}`); }
    if (activeOnly === 'true') { conditions.push(`s.is_active = true`); }
    if (conditions.length > 0) query += ` WHERE ` + conditions.join(' AND ');
    query += ` ORDER BY s.name`;
    const result = await executeQuery(query, params);
    res.json(result.rows);
  } catch (err) {
    logger.error('getSubcategories:', err.message);
    res.status(500).json({ error: 'Failed to fetch subcategories' });
  }
};

const createSubcategory = async (req, res) => {
  try {
    const { category_id, name, description } = req.body;
    if (!category_id || !name) return res.status(400).json({ error: 'category_id and name are required' });
    const result = await executeQuery(
      `INSERT INTO item_subcategories (category_id, name, description, is_active, created_date)
       VALUES ($1, $2, $3, true, NOW()) RETURNING id`,
      [category_id, name, description || null]
    );
    res.status(201).json({ id: result.rows[0].id, message: 'Subcategory created' });
  } catch (err) {
    logger.error('createSubcategory:', err.message);
    res.status(500).json({ error: 'Failed to create subcategory' });
  }
};

const updateSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;
    await executeQuery(
      `UPDATE item_subcategories SET name=$1, description=$2, is_active=$3 WHERE id=$4`,
      [name, description, is_active ?? true, id]
    );
    res.json({ message: 'Subcategory updated' });
  } catch (err) {
    logger.error('updateSubcategory:', err.message);
    res.status(500).json({ error: 'Failed to update subcategory' });
  }
};

// ─── Item Types ───────────────────────────────────────────────────────────────

const getTypes = async (req, res) => {
  try {
    const { subcategory_id, activeOnly } = req.query;
    let query = `SELECT t.id, t.subcategory_id, s.name AS subcategory_name, t.name, t.description, t.is_active, t.color_code
                 FROM item_types t
                 JOIN item_subcategories s ON s.id = t.subcategory_id`;
    const params = [];
    const conditions = [];
    if (subcategory_id) { params.push(subcategory_id); conditions.push(`t.subcategory_id = $${params.length}`); }
    if (activeOnly === 'true') { conditions.push(`t.is_active = true`); }
    if (conditions.length > 0) query += ` WHERE ` + conditions.join(' AND ');
    query += ` ORDER BY t.name`;
    const result = await executeQuery(query, params);
    res.json(result.rows);
  } catch (err) {
    logger.error('getTypes:', err.message);
    res.status(500).json({ error: 'Failed to fetch types' });
  }
};

const createType = async (req, res) => {
  try {
    const { subcategory_id, name, description, color_code } = req.body;
    if (!subcategory_id || !name) return res.status(400).json({ error: 'subcategory_id and name are required' });
    const result = await executeQuery(
      `INSERT INTO item_types (subcategory_id, name, description, color_code, is_active, created_date)
       VALUES ($1, $2, $3, $4, true, NOW()) RETURNING id`,
      [subcategory_id, name, description || null, color_code || null]
    );
    res.status(201).json({ id: result.rows[0].id, message: 'Type created' });
  } catch (err) {
    logger.error('createType:', err.message);
    res.status(500).json({ error: 'Failed to create type' });
  }
};

const updateType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active, color_code } = req.body;
    await executeQuery(
      `UPDATE item_types SET name=$1, description=$2, is_active=$3, color_code=$4 WHERE id=$5`,
      [name, description, is_active ?? true, color_code, id]
    );
    res.json({ message: 'Type updated' });
  } catch (err) {
    logger.error('updateType:', err.message);
    res.status(500).json({ error: 'Failed to update type' });
  }
};

// ─── Currencies ───────────────────────────────────────────────────────────────

const getCurrencies = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    let query = `SELECT id, code, name, symbol, exchange_rate, is_active, updated_date FROM currencies`;
    if (activeOnly === 'true') query += ` WHERE is_active = true`;
    query += ` ORDER BY code`;
    const result = await executeQuery(query);
    res.json(result.rows);
  } catch (err) {
    logger.error('getCurrencies:', err.message);
    res.status(500).json({ error: 'Failed to fetch currencies' });
  }
};

const createCurrency = async (req, res) => {
  try {
    const { code, name, symbol, exchange_rate } = req.body;
    if (!code || !name) return res.status(400).json({ error: 'code and name are required' });
    const result = await executeQuery(
      `INSERT INTO currencies (code, name, symbol, exchange_rate, is_active, updated_date)
       VALUES ($1, $2, $3, $4, true, NOW()) RETURNING id`,
      [code.toUpperCase(), name, symbol || null, exchange_rate || 1]
    );
    res.status(201).json({ id: result.rows[0].id, message: 'Currency created' });
  } catch (err) {
    logger.error('createCurrency:', err.message);
    res.status(500).json({ error: 'Failed to create currency' });
  }
};

const updateCurrency = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, symbol, exchange_rate, is_active } = req.body;
    await executeQuery(
      `UPDATE currencies SET name=$1, symbol=$2, exchange_rate=$3, is_active=$4, updated_date=NOW() WHERE id=$5`,
      [name, symbol, exchange_rate, is_active ?? true, id]
    );
    res.json({ message: 'Currency updated' });
  } catch (err) {
    logger.error('updateCurrency:', err.message);
    res.status(500).json({ error: 'Failed to update currency' });
  }
};

// ─── HSN Codes ────────────────────────────────────────────────────────────────

const getHsnCodes = async (req, res) => {
  try {
    const { search } = req.query;
    let query = `SELECT id, hsn_code, description, cgst_rate, sgst_rate, igst_rate, is_active FROM hsn_codes`;
    const params = [];
    if (search) {
      query += ` WHERE hsn_code ILIKE $1 OR description ILIKE $1`;
      params.push(`%${search}%`);
    }
    query += ` ORDER BY hsn_code LIMIT 200`;
    const result = await executeQuery(query, params);
    res.json(result.rows);
  } catch (err) {
    logger.error('getHsnCodes:', err.message);
    res.status(500).json({ error: 'Failed to fetch HSN codes' });
  }
};

const createHsnCode = async (req, res) => {
  try {
    const { hsn_code, description, cgst_rate, sgst_rate, igst_rate } = req.body;
    if (!hsn_code) return res.status(400).json({ error: 'hsn_code is required' });
    const result = await executeQuery(
      `INSERT INTO hsn_codes (hsn_code, description, cgst_rate, sgst_rate, igst_rate, is_active)
       VALUES ($1, $2, $3, $4, $5, true) RETURNING id`,
      [hsn_code, description || null, cgst_rate || 0, sgst_rate || 0, igst_rate || 0]
    );
    res.status(201).json({ id: result.rows[0].id, message: 'HSN code created' });
  } catch (err) {
    logger.error('createHsnCode:', err.message);
    res.status(500).json({ error: 'Failed to create HSN code' });
  }
};

const updateHsnCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { hsn_code, description, cgst_rate, sgst_rate, igst_rate, is_active } = req.body;
    await executeQuery(
      `UPDATE hsn_codes SET hsn_code=$1, description=$2, cgst_rate=$3, sgst_rate=$4, igst_rate=$5, is_active=$6 WHERE id=$7`,
      [hsn_code, description, cgst_rate, sgst_rate, igst_rate, is_active ?? true, id]
    );
    res.json({ message: 'HSN code updated' });
  } catch (err) {
    logger.error('updateHsnCode:', err.message);
    res.status(500).json({ error: 'Failed to update HSN code' });
  }
};

// ─── Delete Handlers ─────────────────────────────────────────────────────────

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await executeQuery('DELETE FROM item_categories WHERE id = $1', [id]);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    logger.error('deleteCategory:', err.message);
    res.status(500).json({ error: 'Failed to delete category (it may be in use)' });
  }
};

const deleteSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    await executeQuery('DELETE FROM item_subcategories WHERE id = $1', [id]);
    res.json({ message: 'Subcategory deleted' });
  } catch (err) {
    logger.error('deleteSubcategory:', err.message);
    res.status(500).json({ error: 'Failed to delete subcategory' });
  }
};

const deleteType = async (req, res) => {
  try {
    const { id } = req.params;
    await executeQuery('DELETE FROM item_types WHERE id = $1', [id]);
    res.json({ message: 'Type deleted' });
  } catch (err) {
    logger.error('deleteType:', err.message);
    res.status(500).json({ error: 'Failed to delete type' });
  }
};

const deleteCurrency = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Get currency code
    const currRes = await executeQuery('SELECT code FROM currencies WHERE id = $1', [id]);
    if (currRes.rows.length === 0) return res.status(404).json({ error: 'Currency not found' });
    const { code } = currRes.rows[0];

    // 2. Check if it's the base currency in settings
    const settingsRes = await executeQuery('SELECT base_currency FROM company_settings LIMIT 1');
    if (settingsRes.rows.length > 0 && settingsRes.rows[0].base_currency === code) {
      return res.status(400).json({ error: 'Cannot delete the base currency' });
    }

    // 3. Check if in use in other tables
    const tables = [
      { name: 'Accounts', col: 'currency' },
      { name: 'Customers', col: 'currency' },
      { name: 'Suppliers', col: 'currency' },
      { name: 'SalesOrders', col: 'currency' },
      { name: 'PurchaseOrders', col: 'currency' },
      { name: 'Invoices', col: 'currency' }
    ];

    for (const t of tables) {
      const check = await executeQuery(`SELECT 1 FROM ${t.name} WHERE ${t.col} = $1 LIMIT 1`, [code]);
      if (check.rows.length > 0) {
        return res.status(400).json({ error: `Currency is in use in ${t.name}` });
      }
    }

    await executeQuery('DELETE FROM currencies WHERE id = $1', [id]);
    res.json({ message: 'Currency deleted' });
  } catch (err) {
    logger.error('deleteCurrency:', err.message);
    res.status(500).json({ error: 'Failed to delete currency' });
  }
};

const deleteHsnCode = async (req, res) => {
  try {
    const { id } = req.params;
    await executeQuery('DELETE FROM hsn_codes WHERE id = $1', [id]);
    res.json({ message: 'HSN code deleted' });
  } catch (err) {
    logger.error('deleteHsnCode:', err.message);
    res.status(500).json({ error: 'Failed to delete HSN code' });
  }
};

// ─── UOM ─────────────────────────────────────────────────────────────────────

const getUom = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    let query = `SELECT id, name, description, is_active, created_date FROM uom`;
    if (activeOnly === 'true') query += ` WHERE is_active = true`;
    query += ` ORDER BY name`;
    const result = await executeQuery(query);
    res.json(result.rows);
  } catch (err) {
    logger.error('getUom:', err.message);
    res.status(500).json({ error: 'Failed to fetch UOM' });
  }
};

const createUom = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const result = await executeQuery(
      `INSERT INTO uom (name, description, is_active, created_date) VALUES ($1, $2, true, NOW()) RETURNING id`,
      [name.toUpperCase().trim(), description || null]
    );
    res.status(201).json({ id: result.rows[0].id, message: 'UOM created' });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'UOM name already exists' });
    logger.error('createUom:', err.message);
    res.status(500).json({ error: 'Failed to create UOM' });
  }
};

const updateUom = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;
    await executeQuery(
      `UPDATE uom SET name=$1, description=$2, is_active=$3 WHERE id=$4`,
      [name.toUpperCase().trim(), description || null, is_active ?? true, id]
    );
    res.json({ message: 'UOM updated' });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'UOM name already exists' });
    logger.error('updateUom:', err.message);
    res.status(500).json({ error: 'Failed to update UOM' });
  }
};

const deleteUom = async (req, res) => {
  try {
    const { id } = req.params;
    const inUse = await executeQuery(`SELECT itemid FROM items WHERE unit_of_measure = (SELECT name FROM uom WHERE id=$1) LIMIT 1`, [id]);
    if (inUse.rows.length > 0) return res.status(400).json({ error: 'Cannot delete UOM: it is used by existing items' });
    await executeQuery('DELETE FROM uom WHERE id=$1', [id]);
    res.json({ message: 'UOM deleted' });
  } catch (err) {
    logger.error('deleteUom:', err.message);
    res.status(500).json({ error: 'Failed to delete UOM' });
  }
};

module.exports = {
  getCategories, createCategory, updateCategory, deleteCategory,
  getSubcategories, createSubcategory, updateSubcategory, deleteSubcategory,
  getTypes, createType, updateType, deleteType,
  getCurrencies, createCurrency, updateCurrency, deleteCurrency,
  getHsnCodes, createHsnCode, updateHsnCode, deleteHsnCode,
  getUom, createUom, updateUom, deleteUom,
};
