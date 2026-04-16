const express = require('express');
const router = express.Router();
const c = require('../controllers/inventoryController');
const { authenticateToken } = require('../middleware/auth');

// Warehouses
router.get('/warehouses', authenticateToken, c.getWarehouses);
router.post('/warehouses', authenticateToken, c.createWarehouse);
router.put('/warehouses/:id', authenticateToken, c.updateWarehouse);
router.delete('/warehouses/:id', authenticateToken, c.deleteWarehouse);

// Items
router.get('/items/next-number', authenticateToken, c.getNextItemNumber);
router.get('/items', authenticateToken, c.getItems);
router.get('/items/:id', authenticateToken, c.getItemById);
router.post('/items', authenticateToken, c.createItem);
router.put('/items/:id', authenticateToken, c.updateItem);

// Stock
router.get('/stock', authenticateToken, c.getStockLevels);
router.put('/stock/adjust', authenticateToken, c.adjustStock);

// Stock Locations (Rack/Row/Bin)
router.get('/locations', authenticateToken, c.getLocations);
router.post('/locations', authenticateToken, c.createLocation);
router.put('/locations/:id', authenticateToken, c.updateLocation);
router.delete('/locations/:id', authenticateToken, c.deleteLocation);

// Opening Stock
router.get('/opening-stock', authenticateToken, c.getOpeningStock);
router.post('/opening-stock', authenticateToken, c.postOpeningStock);
router.post('/opening-stock/post', authenticateToken, c.postOpeningStockFinal);

// Stock Movements
router.get('/movements', authenticateToken, c.getStockMovements);

// Reports
router.get('/reports/inventory', authenticateToken, c.getInventoryReport);
router.get('/reports/high-value', authenticateToken, c.getHighValueStock);

module.exports = router;
