import { useState } from 'react';
import BillOfMaterials from './manufacturing/BillOfMaterials';
import WorkOrders from './manufacturing/WorkOrders';
import './accounting/Accounting.css';

const Manufacturing = () => {
  const [activeModule, setActiveModule] = useState('bom');

  const modules = [
    { id: 'bom', label: 'Bill of Materials', icon: '📋' },
    { id: 'work-orders', label: 'Work Orders', icon: '⚙️' },
  ];

  const renderContent = () => {
    switch (activeModule) {
      case 'bom':
        return <BillOfMaterials />;
      case 'work-orders':
        return <WorkOrders />;
      default:
        return <BillOfMaterials />;
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

export default Manufacturing;
