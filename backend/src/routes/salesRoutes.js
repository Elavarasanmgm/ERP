const express = require('express');
const router = express.Router();
const c = require('../controllers/salesController');
const tx = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/auth');

// Proforma Invoices
router.get('/proforma', authenticateToken, c.getProformaList);
router.get('/proforma/:id', authenticateToken, c.getProformaById);
router.post('/proforma', authenticateToken, c.createProforma);
router.put('/proforma/:id/send', authenticateToken, c.sendProforma);
router.post('/proforma/:id/convert-to-invoice', authenticateToken, c.convertProformaToInvoice);

// Sales Quotations
router.get('/quotes', authenticateToken, c.getSalesQuotes);
router.post('/quotes', authenticateToken, c.createSalesQuote);

// Advance Payments
router.get('/advance-payments', authenticateToken, c.getAdvancePayments);
router.post('/advance-payments', authenticateToken, c.createAdvancePayment);

// Outstanding
router.get('/reports/outstanding', authenticateToken, c.getOutstandingByCustomer);

// Packing Lists
router.get('/packing-lists', authenticateToken, c.getPackingLists);
router.post('/packing-lists', authenticateToken, c.createPackingList);

// Sales Invoices (via transaction controller)
router.post('/invoices', authenticateToken, tx.createInvoice);
router.put('/invoices/:id/post', authenticateToken, tx.postInvoice);

module.exports = router;
