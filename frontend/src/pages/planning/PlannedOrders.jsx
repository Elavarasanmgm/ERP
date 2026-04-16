import { formatINR, formatDate } from '../../utils/locale';
import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';

export default function PlannedOrders() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/planning/planned-orders').then(res => { setList(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5 }}>Planned Orders (MRP Generated)</Typography>
      <Box className="erp-gtable" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Box className="erp-gthead" sx={{ display: 'grid', gridTemplateColumns: '120px 1.5fr 100px 120px 120px 100px', px: 2, py: 1.25, bgcolor: '#f8fafc' }}>
          {['Order #', 'Item', 'Qty', 'Required', 'Start', 'Status'].map(h => <Typography key={h} variant="caption" sx={{ fontWeight: 700 }}>{h}</Typography>)}
        </Box>
        {loading ? <Skeleton height={100} /> : list.map(o => (
          <Box className="erp-gtrow" key={o.OrderID} sx={{ display: 'grid', gridTemplateColumns: '120px 1.5fr 100px 120px 120px 100px', alignItems: 'center', px: 2, py: 1.25, borderTop: '1px solid #f1f5f9' }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{o.OrderNumber}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{o.ItemName}</Typography>
            <Typography variant="body2">{o.OrderQuantity}</Typography>
            <Typography variant="body2">{formatDate(o.RequiredDate)}</Typography>
            <Typography variant="body2">{formatDate(o.PlannedStartDate)}</Typography>
            <Chip label={o.Status} size="small" />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
