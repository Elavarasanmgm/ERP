import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Grid, IconButton, InputAdornment
} from '@mui/material';
import LoadingBackdrop from '../../components/Shared/LoadingBackdrop';
import ErpTable, { ErpRow, ErpCell } from '../../components/Shared/ErpTable';
import ErpPagination from '../../components/Shared/ErpPagination';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import usePagination from '../../hooks/usePagination';
import { useAlert } from '../../hooks/useAlert';

const Items = () => {
  const { success, error } = useAlert();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    itemCode: '',
    itemName: '',
    description: '',
    unitPrice: '',
    unit_of_measure: 'NOS',
    hsn_code: '',
    reorderLevel: 0,
    category_id: '',
    subcategory_id: '',
    type_id: '',
    color_code: ''
  });

  const [uomList, setUomList] = useState([]);
  const [filteredSubs, setFilteredSubs] = useState([]);
  const [filteredTypes, setFilteredTypes] = useState([]);

  const pagn = usePagination(items, (item, q) =>
    (item.name || '').toLowerCase().includes(q) ||
    (item.code || '').toLowerCase().includes(q) ||
    (item.item_number || '').toLowerCase().includes(q));

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-generate Item Code
  useEffect(() => {
    if (open && !formData.itemCode_manual) {
      const parts = [];
      
      // Pad IDs to 2 digits for consistency (e.g. 1 -> 01)
      if (formData.category_id) parts.push(String(formData.category_id).padStart(2, '0'));
      if (formData.subcategory_id) parts.push(String(formData.subcategory_id).padStart(2, '0'));
      
      const typ = types.find(t => t.id === formData.type_id);
      if (typ) {
        parts.push(String(typ.id).padStart(2, '0'));
        if (typ.color_code) parts.push(typ.color_code);
      } else if (formData.color_code) {
        // Fallback if type isn't selected but color is entered manually
        parts.push(formData.color_code);
      }

      const generatedCode = parts.join('-');
      if (generatedCode !== formData.itemCode) {
        setFormData(prev => ({ ...prev, itemCode: generatedCode }));
      }
    }
  }, [formData.category_id, formData.subcategory_id, formData.type_id, formData.color_code, open, types]);

  // Auto-generate Item Name
  useEffect(() => {
    if (open) {
      const cat = categories.find(c => c.id === formData.category_id);
      const sub = subcategories.find(s => s.id === formData.subcategory_id);
      const typ = types.find(t => t.id === formData.type_id);
      
      const parts = [];
      if (cat) parts.push(cat.name);
      if (sub) parts.push(sub.name);
      if (typ) parts.push(typ.name);

      const generatedName = parts.join(' - ');
      if (generatedName !== formData.itemName) {
        setFormData(prev => ({ ...prev, itemName: generatedName }));
      }
    }
  }, [formData.category_id, formData.subcategory_id, formData.type_id, open, categories, subcategories, types]);

  // Dependent dropdowns
  useEffect(() => {
    if (formData.category_id) {
      setFilteredSubs(subcategories.filter(s => s.category_id === formData.category_id));
    } else {
      setFilteredSubs([]);
    }
    setFormData(prev => ({ ...prev, subcategory_id: '', type_id: '' }));
  }, [formData.category_id, subcategories]);

  useEffect(() => {
    if (formData.subcategory_id) {
      setFilteredTypes(types.filter(t => t.subcategory_id === formData.subcategory_id));
    } else {
      setFilteredTypes([]);
    }
    setFormData(prev => ({ ...prev, type_id: '' }));
  }, [formData.subcategory_id, types]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, catRes, subRes, typeRes, uomRes] = await Promise.all([
        apiClient.get('/inventory/items'),
        apiClient.get('/master/categories?activeOnly=true'),
        apiClient.get('/master/subcategories?activeOnly=true'),
        apiClient.get('/master/types?activeOnly=true'),
        apiClient.get('/master/uom?activeOnly=true'),
      ]);
      setItems(itemsRes.data);
      setCategories(catRes.data);
      setSubcategories(subRes.data);
      setTypes(typeRes.data);
      setUomList(uomRes.data);
    } catch (err) {
      error('Failed to load data');
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'itemCode') {
      setFormData({ ...formData, [name]: value, itemCode_manual: true });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleOpen = () => {
    setFormData({
      itemCode: '',
      itemCode_manual: false,
      itemName: '',
      description: '',
      unitPrice: '',
      unit_of_measure: 'NOS',
      hsn_code: '',
      reorderLevel: 0,
      category_id: '',
      subcategory_id: '',
      type_id: '',
      color_code: ''
    });
    setOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.itemCode || !formData.itemName) {
      error('Item Code and Item Name are required');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/inventory/items', formData);
      success('Item created successfully');
      setOpen(false);
      fetchData();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to create item';
      error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <LoadingBackdrop open={loading} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>Items Catalog</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
          sx={{ bgcolor: '#2563eb', fontWeight: 600, textTransform: 'none', borderRadius: 2 }}
        >
          New Item
        </Button>
      </Box>

      {/* Search Input */}
      <TextField
        size="small"
        placeholder="Search items..."
        value={pagn.search}
        onChange={pagn.handleSearchChange}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8', fontSize: 20 }} /></InputAdornment>,
          sx: { borderRadius: '8px', bgcolor: '#fff' }
        }}
        sx={{ mb: 2.5, width: 300 }}
      />

      <ErpTable
        columns={[
          { label: 'Item Code',  width: '16%', align: 'left'  },
          { label: 'Item Name',  width: '28%', align: 'left'  },
          { label: 'Category',   width: '15%', align: 'left'  },
          { label: 'Type',       width: '15%', align: 'left'  },
          { label: 'Unit Price', width: '13%', align: 'right' },
          { label: 'UOM',        width: '8%',  align: 'left'  },
          { label: 'Reorder',    width: '8%',  align: 'right' },
        ]}
        loading={loading}
        empty={!loading && pagn.pageRows.length === 0}
        emptyText="No items found."
      >
        {!loading && pagn.pageRows.map((item) => (
          <ErpRow key={item.id}>
            <ErpCell mono bold color="#1e40af">{item.code}</ErpCell>
            <ErpCell bold color="#1e293b">{item.name}</ErpCell>
            <ErpCell color="#64748b">{item.category || '—'}</ErpCell>
            <ErpCell color="#64748b">{item.type || '—'}</ErpCell>
            <ErpCell align="right" mono color="#1e293b">
              ₹{Number(item.unit_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </ErpCell>
            <ErpCell color="#64748b">{item.unit_of_measure}</ErpCell>
            <ErpCell align="right" color="#64748b">{item.reorder_level ?? '—'}</ErpCell>
          </ErpRow>
        ))}
      </ErpTable>

      {!loading && (
        <ErpPagination count={pagn.filtered.length} page={pagn.page} onPageChange={pagn.setPage} rowsPerPage={pagn.ROWS_PER_PAGE} />
      )}

      {/* New Item Dialog */}
      <Dialog open={open} onClose={() => !saving && setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #e2e8f0', mb: 2, position: 'relative' }}>
          Create New Item
          <IconButton
            onClick={() => !saving && setOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: '#94a3b8',
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Category"
                  name="category_id"
                  fullWidth
                  size="small"
                  value={formData.category_id}
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Subcategory"
                  name="subcategory_id"
                  fullWidth
                  size="small"
                  disabled={!formData.category_id}
                  value={formData.subcategory_id}
                  onChange={(e) => setFormData({...formData, subcategory_id: e.target.value})}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {filteredSubs.map((s) => (
                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Type"
                  name="type_id"
                  fullWidth
                  size="small"
                  disabled={!formData.subcategory_id}
                  value={formData.type_id}
                  onChange={(e) => {
                    const selectedType = types.find(t => t.id === e.target.value);
                    setFormData({
                      ...formData,
                      type_id: e.target.value,
                      color_code: selectedType?.color_code || ''
                    });
                  }}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {filteredTypes.map((t) => (
                    <MenuItem key={t.id} value={t.id}>{t.name} (Code: {t.color_code || 'N/A'})</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Item Code (Auto-generated)"
                  name="itemCode"
                  fullWidth
                  size="small"
                  value={formData.itemCode}
                  disabled
                  required
                  helperText="Auto-generated from selections"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Item Name"
                  name="itemName"
                  fullWidth
                  size="small"
                  value={formData.itemName}
                  disabled
                  required
                  helperText="Auto-generated from selections"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Unit Price"
                  name="unitPrice"
                  type="number"
                  fullWidth
                  size="small"
                  value={formData.unitPrice}
                  onChange={handleInputChange}
                  InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: '#64748b' }}>₹</Typography> }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  label="UOM"
                  name="unit_of_measure"
                  fullWidth
                  size="small"
                  value={formData.unit_of_measure}
                  onChange={handleInputChange}
                >
                  {uomList.map(u => (
                    <MenuItem key={u.id} value={u.name}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{u.name}</Typography>
                        {u.description && <Typography variant="caption" sx={{ color: '#94a3b8' }}>{u.description}</Typography>}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="HSN Code"
                  name="hsn_code"
                  fullWidth
                  size="small"
                  value={formData.hsn_code}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Reorder Level"
                  name="reorderLevel"
                  type="number"
                  fullWidth
                  size="small"
                  value={formData.reorderLevel}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  name="description"
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1.5, justifyContent: 'flex-end' }}>
            <Button 
              onClick={() => setOpen(false)} 
              disabled={saving} 
              variant="outlined"
              size="small"
              sx={{ 
                textTransform: 'none', 
                fontWeight: 600, 
                borderRadius: '8px',
                color: '#475569',
                borderColor: '#cbd5e1',
                width: '120px',
                px: 0,
                py: 0.8
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={saving} 
              size="small"
              sx={{ 
                bgcolor: '#2563eb', 
                textTransform: 'none', 
                fontWeight: 600, 
                borderRadius: '8px',
                width: '120px',
                px: 0,
                py: 0.8,
                boxShadow: 'none',
                '&:hover': { bgcolor: '#1d4ed8', boxShadow: 'none' }
              }}
            >
              {saving ? 'Creating...' : 'Create Item'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default Items;
