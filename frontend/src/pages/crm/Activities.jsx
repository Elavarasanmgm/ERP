import { formatINR, formatDate } from '../../utils/locale';
import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';

export default function Activities() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/crm/activities')
      .then(res => { setList(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5 }}>Recent Activities</Typography>
      <Box className="erp-gtable" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Box className="erp-gthead" sx={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 120px 100px', px: 2, py: 1.25, bgcolor: '#f8fafc' }}>
          {['Type', 'Subject', 'Lead/Contact', 'Date', 'Status'].map(h => <Typography key={h} variant="caption" sx={{ fontWeight: 700 }}>{h}</Typography>)}
        </Box>
        {loading ? <Skeleton height={100} /> : list.map(a => (
          <Box className="erp-gtrow" key={a.ActivityID} sx={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 120px 100px', alignItems: 'center', px: 2, py: 1.25, borderTop: '1px solid #f1f5f9' }}>
            <Typography variant="body2">{a.ActivityType}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{a.Subject}</Typography>
            <Typography variant="body2">{a.LeadName || '—'}</Typography>
            <Typography variant="body2">{formatDate(a.ActivityDate)}</Typography>
            <Chip label={a.Status} size="small" />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
