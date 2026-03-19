import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Create axios instance with base configuration
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

console.log('🔌 API Base URL:', apiBaseUrl); // Debug log

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 60000, // 60s — allows file uploads to DO Spaces to complete
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Attach JWT token to every request
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
