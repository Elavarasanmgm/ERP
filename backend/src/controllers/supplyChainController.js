const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const { respondWithFallback, respondFeatureUnavailable } = require('../utils/schemaFallback');

async function getPurchaseRequisitions(req, res) {
  try {
    const result = await executeQuery(
      `SELECT id AS "RequisitionID", mr_number AS "RequisitionNumber", 
              'Store' AS "Department", request_date AS "RequestedDate",
              required_date AS "RequiredDate", status AS "Status", 
              0 AS "TotalAmount"
       FROM material_requests ORDER BY request_date DESC`
    );
    res.json(result.rows);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching requisitions', error, []);
  }
}

async function createPurchaseRequisition(req, res) {
  try {
    const { department, requestedDate, requiredDate } = req.body;
    const userId = req.user.userId;
    if (!requiredDate) return res.status(400).json({ error: 'Missing required fields' });

    const result = await executeQuery(
      `INSERT INTO material_requests (mr_number, requested_by, request_date, required_date, status, created_date)
       VALUES ($1, $2, $3, $4, 'Pending', NOW()) RETURNING id`,
      [`PR-${Date.now()}`, userId, requestedDate || new Date(), requiredDate]
    );
    logger.info('[Supply] Created purchase requisition');
    res.status(201).json({ message: 'Purchase requisition created', id: result.rows[0].id });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Creating requisition', error);
  }
}

async function getVendors(req, res) {
  try {
    const result = await executeQuery(
      `SELECT supplierid AS "VendorID", suppliername AS "VendorCode", suppliername AS "VendorName",
              email AS "Email", phone AS "Phone", address AS "Address", city AS "City",
              country AS "Country", paymentterms AS "PaymentTerms", 'Medium' AS "Rating"
       FROM suppliers ORDER BY suppliername`
    );
    res.json(result.rows);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching vendors', error, []);
  }
}

async function registerVendor(req, res) {
  try {
    const { vendorCode, vendorName, email, phone, address, city, country, paymentTerms } = req.body;
    if (!vendorCode || !vendorName) return res.status(400).json({ error: 'Missing required fields' });

    const result = await executeQuery(
      `INSERT INTO suppliers (suppliername, email, phone, address, city, country, paymentterms, createddate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING supplierid AS id`,
      [vendorName, email || null, phone || null, address || null, city || null, country || null, paymentTerms || 'Net 30']
    );
    logger.info(`[Supply] Registered vendor: ${vendorCode}`);
    res.status(201).json({ id: result.rows[0].id, message: 'Vendor registered successfully' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Registering vendor', error);
  }
}

async function getGoodsReceipt(req, res) {
  try {
    const result = await executeQuery(
      `SELECT gr.id AS "ReceiptID", gr.grn_number AS "ReceiptNumber",
              s.suppliername AS "VendorName", gr.receipt_date AS "ReceiptDate",
              gr.po_id AS "PurchaseOrderID", gr.status AS "Status", 
              0 AS "TotalQuantity"
       FROM goods_receipts gr
       LEFT JOIN suppliers s ON s.supplierid = gr.supplier_id
       ORDER BY gr.receipt_date DESC`
    );
    res.json(result.rows);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching goods receipt', error, []);
  }
}

async function postGoodsReceipt(req, res) {
  try {
    const { vendorId, purchaseOrderId, receiptDate } = req.body;
    const userId = req.user.userId;
    if (!vendorId || !receiptDate) return res.status(400).json({ error: 'Missing required fields' });

    const result = await executeQuery(
      `INSERT INTO goods_receipts (grn_number, supplier_id, receipt_date, po_id, status, received_by, created_date)
       VALUES ($1, $2, $3, $4, 'Draft', $5, NOW()) RETURNING id`,
      [`GR-${Date.now()}`, parseInt(vendorId), receiptDate, purchaseOrderId ? parseInt(purchaseOrderId) : null, userId]
    );
    logger.info('[Supply] Goods receipt posted');
    res.status(201).json({ message: 'Goods receipt posted', id: result.rows[0].id });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Posting goods receipt', error);
  }
}

async function getVendorPerformance(req, res) {
  try {
    const result = await executeQuery(
      `SELECT s.supplierid AS "VendorID", s.suppliername AS "VendorName",
              COUNT(po.purchaseorderid) AS "TotalPOs",
              95.0 AS "OnTimePercentage", 4.8 AS "AvgQuality"
       FROM suppliers s
       LEFT JOIN purchaseorders po ON po.supplierid = s.supplierid
       GROUP BY s.supplierid, s.suppliername
       ORDER BY s.suppliername`
    );
    res.json(result.rows);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching vendor performance', error, []);
  }
}

async function updateVendor(req, res) {
  try {
    const { id } = req.params;
    const { vendorName, email, phone, address, city, country, paymentTerms } = req.body;
    await executeQuery(
      `UPDATE suppliers SET suppliername=$1, email=$2, phone=$3, address=$4, city=$5, country=$6, paymentterms=$7 WHERE supplierid=$8`,
      [vendorName, email || null, phone || null, address || null, city || null, country || null, paymentTerms || 'Net 30', parseInt(id)]
    );
    res.json({ message: 'Vendor updated' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Updating vendor', error);
  }
}

module.exports = { getPurchaseRequisitions, createPurchaseRequisition, getVendors, registerVendor, updateVendor, getGoodsReceipt, postGoodsReceipt, getVendorPerformance };
