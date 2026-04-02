import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import './Accounting.css';

const FinancialReports = () => {
  const [trialBalance, setTrialBalance] = useState([]);
  const [incomeStatement, setIncomeStatement] = useState([]);
  const [activeTab, setActiveTab] = useState('trial-balance');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const [tbRes, isRes] = await Promise.all([
        apiClient.get('/accounting/trial-balance'),
        apiClient.get('/accounting/income-statement'),
      ]);
      setTrialBalance(tbRes.data);
      setIncomeStatement(isRes.data);
      setError('');
    } catch (err) {
      setError('Failed to load reports');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalDebits = (data) => {
    return data.reduce((sum, item) => {
      if (['Asset', 'Expense', 'Debit'].includes(item.AccountType)) {
        return sum + (item.Balance || 0);
      }
      return sum;
    }, 0);
  };

  const calculateTotalCredits = (data) => {
    return data.reduce((sum, item) => {
      if (['Liability', 'Equity', 'Income', 'Credit'].includes(item.AccountType)) {
        return sum + (item.Balance || 0);
      }
      return sum;
    }, 0);
  };

  return (
    <div className="accounting-section">
      <div className="section-header">
        <h2>Financial Reports</h2>
        <button className="btn btn-secondary" onClick={fetchReports}>
          Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'trial-balance' ? 'active' : ''}`}
          onClick={() => setActiveTab('trial-balance')}
        >
          Trial Balance
        </button>
        <button
          className={`tab ${activeTab === 'income-statement' ? 'active' : ''}`}
          onClick={() => setActiveTab('income-statement')}
        >
          Income Statement (P&L)
        </button>
      </div>

      {loading ? (
        <p>Loading reports...</p>
      ) : (
        <>
          {activeTab === 'trial-balance' && (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Account Name</th>
                    <th>Type</th>
                    <th className="amount">Debit</th>
                    <th className="amount">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {trialBalance.map((item) => (
                    <tr key={item.AccountCode}>
                      <td>{item.AccountCode}</td>
                      <td>{item.AccountName}</td>
                      <td>{item.AccountType}</td>
                      <td className="amount">
                        {['Asset', 'Expense'].includes(item.AccountType)
                          ? `$${(item.Balance || 0).toFixed(2)}`
                          : '-'}
                      </td>
                      <td className="amount">
                        {['Liability', 'Equity', 'Income'].includes(item.AccountType)
                          ? `$${(item.Balance || 0).toFixed(2)}`
                          : '-'}
                      </td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan="3"><strong>TOTALS</strong></td>
                    <td className="amount">
                      <strong>${calculateTotalDebits(trialBalance).toFixed(2)}</strong>
                    </td>
                    <td className="amount">
                      <strong>${calculateTotalCredits(trialBalance).toFixed(2)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'income-statement' && (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Description</th>
                    <th className="amount">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeStatement
                    .filter((item) => item.AccountType === 'Income')
                    .map((item) => (
                      <tr key={item.AccountCode}>
                        <td>{item.AccountCode}</td>
                        <td>{item.AccountName}</td>
                        <td className="amount">${(item.Balance || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  <tr className="section-separator">
                    <td colSpan="3"><strong>Less: Expenses</strong></td>
                  </tr>
                  {incomeStatement
                    .filter((item) => item.AccountType === 'Expense')
                    .map((item) => (
                      <tr key={item.AccountCode}>
                        <td>{item.AccountCode}</td>
                        <td>{item.AccountName}</td>
                        <td className="amount">${(item.Balance || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  <tr className="total-row">
                    <td colSpan="2"><strong>Net Income/(Loss)</strong></td>
                    <td className="amount">
                      <strong>
                        $
                        {(
                          calculateTotalCredits(
                            incomeStatement.filter((i) => i.AccountType === 'Income')
                          ) - calculateTotalDebits(incomeStatement.filter((i) => i.AccountType === 'Expense'))
                        ).toFixed(2)}
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FinancialReports;
