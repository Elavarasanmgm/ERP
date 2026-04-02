const express = require('express');
const assetsController = require('../controllers/assetsController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(authenticateToken);

// Assets
router.get('/assets', assetsController.getAssets);
router.get('/assets/:id', assetsController.getAssetById);
router.post('/assets', assetsController.registerAsset);

// Depreciation
router.get('/depreciation/:assetId', assetsController.calculateDepreciation);
router.post('/depreciation', assetsController.postDepreciationEntry);

// Maintenance
router.get('/maintenance', assetsController.getMaintenanceRecords);
router.post('/maintenance', assetsController.logMaintenance);

// Reports
router.get('/reports/assets', assetsController.getAssetReport);

module.exports = router;
