import { formatINR } from '../../utils/locale';
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
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';

const EMPTY = { assetCode:'', assetName:'', category:'', location:'', purchaseDate: new Date().toISOString().split('T')[0], purchasePrice:0, currentValue:0, status:'Active' };
const STATUS_OPTS = ['Active','Under Maintenance','Disposed','Sold'];

export default function AssetList() {
  const [list, setList]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const [saving, setSaving]   = useState(false);
  const [editRec, setEditRec] = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [formErr, setFormErr] = useState('');

  const load = () => { setLoading(true); apiClient.get('/assets/assets').then(r => { setList(r.data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const set = n => e => setForm(f => ({ ...f, [n]: e.target.value }));

  const openNew = () => { setEditRec(null); setForm(EMPTY); setFormErr(''); setOpen(true); };
  const openEdit = a => {
    setEditRec(a);
    setForm({ assetCode: a.assetcode||a.AssetCode||'', assetName: a.assetname||a.AssetName||'', category: a.category||a.assettype||'', location: a.location||'', purchaseDate: a.purchasedate||a.PurchaseDate||'', purchasePrice: a.purchaseprice||a.PurchasePrice||0, currentValue: a.bookvalue||a.currentvalue||0, status: a.status||a.Status||'Active' });
    setFormErr(''); setOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setFormErr('');
    try {
      if (editRec) {
        await apiClient.put(`/assets/assets/${editRec.assetid||editRec.AssetID}`, form);
        setSuccess('Asset updated');
      } else {
        await apiClient.post('/assets/assets', form);
        setSuccess('Asset registered');
      }
      setOpen(false); load();
    } catch (err) { setFormErr(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <Box sx={{ p: 3 }}>
      <LoadingBackdrop open={loading} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Fixed Assets</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openNew}
          sx={{ bgcolor: '#1e40af', textTransform: 'none', fontWeight: 600, borderRadius: '7px', boxShadow: 'none', '&:hover': { bgcolor: '#1e3a8a' } }}>
          Register Asset
        </Button>
      </Box>
      {error   && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Box className="erp-gtable" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Box className="erp-gthead" sx={{ display: 'grid', gridTemplateColumns: '120px 1.5fr 1fr 120px 120px 90px 80px', px: 2, py: 1.25, bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
          {['Code','Name','Category','Cost','Book Value','Status','Action'].map(h => <Typography key={h} variant="caption" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</Typography>)}
        </Box>
        {list.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}><Typography variant="body2">No assets yet.</Typography></Box>
        ) : list.map(a => (
          <Box className="erp-gthead erp-gtrow" key={a.assetid||a.AssetID} sx={{ display: 'grid', gridTemplateColumns: '120px 1.5fr 1fr 120px 120px 90px 80px', alignItems: 'center', px: 2, py: 1.25, borderTop: '1px solid #f1f5f9', '&:hover': { bgcolor: '#f8fafc' } }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#2563eb', fontWeight: 700 }}>{a.assetcode||a.AssetCode}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{a.assetname||a.AssetName}</Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>{a.category||a.assettype}</Typography>
            <Typography variant="body2" sx={{ textAlign: 'right', pr: 2, fontFamily: 'monospace' }}>{formatINR(Number(a.purchaseprice||a.PurchasePrice||0))}</Typography>
            <Typography variant="body2" sx={{ textAlign: 'right', pr: 2, fontFamily: 'monospace', fontWeight: 700, color: '#1e40af' }}>{formatINR(Number(a.bookvalue||a.currentvalue||0))}</Typography>
            <Chip label={a.status||a.Status||'Active'} size="small" sx={{ height: 20, fontSize: '0.67rem', fontWeight: 700, bgcolor: '#dcfce7', color: '#166534' }} />
            <Button size="small" variant="outlined" onClick={() => openEdit(a)}
              sx={{ textTransform: 'none', fontSize: '0.72rem', borderRadius: '6px', py: 0.4, px: 1, borderColor: '#e2e8f0', color: '#475569', '&:hover': { borderColor: '#1e40af', color: '#1e40af' } }}>
              Edit
            </Button>
          </Box>
        ))}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem' }}>
          {editRec ? 'Edit Asset' : 'Register New Asset'}
          <IconButton size="small" onClick={() => setOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            {formErr && <Alert severity="error" sx={{ mb: 2 }}>{formErr}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={4}><TextField label="Code *" fullWidth size="small" required value={form.assetCode} onChange={set('assetCode')} disabled={!!editRec} /></Grid>
              <Grid item xs={8}><TextField label="Name *" fullWidth size="small" required value={form.assetName} onChange={set('assetName')} /></Grid>
              <Grid item xs={6}><TextField label="Category *" fullWidth size="small" required value={form.category} onChange={set('category')} /></Grid>
              <Grid item xs={6}><TextField label="Location" fullWidth size="small" value={form.location} onChange={set('location')} /></Grid>
              <Grid item xs={4}><TextField label="Purchase Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={form.purchaseDate} onChange={set('purchaseDate')} /></Grid>
              <Grid item xs={4}><TextField label="Purchase Price" type="number" fullWidth size="small" required value={form.purchasePrice} onChange={set('purchasePrice')} /></Grid>
              {editRec && <Grid item xs={4}><TextField label="Current Book Value" type="number" fullWidth size="small" value={form.currentValue} onChange={set('currentValue')} /></Grid>}
              {editRec && <Grid item xs={4}><TextField select label="Status" fullWidth size="small" value={form.status} onChange={set('status')}>{STATUS_OPTS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={() => setOpen(false)} variant="outlined" size="small" sx={{ textTransform: 'none', borderRadius: '7px' }}>Cancel</Button>
            <Button type="submit" variant="contained" size="small" disabled={saving}
              sx={{ textTransform: 'none', borderRadius: '7px', bgcolor: '#1e40af', boxShadow: 'none', '&:hover': { bgcolor: '#1e3a8a' } }}>
              {saving ? 'Saving…' : editRec ? 'Update' : 'Register'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
