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
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';

import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import Tooltip from '@mui/material/Tooltip';
import ErpTable, { ErpRow, ErpCell } from '../../components/Shared/ErpTable';

const STATUS_STYLES = {
  Draft:        { bg: '#f1f5f9', color: '#475569' },
  Planned:      { bg: '#dbeafe', color: '#1e40af' },
  Approved:     { bg: '#e0f2fe', color: '#0369a1' },
  'In Progress':{ bg: '#fef9c3', color: '#854d0e' },
  Completed:    { bg: '#dcfce7', color: '#166534' },
  Cancelled:    { bg: '#fee2e2', color: '#dc2626' },
};

const EMPTY_FORM = {
  planNumber: '', workOrderId: '', itemId: '', plannedQty: '', plannedStartDate: '', plannedEndDate: '', notes: ''
};

const COLUMNS = [
  { label: 'Plan #',  width: '125px', align: 'left' },
  { label: 'Item',    width: '220px', align: 'left' },
  { label: 'Qty',     width: '65px',  align: 'right' },
  { label: 'Start',   width: '90px',  align: 'left' },
  { label: 'End',     width: '90px',  align: 'left' },
  { label: 'Lines',   width: '60px',  align: 'left' },
  { label: 'Status',  width: '100px', align: 'left' },
  { label: 'Action',  width: '85px',  align: 'center' },
];

export default function ProductionPlan() {
  const [plans, setPlans]         = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [open, setOpen]           = useState(false);
  const [saving, setSaving]       = useState(false);
  const [releasing, setReleasing] = useState(null);
  const [confirmPlan, setConfirmPlan] = useState(null);
  const [formData, setFormData]   = useState(EMPTY_FORM);
  const [error, setError]         = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess]     = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, wRes, iRes] = await Promise.all([
        apiClient.get('/planning/production-plans').catch(() => ({ data: [] })),
        apiClient.get('/manufacturing/work-orders').catch(() => ({ data: [] })),
        apiClient.get('/inventory/items').catch(() => ({ data: [] })),
      ]);
      setPlans(Array.isArray(pRes.data) ? pRes.data : []);
      setWorkOrders(Array.isArray(wRes.data) ? wRes.data : []);
      setItems(Array.isArray(iRes.data) ? iRes.data : []);
      setError('');
    } catch { setError('Failed to load production plans'); }
    finally { setLoading(false); }
  };

  const set = (name) => (e) => setFormData(f => ({ ...f, [name]: e.target.value }));
  const handleOpen  = () => { setFormData(EMPTY_FORM); setFormError(''); setOpen(true); };
  const handleClose = () => { setOpen(false); setFormError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.itemId || !formData.plannedQty) { setFormError('Item and quantity are required'); return; }
    setSaving(true); setFormError('');
    try {
      await apiClient.post('/planning/production-plans', formData);
      setSuccess('Production plan created'); setOpen(false); load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleRelease = async (plan) => {
    setReleasing(plan.planid);
    setConfirmPlan(null);
    try {
      const res = await apiClient.post(`/planning/production-plans/${plan.planid}/release`);
      const wos = res.data.workOrders || [];
      setSuccess(`Plan released — ${wos.length} Work Order(s) created: ${wos.map(w => w.workOrderNumber).join(', ')}`);
      load();
      setTimeout(() => setSuccess(''), 6000);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to release plan');
      setTimeout(() => setError(''), 5000);
    } finally { setReleasing(null); }
  };

  const statusCounts = plans.reduce((acc, p) => {
    const s = p.status || 'Draft';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>Production Plans</Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>Plan and schedule manufacturing production runs</Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpen}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '7px', bgcolor: '#2563eb',
            '&:hover': { bgcolor: '#1d4ed8' }, px: 2, py: 0.875 }}>
          New Plan
        </Button>
      </Box>

      {error   && <Alert severity="error"   sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Status summary */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {Object.entries(STATUS_STYLES).map(([status, styles]) => (
          <Box key={status} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, px: 2, py: 1.25, minWidth: 110 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: styles.color }}>{statusCounts[status] || 0}</Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>{status}</Typography>
          </Box>
        ))}
      </Box>

      {/* Plans table */}
      <ErpTable columns={COLUMNS} loading={loading}
        empty={!loading && plans.length === 0}
        emptyText="No production plans yet.">
        {plans.map((plan, idx) => {
          const s = STATUS_STYLES[plan.status] || STATUS_STYLES.Draft;
          const id = plan.planid || plan.id || idx;
          return (
            <ErpRow key={id}>
              <ErpCell mono bold color="#2563eb" sx={{ whiteSpace: 'nowrap' }}>
                {plan.plan_number || `PP-${String(id).padStart(4,'0')}`}
              </ErpCell>
              <ErpCell bold color="#1e293b" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {plan.item_name || '—'}
              </ErpCell>
              <ErpCell align="right" mono bold>
                {Number(plan.planned_qty || 0) > 0
                  ? Number(plan.planned_qty).toLocaleString('en-IN')
                  : '—'}
              </ErpCell>
              <ErpCell color="#475569">
                {plan.planned_start_date ? formatDate(plan.planned_start_date) : '—'}
              </ErpCell>
              <ErpCell color="#475569">
                {plan.planned_end_date ? formatDate(plan.planned_end_date) : '—'}
              </ErpCell>
              <ErpCell color="#475569">
                {plan.line_count > 0 ? `${plan.line_count} line${plan.line_count > 1 ? 's' : ''}` : '—'}
              </ErpCell>
              <ErpCell sx={{ overflow: 'visible' }}>
                <Chip label={plan.status || 'Draft'} size="small"
                  sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: s.bg, color: s.color, whiteSpace: 'nowrap' }} />
              </ErpCell>
              <ErpCell align="center" sx={{ overflow: 'visible' }}>
                {(plan.status === 'Draft' || plan.status === 'Approved' || plan.status === 'Planned') && plan.line_count > 0 ? (
                  <Tooltip title="Release to Production — creates Work Orders">
                    <span>
                      <Button size="small" variant="outlined" startIcon={<PlayArrowOutlinedIcon sx={{ fontSize: '0.85rem !important' }} />}
                        disabled={releasing === plan.planid}
                        onClick={() => setConfirmPlan(plan)}
                        sx={{ textTransform: 'none', fontSize: '0.7rem', fontWeight: 600, borderRadius: '6px', py: 0.25, px: 1,
                          borderColor: '#10b981', color: '#10b981', whiteSpace: 'nowrap',
                          '&:hover': { borderColor: '#059669', bgcolor: '#f0fdf4' } }}>
                        {releasing === plan.planid ? '…' : 'Release'}
                      </Button>
                    </span>
                  </Tooltip>
                ) : plan.status === 'In Progress' ? (
                  <Typography variant="caption" sx={{ color: '#854d0e', fontWeight: 600, fontSize: '0.7rem' }}>Released</Typography>
                ) : (
                  <Typography variant="caption" sx={{ color: '#cbd5e1', fontSize: '0.7rem' }}>—</Typography>
                )}
              </ErpCell>
            </ErpRow>
          );
        })}
      </ErpTable>

      {/* Release Confirmation Dialog */}
      <Dialog open={Boolean(confirmPlan)} onClose={() => setConfirmPlan(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', borderBottom: '1px solid #f1f5f9', pb: 1.5 }}>
          Release to Production
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ color: '#475569', mb: 1 }}>
            This will create <strong>Work Orders</strong> for each line in plan{' '}
            <strong style={{ color: '#2563eb' }}>{confirmPlan?.plan_number}</strong> and mark it as <strong>In Progress</strong>.
          </Typography>
          <Typography variant="body2" sx={{ color: '#475569' }}>
            Items: <strong>{confirmPlan?.item_name || '—'}</strong><br />
            Lines: <strong>{confirmPlan?.line_count}</strong> · Total Qty: <strong>{Number(confirmPlan?.planned_qty || 0).toLocaleString('en-IN')}</strong>
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setConfirmPlan(null)} sx={{ textTransform: 'none', color: '#64748b' }}>Cancel</Button>
          <Button variant="contained" onClick={() => handleRelease(confirmPlan)}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '7px', bgcolor: '#10b981',
              '&:hover': { bgcolor: '#059669' }, px: 3 }}>
            Confirm Release
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Plan Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid #f1f5f9', pb: 1.5, fontWeight: 700, fontSize: '1rem' }}>
          New Production Plan
          <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 2.5 }}>
            {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField fullWidth size="small" label="Plan Number (optional)"
                  value={formData.planNumber} onChange={set('planNumber')}
                  placeholder="Auto-generated if blank"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              </Grid>
              <Grid item xs={6}>
                <TextField select fullWidth size="small" label="Work Order (optional)"
                  value={formData.workOrderId} onChange={set('workOrderId')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}>
                  <MenuItem value=""><em>None</em></MenuItem>
                  {workOrders.map(w => (
                    <MenuItem key={w.id || w.WorkOrderId} value={w.id || w.WorkOrderId}>
                      {w.work_order_number || w.WorkOrderNumber || `WO-${w.id}`}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={8}>
                <TextField select required fullWidth size="small" label="Item to Produce"
                  value={formData.itemId} onChange={set('itemId')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}>
                  <MenuItem value=""><em>Select item</em></MenuItem>
                  {items.map(it => (
                    <MenuItem key={it.id} value={it.id}>{it.name || it.item_name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={4}>
                <TextField required fullWidth size="small" type="number" label="Planned Qty"
                  value={formData.plannedQty} onChange={set('plannedQty')} inputProps={{ min: 1 }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth size="small" type="date" label="Start Date" InputLabelProps={{ shrink: true }}
                  value={formData.plannedStartDate} onChange={set('plannedStartDate')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth size="small" type="date" label="End Date" InputLabelProps={{ shrink: true }}
                  value={formData.plannedEndDate} onChange={set('plannedEndDate')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth size="small" label="Notes" multiline rows={2}
                  value={formData.notes} onChange={set('notes')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", gap: 1, px: 3, pb: 2.5 }}>
            <Button onClick={handleClose} sx={{ textTransform: 'none', color: '#64748b' }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '7px', bgcolor: '#2563eb',
                '&:hover': { bgcolor: '#1d4ed8' }, px: 3 }}>
              {saving ? 'Saving…' : 'Create Plan'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
