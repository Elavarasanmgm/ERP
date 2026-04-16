import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Warning } from '@mui/icons-material';
import { loginStart, loginSuccess, loginFailure, clearError } from '../store/slices/authSlice';
import { authService } from '../services/apiClient';
import '../styles/auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  const handleLogin = async (e) => {
    e.preventDefault();
    dispatch(loginStart());

    try {
      const data = await authService.login(email, password);
      dispatch(loginSuccess({ token: data.token, user: data.user }));
      navigate('/dashboard');
    } catch (err) {
      dispatch(loginFailure(err.response?.data?.error || 'Login failed'));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>DIMA</h1>
        <h2>Login</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (error) dispatch(clearError()); }}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (error) dispatch(clearError()); }}
              required
            />
          </div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="auth-warning">
          <Warning className="warning-icon" />
          <p>Having trouble logging in? Please reach out to the administrator.</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
