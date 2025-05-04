import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: string;
  description: string;
  performedAt: string;
  performedBy: string;
  cost: number;
}

interface MaintenanceState {
  records: MaintenanceRecord[];
  loading: boolean;
  error: string | null;
}

const initialState: MaintenanceState = {
  records: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchMaintenanceRecords = createAsyncThunk(
  'maintenance/fetchRecords',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/maintenance/records');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch maintenance records');
    }
  }
);

export const fetchVehicleMaintenanceRecords = createAsyncThunk(
  'maintenance/fetchVehicleRecords',
  async (vehicleId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/maintenance/vehicles/${vehicleId}/records`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch vehicle maintenance records');
    }
  }
);

const maintenanceSlice = createSlice({
  name: 'maintenance',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMaintenanceRecords.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMaintenanceRecords.fulfilled, (state, action: PayloadAction<MaintenanceRecord[]>) => {
        state.records = action.payload;
        state.loading = false;
      })
      .addCase(fetchMaintenanceRecords.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchVehicleMaintenanceRecords.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicleMaintenanceRecords.fulfilled, (state, action: PayloadAction<MaintenanceRecord[]>) => {
        state.records = action.payload;
        state.loading = false;
      })
      .addCase(fetchVehicleMaintenanceRecords.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default maintenanceSlice.reducer; 