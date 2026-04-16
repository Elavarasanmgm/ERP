import { formatDate } from '../../utils/locale';
import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LoadingBackdrop from '../../components/Shared/LoadingBackdrop';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

const STATUS_COLOR = { Open: { bg: '#fef3c7', color: '#92400e' }, 'In Progress': { bg: '#dbeafe', color: '#1e40af' }, Closed: { bg: '#dcfce7', color: '#166534' } };
const sc = s => STATUS_COLOR[s] || { bg: '#f1f5f9', color: '#475569' };

export default function CorrectiveActions() {
  const [list, setList]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const [saving, setSaving]   = useState(false);
  const [editRec, setEditRec] = useState(null);
  const [form, setForm]       = useState({ actionDescription: '', assignedTo: '', dueDate: '', status: 'Open' });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [formErr, setFormErr] = useState('');

  const load = () => { apiClient.get('/quality/corrective-actions').then(res => { setList(res.data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  const set = n => e => setForm(f => ({ ...f, [n]: e.target.value }));

  const openEdit = act => {
    setEditRec(act);
    setForm({ actionDescription: act.ActionDescription||'', assignedTo: act.AssignedTo||'', dueDate: act.DueDate?.split('T')[0]||'', status: act.Status||'Open' });
    setFormErr(''); setOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setFormErr('');
    try {
      await apiClient.put(`/quality/corrective-actions/${editRec.ActionID}`, form);
      setSuccess('Action updated');
      setOpen(false); load();
    } catch (err) { setFormErr(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <Box sx={{ p: 3 }}>
      <LoadingBackdrop open={loading} />
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5 }}>Corrective Actions (CAPA)</Typography>
      {error   && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      <Box className="erp-gtable" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Box className="erp-gthead" sx={{ display: 'grid', gridTemplateColumns: '120px 1fr 140px 120px 100px 80px', px: 2, py: 1.25, bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
          {['Action #', 'Description', 'Assigned To', 'Due Date', 'Status', 'Action'].map(h => <Typography key={h} variant="caption" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</Typography>)}
        </Box>
        {list.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}><Typography variant="body2">No corrective actions.</Typography></Box>
        ) : list.map(act => {
          const c = sc(act.Status);
          return (
            <Box className="erp-gthead erp-gtrow" key={act.ActionID} sx={{ display: 'grid', gridTemplateColumns: '120px 1fr 140px 120px 100px 80px', alignItems: 'center', px: 2, py: 1.25, borderTop: '1px solid #f1f5f9', '&:hover': { bgcolor: '#f8fafc' } }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#2563eb', fontWeight: 700 }}>{act.ActionNumber}</Typography>
              <Typography variant="body2">{act.ActionDescription}</Typography>
              <Typography variant="body2">{act.AssignedTo || 'Unassigned'}</Typography>
              <Typography variant="body2">{formatDate(act.DueDate)}</Typography>
              <Chip label={act.Status} size="small" sx={{ height: 20, fontSize: '0.67rem', fontWeight: 700, bgcolor: c.bg, color: c.color }} />
              <Button size="small" variant="outlined" onClick={() => openEdit(act)}
                sx={{ textTransform: 'none', fontSize: '0.72rem', borderRadius: '6px', py: 0.4, px: 1, borderColor: '#e2e8f0', color: '#475569', '&:hover': { borderColor: '#1e40af', color: '#1e40af' } }}>
                Edit
              </Button>
            </Box>
          );
        })}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem' }}>
          Edit Corrective Action
          <IconButton size="small" onClick={() => setOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <Box component="form" onSubmit={handleSave}>
          <DialogContent sx={{ pt: 1 }}>
            {formErr && <Alert severity="error" sx={{ mb: 2 }}>{formErr}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12}><TextField label="Description *" fullWidth size="small" required multiline rows={2} value={form.actionDescription} onChange={set('actionDescription')} /></Grid>
              <Grid item xs={6}><TextField label="Assigned To" fullWidth size="small" value={form.assignedTo} onChange={set('assignedTo')} /></Grid>
              <Grid item xs={6}><TextField label="Due Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={form.dueDate} onChange={set('dueDate')} /></Grid>
              <Grid item xs={6}>
                <TextField select label="Status" fullWidth size="small" value={form.status} onChange={set('status')}>
                  {['Open', 'In Progress', 'Closed'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={() => setOpen(false)} variant="outlined" size="small" sx={{ textTransform: 'none', borderRadius: '7px' }}>Cancel</Button>
            <Button type="submit" variant="contained" size="small" disabled={saving}
              sx={{ textTransform: 'none', borderRadius: '7px', bgcolor: '#1e40af', boxShadow: 'none', '&:hover': { bgcolor: '#1e3a8a' } }}>
              {saving ? 'Saving…' : 'Update'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
