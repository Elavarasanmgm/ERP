import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import '../accounting/Accounting.css';

const SalesOrders = () => {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    orderNumber: '',
    orderDate: new Date().toISOString().split('T')[0],
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
      const [ordersRes, customersRes] = await Promise.all([
        apiClient.get('/orders/sales-orders'),
        apiClient.get('/accounting/customers'),
      ]);
      setOrders(ordersRes.data);
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
    try {
      await apiClient.post('/orders/sales-orders', formData);
      setFormData({
        orderNumber: '',
        orderDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        customerId: '',
        totalAmount: '',
      });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create order');
    }
  };

  return (
    <div className="accounting-section">
      <div className="section-header">
        <h2>Sales Orders</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Order'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <input
            type="text"
            name="orderNumber"
            placeholder="Order Number *"
            value={formData.orderNumber}
            onChange={handleInputChange}
            required
          />
          <input
            type="date"
            name="orderDate"
            value={formData.orderDate}
            onChange={handleInputChange}
            required
          />
          <input
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleInputChange}
          />
          <select
            name="customerId"
            value={formData.customerId}
            onChange={handleInputChange}
          >
            <option value="">Select Customer</option>
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
          <button type="submit" className="btn btn-success">Create Order</button>
        </form>
      )}

      {loading ? (
        <p>Loading orders...</p>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Customer</th>
                <th className="amount">Total</th>
                <th>Status</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.SalesOrderId}>
                  <td><strong>{order.OrderNumber}</strong></td>
                  <td>{new Date(order.OrderDate).toLocaleDateString()}</td>
                  <td>{order.CustomerName || '-'}</td>
                  <td className="amount">${order.TotalAmount?.toFixed(2) || '0.00'}</td>
                  <td><span className="badge">{order.Status}</span></td>
                  <td>{order.DueDate ? new Date(order.DueDate).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SalesOrders;
