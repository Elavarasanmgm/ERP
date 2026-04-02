import { useState } from 'react';
import SalesOrders from './orders/SalesOrders';
import PurchaseOrders from './orders/PurchaseOrders';
import './accounting/Accounting.css';

const Orders = () => {
  const [activeModule, setActiveModule] = useState('sales');

  const modules = [
    { id: 'sales', label: 'Sales Orders', icon: '📋' },
    { id: 'purchase', label: 'Purchase Orders', icon: '🛒' },
  ];

  const renderContent = () => {
    switch (activeModule) {
      case 'sales':
        return <SalesOrders />;
      case 'purchase':
        return <PurchaseOrders />;
      default:
        return <SalesOrders />;
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

export default Orders;
