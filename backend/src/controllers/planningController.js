const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const { respondWithFallback, respondFeatureUnavailable } = require('../utils/schemaFallback');

// Planning & MRP Module

// Get demand forecasts
async function getDemandForecasts(req, res) {
  try {
    const result = await executeQuery(`
      SELECT ForecastID, (SELECT ItemName FROM Items WHERE ItemID = f.ItemID) as ItemName,
             ForecastPeriod, ForecastedQuantity, ConfidenceLevel, Notes
      FROM DemandForecasts f
      ORDER BY ForecastPeriod DESC
    `);
    logger.info(`[Planning] Retrieved ${result.recordset.length} forecasts`);
    res.json(result.recordset);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching forecasts', error, []);
  }
}

// Create demand forecast
async function createDemandForecast(req, res) {
  try {
    const { itemId, forecastPeriod, forecastedQuantity, confidenceLevel, notes } = req.body;
    
    if (!itemId || !forecastPeriod || !forecastedQuantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await executeQuery(`
      INSERT INTO DemandForecasts (ItemID, ForecastPeriod, ForecastedQuantity, ConfidenceLevel, Notes, CreatedDate)
      VALUES (${itemId}, '${forecastPeriod}', ${forecastedQuantity}, ${confidenceLevel || 80}, '${notes || ''}', GETDATE())
    `);
    
    logger.info(`[Planning] Created demand forecast for item ${itemId}`);
    res.status(201).json({ message: 'Demand forecast created' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Creating forecast', error);
  }
}

// Get production plans
async function getProductionPlans(req, res) {
  try {
    const result = await executeQuery(`
      SELECT PlanID, PlanNumber, PlanPeriod, (SELECT ItemName FROM Items WHERE ItemID = p.ItemID) as ItemName,
             PlannedQuantity, Status, StartDate, EndDate
      FROM ProductionPlans p
      ORDER BY StartDate DESC
    `);
    logger.info(`[Planning] Retrieved ${result.recordset.length} production plans`);
    res.json(result.recordset);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching production plans', error, []);
  }
}

// Create production plan
async function createProductionPlan(req, res) {
  try {
    const { itemId, planPeriod, plannedQuantity, startDate, endDate } = req.body;
    
    if (!itemId || !planPeriod || !plannedQuantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await executeQuery(`
      INSERT INTO ProductionPlans (PlanNumber, ItemID, PlanPeriod, PlannedQuantity, Status, StartDate, EndDate, CreatedDate)
      VALUES ('PP-${Date.now()}', ${itemId}, '${planPeriod}', ${plannedQuantity}, 'Draft', '${startDate}', '${endDate}', GETDATE())
    `);
    
    logger.info(`[Planning] Created production plan`);
    res.status(201).json({ message: 'Production plan created' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Creating production plan', error);
  }
}

// Get MRP runs
async function getMRPRuns(req, res) {
  try {
    const result = await executeQuery(`
      SELECT MRPRunID, MRPRunDate, PlanningPeriod, Status, TotalOrders, CreatedDate
      FROM MRPRuns
      ORDER BY MRPRunDate DESC
    `);
    logger.info(`[Planning] Retrieved MRP runs`);
    res.json(result.recordset);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching MRP runs', error, []);
  }
}

// Execute MRP
async function executeMRP(req, res) {
  try {
    const { planningPeriod } = req.body;
    
    if (!planningPeriod) {
      return res.status(400).json({ error: 'Missing planning period' });
    }

    const result = await executeQuery(`
      INSERT INTO MRPRuns (MRPRunDate, PlanningPeriod, Status, TotalOrders, CreatedDate)
      VALUES (GETDATE(), '${planningPeriod}', 'Running', 0, GETDATE());
      SELECT SCOPE_IDENTITY() as ID
    `);
    
    logger.info(`[Planning] MRP execution started`);
    res.status(201).json({ message: 'MRP execution started', runId: result.recordset[0].ID });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Executing MRP', error);
  }
}

// Get planned orders
async function getPlannedOrders(req, res) {
  try {
    const result = await executeQuery(`
      SELECT OrderID, OrderNumber, (SELECT ItemName FROM Items WHERE ItemID = p.ItemID) as ItemName,
             OrderQuantity, RequiredDate, PlannedStartDate, Status
      FROM PlannedOrders p
      ORDER BY RequiredDate
    `);
    logger.info(`[Planning] Retrieved planned orders`);
    res.json(result.recordset);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching planned orders', error, []);
  }
}

// Explode BOM for MRP
async function explodeBOM(req, res) {
  try {
    const { bomId } = req.params;
    const result = await executeQuery(`
      SELECT bd.ComponentItemID, (SELECT ItemName FROM Items WHERE ItemID = bd.ComponentItemID) as ComponentName,
             bd.Quantity, bd.UnitOfMeasure
      FROM BillOfMaterialDetails bd
      WHERE bd.BOMHeaderID = ${bomId}
    `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'BOM not found' });
    }
    
    logger.info(`[Planning] Exploded BOM ${bomId}`);
    res.json(result.recordset);
  } catch (error) {
    return respondWithFallback(res, logger, 'Exploding BOM', error, []);
  }
}

// Get capacity plan
async function getCapacityPlan(req, res) {
  try {
    const result = await executeQuery(`
      SELECT ResourceID, (SELECT ResourceName FROM Resources WHERE ResourceID = c.ResourceID) as ResourceName,
             PlannedCapacity, AvailableCapacity, UtilizationPercentage, StartDate, EndDate
      FROM CapacityPlans c
      ORDER BY StartDate
    `);
    logger.info(`[Planning] Retrieved capacity plans`);
    res.json(result.recordset);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching capacity plans', error, []);
  }
}

module.exports = {
  getDemandForecasts,
  createDemandForecast,
  getProductionPlans,
  createProductionPlan,
  getMRPRuns,
  executeMRP,
  getPlannedOrders,
  explodeBOM,
  getCapacityPlan
};
