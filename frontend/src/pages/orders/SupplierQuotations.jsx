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
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const STATUS_STYLES = {
  Draft:    { bg: '#f1f5f9', color: '#475569' },
  Sent:     { bg: '#dbeafe', color: '#1e40af' },
  Received: { bg: '#fef9c3', color: '#854d0e' },
  Approved: { bg: '#dcfce7', color: '#166534' },
  Rejected: { bg: '#fee2e2', color: '#dc2626' },
};

const EMPTY_LINE = { itemId: '', quantity: '', unitPrice: '', taxPercent: '' };
const EMPTY_FORM = { quotationNumber: '', supplierId: '', mrId: '', quotationDate: new Date().toISOString().split('T')[0], validUntil: '', deliveryDays: '', notes: '' };

export default function SupplierQuotations() {
  const [list, setList]         = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [mrs, setMrs]           = useState([]);
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
      const [qRes, sRes, mRes, iRes] = await Promise.all([
        apiClient.get('/purchase/supplier-quotations').catch(() => ({ data: [] })),
        apiClient.get('/accounting/suppliers').catch(() => ({ data: [] })),
        apiClient.get('/purchase/material-requests').catch(() => ({ data: [] })),
        apiClient.get('/inventory/items').catch(() => ({ data: [] })),
      ]);
      setList(Array.isArray(qRes.data) ? qRes.data : []);
      setSuppliers(Array.isArray(sRes.data) ? sRes.data : []);
      setMrs(Array.isArray(mRes.data) ? mRes.data : []);
      setItems(Array.isArray(iRes.data) ? iRes.data : []);
      setError('');
    } catch { setError('Failed to load supplier quotations'); }
    finally { setLoading(false); }
  };

  const set = (name) => (e) => setFormData(f => ({ ...f, [name]: e.target.value }));
  const setLine = (idx, field) => (e) => setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: e.target.value } : l));
  const addLine    = () => setLines(prev => [...prev, { ...EMPTY_LINE }]);
  const removeLine = (idx) => setLines(prev => prev.filter((_, i) => i !== idx));

  const handleOpen  = () => { setFormData(EMPTY_FORM); setLines([{ ...EMPTY_LINE }]); setFormError(''); setOpen(true); };
  const handleClose = () => { setOpen(false); setFormError(''); };

  const lineTotal = (line) => {
    const sub = Number(line.quantity) * Number(line.unitPrice) || 0;
    const tax = sub * (Number(line.taxPercent) / 100 || 0);
    return sub + tax;
  };
  const grandTotal = lines.reduce((sum, l) => sum + lineTotal(l), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplierId) { setFormError('Supplier is required'); return; }
    const validLines = lines.filter(l => l.itemId && Number(l.quantity) > 0);
    if (validLines.length === 0) { setFormError('Add at least one item'); return; }
    setSaving(true); setFormError('');
    try {
      await apiClient.post('/purchase/supplier-quotations', { ...formData, lines: validLines });
      setSuccess('Quotation saved'); setOpen(false); load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleApprove = async (id) => {
    try {
      await apiClient.put(`/purchase/supplier-quotations/${id}/approve`);
      setSuccess('Quotation approved — PO can now be generated'); load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to approve');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <LoadingBackdrop open={loading} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>Supplier Quotations</Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>Compare supplier quotes → approve → generate PO</Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpen}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '7px', bgcolor: '#2563eb',
            '&:hover': { bgcolor: '#1d4ed8' }, px: 2 }}>
          New Quotation
        </Button>
      </Box>

      {error   && <Alert severity="error"   sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Box className="erp-gtable" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Box className="erp-gthead" sx={{ display: 'grid', gridTemplateColumns: '150px 2fr 1fr 120px 130px 110px 90px',
          px: 2, py: 1.25, bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
          {['Quotation No.', 'Supplier', 'MR Reference', 'Date', 'Total Amount', 'Status', 'Action'].map((h, i) => (
            <Typography key={i} variant="caption"
              sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase' }}>
              {h}
            </Typography>
          ))}
        </Box>

        {list.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <RequestQuoteOutlinedIcon sx={{ fontSize: 36, color: '#cbd5e1', mb: 1 }} />
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>No quotations yet.</Typography>
          </Box>
        ) : (
          list.map((q, idx) => {
            const s = STATUS_STYLES[q.status] || STATUS_STYLES.Draft;
            return (
              <Box key={q.id || idx} className="erp-gtrow" sx={{
                display: 'grid', gridTemplateColumns: '150px 2fr 1fr 120px 130px 110px 90px',
                alignItems: 'center', px: 2, py: '10px',
                borderBottom: idx < list.length - 1 ? '1px solid #f1f5f9' : 'none',
                '&:hover': { bgcolor: '#f8fafc' }
              }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#2563eb', fontWeight: 600, fontSize: '0.8125rem' }}>
                  {q.quotation_number || q.quotationNumber || `SQ-${String(q.id).padStart(4,'0')}`}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b', fontSize: '0.8125rem' }}>
                  {q.supplier_name || q.supplierName || '—'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8125rem' }}>
                  {q.mr_number || q.mrNumber || '—'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8125rem' }}>
                  {q.quotation_date ? formatDate(q.quotation_date) : '—'}
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8125rem' }}>
                  {formatINR(Number(q.total_amount || 0))}
                </Typography>
                <Chip label={q.status || 'Draft'} size="small"
                  sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600, bgcolor: s.bg, color: s.color }} />
                {q.status === 'Received' ? (
                  <Tooltip title="Approve this quotation">
                    <Button size="small" variant="outlined" startIcon={<CheckCircleOutlineIcon sx={{ fontSize: '13px !important' }} />}
                      onClick={() => handleApprove(q.id)}
                      sx={{ textTransform: 'none', fontSize: '0.72rem', fontWeight: 600, borderRadius: '6px',
                        borderColor: '#10b981', color: '#10b981', px: 1, py: 0.25, minWidth: 0,
                        '&:hover': { bgcolor: '#f0fdf4', borderColor: '#059669' } }}>
                      Approve
                    </Button>
                  </Tooltip>
                ) : <Box />}
              </Box>
            );
          })
        )}
      </Box>

      {/* Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid #f1f5f9', pb: 1.5, fontWeight: 700, fontSize: '1rem' }}>
          New Supplier Quotation
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
                <TextField select fullWidth size="small" label="MR Reference"
                  value={formData.mrId} onChange={set('mrId')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}>
                  <MenuItem value=""><em>None</em></MenuItem>
                  {mrs.map(m => (
                    <MenuItem key={m.id} value={m.id}>{m.mr_number || `MR-${m.id}`}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth size="small" type="date" label="Quotation Date" InputLabelProps={{ shrink: true }}
                  value={formData.quotationDate} onChange={set('quotationDate')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth size="small" type="date" label="Valid Until" InputLabelProps={{ shrink: true }}
                  value={formData.validUntil} onChange={set('validUntil')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth size="small" type="number" label="Delivery Days"
                  value={formData.deliveryDays} onChange={set('deliveryDays')} inputProps={{ min: 0 }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth size="small" label="Notes"
                  value={formData.notes} onChange={set('notes')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              </Grid>
            </Grid>

            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em', mb: 1, display: 'block' }}>
              Line Items
            </Typography>
            <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5, overflow: 'hidden', mb: 1.5 }}>
              <Box className="erp-gthead" sx={{ display: 'grid', gridTemplateColumns: '2fr 90px 110px 90px 120px 36px',
                px: 1.5, py: 1, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Item', 'Qty', 'Unit Price', 'Tax %', 'Line Total', ''].map((h, i) => (
                  <Typography key={i} variant="caption" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase' }}>{h}</Typography>
                ))}
              </Box>
              {lines.map((line, idx) => (
                <Box key={idx} className="erp-gtrow" sx={{ display: 'grid', gridTemplateColumns: '2fr 90px 110px 90px 120px 36px',
                  alignItems: 'center', px: 1.5, py: 0.75, borderBottom: '1px solid #f1f5f9' }}>
                  <TextField select size="small" value={line.itemId} onChange={setLine(idx, 'itemId')}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '0.8125rem' } }}>
                    <MenuItem value=""><em>Select item</em></MenuItem>
                    {items.map(it => <MenuItem key={it.id} value={it.id}>{it.name || it.item_name}</MenuItem>)}
                  </TextField>
                  <TextField size="small" type="number" value={line.quantity} onChange={setLine(idx, 'quantity')}
                    inputProps={{ min: 1, style: { textAlign: 'right' } }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '0.8125rem' } }} />
                  <TextField size="small" type="number" value={line.unitPrice} onChange={setLine(idx, 'unitPrice')}
                    inputProps={{ min: 0, style: { textAlign: 'right' } }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '0.8125rem' } }} />
                  <TextField size="small" type="number" value={line.taxPercent} onChange={setLine(idx, 'taxPercent')}
                    inputProps={{ min: 0, max: 100, style: { textAlign: 'right' } }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '0.8125rem' } }} />
                  <Typography variant="body2" sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', pr: 0.5 }}>
                    {lineTotal(line) > 0 ? `₹${lineTotal(line).toFixed(0)}` : '—'}
                  </Typography>
                  <Tooltip title="Remove">
                    <IconButton size="small" onClick={() => removeLine(idx)} disabled={lines.length === 1}
                      sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
              {/* Total row */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, py: 1, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', fontFamily: 'monospace' }}>
                  Grand Total: ₹{grandTotal.toFixed(2)}
                </Typography>
              </Box>
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
              {saving ? 'Saving…' : 'Save Quotation'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
