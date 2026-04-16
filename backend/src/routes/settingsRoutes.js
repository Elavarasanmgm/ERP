const express = require('express');
const router = express.Router();
const c = require('../controllers/settingsController');
const { authenticateToken } = require('../middleware/auth');

// Company Settings
router.get('/company', authenticateToken, c.getCompanySettings);
router.put('/company', authenticateToken, c.upsertCompanySettings);

// Number Sequences
router.get('/sequences', authenticateToken, c.getSequences);
router.get('/sequences/:document_type/next', authenticateToken, c.getNextNumber);
router.put('/sequences/:id', authenticateToken, c.updateSequence);

// Email Settings
router.get('/email', authenticateToken, c.getEmailSettings);
router.put('/email', authenticateToken, c.upsertEmailSettings);
router.post('/email/test-connection', authenticateToken, c.testEmailConnection);

module.exports = router;
