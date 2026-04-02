const express = require('express');
const router = express.Router();
const manufacturingController = require('../controllers/manufacturingController');
const { authenticateToken } = require('../middleware/auth');

/**
 * Bill of Materials Routes
 */
router.get('/boms', authenticateToken, manufacturingController.getBoMs);
router.get('/boms/:id', authenticateToken, manufacturingController.getBOMById);
router.post('/boms', authenticateToken, manufacturingController.createBOM);

/**
 * Work Order Routes
 */
router.get('/work-orders', authenticateToken, manufacturingController.getWorkOrders);
router.post('/work-orders', authenticateToken, manufacturingController.createWorkOrder);

module.exports = router;
