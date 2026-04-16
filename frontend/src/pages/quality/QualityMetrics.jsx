import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import LoadingBackdrop from '../../components/Shared/LoadingBackdrop';

const MetricCard = ({ label, value, color }) => (
  <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{label}</Typography>
    <Typography variant="h4" sx={{ mt: 1, fontWeight: 800, color }}>{value}</Typography>
  </Paper>
);

export default function QualityMetrics() {
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/quality/metrics')
      .then(res => setMetrics(res.data))
      .catch(() => setMetrics({}))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <LoadingBackdrop open={loading} />
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>Quality Performance Dashboard</Typography>
      <Grid container spacing={3}>
        <Grid item xs={3}>
          <MetricCard label="Total Inspections" value={metrics.TotalInspections || 0} color="#1e40af" />
        </Grid>
        <Grid item xs={3}>
          <MetricCard label="Passed Items" value={metrics.PassedInspections || 0} color="#059669" />
        </Grid>
        <Grid item xs={3}>
          <MetricCard label="Non-Conformances" value={metrics.TotalNonConformances || 0} color="#dc2626" />
        </Grid>
        <Grid item xs={3}>
          <MetricCard label="Acceptance Rate" value={`${parseFloat(metrics.AcceptanceRate || 0).toFixed(1)}%`} color="#1e293b" />
        </Grid>
      </Grid>
    </Box>
  );
}
