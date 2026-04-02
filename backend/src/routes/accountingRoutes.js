const express = require('express');
const router = express.Router();
const ledgerController = require('../controllers/ledgerController');
const transactionController = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/auth');

/**
 * Ledger Account Routes
 */
router.get('/accounts', authenticateToken, ledgerController.getLedgerAccounts);
router.get('/accounts/:id', authenticateToken, ledgerController.getLedgerAccountById);
router.post('/accounts', authenticateToken, ledgerController.createLedgerAccount);
router.put('/accounts/:id', authenticateToken, ledgerController.updateLedgerAccount);

/**
 * Journal Entry Routes
 */
router.get('/journal', authenticateToken, ledgerController.getJournalEntries);
router.post('/journal', authenticateToken, ledgerController.createJournalEntry);

/**
 * Financial Report Routes
 */
router.get('/trial-balance', authenticateToken, ledgerController.getTrialBalance);
router.get('/income-statement', authenticateToken, ledgerController.getIncomeStatement);

/**
 * Customer Routes
 */
router.get('/customers', authenticateToken, transactionController.getCustomerList);
router.get('/customers/:id', authenticateToken, transactionController.getCustomerById);
router.post('/customers', authenticateToken, transactionController.addCustomer);

/**
 * Supplier Routes
 */
router.get('/suppliers', authenticateToken, transactionController.getSupplierList);
router.post('/suppliers', authenticateToken, transactionController.addSupplier);

/**
 * Invoice Routes
 */
router.get('/invoices', authenticateToken, transactionController.getInvoiceRecords);
router.post('/invoices', authenticateToken, transactionController.createInvoice);

module.exports = router;
