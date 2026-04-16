const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const { respondWithFallback, respondFeatureUnavailable } = require('../utils/schemaFallback');

async function _findAccount(nameLike) {
  const r = await executeQuery(
    `SELECT accountid FROM accounts WHERE accountname ILIKE $1 AND isactive=true LIMIT 1`,
    [`%${nameLike}%`]
  );
  return r.rows.length > 0 ? r.rows[0].accountid : null;
}

// Get all employees
async function getEmployees(req, res) {
  try {
    const result = await executeQuery(
      `SELECT e.id AS "EmployeeID", e.employee_code AS "EmployeeCode", e.first_name AS "FirstName", 
              e.last_name AS "LastName", e.email AS "Email", e.phone AS "Phone",
              d.name AS "Department", e.designation AS "Position", e.date_of_joining AS "JoinDate", 
              e.salary AS "Salary", e.status AS "Status"
       FROM employees e
       LEFT JOIN departments d ON d.id = e.department_id
       ORDER BY e.employee_code`
    );
    res.json(result.rows);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching employees', error, []);
  }
}

async function getEmployeeById(req, res) {
  try {
    const result = await executeQuery(
      `SELECT e.id AS "EmployeeID", e.employee_code AS "EmployeeCode", e.first_name AS "FirstName", 
              e.last_name AS "LastName", e.email AS "Email", e.phone AS "Phone",
              d.name AS "Department", e.department_id AS "DepartmentID", e.designation AS "Position", 
              e.date_of_joining AS "JoinDate", e.salary AS "Salary", e.status AS "Status"
       FROM employees e LEFT JOIN departments d ON d.id = e.department_id
       WHERE e.id = $1`, [parseInt(req.params.id)]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
    res.json(result.rows[0]);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching employee', error, null);
  }
}

async function addEmployee(req, res) {
  try {
    const { employeeCode, firstName, lastName, email, phone, department, designation, position, joinDate, salary } = req.body;
    if (!employeeCode || !firstName || !lastName)
      return res.status(400).json({ error: 'Missing required fields: employeeCode, firstName, lastName' });

    // resolve department name → id
    let deptId = null;
    if (department) {
      const dr = await executeQuery(
        `INSERT INTO departments (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id`, [department]
      );
      if (dr.rows.length > 0) {
        deptId = dr.rows[0].id;
      } else {
        const dr2 = await executeQuery(`SELECT id FROM departments WHERE name=$1`, [department]);
        deptId = dr2.rows.length > 0 ? dr2.rows[0].id : null;
      }
    }

    await executeQuery(
      `INSERT INTO employees (employee_code, first_name, last_name, email, phone, department_id, designation, date_of_joining, salary, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Active')`,
      [employeeCode, firstName, lastName, email||null, phone||null, deptId, designation||position||null, joinDate||null, salary||0]
    );
    logger.info(`[HR] Created employee: ${employeeCode}`);
    res.status(201).json({ message: 'Employee created successfully' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Creating employee', error);
  }
}

async function updateEmployee(req, res) {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, department, designation, position, salary, status } = req.body;

    let deptId = null;
    if (department) {
      const dr = await executeQuery(
        `INSERT INTO departments (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id`, [department]
      );
      if (dr.rows.length > 0) {
        deptId = dr.rows[0].id;
      } else {
        const dr2 = await executeQuery(`SELECT id FROM departments WHERE name=$1`, [department]);
        deptId = dr2.rows.length > 0 ? dr2.rows[0].id : null;
      }
    }

    await executeQuery(
      `UPDATE employees SET first_name=$1, last_name=$2, email=$3, phone=$4,
       department_id=$5, designation=$6, salary=$7, status=$8 WHERE id=$9`,
      [firstName, lastName, email||null, phone||null, deptId, designation||position||null, parseFloat(salary||0), status||'Active', parseInt(id)]
    );
    res.json({ message: 'Employee updated' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Updating employee', error);
  }
}

async function getAttendance(req, res) {
  try {
    const result = await executeQuery(
      `SELECT a.id AS "AttendanceID", a.employee_id AS "EmployeeID",
              e.first_name || ' ' || e.last_name AS "EmployeeName",
              a.attendance_date AS "AttendanceDate", a.status AS "Status", 
              a.check_in AS "CheckInTime", a.check_out AS "CheckOutTime", a.remarks AS "Remarks"
       FROM attendance a
       LEFT JOIN employees e ON e.id = a.employee_id
       ORDER BY a.attendance_date DESC`
    );
    res.json(result.rows);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching attendance', error, []);
  }
}

async function markAttendance(req, res) {
  try {
    const { employeeId, attendanceDate, status, checkIn, remarks } = req.body;
    if (!employeeId || !attendanceDate || !status)
      return res.status(400).json({ error: 'Missing required fields' });

    await executeQuery(
      `INSERT INTO attendance (employee_id, attendance_date, status, check_in, remarks)
       VALUES ($1,$2,$3,$4,$5)`,
      [parseInt(employeeId), attendanceDate, status, checkIn||null, remarks||null]
    );
    res.status(201).json({ message: 'Attendance marked successfully' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Marking attendance', error);
  }
}

async function updateAttendance(req, res) {
  try {
    const { id } = req.params;
    const { status, checkIn, checkOut, remarks } = req.body;
    await executeQuery(
      `UPDATE attendance SET status=$1, check_in=$2, check_out=$3, remarks=$4 WHERE id=$5`,
      [status, checkIn||null, checkOut||null, remarks||null, parseInt(id)]
    );
    res.json({ message: 'Attendance record updated' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Updating attendance', error);
  }
}

async function getLeaves(req, res) {
  try {
    const result = await executeQuery(
      `SELECT l.id AS "LeaveID", l.employee_id AS "EmployeeID",
              e.first_name || ' ' || e.last_name AS "EmployeeName",
              l.leave_type AS "LeaveType", l.from_date AS "StartDate", 
              l.to_date AS "EndDate", l.days AS "Days", l.reason AS "Reason", l.status AS "Status"
       FROM leaves l
       LEFT JOIN employees e ON e.id = l.employee_id
       ORDER BY l.from_date DESC`
    );
    res.json(result.rows);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching leaves', error, []);
  }
}

async function applyLeave(req, res) {
  try {
    const { employeeId, leaveType, startDate, endDate, days, reason } = req.body;
    if (!employeeId || !leaveType || !startDate || !endDate)
      return res.status(400).json({ error: 'Missing required fields' });

    await executeQuery(
      `INSERT INTO leaves (employee_id, leave_type, from_date, to_date, days, reason, status)
       VALUES ($1,$2,$3,$4,$5,$6,'Pending')`,
      [parseInt(employeeId), leaveType, startDate, endDate, parseInt(days||1), reason||null]
    );
    res.status(201).json({ message: 'Leave application submitted' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Applying leave', error);
  }
}

async function updateLeave(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['Approved','Rejected'].includes(status))
      return res.status(400).json({ error: 'Status must be Approved or Rejected' });
    await executeQuery(`UPDATE leaves SET status=$1 WHERE id=$2`, [status, parseInt(id)]);
    res.json({ message: `Leave ${status.toLowerCase()}` });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Updating leave', error);
  }
}

async function getPayroll(req, res) {
  try {
    const result = await executeQuery(
      `SELECT p.id AS "PayrollID", p.employee_id AS "EmployeeID",
              e.first_name || ' ' || e.last_name AS "EmployeeName",
              p.year || '-' || LPAD(p.month::text, 2, '0') AS "PayrollPeriod",
              p.basic_salary AS "BaseSalary", p.allowances AS "Allowances", 
              p.deductions AS "Deductions", p.net_salary AS "NetSalary", 
              p.status AS "Status", p.paid_on AS "PaidOn"
       FROM payroll p
       LEFT JOIN employees e ON e.id = p.employee_id
       ORDER BY p.year DESC, p.month DESC`
    );
    res.json(result.rows);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching payroll', error, []);
  }
}

async function createPayroll(req, res) {
  try {
    const { employeeId, month, year, payrollPeriod, baseSalary, allowances, deductions } = req.body;
    if (!employeeId || !baseSalary)
      return res.status(400).json({ error: 'Missing required fields' });

    // Accept either month+year or payrollPeriod (e.g. "2026-04" or "April 2026")
    let m = parseInt(month), y = parseInt(year);
    if (payrollPeriod && (!m || !y)) {
      // Try parsing "YYYY-MM" or "Month YYYY"
      const parts = payrollPeriod.split(/[\s-]+/);
      if (parts.length === 2) {
        if (!isNaN(parts[0]) && parts[0].length === 4) {
          y = parseInt(parts[0]); m = parseInt(parts[1]);
        } else if (!isNaN(parts[1]) && parts[1].length === 4) {
          y = parseInt(parts[1]); 
          // Simple month name to number if needed
          const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
          const monthIdx = months.findIndex(name => name.toLowerCase() === parts[0].toLowerCase());
          m = monthIdx !== -1 ? monthIdx + 1 : 1;
        }
      }
    }
    if (!m) m = new Date().getMonth() + 1;
    if (!y) y = new Date().getFullYear();

    const net = Number(baseSalary) + Number(allowances||0) - Number(deductions||0);
    const result = await executeQuery(
      `INSERT INTO payroll (employee_id, month, year, basic_salary, allowances, deductions, net_salary, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'Draft') RETURNING id`,
      [parseInt(employeeId), m, y, Number(baseSalary), Number(allowances||0), Number(deductions||0), net]
    );
    res.status(201).json({ id: result.rows[0].id, message: 'Payroll created', netSalary: net });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Creating payroll', error);
  }
}

async function postPayroll(req, res) {
  try {
    const { id } = req.params;
    await executeQuery(`UPDATE payroll SET status='Posted' WHERE id=$1`, [parseInt(id)]);
    res.json({ message: 'Payroll posted' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Posting payroll', error);
  }
}

module.exports = {
  getEmployees, getEmployeeById, addEmployee, updateEmployee,
  getAttendance, markAttendance, updateAttendance,
  getLeaves, applyLeave, updateLeave,
  getPayroll, createPayroll, postPayroll,
};
