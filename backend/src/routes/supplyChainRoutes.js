const express = require('express');
const supplyChainController = require('../controllers/supplyChainController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(authenticateToken);

// Purchase Requisitions
router.get('/requisitions', supplyChainController.getPurchaseRequisitions);
router.post('/requisitions', supplyChainController.createPurchaseRequisition);

// Vendors
router.get('/vendors', supplyChainController.getVendors);
router.post('/vendors', supplyChainController.registerVendor);
router.put('/vendors/:id', supplyChainController.updateVendor);

// Goods Receipt
router.get('/goods-receipt', supplyChainController.getGoodsReceipt);
router.post('/goods-receipt', supplyChainController.postGoodsReceipt);

// Vendor Performance
router.get('/vendors/performance', supplyChainController.getVendorPerformance);

module.exports = router;
