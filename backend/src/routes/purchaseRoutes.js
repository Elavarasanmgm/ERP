const express = require('express');
const router = express.Router();
const c = require('../controllers/purchaseController');
const { authenticateToken } = require('../middleware/auth');

// Material Requests
router.get('/material-requests', authenticateToken, c.getMaterialRequests);
router.get('/material-requests/:id', authenticateToken, c.getMaterialRequestById);
router.post('/material-requests', authenticateToken, c.createMaterialRequest);
router.put('/material-requests/:id/approve', authenticateToken, c.approveMaterialRequest);

// Supplier Quotations
router.get('/quotations', authenticateToken, c.getQuotations);
router.get('/quotations/compare/:mr_id', authenticateToken, c.compareQuotations);
router.post('/quotations', authenticateToken, c.createQuotation);
router.put('/quotations/:id/select', authenticateToken, c.selectQuotation);

// Goods Receipts (GRN)
router.get('/grn', authenticateToken, c.getGRNList);
router.get('/grn/:id', authenticateToken, c.getGRNById);
router.post('/grn', authenticateToken, c.createGRN);
router.put('/grn/:id/post', authenticateToken, c.postGRN);

// Alias routes used by frontend
router.get('/goods-receipts', authenticateToken, c.getGRNList);
router.post('/goods-receipts', authenticateToken, c.createGRN);
router.get('/supplier-quotations', authenticateToken, c.getQuotations);
router.post('/supplier-quotations', authenticateToken, c.createQuotation);

module.exports = router;
