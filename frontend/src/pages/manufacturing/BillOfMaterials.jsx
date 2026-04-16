import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import '../accounting/Accounting.css';

const SkeletonRow = ({ cols }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i}>
        <div style={{ height: 14, borderRadius: 6, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
          backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', width: i === 0 ? '60%' : '85%' }} />
      </td>
    ))}
  </tr>
);

const BillOfMaterials = () => {
  const [boms, setBoms] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ itemId: '', version: '1.0' });
  const [error, setError] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bomsRes, itemsRes] = await Promise.all([
        apiClient.get('/manufacturing/boms').catch(() => ({ data: [] })),
        apiClient.get('/inventory/items').catch(() => ({ data: [] })),
      ]);
      setBoms(bomsRes?.data || []);
      setItems(itemsRes?.data || []);
      setError('');
    } catch {
      setBoms([]); setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

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
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div className="section-header">
        <h2>Bill of Materials</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New BOM'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <select name="itemId" value={formData.itemId} onChange={handleInputChange} required>
            <option value="">Select Product Item *</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.code || item.itemcode} - {item.name || item.itemname}
              </option>
            ))}
          </select>
          <input type="text" name="version" placeholder="Version" value={formData.version} onChange={handleInputChange} />
          <button type="submit" className="btn btn-success">Create BOM</button>
        </form>
      )}

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
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={4} />)
              : boms.map((bom) => (
                <tr key={bom.bomid}>
                  <td>{bom.itemcode}</td>
                  <td>{bom.itemname}</td>
                  <td>{bom.version}</td>
                  <td><span className="badge">{bom.status}</span></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BillOfMaterials;
