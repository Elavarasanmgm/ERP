import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateCurrentUser } from '../../store/slices/authSlice';
import apiClient from '../../services/apiClient';

// subpage key → tab index mapping
const MASTER_TABS = [
  { label: 'Categories',    key: 'categories' },
  { label: 'Subcategories', key: 'subcategories' },
  { label: 'Types',         key: 'types' },
  { label: 'UOM',           key: 'uom' },
  { label: 'Currencies',    key: 'currencies' },
  { label: 'HSN Codes',     key: 'hsncodes' },
  { label: 'Warehouses',    key: 'warehouses' },
  { label: 'Email Settings', key: 'emailsettings' },
  { label: 'User Access',   key: 'useraccess' },
];
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Tooltip,
  Autocomplete,
  FormControlLabel,
  Switch,
  Divider,
  Stack,
  FormGroup,
  List,
  ListItem,
  ListItemText,
  Collapse,
  InputAdornment,
  Card,
  CardHeader,
  CardContent,
  Avatar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOffOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SaveIcon from '@mui/icons-material/Save';
import EmailIcon from '@mui/icons-material/EmailOutlined';
import DnsIcon from '@mui/icons-material/DnsOutlined';
import LockIcon from '@mui/icons-material/LockOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import usePagination from '../../hooks/usePagination';
import ErpPagination from '../../components/Shared/ErpPagination';
import ErpTable, { ErpRow, ErpCell } from '../../components/Shared/ErpTable';
import { useAlert } from '../../hooks/useAlert';
import LoadingBackdrop from '../../components/Shared/LoadingBackdrop';

const TAB_COMPONENTS = {
  categories:    () => <CategoriesTab />,
  subcategories: () => <SubcategoriesTab />,
  types:         () => <TypesTab />,
  uom:           () => <UomTab />,
  currencies:    () => <CurrenciesTab />,
  hsncodes:      () => <HsnTab />,
  warehouses:    () => <WarehousesTab />,
  emailsettings: () => <EmailSettingsTab />,
  useraccess:    () => <UserAccessTab />,
};

const MasterSetup = () => {
  const user = useSelector(state => state.auth.user);
  const masterPerms = user?.permissions?.master;

  // Build visible tabs based on permissions
  const visibleTabs = MASTER_TABS.filter(t => {
    if (!masterPerms) return false;
    if (typeof masterPerms === 'object') return masterPerms[t.key] === true;
    return masterPerms === true; // legacy boolean — show all
  });

  const [tab, setTab] = useState(0);

  // Reset tab index if it's out of range after permission change
  const safeTab = tab < visibleTabs.length ? tab : 0;

  if (visibleTabs.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', color: '#64748b', mt: 6 }}>
        <Typography variant="body1">You don&apos;t have access to any Master Setup pages.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1 }}>
          <TuneOutlinedIcon sx={{ fontSize: 20, color: '#64748b' }} /> Master Setup
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: '#f1f5f9', mb: 3 }}>
        <Tabs
          value={safeTab}
          onChange={(_, v) => setTab(v)}
          aria-label="master setup tabs"
          TabIndicatorProps={{ style: { backgroundColor: '#2563eb', height: 3, borderRadius: '3px 3px 0 0' } }}
          sx={{ minHeight: 44 }}
        >
          {visibleTabs.map(t => (
            <Tab
              key={t.key}
              label={t.label}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                color: '#64748b',
                minHeight: 44,
                '&.Mui-selected': { color: '#2563eb' }
              }}
            />
          ))}
        </Tabs>
      </Box>

      <Box sx={{ mt: 2 }}>
        {TAB_COMPONENTS[visibleTabs[safeTab]?.key]?.()}
      </Box>
    </Box>
  );
};

// ─── Categories ──────────────────────────────────────────────
const CategoriesTab = () => {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const { success, error } = useAlert();

  const { page, setPage, search, pageRows, filtered, ROWS_PER_PAGE, handleSearchChange } = usePagination(
    rows,
    (item, q) => item.name.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q)
  );

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiClient.get('/master/categories');
      setRows(r.data);
    } catch {
      error('Failed to load categories');
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setForm({ name: row.name, description: row.description || '' });
    setOpen(true);
  };

  const handleToggle = async (row) => {
    const originalRows = [...rows];
    setRows(rows.map(r => r.id === row.id ? { ...r, is_active: !r.is_active } : r));
    
    try {
      await apiClient.put(`/master/categories/${row.id}`, { ...row, is_active: !row.is_active });
      success(`Category ${!row.is_active ? 'activated' : 'deactivated'}`);
    } catch {
      setRows(originalRows);
      error('Failed to update status');
    }
  };

  const handleDelete = (id) => {
    setDeleteItem(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await apiClient.delete(`/master/categories/${deleteItem}`);
      setDeleteDialogOpen(false);
      success('Category deleted successfully');
      load();
    } catch (err) {
      error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const save = async () => {
    try {
      if (editingId) {
        await apiClient.put(`/master/categories/${editingId}`, form);
        success('Category updated successfully');
      } else {
        await apiClient.post('/master/categories', form);
        success('Category created successfully');
      }
      setForm({ name: '', description: '' });
      setEditingId(null);
      setOpen(false);
      load();
    } catch (err) {
      error(err.response?.data?.error || 'Failed to save');
    }
  };

  return (
    <Box>
      <LoadingBackdrop open={loading} />
      <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Item Categories
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search..."
            value={search}
            onChange={handleSearchChange}
            InputProps={{ 
              startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1, fontSize: 18 }} />,
              sx: { borderRadius: '8px', fontSize: '0.8125rem', bgcolor: '#fff' }
            }}
            sx={{ width: 220 }}
          />
          <Button 
            variant="contained" 
            size="small"
            startIcon={<AddIcon />} 
            onClick={() => { setEditingId(null); setForm({ name: '', description: '' }); setOpen(true); }}
            sx={{ 
              bgcolor: '#1e40af', textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem',
              borderRadius: '7px', px: 1.5, py: 0.75, boxShadow: 'none',
              '&:hover': { bgcolor: '#1e3a8a', boxShadow: '0 4px 12px rgba(30,64,175,0.25)' }
            }}
          >
            Add Category
          </Button>
        </Box>
      </Box>

      <ErpTable 
        columns={[
          { label: 'Name' },
          { label: 'Description' },
          { label: 'Status' },
          { label: 'Actions', align: 'right' }
        ]} 
        empty={!loading && pageRows.length === 0}
      >
        {pageRows.map((r) => (
          <ErpRow key={r.id}>
            <ErpCell bold color="#1e293b">{r.name}</ErpCell>
            <ErpCell color="#475569">{r.description || '—'}</ErpCell>
            <ErpCell>
              <Chip 
                label={r.is_active ? 'Active' : 'Inactive'} 
                size="small" 
                sx={{ 
                  height: 20, fontSize: '0.675rem', fontWeight: 700,
                  bgcolor: r.is_active ? '#dcfce7' : '#fee2e2',
                  color: r.is_active ? '#166534' : '#dc2626'
                }} 
              />
            </ErpCell>
            <ErpCell align="right">
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                <Tooltip title={r.is_active ? 'Deactivate' : 'Activate'}>
                  <IconButton size="small" onClick={() => handleToggle(r)} sx={{ color: r.is_active ? '#059669' : '#94a3b8' }}>
                    {r.is_active ? <VisibilityIcon sx={{ fontSize: 18 }} /> : <VisibilityOffIcon sx={{ fontSize: 18 }} />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => handleEdit(r)} sx={{ color: '#2563eb' }}>
                    <EditIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" onClick={() => handleDelete(r.id)} sx={{ color: '#ef4444' }}>
                    <DeleteIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </ErpCell>
          </ErpRow>
        ))}
      </ErpTable>
      <ErpPagination count={filtered.length} page={page} onPageChange={setPage} rowsPerPage={ROWS_PER_PAGE} label="categories" />

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', position: 'relative' }}>
          {editingId ? 'Edit Category' : 'Add New Category'}
          <IconButton
            onClick={() => setOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#94a3b8' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField 
              fullWidth 
              label="Category Name" 
              required 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
            <TextField 
              fullWidth 
              label="Description" 
              multiline 
              rows={3} 
              value={form.description} 
              onChange={(e) => setForm({ ...form, description: e.target.value })} 
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none', fontWeight: 600, color: '#64748b' }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={save} 
            disabled={!form.name}
            sx={{ 
              bgcolor: '#1e40af', textTransform: 'none', fontWeight: 600, borderRadius: '7px',
              '&:hover': { bgcolor: '#1e3a8a' }
            }}
          >
            Save Category
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteConfirmDialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)} 
        onConfirm={confirmDelete} 
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
      />
    </Box>
  );
};

// ─── Subcategories ────────────────────────────────────────────
const SubcategoriesTab = () => {
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ category_id: '', name: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const { success, error } = useAlert();

  const { page, setPage, search, pageRows, filtered, ROWS_PER_PAGE, handleSearchChange } = usePagination(
    rows,
    (item, q) => item.name.toLowerCase().includes(q) || item.category_name.toLowerCase().includes(q)
  );

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        apiClient.get('/master/subcategories'), 
        apiClient.get('/master/categories?activeOnly=true')
      ]);
      setRows(s.data);
      setCategories(c.data);
    } catch {
      error('Failed to load subcategories');
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setForm({ category_id: row.category_id, name: row.name, description: row.description || '' });
    setOpen(true);
  };

  const handleToggle = async (row) => {
    const originalRows = [...rows];
    setRows(rows.map(r => r.id === row.id ? { ...r, is_active: !r.is_active } : r));

    try {
      await apiClient.put(`/master/subcategories/${row.id}`, { ...row, is_active: !row.is_active });
      success(`Subcategory ${!row.is_active ? 'activated' : 'deactivated'}`);
    } catch {
      setRows(originalRows);
      error('Failed to update status');
    }
  };

  const handleDelete = (id) => {
    setDeleteItem(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await apiClient.delete(`/master/subcategories/${deleteItem}`);
      setDeleteDialogOpen(false);
      success('Subcategory deleted successfully');
      load();
    } catch (err) {
      error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const save = async () => {
    try {
      if (editingId) {
        await apiClient.put(`/master/subcategories/${editingId}`, form);
        success('Subcategory updated successfully');
      } else {
        await apiClient.post('/master/subcategories', form);
        success('Subcategory created successfully');
      }
      setForm({ category_id: '', name: '', description: '' });
      setEditingId(null);
      setOpen(false);
      load();
    } catch (err) {
      error(err.response?.data?.error || 'Failed to save');
    }
  };

  return (
    <Box>
      <LoadingBackdrop open={loading} />
      <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Item Subcategories
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search..."
            value={search}
            onChange={handleSearchChange}
            InputProps={{ 
              startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1, fontSize: 18 }} />,
              sx: { borderRadius: '8px', fontSize: '0.8125rem', bgcolor: '#fff' }
            }}
            sx={{ width: 220 }}
          />
          <Button 
            variant="contained" 
            size="small"
            startIcon={<AddIcon />} 
            onClick={() => { setEditingId(null); setForm({ category_id: '', name: '', description: '' }); setOpen(true); }}
            sx={{ 
              bgcolor: '#1e40af', textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem',
              borderRadius: '7px', px: 1.5, py: 0.75, boxShadow: 'none',
              '&:hover': { bgcolor: '#1e3a8a', boxShadow: '0 4px 12px rgba(30,64,175,0.25)' }
            }}
          >
            Add Subcategory
          </Button>
        </Box>
      </Box>

      <ErpTable 
        columns={[
          { label: 'Category' },
          { label: 'Subcategory' },
          { label: 'Description' },
          { label: 'Status' },
          { label: 'Actions', align: 'right' }
        ]} 
        empty={!loading && pageRows.length === 0}
      >
        {pageRows.map((r) => (
          <ErpRow key={r.id}>
            <ErpCell><Chip label={r.category_name} size="small" variant="outlined" color="primary" sx={{ fontWeight: 600, fontSize: '0.7rem' }} /></ErpCell>
            <ErpCell bold color="#1e293b">{r.name}</ErpCell>
            <ErpCell color="#475569">{r.description || '—'}</ErpCell>
            <ErpCell>
              <Chip 
                label={r.is_active ? 'Active' : 'Inactive'} 
                size="small" 
                sx={{ 
                  height: 20, fontSize: '0.675rem', fontWeight: 700,
                  bgcolor: r.is_active ? '#dcfce7' : '#fee2e2',
                  color: r.is_active ? '#166534' : '#dc2626'
                }} 
              />
            </ErpCell>
            <ErpCell align="right">
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                <Tooltip title={r.is_active ? 'Deactivate' : 'Activate'}>
                  <IconButton size="small" onClick={() => handleToggle(r)} sx={{ color: r.is_active ? '#059669' : '#94a3b8' }}>
                    {r.is_active ? <VisibilityIcon sx={{ fontSize: 18 }} /> : <VisibilityOffIcon sx={{ fontSize: 18 }} />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => handleEdit(r)} sx={{ color: '#2563eb' }}>
                    <EditIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" onClick={() => handleDelete(r.id)} sx={{ color: '#ef4444' }}>
                    <DeleteIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </ErpCell>
          </ErpRow>
        ))}
      </ErpTable>
      <ErpPagination count={filtered.length} page={page} onPageChange={setPage} rowsPerPage={ROWS_PER_PAGE} label="subcategories" />

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', position: 'relative' }}>
          {editingId ? 'Edit Subcategory' : 'Add New Subcategory'}
          <IconButton
            onClick={() => setOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#94a3b8' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField 
              select 
              fullWidth 
              label="Select Category" 
              required 
              value={form.category_id} 
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            >
              {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
            <TextField 
              fullWidth 
              label="Subcategory Name" 
              required 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
            <TextField 
              fullWidth 
              label="Description" 
              multiline 
              rows={3} 
              value={form.description} 
              onChange={(e) => setForm({ ...form, description: e.target.value })} 
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none', fontWeight: 600, color: '#64748b' }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={save} 
            disabled={!form.name || !form.category_id}
            sx={{ 
              bgcolor: '#1e40af', textTransform: 'none', fontWeight: 600, borderRadius: '7px',
              '&:hover': { bgcolor: '#1e3a8a' }
            }}
          >
            Save Subcategory
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteConfirmDialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)} 
        onConfirm={confirmDelete} 
        title="Delete Subcategory"
        message="Are you sure you want to delete this subcategory? This action cannot be undone."
      />
    </Box>
  );
};

// ─── Types ────────────────────────────────────────────────────
const TypesTab = () => {
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [filteredSubs, setFilteredSubs] = useState([]);
  const [form, setForm] = useState({ category_id: '', subcategory_id: '', name: '', description: '', color_code: '' });
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const { success, error } = useAlert();

  const { page, setPage, search, pageRows, filtered, ROWS_PER_PAGE, handleSearchChange } = usePagination(
    rows,
    (item, q) => item.name.toLowerCase().includes(q) || item.subcategory_name.toLowerCase().includes(q) || (item.color_code || '').includes(q)
  );

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [t, c, s] = await Promise.all([
        apiClient.get('/master/types'), 
        apiClient.get('/master/categories?activeOnly=true'), 
        apiClient.get('/master/subcategories?activeOnly=true')
      ]);
      setRows(t.data);
      setCategories(c.data);
      setSubcategories(s.data);
    } catch {
      error('Failed to load types');
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setForm({ 
      category_id: row.category_id || '', 
      subcategory_id: row.subcategory_id, 
      name: row.name, 
      description: row.description || '',
      color_code: row.color_code || ''
    });
    setFilteredSubs(subcategories.filter(s => String(s.id) === String(row.subcategory_id))); 
    setOpen(true);
  };

  const handleToggle = async (row) => {
    const originalRows = [...rows];
    setRows(rows.map(r => r.id === row.id ? { ...r, is_active: !r.is_active } : r));

    try {
      await apiClient.put(`/master/types/${row.id}`, { ...row, is_active: !row.is_active });
      success(`Type ${!row.is_active ? 'activated' : 'deactivated'}`);
    } catch {
      setRows(originalRows);
      error('Failed to update status');
    }
  };

  const handleDelete = (id) => {
    setDeleteItem(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await apiClient.delete(`/master/types/${deleteItem}`);
      setDeleteDialogOpen(false);
      success('Type deleted successfully');
      load();
    } catch (err) {
      error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const onCategoryChange = (catId) => {
    setForm(f => ({ ...f, category_id: catId, subcategory_id: '' }));
    setFilteredSubs(subcategories.filter(s => String(s.category_id) === String(catId)));
  };

  const save = async () => {
    try {
      if (editingId) {
        await apiClient.put(`/master/types/${editingId}`, { subcategory_id: form.subcategory_id, name: form.name, description: form.description, color_code: form.color_code });
        success('Type updated successfully');
      } else {
        await apiClient.post('/master/types', { subcategory_id: form.subcategory_id, name: form.name, description: form.description, color_code: form.color_code });
        success('Type created successfully');
      }
      setForm({ category_id: '', subcategory_id: '', name: '', description: '', color_code: '' });
      setEditingId(null);
      setOpen(false);
      load();
    } catch (err) {
      error(err.response?.data?.error || 'Failed to save');
    }
  };

  return (
    <Box>
      <LoadingBackdrop open={loading} />
      <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Item Types
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search..."
            value={search}
            onChange={handleSearchChange}
            InputProps={{ 
              startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1, fontSize: 18 }} />,
              sx: { borderRadius: '8px', fontSize: '0.8125rem', bgcolor: '#fff' }
            }}
            sx={{ width: 220 }}
          />
          <Button 
            variant="contained" 
            size="small"
            startIcon={<AddIcon />} 
            onClick={() => { setEditingId(null); setForm({ category_id: '', subcategory_id: '', name: '', description: '', color_code: '' }); setOpen(true); }}
            sx={{ 
              bgcolor: '#1e40af', textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem',
              borderRadius: '7px', px: 1.5, py: 0.75, boxShadow: 'none',
              '&:hover': { bgcolor: '#1e3a8a', boxShadow: '0 4px 12px rgba(30,64,175,0.25)' }
            }}
          >
            Add Type
          </Button>
        </Box>
      </Box>

      <ErpTable 
        columns={[
          { label: 'Subcategory' },
          { label: 'Type Name' },
          { label: 'Color' },
          { label: 'Description' },
          { label: 'Status' },
          { label: 'Actions', align: 'right' }
        ]} 
        empty={!loading && pageRows.length === 0}
      >
        {pageRows.map((r) => (
          <ErpRow key={r.id}>
            <ErpCell><Chip label={r.subcategory_name} size="small" variant="outlined" color="primary" sx={{ fontWeight: 600, fontSize: '0.7rem' }} /></ErpCell>
            <ErpCell bold color="#1e293b">{r.name}</ErpCell>
            <ErpCell>
              {r.color_code ? (
                <Chip label={r.color_code} size="small" sx={{ height: 20, fontSize: '0.675rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#475569' }} />
              ) : '—'}
            </ErpCell>
            <ErpCell color="#475569">{r.description || '—'}</ErpCell>
            <ErpCell>
              <Chip 
                label={r.is_active ? 'Active' : 'Inactive'} 
                size="small" 
                sx={{ 
                  height: 20, fontSize: '0.675rem', fontWeight: 700,
                  bgcolor: r.is_active ? '#dcfce7' : '#fee2e2',
                  color: r.is_active ? '#166534' : '#dc2626'
                }} 
              />
            </ErpCell>
            <ErpCell align="right">
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                <Tooltip title={r.is_active ? 'Deactivate' : 'Activate'}>
                  <IconButton size="small" onClick={() => handleToggle(r)} sx={{ color: r.is_active ? '#059669' : '#94a3b8' }}>
                    {r.is_active ? <VisibilityIcon sx={{ fontSize: 18 }} /> : <VisibilityOffIcon sx={{ fontSize: 18 }} />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => handleEdit(r)} sx={{ color: '#2563eb' }}>
                    <EditIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" onClick={() => handleDelete(r.id)} sx={{ color: '#ef4444' }}>
                    <DeleteIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </ErpCell>
          </ErpRow>
        ))}
      </ErpTable>
      <ErpPagination count={filtered.length} page={page} onPageChange={setPage} rowsPerPage={ROWS_PER_PAGE} label="types" />

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', position: 'relative' }}>
          {editingId ? 'Edit Item Type' : 'Add New Item Type'}
          <IconButton
            onClick={() => setOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#94a3b8' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField 
              select 
              fullWidth 
              label="Select Category" 
              required 
              value={form.category_id} 
              onChange={(e) => onCategoryChange(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            >
              {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
            <TextField 
              select 
              fullWidth 
              label="Select Subcategory" 
              required 
              disabled={!form.category_id && !editingId} 
              value={form.subcategory_id} 
              onChange={(e) => setForm({ ...form, subcategory_id: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            >
              {filteredSubs.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </TextField>
            <TextField 
              fullWidth 
              label="Type Name" 
              required 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
            <TextField 
              select 
              fullWidth 
              label="Select Color Code" 
              value={form.color_code} 
              onChange={(e) => setForm({ ...form, color_code: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            >
              {['1001', '1002', '1003', '1004', '1005', '1006'].map((c) => (
                <MenuItem key={c} value={c}>Code — {c}</MenuItem>
              ))}
            </TextField>
            <TextField 
              fullWidth 
              label="Description" 
              multiline 
              rows={3} 
              value={form.description} 
              onChange={(e) => setForm({ ...form, description: e.target.value })} 
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none', fontWeight: 600, color: '#64748b' }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={save} 
            disabled={!form.name || !form.subcategory_id}
            sx={{ 
              bgcolor: '#1e40af', textTransform: 'none', fontWeight: 600, borderRadius: '7px',
              '&:hover': { bgcolor: '#1e3a8a' }
            }}
          >
            Save Item Type
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteConfirmDialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)} 
        onConfirm={confirmDelete} 
        title="Delete Type"
        message="Are you sure you want to delete this item type? This action cannot be undone."
      />
    </Box>
  );
};

// ─── Currencies ───────────────────────────────────────────────
const WORLD_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: '$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' }
];

const CurrenciesTab = () => {
  const [rows, setRows] = useState([]);
  const [baseCurrency, setBaseCurrency] = useState('INR');
  const [form, setForm] = useState({ code: '', name: '', symbol: '', exchange_rate: '1' });
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const { success, error } = useAlert();

  const { page, setPage, search, pageRows, filtered, ROWS_PER_PAGE, handleSearchChange } = usePagination(
    rows,
    (item, q) => item.code.toLowerCase().includes(q) || item.name.toLowerCase().includes(q)
  );

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    try {
      const [curr, settings] = await Promise.all([
        apiClient.get('/master/currencies'),
        apiClient.get('/settings/company')
      ]);
      setRows(curr.data);
      if (settings.data && settings.data.base_currency) {
        setBaseCurrency(settings.data.base_currency);
      }
    } catch {
      error('Failed to load currencies');
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setForm({ code: row.code, name: row.name, symbol: row.symbol || '', exchange_rate: row.exchange_rate });
    setOpen(true);
  };

  const handleToggle = async (row) => {
    if (row.code === baseCurrency && row.is_active) {
      error('Cannot deactivate the base currency');
      return;
    }
    const originalRows = [...rows];
    setRows(rows.map(r => r.id === row.id ? { ...r, is_active: !r.is_active } : r));

    try {
      await apiClient.put(`/master/currencies/${row.id}`, { ...row, is_active: !row.is_active });
      success(`Currency ${!row.is_active ? 'activated' : 'deactivated'}`);
    } catch {
      setRows(originalRows);
      error('Failed to update status');
    }
  };

  const handleDelete = (id) => {
    setDeleteItem(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await apiClient.delete(`/master/currencies/${deleteItem}`);
      setDeleteDialogOpen(false);
      success('Currency deleted successfully');
      load();
    } catch (err) {
      error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const save = async () => {
    try {
      if (editingId) {
        await apiClient.put(`/master/currencies/${editingId}`, form);
        success('Currency updated successfully');
      } else {
        await apiClient.post('/master/currencies', form);
        success('Currency created successfully');
      }
      setForm({ code: '', name: '', symbol: '', exchange_rate: '1' });
      setEditingId(null);
      setOpen(false);
      load();
    } catch (err) {
      error(err.response?.data?.error || 'Failed to save');
    }
  };

  return (
    <Box>
      <LoadingBackdrop open={loading} />
      <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Currencies
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search..."
            value={search}
            onChange={handleSearchChange}
            InputProps={{ 
              startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1, fontSize: 18 }} />,
              sx: { borderRadius: '8px', fontSize: '0.8125rem', bgcolor: '#fff' }
            }}
            sx={{ width: 220 }}
          />
          <Button 
            variant="contained" 
            size="small"
            startIcon={<AddIcon />} 
            onClick={() => { setEditingId(null); setForm({ code: '', name: '', symbol: '', exchange_rate: '1' }); setOpen(true); }}
            sx={{ 
              bgcolor: '#1e40af', textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem',
              borderRadius: '7px', px: 1.5, py: 0.75, boxShadow: 'none',
              '&:hover': { bgcolor: '#1e3a8a', boxShadow: '0 4px 12px rgba(30,64,175,0.25)' }
            }}
          >
            Add Currency
          </Button>
        </Box>
      </Box>

      <ErpTable 
        columns={[
          { label: 'Code' },
          { label: 'Name' },
          { label: 'Symbol' },
          { label: `Exchange Rate (vs ${baseCurrency})`, align: 'right' },
          { label: 'Status' },
          { label: 'Actions', align: 'right' }
        ]} 
        empty={!loading && pageRows.length === 0}
      >
        {pageRows.map((r) => (
          <ErpRow key={r.id}>
            <ErpCell bold color="#1e40af" sx={{ fontFamily: 'monospace' }}>
              {r.code}
              {r.code === baseCurrency && (
                <Chip label="BASE" size="small" sx={{ ml: 1, height: 16, fontSize: '0.6rem', fontWeight: 900, bgcolor: '#1e40af', color: '#fff' }} />
              )}
            </ErpCell>
            <ErpCell bold color="#1e293b">{r.name}</ErpCell>
            <ErpCell color="#475569">{r.symbol || '—'}</ErpCell>
            <ErpCell align="right" mono color="#1e293b">{parseFloat(r.exchange_rate).toFixed(4)}</ErpCell>
            <ErpCell>
              <Chip 
                label={r.is_active ? 'Active' : 'Inactive'} 
                size="small" 
                sx={{ 
                  height: 20, fontSize: '0.675rem', fontWeight: 700,
                  bgcolor: r.is_active ? '#dcfce7' : '#fee2e2',
                  color: r.is_active ? '#166534' : '#dc2626'
                }} 
              />
            </ErpCell>
            <ErpCell align="right">
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                <Tooltip title={r.is_active ? 'Deactivate' : 'Activate'}>
                  <IconButton size="small" onClick={() => handleToggle(r)} sx={{ color: r.is_active ? '#059669' : '#94a3b8' }}>
                    {r.is_active ? <VisibilityIcon sx={{ fontSize: 18 }} /> : <VisibilityOffIcon sx={{ fontSize: 18 }} />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => handleEdit(r)} sx={{ color: '#2563eb' }}>
                    <EditIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" onClick={() => handleDelete(r.id)} sx={{ color: '#ef4444' }}>
                    <DeleteIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </ErpCell>
          </ErpRow>
        ))}
      </ErpTable>
      <ErpPagination count={filtered.length} page={page} onPageChange={setPage} rowsPerPage={ROWS_PER_PAGE} label="currencies" />

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b', pb: 0.5, position: 'relative' }}>
          {editingId ? 'Edit Currency Details' : 'Add Global Currency'}
          <IconButton
            onClick={() => setOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#94a3b8' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #e2e8f0' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', mb: 1, display: 'block' }}>
              Step 1: Select Currency
            </Typography>
            {!editingId ? (
              <Autocomplete
                options={WORLD_CURRENCIES}
                getOptionLabel={(option) => `${option.code} — ${option.name}`}
                onChange={(event, newValue) => {
                  if (newValue) {
                    setForm({ ...form, code: newValue.code, name: newValue.name, symbol: newValue.symbol });
                  }
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Search World Currencies..." size="small" placeholder="e.g. USD, Euro, Yen" />
                )}
                sx={{ mb: 1 }}
              />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e40af' }}>{form.code}</Typography>
                <Typography variant="subtitle1" sx={{ color: '#64748b' }}>{form.name}</Typography>
              </Box>
            )}
            <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
              Selected: <strong>{form.name || 'None'}</strong> ({form.code}) with symbol <strong>{form.symbol}</strong>
            </Typography>
          </Box>

          <Box sx={{ p: 2, bgcolor: '#eff6ff', borderRadius: 2, border: '1px solid #dbeafe' }}>
            <Typography variant="caption" sx={{ color: '#1d4ed8', fontWeight: 700, textTransform: 'uppercase', mb: 1, display: 'block' }}>
              Step 2: Set Exchange Rate
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Paper variant="outlined" sx={{ px: 2, py: 1, fontWeight: 700, bgcolor: '#fff' }}>1 {form.code || 'Unit'}</Paper>
              <Typography variant="h6" sx={{ color: '#64748b' }}>=</Typography>
              <TextField 
                size="small"
                type="number" 
                placeholder="0.00"
                value={form.exchange_rate} 
                disabled={form.code === baseCurrency}
                onChange={(e) => setForm({ ...form, exchange_rate: e.target.value })} 
                inputProps={{ step: "0.0001", style: { fontWeight: 800, color: '#1e293b' } }}
                sx={{ width: 140, '& .MuiOutlinedInput-root': { bgcolor: '#fff' } }}
              />
              <Paper variant="outlined" sx={{ px: 2, py: 1, fontWeight: 700, bgcolor: '#fff' }}>{baseCurrency}</Paper>
            </Box>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
              {form.code === baseCurrency ? 
                'Base currency rate is always fixed at 1.0' : 
                `Value of 1 ${form.code || 'unit'} expressed in your home currency (${baseCurrency}).`
              }
            </Typography>
          </Box>

          {!editingId && (
            <Box sx={{ mt: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth label="Custom Name" value={form.name} size="small" onChange={(e) => setForm({...form, name: e.target.value})} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="Custom Symbol" value={form.symbol} size="small" onChange={(e) => setForm({...form, symbol: e.target.value})} />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none', fontWeight: 600, color: '#64748b' }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={save} 
            disabled={!form.name || !form.code || !form.exchange_rate}
            sx={{ 
              bgcolor: '#1e40af', textTransform: 'none', fontWeight: 700, px: 4, py: 1, borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(30,64,175,0.2)',
              '&:hover': { bgcolor: '#1e3a8a' }
            }}
          >
            {editingId ? 'Update Settings' : 'Add Currency to System'}
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteConfirmDialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)} 
        onConfirm={confirmDelete} 
        title="Delete Currency"
        message="Are you sure you want to delete this currency? This action cannot be undone."
      />
    </Box>
  );
};

// ─── HSN Codes ────────────────────────────────────────────────
const HsnTab = () => {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ hsn_code: '', description: '', cgst_rate: '9', sgst_rate: '9', igst_rate: '18' });
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const { success, error } = useAlert();

  const { page, setPage, pageRows, filtered, ROWS_PER_PAGE } = usePagination(
    rows,
    (item, q) => item.hsn_code.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q)
  );

  useEffect(() => { load(); }, [search]);
  const load = async () => {
    setLoading(true);
    try {
      const r = await apiClient.get(`/master/hsn?search=${search}`);
      setRows(r.data);
    } catch {
      error('Failed to load HSN codes');
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setForm({ 
      hsn_code: row.hsn_code, 
      description: row.description || '', 
      cgst_rate: row.cgst_rate, 
      sgst_rate: row.sgst_rate, 
      igst_rate: row.igst_rate 
    });
    setOpen(true);
  };

  const handleToggle = async (row) => {
    const originalRows = [...rows];
    setRows(rows.map(r => r.id === row.id ? { ...r, is_active: !r.is_active } : r));

    try {
      await apiClient.put(`/master/hsn/${row.id}`, { ...row, is_active: !row.is_active });
      success(`HSN code ${!row.is_active ? 'activated' : 'deactivated'}`);
    } catch {
      setRows(originalRows);
      error('Failed to update status');
    }
  };

  const handleDelete = (id) => {
    setDeleteItem(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await apiClient.delete(`/master/hsn/${deleteItem}`);
      setDeleteDialogOpen(false);
      success('HSN code deleted successfully');
      load();
    } catch (err) {
      error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const save = async () => {
    try {
      if (editingId) {
        await apiClient.put(`/master/hsn/${editingId}`, form);
        success('HSN code updated successfully');
      } else {
        await apiClient.post('/master/hsn', form);
        success('HSN code created successfully');
      }
      setEditingId(null);
      setOpen(false);
      load();
    } catch (err) {
      error(err.response?.data?.error || 'Failed to save');
    }
  };

  return (
    <Box>
      <LoadingBackdrop open={loading} />
      <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          HSN / SAC Codes
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search code or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ 
              startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1, fontSize: 18 }} />,
              sx: { borderRadius: '8px', fontSize: '0.8125rem', bgcolor: '#fff' }
            }}
            sx={{ width: 250 }}
          />
          <Button 
            variant="contained" 
            size="small"
            startIcon={<AddIcon />} 
            onClick={() => { setEditingId(null); setForm({ hsn_code: '', description: '', cgst_rate: '9', sgst_rate: '9', igst_rate: '18' }); setOpen(true); }}
            sx={{ 
              bgcolor: '#1e40af', textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem',
              borderRadius: '7px', px: 1.5, py: 0.75, boxShadow: 'none',
              '&:hover': { bgcolor: '#1e3a8a', boxShadow: '0 4px 12px rgba(30,64,175,0.25)' }
            }}
          >
            Add HSN
          </Button>
        </Box>
      </Box>

      <ErpTable 
        columns={[
          { label: 'HSN Code' },
          { label: 'Description' },
          { label: 'CGST%', align: 'right' },
          { label: 'SGST%', align: 'right' },
          { label: 'IGST%', align: 'right' },
          { label: 'Status' },
          { label: 'Actions', align: 'right' }
        ]} 
        empty={!loading && pageRows.length === 0}
      >
        {pageRows.map((r) => (
          <ErpRow key={r.id}>
            <ErpCell bold color="#1e40af" sx={{ fontFamily: 'monospace' }}>{r.hsn_code}</ErpCell>
            <ErpCell color="#1e293b">{r.description}</ErpCell>
            <ErpCell align="right" mono>{r.cgst_rate}%</ErpCell>
            <ErpCell align="right" mono>{r.sgst_rate}%</ErpCell>
            <ErpCell align="right" mono>{r.igst_rate}%</ErpCell>
            <ErpCell>
              <Chip 
                label={r.is_active ? 'Active' : 'Inactive'} 
                size="small" 
                sx={{ 
                  height: 20, fontSize: '0.675rem', fontWeight: 700,
                  bgcolor: r.is_active ? '#dcfce7' : '#fee2e2',
                  color: r.is_active ? '#166534' : '#dc2626'
                }} 
              />
            </ErpCell>
            <ErpCell align="right">
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                <Tooltip title={r.is_active ? 'Deactivate' : 'Activate'}>
                  <IconButton size="small" onClick={() => handleToggle(r)} sx={{ color: r.is_active ? '#059669' : '#94a3b8' }}>
                    {r.is_active ? <VisibilityIcon sx={{ fontSize: 18 }} /> : <VisibilityOffIcon sx={{ fontSize: 18 }} />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => handleEdit(r)} sx={{ color: '#2563eb' }}>
                    <EditIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" onClick={() => handleDelete(r.id)} sx={{ color: '#ef4444' }}>
                    <DeleteIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </ErpCell>
          </ErpRow>
        ))}
      </ErpTable>
      <ErpPagination count={filtered.length} page={page} onPageChange={setPage} rowsPerPage={ROWS_PER_PAGE} label="HSN codes" />

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', position: 'relative' }}>
          {editingId ? 'Edit HSN / SAC Code' : 'Add New HSN / SAC Code'}
          <IconButton
            onClick={() => setOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#94a3b8' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2.5} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="HSN Code" 
                required 
                value={form.hsn_code} 
                onChange={(e) => setForm({ ...form, hsn_code: e.target.value })} 
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Description" 
                multiline 
                rows={2} 
                value={form.description} 
                onChange={(e) => setForm({ ...form, description: e.target.value })} 
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField 
                fullWidth 
                type="number" 
                label="CGST %" 
                inputProps={{ step: "0.01" }} 
                value={form.cgst_rate} 
                onChange={(e) => setForm({ ...form, cgst_rate: e.target.value })} 
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField 
                fullWidth 
                type="number" 
                label="SGST %" 
                inputProps={{ step: "0.01" }} 
                value={form.sgst_rate} 
                onChange={(e) => setForm({ ...form, sgst_rate: e.target.value })} 
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField 
                fullWidth 
                type="number" 
                label="IGST %" 
                inputProps={{ step: "0.01" }} 
                value={form.igst_rate} 
                onChange={(e) => setForm({ ...form, igst_rate: e.target.value })} 
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none', fontWeight: 600, color: '#64748b' }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={save} 
            disabled={!form.hsn_code}
            sx={{ 
              bgcolor: '#1e40af', textTransform: 'none', fontWeight: 600, borderRadius: '7px',
              '&:hover': { bgcolor: '#1e3a8a' }
            }}
          >
            Save HSN Code
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteConfirmDialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)} 
        onConfirm={confirmDelete} 
        title="Delete HSN Code"
        message="Are you sure you want to delete this HSN code? This action cannot be undone."
      />
    </Box>
  );
};

// ─── Warehouses ──────────────────────────────────────────────
const WarehousesTab = () => {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: '', location: '' });
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const { success, error } = useAlert();

  const { page, setPage, search, pageRows, filtered, ROWS_PER_PAGE, handleSearchChange } = usePagination(
    rows,
    (item, q) => item.name.toLowerCase().includes(q) || (item.location || '').toLowerCase().includes(q)
  );

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiClient.get('/inventory/warehouses');
      setRows(r.data);
    } catch {
      error('Failed to load warehouses');
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setForm({ name: row.name, location: row.location || '' });
    setOpen(true);
  };

  const handleToggle = async (row) => {
    const originalRows = [...rows];
    setRows(rows.map(r => r.id === row.id ? { ...r, isactive: !r.isactive } : r));
    
    try {
      await apiClient.put(`/inventory/warehouses/${row.id}`, { ...row, isactive: !row.isactive });
      success(`Warehouse ${!row.isactive ? 'activated' : 'deactivated'}`);
    } catch {
      setRows(originalRows);
      error('Failed to update status');
    }
  };

  const handleDelete = (id) => {
    setDeleteItem(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await apiClient.delete(`/inventory/warehouses/${deleteItem}`);
      setDeleteDialogOpen(false);
      success('Warehouse deleted successfully');
      load();
    } catch (err) {
      error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const save = async () => {
    try {
      if (editingId) {
        await apiClient.put(`/inventory/warehouses/${editingId}`, form);
        success('Warehouse updated successfully');
      } else {
        await apiClient.post('/inventory/warehouses', form);
        success('Warehouse created successfully');
      }
      setForm({ name: '', location: '' });
      setEditingId(null);
      setOpen(false);
      load();
    } catch (err) {
      error(err.response?.data?.error || 'Failed to save');
    }
  };

  return (
    <Box>
      <LoadingBackdrop open={loading} />
      <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Warehouses / Locations
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search..."
            value={search}
            onChange={handleSearchChange}
            InputProps={{ 
              startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1, fontSize: 18 }} />,
              sx: { borderRadius: '8px', fontSize: '0.8125rem', bgcolor: '#fff' }
            }}
            sx={{ width: 220 }}
          />
          <Button 
            variant="contained" 
            size="small"
            startIcon={<AddIcon />} 
            onClick={() => { setEditingId(null); setForm({ name: '', location: '' }); setOpen(true); }}
            sx={{ 
              bgcolor: '#1e40af', textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem',
              borderRadius: '7px', px: 1.5, py: 0.75, boxShadow: 'none',
              '&:hover': { bgcolor: '#1e3a8a', boxShadow: '0 4px 12px rgba(30,64,175,0.25)' }
            }}
          >
            Add Warehouse
          </Button>
        </Box>
      </Box>

      <ErpTable 
        columns={[
          { label: 'Warehouse Name' },
          { label: 'Location' },
          { label: 'Status' },
          { label: 'Actions', align: 'right' }
        ]} 
        empty={!loading && pageRows.length === 0}
      >
        {pageRows.map((r) => (
          <ErpRow key={r.id}>
            <ErpCell bold color="#1e293b">{r.name}</ErpCell>
            <ErpCell color="#475569">{r.location || '—'}</ErpCell>
            <ErpCell>
              <Chip 
                label={r.isactive ? 'Active' : 'Inactive'} 
                size="small" 
                sx={{ 
                  height: 20, fontSize: '0.675rem', fontWeight: 700,
                  bgcolor: r.isactive ? '#dcfce7' : '#fee2e2',
                  color: r.isactive ? '#166534' : '#dc2626'
                }} 
              />
            </ErpCell>
            <ErpCell align="right">
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                <Tooltip title={r.isactive ? 'Deactivate' : 'Activate'}>
                  <IconButton size="small" onClick={() => handleToggle(r)} sx={{ color: r.isactive ? '#059669' : '#94a3b8' }}>
                    {r.isactive ? <VisibilityIcon sx={{ fontSize: 18 }} /> : <VisibilityOffIcon sx={{ fontSize: 18 }} />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => handleEdit(r)} sx={{ color: '#2563eb' }}>
                    <EditIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" onClick={() => handleDelete(r.id)} sx={{ color: '#ef4444' }}>
                    <DeleteIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </ErpCell>
          </ErpRow>
        ))}
      </ErpTable>
      <ErpPagination count={filtered.length} page={page} onPageChange={setPage} rowsPerPage={ROWS_PER_PAGE} label="warehouses" />

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', position: 'relative' }}>
          {editingId ? 'Edit Warehouse' : 'Add New Warehouse'}
          <IconButton
            onClick={() => setOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#94a3b8' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField 
              fullWidth 
              label="Warehouse Name" 
              required 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
            <TextField 
              fullWidth 
              label="Location / Address" 
              multiline 
              rows={3} 
              value={form.location} 
              onChange={(e) => setForm({ ...form, location: e.target.value })} 
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none', fontWeight: 600, color: '#64748b' }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={save} 
            disabled={!form.name}
            sx={{ 
              bgcolor: '#1e40af', textTransform: 'none', fontWeight: 600, borderRadius: '7px',
              '&:hover': { bgcolor: '#1e3a8a' }
            }}
          >
            Save Warehouse
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteConfirmDialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)} 
        onConfirm={confirmDelete} 
        title="Delete Warehouse"
        message="Are you sure you want to delete this warehouse? This action cannot be undone."
      />
    </Box>
  );
};

// ─── Email Settings ───────────────────────────────────────────
const EmailSettingsTab = () => {
  const [form, setForm] = useState({
    smtp_host: '', smtp_port: '587', smtp_user: '', smtp_password: '',
    from_email: '', from_name: '', is_active: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const { success, error, info } = useAlert();

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiClient.get('/settings/email');
      if (r.data && r.data.id) {
        setForm({
          smtp_host: r.data.smtp_host || '',
          smtp_port: r.data.smtp_port || '587',
          smtp_user: r.data.smtp_user || '',
          smtp_password: r.data.smtp_password || '',
          from_email: r.data.from_email || '',
          from_name: r.data.from_name || '',
          is_active: r.data.is_active !== false
        });
      }
    } catch {
      error('Failed to load email settings');
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/settings/email', form);
      success('Email settings saved successfully');
    } catch (err) {
      error(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!form.smtp_host || !form.smtp_user || !form.smtp_password) {
      error('Please provide SMTP Host, User, and Password to test.');
      return;
    }
    setTesting(true);
    info('Testing SMTP connection...');
    try {
      const res = await apiClient.post('/settings/email/test-connection', form);
      success(res.data.message);
    } catch (err) {
      error(err.response?.data?.error || 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Box>
      <LoadingBackdrop open={loading} />

      {/* Header — matches other tabs */}
      <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Email / SMTP Configuration
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined" size="small"
            startIcon={testing ? <CircularProgress size={14} /> : <TuneOutlinedIcon />}
            disabled={testing || saving}
            onClick={handleTestConnection}
            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', borderRadius: '7px', px: 1.5, py: 0.75 }}
          >
            {testing ? 'Testing…' : 'Test Connection'}
          </Button>
          <Button
            variant="contained" size="small"
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />}
            disabled={saving || testing}
            onClick={handleSave}
            sx={{ bgcolor: '#1e40af', textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem',
              borderRadius: '7px', px: 1.5, py: 0.75, boxShadow: 'none',
              '&:hover': { bgcolor: '#1e3a8a', boxShadow: '0 4px 12px rgba(30,64,175,0.25)' } }}
          >
            {saving ? 'Saving…' : 'Save Settings'}
          </Button>
        </Box>
      </Box>

      {/* Form fields in a clean card — same border style as ErpTable */}
      <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden', bgcolor: '#fff' }}>
        {/* Section: SMTP Server */}
        <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            SMTP Server
          </Typography>
        </Box>
        <Box sx={{ p: 2.5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField fullWidth size="small" label="SMTP Host" placeholder="smtp.gmail.com"
                value={form.smtp_host} onChange={(e) => setForm({ ...form, smtp_host: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Port" placeholder="587"
                value={form.smtp_port} onChange={(e) => setForm({ ...form, smtp_port: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="SMTP Username" placeholder="user@example.com"
                value={form.smtp_user} onChange={(e) => setForm({ ...form, smtp_user: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="SMTP Password" type="password"
                value={form.smtp_password} onChange={(e) => setForm({ ...form, smtp_password: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
            </Grid>
          </Grid>
        </Box>

        {/* Section: Sender */}
        <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Sender Profile
          </Typography>
        </Box>
        <Box sx={{ p: 2.5 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={5}>
              <TextField fullWidth size="small" label="From Name" placeholder="DIMA ERP System"
                value={form.from_name} onChange={(e) => setForm({ ...form, from_name: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField fullWidth size="small" label="From Email" placeholder="no-reply@company.com"
                value={form.from_email} onChange={(e) => setForm({ ...form, from_email: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControlLabel
                control={<Switch size="small" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} color="primary" />}
                label={<Typography variant="caption" sx={{ fontWeight: 600, color: '#475569' }}>Active</Typography>}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Security note */}
        <Box sx={{ px: 2.5, py: 1.25, bgcolor: '#fffbeb', borderTop: '1px solid #fde68a', display: 'flex', gap: 1, alignItems: 'center' }}>
          <WarningAmberIcon sx={{ fontSize: 16, color: '#d97706', flexShrink: 0 }} />
          <Typography variant="caption" sx={{ color: '#92400e' }}>
            For Gmail or Outlook, use an <b>App Password</b> instead of your account password.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

// ─── Shared Components ────────────────────────────────────────
const DeleteConfirmDialog = ({ open, onClose, onConfirm, title, message }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle sx={{ fontWeight: 800, position: 'relative' }}>
      {title}
      <IconButton
        onClick={onClose}
        sx={{ position: 'absolute', right: 8, top: 8, color: '#94a3b8' }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </DialogTitle>
    <DialogContent>
      <Typography>{message}</Typography>
    </DialogContent>
    <DialogActions sx={{ p: 2, pt: 0 }}>
      <Button onClick={onClose} color="inherit">Cancel</Button>
      <Button onClick={onConfirm} variant="contained" color="error">Delete</Button>
    </DialogActions>
  </Dialog>
);

// ─── User Access ──────────────────────────────────────────────
const DEFAULT_PERMISSIONS = {
  dashboard: true,
  accounting: { entries: false, accounts: false, invoices: false, payments: false, customers: false, suppliers: false, reports: false },
  inventory: { items: false, stock: false, locations: false, movements: false },
  orders: { sales: false, purchase: false, requests: false, quotes: false, receipts: false, trace: false },
  manufacturing: { workorders: false, bom: false, planning: false, kanban: false, quality: false },
  hr: { employees: false, attendance: false, leaves: false, payroll: false },
  crm: { leads: false, opportunities: false, contacts: false, activities: false },
  assets: { list: false, depreciation: false, maintenance: false, reports: false },
  quality: { inspections: false, nonconformance: false, corrective: false, metrics: false },
  planning: { production: false, mrp: false, orders: false, capacity: false, forecasts: false },
  projects: { list: false, timesheets: false },
  supplychain: { vendors: false, requisitions: false, receipts: false, performance: false },
  master: { categories: false, subcategories: false, types: false, uom: false, currencies: false, hsncodes: false, warehouses: false, emailsettings: false, useraccess: false }
};

const PermissionItem = ({ label, value, onChange, children, level = 0 }) => {
  const [expanded, setExpanded] = useState(false);
  const isParent = children && (Array.isArray(children) ? children.length > 0 : Object.keys(children || {}).length > 0);

  return (
    <Box sx={{ ml: level * 2 }}>
      <ListItem 
        dense 
        sx={{ 
          borderRadius: 1, 
          mb: 0.5,
          '&:hover': { bgcolor: '#f1f5f9' }
        }}
      >
        <FormControlLabel
          control={
            <Switch 
              size="small" 
              checked={!!value} 
              onChange={(e) => onChange(e.target.checked)} 
            />
          }
          label={
            <Typography variant="body2" sx={{ fontWeight: level === 0 ? 700 : 500, color: '#1e293b' }}>
              {label}
            </Typography>
          }
          sx={{ flexGrow: 1, mr: 0 }}
        />
        {isParent && (
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </IconButton>
        )}
      </ListItem>
      {isParent && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ borderLeft: '1px solid #e2e8f0', ml: 2.5, pl: 1 }}>
            {children}
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

const EMPTY_NEW_USER = {
  firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
  role: 'User', permissions: DEFAULT_PERMISSIONS
};

const UserAccessTab = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ role: '', isactive: true, permissions: DEFAULT_PERMISSIONS });
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_NEW_USER);
  const [createSaving, setCreateSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { success, error } = useAlert();
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.auth.user);

  const { page, setPage, search, pageRows, filtered, ROWS_PER_PAGE, handleSearchChange } = usePagination(
    rows,
    (user, q) => 
      user.email.toLowerCase().includes(q) || 
      `${user.firstname} ${user.lastname}`.toLowerCase().includes(q) ||
      user.role.toLowerCase().includes(q)
  );

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiClient.get('/auth/users');
      setRows(r.data);
    } catch {
      error('Failed to load users');
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const mergePermissions = (stored) => {
    if (!stored) return DEFAULT_PERMISSIONS;
    const merged = { ...DEFAULT_PERMISSIONS };
    for (const key of Object.keys(DEFAULT_PERMISSIONS)) {
      if (typeof DEFAULT_PERMISSIONS[key] === 'object' && DEFAULT_PERMISSIONS[key] !== null) {
        merged[key] = { ...DEFAULT_PERMISSIONS[key], ...(typeof stored[key] === 'object' && stored[key] !== null ? stored[key] : {}) };
      } else if (key in stored) {
        merged[key] = stored[key];
      }
    }
    return merged;
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setForm({
      role: user.role,
      isactive: user.isactive,
      permissions: mergePermissions(user.permissions)
    });
    setOpen(true);
  };

  const handleToggle = async (user) => {
    const originalRows = [...rows];
    const newStatus = !user.isactive;
    setRows(rows.map(r => r.userid === user.userid ? { ...r, isactive: newStatus } : r));

    try {
      await apiClient.put(`/auth/users/${user.userid}`, { 
        role: user.role, 
        isactive: newStatus,
        permissions: mergePermissions(user.permissions)
      });
      success(`User ${newStatus ? 'activated' : 'deactivated'}`);
    } catch {
      setRows(originalRows);
      error('Failed to update status');
    }
  };

  const handlePermissionChange = (module, subpage, val) => {
    setForm(prev => {
      const newPerms = { ...prev.permissions };
      if (subpage) {
        newPerms[module] = { ...newPerms[module], [subpage]: val };
        // If enabling subpage, enable parent
        if (val) newPerms[module].enabled = true; 
      } else {
        if (typeof newPerms[module] === 'object') {
          // It's a module with subpages
          const subKeys = Object.keys(newPerms[module]);
          subKeys.forEach(k => newPerms[module][k] = val);
        } else {
          newPerms[module] = val;
        }
      }
      return { ...prev, permissions: newPerms };
    });
  };

  const save = async () => {
    try {
      await apiClient.put(`/auth/users/${editingUser.userid}`, form);
      success('User access updated successfully');
      setOpen(false);
      load();
      // If editing own account, update Redux + localStorage immediately
      if (currentUser && currentUser.userId === editingUser.userid) {
        dispatch(updateCurrentUser({ role: form.role, permissions: form.permissions }));
      }
    } catch (err) {
      error(err.response?.data?.error || 'Failed to update user');
    }
  };

  const handleCreate = async () => {
    const { firstName, lastName, email, password, confirmPassword, role, permissions } = createForm;
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      error('All fields are required'); return;
    }
    if (password !== confirmPassword) {
      error('Passwords do not match'); return;
    }
    if (password.length < 6) {
      error('Password must be at least 6 characters'); return;
    }
    setCreateSaving(true);
    try {
      // Register user
      const reg = await apiClient.post('/auth/register', { email, password, firstName, lastName });
      const newUserId = reg.data.userId;
      // Set role and permissions
      await apiClient.put(`/auth/users/${newUserId}`, { role, isactive: true, permissions: mergePermissions(permissions) });
      success('User created successfully');
      setCreateOpen(false);
      setCreateForm(EMPTY_NEW_USER);
      setShowPassword(false);
      load();
    } catch (err) {
      error(err.response?.data?.error || 'Failed to create user');
    } finally {
      setCreateSaving(false);
    }
  };

  const handleCreatePermissionChange = (module, subpage, val) => {
    setCreateForm(prev => {
      const newPerms = { ...prev.permissions };
      if (subpage) {
        newPerms[module] = { ...newPerms[module], [subpage]: val };
      } else {
        if (typeof DEFAULT_PERMISSIONS[module] === 'object') {
          const allTrue = Object.keys(DEFAULT_PERMISSIONS[module]).reduce((acc, k) => ({ ...acc, [k]: val }), {});
          newPerms[module] = allTrue;
        } else {
          newPerms[module] = val;
        }
      }
      return { ...prev, permissions: newPerms };
    });
  };

  return (
    <Box>
      <LoadingBackdrop open={loading} />
      <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          User Role & Access Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search users..."
            value={search}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1, fontSize: 18 }} />,
              sx: { borderRadius: '8px', fontSize: '0.8125rem', bgcolor: '#fff' }
            }}
            sx={{ width: 250 }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { setCreateForm(EMPTY_NEW_USER); setShowPassword(false); setCreateOpen(true); }}
            sx={{ bgcolor: '#1e40af', textTransform: 'none', fontWeight: 700, borderRadius: '8px', px: 2.5, '&:hover': { bgcolor: '#1e3a8a' } }}
          >
            Add User
          </Button>
        </Box>
      </Box>

      <ErpTable 
        columns={[
          { label: 'User Details' },
          { label: 'Role' },
          { label: 'Joined' },
          { label: 'Status' },
          { label: 'Actions', align: 'right' }
        ]} 
        loading={loading}
        empty={!loading && pageRows.length === 0}
      >
        {pageRows.map((u) => (
          <ErpRow key={u.userid}>
            <ErpCell>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {u.firstname} {u.lastname}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>{u.email}</Typography>
              </Box>
            </ErpCell>
            <ErpCell>
              <Chip 
                label={u.role} 
                size="small" 
                icon={u.role === 'Admin' ? <AdminPanelSettingsIcon sx={{ fontSize: '0.8rem !important' }} /> : undefined}
                sx={{ 
                  height: 22, fontSize: '0.7rem', fontWeight: 800,
                  bgcolor: u.role === 'Admin' ? '#eff6ff' : '#f8fafc',
                  color: u.role === 'Admin' ? '#1e40af' : '#475569',
                  border: `1px solid ${u.role === 'Admin' ? '#dbeafe' : '#e2e8f0'}`
                }} 
              />
            </ErpCell>
            <ErpCell color="#64748b" sx={{ fontSize: '0.75rem' }}>{new Date(u.created_date || u.created_at).toLocaleDateString()}</ErpCell>
            <ErpCell>
              <Chip 
                label={u.isactive ? 'Active' : 'Inactive'} 
                size="small" 
                sx={{ 
                  height: 20, fontSize: '0.675rem', fontWeight: 700,
                  bgcolor: u.isactive ? '#dcfce7' : '#fee2e2',
                  color: u.isactive ? '#166534' : '#dc2626'
                }} 
              />
            </ErpCell>
            <ErpCell align="right">
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                <Tooltip title={u.isactive ? 'Deactivate' : 'Activate'}>
                  <IconButton size="small" onClick={() => handleToggle(u)} sx={{ color: u.isactive ? '#059669' : '#94a3b8' }}>
                    {u.isactive ? <VisibilityIcon sx={{ fontSize: 18 }} /> : <VisibilityOffIcon sx={{ fontSize: 18 }} />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Manage Permissions">
                  <IconButton size="small" onClick={() => handleEdit(u)} sx={{ color: '#2563eb' }}>
                    <EditIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </ErpCell>
          </ErpRow>
        ))}
      </ErpTable>
      <ErpPagination count={filtered.length} page={page} onPageChange={setPage} rowsPerPage={ROWS_PER_PAGE} label="users" />

      {/* Permission Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b', borderBottom: '1px solid #f1f5f9', pb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AdminPanelSettingsIcon sx={{ color: '#2563eb' }} />
          Edit Permissions: {editingUser?.firstname} {editingUser?.lastname}
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Grid container sx={{ minHeight: 400 }}>
            {/* Left side: Role & Status */}
            <Grid item xs={12} md={4} sx={{ p: 3, borderRight: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2, display: 'block' }}>
                Account Settings
              </Typography>
              <Stack spacing={3}>
                <TextField
                  select
                  fullWidth
                  label="System Role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fff', borderRadius: 2 } }}
                >
                  <MenuItem value="Admin">Administrator</MenuItem>
                  <MenuItem value="User">Standard User</MenuItem>
                  <MenuItem value="Manager">Manager</MenuItem>
                  <MenuItem value="Viewer">Read-only Viewer</MenuItem>
                </TextField>

                <FormControlLabel
                  control={<Switch checked={form.isactive} onChange={(e) => setForm({ ...form, isactive: e.target.checked })} />}
                  label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Account Active</Typography>}
                />

                <Box sx={{ p: 2, bgcolor: '#eff6ff', borderRadius: 2, border: '1px solid #dbeafe' }}>
                  <Typography variant="caption" sx={{ color: '#1d4ed8', fontWeight: 700, display: 'block', mb: 0.5 }}>
                    Role Access Note:
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#1e40af', lineHeight: 1.4, display: 'block' }}>
                    Administrators bypass standard permission checks and have full system access.
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            {/* Right side: Permissions Tree */}
            <Grid item xs={12} md={8} sx={{ p: 0 }}>
              <Box sx={{ p: 3, maxHeight: 500, overflowY: 'auto' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2, display: 'block' }}>
                  Module-Level Permissions
                </Typography>
                <List sx={{ width: '100%' }}>
                  <PermissionItem label="Dashboard Access" value={form.permissions.dashboard} onChange={(v) => handlePermissionChange('dashboard', null, v)} />
                  
                  <PermissionItem label="Accounting" value={Object.values(form.permissions.accounting || {}).some(v => v)} onChange={(v) => handlePermissionChange('accounting', null, v)}>
                    <PermissionItem label="Journal Entries" value={form.permissions.accounting?.entries} onChange={(v) => handlePermissionChange('accounting', 'entries', v)} level={1} />
                    <PermissionItem label="Chart of Accounts" value={form.permissions.accounting?.accounts} onChange={(v) => handlePermissionChange('accounting', 'accounts', v)} level={1} />
                    <PermissionItem label="Invoices" value={form.permissions.accounting?.invoices} onChange={(v) => handlePermissionChange('accounting', 'invoices', v)} level={1} />
                    <PermissionItem label="Payments" value={form.permissions.accounting?.payments} onChange={(v) => handlePermissionChange('accounting', 'payments', v)} level={1} />
                    <PermissionItem label="Customers" value={form.permissions.accounting?.customers} onChange={(v) => handlePermissionChange('accounting', 'customers', v)} level={1} />
                    <PermissionItem label="Suppliers" value={form.permissions.accounting?.suppliers} onChange={(v) => handlePermissionChange('accounting', 'suppliers', v)} level={1} />
                    <PermissionItem label="Financial Reports" value={form.permissions.accounting?.reports} onChange={(v) => handlePermissionChange('accounting', 'reports', v)} level={1} />
                  </PermissionItem>

                  <PermissionItem label="Inventory" value={Object.values(form.permissions.inventory || {}).some(v => v)} onChange={(v) => handlePermissionChange('inventory', null, v)}>
                    <PermissionItem label="Item Master" value={form.permissions.inventory?.items} onChange={(v) => handlePermissionChange('inventory', 'items', v)} level={1} />
                    <PermissionItem label="Stock Levels" value={form.permissions.inventory?.stock} onChange={(v) => handlePermissionChange('inventory', 'stock', v)} level={1} />
                    <PermissionItem label="Locations" value={form.permissions.inventory?.locations} onChange={(v) => handlePermissionChange('inventory', 'locations', v)} level={1} />
                    <PermissionItem label="Stock Movements" value={form.permissions.inventory?.movements} onChange={(v) => handlePermissionChange('inventory', 'movements', v)} level={1} />
                  </PermissionItem>

                  <PermissionItem label="Orders" value={Object.values(form.permissions.orders || {}).some(v => v)} onChange={(v) => handlePermissionChange('orders', null, v)}>
                    <PermissionItem label="Sales Orders" value={form.permissions.orders?.sales} onChange={(v) => handlePermissionChange('orders', 'sales', v)} level={1} />
                    <PermissionItem label="Purchase Orders" value={form.permissions.orders?.purchase} onChange={(v) => handlePermissionChange('orders', 'purchase', v)} level={1} />
                    <PermissionItem label="Material Requests" value={form.permissions.orders?.requests} onChange={(v) => handlePermissionChange('orders', 'requests', v)} level={1} />
                    <PermissionItem label="Quotations" value={form.permissions.orders?.quotes} onChange={(v) => handlePermissionChange('orders', 'quotes', v)} level={1} />
                    <PermissionItem label="Goods Receipts" value={form.permissions.orders?.receipts} onChange={(v) => handlePermissionChange('orders', 'receipts', v)} level={1} />
                  </PermissionItem>

                  <PermissionItem label="Manufacturing" value={Object.values(form.permissions.manufacturing || {}).some(v => v)} onChange={(v) => handlePermissionChange('manufacturing', null, v)}>
                    <PermissionItem label="Work Orders" value={form.permissions.manufacturing?.workorders} onChange={(v) => handlePermissionChange('manufacturing', 'workorders', v)} level={1} />
                    <PermissionItem label="BOM Setup" value={form.permissions.manufacturing?.bom} onChange={(v) => handlePermissionChange('manufacturing', 'bom', v)} level={1} />
                    <PermissionItem label="Production Planning" value={form.permissions.manufacturing?.planning} onChange={(v) => handlePermissionChange('manufacturing', 'planning', v)} level={1} />
                    <PermissionItem label="Quality Checks" value={form.permissions.manufacturing?.quality} onChange={(v) => handlePermissionChange('manufacturing', 'quality', v)} level={1} />
                  </PermissionItem>

                  <PermissionItem
                    label="Master Setup"
                    value={Object.values(form.permissions.master || {}).some(v => v)}
                    onChange={(v) => handlePermissionChange('master', null, v)}
                  >
                    <PermissionItem label="Categories" value={form.permissions.master?.categories} onChange={(v) => handlePermissionChange('master', 'categories', v)} level={1} />
                    <PermissionItem label="Subcategories" value={form.permissions.master?.subcategories} onChange={(v) => handlePermissionChange('master', 'subcategories', v)} level={1} />
                    <PermissionItem label="Types" value={form.permissions.master?.types} onChange={(v) => handlePermissionChange('master', 'types', v)} level={1} />
                    <PermissionItem label="UOM" value={form.permissions.master?.uom} onChange={(v) => handlePermissionChange('master', 'uom', v)} level={1} />
                    <PermissionItem label="Currencies" value={form.permissions.master?.currencies} onChange={(v) => handlePermissionChange('master', 'currencies', v)} level={1} />
                    <PermissionItem label="HSN Codes" value={form.permissions.master?.hsncodes} onChange={(v) => handlePermissionChange('master', 'hsncodes', v)} level={1} />
                    <PermissionItem label="Warehouses" value={form.permissions.master?.warehouses} onChange={(v) => handlePermissionChange('master', 'warehouses', v)} level={1} />
                    <PermissionItem label="Email Settings" value={form.permissions.master?.emailsettings} onChange={(v) => handlePermissionChange('master', 'emailsettings', v)} level={1} />
                    <PermissionItem label="User Access" value={form.permissions.master?.useraccess} onChange={(v) => handlePermissionChange('master', 'useraccess', v)} level={1} />
                  </PermissionItem>
                </List>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none', fontWeight: 600, color: '#64748b', px: 3 }}>Cancel</Button>
          <Button variant="contained" onClick={save} sx={{ bgcolor: '#1e40af', textTransform: 'none', fontWeight: 700, px: 4, py: 1, borderRadius: '8px', '&:hover': { bgcolor: '#1e3a8a' } }}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onClose={() => !createSaving && setCreateOpen(false)} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b', borderBottom: '1px solid #f1f5f9', pb: 2 }}>
          Create New System User
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Grid container>
            {/* Left side: Basic Info */}
            <Grid item xs={12} md={5} sx={{ p: 4, borderRight: '1px solid #f1f5f9' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 3, display: 'block' }}>
                Account Information
              </Typography>
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={2}>
                  <TextField fullWidth label="First Name" value={createForm.firstName} onChange={(e) => setCreateForm({...createForm, firstName: e.target.value})} />
                  <TextField fullWidth label="Last Name" value={createForm.lastName} onChange={(e) => setCreateForm({...createForm, lastName: e.target.value})} />
                </Stack>
                <TextField fullWidth label="Email Address" type="email" value={createForm.email} onChange={(e) => setCreateForm({...createForm, email: e.target.value})} />
                
                <TextField 
                  fullWidth 
                  label="Password" 
                  type={showPassword ? 'text' : 'password'} 
                  value={createForm.password} 
                  onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                <TextField fullWidth label="Confirm Password" type="password" value={createForm.confirmPassword} onChange={(e) => setCreateForm({...createForm, confirmPassword: e.target.value})} />
                
                <TextField select fullWidth label="System Role" value={createForm.role} onChange={(e) => setCreateForm({...createForm, role: e.target.value})}>
                  <MenuItem value="Admin">Administrator</MenuItem>
                  <MenuItem value="User">Standard User</MenuItem>
                  <MenuItem value="Manager">Manager</MenuItem>
                  <MenuItem value="Viewer">Read-only Viewer</MenuItem>
                </TextField>
              </Stack>
            </Grid>

            {/* Right side: Permissions */}
            <Grid item xs={12} md={7}>
              <Box sx={{ p: 4, maxHeight: 500, overflowY: 'auto', bgcolor: '#fbfcfd' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2, display: 'block' }}>
                  Initial Access Permissions
                </Typography>
                <List>
                  <PermissionItem label="Dashboard Access" value={createForm.permissions.dashboard} onChange={(v) => handleCreatePermissionChange('dashboard', null, v)} />
                  <PermissionItem label="Accounting" value={Object.values(createForm.permissions.accounting || {}).some(v => v)} onChange={(v) => handleCreatePermissionChange('accounting', null, v)}>
                    <PermissionItem label="Journal Entries" value={createForm.permissions.accounting?.entries} onChange={(v) => handleCreatePermissionChange('accounting', 'entries', v)} level={1} />
                    <PermissionItem label="Chart of Accounts" value={createForm.permissions.accounting?.accounts} onChange={(v) => handleCreatePermissionChange('accounting', 'accounts', v)} level={1} />
                    <PermissionItem label="Financial Reports" value={createForm.permissions.accounting?.reports} onChange={(v) => handleCreatePermissionChange('accounting', 'reports', v)} level={1} />
                  </PermissionItem>
                  <PermissionItem label="Inventory" value={Object.values(createForm.permissions.inventory || {}).some(v => v)} onChange={(v) => handleCreatePermissionChange('inventory', null, v)}>
                    <PermissionItem label="Item Master" value={createForm.permissions.inventory?.items} onChange={(v) => handleCreatePermissionChange('inventory', 'items', v)} level={1} />
                    <PermissionItem label="Stock Levels" value={createForm.permissions.inventory?.stock} onChange={(v) => handleCreatePermissionChange('inventory', 'stock', v)} level={1} />
                  </PermissionItem>
                  <PermissionItem label="Manufacturing" value={Object.values(createForm.permissions.manufacturing || {}).some(v => v)} onChange={(v) => handleCreatePermissionChange('manufacturing', null, v)}>
                    <PermissionItem label="Work Orders" value={createForm.permissions.manufacturing?.workorders} onChange={(v) => handleCreatePermissionChange('manufacturing', 'workorders', v)} level={1} />
                    <PermissionItem label="Quality Checks" value={createForm.permissions.manufacturing?.quality} onChange={(v) => handleCreatePermissionChange('manufacturing', 'quality', v)} level={1} />
                  </PermissionItem>
                  <PermissionItem label="HR" value={Object.values(createForm.permissions.hr || {}).some(v => v)} onChange={(v) => handleCreatePermissionChange('hr', null, v)}>
                    <PermissionItem label="Employees" value={createForm.permissions.hr?.employees} onChange={(v) => handleCreatePermissionChange('hr', 'employees', v)} level={1} />
                    <PermissionItem label="Attendance" value={createForm.permissions.hr?.attendance} onChange={(v) => handleCreatePermissionChange('hr', 'attendance', v)} level={1} />
                    <PermissionItem label="Leaves" value={createForm.permissions.hr?.leaves} onChange={(v) => handleCreatePermissionChange('hr', 'leaves', v)} level={1} />
                    <PermissionItem label="Payroll" value={createForm.permissions.hr?.payroll} onChange={(v) => handleCreatePermissionChange('hr', 'payroll', v)} level={1} />
                  </PermissionItem>
                  <PermissionItem label="CRM" value={Object.values(createForm.permissions.crm || {}).some(v => v)} onChange={(v) => handleCreatePermissionChange('crm', null, v)}>
                    <PermissionItem label="Leads" value={createForm.permissions.crm?.leads} onChange={(v) => handleCreatePermissionChange('crm', 'leads', v)} level={1} />
                    <PermissionItem label="Opportunities" value={createForm.permissions.crm?.opportunities} onChange={(v) => handleCreatePermissionChange('crm', 'opportunities', v)} level={1} />
                    <PermissionItem label="Contacts" value={createForm.permissions.crm?.contacts} onChange={(v) => handleCreatePermissionChange('crm', 'contacts', v)} level={1} />
                    <PermissionItem label="Activities" value={createForm.permissions.crm?.activities} onChange={(v) => handleCreatePermissionChange('crm', 'activities', v)} level={1} />
                  </PermissionItem>
                  <PermissionItem label="Assets" value={Object.values(createForm.permissions.assets || {}).some(v => v)} onChange={(v) => handleCreatePermissionChange('assets', null, v)}>
                    <PermissionItem label="Asset List" value={createForm.permissions.assets?.list} onChange={(v) => handleCreatePermissionChange('assets', 'list', v)} level={1} />
                    <PermissionItem label="Depreciation" value={createForm.permissions.assets?.depreciation} onChange={(v) => handleCreatePermissionChange('assets', 'depreciation', v)} level={1} />
                    <PermissionItem label="Maintenance" value={createForm.permissions.assets?.maintenance} onChange={(v) => handleCreatePermissionChange('assets', 'maintenance', v)} level={1} />
                    <PermissionItem label="Reports" value={createForm.permissions.assets?.reports} onChange={(v) => handleCreatePermissionChange('assets', 'reports', v)} level={1} />
                  </PermissionItem>
                  <PermissionItem label="Quality" value={Object.values(form.permissions.quality || {}).some(v => v)} onChange={(v) => handleCreatePermissionChange('quality', null, v)}>
                    <PermissionItem label="Inspections" value={createForm.permissions.quality?.inspections} onChange={(v) => handleCreatePermissionChange('quality', 'inspections', v)} level={1} />
                    <PermissionItem label="Non-Conformance" value={createForm.permissions.quality?.nonconformance} onChange={(v) => handleCreatePermissionChange('quality', 'nonconformance', v)} level={1} />
                    <PermissionItem label="Corrective Actions" value={createForm.permissions.quality?.corrective} onChange={(v) => handleCreatePermissionChange('quality', 'corrective', v)} level={1} />
                    <PermissionItem label="Quality Metrics" value={createForm.permissions.quality?.metrics} onChange={(v) => handleCreatePermissionChange('quality', 'metrics', v)} level={1} />
                  </PermissionItem>
                  <PermissionItem label="Planning" value={Object.values(createForm.permissions.planning || {}).some(v => v)} onChange={(v) => handleCreatePermissionChange('planning', null, v)}>
                    <PermissionItem label="Production Plans" value={createForm.permissions.planning?.production} onChange={(v) => handleCreatePermissionChange('planning', 'production', v)} level={1} />
                    <PermissionItem label="MRP Runs" value={createForm.permissions.planning?.mrp} onChange={(v) => handleCreatePermissionChange('planning', 'mrp', v)} level={1} />
                    <PermissionItem label="Planned Orders" value={createForm.permissions.planning?.orders} onChange={(v) => handleCreatePermissionChange('planning', 'orders', v)} level={1} />
                    <PermissionItem label="Capacity" value={createForm.permissions.planning?.capacity} onChange={(v) => handleCreatePermissionChange('planning', 'capacity', v)} level={1} />
                    <PermissionItem label="Forecasts" value={createForm.permissions.planning?.forecasts} onChange={(v) => handleCreatePermissionChange('planning', 'forecasts', v)} level={1} />
                  </PermissionItem>
                  <PermissionItem label="Projects" value={Object.values(createForm.permissions.projects || {}).some(v => v)} onChange={(v) => handleCreatePermissionChange('projects', null, v)}>
                    <PermissionItem label="Project List" value={createForm.permissions.projects?.list} onChange={(v) => handleCreatePermissionChange('projects', 'list', v)} level={1} />
                    <PermissionItem label="Timesheets" value={createForm.permissions.projects?.timesheets} onChange={(v) => handleCreatePermissionChange('projects', 'timesheets', v)} level={1} />
                  </PermissionItem>
                  <PermissionItem label="Supply Chain" value={Object.values(createForm.permissions.supplychain || {}).some(v => v)} onChange={(v) => handleCreatePermissionChange('supplychain', null, v)}>
                    <PermissionItem label="Vendors" value={createForm.permissions.supplychain?.vendors} onChange={(v) => handleCreatePermissionChange('supplychain', 'vendors', v)} level={1} />
                    <PermissionItem label="Requisitions" value={createForm.permissions.supplychain?.requisitions} onChange={(v) => handleCreatePermissionChange('supplychain', 'requisitions', v)} level={1} />
                    <PermissionItem label="Goods Receipt" value={createForm.permissions.supplychain?.receipts} onChange={(v) => handleCreatePermissionChange('supplychain', 'receipts', v)} level={1} />
                    <PermissionItem label="Performance" value={createForm.permissions.supplychain?.performance} onChange={(v) => handleCreatePermissionChange('supplychain', 'performance', v)} level={1} />
                  </PermissionItem>
                  <PermissionItem
                    label="Master Setup"
                    value={Object.values(createForm.permissions.master || {}).some(v => v)}
                    onChange={(v) => handleCreatePermissionChange('master', null, v)}
                  >
                    <PermissionItem label="Categories" value={createForm.permissions.master?.categories} onChange={(v) => handleCreatePermissionChange('master', 'categories', v)} level={1} />
                    <PermissionItem label="Subcategories" value={createForm.permissions.master?.subcategories} onChange={(v) => handleCreatePermissionChange('master', 'subcategories', v)} level={1} />
                    <PermissionItem label="Types" value={createForm.permissions.master?.types} onChange={(v) => handleCreatePermissionChange('master', 'types', v)} level={1} />
                    <PermissionItem label="UOM" value={createForm.permissions.master?.uom} onChange={(v) => handleCreatePermissionChange('master', 'uom', v)} level={1} />
                    <PermissionItem label="Currencies" value={createForm.permissions.master?.currencies} onChange={(v) => handleCreatePermissionChange('master', 'currencies', v)} level={1} />
                    <PermissionItem label="HSN Codes" value={createForm.permissions.master?.hsncodes} onChange={(v) => handleCreatePermissionChange('master', 'hsncodes', v)} level={1} />
                    <PermissionItem label="Warehouses" value={createForm.permissions.master?.warehouses} onChange={(v) => handleCreatePermissionChange('master', 'warehouses', v)} level={1} />
                    <PermissionItem label="Email Settings" value={createForm.permissions.master?.emailsettings} onChange={(v) => handleCreatePermissionChange('master', 'emailsettings', v)} level={1} />
                    <PermissionItem label="User Access" value={createForm.permissions.master?.useraccess} onChange={(v) => handleCreatePermissionChange('master', 'useraccess', v)} level={1} />
                  </PermissionItem>
                </List>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={() => setCreateOpen(false)} sx={{ textTransform: 'none', fontWeight: 600, color: '#64748b', px: 3 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={createSaving}
            sx={{ bgcolor: '#1e40af', textTransform: 'none', fontWeight: 700, px: 4, py: 1, borderRadius: '8px', boxShadow: '0 4px 12px rgba(30,64,175,0.2)', '&:hover': { bgcolor: '#1e3a8a' } }}
          >
            {createSaving ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ─── UOM Tab ──────────────────────────────────────────────────────────────────
const UomTab = () => {
  const [rows, setRows]           = useState([]);
  const [open, setOpen]           = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]           = useState({ name: '', description: '' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [loading, setLoading]     = useState(true);
  const { success, error }        = useAlert();

  const { page, setPage, pageRows, filtered, ROWS_PER_PAGE, search, handleSearchChange } = usePagination(
    rows,
    (item, q) => item.name.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q)
  );

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiClient.get('/master/uom');
      setRows(r.data);
    } catch { error('Failed to load UOM'); }
    finally { setTimeout(() => setLoading(false), 300); }
  };

  const openAdd = () => { setEditingId(null); setForm({ name: '', description: '' }); setOpen(true); };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setForm({ name: row.name, description: row.description || '' });
    setOpen(true);
  };

  const handleToggle = async (row) => {
    const orig = [...rows];
    setRows(rows.map(r => r.id === row.id ? { ...r, is_active: !r.is_active } : r));
    try {
      await apiClient.put(`/master/uom/${row.id}`, { ...row, is_active: !row.is_active });
      success(`UOM ${!row.is_active ? 'activated' : 'deactivated'}`);
    } catch { setRows(orig); error('Failed to update status'); }
  };

  const handleDelete = (id) => { setDeleteItem(id); setDeleteDialogOpen(true); };

  const confirmDelete = async () => {
    try {
      await apiClient.delete(`/master/uom/${deleteItem}`);
      setDeleteDialogOpen(false);
      success('UOM deleted');
      load();
    } catch (err) { error(err.response?.data?.error || 'Failed to delete'); }
  };

  const save = async () => {
    if (!form.name.trim()) return error('UOM name is required');
    try {
      if (editingId) {
        await apiClient.put(`/master/uom/${editingId}`, form);
        success('UOM updated');
      } else {
        await apiClient.post('/master/uom', form);
        success('UOM created');
      }
      setOpen(false);
      setEditingId(null);
      load();
    } catch (err) { error(err.response?.data?.error || 'Failed to save'); }
  };

  return (
    <Box>
      <LoadingBackdrop open={loading} />
      {/* Header */}
      <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Units of Measure (UOM)
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField size="small" placeholder="Search UOM..."
            value={search} onChange={handleSearchChange}
            InputProps={{ startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1, fontSize: 18 }} />, sx: { borderRadius: '8px', fontSize: '0.8125rem', bgcolor: '#fff' } }}
            sx={{ width: 220 }} />
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openAdd}
            sx={{ bgcolor: '#1e40af', textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem',
              borderRadius: '7px', px: 1.5, py: 0.75, boxShadow: 'none',
              '&:hover': { bgcolor: '#1e3a8a', boxShadow: '0 4px 12px rgba(30,64,175,0.25)' } }}>
            Add UOM
          </Button>
        </Box>
      </Box>

      {/* Table */}
      <ErpTable
        columns={[
          { label: 'UOM Code',   width: '15%' },
          { label: 'Description', width: '55%' },
          { label: 'Status',     width: '15%' },
          { label: 'Actions',   width: '15%', align: 'right' },
        ]}
        loading={loading}
        empty={!loading && pageRows.length === 0}
        emptyText="No UOM found. Click 'Add UOM' to create one.">
        {!loading && pageRows.map((r) => (
          <ErpRow key={r.id}>
            <ErpCell bold mono color="#1e40af">{r.name}</ErpCell>
            <ErpCell color="#475569">{r.description || '—'}</ErpCell>
            <ErpCell>
              <Chip label={r.is_active ? 'Active' : 'Inactive'} size="small"
                sx={{ height: 20, fontSize: '0.675rem', fontWeight: 700,
                  bgcolor: r.is_active ? '#dcfce7' : '#fee2e2',
                  color:   r.is_active ? '#166534' : '#dc2626' }} />
            </ErpCell>
            <ErpCell align="right">
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                <Tooltip title={r.is_active ? 'Disable' : 'Enable'}>
                  <IconButton size="small" onClick={() => handleToggle(r)} sx={{ color: r.is_active ? '#059669' : '#94a3b8' }}>
                    {r.is_active ? <VisibilityIcon sx={{ fontSize: 18 }} /> : <VisibilityOffIcon sx={{ fontSize: 18 }} />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => handleEdit(r)} sx={{ color: '#2563eb' }}>
                    <EditIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" onClick={() => handleDelete(r.id)} sx={{ color: '#ef4444' }}>
                    <DeleteIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </ErpCell>
          </ErpRow>
        ))}
      </ErpTable>
      <ErpPagination count={filtered.length} page={page} onPageChange={setPage} rowsPerPage={ROWS_PER_PAGE} label="UOM" />

      {/* Add / Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', position: 'relative' }}>
          {editingId ? 'Edit UOM' : 'Add New UOM'}
          <IconButton onClick={() => setOpen(false)} sx={{ position: 'absolute', right: 8, top: 8, color: '#94a3b8' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth required label="UOM Code" placeholder="e.g. KG, MTR, NOS"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value.toUpperCase() })}
                helperText="Short code (auto uppercased)"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" placeholder="e.g. Kilograms"
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none', color: '#64748b' }}>Cancel</Button>
          <Button variant="contained" onClick={save}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '7px', bgcolor: '#1e40af',
              '&:hover': { bgcolor: '#1e3a8a' }, px: 3, boxShadow: 'none' }}>
            {editingId ? 'Update' : 'Add UOM'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, px: 3, pt: 3 }}>Delete UOM</DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Typography variant="body2" sx={{ color: '#475569' }}>
            Are you sure you want to delete this UOM? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ textTransform: 'none', color: '#64748b' }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmDelete}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '7px', boxShadow: 'none' }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MasterSetup;
