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
import LoadingBackdrop from '../../components/Shared/LoadingBackdrop';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';

const EMPTY_FORM = {
  itemId: '', forecastPeriod: '', forecastedQuantity: 0,
  confidenceLevel: 80, notes: ''
};

export default function Forecasts() {
  const [list, setList] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [fRes, itRes] = await Promise.all([
        apiClient.get('/planning/forecasts'),
        apiClient.get('/inventory/items')
      ]);
      setList(fRes.data); setItems(itRes.data);
    } catch { setError('Failed to load data'); }
    finally { setLoading(false); }
  };

  const set = (name) => (e) => setFormData(f => ({ ...f, [name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/planning/forecasts', formData);
      setOpen(false); load();
    } catch { setError('Failed to create forecast'); }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Demand Forecasts</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setOpen(true)}>New Forecast</Button>
      </Box>

      <Box className="erp-gtable" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Box className="erp-gthead" sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 120px 100px', px: 2, py: 1.25, bgcolor: '#f8fafc' }}>
          {['Item', 'Period', 'Quantity', 'Confidence'].map(h => <Typography key={h} variant="caption" sx={{ fontWeight: 700 }}>{h}</Typography>)}
        </Box>
        {loading ? <Skeleton height={100} /> : list.map(fc => (
          <Box className="erp-gtrow" key={fc.ForecastID} sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 120px 100px', alignItems: 'center', px: 2, py: 1.25, borderTop: '1px solid #f1f5f9' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{fc.ItemName}</Typography>
            <Typography variant="body2">{fc.ForecastPeriod}</Typography>
            <Typography variant="body2" sx={{ textAlign: 'right', pr: 2 }}>{fc.ForecastedQuantity}</Typography>
            <Typography variant="body2">{fc.ConfidenceLevel}%</Typography>
          </Box>
        ))}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between' }}>
          Create Forecast <IconButton onClick={() => setOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}><TextField select label="Item *" fullWidth size="small" required onChange={set('itemId')}>
                {items.map(it => <MenuItem key={it.id} value={it.id}>{it.code} - {it.name}</MenuItem>)}
              </TextField></Grid>
              <Grid item xs={6}><TextField label="Period (e.g. 2026-Q1) *" fullWidth size="small" required onChange={set('forecastPeriod')} /></Grid>
              <Grid item xs={6}><TextField label="Quantity *" type="number" fullWidth size="small" required onChange={set('forecastedQuantity')} /></Grid>
              <Grid item xs={6}><TextField label="Confidence (%)" type="number" fullWidth size="small" onChange={set('confidenceLevel')} /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", gap: 1, px: 3, pb: 2.5, pt: 1 }}>
            <Button onClick={() => setOpen(false)} variant="outlined" size="small"
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', borderRadius: '7px', color: '#475569', borderColor: '#cbd5e1', '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' } }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" size="small"
              sx={{textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', borderRadius: '7px', bgcolor: '#1e40af', boxShadow: 'none', '&:hover': { bgcolor: '#1e3a8a' }}}>
              Create
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
