import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import '../accounting/Accounting.css';
import usePagination from '../../hooks/usePagination';
import ErpPagination from '../../components/Shared/ErpPagination';
import LoadingBackdrop from '../../components/Shared/LoadingBackdrop';

const SalesOrders = () => {
  const [orders, setOrders] = useState([]);
  const pagn = usePagination(orders, (item, q) =>
    (item.order_number || '').toLowerCase().includes(q) ||
    (item.customer_name || '').toLowerCase().includes(q));
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    orderNumber: '', orderDate: new Date().toISOString().split('T')[0],
    dueDate: '', customerId: '', totalAmount: '',
    customer_po_number: '', customer_po_date: '', advance_percent: 75, currency: 'INR'
  });
  const [error, setError] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, customersRes] = await Promise.all([
        apiClient.get('/orders/sales'),
        apiClient.get('/accounting/customers'),
      ]);
      setOrders(ordersRes.data);
      setCustomers(customersRes.data);
      setError('');
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/orders/sales', formData);
      setFormData({ orderNumber: '', orderDate: new Date().toISOString().split('T')[0], dueDate: '', customerId: '', totalAmount: '', customer_po_number: '', customer_po_date: '', advance_percent: 75, currency: 'INR' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create order');
    }
  };

  return (
    <div className="accounting-section">
      <LoadingBackdrop open={loading} />
      <div className="section-header">
        <h2>Sales Orders</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Order'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-row">
            <input type="text" name="orderNumber" placeholder="Order Number *" value={formData.orderNumber} onChange={handleInputChange} required />
            <input type="date" name="orderDate" title="Order Date" value={formData.orderDate} onChange={handleInputChange} required />
            <input type="date" name="dueDate" title="Due Date" value={formData.dueDate} onChange={handleInputChange} />
          </div>
          <div className="form-row">
            <select name="customerId" value={formData.customerId} onChange={handleInputChange} required>
              <option value="">Select Customer *</option>
              {customers.map((cust) => (
                <option key={cust.CustomerId || cust.customerid} value={cust.CustomerId || cust.customerid}>
                  {cust.CustomerName || cust.customername}
                </option>
              ))}
            </select>
            <input type="number" name="totalAmount" placeholder="Total Amount *" value={formData.totalAmount} onChange={handleInputChange} step="0.01" required />
            <input type="text" name="currency" placeholder="Currency (e.g. INR)" value={formData.currency} onChange={handleInputChange} />
          </div>
          <div className="form-row">
            <input type="text" name="customer_po_number" placeholder="Customer PO #" value={formData.customer_po_number} onChange={handleInputChange} />
            <input type="date" name="customer_po_date" title="Customer PO Date" value={formData.customer_po_date} onChange={handleInputChange} />
            <input type="number" name="advance_percent" placeholder="Advance %" title="Advance %" value={formData.advance_percent} onChange={handleInputChange} step="0.01" />
          </div>
          <button type="submit" className="btn btn-success" style={{ marginTop: '1rem' }}>Create Order</button>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Cust. PO #</th>
              <th className="amount">Total</th>
              <th>Status</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            {pagn.pageRows.map((order) => (
                <tr key={order.sales_order_id}>
                  <td><strong>{order.order_number}</strong></td>
                  <td>{order.order_date ? new Date(order.order_date).toLocaleDateString('en-IN') : '-'}</td>
                  <td>{order.customer_name || '-'}</td>
                  <td>{order.customer_po_number || '-'}</td>
                  <td className="amount">{order.currency || '₹'} {Number(order.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td><span className="badge">{order.status}</span></td>
                  <td>{order.due_date ? new Date(order.due_date).toLocaleDateString('en-IN') : '-'}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
      {!loading && <ErpPagination count={pagn.filtered.length} page={pagn.page} onPageChange={pagn.setPage} rowsPerPage={pagn.ROWS_PER_PAGE} />}
    </div>
  );
};

export default SalesOrders;
