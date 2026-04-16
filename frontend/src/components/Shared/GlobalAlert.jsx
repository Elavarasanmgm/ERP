import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Slide from '@mui/material/Slide';
import { removeNotification } from '../../store/slices/uiSlice';

function SlideUp(props) {
  return <Slide {...props} direction="up" />;
}

const GlobalAlert = () => {
  const dispatch      = useDispatch();
  const notifications = useSelector((state) => state.ui.notifications);

  const [current, setCurrent] = useState(null);
  const [count,   setCount]   = useState(1);
  const [open,    setOpen]    = useState(false);
  const [bump,    setBump]    = useState(false);

  // Use refs to access latest values inside effects without stale closures
  const currentRef = useRef(null);
  const openRef    = useRef(false);
  const autoTimer  = useRef(null);

  const resetTimer = () => {
    clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(() => setOpen(false), 4000);
  };

  useEffect(() => {
    if (notifications.length === 0) return;

    // Process only the oldest unprocessed notification
    const next = notifications[0];

    const isSame =
      openRef.current &&
      currentRef.current &&
      currentRef.current.severity === next.severity &&
      currentRef.current.message  === next.message;

    if (isSame) {
      // Absorb duplicate — bump count, reset timer
      dispatch(removeNotification(next.id));
      setCount(c => c + 1);
      setBump(true);
      setTimeout(() => setBump(false), 300);
      resetTimer();
    } else if (!openRef.current) {
      // Nothing showing — display this one
      currentRef.current = next;
      setCurrent(next);
      setCount(1);
      setOpen(true);
      openRef.current = true;
      resetTimer();
    }
    // else: different message while one is showing — leave in queue, will show after exit
  }, [notifications]);

  const handleClose = (_, reason) => {
    if (reason === 'clickaway') return;
    clearTimeout(autoTimer.current);
    setOpen(false);
    openRef.current = false;
  };

  const handleExited = () => {
    if (currentRef.current) {
      dispatch(removeNotification(currentRef.current.id));
    }
    currentRef.current = null;
    setCurrent(null);
    setCount(1);
    openRef.current = false;
  };

  return (
    <Snackbar
      open={open}
      onClose={handleClose}
      TransitionComponent={SlideUp}
      TransitionProps={{ onExited: handleExited }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      sx={{ mb: 1, mr: 1 }}
    >
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        {/* Count badge — top LEFT */}
        {count > 1 && (
          <Box
            sx={{
              position: 'absolute',
              top: -9,
              left: -9,
              minWidth: 22,
              height: 22,
              borderRadius: '11px',
              bgcolor: '#1e293b',
              color: '#fff',
              fontSize: '0.68rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              px: 0.75,
              boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
              border: '2px solid #fff',
              transform: bump ? 'scale(1.4)' : 'scale(1)',
              transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
              zIndex: 10,
            }}
          >
            {count}×
          </Box>
        )}

        <Alert
          onClose={handleClose}
          severity={current?.severity || 'info'}
          variant="filled"
          sx={{
            minWidth: 300,
            maxWidth: 420,
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
            borderRadius: '10px',
            fontWeight: 500,
            fontSize: '0.875rem',
            alignItems: 'center',
          }}
        >
          {current?.message}
        </Alert>
      </Box>
    </Snackbar>
  );
};

export default GlobalAlert;
