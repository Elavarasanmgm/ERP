import { formatINR, formatDate } from '../../utils/locale';
import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import LoadingBackdrop from '../../components/Shared/LoadingBackdrop';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';

export default function GoodsReceipt() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/supply-chain/goods-receipt')
      .then(res => { setList(res.data); setLoading(false); })
      .catch(() => { setError('Failed to load goods receipts'); setLoading(false); });
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <LoadingBackdrop open={loading} />
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', mb: 2.5 }}>Goods Receipt Notes (GRN)</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box className="erp-gtable" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden', mb: 4 }}>
        <Box className="erp-gthead" sx={{ display: 'grid', gridTemplateColumns: '140px 1fr 100px 120px 100px 120px', px: 2, py: 1.25, bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
          {['Receipt #', 'Vendor', 'PO ID', 'Date', 'Qty', 'Status'].map((h, i) => (
            <Typography key={i} variant="caption" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</Typography>
          ))}
        </Box>
        {(list.map(gr => (
            <Box className="erp-gthead erp-gtrow" key={gr.ReceiptID} sx={{ display: 'grid', gridTemplateColumns: '140px 1fr 100px 120px 100px 120px', alignItems: 'center', px: 2, py: '10px', borderBottom: '1px solid #f1f5f9', bgcolor: '#fff', '&:hover': { bgcolor: '#f8fafc' } }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#2563eb', fontWeight: 700 }}>{gr.ReceiptNumber}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{gr.VendorName}</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>#{gr.PurchaseOrderID}</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>{formatDate(gr.ReceiptDate)}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{gr.TotalQuantity}</Typography>
              <Chip label={gr.Status} size="small" sx={{ height: 20, fontSize: '0.67rem', fontWeight: 700, bgcolor: '#dcfce7', color: '#166534' }} />
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}
