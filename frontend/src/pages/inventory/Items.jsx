import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import '../accounting/Accounting.css';

const Items = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ itemCode: '', itemName: '', category: '', unitPrice: '', description: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await apiClient.get('/inventory/items');
      setItems(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load items');
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
      await apiClient.post('/inventory/items', formData);
      setFormData({ itemCode: '', itemName: '', category: '', unitPrice: '', description: '' });
      setShowForm(false);
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create item');
    }
  };

  return (
    <div className="accounting-section">
      <div className="section-header">
        <h2>Items Catalog</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Item'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <input
            type="text"
            name="itemCode"
            placeholder="Item Code *"
            value={formData.itemCode}
            onChange={handleInputChange}
            required
          />
          <input
            type="text"
            name="itemName"
            placeholder="Item Name *"
            value={formData.itemName}
            onChange={handleInputChange}
            required
          />
          <input
            type="text"
            name="category"
            placeholder="Category"
            value={formData.category}
            onChange={handleInputChange}
          />
          <input
            type="number"
            name="unitPrice"
            placeholder="Unit Price *"
            value={formData.unitPrice}
            onChange={handleInputChange}
            step="0.01"
            required
          />
          <input
            type="text"
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleInputChange}
          />
          <button type="submit" className="btn btn-success">Create Item</button>
        </form>
      )}

      {loading ? (
        <p>Loading items...</p>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Category</th>
                <th className="amount">Unit Price</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.ItemId}>
                  <td>{item.ItemCode}</td>
                  <td>{item.ItemName}</td>
                  <td>{item.Category || '-'}</td>
                  <td className="amount">${item.UnitPrice?.toFixed(2) || '0.00'}</td>
                  <td>{item.Description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Items;
