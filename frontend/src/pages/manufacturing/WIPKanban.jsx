import { formatINR, formatDate } from '../../utils/locale';
import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';

import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const WIP_STAGES = [
  { id: 'RAW_MATERIAL_ISSUED', label: 'Raw Material\nIssued',  color: '#64748b', bg: '#f8fafc' },
  { id: 'IN_PRODUCTION',       label: 'In\nProduction',         color: '#2563eb', bg: '#eff6ff' },
  { id: 'QUALITY_CHECK',       label: 'Quality\nCheck',         color: '#f59e0b', bg: '#fffbeb' },
  { id: 'FINISHED_GOODS',      label: 'Finished\nGoods',        color: '#10b981', bg: '#f0fdf4' },
  { id: 'DISPATCHED',          label: 'Dispatched',             color: '#8b5cf6', bg: '#f5f3ff' },
];

function WIPCard({ item }) {
  const progress = item.completion_percent || 0;
  return (
    <Box sx={{
      border: '1px solid #e2e8f0', borderRadius: 2, p: 1.75, bgcolor: '#fff', mb: 1.5,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      '&:hover': { boxShadow: '0 3px 10px rgba(0,0,0,0.1)', transform: 'translateY(-1px)', transition: 'all 0.15s' }
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.8125rem', lineHeight: 1.3 }}>
          {item.item_name || item.itemName || 'Unknown Item'}
        </Typography>
        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#2563eb', fontWeight: 700, fontSize: '0.75rem', ml: 1, whiteSpace: 'nowrap' }}>
          {item.work_order_number || item.workOrderNumber || `WO-${item.work_order_id}`}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          Qty: <strong>{Number(item.quantity || 0).toLocaleString("en-IN")}</strong>
        </Typography>
        {(item.planned_end_date || item.planned_end) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTimeOutlinedIcon sx={{ fontSize: 12, color: '#94a3b8' }} />
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
              {formatDate(item.planned_end_date || item.planned_end)}
            </Typography>
          </Box>
        )}
      </Box>

      {progress > 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>Progress</Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 600 }}>{progress}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress}
            sx={{ height: 5, borderRadius: 3, bgcolor: '#e2e8f0',
              '& .MuiLinearProgress-bar': { bgcolor: progress >= 100 ? '#10b981' : '#2563eb', borderRadius: 3 } }} />
        </Box>
      )}
    </Box>
  );
}

export default function WIPKanban() {
  const [wip, setWip]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/manufacturing/wip').catch(() => ({ data: [] }));
      setWip(Array.isArray(res.data) ? res.data : []);
      setError('');
    } catch { setError('Failed to load WIP data'); }
    finally { setLoading(false); }
  };

  const grouped = WIP_STAGES.reduce((acc, stage) => {
    acc[stage.id] = wip.filter(w => (w.current_stage || w.stage || w.status) === stage.id);
    return acc;
  }, {});

  const total = wip.length;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>WIP Kanban</Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            Work-in-progress across production stages · {total} active orders
          </Typography>
        </Box>
        <Button variant="outlined" size="small" startIcon={<RefreshOutlinedIcon />} onClick={load}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '7px',
            borderColor: '#cbd5e1', color: '#475569', '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' } }}>
          Refresh
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setError('')}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', gap: 2 }}>
          {WIP_STAGES.map(s => (
            <Box key={s.id} sx={{ flex: 1 }}>
              <Skeleton height={32} sx={{ mb: 1, borderRadius: 1.5 }} />
              {[...Array(2)].map((_, i) => <Skeleton key={i} height={90} sx={{ mb: 1, borderRadius: 1.5 }} />)}
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
          {WIP_STAGES.map(stage => {
            const cards = grouped[stage.id] || [];
            return (
              <Box key={stage.id} sx={{ minWidth: 220, flex: '1 1 220px' }}>
                {/* Column header */}
                <Box sx={{
                  p: 1.5, borderRadius: '10px 10px 0 0', bgcolor: stage.bg,
                  borderTop: `3px solid ${stage.color}`, border: `1px solid #e2e8f0`,
                  borderBottom: 'none', mb: 0
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: stage.color, fontSize: '0.75rem',
                      textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'pre-line', lineHeight: 1.2 }}>
                      {stage.label}
                    </Typography>
                    <Chip label={cards.length} size="small"
                      sx={{ height: 20, minWidth: 28, fontSize: '0.72rem', fontWeight: 700,
                        bgcolor: stage.color, color: '#fff' }} />
                  </Box>
                </Box>

                {/* Cards */}
                <Box sx={{
                  border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 10px 10px',
                  p: 1.5, minHeight: 200, bgcolor: '#fafbfc'
                }}>
                  {cards.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <CheckCircleOutlineIcon sx={{ fontSize: 24, color: '#e2e8f0', mb: 0.5 }} />
                      <Typography variant="caption" sx={{ color: '#cbd5e1', display: 'block', fontSize: '0.72rem' }}>
                        No items
                      </Typography>
                    </Box>
                  ) : (
                    cards.map((item, idx) => <WIPCard key={item.id || idx} item={item} />)
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
