const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');
const { authenticateToken } = require('../middleware/auth');

/**
 * Sales Order Routes
 */
router.get('/sales', authenticateToken, ordersController.getSalesOrders);
router.get('/sales-orders', authenticateToken, ordersController.getSalesOrders);
router.get('/sales-orders/:id', authenticateToken, ordersController.getSalesOrderById);
router.post('/sales-orders', authenticateToken, ordersController.createSalesOrder);
router.put('/sales-orders/:id/confirm', authenticateToken, ordersController.confirmSalesOrder);

/**
 * Purchase Order Routes
 */
router.get('/purchase-orders', authenticateToken, ordersController.getPurchaseOrders);
router.post('/purchase-orders', authenticateToken, ordersController.createPurchaseOrder);
router.put('/purchase-orders/:id/receive', authenticateToken, ordersController.receivePurchaseOrder);

/**
 * SO Traceability
 */
router.get('/so-traceability', authenticateToken, ordersController.getSOTraceability);

module.exports = router;
