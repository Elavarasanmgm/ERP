import { formatINR, formatDate } from '../../utils/locale';
import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LoadingBackdrop from '../../components/Shared/LoadingBackdrop';

export default function AssetReports() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/assets/reports/assets').then(res => { setList(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <LoadingBackdrop open={loading} />
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5 }}>Fixed Assets Summary</Typography>
      <Box className="erp-gtable" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Box className="erp-gthead" sx={{ display: 'grid', gridTemplateColumns: '1fr 100px 140px 140px 140px', px: 2, py: 1.25, bgcolor: '#f8fafc' }}>
          {['Category', 'Count', 'Total Cost', 'Total Deprec.', 'Book Value'].map(h => <Typography key={h} variant="caption" sx={{ fontWeight: 700 }}>{h}</Typography>)}
        </Box>
        {list.map((r, i) => (
          <Box className="erp-gtrow" key={i} sx={{ display: 'grid', gridTemplateColumns: '1fr 100px 140px 140px 140px', alignItems: 'center', px: 2, py: 1.25, borderTop: '1px solid #f1f5f9' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.Category}</Typography>
            <Typography variant="body2" sx={{ textAlign: 'center' }}>{r.Count}</Typography>
            <Typography variant="body2" sx={{ textAlign: 'right', pr: 2 }}>{formatINR(r.TotalCost)}</Typography>
            <Typography variant="body2" sx={{ textAlign: 'right', pr: 2 }}>{formatINR(r.TotalDepreciation)}</Typography>
            <Typography variant="body2" sx={{ textAlign: 'right', pr: 2, fontWeight: 700, color: '#1e40af' }}>{formatINR(r.TotalBookValue)}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
