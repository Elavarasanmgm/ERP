import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { loginStart, loginFailure } from '../store/slices/authSlice';
import { authService } from '../services/apiClient';
import '../styles/auth.css';

function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    dispatch(loginStart());

    try {
      await authService.register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName
      );
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      dispatch(loginFailure(error.response?.data?.error || 'Registration failed'));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>ERP System</h1>
        <h2>Register</h2>
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input 
              type="text" 
              id="firstName"
              name="firstName"
              value={formData.firstName} 
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input 
              type="text" 
              id="lastName"
              name="lastName"
              value={formData.lastName} 
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email"
              name="email"
              value={formData.email} 
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password"
              name="password"
              value={formData.password} 
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit">Register</button>
        </form>
        <p>
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
}

export default Register;
