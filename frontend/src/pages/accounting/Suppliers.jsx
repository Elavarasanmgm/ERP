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
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';

import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import usePagination from '../../hooks/usePagination';
import ErpPagination from '../../components/Shared/ErpPagination';
import ErpTable, { ErpRow, ErpCell } from '../../components/Shared/ErpTable';

const EMPTY_FORM = {
  supplierName: '', email: '', phone: '', alt_phone: '',
  address: '', city: '', state: '', pincode: '', country: 'India',
  website: '', contact_person: '', gst_number: '', pan_number: '',
  currency: 'INR', paymentTerms: '', supplier_type: 'Material Supplier',
  bank_name: '', bank_account: '', bank_ifsc: '',
};

const COLUMNS = [
  { label: 'Name',         width: '18%',   align: 'left' },
  { label: 'GST Number',   width: '130px', align: 'left' },
  { label: 'Contact',      width: '150px', align: 'left' },
  { label: 'City / State', width: '120px', align: 'left' },
  { label: 'Type',         width: '120px', align: 'left' },
  { label: 'Email',        width: '180px', align: 'left' },
  { label: 'Payment Terms',width: '100px', align: 'left' },
  { label: 'Action',       width: '60px',  align: 'center' },
];

export default function Suppliers() {
  const [suppliers, setSuppliers]   = useState([]);

  const pagn = usePagination(suppliers, (item, q) => (item.suppliername || '').toLowerCase().includes(q) || (item.email || '').toLowerCase().includes(q));
  const [loading, setLoading]       = useState(true);
  const [open, setOpen]             = useState(false);
  const [saving, setSaving]         = useState(false);
  const [editRec, setEditRec]       = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [formData, setFormData]     = useState(EMPTY_FORM);
  const [error, setError]           = useState('');
  const [formError, setFormError]   = useState('');
  const [success, setSuccess]       = useState('');

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await apiClient.get('/accounting/suppliers');
      setSuppliers(res.data);
      setError('');
    } catch { setError('Failed to load suppliers'); }
    finally { setLoading(false); }
  };

  const handleOpen  = () => { setEditRec(null); setFormData(EMPTY_FORM); setFormError(''); setOpen(true); };
  const handleClose = () => { setOpen(false); setFormError(''); };
  const openEdit = s => {
    setEditRec(s);
    setFormData({ supplierName: s.name||'', email: s.email||'', phone: s.phone||'', alt_phone: s.alt_phone||'', address: s.address||'', city: s.city||'', state: s.state||'', pincode: s.pincode||'', country: s.country||'India', website: s.website||'', contact_person: s.contact_person||'', gst_number: s.gst_number||'', pan_number: s.pan_number||'', currency: s.currency||'INR', paymentTerms: s.payment_terms||'', supplier_type: s.supplier_type||'Material Supplier', bank_name: s.bank_name||'', bank_account: s.bank_account||'', bank_ifsc: s.bank_ifsc||'' });
    setFormError(''); setOpen(true);
  };
  const set = (name) => (e) => setFormData(f => ({ ...f, [name]: e.target.value }));

  const verifyGST = async () => {
    if (!formData.gst_number || formData.gst_number.length < 15) {
      setFormError('Enter a valid 15-digit GST number first'); return;
    }
    setIsVerifying(true); setFormError('');
    try {
      const res = await apiClient.get(`/gst/verify/${formData.gst_number}`);
      const d = res.data;
      setFormData(f => ({ ...f,
        supplierName: d.legal_name || f.supplierName,
        address: d.address || f.address,
        state: d.state_code || f.state,
        gst_status: d.status, gst_trade_name: d.trade_name, gst_verified: true,
      }));
      setSuccess(`GST verified! Source: ${d.source}`);
    } catch (err) {
      setFormError(err.response?.data?.error || 'GST verification failed');
    } finally { setIsVerifying(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setFormError('');
    try {
      if (editRec) {
        await apiClient.put(`/accounting/suppliers/${editRec.id}`, formData);
        setSuccess('Supplier updated');
      } else {
        await apiClient.post('/accounting/suppliers', formData);
        setSuccess('Supplier added successfully');
      }
      handleClose();
      fetchSuppliers();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed');
    } finally { setSaving(false); }
  };

  const canSave = saving || !formData.supplierName.trim();

  return (
    <Box sx={{ p: 3 }}>
      <LoadingBackdrop open={loading} />
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>Suppliers</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpen}
          sx={{ bgcolor: '#1e40af', textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem',
            borderRadius: '7px', px: 1.5, py: 0.75, boxShadow: 'none',
            '&:hover': { bgcolor: '#1e3a8a', boxShadow: '0 4px 12px rgba(30,64,175,0.25)' } }}>
          New Supplier
        </Button>
      </Box>

      {error   && <Alert severity="error"   sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Table */}
      <ErpTable columns={COLUMNS} loading={loading}
        empty={!loading && pagn.filtered.length === 0}
        emptyText={pagn.search ? 'No suppliers match your search.' : 'No suppliers found.'}>
        {pagn.pageRows.map(s => (
          <ErpRow key={s.id}>
            {/* Name */}
            <ErpCell bold color="#1e293b">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {s.name}
                {s.gst_verified && (
                  <Tooltip title="GST Verified">
                    <VerifiedOutlinedIcon sx={{ fontSize: 13, color: '#059669' }} />
                  </Tooltip>
                )}
              </Box>
            </ErpCell>

            {/* GST Number */}
            <ErpCell mono color="#64748b" sx={{ fontSize: '0.75rem' }}>
              {s.gst_number || '—'}
            </ErpCell>

            {/* Contact */}
            <ErpCell color="#475569">
              <Box>
                <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: 500 }}>{s.contact_person || '—'}</Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#64748b' }}>{s.phone || '—'}</Typography>
              </Box>
            </ErpCell>

            {/* City / State */}
            <ErpCell color="#475569">
              {[s.city, s.state].filter(Boolean).join(', ') || '—'}
            </ErpCell>

            {/* Type chip */}
            <ErpCell sx={{ overflow: 'visible' }}>
              {s.supplier_type ? (
                <Chip label={s.supplier_type} size="small"
                  sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#f0fdf4', color: '#166534' }} />
              ) : '—'}
            </ErpCell>

            {/* Email */}
            <ErpCell color="#475569" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{s.email || '—'}</ErpCell>

            {/* Payment Terms */}
            <ErpCell color="#64748b">{s.paymentterms || s.payment_terms || '—'}</ErpCell>

            {/* Action */}
            <ErpCell align="center">
              <Button size="small" variant="outlined" onClick={() => openEdit(s)}
                sx={{ textTransform: 'none', fontSize: '0.72rem', borderRadius: '6px',
                  py: 0.4, px: 1, borderColor: '#e2e8f0', color: '#475569', minWidth: 0,
                  '&:hover': { borderColor: '#1e40af', color: '#1e40af' } }}>
                Edit
              </Button>
            </ErpCell>
          </ErpRow>
        ))}
      </ErpTable>

      {/* ── New Supplier Dialog ────────────────── */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ pb: 1, fontWeight: 700, fontSize: '1rem', color: '#1e293b',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editRec ? 'Edit Supplier' : 'New Supplier'}
          <Tooltip title="Close"><IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton></Tooltip>
        </DialogTitle>

        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5, fontSize: '0.8125rem' }}>{formError}</Alert>}

            <Grid container spacing={2}>
              {/* GST row */}
              <Grid item xs={5}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <TextField label="GST Number" value={formData.gst_number} size="small" fullWidth
                    onChange={e => setFormData(f => ({ ...f, gst_number: e.target.value.toUpperCase() }))}
                    placeholder="22AAAAA0000A1Z5" inputProps={{ maxLength: 15 }} />
                  <Button variant="outlined" size="small" onClick={verifyGST} disabled={isVerifying}
                    sx={{textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap', borderRadius: '7px',
                      borderColor: '#cbd5e1', color: '#475569', mt: '1px',
                      '&:hover': { borderColor: '#94a3b8' }}}>
                    {isVerifying ? '…' : 'Verify'}
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={5}>
                <TextField label="Supplier Name *" value={formData.supplierName} size="small" fullWidth required onChange={set('supplierName')} />
              </Grid>
              <Grid item xs={2}>
                <TextField select label="Type" value={formData.supplier_type} size="small" fullWidth onChange={set('supplier_type')}>
                  {['Material Supplier', 'Asset Supplier', 'Service Provider'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Grid>

              {/* Contact */}
              <Grid item xs={4}>
                <TextField label="Email" type="email" value={formData.email} size="small" fullWidth onChange={set('email')} />
              </Grid>
              <Grid item xs={4}>
                <TextField label="Phone" value={formData.phone} size="small" fullWidth onChange={set('phone')} />
              </Grid>
              <Grid item xs={4}>
                <TextField label="Contact Person" value={formData.contact_person} size="small" fullWidth onChange={set('contact_person')} />
              </Grid>

              {/* Address */}
              <Grid item xs={6}>
                <TextField label="Address" value={formData.address} size="small" fullWidth onChange={set('address')} />
              </Grid>
              <Grid item xs={3}>
                <TextField label="City" value={formData.city} size="small" fullWidth onChange={set('city')} />
              </Grid>
              <Grid item xs={3}>
                <TextField label="State" value={formData.state} size="small" fullWidth onChange={set('state')} />
              </Grid>

              {/* Bank details */}
              <Grid item xs={4}>
                <TextField label="Bank Name" value={formData.bank_name} size="small" fullWidth onChange={set('bank_name')} />
              </Grid>
              <Grid item xs={4}>
                <TextField label="Account Number" value={formData.bank_account} size="small" fullWidth onChange={set('bank_account')} />
              </Grid>
              <Grid item xs={4}>
                <TextField label="IFSC Code" value={formData.bank_ifsc} size="small" fullWidth onChange={set('bank_ifsc')} />
              </Grid>

              {/* Terms */}
              <Grid item xs={4}>
                <TextField label="Payment Terms" value={formData.paymentTerms} size="small" fullWidth onChange={set('paymentTerms')} placeholder="e.g. Net 30" />
              </Grid>
              <Grid item xs={4}>
                <TextField select label="Currency" value={formData.currency} size="small" fullWidth onChange={set('currency')}>
                  {['INR', 'USD', 'EUR'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={4}>
                <TextField label="PAN Number" value={formData.pan_number} size="small" fullWidth onChange={set('pan_number')} />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", gap: 1, px: 3, pb: 2.5, pt: 1 }}>
            <Button onClick={handleClose} variant="outlined" size="small"
              sx={{textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', borderRadius: '7px',
                color: '#475569', borderColor: '#cbd5e1',
                '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' }}}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" size="small" disabled={canSave}
              sx={{textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', borderRadius: '7px',
                bgcolor: '#1e40af', boxShadow: 'none',
                '&:hover': { bgcolor: '#1e3a8a', boxShadow: '0 4px 12px rgba(30,64,175,0.25)' },
                '&.Mui-disabled': { bgcolor: '#cbd5e1', color: '#94a3b8' }}}>
              {saving ? 'Saving…' : 'Save Supplier'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ErpPagination count={pagn.filtered.length} page={pagn.page} onPageChange={pagn.setPage} rowsPerPage={pagn.ROWS_PER_PAGE} />
    </Box>
  );
}
