import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { formatINR } from '../../utils/locale';
import LoadingBackdrop from '../../components/Shared/LoadingBackdrop';

import Box           from '@mui/material/Box';
import Typography    from '@mui/material/Typography';
import Button        from '@mui/material/Button';
import Dialog        from '@mui/material/Dialog';
import DialogTitle   from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField     from '@mui/material/TextField';
import MenuItem      from '@mui/material/MenuItem';
import Grid          from '@mui/material/Grid';
import Chip          from '@mui/material/Chip';
import Alert         from '@mui/material/Alert';
import IconButton    from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import AddIcon       from '@mui/icons-material/Add';
import CloseIcon     from '@mui/icons-material/Close';
import SearchIcon    from '@mui/icons-material/Search';

import ErpTable, { ErpRow, ErpCell } from '../../components/Shared/ErpTable';
import ErpPagination                 from '../../components/Shared/ErpPagination';
import usePagination                 from '../../hooks/usePagination';

/* ── Type chip colours ── */
const TYPE_COLOR = {
  Asset:     { bg: '#dbeafe', color: '#1e40af' },
  Liability: { bg: '#fee2e2', color: '#dc2626' },
  Equity:    { bg: '#dcfce7', color: '#166534' },
  Income:    { bg: '#fef3c7', color: '#92400e' },
  Expense:   { bg: '#f3e8ff', color: '#7e22ce' },
};
const tc = t => TYPE_COLOR[t] || { bg: '#f1f5f9', color: '#475569' };

/* ── Column definitions ─────────────────────────────────────────────────────
   width  → passed to <col> element (tableLayout: fixed)
   align  → header + cell text alignment
   ─────────────────────────────────────────────────────────────────────── */
const COLUMNS = [
  { label: 'Code',        width: '100px',  align: 'left'  },
  { label: 'Name',        width: '35%',    align: 'left'  },
  { label: 'Type',        width: '110px',  align: 'left'  },
  { label: 'Balance',     width: '140px',  align: 'right' },
  { label: 'Description', width: 'auto',   align: 'left'  },
];

const EMPTY_FORM = { accountCode: '', accountName: '', accountType: 'Asset', description: '' };

export default function ChartOfAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [open, setOpen]         = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [error, setError]       = useState('');
  const [formErr, setFormErr]   = useState('');
  const [success, setSuccess]   = useState('');

  /* Search + pagination hook */
  const pagn = usePagination(
    accounts,
    (a, q) =>
      (a.code || a.accountcode || '').toLowerCase().includes(q) ||
      (a.name || a.accountname || '').toLowerCase().includes(q) ||
      (a.type || a.accounttype || '').toLowerCase().includes(q)
  );

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiClient.get('/accounting/accounts');
      setAccounts(r.data || []);
      setError('');
    } catch { setError('Failed to load accounts'); }
    finally   { setLoading(false); }
  };

  const set = name => e => setForm(f => ({ ...f, [name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true); setFormErr('');
    try {
      await apiClient.post('/accounting/accounts', form);
      setSuccess('Account created successfully');
      setOpen(false); setForm(EMPTY_FORM); load();
    } catch (err) { setFormErr(err.response?.data?.error || 'Failed to create account'); }
    finally       { setSaving(false); }
  };

  return (
    <Box sx={{ p: 3 }}>
      <LoadingBackdrop open={loading} />

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>
          Chart of Accounts
        </Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />}
          onClick={() => { setForm(EMPTY_FORM); setFormErr(''); setOpen(true); }}
          sx={{ bgcolor: '#1e40af', textTransform: 'none', fontWeight: 600,
            borderRadius: '7px', boxShadow: 'none', '&:hover': { bgcolor: '#1e3a8a' } }}>
          New Account
        </Button>
      </Box>

      {error   && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* ── Search ── */}
      <TextField size="small" placeholder="Search by code, name or type…"
        value={pagn.search} onChange={pagn.handleSearchChange}
        sx={{ mb: 2, width: 300 }}
        InputProps={{ startAdornment:
          <InputAdornment position="start">
            <SearchIcon sx={{ fontSize: 18, color: '#94a3b8' }} />
          </InputAdornment>
        }} />

      {/* ── Table ── */}
      <ErpTable
        columns={COLUMNS}
        loading={loading}
        empty={!loading && pagn.filtered.length === 0}
        emptyText={pagn.search ? 'No accounts match your search.' : 'No accounts found.'}
      >
        {pagn.pageRows.map(acc => {
          const type   = acc.type || acc.accounttype || '';
          const colors = tc(type);
          return (
            <ErpRow key={acc.id || acc.accountid}>
              {/* Code */}
              <ErpCell mono bold color="#1e40af">
                {acc.code || acc.accountcode}
              </ErpCell>

              {/* Name */}
              <ErpCell bold color="#1e293b">
                {acc.name || acc.accountname}
              </ErpCell>

              {/* Type chip — not ellipsed, natural width */}
              <ErpCell sx={{ overflow: 'visible', textOverflow: 'unset' }}>
                <Chip label={type} size="small"
                  sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700,
                    bgcolor: colors.bg, color: colors.color }} />
              </ErpCell>

              {/* Balance — right aligned monospace */}
              <ErpCell align="right" mono color="#1e293b">
                {formatINR(Number(acc.balance ?? 0))}
              </ErpCell>

              {/* Description */}
              <ErpCell color="#64748b">
                {acc.description || acc.Description || '—'}
              </ErpCell>
            </ErpRow>
          );
        })}
      </ErpTable>

      {/* ── Pagination ── */}
      <ErpPagination
        count={pagn.filtered.length}
        page={pagn.page}
        onPageChange={pagn.setPage}
        rowsPerPage={pagn.ROWS_PER_PAGE}
        label="accounts"
      />

      {/* ── New Account Dialog ── */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', fontWeight: 700, fontSize: '1rem' }}>
          New Account
          <IconButton size="small" onClick={() => setOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>

        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            {formErr && <Alert severity="error" sx={{ mb: 2 }}>{formErr}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField label="Account Code *" fullWidth size="small" required
                  value={form.accountCode} onChange={set('accountCode')} placeholder="1000" />
              </Grid>
              <Grid item xs={8}>
                <TextField label="Account Name *" fullWidth size="small" required
                  value={form.accountName} onChange={set('accountName')} />
              </Grid>
              <Grid item xs={6}>
                <TextField select label="Account Type *" fullWidth size="small" required
                  value={form.accountType} onChange={set('accountType')}>
                  {['Asset', 'Liability', 'Equity', 'Income', 'Expense'].map(t => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField label="Description" fullWidth size="small"
                  value={form.description} onChange={set('description')} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={() => setOpen(false)} variant="outlined" size="small"
              sx={{ textTransform: 'none', borderRadius: '7px',
                color: '#475569', borderColor: '#cbd5e1' }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" size="small" disabled={saving}
              sx={{ textTransform: 'none', borderRadius: '7px', bgcolor: '#1e40af',
                boxShadow: 'none', '&:hover': { bgcolor: '#1e3a8a' } }}>
              {saving ? 'Creating…' : 'Create Account'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
