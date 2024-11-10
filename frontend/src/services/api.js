import axios from 'axios';
import { logout as defaultLogout } from '../context/AuthContext.js';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

// Logout handler configuration
let logoutHandler = defaultLogout;

export const setLogoutHandler = (handler) => {
  logoutHandler = handler || defaultLogout;
};

// API route configuration
export const API_ROUTES = {
  statistics: {
    base: '/users/statistics',  // Update base path
    analysis: {
      conclusion: '/users/statistics/analysis/conclusion',
      body: (timestamp) => `/users/statistics/analysis/body-${timestamp}`,
      section: (id) => `/users/statistics/analysis/${id}`,
    },
    errors: '/users/statistics/errors',
    completeness: '/users/statistics/completeness',
    monthly: '/users/statistics/monthly',
    writingStats: '/users/statistics/writing-stats'  // Update writing stats path
  }
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60-second timeout
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Making request to:', `${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

let logoutHandler;

export const setLogoutHandler = (params) => {
  logoutHandler = logout;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401 && logoutHandler) {
      logoutHandler(); // Call the logout function when a 401 response is received
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timed out');
    } else if (!error.response) {
      console.error('Network error:', error.message);
    } else {
      // Handle specific HTTP errors
      switch (error.response.status) {
        case 401:
          logWithDetails('Authentication Error', errorDetails);
          localStorage.removeItem('token');
          logoutHandler(); // Use the configured logout handler
          break;

        case 403:
          logWithDetails('Authorization Error', errorDetails);
          break;

        case 404:
          logWithDetails('Resource Not Found', {
            ...errorDetails,
            path: originalRequest?.url
          });
          break;

        case 429:
          logWithDetails('Rate Limit Error', errorDetails);
          if (retryCount < RETRY_CONFIG.maxRetries) {
            const delay = getRetryDelay(retryCount);
            await new Promise(resolve => setTimeout(resolve, delay));
            originalRequest._retryCount = retryCount + 1;
            return api(originalRequest);
          }
          break;

        case 500:
          logWithDetails('Server Error', {
            ...errorDetails,
            serverMessage: error.response?.data?.message
          });
          break;

        default:
          logWithDetails('API Error', errorDetails);
      }
    }

    return Promise.reject(error);
  }
);

export default api;