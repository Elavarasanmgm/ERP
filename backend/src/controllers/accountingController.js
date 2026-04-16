const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const { nextDocNumber } = require('./settingsController');

// ─── Chart of Accounts ────────────────────────────────────────────────────────

const getAccountsTree = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT accountid AS id, accountcode AS code, accountname AS name, accounttype AS type,
              account_group, account_level, is_group, parent_account_id,
              balance, opening_balance, opening_balance_type, isactive AS is_active
       FROM accounts ORDER BY accountcode`
    );
    // Build nested tree
    const map = {};
    result.rows.forEach(r => { map[r.id] = { ...r, children: [] }; });
    const tree = [];
    result.rows.forEach(r => {
      if (r.parent_account_id && map[r.parent_account_id]) {
        map[r.parent_account_id].children.push(map[r.id]);
      } else {
        tree.push(map[r.id]);
      }
    });
    res.json(tree);
  } catch (err) {
    logger.error('getAccountsTree:', err.message);
    res.status(500).json({ error: 'Failed to fetch accounts tree' });
  }
};

const getAccounts = async (req, res) => {
  try {
    const { type, is_group } = req.query;
    let where = 'WHERE isactive = true';
    const params = [];
    if (type) { params.push(type); where += ` AND accounttype = $${params.length}`; }
    if (is_group !== undefined) { params.push(is_group === 'true'); where += ` AND is_group = $${params.length}`; }
    const result = await executeQuery(
      `SELECT accountid AS id, accountcode AS code, accountname AS name, accounttype AS type,
              account_group, account_level, is_group, parent_account_id, balance
       FROM accounts ${where} ORDER BY accountcode`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getAccounts:', err.message);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
};

const createAccount = async (req, res) => {
  try {
    const { accountcode, accountname, accounttype, account_group, parent_account_id, opening_balance, opening_balance_type, is_group } = req.body;
    if (!accountcode || !accountname || !accounttype) return res.status(400).json({ error: 'accountcode, accountname, accounttype are required' });

    let level = 1;
    if (parent_account_id) {
      const parent = await executeQuery('SELECT account_level FROM accounts WHERE accountid=$1', [parent_account_id]);
      if (parent.rows.length > 0) level = parent.rows[0].account_level + 1;
    }
    const result = await executeQuery(
      `INSERT INTO accounts (accountcode, accountname, accounttype, account_group, parent_account_id,
        account_level, is_group, opening_balance, opening_balance_type, balance, isactive, createddate)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$8,true,NOW()) RETURNING accountid AS id`,
      [accountcode, accountname, accounttype, account_group || null, parent_account_id || null,
       level, is_group || false, opening_balance || 0, opening_balance_type || 'DR']
    );
    res.status(201).json({ id: result.rows[0].id, message: 'Account created' });
  } catch (err) {
    logger.error('createAccount:', err.message);
    res.status(500).json({ error: 'Failed to create account' });
  }
};

const getLedger = async (req, res) => {
  try {
    const { account_id } = req.params;
    const { from_date, to_date } = req.query;
    let where = 'WHERE l.account_id = $1';
    const params = [account_id];
    if (from_date) { params.push(from_date); where += ` AND l.entry_date >= $${params.length}`; }
    if (to_date)   { params.push(to_date);   where += ` AND l.entry_date <= $${params.length}`; }
    const result = await executeQuery(
      `SELECT l.id, l.entry_date, t.journal_number, t.narration, l.entry_type,
              l.amount, l.balance_after, l.narration AS line_narration
       FROM ledger_entries l
       LEFT JOIN transactions t ON t.transactionid = l.transaction_id
       ${where} ORDER BY l.entry_date, l.id`,
      params
    );
    const account = await executeQuery(
      `SELECT accountname AS name, accountcode AS code, balance FROM accounts WHERE accountid=$1`,
      [account_id]
    );
    res.json({ account: account.rows[0] || null, entries: result.rows });
  } catch (err) {
    logger.error('getLedger:', err.message);
    res.status(500).json({ error: 'Failed to fetch ledger' });
  }
};

// ─── Tax Master ───────────────────────────────────────────────────────────────

const getTaxes = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT t.id, t.tax_name, t.tax_type, t.tax_rate, t.is_active,
              a.accountname AS account_name
       FROM tax_master t
       LEFT JOIN accounts a ON a.accountid = t.account_id
       ORDER BY t.tax_type, t.tax_rate`
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getTaxes:', err.message);
    res.status(500).json({ error: 'Failed to fetch taxes' });
  }
};

const createTax = async (req, res) => {
  try {
    const { tax_name, tax_type, tax_rate, account_id } = req.body;
    if (!tax_name || !tax_type || tax_rate === undefined) return res.status(400).json({ error: 'tax_name, tax_type, tax_rate are required' });
    const result = await executeQuery(
      `INSERT INTO tax_master (tax_name, tax_type, tax_rate, account_id, is_active, created_date)
       VALUES ($1,$2,$3,$4,true,NOW()) RETURNING id`,
      [tax_name, tax_type, tax_rate, account_id || null]
    );
    res.status(201).json({ id: result.rows[0].id, message: 'Tax created' });
  } catch (err) {
    logger.error('createTax:', err.message);
    res.status(500).json({ error: 'Failed to create tax' });
  }
};

const updateTax = async (req, res) => {
  try {
    const { id } = req.params;
    const { tax_name, tax_type, tax_rate, account_id, is_active } = req.body;
    await executeQuery(
      `UPDATE tax_master SET tax_name=$1, tax_type=$2, tax_rate=$3, account_id=$4, is_active=$5 WHERE id=$6`,
      [tax_name, tax_type, tax_rate, account_id || null, is_active ?? true, id]
    );
    res.json({ message: 'Tax updated' });
  } catch (err) {
    logger.error('updateTax:', err.message);
    res.status(500).json({ error: 'Failed to update tax' });
  }
};

// ─── Financial Periods ────────────────────────────────────────────────────────

const getFinancialPeriods = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT fp.id, fp.period_name, fp.start_date, fp.end_date, fp.is_closed, fp.closed_date,
              u.email AS closed_by
       FROM financial_periods fp
       LEFT JOIN users u ON u.userid = fp.closed_by
       ORDER BY fp.start_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getFinancialPeriods:', err.message);
    res.status(500).json({ error: 'Failed to fetch financial periods' });
  }
};

const createFinancialPeriod = async (req, res) => {
  try {
    const { period_name, start_date, end_date } = req.body;
    if (!period_name || !start_date || !end_date) return res.status(400).json({ error: 'period_name, start_date, end_date are required' });
    const result = await executeQuery(
      `INSERT INTO financial_periods (period_name, start_date, end_date, is_closed)
       VALUES ($1,$2,$3,false) RETURNING id`,
      [period_name, start_date, end_date]
    );
    res.status(201).json({ id: result.rows[0].id, message: 'Financial period created' });
  } catch (err) {
    logger.error('createFinancialPeriod:', err.message);
    res.status(500).json({ error: 'Failed to create financial period' });
  }
};

const closePeriod = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const check = await executeQuery('SELECT is_closed FROM financial_periods WHERE id=$1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Period not found' });
    if (check.rows[0].is_closed) return res.status(400).json({ error: 'Period already closed' });
    await executeQuery(
      `UPDATE financial_periods SET is_closed=true, closed_by=$1, closed_date=NOW() WHERE id=$2`,
      [userId, id]
    );
    res.json({ message: 'Period closed' });
  } catch (err) {
    logger.error('closePeriod:', err.message);
    res.status(500).json({ error: 'Failed to close period' });
  }
};

// ─── Journal Entry (General Journal) ─────────────────────────────────────────

const getJournals = async (req, res) => {
  try {
    const { status, from_date, to_date } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    if (status) { params.push(status); where += ` AND t.status = $${params.length}`; }
    if (from_date) { params.push(from_date); where += ` AND t.transactiondate >= $${params.length}`; }
    if (to_date)   { params.push(to_date);   where += ` AND t.transactiondate <= $${params.length}`; }
    const result = await executeQuery(
      `SELECT t.transactionid AS id, t.journal_number, t.transactiondate AS date,
              t.narration, t.status, t.amount, t.tax_amount, t.other_charges, t.total_amount,
              u.email AS created_by
       FROM transactions t
       LEFT JOIN users u ON u.userid = t.createdby
       ${where} ORDER BY t.transactiondate DESC, t.transactionid DESC LIMIT 500`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getJournals:', err.message);
    res.status(500).json({ error: 'Failed to fetch journals' });
  }
};

const getJournalById = async (req, res) => {
  try {
    const { id } = req.params;
    const journal = await executeQuery(
      `SELECT t.transactionid AS id, t.journal_number, t.transactiondate AS date,
              t.narration, t.status, t.amount, t.tax_amount, t.other_charges, t.total_amount,
              t.is_reversed, t.reversed_by_id, t.reference_type, t.reference_number
       FROM transactions t WHERE t.transactionid = $1`, [id]
    );
    if (journal.rows.length === 0) return res.status(404).json({ error: 'Journal not found' });

    const lines = await executeQuery(
      `SELECT jl.id, jl.entry_type, jl.amount, jl.tax_amount, jl.description, jl.line_order,
              a.accountcode AS account_code, a.accountname AS account_name,
              tm.tax_name, tm.tax_rate
       FROM journal_lines jl
       JOIN accounts a ON a.accountid = jl.account_id
       LEFT JOIN tax_master tm ON tm.id = jl.tax_id
       WHERE jl.transaction_id = $1 ORDER BY jl.line_order`, [id]
    );
    const approvals = await executeQuery(
      `SELECT jal.action, jal.action_date, jal.remarks, u.email AS action_by
       FROM journal_approval_log jal
       LEFT JOIN users u ON u.userid = jal.action_by
       WHERE jal.transaction_id = $1 ORDER BY jal.action_date`, [id]
    );
    res.json({ ...journal.rows[0], lines: lines.rows, approval_log: approvals.rows });
  } catch (err) {
    logger.error('getJournalById:', err.message);
    res.status(500).json({ error: 'Failed to fetch journal' });
  }
};

const createJournal = async (req, res) => {
  try {
    const { date, narration, lines, other_charges, period_id } = req.body;
    const userId = req.user.userId;

    if (!lines || lines.length < 2) return res.status(400).json({ error: 'Minimum 2 journal lines required' });

    // Validate DR = CR
    const totalDr = lines.filter(l => l.entry_type === 'DR').reduce((s, l) => s + Number(l.amount), 0);
    const totalCr = lines.filter(l => l.entry_type === 'CR').reduce((s, l) => s + Number(l.amount), 0);
    if (Math.abs(totalDr - totalCr) > 0.01) return res.status(400).json({ error: `Journal must balance. DR=${totalDr}, CR=${totalCr}` });

    const journalNumber = await nextDocNumber('JOURNAL') || `JNL-${Date.now()}`;
    const totalTax = lines.reduce((s, l) => s + Number(l.tax_amount || 0), 0);

    const txn = await executeQuery(
      `INSERT INTO transactions
        (transactiondate, description, narration, amount, tax_amount, other_charges, total_amount,
         journal_number, status, createdby, createddate, period_id, reference_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Draft',$9,NOW(),$10,'JOURNAL') RETURNING transactionid AS id`,
      [date || new Date(), narration, narration, totalDr, totalTax, other_charges || 0,
       totalDr + totalTax + (other_charges || 0), journalNumber, userId, period_id || null]
    );
    const txnId = txn.rows[0].id;

    // Insert lines
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      await executeQuery(
        `INSERT INTO journal_lines (transaction_id, account_id, entry_type, amount, tax_id, tax_amount, description, line_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [txnId, l.account_id, l.entry_type, l.amount, l.tax_id || null, l.tax_amount || 0, l.description || null, i + 1]
      );
    }

    await executeQuery(
      `INSERT INTO journal_approval_log (transaction_id, action, action_by, action_date, remarks)
       VALUES ($1,'CREATED',$2,NOW(),'Journal created')`, [txnId, userId]
    );

    logger.info(`Journal created: ${journalNumber}`);
    res.status(201).json({ id: txnId, journal_number: journalNumber, message: 'Journal created as Draft' });
  } catch (err) {
    logger.error('createJournal:', err.message);
    res.status(500).json({ error: 'Failed to create journal' });
  }
};

const _journalWorkflow = async (req, res, action, allowedStatus, newStatus, field) => {
  const { id } = req.params;
  const { remarks } = req.body;
  const userId = req.user.userId;
  try {
    const check = await executeQuery('SELECT status FROM transactions WHERE transactionid=$1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Journal not found' });
    if (check.rows[0].status !== allowedStatus) {
      return res.status(400).json({ error: `Journal must be in '${allowedStatus}' status to ${action}` });
    }
    await executeQuery(
      `UPDATE transactions SET status=$1, ${field}=$2, ${field.replace('_by', '_date')}=NOW() WHERE transactionid=$3`,
      [newStatus, userId, id]
    );
    await executeQuery(
      `INSERT INTO journal_approval_log (transaction_id, action, action_by, action_date, remarks)
       VALUES ($1,$2,$3,NOW(),$4)`,
      [id, action.toUpperCase(), userId, remarks || null]
    );
    res.json({ message: `Journal ${action}d` });
  } catch (err) {
    logger.error(`journal ${action}:`, err.message);
    res.status(500).json({ error: `Failed to ${action} journal` });
  }
};

const submitJournal = (req, res) => _journalWorkflow(req, res, 'submit', 'Draft', 'Submitted', 'submitted_by');
const verifyJournal = (req, res) => _journalWorkflow(req, res, 'verify', 'Submitted', 'Verified', 'verified_by');

const postJournal = async (req, res) => {
  const { id } = req.params;
  const { remarks } = req.body;
  const userId = req.user.userId;
  try {
    const check = await executeQuery(
      `SELECT t.status, t.debitaccountid, t.creditaccountid, t.amount FROM transactions t WHERE transactionid=$1`, [id]
    );
    if (check.rows.length === 0) return res.status(404).json({ error: 'Journal not found' });
    if (check.rows[0].status !== 'Verified') return res.status(400).json({ error: 'Journal must be Verified before posting' });

    // Get journal lines
    const lines = await executeQuery(
      `SELECT account_id, entry_type, amount FROM journal_lines WHERE transaction_id=$1`, [id]
    );

    // Post to ledger — update account balance and insert ledger_entries
    for (const line of lines.rows) {
      const acc = await executeQuery('SELECT balance FROM accounts WHERE accountid=$1', [line.account_id]);
      const currentBalance = Number(acc.rows[0]?.balance || 0);
      const newBalance = line.entry_type === 'DR' ? currentBalance + Number(line.amount) : currentBalance - Number(line.amount);
      await executeQuery('UPDATE accounts SET balance=$1 WHERE accountid=$2', [newBalance, line.account_id]);
      await executeQuery(
        `INSERT INTO ledger_entries (account_id, transaction_id, entry_type, amount, balance_after, entry_date)
         VALUES ($1,$2,$3,$4,$5,NOW())`,
        [line.account_id, id, line.entry_type, line.amount, newBalance]
      );
    }

    await executeQuery(
      `UPDATE transactions SET status='Posted', posted_by=$1, posted_date=NOW() WHERE transactionid=$2`,
      [userId, id]
    );
    await executeQuery(
      `INSERT INTO journal_approval_log (transaction_id, action, action_by, action_date, remarks)
       VALUES ($1,'POSTED',$2,NOW(),$3)`,
      [id, userId, remarks || null]
    );
    res.json({ message: 'Journal posted to ledger' });
  } catch (err) {
    logger.error('postJournal:', err.message);
    res.status(500).json({ error: 'Failed to post journal' });
  }
};

const reverseJournal = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  try {
    const orig = await executeQuery(
      `SELECT * FROM transactions WHERE transactionid=$1 AND status='Posted'`, [id]
    );
    if (orig.rows.length === 0) return res.status(404).json({ error: 'Posted journal not found' });
    if (orig.rows[0].is_reversed) return res.status(400).json({ error: 'Journal already reversed' });

    const origLines = await executeQuery(
      `SELECT account_id, entry_type, amount, tax_id, tax_amount, description, line_order
       FROM journal_lines WHERE transaction_id=$1`, [id]
    );

    const revNumber = await nextDocNumber('JOURNAL') || `JNL-REV-${Date.now()}`;
    const revTxn = await executeQuery(
      `INSERT INTO transactions
        (transactiondate, description, narration, amount, journal_number, status, createdby, createddate, reference_type, reference_number)
       VALUES (NOW(),$1,$1,$2,$3,'Posted',$4,NOW(),'REVERSAL',$5) RETURNING transactionid AS id`,
      [`Reversal of ${orig.rows[0].journal_number}`, orig.rows[0].amount, revNumber, userId, String(id)]
    );
    const revId = revTxn.rows[0].id;

    for (const l of origLines.rows) {
      const revType = l.entry_type === 'DR' ? 'CR' : 'DR';
      await executeQuery(
        `INSERT INTO journal_lines (transaction_id, account_id, entry_type, amount, tax_id, tax_amount, description, line_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [revId, l.account_id, revType, l.amount, l.tax_id, l.tax_amount, l.description, l.line_order]
      );
    }

    await executeQuery(
      `UPDATE transactions SET is_reversed=true, reversed_by_id=$1 WHERE transactionid=$2`,
      [revId, id]
    );
    res.status(201).json({ id: revId, journal_number: revNumber, message: 'Reversal journal created' });
  } catch (err) {
    logger.error('reverseJournal:', err.message);
    res.status(500).json({ error: 'Failed to reverse journal' });
  }
};

const getPendingJournals = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT t.transactionid AS id, t.journal_number, t.transactiondate AS date,
              t.narration, t.status, t.total_amount, u.email AS created_by
       FROM transactions t
       LEFT JOIN users u ON u.userid = t.createdby
       WHERE t.status IN ('Submitted','Verified')
       ORDER BY t.transactiondate ASC`
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getPendingJournals:', err.message);
    res.status(500).json({ error: 'Failed to fetch pending journals' });
  }
};

// ─── GST Report ───────────────────────────────────────────────────────────────

const getGstReport = async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    const params = [from_date || '2026-04-01', to_date || '2027-03-31'];
    const result = await executeQuery(
      `SELECT
         SUM(cgst_amount) AS total_cgst,
         SUM(sgst_amount) AS total_sgst,
         SUM(igst_amount) AS total_igst,
         SUM(cgst_amount + sgst_amount + igst_amount) AS total_gst,
         COUNT(*) AS invoice_count,
         SUM(totalamount) AS total_taxable
       FROM invoices
       WHERE invoicedate BETWEEN $1 AND $2 AND status != 'Cancelled'`,
      params
    );
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('getGstReport:', err.message);
    res.status(500).json({ error: 'Failed to fetch GST report' });
  }
};

const getTrialBalance = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT accountcode AS code, accountname AS name, accounttype AS type, balance
       FROM accounts WHERE is_group = false AND isactive = true
       ORDER BY accountcode`
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getTrialBalance:', err.message);
    res.status(500).json({ error: 'Failed to fetch Trial Balance' });
  }
};

const getIncomeStatement = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT accountcode AS code, accountname AS name, accounttype AS type, balance
       FROM accounts
       WHERE accounttype IN ('Income', 'Expense') AND is_group = false AND isactive = true
       ORDER BY accounttype, accountcode`
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getIncomeStatement:', err.message);
    res.status(500).json({ error: 'Failed to fetch Income Statement' });
  }
};

module.exports = {
  getAccountsTree, getAccounts, createAccount, getLedger,
  getTaxes, createTax, updateTax,
  getFinancialPeriods, createFinancialPeriod, closePeriod,
  getJournals, getJournalById, createJournal,
  submitJournal, verifyJournal, postJournal, reverseJournal, getPendingJournals,
  getGstReport, getTrialBalance, getIncomeStatement,
};
