import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { maintenanceService } from '../../services/api';
import { 
  MaintenanceSchedule, 
  CreateMaintenanceSchedulePayload, 
  UpdateMaintenanceSchedulePayload,
  MaintenanceListResponse,
  MaintenanceResponse
} from '../../types/maintenance';

interface MaintenanceScheduleState {
  schedules: MaintenanceSchedule[];
  schedule: MaintenanceSchedule | null;
  upcomingSchedules: MaintenanceSchedule[];
  overdueSchedules: MaintenanceSchedule[];
  loading: boolean;
  error: string | null;
  total: number;
}

const initialState: MaintenanceScheduleState = {
  schedules: [],
  schedule: null,
  upcomingSchedules: [],
  overdueSchedules: [],
  loading: false,
  error: null,
  total: 0
};

// Async thunks
export const fetchMaintenanceSchedules = createAsyncThunk(
  'maintenanceSchedules/fetchAll',
  async (params: any, { rejectWithValue }) => {
    try {
      const response = await maintenanceService.getSchedules(params);
      return response.data as MaintenanceListResponse<MaintenanceSchedule>;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch maintenance schedules');
    }
  }
);

export const fetchMaintenanceScheduleById = createAsyncThunk(
  'maintenanceSchedules/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await maintenanceService.getScheduleById(id);
      return response.data as MaintenanceResponse<MaintenanceSchedule>;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch maintenance schedule');
    }
  }
);

export const fetchVehicleMaintenanceSchedules = createAsyncThunk(
  'maintenanceSchedules/fetchByVehicle',
  async ({ vehicleId, params }: { vehicleId: string, params?: any }, { rejectWithValue }) => {
    try {
      const response = await maintenanceService.getVehicleSchedules(vehicleId, params);
      return response.data as MaintenanceListResponse<MaintenanceSchedule>;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch vehicle maintenance schedules');
    }
  }
);

export const fetchUpcomingSchedules = createAsyncThunk(
  'maintenanceSchedules/fetchUpcoming',
  async (params: any, { rejectWithValue }) => {
    try {
      const response = await maintenanceService.getUpcomingSchedules(params);
      return response.data as MaintenanceListResponse<MaintenanceSchedule>;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch upcoming schedules');
    }
  }
);

export const fetchOverdueSchedules = createAsyncThunk(
  'maintenanceSchedules/fetchOverdue',
  async (params: any, { rejectWithValue }) => {
    try {
      const response = await maintenanceService.getOverdueSchedules(params);
      return response.data as MaintenanceListResponse<MaintenanceSchedule>;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch overdue schedules');
    }
  }
);

export const updateOverdueSchedules = createAsyncThunk(
  'maintenanceSchedules/updateOverdue',
  async (params?: any, { rejectWithValue }) => {
    try {
      const response = await maintenanceService.updateOverdueSchedules();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update overdue schedules');
    }
  }
);

export const createMaintenanceSchedule = createAsyncThunk(
  'maintenanceSchedules/create',
  async (scheduleData: CreateMaintenanceSchedulePayload, { rejectWithValue }) => {
    try {
      const response = await maintenanceService.createSchedule(scheduleData);
      return response.data as MaintenanceResponse<MaintenanceSchedule>;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create maintenance schedule');
    }
  }
);

export const updateMaintenanceSchedule = createAsyncThunk(
  'maintenanceSchedules/update',
  async (scheduleData: UpdateMaintenanceSchedulePayload, { rejectWithValue }) => {
    try {
      const response = await maintenanceService.updateSchedule(scheduleData.id, scheduleData);
      return response.data as MaintenanceResponse<MaintenanceSchedule>;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update maintenance schedule');
    }
  }
);

export const deleteMaintenanceSchedule = createAsyncThunk(
  'maintenanceSchedules/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await maintenanceService.deleteSchedule(id);
      return { id, response: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete maintenance schedule');
    }
  }
);

// Create the slice
const maintenanceScheduleSlice = createSlice({
  name: 'maintenanceSchedules',
  initialState,
  reducers: {
    clearMaintenanceSchedule: (state) => {
      state.schedule = null;
    },
    clearMaintenanceSchedules: (state) => {
      state.schedules = [];
      state.total = 0;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Add mock data for demo purposes when backend is unavailable
    loadMockSchedules: (state) => {
      // Current date for generating relative dates
      const now = new Date();
      
      // Mock upcoming schedules
      state.upcomingSchedules = [
        {
          id: 'mock-schedule-1',
          vehicleId: 'vehicle-001',
          type: 'routine',
          description: 'Regular maintenance check',
          scheduledDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days in future
          assignedTo: 'John Mechanic',
          estimatedCost: 150,
          priority: 'medium',
          status: 'scheduled',
          notes: 'Standard 5000 hour inspection',
          reminderSent: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'mock-schedule-2',
          vehicleId: 'vehicle-002',
          type: 'inspection',
          description: 'Annual safety inspection',
          scheduledDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days in future
          assignedTo: 'Service Center A',
          estimatedCost: 250,
          priority: 'high',
          status: 'scheduled',
          notes: 'Required for compliance',
          reminderSent: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
      ];
      
      // Mock overdue schedules
      state.overdueSchedules = [
        {
          id: 'mock-schedule-3',
          vehicleId: 'vehicle-003',
          type: 'repair',
          description: 'Replace hydraulic system',
          scheduledDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          assignedTo: 'Heavy Equipment Repairs Inc.',
          estimatedCost: 3500,
          priority: 'critical',
          status: 'overdue',
          notes: 'Parts delayed from supplier',
          reminderSent: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all maintenance schedules
      .addCase(fetchMaintenanceSchedules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMaintenanceSchedules.fulfilled, (state, action: PayloadAction<MaintenanceListResponse<MaintenanceSchedule>>) => {
        state.schedules = action.payload.data;
        state.total = action.payload.count;
        state.loading = false;
      })
      .addCase(fetchMaintenanceSchedules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch a maintenance schedule by ID
      .addCase(fetchMaintenanceScheduleById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMaintenanceScheduleById.fulfilled, (state, action: PayloadAction<MaintenanceResponse<MaintenanceSchedule>>) => {
        state.schedule = action.payload.data;
        state.loading = false;
      })
      .addCase(fetchMaintenanceScheduleById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch vehicle maintenance schedules
      .addCase(fetchVehicleMaintenanceSchedules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicleMaintenanceSchedules.fulfilled, (state, action: PayloadAction<MaintenanceListResponse<MaintenanceSchedule>>) => {
        state.schedules = action.payload.data;
        state.total = action.payload.count;
        state.loading = false;
      })
      .addCase(fetchVehicleMaintenanceSchedules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch upcoming schedules
      .addCase(fetchUpcomingSchedules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUpcomingSchedules.fulfilled, (state, action: PayloadAction<MaintenanceListResponse<MaintenanceSchedule>>) => {
        state.upcomingSchedules = action.payload.data;
        state.loading = false;
      })
      .addCase(fetchUpcomingSchedules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch overdue schedules
      .addCase(fetchOverdueSchedules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOverdueSchedules.fulfilled, (state, action: PayloadAction<MaintenanceListResponse<MaintenanceSchedule>>) => {
        state.overdueSchedules = action.payload.data;
        state.loading = false;
      })
      .addCase(fetchOverdueSchedules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update overdue schedules
      .addCase(updateOverdueSchedules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOverdueSchedules.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateOverdueSchedules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create a maintenance schedule
      .addCase(createMaintenanceSchedule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMaintenanceSchedule.fulfilled, (state, action: PayloadAction<MaintenanceResponse<MaintenanceSchedule>>) => {
        state.schedules = [...state.schedules, action.payload.data];
        state.schedule = action.payload.data;
        state.total += 1;
        state.loading = false;
      })
      .addCase(createMaintenanceSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update a maintenance schedule
      .addCase(updateMaintenanceSchedule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMaintenanceSchedule.fulfilled, (state, action: PayloadAction<MaintenanceResponse<MaintenanceSchedule>>) => {
        const updatedSchedule = action.payload.data;
        state.schedules = state.schedules.map(schedule => 
          schedule.id === updatedSchedule.id ? updatedSchedule : schedule
        );
        state.schedule = updatedSchedule;
        
        // Update in upcoming schedules too
        state.upcomingSchedules = state.upcomingSchedules.map(schedule => 
          schedule.id === updatedSchedule.id ? updatedSchedule : schedule
        );
        
        // Update in overdue schedules too
        state.overdueSchedules = state.overdueSchedules.map(schedule => 
          schedule.id === updatedSchedule.id ? updatedSchedule : schedule
        );
        
        state.loading = false;
      })
      .addCase(updateMaintenanceSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete a maintenance schedule
      .addCase(deleteMaintenanceSchedule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMaintenanceSchedule.fulfilled, (state, action) => {
        const deletedId = action.payload.id;
        state.schedules = state.schedules.filter(schedule => schedule.id !== deletedId);
        state.upcomingSchedules = state.upcomingSchedules.filter(schedule => schedule.id !== deletedId);
        state.overdueSchedules = state.overdueSchedules.filter(schedule => schedule.id !== deletedId);
        
        if (state.schedule?.id === deletedId) {
          state.schedule = null;
        }
        state.total -= 1;
        state.loading = false;
      })
      .addCase(deleteMaintenanceSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { 
  clearMaintenanceSchedule, 
  clearMaintenanceSchedules, 
  clearError,
  loadMockSchedules
} = maintenanceScheduleSlice.actions;

export default maintenanceScheduleSlice.reducer; 