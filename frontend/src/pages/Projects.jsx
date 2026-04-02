import { useState } from 'react';
import ProjectList from './projects/ProjectList';
import Timesheets from './projects/Timesheets';
import './accounting/Accounting.css';

const Projects = () => {
  const [activeModule, setActiveModule] = useState('projects');

  const modules = [
    { id: 'projects', label: 'Projects', icon: '📁' },
    { id: 'timesheets', label: 'Timesheets', icon: '⏱️' },
  ];

  const renderContent = () => {
    switch (activeModule) {
      case 'projects':
        return <ProjectList />;
      case 'timesheets':
        return <Timesheets />;
      default:
        return <ProjectList />;
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

export default Projects;
