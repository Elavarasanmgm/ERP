import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Box from '@mui/material/Box';
import LoadingBackdrop from '../../components/Shared/LoadingBackdrop';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';

export default function VendorPerformance() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/supply-chain/vendors/performance')
      .then(res => { setList(res.data); setLoading(false); })
      .catch(() => { setError('Failed to load performance data'); setLoading(false); });
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <LoadingBackdrop open={loading} />
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', mb: 2.5 }}>Vendor Performance Scoring</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box className="erp-gtable" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden', mb: 4 }}>
        <Box className="erp-gthead" sx={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px 140px', px: 2, py: 1.25, bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
          {['Vendor', 'Total POs', 'On-time %', 'Avg Quality'].map((h, i) => (
            <Typography key={i} variant="caption" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', textAlign: i > 0 ? 'center' : 'left' }}>{h}</Typography>
          ))}
        </Box>
        {(
          list.map(v => (
            <Box className="erp-gthead erp-gtrow" key={v.VendorID} sx={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px 140px', alignItems: 'center', px: 2, py: '10px', borderBottom: '1px solid #f1f5f9', bgcolor: '#fff', '&:hover': { bgcolor: '#f8fafc' } }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{v.VendorName}</Typography>
              <Typography variant="body2" sx={{ textAlign: 'center' }}>{v.TotalPOs}</Typography>
              <Typography variant="body2" sx={{ textAlign: 'center', color: '#059669', fontWeight: 600 }}>{Number(v.OnTimePercentage || 0).toFixed(1)}%</Typography>
              <Typography variant="body2" sx={{ textAlign: 'center', color: '#1e40af', fontWeight: 600 }}>{Number(v.AvgQuality || 0).toFixed(1)}</Typography>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}
