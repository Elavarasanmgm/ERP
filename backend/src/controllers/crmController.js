const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const { respondWithFallback, respondFeatureUnavailable } = require('../utils/schemaFallback');

// CRM Module

// Get leads
async function getLeads(req, res) {
  try {
    const result = await executeQuery(`
      SELECT LeadID, LeadName, Email, Phone, Company, Source, Status, Rating, CreatedDate
      FROM Leads
      ORDER BY CreatedDate DESC
    `);
    logger.info(`[CRM] Retrieved ${result.recordset.length} leads`);
    res.json(result.recordset);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching leads', error, []);
  }
}

// Get lead by ID
async function getLeadById(req, res) {
  try {
    const { id } = req.params;
    const result = await executeQuery(`
      SELECT LeadID, LeadName, Email, Phone, Company, Source, Status, Rating, Notes, CreatedDate
      FROM Leads
      WHERE LeadID = ${id}
    `);
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json(result.recordset[0]);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching lead', error, null);
  }
}

// Create lead
async function createLead(req, res) {
  try {
    const { leadName, email, phone, company, source, rating, notes } = req.body;
    
    if (!leadName || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await executeQuery(`
      INSERT INTO Leads (LeadName, Email, Phone, Company, Source, Status, Rating, Notes, CreatedDate)
      VALUES ('${leadName}', '${email}', '${phone}', '${company}', '${source}', 'New', '${rating || 'Medium'}', '${notes || ''}', GETDATE())
    `);
    
    logger.info(`[CRM] Created lead: ${leadName}`);
    res.status(201).json({ message: 'Lead created successfully' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Creating lead', error);
  }
}

// Get opportunities
async function getOpportunities(req, res) {
  try {
    const result = await executeQuery(`
      SELECT OpportunityID, OpportunityName, (SELECT LeadName FROM Leads WHERE LeadID = o.LeadID) as LeadName,
             Amount, Stage, Probability, ExpectedCloseDate, Status
      FROM Opportunities o
      ORDER BY ExpectedCloseDate
    `);
    logger.info(`[CRM] Retrieved ${result.recordset.length} opportunities`);
    res.json(result.recordset);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching opportunities', error, []);
  }
}

// Create opportunity
async function createOpportunity(req, res) {
  try {
    const { leadId, opportunityName, amount, stage, probability, expectedCloseDate } = req.body;
    
    if (!leadId || !opportunityName || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await executeQuery(`
      INSERT INTO Opportunities (LeadID, OpportunityName, Amount, Stage, Probability, ExpectedCloseDate, Status, CreatedDate)
      VALUES (${leadId}, '${opportunityName}', ${amount}, '${stage || 'Qualification'}', ${probability || 0}, '${expectedCloseDate}', 'Open', GETDATE())
    `);
    
    logger.info(`[CRM] Created opportunity: ${opportunityName}`);
    res.status(201).json({ message: 'Opportunity created successfully' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Creating opportunity', error);
  }
}

// Get contacts
async function getContacts(req, res) {
  try {
    const result = await executeQuery(`
      SELECT ContactID, ContactName, Email, Phone, Company, JobTitle, CustomerID
      FROM Contacts
      ORDER BY ContactName
    `);
    logger.info(`[CRM] Retrieved ${result.recordset.length} contacts`);
    res.json(result.recordset);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching contacts', error, []);
  }
}

// Create contact
async function createContact(req, res) {
  try {
    const { contactName, email, phone, company, jobTitle, customerId } = req.body;
    
    if (!contactName || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await executeQuery(`
      INSERT INTO Contacts (ContactName, Email, Phone, Company, JobTitle, CustomerID, CreatedDate)
      VALUES ('${contactName}', '${email}', '${phone}', '${company}', '${jobTitle}', ${customerId || null}, GETDATE())
    `);
    
    logger.info(`[CRM] Created contact: ${contactName}`);
    res.status(201).json({ message: 'Contact created successfully' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Creating contact', error);
  }
}

// Get activities
async function getActivities(req, res) {
  try {
    const result = await executeQuery(`
      SELECT ActivityID, ActivityType, Subject, (SELECT LeadName FROM Leads WHERE LeadID = a.LeadID) as LeadName,
             ActivityDate, Status, Notes
      FROM Activities a
      ORDER BY ActivityDate DESC
    `);
    logger.info(`[CRM] Retrieved activities`);
    res.json(result.recordset);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching activities', error, []);
  }
}

// Log activity
async function logActivity(req, res) {
  try {
    const { leadId, activityType, subject, activityDate, notes } = req.body;
    
    if (!leadId || !activityType || !subject) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await executeQuery(`
      INSERT INTO Activities (LeadID, ActivityType, Subject, ActivityDate, Status, Notes, CreatedDate)
      VALUES (${leadId}, '${activityType}', '${subject}', '${activityDate}', 'Completed', '${notes || ''}', GETDATE())
    `);
    
    logger.info(`[CRM] Activity logged for lead ${leadId}`);
    res.status(201).json({ message: 'Activity logged successfully' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Logging activity', error);
  }
}

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  getOpportunities,
  createOpportunity,
  getContacts,
  createContact,
  getActivities,
  logActivity
};
