import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import BookOutlinedIcon from '@mui/icons-material/BookOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import MoveToInboxOutlinedIcon from '@mui/icons-material/MoveToInboxOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import PrecisionManufacturingOutlinedIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import ViewKanbanOutlinedIcon from '@mui/icons-material/ViewKanbanOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import LeaderboardOutlinedIcon from '@mui/icons-material/LeaderboardOutlined';
import ContactsOutlinedIcon from '@mui/icons-material/ContactsOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import SummarizeOutlinedIcon from '@mui/icons-material/SummarizeOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import GppBadOutlinedIcon from '@mui/icons-material/GppBadOutlined';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import PlaylistAddCheckOutlinedIcon from '@mui/icons-material/PlaylistAddCheckOutlined';
import EventRepeatOutlinedIcon from '@mui/icons-material/EventRepeatOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ShoppingBasketOutlinedIcon from '@mui/icons-material/ShoppingBasketOutlined';
import LocalMallOutlinedIcon from '@mui/icons-material/LocalMallOutlined';
import StarsOutlinedIcon from '@mui/icons-material/StarsOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const PERMISSION_MAP = {
  '/dashboard': { module: 'dashboard' },
  '/accounting': { module: 'accounting' },
  '/accounting/chart-of-accounts': { module: 'accounting', subpage: 'accounts' },
  '/accounting/journal-entries': { module: 'accounting', subpage: 'entries' },
  '/accounting/invoices': { module: 'accounting', subpage: 'invoices' },
  '/accounting/payments': { module: 'accounting', subpage: 'payments' },
  '/accounting/customers': { module: 'accounting', subpage: 'customers' },
  '/accounting/suppliers': { module: 'accounting', subpage: 'suppliers' },
  '/accounting/reports': { module: 'accounting', subpage: 'reports' },
  '/inventory': { module: 'inventory' },
  '/inventory/items': { module: 'inventory', subpage: 'items' },
  '/inventory/stock-levels': { module: 'inventory', subpage: 'stock' },
  '/inventory/stock-locations': { module: 'inventory', subpage: 'locations' },
  '/inventory/movements': { module: 'inventory', subpage: 'movements' },
  '/orders': { module: 'orders' },
  '/orders/sales': { module: 'orders', subpage: 'sales' },
  '/orders/purchase': { module: 'orders', subpage: 'purchase' },
  '/orders/material-requests': { module: 'orders', subpage: 'requests' },
  '/orders/supplier-quotations': { module: 'orders', subpage: 'quotes' },
  '/orders/goods-receipts': { module: 'orders', subpage: 'receipts' },
  '/orders/traceability': { module: 'orders', subpage: 'trace' },
  '/manufacturing': { module: 'manufacturing' },
  '/manufacturing/work-orders': { module: 'manufacturing', subpage: 'workorders' },
  '/manufacturing/bom': { module: 'manufacturing', subpage: 'bom' },
  '/manufacturing/production-plan': { module: 'manufacturing', subpage: 'planning' },
  '/manufacturing/wip-kanban': { module: 'manufacturing', subpage: 'kanban' },
  '/manufacturing/quality-checks': { module: 'manufacturing', subpage: 'quality' },
  '/hr': { module: 'hr' },
  '/hr/employees': { module: 'hr', subpage: 'employees' },
  '/hr/attendance': { module: 'hr', subpage: 'attendance' },
  '/hr/leaves': { module: 'hr', subpage: 'leaves' },
  '/hr/payroll': { module: 'hr', subpage: 'payroll' },
  '/crm': { module: 'crm' },
  '/crm/leads': { module: 'crm', subpage: 'leads' },
  '/crm/opportunities': { module: 'crm', subpage: 'opportunities' },
  '/crm/contacts': { module: 'crm', subpage: 'contacts' },
  '/crm/activities': { module: 'crm', subpage: 'activities' },
  '/assets': { module: 'assets' },
  '/assets/list': { module: 'assets', subpage: 'list' },
  '/assets/depreciation': { module: 'assets', subpage: 'depreciation' },
  '/assets/maintenance': { module: 'assets', subpage: 'maintenance' },
  '/assets/reports': { module: 'assets', subpage: 'reports' },
  '/quality': { module: 'quality' },
  '/quality/inspections': { module: 'quality', subpage: 'inspections' },
  '/quality/non-conformances': { module: 'quality', subpage: 'nonconformance' },
  '/quality/corrective-actions': { module: 'quality', subpage: 'corrective' },
  '/quality/metrics': { module: 'quality', subpage: 'metrics' },
  '/planning': { module: 'planning' },
  '/planning/production-plans': { module: 'planning', subpage: 'production' },
  '/planning/mrp-runs': { module: 'planning', subpage: 'mrp' },
  '/planning/planned-orders': { module: 'planning', subpage: 'orders' },
  '/planning/capacity': { module: 'planning', subpage: 'capacity' },
  '/planning/forecasts': { module: 'planning', subpage: 'forecasts' },
  '/projects': { module: 'projects' },
  '/projects/list': { module: 'projects', subpage: 'list' },
  '/projects/timesheets': { module: 'projects', subpage: 'timesheets' },
  '/supply-chain': { module: 'supplychain' },
  '/supply-chain/vendors': { module: 'supplychain', subpage: 'vendors' },
  '/supply-chain/requisitions': { module: 'supplychain', subpage: 'requisitions' },
  '/supply-chain/goods-receipt': { module: 'supplychain', subpage: 'receipts' },
  '/supply-chain/vendor-performance': { module: 'supplychain', subpage: 'performance' },
  '/master-setup': { module: 'master' },
};

const checkItemPermission = (user, href) => {
  if (!user || !user.permissions) return false;

  const mapping = PERMISSION_MAP[href];
  if (!mapping) return true; // Default allow if no mapping defined (e.g. profile)

  const perms = user.permissions;
  const { module, subpage } = mapping;

  if (subpage) {
    return perms[module] && perms[module][subpage] === true;
  }

  if (typeof perms[module] === 'object' && perms[module] !== null) {
    return Object.values(perms[module]).some(v => v === true);
  }

  return perms[module] === true;
};

const menuGroups = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard', icon: DashboardOutlinedIcon, href: '/dashboard' },
    ],
  },
  {
    label: 'Finance',
    items: [
      {
        label: 'Accounting', icon: AccountBalanceOutlinedIcon, href: '/accounting',
        children: [
          { label: 'Chart of Accounts', icon: BookOutlinedIcon, href: '/accounting/chart-of-accounts' },
          { label: 'Journal Entries', icon: ReceiptLongOutlinedIcon, href: '/accounting/journal-entries' },
          { label: 'Invoices', icon: ReceiptLongOutlinedIcon, href: '/accounting/invoices' },
          { label: 'Payments', icon: PaymentsOutlinedIcon, href: '/accounting/payments' },
          { label: 'Customers', icon: PeopleAltOutlinedIcon, href: '/accounting/customers' },
          { label: 'Suppliers', icon: LocalShippingOutlinedIcon, href: '/accounting/suppliers' },
          { label: 'Reports', icon: BarChartOutlinedIcon, href: '/accounting/reports' },
        ],
      },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        label: 'Inventory', icon: Inventory2OutlinedIcon, href: '/inventory',
        children: [
          { label: 'Items', icon: CategoryOutlinedIcon, href: '/inventory/items' },
          { label: 'Stock Levels', icon: Inventory2OutlinedIcon, href: '/inventory/stock-levels' },
          { label: 'Stock Locations', icon: LocationOnOutlinedIcon, href: '/inventory/stock-locations' },
          { label: 'Stock Movements', icon: MoveToInboxOutlinedIcon, href: '/inventory/movements' },
        ],
      },
      {
        label: 'Orders', icon: ShoppingCartOutlinedIcon, href: '/orders',
        children: [
          { label: 'Sales Orders', icon: ShoppingBagOutlinedIcon, href: '/orders/sales' },
          { label: 'Purchase Orders', icon: ShoppingCartOutlinedIcon, href: '/orders/purchase' },
          { label: 'Material Requests', icon: AssignmentOutlinedIcon, href: '/orders/material-requests' },
          { label: 'Supplier Quotations', icon: RequestQuoteOutlinedIcon, href: '/orders/supplier-quotations' },
          { label: 'Goods Receipts', icon: FactCheckOutlinedIcon, href: '/orders/goods-receipts' },
          { label: 'SO Traceability', icon: TimelineOutlinedIcon, href: '/orders/traceability' },
        ],
      },
      {
        label: 'Manufacturing', icon: PrecisionManufacturingOutlinedIcon, href: '/manufacturing',
        children: [
          { label: 'Work Orders', icon: ListAltOutlinedIcon, href: '/manufacturing/work-orders' },
          { label: 'Bill of Materials', icon: AccountTreeOutlinedIcon, href: '/manufacturing/bom' },
          { label: 'Production Plan', icon: PlaylistAddCheckOutlinedIcon, href: '/manufacturing/production-plan' },
          { label: 'WIP Kanban', icon: ViewKanbanOutlinedIcon, href: '/manufacturing/wip-kanban' },
          { label: 'Quality Checks', icon: VerifiedOutlinedIcon, href: '/manufacturing/quality-checks' },
        ],
      },
      {
        label: 'Supply Chain', icon: LocalShippingOutlinedIcon, href: '/supply-chain',
        children: [
          { label: 'Vendors', icon: StorefrontOutlinedIcon, href: '/supply-chain/vendors' },
          { label: 'Requisitions', icon: ShoppingBasketOutlinedIcon, href: '/supply-chain/requisitions' },
          { label: 'Goods Receipt', icon: LocalMallOutlinedIcon, href: '/supply-chain/goods-receipt' },
          { label: 'Vendor Performance', icon: StarsOutlinedIcon, href: '/supply-chain/vendor-performance' },
        ],
      },
      {
        label: 'Quality', icon: VerifiedOutlinedIcon, href: '/quality',
        children: [
          { label: 'Inspections', icon: SearchOutlinedIcon, href: '/quality/inspections' },
          { label: 'Non-Conformances', icon: GppBadOutlinedIcon, href: '/quality/non-conformances' },
          { label: 'Corrective Actions', icon: EngineeringOutlinedIcon, href: '/quality/corrective-actions' },
          { label: 'Quality Metrics', icon: InsightsOutlinedIcon, href: '/quality/metrics' },
        ],
      },
    ],
  },
  {
    label: 'Business',
    items: [
      {
        label: 'CRM', icon: HandshakeOutlinedIcon, href: '/crm',
        children: [
          { label: 'Leads', icon: LeaderboardOutlinedIcon, href: '/crm/leads' },
          { label: 'Opportunities', icon: InsightsOutlinedIcon, href: '/crm/opportunities' },
          { label: 'Contacts', icon: ContactsOutlinedIcon, href: '/crm/contacts' },
          { label: 'Activities', icon: EventNoteOutlinedIcon, href: '/crm/activities' },
        ],
      },
      {
        label: 'HR', icon: PeopleOutlinedIcon, href: '/hr',
        children: [
          { label: 'Employees', icon: PeopleOutlinedIcon, href: '/hr/employees' },
          { label: 'Attendance', icon: AccessTimeOutlinedIcon, href: '/hr/attendance' },
          { label: 'Leaves', icon: EventAvailableOutlinedIcon, href: '/hr/leaves' },
          { label: 'Payroll', icon: MonetizationOnOutlinedIcon, href: '/hr/payroll' },
        ],
      },
      {
        label: 'Assets', icon: ApartmentOutlinedIcon, href: '/assets',
        children: [
          { label: 'Asset List', icon: ApartmentOutlinedIcon, href: '/assets/list' },
          { label: 'Depreciation', icon: TrendingDownOutlinedIcon, href: '/assets/depreciation' },
          { label: 'Maintenance', icon: BuildOutlinedIcon, href: '/assets/maintenance' },
          { label: 'Reports', icon: SummarizeOutlinedIcon, href: '/assets/reports' },
        ],
      },
      {
        label: 'Planning', icon: InsightsOutlinedIcon, href: '/planning',
        children: [
          { label: 'Production Plans', icon: PlaylistAddCheckOutlinedIcon, href: '/planning/production-plans' },
          { label: 'MRP Runs', icon: EventRepeatOutlinedIcon, href: '/planning/mrp-runs' },
          { label: 'Planned Orders', icon: ListAltOutlinedIcon, href: '/planning/planned-orders' },
          { label: 'Capacity Planning', icon: SpeedOutlinedIcon, href: '/planning/capacity' },
          { label: 'Forecasts', icon: ShowChartOutlinedIcon, href: '/planning/forecasts' },
        ],
      },
      {
        label: 'Projects', icon: FolderOutlinedIcon, href: '/projects',
        children: [
          { label: 'Project List', icon: FolderOutlinedIcon, href: '/projects/list' },
          { label: 'Timesheets', icon: TimerOutlinedIcon, href: '/projects/timesheets' },
        ],
      },
    ],
  },
];

function SidebarItem({ item, sidebarOpen, depth = 0 }) {
  const location = useLocation();
  const isActive = location.pathname === item.href ||
    (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
  const hasChildren = item.children && item.children.length > 0;
  const [open, setOpen] = useState(isActive);
  const Icon = item.icon;

  const handleClick = () => {
    if (hasChildren) setOpen((prev) => !prev);
  };

  const btn = (
    <ListItemButton
      component={hasChildren ? 'div' : Link}
      to={hasChildren ? undefined : item.href}
      onClick={handleClick}
      sx={{
        borderRadius: 1.5,
        mb: 0.25,
        pl: sidebarOpen ? (depth === 0 ? 1.5 : 3) : 1,
        pr: 1,
        py: 0.75,
        minHeight: 38,
        justifyContent: sidebarOpen ? 'flex-start' : 'center',
        backgroundColor: isActive && !hasChildren ? 'rgba(59,130,246,0.18)' : 'transparent',
        '&:hover': {
          backgroundColor: isActive && !hasChildren ? 'rgba(59,130,246,0.22)' : 'rgba(255,255,255,0.06)',
        },
        transition: 'background-color 0.15s',
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: sidebarOpen ? 32 : 'auto',
          color: isActive ? '#60a5fa' : 'rgba(255,255,255,0.5)',
          justifyContent: 'center',
        }}
      >
        <Icon sx={{ fontSize: depth === 0 ? 20 : 17 }} />
      </ListItemIcon>
      {sidebarOpen && (
        <>
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              fontSize: depth === 0 ? '0.8125rem' : '0.775rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#e2e8f0' : 'rgba(255,255,255,0.6)',
              lineHeight: 1,
            }}
          />
          {hasChildren && (
            open
              ? <ExpandLessIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} />
              : <ExpandMoreIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} />
          )}
        </>
      )}
    </ListItemButton>
  );

  return (
    <>
      {sidebarOpen || !hasChildren ? (
        sidebarOpen ? btn : (
          <Tooltip title={item.label} placement="right" arrow>
            {btn}
          </Tooltip>
        )
      ) : (
        <Tooltip title={item.label} placement="right" arrow>
          {btn}
        </Tooltip>
      )}
      {hasChildren && sidebarOpen && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List dense disablePadding>
            {item.children.map((child) => (
              <SidebarItem key={child.href} item={child} sidebarOpen={sidebarOpen} depth={1} />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
}

function Sidebar() {
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);
  const user = useSelector((state) => state.auth.user);

  const filterMenu = (items) => {
    return items
      .filter((item) => checkItemPermission(user, item.href))
      .map((item) => {
        if (item.children) {
          const filteredChildren = filterMenu(item.children);
          return { ...item, children: filteredChildren };
        }
        return item;
      })
      .filter((item) => !item.children || item.children.length > 0);
  };

  const filteredGroups = menuGroups.map(g => ({
    ...g,
    items: filterMenu(g.items)
  })).filter(g => g.items.length > 0);

  return (
    <Box
      component="aside"
      sx={{
        width: sidebarOpen ? 220 : 56,
        minWidth: sidebarOpen ? 220 : 56,
        flexShrink: 0,
        height: '100%',
        backgroundColor: '#1e293b',
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'width 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {filteredGroups.map((group, gi) => (
        <Box key={group.label}>
          {gi > 0 && (
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: sidebarOpen ? 2 : 1, my: 0.5 }} />
          )}
          {sidebarOpen && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                px: 2,
                pt: gi === 0 ? 2 : 1.5,
                pb: 0.5,
                color: 'rgba(255,255,255,0.35)',
                fontWeight: 700,
                letterSpacing: '0.08em',
                fontSize: '0.65rem',
                textTransform: 'uppercase',
              }}
            >
              {group.label}
            </Typography>
          )}
          {!sidebarOpen && gi > 0 && <Box sx={{ pt: 1 }} />}
          {gi === 0 && !sidebarOpen && <Box sx={{ pt: 1.5 }} />}

          <List dense disablePadding sx={{ px: 1 }}>
            {group.items.map((item) => (
              <SidebarItem key={item.href} item={item} sidebarOpen={sidebarOpen} depth={0} />
            ))}
          </List>
        </Box>
      ))}

      <Box sx={{ flex: 1 }} />
      <Box sx={{ py: 1.5, px: 2, opacity: 0.3 }}>
        {sidebarOpen && (
          <Typography variant="caption" sx={{ color: '#fff', fontSize: '0.65rem' }}>
            v1.0.0
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default Sidebar;
