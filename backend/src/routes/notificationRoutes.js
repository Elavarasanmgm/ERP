const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, notificationController.getNotifications);
router.put('/mark-all-read', authenticateToken, notificationController.markAllAsRead);
router.put('/:id/mark-read', authenticateToken, notificationController.markAsRead);
router.post('/generate-alerts', authenticateToken, notificationController.generateStockAlerts);

module.exports = router;
