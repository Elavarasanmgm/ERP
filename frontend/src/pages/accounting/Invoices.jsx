import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import './Accounting.css';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    customerId: '',
    totalAmount: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invoicesRes, customersRes] = await Promise.all([
        apiClient.get('/accounting/invoices'),
        apiClient.get('/accounting/customers'),
      ]);
      setInvoices(invoicesRes.data);
      setCustomers(customersRes.data);
      setError('');
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.invoiceNumber || !formData.totalAmount) {
      setError('Missing required fields');
      return;
    }

    try {
      await apiClient.post('/accounting/invoices', formData);
      setFormData({
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        customerId: '',
        totalAmount: '',
      });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create invoice');
    }
  };

  return (
    <div className="accounting-section">
      <div className="section-header">
        <h2>Invoices</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Invoice'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <input
            type="text"
            name="invoiceNumber"
            placeholder="Invoice Number *"
            value={formData.invoiceNumber}
            onChange={handleInputChange}
            required
          />
          <input
            type="date"
            name="invoiceDate"
            value={formData.invoiceDate}
            onChange={handleInputChange}
            required
          />
          <input
            type="date"
            name="dueDate"
            placeholder="Due Date"
            value={formData.dueDate}
            onChange={handleInputChange}
          />
          <select
            name="customerId"
            value={formData.customerId}
            onChange={handleInputChange}
          >
            <option value="">Select Customer (optional)</option>
            {customers.map((cust) => (
              <option key={cust.CustomerId} value={cust.CustomerId}>
                {cust.CustomerName}
              </option>
            ))}
          </select>
          <input
            type="number"
            name="totalAmount"
            placeholder="Total Amount *"
            value={formData.totalAmount}
            onChange={handleInputChange}
            step="0.01"
            required
          />
          <button type="submit" className="btn btn-success">Create Invoice</button>
        </form>
      )}

      {loading ? (
        <p>Loading invoices...</p>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Customer</th>
                <th className="amount">Total</th>
                <th className="amount">Paid</th>
                <th>Status</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.InvoiceId}>
                  <td><strong>{invoice.InvoiceNumber}</strong></td>
                  <td>{new Date(invoice.InvoiceDate).toLocaleDateString()}</td>
                  <td>{invoice.CustomerName || '-'}</td>
                  <td className="amount">${invoice.TotalAmount?.toFixed(2) || '0.00'}</td>
                  <td className="amount">${invoice.PaidAmount?.toFixed(2) || '0.00'}</td>
                  <td><span className="badge">{invoice.Status}</span></td>
                  <td>{invoice.DueDate ? new Date(invoice.DueDate).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Invoices;
