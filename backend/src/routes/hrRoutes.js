const express = require('express');
const hrController = require('../controllers/hrController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(authenticateToken);

// Employees
router.get('/employees', hrController.getEmployees);
router.get('/employees/:id', hrController.getEmployeeById);
router.post('/employees', hrController.addEmployee);
router.put('/employees/:id', hrController.updateEmployee);

// Attendance
router.get('/attendance', hrController.getAttendance);
router.post('/attendance', hrController.markAttendance);
router.put('/attendance/:id', hrController.updateAttendance);

// Payroll
router.get('/payroll', hrController.getPayroll);
router.post('/payroll', hrController.createPayroll);
router.put('/payroll/:id/post', hrController.postPayroll);

// Leaves
router.get('/leaves', hrController.getLeaves);
router.post('/leaves', hrController.applyLeave);
router.put('/leaves/:id', hrController.updateLeave);

module.exports = router;
