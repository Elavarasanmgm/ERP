const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const { respondWithFallback, respondFeatureUnavailable } = require('../utils/schemaFallback');

// Fixed Assets Module

// Get assets
async function getAssets(req, res) {
  try {
    const result = await executeQuery(`
      SELECT AssetId AS AssetID, AssetCode, AssetName, AssetType AS Category, PurchaseDate, PurchasePrice,
             PurchasePrice AS AcquisitionCost, 'Linear' AS DepreciationMethod, CAST(NULL AS INT) AS UsefulLife,
             CAST(0 AS DECIMAL(18,2)) AS Depreciation, CurrentValue AS BookValue, Status
      FROM dbo.Assets
      ORDER BY AssetCode
    `);
    logger.info(`[Assets] Retrieved ${result.recordset.length} assets`);
    res.json(result.recordset);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching assets', error, []);
  }
}

// Get asset by ID
async function getAssetById(req, res) {
  try {
    const { id } = req.params;
    const result = await executeQuery(`
      SELECT AssetId AS AssetID, AssetCode, AssetName, AssetType AS Category, Location, PurchaseDate, PurchasePrice,
             PurchasePrice AS AcquisitionCost, 'Linear' AS DepreciationMethod, CAST(NULL AS INT) AS UsefulLife,
             CAST(0 AS DECIMAL(18,2)) AS Depreciation, CurrentValue AS BookValue, Status, CAST(NULL AS NVARCHAR(500)) AS Notes
      FROM dbo.Assets
      WHERE AssetId = ${id}
    `);
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json(result.recordset[0]);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching asset', error, null);
  }
}

// Register asset
async function registerAsset(req, res) {
  try {
    const { assetCode, assetName, category, location, purchaseDate, purchasePrice, 
            depreciationMethod, usefulLife } = req.body;
    
    if (!assetCode || !assetName || !category || !purchasePrice) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await executeQuery(
      `INSERT INTO dbo.Assets (AssetCode, AssetName, AssetType, PurchaseDate, PurchasePrice, CurrentValue, Location, Status, CreatedDate)
       VALUES (@code, @name, @type, @purchaseDate, @purchasePrice, @currentValue, @location, 'Active', GETDATE())`,
      {
        code: assetCode,
        name: assetName,
        type: category,
        purchaseDate: purchaseDate || null,
        purchasePrice: parseFloat(purchasePrice),
        currentValue: parseFloat(purchasePrice),
        location: location || null,
      }
    );
    
    logger.info(`[Assets] Registered asset: ${assetCode}`);
    res.status(201).json({ message: 'Asset registered successfully' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Registering asset', error);
  }
}

// Calculate depreciation
async function calculateDepreciation(req, res) {
  try {
    const { assetId } = req.params;
    const result = await executeQuery(`
      SELECT AssetId AS AssetID, AssetCode, PurchasePrice AS AcquisitionCost, CAST(NULL AS INT) AS UsefulLife,
             CAST(PurchasePrice / 5.0 AS DECIMAL(18,2)) as AnnualDepreciation
      FROM dbo.Assets
      WHERE AssetId = ${assetId}
    `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    const asset = result.recordset[0];
    logger.info(`[Assets] Calculated depreciation for asset ${assetId}`);
    res.json(asset);
  } catch (error) {
    return respondWithFallback(res, logger, 'Calculating depreciation', error, null);
  }
}

// Post depreciation entry
async function postDepreciationEntry(req, res) {
  try {
    const { assetId, depreciationAmount, depreciationDate } = req.body;
    
    if (!assetId || !depreciationAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Update asset depreciation
    await executeQuery(`
      UPDATE FixedAssets
      SET Depreciation = Depreciation + ${depreciationAmount},
          BookValue = AcquisitionCost - (Depreciation + ${depreciationAmount})
      WHERE AssetID = ${assetId}
    `);
    
    // Log depreciation entry
    await executeQuery(`
      INSERT INTO AssetDepreciation (AssetID, DepreciationAmount, DepreciationDate, CreatedDate)
      VALUES (${assetId}, ${depreciationAmount}, '${depreciationDate}', GETDATE())
    `);
    
    logger.info(`[Assets] Depreciation posted for asset ${assetId}`);
    res.status(201).json({ message: 'Depreciation entry posted' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Posting depreciation', error);
  }
}

// Get asset maintenance records
async function getMaintenanceRecords(req, res) {
  try {
    const result = await executeQuery(`
      SELECT MaintenanceID, AssetID, (SELECT AssetCode FROM FixedAssets WHERE AssetID = m.AssetID) as AssetCode,
             MaintenanceDate, MaintenanceType, Cost, Notes, NextDueDate
      FROM AssetMaintenance m
      ORDER BY MaintenanceDate DESC
    `);
    logger.info(`[Assets] Retrieved maintenance records`);
    res.json(result.recordset);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching maintenance records', error, []);
  }
}

// Log maintenance
async function logMaintenance(req, res) {
  try {
    const { assetId, maintenanceType, maintenanceDate, cost, notes, nextDueDate } = req.body;
    
    if (!assetId || !maintenanceType || !maintenanceDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await executeQuery(`
      INSERT INTO AssetMaintenance (AssetID, MaintenanceType, MaintenanceDate, Cost, Notes, NextDueDate, CreatedDate)
      VALUES (${assetId}, '${maintenanceType}', '${maintenanceDate}', ${cost || 0}, '${notes || ''}', '${nextDueDate}', GETDATE())
    `);
    
    logger.info(`[Assets] Maintenance logged for asset ${assetId}`);
    res.status(201).json({ message: 'Maintenance record created' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Logging maintenance', error);
  }
}

// Get asset report
async function getAssetReport(req, res) {
  try {
    const result = await executeQuery(`
      SELECT AssetType AS Category, COUNT(*) as Count, SUM(PurchasePrice) as TotalCost,
             CAST(0 AS DECIMAL(18,2)) as TotalDepreciation, SUM(CurrentValue) as TotalBookValue
      FROM dbo.Assets
      GROUP BY AssetType
    `);
    logger.info(`[Assets] Generated asset report`);
    res.json(result.recordset);
  } catch (error) {
    return respondWithFallback(res, logger, 'Generating asset report', error, []);
  }
}

module.exports = {
  getAssets,
  getAssetById,
  registerAsset,
  calculateDepreciation,
  postDepreciationEntry,
  getMaintenanceRecords,
  logMaintenance,
  getAssetReport
};
