const express = require('express');
const router = express.Router();
const c = require('../controllers/paymentsController');
const { authenticateToken } = require('../middleware/auth');

// Payments
router.get('/', authenticateToken, c.getPayments);
router.get('/outstanding/customers', authenticateToken, c.getCustomerOutstanding);
router.get('/reports/receivables', authenticateToken, c.getReceivablesAging);
router.get('/:id', authenticateToken, c.getPaymentById);
router.post('/', authenticateToken, c.createPayment);
router.put('/:id/post', authenticateToken, c.postPayment);
router.post('/:id/allocate', authenticateToken, c.allocatePayment);

module.exports = router;
