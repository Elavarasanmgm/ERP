import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';
import './Assets.css';

export default function Assets() {
  const [activeTab, setActiveTab] = useState('assets');
  const [assets, setAssets] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [assetReport, setAssetReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [newAsset, setNewAsset] = useState({
    assetCode: '',
    assetName: '',
    category: '',
    location: '',
    purchaseDate: '',
    purchasePrice: 0,
    depreciationMethod: 'Linear',
    usefulLife: 5
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'assets') {
        const res = await apiClient.get('/assets/assets');
        setAssets(res.data);
      } else if (activeTab === 'maintenance') {
        const res = await apiClient.get('/assets/maintenance');
        setMaintenance(res.data);
      } else if (activeTab === 'report') {
        const res = await apiClient.get('/assets/reports/assets');
        setAssetReport(res.data);
      }
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddAsset = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/assets/assets', newAsset);
      setSuccessMessage('Asset registered successfully');
      setNewAsset({
        assetCode: '',
        assetName: '',
        category: '',
        location: '',
        purchaseDate: '',
        purchasePrice: 0,
        depreciationMethod: 'Linear',
        usefulLife: 5
      });
      loadData();
    } catch (err) {
      setError('Failed to register asset');
    }
  };

  return (
    <div className="module-container">
      <h1>🏢 Fixed Assets</h1>
      
      <div className="module-nav">
        <button 
          className={`module-nav-item ${activeTab === 'assets' ? 'active' : ''}`}
          onClick={() => setActiveTab('assets')}
        >
          📋 Assets
        </button>
        <button 
          className={`module-nav-item ${activeTab === 'maintenance' ? 'active' : ''}`}
          onClick={() => setActiveTab('maintenance')}
        >
          🔧 Maintenance
        </button>
        <button 
          className={`module-nav-item ${activeTab === 'report' ? 'active' : ''}`}
          onClick={() => setActiveTab('report')}
        >
          📊 Report
        </button>
      </div>

      <div className="module-content">
        {loading && <div className="info-message">Loading...</div>}
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        {activeTab === 'assets' && (
          <div>
            <h2>Fixed Assets</h2>
            <div className="form-card">
              <h3>Register New Asset</h3>
              <form onSubmit={handleAddAsset}>
                <div className="form-row">
                  <input type="text" placeholder="Asset Code" value={newAsset.assetCode} 
                    onChange={(e) => setNewAsset({...newAsset, assetCode: e.target.value})} required />
                  <input type="text" placeholder="Asset Name" value={newAsset.assetName} 
                    onChange={(e) => setNewAsset({...newAsset, assetName: e.target.value})} required />
                  <input type="text" placeholder="Category" value={newAsset.category} 
                    onChange={(e) => setNewAsset({...newAsset, category: e.target.value})} required />
                </div>
                <div className="form-row">
                  <input type="text" placeholder="Location" value={newAsset.location} 
                    onChange={(e) => setNewAsset({...newAsset, location: e.target.value})} />
                  <input type="date" value={newAsset.purchaseDate} 
                    onChange={(e) => setNewAsset({...newAsset, purchaseDate: e.target.value})} required />
                  <input type="number" placeholder="Purchase Price" value={newAsset.purchasePrice} 
                    onChange={(e) => setNewAsset({...newAsset, purchasePrice: parseFloat(e.target.value)})} required />
                </div>
                <div className="form-row">
                  <select value={newAsset.depreciationMethod} onChange={(e) => setNewAsset({...newAsset, depreciationMethod: e.target.value})}>
                    <option value="Linear">Linear</option>
                    <option value="Declining">Declining Balance</option>
                  </select>
                  <input type="number" placeholder="Useful Life (years)" value={newAsset.usefulLife} 
                    onChange={(e) => setNewAsset({...newAsset, usefulLife: parseFloat(e.target.value)})} required />
                </div>
                <button type="submit" className="btn-primary">Register Asset</button>
              </form>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Purchase Price</th>
                    <th>Depreciation</th>
                    <th>Book Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map(asset => (
                    <tr key={asset.AssetID}>
                      <td>{asset.AssetCode}</td>
                      <td>{asset.AssetName}</td>
                      <td>{asset.Category}</td>
                      <td className="amount">${asset.PurchasePrice?.toFixed(2)}</td>
                      <td className="amount">${asset.Depreciation?.toFixed(2)}</td>
                      <td className="amount total-row">${asset.BookValue?.toFixed(2)}</td>
                      <td><span className="badge">{asset.Status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div>
            <h2>Asset Maintenance</h2>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Cost</th>
                    <th>Next Due</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenance.map(m => (
                    <tr key={m.MaintenanceID}>
                      <td>{m.AssetCode}</td>
                      <td>{m.MaintenanceType}</td>
                      <td>{new Date(m.MaintenanceDate).toLocaleDateString()}</td>
                      <td className="amount">${m.Cost?.toFixed(2)}</td>
                      <td>{new Date(m.NextDueDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div>
            <h2>Asset Summary by Category</h2>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Count</th>
                    <th>Total Cost</th>
                    <th>Total Depreciation</th>
                    <th>Total Book Value</th>
                  </tr>
                </thead>
                <tbody>
                  {assetReport.map((report, idx) => (
                    <tr key={idx} className="total-row">
                      <td>{report.Category}</td>
                      <td>{report.Count}</td>
                      <td className="amount">${report.TotalCost?.toFixed(2)}</td>
                      <td className="amount">${report.TotalDepreciation?.toFixed(2)}</td>
                      <td className="amount">${report.TotalBookValue?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
