const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/auth');
const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

// Default permissions for new users
const DEFAULT_PERMISSIONS = {
  dashboard: true,
  accounting: { entries: false, accounts: false, invoices: false, payments: false, customers: false, suppliers: false, reports: false },
  inventory: { items: false, stock: false, locations: false, opening: false, movements: false },
  orders: { sales: false, purchase: false, requests: false, quotes: false, receipts: false, trace: false },
  manufacturing: { workorders: false, bom: false, planning: false, kanban: false, quality: false },
  hr: { employees: false, attendance: false, leaves: false, payroll: false },
  crm: { leads: false, opportunities: false, contacts: false, activities: false },
  assets: { list: false, depreciation: false, maintenance: false, reports: false },
  quality: { inspections: false, nonconformance: false, corrective: false, metrics: false },
  planning: { production: false, mrp: false, orders: false, capacity: false, forecasts: false },
  projects: { list: false, timesheets: false },
  supplychain: { vendors: false, requisitions: false, receipts: false, performance: false },
  master: { categories: false, subcategories: false, types: false, currencies: false, hsncodes: false, warehouses: false, useraccess: false }
};

const ADMIN_PERMISSIONS = {
  dashboard: true,
  accounting: { entries: true, accounts: true, invoices: true, payments: true, customers: true, suppliers: true, reports: true },
  inventory: { items: true, stock: true, locations: true, opening: true, movements: true },
  orders: { sales: true, purchase: true, requests: true, quotes: true, receipts: true, trace: true },
  manufacturing: { workorders: true, bom: true, planning: true, kanban: true, quality: true },
  hr: { employees: true, attendance: true, leaves: true, payroll: true },
  crm: { leads: true, opportunities: true, contacts: true, activities: true },
  assets: { list: true, depreciation: true, maintenance: true, reports: true },
  quality: { inspections: true, nonconformance: true, corrective: true, metrics: true },
  planning: { production: true, mrp: true, orders: true, capacity: true, forecasts: true },
  projects: { list: true, timesheets: true },
  supplychain: { vendors: true, requisitions: true, receipts: true, performance: true },
  master: { categories: true, subcategories: true, types: true, currencies: true, hsncodes: true, warehouses: true, useraccess: true }
};

// Deep merge stored permissions with defaults so no key is ever missing
const mergePermissions = (stored) => {
  // If stored is literally true, it means full access to everything
  if (stored === true) {
    return { ...ADMIN_PERMISSIONS };
  }
  
  if (!stored || typeof stored !== 'object') {
    return { ...DEFAULT_PERMISSIONS };
  }

  const merged = { ...DEFAULT_PERMISSIONS };
  for (const key of Object.keys(DEFAULT_PERMISSIONS)) {
    if (stored[key] === true) {
      // Full access to this specific module
      if (typeof DEFAULT_PERMISSIONS[key] === 'object' && DEFAULT_PERMISSIONS[key] !== null) {
        // Expand true to all subpages
        const allTrue = {};
        Object.keys(DEFAULT_PERMISSIONS[key]).forEach(sub => allTrue[sub] = true);
        merged[key] = allTrue;
      } else {
        merged[key] = true;
      }
    } else if (typeof DEFAULT_PERMISSIONS[key] === 'object' && DEFAULT_PERMISSIONS[key] !== null) {
      // Subpage-level merge
      merged[key] = {
        ...DEFAULT_PERMISSIONS[key],
        ...(typeof stored[key] === 'object' && stored[key] !== null ? stored[key] : {})
      };
    } else if (key in stored) {
      merged[key] = !!stored[key];
    }
  }
  return merged;
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const result = await executeQuery(
      'SELECT userid, email, passwordhash, role, permissions, isactive, firstname, lastname FROM users WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) {
      logger.warn(`Login failed for: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    if (!user.isactive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const isValid = await bcrypt.compare(password, user.passwordhash);
    if (!isValid) {
      logger.warn(`Invalid password for: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Resolve permissions: merge stored with defaults so all keys are present
    const permissions = mergePermissions(user.permissions);

    const token = generateToken(user.userid, user.email, user.role);
    logger.info(`User logged in: ${email}`);
    res.json({
      message: 'Login successful',
      token,
      user: {
        userId: user.userid,
        email: user.email,
        firstName: user.firstname,
        lastName: user.lastname,
        role: user.role,
        permissions
      },
    });
  } catch (err) {
    logger.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
};

const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password || !firstName || !lastName) return res.status(400).json({ error: 'All fields are required' });

    const existing = await executeQuery('SELECT userid FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const insertResult = await executeQuery(
      `INSERT INTO users (email, passwordhash, firstname, lastname, role, permissions, createddate)
       VALUES ($1,$2,$3,$4,'User',$5,NOW()) RETURNING userid`,
      [email, passwordHash, firstName, lastName, JSON.stringify(DEFAULT_PERMISSIONS)]
    );
    const newUserId = insertResult.rows[0].userid;
    logger.info(`New user registered: ${email}`);
    res.status(201).json({ message: 'Registration successful', userId: newUserId });
  } catch (err) {
    logger.error('Registration error:', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await executeQuery(
      'SELECT userid, email, firstname, lastname, role, permissions, isactive, createddate FROM users WHERE userid = $1',
      [userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = result.rows[0];
    user.permissions = mergePermissions(user.permissions);
    res.json(user);
  } catch (err) {
    logger.error('getProfile error:', err.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

const getUsers = async (req, res) => {
  try {
    const result = await executeQuery(
      'SELECT userid, email, firstname, lastname, role, permissions, isactive, createddate FROM users ORDER BY createddate DESC'
    );
    const rows = result.rows.map(u => ({ ...u, permissions: mergePermissions(u.permissions) }));
    res.json(rows);
  } catch (err) {
    logger.error('getUsers error:', err.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, isactive, permissions } = req.body;

    // Merge incoming permissions with defaults to ensure all keys present
    const merged = mergePermissions(permissions);

    await executeQuery(
      'UPDATE users SET role = $1, isactive = $2, permissions = $3, updateddate = NOW() WHERE userid = $4',
      [role, isactive ?? true, JSON.stringify(merged), id]
    );
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    logger.error('updateUserRole error:', err.message);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

module.exports = { login, register, getProfile, getUsers, updateUserRole, ADMIN_PERMISSIONS, DEFAULT_PERMISSIONS };
