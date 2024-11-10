import axios from 'axios';
import { logout } from '../context/AuthContext.js';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

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

// Request Interceptor with enhanced logging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Enhanced request logging
    logWithDetails('Request Details', {
      url: `${config.baseURL}${config.url}`,
      method: config.method?.toUpperCase(),
      headers: {
        ...config.headers,
        Authorization: token ? 'Bearer [REDACTED]' : 'None'
      },
      data: config.data ? JSON.stringify(config.data) : 'No data',
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

// Response Interceptor with enhanced error handling
api.interceptors.response.use(
  (response) => {
    logWithDetails('Successful Response', {
      url: response.config.url,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data ? JSON.stringify(response.data) : 'No data',
      timestamp: new Date().toISOString()
    });
    return response;
  },
  (error) => {
    const errorDetails = {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      requestData: error.config?.data,
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      timestamp: new Date().toISOString()
    };

    if (error.code === 'ECONNABORTED') {
      logWithDetails('Timeout Error', {
        ...errorDetails,
        timeout: error.config?.timeout
      });
      return Promise.reject({
        ...error,
        customMessage: `Request timed out after ${error.config?.timeout}ms. Please try again.`
      });
    }

    if (!error.response) {
      logWithDetails('Network Error', errorDetails);
      return Promise.reject({
        ...error,
        customMessage: 'Network error. Please check your connection.'
      });
    }

    // Enhanced error logging based on status
    switch (error.response.status) {
      case 401:
        logWithDetails('Authentication Error', {
          ...errorDetails,
          token: localStorage.getItem('token') ? 'Present' : 'Missing'
        });
        localStorage.removeItem('token');
        break;
        
      case 403:
        logWithDetails('Authorization Error', errorDetails);
        break;
        
      case 404:
        logWithDetails('Resource Not Found', {
          ...errorDetails,
          path: error.config?.url
        });
        break;
        
      case 500:
        logWithDetails('Server Error', {
          ...errorDetails,
          serverMessage: error.response?.data?.message,
          serverStack: error.response?.data?.stack
        });
        break;
        
      default:
        logWithDetails('API Error', errorDetails);
    }

    // Enhanced error details
    const customError = {
      ...error,
      customMessage: error.response?.data?.message || 'An error occurred. Please try again.',
      details: error.response?.data?.details,
      timestamp: new Date().toISOString()
    };

    return Promise.reject(customError);
  }
);

// Utility methods remain the same
api.isSuccess = (status) => status >= 200 && status < 300;
api.isError = (status) => status >= 400;
api.isServerError = (status) => status >= 500;

// Enhanced retry mechanism with logging
api.retryRequest = async (config, maxRetries = 3, delay = 1000) => {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      logWithDetails('Retry Attempt', {
        attempt: retries + 1,
        maxRetries,
        delay: delay * (retries + 1),
        endpoint: config.url
      });
      return await api(config);
    } catch (error) {
      retries++;
      logWithDetails('Retry Failed', {
        attempt: retries,
        maxRetries,
        error: error.message,
        willRetry: retries < maxRetries
      });
      if (retries === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * retries));
    }
  }
};

export default api;