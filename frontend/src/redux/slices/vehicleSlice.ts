import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

// Metadata interface to match backend model
interface VehicleMetadata {
  year?: number;
  manufacturer?: string;
  fuelType?: string;
  capacity?: number;
  vin?: string;
  [key: string]: any;
}

export interface Vehicle {
  id: string;
  model: string;
  type: string;
  status: string;
  registrationDate?: string;
  metadata: VehicleMetadata;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVehiclePayload {
  model: string;
  type: string;
  status: string;
  metadata: {
    manufacturer?: string;
    year?: number;
    fuelType?: string;
    capacity?: number;
    vin?: string;
  };
}

export interface UpdateVehiclePayload {
  id: string;
  model?: string;
  type?: string;
  status?: string;
  metadata?: {
    manufacturer?: string;
    year?: number;
    fuelType?: string;
    capacity?: number;
    vin?: string;
  };
}

interface VehicleState {
  vehicles: Vehicle[];
  vehicle: Vehicle | null;
  loading: boolean;
  error: string | null;
}

const initialState: VehicleState = {
  vehicles: [],
  vehicle: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchVehicles = createAsyncThunk(
  'vehicles/fetchVehicles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/vehicles');
      console.log('API Response:', response);
      
      // The API returns { status: 'success', count: number, data: Vehicle[] }
      if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.error('Unexpected response format:', response.data);
        return [];
      }
    } catch (error: any) {
      console.error('Error fetching vehicles:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch vehicles');
    }
  }
);

export const fetchVehicleById = createAsyncThunk(
  'vehicles/fetchVehicleById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/vehicles/${id}`);
      console.log('Vehicle detail response:', response);
      
      // Check if the response has the expected structure
      if (response.data && response.data.status === 'success' && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching vehicle details:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch vehicle');
    }
  }
);

export const createVehicle = createAsyncThunk(
  'vehicles/createVehicle',
  async (vehicleData: CreateVehiclePayload, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/vehicles', vehicleData);
      console.log('Create vehicle response:', response);
      
      // Check if the response has the expected structure
      if (response.data && response.data.status === 'success' && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error creating vehicle:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to create vehicle');
    }
  }
);

export const updateVehicle = createAsyncThunk(
  'vehicles/updateVehicle',
  async (vehicleData: UpdateVehiclePayload, { rejectWithValue }) => {
    try {
      const { id, ...updates } = vehicleData;
      const response = await axios.put(`/api/vehicles/${id}`, updates);
      console.log('Update vehicle response:', response);
      
      // Check if the response has the expected structure
      if (response.data && response.data.status === 'success' && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error updating vehicle:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to update vehicle');
    }
  }
);

export const deleteVehicle = createAsyncThunk(
  'vehicles/deleteVehicle',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`/api/vehicles/${id}`);
      console.log('Delete vehicle response:', response);
      
      if (response.data && response.data.status === 'success') {
        return id;
      }
      
      return id;
    } catch (error: any) {
      console.error('Error deleting vehicle:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to delete vehicle');
    }
  }
);

const vehicleSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {
    clearVehicle: (state) => {
      state.vehicle = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicles.fulfilled, (state, action: PayloadAction<Vehicle[]>) => {
        state.vehicles = action.payload;
        state.loading = false;
        console.log('Vehicles in state after update:', state.vehicles);
      })
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        console.error('Failed to fetch vehicles:', action.payload);
      })
      .addCase(fetchVehicleById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicleById.fulfilled, (state, action: PayloadAction<Vehicle>) => {
        state.vehicle = action.payload;
        state.loading = false;
      })
      .addCase(fetchVehicleById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createVehicle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createVehicle.fulfilled, (state, action: PayloadAction<Vehicle>) => {
        state.vehicles.push(action.payload);
        state.loading = false;
      })
      .addCase(createVehicle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateVehicle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateVehicle.fulfilled, (state, action: PayloadAction<Vehicle>) => {
        const index = state.vehicles.findIndex(v => v.id === action.payload.id);
        if (index !== -1) {
          state.vehicles[index] = action.payload;
        }
        // Also update current vehicle if it's the one being edited
        if (state.vehicle && state.vehicle.id === action.payload.id) {
          state.vehicle = action.payload;
        }
        state.loading = false;
      })
      .addCase(updateVehicle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteVehicle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteVehicle.fulfilled, (state, action: PayloadAction<string>) => {
        state.vehicles = state.vehicles.filter(v => v.id !== action.payload);
        if (state.vehicle && state.vehicle.id === action.payload) {
          state.vehicle = null;
        }
        state.loading = false;
      })
      .addCase(deleteVehicle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearVehicle } = vehicleSlice.actions;

export default vehicleSlice.reducer; 