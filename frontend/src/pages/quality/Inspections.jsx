import { formatINR, formatDate } from '../../utils/locale';
import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { useAlert } from '../../hooks/useAlert';

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

const EMPTY_FORM = {
  inspectionType: 'Incoming', itemId: '', inspectionDate: new Date().toISOString().split('T')[0],
  quantitySampled: 0, quantityAccepted: 0, quantityRejected: 0, remarks: ''
};

export default function Inspections() {
  const [list, setList]         = useState([]);
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [open, setOpen]         = useState(false);
  const [saving, setSaving]     = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [error, setError]       = useState('');
  const [formError, setFormError] = useState('');
  const alert = useAlert();

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [iRes, itRes] = await Promise.all([
        apiClient.get('/quality/inspections'),
        apiClient.get('/inventory/items')
      ]);
      setList(iRes.data); setItems(itRes.data); setError('');
    } catch { setError('Failed to load inspections'); }
    finally { setLoading(false); }
  };

  const [editRec, setEditRec] = useState(null);

  const handleOpen  = () => { setEditRec(null); setFormData(EMPTY_FORM); setFormError(''); setOpen(true); };
  const handleClose = () => { setOpen(false); setFormError(''); };
  const openEdit = insp => {
    setEditRec(insp);
    setFormData({ inspectionType: insp.InspectionType||'Incoming', itemId: insp.ItemID||'', inspectionDate: insp.InspectionDate?.split('T')[0]||'', quantitySampled: insp.QuantitySampled||0, quantityAccepted: insp.QuantityAccepted||0, quantityRejected: insp.QuantityRejected||0, remarks: insp.Remarks||'' });
    setFormError(''); setOpen(true);
  };
  const set = (name) => (e) => setFormData(f => ({ ...f, [name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setFormError('');
    try {
      if (editRec) {
        await apiClient.put(`/quality/inspections/${editRec.InspectionID}`, formData);
        alert.success('Inspection updated successfully');
      } else {
        await apiClient.post('/quality/inspections', formData);
        alert.success('Inspection record created successfully');
      }
      handleClose(); load();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed');
      alert.error('Failed to save inspection record');
    } finally { setSaving(false); }
  };

  return (
    <Box sx={{ p: 3 }}>
      <LoadingBackdrop open={loading} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>Quality Inspections</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpen}
          sx={{ bgcolor: '#1e40af', textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', borderRadius: '7px' }}>
          New Inspection
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setError('')}>{error}</Alert>}

      <Box className="erp-gtable" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden', mb: 4 }}>
        <Box className="erp-gthead" sx={{ display: 'grid', gridTemplateColumns: '140px 100px 1fr 120px 100px 100px 110px 80px', px: 2, py: 1.25, bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
          {['Number', 'Type', 'Item', 'Date', 'Accepted', 'Rejected', 'Status', 'Action'].map((h, i) => (
            <Typography key={i} variant="caption" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</Typography>
          ))}
        </Box>
        {(
          list.map(insp => (
            <Box className="erp-gthead erp-gtrow" key={insp.InspectionID} sx={{ display: 'grid', gridTemplateColumns: '140px 100px 1fr 120px 100px 100px 110px 80px', alignItems: 'center', px: 2, py: '10px', borderBottom: '1px solid #f1f5f9', bgcolor: '#fff', '&:hover': { bgcolor: '#f8fafc' } }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#2563eb', fontWeight: 700 }}>{insp.InspectionNumber}</Typography>
              <Typography variant="body2">{insp.InspectionType}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{insp.ItemName}</Typography>
              <Typography variant="body2">{formatDate(insp.InspectionDate)}</Typography>
              <Typography variant="body2" sx={{ color: '#059669', fontWeight: 600 }}>{insp.QuantityAccepted}</Typography>
              <Typography variant="body2" sx={{ color: '#dc2626', fontWeight: 600 }}>{insp.QuantityRejected}</Typography>
              <Chip label={insp.Status} size="small" sx={{ height: 20, fontSize: '0.67rem', fontWeight: 700, bgcolor: insp.Status === 'Passed' ? '#dcfce7' : '#fee2e2', color: insp.Status === 'Passed' ? '#166534' : '#991b1b' }} />
              <Button size="small" variant="outlined" onClick={() => openEdit(insp)}
                sx={{ textTransform: 'none', fontSize: '0.72rem', borderRadius: '6px', py: 0.4, px: 1, borderColor: '#e2e8f0', color: '#475569', '&:hover': { borderColor: '#1e40af', color: '#1e40af' } }}>
                Edit
              </Button>
            </Box>
          ))
        )}
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ pb: 1, fontWeight: 700, fontSize: '1rem', color: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editRec ? 'Edit Inspection' : 'New Inspection Record'}
          <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField select label="Type *" value={formData.inspectionType} size="small" fullWidth required onChange={set('inspectionType')}>
                  {['Incoming', 'In-process', 'Final'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField label="Date" type="date" value={formData.inspectionDate} size="small" fullWidth required onChange={set('inspectionDate')} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12}>
                <TextField select label="Item *" value={formData.itemId} size="small" fullWidth required onChange={set('itemId')}>
                  {items.map(it => <MenuItem key={it.id} value={it.id}>{it.code} - {it.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={4}><TextField label="Sampled" type="number" value={formData.quantitySampled} size="small" fullWidth onChange={set('quantitySampled')} /></Grid>
              <Grid item xs={4}><TextField label="Accepted" type="number" value={formData.quantityAccepted} size="small" fullWidth onChange={set('quantityAccepted')} /></Grid>
              <Grid item xs={4}><TextField label="Rejected" type="number" value={formData.quantityRejected} size="small" fullWidth onChange={set('quantityRejected')} /></Grid>
              <Grid item xs={12}><TextField label="Remarks" multiline rows={2} value={formData.remarks} size="small" fullWidth onChange={set('remarks')} /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", gap: 1, px: 3, pb: 2.5, pt: 1 }}>
            <Button onClick={handleClose} variant="outlined" size="small"
              sx={{textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', borderRadius: '7px', color: '#475569', borderColor: '#cbd5e1', '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' }}}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" size="small" disabled={saving}
              sx={{textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', borderRadius: '7px', bgcolor: '#1e40af', boxShadow: 'none', '&:hover': { bgcolor: '#1e3a8a' }, '&.Mui-disabled': { bgcolor: '#cbd5e1', color: '#94a3b8' }}}>
              {saving ? 'Saving…' : editRec ? 'Update' : 'Save Record'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
