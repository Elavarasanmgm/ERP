const sql = require('mssql');
const logger = require('../utils/logger');

const getEnv = (name, fallback = '') => (process.env[name] || fallback).trim();

const parseServerConfig = () => {
  const rawServer = getEnv('DB_SERVER');
  const [serverHost, serverPort] = rawServer.split(',');

  return {
    server: serverHost || rawServer,
    port: parseInt(serverPort || getEnv('DB_PORT'), 10) || 1433,
  };
};

const serverConfig = parseServerConfig();

const config = {
  server: serverConfig.server,
  authentication: {
    type: 'default',
    options: {
      userName: getEnv('DB_USER'),
      password: getEnv('DB_PASSWORD'),
    },
  },
  options: {
    database: getEnv('DB_DATABASE'),
    port: serverConfig.port,
    encrypt: getEnv('DB_ENCRYPT') === 'true',
    trustServerCertificate: getEnv('DB_TRUST_CERT') === 'true',
    connectionTimeout: 30000,
    requestTimeout: 30000,
    enableKeepAlive: true,
  },
};

let pool = null;

async function getPool() {
  if (!pool) {
    try {
      pool = new sql.ConnectionPool(config);
      pool.on('error', (err) => {
        logger.error('Database pool error:', err);
      });
      await pool.connect();
      logger.info('Successfully connected to SQL Server');
    } catch (err) {
      logger.error('Failed to connect to SQL Server:', err);
      throw err;
    }
  }
  return pool;
}

async function executeQuery(query, params = {}) {
  try {
    const pool = await getPool();
    const request = pool.request();

    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }

    const result = await request.query(query);
    return result;
  } catch (err) {
    logger.error('Query execution error:', err);
    throw err;
  }
}

async function closePool() {
  if (pool) {
    await pool.close();
    pool = null;
    logger.info('Database pool closed');
  }
}

module.exports = {
  getPool,
  executeQuery,
  closePool,
  sql,
};
