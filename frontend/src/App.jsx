import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Shared/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Accounting from './pages/Accounting';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import Manufacturing from './pages/Manufacturing';
import Projects from './pages/Projects';
import HR from './pages/HR';
import CRM from './pages/CRM';
import Assets from './pages/Assets';
import SupplyChain from './pages/SupplyChain';
import Quality from './pages/Quality';
import Planning from './pages/Planning';

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
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/accounting" element={<Accounting />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/manufacturing" element={<Manufacturing />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/hr" element={<HR />} />
          <Route path="/crm" element={<CRM />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/supply-chain" element={<SupplyChain />} />
          <Route path="/quality" element={<Quality />} />
          <Route path="/planning" element={<Planning />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
