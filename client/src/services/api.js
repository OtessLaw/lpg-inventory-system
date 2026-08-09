import axios from 'axios';

// Automatically uses environment API URL in cloud production (e.g., Render) or /api proxy in local development
const baseURL = import.meta.env.VITE_API_URL || '/api';

const API = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lpg_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to catch 401 unauthenticated errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('lpg_token');
      localStorage.removeItem('lpg_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
