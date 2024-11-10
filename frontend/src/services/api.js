import axios from 'axios';
import { logout } from '../context/AuthContext.js'; // Import the logout function

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

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
      console.error('Response error:', error.response.status, error.response.data);
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
let logoutHandler;

export const setLogoutHandler = (params) => {
  logoutHandler = logout;
};
export default api;