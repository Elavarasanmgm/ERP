import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TablePagination from '@mui/material/TablePagination';

/**
 * ERP standard pagination bar.
 * Props: count, page, onPageChange, rowsPerPage, label (optional)
 */
export default function ErpPagination({ count, page, onPageChange, rowsPerPage = 10, label = 'records' }) {
  if (count === 0) return null;
  const from = page * rowsPerPage + 1;
  const to   = Math.min((page + 1) * rowsPerPage, count);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, px: 0.5 }}>
      <Typography variant="caption" sx={{ color: '#64748b' }}>
        Showing <strong>{from}–{to}</strong> of <strong>{count}</strong> {label}
      </Typography>
      <TablePagination
        component="div"
        count={count}
        page={page}
        onPageChange={(_, p) => onPageChange(p)}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[]}
        sx={{
          '.MuiTablePagination-toolbar': { minHeight: 36, pl: 0 },
          '.MuiTablePagination-displayedRows': { display: 'none' },
          '.MuiTablePagination-actions button': { color: '#1e40af' },
        }}
      />
    </Box>
  );
}
