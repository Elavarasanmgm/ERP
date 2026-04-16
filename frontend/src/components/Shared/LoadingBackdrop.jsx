import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';

const LoadingBackdrop = ({ open }) => (
  <Backdrop
    open={!!open}
    sx={{
      color: '#fff',
      zIndex: (theme) => theme.zIndex.modal + 10,
      backdropFilter: 'blur(2px)',
      backgroundColor: 'rgba(15, 23, 42, 0.45)',
    }}
  >
    <CircularProgress
      size={48}
      thickness={4}
      sx={{ color: '#60a5fa' }}
    />
  </Backdrop>
);

export default LoadingBackdrop;
