import { formatINR, formatDate } from '../../utils/locale';
import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import LoadingBackdrop from '../../components/Shared/LoadingBackdrop';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';

import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

const TRACE_STEPS = [
  { key: 'so',        label: 'Sales Order',      color: '#2563eb' },
  { key: 'pi',        label: 'Proforma Invoice', color: '#8b5cf6' },
  { key: 'advance',   label: 'Advance Payment',  color: '#f59e0b' },
  { key: 'wo',        label: 'Work Order',        color: '#06b6d4' },
  { key: 'invoice',   label: 'Tax Invoice',       color: '#10b981' },
  { key: 'payment',   label: 'Final Payment',     color: '#ec4899' },
  { key: 'delivery',  label: 'Delivery Order',    color: '#64748b' },
];

function TimelineStep({ step, data, isLast }) {
  const done = Boolean(data);
  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      {/* Connector */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
        {done
          ? <CheckCircleIcon sx={{ fontSize: 24, color: step.color, zIndex: 1 }} />
          : <RadioButtonUncheckedIcon sx={{ fontSize: 24, color: '#cbd5e1', zIndex: 1 }} />
        }
        {!isLast && (
          <Box sx={{ width: 2, flex: 1, bgcolor: done ? step.color : '#e2e8f0', my: 0.25, minHeight: 28 }} />
        )}
      </Box>

      {/* Content */}
      <Box sx={{ pb: isLast ? 0 : 2.5, flex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.25 }}>
          <Typography variant="body2"
            sx={{ fontWeight: done ? 700 : 500, color: done ? '#1e293b' : '#94a3b8', fontSize: '0.875rem' }}>
            {step.label}
          </Typography>
          {done && data.number && (
            <Typography variant="caption"
              sx={{ fontFamily: 'monospace', fontWeight: 700, color: step.color, fontSize: '0.75rem' }}>
              {data.number}
            </Typography>
          )}
        </Box>
        {done && (
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {data.date && (
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                {formatDate(data.date)}
              </Typography>
            )}
            {data.amount != null && (
              <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                {formatINR(Number(data.amount))}
              </Typography>
            )}
            {data.status && (
              <Chip label={data.status} size="small"
                sx={{ height: 18, fontSize: '0.68rem', fontWeight: 600,
                  bgcolor: `${step.color}20`, color: step.color }} />
            )}
          </Box>
        )}
        {!done && (
          <Typography variant="caption" sx={{ color: '#cbd5e1', fontSize: '0.75rem' }}>Not yet created</Typography>
        )}
      </Box>
    </Box>
  );
}

function TraceCard({ so, expanded, onToggle }) {
  const t = so.traceability || {};
  const completedSteps = TRACE_STEPS.filter(s => t[s.key]).length;
  const pct = Math.round((completedSteps / TRACE_STEPS.length) * 100);

  return (
    <Box className="erp-gtable" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden', mb: 2 }}>
      {/* Card header */}
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, bgcolor: '#f8fafc',
        cursor: 'pointer', '&:hover': { bgcolor: '#f1f5f9' } }} onClick={onToggle}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.875rem' }}>
              {so.so_number || so.soNumber || `SO-${so.id}`}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {so.customer_name || so.customerName || '—'}
            </Typography>
            <Chip label={so.status || 'Open'} size="small"
              sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600,
                bgcolor: so.status === 'Completed' ? '#dcfce7' : so.status === 'Cancelled' ? '#fee2e2' : '#dbeafe',
                color:   so.status === 'Completed' ? '#166534' : so.status === 'Cancelled' ? '#dc2626' : '#1e40af' }} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ flex: 1, height: 5, bgcolor: '#e2e8f0', borderRadius: 3, maxWidth: 200 }}>
              <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: pct === 100 ? '#10b981' : '#2563eb', borderRadius: 3, transition: 'width 0.3s' }} />
            </Box>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600 }}>
              {completedSteps}/{TRACE_STEPS.length} steps · {pct}%
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {so.total_amount != null && (
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e293b' }}>
              {formatINR(Number(so.total_amount))}
            </Typography>
          )}
          <IconButton size="small" sx={{ color: '#64748b' }}>
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ p: 2.5, borderTop: '1px solid #f1f5f9' }}>
          {TRACE_STEPS.map((step, idx) => (
            <TimelineStep key={step.key} step={step} data={t[step.key]} isLast={idx === TRACE_STEPS.length - 1} />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

export default function SOTraceability() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [search, setSearch]   = useState('');
  const [error, setError]     = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/orders/so-traceability').catch(() => ({ data: [] }));
      const data = Array.isArray(res.data) ? res.data : [];
      setOrders(data);
      // Auto-expand first item
      if (data.length > 0) setExpanded({ [data[0].id]: true });
      setError('');
    } catch { setError('Failed to load SO traceability'); }
    finally { setLoading(false); }
  };

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    return !q ||
      (o.so_number || '').toLowerCase().includes(q) ||
      (o.customer_name || '').toLowerCase().includes(q);
  });

  return (
    <Box sx={{ p: 3 }}>
      <LoadingBackdrop open={loading} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>SO Traceability</Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            End-to-end: SO → Proforma → Advance → WO → Invoice → Payment → Delivery
          </Typography>
        </Box>
        <Button variant="outlined" size="small" startIcon={<RefreshOutlinedIcon />} onClick={load}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '7px',
            borderColor: '#cbd5e1', color: '#475569', '&:hover': { borderColor: '#94a3b8' } }}>
          Refresh
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Search */}
      <TextField size="small" placeholder="Search by SO number or customer…"
        value={search} onChange={e => setSearch(e.target.value)}
        sx={{ mb: 2.5, width: 320, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />

      {/* Summary chips */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Orders', value: orders.length,                                                  color: '#2563eb', bg: '#eff6ff' },
          { label: 'Completed',    value: orders.filter(o => o.status === 'Completed').length,             color: '#10b981', bg: '#f0fdf4' },
          { label: 'In Progress',  value: orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Cancelled',    value: orders.filter(o => o.status === 'Cancelled').length,             color: '#ef4444', bg: '#fef2f2' },
        ].map(s => (
          <Chip key={s.label} label={`${s.label}: ${s.value}`} size="small"
            sx={{ fontWeight: 600, fontSize: '0.8rem', bgcolor: s.bg, color: s.color, border: `1px solid ${s.color}30` }} />
        ))}
      </Box>

      {filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, border: '2px dashed #e2e8f0', borderRadius: 2 }}>
          <FiberManualRecordIcon sx={{ fontSize: 36, color: '#cbd5e1', mb: 1 }} />
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            {search ? 'No orders match your search.' : 'No sales orders found.'}
          </Typography>
        </Box>
      ) : (
        filtered.map(so => (
          <TraceCard key={so.id} so={so} expanded={!!expanded[so.id]} onToggle={() => toggle(so.id)} />
        ))
      )}
    </Box>
  );
}
