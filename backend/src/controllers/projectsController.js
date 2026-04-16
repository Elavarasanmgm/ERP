const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const { respondWithFallback, respondFeatureUnavailable } = require('../utils/schemaFallback');

const getProjects = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT projectid AS "ProjectId", projectname AS "ProjectName", 
              CONCAT('PRJ-', projectid) AS "ProjectCode",
              startdate AS "StartDate", enddate AS "EndDate", 
              status AS "Status", CAST(0 AS INT) AS "Progress", 
              description AS "Description", createddate AS "CreatedDate"
       FROM projects ORDER BY startdate DESC`
    );
    res.json(result.rows);
  } catch (err) {
    return respondWithFallback(res, logger, 'Fetching projects', err, []);
  }
};

const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const projectRes = await executeQuery(
      `SELECT projectid AS "ProjectId", projectname AS "ProjectName", 
              startdate AS "StartDate", enddate AS "EndDate", 
              status AS "Status", description AS "Description"
       FROM projects WHERE projectid = $1`, [parseInt(id)]
    );
    if (projectRes.rows.length === 0) return res.status(404).json({ error: 'Project not found' });

    const tasksRes = await executeQuery(
      `SELECT taskid AS "ProjectTaskId", taskname AS "TaskName", 
              status AS "Status", priority AS "Priority", 
              assignedto AS "AssignedTo", startdate AS "StartDate", 
              enddate AS "EndDate", CAST(0 AS INT) AS "Progress"
       FROM projecttasks WHERE projectid = $1 ORDER BY startdate`,
      [parseInt(id)]
    );
    res.json({ project: projectRes.rows[0], tasks: tasksRes.rows });
  } catch (err) {
    return respondWithFallback(res, logger, 'Fetching project', err, null);
  }
};

const createProject = async (req, res) => {
  try {
    const { projectName, startDate, endDate, description } = req.body;
    const userId = req.user.userId;
    if (!projectName) return res.status(400).json({ error: 'Missing required fields' });

    const result = await executeQuery(
      `INSERT INTO projects (projectname, startdate, enddate, status, description, createdby, createddate)
       VALUES ($1, $2, $3, 'Planning', $4, $5, NOW()) RETURNING projectid AS id`,
      [projectName, startDate || null, endDate || null, description || null, userId]
    );
    logger.info(`Project created: ${projectName}`);
    res.status(201).json({ id: result.rows[0].id, message: 'Project created' });
  } catch (err) {
    return respondFeatureUnavailable(res, logger, 'Creating project', err);
  }
};

const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await executeQuery(
      `SELECT pt.taskid AS "ProjectTaskId", pt.projectid AS "ProjectId", 
              pt.taskname AS "TaskName", pt.status AS "Status", pt.priority AS "Priority",
              pt.assignedto AS "AssignedTo", u.firstname AS "FirstName", 
              u.lastname AS "LastName", pt.startdate AS "StartDate", 
              pt.enddate AS "EndDate", CAST(0 AS INT) AS "Progress"
       FROM projecttasks pt
       LEFT JOIN users u ON u.userid = pt.assignedto
       WHERE pt.projectid = $1 ORDER BY pt.startdate`,
      [parseInt(projectId)]
    );
    res.json(result.rows);
  } catch (err) {
    return respondWithFallback(res, logger, 'Fetching project tasks', err, []);
  }
};

const createProjectTask = async (req, res) => {
  try {
    const { projectId, taskName, startDate, endDate, priority, assignedTo } = req.body;
    if (!projectId || !taskName) return res.status(400).json({ error: 'Missing required fields' });

    const result = await executeQuery(
      `INSERT INTO projecttasks (projectid, taskname, status, priority, assignedto, startdate, enddate, createddate)
       VALUES ($1, $2, 'To Do', $3, $4, $5, $6, NOW()) RETURNING taskid AS id`,
      [parseInt(projectId), taskName, priority || 'Medium', assignedTo ? parseInt(assignedTo) : null, startDate || null, endDate || null]
    );
    logger.info(`Project task created: ${taskName}`);
    res.status(201).json({ id: result.rows[0].id, message: 'Task created' });
  } catch (err) {
    return respondFeatureUnavailable(res, logger, 'Creating project task', err);
  }
};

const getTimesheets = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT ts.timesheetid AS "TimesheetId", ts.employeeid AS "UserId", 
              u.firstname AS "FirstName", u.lastname AS "LastName",
              ts.projectid AS "ProjectId", p.projectname AS "ProjectName", 
              ts.workdate AS "TaskDate", ts.hoursworked AS "HoursWorked", 
              ts.description AS "Description", ts.createddate AS "CreatedDate"
       FROM timesheets ts
       JOIN users u ON u.userid = ts.employeeid
       LEFT JOIN projects p ON p.projectid = ts.projectid
       ORDER BY ts.workdate DESC`
    );
    res.json(result.rows);
  } catch (err) {
    return respondWithFallback(res, logger, 'Fetching timesheets', err, []);
  }
};

const createTimesheet = async (req, res) => {
  try {
    const { projectId, taskDate, hoursWorked, description } = req.body;
    const userId = req.user.userId;
    if (!projectId || !taskDate || !hoursWorked) return res.status(400).json({ error: 'Missing required fields' });

    await executeQuery(
      `INSERT INTO timesheets (employeeid, projectid, taskid, workdate, hoursworked, description, createddate)
       VALUES ($1, $2, NULL, $3, $4, $5, NOW())`,
      [userId, parseInt(projectId), taskDate, parseFloat(hoursWorked), description || null]
    );
    logger.info(`Timesheet entry created for user ${userId}`);
    res.status(201).json({ message: 'Timesheet entry created' });
  } catch (err) {
    return respondFeatureUnavailable(res, logger, 'Creating timesheet', err);
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { projectName, startDate, endDate, status, description } = req.body;
    await executeQuery(
      `UPDATE projects SET projectname=$1, startdate=$2, enddate=$3, status=$4, description=$5 WHERE projectid=$6`,
      [projectName, startDate || null, endDate || null, status || 'Planning', description || null, parseInt(id)]
    );
    res.json({ message: 'Project updated' });
  } catch (err) {
    return respondFeatureUnavailable(res, logger, 'Updating project', err);
  }
};

const updateProjectTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { taskName, status, priority, assignedTo, startDate, endDate } = req.body;
    await executeQuery(
      `UPDATE projecttasks SET taskname=$1, status=$2, priority=$3, assignedto=$4, startdate=$5, enddate=$6 WHERE taskid=$7`,
      [taskName, status || 'To Do', priority || 'Medium', assignedTo ? parseInt(assignedTo) : null, startDate || null, endDate || null, parseInt(id)]
    );
    res.json({ message: 'Task updated' });
  } catch (err) {
    return respondFeatureUnavailable(res, logger, 'Updating task', err);
  }
};

module.exports = { getProjects, getProjectById, createProject, updateProject, getProjectTasks, createProjectTask, updateProjectTask, getTimesheets, createTimesheet };
