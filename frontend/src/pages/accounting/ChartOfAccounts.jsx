import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import './Accounting.css';

const ChartOfAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ accountCode: '', accountName: '', accountType: 'Asset', description: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await apiClient.get('/accounting/accounts');
      setAccounts(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load accounts');
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
      await apiClient.post('/accounting/accounts', formData);
      setFormData({ accountCode: '', accountName: '', accountType: 'Asset', description: '' });
      setShowForm(false);
      fetchAccounts();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account');
    }
  };

  return (
    <div className="accounting-section">
      <div className="section-header">
        <h2>Chart of Accounts</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Account'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <input
            type="text"
            name="accountCode"
            placeholder="Account Code (e.g., 1000)"
            value={formData.accountCode}
            onChange={handleInputChange}
            required
          />
          <input
            type="text"
            name="accountName"
            placeholder="Account Name"
            value={formData.accountName}
            onChange={handleInputChange}
            required
          />
          <select
            name="accountType"
            value={formData.accountType}
            onChange={handleInputChange}
          >
            <option value="Asset">Asset</option>
            <option value="Liability">Liability</option>
            <option value="Equity">Equity</option>
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
          </select>
          <input
            type="text"
            name="description"
            placeholder="Description (optional)"
            value={formData.description}
            onChange={handleInputChange}
          />
          <button type="submit" className="btn btn-success">Create Account</button>
        </form>
      )}

      {loading ? (
        <p>Loading accounts...</p>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Type</th>
                <th>Balance</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => (
                <tr key={acc.AccountId}>
                  <td>{acc.AccountCode}</td>
                  <td>{acc.AccountName}</td>
                  <td><span className="badge">{acc.AccountType}</span></td>
                  <td className="amount">${acc.Balance?.toFixed(2) || '0.00'}</td>
                  <td>{acc.Description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ChartOfAccounts;
