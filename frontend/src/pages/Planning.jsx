import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';
import './Planning.css';

export default function Planning() {
  const [activeTab, setActiveTab] = useState('forecasts');
  const [forecasts, setForecasts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [plannedOrders, setPlannedOrders] = useState([]);
  const [mrpRuns, setMrpRuns] = useState([]);
  const [capacity, setCapacity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [newForecast, setNewForecast] = useState({
    itemId: '',
    forecastPeriod: '',
    forecastedQuantity: 0,
    confidenceLevel: 80,
    notes: ''
  });

  const [newPlan, setNewPlan] = useState({
    itemId: '',
    planPeriod: '',
    plannedQuantity: 0,
    startDate: '',
    endDate: ''
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'forecasts') {
        const res = await apiClient.get('/planning/forecasts');
        setForecasts(res.data);
      } else if (activeTab === 'plans') {
        const res = await apiClient.get('/planning/production-plans');
        setPlans(res.data);
      } else if (activeTab === 'orders') {
        const res = await apiClient.get('/planning/planned-orders');
        setPlannedOrders(res.data);
      } else if (activeTab === 'mrp') {
        const res = await apiClient.get('/planning/mrp-runs');
        setMrpRuns(res.data);
      } else if (activeTab === 'capacity') {
        const res = await apiClient.get('/planning/capacity');
        setCapacity(res.data);
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

  const handleAddForecast = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/planning/forecasts', newForecast);
      setSuccessMessage('Forecast created');
      setNewForecast({
        itemId: '',
        forecastPeriod: '',
        forecastedQuantity: 0,
        confidenceLevel: 80,
        notes: ''
      });
      loadData();
    } catch (err) {
      setError('Failed to create forecast');
    }
  };

  const handleAddPlan = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/planning/production-plans', newPlan);
      setSuccessMessage('Production plan created');
      setNewPlan({
        itemId: '',
        planPeriod: '',
        plannedQuantity: 0,
        startDate: '',
        endDate: ''
      });
      loadData();
    } catch (err) {
      setError('Failed to create plan');
    }
  };

  const handleExecuteMRP = async () => {
    try {
      const period = prompt('Enter planning period (e.g., 2026-Q1):');
      if (period) {
        await apiClient.post('/planning/mrp-runs', { planningPeriod: period });
        setSuccessMessage('MRP execution started');
        loadData();
      }
    } catch (err) {
      setError('Failed to execute MRP');
    }
  };

  return (
    <div className="module-container">
      <h1>📈 Planning & MRP</h1>
      
      <div className="module-nav">
        <button 
          className={`module-nav-item ${activeTab === 'forecasts' ? 'active' : ''}`}
          onClick={() => setActiveTab('forecasts')}
        >
          🎯 Forecasts
        </button>
        <button 
          className={`module-nav-item ${activeTab === 'plans' ? 'active' : ''}`}
          onClick={() => setActiveTab('plans')}
        >
          📋 Plans
        </button>
        <button 
          className={`module-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📦 Orders
        </button>
        <button 
          className={`module-nav-item ${activeTab === 'mrp' ? 'active' : ''}`}
          onClick={() => setActiveTab('mrp')}
        >
          ⚙️ MRP
        </button>
        <button 
          className={`module-nav-item ${activeTab === 'capacity' ? 'active' : ''}`}
          onClick={() => setActiveTab('capacity')}
        >
          🏭 Capacity
        </button>
      </div>

      <div className="module-content">
        {loading && <div className="info-message">Loading...</div>}
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        {activeTab === 'forecasts' && (
          <div>
            <h2>Demand Forecasts</h2>
            <div className="form-card">
              <h3>Create Forecast</h3>
              <form onSubmit={handleAddForecast}>
                <div className="form-row">
                  <input type="number" placeholder="Item ID" value={newForecast.itemId} 
                    onChange={(e) => setNewForecast({...newForecast, itemId: e.target.value})} required />
                  <input type="text" placeholder="Forecast Period (2026-Q1)" value={newForecast.forecastPeriod} 
                    onChange={(e) => setNewForecast({...newForecast, forecastPeriod: e.target.value})} required />
                  <input type="number" placeholder="Quantity" value={newForecast.forecastedQuantity} 
                    onChange={(e) => setNewForecast({...newForecast, forecastedQuantity: parseFloat(e.target.value)})} required />
                </div>
                <div className="form-row">
                  <input type="number" placeholder="Confidence Level (%)" value={newForecast.confidenceLevel} min="0" max="100"
                    onChange={(e) => setNewForecast({...newForecast, confidenceLevel: parseInt(e.target.value)})} />
                  <textarea placeholder="Notes" value={newForecast.notes} 
                    onChange={(e) => setNewForecast({...newForecast, notes: e.target.value})} style={{minHeight: '40px'}}></textarea>
                </div>
                <button type="submit" className="btn-primary">Create Forecast</button>
              </form>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Period</th>
                    <th>Quantity</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {forecasts.map(fc => (
                    <tr key={fc.ForecastID}>
                      <td>{fc.ItemName}</td>
                      <td>{fc.ForecastPeriod}</td>
                      <td>{fc.ForecastedQuantity}</td>
                      <td>{fc.ConfidenceLevel}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'plans' && (
          <div>
            <h2>Production Plans</h2>
            <div className="form-card">
              <h3>Create Production Plan</h3>
              <form onSubmit={handleAddPlan}>
                <div className="form-row">
                  <input type="number" placeholder="Item ID" value={newPlan.itemId} 
                    onChange={(e) => setNewPlan({...newPlan, itemId: e.target.value})} required />
                  <input type="text" placeholder="Plan Period (2026-Q1)" value={newPlan.planPeriod} 
                    onChange={(e) => setNewPlan({...newPlan, planPeriod: e.target.value})} required />
                  <input type="number" placeholder="Planned Quantity" value={newPlan.plannedQuantity} 
                    onChange={(e) => setNewPlan({...newPlan, plannedQuantity: parseFloat(e.target.value)})} required />
                </div>
                <div className="form-row">
                  <input type="date" value={newPlan.startDate} 
                    onChange={(e) => setNewPlan({...newPlan, startDate: e.target.value})} required />
                  <input type="date" value={newPlan.endDate} 
                    onChange={(e) => setNewPlan({...newPlan, endDate: e.target.value})} required />
                </div>
                <button type="submit" className="btn-primary">Create Plan</button>
              </form>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Plan #</th>
                    <th>Item</th>
                    <th>Period</th>
                    <th>Quantity</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map(plan => (
                    <tr key={plan.PlanID}>
                      <td>{plan.PlanNumber}</td>
                      <td>{plan.ItemName}</td>
                      <td>{plan.PlanPeriod}</td>
                      <td>{plan.PlannedQuantity}</td>
                      <td>{new Date(plan.StartDate).toLocaleDateString()}</td>
                      <td>{new Date(plan.EndDate).toLocaleDateString()}</td>
                      <td><span className="badge">{plan.Status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <h2>Planned Orders</h2>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Required Date</th>
                    <th>Planned Start</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {plannedOrders.map(order => (
                    <tr key={order.OrderID}>
                      <td>{order.OrderNumber}</td>
                      <td>{order.ItemName}</td>
                      <td>{order.OrderQuantity}</td>
                      <td>{new Date(order.RequiredDate).toLocaleDateString()}</td>
                      <td>{new Date(order.PlannedStartDate).toLocaleDateString()}</td>
                      <td><span className="badge">{order.Status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'mrp' && (
          <div>
            <h2>MRP Execution</h2>
            <div className="form-card">
              <button onClick={handleExecuteMRP} className="btn-primary">Execute MRP</button>
            </div>
            
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Run Date</th>
                    <th>Period</th>
                    <th>Orders Generated</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mrpRuns.map(run => (
                    <tr key={run.MRPRunID}>
                      <td>{new Date(run.MRPRunDate).toLocaleDateString()}</td>
                      <td>{run.PlanningPeriod}</td>
                      <td>{run.TotalOrders}</td>
                      <td><span className="badge">{run.Status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'capacity' && (
          <div>
            <h2>Capacity Planning</h2>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>Planned Capacity</th>
                    <th>Available</th>
                    <th>Utilization %</th>
                  </tr>
                </thead>
                <tbody>
                  {capacity.map(cap => (
                    <tr key={cap.ResourceID}>
                      <td>{cap.ResourceName}</td>
                      <td>{cap.PlannedCapacity}</td>
                      <td>{cap.AvailableCapacity}</td>
                      <td>{cap.UtilizationPercentage}%</td>
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
