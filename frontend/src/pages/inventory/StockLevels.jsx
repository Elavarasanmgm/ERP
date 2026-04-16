import { useState, useEffect, useMemo } from 'react';
import apiClient from '../../services/apiClient';
import {
  Box, Typography, Button, TextField, InputAdornment, Chip,
  TableSortLabel, Dialog,
  DialogTitle, DialogContent, DialogActions, Autocomplete,
  ToggleButton, ToggleButtonGroup, Divider
} from '@mui/material';
import LoadingBackdrop from '../../components/Shared/LoadingBackdrop';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import usePagination from '../../hooks/usePagination';
import ErpPagination from '../../components/Shared/ErpPagination';
import ErpTable, { ErpRow, ErpCell } from '../../components/Shared/ErpTable';
import { useAlert } from '../../hooks/useAlert';

// ─── Stock Status helper ───────────────────────────────────────────────────────
const getStatus = (qty, reorder) => {
  if (qty <= 0)           return { label: 'Out of Stock', color: '#dc2626', bg: '#fef2f2' };
  if (qty <= reorder)     return { label: 'Below Reorder', color: '#d97706', bg: '#fffbeb' };
  if (qty <= reorder * 1.5) return { label: 'Low',         color: '#ca8a04', bg: '#fefce8' };
  return                         { label: 'Healthy',       color: '#16a34a', bg: '#f0fdf4' };
};

// ─── Mini stock bar ───────────────────────────────────────────────────────────
const StockBar = ({ qty, reorder }) => {
  const max   = Math.max(qty, reorder * 2, 1);
  const pct   = Math.min((qty / max) * 100, 100);
  const { color } = getStatus(qty, reorder);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ flex: 1, height: 6, bgcolor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: color, borderRadius: 3, transition: 'width .3s' }} />
      </Box>
      {reorder > 0 && (
        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.6rem', whiteSpace: 'nowrap' }}>
          RL: {reorder}
        </Typography>
      )}
    </Box>
  );
};

// ─── Add Stock Dialog ─────────────────────────────────────────────────────────
const MOVEMENT_TYPES = [
  { value: 'Receipt',    label: 'Receipt',    icon: <TrendingUpIcon fontSize="small" />,  color: '#16a34a', desc: 'Goods received / inward stock' },
  { value: 'ADJUSTMENT', label: 'Adjustment', icon: <SwapHorizIcon fontSize="small" />,   color: '#2563eb', desc: 'Manual count correction' },
  { value: 'Return',     label: 'Return',     icon: <TrendingDownIcon fontSize="small" />, color: '#7c3aed', desc: 'Goods returned to warehouse' },
];

const emptyForm = { item: null, warehouse: null, movementType: 'Receipt', quantity: '', unitCost: '', reason: '' };

function AddStockDialog({ open, onClose, onSaved, items, warehouses }) {
  const { success, error } = useAlert();
  const [form, setForm]     = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.item || !form.warehouse) return error('Please select item and warehouse');
    if (!form.quantity || Number(form.quantity) <= 0) return error('Quantity must be greater than 0');
    setSaving(true);
    try {
      await apiClient.put('/inventory/stock/adjust', {
        itemId:       form.item.id,
        warehouseId:  form.warehouse.id,
        quantity:     Number(form.quantity),
        unitCost:     Number(form.unitCost || 0),
        movementType: form.movementType,
        reason:       form.reason || null,
      });
      success(`Stock added: ${form.quantity} × ${form.item.name} → ${form.warehouse.name}`);
      setForm(emptyForm);
      onSaved();
      onClose();
    } catch (e) {
      error(e?.response?.data?.error || 'Failed to add stock');
    } finally {
      setSaving(false);
    }
  };

  const selectedType = MOVEMENT_TYPES.find(m => m.value === form.movementType);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1, fontWeight: 700, color: '#1e293b' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarehouseIcon sx={{ color: '#64748b' }} />
          Add Stock to Warehouse
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

        {/* Movement Type toggle */}
        <Box>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, mb: 1, display: 'block' }}>
            MOVEMENT TYPE
          </Typography>
          <ToggleButtonGroup exclusive value={form.movementType}
            onChange={(_, v) => v && set('movementType', v)}
            sx={{ gap: 1, flexWrap: 'wrap' }}>
            {MOVEMENT_TYPES.map(m => (
              <ToggleButton key={m.value} value={m.value} sx={{
                borderRadius: '8px !important', border: '1.5px solid #e2e8f0 !important', px: 2, py: 1,
                textTransform: 'none', fontWeight: 600, fontSize: '0.8rem',
                '&.Mui-selected': { bgcolor: m.color + '15', borderColor: m.color + ' !important', color: m.color },
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  {m.icon} {m.label}
                </Box>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          {selectedType && (
            <Typography variant="caption" sx={{ color: '#94a3b8', mt: 0.5, display: 'block' }}>
              {selectedType.desc}
            </Typography>
          )}
        </Box>

        {/* Item */}
        <Autocomplete
          options={items}
          getOptionLabel={o => `${o.code} — ${o.name}`}
          value={form.item}
          onChange={(_, v) => setForm(f => ({ ...f, item: v, unitCost: v?.unit_price ? String(v.unit_price) : f.unitCost }))}
          renderInput={p => <TextField {...p} label="Item *" size="small" />}
          renderOption={(p, o) => (
            <li {...p} key={o.id}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{o.name}</Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>{o.code} · {o.unit_of_measure}</Typography>
              </Box>
            </li>
          )}
          isOptionEqualToValue={(o, v) => o.id === v.id}
        />

        {/* Warehouse */}
        <Autocomplete
          options={warehouses}
          getOptionLabel={o => o.name}
          value={form.warehouse}
          onChange={(_, v) => set('warehouse', v)}
          renderInput={p => <TextField {...p} label="Warehouse *" size="small" />}
          isOptionEqualToValue={(o, v) => o.id === v.id}
        />

        {/* Qty + Unit Cost side by side */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <TextField
            label="Quantity *" size="small" type="number"
            value={form.quantity} onChange={e => set('quantity', e.target.value)}
            inputProps={{ min: 1 }}
          />
          <TextField
            label="Unit Cost (₹)" size="small" type="number"
            value={form.unitCost} onChange={e => set('unitCost', e.target.value)}
            inputProps={{ min: 0, step: '0.01' }}
            helperText="Optional — updates stock value"
          />
        </Box>

        {/* Reason */}
        <TextField
          label="Reason / Notes" size="small" multiline rows={2}
          value={form.reason} onChange={e => set('reason', e.target.value)}
          placeholder="e.g. Physical count correction, supplier delivery..."
        />

        {/* Preview */}
        {form.item && form.warehouse && form.quantity > 0 && (
          <Box sx={{ bgcolor: (selectedType?.color || '#2563eb') + '08', border: `1px solid ${selectedType?.color || '#2563eb'}30`, borderRadius: 2, p: 1.5 }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>PREVIEW</Typography>
            <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600, mt: 0.5 }}>
              +{form.quantity} {form.item?.unit_of_measure || 'units'} of <strong>{form.item?.name}</strong>
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              → {form.warehouse?.name}
              {form.unitCost ? `  ·  Total value: ₹${(Number(form.quantity) * Number(form.unitCost)).toLocaleString('en-IN')}` : ''}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: '#64748b' }}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}>
          {saving ? 'Saving…' : 'Add Stock'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const StockLevels = () => {
  const { error } = useAlert();
  const [stocks,     setStocks]     = useState([]);
  const [items,      setItems]      = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig,   setSortConfig]   = useState({ key: 'code', direction: 'asc' });
  const [dialogOpen,   setDialogOpen]   = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [stockRes, itemRes, whRes] = await Promise.all([
        apiClient.get('/inventory/stock'),
        apiClient.get('/inventory/items'),
        apiClient.get('/inventory/warehouses'),
      ]);
      setStocks(stockRes.data);
      setItems(itemRes.data.map(i => ({ id: i.id || i.itemid, code: i.code || i.itemcode, name: i.name || i.itemname, unit_of_measure: i.unit_of_measure, unit_price: i.unit_price || i.unitprice || 0 })));
      setWarehouses(whRes.data.map(w => ({ id: w.id || w.warehouseid, name: w.name || w.warehousename })));
    } catch {
      error('Failed to load stock data');
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const processedData = useMemo(() => {
    let result = stocks.filter(item =>
      (item.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.code || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.warehouse || '').toLowerCase().includes(search.toLowerCase())
    );
    if (statusFilter === 'below') result = result.filter(i => i.quantity > 0 && i.quantity <= (i.reorder_level || 0));
    else if (statusFilter === 'above') result = result.filter(i => i.quantity > (i.reorder_level || 0));
    else if (statusFilter === 'out')   result = result.filter(i => i.quantity <= 0);

    if (sortConfig.key) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key] ?? '', valB = b[sortConfig.key] ?? '';
        let cmp = typeof valA === 'number' ? valA - valB : String(valA).toLowerCase() < String(valB).toLowerCase() ? -1 : String(valA).toLowerCase() > String(valB).toLowerCase() ? 1 : 0;
        if (cmp !== 0) return sortConfig.direction === 'asc' ? cmp : -cmp;
        return String(a.code || '').localeCompare(String(b.code || ''));
      });
    }
    return result;
  }, [stocks, search, sortConfig, statusFilter]);

  const pagn = usePagination(processedData);


  const columns = [
    { id: 'code',          label: 'Item Code',     align: 'left',  width: '12%' },
    { id: 'name',          label: 'Item Name',     align: 'left',  width: '26%' },
    { id: 'warehouse',     label: 'Warehouse',     align: 'left',  width: '16%' },
    { id: 'quantity',      label: 'Stock in Hand', align: 'right', width: '13%' },
    { id: 'reorder_level', label: 'Reorder Level', align: 'right', width: '12%' },
    { id: '_bar',          label: 'Stock Health',  align: 'left',  width: '14%' },
    { id: '_status',       label: 'Status',        align: 'center',width: '10%' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <LoadingBackdrop open={loading} />

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Inventory2OutlinedIcon sx={{ color: '#64748b' }} />
          Stock Levels by Warehouse
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button variant="contained" size="small" startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px', bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}>
            Add Stock
          </Button>
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />}
            onClick={fetchAll}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px', color: '#64748b', borderColor: '#cbd5e1' }}>
            Refresh
          </Button>
        </Box>
      </Box>


      {/* Search + Filter */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Search item or warehouse..."
          value={search} onChange={e => { setSearch(e.target.value); pagn.setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8', fontSize: 20 }} /></InputAdornment>, sx: { borderRadius: '8px', bgcolor: '#fff' } }}
          sx={{ width: 280 }} />
        {[
          { value: 'all',   label: 'All',              color: '#64748b', active: '#f1f5f9' },
          { value: 'out',   label: 'Out of Stock',     color: '#dc2626', active: '#fef2f2' },
          { value: 'below', label: 'Below Reorder',    color: '#d97706', active: '#fffbeb' },
          { value: 'above', label: 'Above Reorder',    color: '#16a34a', active: '#f0fdf4' },
        ].map(f => (
          <Button key={f.value} size="small" onClick={() => { setStatusFilter(f.value); pagn.setPage(0); }}
            sx={{
              textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', borderRadius: '8px',
              px: 1.5, py: 0.6,
              color: statusFilter === f.value ? f.color : '#94a3b8',
              bgcolor: statusFilter === f.value ? f.active : 'transparent',
              border: statusFilter === f.value ? `1.5px solid ${f.color}40` : '1.5px solid transparent',
              '&:hover': { bgcolor: f.active, color: f.color },
            }}>
            {f.label}
          </Button>
        ))}
      </Box>

      {/* Table */}
      <ErpTable
        columns={columns.map(col => ({
          ...col,
          label: ['_bar', '_status', '_action'].includes(col.id) ? col.label : (
            <TableSortLabel active={sortConfig.key === col.id}
              direction={sortConfig.key === col.id ? sortConfig.direction : 'asc'}
              onClick={() => handleSort(col.id)}
              sx={{ '& .MuiTableSortLabel-icon': { color: '#94a3b8 !important' }, '&.Mui-active': { color: '#1e293b' } }}>
              {col.label}
            </TableSortLabel>
          )
        }))}
        loading={loading}
        empty={!loading && pagn.pageRows.length === 0}>
        {!loading && pagn.pageRows.map((stock) => {
          const reorder = stock.reorder_level || 0;
          const status  = getStatus(stock.quantity, reorder);
          return (
            <ErpRow key={`${stock.id}-${stock.warehouse_id}`}
              sx={{ bgcolor: stock.quantity <= 0 ? '#fef2f2 !important' : stock.quantity <= reorder ? '#fffbeb !important' : 'inherit' }}>
              <ErpCell align="left" mono bold color="#1e40af">{stock.code}</ErpCell>
              <ErpCell align="left" bold color="#1e293b">{stock.name}</ErpCell>
              <ErpCell align="left">
                <Chip label={stock.warehouse} size="small" variant="outlined"
                  sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#64748b', borderColor: '#e2e8f0' }} />
              </ErpCell>

              {/* Stock in Hand */}
              <ErpCell align="right">
                <Typography variant="body2" sx={{ fontWeight: 700, color: status.color, lineHeight: 1.2 }}>
                  {stock.quantity}
                  <Typography component="span" variant="caption" sx={{ color: '#94a3b8', ml: 0.5 }}>
                    {stock.unit_of_measure}
                  </Typography>
                </Typography>
              </ErpCell>

              {/* Reorder Level */}
              <ErpCell align="right">
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>
                  {reorder > 0 ? reorder : <span style={{ color: '#cbd5e1' }}>—</span>}
                </Typography>
              </ErpCell>

              {/* Stock Health Bar */}
              <ErpCell>
                <StockBar qty={stock.quantity} reorder={reorder} />
              </ErpCell>

              {/* Status Badge */}
              <ErpCell align="center">
                <Chip label={status.label} size="small"
                  sx={{ fontWeight: 700, fontSize: '0.65rem', bgcolor: status.bg, color: status.color, height: 20 }} />
              </ErpCell>

            </ErpRow>
          );
        })}
      </ErpTable>

      {!loading && (
        <ErpPagination count={processedData.length} page={pagn.page}
          onPageChange={pagn.setPage} rowsPerPage={pagn.ROWS_PER_PAGE} label="stock records" />
      )}

      {/* Add Stock Dialog */}
      <AddStockDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={fetchAll}
        items={items}
        warehouses={warehouses}
      />
    </Box>
  );
};

export default StockLevels;
