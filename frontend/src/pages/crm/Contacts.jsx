import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

const EMPTY = { contactName: '', email: '', phone: '', company: '', jobTitle: '' };

export default function Contacts() {
  const [list, setList]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const [saving, setSaving]   = useState(false);
  const [editRec, setEditRec] = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [formErr, setFormErr] = useState('');

  const load = () => { apiClient.get('/crm/contacts').then(res => { setList(res.data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  const set = n => e => setForm(f => ({ ...f, [n]: e.target.value }));

  const openNew  = () => { setEditRec(null); setForm(EMPTY); setFormErr(''); setOpen(true); };
  const openEdit = c => {
    setEditRec(c);
    setForm({ contactName: c.ContactName||'', email: c.Email||'', phone: c.Phone||'', company: c.Company||'', jobTitle: c.JobTitle||'' });
    setFormErr(''); setOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setFormErr('');
    try {
      if (editRec) {
        await apiClient.put(`/crm/contacts/${editRec.ContactID}`, form);
        setSuccess('Contact updated');
      } else {
        await apiClient.post('/crm/contacts', form);
        setSuccess('Contact added');
      }
      setOpen(false); load();
    } catch (err) { setFormErr(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Customer Contacts</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openNew}
          sx={{ bgcolor: '#1e40af', textTransform: 'none', fontWeight: 600, borderRadius: '7px', boxShadow: 'none', '&:hover': { bgcolor: '#1e3a8a' } }}>
          Add Contact
        </Button>
      </Box>
      {error   && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Box className="erp-gtable" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Box className="erp-gthead" sx={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1.2fr 1fr 1fr 80px', px: 2, py: 1.25, bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
          {['Name', 'Email', 'Phone', 'Company', 'Title', 'Action'].map(h => <Typography key={h} variant="caption" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</Typography>)}
        </Box>
        {loading ? <Skeleton height={100} /> : list.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}><Typography variant="body2">No contacts yet.</Typography></Box>
        ) : list.map(c => (
          <Box className="erp-gthead erp-gtrow" key={c.ContactID} sx={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1.2fr 1fr 1fr 80px', alignItems: 'center', px: 2, py: 1.25, borderTop: '1px solid #f1f5f9', '&:hover': { bgcolor: '#f8fafc' } }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.ContactName}</Typography>
            <Typography variant="body2" sx={{ color: '#475569' }}>{c.Email}</Typography>
            <Typography variant="body2">{c.Phone}</Typography>
            <Typography variant="body2">{c.Company}</Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>{c.JobTitle}</Typography>
            <Button size="small" variant="outlined" onClick={() => openEdit(c)}
              sx={{ textTransform: 'none', fontSize: '0.72rem', borderRadius: '6px', py: 0.4, px: 1, borderColor: '#e2e8f0', color: '#475569', '&:hover': { borderColor: '#1e40af', color: '#1e40af' } }}>
              Edit
            </Button>
          </Box>
        ))}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem' }}>
          {editRec ? 'Edit Contact' : 'Add Contact'}
          <IconButton size="small" onClick={() => setOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <Box component="form" onSubmit={handleSave}>
          <DialogContent sx={{ pt: 1 }}>
            {formErr && <Alert severity="error" sx={{ mb: 2 }}>{formErr}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12}><TextField label="Name *" fullWidth size="small" required value={form.contactName} onChange={set('contactName')} /></Grid>
              <Grid item xs={6}><TextField label="Email" fullWidth size="small" value={form.email} onChange={set('email')} /></Grid>
              <Grid item xs={6}><TextField label="Phone" fullWidth size="small" value={form.phone} onChange={set('phone')} /></Grid>
              <Grid item xs={6}><TextField label="Company" fullWidth size="small" value={form.company} onChange={set('company')} /></Grid>
              <Grid item xs={6}><TextField label="Title" fullWidth size="small" value={form.jobTitle} onChange={set('jobTitle')} /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", gap: 1, px: 3, pb: 2.5, pt: 1 }}>
            <Button onClick={() => setOpen(false)} variant="outlined" size="small"
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', borderRadius: '7px', color: '#475569', borderColor: '#cbd5e1' }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" size="small" disabled={saving}
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', borderRadius: '7px', bgcolor: '#1e40af', boxShadow: 'none', '&:hover': { bgcolor: '#1e3a8a' } }}>
              {saving ? 'Saving…' : editRec ? 'Update' : 'Save'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
