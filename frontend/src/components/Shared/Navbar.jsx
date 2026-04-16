import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { toggleSidebar } from '../../store/slices/uiSlice';
import apiClient from '../../services/apiClient';

// MUI
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Badge from '@mui/material/Badge';
import Popover from '@mui/material/Popover';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

// MUI Icons
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import BusinessIcon from '@mui/icons-material/Business';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import InventoryIcon from '@mui/icons-material/Inventory';

const POLL_INTERVAL = 60000; // 60 seconds

function stringAvatar(name) {
  if (!name) return { children: 'U' };
  const parts = name.trim().split(' ');
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`
    : parts[0][0];
  return { children: initials.toUpperCase() };
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function NotifIcon({ type }) {
  const props = { sx: { fontSize: 18 } };
  if (type === 'Warning')  return <WarningAmberIcon    {...props} sx={{ ...props.sx, color: '#d97706' }} />;
  if (type === 'Error')    return <ErrorOutlineIcon    {...props} sx={{ ...props.sx, color: '#dc2626' }} />;
  if (type === 'Success')  return <CheckCircleOutlineIcon {...props} sx={{ ...props.sx, color: '#16a34a' }} />;
  return                          <InfoOutlinedIcon    {...props} sx={{ ...props.sx, color: '#2563eb' }} />;
}

function NotificationPanel({ anchorEl, onClose, notifications, loading, onMarkRead, onMarkAllRead, unreadCount, onShowDetail }) {
  const open = Boolean(anchorEl);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      PaperProps={{
        sx: {
          mt: 1, width: 380, maxHeight: 500, borderRadius: 2.5,
          border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2.5, py: 1.75, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid #f1f5f9', bgcolor: '#fafafa' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>Notifications</Typography>
          {unreadCount > 0 && (
            <Chip label={unreadCount} size="small"
              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#dc2626', color: '#fff', minWidth: 20 }} />
          )}
        </Box>
        {unreadCount > 0 && (
          <Button size="small" startIcon={<DoneAllIcon sx={{ fontSize: 14 }} />}
            onClick={onMarkAllRead}
            sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600, color: '#2563eb', py: 0.25 }}>
            Mark all read
          </Button>
        )}
      </Box>

      {/* Body */}
      <Box sx={{ overflowY: 'auto', flex: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress size={28} sx={{ color: '#2563eb' }} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <NotificationsNoneOutlinedIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
            <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 500 }}>
              No notifications
            </Typography>
          </Box>
        ) : (
          notifications.map((n, idx) => (
            <Box key={n.id}>
              <Box
                onClick={() => onShowDetail(n)}
                sx={{
                  px: 2.5, py: 1.75, display: 'flex', gap: 1.5, alignItems: 'flex-start',
                  bgcolor: n.is_read ? 'transparent' : '#eff6ff',
                  cursor: 'pointer',
                  transition: 'background .15s',
                  '&:hover': { bgcolor: n.is_read ? '#f8fafc' : '#dbeafe' },
                }}
              >
                {/* Icon */}
                <Box sx={{ mt: 0.25, flexShrink: 0,
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: n.type === 'Warning' ? '#fffbeb' : n.type === 'Error' ? '#fef2f2' : '#eff6ff',
                }}>
                  {n.reference_type === 'LOW_STOCK'
                    ? <InventoryIcon sx={{ fontSize: 16, color: '#d97706' }} />
                    : <NotifIcon type={n.type} />
                  }
                </Box>

                {/* Content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: n.is_read ? 500 : 700, color: '#1e293b', fontSize: '0.8rem', lineHeight: 1.4 }}>
                      {n.title}
                    </Typography>
                    {!n.is_read && (
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#2563eb', flexShrink: 0, mt: 0.5 }} />
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ color: '#64748b', lineHeight: 1.4, display: 'block', mt: 0.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {n.message}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', mt: 0.5, display: 'block' }}>
                    {timeAgo(n.created_date)}
                  </Typography>
                </Box>
              </Box>
              {idx < notifications.length - 1 && <Divider sx={{ mx: 2.5 }} />}
            </Box>
          ))
        )}
      </Box>
    </Popover>
  );
}

function Navbar() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const user       = useSelector((state) => state.auth.user);
  const token      = useSelector((state) => state.auth.token);
  const [anchorEl,      setAnchorEl]      = useState(null);
  const [notifAnchor,   setNotifAnchor]   = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading,  setNotifLoading]  = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const pollRef = useRef(null);

  const fullName    = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : '';
  const displayName = fullName || user?.email || 'User';
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      // First generate any new stock alerts, then fetch all
      await apiClient.post('/notifications/generate-alerts').catch(() => {});
      const res = await apiClient.get('/notifications');
      setNotifications(res.data || []);
    } catch {}
  }, [token]);

  // Initial fetch + polling
  useEffect(() => {
    if (!token) return;
    fetchNotifications();
    pollRef.current = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [token, fetchNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await apiClient.put(`/notifications/${id}/mark-read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.put('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleOpenNotif = (e) => {
    setNotifAnchor(e.currentTarget);
    setNotifLoading(true);
    fetchNotifications().finally(() => setNotifLoading(false));
  };

  const handleShowDetail = (n) => {
    setSelectedNotif(n);
    if (!n.is_read) handleMarkRead(n.id);
  };

  const handleLogout = () => {
    setAnchorEl(null);
    dispatch(logout());
    navigate('/login');
  };

  return (
    <AppBar position="static" elevation={0}
      sx={{ backgroundColor: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.08)', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar sx={{ minHeight: '60px !important', px: { xs: 2, sm: 3 } }}>
        {/* Hamburger */}
        <IconButton edge="start" color="inherit" onClick={() => dispatch(toggleSidebar())}
          sx={{ mr: 1.5, color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff', backgroundColor: 'rgba(255,255,255,0.08)' } }}>
          <MenuIcon />
        </IconButton>

        {/* Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 3 }}>
          <BusinessIcon sx={{ color: '#3b82f6', fontSize: 26 }} />
          <Typography variant="h6"
            sx={{ fontWeight: 800, letterSpacing: '-0.3px', color: '#f1f5f9', fontSize: '1.2rem' }}>
            DIMA
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }} />

        {/* Notification Bell */}
        <Tooltip title="Notifications">
          <IconButton onClick={handleOpenNotif}
            sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#fff', backgroundColor: 'rgba(255,255,255,0.08)' }, mr: 0.5 }}>
            <Badge badgeContent={unreadCount} max={99}
              sx={{ '& .MuiBadge-badge': { bgcolor: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 700, minWidth: 18, height: 18 } }}>
              {unreadCount > 0
                ? <NotificationsActiveIcon sx={{ fontSize: 22, color: '#fbbf24' }} />
                : <NotificationsNoneOutlinedIcon />
              }
            </Badge>
          </IconButton>
        </Tooltip>

        {/* User avatar + menu */}
        <Tooltip title="Account">
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5, ml: 0.5 }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: '#3b82f6', fontSize: '0.8rem', fontWeight: 700 }}
              {...stringAvatar(displayName)} />
          </IconButton>
        </Tooltip>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{ elevation: 3, sx: { mt: 1, minWidth: 220, borderRadius: 2, border: '1px solid #e2e8f0',
            '& .MuiMenuItem-root': { fontSize: '0.875rem', py: 1 } } }}>
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>{displayName}</Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>{user?.email}</Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip label={user?.role || 'User'} size="small"
                sx={{ fontSize: '0.7rem', height: 20, bgcolor: '#eff6ff', color: '#1d4ed8' }} />
            </Box>
          </Box>
          <Divider />
          <MenuItem component={Link} to="/profile" onClick={() => setAnchorEl(null)}>
            <ListItemIcon><AccountCircleOutlinedIcon fontSize="small" /></ListItemIcon>
            My Profile
          </MenuItem>
          <MenuItem component={Link} to="/master-setup" onClick={() => setAnchorEl(null)}>
            <ListItemIcon><SettingsOutlinedIcon fontSize="small" /></ListItemIcon>
            Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: '#dc2626' }}>
            <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: '#dc2626' }} /></ListItemIcon>
            Sign Out
          </MenuItem>
        </Menu>

        {/* Notification Panel */}
        <NotificationPanel
          anchorEl={notifAnchor}
          onClose={() => setNotifAnchor(null)}
          notifications={notifications}
          loading={notifLoading}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          unreadCount={unreadCount}
          onShowDetail={handleShowDetail}
        />

        {/* Notification Detail Dialog */}
        <Dialog 
          open={Boolean(selectedNotif)} 
          onClose={() => setSelectedNotif(null)}
          PaperProps={{ sx: { borderRadius: 3, width: '100%', maxWidth: 450 } }}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1, pt: 3, px: 3 }}>
            <Box sx={{ 
              width: 40, height: 40, borderRadius: '50%', display: 'flex', 
              alignItems: 'center', justifyContent: 'center',
              bgcolor: selectedNotif?.type === 'Warning' ? '#fffbeb' : selectedNotif?.type === 'Error' ? '#fef2f2' : '#eff6ff'
            }}>
              {selectedNotif && (
                selectedNotif.reference_type === 'LOW_STOCK' 
                  ? <InventoryIcon sx={{ color: '#d97706' }} />
                  : <NotifIcon type={selectedNotif.type} />
              )}
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
              {selectedNotif?.title}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ px: 3, pb: 3 }}>
            <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.6, mb: 2 }}>
              {selectedNotif?.message}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
              Received: {selectedNotif && new Date(selectedNotif.created_date).toLocaleString()}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setSelectedNotif(null)} variant="contained" sx={{ px: 4, bgcolor: '#1e293b', '&:hover': { bgcolor: '#0f172a' } }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
