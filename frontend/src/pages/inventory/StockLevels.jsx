import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import '../accounting/Accounting.css';

const StockLevels = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      const response = await apiClient.get('/inventory/stock');
      setStocks(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load stock levels');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="accounting-section">
      <div className="section-header">
        <h2>Stock Levels by Warehouse</h2>
        <button className="btn btn-secondary" onClick={fetchStocks}>Refresh</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <p>Loading stock levels...</p>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Item Name</th>
                <th>Warehouse</th>
                <th className="amount">Quantity</th>
                <th className="amount">Reorder Level</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock) => (
                <tr key={stock.StockId}>
                  <td>{stock.ItemCode}</td>
                  <td>{stock.ItemName}</td>
                  <td>{stock.WarehouseName}</td>
                  <td className="amount">
                    <strong>{stock.Quantity}</strong>
                  </td>
                  <td className="amount">{stock.ReorderLevel || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StockLevels;
