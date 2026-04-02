const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const { respondWithFallback, respondFeatureUnavailable } = require('../utils/schemaFallback');

// Quality Management Module

// Get inspections
async function getInspections(req, res) {
  try {
    const result = await executeQuery(`
      SELECT InspectionID, InspectionNumber, InspectionType, InspectionDate, 
             (SELECT ItemName FROM Items WHERE ItemID = i.ItemID) as ItemName,
             QuantitySampled, QuantityAccepted, QuantityRejected, Status
      FROM QualityInspections i
      ORDER BY InspectionDate DESC
    `);
    logger.info(`[Quality] Retrieved ${result.recordset.length} inspections`);
    res.json(result.recordset);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching inspections', error, []);
  }
}

// Get inspection by ID
async function getInspectionById(req, res) {
  try {
    const { id } = req.params;
    const result = await executeQuery(`
      SELECT InspectionID, InspectionNumber, InspectionType, InspectionDate, ItemID,
             QuantitySampled, QuantityAccepted, QuantityRejected, Status, Remarks
      FROM QualityInspections
      WHERE InspectionID = ${id}
    `);
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Inspection not found' });
    }
    res.json(result.recordset[0]);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching inspection', error, null);
  }
}

// Create inspection
async function createInspection(req, res) {
  try {
    const { inspectionType, itemId, inspectionDate, quantitySampled, quantityAccepted, quantityRejected, remarks } = req.body;
    
    if (!inspectionType || !itemId || !inspectionDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const passed = quantityAccepted >= (quantitySampled * 0.95) ? 'Passed' : 'Failed';

    await executeQuery(`
      INSERT INTO QualityInspections (InspectionNumber, InspectionType, ItemID, InspectionDate, 
                                      QuantitySampled, QuantityAccepted, QuantityRejected, Status, Remarks, CreatedDate)
      VALUES ('QI-${Date.now()}', '${inspectionType}', ${itemId}, '${inspectionDate}', 
              ${quantitySampled}, ${quantityAccepted}, ${quantityRejected}, '${passed}', '${remarks || ''}', GETDATE())
    `);
    
    logger.info(`[Quality] Created inspection: ${inspectionType}`);
    res.status(201).json({ message: 'Inspection created successfully', status: passed });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Creating inspection', error);
  }
}

// Get non-conformances
async function getNonConformances(req, res) {
  try {
    const result = await executeQuery(`
      SELECT NonConformanceID, NCNumber, NonConformanceType, (SELECT ItemName FROM Items WHERE ItemID = n.ItemID) as ItemName,
             ReportedDate, Severity, Description, Status, DueDate
      FROM NonConformances n
      ORDER BY ReportedDate DESC
    `);
    logger.info(`[Quality] Retrieved non-conformances`);
    res.json(result.recordset);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching non-conformances', error, []);
  }
}

// Create non-conformance
async function createNonConformance(req, res) {
  try {
    const { nonConformanceType, itemId, reportedDate, severity, description, dueDate } = req.body;
    
    if (!nonConformanceType || !itemId || !reportedDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await executeQuery(`
      INSERT INTO NonConformances (NCNumber, NonConformanceType, ItemID, ReportedDate, Severity, 
                                   Description, Status, DueDate, CreatedDate)
      VALUES ('NC-${Date.now()}', '${nonConformanceType}', ${itemId}, '${reportedDate}', '${severity}', 
              '${description}', 'Open', '${dueDate}', GETDATE())
    `);
    
    logger.info(`[Quality] Created non-conformance`);
    res.status(201).json({ message: 'Non-conformance report created' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Creating non-conformance', error);
  }
}

// Get corrective actions
async function getCorrectiveActions(req, res) {
  try {
    const result = await executeQuery(`
      SELECT ActionID, ActionNumber, NonConformanceID, ActionDescription, AssignedTo, 
             DueDate, Status, EffectivenessCheck
      FROM CorrectiveActions
      ORDER BY DueDate
    `);
    logger.info(`[Quality] Retrieved corrective actions`);
    res.json(result.recordset);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching corrective actions', error, []);
  }
}

// Create corrective action
async function createCorrectiveAction(req, res) {
  try {
    const { nonConformanceId, actionDescription, assignedTo, dueDate } = req.body;
    
    if (!nonConformanceId || !actionDescription) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await executeQuery(`
      INSERT INTO CorrectiveActions (ActionNumber, NonConformanceID, ActionDescription, AssignedTo, 
                                     DueDate, Status, CreatedDate)
      VALUES ('CA-${Date.now()}', ${nonConformanceId}, '${actionDescription}', '${assignedTo}', 
              '${dueDate}', 'Open', GETDATE())
    `);
    
    logger.info(`[Quality] Created corrective action`);
    res.status(201).json({ message: 'Corrective action created' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Creating corrective action', error);
  }
}

// Get quality metrics
async function getQualityMetrics(req, res) {
  try {
    const result = await executeQuery(`
      SELECT 
        COUNT(DISTINCT InspectionID) as TotalInspections,
        SUM(CASE WHEN Status = 'Passed' THEN 1 ELSE 0 END) as PassedInspections,
        COUNT(DISTINCT NCNumber) as TotalNonConformances,
        AVG(CAST(QuantityAccepted AS FLOAT) / CAST(QuantitySampled AS FLOAT) * 100) as AcceptanceRate
      FROM QualityInspections
    `);
    logger.info(`[Quality] Generated quality metrics`);
    res.json(result.recordset[0]);
  } catch (error) {
    return respondWithFallback(
      res,
      logger,
      'Generating quality metrics',
      error,
      { TotalInspections: 0, PassedInspections: 0, TotalNonConformances: 0, AcceptanceRate: 0 }
    );
  }
}

module.exports = {
  getInspections,
  getInspectionById,
  createInspection,
  getNonConformances,
  createNonConformance,
  getCorrectiveActions,
  createCorrectiveAction,
  getQualityMetrics
};
