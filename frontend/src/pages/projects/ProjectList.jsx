import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import '../accounting/Accounting.css';
import LoadingBackdrop from '../../components/Shared/LoadingBackdrop';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ projectName: '', projectCode: '', startDate: '', endDate: '', description: '' });
  const [error, setError] = useState('');

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/projects/projects');
      setProjects(response.data);
      setError('');
    } catch {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/projects/projects', formData);
      setFormData({ projectName: '', projectCode: '', startDate: '', endDate: '', description: '' });
      setShowForm(false);
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    }
  };

  return (
    <div className="accounting-section">
      <LoadingBackdrop open={loading} />
      <div className="section-header">
        <h2>Projects</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <input type="text" name="projectName" placeholder="Project Name *" value={formData.projectName} onChange={handleInputChange} required />
          <input type="text" name="projectCode" placeholder="Project Code *" value={formData.projectCode} onChange={handleInputChange} required />
          <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} />
          <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} />
          <input type="text" name="description" placeholder="Description" value={formData.description} onChange={handleInputChange} />
          <button type="submit" className="btn btn-success">Create Project</button>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th className="amount">Progress</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
                <tr key={project.ProjectId}>
                  <td><strong>{project.ProjectName}</strong></td>
                  <td>{project.ProjectCode}</td>
                  <td>{project.StartDate ? new Date(project.StartDate).toLocaleDateString('en-IN') : '-'}</td>
                  <td>{project.EndDate ? new Date(project.EndDate).toLocaleDateString('en-IN') : '-'}</td>
                  <td><span className="badge">{project.Status}</span></td>
                  <td className="amount">{project.Progress}%</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectList;
