import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import LinearProgress from '@mui/material/LinearProgress';

export default function CapacityPlanning() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/planning/capacity').then(res => { setList(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5 }}>Resource Capacity Utilization</Typography>
      <Box className="erp-gtable" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Box className="erp-gthead" sx={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 2fr', px: 2, py: 1.25, bgcolor: '#f8fafc' }}>
          {['Resource', 'Planned', 'Available', 'Utilization'].map(h => <Typography key={h} variant="caption" sx={{ fontWeight: 700 }}>{h}</Typography>)}
        </Box>
        {loading ? <Skeleton height={100} /> : list.map(c => (
          <Box key={c.ResourceID} className="erp-gtrow" sx={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 2fr', alignItems: 'center', px: 2, py: 1.5, borderTop: '1px solid #f1f5f9' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.ResourceName}</Typography>
            <Typography variant="body2">{c.PlannedCapacity} hrs</Typography>
            <Typography variant="body2">{c.AvailableCapacity} hrs</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pr: 2 }}>
              <LinearProgress variant="determinate" value={Math.min(c.UtilizationPercentage, 100)} sx={{ flex: 1, height: 8, borderRadius: 5, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: c.UtilizationPercentage > 90 ? '#dc2626' : '#1e40af' } }} />
              <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 35 }}>{c.UtilizationPercentage}%</Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
