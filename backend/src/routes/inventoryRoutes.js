const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticateToken } = require('../middleware/auth');

/**
 * Warehouse Routes
 */
router.get('/warehouses', authenticateToken, inventoryController.getWarehouses);

/**
 * Item Routes
 */
router.get('/items', authenticateToken, inventoryController.getItems);
router.get('/items/:id', authenticateToken, inventoryController.getItemById);
router.post('/items', authenticateToken, inventoryController.createItem);

/**
 * Stock Routes
 */
router.get('/stock', authenticateToken, inventoryController.getStockLevels);
router.put('/stock/adjust', authenticateToken, inventoryController.adjustStock);

/**
 * Inventory Report Routes
 */
router.get('/reports/inventory', authenticateToken, inventoryController.getInventoryReport);

module.exports = router;
