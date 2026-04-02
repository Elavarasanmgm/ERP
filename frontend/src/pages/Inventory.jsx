import { useState } from 'react';
import Items from './inventory/Items';
import StockLevels from './inventory/StockLevels';
import './accounting/Accounting.css';

const Inventory = () => {
  const [activeModule, setActiveModule] = useState('items');

  const modules = [
    { id: 'items', label: 'Items', icon: '📦' },
    { id: 'stock', label: 'Stock Levels', icon: '📊' },
  ];

  const renderContent = () => {
    switch (activeModule) {
      case 'items':
        return <Items />;
      case 'stock':
        return <StockLevels />;
      default:
        return <Items />;
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

export default Inventory;
