// frontend/src/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API functions
export const jobsAPI = {
  // Get all jobs with optional filters
  getJobs: async (params = {}) => {
    try {
      // Transform page_size to per_page for backend compatibility
      const backendParams = { ...params };
      if (backendParams.page_size) {
        backendParams.per_page = backendParams.page_size;
        delete backendParams.page_size;
      }
      
      console.log('🔍 Sending API params:', backendParams);
      
      const response = await api.get('/jobs', { params: backendParams });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch jobs');
    }
  },

  // Get single job by ID
  getJob: async (id) => {
    try {
      const response = await api.get(`/jobs/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch job');
    }
  },

  // Create new job
  createJob: async (jobData) => {
    try {
      const response = await api.post('/jobs/', jobData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create job');
    }
  },

  // Update existing job
  updateJob: async (id, jobData) => {
    try {
      const response = await api.put(`/jobs/${id}`, jobData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update job');
    }
  },

  // Delete job
  deleteJob: async (id) => {
    try {
      const response = await api.delete(`/jobs/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete job');
    }
  },

  // Get job statistics
  getStats: async () => {
    try {
      const response = await api.get('/jobs/stats');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch stats');
    }
  },

  // Get dynamic filter options based on current filters
  getFilterOptions: async (filters = {}) => {
    try {
      // Transform page_size to per_page and remove pagination params for filter options
      const filterParams = { ...filters };
      delete filterParams.page_size;
      delete filterParams.page;
      delete filterParams.sort; // Sort doesn't affect available options
      
      // Remove empty values
      const cleanParams = Object.fromEntries(
        Object.entries(filterParams).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
      );
      
      console.log('🎯 Getting filter options with params:', cleanParams);
      
      const response = await api.get('/jobs/filter-options', { params: cleanParams });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch filter options');
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw new Error('API health check failed');
    }
  }
};

export default api;