import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { maintenanceService } from '../../services/api';
import { 
  MaintenanceRecord, 
  CreateMaintenanceRecordPayload, 
  UpdateMaintenanceRecordPayload,
  MaintenanceListResponse,
  MaintenanceResponse
} from '../../types/maintenance';

interface MaintenanceRecordState {
  records: MaintenanceRecord[];
  record: MaintenanceRecord | null;
  loading: boolean;
  error: string | null;
  total: number;
}

const initialState: MaintenanceRecordState = {
  records: [],
  record: null,
  loading: false,
  error: null,
  total: 0
};

// Async thunks
export const fetchMaintenanceRecords = createAsyncThunk(
  'maintenanceRecords/fetchAll',
  async (params?: any, { rejectWithValue }) => {
    try {
      const response = await maintenanceService.getRecords(params);
      return response.data as MaintenanceListResponse<MaintenanceRecord>;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch maintenance records');
    }
  }
);

export const fetchMaintenanceRecordById = createAsyncThunk(
  'maintenanceRecords/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await maintenanceService.getRecordById(id);
      return response.data as MaintenanceResponse<MaintenanceRecord>;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch maintenance record');
    }
  }
);

export const fetchVehicleMaintenanceRecords = createAsyncThunk(
  'maintenanceRecords/fetchByVehicle',
  async ({ vehicleId, params }: { vehicleId: string, params?: any }, { rejectWithValue }) => {
    try {
      const response = await maintenanceService.getVehicleRecords(vehicleId, params);
      return response.data as MaintenanceListResponse<MaintenanceRecord>;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch vehicle maintenance records');
    }
  }
);

export const createMaintenanceRecord = createAsyncThunk(
  'maintenanceRecords/create',
  async (recordData: CreateMaintenanceRecordPayload, { rejectWithValue }) => {
    try {
      const response = await maintenanceService.createRecord(recordData);
      return response.data as MaintenanceResponse<MaintenanceRecord>;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create maintenance record');
    }
  }
);

export const updateMaintenanceRecord = createAsyncThunk(
  'maintenanceRecords/update',
  async (recordData: UpdateMaintenanceRecordPayload, { rejectWithValue }) => {
    try {
      const response = await maintenanceService.updateRecord(recordData.id, recordData);
      return response.data as MaintenanceResponse<MaintenanceRecord>;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update maintenance record');
    }
  }
);

export const deleteMaintenanceRecord = createAsyncThunk(
  'maintenanceRecords/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await maintenanceService.deleteRecord(id);
      return { id, response: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete maintenance record');
    }
  }
);

// Create the slice
const maintenanceRecordSlice = createSlice({
  name: 'maintenanceRecords',
  initialState,
  reducers: {
    clearMaintenanceRecord: (state) => {
      state.record = null;
    },
    clearMaintenanceRecords: (state) => {
      state.records = [];
      state.total = 0;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all maintenance records
      .addCase(fetchMaintenanceRecords.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMaintenanceRecords.fulfilled, (state, action: PayloadAction<MaintenanceListResponse<MaintenanceRecord>>) => {
        state.records = action.payload.data;
        state.total = action.payload.count;
        state.loading = false;
      })
      .addCase(fetchMaintenanceRecords.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch a maintenance record by ID
      .addCase(fetchMaintenanceRecordById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMaintenanceRecordById.fulfilled, (state, action: PayloadAction<MaintenanceResponse<MaintenanceRecord>>) => {
        state.record = action.payload.data;
        state.loading = false;
      })
      .addCase(fetchMaintenanceRecordById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch vehicle maintenance records
      .addCase(fetchVehicleMaintenanceRecords.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicleMaintenanceRecords.fulfilled, (state, action: PayloadAction<MaintenanceListResponse<MaintenanceRecord>>) => {
        state.records = action.payload.data;
        state.total = action.payload.count;
        state.loading = false;
      })
      .addCase(fetchVehicleMaintenanceRecords.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create a maintenance record
      .addCase(createMaintenanceRecord.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMaintenanceRecord.fulfilled, (state, action: PayloadAction<MaintenanceResponse<MaintenanceRecord>>) => {
        state.records = [...state.records, action.payload.data];
        state.record = action.payload.data;
        state.total += 1;
        state.loading = false;
      })
      .addCase(createMaintenanceRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update a maintenance record
      .addCase(updateMaintenanceRecord.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMaintenanceRecord.fulfilled, (state, action: PayloadAction<MaintenanceResponse<MaintenanceRecord>>) => {
        const updatedRecord = action.payload.data;
        state.records = state.records.map(record => 
          record.id === updatedRecord.id ? updatedRecord : record
        );
        state.record = updatedRecord;
        state.loading = false;
      })
      .addCase(updateMaintenanceRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete a maintenance record
      .addCase(deleteMaintenanceRecord.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMaintenanceRecord.fulfilled, (state, action) => {
        const deletedId = action.payload.id;
        state.records = state.records.filter(record => record.id !== deletedId);
        if (state.record?.id === deletedId) {
          state.record = null;
        }
        state.total -= 1;
        state.loading = false;
      })
      .addCase(deleteMaintenanceRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { 
  clearMaintenanceRecord, 
  clearMaintenanceRecords, 
  clearError 
} = maintenanceRecordSlice.actions;

export default maintenanceRecordSlice.reducer; 