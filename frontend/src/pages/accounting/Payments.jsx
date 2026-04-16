import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { formatINR, formatDate } from '../../utils/locale';
import LoadingBackdrop from '../../components/Shared/LoadingBackdrop';

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
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';

import ErpTable, { ErpRow, ErpCell } from '../../components/Shared/ErpTable';

const PAYMENT_MODES = ['Bank Transfer', 'NEFT', 'RTGS', 'UPI', 'Cheque', 'Cash', 'DD'];

const EMPTY_FORM = {
  paymentDate: new Date().toISOString().split('T')[0],
  customerId: '',
  amount: '',
  paymentMode: 'Bank Transfer',
  reference: '',
  remarks: '',
};

const COL_RECEIPTS = [
  { label: 'Date',      width: '100px', align: 'left'  },
  { label: 'Customer',  width: '1fr',   align: 'left'  },
  { label: 'Amount',    width: '140px', align: 'right' },
  { label: 'Mode',      width: '130px', align: 'left'  },
  { label: 'Reference', width: '150px', align: 'left'  },
  { label: 'Status',    width: '100px', align: 'left'  },
];

const COL_OUTSTANDING = [
  { label: 'Customer / Party', width: '1fr',   align: 'left'  },
  { label: 'Total Invoiced',   width: '160px', align: 'right' },
  { label: 'Amount Paid',      width: '150px', align: 'right' },
  { label: 'Outstanding',      width: '150px', align: 'right' },
];

const COL_AGING = [
  { label: 'Customer',   width: '1fr',   align: 'left'  },
  { label: '0–30 Days',  width: '130px', align: 'right' },
  { label: '31–60 Days', width: '130px', align: 'right' },
  { label: '61–90 Days', width: '130px', align: 'right' },
  { label: 'Over 90',    width: '130px', align: 'right' },
  { label: 'Total',      width: '140px', align: 'right' },
];

export default function Payments() {
  const [tab, setTab]             = useState(0);
  const [payments, setPayments]   = useState([]);
  const [outstanding, setOutstanding] = useState([]);
  const [aging, setAging]         = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [open, setOpen]           = useState(false);
  const [saving, setSaving]       = useState(false);
  const [formData, setFormData]   = useState(EMPTY_FORM);
  const [error, setError]         = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess]     = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, oRes, aRes, cRes] = await Promise.all([
        apiClient.get('/payments').catch(() => ({ data: [] })),
        apiClient.get('/payments/outstanding/customers').catch(() => ({ data: [] })),
        apiClient.get('/payments/reports/receivables').catch(() => ({ data: [] })),
        apiClient.get('/accounting/customers').catch(() => ({ data: [] })),
      ]);
      setPayments(pRes.data || []);
      setOutstanding(oRes.data || []);
      setAging(aRes.data || []);
      setCustomers(cRes.data || []);
      setError('');
    } catch { setError('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleOpen  = () => { setFormData(EMPTY_FORM); setFormError(''); setOpen(true); };
  const handleClose = () => { setOpen(false); setFormError(''); };
  const set = (name) => (e) => setFormData(f => ({ ...f, [name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerId || !formData.amount) { setFormError('Customer and amount are required'); return; }
    setSaving(true); setFormError('');
    try {
      await apiClient.post('/payments', {
        customer_id:   formData.customerId,
        payment_date:  formData.paymentDate,
        amount:        formData.amount,
        payment_mode:  formData.paymentMode,
        reference:     formData.reference,
        remarks:       formData.remarks,
      });
      setSuccess('Payment recorded successfully');
      handleClose();
      fetchAll();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to record payment');
    } finally { setSaving(false); }
  };

  const agingBuckets = ['0_30', '31_60', '61_90', 'over_90'];

  return (
    <Box sx={{ p: 3 }}>
      <LoadingBackdrop open={loading} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>Payments & Collections</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpen}
          sx={{ bgcolor: '#1e40af', textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem',
            borderRadius: '7px', px: 1.5, py: 0.75, boxShadow: 'none',
            '&:hover': { bgcolor: '#1e3a8a', boxShadow: '0 4px 12px rgba(30,64,175,0.25)' } }}>
          Record Payment
        </Button>
      </Box>

      {error   && <Alert severity="error"   sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: '1px solid #e2e8f0' }}
        TabIndicatorProps={{ style: { backgroundColor: '#2563eb' } }}>
        <Tab icon={<AccountBalanceOutlinedIcon sx={{ fontSize: 16 }} />} iconPosition="start"
          label="Receipts" sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', minHeight: 40, color: '#64748b' }} />
        <Tab icon={<WarningAmberOutlinedIcon sx={{ fontSize: 16 }} />} iconPosition="start"
          label="Outstanding" sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', minHeight: 40, color: '#64748b' }} />
        <Tab icon={<TimelineOutlinedIcon sx={{ fontSize: 16 }} />} iconPosition="start"
          label="Aging Report" sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', minHeight: 40, color: '#64748b' }} />
      </Tabs>

      {/* TAB 0 — Receipts */}
      {tab === 0 && (
        <ErpTable columns={COL_RECEIPTS} loading={loading}
          empty={!loading && payments.length === 0} emptyText="No payments recorded yet.">
          {payments.map((p, i) => (
            <ErpRow key={p.id || i}>
              <ErpCell color="#475569">{formatDate(p.payment_date || p.date)}</ErpCell>
              <ErpCell bold>{p.party_name || p.customer_name || p.customer || '—'}</ErpCell>
              <ErpCell align="right" mono color="#16a34a">{formatINR(p.amount)}</ErpCell>
              <ErpCell color="#475569">{p.payment_mode || p.mode || '—'}</ErpCell>
              <ErpCell mono color="#64748b">{p.reference_number || p.reference || '—'}</ErpCell>
              <ErpCell sx={{ overflow: 'visible' }}>
                <Chip label={p.status || 'Completed'} size="small"
                  sx={{ height: 20, fontSize: '0.67rem', fontWeight: 700,
                    bgcolor: p.status === 'Completed' ? '#dcfce7' : '#fef3c7',
                    color:   p.status === 'Completed' ? '#166534' : '#92400e' }} />
              </ErpCell>
            </ErpRow>
          ))}
        </ErpTable>
      )}

      {/* TAB 1 — Outstanding */}
      {tab === 1 && (
        <ErpTable columns={COL_OUTSTANDING} loading={loading}
          empty={!loading && outstanding.length === 0} emptyText="No outstanding invoices.">
          {outstanding.map((o, i) => {
            const bal = Number(o.outstanding || o.balance || 0);
            return (
              <ErpRow key={i} sx={{ bgcolor: bal > 0 ? '#fffbeb' : '#fff' }}>
                <ErpCell bold>{o.customer || o.customer_name || '—'}</ErpCell>
                <ErpCell align="right" mono>{formatINR(o.total_invoiced || o.total || 0)}</ErpCell>
                <ErpCell align="right" mono color="#16a34a">{formatINR(o.total_paid || o.paid || 0)}</ErpCell>
                <ErpCell align="right" mono bold color={bal > 0 ? '#dc2626' : '#16a34a'}>{formatINR(bal)}</ErpCell>
              </ErpRow>
            );
          })}
        </ErpTable>
      )}

      {/* TAB 2 — Aging Report */}
      {tab === 2 && (
        <ErpTable columns={COL_AGING} loading={loading}
          empty={!loading && aging.length === 0} emptyText="No aging data available.">
          {aging.map((a, i) => {
            const total = agingBuckets.reduce((s, b) => s + Number(a[b] || 0), 0);
            const hasOverdue = Number(a['over_90'] || 0) > 0;
            return (
              <ErpRow key={i} sx={{ bgcolor: hasOverdue ? '#fff8f8' : 'inherit' }}>
                <ErpCell bold color="#1e293b">{a.customer}</ErpCell>
                {agingBuckets.map(b => {
                  const val = Number(a[b] || 0);
                  const isOverdue = b === 'over_90' && val > 0;
                  const isWarning = b === '61_90' && val > 0;
                  return (
                    <ErpCell key={b} align="right" mono
                      color={isOverdue ? '#dc2626' : isWarning ? '#d97706' : val > 0 ? '#1e293b' : '#cbd5e1'}>
                      {formatINR(val)}
                    </ErpCell>
                  );
                })}
                <ErpCell align="right" mono bold color={total > 0 ? '#1e40af' : '#94a3b8'}>{formatINR(total)}</ErpCell>
              </ErpRow>
            );
          })}
        </ErpTable>
      )}

      {/* ── Record Payment Dialog ─────────────────── */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ pb: 1, fontWeight: 700, fontSize: '1rem', color: '#1e293b',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Record Payment Receipt
          <Tooltip title="Close"><IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton></Tooltip>
        </DialogTitle>

        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5, fontSize: '0.8125rem' }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Payment Date *" type="date" value={formData.paymentDate} size="small" fullWidth required
                  onChange={set('paymentDate')} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={6}>
                <TextField select label="Payment Mode" value={formData.paymentMode} size="small" fullWidth onChange={set('paymentMode')}>
                  {PAYMENT_MODES.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField select label="Customer / Party *" value={formData.customerId} size="small" fullWidth required onChange={set('customerId')}>
                  <MenuItem value=""><em>Select Customer</em></MenuItem>
                  {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField label="Amount Received (₹) *" type="number" value={formData.amount} size="small" fullWidth required
                  onChange={set('amount')} inputProps={{ step: '0.01', min: 0 }} placeholder="0.00" />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Cheque / UTR / Ref No." value={formData.reference} size="small" fullWidth
                  onChange={set('reference')} placeholder="e.g. UTR12345" />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Remarks" value={formData.remarks} size="small" fullWidth multiline rows={2}
                  onChange={set('remarks')} placeholder="e.g. Payment against INV-001" />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 1, px: 3, pb: 2.5, pt: 1 }}>
            <Button onClick={handleClose} variant="outlined" size="small"
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', borderRadius: '7px',
                color: '#475569', borderColor: '#cbd5e1', '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' } }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" size="small" disabled={saving}
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', borderRadius: '7px',
                bgcolor: '#1e40af', '&:hover': { bgcolor: '#1e3a8a' }, boxShadow: 'none' }}>
              {saving ? 'Saving…' : 'Save Payment'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
