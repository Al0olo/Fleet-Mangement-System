import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { trackingService } from '../../services/api';

// Define types for tracking data
export interface LocationData {
  id: string;
  vehicleId: string;
  timestamp: string;
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  speed?: number;
  heading?: number;
  altitude?: number;
  accuracy?: number;
  latitude?: number;
  longitude?: number;
  metadata?: Record<string, any>;
}

export interface VehicleStatus {
  id: string;
  vehicleId: string;
  timestamp: string;
  status: 'ACTIVE' | 'IDLE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  fuelLevel?: number;
  batteryLevel?: number;
  engineStatus?: 'ON' | 'OFF' | 'ERROR';
  odometer?: number;
  metadata?: Record<string, any>;
}

export interface VehicleEvent {
  id: string;
  vehicleId: string;
  timestamp: string;
  eventType: 'TRIP_STARTED' | 'TRIP_COMPLETED' | 'MAINTENANCE_DUE' | 'IDLE_STARTED' | 'IDLE_ENDED' | 'GEOFENCE_ENTER' | 'GEOFENCE_EXIT' | 'BATTERY_LOW' | 'FUEL_LOW';
  description?: string;
  tripInfo?: {
    tripId: string;
    startTime?: string;
    endTime?: string;
    startLocation?: { type: string; coordinates: [number, number] };
    endLocation?: { type: string; coordinates: [number, number] };
    distance?: number;
    duration?: number;
  };
  location?: {
    type: string;
    coordinates: [number, number];
  };
  metadata?: Record<string, any>;
}

export interface TrackingState {
  vehicleLocation: LocationData | null;
  locationHistory: LocationData[];
  vehicleStatus: VehicleStatus | null;
  statusHistory: VehicleStatus[];
  vehicleEvents: VehicleEvent[];
  loading: {
    location: boolean;
    status: boolean;
    events: boolean;
  };
  error: {
    location: string | null;
    status: string | null;
    events: string | null;
  };
}

const initialState: TrackingState = {
  vehicleLocation: null,
  locationHistory: [],
  vehicleStatus: null,
  statusHistory: [],
  vehicleEvents: [],
  loading: {
    location: false,
    status: false,
    events: false,
  },
  error: {
    location: null,
    status: null,
    events: null,
  },
};

// Async thunks for tracking data
export const fetchVehicleLocation = createAsyncThunk(
  'tracking/fetchVehicleLocation',
  async (vehicleId: string, { rejectWithValue }) => {
    try {
      const response = await trackingService.getVehicleLocation(vehicleId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch vehicle location');
    }
  }
);

export const fetchLocationHistory = createAsyncThunk(
  'tracking/fetchLocationHistory',
  async ({ vehicleId, params }: { vehicleId: string, params?: any }, { rejectWithValue }) => {
    try {
      const response = await trackingService.getVehicleHistory(vehicleId, params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch location history');
    }
  }
);

export const fetchVehicleStatus = createAsyncThunk(
  'tracking/fetchVehicleStatus',
  async (vehicleId: string, { rejectWithValue }) => {
    try {
      const response = await trackingService.getVehicleStatus(vehicleId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch vehicle status');
    }
  }
);

export const fetchStatusHistory = createAsyncThunk(
  'tracking/fetchStatusHistory',
  async ({ vehicleId, params }: { vehicleId: string, params?: any }, { rejectWithValue }) => {
    try {
      const response = await trackingService.getStatusHistory(vehicleId, params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch status history');
    }
  }
);

export const fetchVehicleEvents = createAsyncThunk(
  'tracking/fetchVehicleEvents',
  async ({ vehicleId, params }: { vehicleId: string, params?: any }, { rejectWithValue }) => {
    try {
      const response = await trackingService.getVehicleEvents(vehicleId, params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch vehicle events');
    }
  }
);

// Create the slice
const trackingSlice = createSlice({
  name: 'tracking',
  initialState,
  reducers: {
    clearTrackingData: (state) => {
      state.vehicleLocation = null;
      state.locationHistory = [];
      state.vehicleStatus = null;
      state.statusHistory = [];
      state.vehicleEvents = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Vehicle location reducers
      .addCase(fetchVehicleLocation.pending, (state) => {
        state.loading.location = true;
        state.error.location = null;
      })
      .addCase(fetchVehicleLocation.fulfilled, (state, action) => {
        state.vehicleLocation = action.payload.data;
        state.loading.location = false;
      })
      .addCase(fetchVehicleLocation.rejected, (state, action) => {
        state.loading.location = false;
        state.error.location = action.payload as string;
      })
      
      // Location history reducers
      .addCase(fetchLocationHistory.pending, (state) => {
        state.loading.location = true;
        state.error.location = null;
      })
      .addCase(fetchLocationHistory.fulfilled, (state, action) => {
        state.locationHistory = action.payload.data;
        state.loading.location = false;
      })
      .addCase(fetchLocationHistory.rejected, (state, action) => {
        state.loading.location = false;
        state.error.location = action.payload as string;
      })
      
      // Vehicle status reducers
      .addCase(fetchVehicleStatus.pending, (state) => {
        state.loading.status = true;
        state.error.status = null;
      })
      .addCase(fetchVehicleStatus.fulfilled, (state, action) => {
        state.vehicleStatus = action.payload.data;
        state.loading.status = false;
      })
      .addCase(fetchVehicleStatus.rejected, (state, action) => {
        state.loading.status = false;
        state.error.status = action.payload as string;
      })
      
      // Status history reducers
      .addCase(fetchStatusHistory.pending, (state) => {
        state.loading.status = true;
        state.error.status = null;
      })
      .addCase(fetchStatusHistory.fulfilled, (state, action) => {
        state.statusHistory = action.payload.data;
        state.loading.status = false;
      })
      .addCase(fetchStatusHistory.rejected, (state, action) => {
        state.loading.status = false;
        state.error.status = action.payload as string;
      })
      
      // Vehicle events reducers
      .addCase(fetchVehicleEvents.pending, (state) => {
        state.loading.events = true;
        state.error.events = null;
      })
      .addCase(fetchVehicleEvents.fulfilled, (state, action) => {
        state.vehicleEvents = action.payload.data;
        state.loading.events = false;
      })
      .addCase(fetchVehicleEvents.rejected, (state, action) => {
        state.loading.events = false;
        state.error.events = action.payload as string;
      });
  },
});

export const { clearTrackingData } = trackingSlice.actions;

export default trackingSlice.reducer; 