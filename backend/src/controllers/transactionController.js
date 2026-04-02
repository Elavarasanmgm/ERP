const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get all customer records
 */
const getCustomerList = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT TOP 500 CustomerId, CustomerName, Email, Phone, City, Country, CreditLimit, CreatedDate
       FROM dbo.Customers
       ORDER BY CustomerName`
    );
    res.json(result.recordset);
  } catch (err) {
    logger.error('Error fetching customers:', err.message);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

/**
 * Get single customer details
 */
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await executeQuery(
      'SELECT * FROM dbo.Customers WHERE CustomerId = @id',
      { id: parseInt(id) }
    );
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    logger.error('Error fetching customer:', err.message);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
};

/**
 * Add new customer
 */
const addCustomer = async (req, res) => {
  try {
    const { customerName, email, phone, address, city, country, creditLimit } = req.body;

    if (!customerName) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const result = await executeQuery(
      `INSERT INTO dbo.Customers (CustomerName, Email, Phone, Address, City, Country, CreditLimit, CreatedDate)
       VALUES (@name, @email, @phone, @address, @city, @country, @credit, GETDATE())
       SELECT SCOPE_IDENTITY() as id`,
      {
        name: customerName,
        email: email || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        country: country || null,
        credit: creditLimit ? parseFloat(creditLimit) : 0,
      }
    );

    logger.info(`New customer added: ${customerName}`);
    res.status(201).json({ id: result.recordset[0].id, message: 'Customer added' });
  } catch (err) {
    logger.error('Error adding customer:', err.message);
    res.status(500).json({ error: 'Failed to add customer' });
  }
};

/**
 * Get all supplier records
 */
const getSupplierList = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT TOP 500 SupplierId, SupplierName, Email, Phone, City, Country, PaymentTerms, CreatedDate
       FROM dbo.Suppliers
       ORDER BY SupplierName`
    );
    res.json(result.recordset);
  } catch (err) {
    logger.error('Error fetching suppliers:', err.message);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
};

/**
 * Add new supplier
 */
const addSupplier = async (req, res) => {
  try {
    const { supplierName, email, phone, address, city, country, paymentTerms } = req.body;

    if (!supplierName) {
      return res.status(400).json({ error: 'Supplier name is required' });
    }

    const result = await executeQuery(
      `INSERT INTO dbo.Suppliers (SupplierName, Email, Phone, Address, City, Country, PaymentTerms, CreatedDate)
       VALUES (@name, @email, @phone, @address, @city, @country, @terms, GETDATE())
       SELECT SCOPE_IDENTITY() as id`,
      {
        name: supplierName,
        email: email || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        country: country || null,
        terms: paymentTerms || null,
      }
    );

    logger.info(`New supplier added: ${supplierName}`);
    res.status(201).json({ id: result.recordset[0].id, message: 'Supplier added' });
  } catch (err) {
    logger.error('Error adding supplier:', err.message);
    res.status(500).json({ error: 'Failed to add supplier' });
  }
};

/**
 * Get all invoices
 */
const getInvoiceRecords = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT TOP 500 i.InvoiceId, i.InvoiceNumber, i.InvoiceDate, i.DueDate,
        c.CustomerName, i.TotalAmount, i.PaidAmount, i.Status, i.CreatedDate
       FROM dbo.Invoices i
       LEFT JOIN dbo.Customers c ON c.CustomerId = i.CustomerId
       ORDER BY i.InvoiceDate DESC`
    );
    res.json(result.recordset);
  } catch (err) {
    logger.error('Error fetching invoices:', err.message);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

/**
 * Create new invoice
 */
const createInvoice = async (req, res) => {
  try {
    const { invoiceNumber, invoiceDate, dueDate, customerId, totalAmount } = req.body;
    const userId = req.user.userId;

    if (!invoiceNumber || !invoiceDate || !totalAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check invoice number uniqueness
    const check = await executeQuery(
      'SELECT InvoiceId FROM dbo.Invoices WHERE InvoiceNumber = @num',
      { num: invoiceNumber }
    );

    if (check.recordset.length > 0) {
      return res.status(400).json({ error: 'Invoice number already exists' });
    }

    const result = await executeQuery(
      `INSERT INTO dbo.Invoices (InvoiceNumber, InvoiceDate, DueDate, CustomerId, TotalAmount, PaidAmount, Status, CreatedBy, CreatedDate)
       VALUES (@num, @invoice_date, @due_date, @cust, @total, 0, 'Draft', @user, GETDATE())
       SELECT SCOPE_IDENTITY() as id`,
      {
        num: invoiceNumber,
        invoice_date: invoiceDate,
        due_date: dueDate || null,
        cust: customerId ? parseInt(customerId) : null,
        total: parseFloat(totalAmount),
        user: userId,
      }
    );

    logger.info(`Invoice created: ${invoiceNumber}`);
    res.status(201).json({ id: result.recordset[0].id, message: 'Invoice created' });
  } catch (err) {
    logger.error('Error creating invoice:', err.message);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
};

module.exports = {
  getCustomerList,
  getCustomerById,
  addCustomer,
  getSupplierList,
  addSupplier,
  getInvoiceRecords,
  createInvoice,
};
