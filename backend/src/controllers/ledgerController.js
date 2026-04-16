const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

const getLedgerAccounts = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT accountid, accountcode, accountname, accounttype, balance, description
       FROM accounts WHERE isactive = TRUE ORDER BY accountcode`
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('Error fetching ledger accounts:', err.message);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
};

const getLedgerAccountById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await executeQuery(
      'SELECT * FROM accounts WHERE accountid = $1', [parseInt(id)]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Account not found' });
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Error fetching account:', err.message);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
};

const createLedgerAccount = async (req, res) => {
  try {
    const { accountCode, accountName, accountType, description } = req.body;
    if (!accountCode || !accountName || !accountType)
      return res.status(400).json({ error: 'Missing required fields' });

    const check = await executeQuery(
      'SELECT accountid FROM accounts WHERE accountcode = $1', [accountCode]
    );
    if (check.rows.length > 0) return res.status(400).json({ error: 'Account code already exists' });

    const result = await executeQuery(
      `INSERT INTO accounts (accountcode, accountname, accounttype, description, balance, isactive, createddate)
       VALUES ($1, $2, $3, $4, 0, TRUE, NOW()) RETURNING accountid AS id`,
      [accountCode, accountName, accountType, description || null]
    );
    logger.info(`New ledger account created: ${accountCode}`);
    res.status(201).json({ id: result.rows[0].id, message: 'Account created' });
  } catch (err) {
    logger.error('Error creating account:', err.message);
    res.status(500).json({ error: 'Failed to create account' });
  }
};

const updateLedgerAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountName, accountType, description } = req.body;
    if (!accountName || !accountType) return res.status(400).json({ error: 'Missing required fields' });

    await executeQuery(
      `UPDATE accounts SET accountname = $1, accounttype = $2, description = $3, updateddate = NOW()
       WHERE accountid = $4`,
      [accountName, accountType, description || null, parseInt(id)]
    );
    logger.info(`Ledger account updated: ${id}`);
    res.json({ message: 'Account updated' });
  } catch (err) {
    logger.error('Error updating account:', err.message);
    res.status(500).json({ error: 'Failed to update account' });
  }
};

const getJournalEntries = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT t.transactionid, t.transactiondate, t.description, t.amount,
              da.accountcode AS debitcode, da.accountname AS debitname,
              ca.accountcode AS creditcode, ca.accountname AS creditname,
              u.firstname, u.lastname, t.createddate
       FROM transactions t
       JOIN accounts da ON da.accountid = t.debitaccountid
       JOIN accounts ca ON ca.accountid = t.creditaccountid
       JOIN users u ON u.userid = t.createdby
       ORDER BY t.transactiondate DESC`
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('Error fetching journal entries:', err.message);
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
};

const createJournalEntry = async (req, res) => {
  try {
    const { transactionDate, description, amount, debitAccountId, creditAccountId } = req.body;
    const userId = req.user.userId;
    if (!transactionDate || !amount || !debitAccountId || !creditAccountId)
      return res.status(400).json({ error: 'Missing required fields' });

    const debitCheck  = await executeQuery('SELECT accountid FROM accounts WHERE accountid = $1', [parseInt(debitAccountId)]);
    const creditCheck = await executeQuery('SELECT accountid FROM accounts WHERE accountid = $1', [parseInt(creditAccountId)]);
    if (debitCheck.rows.length === 0 || creditCheck.rows.length === 0)
      return res.status(400).json({ error: 'Invalid account IDs' });

    await executeQuery(
      `INSERT INTO transactions (transactiondate, description, amount, debitaccountid, creditaccountid, createdby, createddate)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [transactionDate, description || null, parseFloat(amount), parseInt(debitAccountId), parseInt(creditAccountId), userId]
    );
    logger.info(`Journal entry created for user ${userId}`);
    res.status(201).json({ message: 'Journal entry created' });
  } catch (err) {
    logger.error('Error creating journal entry:', err.message);
    res.status(500).json({ error: 'Failed to create journal entry' });
  }
};

const getTrialBalance = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT accountcode, accountname, accounttype, balance
       FROM accounts WHERE isactive = TRUE ORDER BY accounttype, accountcode`
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('Error fetching trial balance:', err.message);
    res.status(500).json({ error: 'Failed to fetch trial balance' });
  }
};

const getIncomeStatement = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT accountcode, accountname, balance FROM accounts
       WHERE accounttype IN ('Income', 'Expense') AND isactive = TRUE
       ORDER BY accounttype DESC, accountcode`
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('Error fetching income statement:', err.message);
    res.status(500).json({ error: 'Failed to fetch income statement' });
  }
};

module.exports = { getLedgerAccounts, getLedgerAccountById, createLedgerAccount, updateLedgerAccount, getJournalEntries, createJournalEntry, getTrialBalance, getIncomeStatement };
