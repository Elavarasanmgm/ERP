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
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';

import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';

const RESULT_STYLES = {
  Pass:    { bg: '#dcfce7', color: '#166534' },
  Passed:  { bg: '#dcfce7', color: '#166534' },
  Fail:    { bg: '#fee2e2', color: '#dc2626' },
  Failed:  { bg: '#fee2e2', color: '#dc2626' },
  Pending: { bg: '#fef9c3', color: '#854d0e' },
  'On Hold': { bg: '#f1f5f9', color: '#475569' },
};

const EMPTY_FORM = {
  workOrderId: '', itemId: '', inspectionDate: new Date().toISOString().split('T')[0],
  inspectorName: '', quantityProduced: '', quantityPassed: '', quantityFailed: '',
  result: 'Pending', remarks: ''
};

export default function QualityChecks() {
  const [checks, setChecks]       = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [open, setOpen]           = useState(false);
  const [saving, setSaving]       = useState(false);
  const [formData, setFormData]   = useState(EMPTY_FORM);
  const [error, setError]         = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess]     = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [cRes, wRes, iRes] = await Promise.all([
        apiClient.get('/manufacturing/quality-checks').catch(() => ({ data: [] })),
        apiClient.get('/manufacturing/work-orders').catch(() => ({ data: [] })),
        apiClient.get('/inventory/items').catch(() => ({ data: [] })),
      ]);
      setChecks(Array.isArray(cRes.data) ? cRes.data : []);
      setWorkOrders(Array.isArray(wRes.data) ? wRes.data : []);
      setItems(Array.isArray(iRes.data) ? iRes.data : []);
      setError('');
    } catch { setError('Failed to load quality checks'); }
    finally { setLoading(false); }
  };

  const set = (name) => (e) => setFormData(f => ({ ...f, [name]: e.target.value }));
  const handleOpen  = () => { setFormData(EMPTY_FORM); setFormError(''); setOpen(true); };
  const handleClose = () => { setOpen(false); setFormError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.workOrderId) { setFormError('Work order is required'); return; }
    setSaving(true); setFormError('');
    try {
      await apiClient.post('/manufacturing/quality-checks', formData);
      setSuccess('QC record saved'); setOpen(false); load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const passRate = checks.length > 0
    ? Math.round((checks.filter(c => c.result === 'Pass').length / checks.length) * 100)
    : 0;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>Quality Checks</Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>Production QA inspections and results</Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpen}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '7px', bgcolor: '#2563eb',
            '&:hover': { bgcolor: '#1d4ed8' }, px: 2, py: 0.875 }}>
          New QC
        </Button>
      </Box>

      {error   && <Alert severity="error"   sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Summary */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Checks',  value: checks.length,                                               color: '#2563eb' },
          { label: 'Passed',        value: checks.filter(c => c.result === 'Pass').length,              color: '#10b981' },
          { label: 'Failed',        value: checks.filter(c => c.result === 'Fail').length,              color: '#ef4444' },
          { label: 'Pass Rate',     value: `${passRate}%`,                                              color: '#8b5cf6' },
        ].map(s => (
          <Box key={s.label} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, px: 2.5, py: 1.5, minWidth: 120 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: s.color }}>{s.value}</Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>{s.label}</Typography>
          </Box>
        ))}
      </Box>

      {/* Table */}
      <Box className="erp-gtable" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Box className="erp-gthead" sx={{ display: 'grid', gridTemplateColumns: '140px 2fr 1fr 90px 90px 90px 100px', px: 2, py: 1.25, bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
          {['Date', 'Item', 'Work Order', 'Produced', 'Passed', 'Failed', 'Result'].map((h, i) => (
            <Typography key={i} variant="caption"
              sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase',
                textAlign: i >= 3 && i <= 5 ? 'right' : 'left' }}>
              {h}
            </Typography>
          ))}
        </Box>

        {loading ? (
          <Box sx={{ p: 2 }}>{[...Array(4)].map((_, i) => <Skeleton key={i} height={44} sx={{ mb: 0.5 }} />)}</Box>
        ) : checks.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <FactCheckOutlinedIcon sx={{ fontSize: 36, color: '#cbd5e1', mb: 1 }} />
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>No quality check records yet.</Typography>
          </Box>
        ) : (
          checks.map((c, idx) => {
            const s = RESULT_STYLES[c.result] || RESULT_STYLES.Pending;
            return (
              <Box className="erp-gthead erp-gtrow" key={c.id || idx} sx={{ display: 'grid', gridTemplateColumns: '140px 2fr 1fr 90px 90px 90px 100px', alignItems: 'center', px: 2, py: '10px', borderBottom: idx < checks.length - 1 ? '1px solid #f1f5f9' : 'none', '&:hover': { bgcolor: '#f8fafc' } }}>
                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8125rem' }}>
                  {c.inspection_date ? formatDate(c.inspection_date) : '—'}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b', fontSize: '0.8125rem' }}>
                  {c.item_name || c.itemName || '—'}
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#2563eb', fontWeight: 600, fontSize: '0.8125rem' }}>
                  {c.work_order_number || c.workOrderNumber || '—'}
                </Typography>
                <Typography variant="body2" sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8125rem' }}>
                  {Number(c.quantity_produced || 0).toLocaleString("en-IN")}
                </Typography>
                <Typography variant="body2" sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.8125rem', color: '#10b981', fontWeight: 600 }}>
                  {Number(c.quantity_passed || 0).toLocaleString("en-IN")}
                </Typography>
                <Typography variant="body2" sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.8125rem', color: '#ef4444', fontWeight: 600 }}>
                  {Number(c.quantity_failed || 0).toLocaleString("en-IN")}
                </Typography>
                <Chip label={c.result || 'Pending'} size="small"
                  sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600, bgcolor: s.bg, color: s.color }} />
              </Box>
            );
          })
        )}
      </Box>

      {/* Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid #f1f5f9', pb: 1.5, fontWeight: 700, fontSize: '1rem' }}>
          New Quality Check
          <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 2.5 }}>
            {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField select required fullWidth size="small" label="Work Order"
                  value={formData.workOrderId} onChange={set('workOrderId')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}>
                  <MenuItem value=""><em>Select</em></MenuItem>
                  {workOrders.map(w => (
                    <MenuItem key={w.id || w.WorkOrderId} value={w.id || w.WorkOrderId}>
                      {w.work_order_number || w.WorkOrderNumber || `WO-${w.id}`}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth size="small" type="date" label="Inspection Date" InputLabelProps={{ shrink: true }}
                  value={formData.inspectionDate} onChange={set('inspectionDate')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              </Grid>
              <Grid item xs={6}>
                <TextField select fullWidth size="small" label="Item"
                  value={formData.itemId} onChange={set('itemId')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}>
                  <MenuItem value=""><em>Select item</em></MenuItem>
                  {items.map(it => <MenuItem key={it.id} value={it.id}>{it.name || it.item_name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth size="small" label="Inspector Name"
                  value={formData.inspectorName} onChange={set('inspectorName')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth size="small" type="number" label="Qty Produced"
                  value={formData.quantityProduced} onChange={set('quantityProduced')} inputProps={{ min: 0 }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth size="small" type="number" label="Qty Passed"
                  value={formData.quantityPassed} onChange={set('quantityPassed')} inputProps={{ min: 0 }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth size="small" type="number" label="Qty Failed"
                  value={formData.quantityFailed} onChange={set('quantityFailed')} inputProps={{ min: 0 }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              </Grid>
              <Grid item xs={6}>
                <TextField select fullWidth size="small" label="Result"
                  value={formData.result} onChange={set('result')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}>
                  {Object.keys(RESULT_STYLES).map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth size="small" label="Remarks" multiline rows={2}
                  value={formData.remarks} onChange={set('remarks')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", gap: 1, px: 3, pb: 2.5 }}>
            <Button onClick={handleClose} sx={{ textTransform: 'none', color: '#64748b' }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '7px', bgcolor: '#2563eb',
                '&:hover': { bgcolor: '#1d4ed8' }, px: 3 }}>
              {saving ? 'Saving…' : 'Save QC'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
