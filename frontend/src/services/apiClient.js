import axios from 'axios';
import { setLoading } from '../store/slices/uiSlice';

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

let store;

export const injectStore = (_store) => {
  store = _store;
};

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Start loading if store is available and request doesn't explicitly skip it
  if (store && config.showLoading !== false) {
    store.dispatch(setLoading(true));
  }
  
  return config;
});

// Handle 401/403 — clear session and redirect to login
apiClient.interceptors.response.use(
  (response) => {
    // Stop loading on success
    if (store && response.config.showLoading !== false) {
      store.dispatch(setLoading(false));
    }
    return response;
  },
  (error) => {
    // Stop loading on error
    if (store && error.config?.showLoading !== false) {
      store.dispatch(setLoading(false));
    }
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

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

export const notificationService = {
  getNotifications: async () => {
    const response = await apiClient.get('/notifications');
    return response.data;
  },
  markAsRead: async (id) => {
    const response = await apiClient.put(`/notifications/${id}/mark-read`);
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await apiClient.put('/notifications/mark-all-read');
    return response.data;
  },
  generateAlerts: async () => {
    const response = await apiClient.post('/notifications/generate-alerts');
    return response.data;
  }
};
