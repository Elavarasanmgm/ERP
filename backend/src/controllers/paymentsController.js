const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const { nextDocNumber } = require('./settingsController');

// ─── Payments ─────────────────────────────────────────────────────────────────

const getPayments = async (req, res) => {
  try {
    const { payment_type, party_type, status } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    if (payment_type) { params.push(payment_type); where += ` AND p.payment_type = $${params.length}`; }
    if (party_type)   { params.push(party_type);   where += ` AND p.party_type = $${params.length}`; }
    if (status)       { params.push(status);       where += ` AND p.status = $${params.length}`; }
    const result = await executeQuery(
      `SELECT p.id, p.payment_number, p.payment_date, p.payment_type, p.party_type, p.party_id,
              p.amount, p.currency, p.payment_mode, p.reference_number, p.status, p.notes,
              u.email AS created_by,
              CASE WHEN p.party_type = 'Customer' THEN c.customername
                   WHEN p.party_type = 'Supplier' THEN s.suppliername
                   ELSE NULL END AS party_name
       FROM payments p
       LEFT JOIN users u ON u.userid = p.created_by
       LEFT JOIN customers c ON c.customerid = p.party_id AND p.party_type = 'Customer'
       LEFT JOIN suppliers s ON s.supplierid = p.party_id AND p.party_type = 'Supplier'
       ${where} ORDER BY p.payment_date DESC LIMIT 500`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getPayments:', err.message);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await executeQuery('SELECT * FROM payments WHERE id=$1', [id]);
    if (payment.rows.length === 0) return res.status(404).json({ error: 'Payment not found' });
    const allocations = await executeQuery(
      `SELECT pa.id, pa.invoice_id, pa.allocated_amount, pa.allocation_date,
              i.invoicenumber AS invoice_number
       FROM payment_allocations pa
       JOIN invoices i ON i.invoiceid = pa.invoice_id
       WHERE pa.payment_id=$1`, [id]
    );
    res.json({ ...payment.rows[0], allocations: allocations.rows });
  } catch (err) {
    logger.error('getPaymentById:', err.message);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
};

const createPayment = async (req, res) => {
  try {
    const {
      payment_date, payment_type, party_type, party_id, amount, currency,
      payment_mode, reference_number, bank_account, notes
    } = req.body;
    const userId = req.user.userId;

    if (!payment_type || !party_type || !party_id || !amount) {
      return res.status(400).json({ error: 'payment_type, party_type, party_id and amount are required' });
    }
    if (!['Received', 'Made'].includes(payment_type)) {
      return res.status(400).json({ error: 'payment_type must be Received or Made' });
    }

    const paymentNumber = await nextDocNumber('PAYMENT') || `PAY-${Date.now()}`;
    const result = await executeQuery(
      `INSERT INTO payments
        (payment_number, payment_date, payment_type, party_type, party_id, amount, currency,
         payment_mode, reference_number, bank_account, status, notes, created_by, created_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'Draft',$11,$12,NOW()) RETURNING id`,
      [paymentNumber, payment_date || new Date(), payment_type, party_type, party_id, amount,
       currency || 'INR', payment_mode || 'Bank Transfer', reference_number || null,
       bank_account || null, notes || null, userId]
    );

    logger.info(`Payment created: ${paymentNumber}`);
    res.status(201).json({ id: result.rows[0].id, payment_number: paymentNumber, message: 'Payment created' });
  } catch (err) {
    logger.error('createPayment:', err.message);
    res.status(500).json({ error: 'Failed to create payment' });
  }
};

const postPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const pay = await executeQuery('SELECT * FROM payments WHERE id=$1', [id]);
    if (pay.rows.length === 0) return res.status(404).json({ error: 'Payment not found' });
    if (pay.rows[0].status === 'Posted') return res.status(400).json({ error: 'Payment already posted' });

    await executeQuery(
      `UPDATE payments SET status='Posted', posted_by=$1, posted_date=NOW() WHERE id=$2`,
      [userId, id]
    );
    logger.info(`Payment posted: ${pay.rows[0].payment_number}`);
    res.json({ message: 'Payment posted' });
  } catch (err) {
    logger.error('postPayment:', err.message);
    res.status(500).json({ error: 'Failed to post payment' });
  }
};

const allocatePayment = async (req, res) => {
  try {
    const { id } = req.params;  // payment id
    const { allocations } = req.body;  // [{ invoice_id, allocated_amount }]

    if (!allocations || allocations.length === 0) {
      return res.status(400).json({ error: 'allocations array is required' });
    }

    const pay = await executeQuery('SELECT amount, status FROM payments WHERE id=$1', [id]);
    if (pay.rows.length === 0) return res.status(404).json({ error: 'Payment not found' });

    let totalAllocated = 0;
    for (const a of allocations) {
      await executeQuery(
        `INSERT INTO payment_allocations (payment_id, invoice_id, allocated_amount, allocation_date)
         VALUES ($1,$2,$3,NOW())
         ON CONFLICT DO NOTHING`,
        [id, a.invoice_id, a.allocated_amount]
      );
      totalAllocated += Number(a.allocated_amount);

      // Update invoice paid amount and outstanding
      await executeQuery(
        `UPDATE invoices SET
           paidamount = COALESCE(paidamount,0) + $1,
           outstanding_amount = GREATEST(0, totalamount - (COALESCE(paidamount,0) + $1)),
           last_payment_date = NOW(),
           payment_status = CASE
             WHEN (COALESCE(paidamount,0) + $1) >= totalamount THEN 'Paid'
             WHEN (COALESCE(paidamount,0) + $1) > 0 THEN 'Partial'
             ELSE 'Unpaid'
           END,
           is_fully_paid = CASE WHEN (COALESCE(paidamount,0) + $1) >= totalamount THEN true ELSE false END
         WHERE invoiceid = $2`,
        [a.allocated_amount, a.invoice_id]
      );
    }

    res.json({ message: `Payment allocated to ${allocations.length} invoice(s)`, total_allocated: totalAllocated });
  } catch (err) {
    logger.error('allocatePayment:', err.message);
    res.status(500).json({ error: 'Failed to allocate payment' });
  }
};

// ─── Outstanding Reports ──────────────────────────────────────────────────────

const getCustomerOutstanding = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT c.customerid AS id, c.customername AS customer, c.email, c.phone,
              COUNT(i.invoiceid) AS invoice_count,
              SUM(i.totalamount) AS total_billed,
              SUM(i.paidamount) AS total_paid,
              SUM(i.outstanding_amount) AS total_outstanding,
              SUM(CASE WHEN i.duedate < NOW() THEN i.outstanding_amount ELSE 0 END) AS overdue_amount
       FROM customers c
       JOIN invoices i ON i.customerid = c.customerid
       WHERE i.is_fully_paid = false AND i.status NOT IN ('Draft','Cancelled')
       GROUP BY c.customerid, c.customername, c.email, c.phone
       HAVING SUM(i.outstanding_amount) > 0
       ORDER BY total_outstanding DESC`
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getCustomerOutstanding:', err.message);
    res.status(500).json({ error: 'Failed to fetch customer outstanding' });
  }
};

const getReceivablesAging = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT c.customername AS customer,
              SUM(CASE WHEN CURRENT_DATE - i.duedate::date <= 30  THEN COALESCE(i.outstanding_amount, i.totalamount - COALESCE(i.paidamount,0), 0) ELSE 0 END) AS "0_30",
              SUM(CASE WHEN CURRENT_DATE - i.duedate::date BETWEEN 31 AND 60  THEN COALESCE(i.outstanding_amount, i.totalamount - COALESCE(i.paidamount,0), 0) ELSE 0 END) AS "31_60",
              SUM(CASE WHEN CURRENT_DATE - i.duedate::date BETWEEN 61 AND 90  THEN COALESCE(i.outstanding_amount, i.totalamount - COALESCE(i.paidamount,0), 0) ELSE 0 END) AS "61_90",
              SUM(CASE WHEN CURRENT_DATE - i.duedate::date > 90              THEN COALESCE(i.outstanding_amount, i.totalamount - COALESCE(i.paidamount,0), 0) ELSE 0 END) AS "over_90",
              SUM(COALESCE(i.outstanding_amount, i.totalamount - COALESCE(i.paidamount,0), 0)) AS total
       FROM invoices i
       JOIN customers c ON c.customerid = i.customerid
       WHERE i.is_fully_paid = false AND i.status NOT IN ('Draft','Cancelled')
         AND i.duedate IS NOT NULL
       GROUP BY c.customername
       HAVING SUM(COALESCE(i.outstanding_amount, i.totalamount - COALESCE(i.paidamount,0), 0)) > 0
       ORDER BY total DESC`
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getReceivablesAging:', err.message);
    res.status(500).json({ error: 'Failed to fetch receivables aging' });
  }
};

module.exports = {
  getPayments, getPaymentById, createPayment, postPayment, allocatePayment,
  getCustomerOutstanding, getReceivablesAging,
};
