import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL?.trim();

const getApiUrl = () => {
  if (!rawApiUrl) {
    return '/api';
  }

  // Prevent production builds from calling a developer localhost backend.
  if (
    import.meta.env.PROD &&
    /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(rawApiUrl)
  ) {
    return '/api';
  }

  if (/\/api\/?$/i.test(rawApiUrl)) {
    return rawApiUrl.replace(/\/$/, '');
  }

  return `${rawApiUrl.replace(/\/$/, '')}/api`;
};

const API_URL = getApiUrl();

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (email, password, firstName, lastName) => {
    const response = await apiClient.post('/auth/register', {
      email,
      password,
      firstName,
      lastName,
    });
    return response.data;
  },
};

export default apiClient;
