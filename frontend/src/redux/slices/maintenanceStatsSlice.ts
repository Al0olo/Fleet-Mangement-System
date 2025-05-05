import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { maintenanceService } from '../../services/api';
import { MaintenanceStats, MaintenanceStatsResponse } from '../../types/maintenance';

interface MaintenanceStatsState {
  stats: MaintenanceStats | null;
  loading: boolean;
  error: string | null;
}

const initialState: MaintenanceStatsState = {
  stats: null,
  loading: false,
  error: null
};

// Async thunk
export const fetchMaintenanceStats = createAsyncThunk(
  'maintenanceStats/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await maintenanceService.getMaintenanceStats();
      return response.data as MaintenanceStatsResponse;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch maintenance statistics');
    }
  }
);

// Create the slice
const maintenanceStatsSlice = createSlice({
  name: 'maintenanceStats',
  initialState,
  reducers: {
    clearMaintenanceStats: (state) => {
      state.stats = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Add mock data for demo purposes when backend is unavailable
    loadMockStats: (state) => {
      state.stats = {
        countByType: {
          routine: 15,
          repair: 7,
          inspection: 5,
          emergency: 2,
          recall: 1,
          other: 3
        },
        countByStatus: {
          scheduled: 10,
          'in-progress': 8,
          completed: 12,
          cancelled: 3
        },
        avgCostByType: {
          routine: 120.5,
          repair: 780.25,
          inspection: 95.0,
          emergency: 1250.75,
          recall: 500.0,
          other: 175.5
        },
        monthlyCount: [
          { month: 'Jan', count: 5 },
          { month: 'Feb', count: 7 },
          { month: 'Mar', count: 3 },
          { month: 'Apr', count: 8 },
          { month: 'May', count: 12 },
          { month: 'Jun', count: 10 }
        ],
        totalCost: 15420.25
      };
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMaintenanceStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMaintenanceStats.fulfilled, (state, action: PayloadAction<MaintenanceStatsResponse>) => {
        state.stats = action.payload.data;
        state.loading = false;
      })
      .addCase(fetchMaintenanceStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearMaintenanceStats, clearError, loadMockStats } = maintenanceStatsSlice.actions;

export default maintenanceStatsSlice.reducer; 