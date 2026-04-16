const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const { respondWithFallback, respondFeatureUnavailable } = require('../utils/schemaFallback');

// ── INSPECTIONS (quality_checks) ───────────────────────
async function getInspections(req, res) {
  try {
    const result = await executeQuery(
      `SELECT qc.id AS "InspectionID", qc.qc_number AS "InspectionNumber",
              'Incoming' AS "InspectionType", qc.check_date AS "InspectionDate",
              qc.total_qty AS "QuantitySampled", qc.passed_qty AS "QuantityAccepted",
              qc.failed_qty AS "QuantityRejected", qc.status AS "Status",
              qc.remarks AS "Remarks", i.itemname AS "ItemName", qc.item_id AS "ItemID"
       FROM quality_checks qc
       LEFT JOIN items i ON i.itemid = qc.item_id
       ORDER BY qc.check_date DESC`
    );
    res.json(result.rows);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching inspections', error, []);
  }
}

async function getInspectionById(req, res) {
  try {
    const result = await executeQuery(
      `SELECT qc.id AS "InspectionID", qc.qc_number AS "InspectionNumber",
              'Incoming' AS "InspectionType", qc.check_date AS "InspectionDate",
              qc.total_qty AS "QuantitySampled", qc.passed_qty AS "QuantityAccepted",
              qc.failed_qty AS "QuantityRejected", qc.status AS "Status",
              qc.remarks AS "Remarks", qc.item_id AS "ItemID", i.itemname AS "ItemName"
       FROM quality_checks qc
       LEFT JOIN items i ON i.itemid = qc.item_id
       WHERE qc.id = $1`, [parseInt(req.params.id)]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Inspection not found' });
    res.json(result.rows[0]);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching inspection', error, null);
  }
}

async function createInspection(req, res) {
  try {
    const { itemId, inspectionDate, quantitySampled, quantityAccepted, quantityRejected, remarks } = req.body;
    if (!itemId || !inspectionDate) return res.status(400).json({ error: 'itemId and inspectionDate are required' });

    const passed = Number(quantityAccepted) >= Number(quantitySampled) * 0.95 ? 'Passed' : 'Failed';
    const qcNumber = `QC-${Date.now()}`;

    const result = await executeQuery(
      `INSERT INTO quality_checks (qc_number, item_id, check_date, total_qty, passed_qty, failed_qty, status, remarks)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [qcNumber, itemId, inspectionDate, quantitySampled||0, quantityAccepted||0, quantityRejected||0, passed, remarks||null]
    );
    res.status(201).json({ id: result.rows[0].id, message: 'Inspection created', status: passed });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Creating inspection', error);
  }
}

async function updateInspection(req, res) {
  try {
    const { id } = req.params;
    const { inspectionDate, quantitySampled, quantityAccepted, quantityRejected, remarks } = req.body;
    const status = Number(quantityAccepted) >= Number(quantitySampled) * 0.95 ? 'Passed' : 'Failed';
    await executeQuery(
      `UPDATE quality_checks SET check_date=$1, total_qty=$2, passed_qty=$3, failed_qty=$4, status=$5, remarks=$6 WHERE id=$7`,
      [inspectionDate, quantitySampled, quantityAccepted, quantityRejected, status, remarks||null, parseInt(id)]
    );
    res.json({ message: 'Inspection updated', status });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Updating inspection', error);
  }
}

// ── NON CONFORMANCES ───────────────────────────────────
async function getNonConformances(req, res) {
  try {
    const result = await executeQuery(
      `SELECT nc.id AS "NonConformanceID", nc.nc_number AS "NCNumber",
              nc.type AS "NonConformanceType", nc.reported_date AS "ReportedDate",
              nc.severity AS "Severity", nc.description AS "Description",
              nc.status AS "Status", nc.due_date AS "DueDate",
              i.itemname AS "ItemName"
       FROM non_conformances nc
       LEFT JOIN items i ON i.itemid = nc.item_id
       ORDER BY nc.reported_date DESC`
    );
    res.json(result.rows);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching non-conformances', error, []);
  }
}

async function createNonConformance(req, res) {
  try {
    const { nonConformanceType, itemId, reportedDate, severity, description, dueDate } = req.body;
    if (!reportedDate) return res.status(400).json({ error: 'reportedDate is required' });

    const ncNumber = `NC-${Date.now()}`;
    const result = await executeQuery(
      `INSERT INTO non_conformances (nc_number, type, item_id, reported_date, severity, description, status, due_date)
       VALUES ($1,$2,$3,$4,$5,$6,'Open',$7) RETURNING id`,
      [ncNumber, nonConformanceType || null, itemId || null, reportedDate, severity || 'Medium', description || null, dueDate || null]
    );
    res.status(201).json({ id: result.rows[0].id, message: 'Non-conformance report created' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Creating non-conformance', error);
  }
}

// ── CORRECTIVE ACTIONS ─────────────────────────────────
async function getCorrectiveActions(req, res) {
  try {
    const result = await executeQuery(
      `SELECT ca.id AS "ActionID", ca.action_number AS "ActionNumber",
              ca.nc_id AS "NCID", nc.nc_number AS "NCNumber",
              ca.action_description AS "ActionDescription",
              ca.assigned_to AS "AssignedTo", ca.due_date AS "DueDate",
              ca.status AS "Status", ca.effectiveness_check AS "EffectivenessCheck"
       FROM corrective_actions ca
       LEFT JOIN non_conformances nc ON nc.id = ca.nc_id
       ORDER BY ca.due_date`
    );
    res.json(result.rows);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching corrective actions', error, []);
  }
}

async function createCorrectiveAction(req, res) {
  try {
    const { ncId, actionDescription, assignedTo, dueDate } = req.body;
    if (!actionDescription) return res.status(400).json({ error: 'actionDescription is required' });

    const actionNumber = `CA-${Date.now()}`;
    const result = await executeQuery(
      `INSERT INTO corrective_actions (action_number, nc_id, action_description, assigned_to, due_date, status)
       VALUES ($1,$2,$3,$4,$5,'Open') RETURNING id`,
      [actionNumber, ncId || null, actionDescription, assignedTo || null, dueDate || null]
    );
    res.status(201).json({ id: result.rows[0].id, message: 'Corrective action created' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Creating corrective action', error);
  }
}

async function updateCorrectiveAction(req, res) {
  try {
    const { id } = req.params;
    const { actionDescription, assignedTo, dueDate, status } = req.body;
    await executeQuery(
      `UPDATE corrective_actions SET action_description=$1, assigned_to=$2, due_date=$3, status=$4 WHERE id=$5`,
      [actionDescription, assignedTo || null, dueDate || null, status || 'Open', parseInt(id)]
    );
    res.json({ message: 'Corrective action updated' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Updating corrective action', error);
  }
}

async function getQualityMetrics(req, res) {
  try {
    const result = await executeQuery(
      `SELECT
         COUNT(*) AS "TotalInspections",
         SUM(CASE WHEN status='Passed' THEN 1 ELSE 0 END) AS "PassedInspections",
         ROUND(AVG(CAST(passed_qty AS FLOAT) / NULLIF(CAST(total_qty AS FLOAT),0) * 100)::numeric, 1) AS "AcceptanceRate"
       FROM quality_checks`
    );
    const nc = await executeQuery(`SELECT COUNT(*) AS total_nc FROM non_conformances`);
    res.json({ ...result.rows[0], TotalNonConformances: nc.rows[0].total_nc });
  } catch (error) {
    return respondWithFallback(res, logger, 'Quality metrics', error, {});
  }
}

module.exports = {
  getInspections, getInspectionById, createInspection, updateInspection,
  getNonConformances, createNonConformance,
  getCorrectiveActions, createCorrectiveAction, updateCorrectiveAction,
  getQualityMetrics,
};
