import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { formatINR } from '../../utils/locale';
import LoadingBackdrop from '../../components/Shared/LoadingBackdrop';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';

import BalanceOutlinedIcon from '@mui/icons-material/BalanceOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import MailOutlineIcon from '@mui/icons-material/MailOutline';

import ErpTable, { ErpRow, ErpCell } from '../../components/Shared/ErpTable';
import ErpPagination from '../../components/Shared/ErpPagination';

const COL_TRIAL = [
  { label: 'Code',         width: '120px', align: 'left'  },
  { label: 'Account Name', width: '1fr',   align: 'left'  },
  { label: 'Type',         width: '130px', align: 'left'  },
  { label: 'Debit',        width: '150px', align: 'right' },
  { label: 'Credit',       width: '150px', align: 'right' },
];

const COL_PL = [
  { label: 'Code',        width: '120px', align: 'left'  },
  { label: 'Description', width: '1fr',   align: 'left'  },
  { label: 'Amount',      width: '160px', align: 'right' },
];

const TYPE_COLOR = {
  Asset:     { bg: '#eff6ff', color: '#1d4ed8' },
  Expense:   { bg: '#fef2f2', color: '#b91c1c' },
  Income:    { bg: '#f0fdf4', color: '#15803d' },
  Liability: { bg: '#fdf4ff', color: '#7e22ce' },
  Equity:    { bg: '#fff7ed', color: '#c2410c' },
};

const DEBIT_TYPES  = ['Asset', 'Expense'];
const CREDIT_TYPES = ['Liability', 'Equity', 'Income'];

// Simple pagination hook for a plain array
function useSimplePagination(data) {
  const ROWS = 10;
  const [page, setPage] = useState(0);
  const pageRows = data.slice(page * ROWS, page * ROWS + ROWS);
  useEffect(() => { setPage(0); }, [data.length]);
  return { page, setPage, pageRows, total: data.length, ROWS_PER_PAGE: ROWS };
}

export default function FinancialReports() {
  const [tab, setTab]                   = useState(0);
  const [trialBalance, setTrialBalance] = useState([]);
  const [incomeStmt, setIncomeStmt]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  
  // Email dialog state
  const [emailOpen, setEmailOpen]       = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // Pagination state
  const tbPagn      = useSimplePagination(trialBalance);
  const incPagn     = useSimplePagination(incomeStmt.filter(r => r.type === 'Income'));
  const expPagn     = useSimplePagination(incomeStmt.filter(r => r.type === 'Expense'));

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    setLoading(true); setError('');
    try {
      const [tbRes, isRes] = await Promise.all([
        apiClient.get('/accounting/trial-balance').catch(() => ({ data: [] })),
        apiClient.get('/accounting/income-statement').catch(() => ({ data: [] })),
      ]);
      setTrialBalance(tbRes.data || []);
      setIncomeStmt(isRes.data || []);
    } catch { setError('Failed to load financial reports'); }
    finally { setLoading(false); }
  };

  const handleEmailReport = async () => {
    if (!recipientEmail) return;
    setEmailLoading(true);
    setError('');
    setSuccess('');

    try {
      const reportName = tab === 0 ? 'Trial Balance' : 'Income Statement';
      let htmlContent = `<h3 style="color: #1e40af;">${reportName} Summary</h3>`;
      
      if (tab === 0) {
        htmlContent += `
          <p>Total Debits: <b>${formatINR(totalDebits)}</b></p>
          <p>Total Credits: <b>${formatINR(totalCredits)}</b></p>
          <p>Status: <b>${Math.abs(totalDebits - totalCredits) < 0.01 ? 'Balanced' : 'Unbalanced'}</b></p>
        `;
      } else {
        htmlContent += `
          <p>Total Revenue: <b style="color: #15803d;">${formatINR(income)}</b></p>
          <p>Total Expenses: <b style="color: #b91c1c;">${formatINR(expenses)}</b></p>
          <p>Net ${netIncome >= 0 ? 'Profit' : 'Loss'}: <b>${formatINR(Math.abs(netIncome))}</b></p>
        `;
      }

      await apiClient.post('/reports/email', {
        to: recipientEmail,
        reportName,
        htmlContent
      });

      setSuccess(`Report emailed successfully to ${recipientEmail}`);
      setEmailOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to email report');
    } finally {
      setEmailLoading(false);
    }
  };

  const totalDebits  = trialBalance.filter(r => DEBIT_TYPES.includes(r.type)).reduce((s, r) => s + Number(r.balance || 0), 0);
  const totalCredits = trialBalance.filter(r => CREDIT_TYPES.includes(r.type)).reduce((s, r) => s + Number(r.balance || 0), 0);

  const incomeRows   = incomeStmt.filter(r => r.type === 'Income');
  const expenseRows  = incomeStmt.filter(r => r.type === 'Expense');
  const income       = incomeRows.reduce((s, r) => s + Number(r.balance || 0), 0);
  const expenses     = expenseRows.reduce((s, r) => s + Number(r.balance || 0), 0);
  const netIncome    = income - expenses;

  const tbIsLastPage = (tbPagn.page + 1) * tbPagn.ROWS_PER_PAGE >= trialBalance.length;
  const incIsLastPage = (incPagn.page + 1) * incPagn.ROWS_PER_PAGE >= incomeRows.length;
  const expIsLastPage = (expPagn.page + 1) * expPagn.ROWS_PER_PAGE >= expenseRows.length;

  return (
    <Box sx={{ p: 3 }}>
      <LoadingBackdrop open={loading} />
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>Financial Reports</Typography>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" size="small" startIcon={<MailOutlineIcon />} 
            onClick={() => setEmailOpen(true)}
            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', borderRadius: '7px',
              borderColor: '#cbd5e1', color: '#1e40af', '&:hover': { borderColor: '#1e40af', bgcolor: '#eff6ff' } }}>
            Email Report
          </Button>
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={fetchReports}
            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', borderRadius: '7px',
              borderColor: '#cbd5e1', color: '#475569', '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' } }}>
            Refresh
          </Button>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: '1px solid #e2e8f0' }}
        TabIndicatorProps={{ style: { backgroundColor: '#2563eb' } }}>
        <Tab icon={<BalanceOutlinedIcon sx={{ fontSize: 16 }} />} iconPosition="start"
          label="Trial Balance" sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', minHeight: 40, color: '#64748b' }} />
        <Tab icon={<TrendingUpOutlinedIcon sx={{ fontSize: 16 }} />} iconPosition="start"
          label="Income Statement (P&L)" sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', minHeight: 40, color: '#64748b' }} />
      </Tabs>

      {/* ── TAB 0: Trial Balance ── */}
      {tab === 0 && (
        <>
          <ErpTable columns={COL_TRIAL} loading={loading}
            empty={!loading && trialBalance.length === 0}
            emptyText="No account balances found.">
            {tbPagn.pageRows.map((r, i) => {
              const isDebit  = DEBIT_TYPES.includes(r.type);
              const isCredit = CREDIT_TYPES.includes(r.type);
              const tc = TYPE_COLOR[r.type] || { bg: '#f8fafc', color: '#64748b' };
              return (
                <ErpRow key={r.code || i}>
                  <ErpCell mono color="#64748b" sx={{ fontSize: '0.75rem' }}>{r.code || '—'}</ErpCell>
                  <ErpCell bold color="#1e293b">{r.name || '—'}</ErpCell>
                  <ErpCell>
                    {r.type ? (
                      <Chip label={r.type} size="small"
                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: tc.bg, color: tc.color }} />
                    ) : '—'}
                  </ErpCell>
                  <ErpCell align="right" mono color="#1e293b">
                    {isDebit && Number(r.balance) > 0 ? formatINR(r.balance) : '—'}
                  </ErpCell>
                  <ErpCell align="right" mono color="#1e293b">
                    {isCredit && Number(r.balance) > 0 ? formatINR(r.balance) : '—'}
                  </ErpCell>
                </ErpRow>
              );
            })}

            {trialBalance.length > 0 && tbIsLastPage && (
              <ErpRow sx={{ bgcolor: '#f1f5f9', borderTop: '2px solid #cbd5e1' }}>
                <ErpCell />
                <ErpCell bold color="#1e293b" sx={{ fontSize: '0.8rem' }}>TOTALS</ErpCell>
                <ErpCell />
                <ErpCell align="right" mono bold color="#1e40af">{formatINR(totalDebits)}</ErpCell>
                <ErpCell align="right" mono bold color="#1e40af">{formatINR(totalCredits)}</ErpCell>
              </ErpRow>
            )}
          </ErpTable>

          <ErpPagination count={trialBalance.length} page={tbPagn.page} onPageChange={tbPagn.setPage} rowsPerPage={tbPagn.ROWS_PER_PAGE} />

          {trialBalance.length > 0 && (
            <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'flex-end' }}>
              <Chip
                label={Math.abs(totalDebits - totalCredits) < 0.01 ? 'Balanced ✓' : `Out of balance by ${formatINR(Math.abs(totalDebits - totalCredits))}`}
                size="small"
                sx={{ fontWeight: 700, fontSize: '0.75rem',
                  bgcolor: Math.abs(totalDebits - totalCredits) < 0.01 ? '#dcfce7' : '#fee2e2',
                  color:   Math.abs(totalDebits - totalCredits) < 0.01 ? '#166534' : '#b91c1c' }}
              />
            </Box>
          )}
        </>
      )}

      {/* ── TAB 1: Income Statement ── */}
      {tab === 1 && (
        <>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5, display: 'block' }}>
            Revenue
          </Typography>
          <ErpTable columns={COL_PL} loading={loading}
            empty={!loading && incomeRows.length === 0}
            emptyText="No income accounts found.">
            {incPagn.pageRows.map((r, i) => (
              <ErpRow key={r.code || i}>
                <ErpCell mono color="#64748b" sx={{ fontSize: '0.75rem' }}>{r.code || '—'}</ErpCell>
                <ErpCell bold color="#1e293b">{r.name || '—'}</ErpCell>
                <ErpCell align="right" mono color="#15803d">{formatINR(r.balance)}</ErpCell>
              </ErpRow>
            ))}
            {incomeRows.length > 0 && incIsLastPage && (
              <ErpRow sx={{ bgcolor: '#f0fdf4' }}>
                <ErpCell />
                <ErpCell bold color="#15803d">Total Revenue</ErpCell>
                <ErpCell align="right" mono bold color="#15803d">{formatINR(income)}</ErpCell>
              </ErpRow>
            )}
          </ErpTable>
          <ErpPagination count={incomeRows.length} page={incPagn.page} onPageChange={incPagn.setPage} rowsPerPage={incPagn.ROWS_PER_PAGE} />

          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', mt: 2, mb: 0.5, display: 'block' }}>
            Expenses
          </Typography>
          <ErpTable columns={COL_PL} loading={loading}
            empty={!loading && expenseRows.length === 0}
            emptyText="No expense accounts found.">
            {expPagn.pageRows.map((r, i) => (
              <ErpRow key={r.code || i}>
                <ErpCell mono color="#64748b" sx={{ fontSize: '0.75rem' }}>{r.code || '—'}</ErpCell>
                <ErpCell bold color="#1e293b">{r.name || '—'}</ErpCell>
                <ErpCell align="right" mono color="#b91c1c">{formatINR(r.balance)}</ErpCell>
              </ErpRow>
            ))}
            {expenseRows.length > 0 && expIsLastPage && (
              <ErpRow sx={{ bgcolor: '#fef2f2' }}>
                <ErpCell />
                <ErpCell bold color="#b91c1c">Total Expenses</ErpCell>
                <ErpCell align="right" mono bold color="#b91c1c">{formatINR(expenses)}</ErpCell>
              </ErpRow>
            )}
          </ErpTable>
          <ErpPagination count={expenseRows.length} page={expPagn.page} onPageChange={expPagn.setPage} rowsPerPage={expPagn.ROWS_PER_PAGE} />

          {(income > 0 || expenses > 0) && (
            <Box sx={{ mt: 2, p: 2, borderRadius: 1.5, bgcolor: netIncome >= 0 ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${netIncome >= 0 ? '#bbf7d0' : '#fecaca'}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: netIncome >= 0 ? '#15803d' : '#b91c1c' }}>
                Net {netIncome >= 0 ? 'Profit' : 'Loss'}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 800, fontFamily: 'monospace', color: netIncome >= 0 ? '#15803d' : '#b91c1c' }}>
                {formatINR(Math.abs(netIncome))}
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* Email Dialog */}
      <Dialog open={emailOpen} onClose={() => !emailLoading && setEmailOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Email Report</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3, color: '#64748b' }}>
            Enter the recipient's email address to send the current <b>{tab === 0 ? 'Trial Balance' : 'Income Statement'}</b> summary.
          </Typography>
          <TextField
            autoFocus
            label="Recipient Email"
            type="email"
            fullWidth
            variant="outlined"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            disabled={emailLoading}
            placeholder="manager@example.com"
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setEmailOpen(false)} disabled={emailLoading} sx={{ color: '#64748b', fontWeight: 700 }}>
            Cancel
          </Button>
          <Button 
            onClick={handleEmailReport} 
            variant="contained" 
            disabled={emailLoading || !recipientEmail}
            sx={{ bgcolor: '#1e40af', fontWeight: 700, px: 3, borderRadius: 2 }}
          >
            {emailLoading ? 'Sending...' : 'Send Email'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
