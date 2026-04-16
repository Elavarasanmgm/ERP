import { formatINR, formatDate } from '../../utils/locale';
import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';

const STAGE_COLOR = {
  'Qualification':  { bg: '#f1f5f9', color: '#475569' },
  'Proposal':       { bg: '#dbeafe', color: '#1e40af' },
  'Negotiation':    { bg: '#fef3c7', color: '#92400e' },
  'Closed Won':     { bg: '#dcfce7', color: '#166534' },
  'Closed Lost':    { bg: '#fee2e2', color: '#dc2626' },
};
const sc = (s) => STAGE_COLOR[s] || { bg: '#f1f5f9', color: '#475569' };

export default function Opportunities() {
  const [list, setList]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    apiClient.get('/crm/opportunities')
      .then(res => { setList(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const convertToSO = async (opp) => {
    const id = opp.opportunityid || opp.OpportunityID;
    const name = opp.opportunityname || opp.OpportunityName;
    if (!window.confirm(`Mark "${name}" as Won and create a Sales Order?`)) return;
    try {
      const res = await apiClient.put(`/crm/opportunities/${id}/convert-to-so`);
      setSuccess(`Opportunity Won! Sales Order ${res.data.order_number} created.`);
      load();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to convert opportunity');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5 }}>Sales Opportunities</Typography>

      {error   && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Box className="erp-gtable" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Box className="erp-gthead" sx={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 130px 130px 120px 100px 120px', px: 2, py: 1.25, bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
          {['Opportunity', 'Lead', 'Amount', 'Stage', 'Expected Close', 'Status', 'Action'].map(h => (
            <Typography key={h} variant="caption" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</Typography>
          ))}
        </Box>
        {loading ? <Skeleton height={100} /> : list.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}><Typography variant="body2">No opportunities yet.</Typography></Box>
        ) : list.map(opp => {
          const stage  = opp.stage  || opp.Stage  || '';
          const status = opp.status || opp.Status || '';
          const stageColor = sc(stage);
          const isWon = stage === 'Closed Won' || status === 'Won';
          return (
            <Box className="erp-gthead erp-gtrow" key={opp.opportunityid || opp.OpportunityID} sx={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 130px 130px 120px 100px 120px', alignItems: 'center', px: 2, py: 1.25, borderTop: '1px solid #f1f5f9', '&:hover': { bgcolor: '#f8fafc' } }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>{opp.opportunityname || opp.OpportunityName}</Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>{opp.leadname || opp.LeadName || '—'}</Typography>
              <Typography variant="body2" sx={{ textAlign: 'right', pr: 2, fontFamily: 'monospace', fontWeight: 600 }}>{formatINR(Number(opp.amount || opp.Amount || 0))}</Typography>
              <Chip label={stage || '—'} size="small" sx={{ height: 20, fontSize: '0.67rem', fontWeight: 700, bgcolor: stageColor.bg, color: stageColor.color }} />
              <Typography variant="body2" sx={{ color: '#64748b' }}>{opp.expectedclosedate || opp.ExpectedCloseDate ? formatDate(opp.expectedclosedate || opp.ExpectedCloseDate) : '—'}</Typography>
              <Chip label={status || 'Open'} size="small" sx={{ height: 20, fontSize: '0.67rem', fontWeight: 700,
                bgcolor: isWon ? '#dcfce7' : '#f1f5f9', color: isWon ? '#166534' : '#475569' }} />
              <Box>
                {!isWon && (
                  <Button variant="contained" size="small" onClick={() => convertToSO(opp)}
                    sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.72rem', borderRadius: '7px',
                      bgcolor: '#d97706', boxShadow: 'none', py: 0.5, px: 1.5,
                      '&:hover': { bgcolor: '#b45309' } }}>
                    Win → SO
                  </Button>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
