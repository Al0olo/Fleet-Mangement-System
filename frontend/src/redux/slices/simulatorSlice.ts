import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { simulatorService } from '../../services/api';

// Types for simulation data
export interface SimulationConfig {
  _id: string;
  name: string;
  status: 'RUNNING' | 'STOPPED' | 'PAUSED';
  region: {
    centerLat: number;
    centerLng: number;
    radiusKm: number;
  };
  vehicleCount: number;
  updateFrequencyMs: number;
  isDefault: boolean;
  eventsGenerated: number;
  vehiclesInSimulation: number;
  startedAt?: string;
  stoppedAt?: string;
  probabilities: {
    maintenance: number;
    idle: number;
  };
}

export interface SimulatedVehicle {
  _id: string;
  vehicleId: string;
  vin: string;
  name: string;
  type: 'PASSENGER' | 'CARGO' | 'HEAVY_DUTY';
  status: 'RUNNING' | 'IDLE' | 'MAINTENANCE';
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  speed: number;
  heading: number;
  fuelLevel: number;
  odometer: number;
  engineHours: number;
  lastUpdated: string;
  active: boolean;
  currentTrip?: string;
}

export interface SimulatedTrip {
  _id: string;
  tripId: string;
  vehicleId: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  startLocation: {
    type: string;
    coordinates: [number, number];
  };
  endLocation: {
    type: string;
    coordinates: [number, number];
  };
  waypoints: {
    location: {
      type: string;
      coordinates: [number, number];
    };
    isVisited: boolean;
    stopDurationMinutes?: number;
  }[];
  estimatedEndTime?: string;
  actualEndTime?: string;
  distanceKm: number;
  averageSpeedKmh: number;
}

// State type definition
interface SimulatorState {
  simulations: SimulationConfig[];
  vehicles: SimulatedVehicle[];
  trips: SimulatedTrip[];
  activeSimulation: SimulationConfig | null;
  activeVehicle: SimulatedVehicle | null;
  activeTrip: SimulatedTrip | null;
  loading: {
    simulations: boolean;
    vehicles: boolean;
    trips: boolean;
  };
  error: string | null;
}

// Initial state
const initialState: SimulatorState = {
  simulations: [],
  vehicles: [],
  trips: [],
  activeSimulation: null,
  activeVehicle: null,
  activeTrip: null,
  loading: {
    simulations: false,
    vehicles: false,
    trips: false,
  },
  error: null,
};

// Simulation thunks
export const fetchSimulations = createAsyncThunk(
  'simulator/fetchSimulations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await simulatorService.getSimulations();
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
      const response = await simulatorService.getSimulation(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch simulation');
    }
  }
);

export const createSimulation = createAsyncThunk(
  'simulator/createSimulation',
  async (simulationData: Partial<SimulationConfig>, { rejectWithValue }) => {
    try {
      const response = await simulatorService.createSimulation(simulationData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create simulation');
    }
  }
);

export const updateSimulation = createAsyncThunk(
  'simulator/updateSimulation',
  async ({ id, data }: { id: string; data: Partial<SimulationConfig> }, { rejectWithValue }) => {
    try {
      const response = await simulatorService.updateSimulation(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update simulation');
    }
  }
);

export const deleteSimulation = createAsyncThunk(
  'simulator/deleteSimulation',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await simulatorService.deleteSimulation(id);
      return { id, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete simulation');
    }
  }
);

export const startSimulation = createAsyncThunk(
  'simulator/startSimulation',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await simulatorService.startSimulation(id);
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
      const response = await simulatorService.stopSimulation(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to stop simulation');
    }
  }
);

export const pauseSimulation = createAsyncThunk(
  'simulator/pauseSimulation',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await simulatorService.pauseSimulation(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to pause simulation');
    }
  }
);

export const initializeSimulation = createAsyncThunk(
  'simulator/initializeSimulation',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await simulatorService.initializeSimulation(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to initialize simulation');
    }
  }
);

export const initializeDefaultSimulation = createAsyncThunk(
  'simulator/initializeDefaultSimulation',
  async (_, { rejectWithValue }) => {
    try {
      const response = await simulatorService.initializeDefaultSimulation();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to initialize default simulation');
    }
  }
);

// Vehicle thunks
export const fetchSimulatedVehicles = createAsyncThunk(
  'simulator/fetchVehicles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await simulatorService.getVehicles();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch vehicles');
    }
  }
);

export const fetchSimulatedVehicleById = createAsyncThunk(
  'simulator/fetchVehicleById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await simulatorService.getVehicle(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch vehicle');
    }
  }
);

export const createSimulatedVehicle = createAsyncThunk(
  'simulator/createVehicle',
  async (vehicleData: Partial<SimulatedVehicle>, { rejectWithValue }) => {
    try {
      const response = await simulatorService.createVehicle(vehicleData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create vehicle');
    }
  }
);

export const addExistingVehicle = createAsyncThunk(
  'simulator/addExistingVehicle',
  async (vehicleId: string, { rejectWithValue }) => {
    try {
      const response = await simulatorService.addExistingVehicle({ vehicleId });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add existing vehicle');
    }
  }
);

export const updateVehicleStatus = createAsyncThunk(
  'simulator/updateVehicleStatus',
  async ({ id, status }: { id: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await simulatorService.updateVehicleStatus(id, status);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update vehicle status');
    }
  }
);

export const updateVehicleLocation = createAsyncThunk(
  'simulator/updateVehicleLocation',
  async ({ id, location }: { id: string; location: any }, { rejectWithValue }) => {
    try {
      const response = await simulatorService.updateVehicleLocation(id, location);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update vehicle location');
    }
  }
);

export const resetVehicles = createAsyncThunk(
  'simulator/resetVehicles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await simulatorService.resetVehicles();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reset vehicles');
    }
  }
);

export const removeAllVehicles = createAsyncThunk(
  'simulator/removeAllVehicles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await simulatorService.removeAllVehicles();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove all vehicles');
    }
  }
);

// Trip thunks
export const fetchTrips = createAsyncThunk(
  'simulator/fetchTrips',
  async (_, { rejectWithValue }) => {
    try {
      const response = await simulatorService.getTrips();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch trips');
    }
  }
);

export const fetchActiveTrips = createAsyncThunk(
  'simulator/fetchActiveTrips',
  async (_, { rejectWithValue }) => {
    try {
      const response = await simulatorService.getActiveTrips();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch active trips');
    }
  }
);

export const fetchTripById = createAsyncThunk(
  'simulator/fetchTripById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await simulatorService.getTrip(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch trip');
    }
  }
);

export const fetchVehicleTrips = createAsyncThunk(
  'simulator/fetchVehicleTrips',
  async (vehicleId: string, { rejectWithValue }) => {
    try {
      const response = await simulatorService.getVehicleTrips(vehicleId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch vehicle trips');
    }
  }
);

export const createVehicleTrip = createAsyncThunk(
  'simulator/createVehicleTrip',
  async ({ vehicleId, tripData }: { vehicleId: string; tripData?: any }, { rejectWithValue }) => {
    try {
      const response = await simulatorService.createVehicleTrip(vehicleId, tripData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create trip');
    }
  }
);

export const startVehicleTrip = createAsyncThunk(
  'simulator/startVehicleTrip',
  async (tripId: string, { rejectWithValue }) => {
    try {
      const response = await simulatorService.startTrip(tripId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start trip');
    }
  }
);

export const completeVehicleTrip = createAsyncThunk(
  'simulator/completeVehicleTrip',
  async (tripId: string, { rejectWithValue }) => {
    try {
      const response = await simulatorService.completeTrip(tripId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to complete trip');
    }
  }
);

// Slice
const simulatorSlice = createSlice({
  name: 'simulator',
  initialState,
  reducers: {
    setActiveSimulation: (state, action) => {
      state.activeSimulation = action.payload;
    },
    setActiveVehicle: (state, action) => {
      state.activeVehicle = action.payload;
    },
    setActiveTrip: (state, action) => {
      state.activeTrip = action.payload;
    },
    clearErrors: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Simulation reducers
    builder
      .addCase(fetchSimulations.pending, (state) => {
        state.loading.simulations = true;
        state.error = null;
      })
      .addCase(fetchSimulations.fulfilled, (state, action) => {
        state.loading.simulations = false;
        state.simulations = action.payload.data;
      })
      .addCase(fetchSimulations.rejected, (state, action) => {
        state.loading.simulations = false;
        state.error = action.payload as string;
      })
      
      .addCase(fetchSimulationById.pending, (state) => {
        state.loading.simulations = true;
        state.error = null;
      })
      .addCase(fetchSimulationById.fulfilled, (state, action) => {
        state.loading.simulations = false;
        const simulation = action.payload.data;
        const index = state.simulations.findIndex(s => s._id === simulation._id);
        if (index >= 0) {
          state.simulations[index] = simulation;
        } else {
          state.simulations.push(simulation);
        }
        state.activeSimulation = simulation;
      })
      .addCase(fetchSimulationById.rejected, (state, action) => {
        state.loading.simulations = false;
        state.error = action.payload as string;
      })
      
      .addCase(createSimulation.pending, (state) => {
        state.loading.simulations = true;
        state.error = null;
      })
      .addCase(createSimulation.fulfilled, (state, action) => {
        state.loading.simulations = false;
        state.simulations.push(action.payload.data);
        state.activeSimulation = action.payload.data;
      })
      .addCase(createSimulation.rejected, (state, action) => {
        state.loading.simulations = false;
        state.error = action.payload as string;
      })
      
      .addCase(updateSimulation.pending, (state) => {
        state.loading.simulations = true;
        state.error = null;
      })
      .addCase(updateSimulation.fulfilled, (state, action) => {
        state.loading.simulations = false;
        const updated = action.payload.data;
        state.simulations = state.simulations.map(sim => 
          sim._id === updated._id ? updated : sim
        );
        if (state.activeSimulation && state.activeSimulation._id === updated._id) {
          state.activeSimulation = updated;
        }
      })
      .addCase(updateSimulation.rejected, (state, action) => {
        state.loading.simulations = false;
        state.error = action.payload as string;
      })
      
      .addCase(deleteSimulation.pending, (state) => {
        state.loading.simulations = true;
        state.error = null;
      })
      .addCase(deleteSimulation.fulfilled, (state, action) => {
        state.loading.simulations = false;
        state.simulations = state.simulations.filter(sim => sim._id !== action.payload.id);
        if (state.activeSimulation && state.activeSimulation._id === action.payload.id) {
          state.activeSimulation = null;
        }
      })
      .addCase(deleteSimulation.rejected, (state, action) => {
        state.loading.simulations = false;
        state.error = action.payload as string;
      })
      
      .addCase(startSimulation.pending, (state) => {
        state.loading.simulations = true;
        state.error = null;
      })
      .addCase(startSimulation.fulfilled, (state, action) => {
        state.loading.simulations = false;
        const updated = action.payload.data;
        state.simulations = state.simulations.map(sim => 
          sim._id === updated._id ? { ...sim, status: 'RUNNING', startedAt: new Date().toISOString() } : sim
        );
        if (state.activeSimulation && state.activeSimulation._id === updated._id) {
          state.activeSimulation = { ...state.activeSimulation, status: 'RUNNING', startedAt: new Date().toISOString() };
        }
      })
      .addCase(startSimulation.rejected, (state, action) => {
        state.loading.simulations = false;
        state.error = action.payload as string;
      })
      
      .addCase(stopSimulation.pending, (state) => {
        state.loading.simulations = true;
        state.error = null;
      })
      .addCase(stopSimulation.fulfilled, (state, action) => {
        state.loading.simulations = false;
        const updated = action.payload.data;
        state.simulations = state.simulations.map(sim => 
          sim._id === updated._id ? { ...sim, status: 'STOPPED', stoppedAt: new Date().toISOString() } : sim
        );
        if (state.activeSimulation && state.activeSimulation._id === updated._id) {
          state.activeSimulation = { ...state.activeSimulation, status: 'STOPPED', stoppedAt: new Date().toISOString() };
        }
      })
      .addCase(stopSimulation.rejected, (state, action) => {
        state.loading.simulations = false;
        state.error = action.payload as string;
      })
      
      .addCase(pauseSimulation.pending, (state) => {
        state.loading.simulations = true;
        state.error = null;
      })
      .addCase(pauseSimulation.fulfilled, (state, action) => {
        state.loading.simulations = false;
        const updated = action.payload.data;
        state.simulations = state.simulations.map(sim => 
          sim._id === updated._id ? { ...sim, status: 'PAUSED' } : sim
        );
        if (state.activeSimulation && state.activeSimulation._id === updated._id) {
          state.activeSimulation = { ...state.activeSimulation, status: 'PAUSED' };
        }
      })
      .addCase(pauseSimulation.rejected, (state, action) => {
        state.loading.simulations = false;
        state.error = action.payload as string;
      })

    // Vehicle reducers
      .addCase(fetchSimulatedVehicles.pending, (state) => {
        state.loading.vehicles = true;
        state.error = null;
      })
      .addCase(fetchSimulatedVehicles.fulfilled, (state, action) => {
        state.loading.vehicles = false;
        state.vehicles = action.payload.data;
      })
      .addCase(fetchSimulatedVehicles.rejected, (state, action) => {
        state.loading.vehicles = false;
        state.error = action.payload as string;
      })
      
      .addCase(fetchSimulatedVehicleById.pending, (state) => {
        state.loading.vehicles = true;
        state.error = null;
      })
      .addCase(fetchSimulatedVehicleById.fulfilled, (state, action) => {
        state.loading.vehicles = false;
        const vehicle = action.payload.data;
        const index = state.vehicles.findIndex(v => v._id === vehicle._id);
        if (index >= 0) {
          state.vehicles[index] = vehicle;
        } else {
          state.vehicles.push(vehicle);
        }
        state.activeVehicle = vehicle;
      })
      .addCase(fetchSimulatedVehicleById.rejected, (state, action) => {
        state.loading.vehicles = false;
        state.error = action.payload as string;
      })
      
      .addCase(createSimulatedVehicle.pending, (state) => {
        state.loading.vehicles = true;
        state.error = null;
      })
      .addCase(createSimulatedVehicle.fulfilled, (state, action) => {
        state.loading.vehicles = false;
        state.vehicles.push(action.payload.data);
        state.activeVehicle = action.payload.data;
      })
      .addCase(createSimulatedVehicle.rejected, (state, action) => {
        state.loading.vehicles = false;
        state.error = action.payload as string;
      })
      
      .addCase(addExistingVehicle.pending, (state) => {
        state.loading.vehicles = true;
        state.error = null;
      })
      .addCase(addExistingVehicle.fulfilled, (state, action) => {
        state.loading.vehicles = false;
        state.vehicles.push(action.payload.data);
        state.activeVehicle = action.payload.data;
      })
      .addCase(addExistingVehicle.rejected, (state, action) => {
        state.loading.vehicles = false;
        state.error = action.payload as string;
      })
      
      .addCase(updateVehicleStatus.pending, (state) => {
        state.loading.vehicles = true;
        state.error = null;
      })
      .addCase(updateVehicleStatus.fulfilled, (state, action) => {
        state.loading.vehicles = false;
        const updated = action.payload.data;
        state.vehicles = state.vehicles.map(vehicle => 
          vehicle._id === updated._id ? updated : vehicle
        );
        if (state.activeVehicle && state.activeVehicle._id === updated._id) {
          state.activeVehicle = updated;
        }
      })
      .addCase(updateVehicleStatus.rejected, (state, action) => {
        state.loading.vehicles = false;
        state.error = action.payload as string;
      })
      
      .addCase(updateVehicleLocation.pending, (state) => {
        state.loading.vehicles = true;
        state.error = null;
      })
      .addCase(updateVehicleLocation.fulfilled, (state, action) => {
        state.loading.vehicles = false;
        const updated = action.payload.data;
        state.vehicles = state.vehicles.map(vehicle => 
          vehicle._id === updated._id ? updated : vehicle
        );
        if (state.activeVehicle && state.activeVehicle._id === updated._id) {
          state.activeVehicle = updated;
        }
      })
      .addCase(updateVehicleLocation.rejected, (state, action) => {
        state.loading.vehicles = false;
        state.error = action.payload as string;
      })
      
      .addCase(resetVehicles.pending, (state) => {
        state.loading.vehicles = true;
        state.error = null;
      })
      .addCase(resetVehicles.fulfilled, (state, action) => {
        state.loading.vehicles = false;
        state.vehicles = action.payload.data;
        state.activeVehicle = null;
      })
      .addCase(resetVehicles.rejected, (state, action) => {
        state.loading.vehicles = false;
        state.error = action.payload as string;
      })
      
      .addCase(removeAllVehicles.pending, (state) => {
        state.loading.vehicles = true;
        state.error = null;
      })
      .addCase(removeAllVehicles.fulfilled, (state) => {
        state.loading.vehicles = false;
        state.vehicles = [];
        state.activeVehicle = null;
      })
      .addCase(removeAllVehicles.rejected, (state, action) => {
        state.loading.vehicles = false;
        state.error = action.payload as string;
      })
    
    // Trip reducers
      .addCase(fetchTrips.pending, (state) => {
        state.loading.trips = true;
        state.error = null;
      })
      .addCase(fetchTrips.fulfilled, (state, action) => {
        state.loading.trips = false;
        state.trips = action.payload.data;
      })
      .addCase(fetchTrips.rejected, (state, action) => {
        state.loading.trips = false;
        state.error = action.payload as string;
      })
      
      .addCase(fetchActiveTrips.pending, (state) => {
        state.loading.trips = true;
        state.error = null;
      })
      .addCase(fetchActiveTrips.fulfilled, (state, action) => {
        state.loading.trips = false;
        // Merge active trips with existing ones, replacing duplicates
        const activeTrips = action.payload.data;
        const existingIds = new Set(activeTrips.map((trip: SimulatedTrip) => trip._id));
        state.trips = [
          ...state.trips.filter((trip) => !existingIds.has(trip._id)),
          ...activeTrips
        ];
      })
      .addCase(fetchActiveTrips.rejected, (state, action) => {
        state.loading.trips = false;
        state.error = action.payload as string;
      })
      
      .addCase(fetchTripById.pending, (state) => {
        state.loading.trips = true;
        state.error = null;
      })
      .addCase(fetchTripById.fulfilled, (state, action) => {
        state.loading.trips = false;
        const trip = action.payload.data;
        const index = state.trips.findIndex(t => t._id === trip._id);
        if (index >= 0) {
          state.trips[index] = trip;
        } else {
          state.trips.push(trip);
        }
        state.activeTrip = trip;
      })
      .addCase(fetchTripById.rejected, (state, action) => {
        state.loading.trips = false;
        state.error = action.payload as string;
      })
      
      .addCase(fetchVehicleTrips.pending, (state) => {
        state.loading.trips = true;
        state.error = null;
      })
      .addCase(fetchVehicleTrips.fulfilled, (state, action) => {
        state.loading.trips = false;
        const vehicleTrips = action.payload.data;
        // Merge vehicle trips with existing ones, replacing duplicates
        const existingIds = new Set(vehicleTrips.map((trip: SimulatedTrip) => trip._id));
        state.trips = [
          ...state.trips.filter((trip) => !existingIds.has(trip._id)),
          ...vehicleTrips
        ];
      })
      .addCase(fetchVehicleTrips.rejected, (state, action) => {
        state.loading.trips = false;
        state.error = action.payload as string;
      })
      
      .addCase(createVehicleTrip.pending, (state) => {
        state.loading.trips = true;
        state.error = null;
      })
      .addCase(createVehicleTrip.fulfilled, (state, action) => {
        state.loading.trips = false;
        const newTrip = action.payload.data;
        state.trips.push(newTrip);
        state.activeTrip = newTrip;
      })
      .addCase(createVehicleTrip.rejected, (state, action) => {
        state.loading.trips = false;
        state.error = action.payload as string;
      })
      
      .addCase(startVehicleTrip.pending, (state) => {
        state.loading.trips = true;
        state.error = null;
      })
      .addCase(startVehicleTrip.fulfilled, (state, action) => {
        state.loading.trips = false;
        const updatedTrip = action.payload.data;
        state.trips = state.trips.map(trip => 
          trip._id === updatedTrip._id ? { ...trip, status: 'IN_PROGRESS' } : trip
        );
        if (state.activeTrip && state.activeTrip._id === updatedTrip._id) {
          state.activeTrip = { ...state.activeTrip, status: 'IN_PROGRESS' };
        }
        
        // Update the associated vehicle if it exists in state
        if (updatedTrip.vehicleId) {
          state.vehicles = state.vehicles.map(vehicle => 
            vehicle._id === updatedTrip.vehicleId || vehicle.vehicleId === updatedTrip.vehicleId
              ? { ...vehicle, status: 'RUNNING', currentTrip: updatedTrip._id }
              : vehicle
          );
          
          if (state.activeVehicle && 
              (state.activeVehicle._id === updatedTrip.vehicleId || 
              state.activeVehicle.vehicleId === updatedTrip.vehicleId)) {
            state.activeVehicle = { 
              ...state.activeVehicle, 
              status: 'RUNNING', 
              currentTrip: updatedTrip._id 
            };
          }
        }
      })
      .addCase(startVehicleTrip.rejected, (state, action) => {
        state.loading.trips = false;
        state.error = action.payload as string;
      })
      
      .addCase(completeVehicleTrip.pending, (state) => {
        state.loading.trips = true;
        state.error = null;
      })
      .addCase(completeVehicleTrip.fulfilled, (state, action) => {
        state.loading.trips = false;
        const updatedTrip = action.payload.data;
        state.trips = state.trips.map(trip => 
          trip._id === updatedTrip._id ? { ...trip, status: 'COMPLETED' } : trip
        );
        if (state.activeTrip && state.activeTrip._id === updatedTrip._id) {
          state.activeTrip = { ...state.activeTrip, status: 'COMPLETED' };
        }
        
        // Update the associated vehicle if it exists in state
        if (updatedTrip.vehicleId) {
          state.vehicles = state.vehicles.map(vehicle => 
            vehicle._id === updatedTrip.vehicleId || vehicle.vehicleId === updatedTrip.vehicleId
              ? { ...vehicle, status: 'IDLE', currentTrip: undefined }
              : vehicle
          );
          
          if (state.activeVehicle && 
              (state.activeVehicle._id === updatedTrip.vehicleId || 
              state.activeVehicle.vehicleId === updatedTrip.vehicleId)) {
            state.activeVehicle = { 
              ...state.activeVehicle, 
              status: 'IDLE', 
              currentTrip: undefined 
            };
          }
        }
      })
      .addCase(completeVehicleTrip.rejected, (state, action) => {
        state.loading.trips = false;
        state.error = action.payload as string;
      });
  },
});

export const { setActiveSimulation, setActiveVehicle, setActiveTrip, clearErrors } = simulatorSlice.actions;

export default simulatorSlice.reducer; 