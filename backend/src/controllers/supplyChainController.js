const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const { respondWithFallback, respondFeatureUnavailable } = require('../utils/schemaFallback');

// Supply Chain Module

// Get purchase requisitions
async function getPurchaseRequisitions(req, res) {
  try {
    const result = await executeQuery(`
      SELECT RequisitionID, RequisitionNumber, Department, RequestedDate, RequiredDate, 
             Status, TotalAmount, ApprovedBy
      FROM PurchaseRequisitions
      ORDER BY RequestedDate DESC
    `);
    logger.info(`[Supply] Retrieved ${result.recordset.length} requisitions`);
    res.json(result.recordset);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching requisitions', error, []);
  }
}

// Create purchase requisition
async function createPurchaseRequisition(req, res) {
  try {
    const { department, requestedDate, requiredDate, items } = req.body;
    
    if (!department || !requiredDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await executeQuery(`
      INSERT INTO PurchaseRequisitions (RequisitionNumber, Department, RequestedDate, RequiredDate, Status, CreatedDate)
      VALUES ('PR-${Date.now()}', '${department}', '${requestedDate}', '${requiredDate}', 'Draft', GETDATE());
      SELECT SCOPE_IDENTITY() as ID
    `);
    
    logger.info(`[Supply] Created purchase requisition`);
    res.status(201).json({ message: 'Purchase requisition created', id: result.recordset[0].ID });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Creating requisition', error);
  }
}

// Get vendors
async function getVendors(req, res) {
  try {
    const result = await executeQuery(`
      SELECT VendorID, VendorCode, VendorName, Email, Phone, Address, City, Country,
             PaymentTerms, Rating, Status
      FROM Vendors
      WHERE Status = 'Active'
      ORDER BY VendorCode
    `);
    logger.info(`[Supply] Retrieved ${result.recordset.length} vendors`);
    res.json(result.recordset);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching vendors', error, []);
  }
}

// Register vendor
async function registerVendor(req, res) {
  try {
    const { vendorCode, vendorName, email, phone, address, city, country, paymentTerms, rating } = req.body;
    
    if (!vendorCode || !vendorName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await executeQuery(`
      INSERT INTO Vendors (VendorCode, VendorName, Email, Phone, Address, City, Country, PaymentTerms, Rating, Status, CreatedDate)
      VALUES ('${vendorCode}', '${vendorName}', '${email}', '${phone}', '${address}', '${city}', '${country}', '${paymentTerms}', '${rating || 'Medium'}', 'Active', GETDATE())
    `);
    
    logger.info(`[Supply] Registered vendor: ${vendorCode}`);
    res.status(201).json({ message: 'Vendor registered successfully' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Registering vendor', error);
  }
}

// Get goods receipt
async function getGoodsReceipt(req, res) {
  try {
    const result = await executeQuery(`
      SELECT ReceiptID, ReceiptNumber, (SELECT VendorName FROM Vendors WHERE VendorID = g.VendorID) as VendorName,
             ReceiptDate, PurchaseOrderID, TotalQuantity, TotalValue, Status
      FROM GoodsReceipt g
      ORDER BY ReceiptDate DESC
    `);
    logger.info(`[Supply] Retrieved goods receipts`);
    res.json(result.recordset);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching goods receipt', error, []);
  }
}

// Post goods receipt
async function postGoodsReceipt(req, res) {
  try {
    const { vendorId, purchaseOrderId, receiptDate, items } = req.body;
    
    if (!vendorId || !purchaseOrderId || !receiptDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await executeQuery(`
      INSERT INTO GoodsReceipt (ReceiptNumber, VendorID, ReceiptDate, PurchaseOrderID, TotalQuantity, TotalValue, Status, CreatedDate)
      VALUES ('GR-${Date.now()}', ${vendorId}, '${receiptDate}', ${purchaseOrderId}, 0, 0, 'Posted', GETDATE());
      SELECT SCOPE_IDENTITY() as ID
    `);
    
    logger.info(`[Supply] Goods receipt posted`);
    res.status(201).json({ message: 'Goods receipt posted', id: result.recordset[0].ID });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Posting goods receipt', error);
  }
}

// Get vendor performance
async function getVendorPerformance(req, res) {
  try {
    const result = await executeQuery(`
      SELECT VendorID, (SELECT VendorName FROM Vendors WHERE VendorID = v.VendorID) as VendorName,
             COUNT(DISTINCT PoID) as TotalPOs, AVG(CAST(OnTimeDelivery AS FLOAT)) as OnTimePercentage,
             AVG(CAST(QualityRating AS FLOAT)) as AvgQuality
      FROM (
        SELECT p.VendorID, p.PoID, 
               CASE WHEN p.DeliveryDate <= p.PromisedDate THEN 1 ELSE 0 END as OnTimeDelivery,
               80 as QualityRating
        FROM PurchaseOrders p
      ) v
      GROUP BY VendorID
    `);
    logger.info(`[Supply] Generated vendor performance report`);
    res.json(result.recordset);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching vendor performance', error, []);
  }
}

module.exports = {
  getPurchaseRequisitions,
  createPurchaseRequisition,
  getVendors,
  registerVendor,
  getGoodsReceipt,
  postGoodsReceipt,
  getVendorPerformance
};
