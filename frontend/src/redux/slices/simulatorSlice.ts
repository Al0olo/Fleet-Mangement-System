import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

export interface Simulation {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'paused';
  vehicleCount: number;
  updateInterval: number;
  createdAt: string;
}

interface SimulatorState {
  simulations: Simulation[];
  activeSimulation: Simulation | null;
  loading: boolean;
  error: string | null;
}

const initialState: SimulatorState = {
  simulations: [],
  activeSimulation: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchSimulations = createAsyncThunk(
  'simulator/fetchSimulations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/simulator/simulations');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch simulations');
    }
  }
);

export const fetchSimulationById = createAsyncThunk(
  'simulator/fetchSimulationById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/simulator/simulations/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch simulation');
    }
  }
);

export const startSimulation = createAsyncThunk(
  'simulator/startSimulation',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/simulator/simulations/${id}/start`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start simulation');
    }
  }
);

export const stopSimulation = createAsyncThunk(
  'simulator/stopSimulation',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/simulator/simulations/${id}/stop`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to stop simulation');
    }
  }
);

const simulatorSlice = createSlice({
  name: 'simulator',
  initialState,
  reducers: {
    clearActiveSimulation: (state) => {
      state.activeSimulation = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSimulations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSimulations.fulfilled, (state, action: PayloadAction<Simulation[]>) => {
        state.simulations = action.payload;
        state.loading = false;
      })
      .addCase(fetchSimulations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchSimulationById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSimulationById.fulfilled, (state, action: PayloadAction<Simulation>) => {
        state.activeSimulation = action.payload;
        state.loading = false;
      })
      .addCase(fetchSimulationById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(startSimulation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startSimulation.fulfilled, (state, action: PayloadAction<Simulation>) => {
        state.activeSimulation = action.payload;
        const index = state.simulations.findIndex(sim => sim.id === action.payload.id);
        if (index !== -1) {
          state.simulations[index] = action.payload;
        }
        state.loading = false;
      })
      .addCase(startSimulation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(stopSimulation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(stopSimulation.fulfilled, (state, action: PayloadAction<Simulation>) => {
        state.activeSimulation = action.payload;
        const index = state.simulations.findIndex(sim => sim.id === action.payload.id);
        if (index !== -1) {
          state.simulations[index] = action.payload;
        }
        state.loading = false;
      })
      .addCase(stopSimulation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearActiveSimulation } = simulatorSlice.actions;

export default simulatorSlice.reducer; 