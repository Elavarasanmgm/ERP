const express = require('express');
const planningController = require('../controllers/planningController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(authenticateToken);

// Demand Forecasts
router.get('/forecasts', planningController.getDemandForecasts);
router.post('/forecasts', planningController.createDemandForecast);

// Production Plans
router.get('/production-plans', planningController.getProductionPlans);
router.post('/production-plans', planningController.createProductionPlan);
router.post('/production-plans/:id/release', planningController.releaseProductionPlan);

// MRP
router.get('/mrp-runs', planningController.getMRPRuns);
router.post('/mrp-runs', planningController.executeMRP);

// Planned Orders
router.get('/planned-orders', planningController.getPlannedOrders);

// BOM Explosion
router.get('/bom/:bomId/explode', planningController.explodeBOM);

// Capacity Planning
router.get('/capacity', planningController.getCapacityPlan);

module.exports = router;
