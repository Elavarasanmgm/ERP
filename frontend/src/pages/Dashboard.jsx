import { useState, useEffect } from 'react';
import apiClient, { notificationService } from '../services/apiClient';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import LoadingBackdrop from '../components/Shared/LoadingBackdrop';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  RadialBarChart, RadialBar,
} from 'recharts';

import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import PrecisionManufacturingOutlinedIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import NorthEastIcon from '@mui/icons-material/NorthEast';

const formatINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 });
const formatINRShort = (n) => {
  if (n >= 1e7) return '₹' + (n / 1e7).toFixed(1) + 'Cr';
  if (n >= 1e5) return '₹' + (n / 1e5).toFixed(1) + 'L';
  if (n >= 1e3) return '₹' + (n / 1e3).toFixed(1) + 'K';
  return '₹' + n;
};

const PALETTE = {
  primary: '#2563eb',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  purple: '#8b5cf6',
  cyan: '#06b6d4',
  pink: '#ec4899',
  slate: '#64748b',
  indigo: '#4f46e5',
  teal: '#0d9488',
};

const CHART_COLORS = [
  PALETTE.primary, PALETTE.success, PALETTE.purple, PALETTE.warning,
  PALETTE.cyan, PALETTE.pink, PALETTE.teal, PALETTE.indigo,
];

function StatCard({ icon, label, value, sub, color, trend }) {
  return (
    <Paper elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 4, p: 3, bgcolor: '#fff',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ width: 44, height: 44, borderRadius: 3, bgcolor: `${color}12`,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </Box>
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.25, borderRadius: 5, bgcolor: '#f0fdf4' }}>
            <NorthEastIcon sx={{ fontSize: 14, color: '#16a34a' }} />
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#16a34a' }}>{trend}%</Typography>
          </Box>
        )}
      </Box>
      <>
        <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', mb: 0.5 }}>{value}</Typography>
        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>{label}</Typography>
        {sub && <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 500 }}>{sub}</Typography>}
      </>
    </Paper>
  );
}

function ChartCard({ title, subtitle, children, height = 300 }) {
  return (
    <Paper elevation={0} sx={{ bgcolor: '#fff', border: '1px solid #f1f5f9', borderRadius: 4, p: 3,
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', height: '100%' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', lineHeight: 1.2 }}>{title}</Typography>
        {subtitle && <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500 }}>{subtitle}</Typography>}
      </Box>
      <Box sx={{ height }}>{children}</Box>
    </Paper>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 2, p: 2, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}>
      {label && <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 700, mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</Typography>}
      {payload.map((p, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color || p.fill }} />
          <Typography variant="body2" sx={{ color: '#f8fafc', fontWeight: 600 }}>
            {p.name}: <span style={{ color: '#38bdf8' }}>{typeof p.value === 'number' && p.value > 1000 ? formatINRShort(p.value) : p.value}</span>
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

function SectionTitle({ children }) {
  return (
    <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e293b', textTransform: 'uppercase',
      letterSpacing: '0.1em', fontSize: '0.7rem', display: 'block', mb: 2, mt: 4, ml: 0.5 }}>
      {children}
    </Typography>
  );
}

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentWO, setRecentWO] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [chartData, setChartData] = useState({
    revenueVsInvoices: [],
    salesFunnel: [],
    qualityTrends: [],
    hrHeadcount: [],
    projectProgress: [],
    stockValue: [],
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await notificationService.generateAlerts().catch(() => {});
        const [soRes, stockRes, poRes, projRes, woRes, invRes, leadsRes, oppsRes, empRes, qInsRes, notifRes] = await Promise.all([
          apiClient.get('/orders/sales-orders').catch(() => ({ data: [] })),
          apiClient.get('/inventory/stock').catch(() => ({ data: [] })),
          apiClient.get('/orders/purchase-orders').catch(() => ({ data: [] })),
          apiClient.get('/projects/projects').catch(() => ({ data: [] })),
          apiClient.get('/manufacturing/work-orders').catch(() => ({ data: [] })),
          apiClient.get('/accounting/invoices').catch(() => ({ data: [] })),
          apiClient.get('/crm/leads').catch(() => ({ data: [] })),
          apiClient.get('/crm/opportunities').catch(() => ({ data: [] })),
          apiClient.get('/hr/employees').catch(() => ({ data: [] })),
          apiClient.get('/quality/inspections').catch(() => ({ data: [] })),
          notificationService.getNotifications().catch(() => []),
        ]);

        const so = Array.isArray(soRes.data) ? soRes.data : [];
        const stock = Array.isArray(stockRes.data) ? stockRes.data : [];
        const po = Array.isArray(poRes.data) ? poRes.data : [];
        const proj = Array.isArray(projRes.data) ? projRes.data : [];
        const wo = Array.isArray(woRes.data) ? woRes.data : [];
        const inv = Array.isArray(invRes.data) ? invRes.data : [];
        const leads = Array.isArray(leadsRes.data) ? leadsRes.data : [];
        const opps = Array.isArray(oppsRes.data) ? oppsRes.data : [];
        const emps = Array.isArray(empRes.data) ? empRes.data : [];
        const inspections = Array.isArray(qInsRes.data) ? qInsRes.data : [];

        // ── KPIs Calculation ──────────────────────────────────────
        const totalSales = so.reduce((s, o) => s + Number(o.total_amount || o.totalamount || 0), 0);
        const totalStockValue = stock.reduce((s, i) => s + Number(i.total_value || 0), 0);
        const unpaidInv = inv.filter(i => i.status !== 'Paid' && i.status !== 'Cancelled');
        const unpaidTotal = unpaidInv.reduce((s, i) => s + Number(i.totalamount || i.total || i.total_amount || 0), 0);
        const activeWO = wo.filter(w => w.status !== 'Completed' && w.status !== 'Cancelled').length;
        const activeProj = proj.filter(p => p.Status !== 'Completed' && p.Status !== 'Cancelled').length;

        setStats({
          totalSales, totalStockValue, unpaidTotal, activeWO, activeProj,
          leadCount: leads.length, empCount: emps.length,
          soCount: so.length,
        });

        setRecentWO(wo.slice(0, 5));
        setLowStock(stock.filter(s => Number(s.quantity) <= Number(s.reorder_level || 0) && s.reorder_level).slice(0, 6));

        // ── Chart Data Preparation ────────────────────────────────

        // 1. Revenue vs Invoices (Monthly)
        const monthMap = {};
        so.forEach(o => {
          const m = (o.order_date || o.created_date || '').slice(0, 7);
          if (m) {
            if (!monthMap[m]) monthMap[m] = { month: m, Revenue: 0, Invoices: 0 };
            monthMap[m].Revenue += Number(o.total_amount || o.totalamount || 0);
          }
        });
        inv.forEach(i => {
          const m = (i.date || i.created_date || '').slice(0, 7);
          if (m) {
            if (!monthMap[m]) monthMap[m] = { month: m, Revenue: 0, Invoices: 0 };
            monthMap[m].Invoices += Number(i.total || i.totalamount || i.total_amount || 0);
          }
        });
        const revenueVsInvoices = Object.values(monthMap)
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-6)
          .map(r => ({ ...r, month: new Date(r.month + '-01').toLocaleDateString('en-IN', { month: 'short' }) }));

        // 2. Sales Funnel (CRM)
        const salesFunnel = [
          { value: leads.length, name: 'Leads', fill: PALETTE.slate },
          { value: opps.length, name: 'Opportunities', fill: PALETTE.purple },
          { value: so.length, name: 'Sales Orders', fill: PALETTE.primary },
          { value: inv.filter(i => i.status === 'Paid').length, name: 'Closed Won', fill: PALETTE.success },
        ].sort((a,b) => b.value - a.value);

        // 3. Quality Trends (Line)
        const qMap = {};
        inspections.forEach(qc => {
          const dateStr = qc.InspectionDate || qc.check_date || '';
          const m = dateStr.slice(0, 7);
          if (m) {
            if (!qMap[m]) qMap[m] = { month: m, total: 0, passed: 0 };
            qMap[m].total++;
            if (qc.Status === 'Passed') qMap[m].passed++;
          }
        });
        const qualityTrends = Object.values(qMap)
          .sort((a, b) => a.month.localeCompare(b.month))
          .map(r => ({
            name: new Date(r.month + '-01').toLocaleDateString('en-IN', { month: 'short' }),
            Rate: parseFloat(((r.passed / Math.max(r.total, 1)) * 100).toFixed(1))
          }));

        // 4. HR Headcount by Department (Donut)
        const hrMap = {};
        emps.forEach(e => {
          const d = e.Department || 'Others';
          hrMap[d] = (hrMap[d] || 0) + 1;
        });
        const hrHeadcount = Object.entries(hrMap).map(([name, value]) => ({ name, value }));

        // 5. Project Status (Bar)
        const projStatusMap = {};
        proj.forEach(p => {
          const s = p.Status || 'Planning';
          projStatusMap[s] = (projStatusMap[s] || 0) + 1;
        });
        const projectProgress = Object.entries(projStatusMap).map(([name, count]) => ({ name, count }));

        // 6. Stock Value Distribution
        const whMap = {};
        stock.forEach(s => {
          const w = s.warehouse || 'General';
          whMap[w] = (whMap[w] || 0) + Number(s.total_value || 0);
        });
        const stockValue = Object.entries(whMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

        setChartData({ revenueVsInvoices, salesFunnel, qualityTrends, hrHeadcount, projectProgress, stockValue });
        setNotifications(Array.isArray(notifRes) ? notifRes : (notifRes.data || []));

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) { console.error(e); }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) { console.error(e); }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Box sx={{ p: 4, bgcolor: '#fbfcfd', minHeight: '100vh' }}>
      <LoadingBackdrop open={loading} />
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>
            DIMA Enterprise Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, mt: 0.5 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip label="Live Updates" size="small" icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981', ml: 1 }} />}
            sx={{ fontWeight: 700, bgcolor: '#f0fdf4', color: '#16a34a', border: '1px solid #dcfce7' }} />
        </Box>
      </Box>

      {/* KPI Row */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard color={PALETTE.primary} trend={12}
            icon={<TrendingUpIcon sx={{ color: PALETTE.primary }} />}
            label="Total Revenue" value={formatINRShort(stats.totalSales)}
            sub={`${stats.soCount || 0} Sales Orders`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard color={PALETTE.success}
            icon={<Inventory2OutlinedIcon sx={{ color: PALETTE.success }} />}
            label="Inventory Value" value={formatINRShort(stats.totalStockValue)}
            sub="Current Assets" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard color={PALETTE.warning} trend={4}
            icon={<ReceiptLongOutlinedIcon sx={{ color: PALETTE.warning }} />}
            label="Accounts Receivable" value={formatINRShort(stats.unpaidTotal)}
            sub="Unpaid Invoices" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard color={PALETTE.purple}
            icon={<PeopleOutlinedIcon sx={{ color: PALETTE.purple }} />}
            label="Total Workforce" value={stats.empCount ?? '—'}
            sub="Active Employees" />
        </Grid>
      </Grid>

      <SectionTitle>Growth & Performance</SectionTitle>
      
      <Grid container spacing={3}>
        {/* Main Bar Chart */}
        <Grid item xs={12} md={8}>
          <ChartCard title="Financial Trajectory" subtitle="Revenue Generation vs. Invoicing (Monthly View)" height={340}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.revenueVsInvoices} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PALETTE.primary} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={PALETTE.primary} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PALETTE.success} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={PALETTE.success} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatINRShort} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={60} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 20, fontSize: 12, fontWeight: 600 }} />
                <Area type="monotone" dataKey="Revenue" stroke={PALETTE.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="Invoices" stroke={PALETTE.success} strokeWidth={3} fillOpacity={1} fill="url(#colorInv)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        {/* Sales Pipeline (Radial Bar) */}
        <Grid item xs={12} md={4}>
          <ChartCard title="Pipeline Efficiency" subtitle="Leads → Opportunities → Orders" height={340}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="15%" outerRadius="100" barSize={18} data={chartData.salesFunnel} startAngle={90} endAngle={-270}>
                <RadialBar
                  minAngle={15}
                  background
                  clockWise
                  dataKey="value"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  iconSize={10} 
                  layout="vertical" 
                  verticalAlign="middle" 
                  align="right"
                  wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingLeft: 10 }} 
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      <SectionTitle>Operational Excellence</SectionTitle>

      <Grid container spacing={3}>
        {/* Quality Trend */}
        <Grid item xs={12} md={3}>
          <ChartCard title="Quality Pass Rate" subtitle="Incoming Inspection Success %" height={280}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.qualityTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="stepAfter" dataKey="Rate" name="Pass Rate %" stroke={PALETTE.pink} strokeWidth={4} dot={{ r: 6, fill: PALETTE.pink, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        {/* HR Distribution */}
        <Grid item xs={12} md={6}>
          <ChartCard title="Workforce Composition" subtitle="Employees by Department" height={280}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={chartData.hrHeadcount} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={85} 
                  paddingAngle={5} 
                  dataKey="value"
                  labelLine={false}
                  label={(props) => {
                    const { cx, cy, midAngle, outerRadius, name, value, fill } = props;
                    if (!name) return null;
                    const RADIAN = Math.PI / 180;
                    const sin = Math.sin(-RADIAN * midAngle);
                    const cos = Math.cos(-RADIAN * midAngle);
                    const sx = cx + (outerRadius + 5) * cos;
                    const sy = cy + (outerRadius + 5) * sin;
                    const mx = cx + (outerRadius + 25) * cos;
                    const my = cy + (outerRadius + 25) * sin;
                    const ex = mx + (cos >= 0 ? 1 : -1) * 20;
                    const ey = my;
                    const textAnchor = cos >= 0 ? 'start' : 'end';

                    return (
                      <g>
                        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" strokeWidth={1.5} />
                        <circle cx={ex} cy={ey} r={2.5} fill={fill} stroke="none" />
                        <text x={ex + (cos >= 0 ? 1 : -1) * 10} y={ey} dy={5} textAnchor={textAnchor} fill="#334155" style={{ fontSize: '12px', fontWeight: 800 }}>
                          {`${name}: ${value}`}
                        </text>
                      </g>
                    );
                  }}
                >
                  {chartData.hrHeadcount.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        {/* Project Status */}
        <Grid item xs={12} md={3}>
          <ChartCard title="Project Landscape" subtitle="Active Projects by Lifecycle Stage" height={280}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.projectProgress} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={30}>
                  {chartData.projectProgress.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[(i + 4) % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Low Stock Ticker */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #fee2e2', bgcolor: '#fff' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: PALETTE.error, animation: 'pulse 2s infinite' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#991b1b' }}>Critical Stock Alerts</Typography>
            </Box>
            {lowStock.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#16a34a', py: 2 }}>✓ Inventory levels optimal</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {lowStock.map((s, i) => (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderRadius: 2, bgcolor: '#fff5f5' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#b91c1c' }}>{s.name}</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#b91c1c' }}>{s.quantity} {s.uom}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Work Orders */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #f1f5f9', bgcolor: '#fff' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>Manufacturing Stream</Typography>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {['Order', 'Product', 'Quantity', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 8px', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentWO.map(w => (
                  <tr key={w.workorderid} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '14px 8px', fontSize: '0.8rem', fontWeight: 800, color: PALETTE.primary }}>{w.ordernumber}</td>
                    <td style={{ padding: '14px 8px', fontSize: '0.8rem', color: '#334155' }}>{w.itemname}</td>
                    <td style={{ padding: '14px 8px', fontSize: '0.8rem', fontWeight: 700 }}>{w.quantity}</td>
                    <td style={{ padding: '14px 8px' }}>
                      <Chip label={w.status} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: '#f1f5f9', color: '#475569' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
