import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { analyticsService } from '../../services/api';

export interface AnalyticsData {
  id?: string;
  totalVehicles?: number;
  activeVehicles?: number;
  mileageData?: {
    vehicleId: string;
    totalMileage: number;
  }[];
  fuelConsumption?: {
    vehicleId: string;
    totalConsumption: number;
  }[];
  maintenanceCosts?: {
    vehicleId: string;
    totalCost: number;
  }[];
  vehicleUtilization?: {
    vehicleId: string;
    hoursActive: number;
    totalHours: number;
    utilizationRate: number;
  }[];
  // New fields for enhanced analytics data
  status?: string;
  data?: any;
}

export interface UsageStatistics {
  vehicleId: string;
  period: string;
  distance: number;
  hoursOfOperation: number;
  fuelUsed: number;
  idleTime: number;
  averageSpeed: number;
  timestamp: string;
}

export interface PerformanceMetrics {
  vehicleId: string;
  metricType: string;
  value: number;
  timestamp: string;
}

export interface MetricTrend {
  period: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export interface VehicleComparison {
  vehicleId: string;
  metricType: string;
  vehicleValue: number;
  fleetAverage: number;
  percentDifference: number;
  rank: number;
  totalVehicles: number;
}

export interface AnalyticsReport {
  id: string;
  reportType: string;
  period: string;
  startDate: string;
  endDate: string;
  vehicleId?: string;
  createdAt: string;
  summary: string;
  data: any;
}

interface AnalyticsState {
  data: AnalyticsData;
  vehicleData: AnalyticsData | null;
  utilizationData: AnalyticsData | null;
  costData: AnalyticsData | null;
  usageStats: UsageStatistics[];
  performanceMetrics: PerformanceMetrics[];
  metricTrends: MetricTrend[];
  vehicleComparison: VehicleComparison | null;
  reports: AnalyticsReport[];
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  data: {},
  vehicleData: null,
  utilizationData: null,
  costData: null,
  usageStats: [],
  performanceMetrics: [],
  metricTrends: [],
  vehicleComparison: null,
  reports: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchAnalyticsData = createAsyncThunk(
  'analytics/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getFleetAnalytics();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics data');
    }
  }
);

export const fetchVehicleAnalytics = createAsyncThunk(
  'analytics/fetchVehicleData',
  async (vehicleId: string, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getVehicleAnalytics(vehicleId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch vehicle analytics');
    }
  }
);

export const fetchUtilizationAnalytics = createAsyncThunk(
  'analytics/fetchUtilizationData',
  async (params: { startDate?: string; endDate?: string; period?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getUtilizationAnalytics(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch utilization analytics');
    }
  }
);

export const fetchCostAnalytics = createAsyncThunk(
  'analytics/fetchCostData',
  async (params: { startDate?: string; endDate?: string; period?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getCostAnalytics(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cost analytics');
    }
  }
);

export const fetchUsageStats = createAsyncThunk(
  'analytics/fetchUsageStats',
  async (params: { vehicleId: string; startDate?: string; endDate?: string; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getVehicleUsageStats(params.vehicleId, params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch usage statistics');
    }
  }
);

export const fetchPerformanceMetrics = createAsyncThunk(
  'analytics/fetchPerformanceMetrics',
  async (params: { 
    vehicleId: string; 
    metricType?: string; 
    startDate?: string; 
    endDate?: string; 
    limit?: number 
  }, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getPerformanceMetrics(params.vehicleId, params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch performance metrics');
    }
  }
);

export const fetchMetricTrends = createAsyncThunk(
  'analytics/fetchMetricTrends',
  async (params: { 
    vehicleId: string; 
    metricType?: string; 
    startDate?: string; 
    endDate?: string; 
    interval?: string 
  }, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getMetricTrends(params.vehicleId, params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch metric trends');
    }
  }
);

export const fetchVehicleComparison = createAsyncThunk(
  'analytics/fetchVehicleComparison',
  async (params: { 
    vehicleId: string; 
    metricType?: string; 
    startDate?: string; 
    endDate?: string 
  }, { rejectWithValue }) => {
    try {
      const response = await analyticsService.compareVehicleToFleet(params.vehicleId, params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch vehicle comparison');
    }
  }
);

export const fetchAnalyticsReports = createAsyncThunk(
  'analytics/fetchReports',
  async (params: { 
    reportType?: string; 
    period?: string; 
    vehicleId?: string; 
    limit?: number 
  } = {}, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getReports(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics reports');
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearVehicleAnalytics: (state) => {
      state.vehicleData = null;
    },
    clearAll: (state) => {
      state.utilizationData = null;
      state.costData = null;
      state.usageStats = [];
      state.performanceMetrics = [];
      state.metricTrends = [];
      state.vehicleComparison = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fleet analytics
      .addCase(fetchAnalyticsData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnalyticsData.fulfilled, (state, action: PayloadAction<AnalyticsData>) => {
        state.data = action.payload;
        state.loading = false;
      })
      .addCase(fetchAnalyticsData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Vehicle analytics
      .addCase(fetchVehicleAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicleAnalytics.fulfilled, (state, action: PayloadAction<AnalyticsData>) => {
        state.vehicleData = action.payload;
        
        // Ensure all necessary properties are present
        if (state.vehicleData && state.vehicleData.data) {
          // Convert utilization rate from decimal to percentage if needed
          if (state.vehicleData.data.utilizationRate !== undefined && state.vehicleData.data.utilizationRate <= 1) {
            // Keep as decimal as we now handle it in the UI
          }
          
          // Make sure all required fields exist with default values
          state.vehicleData.data = {
            totalDistance: state.vehicleData.data.totalDistance || 0,
            totalFuelConsumption: state.vehicleData.data.totalFuelConsumption || 0,
            fuelEfficiency: state.vehicleData.data.fuelEfficiency || 0,
            utilizationRate: state.vehicleData.data.utilizationRate || 0,
            maintenanceCost: state.vehicleData.data.maintenanceCost || 0,
            costPerKm: state.vehicleData.data.costPerKm || 0,
            ...state.vehicleData.data
          };
        }
        
        state.loading = false;
      })
      .addCase(fetchVehicleAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Utilization analytics
      .addCase(fetchUtilizationAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUtilizationAnalytics.fulfilled, (state, action: PayloadAction<AnalyticsData>) => {
        state.utilizationData = action.payload;
        state.loading = false;
      })
      .addCase(fetchUtilizationAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Cost analytics
      .addCase(fetchCostAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCostAnalytics.fulfilled, (state, action: PayloadAction<AnalyticsData>) => {
        state.costData = action.payload;
        state.loading = false;
      })
      .addCase(fetchCostAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Usage stats
      .addCase(fetchUsageStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsageStats.fulfilled, (state, action: PayloadAction<any>) => {
        state.usageStats = action.payload.data || [];
        state.loading = false;
      })
      .addCase(fetchUsageStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Performance metrics
      .addCase(fetchPerformanceMetrics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPerformanceMetrics.fulfilled, (state, action: PayloadAction<any>) => {
        state.performanceMetrics = action.payload.data || [];
        state.loading = false;
      })
      .addCase(fetchPerformanceMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Metric trends
      .addCase(fetchMetricTrends.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMetricTrends.fulfilled, (state, action: PayloadAction<any>) => {
        state.metricTrends = action.payload.data || [];
        state.loading = false;
      })
      .addCase(fetchMetricTrends.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Vehicle comparison
      .addCase(fetchVehicleComparison.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicleComparison.fulfilled, (state, action: PayloadAction<any>) => {
        state.vehicleComparison = action.payload.data;
        state.loading = false;
      })
      .addCase(fetchVehicleComparison.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Reports
      .addCase(fetchAnalyticsReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnalyticsReports.fulfilled, (state, action: PayloadAction<any>) => {
        state.reports = action.payload.data || [];
        state.loading = false;
      })
      .addCase(fetchAnalyticsReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearVehicleAnalytics, clearAll } = analyticsSlice.actions;

export default analyticsSlice.reducer; 