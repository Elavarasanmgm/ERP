import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import '../accounting/Accounting.css';
import usePagination from '../../hooks/usePagination';
import ErpPagination from '../../components/Shared/ErpPagination';
import LoadingBackdrop from '../../components/Shared/LoadingBackdrop';

const PurchaseOrders = () => {
  const [orders, setOrders] = useState([]);
  const pagn = usePagination(orders, (item, q) =>
    (item.ordernumber || '').toLowerCase().includes(q) ||
    (item.suppliername || '').toLowerCase().includes(q));
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    orderNumber: '', orderDate: new Date().toISOString().split('T')[0],
    dueDate: '', supplierId: '', totalAmount: '',
  });
  const [error, setError] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, suppliersRes] = await Promise.all([
        apiClient.get('/orders/purchase-orders'),
        apiClient.get('/accounting/suppliers'),
      ]);
      setOrders(ordersRes.data);
      setSuppliers(suppliersRes.data);
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
      await apiClient.post('/orders/purchase-orders', formData);
      setFormData({ orderNumber: '', orderDate: new Date().toISOString().split('T')[0], dueDate: '', supplierId: '', totalAmount: '' });
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
        <h2>Purchase Orders</h2>
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
          <select name="supplierId" value={formData.supplierId} onChange={handleInputChange}>
            <option value="">Select Supplier</option>
            {suppliers.map((supp) => (
              <option key={supp.SupplierId || supp.supplierid} value={supp.SupplierId || supp.supplierid}>
                {supp.SupplierName || supp.suppliername}
              </option>
            ))}
          </select>
          <input type="number" name="totalAmount" placeholder="Total Amount *" value={formData.totalAmount} onChange={handleInputChange} step="0.01" required />
          <button type="submit" className="btn btn-success">Create Order</button>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Date</th>
              <th>Supplier</th>
              <th className="amount">Total</th>
              <th>Status</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            {pagn.pageRows.map((order) => (
                <tr key={order.purchaseorderid}>
                  <td><strong>{order.ordernumber}</strong></td>
                  <td>{order.orderdate ? new Date(order.orderdate).toLocaleDateString('en-IN') : '-'}</td>
                  <td>{order.suppliername || '-'}</td>
                  <td className="amount">₹{Number(order.totalamount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td><span className="badge">{order.status}</span></td>
                  <td>{order.duedate ? new Date(order.duedate).toLocaleDateString('en-IN') : '-'}</td>
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

export default PurchaseOrders;
