const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const { respondWithFallback, respondFeatureUnavailable } = require('../utils/schemaFallback');

// ── LEADS ──────────────────────────────────────────────
async function getLeads(req, res) {
  try {
    const result = await executeQuery(
      `SELECT id AS "LeadID", lead_name AS "LeadName", email AS "Email", phone AS "Phone",
              company AS "Company", source AS "Source", status AS "Status", 
              assigned_to AS "AssignedTo", notes AS "Notes", rating AS "Rating", created_at AS "CreatedAt"
       FROM leads ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching leads', error, []);
  }
}

async function getLeadById(req, res) {
  try {
    const result = await executeQuery(
      `SELECT id AS "LeadID", lead_name AS "LeadName", email AS "Email", phone AS "Phone",
              company AS "Company", source AS "Source", status AS "Status", 
              assigned_to AS "AssignedTo", notes AS "Notes", rating AS "Rating"
       FROM leads WHERE id=$1`,
      [parseInt(req.params.id)]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });
    res.json(result.rows[0]);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching lead', error, null);
  }
}

async function createLead(req, res) {
  try {
    const { leadName, email, phone, company, source, notes, assignedTo, rating } = req.body;
    if (!leadName) return res.status(400).json({ error: 'Lead name is required' });

    const result = await executeQuery(
      `INSERT INTO leads (lead_name, email, phone, company, source, status, assigned_to, notes, rating)
       VALUES ($1,$2,$3,$4,$5,'New',$6,$7,$8) RETURNING id AS "LeadID"`,
      [leadName, email||null, phone||null, company||null, source||null, assignedTo||null, notes||null, rating||'Medium']
    );
    logger.info(`[CRM] Created lead: ${leadName}`);
    res.status(201).json({ id: result.rows[0].LeadID, message: 'Lead created successfully' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Creating lead', error);
  }
}

async function updateLead(req, res) {
  try {
    const { id } = req.params;
    const { leadName, email, phone, company, source, status, assignedTo, notes, rating } = req.body;
    await executeQuery(
      `UPDATE leads SET lead_name=$1, email=$2, phone=$3, company=$4, source=$5, status=$6, assigned_to=$7, notes=$8, rating=$9 WHERE id=$10`,
      [leadName, email||null, phone||null, company||null, source||null, status||'New', assignedTo||null, notes||null, rating||'Medium', parseInt(id)]
    );
    res.json({ message: 'Lead updated' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Updating lead', error);
  }
}

// ── CONTACTS ───────────────────────────────────────────
async function getContacts(req, res) {
  try {
    const result = await executeQuery(
      `SELECT c.id AS "ContactID", (c.first_name || ' ' || COALESCE(c.last_name, '')) AS "ContactName",
              c.email AS "Email", c.phone AS "Phone", c.company AS "Company", 
              c.designation AS "JobTitle", c.lead_id AS "LeadID", l.lead_name AS "LeadName", 
              c.created_at AS "CreatedAt"
       FROM contacts c
       LEFT JOIN leads l ON l.id = c.lead_id
       ORDER BY c.first_name`
    );
    res.json(result.rows);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching contacts', error, []);
  }
}

async function createContact(req, res) {
  try {
    const { contactName, email, phone, company, jobTitle, leadId } = req.body;
    // Split contactName into first and last name simple logic
    const parts = (contactName || '').split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');

    if (!firstName) return res.status(400).json({ error: 'Contact name is required' });

    const result = await executeQuery(
      `INSERT INTO contacts (first_name, last_name, email, phone, company, designation, lead_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id AS "ContactID"`,
      [firstName, lastName||null, email||null, phone||null, company||null, jobTitle||null, leadId||null]
    );
    res.status(201).json({ id: result.rows[0].ContactID, message: 'Contact created successfully' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Creating contact', error);
  }
}

async function updateContact(req, res) {
  try {
    const { id } = req.params;
    const { contactName, email, phone, company, jobTitle, leadId } = req.body;
    const parts = (contactName || '').split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');

    await executeQuery(
      `UPDATE contacts SET first_name=$1, last_name=$2, email=$3, phone=$4, company=$5, designation=$6, lead_id=$7 WHERE id=$8`,
      [firstName, lastName||null, email||null, phone||null, company||null, jobTitle||null, leadId||null, parseInt(id)]
    );
    res.json({ message: 'Contact updated' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Updating contact', error);
  }
}

// ── OPPORTUNITIES ──────────────────────────────────────
async function getOpportunities(req, res) {
  try {
    const result = await executeQuery(
      `SELECT o.id AS "OpportunityID", o.title AS "OpportunityName", o.lead_id AS "LeadID", 
              l.lead_name AS "LeadName", o.customer_id AS "CustomerID",
              o.value AS "Amount", o.stage AS "Stage", o.probability AS "Probability", 
              o.expected_close AS "ExpectedCloseDate", o.assigned_to AS "AssignedTo", 
              o.notes AS "Notes", o.stage AS "Status", o.created_at AS "CreatedAt"
       FROM opportunities o
       LEFT JOIN leads l ON l.id = o.lead_id
       ORDER BY o.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching opportunities', error, []);
  }
}

async function createOpportunity(req, res) {
  try {
    const { opportunityName, leadId, customerId, amount, stage, probability, expectedCloseDate, assignedTo, notes } = req.body;
    if (!opportunityName) return res.status(400).json({ error: 'Opportunity Name is required' });

    const result = await executeQuery(
      `INSERT INTO opportunities (title, lead_id, customer_id, value, stage, probability, expected_close, assigned_to, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id AS "OpportunityID"`,
      [opportunityName, leadId||null, customerId||null, amount||0, stage||'Qualification', probability||0, expectedCloseDate||null, assignedTo||null, notes||null]
    );
    res.status(201).json({ id: result.rows[0].OpportunityID, message: 'Opportunity created successfully' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Creating opportunity', error);
  }
}

async function convertOpportunityToSO(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const oppRes = await executeQuery(`SELECT * FROM opportunities WHERE id=$1`, [parseInt(id)]);
    if (oppRes.rows.length === 0) return res.status(404).json({ error: 'Opportunity not found' });
    const opp = oppRes.rows[0];

    await executeQuery(`UPDATE opportunities SET stage='Closed Won' WHERE id=$1`, [parseInt(id)]);

    const soNumber = `SO-CRM-${Date.now()}`;
    const result = await executeQuery(
      `INSERT INTO salesorders (ordernumber, orderdate, customerid, totalamount, status, createdby, createddate)
       VALUES ($1, NOW(), $2, $3, 'Pending', $4, NOW()) RETURNING salesorderid AS id`,
      [soNumber, opp.customer_id||null, Number(opp.value), userId]
    );
    res.status(201).json({ message: 'Converted to Sales Order', sales_order_id: result.rows[0].id, order_number: soNumber });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Converting opportunity to SO', error);
  }
}

// ── ACTIVITIES ─────────────────────────────────────────
async function getActivities(req, res) {
  try {
    const result = await executeQuery(
      `SELECT a.id AS "ActivityID", a.type AS "ActivityType", a.subject AS "Subject", 
              a.lead_id AS "LeadID", l.lead_name AS "LeadName",
              a.contact_id AS "ContactID", a.opportunity_id AS "OpportunityID", 
              a.due_date AS "ActivityDate", a.status AS "Status", a.notes AS "Notes", 
              a.created_at AS "CreatedAt"
       FROM activities a
       LEFT JOIN leads l ON l.id = a.lead_id
       ORDER BY a.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    return respondWithFallback(res, logger, 'Fetching activities', error, []);
  }
}

async function logActivity(req, res) {
  try {
    const { type, subject, leadId, contactId, opportunityId, dueDate, notes } = req.body;
    if (!subject) return res.status(400).json({ error: 'Subject is required' });

    const result = await executeQuery(
      `INSERT INTO activities (type, subject, lead_id, contact_id, opportunity_id, due_date, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,'Open',$7) RETURNING id AS "ActivityID"`,
      [type||'Call', subject, leadId||null, contactId||null, opportunityId||null, dueDate||null, notes||null]
    );
    res.status(201).json({ id: result.rows[0].ActivityID, message: 'Activity logged successfully' });
  } catch (error) {
    return respondFeatureUnavailable(res, logger, 'Logging activity', error);
  }
}

module.exports = {
  getLeads, getLeadById, createLead, updateLead,
  getContacts, createContact, updateContact,
  getOpportunities, createOpportunity, convertOpportunityToSO,
  getActivities, logActivity,
};
