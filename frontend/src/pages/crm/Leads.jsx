import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';

import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

const EMPTY_FORM = {
  leadName: '', email: '', phone: '', company: '',
  source: '', rating: 'Medium', notes: ''
};

export default function Leads() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/crm/leads');
      setList(res.data);
    } catch { setError('Failed to load leads'); }
    finally { setLoading(false); }
  };

  const [editRec, setEditRec] = useState(null);
  const set = (name) => (e) => setFormData(f => ({ ...f, [name]: e.target.value }));

  const openNew  = () => { setEditRec(null); setFormData(EMPTY_FORM); setFormError(''); setOpen(true); };
  const openEdit = lead => {
    setEditRec(lead);
    setFormData({ leadName: lead.LeadName||'', email: lead.Email||'', phone: lead.Phone||'', company: lead.Company||'', source: lead.Source||'', rating: lead.Rating||'Medium', notes: lead.Notes||'', status: lead.Status||'New' });
    setFormError(''); setOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editRec) {
        await apiClient.put(`/crm/leads/${editRec.LeadID}`, formData);
        setSuccess('Lead updated');
      } else {
        await apiClient.post('/crm/leads', formData);
        setSuccess('Lead created successfully');
      }
      setOpen(false); load();
    } catch (err) { setFormError('Failed'); }
    finally { setSaving(false); }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>Sales Leads</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openNew}
          sx={{ bgcolor: '#1e40af', textTransform: 'none', fontWeight: 600 }}>
          New Lead
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Box className="erp-gtable" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden', mb: 4 }}>
        <Box className="erp-gthead" sx={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 100px 100px 100px 80px',
          px: 2, py: 1.25, bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
          {['Name', 'Email', 'Company', 'Source', 'Rating', 'Status', 'Action'].map(h => (
            <Typography key={h} variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{h}</Typography>
          ))}
        </Box>
        {loading ? <Skeleton height={100} /> : list.map(lead => (
          <Box key={lead.LeadID} className="erp-gtrow" sx={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 100px 100px 100px 80px',
            alignItems: 'center', px: 2, py: 1.25, borderBottom: '1px solid #f1f5f9', '&:hover': { bgcolor: '#f8fafc' } }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{lead.LeadName}</Typography>
            <Typography variant="body2" sx={{ color: '#475569' }}>{lead.Email}</Typography>
            <Typography variant="body2">{lead.Company || '—'}</Typography>
            <Typography variant="body2">{lead.Source || '—'}</Typography>
            <Chip label={lead.Rating} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700,
              bgcolor: lead.Rating === 'High' ? '#dcfce7' : '#f1f5f9', color: lead.Rating === 'High' ? '#166534' : '#475569' }} />
            <Chip label={lead.Status} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
            <Button size="small" variant="outlined" onClick={() => openEdit(lead)}
              sx={{ textTransform: 'none', fontSize: '0.72rem', borderRadius: '6px', py: 0.4, px: 1, borderColor: '#e2e8f0', color: '#475569', '&:hover': { borderColor: '#1e40af', color: '#1e40af' } }}>
              Edit
            </Button>
          </Box>
        ))}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editRec ? 'Edit Lead' : 'Create New Lead'} <IconButton onClick={() => setOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="Lead Name *" fullWidth size="small" required value={formData.leadName} onChange={set('leadName')} /></Grid>
              <Grid item xs={6}><TextField label="Email *" type="email" fullWidth size="small" required value={formData.email} onChange={set('email')} /></Grid>
              <Grid item xs={6}><TextField label="Phone" fullWidth size="small" value={formData.phone} onChange={set('phone')} /></Grid>
              <Grid item xs={6}><TextField label="Company" fullWidth size="small" value={formData.company} onChange={set('company')} /></Grid>
              <Grid item xs={6}><TextField label="Source" fullWidth size="small" value={formData.source} onChange={set('source')} placeholder="Web, Email, etc." /></Grid>
              <Grid item xs={6}>
                <TextField select label="Rating" fullWidth size="small" value={formData.rating} onChange={set('rating')}>
                  {['Low', 'Medium', 'High'].map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </TextField>
              </Grid>
              {editRec && <Grid item xs={6}>
                <TextField select label="Status" fullWidth size="small" value={formData.status||'New'} onChange={set('status')}>
                  {['New','Contacted','Qualified','Lost'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>}
              <Grid item xs={editRec ? 6 : 12}><TextField label="Notes" fullWidth multiline rows={2} value={formData.notes} onChange={set('notes')} /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", gap: 1, px: 3, pb: 2.5, pt: 1 }}>
            <Button onClick={() => setOpen(false)} variant="outlined" size="small"
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', borderRadius: '7px', color: '#475569', borderColor: '#cbd5e1', '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' } }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" size="small" disabled={saving}
              sx={{textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', borderRadius: '7px', bgcolor: '#1e40af', boxShadow: 'none', '&:hover': { bgcolor: '#1e3a8a' }, '&.Mui-disabled': { bgcolor: '#cbd5e1', color: '#94a3b8' }}}>
              {saving ? 'Saving…' : editRec ? 'Update Lead' : 'Create Lead'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
