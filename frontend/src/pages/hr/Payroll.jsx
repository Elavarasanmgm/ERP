import { formatINR } from '../../utils/locale';
import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { useAlert } from '../../hooks/useAlert';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LoadingBackdrop from '../../components/Shared/LoadingBackdrop';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';

import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

export default function Payroll() {
  const [list, setList]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const [saving, setSaving]   = useState(false);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ employeeId: '', payrollPeriod: '', baseSalary: '', allowances: '0', deductions: '0' });
  
  // Post Confirmation State
  const [postConfirmOpen, setPostConfirmOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [posting, setPosting] = useState(false);

  const alert = useAlert();

  const load = () => {
    setLoading(true);
    apiClient.get('/hr/payroll').then(res => { setList(res.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
    apiClient.get('/hr/employees').then(r => setEmployees(r.data)).catch(() => {});
  }, []);

  const openPostConfirm = (p) => {
    setSelectedPayroll(p);
    setPostConfirmOpen(true);
  };

  const handlePost = async () => {
    if (!selectedPayroll) return;
    const id = selectedPayroll.PayrollID;
    setPosting(true);
    try {
      await apiClient.put(`/hr/payroll/${id}/post`);
      alert.success(`Payroll for ${selectedPayroll.EmployeeName} posted successfully`);
      setPostConfirmOpen(false);
      load();
    } catch (err) {
      alert.error(err?.response?.data?.error || 'Failed to post payroll');
    } finally {
      setPosting(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/hr/payroll', {
        employeeId:    parseInt(form.employeeId),
        payrollPeriod: form.payrollPeriod,
        baseSalary:    parseFloat(form.baseSalary),
        allowances:    parseFloat(form.allowances || 0),
        deductions:    parseFloat(form.deductions || 0),
      });
      alert.success('Payroll record created successfully');
      setOpen(false);
      load();
    } catch (err) {
      alert.error(err?.response?.data?.error || 'Failed to create payroll');
    } finally { setSaving(false); }
  };

  const statusColor = (s) => s === 'Posted'
    ? { bg: '#dcfce7', color: '#166534' }
    : { bg: '#fef3c7', color: '#92400e' };

  return (
    <Box sx={{ p: 3 }}>
      <LoadingBackdrop open={loading} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Payroll Processing</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setOpen(true)}
          sx={{ bgcolor: '#1e40af', textTransform: 'none', fontWeight: 600, borderRadius: '7px', px: 1.5, boxShadow: 'none', '&:hover': { bgcolor: '#1e3a8a' } }}>
          Add Payroll
        </Button>
      </Box>

      <Box className="erp-gtable" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Box className="erp-gthead" sx={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr 90px 110px', px: 2, py: 1.25, bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
          {['Employee', 'Period', 'Base', 'Allowances', 'Deductions', 'Net Salary', 'Status', 'Action'].map(h => (
            <Typography key={h} variant="caption" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</Typography>
          ))}
        </Box>
        {list.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}><Typography variant="body2">No payroll records yet.</Typography></Box>
        ) : list.map(p => {
          const sc = statusColor(p.Status);
          return (
            <Box className="erp-gtrow" key={p.PayrollID} sx={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr 90px 110px', alignItems: 'center', px: 2, py: 1.25, borderTop: '1px solid #f1f5f9' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.EmployeeName}</Typography>
              <Typography variant="body2">{p.PayrollPeriod}</Typography>
              <Typography variant="body2" sx={{ textAlign: 'right', pr: 2 }}>{formatINR(p.BaseSalary)}</Typography>
              <Typography variant="body2" sx={{ textAlign: 'right', pr: 2, color: '#059669' }}>{formatINR(p.Allowances)}</Typography>
              <Typography variant="body2" sx={{ textAlign: 'right', pr: 2, color: '#dc2626' }}>{formatINR(p.Deductions)}</Typography>
              <Typography variant="body2" sx={{ textAlign: 'right', pr: 2, fontWeight: 700, color: '#1e40af' }}>{formatINR(p.NetSalary)}</Typography>
              <Chip label={p.Status || 'Draft'} size="small" sx={{ height: 20, fontSize: '0.67rem', fontWeight: 700, bgcolor: sc.bg, color: sc.color }} />
              <Box>
                {p.Status !== 'Posted' && (
                  <Button variant="contained" size="small" onClick={() => openPostConfirm(p)}
                    sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.72rem', borderRadius: '7px',
                      bgcolor: '#0f766e', boxShadow: 'none', py: 0.5, px: 1.5,
                      '&:hover': { bgcolor: '#115e59' } }}>
                    Post
                  </Button>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Create Payroll Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '1rem' }}>
          New Payroll Entry
          <IconButton size="small" onClick={() => setOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <Box component="form" onSubmit={handleCreate}>
          <DialogContent sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField select label="Employee *" fullWidth size="small" required value={form.employeeId}
                  onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}>
                  {employees.map(e => <MenuItem key={e.EmployeeID} value={e.EmployeeID}>{e.FirstName} {e.LastName} ({e.EmployeeCode})</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField label="Payroll Period *" fullWidth size="small" required value={form.payrollPeriod}
                  placeholder="e.g. 2026-04"
                  onChange={e => setForm(f => ({ ...f, payrollPeriod: e.target.value }))} />
              </Grid>
              <Grid item xs={4}>
                <TextField label="Base Salary *" type="number" fullWidth size="small" required value={form.baseSalary}
                  onChange={e => setForm(f => ({ ...f, baseSalary: e.target.value }))} />
              </Grid>
              <Grid item xs={4}>
                <TextField label="Allowances" type="number" fullWidth size="small" value={form.allowances}
                  onChange={e => setForm(f => ({ ...f, allowances: e.target.value }))} />
              </Grid>
              <Grid item xs={4}>
                <TextField label="Deductions" type="number" fullWidth size="small" value={form.deductions}
                  onChange={e => setForm(f => ({ ...f, deductions: e.target.value }))} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={() => setOpen(false)} variant="outlined" size="small" sx={{ textTransform: 'none', borderRadius: '7px' }}>Cancel</Button>
            <Button type="submit" variant="contained" size="small" disabled={saving}
              sx={{ textTransform: 'none', borderRadius: '7px', bgcolor: '#1e40af', boxShadow: 'none', '&:hover': { bgcolor: '#1e3a8a' } }}>
              {saving ? 'Saving…' : 'Create'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Post Confirmation Dialog */}
      <Dialog open={postConfirmOpen} onClose={() => !posting && setPostConfirmOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <HelpOutlineIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Confirm Posting</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6 }}>
            Are you sure you want to post the payroll for <strong>{selectedPayroll?.EmployeeName}</strong>?
            <br /><br />
            This will lock the record and automatically create a <strong>Salary Journal Entry</strong> in the accounting module.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1.5 }}>
          <Button onClick={() => setPostConfirmOpen(false)} disabled={posting} variant="text" sx={{ textTransform: 'none', fontWeight: 600, color: '#64748b' }}>
            Cancel
          </Button>
          <Button onClick={handlePost} disabled={posting} variant="contained" 
            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#0f766e', px: 3, borderRadius: '8px', '&:hover': { bgcolor: '#115e59' } }}>
            {posting ? 'Posting…' : 'Yes, Post Payroll'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
