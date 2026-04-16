import { formatINR, formatDate } from '../../utils/locale';
import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import LoadingBackdrop from '../../components/Shared/LoadingBackdrop';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';

import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';

const STATUS_STYLES = {
  Draft:    { bg: '#f1f5f9', color: '#475569' },
  Submitted:{ bg: '#dbeafe', color: '#1e40af' },
  Approved: { bg: '#dcfce7', color: '#166534' },
  Rejected: { bg: '#fee2e2', color: '#dc2626' },
  Fulfilled:{ bg: '#f0fdf4', color: '#15803d' },
};

const EMPTY_LINE = { itemId: '', quantity: '', unitOfMeasure: 'Nos', requiredDate: '' };
const EMPTY_FORM = { mrNumber: '', requestedBy: '', salesOrderId: '', workOrderId: '', priority: 'Medium', remarks: '' };

export default function MaterialRequests() {
  const [list, setList]         = useState([]);
  const [items, setItems]       = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [open, setOpen]         = useState(false);
  const [saving, setSaving]     = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [lines, setLines]       = useState([{ ...EMPTY_LINE }]);
  const [error, setError]       = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess]   = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [mRes, iRes, sRes] = await Promise.all([
        apiClient.get('/purchase/material-requests').catch(() => ({ data: [] })),
        apiClient.get('/inventory/items').catch(() => ({ data: [] })),
        apiClient.get('/orders/sales-orders').catch(() => ({ data: [] })),
      ]);
      setList(Array.isArray(mRes.data) ? mRes.data : []);
      setItems(Array.isArray(iRes.data) ? iRes.data : []);
      setSalesOrders(Array.isArray(sRes.data) ? sRes.data : []);
      setError('');
    } catch { setError('Failed to load material requests'); }
    finally { setLoading(false); }
  };

  const set = (name) => (e) => setFormData(f => ({ ...f, [name]: e.target.value }));
  const setLine = (idx, field) => (e) => setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: e.target.value } : l));
  const addLine    = () => setLines(prev => [...prev, { ...EMPTY_LINE }]);
  const removeLine = (idx) => setLines(prev => prev.filter((_, i) => i !== idx));

  const handleOpen  = () => { setFormData(EMPTY_FORM); setLines([{ ...EMPTY_LINE }]); setFormError(''); setOpen(true); };
  const handleClose = () => { setOpen(false); setFormError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validLines = lines.filter(l => l.itemId && Number(l.quantity) > 0);
    if (validLines.length === 0) { setFormError('Add at least one item line'); return; }
    setSaving(true); setFormError('');
    try {
      await apiClient.post('/purchase/material-requests', { ...formData, lines: validLines });
      setSuccess('Material request created'); setOpen(false); load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <Box sx={{ p: 3 }}>
      <LoadingBackdrop open={loading} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>Material Requests</Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>MR from Sales Orders / Work Orders → triggers purchase quotation</Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpen}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '7px', bgcolor: '#2563eb',
            '&:hover': { bgcolor: '#1d4ed8' }, px: 2 }}>
          New MR
        </Button>
      </Box>

      {error   && <Alert severity="error"   sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Box className="erp-gtable" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Box className="erp-gthead" sx={{ display: 'grid', gridTemplateColumns: '150px 1.5fr 1fr 100px 120px 110px', px: 2, py: 1.25, bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
          {['MR Number', 'Requested By', 'Source', 'Priority', 'Date', 'Status'].map((h, i) => (
            <Typography key={i} variant="caption"
              sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase' }}>
              {h}
            </Typography>
          ))}
        </Box>

        {list.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <AssignmentOutlinedIcon sx={{ fontSize: 36, color: '#cbd5e1', mb: 1 }} />
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>No material requests yet.</Typography>
          </Box>
        ) : (
          list.map((mr, idx) => {
            const s = STATUS_STYLES[mr.status] || STATUS_STYLES.Draft;
            return (
              <Box className="erp-gthead erp-gtrow" key={mr.id || idx} sx={{ display: 'grid', gridTemplateColumns: '150px 1.5fr 1fr 100px 120px 110px', alignItems: 'center', px: 2, py: '10px', borderBottom: idx < list.length - 1 ? '1px solid #f1f5f9' : 'none', '&:hover': { bgcolor: '#f8fafc' } }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#2563eb', fontWeight: 600, fontSize: '0.8125rem' }}>
                  {mr.mr_number || mr.mrNumber || `MR-${String(mr.id).padStart(4,'0')}`}
                </Typography>
                <Typography variant="body2" sx={{ color: '#1e293b', fontSize: '0.8125rem' }}>
                  {mr.requested_by || mr.requestedBy || '—'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8125rem' }}>
                  {mr.sales_order_number || mr.so_number || mr.work_order_number || '—'}
                </Typography>
                <Chip label={mr.priority || 'Medium'} size="small"
                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600,
                    bgcolor: mr.priority === 'High' ? '#fee2e2' : mr.priority === 'Low' ? '#f1f5f9' : '#fef9c3',
                    color:   mr.priority === 'High' ? '#dc2626' : mr.priority === 'Low' ? '#475569' : '#854d0e' }} />
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8125rem' }}>
                  {mr.created_at ? formatDate(mr.created_at) : '—'}
                </Typography>
                <Chip label={mr.status || 'Draft'} size="small"
                  sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600, bgcolor: s.bg, color: s.color }} />
              </Box>
            );
          })
        )}
      </Box>

      {/* Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid #f1f5f9', pb: 1.5, fontWeight: 700, fontSize: '1rem' }}>
          New Material Request
          <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 2.5 }}>
            {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>{formError}</Alert>}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={4}>
                <TextField fullWidth size="small" label="MR Number (optional)" value={formData.mrNumber} onChange={set('mrNumber')}
                  placeholder="Auto-generated" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth size="small" label="Requested By" value={formData.requestedBy} onChange={set('requestedBy')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              </Grid>
              <Grid item xs={4}>
                <TextField select fullWidth size="small" label="Priority" value={formData.priority} onChange={set('priority')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}>
                  {['High', 'Medium', 'Low'].map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField select fullWidth size="small" label="Sales Order (optional)" value={formData.salesOrderId} onChange={set('salesOrderId')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}>
                  <MenuItem value=""><em>None</em></MenuItem>
                  {salesOrders.map(s => (
                    <MenuItem key={s.id} value={s.id}>{s.so_number || s.SalesOrderNumber || `SO-${s.id}`}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth size="small" label="Remarks" value={formData.remarks} onChange={set('remarks')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              </Grid>
            </Grid>

            {/* Lines */}
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em', mb: 1, display: 'block' }}>
              Items Required
            </Typography>
            <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5, overflow: 'hidden', mb: 1.5 }}>
              <Box className="erp-gthead" sx={{ display: 'grid', gridTemplateColumns: '2.5fr 100px 120px 150px 36px', px: 1.5, py: 1, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Item *', 'Qty *', 'UOM', 'Required Date', ''].map((h, i) => (
                  <Typography key={i} variant="caption" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase' }}>{h}</Typography>
                ))}
              </Box>
              {lines.map((line, idx) => (
                <Box className="erp-gtrow" key={idx} sx={{ display: 'grid', gridTemplateColumns: '2.5fr 100px 120px 150px 36px', alignItems: 'center', px: 1.5, py: 0.75, borderBottom: '1px solid #f1f5f9' }}>
                  <TextField select size="small" value={line.itemId} onChange={setLine(idx, 'itemId')}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '0.8125rem' } }}>
                    <MenuItem value=""><em>Select item</em></MenuItem>
                    {items.map(it => <MenuItem key={it.id} value={it.id}>{it.name || it.item_name}</MenuItem>)}
                  </TextField>
                  <TextField size="small" type="number" value={line.quantity} onChange={setLine(idx, 'quantity')}
                    inputProps={{ min: 1, style: { textAlign: 'right' } }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '0.8125rem' } }} />
                  <TextField size="small" value={line.unitOfMeasure} onChange={setLine(idx, 'unitOfMeasure')}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '0.8125rem' } }} />
                  <TextField size="small" type="date" value={line.requiredDate} onChange={setLine(idx, 'requiredDate')}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '0.8125rem' } }} />
                  <Tooltip title="Remove">
                    <IconButton size="small" onClick={() => removeLine(idx)} disabled={lines.length === 1}
                      sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Box>
            <Button size="small" startIcon={<AddIcon />} onClick={addLine}
              sx={{ textTransform: 'none', color: '#2563eb', fontWeight: 600, fontSize: '0.8125rem' }}>
              Add Line
            </Button>
          </DialogContent>
          <DialogActions sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", gap: 1, px: 3, pb: 2.5 }}>
            <Button onClick={handleClose} sx={{ textTransform: 'none', color: '#64748b' }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '7px', bgcolor: '#2563eb',
                '&:hover': { bgcolor: '#1d4ed8' }, px: 3 }}>
              {saving ? 'Saving…' : 'Create MR'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
