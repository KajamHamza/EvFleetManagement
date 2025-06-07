
import axios, { AxiosRequestConfig, AxiosInstance, AxiosResponse } from 'axios';

// Create a base API client
const apiClient: AxiosInstance = axios.create({
  baseURL: '/api', // Use the proxied path which will be handled by Vite's dev server
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // outside the range of 2xx
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to login if unauthorized
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
