const express = require('express');
const qualityController = require('../controllers/qualityController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(authenticateToken);

// Inspections
router.get('/inspections', qualityController.getInspections);
router.get('/inspections/:id', qualityController.getInspectionById);
router.post('/inspections', qualityController.createInspection);

// Non-conformances
router.get('/non-conformances', qualityController.getNonConformances);
router.post('/non-conformances', qualityController.createNonConformance);

// Corrective Actions
router.get('/corrective-actions', qualityController.getCorrectiveActions);
router.post('/corrective-actions', qualityController.createCorrectiveAction);

// Quality Metrics
router.get('/metrics', qualityController.getQualityMetrics);

module.exports = router;
