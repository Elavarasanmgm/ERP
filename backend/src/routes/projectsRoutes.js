const express = require('express');
const router = express.Router();
const projectsController = require('../controllers/projectsController');
const { authenticateToken } = require('../middleware/auth');

/**
 * Project Routes
 */
router.get('/projects', authenticateToken, projectsController.getProjects);
router.get('/projects/:id', authenticateToken, projectsController.getProjectById);
router.post('/projects', authenticateToken, projectsController.createProject);

/**
 * Project Task Routes
 */
router.get('/projects/:projectId/tasks', authenticateToken, projectsController.getProjectTasks);
router.post('/projects/tasks/create', authenticateToken, projectsController.createProjectTask);

/**
 * Timesheet Routes
 */
router.get('/timesheets', authenticateToken, projectsController.getTimesheets);
router.post('/timesheets', authenticateToken, projectsController.createTimesheet);

module.exports = router;
