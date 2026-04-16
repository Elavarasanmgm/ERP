import { formatDate } from '../../utils/locale';
import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LoadingBackdrop from '../../components/Shared/LoadingBackdrop';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';

const STATUS_COLOR = { Pending: { bg: '#fef3c7', color: '#92400e' }, Approved: { bg: '#dcfce7', color: '#166534' }, Rejected: { bg: '#fee2e2', color: '#dc2626' } };
const sc = s => STATUS_COLOR[s] || { bg: '#f1f5f9', color: '#475569' };

export default function Leaves() {
  const [list, setList]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const load = () => { setLoading(true); apiClient.get('/hr/leaves').then(r => { setList(r.data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await apiClient.put(`/hr/leaves/${id}`, { status });
      setSuccess(`Leave ${status.toLowerCase()}`);
      load();
    } catch { setError('Failed to update leave'); }
  };

  return (
    <Box sx={{ p: 3 }}>
      <LoadingBackdrop open={loading} />
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5 }}>Leave Applications</Typography>
      {error   && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      <Box className="erp-gtable" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Box className="erp-gthead" sx={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 110px 110px 60px 100px 160px', px: 2, py: 1.25, bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
          {['Employee','Type','From','To','Days','Status','Action'].map(h => <Typography key={h} variant="caption" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</Typography>)}
        </Box>
        {list.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}><Typography variant="body2">No leave applications.</Typography></Box>
        ) : list.map(l => {
          const id = l.leaveid || l.LeaveID;
          const status = l.status || l.Status || 'Pending';
          const c = sc(status);
          return (
            <Box className="erp-gthead erp-gtrow" key={id} sx={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 110px 110px 60px 100px 160px', alignItems: 'center', px: 2, py: 1.25, borderTop: '1px solid #f1f5f9', '&:hover': { bgcolor: '#f8fafc' } }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{l.employeename||l.EmployeeName}</Typography>
              <Typography variant="body2">{l.leavetype||l.LeaveType}</Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>{formatDate(l.startdate||l.StartDate)}</Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>{formatDate(l.enddate||l.EndDate)}</Typography>
              <Typography variant="body2" sx={{ textAlign: 'center', fontWeight: 600 }}>{l.days||l.Days}</Typography>
              <Chip label={status} size="small" sx={{ height: 20, fontSize: '0.67rem', fontWeight: 700, bgcolor: c.bg, color: c.color }} />
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {status === 'Pending' && <>
                  <Button size="small" variant="contained" onClick={() => updateStatus(id, 'Approved')}
                    sx={{ textTransform: 'none', fontSize: '0.7rem', borderRadius: '6px', py: 0.4, px: 1, bgcolor: '#16a34a', boxShadow: 'none', '&:hover': { bgcolor: '#15803d' } }}>
                    Approve
                  </Button>
                  <Button size="small" variant="contained" onClick={() => updateStatus(id, 'Rejected')}
                    sx={{ textTransform: 'none', fontSize: '0.7rem', borderRadius: '6px', py: 0.4, px: 1, bgcolor: '#dc2626', boxShadow: 'none', '&:hover': { bgcolor: '#b91c1c' } }}>
                    Reject
                  </Button>
                </>}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
