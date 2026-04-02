import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import '../accounting/Accounting.css';

const WorkOrders = () => {
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    orderNumber: '',
    orderDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    productItemId: '',
    quantity: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, itemsRes] = await Promise.all([
        apiClient.get('/manufacturing/work-orders'),
        apiClient.get('/inventory/items'),
      ]);
      setOrders(ordersRes.data);
      setItems(itemsRes.data);
      setError('');
    } catch (err) {
      setError('Failed to load work orders');
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
      await apiClient.post('/manufacturing/work-orders', formData);
      setFormData({
        orderNumber: '',
        orderDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        productItemId: '',
        quantity: '',
      });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create work order');
    }
  };

  return (
    <div className="accounting-section">
      <div className="section-header">
        <h2>Work Orders</h2>
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
            name="productItemId"
            value={formData.productItemId}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Product Item *</option>
            {items.map((item) => (
              <option key={item.ItemId} value={item.ItemId}>
                {item.ItemCode} - {item.ItemName}
              </option>
            ))}
          </select>
          <input
            type="number"
            name="quantity"
            placeholder="Quantity *"
            value={formData.quantity}
            onChange={handleInputChange}
            required
          />
          <button type="submit" className="btn btn-success">Create Work Order</button>
        </form>
      )}

      {loading ? (
        <p>Loading work orders...</p>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Order Date</th>
                <th>Product</th>
                <th className="amount">Quantity</th>
                <th>Status</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.WorkOrderId}>
                  <td><strong>{order.OrderNumber}</strong></td>
                  <td>{new Date(order.OrderDate).toLocaleDateString()}</td>
                  <td>{order.ItemCode} - {order.ItemName}</td>
                  <td className="amount">{order.Quantity}</td>
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

export default WorkOrders;
