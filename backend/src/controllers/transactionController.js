const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const { nextDocNumber } = require('./settingsController');

// ─── Customers ────────────────────────────────────────────────────────────────

const getCustomerList = async (req, res) => {
  try {
    const { type } = req.query;
    const params = [];
    let where = '';
    if (type) { params.push(type); where = `WHERE customer_type = $1`; }
    const result = await executeQuery(
      `SELECT customerid AS id, customername AS name, email, phone, city, state, country,
              creditlimit, currency, gst_number, gst_verified, gst_status, gst_trade_name,
              customer_type, credit_days, contact_person, createddate
       FROM customers ${where} ORDER BY customername`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getCustomerList:', err.message);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await executeQuery('SELECT * FROM customers WHERE customerid = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('getCustomerById:', err.message);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
};

const addCustomer = async (req, res) => {
  try {
    const {
      customerName, email, phone, address, city, state, pincode, country,
      creditLimit, currency, gst_number, pan_number, customer_type, credit_days, contact_person, alt_phone, website
    } = req.body;
    if (!customerName) return res.status(400).json({ error: 'customerName is required' });
    const result = await executeQuery(
      `INSERT INTO customers
        (customername, email, phone, address, city, state, pincode, country,
         creditlimit, currency, gst_number, pan_number, customer_type, credit_days,
         contact_person, alt_phone, website, createddate)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW())
       RETURNING customerid AS id`,
      [customerName, email || null, phone || null, address || null, city || null, state || null,
       pincode || null, country || 'India', creditLimit || 0, currency || 'INR',
       gst_number || null, pan_number || null, customer_type || 'Regular', credit_days || 30,
       contact_person || null, alt_phone || null, website || null]
    );
    logger.info(`Customer created: ${customerName}`);
    res.status(201).json({ id: result.rows[0].id, message: 'Customer created' });
  } catch (err) {
    logger.error('addCustomer:', err.message);
    res.status(500).json({ error: 'Failed to add customer' });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customerName, email, phone, address, city, state, pincode, country,
      creditLimit, currency, gst_number, gst_verified, gst_trade_name, gst_legal_name,
      gst_status, gst_state_code, pan_number, customer_type, credit_days, contact_person, alt_phone, website
    } = req.body;
    await executeQuery(
      `UPDATE customers SET
        customername=$1, email=$2, phone=$3, address=$4, city=$5, state=$6, pincode=$7, country=$8,
        creditlimit=$9, currency=$10, gst_number=$11, gst_verified=$12, gst_trade_name=$13,
        gst_legal_name=$14, gst_status=$15, gst_state_code=$16, pan_number=$17,
        customer_type=$18, credit_days=$19, contact_person=$20, alt_phone=$21, website=$22
       WHERE customerid=$23`,
      [customerName, email, phone, address, city, state, pincode, country,
       creditLimit, currency, gst_number, gst_verified || false, gst_trade_name, gst_legal_name,
       gst_status, gst_state_code, pan_number, customer_type, credit_days,
       contact_person, alt_phone, website, id]
    );
    res.json({ message: 'Customer updated' });
  } catch (err) {
    logger.error('updateCustomer:', err.message);
    res.status(500).json({ error: 'Failed to update customer' });
  }
};

// ─── Suppliers ────────────────────────────────────────────────────────────────

const getSupplierList = async (req, res) => {
  try {
    const { type } = req.query;
    const params = [];
    let where = '';
    if (type) { params.push(type); where = `WHERE supplier_type = $1`; }
    const result = await executeQuery(
      `SELECT supplierid AS id, suppliername AS name, email, phone, city, state, country,
              paymentterms, currency, supplier_type, gst_number, gst_verified, gst_status,
              gst_trade_name, pan_number, bank_name, bank_account, bank_ifsc, contact_person, createddate
       FROM suppliers ${where} ORDER BY suppliername`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getSupplierList:', err.message);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
};

const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await executeQuery('SELECT * FROM suppliers WHERE supplierid = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('getSupplierById:', err.message);
    res.status(500).json({ error: 'Failed to fetch supplier' });
  }
};

const addSupplier = async (req, res) => {
  try {
    const {
      supplierName, email, phone, address, city, state, pincode, country,
      paymentTerms, currency, supplier_type, gst_number, pan_number,
      contact_person, alt_phone, website, bank_name, bank_account, bank_ifsc
    } = req.body;
    if (!supplierName) return res.status(400).json({ error: 'supplierName is required' });
    const result = await executeQuery(
      `INSERT INTO suppliers
        (suppliername, email, phone, address, city, state, pincode, country,
         paymentterms, currency, supplier_type, gst_number, pan_number,
         contact_person, alt_phone, website, bank_name, bank_account, bank_ifsc, createddate)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,NOW())
       RETURNING supplierid AS id`,
      [supplierName, email || null, phone || null, address || null, city || null, state || null,
       pincode || null, country || 'India', paymentTerms || null, currency || 'INR',
       supplier_type || 'Material Supplier', gst_number || null, pan_number || null,
       contact_person || null, alt_phone || null, website || null,
       bank_name || null, bank_account || null, bank_ifsc || null]
    );
    logger.info(`Supplier created: ${supplierName}`);
    res.status(201).json({ id: result.rows[0].id, message: 'Supplier created' });
  } catch (err) {
    logger.error('addSupplier:', err.message);
    res.status(500).json({ error: 'Failed to add supplier' });
  }
};

const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      supplierName, email, phone, address, city, state, pincode, country,
      paymentTerms, currency, supplier_type, gst_number, gst_verified, gst_trade_name,
      gst_legal_name, gst_status, gst_state_code, pan_number,
      contact_person, alt_phone, website, bank_name, bank_account, bank_ifsc
    } = req.body;
    await executeQuery(
      `UPDATE suppliers SET
        suppliername=$1, email=$2, phone=$3, address=$4, city=$5, state=$6, pincode=$7, country=$8,
        paymentterms=$9, currency=$10, supplier_type=$11, gst_number=$12, gst_verified=$13,
        gst_trade_name=$14, gst_legal_name=$15, gst_status=$16, gst_state_code=$17, pan_number=$18,
        contact_person=$19, alt_phone=$20, website=$21, bank_name=$22, bank_account=$23, bank_ifsc=$24
       WHERE supplierid=$25`,
      [supplierName, email, phone, address, city, state, pincode, country,
       paymentTerms, currency, supplier_type, gst_number, gst_verified || false,
       gst_trade_name, gst_legal_name, gst_status, gst_state_code, pan_number,
       contact_person, alt_phone, website, bank_name, bank_account, bank_ifsc, id]
    );
    res.json({ message: 'Supplier updated' });
  } catch (err) {
    logger.error('updateSupplier:', err.message);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
};

// ─── Invoices ─────────────────────────────────────────────────────────────────

const getInvoiceRecords = async (req, res) => {
  try {
    const { status } = req.query;
    const params = [];
    let where = '';
    if (status) { params.push(status); where = `WHERE i.status = $1`; }
    const result = await executeQuery(
      `SELECT i.invoiceid AS id, i.invoicenumber AS number, i.invoicedate AS date, i.duedate AS due_date,
              c.customername AS customer, i.totalamount AS total, i.paidamount AS paid,
              i.outstanding_amount, i.payment_status, i.invoice_type, i.supply_type, i.status
       FROM invoices i
       LEFT JOIN customers c ON c.customerid = i.customerid
       ${where} ORDER BY i.invoicedate DESC LIMIT 500`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getInvoiceRecords:', err.message);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

// Only unpaid / partially paid — critical fix per requirements
const getPendingInvoices = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT i.invoiceid AS id, i.invoicenumber AS number, i.invoicedate AS date, i.duedate AS due_date,
              c.customername AS customer, i.totalamount AS total, i.paidamount AS paid,
              i.outstanding_amount, i.payment_status,
              CASE WHEN i.duedate < NOW() THEN true ELSE false END AS is_overdue
       FROM invoices i
       LEFT JOIN customers c ON c.customerid = i.customerid
       WHERE i.is_fully_paid = false AND i.status NOT IN ('Draft','Cancelled')
       ORDER BY i.duedate ASC`
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getPendingInvoices:', err.message);
    res.status(500).json({ error: 'Failed to fetch pending invoices' });
  }
};

const createInvoice = async (req, res) => {
  try {
    const {
      invoiceDate, dueDate, customerId, sales_order_id, invoice_type, supply_type,
      lines, other_charges, billing_address, shipping_address, payment_terms, currency
    } = req.body;
    const userId = req.user.userId;

    if (!customerId || !lines || lines.length === 0) {
      return res.status(400).json({ error: 'customerId and at least one line are required' });
    }

    const invoiceNumber = await nextDocNumber('INVOICE') || `INV-${Date.now()}`;

    // Calculate totals from lines
    let subtotal = 0, cgst = 0, sgst = 0, igst = 0;
    for (const l of lines) {
      const taxable = Number(l.quantity) * Number(l.unit_price) - Number(l.discount_amount || 0);
      subtotal += taxable;
      cgst  += Number(l.cgst_amount  || 0);
      sgst  += Number(l.sgst_amount  || 0);
      igst  += Number(l.igst_amount  || 0);
    }
    const total = subtotal + cgst + sgst + igst + Number(other_charges || 0);

    const inv = await executeQuery(
      `INSERT INTO invoices
        (invoicenumber, invoicedate, duedate, customerid, subtotal, cgst_amount, sgst_amount, igst_amount,
         other_charges, totalamount, paidamount, outstanding_amount, payment_status, is_fully_paid,
         invoice_type, supply_type, sales_order_id, billing_address, shipping_address,
         payment_terms, currency, status, createdby, createddate)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,0,$10,'Unpaid',false,$11,$12,$13,$14,$15,$16,$17,'Draft',$18,NOW())
       RETURNING invoiceid AS id`,
      [invoiceNumber, invoiceDate || new Date(), dueDate || null, customerId,
       subtotal, cgst, sgst, igst, other_charges || 0, total,
       invoice_type || 'Tax Invoice', supply_type || 'Intra-State', sales_order_id || null,
       billing_address || null, shipping_address || null, payment_terms || null, currency || 'INR', userId]
    );
    const invId = inv.rows[0].id;

    // Insert lines
    for (const l of lines) {
      const taxable = Number(l.quantity) * Number(l.unit_price) - Number(l.discount_amount || 0);
      const line_total = taxable + Number(l.cgst_amount || 0) + Number(l.sgst_amount || 0) + Number(l.igst_amount || 0);
      await executeQuery(
        `INSERT INTO invoice_lines
          (invoice_id, item_id, description, hsn_code, quantity, unit_of_measure, unit_price,
           discount_amount, taxable_amount, cgst_rate, cgst_amount, sgst_rate, sgst_amount,
           igst_rate, igst_amount, line_total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [invId, l.item_id || null, l.description || null, l.hsn_code || null,
         l.quantity, l.unit_of_measure || 'NOS', l.unit_price,
         l.discount_amount || 0, taxable,
         l.cgst_rate || 0, l.cgst_amount || 0,
         l.sgst_rate || 0, l.sgst_amount || 0,
         l.igst_rate || 0, l.igst_amount || 0, line_total]
      );
    }

    logger.info(`Invoice created: ${invoiceNumber}`);
    res.status(201).json({ id: invId, invoice_number: invoiceNumber, message: 'Invoice created' });
  } catch (err) {
    logger.error('createInvoice:', err.message);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
};

const postInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const check = await executeQuery('SELECT status FROM invoices WHERE invoiceid=$1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
    if (check.rows[0].status === 'Posted') return res.status(400).json({ error: 'Invoice already posted' });
    await executeQuery(
      `UPDATE invoices SET status='Posted' WHERE invoiceid=$1`, [id]
    );
    res.json({ message: 'Invoice posted' });
  } catch (err) {
    logger.error('postInvoice:', err.message);
    res.status(500).json({ error: 'Failed to post invoice' });
  }
};

module.exports = {
  getCustomerList, getCustomerById, addCustomer, updateCustomer,
  getSupplierList, getSupplierById, addSupplier, updateSupplier,
  getInvoiceRecords, getPendingInvoices, createInvoice, postInvoice,
};
