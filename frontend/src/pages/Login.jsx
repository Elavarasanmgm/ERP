import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/authSlice';
import { authService } from '../services/apiClient';
import '../styles/auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    dispatch(loginStart());

    try {
      const data = await authService.login(email, password);
      dispatch(loginSuccess({ token: data.token, user: data.user }));
      navigate('/dashboard');
    } catch (error) {
      dispatch(loginFailure(error.response?.data?.error || 'Login failed'));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>ERP System</h1>
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password"
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Login</button>
        </form>
        <p>
          Don&apos;t have an account? <a href="/register">Register</a>
        </p>
      </div>
    </div>
  );
}

export default Login;
