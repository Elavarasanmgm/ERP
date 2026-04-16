import { useDispatch } from 'react-redux';
import { addNotification } from '../store/slices/uiSlice';

export const useAlert = () => {
  const dispatch = useDispatch();

  const showAlert = (message, severity = 'info') => {
    const id = Date.now();
    dispatch(addNotification({ id, message, severity }));
  };

  const success = (message) => showAlert(message, 'success');
  const error   = (message) => showAlert(message, 'error');
  const warning = (message) => showAlert(message, 'warning');
  const info    = (message) => showAlert(message, 'info');

  return { success, error, warning, info };
};
