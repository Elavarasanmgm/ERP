import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import './Accounting.css';
import usePagination from '../../hooks/usePagination';
import ErpPagination from '../../components/Shared/ErpPagination';
import LoadingBackdrop from '../../components/Shared/LoadingBackdrop';

const Customers = () => {
  const [customers, setCustomers] = useState([]);

  const pagn = usePagination(customers, (item, q) => (item.name || '').toLowerCase().includes(q) || (item.customername || '').toLowerCase().includes(q) || (item.email || '').toLowerCase().includes(q));
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    creditLimit: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await apiClient.get('/accounting/customers');
      setCustomers(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load customers');
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
      await apiClient.post('/accounting/customers', formData);
      setFormData({
        customerName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        creditLimit: '',
      });
      setShowForm(false);
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add customer');
    }
  };

  return (
    <div className="accounting-section">
      <LoadingBackdrop open={loading} />
      <div className="section-header">
        <h2>Customers</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Customer'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <input
            type="text"
            name="customerName"
            placeholder="Customer Name *"
            value={formData.customerName}
            onChange={handleInputChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleInputChange}
          />
          <input
            type="text"
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleInputChange}
          />
          <input
            type="text"
            name="city"
            placeholder="City"
            value={formData.city}
            onChange={handleInputChange}
          />
          <input
            type="text"
            name="country"
            placeholder="Country"
            value={formData.country}
            onChange={handleInputChange}
          />
          <input
            type="number"
            name="creditLimit"
            placeholder="Credit Limit"
            value={formData.creditLimit}
            onChange={handleInputChange}
          />
          <button type="submit" className="btn btn-success">Add Customer</button>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>City</th>
              <th>Country</th>
              <th>Credit Limit</th>
            </tr>
          </thead>
          <tbody>
            {pagn.pageRows.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>{customer.email || '-'}</td>
                <td>{customer.phone || '-'}</td>
                <td>{customer.city || '-'}</td>
                <td>{customer.country || '-'}</td>
                <td className="amount">₹{Number(customer.creditlimit || 0).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Customers;
