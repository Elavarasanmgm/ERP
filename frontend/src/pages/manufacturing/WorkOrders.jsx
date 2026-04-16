import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import '../accounting/Accounting.css';

const SkeletonRow = ({ cols }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i}>
        <div style={{ height: 14, borderRadius: 6, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
          backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', width: i === 0 ? '70%' : '90%' }} />
      </td>
    ))}
  </tr>
);

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

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/manufacturing/work-orders', formData);
      setFormData({ orderNumber: '', orderDate: new Date().toISOString().split('T')[0], dueDate: '', productItemId: '', quantity: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create work order');
    }
  };

  return (
    <div className="accounting-section">
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div className="section-header">
        <h2>Work Orders</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Order'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <input type="text" name="orderNumber" placeholder="Order Number *" value={formData.orderNumber} onChange={handleInputChange} required />
          <input type="date" name="orderDate" value={formData.orderDate} onChange={handleInputChange} required />
          <input type="date" name="dueDate" value={formData.dueDate} onChange={handleInputChange} />
          <select name="productItemId" value={formData.productItemId} onChange={handleInputChange} required>
            <option value="">Select Product Item *</option>
            {items.map((item) => (
              <option key={item.ItemId || item.id} value={item.ItemId || item.id}>
                {item.ItemCode || item.itemcode} - {item.ItemName || item.itemname}
              </option>
            ))}
          </select>
          <input type="number" name="quantity" placeholder="Quantity *" value={formData.quantity} onChange={handleInputChange} required />
          <button type="submit" className="btn btn-success">Create Work Order</button>
        </form>
      )}

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
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              : orders.map((order) => (
                <tr key={order.workorderid}>
                  <td><strong>{order.ordernumber}</strong></td>
                  <td>{order.orderdate ? new Date(order.orderdate).toLocaleDateString('en-IN') : '-'}</td>
                  <td>{order.itemcode} - {order.itemname}</td>
                  <td className="amount">{order.quantity}</td>
                  <td><span className="badge">{order.status}</span></td>
                  <td>{order.duedate ? new Date(order.duedate).toLocaleDateString('en-IN') : '-'}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WorkOrders;
