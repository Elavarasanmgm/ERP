import { formatINR, formatDate } from '../../utils/locale';
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

const STATUS_COLOR = {
  Draft:     { bg: '#f1f5f9', color: '#475569' },
  Pending:   { bg: '#fef3c7', color: '#92400e' },
  Approved:  { bg: '#dcfce7', color: '#166534' },
  Closed:    { bg: '#e2e8f0', color: '#64748b' },
};

const EMPTY_FORM = {
  department: '',
  requestedDate: new Date().toISOString().split('T')[0],
  requiredDate: '',
};

export default function Requisitions() {
  const [list, setList]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [open, setOpen]         = useState(false);
  const [saving, setSaving]     = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [error, setError]       = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess]   = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/supply-chain/requisitions');
      setList(res.data); setError('');
    } catch { setError('Failed to load requisitions'); }
    finally { setLoading(false); }
  };

  const handleOpen  = () => { setFormData(EMPTY_FORM); setFormError(''); setOpen(true); };
  const handleClose = () => { setOpen(false); setFormError(''); };
  const set = (name) => (e) => setFormData(f => ({ ...f, [name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setFormError('');
    try {
      await apiClient.post('/supply-chain/requisitions', formData);
      setSuccess('Requisition created successfully');
      handleClose(); load();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create requisition');
    } finally { setSaving(false); }
  };

  const canSave = saving || !formData.department.trim() || !formData.requiredDate;

  return (
    <Box sx={{ p: 3 }}>
      <LoadingBackdrop open={loading} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>Purchase Requisitions</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpen}
          sx={{ bgcolor: '#1e40af', textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem',
            borderRadius: '7px', px: 1.5, py: 0.75, boxShadow: 'none',
            '&:hover': { bgcolor: '#1e3a8a', boxShadow: '0 4px 12px rgba(30,64,175,0.25)' } }}>
          New Requisition
        </Button>
      </Box>

      {error   && <Alert severity="error"   sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Box className="erp-gtable" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden', mb: 4 }}>
        <Box className="erp-gthead" sx={{ display: 'grid', gridTemplateColumns: '140px 1fr 120px 120px 110px 130px', px: 2, py: 1.25, bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
          {['Req Number', 'Department', 'Requested', 'Required', 'Status', 'Total Amount'].map((h, i) => (
            <Typography key={i} variant="caption"
              sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase',
                letterSpacing: '0.05em', textAlign: i === 5 ? 'right' : 'left' }}>
              {h}
            </Typography>
          ))}
        </Box>

        {list.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}><Typography variant="body2">No requisitions found.</Typography></Box>
        ) : (
          list.map(req => {
            const s = STATUS_COLOR[req.Status] || { bg: '#f1f5f9', color: '#475569' };
            return (
              <Box className="erp-gthead erp-gtrow" key={req.RequisitionID} sx={{ display: 'grid', gridTemplateColumns: '140px 1fr 120px 120px 110px 130px', alignItems: 'center', px: 2, py: '10px', borderBottom: '1px solid #f1f5f9', bgcolor: '#fff', '&:hover': { bgcolor: '#f8fafc' } }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#2563eb', fontWeight: 700, fontSize: '0.8125rem' }}>{req.RequisitionNumber}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.8125rem' }}>{req.Department}</Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: '#475569' }}>{formatDate(req.RequestedDate)}</Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: '#475569' }}>{formatDate(req.RequiredDate)}</Typography>
                <Chip label={req.Status} size="small" sx={{ height: 20, fontSize: '0.67rem', fontWeight: 700, bgcolor: s.bg, color: s.color }} />
                <Typography variant="body2" sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8125rem', color: '#1e293b' }}>
                  {formatINR(Number(req.TotalAmount || 0))}
                </Typography>
              </Box>
            );
          })
        )}
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ pb: 1, fontWeight: 700, fontSize: '1rem', color: '#1e293b',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          New Requisition
          <Tooltip title="Close"><IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton></Tooltip>
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5, fontSize: '0.8125rem' }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField label="Department *" value={formData.department} size="small" fullWidth required
                  onChange={set('department')} placeholder="e.g. Production" />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Requested Date" type="date" value={formData.requestedDate} size="small" fullWidth required
                  onChange={set('requestedDate')} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Required Date *" type="date" value={formData.requiredDate} size="small" fullWidth required
                  onChange={set('requiredDate')} InputLabelProps={{ shrink: true }} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", gap: 1, px: 3, pb: 2.5, pt: 1 }}>
            <Button onClick={handleClose} variant="outlined" size="small"
              sx={{textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', borderRadius: '7px',
                color: '#475569', borderColor: '#cbd5e1',
                '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' }}}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" size="small" disabled={canSave}
              sx={{textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', borderRadius: '7px',
                bgcolor: '#1e40af', boxShadow: 'none',
                '&:hover': { bgcolor: '#1e3a8a' },
                '&.Mui-disabled': { bgcolor: '#cbd5e1', color: '#94a3b8' }}}>
              {saving ? 'Creating…' : 'Create Requisition'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
