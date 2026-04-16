const express = require('express');
const router = express.Router();
const c = require('../controllers/accountingController');
const tx = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/auth');

// Chart of Accounts
router.get('/accounts/tree', authenticateToken, c.getAccountsTree);
router.get('/accounts', authenticateToken, c.getAccounts);
router.post('/accounts', authenticateToken, c.createAccount);

// Ledger
router.get('/ledger/:account_id', authenticateToken, c.getLedger);

// Tax Master
router.get('/taxes', authenticateToken, c.getTaxes);
router.post('/taxes', authenticateToken, c.createTax);
router.put('/taxes/:id', authenticateToken, c.updateTax);

// Financial Periods
router.get('/periods', authenticateToken, c.getFinancialPeriods);
router.post('/periods', authenticateToken, c.createFinancialPeriod);
router.put('/periods/:id/close', authenticateToken, c.closePeriod);

// Journal Entries
router.get('/journal', authenticateToken, c.getJournals);
router.get('/journal/pending', authenticateToken, c.getPendingJournals);
router.get('/journal/:id', authenticateToken, c.getJournalById);
router.post('/journal', authenticateToken, c.createJournal);
router.put('/journal/:id/submit', authenticateToken, c.submitJournal);
router.put('/journal/:id/verify', authenticateToken, c.verifyJournal);
router.put('/journal/:id/post', authenticateToken, c.postJournal);
router.post('/journal/:id/reverse', authenticateToken, c.reverseJournal);

// GST Report
router.get('/gst-report', authenticateToken, c.getGstReport);

// Financial Reports
router.get('/trial-balance', authenticateToken, c.getTrialBalance);
router.get('/income-statement', authenticateToken, c.getIncomeStatement);

// Customers
router.get('/customers', authenticateToken, tx.getCustomerList);
router.get('/customers/:id', authenticateToken, tx.getCustomerById);
router.post('/customers', authenticateToken, tx.addCustomer);
router.put('/customers/:id', authenticateToken, tx.updateCustomer);

// Suppliers
router.get('/suppliers', authenticateToken, tx.getSupplierList);
router.get('/suppliers/:id', authenticateToken, tx.getSupplierById);
router.post('/suppliers', authenticateToken, tx.addSupplier);
router.put('/suppliers/:id', authenticateToken, tx.updateSupplier);

// Invoices
router.get('/invoices', authenticateToken, tx.getInvoiceRecords);
router.get('/invoices/pending', authenticateToken, tx.getPendingInvoices);
router.post('/invoices', authenticateToken, tx.createInvoice);

module.exports = router;
