const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');

router.post('/email', authenticateToken, reportController.emailReport);

module.exports = router;
