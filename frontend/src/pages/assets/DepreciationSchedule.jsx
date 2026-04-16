import { formatINR } from '../../utils/locale';
import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { useAlert } from '../../hooks/useAlert';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import LoadingBackdrop from '../../components/Shared/LoadingBackdrop';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';

import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined';
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined';

export default function DepreciationSchedule() {
  const [schedules, setSchedules] = useState([]);
  const [assets, setAssets]       = useState([]);
  const [selectedAsset, setSelectedAsset] = useState('');
  const [loading, setLoading]     = useState(true);
  const [running, setRunning]     = useState(false);

  const alert = useAlert();

  useEffect(() => { loadAssets(); }, []);
  useEffect(() => { if (selectedAsset) loadSchedule(selectedAsset); else loadSchedule(); }, [selectedAsset]);

  const loadAssets = async () => {
    try {
      const res = await apiClient.get('/assets/assets').catch(() => ({ data: [] }));
      setAssets(Array.isArray(res.data) ? res.data : []);
    } catch { /* silent */ }
  };

  const loadSchedule = async (assetId) => {
    setLoading(true);
    try {
      const url = assetId ? `/assets/depreciation-schedules?assetId=${assetId}` : '/assets/depreciation-schedules';
      const res = await apiClient.get(url).catch(() => ({ data: [] }));
      setSchedules(Array.isArray(res.data) ? res.data : []);
    } catch { 
      alert.error('Failed to load depreciation schedules'); 
    } finally { 
      setLoading(false); 
    }
  };

  const runDepreciation = async () => {
    setRunning(true);
    try {
      await apiClient.post('/assets/depreciation', { runAll: true });
      alert.success('Depreciation run completed successfully');
      loadSchedule(selectedAsset);
    } catch (err) {
      alert.error(err?.response?.data?.message || err?.response?.data?.error || 'Depreciation run failed');
    } finally { 
      setRunning(false); 
    }
  };

  // Aggregate totals
  const totalOriginal = schedules.reduce((sum, s) => sum + Number(s.OpeningValue || 0), 0);
  const totalDepreciation = schedules.reduce((sum, s) => sum + Number(s.DepreciationAmount || 0), 0);
  const totalClosing = schedules.reduce((sum, s) => sum + Number(s.ClosingValue || 0), 0);

  return (
    <Box sx={{ p: 3 }}>
      <LoadingBackdrop open={loading} />
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>Depreciation Schedule</Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            Year-wise SLM / WDV depreciation per asset
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" startIcon={<RefreshOutlinedIcon />}
            onClick={() => loadSchedule(selectedAsset)}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '7px',
              borderColor: '#cbd5e1', color: '#475569', '&:hover': { borderColor: '#94a3b8' } }}>
            Refresh
          </Button>
          <Button variant="contained" size="small" startIcon={<CalculateOutlinedIcon />}
            onClick={runDepreciation} disabled={running}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '7px',
              bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' }, px: 2 }}>
            {running ? 'Running…' : 'Run Depreciation'}
          </Button>
        </Box>
      </Box>

      {/* Filter & summary row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <TextField select size="small" label="Filter by Asset" value={selectedAsset}
          onChange={e => setSelectedAsset(e.target.value)}
          sx={{ minWidth: 240, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}>
          <MenuItem value="">All Assets</MenuItem>
          {assets.map(a => (
            <MenuItem key={a.AssetID} value={a.AssetID}>{a.AssetName} ({a.AssetCode})</MenuItem>
          ))}
        </TextField>

        {[
          { label: 'Original Value',    value: formatINR(totalOriginal),      color: '#2563eb' },
          { label: 'Total Depreciation',value: formatINR(totalDepreciation),  color: '#ef4444' },
          { label: 'Closing WDV',       value: formatINR(totalClosing),        color: '#10b981' },
        ].map(s => (
          <Box key={s.label} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, px: 2, py: 1, minWidth: 150, bgcolor: '#fff' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem' }}>{s.label}</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: s.color, fontFamily: 'monospace', fontSize: '1rem' }}>
              {s.value}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Table */}
      <Box className="erp-gtable" sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Box className="erp-gthead" sx={{ display: 'grid', gridTemplateColumns: '180px 1fr 120px 130px 130px 130px 100px',
          px: 2, py: 1.25, bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
          {['Asset', 'Date', 'Opening WDV', 'Depreciation', 'Closing WDV', 'Status'].map((h, i) => (
            <Typography key={i} variant="caption"
              sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase',
                textAlign: i >= 2 && i <= 4 ? 'right' : 'left', letterSpacing: '0.04em' }}>
              {h}
            </Typography>
          ))}
        </Box>

        {schedules.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 7 }}>
            <TrendingDownOutlinedIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>No depreciation schedules found.</Typography>
            <Typography variant="caption" sx={{ color: '#cbd5e1' }}>
              Click "Run Depreciation" to generate schedules for all active assets.
            </Typography>
          </Box>
        ) : (
          schedules.map((s, idx) => {
            const opening = Number(s.OpeningValue || 0);
            const depr    = Number(s.DepreciationAmount || 0);
            const closing = Number(s.ClosingValue || 0);
            const pct     = opening > 0 ? Math.round((depr / opening) * 100) : 0;
            return (
              <Box key={s.ScheduleID || idx} className="erp-gtrow" sx={{
                display: 'grid', gridTemplateColumns: '180px 1fr 120px 130px 130px 130px 100px',
                alignItems: 'center', px: 2, py: '10px',
                borderBottom: idx < schedules.length - 1 ? '1px solid #f1f5f9' : 'none',
                '&:hover': { bgcolor: '#f8fafc' }
              }}>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b', fontSize: '0.8125rem' }}>
                  {s.AssetName || '—'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8125rem' }}>
                  {s.Date ? new Date(s.Date).toLocaleDateString() : '—'}
                </Typography>
                <Typography variant="body2" sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                  {formatINR(opening)}
                </Typography>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: '#ef4444', fontWeight: 600 }}>
                    {formatINR(depr)}
                  </Typography>
                  <Tooltip title={`${pct}% of opening value`}>
                    <LinearProgress variant="determinate" value={pct}
                      sx={{ height: 3, borderRadius: 2, mt: 0.5, bgcolor: '#fee2e2',
                        '& .MuiLinearProgress-bar': { bgcolor: '#ef4444' } }} />
                  </Tooltip>
                </Box>
                <Typography variant="body2" sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8125rem', color: '#10b981' }}>
                  {formatINR(closing)}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Chip label={s.Status || 'Pending'} size="small"
                    sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600,
                      bgcolor: s.Status === 'Posted' ? '#dcfce7' : '#fef9c3',
                      color:   s.Status === 'Posted' ? '#166534' : '#854d0e' }} />
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}
