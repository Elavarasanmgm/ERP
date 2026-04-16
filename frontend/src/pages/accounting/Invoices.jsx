import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { formatINR, formatDate } from '../../utils/locale';
import LoadingBackdrop from '../../components/Shared/LoadingBackdrop';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import usePagination from '../../hooks/usePagination';
import ErpPagination from '../../components/Shared/ErpPagination';
import ErpTable, { ErpRow, ErpCell } from '../../components/Shared/ErpTable';

const STATUS_COLOR = {
  'Draft':   { bg: '#f1f5f9', color: '#475569' },
  'Sent':    { bg: '#dbeafe', color: '#1e40af' },
  'Paid':    { bg: '#dcfce7', color: '#166534' },
  'Partial': { bg: '#fef3c7', color: '#92400e' },
  'Overdue': { bg: '#fee2e2', color: '#dc2626' },
  'Unpaid':  { bg: '#fee2e2', color: '#dc2626' },
  'Pending': { bg: '#fef3c7', color: '#92400e' },
};
const sc = s => STATUS_COLOR[s] || { bg: '#f1f5f9', color: '#475569' };

const EMPTY_LINE = { description: '', qty: 1, unitPrice: '', cgstPct: 9, sgstPct: 9, igstPct: 0 };

const EMPTY_FORM = {
  invoiceNumber: '',
  invoiceDate: new Date().toISOString().split('T')[0],
  dueDate: '',
  customerId: '',
  gstType: 'intra',
  lines: [{ ...EMPTY_LINE }],
};

const COLUMNS = [
  { label: 'Invoice #',  width: '13%', align: 'left'  },
  { label: 'Date',       width: '11%', align: 'left'  },
  { label: 'Customer',   width: '24%', align: 'left'  },
  { label: 'Subtotal',   width: '14%', align: 'right' },
  { label: 'GST',        width: '11%', align: 'right' },
  { label: 'Total',      width: '14%', align: 'right' },
  { label: 'Status',     width: '13%', align: 'left'  },
];

function calcLine(l) {
  const qty = Number(l.qty || 0);
  const price = Number(l.unitPrice || 0);
  const base = qty * price;
  const cgst = base * (Number(l.cgstPct || 0) / 100);
  const sgst = base * (Number(l.sgstPct || 0) / 100);
  const igst = base * (Number(l.igstPct || 0) / 100);
  return { base, cgst, sgst, igst, total: base + cgst + sgst + igst };
}

export default function Invoices() {
  const [invoices, setInvoices]   = useState([]);

  const pagn = usePagination(invoices, (item, q) =>
    (item.number || item.invoice_number || item.invoicenumber || '').toLowerCase().includes(q) ||
    (item.customer || item.customer_name || item.customername || '').toLowerCase().includes(q)
  );
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [open, setOpen]           = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [error, setError]         = useState('');
  const [formErr, setFormErr]     = useState('');
  const [success, setSuccess]     = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [ir, cr] = await Promise.all([
        apiClient.get('/accounting/invoices'),
        apiClient.get('/accounting/customers'),
      ]);
      setInvoices(ir.data || []);
      setCustomers(cr.data || []);
      setError('');
    } catch { setError('Failed to load data'); }
    finally { setLoading(false); }
  };

  const set = name => e => setForm(f => ({ ...f, [name]: e.target.value }));

  const setLine = (i, field) => e => {
    const lines = [...form.lines];
    lines[i] = { ...lines[i], [field]: e.target.value };
    setForm(f => ({ ...f, lines }));
  };

  const addLine    = () => setForm(f => ({ ...f, lines: [...f.lines, { ...EMPTY_LINE }] }));
  const removeLine = i  => setForm(f => ({ ...f, lines: f.lines.filter((_, idx) => idx !== i) }));

  const totals = form.lines.reduce((acc, l) => {
    const c = calcLine(l);
    return { base: acc.base + c.base, cgst: acc.cgst + c.cgst, sgst: acc.sgst + c.sgst, igst: acc.igst + c.igst, total: acc.total + c.total };
  }, { base: 0, cgst: 0, sgst: 0, igst: 0, total: 0 });

  const handleGstTypeChange = e => {
    const gstType = e.target.value;
    const lines = form.lines.map(l => gstType === 'inter'
      ? { ...l, cgstPct: 0, sgstPct: 0, igstPct: 18 }
      : { ...l, cgstPct: 9, sgstPct: 9, igstPct: 0 }
    );
    setForm(f => ({ ...f, gstType, lines }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.invoiceNumber || !form.customerId || form.lines.some(l => !l.unitPrice)) {
      setFormErr('Fill all required fields and at least one line item'); return;
    }
    setSaving(true); setFormErr('');
    try {
      await apiClient.post('/accounting/invoices', {
        invoiceDate:  form.invoiceDate,
        dueDate:      form.dueDate || null,
        customerId:   form.customerId,
        supply_type:  form.gstType === 'inter' ? 'Inter-State' : 'Intra-State',
        lines: form.lines.map(l => {
          const c = calcLine(l);
          return {
            description:  l.description,
            quantity:     Number(l.qty),
            unit_price:   Number(l.unitPrice),
            cgst_rate:    Number(l.cgstPct),
            cgst_amount:  c.cgst,
            sgst_rate:    Number(l.sgstPct),
            sgst_amount:  c.sgst,
            igst_rate:    Number(l.igstPct),
            igst_amount:  c.igst,
          };
        }),
      });
      setSuccess('Invoice created successfully');
      setOpen(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) { setFormErr(err.response?.data?.error || 'Failed to create invoice'); }
    finally { setSaving(false); }
  };

  return (
    <Box sx={{ p: 3 }}>
      <LoadingBackdrop open={loading} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>Invoices</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />}
          onClick={() => { setForm(EMPTY_FORM); setFormErr(''); setOpen(true); }}
          sx={{ bgcolor: '#1e40af', textTransform: 'none', fontWeight: 600, borderRadius: '7px', boxShadow: 'none', '&:hover': { bgcolor: '#1e3a8a' } }}>
          New Invoice
        </Button>
      </Box>

      {error   && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Search */}
      <TextField size="small" placeholder="Search by invoice # or customer…"
        value={pagn.search} onChange={pagn.handleSearchChange}
        sx={{ mb: 2, width: 300 }}
        InputProps={{ startAdornment:
          <InputAdornment position="start">
            <SearchIcon sx={{ fontSize: 18, color: '#94a3b8' }} />
          </InputAdornment>
        }} />

      <ErpTable columns={COLUMNS} loading={loading}
        empty={!loading && pagn.filtered.length === 0}
        emptyText={pagn.search ? 'No invoices match your search.' : 'No invoices yet.'}>
        {pagn.pageRows.map(inv => {
          const status = inv.status || inv.payment_status || 'Draft';
          const colors = sc(status);
          const invNum  = inv.number || inv.invoice_number || inv.invoicenumber || '—';
          const invDate = inv.date   || inv.invoice_date  || inv.invoicedate;
          const custName = inv.customer || inv.customer_name || inv.customername || '—';
          const total   = Number(inv.total || inv.total_amount || inv.totalamount || 0);
          const paid    = Number(inv.paid  || 0);
          const gst     = Number(inv.cgst_amount || 0) + Number(inv.sgst_amount || 0) + Number(inv.igst_amount || 0);
          const subtotal = Number(inv.subtotal || (total - gst) || 0);
          return (
            <ErpRow key={inv.id || inv.invoice_id}>
              <ErpCell mono bold color="#1e40af">{invNum}</ErpCell>
              <ErpCell color="#475569">{invDate ? formatDate(invDate) : '—'}</ErpCell>
              <ErpCell>{custName}</ErpCell>
              <ErpCell align="right" mono>{formatINR(subtotal)}</ErpCell>
              <ErpCell align="right" mono color="#475569">{formatINR(gst)}</ErpCell>
              <ErpCell align="right" mono bold>{formatINR(total)}</ErpCell>
              <ErpCell sx={{ overflow: 'visible' }}>
                <Chip label={status} size="small"
                  sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: colors.bg, color: colors.color }} />
              </ErpCell>
            </ErpRow>
          );
        })}
      </ErpTable>

      <ErpPagination count={pagn.filtered.length} page={pagn.page} onPageChange={pagn.setPage} rowsPerPage={pagn.ROWS_PER_PAGE} label="invoices" />

      {/* New Invoice Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '1rem' }}>
          Create New Invoice
          <IconButton size="small" onClick={() => setOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            {formErr && <Alert severity="error" sx={{ mb: 2 }}>{formErr}</Alert>}

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={4}>
                <TextField label="Invoice Number *" fullWidth size="small" required value={form.invoiceNumber} onChange={set('invoiceNumber')} placeholder="INV-001" />
              </Grid>
              <Grid item xs={4}>
                <TextField select label="Customer *" fullWidth size="small" required value={form.customerId} onChange={set('customerId')}>
                  <MenuItem value=""><em>Select Customer</em></MenuItem>
                  {customers.map(c => <MenuItem key={c.customerid || c.id} value={c.customerid || c.id}>{c.customername || c.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={4}>
                <TextField select label="GST Type" fullWidth size="small" value={form.gstType} onChange={handleGstTypeChange}>
                  <MenuItem value="intra">Intra-State (CGST + SGST)</MenuItem>
                  <MenuItem value="inter">Inter-State (IGST)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={4}>
                <TextField label="Invoice Date *" type="date" fullWidth size="small" required InputLabelProps={{ shrink: true }} value={form.invoiceDate} onChange={set('invoiceDate')} />
              </Grid>
              <Grid item xs={4}>
                <TextField label="Due Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={form.dueDate} onChange={set('dueDate')} />
              </Grid>
            </Grid>

            <Divider sx={{ mb: 2 }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', mb: 1, display: 'block' }}>Line Items</Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr 1fr 1fr 1fr 0.5fr',
              gap: 1, mb: 0.5, px: 0.5 }}>
              {['Description', 'Qty', 'Unit Price',
                form.gstType === 'intra' ? 'CGST %' : 'IGST %',
                form.gstType === 'intra' ? 'SGST %' : '', 'Line Total', ''].filter(Boolean).map((h, i) => (
                <Typography key={i} variant="caption" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase' }}>{h}</Typography>
              ))}
            </Box>

            {form.lines.map((line, i) => {
              const lc = calcLine(line);
              return (
                <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr 1fr 1fr 1fr 0.5fr',
                  gap: 1, mb: 1, alignItems: 'center' }}>
                  <TextField size="small" placeholder="Item / Description" value={line.description} onChange={setLine(i, 'description')} />
                  <TextField size="small" type="number" inputProps={{ min: 1 }} value={line.qty} onChange={setLine(i, 'qty')} />
                  <TextField size="small" type="number" placeholder="0.00" inputProps={{ step: '0.01', min: 0 }} value={line.unitPrice} onChange={setLine(i, 'unitPrice')} required />
                  {form.gstType === 'intra' ? (
                    <>
                      <TextField size="small" type="number" value={line.cgstPct} onChange={setLine(i, 'cgstPct')} inputProps={{ step: 0.5, min: 0, max: 28 }} />
                      <TextField size="small" type="number" value={line.sgstPct} onChange={setLine(i, 'sgstPct')} inputProps={{ step: 0.5, min: 0, max: 28 }} />
                    </>
                  ) : (
                    <>
                      <TextField size="small" type="number" value={line.igstPct} onChange={setLine(i, 'igstPct')} inputProps={{ step: 0.5, min: 0, max: 28 }} />
                      <Box />
                    </>
                  )}
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e293b', fontSize: '0.85rem' }}>
                    {formatINR(lc.total)}
                  </Typography>
                  <IconButton size="small" onClick={() => removeLine(i)} disabled={form.lines.length === 1} sx={{ color: '#94a3b8' }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              );
            })}

            <Button size="small" startIcon={<AddIcon />} onClick={addLine}
              sx={{ textTransform: 'none', color: '#1e40af', fontWeight: 600, fontSize: '0.8rem', mt: 0.5 }}>
              Add Line
            </Button>

            <Box sx={{ mt: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Typography variant="body2" sx={{ color: '#64748b' }}>Subtotal:</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{formatINR(totals.base)}</Typography>
              </Box>
              {form.gstType === 'intra' ? (
                <>
                  <Box sx={{ display: 'flex', gap: 4 }}>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>CGST:</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{formatINR(totals.cgst)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 4 }}>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>SGST:</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{formatINR(totals.sgst)}</Typography>
                  </Box>
                </>
              ) : (
                <Box sx={{ display: 'flex', gap: 4 }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>IGST:</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{formatINR(totals.igst)}</Typography>
                </Box>
              )}
              <Divider sx={{ width: '100%', my: 0.5 }} />
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Total:</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e40af', fontSize: '1rem' }}>{formatINR(totals.total)}</Typography>
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={() => setOpen(false)} variant="outlined" size="small"
              sx={{ textTransform: 'none', borderRadius: '7px', color: '#475569', borderColor: '#cbd5e1' }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" size="small" disabled={saving}
              sx={{ textTransform: 'none', borderRadius: '7px', bgcolor: '#1e40af', boxShadow: 'none', '&:hover': { bgcolor: '#1e3a8a' } }}>
              {saving ? 'Creating…' : 'Create Invoice'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
