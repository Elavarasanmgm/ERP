import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';
import './Quality.css';
import LoadingBackdrop from '../components/Shared/LoadingBackdrop';

export default function Quality() {
  const [activeTab, setActiveTab] = useState('inspections');
  const [inspections, setInspections] = useState([]);
  const [nonConformances, setNonConformances] = useState([]);
  const [actions, setActions] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [newInspection, setNewInspection] = useState({
    inspectionType: '',
    itemId: '',
    inspectionDate: new Date().toISOString().split('T')[0],
    quantitySampled: 0,
    quantityAccepted: 0,
    quantityRejected: 0,
    remarks: ''
  });

  const [newNC, setNewNC] = useState({
    nonConformanceType: '',
    itemId: '',
    reportedDate: new Date().toISOString().split('T')[0],
    severity: 'Medium',
    description: '',
    dueDate: ''
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'inspections') {
        const res = await apiClient.get('/quality/inspections');
        setInspections(res.data);
      } else if (activeTab === 'non-conformances') {
        const res = await apiClient.get('/quality/non-conformances');
        setNonConformances(res.data);
      } else if (activeTab === 'actions') {
        const res = await apiClient.get('/quality/corrective-actions');
        setActions(res.data);
      } else if (activeTab === 'metrics') {
        const res = await apiClient.get('/quality/metrics');
        setMetrics(res.data);
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

  const handleAddInspection = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/quality/inspections', newInspection);
      setSuccessMessage('Inspection created');
      setNewInspection({
        inspectionType: '',
        itemId: '',
        inspectionDate: new Date().toISOString().split('T')[0],
        quantitySampled: 0,
        quantityAccepted: 0,
        quantityRejected: 0,
        remarks: ''
      });
      loadData();
    } catch (err) {
      setError('Failed to create inspection');
    }
  };

  const handleAddNC = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/quality/non-conformances', newNC);
      setSuccessMessage('Non-conformance created');
      setNewNC({
        nonConformanceType: '',
        itemId: '',
        reportedDate: new Date().toISOString().split('T')[0],
        severity: 'Medium',
        description: '',
        dueDate: ''
      });
      loadData();
    } catch (err) {
      setError('Failed to create non-conformance');
    }
  };

  return (
    <div className="module-container">
      <h1>✅ Quality Management</h1>
      
      <div className="module-nav">
        <button 
          className={`module-nav-item ${activeTab === 'inspections' ? 'active' : ''}`}
          onClick={() => setActiveTab('inspections')}
        >
          🔍 Inspections
        </button>
        <button 
          className={`module-nav-item ${activeTab === 'non-conformances' ? 'active' : ''}`}
          onClick={() => setActiveTab('non-conformances')}
        >
          ⚠️ NC
        </button>
        <button 
          className={`module-nav-item ${activeTab === 'actions' ? 'active' : ''}`}
          onClick={() => setActiveTab('actions')}
        >
          🎯 Actions
        </button>
        <button 
          className={`module-nav-item ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          📈 Metrics
        </button>
      </div>

      <div className="module-content">
        <LoadingBackdrop open={loading} />
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        {activeTab === 'inspections' && (
          <div>
            <h2>Quality Inspections</h2>
            <div className="form-card">
              <h3>Create Inspection</h3>
              <form onSubmit={handleAddInspection}>
                <div className="form-row">
                  <select value={newInspection.inspectionType} 
                    onChange={(e) => setNewInspection({...newInspection, inspectionType: e.target.value})} required>
                    <option value="">Select Type</option>
                    <option value="Incoming">Incoming</option>
                    <option value="In-process">In-process</option>
                    <option value="Final">Final</option>
                  </select>
                  <input type="number" placeholder="Item ID" value={newInspection.itemId} 
                    onChange={(e) => setNewInspection({...newInspection, itemId: e.target.value})} required />
                  <input type="date" value={newInspection.inspectionDate} 
                    onChange={(e) => setNewInspection({...newInspection, inspectionDate: e.target.value})} required />
                </div>
                <div className="form-row">
                  <input type="number" placeholder="Quantity Sampled" value={newInspection.quantitySampled} 
                    onChange={(e) => setNewInspection({...newInspection, quantitySampled: parseInt(e.target.value)})} required />
                  <input type="number" placeholder="Quantity Accepted" value={newInspection.quantityAccepted} 
                    onChange={(e) => setNewInspection({...newInspection, quantityAccepted: parseInt(e.target.value)})} required />
                  <input type="number" placeholder="Quantity Rejected" value={newInspection.quantityRejected} 
                    onChange={(e) => setNewInspection({...newInspection, quantityRejected: parseInt(e.target.value)})} />
                </div>
                <button type="submit" className="btn-primary">Create Inspection</button>
              </form>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Inspection #</th>
                    <th>Type</th>
                    <th>Item</th>
                    <th>Date</th>
                    <th>Accepted</th>
                    <th>Rejected</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inspections.map(insp => (
                    <tr key={insp.InspectionID}>
                      <td>{insp.InspectionNumber}</td>
                      <td>{insp.InspectionType}</td>
                      <td>{insp.ItemName}</td>
                      <td>{new Date(insp.InspectionDate).toLocaleDateString()}</td>
                      <td>{insp.QuantityAccepted}</td>
                      <td>{insp.QuantityRejected}</td>
                      <td><span className="badge">{insp.Status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'non-conformances' && (
          <div>
            <h2>Non-Conformances</h2>
            <div className="form-card">
              <h3>Report Non-Conformance</h3>
              <form onSubmit={handleAddNC}>
                <div className="form-row">
                  <input type="text" placeholder="NC Type" value={newNC.nonConformanceType} 
                    onChange={(e) => setNewNC({...newNC, nonConformanceType: e.target.value})} required />
                  <input type="number" placeholder="Item ID" value={newNC.itemId} 
                    onChange={(e) => setNewNC({...newNC, itemId: e.target.value})} required />
                  <input type="date" value={newNC.reportedDate} 
                    onChange={(e) => setNewNC({...newNC, reportedDate: e.target.value})} required />
                </div>
                <div className="form-row">
                  <select value={newNC.severity} onChange={(e) => setNewNC({...newNC, severity: e.target.value})}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                  <input type="date" placeholder="Due Date" value={newNC.dueDate} 
                    onChange={(e) => setNewNC({...newNC, dueDate: e.target.value})} />
                </div>
                <div className="form-row">
                  <textarea placeholder="Description" value={newNC.description} 
                    onChange={(e) => setNewNC({...newNC, description: e.target.value})} style={{minHeight: '80px'}}></textarea>
                </div>
                <button type="submit" className="btn-primary">Create NC</button>
              </form>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>NC #</th>
                    <th>Type</th>
                    <th>Item</th>
                    <th>Reported</th>
                    <th>Severity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {nonConformances.map(nc => (
                    <tr key={nc.NonConformanceID}>
                      <td>{nc.NCNumber}</td>
                      <td>{nc.NonConformanceType}</td>
                      <td>{nc.ItemName}</td>
                      <td>{new Date(nc.ReportedDate).toLocaleDateString()}</td>
                      <td><span className="badge">{nc.Severity}</span></td>
                      <td><span className="badge">{nc.Status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'actions' && (
          <div>
            <h2>Corrective Actions</h2>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Action #</th>
                    <th>Description</th>
                    <th>Assigned To</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {actions.map(act => (
                    <tr key={act.ActionID}>
                      <td>{act.ActionNumber}</td>
                      <td>{act.ActionDescription}</td>
                      <td>{act.AssignedTo}</td>
                      <td>{new Date(act.DueDate).toLocaleDateString()}</td>
                      <td><span className="badge">{act.Status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div>
            <h2>Quality Metrics</h2>
            <div className="metrics-display">
              <div className="metric-card">
                <h3>Total Inspections</h3>
                <p className="metric-value">{metrics.TotalInspections || 0}</p>
              </div>
              <div className="metric-card">
                <h3>Passed Inspections</h3>
                <p className="metric-value">{metrics.PassedInspections || 0}</p>
              </div>
              <div className="metric-card">
                <h3>Non-Conformances</h3>
                <p className="metric-value">{metrics.TotalNonConformances || 0}</p>
              </div>
              <div className="metric-card">
                <h3>Acceptance Rate</h3>
                <p className="metric-value">{parseFloat(metrics.AcceptanceRate || 0).toFixed(2)}%</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
