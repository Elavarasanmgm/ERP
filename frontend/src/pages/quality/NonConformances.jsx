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
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';

const EMPTY_FORM = {
  nonConformanceType: '', itemId: '', reportedDate: new Date().toISOString().split('T')[0],
  severity: 'Medium', description: '', dueDate: ''
};

export default function NonConformances() {
  const [list, setList] = useState([]);
  const [items, setItems] = useState([]);
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
      const [ncRes, itRes] = await Promise.all([
        apiClient.get('/quality/non-conformances'),
        apiClient.get('/inventory/items')
      ]);
      setList(ncRes.data); setItems(itRes.data);
    } catch { setError('Failed to load data'); }
    finally { setLoading(false); }
  };

  const set = (name) => (e) => setFormData(f => ({ ...f, [name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/quality/non-conformances', formData);
      setSuccess('NC Reported'); setOpen(false); load();
    } catch (err) { setFormError('Report failed'); }
    finally { setSaving(false); }
  };

  return (
    <Box sx={{ p: 3 }}>
      <LoadingBackdrop open={loading} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Non-Conformances</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Report NC</Button>
      </Box>

      <Box className="erp-gtable" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Box className="erp-gthead" sx={{ display: 'grid', gridTemplateColumns: '120px 120px 1fr 120px 100px 100px', px: 2, py: 1.25, bgcolor: '#f8fafc' }}>
          {['Number', 'Type', 'Item', 'Date', 'Severity', 'Status'].map(h => <Typography key={h} variant="caption" sx={{ fontWeight: 700 }}>{h}</Typography>)}
        </Box>
        {list.map(nc => (
          <Box className="erp-gtrow" key={nc.NonConformanceID} sx={{ display: 'grid', gridTemplateColumns: '120px 120px 1fr 120px 100px 100px', alignItems: 'center', px: 2, py: 1.25, borderTop: '1px solid #f1f5f9' }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{nc.NCNumber}</Typography>
            <Typography variant="body2">{nc.NonConformanceType}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{nc.ItemName}</Typography>
            <Typography variant="body2">{formatDate(nc.ReportedDate)}</Typography>
            <Chip label={nc.Severity} size="small" color={nc.Severity === 'High' || nc.Severity === 'Critical' ? 'error' : 'warning'} />
            <Chip label={nc.Status} size="small" variant="outlined" />
          </Box>
        ))}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between' }}>
          Report Non-Conformance <IconButton onClick={() => setOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="Type *" fullWidth size="small" required onChange={set('nonConformanceType')} /></Grid>
              <Grid item xs={6}><TextField select label="Severity" fullWidth size="small" value={formData.severity} onChange={set('severity')}>
                {['Low', 'Medium', 'High', 'Critical'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField></Grid>
              <Grid item xs={12}><TextField select label="Item *" fullWidth size="small" required onChange={set('itemId')}>
                {items.map(it => <MenuItem key={it.id} value={it.id}>{it.code} - {it.name}</MenuItem>)}
              </TextField></Grid>
              <Grid item xs={12}><TextField label="Description" fullWidth multiline rows={3} onChange={set('description')} /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", gap: 1, px: 3, pb: 2.5, pt: 1 }}>
            <Button onClick={() => setOpen(false)} variant="outlined" size="small"
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', borderRadius: '7px', color: '#475569', borderColor: '#cbd5e1', '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' } }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" size="small" disabled={saving}
              sx={{textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', borderRadius: '7px', bgcolor: '#1e40af', boxShadow: 'none', '&:hover': { bgcolor: '#1e3a8a' }, '&.Mui-disabled': { bgcolor: '#cbd5e1', color: '#94a3b8' }}}>
              Submit Report
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
