const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');
const { authenticateToken } = require('../middleware/auth');

/**
 * Sales Order Routes
 */
router.get('/sales-orders', authenticateToken, ordersController.getSalesOrders);
router.get('/sales-orders/:id', authenticateToken, ordersController.getSalesOrderById);
router.post('/sales-orders', authenticateToken, ordersController.createSalesOrder);

/**
 * Purchase Order Routes
 */
router.get('/purchase-orders', authenticateToken, ordersController.getPurchaseOrders);
router.post('/purchase-orders', authenticateToken, ordersController.createPurchaseOrder);

module.exports = router;
