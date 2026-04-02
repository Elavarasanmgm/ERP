import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import '../accounting/Accounting.css';

const BillOfMaterials = () => {
  const [boms, setBoms] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ itemId: '', version: '1.0' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bomsRes, itemsRes] = await Promise.all([
        apiClient.get('/manufacturing/boms').catch(() => ({ data: [] })),
        apiClient.get('/inventory/items').catch(() => ({ data: [] })),
      ]);
      setBoms(bomsRes?.data || []);
      setItems(itemsRes?.data || []);
      setError('');
    } catch (err) {
      console.error(err);
      // Don't show error - allow form to work even if loading fails
      setBoms([]);
      setItems([]);
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
      await apiClient.post('/manufacturing/boms', formData);
      setFormData({ itemId: '', version: '1.0' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create BOM');
    }
  };

  return (
    <div className="accounting-section">
      <div className="section-header">
        <h2>Bill of Materials</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New BOM'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <select
            name="itemId"
            value={formData.itemId}
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
            type="text"
            name="version"
            placeholder="Version"
            value={formData.version}
            onChange={handleInputChange}
          />
          <button type="submit" className="btn btn-success">Create BOM</button>
        </form>
      )}

      {loading ? (
        <p>Loading BOMs...</p>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Item Name</th>
                <th>Version</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {boms.map((bom) => (
                <tr key={bom.BomId}>
                  <td>{bom.ItemCode}</td>
                  <td>{bom.ItemName}</td>
                  <td>{bom.Version}</td>
                  <td><span className="badge">{bom.Status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BillOfMaterials;
