import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { formatINR, formatDate } from '../../utils/locale';
import { useAlert } from '../../hooks/useAlert';
import LoadingBackdrop from '../../components/Shared/LoadingBackdrop';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import usePagination from '../../hooks/usePagination';
import ErpPagination from '../../components/Shared/ErpPagination';
import ErpTable, { ErpRow, ErpCell } from '../../components/Shared/ErpTable';

const TYPE_COLOR = {
  'Receipt':    { bg: '#dcfce7', color: '#166534' },
  'Issue':      { bg: '#fee2e2', color: '#dc2626' },
  'Transfer':   { bg: '#dbeafe', color: '#1e40af' },
  'Adjustment': { bg: '#fef3c7', color: '#92400e' },
  'Return':     { bg: '#f3e8ff', color: '#7e22ce' },
};
const tc = (t) => TYPE_COLOR[t] || { bg: '#f1f5f9', color: '#475569' };

const COLUMNS = [
  { label: 'Date',      width: '100px', align: 'left'  },
  { label: 'Item',      width: '220px', align: 'left'  },
  { label: 'Type',      width: '120px', align: 'left'  },
  { label: 'Qty',       width: '70px',  align: 'right' },
  { label: 'From',      width: '1fr',   align: 'left'  },
  { label: 'To',        width: '1fr',   align: 'left'  },
  { label: 'Reference', width: '140px', align: 'left'  },
];

export default function StockMovements() {
  const { error: alertError } = useAlert();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('');

  const pagn = usePagination(movements, (item, q) =>
    (item.item_name || '').toLowerCase().includes(q) ||
    (item.movement_type || '').toLowerCase().includes(q)
  );

  useEffect(() => {
    apiClient.get('/inventory/movements')
      .then(r => { setMovements(r.data || []); setTimeout(() => setLoading(false), 300); })
      .catch(() => { alertError('Failed to load stock movements'); setTimeout(() => setLoading(false), 300); });
  }, []);

  const allTypes = [...new Set(movements.map(m => m.movement_type || m.type).filter(Boolean))];

  const displayRows = filter
    ? pagn.pageRows.filter(m => (m.movement_type || m.type || '') === filter)
    : pagn.pageRows;

  return (
    <Box sx={{ p: 3 }}>
      <LoadingBackdrop open={loading} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>Stock Movement History</Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            {pagn.filtered.length} movement{pagn.filtered.length !== 1 ? 's' : ''} found
          </Typography>
        </Box>
        <TextField select label="Filter by Type" size="small" value={filter} onChange={e => setFilter(e.target.value)}
          sx={{ minWidth: 160 }}>
          <MenuItem value="">All Types</MenuItem>
          {allTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
      </Box>

      <ErpTable columns={COLUMNS} loading={loading}
        empty={!loading && pagn.filtered.length === 0}
        emptyText="No stock movements found.">
        {!loading && displayRows.map((m, i) => {
          const movType = m.movement_type || m.type || '—';
          const colors  = tc(movType);
          const qty     = Number(m.quantity || m.qty || 0);
          return (
            <ErpRow key={m.id || i}>
              <ErpCell color="#475569">
                {m.moved_date || m.movement_date ? formatDate(m.moved_date || m.movement_date) : '—'}
              </ErpCell>
              <ErpCell bold color="#1e293b" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.item_name || m.itemname || '—'}
              </ErpCell>
              <ErpCell sx={{ overflow: 'visible' }}>
                <Chip label={movType} size="small"
                  sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: colors.bg, color: colors.color, maxWidth: '130px' }} />
              </ErpCell>
              <ErpCell align="right" mono bold
                color={movType === 'Issue' ? '#dc2626' : movType === 'Receipt' ? '#16a34a' : '#1e293b'}>
                {movType === 'Issue' ? '−' : '+'}{Math.abs(qty)}
              </ErpCell>
              <ErpCell color="#64748b" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.from_location || ((['OUT', 'Issue', 'Transfer'].includes(movType)) ? m.warehouse : 'External') || '—'}
              </ErpCell>
              <ErpCell color="#64748b" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.to_location || ((['IN', 'Receipt', 'Transfer', 'WO_RECEIPT'].includes(movType)) ? m.warehouse : 'External') || '—'}
              </ErpCell>
              <ErpCell mono color="#475569" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.reference_type
                  ? `${m.reference_type}${m.reference_id ? ' #' + m.reference_id : ''}`
                  : m.reference || m.reference_no || '—'}
              </ErpCell>
            </ErpRow>
          );
        })}
      </ErpTable>

      <ErpPagination count={pagn.filtered.length} page={pagn.page} onPageChange={pagn.setPage} rowsPerPage={pagn.ROWS_PER_PAGE} />
    </Box>
  );
}
