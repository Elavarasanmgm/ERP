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
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';

const STATUS_STYLES = {
  Draft:    { bg: '#f1f5f9', color: '#475569' },
  Received: { bg: '#fef9c3', color: '#854d0e' },
  Verified: { bg: '#dbeafe', color: '#1e40af' },
  Posted:   { bg: '#dcfce7', color: '#166534' },
};

const EMPTY_LINE = { itemId: '', orderedQty: '', receivedQty: '', rejectedQty: '0', unitCost: '', remarks: '' };
const EMPTY_FORM = { grnNumber: '', purchaseOrderId: '', supplierId: '', receivedDate: new Date().toISOString().split('T')[0], vehicleNumber: '', deliveryNoteNumber: '', remarks: '' };

export default function GoodsReceipts() {
  const [list, setList]         = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPOs] = useState([]);
  const [items, setItems]       = useState([]);
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
      const [gRes, sRes, pRes, iRes] = await Promise.all([
        apiClient.get('/purchase/goods-receipts').catch(() => ({ data: [] })),
        apiClient.get('/accounting/suppliers').catch(() => ({ data: [] })),
        apiClient.get('/orders/purchase-orders').catch(() => ({ data: [] })),
        apiClient.get('/inventory/items').catch(() => ({ data: [] })),
      ]);
      setList(Array.isArray(gRes.data) ? gRes.data : []);
      setSuppliers(Array.isArray(sRes.data) ? sRes.data : []);
      setPOs(Array.isArray(pRes.data) ? pRes.data : []);
      setItems(Array.isArray(iRes.data) ? iRes.data : []);
      setError('');
    } catch { setError('Failed to load GRNs'); }
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
    if (!formData.supplierId) { setFormError('Supplier is required'); return; }
    const validLines = lines.filter(l => l.itemId && Number(l.receivedQty) > 0);
    if (validLines.length === 0) { setFormError('Add at least one received item'); return; }
    setSaving(true); setFormError('');
    try {
      await apiClient.post('/purchase/goods-receipts', { ...formData, lines: validLines });
      setSuccess('GRN created — stock updated'); setOpen(false); load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to save GRN');
    } finally { setSaving(false); }
  };

  const totalValue = list.reduce((sum, g) => sum + Number(g.total_value || g.totalValue || 0), 0);

  return (
    <Box sx={{ p: 3 }}>
      <LoadingBackdrop open={loading} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>Goods Receipt Notes (GRN)</Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            Record material received from suppliers — updates inventory stock
          </Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpen}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '7px', bgcolor: '#2563eb',
            '&:hover': { bgcolor: '#1d4ed8' }, px: 2 }}>
          New GRN
        </Button>
      </Box>

      {error   && <Alert severity="error"   sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Summary */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        {[
          { label: 'Total GRNs',     value: list.length,                                          color: '#2563eb' },
          { label: 'Posted',         value: list.filter(g => g.status === 'Posted').length,       color: '#10b981' },
          { label: 'Total Value',    value: `₹${(totalValue/1000).toFixed(0)}K`,                  color: '#8b5cf6' },
        ].map(s => (
          <Box key={s.label} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, px: 2.5, py: 1.5, minWidth: 130 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: s.color }}>{s.value}</Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>{s.label}</Typography>
          </Box>
        ))}
      </Box>

      <Box className="erp-gtable" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Box className="erp-gthead" sx={{ display: 'grid', gridTemplateColumns: '150px 2fr 1fr 130px 140px 110px',
          px: 2, py: 1.25, bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
          {['GRN Number', 'Supplier', 'PO Reference', 'Received Date', 'Total Value', 'Status'].map((h, i) => (
            <Typography key={i} variant="caption"
              sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase' }}>
              {h}
            </Typography>
          ))}
        </Box>

        {list.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <LocalShippingOutlinedIcon sx={{ fontSize: 36, color: '#cbd5e1', mb: 1 }} />
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>No GRNs recorded yet.</Typography>
          </Box>
        ) : (
          list.map((g, idx) => {
            const s = STATUS_STYLES[g.status] || STATUS_STYLES.Draft;
            return (
              <Box key={g.id || idx} className="erp-gtrow" sx={{
                display: 'grid', gridTemplateColumns: '150px 2fr 1fr 130px 140px 110px',
                alignItems: 'center', px: 2, py: '10px',
                borderBottom: idx < list.length - 1 ? '1px solid #f1f5f9' : 'none',
                '&:hover': { bgcolor: '#f8fafc' }
              }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#2563eb', fontWeight: 600, fontSize: '0.8125rem' }}>
                  {g.grn_number || g.grnNumber || `GRN-${String(g.id).padStart(4,'0')}`}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b', fontSize: '0.8125rem' }}>
                  {g.supplier_name || g.supplierName || '—'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8125rem' }}>
                  {g.po_number || g.poNumber || '—'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8125rem' }}>
                  {g.received_date ? formatDate(g.received_date) : '—'}
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8125rem' }}>
                  {formatINR(Number(g.total_value || g.totalValue || 0))}
                </Typography>
                <Chip label={g.status || 'Draft'} size="small"
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
          New Goods Receipt Note
          <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 2.5 }}>
            {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>{formError}</Alert>}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={4}>
                <TextField select required fullWidth size="small" label="Supplier"
                  value={formData.supplierId} onChange={set('supplierId')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}>
                  <MenuItem value=""><em>Select supplier</em></MenuItem>
                  {suppliers.map(s => (
                    <MenuItem key={s.id || s.SupplierId} value={s.id || s.SupplierId}>{s.name || s.SupplierName}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={4}>
                <TextField select fullWidth size="small" label="Purchase Order"
                  value={formData.purchaseOrderId} onChange={set('purchaseOrderId')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}>
                  <MenuItem value=""><em>None</em></MenuItem>
                  {purchaseOrders.map(p => (
                    <MenuItem key={p.id || p.PurchaseOrderId} value={p.id || p.PurchaseOrderId}>
                      {p.po_number || p.PurchaseOrderNumber || `PO-${p.id}`}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth size="small" type="date" label="Received Date" InputLabelProps={{ shrink: true }}
                  value={formData.receivedDate} onChange={set('receivedDate')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth size="small" label="Vehicle Number"
                  value={formData.vehicleNumber} onChange={set('vehicleNumber')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth size="small" label="Supplier Delivery Note No."
                  value={formData.deliveryNoteNumber} onChange={set('deliveryNoteNumber')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth size="small" label="Remarks"
                  value={formData.remarks} onChange={set('remarks')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              </Grid>
            </Grid>

            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em', mb: 1, display: 'block' }}>
              Items Received
            </Typography>
            <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5, overflow: 'hidden', mb: 1.5 }}>
              <Box className="erp-gthead" sx={{ display: 'grid', gridTemplateColumns: '2fr 80px 90px 80px 100px 36px',
                px: 1.5, py: 1, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Item *', 'Ordered', 'Received *', 'Rejected', 'Unit Cost', ''].map((h, i) => (
                  <Typography key={i} variant="caption" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase' }}>{h}</Typography>
                ))}
              </Box>
              {lines.map((line, idx) => (
                <Box key={idx} className="erp-gtrow" sx={{ display: 'grid', gridTemplateColumns: '2fr 80px 90px 80px 100px 36px',
                  alignItems: 'center', px: 1.5, py: 0.75, borderBottom: '1px solid #f1f5f9' }}>
                  <TextField select size="small" value={line.itemId} onChange={setLine(idx, 'itemId')}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '0.8125rem' } }}>
                    <MenuItem value=""><em>Select item</em></MenuItem>
                    {items.map(it => <MenuItem key={it.id} value={it.id}>{it.name || it.item_name}</MenuItem>)}
                  </TextField>
                  <TextField size="small" type="number" value={line.orderedQty} onChange={setLine(idx, 'orderedQty')}
                    inputProps={{ min: 0, style: { textAlign: 'right' } }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '0.8125rem' } }} />
                  <TextField size="small" type="number" value={line.receivedQty} onChange={setLine(idx, 'receivedQty')}
                    inputProps={{ min: 0, style: { textAlign: 'right' } }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '0.8125rem' } }} />
                  <TextField size="small" type="number" value={line.rejectedQty} onChange={setLine(idx, 'rejectedQty')}
                    inputProps={{ min: 0, style: { textAlign: 'right' } }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '0.8125rem' } }} />
                  <TextField size="small" type="number" value={line.unitCost} onChange={setLine(idx, 'unitCost')}
                    inputProps={{ min: 0, style: { textAlign: 'right' } }}
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
              {saving ? 'Saving…' : 'Save GRN'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
