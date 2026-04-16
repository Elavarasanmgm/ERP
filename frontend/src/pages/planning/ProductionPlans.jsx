import { formatINR, formatDate } from '../../utils/locale';
import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';

export default function ProductionPlans() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/planning/production-plans').then(res => { setList(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Production Plans</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />}>New Plan</Button>
      </Box>

      <Box className="erp-gtable" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Box className="erp-gthead" sx={{ display: 'grid', gridTemplateColumns: '120px 1.5fr 1fr 100px 110px 110px 100px', px: 2, py: 1.25, bgcolor: '#f8fafc' }}>
          {['Plan #', 'Item', 'Period', 'Qty', 'Start', 'End', 'Status'].map(h => <Typography key={h} variant="caption" sx={{ fontWeight: 700 }}>{h}</Typography>)}
        </Box>
        {loading ? <Skeleton height={100} /> : list.map(p => (
          <Box className="erp-gtrow" key={p.PlanID} sx={{ display: 'grid', gridTemplateColumns: '120px 1.5fr 1fr 100px 110px 110px 100px', alignItems: 'center', px: 2, py: 1.25, borderTop: '1px solid #f1f5f9' }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{p.PlanNumber}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.ItemName}</Typography>
            <Typography variant="body2">{p.PlanPeriod}</Typography>
            <Typography variant="body2">{p.PlannedQuantity}</Typography>
            <Typography variant="body2">{formatDate(p.StartDate)}</Typography>
            <Typography variant="body2">{formatDate(p.EndDate)}</Typography>
            <Chip label={p.Status} size="small" />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
