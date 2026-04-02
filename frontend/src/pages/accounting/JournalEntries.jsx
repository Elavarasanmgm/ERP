import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import './Accounting.css';

const JournalEntries = () => {
  const [entries, setEntries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    transactionDate: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    debitAccountId: '',
    creditAccountId: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [entriesRes, accountsRes] = await Promise.all([
        apiClient.get('/accounting/journal'),
        apiClient.get('/accounting/accounts'),
      ]);
      setEntries(entriesRes.data);
      setAccounts(accountsRes.data);
      setError('');
    } catch (err) {
      setError('Failed to load data');
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
    if (!formData.amount || !formData.debitAccountId || !formData.creditAccountId) {
      setError('Please fill all required fields');
      return;
    }

    try {
      await apiClient.post('/accounting/journal', formData);
      setFormData({
        transactionDate: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        debitAccountId: '',
        creditAccountId: '',
      });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create entry');
    }
  };

  return (
    <div className="accounting-section">
      <div className="section-header">
        <h2>General Journal</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Entry'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <input
            type="date"
            name="transactionDate"
            value={formData.transactionDate}
            onChange={handleInputChange}
            required
          />
          <input
            type="text"
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleInputChange}
          />
          <input
            type="number"
            name="amount"
            placeholder="Amount *"
            value={formData.amount}
            onChange={handleInputChange}
            step="0.01"
            required
          />
          <select
            name="debitAccountId"
            value={formData.debitAccountId}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Debit Account *</option>
            {accounts.map((acc) => (
              <option key={acc.AccountId} value={acc.AccountId}>
                {acc.AccountCode} - {acc.AccountName}
              </option>
            ))}
          </select>
          <select
            name="creditAccountId"
            value={formData.creditAccountId}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Credit Account *</option>
            {accounts.map((acc) => (
              <option key={acc.AccountId} value={acc.AccountId}>
                {acc.AccountCode} - {acc.AccountName}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-success">Record Entry</button>
        </form>
      )}

      {loading ? (
        <p>Loading entries...</p>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Amount</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.TransactionId}>
                  <td>{new Date(entry.TransactionDate).toLocaleDateString()}</td>
                  <td>{entry.Description || '-'}</td>
                  <td>{entry.DebitCode} - {entry.DebitName}</td>
                  <td>{entry.CreditCode} - {entry.CreditName}</td>
                  <td className="amount">${entry.Amount?.toFixed(2) || '0.00'}</td>
                  <td>{entry.FirstName} {entry.LastName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default JournalEntries;
