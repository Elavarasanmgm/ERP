const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const { nextDocNumber } = require('./settingsController');

// ─── Proforma Invoices ────────────────────────────────────────────────────────

const getProformaList = async (req, res) => {
  try {
    const { status, customer_id } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    if (status)      { params.push(status);      where += ` AND pi.status = $${params.length}`; }
    if (customer_id) { params.push(customer_id); where += ` AND pi.customer_id = $${params.length}`; }
    const result = await executeQuery(
      `SELECT pi.id, pi.pi_number, pi.pi_date, pi.valid_until, pi.status,
              pi.subtotal, pi.tax_amount, pi.total_amount, pi.advance_requested, pi.currency,
              c.customername AS customer_name, so.ordernumber AS so_number
       FROM proforma_invoices pi
       LEFT JOIN customers c ON c.customerid = pi.customer_id
       LEFT JOIN salesorders so ON so.salesorderid = pi.sales_order_id
       ${where} ORDER BY pi.pi_date DESC LIMIT 500`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getProformaList:', err.message);
    res.status(500).json({ error: 'Failed to fetch proforma invoices' });
  }
};

const getProformaById = async (req, res) => {
  try {
    const { id } = req.params;
    const pi = await executeQuery(
      `SELECT pi.*, c.customername AS customer_name, so.ordernumber AS so_number
       FROM proforma_invoices pi
       LEFT JOIN customers c ON c.customerid = pi.customer_id
       LEFT JOIN salesorders so ON so.salesorderid = pi.sales_order_id
       WHERE pi.id = $1`, [id]
    );
    if (pi.rows.length === 0) return res.status(404).json({ error: 'Proforma invoice not found' });
    const lines = await executeQuery(
      `SELECT pil.*, i.itemname AS item_name, i.itemcode AS item_code
       FROM proforma_invoice_lines pil
       LEFT JOIN items i ON i.itemid = pil.item_id
       WHERE pil.pi_id = $1 ORDER BY pil.id`, [id]
    );
    res.json({ ...pi.rows[0], lines: lines.rows });
  } catch (err) {
    logger.error('getProformaById:', err.message);
    res.status(500).json({ error: 'Failed to fetch proforma invoice' });
  }
};

const createProforma = async (req, res) => {
  try {
    const { sales_order_id, customer_id, valid_until, lines, other_charges, notes, currency, advance_percent } = req.body;
    const userId = req.user.userId;
    if (!customer_id || !lines || lines.length === 0) return res.status(400).json({ error: 'customer_id and lines are required' });

    const piNumber = await nextDocNumber('PI') || `PI-${Date.now()}`;
    let subtotal = 0, taxTotal = 0;
    for (const l of lines) {
      subtotal += Number(l.quantity) * Number(l.unit_price);
      taxTotal += Number(l.tax_amount || 0);
    }
    const total = subtotal + taxTotal + Number(other_charges || 0);
    const advanceRequested = total * ((advance_percent || 75) / 100);

    const pi = await executeQuery(
      `INSERT INTO proforma_invoices
        (pi_number, pi_date, valid_until, sales_order_id, customer_id, subtotal, tax_amount,
         other_charges, total_amount, advance_requested, currency, status, notes, created_by, created_date)
       VALUES ($1,NOW(),$2,$3,$4,$5,$6,$7,$8,$9,$10,'Draft',$11,$12,NOW())
       RETURNING id`,
      [piNumber, valid_until || null, sales_order_id || null, customer_id,
       subtotal, taxTotal, other_charges || 0, total, advanceRequested,
       currency || 'INR', notes || null, userId]
    );
    const piId = pi.rows[0].id;

    for (const l of lines) {
      await executeQuery(
        `INSERT INTO proforma_invoice_lines (pi_id, item_id, description, quantity, unit_price, discount_pct, tax_id, tax_amount, line_total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [piId, l.item_id || null, l.description || null, l.quantity, l.unit_price,
         l.discount_pct || 0, l.tax_id || null, l.tax_amount || 0,
         Number(l.quantity) * Number(l.unit_price) + Number(l.tax_amount || 0)]
      );
    }

    logger.info(`Proforma Invoice created: ${piNumber}`);
    res.status(201).json({ id: piId, pi_number: piNumber, message: 'Proforma Invoice created' });
  } catch (err) {
    logger.error('createProforma:', err.message);
    res.status(500).json({ error: 'Failed to create proforma invoice' });
  }
};

const sendProforma = async (req, res) => {
  try {
    const { id } = req.params;
    const check = await executeQuery('SELECT status FROM proforma_invoices WHERE id=$1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Proforma Invoice not found' });
    await executeQuery(`UPDATE proforma_invoices SET status='Sent' WHERE id=$1`, [id]);
    res.json({ message: 'Proforma Invoice marked as Sent' });
  } catch (err) {
    logger.error('sendProforma:', err.message);
    res.status(500).json({ error: 'Failed to update proforma status' });
  }
};

const convertProformaToInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const pi = await executeQuery('SELECT * FROM proforma_invoices WHERE id=$1', [id]);
    if (pi.rows.length === 0) return res.status(404).json({ error: 'Proforma Invoice not found' });
    if (pi.rows[0].status === 'Converted') return res.status(400).json({ error: 'Already converted to invoice' });

    const piData = pi.rows[0];
    const lines = await executeQuery('SELECT * FROM proforma_invoice_lines WHERE pi_id=$1', [id]);
    const { postInvoice: _, createInvoice } = require('./transactionController');

    const invoiceNumber = await nextDocNumber('INVOICE') || `INV-${Date.now()}`;
    const inv = await executeQuery(
      `INSERT INTO invoices
        (invoicenumber, invoicedate, customerid, subtotal, totalamount, paidamount,
         outstanding_amount, payment_status, is_fully_paid, invoice_type, sales_order_id,
         currency, status, createdby, createddate)
       VALUES ($1,NOW(),$2,$3,$4,0,$4,'Unpaid',false,'Tax Invoice',$5,$6,'Draft',$7,NOW())
       RETURNING invoiceid AS id`,
      [invoiceNumber, piData.customer_id, piData.subtotal, piData.total_amount,
       piData.sales_order_id, piData.currency, userId]
    );
    const invId = inv.rows[0].id;

    for (const l of lines.rows) {
      await executeQuery(
        `INSERT INTO invoice_lines (invoice_id, item_id, description, quantity, unit_price, line_total)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [invId, l.item_id, l.description, l.quantity, l.unit_price, l.line_total]
      );
    }

    await executeQuery(`UPDATE proforma_invoices SET status='Converted' WHERE id=$1`, [id]);
    res.status(201).json({ id: invId, invoice_number: invoiceNumber, message: 'Converted to Invoice' });
  } catch (err) {
    logger.error('convertProformaToInvoice:', err.message);
    res.status(500).json({ error: 'Failed to convert proforma to invoice' });
  }
};

// ─── Advance Payments ─────────────────────────────────────────────────────────

const getAdvancePayments = async (req, res) => {
  try {
    const { customer_id, sales_order_id } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    if (customer_id)   { params.push(customer_id);   where += ` AND ap.customer_id = $${params.length}`; }
    if (sales_order_id){ params.push(sales_order_id); where += ` AND ap.sales_order_id = $${params.length}`; }
    const result = await executeQuery(
      `SELECT ap.id, ap.payment_number, ap.payment_date, ap.amount, ap.payment_mode,
              ap.reference_number, ap.status, ap.notes,
              c.customername AS customer_name, so.ordernumber AS so_number, pi.pi_number
       FROM advance_payments ap
       LEFT JOIN customers c ON c.customerid = ap.customer_id
       LEFT JOIN salesorders so ON so.salesorderid = ap.sales_order_id
       LEFT JOIN proforma_invoices pi ON pi.id = ap.pi_id
       ${where} ORDER BY ap.payment_date DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getAdvancePayments:', err.message);
    res.status(500).json({ error: 'Failed to fetch advance payments' });
  }
};

const createAdvancePayment = async (req, res) => {
  try {
    const { sales_order_id, customer_id, pi_id, amount, payment_mode, reference_number, bank_account, notes } = req.body;
    const userId = req.user.userId;
    if (!customer_id || !amount) return res.status(400).json({ error: 'customer_id and amount are required' });

    const paymentNumber = await nextDocNumber('ADVANCE') || `ADV-${Date.now()}`;
    const result = await executeQuery(
      `INSERT INTO advance_payments
        (payment_number, sales_order_id, customer_id, pi_id, payment_date, amount, payment_mode,
         reference_number, bank_account, status, notes, created_by, created_date)
       VALUES ($1,$2,$3,$4,NOW(),$5,$6,$7,$8,'Received',$9,$10,NOW())
       RETURNING id`,
      [paymentNumber, sales_order_id || null, customer_id, pi_id || null, amount,
       payment_mode || 'Bank Transfer', reference_number || null, bank_account || null, notes || null, userId]
    );

    // Update SO advance received
    if (sales_order_id) {
      await executeQuery(
        `UPDATE salesorders SET advance_amount = COALESCE(advance_amount,0) + $1,
         balance_amount = totalamount - (COALESCE(advance_amount,0) + $1)
         WHERE salesorderid = $2`,
        [amount, sales_order_id]
      );
    }

    logger.info(`Advance payment recorded: ${paymentNumber}`);
    res.status(201).json({ id: result.rows[0].id, payment_number: paymentNumber, message: 'Advance payment recorded' });
  } catch (err) {
    logger.error('createAdvancePayment:', err.message);
    res.status(500).json({ error: 'Failed to record advance payment' });
  }
};

const getOutstandingByCustomer = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT c.customerid AS id, c.customername AS customer,
              COUNT(i.invoiceid) AS invoice_count,
              SUM(i.totalamount) AS total_billed,
              SUM(i.paidamount) AS total_paid,
              SUM(i.outstanding_amount) AS total_outstanding,
              MAX(i.duedate) AS latest_due_date
       FROM customers c
       JOIN invoices i ON i.customerid = c.customerid
       WHERE i.is_fully_paid = false AND i.status NOT IN ('Draft','Cancelled')
       GROUP BY c.customerid, c.customername
       ORDER BY total_outstanding DESC`
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getOutstandingByCustomer:', err.message);
    res.status(500).json({ error: 'Failed to fetch outstanding report' });
  }
};

// ─── Packing Lists ────────────────────────────────────────────────────────────

const getPackingLists = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT pl.id, pl.pl_number, pl.pl_date, pl.no_of_packages, pl.gross_weight, pl.net_weight,
              pl.port_of_loading, pl.bl_awb_number, pl.country_of_origin,
              c.customername AS customer_name, so.ordernumber AS so_number
       FROM packing_lists pl
       LEFT JOIN customers c ON c.customerid = pl.customer_id
       LEFT JOIN salesorders so ON so.salesorderid = pl.sales_order_id
       ORDER BY pl.pl_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getPackingLists:', err.message);
    res.status(500).json({ error: 'Failed to fetch packing lists' });
  }
};

const createPackingList = async (req, res) => {
  try {
    const {
      sales_order_id, invoice_id, customer_id, shipping_marks, gross_weight, net_weight,
      no_of_packages, package_type, port_of_loading, port_of_discharge,
      vessel_flight, bl_awb_number, country_of_origin, lines
    } = req.body;
    const userId = req.user.userId;
    if (!customer_id) return res.status(400).json({ error: 'customer_id is required' });

    const plNumber = await nextDocNumber('PACKING_LIST') || `PL-${Date.now()}`;
    const pl = await executeQuery(
      `INSERT INTO packing_lists
        (pl_number, pl_date, sales_order_id, invoice_id, customer_id, shipping_marks,
         gross_weight, net_weight, no_of_packages, package_type,
         port_of_loading, port_of_discharge, vessel_flight, bl_awb_number, country_of_origin,
         created_by, created_date)
       VALUES ($1,NOW(),$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW())
       RETURNING id`,
      [plNumber, sales_order_id || null, invoice_id || null, customer_id, shipping_marks || null,
       gross_weight || 0, net_weight || 0, no_of_packages || 1, package_type || 'Carton',
       port_of_loading || null, port_of_discharge || null, vessel_flight || null,
       bl_awb_number || null, country_of_origin || 'India', userId]
    );
    const plId = pl.rows[0].id;

    if (lines && lines.length > 0) {
      for (const l of lines) {
        await executeQuery(
          `INSERT INTO packing_list_lines (pl_id, item_id, description, quantity, unit_of_measure, gross_weight, net_weight, package_no)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [plId, l.item_id || null, l.description || null, l.quantity, l.unit_of_measure || 'NOS',
           l.gross_weight || 0, l.net_weight || 0, l.package_no || null]
        );
      }
    }

    res.status(201).json({ id: plId, pl_number: plNumber, message: 'Packing list created' });
  } catch (err) {
    logger.error('createPackingList:', err.message);
    res.status(500).json({ error: 'Failed to create packing list' });
  }
};

const getSalesQuotes = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT q.id, q.quotation_number AS order_number, q.quotation_date AS order_date,
              q.valid_until AS due_date, q.total_amount, q.status,
              c.customername AS customer_name, q.customer_id
       FROM sales_quotations q
       LEFT JOIN customers c ON c.customerid = q.customer_id
       ORDER BY q.quotation_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getSalesQuotes:', err.message);
    res.status(500).json({ error: 'Failed to fetch sales quotes' });
  }
};

const createSalesQuote = async (req, res) => {
  try {
    const { customer_id, valid_until, lines, notes, other_charges } = req.body;
    const userId = req.user.userId;

    const qNumber = await nextDocNumber('QUOTE') || `QT-${Date.now()}`;
    let total = 0;
    if (lines) {
      lines.forEach(l => total += Number(l.quantity) * Number(l.unit_price));
    }
    total += Number(other_charges || 0);

    const q = await executeQuery(
      `INSERT INTO sales_quotations
        (quotation_number, quotation_date, valid_until, customer_id, total_amount, status, notes, created_by)
       VALUES ($1, NOW(), $2, $3, $4, 'Draft', $5, $6) RETURNING id`,
      [qNumber, valid_until || null, customer_id, total, notes || null, userId]
    );
    const qId = q.rows[0].id;

    if (lines && lines.length > 0) {
      for (const l of lines) {
        await executeQuery(
          `INSERT INTO sales_quotation_lines (quotation_id, item_id, description, quantity, unit_price, line_total)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [qId, l.item_id, l.description || null, l.quantity, l.unit_price, Number(l.quantity) * Number(l.unit_price)]
        );
      }
    }

    res.status(201).json({ id: qId, quotation_number: qNumber, message: 'Sales Quote created' });
  } catch (err) {
    logger.error('createSalesQuote:', err.message);
    res.status(500).json({ error: 'Failed to create sales quote' });
  }
};

module.exports = {
  getProformaList, getProformaById, createProforma, sendProforma, convertProformaToInvoice,
  getAdvancePayments, createAdvancePayment, getOutstandingByCustomer,
  getPackingLists, createPackingList,
  getSalesQuotes, createSalesQuote
};
