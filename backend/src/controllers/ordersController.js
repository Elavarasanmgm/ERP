const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const { respondWithFallback, respondFeatureUnavailable } = require('../utils/schemaFallback');

/**
 * Internal helper: deduct stock for each SO line item.
 * Inserts a stock_movement record and reduces qty in stock table.
 */
async function _deductStockForSO(salesOrderId, userId) {
  const lines = await executeQuery(
    `SELECT od.itemid, od.quantity
     FROM salesorderdetails od WHERE od.salesorderid = $1`,
    [salesOrderId]
  );
  for (const line of lines.rows) {
    // Find the first warehouse that has enough stock
    const stockRow = await executeQuery(
      `SELECT stockid, warehouseid, quantity FROM stock
       WHERE itemid = $1 AND quantity >= $2 ORDER BY quantity DESC LIMIT 1`,
      [line.itemid, line.quantity]
    );
    if (stockRow.rows.length === 0) {
      // Not enough stock — still record the movement as negative (backorder scenario)
      const fallback = await executeQuery(
        `SELECT stockid, warehouseid FROM stock WHERE itemid = $1 ORDER BY quantity DESC LIMIT 1`,
        [line.itemid]
      );
      if (fallback.rows.length === 0) continue;
      const { warehouseid } = fallback.rows[0];
      await executeQuery(
        `UPDATE stock SET quantity = quantity - $1, lastupdated = NOW() WHERE itemid = $2 AND warehouseid = $3`,
        [line.quantity, line.itemid, warehouseid]
      );
      await executeQuery(
        `INSERT INTO stock_movements (item_id, warehouse_id, movement_type, quantity, reference_type, reference_id, moved_by, moved_date, notes)
         VALUES ($1,$2,'SALES_ISSUE',$3,'SO',$4,$5,NOW(),'Issued against Sales Order')`,
        [line.itemid, warehouseid, line.quantity, salesOrderId, userId]
      );
    } else {
      const { warehouseid } = stockRow.rows[0];
      await executeQuery(
        `UPDATE stock SET quantity = quantity - $1, lastupdated = NOW() WHERE itemid = $2 AND warehouseid = $3`,
        [line.quantity, line.itemid, warehouseid]
      );
      await executeQuery(
        `INSERT INTO stock_movements (item_id, warehouse_id, movement_type, quantity, reference_type, reference_id, moved_by, moved_date, notes)
         VALUES ($1,$2,'SALES_ISSUE',$3,'SO',$4,$5,NOW(),'Issued against Sales Order')`,
        [line.itemid, warehouseid, line.quantity, salesOrderId, userId]
      );
    }
  }
}

/**
 * Internal helper: post an auto journal entry (Draft, bypassing approval workflow)
 * for system-generated accounting entries.
 */
async function _postAutoJournal(userId, date, narration, referenceType, referenceNumber, lines) {
  // lines: [{ account_id, entry_type: 'DR'|'CR', amount }]
  const total = lines.filter(l => l.entry_type === 'DR').reduce((s, l) => s + Number(l.amount), 0);
  const jNum = `AUTO-${referenceType}-${Date.now()}`;
  const txn = await executeQuery(
    `INSERT INTO transactions
      (transactiondate, description, narration, amount, tax_amount, other_charges, total_amount,
       journal_number, status, createdby, createddate, reference_type, reference_number)
     VALUES ($1,$2,$3,$4,0,0,$4,$5,'Posted',$6,NOW(),$7,$8) RETURNING transactionid AS id`,
    [date || new Date(), narration, narration, total, jNum, userId, referenceType, referenceNumber]
  );
  const txnId = txn.rows[0].id;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    await executeQuery(
      `INSERT INTO journal_lines (transaction_id, account_id, entry_type, amount, tax_id, tax_amount, description, line_order)
       VALUES ($1,$2,$3,$4,NULL,0,$5,$6)`,
      [txnId, l.account_id, l.entry_type, l.amount, narration, i + 1]
    );
    // Update account balance
    const acc = await executeQuery('SELECT balance FROM accounts WHERE accountid=$1', [l.account_id]);
    if (acc.rows.length > 0) {
      const cur = Number(acc.rows[0].balance || 0);
      const nb = l.entry_type === 'DR' ? cur + Number(l.amount) : cur - Number(l.amount);
      await executeQuery('UPDATE accounts SET balance=$1 WHERE accountid=$2', [nb, l.account_id]);
      await executeQuery(
        `INSERT INTO ledger_entries (account_id, transaction_id, entry_type, amount, balance_after, entry_date)
         VALUES ($1,$2,$3,$4,$5,NOW())`,
        [l.account_id, txnId, l.entry_type, l.amount, nb]
      );
    }
  }
  return txnId;
}

/**
 * Internal helper: find an account by partial name match (case-insensitive).
 */
async function _findAccount(nameLike) {
  const r = await executeQuery(
    `SELECT accountid FROM accounts WHERE accountname ILIKE $1 AND isactive=true LIMIT 1`,
    [`%${nameLike}%`]
  );
  return r.rows.length > 0 ? r.rows[0].accountid : null;
}

/**
 * Get all sales orders
 */
const getSalesOrders = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT so.SalesOrderId AS sales_order_id, so.OrderNumber AS order_number, 
              so.OrderDate AS order_date, so.DeliveryDate AS due_date,
              so.CustomerId AS customer_id, c.CustomerName AS customer_name, 
              so.TotalAmount AS total_amount, so.Status AS status, so.CreatedDate AS created_date,
              so.customer_po_number, so.customer_po_date, so.advance_percent, so.currency
       FROM salesorders so
       LEFT JOIN customers c ON c.CustomerId = so.CustomerId
       ORDER BY so.OrderDate DESC`
    );
    res.json(result.rows);
  } catch (err) {
    return respondWithFallback(res, logger, 'Fetching sales orders', err, []);
  }
};

/**
 * Get single sales order with detail lines
 */
const getSalesOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const orderRes = await executeQuery(
      `SELECT so.SalesOrderId AS sales_order_id, so.OrderNumber AS order_number, 
              so.OrderDate AS order_date, so.DeliveryDate AS due_date,
              so.CustomerId AS customer_id, c.CustomerName AS customer_name, 
              so.TotalAmount AS total_amount, so.Status AS status,
              so.customer_po_number, so.customer_po_date, so.advance_percent, so.currency
       FROM salesorders so
       LEFT JOIN customers c ON c.CustomerId = so.CustomerId
       WHERE so.salesorderid = $1`,
      [parseInt(id)]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Sales order not found' });
    }

    const detailRes = await executeQuery(
      `SELECT od.OrderDetailId AS order_detail_id, od.ItemId AS item_id, i.ItemCode AS item_code,
              i.ItemName AS item_name, od.Quantity AS quantity, od.UnitPrice AS unit_price, od.LineTotal AS line_total
       FROM salesorderdetails od
       JOIN items i ON i.ItemId = od.ItemId
       WHERE od.SalesOrderId = $1`,
      [parseInt(id)]
    );

    res.json({
      order: orderRes.rows[0],
      details: detailRes.rows,
    });
  } catch (err) {
    return respondWithFallback(res, logger, 'Fetching sales order', err, null);
  }
};

/**
 * Create sales order
 */
const createSalesOrder = async (req, res) => {
  try {
    const { orderNumber, orderDate, dueDate, customerId, totalAmount, details, customer_po_number, customer_po_date, advance_percent, currency } = req.body;
    const userId = req.user.userId;

    if (!orderNumber || !orderDate || !totalAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const check = await executeQuery(
      'SELECT salesorderid FROM salesorders WHERE ordernumber = $1', [orderNumber]
    );
    if (check.rows.length > 0) return res.status(400).json({ error: 'Order number already exists' });

    const result = await executeQuery(
      `INSERT INTO salesorders (ordernumber, orderdate, deliverydate, customerid, totalamount, status, createdby, createddate, customer_po_number, customer_po_date, advance_percent, currency)
       VALUES ($1, $2, $3, $4, $5, 'Pending', $6, NOW(), $7, $8, $9, $10) RETURNING salesorderid AS id`,
      [orderNumber, orderDate, dueDate || null, customerId ? parseInt(customerId) : null, parseFloat(totalAmount), userId, customer_po_number || null, customer_po_date || null, advance_percent || 75.00, currency || 'INR']
    );

    const salesOrderId = result.rows[0].id;

    // Handle details
    if (details && Array.isArray(details)) {
      for (const item of details) {
        await executeQuery(
          `INSERT INTO salesorderdetails (salesorderid, itemid, quantity, unitprice, linetotal)
           VALUES ($1, $2, $3, $4, $5)`,
          [salesOrderId, item.item_id, item.quantity, item.unit_price, item.quantity * item.unit_price]
        );
      }
    }

    logger.info(`Sales order created: ${orderNumber}`);
    res.status(201).json({ id: salesOrderId, message: 'Sales order created' });
  } catch (err) {
    console.error(err);
    return respondFeatureUnavailable(res, logger, 'Creating sales order', err);
  }
};

/**
 * Confirm sales order → deduct inventory stock + post Sales journal entry
 */
const confirmSalesOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const soRes = await executeQuery(
      `SELECT salesorderid, ordernumber, totalamount, status FROM salesorders WHERE salesorderid=$1`,
      [parseInt(id)]
    );
    if (soRes.rows.length === 0) return res.status(404).json({ error: 'Sales order not found' });
    const so = soRes.rows[0];
    if (so.status === 'Confirmed') return res.status(400).json({ error: 'Order already confirmed' });

    // 1. Deduct stock for each line item
    await _deductStockForSO(parseInt(id), userId);

    // 2. Update SO status
    await executeQuery(
      `UPDATE salesorders SET status='Confirmed' WHERE salesorderid=$1`, [parseInt(id)]
    );

    // 3. Post accounting entry: Accounts Receivable DR / Sales Revenue CR
    const arAccount  = await _findAccount('Receivable');
    const revAccount = await _findAccount('Sales Revenue');
    if (arAccount && revAccount) {
      await _postAutoJournal(userId, new Date(), `Sales Order ${so.ordernumber} confirmed`, 'SO', so.ordernumber, [
        { account_id: arAccount,  entry_type: 'DR', amount: Number(so.totalamount) },
        { account_id: revAccount, entry_type: 'CR', amount: Number(so.totalamount) },
      ]);
    }

    logger.info(`Sales order ${so.ordernumber} confirmed — stock deducted`);
    res.json({ message: 'Sales order confirmed, stock deducted' });
  } catch (err) {
    return respondFeatureUnavailable(res, logger, 'Confirming sales order', err);
  }
};

/**
 * Get all purchase orders
 */
const getPurchaseOrders = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT po.purchaseorderid, po.ponumber AS ordernumber, po.orderdate, po.deliverydate AS duedate,
        s.suppliername, po.totalamount, po.status, po.createddate
       FROM purchaseorders po
       LEFT JOIN suppliers s ON s.supplierid = po.supplierid
       ORDER BY po.orderdate DESC`
    );
    res.json(result.rows);
  } catch (err) {
    return respondWithFallback(res, logger, 'Fetching purchase orders', err, []);
  }
};

/**
 * Create purchase order
 */
const createPurchaseOrder = async (req, res) => {
  try {
    const { orderNumber, orderDate, dueDate, supplierId, totalAmount } = req.body;
    const userId = req.user.userId;

    if (!orderNumber || !orderDate || !totalAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check order number uniqueness
    const check = await executeQuery(
      'SELECT purchaseorderid FROM purchaseorders WHERE ponumber = $1',
      [orderNumber]
    );

    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'Order number already exists' });
    }

    const result = await executeQuery(
      `INSERT INTO purchaseorders (ponumber, orderdate, deliverydate, supplierid, totalamount, status, createdby, createddate)
       VALUES ($1, $2, $3, $4, $5, 'Pending', $6, NOW())
       RETURNING purchaseorderid AS id`,
      [
        orderNumber,
        orderDate,
        dueDate || null,
        supplierId ? parseInt(supplierId) : null,
        parseFloat(totalAmount),
        userId,
      ]
    );

    const poId = result.rows[0].id;

    // Save detail lines if provided
    if (details && Array.isArray(details)) {
      for (const item of details) {
        await executeQuery(
          `INSERT INTO purchaseorderdetails (purchaseorderid, itemid, quantity, unitprice, linetotal)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT DO NOTHING`,
          [poId, item.item_id, item.quantity, item.unit_price, item.quantity * item.unit_price]
        );
      }
    }

    logger.info(`Purchase order created: ${orderNumber}`);
    res.status(201).json({ id: poId, message: 'Purchase order created' });
  } catch (err) {
    return respondFeatureUnavailable(res, logger, 'Creating purchase order', err);
  }
};

/**
 * Receive Purchase Order (GRN) → update inventory stock + post Accounts Payable journal
 */
const receivePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { warehouseId, receivedLines } = req.body;
    // receivedLines: [{ item_id, quantity, unit_cost }]
    const userId = req.user.userId;

    const poRes = await executeQuery(
      `SELECT purchaseorderid, ponumber, totalamount, status, supplierid FROM purchaseorders WHERE purchaseorderid=$1`,
      [parseInt(id)]
    );
    if (poRes.rows.length === 0) return res.status(404).json({ error: 'Purchase order not found' });
    const po = poRes.rows[0];
    if (po.status === 'Received') return res.status(400).json({ error: 'PO already received' });

    const wh = warehouseId || 1;
    let totalValue = 0;

    // 1. Update stock for each received line
    const lines = receivedLines && receivedLines.length > 0
      ? receivedLines
      : (await executeQuery(
          `SELECT itemid AS item_id, quantity, unitprice AS unit_cost FROM purchaseorderdetails WHERE purchaseorderid=$1`,
          [parseInt(id)]
        )).rows;

    for (const line of lines) {
      const qty  = Number(line.quantity);
      const cost = Number(line.unit_cost || 0);
      totalValue += qty * cost;

      const existing = await executeQuery(
        `SELECT stockid FROM stock WHERE itemid=$1 AND warehouseid=$2`,
        [line.item_id, wh]
      );
      if (existing.rows.length > 0) {
        await executeQuery(
          `UPDATE stock SET quantity = quantity + $1, unit_cost = $2, total_value = (quantity + $1) * $2, lastupdated = NOW()
           WHERE itemid = $3 AND warehouseid = $4`,
          [qty, cost, line.item_id, wh]
        );
      } else {
        await executeQuery(
          `INSERT INTO stock (itemid, warehouseid, quantity, opening_qty, unit_cost, total_value, lastupdated)
           VALUES ($1,$2,$3,0,$4,$5,NOW())`,
          [line.item_id, wh, qty, cost, qty * cost]
        );
      }
      await executeQuery(
        `INSERT INTO stock_movements (item_id, warehouse_id, movement_type, quantity, reference_type, reference_id, moved_by, moved_date, notes)
         VALUES ($1,$2,'PURCHASE_RECEIPT',$3,'PO',$4,$5,NOW(),'Received against PO')`,
        [line.item_id, wh, qty, id, userId]
      );
    }

    // 2. Update PO status
    await executeQuery(
      `UPDATE purchaseorders SET status='Received' WHERE purchaseorderid=$1`, [parseInt(id)]
    );

    // 3. Post accounting entry: Inventory / Stock DR, Accounts Payable CR
    const stockAccount = await _findAccount('Inventory') || await _findAccount('Stock');
    const apAccount    = await _findAccount('Payable');
    const amount = totalValue > 0 ? totalValue : Number(po.totalamount);
    if (stockAccount && apAccount) {
      await _postAutoJournal(userId, new Date(), `GRN for PO ${po.ponumber}`, 'PO', po.ponumber, [
        { account_id: stockAccount, entry_type: 'DR', amount },
        { account_id: apAccount,   entry_type: 'CR', amount },
      ]);
    }

    logger.info(`PO ${po.ponumber} received — stock updated, AP posted`);
    res.json({ message: 'Purchase order received, stock updated, payable posted' });
  } catch (err) {
    return respondFeatureUnavailable(res, logger, 'Receiving purchase order', err);
  }
};

const getSOTraceability = async (req, res) => {
  try {
    const soRes = await executeQuery(
      `SELECT so.salesorderid AS id,
              so.salesordernumber AS so_number,
              c.customername AS customer_name,
              so.orderdate AS order_date,
              so.totalamount AS total_amount,
              so.status
       FROM salesorders so
       LEFT JOIN customers c ON c.customerid = so.customerid
       ORDER BY so.orderdate DESC
       LIMIT 50`
    );

    const rows = await Promise.all(soRes.rows.map(async (so) => {
      // Work Orders linked to this SO
      const woRes = await executeQuery(
        `SELECT workordernumber FROM workorders WHERE salesorderid = $1 LIMIT 1`,
        [so.id]
      ).catch(() => ({ rows: [] }));

      // Invoices
      const invRes = await executeQuery(
        `SELECT invoicenumber FROM invoices WHERE salesorderid = $1 LIMIT 1`,
        [so.id]
      ).catch(() => ({ rows: [] }));

      // Payments
      const payRes = await executeQuery(
        `SELECT p.payment_reference FROM payments p
         JOIN invoices i ON i.invoiceid = p.invoice_id
         WHERE i.salesorderid = $1 LIMIT 1`,
        [so.id]
      ).catch(() => ({ rows: [] }));

      return {
        ...so,
        trace: {
          so:       { number: so.so_number, date: so.order_date },
          pi:       null,
          advance:  null,
          wo:       woRes.rows[0] ? { number: woRes.rows[0].workordernumber } : null,
          invoice:  invRes.rows[0] ? { number: invRes.rows[0].invoicenumber } : null,
          payment:  payRes.rows[0] ? { number: payRes.rows[0].payment_reference } : null,
          delivery: null,
        }
      };
    }));

    res.json(rows);
  } catch (err) {
    return respondWithFallback(res, logger, 'Fetching SO traceability', err, []);
  }
};

module.exports = {
  getSalesOrders,
  getSalesOrderById,
  createSalesOrder,
  confirmSalesOrder,
  getPurchaseOrders,
  createPurchaseOrder,
  receivePurchaseOrder,
  getSOTraceability,
};
