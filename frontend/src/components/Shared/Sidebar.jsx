import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);

  const menuItems = [
    { label: 'Dashboard', icon: '📊', href: '/dashboard' },
    { label: 'Accounting', icon: '💰', href: '/accounting' },
    { label: 'Inventory', icon: '📦', href: '/inventory' },
    { label: 'Orders', icon: '📋', href: '/orders' },
    { label: 'Manufacturing', icon: '⚙️', href: '/manufacturing' },
    { label: 'Projects', icon: '📁', href: '/projects' },
    { label: 'HR', icon: '👥', href: '/hr' },
    { label: 'CRM', icon: '💼', href: '/crm' },
    { label: 'Assets', icon: '🏢', href: '/assets' },
    { label: 'Supply Chain', icon: '🚚', href: '/supply-chain' },
    { label: 'Quality', icon: '✅', href: '/quality' },
    { label: 'Planning', icon: '📈', href: '/planning' },
  ];

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link key={item.href} to={item.href} className="nav-item">
            <span className="icon">{item.icon}</span>
            {sidebarOpen && <span className="label">{item.label}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
