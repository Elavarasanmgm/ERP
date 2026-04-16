const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const { respondWithFallback, respondFeatureUnavailable } = require('../utils/schemaFallback');

async function getAssets(req, res) {
  try {
    const result = await executeQuery(
      `SELECT assetid AS "AssetID", assetcode AS "AssetCode", assetname AS "AssetName", 
              assettype AS "Category", location AS "Location",
              purchasedate AS "PurchaseDate", purchaseprice AS "PurchasePrice", 
              currentvalue AS "BookValue", status AS "Status", createddate AS "CreatedDate"
       FROM assets ORDER BY assetcode`
    );
    res.json(result.rows);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching assets', error, []);
  }
}

async function getAssetById(req, res) {
  try {
    const { id } = req.params;
    const result = await executeQuery(
      `SELECT assetid AS "AssetID", assetcode AS "AssetCode", assetname AS "AssetName", 
              assettype AS "Category", location AS "Location",
              purchasedate AS "PurchaseDate", purchaseprice AS "PurchasePrice", 
              currentvalue AS "BookValue", status AS "Status"
       FROM assets WHERE assetid = $1`, [parseInt(id)]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Asset not found' });
    res.json(result.rows[0]);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching asset', error, null);
  }
}

async function registerAsset(req, res) {
  try {
    const { assetCode, assetName, category, location, purchaseDate, purchasePrice } = req.body;
    if (!assetCode || !assetName || !category || !purchasePrice)
      return res.status(400).json({ error: 'Missing required fields' });

    const result = await executeQuery(
      `INSERT INTO assets (assetcode, assetname, assettype, purchasedate, purchaseprice, currentvalue, location, status, createddate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Active', NOW()) RETURNING assetid AS id`,
      [assetCode, assetName, category, purchaseDate || null, parseFloat(purchasePrice), parseFloat(purchasePrice), location || null]
    );
    logger.info(`[Assets] Registered asset: ${assetCode}`);
    res.status(201).json({ id: result.rows[0].id, message: 'Asset registered successfully' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Registering asset', error);
  }
}

async function getDepreciationSchedules(req, res) {
  try {
    const { assetId } = req.query;
    let query = `
      SELECT ds.id AS "ScheduleID", ds.asset_id AS "AssetID", a.assetname AS "AssetName",
             ds.schedule_date AS "Date", ds.opening_book_value AS "OpeningValue",
             ds.depreciation_amount AS "DepreciationAmount", 
             ds.closing_book_value AS "ClosingValue", ds.status AS "Status"
      FROM depreciation_schedules ds
      JOIN assets a ON a.assetid = ds.asset_id
    `;
    const params = [];
    if (assetId) {
      query += ` WHERE ds.asset_id = $1`;
      params.push(parseInt(assetId));
    }
    query += ` ORDER BY ds.schedule_date DESC`;
    
    const result = await executeQuery(query, params);
    res.json(result.rows);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching depreciation schedules', error, []);
  }
}

async function calculateDepreciation(req, res) {
  try {
    const { assetId } = req.params;
    const result = await executeQuery(
      `SELECT assetid AS "AssetID", assetcode AS "AssetCode", purchaseprice AS "AcquisitionCost",
              ROUND(purchaseprice / 5.0, 2) AS "AnnualDepreciation"
       FROM assets WHERE assetid = $1`, [parseInt(assetId)]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Asset not found' });
    res.json(result.rows[0]);
  } catch (error) {
    return respondWithFallback(res, logger, 'Calculating depreciation', error, null);
  }
}

async function postDepreciationEntry(req, res) {
  try {
    const { runAll, assetId, depreciationAmount } = req.body;

    if (runAll) {
      const assetsResult = await executeQuery(
        `SELECT assetid, assetname, purchaseprice, currentvalue FROM assets WHERE status = 'Active'`
      );
      
      const assets = assetsResult.rows;
      if (assets.length === 0) {
        return res.json({ message: 'No active assets found for depreciation' });
      }

      let count = 0;
      for (const asset of assets) {
        // Simple 5-year SLM calculation as per calculateDepreciation logic
        const annualDepr = Math.round((parseFloat(asset.purchaseprice || 0) / 5.0) * 100) / 100;
        const amount = Math.min(annualDepr, parseFloat(asset.currentvalue || 0));
        
        if (amount > 0) {
          // Check if depreciation already posted for this asset TODAY
          const existing = await executeQuery(
            `SELECT id FROM depreciation_schedules 
             WHERE asset_id = $1 AND schedule_date = CURRENT_DATE AND status = 'Posted'`,
            [asset.assetid]
          );

          if (existing.rows.length > 0) {
            // Update existing today's entry (refresh)
            await executeQuery(
              `UPDATE depreciation_schedules 
               SET opening_book_value = $2, depreciation_amount = $3, closing_book_value = $4, posted_date = NOW()
               WHERE id = $1`,
              [existing.rows[0].id, parseFloat(asset.currentvalue) + amount, amount, parseFloat(asset.currentvalue)]
            );
            // Note: We don't update asset.currentvalue again if it was already updated today? 
            // Actually, if it's a "refresh", we should probably not subtract from asset.currentvalue twice.
            // A better way: if already exists, just return or update the schedule, don't update asset value again.
          } else {
            await executeQuery(
              `UPDATE assets SET currentvalue = GREATEST(0, currentvalue - $1) WHERE assetid = $2`,
              [amount, asset.assetid]
            );

            await executeQuery(
              `INSERT INTO depreciation_schedules (asset_id, schedule_date, opening_book_value, depreciation_amount, closing_book_value, status)
               VALUES ($1, CURRENT_DATE, $2, $3, $4, 'Posted')`,
              [asset.assetid, parseFloat(asset.currentvalue), amount, parseFloat(asset.currentvalue) - amount]
            ).catch(e => logger.error(`Failed to log depreciation for asset ${asset.assetid}:`, e));
            count++;
          }
        }
      }
      
      logger.info(`[Assets] Bulk depreciation completed for ${count} assets`);
      return res.status(201).json({ message: `Depreciation posted for ${count} assets` });
    }

    if (!assetId || !depreciationAmount) return res.status(400).json({ error: 'Missing required fields' });

    await executeQuery(
      `UPDATE assets SET currentvalue = GREATEST(0, currentvalue - $1) WHERE assetid = $2`,
      [parseFloat(depreciationAmount), parseInt(assetId)]
    );

    // Create a schedule entry marked as Posted
    await executeQuery(
      `INSERT INTO depreciation_schedules (asset_id, schedule_date, opening_book_value, depreciation_amount, closing_book_value, status)
       SELECT $1, NOW(), currentvalue + $2, $2, currentvalue, 'Posted'
       FROM assets WHERE assetid = $1`,
      [parseInt(assetId), parseFloat(depreciationAmount)]
    ).catch(e => logger.error('Failed to log depreciation schedule:', e));

    logger.info(`[Assets] Depreciation posted for asset ${assetId}`);
    res.status(201).json({ message: 'Depreciation entry posted' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Posting depreciation', error);
  }
}

async function getMaintenanceRecords(req, res) {
  try {
    const result = await executeQuery(
      `SELECT am.id AS "MaintenanceID", am.asset_id AS "AssetID", a.assetcode AS "AssetCode", 
              a.assetname AS "AssetName", am.maintenance_type AS "Type", 
              am.maintenance_date AS "Date", am.cost AS "Cost", 
              am.description AS "Notes", am.next_maintenance_date AS "NextDueDate"
       FROM asset_maintenance am
       JOIN assets a ON a.assetid = am.asset_id
       ORDER BY am.maintenance_date DESC`
    );
    res.json(result.rows);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching maintenance records', error, []);
  }
}

async function logMaintenance(req, res) {
  try {
    const { assetId, maintenanceType, maintenanceDate, cost, notes, nextDueDate } = req.body;
    if (!assetId || !maintenanceType || !maintenanceDate)
      return res.status(400).json({ error: 'Missing required fields' });

    await executeQuery(
      `INSERT INTO asset_maintenance (asset_id, maintenance_type, maintenance_date, cost, description, next_maintenance_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, 1)`,
      [parseInt(assetId), maintenanceType, maintenanceDate, parseFloat(cost || 0), notes || null, nextDueDate || null]
    );
    logger.info(`[Assets] Maintenance logged for asset ${assetId}`);
    res.status(201).json({ message: 'Maintenance record created' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Logging maintenance', error);
  }
}

async function getAssetReport(req, res) {
  try {
    const result = await executeQuery(
      `SELECT assettype AS "Category", COUNT(*) AS "Count",
              SUM(purchaseprice) AS "TotalCost", SUM(currentvalue) AS "TotalBookValue"
       FROM assets GROUP BY assettype`
    );
    res.json(result.rows);
  } catch (error) {
    return respondWithFallback(res, logger, 'Generating asset report', error, []);
  }
}

async function updateAsset(req, res) {
  try {
    const { id } = req.params;
    const { assetName, category, location, purchaseDate, purchasePrice, currentValue, status } = req.body;
    await executeQuery(
      `UPDATE assets SET assetname=$1, assettype=$2, location=$3, purchasedate=$4,
       purchaseprice=$5, currentvalue=$6, status=$7 WHERE assetid=$8`,
      [assetName, category, location || null, purchaseDate || null,
       parseFloat(purchasePrice || 0), parseFloat(currentValue || 0), status || 'Active', parseInt(id)]
    );
    logger.info(`[Assets] Updated asset ${id}`);
    res.json({ message: 'Asset updated' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Updating asset', error);
  }
}

async function updateMaintenance(req, res) {
  try {
    const { id } = req.params;
    const { maintenanceType, maintenanceDate, cost, notes, nextDueDate } = req.body;
    await executeQuery(
      `UPDATE asset_maintenance SET maintenance_type=$1, maintenance_date=$2, cost=$3, description=$4, next_maintenance_date=$5 WHERE id=$6`,
      [maintenanceType, maintenanceDate, parseFloat(cost || 0), notes || null, nextDueDate || null, parseInt(id)]
    );
    res.json({ message: 'Maintenance record updated' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Updating maintenance', error);
  }
}

module.exports = { 
  getAssets, getAssetById, registerAsset, updateAsset, 
  getDepreciationSchedules, calculateDepreciation, postDepreciationEntry, 
  getMaintenanceRecords, logMaintenance, updateMaintenance, getAssetReport 
};
