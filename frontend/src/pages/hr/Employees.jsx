import { formatINR } from '../../utils/locale';
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

const EMPTY = { employeeCode:'', firstName:'', lastName:'', email:'', phone:'', department:'', position:'', joinDate:'', salary:0, status:'Active' };
const STATUS_OPTS = ['Active','Inactive','On Leave'];

export default function Employees() {
  const [list, setList]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const [saving, setSaving]   = useState(false);
  const [editRec, setEditRec] = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [formErr, setFormErr] = useState('');

  const load = () => { setLoading(true); apiClient.get('/hr/employees').then(r => { setList(r.data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  const set = n => e => setForm(f => ({ ...f, [n]: e.target.value }));

  const openNew  = () => { setEditRec(null); setForm(EMPTY); setFormErr(''); setOpen(true); };
  const openEdit = emp => {
    setEditRec(emp);
    setForm({ employeeCode: emp.employeecode||emp.EmployeeCode||'', firstName: emp.firstname||emp.FirstName||'', lastName: emp.lastname||emp.LastName||'', email: emp.email||emp.Email||'', phone: emp.phone||emp.Phone||'', department: emp.department||emp.Department||'', position: emp.position||emp.Position||'', joinDate: emp.joindate||emp.JoinDate||'', salary: emp.salary||emp.Salary||0, status: emp.status||emp.Status||'Active' });
    setFormErr(''); setOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setFormErr('');
    try {
      if (editRec) {
        await apiClient.put(`/hr/employees/${editRec.employeeid||editRec.EmployeeID}`, form);
        setSuccess('Employee updated');
      } else {
        await apiClient.post('/hr/employees', form);
        setSuccess('Employee added');
      }
      setOpen(false); load();
    } catch (err) { setFormErr(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <Box sx={{ p: 3 }}>
      <LoadingBackdrop open={loading} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Employee Directory</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openNew}
          sx={{ bgcolor: '#1e40af', textTransform: 'none', fontWeight: 600, borderRadius: '7px', boxShadow: 'none', '&:hover': { bgcolor: '#1e3a8a' } }}>
          Add Employee
        </Button>
      </Box>
      {error   && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Box className="erp-gtable" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Box className="erp-gthead" sx={{ display: 'grid', gridTemplateColumns: '100px 1.5fr 1fr 1fr 1fr 110px 80px', px: 2, py: 1.25, bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
          {['Code','Name','Email','Dept','Position','Salary','Action'].map(h => <Typography key={h} variant="caption" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</Typography>)}
        </Box>
        {list.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}><Typography variant="body2">No employees yet.</Typography></Box>
        ) : list.map(emp => (
          <Box className="erp-gthead erp-gtrow" key={emp.employeeid||emp.EmployeeID} sx={{ display: 'grid', gridTemplateColumns: '100px 1.5fr 1fr 1fr 1fr 110px 80px', alignItems: 'center', px: 2, py: 1.25, borderTop: '1px solid #f1f5f9', '&:hover': { bgcolor: '#f8fafc' } }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#2563eb', fontWeight: 700 }}>{emp.employeecode||emp.EmployeeCode}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{emp.firstname||emp.FirstName} {emp.lastname||emp.LastName}</Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem' }}>{emp.email||emp.Email}</Typography>
            <Typography variant="body2">{emp.department||emp.Department}</Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>{emp.position||emp.Position}</Typography>
            <Typography variant="body2" sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{formatINR(Number(emp.salary||emp.Salary||0))}</Typography>
            <Button size="small" variant="outlined" onClick={() => openEdit(emp)}
              sx={{ textTransform: 'none', fontSize: '0.72rem', borderRadius: '6px', py: 0.4, px: 1, borderColor: '#e2e8f0', color: '#475569', '&:hover': { borderColor: '#1e40af', color: '#1e40af' } }}>
              Edit
            </Button>
          </Box>
        ))}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem' }}>
          {editRec ? 'Edit Employee' : 'Add New Employee'}
          <IconButton size="small" onClick={() => setOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            {formErr && <Alert severity="error" sx={{ mb: 2 }}>{formErr}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={4}><TextField label="Code *" fullWidth size="small" required value={form.employeeCode} onChange={set('employeeCode')} disabled={!!editRec} /></Grid>
              <Grid item xs={4}><TextField label="First Name *" fullWidth size="small" required value={form.firstName} onChange={set('firstName')} /></Grid>
              <Grid item xs={4}><TextField label="Last Name *" fullWidth size="small" required value={form.lastName} onChange={set('lastName')} /></Grid>
              <Grid item xs={6}><TextField label="Email" type="email" fullWidth size="small" value={form.email} onChange={set('email')} /></Grid>
              <Grid item xs={6}><TextField label="Phone" fullWidth size="small" value={form.phone} onChange={set('phone')} /></Grid>
              <Grid item xs={6}><TextField label="Department *" fullWidth size="small" required value={form.department} onChange={set('department')} /></Grid>
              <Grid item xs={6}><TextField label="Position" fullWidth size="small" value={form.position} onChange={set('position')} /></Grid>
              <Grid item xs={4}><TextField label="Join Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={form.joinDate} onChange={set('joinDate')} /></Grid>
              <Grid item xs={4}><TextField label="Salary" type="number" fullWidth size="small" value={form.salary} onChange={set('salary')} /></Grid>
              {editRec && <Grid item xs={4}><TextField select label="Status" fullWidth size="small" value={form.status} onChange={set('status')}>{STATUS_OPTS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={() => setOpen(false)} variant="outlined" size="small" sx={{ textTransform: 'none', borderRadius: '7px' }}>Cancel</Button>
            <Button type="submit" variant="contained" size="small" disabled={saving}
              sx={{ textTransform: 'none', borderRadius: '7px', bgcolor: '#1e40af', boxShadow: 'none', '&:hover': { bgcolor: '#1e3a8a' } }}>
              {saving ? 'Saving…' : editRec ? 'Update' : 'Add Employee'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
