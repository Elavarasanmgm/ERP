import { useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import './Layout.css';

function Layout() {
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);

  return (
    <div className="layout">
      <Navbar />
      <div className="layout-content">
        <Sidebar />
        <main className={`main ${sidebarOpen ? '' : 'full-width'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
