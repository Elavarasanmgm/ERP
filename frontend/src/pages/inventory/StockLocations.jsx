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
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';

import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ErpTable, { ErpRow, ErpCell } from '../../components/Shared/ErpTable';

const DeleteConfirmDialog = ({ open, onClose, onConfirm, title, message }) => (
  <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: 2 } }}>
    <DialogTitle sx={{ fontWeight: 700, px: 3, pt: 3 }}>{title}</DialogTitle>
    <DialogContent sx={{ px: 3 }}>
      <Typography variant="body2" sx={{ color: '#475569' }}>{message}</Typography>
    </DialogContent>
    <DialogActions sx={{ p: 3, pt: 1 }}>
      <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 600, color: '#64748b' }}>Cancel</Button>
      <Button variant="contained" color="error" onClick={onConfirm} 
        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '7px', boxShadow: 'none' }}>
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);

const EMPTY_FORM = { warehouseId: '', rack: '', row: '', bin: '', locationCode: '' };

function autoCode(rack, row, bin) {
  const parts = [rack, row, bin].filter(Boolean);
  return parts.join('-');
}

const COLUMNS = [
  { label: 'Location Code', width: '180px', align: 'left' },
  { label: 'Rack',          width: 'auto',  align: 'left' },
  { label: 'Row',           width: 'auto',  align: 'left' },
  { label: 'Bin',           width: 'auto',  align: 'left' },
  { label: 'Status',        width: 'auto',  align: 'left' },
  { label: 'Actions',       width: '120px', align: 'right' },
];

export default function StockLocations() {
  const { success, error: alertError } = useAlert();
  const [locations, setLocations]   = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [open, setOpen]             = useState(false);
  const [saving, setSaving]         = useState(false);
  const [formData, setFormData]     = useState(EMPTY_FORM);
  const [editingId, setEditingId]   = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [formError, setFormError]   = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [lRes, wRes] = await Promise.all([
        apiClient.get('/inventory/locations').catch(() => ({ data: [] })),
        apiClient.get('/inventory/warehouses').catch(() => ({ data: [] })),
      ]);
      setLocations(Array.isArray(lRes.data) ? lRes.data : []);
      setWarehouses(Array.isArray(wRes.data) ? wRes.data : []);
    } catch { alertError('Failed to load locations'); }
    finally { setTimeout(() => setLoading(false), 300); }
  };

  const set = (name) => (e) => {
    setFormData(f => {
      const updated = { ...f, [name]: e.target.value };
      if (['rack', 'row', 'bin'].includes(name)) {
        updated.locationCode = autoCode(
          name === 'rack' ? e.target.value : f.rack,
          name === 'row'  ? e.target.value : f.row,
          name === 'bin'  ? e.target.value : f.bin,
        );
      }
      return updated;
    });
  };

  const handleOpen  = () => { setEditingId(null); setFormData(EMPTY_FORM); setFormError(''); setOpen(true); };
  const handleClose = () => { setOpen(false); setEditingId(null); setFormError(''); };

  const handleEdit = (loc) => {
    setEditingId(loc.id);
    setFormData({
      warehouseId: loc.warehouse_id,
      rack: loc.rack || '',
      row: loc.row || '',
      bin: loc.bin || '',
      locationCode: loc.location_code || ''
    });
    setOpen(true);
  };

  const handleToggle = async (loc) => {
    try {
      const newStatus = !loc.is_active;
      await apiClient.put(`/inventory/locations/${loc.id}`, { 
        warehouseId: loc.warehouse_id,
        rack: loc.rack,
        row: loc.row,
        bin: loc.bin,
        locationCode: loc.location_code,
        is_active: newStatus 
      });
      success(`Location ${newStatus ? 'activated' : 'deactivated'}`);
      load();
    } catch {
      alertError('Failed to update status');
    }
  };

  const handleDelete = (id) => {
    setDeleteItemId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await apiClient.delete(`/inventory/locations/${deleteItemId}`);
      success('Location deleted');
      setDeleteDialogOpen(false);
      load();
    } catch (err) {
      alertError(err?.response?.data?.error || 'Failed to delete location');
      setDeleteDialogOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.warehouseId) { setFormError('Please select a warehouse'); return; }
    if (!formData.rack)        { setFormError('Rack is required'); return; }
    setSaving(true); setFormError('');
    try {
      if (editingId) {
        await apiClient.put(`/inventory/locations/${editingId}`, formData);
        success('Location updated');
      } else {
        await apiClient.post('/inventory/locations', formData);
        success('Location added');
      }
      setOpen(false);
      setEditingId(null);
      load();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Failed to save location';
      setFormError(msg);
      alertError(msg);
    } finally { setSaving(false); }
  };

  // Group by warehouse
  const grouped = locations.reduce((acc, loc) => {
    const wName = loc.warehouse_name || loc.warehouseName || `Warehouse ${loc.warehouse_id}`;
    if (!acc[wName]) acc[wName] = [];
    acc[wName].push(loc);
    return acc;
  }, {});

  return (
    <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
      <LoadingBackdrop open={loading} />
      <Box sx={{ width: '100%', maxWidth: 1100 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>Stock Locations</Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>Manage Warehouse → Rack → Row → Bin structure</Typography>
          </Box>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpen}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '7px', bgcolor: '#2563eb',
              '&:hover': { bgcolor: '#1d4ed8' }, px: 2, py: 0.875 }}>
            Add Location
          </Button>
        </Box>

        {/* Stats bar */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, justifyContent: 'center' }}>
          {[
            { label: 'Total Locations', value: locations.length, color: '#2563eb' },
            { label: 'Warehouses',      value: Object.keys(grouped).length, color: '#10b981' },
            { label: 'Active',          value: locations.filter(l => l.is_active !== false).length, color: '#8b5cf6' },
          ].map(s => (
            <Box key={s.label} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, px: 2.5, py: 1.5, minWidth: 140, bgcolor: '#fff' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: s.color }}>{s.value}</Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>{s.label}</Typography>
            </Box>
          ))}
        </Box>

        {/* Location groups */}
        <Box sx={{ width: '100%' }}>
          {!loading && locations.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8, border: '2px dashed #e2e8f0', borderRadius: 2 }}>
              <WarehouseOutlinedIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>No locations configured yet.</Typography>
              <Button variant="outlined" size="small" sx={{ mt: 2, textTransform: 'none', borderRadius: '7px' }} onClick={handleOpen}>
                Add First Location
              </Button>
            </Box>
          ) : (
            Object.entries(grouped).map(([wName, locs]) => (
              <Box key={wName} sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <WarehouseOutlinedIcon sx={{ fontSize: 18, color: '#64748b' }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.875rem' }}>{wName}</Typography>
                  <Chip label={`${locs.length} locations`} size="small"
                    sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#f1f5f9', color: '#475569', fontWeight: 600 }} />
                </Box>
                <ErpTable columns={COLUMNS} loading={false} empty={locs.length === 0} emptyText="No locations in this warehouse.">
                {locs.map((loc, idx) => (
                  <ErpRow key={loc.id || loc.locationid || idx}>
                    <ErpCell mono bold color="#2563eb">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <LocationOnOutlinedIcon sx={{ fontSize: 14, color: '#2563eb' }} />
                        {loc.location_code || loc.locationCode || '—'}
                      </Box>
                    </ErpCell>
                    <ErpCell color="#1e293b">{loc.rack || '—'}</ErpCell>
                    <ErpCell color="#475569">{loc.row  || '—'}</ErpCell>
                    <ErpCell color="#475569">{loc.bin  || '—'}</ErpCell>
                    <ErpCell>
                      <Chip label={loc.is_active !== false ? 'Active' : 'Inactive'} size="small"
                        sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700,
                          bgcolor: loc.is_active !== false ? '#dcfce7' : '#fee2e2',
                          color:   loc.is_active !== false ? '#166534' : '#dc2626' }} />
                    </ErpCell>
                    <ErpCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Tooltip title={loc.is_active !== false ? 'Deactivate' : 'Activate'}>
                          <IconButton size="small" onClick={() => handleToggle(loc)} sx={{ color: loc.is_active !== false ? '#059669' : '#94a3b8' }}>
                            {loc.is_active !== false ? <VisibilityIcon sx={{ fontSize: 18 }} /> : <VisibilityOffIcon sx={{ fontSize: 18 }} />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleEdit(loc)} sx={{ color: '#2563eb' }}>
                            <EditIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleDelete(loc.id)} sx={{ color: '#ef4444' }}>
                            <DeleteIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ErpCell>
                  </ErpRow>
                ))}
              </ErpTable>
            </Box>
          ))
        )}
      </Box>

      {/* Add/Edit Location Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid #f1f5f9', pb: 1.5, fontWeight: 700, fontSize: '1rem' }}>
          {editingId ? 'Edit Stock Location' : 'Add Stock Location'}
          <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 2.5 }}>
            {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField select required fullWidth size="small" label="Warehouse"
                  value={formData.warehouseId} onChange={set('warehouseId')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}>
                  {warehouses.map(w => (
                    <MenuItem key={w.id || w.WarehouseId} value={w.id || w.WarehouseId}>
                      {w.name || w.WarehouseName}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={4}>
                <TextField required fullWidth size="small" label="Rack" placeholder="A"
                  value={formData.rack} onChange={set('rack')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth size="small" label="Row" placeholder="01"
                  value={formData.row} onChange={set('row')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth size="small" label="Bin" placeholder="B3"
                  value={formData.bin} onChange={set('bin')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth size="small" label="Location Code (auto-generated)"
                  value={formData.locationCode} onChange={set('locationCode')}
                  helperText="Auto-filled from Rack-Row-Bin, or enter manually"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", gap: 1, px: 3, pb: 2.5 }}>
            <Button onClick={handleClose} sx={{ textTransform: 'none', color: '#64748b' }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '7px', bgcolor: '#2563eb',
                '&:hover': { bgcolor: '#1d4ed8' }, px: 3 }}>
              {saving ? 'Saving…' : (editingId ? 'Update Location' : 'Add Location')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Stock Location"
        message="Are you sure you want to delete this stock location? This action cannot be undone."
      />
      </Box>
    </Box>
  );
}
