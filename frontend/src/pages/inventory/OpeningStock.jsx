import { formatINR } from '../../utils/locale';
import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { useAlert } from '../../hooks/useAlert';
import LoadingBackdrop from '../../components/Shared/LoadingBackdrop';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import ErpTable, { ErpRow, ErpCell } from '../../components/Shared/ErpTable';

const EMPTY_LINE = { itemId: '', warehouseId: '', locationId: '', quantity: '', unitCost: '' };

const COLUMNS = [
  { label: 'Item Code', width: '150px', align: 'left'  },
  { label: 'Item Name', width: '1fr',   align: 'left'  },
  { label: 'Warehouse', width: '180px', align: 'left'  },
  { label: 'Qty',       width: '80px',  align: 'right' },
  { label: 'Unit Cost', width: '120px', align: 'right' },
  { label: 'Value',     width: '130px', align: 'right' },
];

const EDIT_COLUMNS = [
  { label: 'Item',      width: '220px', align: 'left'  },
  { label: 'Warehouse', width: '150px', align: 'left'  },
  { label: 'Location',  width: '120px', align: 'left'  },
  { label: 'Qty',       width: '80px',  align: 'right' },
  { label: 'Unit Cost', width: '100px', align: 'right' },
  { label: 'Value',     width: '110px', align: 'right' },
  { label: '',          width: '40px',  align: 'center'},
];

export default function OpeningStock() {
  const { success, error: alertError } = useAlert();
  const [entries, setEntries]       = useState([]);
  const [items, setItems]           = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [posting, setPosting]       = useState(false);
  const [lines, setLines]           = useState([{ ...EMPTY_LINE }]);
  const [status, setStatus]         = useState('Draft');
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [eRes, iRes, wRes, lRes] = await Promise.all([
        apiClient.get('/inventory/opening-stock').catch(() => ({ data: [] })),
        apiClient.get('/inventory/items').catch(() => ({ data: [] })),
        apiClient.get('/inventory/warehouses').catch(() => ({ data: [] })),
        apiClient.get('/inventory/locations').catch(() => ({ data: [] })),
      ]);
      const data = Array.isArray(eRes.data) ? eRes.data : [];
      setEntries(data);
      setItems(Array.isArray(iRes.data) ? iRes.data : []);
      setWarehouses(Array.isArray(wRes.data) ? wRes.data : []);
      setLocations(Array.isArray(lRes.data) ? lRes.data : []);
      
      if (data.length > 0) {
        const hasPosted = data.some(e => e.status === 'Posted');
        const currentStatus = hasPosted ? 'Posted' : (data[0].status || 'Draft');
        setStatus(currentStatus);
        
        // If we have draft entries, populate the editor lines
        if (currentStatus === 'Draft') {
          const draftLines = data.filter(e => e.status === 'Draft').map(e => ({
            itemId: e.item_id,
            warehouseId: e.warehouse_id,
            locationId: e.location_id || '',
            quantity: e.quantity,
            unitCost: e.unit_cost
          }));
          if (draftLines.length > 0) {
            setLines(draftLines);
          }
        }
      } else {
        setStatus('Draft');
        setLines([{ ...EMPTY_LINE }]);
      }
    } catch { alertError('Failed to load opening stock data'); }
    finally { setLoading(false); }
  };

  const setLine = (idx, field) => (e) => {
    const value = e.target.value;
    setLines(prev => prev.map((l, i) => {
      if (i !== idx) return l;
      
      const updated = { ...l, [field]: value };
      
      // Auto-feed unit cost when item is chosen
      if (field === 'itemId' && value) {
        const selectedItem = items.find(it => String(it.id) === String(value));
        if (selectedItem && selectedItem.unit_price) {
          updated.unitCost = selectedItem.unit_price;
        }
      }
      
      return updated;
    }));
  };

  const addLine    = () => setLines(prev => [...prev, { ...EMPTY_LINE }]);
  const removeLine = (idx) => setLines(prev => prev.filter((_, i) => i !== idx));

  const totalValue = lines.reduce((sum, l) => sum + (Number(l.quantity) * Number(l.unitCost) || 0), 0);

  const validLines = lines.filter(l => l.itemId && l.warehouseId && Number(l.quantity) > 0);

  const handleSave = async () => {
    if (validLines.length === 0) { alertError('Add at least one valid line'); return; }
    setSaving(true);
    try {
      await apiClient.post('/inventory/opening-stock', { lines: validLines });
      success('Draft saved successfully');
      load();
    } catch (err) {
      alertError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handlePostConfirmed = async () => {
    setConfirmOpen(false);
    setPosting(true);
    try {
      await apiClient.post('/inventory/opening-stock', { lines: validLines });
      await apiClient.post('/inventory/opening-stock/post');
      success('Opening stock posted — entries are now locked');
      setStatus('Posted'); load();
    } catch (err) {
      alertError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to post');
    } finally { setPosting(false); }
  };

  const handlePostClick = () => {
    if (validLines.length === 0) { alertError('Add at least one valid line before posting'); return; }
    setConfirmOpen(true);
  };

  const isPosted = status === 'Posted';

  return (
    <Box sx={{ p: 3 }}>
      <LoadingBackdrop open={loading} />
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>Opening Stock Entry</Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            One-time entry — locked permanently after posting
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip
            icon={isPosted ? <LockOutlinedIcon sx={{ fontSize: '14px !important' }} /> : undefined}
            label={status} size="small"
            sx={{ fontWeight: 700, fontSize: '0.75rem',
              bgcolor: isPosted ? '#dcfce7' : status === 'Submitted' ? '#fef9c3' : '#f1f5f9',
              color:   isPosted ? '#166534' : status === 'Submitted' ? '#854d0e' : '#475569' }}
          />
          {!isPosted && (
            <>
              <Button variant="outlined" size="small" startIcon={<SaveOutlinedIcon />} onClick={handleSave} disabled={saving}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '7px', borderColor: '#cbd5e1',
                  color: '#475569', px: 1.75, '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' } }}>
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button variant="contained" size="small" startIcon={<CheckCircleOutlineIcon />} onClick={handlePostClick} disabled={posting}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '7px', bgcolor: '#10b981',
                  '&:hover': { bgcolor: '#059669' }, px: 1.75 }}>
                {posting ? 'Posting...' : 'Post'}
              </Button>
            </>
          )}
        </Box>
      </Box>

      {isPosted ? (
        /* ── Posted: read-only table ── */
        <Box>
          <Alert severity="info" sx={{ mb: 2, borderRadius: 1.5 }}>
            Opening stock has been posted and is now locked. Adjustments can only be made via stock movement entries.
          </Alert>
          <ErpTable columns={COLUMNS} loading={loading}
            empty={!loading && entries.length === 0}
            emptyText="No opening stock entries found.">
            {!loading && entries.map((e, idx) => (
              <ErpRow key={e.id || idx}>
                <ErpCell mono color="#64748b">{e.item_code || e.itemCode || '—'}</ErpCell>
                <ErpCell bold color="#1e293b">{e.item_name || e.itemName || '—'}</ErpCell>
                <ErpCell color="#475569">{e.warehouse_name || e.warehouseName || '—'}</ErpCell>
                <ErpCell align="right" mono bold>{Number(e.quantity || 0).toLocaleString('en-IN')}</ErpCell>
                <ErpCell align="right" mono color="#64748b">{formatINR(Number(e.unit_cost || 0))}</ErpCell>
                <ErpCell align="right" mono bold color="#1e293b">
                  {formatINR(Number(e.total_value || (e.quantity * e.unit_cost) || 0))}
                </ErpCell>
              </ErpRow>
            ))}
          </ErpTable>
        </Box>
      ) : (
        /* ── Draft: editable entry grid ── */
        <Box sx={{ maxWidth: 960, mx: 'auto' }}>
          <ErpTable columns={EDIT_COLUMNS} loading={loading} empty={false}>
            {lines.map((line, idx) => {
              const lineTotal = (Number(line.quantity) * Number(line.unitCost)) || 0;
              const filteredLocs = locations.filter(l =>
                !line.warehouseId || String(l.warehouse_id) === String(line.warehouseId)
              );
              return (
                <ErpRow key={idx}>
                  <ErpCell>
                    <TextField select size="small" fullWidth value={line.itemId} onChange={setLine(idx, 'itemId')}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '0.8rem' } }}>
                      <MenuItem value=""><em>Select item</em></MenuItem>
                      {items.map(it => (
                        <MenuItem key={it.id} value={it.id}>{it.name || it.item_name}</MenuItem>
                      ))}
                    </TextField>
                  </ErpCell>
                  <ErpCell>
                    <TextField select size="small" fullWidth value={line.warehouseId} onChange={setLine(idx, 'warehouseId')}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '0.8rem' } }}>
                      <MenuItem value=""><em>Warehouse</em></MenuItem>
                      {warehouses.map(w => (
                        <MenuItem key={w.id || w.WarehouseId} value={w.id || w.WarehouseId}>{w.name || w.WarehouseName}</MenuItem>
                      ))}
                    </TextField>
                  </ErpCell>
                  <ErpCell>
                    <TextField select size="small" fullWidth value={line.locationId} onChange={setLine(idx, 'locationId')}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '0.8rem' } }}>
                      <MenuItem value=""><em>Location</em></MenuItem>
                      {filteredLocs.map(l => (
                        <MenuItem key={l.id} value={l.id}>{l.location_code || l.locationCode}</MenuItem>
                      ))}
                    </TextField>
                  </ErpCell>
                  <ErpCell>
                    <TextField size="small" fullWidth type="number" value={line.quantity} onChange={setLine(idx, 'quantity')}
                      inputProps={{ min: 0, style: { textAlign: 'right' } }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '0.8rem' } }} />
                  </ErpCell>
                  <ErpCell>
                    <TextField size="small" fullWidth type="number" value={line.unitCost} onChange={setLine(idx, 'unitCost')}
                      inputProps={{ min: 0, style: { textAlign: 'right' } }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '0.8rem' } }} />
                  </ErpCell>
                  <ErpCell align="right" mono bold color={lineTotal > 0 ? '#1e293b' : '#94a3b8'}>
                    {lineTotal > 0 ? formatINR(lineTotal) : '—'}
                  </ErpCell>
                  <ErpCell align="center">
                    <Tooltip title="Remove line">
                      <IconButton size="small" onClick={() => removeLine(idx)} disabled={lines.length === 1}
                        sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ErpCell>
                </ErpRow>
              );
            })}
          </ErpTable>

          {/* Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
            <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addLine}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '7px',
                borderColor: '#cbd5e1', color: '#475569', '&:hover': { borderColor: '#94a3b8' } }}>
              Add Line
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                Total Lines: <strong>{lines.length}</strong>
              </Typography>
              <Box sx={{ px: 2.5, py: 1, bgcolor: '#1e293b', borderRadius: 1.5 }}>
                <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>Total Value</Typography>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, fontFamily: 'monospace' }}>
                  {formatINR(totalValue)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* ── Post Confirmation Dialog ── */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ pb: 1, position: 'relative' }}>
          <IconButton
            onClick={() => setConfirmOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#94a3b8' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#fef3c7',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <WarningAmberRoundedIcon sx={{ color: '#d97706', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1.3 }}>
                Post Opening Stock?
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                This action cannot be undone
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 1, pb: 1 }}>
          <Alert severity="warning" sx={{ borderRadius: 1.5, fontSize: '0.8125rem' }}>
            Posting will <strong>permanently lock</strong> all {validLines.length} line{validLines.length !== 1 ? 's' : ''} and
            update actual stock levels. You will <strong>not be able to edit</strong> these entries afterwards.
          </Alert>
          <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#64748b' }}>Lines to post</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{validLines.length}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="body2" sx={{ color: '#64748b' }}>Total Value</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace', color: '#1e40af' }}>
                {formatINR(totalValue)}
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
          <Button onClick={() => setConfirmOpen(false)} variant="outlined" size="small"
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '7px',
              color: '#475569', borderColor: '#cbd5e1', '&:hover': { borderColor: '#94a3b8' } }}>
            Cancel
          </Button>
          <Button onClick={handlePostConfirmed} variant="contained" size="small" disabled={posting}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '7px',
              bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, boxShadow: 'none' }}>
            {posting ? 'Posting...' : 'Yes, Post Now'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
