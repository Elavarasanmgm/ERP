import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [userMenu, setUserMenu] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button onClick={() => dispatch(toggleSidebar())} className="menu-btn">
          ☰
        </button>
        <h1>ERP System</h1>
      </div>
      <div className="navbar-right">
        <div className="user-menu">
          <button onClick={() => setUserMenu(!userMenu)} className="user-btn">
            👤
          </button>
          {userMenu && (
            <div className="dropdown">
              <a href="/profile">Profile</a>
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
