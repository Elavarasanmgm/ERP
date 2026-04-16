const { Pool } = require('pg');
const logger = require('../utils/logger');

const getEnv = (name, fallback = '') => (process.env[name] || fallback).trim();

const pool = new Pool({
  host:     getEnv('DB_HOST', 'localhost'),
  port:     parseInt(getEnv('DB_PORT', '5434'), 10),
  database: getEnv('DB_DATABASE', 'ERPSolution'),
  user:     getEnv('DB_USER', 'erp_user'),
  password: getEnv('DB_PASSWORD', 'erp_password'),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error('Database pool error:', err);
});

async function getPool() {
  return pool;
}

/**
 * Execute a parameterised query.
 * Accepts params as either:
 *   - an array  → passed directly as positional $1, $2, …
 *   - an object → named @paramName style (MSSQL compat) converted to $N positional
 *
 * Named param rules:
 *   - Each unique @name gets one $N slot (first occurrence order).
 *   - Repeated @name in the query reuses the same $N.
 *
 * Returns { rows, rowCount } — mirrors the pg Result shape.
 */
async function executeQuery(query, params = []) {
  try {
    let finalQuery = query;
    let values;

    if (!Array.isArray(params) && typeof params === 'object' && params !== null) {
      // Convert named @params → positional $N
      const nameToIndex = {};
      let counter = 0;
      finalQuery = query.replace(/@([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
        if (!(name in nameToIndex)) {
          nameToIndex[name] = ++counter;
        }
        return `$${nameToIndex[name]}`;
      });
      // Build values array in the order names were first seen
      values = Object.fromEntries(
        Object.entries(nameToIndex).map(([name, idx]) => [idx - 1, params[name]])
      );
      values = Array.from({ length: counter }, (_, i) => values[i]);
    } else {
      values = params;
    }

    const result = await pool.query(finalQuery, values);
    return result;
  } catch (err) {
    logger.error('Query execution error:', err);
    throw err;
  }
}

async function closePool() {
  await pool.end();
  logger.info('Database pool closed');
}

module.exports = {
  getPool,
  executeQuery,
  closePool,
  pool,
};
