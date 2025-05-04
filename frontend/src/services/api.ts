import axios from 'axios';
import config from '../config';

// Create an Axios instance with default configuration
const api = axios.create({
  baseURL: config.apiBaseUrl, // This will be proxied to the API Gateway
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add authentication headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle errors globally
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Vehicle Service
export const vehicleService = {
  getAll: () => api.get(config.endpoints.vehicles),
  getById: (id: string) => api.get(`${config.endpoints.vehicles}/${id}`),
  create: (data: any) => api.post(config.endpoints.vehicles, data),
  update: (id: string, data: any) => api.put(`${config.endpoints.vehicles}/${id}`, data),
  delete: (id: string) => api.delete(`${config.endpoints.vehicles}/${id}`),
};

// Tracking Service
export const trackingService = {
  getLocations: () => api.get(`${config.endpoints.tracking}/location`),
  getVehicleLocation: (id: string) => api.get(`${config.endpoints.tracking}/vehicles/${id}/location`),
  getVehicleHistory: (id: string, params?: any) => api.get(`${config.endpoints.tracking}/vehicles/${id}/history`, { params }),
};

// Maintenance Service
export const maintenanceService = {
  getRecords: () => api.get(`${config.endpoints.maintenance}/records`),
  getVehicleRecords: (id: string) => api.get(`${config.endpoints.maintenance}/vehicles/${id}/records`),
  addRecord: (data: any) => api.post(`${config.endpoints.maintenance}/records`, data),
  updateRecord: (id: string, data: any) => api.put(`${config.endpoints.maintenance}/records/${id}`, data),
  deleteRecord: (id: string) => api.delete(`${config.endpoints.maintenance}/records/${id}`),
  getSchedule: () => api.get(`${config.endpoints.maintenance}/schedule`),
};

// Analytics Service
export const analyticsService = {
  getFleetAnalytics: () => api.get(`${config.endpoints.analytics}/fleet`),
  getVehicleAnalytics: (id: string) => api.get(`${config.endpoints.analytics}/vehicles/${id}`),
  getUsageStatistics: () => api.get(`${config.endpoints.analytics}/usage`),
  getMaintenanceStatistics: () => api.get(`${config.endpoints.analytics}/maintenance`),
  getCostAnalysis: (params?: any) => api.get(`${config.endpoints.analytics}/costs`, { params }),
};

// Simulator Service
export const simulatorService = {
  getSimulations: () => api.get(`${config.endpoints.simulator}/simulations`),
  getSimulation: (id: string) => api.get(`${config.endpoints.simulator}/simulations/${id}`),
  createSimulation: (data: any) => api.post(`${config.endpoints.simulator}/simulations`, data),
  updateSimulation: (id: string, data: any) => api.put(`${config.endpoints.simulator}/simulations/${id}`, data),
  deleteSimulation: (id: string) => api.delete(`${config.endpoints.simulator}/simulations/${id}`),
  startSimulation: (id: string) => api.post(`${config.endpoints.simulator}/simulations/${id}/start`),
  stopSimulation: (id: string) => api.post(`${config.endpoints.simulator}/simulations/${id}/stop`),
};

export default {
  vehicle: vehicleService,
  tracking: trackingService,
  maintenance: maintenanceService,
  analytics: analyticsService,
  simulator: simulatorService,
}; 