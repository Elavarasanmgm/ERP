import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Box from '@mui/material/Box';
import GlobalAlert from './GlobalAlert';
import LoadingBackdrop from './LoadingBackdrop';

function Layout() {
  const loading = useSelector((state) => state.ui.loading);

  return (
    // Lock the entire layout to the viewport — nothing outside scrolls
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', bgcolor: '#f8fafc' }}>
      <LoadingBackdrop open={loading} />
      {/* Navbar — fixed height at top */}
      <Navbar />

      {/* Body row — fills remaining viewport height */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Sidebar — full height, scrolls its own content if needed */}
        <Sidebar />

        {/* Main content — only this area scrolls */}
        <Box
          component="main"
          sx={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            p: { xs: 2, sm: 3 },
            minWidth: 0,
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {/* Toast Notifications */}
      <GlobalAlert />
    </Box>
  );
}

export default Layout;
