import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

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
}

interface AnalyticsState {
  data: AnalyticsData;
  vehicleData: AnalyticsData | null;
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  data: {},
  vehicleData: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchAnalyticsData = createAsyncThunk(
  'analytics/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/analytics/fleet');
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
      const response = await axios.get(`/api/analytics/vehicles/${vehicleId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch vehicle analytics');
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
  },
  extraReducers: (builder) => {
    builder
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
      .addCase(fetchVehicleAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicleAnalytics.fulfilled, (state, action: PayloadAction<AnalyticsData>) => {
        state.vehicleData = action.payload;
        state.loading = false;
      })
      .addCase(fetchVehicleAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearVehicleAnalytics } = analyticsSlice.actions;

export default analyticsSlice.reducer; 