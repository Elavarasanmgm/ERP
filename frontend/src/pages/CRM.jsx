import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';
import './CRM.css';

export default function CRM() {
  const [activeTab, setActiveTab] = useState('leads');
  const [leads, setLeads] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [newLead, setNewLead] = useState({
    leadName: '',
    email: '',
    phone: '',
    company: '',
    source: '',
    rating: 'Medium',
    notes: ''
  });

  const [newContact, setNewContact] = useState({
    contactName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    customerId: ''
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'leads') {
        const res = await apiClient.get('/crm/leads');
        setLeads(res.data);
      } else if (activeTab === 'opportunities') {
        const res = await apiClient.get('/crm/opportunities');
        setOpportunities(res.data);
      } else if (activeTab === 'contacts') {
        const res = await apiClient.get('/crm/contacts');
        setContacts(res.data);
      } else if (activeTab === 'activities') {
        const res = await apiClient.get('/crm/activities');
        setActivities(res.data);
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

  const handleAddLead = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/crm/leads', newLead);
      setSuccessMessage('Lead created successfully');
      setNewLead({
        leadName: '',
        email: '',
        phone: '',
        company: '',
        source: '',
        rating: 'Medium',
        notes: ''
      });
      loadData();
    } catch (err) {
      setError('Failed to add lead');
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/crm/contacts', newContact);
      setSuccessMessage('Contact created successfully');
      setNewContact({
        contactName: '',
        email: '',
        phone: '',
        company: '',
        jobTitle: '',
        customerId: ''
      });
      loadData();
    } catch (err) {
      setError('Failed to add contact');
    }
  };

  return (
    <div className="module-container">
      <h1>💼 CRM</h1>
      
      <div className="module-nav">
        <button 
          className={`module-nav-item ${activeTab === 'leads' ? 'active' : ''}`}
          onClick={() => setActiveTab('leads')}
        >
          🎯 Leads
        </button>
        <button 
          className={`module-nav-item ${activeTab === 'opportunities' ? 'active' : ''}`}
          onClick={() => setActiveTab('opportunities')}
        >
          💡 Opportunities
        </button>
        <button 
          className={`module-nav-item ${activeTab === 'contacts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contacts')}
        >
          👥 Contacts
        </button>
        <button 
          className={`module-nav-item ${activeTab === 'activities' ? 'active' : ''}`}
          onClick={() => setActiveTab('activities')}
        >
          📞 Activities
        </button>
      </div>

      <div className="module-content">
        {loading && <div className="info-message">Loading...</div>}
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        {activeTab === 'leads' && (
          <div>
            <h2>Sales Leads</h2>
            <div className="form-card">
              <h3>Create New Lead</h3>
              <form onSubmit={handleAddLead}>
                <div className="form-row">
                  <input type="text" placeholder="Lead Name" value={newLead.leadName} 
                    onChange={(e) => setNewLead({...newLead, leadName: e.target.value})} required />
                  <input type="email" placeholder="Email" value={newLead.email} 
                    onChange={(e) => setNewLead({...newLead, email: e.target.value})} required />
                  <input type="phone" placeholder="Phone" value={newLead.phone} 
                    onChange={(e) => setNewLead({...newLead, phone: e.target.value})} />
                </div>
                <div className="form-row">
                  <input type="text" placeholder="Company" value={newLead.company} 
                    onChange={(e) => setNewLead({...newLead, company: e.target.value})} />
                  <input type="text" placeholder="Source (Web, Email, Phone)" value={newLead.source} 
                    onChange={(e) => setNewLead({...newLead, source: e.target.value})} />
                  <select value={newLead.rating} onChange={(e) => setNewLead({...newLead, rating: e.target.value})}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="form-row">
                  <textarea placeholder="Notes" value={newLead.notes} 
                    onChange={(e) => setNewLead({...newLead, notes: e.target.value})} style={{minHeight: '80px'}}></textarea>
                </div>
                <button type="submit" className="btn-primary">Create Lead</button>
              </form>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Lead Name</th>
                    <th>Email</th>
                    <th>Company</th>
                    <th>Source</th>
                    <th>Rating</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map(lead => (
                    <tr key={lead.LeadID}>
                      <td>{lead.LeadName}</td>
                      <td>{lead.Email}</td>
                      <td>{lead.Company}</td>
                      <td>{lead.Source}</td>
                      <td><span className="badge">{lead.Rating}</span></td>
                      <td><span className="badge">{lead.Status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'opportunities' && (
          <div>
            <h2>Sales Opportunities</h2>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Opportunity</th>
                    <th>Lead</th>
                    <th>Amount</th>
                    <th>Stage</th>
                    <th>Expected Close</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map(opp => (
                    <tr key={opp.OpportunityID}>
                      <td>{opp.OpportunityName}</td>
                      <td>{opp.LeadName}</td>
                      <td className="amount">${opp.Amount?.toFixed(2)}</td>
                      <td>{opp.Stage}</td>
                      <td>{new Date(opp.ExpectedCloseDate).toLocaleDateString()}</td>
                      <td><span className="badge">{opp.Status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div>
            <h2>Customer Contacts</h2>
            <div className="form-card">
              <h3>Add Contact</h3>
              <form onSubmit={handleAddContact}>
                <div className="form-row">
                  <input type="text" placeholder="Contact Name" value={newContact.contactName} 
                    onChange={(e) => setNewContact({...newContact, contactName: e.target.value})} required />
                  <input type="email" placeholder="Email" value={newContact.email} 
                    onChange={(e) => setNewContact({...newContact, email: e.target.value})} required />
                  <input type="phone" placeholder="Phone" value={newContact.phone} 
                    onChange={(e) => setNewContact({...newContact, phone: e.target.value})} />
                </div>
                <div className="form-row">
                  <input type="text" placeholder="Company" value={newContact.company} 
                    onChange={(e) => setNewContact({...newContact, company: e.target.value})} />
                  <input type="text" placeholder="Job Title" value={newContact.jobTitle} 
                    onChange={(e) => setNewContact({...newContact, jobTitle: e.target.value})} />
                </div>
                <button type="submit" className="btn-primary">Add Contact</button>
              </form>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Company</th>
                    <th>Title</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map(contact => (
                    <tr key={contact.ContactID}>
                      <td>{contact.ContactName}</td>
                      <td>{contact.Email}</td>
                      <td>{contact.Phone}</td>
                      <td>{contact.Company}</td>
                      <td>{contact.JobTitle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'activities' && (
          <div>
            <h2>Activities</h2>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Subject</th>
                    <th>Lead</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map(activity => (
                    <tr key={activity.ActivityID}>
                      <td>{activity.ActivityType}</td>
                      <td>{activity.Subject}</td>
                      <td>{activity.LeadName}</td>
                      <td>{new Date(activity.ActivityDate).toLocaleDateString()}</td>
                      <td><span className="badge">{activity.Status}</span></td>
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
