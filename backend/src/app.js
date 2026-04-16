require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const accountingRoutes = require('./routes/accountingRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const ordersRoutes = require('./routes/ordersRoutes');
const manufacturingRoutes = require('./routes/manufacturingRoutes');
const projectsRoutes = require('./routes/projectsRoutes');
const hrRoutes = require('./routes/hrRoutes');
const crmRoutes = require('./routes/crmRoutes');
const assetsRoutes = require('./routes/assetsRoutes');
const supplyChainRoutes = require('./routes/supplyChainRoutes');
const qualityRoutes = require('./routes/qualityRoutes');
const planningRoutes = require('./routes/planningRoutes');
// New routes
const masterRoutes = require('./routes/masterRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const gstRoutes = require('./routes/gstRoutes');
const salesRoutes = require('./routes/salesRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const paymentsRoutes = require('./routes/paymentsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const { executeQuery } = require('./config/database');

const app = express();
const frontendDistDir = path.join(__dirname, '../../frontend/dist');

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for now to find source of default-src 'none' error
}));
app.use(cors({
  origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').trim(),
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API root endpoint
app.get('/api', (req, res) => {
  res.send('ERP API is running. Go to http://localhost:3000 for the frontend UI.');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/manufacturing', manufacturingRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/supply-chain', supplyChainRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/planning', planningRoutes);
// New routes
app.use('/api/master', masterRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/gst', gstRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/diagnostics/db', async (req, res) => {
  try {
    const result = await executeQuery('SELECT userid, email FROM users ORDER BY userid LIMIT 1');

    return res.json({
      ok: true,
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      sample: result.rows[0] || null,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      error: {
        message: err.message,
        code: err.code || null,
      },
    });
  }
});

// Static frontend for production/serverless deploys
app.use(express.static(frontendDistDir));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }

  return res.sendFile(path.join(frontendDistDir, 'index.html'));
});

// 404 handler for unresolved API routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received - closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });
}

module.exports = app;
