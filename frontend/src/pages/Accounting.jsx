import { useState } from 'react';
import ChartOfAccounts from './accounting/ChartOfAccounts';
import JournalEntries from './accounting/JournalEntries';
import FinancialReports from './accounting/FinancialReports';
import Customers from './accounting/Customers';
import Invoices from './accounting/Invoices';
import './accounting/Accounting.css';

const Accounting = () => {
  const [activeModule, setActiveModule] = useState('chart-of-accounts');

  const modules = [
    { id: 'chart-of-accounts', label: 'Chart of Accounts', icon: '📊' },
    { id: 'journal-entries', label: 'Journal Entries', icon: '📝' },
    { id: 'financial-reports', label: 'Financial Reports', icon: '📈' },
    { id: 'customers', label: 'Customers', icon: '👥' },
    { id: 'invoices', label: 'Invoices', icon: '🧾' },
  ];

  const renderContent = () => {
    switch (activeModule) {
      case 'chart-of-accounts':
        return <ChartOfAccounts />;
      case 'journal-entries':
        return <JournalEntries />;
      case 'financial-reports':
        return <FinancialReports />;
      case 'customers':
        return <Customers />;
      case 'invoices':
        return <Invoices />;
      default:
        return <ChartOfAccounts />;
    }
  };

  return (
    <div className="module-container">
      <div className="module-nav">
        {modules.map((module) => (
          <button
            key={module.id}
            className={`module-nav-item ${activeModule === module.id ? 'active' : ''}`}
            onClick={() => setActiveModule(module.id)}
          >
            <span>{module.icon}</span>
            {module.label}
          </button>
        ))}
      </div>
      <div className="module-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default Accounting;
