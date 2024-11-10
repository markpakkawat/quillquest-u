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
  timeout: 60000,
  withCredentials: true
});

// Enhanced logging function
const logWithDetails = (type, data) => {
  console.log(`\n=== ${type} ===`);
  Object.entries(data).forEach(([key, value]) => {
    console.log(`${key}:`, typeof value === 'object' ? 
      JSON.stringify(value, null, 2) : value);
  });
};

// Request retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2
};

// Calculate exponential backoff delay
const getRetryDelay = (retryCount) => {
  const delay = RETRY_CONFIG.initialDelay * 
    Math.pow(RETRY_CONFIG.backoffFactor, retryCount);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
};

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    logWithDetails('Request Details', {
      url: `${config.baseURL}${config.url}`,
      method: config.method?.toUpperCase(),
      headers: {
        ...config.headers,
        Authorization: token ? 'Bearer [REDACTED]' : 'None'
      },
      data: config.data ? 'No data' : null,
      timestamp: new Date().toISOString()
    });

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    logWithDetails('Request Configuration Error', {
      message: error.message,
      config: error.config,
      stack: error.stack
    });
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    logWithDetails('Successful Response', {
      url: response.config.url,
      status: response.status,
      statusText: response.statusText,
      data: response.data ? 'Data received' : 'No data',
      timestamp: new Date().toISOString()
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const retryCount = originalRequest._retryCount || 0;

    const errorDetails = {
      url: originalRequest?.url,
      method: originalRequest?.method?.toUpperCase(),
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      timestamp: new Date().toISOString(),
      retryCount
    };

    // Handle different error types
    if (error.code === 'ECONNABORTED') {
      logWithDetails('Timeout Error', {
        ...errorDetails,
        timeout: originalRequest?.timeout
      });
      console.error('Request timed out');
    } else if (!error.response) {
      logWithDetails('Network Error', errorDetails);
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

// Writing analysis specific methods
api.writingAnalysis = {
  getConclusion: () => 
    api.get(API_ROUTES.statistics.analysis.conclusion),
  
  getBody: (timestamp) => 
    api.get(API_ROUTES.statistics.analysis.body(timestamp)),
  
  getSection: (sectionId) => 
    api.get(API_ROUTES.statistics.analysis.section(sectionId)),
  
  save: (sectionId, data) => 
    api.post(API_ROUTES.statistics.analysis.section(sectionId), data)
};

// Statistics specific methods
api.statistics = {
  getErrors: () => 
    api.get(API_ROUTES.statistics.errors),
  
  saveErrors: (data) => 
    api.post(API_ROUTES.statistics.errors, data),
  
  getMonthly: () => 
    api.get(API_ROUTES.statistics.monthly),
  
  saveCompleteness: (data) => 
    api.post(API_ROUTES.statistics.completeness, data),
  
  getWritingStats: () => 
    api.get(API_ROUTES.statistics.writingStats)
};

// Utility methods
api.isSuccess = (status) => status >= 200 && status < 300;
api.isError = (status) => status >= 400;
api.isServerError = (status) => status >= 500;
api.isRetryable = (error) => {
  if (!error.response) return true;
  return error.response.status >= 500 || error.response.status === 429;
};

export default api;