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
import LoadingBackdrop from '../../components/Shared/LoadingBackdrop';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';

import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

const EMPTY_FORM = {
  vendorCode: '', vendorName: '', email: '', phone: '',
  address: '', city: '', country: 'India', paymentTerms: '', rating: 'Medium'
};

export default function Vendors() {
  const [list, setList]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [open, setOpen]         = useState(false);
  const [saving, setSaving]     = useState(false);
  const [editRec, setEditRec]   = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [error, setError]       = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess]   = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/supply-chain/vendors');
      setList(res.data); setError('');
    } catch { setError('Failed to load vendors'); }
    finally { setLoading(false); }
  };

  const handleOpen  = () => { setEditRec(null); setFormData(EMPTY_FORM); setFormError(''); setOpen(true); };
  const handleClose = () => { setOpen(false); setFormError(''); };
  const openEdit = v => {
    setEditRec(v);
    setFormData({ vendorCode: v.VendorCode||'', vendorName: v.VendorName||'', email: v.Email||'', phone: v.Phone||'', address: v.Address||'', city: v.City||'', country: v.Country||'India', paymentTerms: v.PaymentTerms||'', rating: v.Rating||'Medium' });
    setFormError(''); setOpen(true);
  };
  const set = (name) => (e) => setFormData(f => ({ ...f, [name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setFormError('');
    try {
      if (editRec) {
        await apiClient.put(`/supply-chain/vendors/${editRec.VendorID}`, formData);
        setSuccess('Vendor updated');
      } else {
        await apiClient.post('/supply-chain/vendors', formData);
        setSuccess('Vendor registered successfully');
      }
      handleClose(); load();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed');
    } finally { setSaving(false); }
  };

  const canSave = saving || !formData.vendorCode.trim() || !formData.vendorName.trim();

  return (
    <Box sx={{ p: 3 }}>
      <LoadingBackdrop open={loading} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>Vendor Directory</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpen}
          sx={{ bgcolor: '#1e40af', textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem',
            borderRadius: '7px', px: 1.5, py: 0.75, boxShadow: 'none',
            '&:hover': { bgcolor: '#1e3a8a' } }}>
          Register Vendor
        </Button>
      </Box>

      {error   && <Alert severity="error"   sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Box className="erp-gtable" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden', mb: 4 }}>
        <Box className="erp-gthead" sx={{ display: 'grid', gridTemplateColumns: '120px 1.5fr 1fr 1fr 120px 100px 80px', px: 2, py: 1.25, bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
          {['Code', 'Name', 'Email', 'City', 'Terms', 'Rating', 'Action'].map((h, i) => (
            <Typography key={i} variant="caption"
              sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase',
                letterSpacing: '0.05em' }}>
              {h}
            </Typography>
          ))}
        </Box>

        {(list.map(v => (
            <Box className="erp-gthead erp-gtrow" key={v.VendorID} sx={{ display: 'grid', gridTemplateColumns: '120px 1.5fr 1fr 1fr 120px 100px 80px', alignItems: 'center', px: 2, py: '10px', borderBottom: '1px solid #f1f5f9', bgcolor: '#fff', '&:hover': { bgcolor: '#f8fafc' } }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#2563eb', fontWeight: 700 }}>{v.VendorCode}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>{v.VendorName}</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: '#475569' }}>{v.Email || '—'}</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: '#475569' }}>{v.City || '—'}</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: '#64748b' }}>{v.PaymentTerms || '—'}</Typography>
              <Chip label={v.Rating} size="small"
                sx={{ height: 20, fontSize: '0.67rem', fontWeight: 700,
                  bgcolor: v.Rating === 'High' ? '#dcfce7' : v.Rating === 'Low' ? '#fee2e2' : '#f1f5f9',
                  color: v.Rating === 'High' ? '#166534' : v.Rating === 'Low' ? '#991b1b' : '#475569' }} />
              <Button size="small" variant="outlined" onClick={() => openEdit(v)}
                sx={{ textTransform: 'none', fontSize: '0.72rem', borderRadius: '6px', py: 0.4, px: 1, borderColor: '#e2e8f0', color: '#475569', '&:hover': { borderColor: '#1e40af', color: '#1e40af' } }}>
                Edit
              </Button>
            </Box>
          ))
        )}
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ pb: 1, fontWeight: 700, fontSize: '1rem', color: '#1e293b',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editRec ? 'Edit Vendor' : 'Register New Vendor'}
          <Tooltip title="Close"><IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton></Tooltip>
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={4}><TextField label="Vendor Code *" value={formData.vendorCode} size="small" fullWidth required onChange={set('vendorCode')} /></Grid>
              <Grid item xs={8}><TextField label="Vendor Name *" value={formData.vendorName} size="small" fullWidth required onChange={set('vendorName')} /></Grid>
              <Grid item xs={6}><TextField label="Email" type="email" value={formData.email} size="small" fullWidth onChange={set('email')} /></Grid>
              <Grid item xs={6}><TextField label="Phone" value={formData.phone} size="small" fullWidth onChange={set('phone')} /></Grid>
              <Grid item xs={12}><TextField label="Address" value={formData.address} size="small" fullWidth onChange={set('address')} /></Grid>
              <Grid item xs={4}><TextField label="City" value={formData.city} size="small" fullWidth onChange={set('city')} /></Grid>
              <Grid item xs={4}><TextField label="Payment Terms" value={formData.paymentTerms} size="small" fullWidth onChange={set('paymentTerms')} /></Grid>
              <Grid item xs={4}>
                <TextField select label="Rating" value={formData.rating} size="small" fullWidth onChange={set('rating')}>
                  {['Low', 'Medium', 'High'].map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", gap: 1, px: 3, pb: 2.5, pt: 1 }}>
            <Button onClick={handleClose} variant="outlined" size="small"
              sx={{textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', borderRadius: '7px', color: '#475569', borderColor: '#cbd5e1', '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' }}}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" size="small" disabled={canSave}
              sx={{textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', borderRadius: '7px', bgcolor: '#1e40af', boxShadow: 'none', '&:hover': { bgcolor: '#1e3a8a' }, '&.Mui-disabled': { bgcolor: '#cbd5e1', color: '#94a3b8' }}}>
              {saving ? 'Saving…' : editRec ? 'Update' : 'Register Vendor'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
