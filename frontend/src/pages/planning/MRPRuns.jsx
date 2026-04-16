import { formatINR, formatDate } from '../../utils/locale';
import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

export default function MRPRuns() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = () => {
    apiClient.get('/planning/mrp-runs').then(res => { setList(res.data); setLoading(false); });
  };

  const handleRun = async () => {
    const period = prompt('Enter period (e.g. 2026-Q1):');
    if (period) {
      await apiClient.post('/planning/mrp-runs', { planningPeriod: period });
      load();
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>MRP Execution History</Typography>
        <Button variant="contained" size="small" startIcon={<PlayArrowIcon />} onClick={handleRun} sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}>Run MRP</Button>
      </Box>

      <Box className="erp-gtable" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Box className="erp-gthead" sx={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 140px 120px', px: 2, py: 1.25, bgcolor: '#f8fafc' }}>
          {['Run Date', 'Period', 'Orders Generated', 'Status'].map(h => <Typography key={h} variant="caption" sx={{ fontWeight: 700 }}>{h}</Typography>)}
        </Box>
        {loading ? <Skeleton height={100} /> : list.map(r => (
          <Box className="erp-gtrow" key={r.MRPRunID} sx={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 140px 120px', alignItems: 'center', px: 2, py: 1.25, borderTop: '1px solid #f1f5f9' }}>
            <Typography variant="body2">{formatDate(r.MRPRunDate)}</Typography>
            <Typography variant="body2">{r.PlanningPeriod}</Typography>
            <Typography variant="body2" sx={{ textAlign: 'center' }}>{r.TotalOrders}</Typography>
            <Chip label={r.Status} size="small" color="success" />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
