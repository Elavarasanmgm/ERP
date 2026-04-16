/**
 * ErpTable — shared ERP data table component
 *
 * Uses native MUI Table (semantic HTML <table>) with:
 *  - tableLayout: fixed  → predictable column widths, no stretching
 *  - stickyHeader        → header stays visible on scroll
 *  - Dense padding       → compact ERP rows (py: 1, px: 1.5)
 *  - Bordered cells      → right-border on each cell
 *  - Hover highlight     → #f8fafc on row hover
 *
 * Usage:
 *   <ErpTable columns={[{label, width, align}]} loading={bool} empty={bool} emptyText="">
 *     {rows.map(r => (
 *       <ErpRow key={r.id}>
 *         <ErpCell>{r.code}</ErpCell>
 *         <ErpCell align="right">{r.amount}</ErpCell>
 *       </ErpRow>
 *     ))}
 *   </ErpTable>
 */

import Table          from '@mui/material/Table';
import TableHead      from '@mui/material/TableHead';
import TableBody      from '@mui/material/TableBody';
import TableRow       from '@mui/material/TableRow';
import TableCell      from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import Box            from '@mui/material/Box';
import Typography     from '@mui/material/Typography';

/* ── Shared cell sx ── */
const headCellSx = {
  py: 1.25, px: 1.5,
  fontWeight: 700,
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#64748b',
  bgcolor: '#f8fafc',
  borderBottom: '2px solid #e2e8f0',
  borderRight: '1px solid #e2e8f0',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  '&:last-child': { borderRight: 'none' },
};

const bodyCellSx = {
  py: 1, px: 1.5,
  fontSize: '0.8125rem',
  color: '#1e293b',
  borderBottom: '1px solid #f1f5f9',
  borderRight: '1px solid #f1f5f9',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  '&:last-child': { borderRight: 'none' },
};

/* ── Public sub-components ── */

/** A header-less table row for data */
export function ErpRow({ children, sx = {} }) {
  return (
    <TableRow sx={{ '&:hover': { bgcolor: '#f8fafc' }, ...sx }}>
      {children}
    </TableRow>
  );
}

/** A single table cell — pass align="right" for numbers, noWrap={false} to allow wrap */
export function ErpCell({ children, align = 'center', sx = {}, mono = false, bold = false, color }) {
  return (
    <TableCell align={align} sx={{
      ...bodyCellSx,
      ...(mono  ? { fontFamily: 'monospace' } : {}),
      ...(bold  ? { fontWeight: 700 }         : {}),
      ...(color ? { color }                   : {}),
      ...sx,
    }}>
      {children}
    </TableCell>
  );
}

/**
 * Main ErpTable wrapper
 * @param columns  Array of { label, width, align }
 * @param empty    No data state
 * @param emptyText Custom empty message
 * @param maxHeight Optional scrollable height (e.g. '60vh')
 */
export default function ErpTable({ columns = [], empty = false, emptyText = 'No data found.', maxHeight, children }) {
  return (
    <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
      <TableContainer sx={maxHeight ? { maxHeight } : {}}>
        <Table stickyHeader={!!maxHeight} sx={{ tableLayout: 'auto', minWidth: 400 }}>

          {/* Column width definitions */}
          <colgroup>
            {columns.map((col, i) => (
              <col key={i} style={{ width: col.width || 'auto' }} />
            ))}
          </colgroup>

          {/* Header */}
          <TableHead>
            <TableRow>
              {columns.map((col, i) => (
                <TableCell key={i} align={col.align || 'center'} sx={headCellSx}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          {/* Body */}
          <TableBody>
            {empty ? (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ textAlign: 'center', py: 6, border: 'none' }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>{emptyText}</Typography>
                </TableCell>
              </TableRow>
            ) : children}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
