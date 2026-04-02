const { executeQuery, sql } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get all ledger accounts
 */
const getLedgerAccounts = async (req, res) => {
  try {
    const result = await executeQuery(
      'SELECT TOP 100 AccountId, AccountCode, AccountName, AccountType, Balance, Description FROM dbo.Accounts WHERE IsActive = 1 ORDER BY AccountCode'
    );
    res.json(result.recordset);
  } catch (err) {
    logger.error('Error fetching ledger accounts:', err.message);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
};

/**
 * Get single ledger account
 */
const getLedgerAccountById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await executeQuery(
      'SELECT * FROM dbo.Accounts WHERE AccountId = @id',
      { id: parseInt(id) }
    );
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    logger.error('Error fetching account:', err.message);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
};

/**
 * Create new ledger account
 */
const createLedgerAccount = async (req, res) => {
  try {
    const { accountCode, accountName, accountType, description } = req.body;

    if (!accountCode || !accountName || !accountType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if code already exists
    const check = await executeQuery(
      'SELECT AccountId FROM dbo.Accounts WHERE AccountCode = @code',
      { code: accountCode }
    );

    if (check.recordset.length > 0) {
      return res.status(400).json({ error: 'Account code already exists' });
    }

    const result = await executeQuery(
      `INSERT INTO dbo.Accounts (AccountCode, AccountName, AccountType, Description, Balance, IsActive, CreatedDate)
       VALUES (@code, @name, @type, @desc, 0, 1, GETDATE())
       SELECT SCOPE_IDENTITY() as id`,
      {
        code: accountCode,
        name: accountName,
        type: accountType,
        desc: description || null,
      }
    );

    logger.info(`New ledger account created: ${accountCode}`);
    res.status(201).json({ id: result.recordset[0].id, message: 'Account created' });
  } catch (err) {
    logger.error('Error creating account:', err.message);
    res.status(500).json({ error: 'Failed to create account' });
  }
};

/**
 * Update ledger account
 */
const updateLedgerAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountName, accountType, description } = req.body;

    if (!accountName || !accountType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await executeQuery(
      `UPDATE dbo.Accounts 
       SET AccountName = @name, AccountType = @type, Description = @desc, UpdatedDate = GETDATE()
       WHERE AccountId = @id`,
      {
        id: parseInt(id),
        name: accountName,
        type: accountType,
        desc: description || null,
      }
    );

    logger.info(`Ledger account updated: ${id}`);
    res.json({ message: 'Account updated' });
  } catch (err) {
    logger.error('Error updating account:', err.message);
    res.status(500).json({ error: 'Failed to update account' });
  }
};

/**
 * Get general journal book entries
 */
const getJournalEntries = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT TOP 500 
        t.TransactionId, t.TransactionDate, t.Description, t.Amount,
        da.AccountCode as DebitCode, da.AccountName as DebitName,
        ca.AccountCode as CreditCode, ca.AccountName as CreditName,
        u.FirstName, u.LastName, t.CreatedDate
       FROM dbo.Transactions t
       JOIN dbo.Accounts da ON da.AccountId = t.DebitAccountId
       JOIN dbo.Accounts ca ON ca.AccountId = t.CreditAccountId
       JOIN dbo.Users u ON u.UserId = t.CreatedBy
       ORDER BY t.TransactionDate DESC`
    );
    res.json(result.recordset);
  } catch (err) {
    logger.error('Error fetching journal entries:', err.message);
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
};

/**
 * Create journal book entry
 */
const createJournalEntry = async (req, res) => {
  try {
    const { transactionDate, description, amount, debitAccountId, creditAccountId } = req.body;
    const userId = req.user.userId;

    if (!transactionDate || !amount || !debitAccountId || !creditAccountId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate accounts exist
    const debitCheck = await executeQuery(
      'SELECT AccountId FROM dbo.Accounts WHERE AccountId = @id',
      { id: parseInt(debitAccountId) }
    );
    const creditCheck = await executeQuery(
      'SELECT AccountId FROM dbo.Accounts WHERE AccountId = @id',
      { id: parseInt(creditAccountId) }
    );

    if (debitCheck.recordset.length === 0 || creditCheck.recordset.length === 0) {
      return res.status(400).json({ error: 'Invalid account IDs' });
    }

    // Create transaction
    await executeQuery(
      `INSERT INTO dbo.Transactions (TransactionDate, Description, Amount, DebitAccountId, CreditAccountId, CreatedBy, CreatedDate)
       VALUES (@date, @desc, @amount, @debit, @credit, @user, GETDATE())`,
      {
        date: transactionDate,
        desc: description || null,
        amount: parseFloat(amount),
        debit: parseInt(debitAccountId),
        credit: parseInt(creditAccountId),
        user: userId,
      }
    );

    logger.info(`Journal entry created for user ${userId}`);
    res.status(201).json({ message: 'Journal entry created' });
  } catch (err) {
    logger.error('Error creating journal entry:', err.message);
    res.status(500).json({ error: 'Failed to create journal entry' });
  }
};

/**
 * Get trial balance
 */
const getTrialBalance = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT AccountCode, AccountName, AccountType, Balance
       FROM dbo.Accounts
       WHERE IsActive = 1
       ORDER BY AccountType, AccountCode`
    );
    res.json(result.recordset);
  } catch (err) {
    logger.error('Error fetching trial balance:', err.message);
    res.status(500).json({ error: 'Failed to fetch trial balance' });
  }
};

/**
 * Get income statement (P&L)
 */
const getIncomeStatement = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT AccountCode, AccountName, Balance
       FROM dbo.Accounts
       WHERE AccountType IN ('Income', 'Expense')
       AND IsActive = 1
       ORDER BY AccountType DESC, AccountCode`
    );
    res.json(result.recordset);
  } catch (err) {
    logger.error('Error fetching income statement:', err.message);
    res.status(500).json({ error: 'Failed to fetch income statement' });
  }
};

module.exports = {
  getLedgerAccounts,
  getLedgerAccountById,
  createLedgerAccount,
  updateLedgerAccount,
  getJournalEntries,
  createJournalEntry,
  getTrialBalance,
  getIncomeStatement,
};
