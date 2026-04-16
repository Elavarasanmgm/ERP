import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Layout from './components/Shared/Layout';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';

// Accounting
import ChartOfAccounts from './pages/accounting/ChartOfAccounts';
import JournalEntries from './pages/accounting/JournalEntries';
import Invoices from './pages/accounting/Invoices';
import Payments from './pages/accounting/Payments';
import Customers from './pages/accounting/Customers';
import Suppliers from './pages/accounting/Suppliers';
import FinancialReports from './pages/accounting/FinancialReports';

// Inventory
import Items from './pages/inventory/Items';
import StockLevels from './pages/inventory/StockLevels';
import StockLocations from './pages/inventory/StockLocations';
import StockMovements from './pages/inventory/StockMovements';

// Orders / Purchase
import SalesOrders from './pages/orders/SalesOrders';
import PurchaseOrders from './pages/orders/PurchaseOrders';
import MaterialRequests from './pages/orders/MaterialRequests';
import SupplierQuotations from './pages/orders/SupplierQuotations';
import GoodsReceipts from './pages/orders/GoodsReceipts';
import SOTraceability from './pages/orders/SOTraceability';

// Manufacturing
import WorkOrders from './pages/manufacturing/WorkOrders';
import BillOfMaterials from './pages/manufacturing/BillOfMaterials';
import ProductionPlan from './pages/manufacturing/ProductionPlan';
import WIPKanban from './pages/manufacturing/WIPKanban';
import QualityChecks from './pages/manufacturing/QualityChecks';

// HR
import Employees from './pages/hr/Employees';
import Attendance from './pages/hr/Attendance';
import Leaves from './pages/hr/Leaves';
import Payroll from './pages/hr/Payroll';

// CRM
import Leads from './pages/crm/Leads';
import Opportunities from './pages/crm/Opportunities';
import Contacts from './pages/crm/Contacts';
import Activities from './pages/crm/Activities';

// Assets
import AssetList from './pages/assets/AssetList';
import DepreciationSchedule from './pages/assets/DepreciationSchedule';
import Maintenance from './pages/assets/Maintenance';
import AssetReports from './pages/assets/AssetReports';

// Quality
import Inspections from './pages/quality/Inspections';
import NonConformances from './pages/quality/NonConformances';
import CorrectiveActions from './pages/quality/CorrectiveActions';
import QualityMetrics from './pages/quality/QualityMetrics';

// Planning
import ProductionPlans from './pages/planning/ProductionPlans';
import MRPRuns from './pages/planning/MRPRuns';
import PlannedOrders from './pages/planning/PlannedOrders';
import CapacityPlanning from './pages/planning/CapacityPlanning';
import Forecasts from './pages/planning/Forecasts';

// Projects
import ProjectList from './pages/projects/ProjectList';
import Timesheets from './pages/projects/Timesheets';

// Supply Chain
import Vendors from './pages/supply-chain/Vendors';
import Requisitions from './pages/supply-chain/Requisitions';
import GoodsReceipt from './pages/supply-chain/GoodsReceipt';
import VendorPerformance from './pages/supply-chain/VendorPerformance';

// Master
import MasterSetup from './pages/master/MasterSetup';

const checkPermission = (user, module, subpage) => {
  if (!user || !user.permissions) return false;

  const perms = user.permissions;
  if (subpage) {
    return perms[module] && perms[module][subpage] === true;
  }

  if (typeof perms[module] === 'object' && perms[module] !== null) {
    return Object.values(perms[module]).some(v => v === true);
  }

  return perms[module] === true;
};

function ProtectedRoute({ children }) {
  const token = useSelector((state) => state.auth.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function PermissionRoute({ children, module, subpage }) {
  const user = useSelector((state) => state.auth.user);
  if (!checkPermission(user, module, subpage)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<PermissionRoute module="dashboard"><Dashboard /></PermissionRoute>} />
          <Route path="/profile" element={<Profile />} />

          {/* Accounting */}
          <Route path="/accounting/chart-of-accounts" element={<PermissionRoute module="accounting" subpage="accounts"><ChartOfAccounts /></PermissionRoute>} />
          <Route path="/accounting/journal-entries" element={<PermissionRoute module="accounting" subpage="entries"><JournalEntries /></PermissionRoute>} />
          <Route path="/accounting/invoices" element={<PermissionRoute module="accounting" subpage="invoices"><Invoices /></PermissionRoute>} />
          <Route path="/accounting/payments" element={<PermissionRoute module="accounting" subpage="payments"><Payments /></PermissionRoute>} />
          <Route path="/accounting/customers" element={<PermissionRoute module="accounting" subpage="customers"><Customers /></PermissionRoute>} />
          <Route path="/accounting/suppliers" element={<PermissionRoute module="accounting" subpage="suppliers"><Suppliers /></PermissionRoute>} />
          <Route path="/accounting/reports" element={<PermissionRoute module="accounting" subpage="reports"><FinancialReports /></PermissionRoute>} />
          <Route path="/accounting" element={<Navigate to="/accounting/journal-entries" replace />} />

          {/* Inventory */}
          <Route path="/inventory/items" element={<PermissionRoute module="inventory" subpage="items"><Items /></PermissionRoute>} />
          <Route path="/inventory/stock-levels" element={<PermissionRoute module="inventory" subpage="stock"><StockLevels /></PermissionRoute>} />
          <Route path="/inventory/stock-locations" element={<PermissionRoute module="inventory" subpage="locations"><StockLocations /></PermissionRoute>} />
          <Route path="/inventory/movements" element={<PermissionRoute module="inventory" subpage="movements"><StockMovements /></PermissionRoute>} />
          <Route path="/inventory" element={<Navigate to="/inventory/items" replace />} />

          {/* Orders */}
          <Route path="/orders/sales" element={<PermissionRoute module="orders" subpage="sales"><SalesOrders /></PermissionRoute>} />
          <Route path="/orders/purchase" element={<PermissionRoute module="orders" subpage="purchase"><PurchaseOrders /></PermissionRoute>} />
          <Route path="/orders/material-requests" element={<PermissionRoute module="orders" subpage="requests"><MaterialRequests /></PermissionRoute>} />
          <Route path="/orders/supplier-quotations" element={<PermissionRoute module="orders" subpage="quotes"><SupplierQuotations /></PermissionRoute>} />
          <Route path="/orders/goods-receipts" element={<PermissionRoute module="orders" subpage="receipts"><GoodsReceipts /></PermissionRoute>} />
          <Route path="/orders/traceability" element={<PermissionRoute module="orders" subpage="trace"><SOTraceability /></PermissionRoute>} />
          <Route path="/orders" element={<Navigate to="/orders/sales" replace />} />

          {/* Manufacturing */}
          <Route path="/manufacturing/work-orders" element={<PermissionRoute module="manufacturing" subpage="workorders"><WorkOrders /></PermissionRoute>} />
          <Route path="/manufacturing/bom" element={<PermissionRoute module="manufacturing" subpage="bom"><BillOfMaterials /></PermissionRoute>} />
          <Route path="/manufacturing/production-plan" element={<PermissionRoute module="manufacturing" subpage="planning"><ProductionPlan /></PermissionRoute>} />
          <Route path="/manufacturing/wip-kanban" element={<PermissionRoute module="manufacturing" subpage="kanban"><WIPKanban /></PermissionRoute>} />
          <Route path="/manufacturing/quality-checks" element={<PermissionRoute module="manufacturing" subpage="quality"><QualityChecks /></PermissionRoute>} />
          <Route path="/manufacturing" element={<Navigate to="/manufacturing/work-orders" replace />} />

          {/* HR */}
          <Route path="/hr/employees" element={<PermissionRoute module="hr" subpage="employees"><Employees /></PermissionRoute>} />
          <Route path="/hr/attendance" element={<PermissionRoute module="hr" subpage="attendance"><Attendance /></PermissionRoute>} />
          <Route path="/hr/leaves" element={<PermissionRoute module="hr" subpage="leaves"><Leaves /></PermissionRoute>} />
          <Route path="/hr/payroll" element={<PermissionRoute module="hr" subpage="payroll"><Payroll /></PermissionRoute>} />
          <Route path="/hr" element={<Navigate to="/hr/employees" replace />} />

          {/* CRM */}
          <Route path="/crm/leads" element={<PermissionRoute module="crm" subpage="leads"><Leads /></PermissionRoute>} />
          <Route path="/crm/opportunities" element={<PermissionRoute module="crm" subpage="opportunities"><Opportunities /></PermissionRoute>} />
          <Route path="/crm/contacts" element={<PermissionRoute module="crm" subpage="contacts"><Contacts /></PermissionRoute>} />
          <Route path="/crm/activities" element={<PermissionRoute module="crm" subpage="activities"><Activities /></PermissionRoute>} />
          <Route path="/crm" element={<Navigate to="/crm/leads" replace />} />

          {/* Assets */}
          <Route path="/assets/list" element={<PermissionRoute module="assets" subpage="list"><AssetList /></PermissionRoute>} />
          <Route path="/assets/depreciation" element={<PermissionRoute module="assets" subpage="depreciation"><DepreciationSchedule /></PermissionRoute>} />
          <Route path="/assets/maintenance" element={<PermissionRoute module="assets" subpage="maintenance"><Maintenance /></PermissionRoute>} />
          <Route path="/assets/reports" element={<PermissionRoute module="assets" subpage="reports"><AssetReports /></PermissionRoute>} />
          <Route path="/assets" element={<Navigate to="/assets/list" replace />} />

          {/* Quality */}
          <Route path="/quality/inspections" element={<PermissionRoute module="quality" subpage="inspections"><Inspections /></PermissionRoute>} />
          <Route path="/quality/non-conformances" element={<PermissionRoute module="quality" subpage="nonconformance"><NonConformances /></PermissionRoute>} />
          <Route path="/quality/corrective-actions" element={<PermissionRoute module="quality" subpage="corrective"><CorrectiveActions /></PermissionRoute>} />
          <Route path="/quality/metrics" element={<PermissionRoute module="quality" subpage="metrics"><QualityMetrics /></PermissionRoute>} />
          <Route path="/quality" element={<Navigate to="/quality/inspections" replace />} />

          {/* Planning */}
          <Route path="/planning/production-plans" element={<PermissionRoute module="planning" subpage="production"><ProductionPlans /></PermissionRoute>} />
          <Route path="/planning/mrp-runs" element={<PermissionRoute module="planning" subpage="mrp"><MRPRuns /></PermissionRoute>} />
          <Route path="/planning/planned-orders" element={<PermissionRoute module="planning" subpage="orders"><PlannedOrders /></PermissionRoute>} />
          <Route path="/planning/capacity" element={<PermissionRoute module="planning" subpage="capacity"><CapacityPlanning /></PermissionRoute>} />
          <Route path="/planning/forecasts" element={<PermissionRoute module="planning" subpage="forecasts"><Forecasts /></PermissionRoute>} />
          <Route path="/planning" element={<Navigate to="/planning/production-plans" replace />} />

          {/* Projects */}
          <Route path="/projects/list" element={<PermissionRoute module="projects" subpage="list"><ProjectList /></PermissionRoute>} />
          <Route path="/projects/timesheets" element={<PermissionRoute module="projects" subpage="timesheets"><Timesheets /></PermissionRoute>} />
          <Route path="/projects" element={<Navigate to="/projects/list" replace />} />

          {/* Supply Chain */}
          <Route path="/supply-chain/vendors" element={<PermissionRoute module="supplychain" subpage="vendors"><Vendors /></PermissionRoute>} />
          <Route path="/supply-chain/requisitions" element={<PermissionRoute module="supplychain" subpage="requisitions"><Requisitions /></PermissionRoute>} />
          <Route path="/supply-chain/goods-receipt" element={<PermissionRoute module="supplychain" subpage="receipts"><GoodsReceipt /></PermissionRoute>} />
          <Route path="/supply-chain/vendor-performance" element={<PermissionRoute module="supplychain" subpage="performance"><VendorPerformance /></PermissionRoute>} />
          <Route path="/supply-chain" element={<Navigate to="/supply-chain/vendors" replace />} />

          {/* Master */}
          <Route path="/master-setup" element={<PermissionRoute module="master"><MasterSetup /></PermissionRoute>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
