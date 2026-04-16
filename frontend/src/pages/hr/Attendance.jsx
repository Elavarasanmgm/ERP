import { formatDate } from '../../utils/locale';
import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { useAlert } from '../../hooks/useAlert';
import usePagination from '../../hooks/usePagination';
import ErpPagination from '../../components/Shared/ErpPagination';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import LoadingBackdrop from '../../components/Shared/LoadingBackdrop';
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
import InputAdornment from '@mui/material/InputAdornment';

import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';

const EMPTY_FORM = {
  employeeId: '',
  attendanceDate: new Date().toISOString().split('T')[0],
  status: 'Present',
  checkIn: '',
  remarks: ''
};

export default function Attendance() {
  const [list, setList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  
  const alert = useAlert();

  // Pagination & Filtering
  const pagn = usePagination(list, (item, q) => 
    item.EmployeeName.toLowerCase().includes(q) || 
    item.Status.toLowerCase().includes(q)
  );

  const load = async () => {
    setLoading(true);
    try {
      const [attRes, empRes] = await Promise.all([
        apiClient.get('/hr/attendance'),
        apiClient.get('/hr/employees')
      ]);
      setList(attRes.data);
      setEmployees(empRes.data);
    } catch (err) {
      alert.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleOpen = () => {
    setFormData(EMPTY_FORM);
    setFormError('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const set = (name) => (e) => setFormData(f => ({ ...f, [name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await apiClient.post('/hr/attendance', formData);
      alert.success('Attendance marked successfully');
      handleClose();
      load();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to mark attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <LoadingBackdrop open={loading} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Attendance Records</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search employee..."
            value={pagn.search}
            onChange={pagn.handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 20, color: '#94a3b8' }} />
                </InputAdornment>
              ),
            }}
            sx={{ width: 250, '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#fff' } }}
          />
          <Button 
            variant="contained" 
            size="small" 
            startIcon={<AddIcon />}
            onClick={handleOpen}
            sx={{ bgcolor: '#1e40af', textTransform: 'none', fontWeight: 600, borderRadius: '7px' }}
          >
            Mark Attendance
          </Button>
        </Box>
      </Box>

      <Box className="erp-gtable" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Box className="erp-gthead" sx={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 100px 1fr', px: 2, py: 1.25, bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
          {['Employee', 'Date', 'Status', 'Check-in', 'Remarks'].map(h => (
            <Typography key={h} variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.72rem' }}>{h}</Typography>
          ))}
        </Box>
        {pagn.pageRows.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>
            <Typography variant="body2">No attendance records found.</Typography>
          </Box>
        ) : pagn.pageRows.map(att => (
          <Box key={att.AttendanceID} className="erp-gtrow" sx={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 100px 1fr', alignItems: 'center', px: 2, py: 1.25, borderTop: '1px solid #f1f5f9' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{att.EmployeeName}</Typography>
            <Typography variant="body2">{formatDate(att.AttendanceDate)}</Typography>
            <Chip 
              label={att.Status} 
              size="small" 
              sx={{ 
                height: 20, 
                fontSize: '0.67rem', 
                fontWeight: 700,
                bgcolor: att.Status === 'Present' ? '#dcfce7' : '#fee2e2',
                color: att.Status === 'Present' ? '#166534' : '#991b1b'
              }} 
            />
            <Typography variant="body2">{att.CheckInTime || '—'}</Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {att.Remarks || '—'}
            </Typography>
          </Box>
        ))}
      </Box>

      <ErpPagination 
        count={pagn.filtered.length} 
        page={pagn.page} 
        onPageChange={pagn.setPage} 
        rowsPerPage={pagn.ROWS_PER_PAGE} 
      />

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '1rem' }}>
          Mark Attendance
          <IconButton size="small" onClick={handleClose}><CloseIcon /></IconButton>
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField 
                  select 
                  label="Employee *" 
                  fullWidth 
                  size="small" 
                  required 
                  value={formData.employeeId} 
                  onChange={set('employeeId')}
                >
                  {employees.map(emp => (
                    <MenuItem key={emp.EmployeeID} value={emp.EmployeeID}>
                      {emp.FirstName} {emp.LastName} ({emp.EmployeeCode})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField 
                  label="Date *" 
                  type="date" 
                  fullWidth 
                  size="small" 
                  required 
                  InputLabelProps={{ shrink: true }}
                  value={formData.attendanceDate} 
                  onChange={set('attendanceDate')} 
                />
              </Grid>
              <Grid item xs={6}>
                <TextField 
                  select 
                  label="Status *" 
                  fullWidth 
                  size="small" 
                  required 
                  value={formData.status} 
                  onChange={set('status')}
                >
                  {['Present', 'Absent', 'On Leave', 'Half Day'].map(s => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField 
                  label="Check-in Time" 
                  type="time" 
                  fullWidth 
                  size="small" 
                  InputLabelProps={{ shrink: true }}
                  value={formData.checkIn} 
                  onChange={set('checkIn')} 
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  label="Remarks" 
                  fullWidth 
                  size="small" 
                  multiline 
                  rows={2} 
                  value={formData.remarks} 
                  onChange={set('remarks')} 
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={handleClose} variant="outlined" size="small" sx={{ textTransform: 'none', borderRadius: '7px' }}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              size="small" 
              disabled={saving}
              sx={{ textTransform: 'none', borderRadius: '7px', bgcolor: '#1e40af', boxShadow: 'none', '&:hover': { bgcolor: '#1e3a8a' } }}
            >
              {saving ? 'Saving…' : 'Mark Attendance'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
