import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import '../accounting/Accounting.css';

const Timesheets = () => {
  const [timesheets, setTimesheets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    projectId: '',
    taskDate: new Date().toISOString().split('T')[0],
    hoursWorked: '',
    description: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sheetsRes, projectsRes] = await Promise.all([
        apiClient.get('/projects/timesheets'),
        apiClient.get('/projects/projects'),
      ]);
      setTimesheets(sheetsRes.data);
      setProjects(projectsRes.data);
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
    try {
      await apiClient.post('/projects/timesheets', formData);
      setFormData({
        projectId: '',
        taskDate: new Date().toISOString().split('T')[0],
        hoursWorked: '',
        description: '',
      });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create timesheet');
    }
  };

  return (
    <div className="accounting-section">
      <div className="section-header">
        <h2>Timesheets</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Log Time'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <select
            name="projectId"
            value={formData.projectId}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Project *</option>
            {projects.map((project) => (
              <option key={project.ProjectId} value={project.ProjectId}>
                {project.ProjectName}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="taskDate"
            value={formData.taskDate}
            onChange={handleInputChange}
            required
          />
          <input
            type="number"
            name="hoursWorked"
            placeholder="Hours Worked *"
            value={formData.hoursWorked}
            onChange={handleInputChange}
            step="0.5"
            required
          />
          <input
            type="text"
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleInputChange}
          />
          <button type="submit" className="btn btn-success">Log Time</button>
        </form>
      )}

      {loading ? (
        <p>Loading timesheets...</p>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Project</th>
                <th>Date</th>
                <th className="amount">Hours</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {timesheets.map((sheet) => (
                <tr key={sheet.TimesheetId}>
                  <td>{sheet.FirstName} {sheet.LastName}</td>
                  <td>{sheet.ProjectName || '-'}</td>
                  <td>{new Date(sheet.TaskDate).toLocaleDateString()}</td>
                  <td className="amount">{sheet.HoursWorked}</td>
                  <td>{sheet.Description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Timesheets;
