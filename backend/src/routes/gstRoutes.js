const express = require('express');
const router = express.Router();
const c = require('../controllers/gstController');
const { authenticateToken } = require('../middleware/auth');

router.get('/verify/:gst_number', authenticateToken, c.verifyGst);
router.get('/history', authenticateToken, c.getGstFetchHistory);

module.exports = router;
