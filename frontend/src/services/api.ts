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
    // Debug the request
    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      params: config.params,
      data: config.data,
    });
    
    // You can add authentication headers here if needed
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    // Debug the response
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    
    return response;
  },
  (error) => {
    // Handle errors globally
    console.error('API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message
    });
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
  // Location
  getLocations: () => api.get(`${config.endpoints.tracking}/location`),
  getVehicleLocation: (id: string) => api.get(`${config.endpoints.tracking}/vehicles/${id}/location`),
  getVehicleHistory: (id: string, params?: any) => api.get(`${config.endpoints.tracking}/vehicles/${id}/history`, { params }),
  findNearbyVehicles: (params: { longitude: number, latitude: number, radius?: number }) => 
    api.get(`${config.endpoints.tracking}/nearby`, { params }),
  
  // Status
  getVehicleStatus: (id: string) => api.get(`${config.endpoints.tracking}/vehicles/${id}/status`),
  getStatusHistory: (id: string, params?: any) => api.get(`${config.endpoints.tracking}/vehicles/${id}/status/history`, { params }),
  getVehiclesByStatus: (statusType: string, params?: any) => api.get(`${config.endpoints.tracking}/status/${statusType}`, { params }),
  recordStatus: (data: any) => api.post(`${config.endpoints.tracking}/status`, data),
  
  // Events
  getVehicleEvents: (id: string, params?: any) => api.get(`${config.endpoints.tracking}/vehicles/${id}/events`, { params }),
  getRecentEventsByType: (eventType: string, params?: any) => api.get(`${config.endpoints.tracking}/events/${eventType}`, { params }),
  getTripEvents: (tripId: string) => api.get(`${config.endpoints.tracking}/trips/${tripId}/events`),
  recordEvent: (data: any) => api.post(`${config.endpoints.tracking}/events`, data),
};

// Maintenance Service
export const maintenanceService = {
  // Maintenance Records
  getRecords: (params?: any) => api.get(`${config.endpoints.maintenance}/records`, { params }),
  getRecordById: (id: string) => api.get(`${config.endpoints.maintenance}/records/${id}`),
  getVehicleRecords: (vehicleId: string, params?: any) => api.get(`${config.endpoints.maintenance}/vehicles/${vehicleId}/records`, { params }),
  createRecord: (data: any) => api.post(`${config.endpoints.maintenance}/records`, data),
  updateRecord: (id: string, data: any) => api.put(`${config.endpoints.maintenance}/records/${id}`, data),
  deleteRecord: (id: string) => api.delete(`${config.endpoints.maintenance}/records/${id}`),
  
  // Maintenance Schedules
  getSchedules: (params?: any) => api.get(`${config.endpoints.maintenance}/schedules`, { params }),
  getScheduleById: (id: string) => api.get(`${config.endpoints.maintenance}/schedules/${id}`),
  getVehicleSchedules: (vehicleId: string, params?: any) => api.get(`${config.endpoints.maintenance}/vehicles/${vehicleId}/schedules`, { params }),
  createSchedule: (data: any) => api.post(`${config.endpoints.maintenance}/schedules`, data),
  updateSchedule: (id: string, data: any) => api.put(`${config.endpoints.maintenance}/schedules/${id}`, data),
  deleteSchedule: (id: string) => api.delete(`${config.endpoints.maintenance}/schedules/${id}`),
  
  // Special schedule endpoints - now correctly ordered in the backend
  getUpcomingSchedules: (params?: any) => api.get(`${config.endpoints.maintenance}/schedules/upcoming`, { params }),
  getOverdueSchedules: (params?: any) => api.get(`${config.endpoints.maintenance}/schedules/overdue`, { params }),
  updateOverdueSchedules: () => api.post(`${config.endpoints.maintenance}/schedules/update-overdue`),
  
  // Maintenance Statistics - now using the correct path
  getMaintenanceStats: () => api.get(`${config.endpoints.maintenance}/stats`),
};

// Analytics Service
export const analyticsService = {
  getFleetAnalytics: (params?: { startDate?: string; endDate?: string; period?: string }) => 
    api.get(config.endpoints.analytics + '/fleet', { params }),
  getVehicleAnalytics: (id: string, params?: { startDate?: string; endDate?: string; period?: string }) => 
    api.get(`${config.endpoints.analytics}/vehicles/${id}`, { params }),
  getUtilizationAnalytics: (params?: { startDate?: string; endDate?: string; period?: string }) => 
    api.get(`${config.endpoints.analytics}/utilization`, { params }),
  getCostAnalytics: (params?: { startDate?: string; endDate?: string; period?: string }) => 
    api.get(`${config.endpoints.analytics}/cost`, { params }),
  getVehicleUsageStats: (vehicleId: string, params?: { startDate?: string; endDate?: string; limit?: number }) => 
    api.get(`${config.endpoints.analytics}/usage/${vehicleId}`, { params }),
  getPerformanceMetrics: (vehicleId: string, params?: { metricType?: string; startDate?: string; endDate?: string; limit?: number }) => 
    api.get(`${config.endpoints.analytics}/metrics/${vehicleId}`, { params }),
  getMetricTrends: (vehicleId: string, params?: { metricType?: string; startDate?: string; endDate?: string; interval?: string }) => 
    api.get(`${config.endpoints.analytics}/trends/${vehicleId}`, { params }),
  compareVehicleToFleet: (vehicleId: string, params?: { metricType?: string; startDate?: string; endDate?: string }) => 
    api.get(`${config.endpoints.analytics}/compare/${vehicleId}`, { params }),
  getReports: (params?: { reportType?: string; period?: string; vehicleId?: string; limit?: number }) => 
    api.get(`${config.endpoints.analytics}/reports`, { params }),
};

// Simulator Service
export const simulatorService = {
  // Simulation management
  getSimulations: () => api.get(`${config.endpoints.simulator}/simulations`),
  getSimulation: (id: string) => api.get(`${config.endpoints.simulator}/simulations/${id}`),
  createSimulation: (data: any) => api.post(`${config.endpoints.simulator}/simulations`, data),
  updateSimulation: (id: string, data: any) => api.put(`${config.endpoints.simulator}/simulations/${id}`, data),
  deleteSimulation: (id: string) => api.delete(`${config.endpoints.simulator}/simulations/${id}`),
  startSimulation: (id: string) => api.post(`${config.endpoints.simulator}/simulations/${id}/start`),
  stopSimulation: (id: string) => api.post(`${config.endpoints.simulator}/simulations/${id}/stop`),
  pauseSimulation: (id: string) => api.post(`${config.endpoints.simulator}/simulations/${id}/pause`),
  initializeSimulation: (id: string) => api.post(`${config.endpoints.simulator}/simulations/${id}/initialize`),
  initializeDefaultSimulation: () => api.post(`${config.endpoints.simulator}/simulations/initialize-default`),
  
  // Vehicle management
  getVehicles: () => api.get(`${config.endpoints.simulator}/vehicles`),
  getVehicle: (id: string) => api.get(`${config.endpoints.simulator}/vehicles/${id}`),
  createVehicle: (data: any) => api.post(`${config.endpoints.simulator}/vehicles`, data),
  addExistingVehicle: (data: { vehicleId: string, [key: string]: any }) => 
    api.post(`${config.endpoints.simulator}/vehicles`, data),
  updateVehicleStatus: (id: string, status: string) => api.put(`${config.endpoints.simulator}/vehicles/${id}/status`, { status }),
  updateVehicleLocation: (id: string, location: any) => api.put(`${config.endpoints.simulator}/vehicles/${id}/location`, { location }),
  resetVehicles: () => api.post(`${config.endpoints.simulator}/vehicles/reset`),
  removeAllVehicles: () => api.delete(`${config.endpoints.simulator}/vehicles`),
  
  // Trip management
  getTrips: () => api.get(`${config.endpoints.simulator}/trips`),
  getActiveTrips: () => api.get(`${config.endpoints.simulator}/trips`),
  getTrip: (id: string) => api.get(`${config.endpoints.simulator}/trips/${id}`),
  getVehicleTrips: (vehicleId: string) => api.get(`${config.endpoints.simulator}/vehicles/${vehicleId}/trips`),
  createVehicleTrip: (vehicleId: string, tripData?: any) => api.post(`${config.endpoints.simulator}/vehicles/${vehicleId}/trips`, tripData || {}),
  startTrip: (id: string) => api.post(`${config.endpoints.simulator}/trips/${id}/start`),
  completeTrip: (id: string) => api.post(`${config.endpoints.simulator}/trips/${id}/complete`),
};

export default {
  vehicle: vehicleService,
  tracking: trackingService,
  maintenance: maintenanceService,
  analytics: analyticsService,
  simulator: simulatorService,
}; 