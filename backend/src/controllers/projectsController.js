const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const { respondWithFallback, respondFeatureUnavailable } = require('../utils/schemaFallback');

/**
 * Get all projects
 */
const getProjects = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT TOP 500 ProjectId, ProjectName, CONCAT('PRJ-', ProjectId) AS ProjectCode, StartDate, EndDate,
        Status, CAST(0 AS INT) AS Progress, Description, CreatedDate
       FROM dbo.Projects
       ORDER BY StartDate DESC`
    );
    res.json(result.recordset);
  } catch (err) {
    return respondWithFallback(res, logger, 'Fetching projects', err, []);
  }
};

/**
 * Get project by ID
 */
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const projectRes = await executeQuery(
      'SELECT * FROM dbo.Projects WHERE ProjectId = @id',
      { id: parseInt(id) }
    );

    if (projectRes.recordset.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get project tasks
    const tasksRes = await executeQuery(
      `SELECT TaskId AS ProjectTaskId, TaskName, Status, Priority, AssignedTo, StartDate, EndDate, CAST(0 AS INT) AS Progress
       FROM dbo.ProjectTasks
       WHERE ProjectId = @project_id
       ORDER BY StartDate`,
      { project_id: parseInt(id) }
    );

    res.json({
      project: projectRes.recordset[0],
      tasks: tasksRes.recordset,
    });
  } catch (err) {
    return respondWithFallback(res, logger, 'Fetching project', err, null);
  }
};

/**
 * Create project
 */
const createProject = async (req, res) => {
  try {
    const { projectName, startDate, endDate, description } = req.body;
    const userId = req.user.userId;

    if (!projectName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await executeQuery(
      `INSERT INTO dbo.Projects (ProjectName, StartDate, EndDate, Status, Description, CreatedBy, CreatedDate)
       VALUES (@name, @start, @end, 'Planning', @desc, @user, GETDATE())
       SELECT SCOPE_IDENTITY() as id`,
      {
        name: projectName,
        start: startDate || null,
        end: endDate || null,
        desc: description || null,
        user: userId,
      }
    );

    logger.info(`Project created: ${projectName}`);
    res.status(201).json({ id: result.recordset[0].id, message: 'Project created' });
  } catch (err) {
    return respondFeatureUnavailable(res, logger, 'Creating project', err);
  }
};

/**
 * Get project tasks
 */
const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await executeQuery(
      `SELECT TOP 500 pt.TaskId AS ProjectTaskId, pt.ProjectId, pt.TaskName, pt.Status, pt.Priority,
        pt.AssignedTo, u.FirstName, u.LastName, pt.StartDate, pt.EndDate, CAST(0 AS INT) AS Progress
       FROM dbo.ProjectTasks pt
       LEFT JOIN dbo.Users u ON u.UserId = pt.AssignedTo
       WHERE pt.ProjectId = @project_id
       ORDER BY pt.StartDate`,
      { project_id: parseInt(projectId) }
    );
    res.json(result.recordset);
  } catch (err) {
    return respondWithFallback(res, logger, 'Fetching project tasks', err, []);
  }
};

/**
 * Create project task
 */
const createProjectTask = async (req, res) => {
  try {
    const { projectId, taskName, startDate, endDate, priority, assignedTo } = req.body;
    if (!projectId || !taskName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await executeQuery(
      `INSERT INTO dbo.ProjectTasks (ProjectId, TaskName, Status, Priority, AssignedTo, StartDate, EndDate, CreatedDate)
       VALUES (@project, @name, 'To Do', @priority, @assigned, @start, @end, GETDATE())
       SELECT SCOPE_IDENTITY() as id`,
      {
        project: parseInt(projectId),
        name: taskName,
        priority: priority || 'Medium',
        assigned: assignedTo ? parseInt(assignedTo) : null,
        start: startDate || null,
        end: endDate || null,
      }
    );

    logger.info(`Project task created: ${taskName}`);
    res.status(201).json({ id: result.recordset[0].id, message: 'Task created' });
  } catch (err) {
    return respondFeatureUnavailable(res, logger, 'Creating project task', err);
  }
};

/**
 * Get timesheets
 */
const getTimesheets = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT TOP 500 ts.TimesheetId, ts.EmployeeId AS UserId, u.FirstName, u.LastName, ts.ProjectId, p.ProjectName,
        ts.WorkDate AS TaskDate, ts.HoursWorked, ts.Description, ts.CreatedDate
       FROM dbo.Timesheets ts
       JOIN dbo.Users u ON u.UserId = ts.EmployeeId
       LEFT JOIN dbo.Projects p ON p.ProjectId = ts.ProjectId
       ORDER BY ts.WorkDate DESC`
    );
    res.json(result.recordset);
  } catch (err) {
    return respondWithFallback(res, logger, 'Fetching timesheets', err, []);
  }
};

/**
 * Create timesheet entry
 */
const createTimesheet = async (req, res) => {
  try {
    const { projectId, taskDate, hoursWorked, description } = req.body;
    const userId = req.user.userId;

    if (!projectId || !taskDate || !hoursWorked) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await executeQuery(
      `INSERT INTO dbo.Timesheets (EmployeeId, ProjectId, TaskId, WorkDate, HoursWorked, Description, CreatedDate)
       VALUES (@user, @project, NULL, @date, @hours, @desc, GETDATE())`,
      {
        user: userId,
        project: parseInt(projectId),
        date: taskDate,
        hours: parseFloat(hoursWorked),
        desc: description || null,
      }
    );

    logger.info(`Timesheet entry created for user ${userId}`);
    res.status(201).json({ message: 'Timesheet entry created' });
  } catch (err) {
    return respondFeatureUnavailable(res, logger, 'Creating timesheet', err);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  getProjectTasks,
  createProjectTask,
  getTimesheets,
  createTimesheet,
};
