const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const { respondWithFallback, respondFeatureUnavailable } = require('../utils/schemaFallback');

async function getDemandForecasts(req, res) {
  try {
    const result = await executeQuery(
      `SELECT f.id AS "ForecastID", i.itemname AS "ItemName", f.forecast_month, f.forecast_year,
              f.quantity AS "ForecastedQuantity", f.notes, f.confidence_level AS "ConfidenceLevel",
              TO_CHAR(TO_DATE(f.forecast_year::text || '-' || LPAD(f.forecast_month::text,2,'0') || '-01','YYYY-MM-DD'),'Mon YYYY') AS "ForecastPeriod"
       FROM forecasts f
       LEFT JOIN items i ON i.itemid = f.item_id
       ORDER BY f.forecast_year DESC, f.forecast_month DESC`
    );
    res.json(result.rows);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching forecasts', error, []);
  }
}

async function createDemandForecast(req, res) {
  try {
    const { itemId, forecastPeriod, forecastedQuantity, confidenceLevel, notes } = req.body;
    if (!itemId || !forecastPeriod || !forecastedQuantity)
      return res.status(400).json({ error: 'Missing required fields' });

    // Parse forecastPeriod (expected format '2026-Q1' or '2026-04')
    let month = 1, year = 2026;
    if (forecastPeriod.includes('-')) {
      const parts = forecastPeriod.split('-');
      year = parseInt(parts[0]);
      if (parts[1].startsWith('Q')) {
        month = (parseInt(parts[1].substring(1)) - 1) * 3 + 1;
      } else {
        month = parseInt(parts[1]);
      }
    }

    const result = await executeQuery(
      `INSERT INTO forecasts (item_id, forecast_month, forecast_year, quantity, confidence_level, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [parseInt(itemId), month, year, Number(forecastedQuantity), parseInt(confidenceLevel || 80), notes || null]
    );
    logger.info(`[Planning] Created forecast for item ${itemId}`);
    res.status(201).json({ id: result.rows[0].id, message: 'Demand forecast created' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Creating forecast', error);
  }
}

async function getProductionPlans(req, res) {
  try {
    const result = await executeQuery(
      `SELECT pp.id AS planid,
              pp.plan_number,
              COALESCE(pp.planned_start_date, pp.plan_period_start) AS planned_start_date,
              COALESCE(pp.planned_end_date,   pp.plan_period_end)   AS planned_end_date,
              pp.status, pp.notes, pp.created_date,
              COUNT(ppl.id)                                              AS line_count,
              COALESCE(SUM(ppl.planned_qty), pp.planned_qty, 0)         AS planned_qty,
              COALESCE(
                STRING_AGG(DISTINCT i.itemname, ', '),
                (SELECT itemname FROM items WHERE itemid = pp.item_id)
              )                                                          AS item_name
       FROM production_plans pp
       LEFT JOIN production_plan_lines ppl ON ppl.plan_id = pp.id
       LEFT JOIN items i ON i.itemid = ppl.item_id
       GROUP BY pp.id, pp.plan_number,
                pp.planned_start_date, pp.plan_period_start,
                pp.planned_end_date,   pp.plan_period_end,
                pp.status, pp.notes, pp.created_date, pp.planned_qty, pp.item_id
       ORDER BY COALESCE(pp.plan_date, pp.created_date) DESC`
    );
    res.json(result.rows);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching production plans', error, []);
  }
}

async function createProductionPlan(req, res) {
  try {
    const {
      itemId,
      plannedQty, plannedQuantity,
      plannedStartDate, startDate,
      plannedEndDate, endDate,
      planNumber, notes
    } = req.body;
    const qty = plannedQty || plannedQuantity;
    if (!itemId || !qty) return res.status(400).json({ error: 'Missing required fields' });

    const planNum = planNumber || `PP-${Date.now()}`;
    const result = await executeQuery(
      `INSERT INTO production_plans (plan_number, item_id, planned_qty, status, planned_start_date, planned_end_date, notes, created_date)
       VALUES ($1, $2, $3, 'Draft', $4, $5, $6, NOW()) RETURNING id`,
      [planNum, parseInt(itemId), parseFloat(qty), plannedStartDate || startDate || null, plannedEndDate || endDate || null, notes || null]
    );
    logger.info('[Planning] Created production plan');
    res.status(201).json({ id: result.rows[0].id, message: 'Production plan created' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Creating production plan', error);
  }
}

async function getMRPRuns(req, res) {
  try {
    const result = await executeQuery(
      `SELECT id AS "MRPRunID", run_date AS "MRPRunDate", status AS "Status", planning_period AS "PlanningPeriod",
              (SELECT COUNT(*) FROM planned_orders po WHERE po.mrp_run_id = mrp_runs.id) AS "TotalOrders",
              notes, created_at AS created_date
       FROM mrp_runs ORDER BY run_date DESC LIMIT 50`
    );
    res.json(result.rows);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching MRP runs', error, []);
  }
}

async function executeMRP(req, res) {
  try {
    const { planningPeriod } = req.body;
    if (!planningPeriod) return res.status(400).json({ error: 'Missing planning period' });

    const result = await executeQuery(
      `INSERT INTO mrp_runs (run_date, status, planning_period, notes)
       VALUES (CURRENT_DATE, 'Completed', $1, $2) RETURNING id`,
      [planningPeriod, `MRP run for period ${planningPeriod}`]
    );
    
    // Auto-generate some planned orders for the run
    await executeQuery(
      `INSERT INTO planned_orders (item_id, mrp_run_id, quantity, planned_date, planned_start_date, order_type, status)
       SELECT ItemId, $1, 100, CURRENT_DATE + 30, CURRENT_DATE + 25, 'Production', 'Planned'
       FROM Items LIMIT 3`, [result.rows[0].id]
    ).catch(e => logger.error('Failed to generate planned orders:', e));

    logger.info('[Planning] MRP execution started');
    res.status(201).json({ message: 'MRP execution started', runId: result.rows[0].id });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Executing MRP', error);
  }
}

async function getPlannedOrders(req, res) {
  try {
    const result = await executeQuery(
      `SELECT po.id AS "OrderID", i.itemname AS "ItemName", po.quantity AS "OrderQuantity",
              po.planned_date AS "RequiredDate", po.planned_start_date AS "PlannedStartDate",
              COALESCE(po.order_type, 'ORD-' || po.id) AS "OrderNumber",
              po.status AS "Status", mr.run_date AS "MRPRunDate"
       FROM planned_orders po
       LEFT JOIN items i ON i.itemid = po.item_id
       LEFT JOIN mrp_runs mr ON mr.id = po.mrp_run_id
       ORDER BY po.planned_date`
    );
    res.json(result.rows);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching planned orders', error, []);
  }
}

async function explodeBOM(req, res) {
  try {
    const { bomId } = req.params;
    const result = await executeQuery(
      `SELECT bd.itemid AS "ComponentItemID", i.itemname AS "ComponentName", bd.quantity AS "Quantity", bd.unitofmeasure AS "UnitOfMeasure"
       FROM bomdetails bd
       JOIN items i ON i.itemid = bd.itemid
       WHERE bd.bomid = $1`, [parseInt(bomId)]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'BOM not found' });
    res.json(result.rows);
  } catch (error) {
    return respondWithFallback(res, logger, 'Exploding BOM', error, []);
  }
}

async function getCapacityPlan(req, res) {
  try {
    const result = await executeQuery(
      `SELECT id AS "ResourceID", resource_name AS "ResourceName",
              available_hours AS "PlannedCapacity", planned_hours AS "AvailableCapacity",
              CASE WHEN available_hours > 0 THEN ROUND((planned_hours / available_hours) * 100, 1) ELSE 0 END AS "UtilizationPercentage",
              period_month, period_year,
              TO_CHAR(TO_DATE(period_year::text || '-' || LPAD(period_month::text,2,'0') || '-01','YYYY-MM-DD'),'Mon YYYY') AS "PeriodLabel"
       FROM capacity_planning
       ORDER BY period_year DESC, period_month DESC`
    );
    res.json(result.rows);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching capacity plans', error, []);
  }
}

async function releaseProductionPlan(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || 1;

    // Fetch the plan
    const planRes = await executeQuery(
      `SELECT id, plan_number, status FROM production_plans WHERE id = $1`, [parseInt(id)]
    );
    if (planRes.rows.length === 0) return res.status(404).json({ error: 'Production plan not found' });
    const plan = planRes.rows[0];
    if (plan.status === 'In Progress') return res.status(400).json({ error: 'Plan already released' });

    // Fetch plan lines that don't have a work order yet
    const linesRes = await executeQuery(
      `SELECT ppl.id AS line_id, ppl.item_id, ppl.planned_qty, ppl.scheduled_date,
              i.itemname
       FROM production_plan_lines ppl
       JOIN items i ON i.itemid = ppl.item_id
       WHERE ppl.plan_id = $1 AND (ppl.work_order_id IS NULL)`, [parseInt(id)]
    );

    if (linesRes.rows.length === 0)
      return res.status(400).json({ error: 'No unlinked lines found — all lines already have Work Orders' });

    const created = [];

    for (const line of linesRes.rows) {
      const woNumber = `WO-${plan.plan_number}-${line.line_id}`;

      // Create work order
      const woRes = await executeQuery(
        `INSERT INTO workorders (workordernumber, productid, quantity, startdate, enddate, status, createdby, createddate)
         VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), COALESCE($4::date + 14, CURRENT_DATE + 14), 'Planned', $5, NOW())
         RETURNING workorderid`,
        [woNumber, line.item_id, parseFloat(line.planned_qty), line.scheduled_date || null, userId]
      );
      const woId = woRes.rows[0].workorderid;

      // Link back to plan line
      await executeQuery(
        `UPDATE production_plan_lines SET work_order_id = $1 WHERE id = $2`,
        [woId, line.line_id]
      );

      created.push({ workOrderId: woId, workOrderNumber: woNumber, item: line.itemname, qty: line.planned_qty });
    }

    // Update plan status to In Progress
    await executeQuery(
      `UPDATE production_plans SET status = 'In Progress' WHERE id = $1`, [parseInt(id)]
    );

    logger.info(`[Planning] Released plan ${plan.plan_number} — created ${created.length} Work Orders`);
    res.json({ message: `Plan released — ${created.length} Work Order(s) created`, workOrders: created });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Releasing production plan', error);
  }
}

module.exports = { getDemandForecasts, createDemandForecast, getProductionPlans, createProductionPlan, getMRPRuns, executeMRP, getPlannedOrders, explodeBOM, getCapacityPlan, releaseProductionPlan };
