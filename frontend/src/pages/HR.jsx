import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';
import './HR.css';
import LoadingBackdrop from '../components/Shared/LoadingBackdrop';

export default function HR() {
  const [activeTab, setActiveTab] = useState('employees');
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [newEmployee, setNewEmployee] = useState({
    employeeCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    joinDate: '',
    salary: 0
  });

  const [newAttendance, setNewAttendance] = useState({
    employeeId: '',
    attendanceDate: new Date().toISOString().split('T')[0],
    status: 'Present',
    checkInTime: ''
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'employees') {
        const res = await apiClient.get('/hr/employees');
        setEmployees(res.data);
      } else if (activeTab === 'attendance') {
        const res = await apiClient.get('/hr/attendance');
        setAttendance(res.data);
      } else if (activeTab === 'payroll') {
        const res = await apiClient.get('/hr/payroll');
        setPayroll(res.data);
      } else if (activeTab === 'leaves') {
        const res = await apiClient.get('/hr/leaves');
        setLeaves(res.data);
      }
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/hr/employees', newEmployee);
      setSuccessMessage('Employee added successfully');
      setNewEmployee({
        employeeCode: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        joinDate: '',
        salary: 0
      });
      loadData();
    } catch (err) {
      setError('Failed to add employee');
    }
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/hr/attendance', newAttendance);
      setSuccessMessage('Attendance marked');
      setNewAttendance({
        employeeId: '',
        attendanceDate: new Date().toISOString().split('T')[0],
        status: 'Present',
        checkInTime: ''
      });
      loadData();
    } catch (err) {
      setError('Failed to mark attendance');
    }
  };

  return (
    <div className="module-container">
      <h1>👥 Human Resources</h1>
      
      <div className="module-nav">
        <button 
          className={`module-nav-item ${activeTab === 'employees' ? 'active' : ''}`}
          onClick={() => setActiveTab('employees')}
        >
          👤 Employees
        </button>
        <button 
          className={`module-nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          📅 Attendance
        </button>
        <button 
          className={`module-nav-item ${activeTab === 'payroll' ? 'active' : ''}`}
          onClick={() => setActiveTab('payroll')}
        >
          💰 Payroll
        </button>
        <button 
          className={`module-nav-item ${activeTab === 'leaves' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaves')}
        >
          🏖️ Leaves
        </button>
      </div>

      <div className="module-content">
        <LoadingBackdrop open={loading} />
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        {activeTab === 'employees' && (
          <div>
            <h2>Employees</h2>
            <div className="form-card">
              <h3>Add New Employee</h3>
              <form onSubmit={handleAddEmployee}>
                <div className="form-row">
                  <input type="text" placeholder="Employee Code" value={newEmployee.employeeCode} 
                    onChange={(e) => setNewEmployee({...newEmployee, employeeCode: e.target.value})} required />
                  <input type="text" placeholder="First Name" value={newEmployee.firstName} 
                    onChange={(e) => setNewEmployee({...newEmployee, firstName: e.target.value})} required />
                  <input type="text" placeholder="Last Name" value={newEmployee.lastName} 
                    onChange={(e) => setNewEmployee({...newEmployee, lastName: e.target.value})} required />
                </div>
                <div className="form-row">
                  <input type="email" placeholder="Email" value={newEmployee.email} 
                    onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})} required />
                  <input type="phone" placeholder="Phone" value={newEmployee.phone} 
                    onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})} />
                  <input type="text" placeholder="Department" value={newEmployee.department} 
                    onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})} required />
                </div>
                <div className="form-row">
                  <input type="text" placeholder="Position" value={newEmployee.position} 
                    onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})} />
                  <input type="date" value={newEmployee.joinDate} 
                    onChange={(e) => setNewEmployee({...newEmployee, joinDate: e.target.value})} required />
                  <input type="number" placeholder="Salary" value={newEmployee.salary} 
                    onChange={(e) => setNewEmployee({...newEmployee, salary: parseFloat(e.target.value)})} />
                </div>
                <button type="submit" className="btn-primary">Add Employee</button>
              </form>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Position</th>
                    <th>Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.EmployeeID}>
                      <td>{emp.EmployeeCode}</td>
                      <td>{emp.FirstName} {emp.LastName}</td>
                      <td>{emp.Email}</td>
                      <td>{emp.Department}</td>
                      <td>{emp.Position}</td>
                      <td className="amount">${emp.Salary?.toFixed(2) || '0.00'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div>
            <h2>Attendance</h2>
            <div className="form-card">
              <h3>Mark Attendance</h3>
              <form onSubmit={handleMarkAttendance}>
                <div className="form-row">
                  <input type="number" placeholder="Employee ID" value={newAttendance.employeeId} 
                    onChange={(e) => setNewAttendance({...newAttendance, employeeId: e.target.value})} required />
                  <input type="date" value={newAttendance.attendanceDate} 
                    onChange={(e) => setNewAttendance({...newAttendance, attendanceDate: e.target.value})} required />
                  <select value={newAttendance.status} 
                    onChange={(e) => setNewAttendance({...newAttendance, status: e.target.value})}>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                    <option value="Leave">Leave</option>
                  </select>
                </div>
                <div className="form-row">
                  <input type="time" placeholder="Check-in Time" value={newAttendance.checkInTime} 
                    onChange={(e) => setNewAttendance({...newAttendance, checkInTime: e.target.value})} />
                </div>
                <button type="submit" className="btn-primary">Mark Attendance</button>
              </form>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Check-in</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map(att => (
                    <tr key={att.AttendanceID}>
                      <td>{att.EmployeeName}</td>
                      <td>{new Date(att.AttendanceDate).toLocaleDateString()}</td>
                      <td><span className="badge">{att.Status}</span></td>
                      <td>{att.CheckInTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'payroll' && (
          <div>
            <h2>Payroll</h2>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Period</th>
                    <th>Base Salary</th>
                    <th>Allowances</th>
                    <th>Deductions</th>
                    <th>Net Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {payroll.map(p => (
                    <tr key={p.PayrollID}>
                      <td>{p.EmployeeName}</td>
                      <td>{p.PayrollPeriod}</td>
                      <td className="amount">${p.BaseSalary?.toFixed(2)}</td>
                      <td className="amount">${p.Allowances?.toFixed(2)}</td>
                      <td className="amount">${p.Deductions?.toFixed(2)}</td>
                      <td className="amount total-row">${p.NetSalary?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'leaves' && (
          <div>
            <h2>Leaves</h2>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>From Date</th>
                    <th>To Date</th>
                    <th>Days</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map(leave => (
                    <tr key={leave.LeaveID}>
                      <td>{leave.EmployeeName}</td>
                      <td>{leave.LeaveType}</td>
                      <td>{new Date(leave.StartDate).toLocaleDateString()}</td>
                      <td>{new Date(leave.EndDate).toLocaleDateString()}</td>
                      <td>{leave.Days}</td>
                      <td><span className="badge">{leave.Status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
