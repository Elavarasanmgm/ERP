const express = require('express');
const crmController = require('../controllers/crmController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(authenticateToken);

// Leads
router.get('/leads', crmController.getLeads);
router.get('/leads/:id', crmController.getLeadById);
router.post('/leads', crmController.createLead);

// Opportunities
router.get('/opportunities', crmController.getOpportunities);
router.post('/opportunities', crmController.createOpportunity);

// Contacts
router.get('/contacts', crmController.getContacts);
router.post('/contacts', crmController.createContact);

// Activities
router.get('/activities', crmController.getActivities);
router.post('/activities', crmController.logActivity);

module.exports = router;
