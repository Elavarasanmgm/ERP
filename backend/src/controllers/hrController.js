const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const { respondWithFallback, respondFeatureUnavailable } = require('../utils/schemaFallback');

// HR & Payroll Module

// Get all employees
async function getEmployees(req, res) {
  try {
    const result = await executeQuery(`
      SELECT EmployeeID, EmployeeCode, FirstName, LastName, Email, Phone, 
             Department, Position, JoinDate, Salary, Status 
      FROM Employees 
      WHERE Status = 'Active'
      ORDER BY EmployeeCode
    `);
    logger.info(`[HR] Retrieved ${result.recordset.length} employees`);
    res.json(result.recordset);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching employees', error, []);
  }
}

// Get employee by ID
async function getEmployeeById(req, res) {
  try {
    const { id } = req.params;
    const result = await executeQuery(`
      SELECT EmployeeID, EmployeeCode, FirstName, LastName, Email, Phone, 
             Department, Position, JoinDate, Salary, Status 
      FROM Employees 
      WHERE EmployeeID = ${id}
    `);
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(result.recordset[0]);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching employee', error, null);
  }
}

// Add new employee
async function addEmployee(req, res) {
  try {
    const { employeeCode, firstName, lastName, email, phone, department, position, joinDate, salary } = req.body;
    
    if (!employeeCode || !firstName || !lastName || !department) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await executeQuery(`
      INSERT INTO Employees (EmployeeCode, FirstName, LastName, Email, Phone, Department, Position, JoinDate, Salary, Status, CreatedDate)
      VALUES ('${employeeCode}', '${firstName}', '${lastName}', '${email}', '${phone}', '${department}', '${position}', '${joinDate}', ${salary}, 'Active', GETDATE())
    `);
    
    logger.info(`[HR] Created employee: ${employeeCode}`);
    res.status(201).json({ message: 'Employee created successfully' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Creating employee', error);
  }
}

// Get attendance records
async function getAttendance(req, res) {
  try {
    const result = await executeQuery(`
      SELECT AttendanceID, EmployeeID, (SELECT FirstName + ' ' + LastName FROM Employees WHERE EmployeeID = a.EmployeeID) as EmployeeName,
             AttendanceDate, Status, CheckInTime, CheckOutTime
      FROM Attendance a
      ORDER BY AttendanceDate DESC
    `);
    logger.info(`[HR] Retrieved attendance records`);
    res.json(result.recordset);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching attendance', error, []);
  }
}

// Mark attendance
async function markAttendance(req, res) {
  try {
    const { employeeId, attendanceDate, status, checkInTime } = req.body;
    
    if (!employeeId || !attendanceDate || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await executeQuery(`
      INSERT INTO Attendance (EmployeeID, AttendanceDate, Status, CheckInTime, CreatedDate)
      VALUES (${employeeId}, '${attendanceDate}', '${status}', '${checkInTime}', GETDATE())
    `);
    
    logger.info(`[HR] Attendance marked for employee ${employeeId}`);
    res.status(201).json({ message: 'Attendance marked successfully' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Marking attendance', error);
  }
}

// Get payroll records
async function getPayroll(req, res) {
  try {
    const result = await executeQuery(`
      SELECT PayrollID, EmployeeID, (SELECT FirstName + ' ' + LastName FROM Employees WHERE EmployeeID = p.EmployeeID) as EmployeeName,
             PayrollPeriod, BaseSalary, Allowances, Deductions, NetSalary, Status
      FROM Payroll p
      ORDER BY PayrollPeriod DESC
    `);
    logger.info(`[HR] Retrieved payroll records`);
    res.json(result.recordset);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching payroll', error, []);
  }
}

// Create payroll
async function createPayroll(req, res) {
  try {
    const { employeeId, payrollPeriod, baseSalary, allowances, deductions } = req.body;
    const netSalary = baseSalary + allowances - deductions;
    
    if (!employeeId || !payrollPeriod || !baseSalary) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await executeQuery(`
      INSERT INTO Payroll (EmployeeID, PayrollPeriod, BaseSalary, Allowances, Deductions, NetSalary, Status, CreatedDate)
      VALUES (${employeeId}, '${payrollPeriod}', ${baseSalary}, ${allowances || 0}, ${deductions || 0}, ${netSalary}, 'Draft', GETDATE())
    `);
    
    logger.info(`[HR] Created payroll for employee ${employeeId}`);
    res.status(201).json({ message: 'Payroll created successfully', netSalary });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Creating payroll', error);
  }
}

// Get leave records
async function getLeaves(req, res) {
  try {
    const result = await executeQuery(`
      SELECT LeaveID, EmployeeID, (SELECT FirstName + ' ' + LastName FROM Employees WHERE EmployeeID = l.EmployeeID) as EmployeeName,
             LeaveType, StartDate, EndDate, Days, Reason, Status
      FROM Leaves l
      ORDER BY StartDate DESC
    `);
    logger.info(`[HR] Retrieved leave records`);
    res.json(result.recordset);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching leaves', error, []);
  }
}

// Apply for leave
async function applyLeave(req, res) {
  try {
    const { employeeId, leaveType, startDate, endDate, days, reason } = req.body;
    
    if (!employeeId || !leaveType || !startDate || !endDate || !days) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await executeQuery(`
      INSERT INTO Leaves (EmployeeID, LeaveType, StartDate, EndDate, Days, Reason, Status, CreatedDate)
      VALUES (${employeeId}, '${leaveType}', '${startDate}', '${endDate}', ${days}, '${reason}', 'Pending', GETDATE())
    `);
    
    logger.info(`[HR] Leave application created for employee ${employeeId}`);
    res.status(201).json({ message: 'Leave application submitted' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Applying leave', error);
  }
}

module.exports = {
  getEmployees,
  getEmployeeById,
  addEmployee,
  getAttendance,
  markAttendance,
  getPayroll,
  createPayroll,
  getLeaves,
  applyLeave
};
