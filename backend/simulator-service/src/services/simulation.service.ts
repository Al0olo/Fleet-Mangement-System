import { SimulationConfig, ISimulationConfig, SimulationStatus, IRegion } from '../models/simulation.model';
import { generateSimulatedVehicles, updateVehicleStatus, getAllSimulatedVehicles, updateVehicleLocation } from './vehicle.service';
import { createSimulatedTrip, startTrip, completeTrip, getActiveTrips, getNextRoutePoint } from './trip.service';
import { publishLocationUpdate, publishStatusUpdate, publishMaintenanceEvent, publishSensorData } from './kafka.service';
import { VehicleStatus, IVehicle } from '../models/vehicle.model';
import { ITrip } from '../models/trip.model';
import { logger } from '../util/logger';
import { config } from '../config';

// Map to store running simulation intervals
const simulationIntervals: Map<string, NodeJS.Timeout> = new Map();

/**
 * Create a new simulation configuration
 */
export const createSimulationConfig = async (
  name: string,
  vehicleCount: number,
  region: IRegion,
  updateFrequencyMs: number,
  isDefault: boolean = false,
  probabilities?: { maintenance: number; idle: number }
): Promise<ISimulationConfig> => {
  try {
    const simulationConfig = new SimulationConfig({
      name,
      status: SimulationStatus.STOPPED,
      vehicleCount,
      region,
      updateFrequencyMs,
      isDefault,
      probabilities: probabilities || {
        maintenance: config.simulation.probabilities.maintenance,
        idle: config.simulation.probabilities.idle
      }
    });
    
    await simulationConfig.save();
    logger.info(`Created simulation configuration: ${name}`);
    return simulationConfig;
  } catch (error) {
    logger.error('Failed to create simulation configuration', error);
    throw error;
  }
};

/**
 * Get all simulation configurations
 */
export const getAllSimulationConfigs = async (): Promise<ISimulationConfig[]> => {
  try {
    return await SimulationConfig.find().sort({ createdAt: -1 });
  } catch (error) {
    logger.error('Failed to get all simulation configurations', error);
    throw error;
  }
};

/**
 * Get a simulation configuration by ID
 */
export const getSimulationConfigById = async (id: string): Promise<ISimulationConfig | null> => {
  try {
    return await SimulationConfig.findById(id);
  } catch (error) {
    logger.error(`Failed to get simulation configuration: ${id}`, error);
    throw error;
  }
};

/**
 * Get the default simulation configuration
 */
export const getDefaultSimulationConfig = async (): Promise<ISimulationConfig | null> => {
  try {
    return await SimulationConfig.findOne({ isDefault: true });
  } catch (error) {
    logger.error('Failed to get default simulation configuration', error);
    throw error;
  }
};

/**
 * Update a simulation configuration
 */
export const updateSimulationConfig = async (
  id: string,
  updates: Partial<ISimulationConfig>
): Promise<ISimulationConfig | null> => {
  try {
    // Get existing config to check if we need to restart simulation
    const existingConfig = await SimulationConfig.findById(id);
    
    if (!existingConfig) {
      return null;
    }
    
    // Apply updates
    const updatedConfig = await SimulationConfig.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );
    
    // If simulation is running and update frequency changed, restart it
    if (
      updatedConfig && 
      updatedConfig.status === SimulationStatus.RUNNING && 
      'updateFrequencyMs' in updates &&
      simulationIntervals.has(id)
    ) {
      // Stop and restart the simulation with new frequency
      await stopSimulation(id);
      await startSimulation(id);
    }
    
    logger.info(`Updated simulation configuration: ${id}`);
    return updatedConfig;
  } catch (error) {
    logger.error(`Failed to update simulation configuration: ${id}`, error);
    throw error;
  }
};

/**
 * Delete a simulation configuration
 */
export const deleteSimulationConfig = async (id: string): Promise<boolean> => {
  try {
    // Stop simulation if running
    if (simulationIntervals.has(id)) {
      await stopSimulation(id);
    }
    
    const result = await SimulationConfig.findByIdAndDelete(id);
    
    if (!result) {
      return false;
    }
    
    logger.info(`Deleted simulation configuration: ${id}`);
    return true;
  } catch (error) {
    logger.error(`Failed to delete simulation configuration: ${id}`, error);
    throw error;
  }
};

/**
 * Initialize simulation by creating vehicles
 */
export const initializeSimulation = async (simulationId: string): Promise<ISimulationConfig | null> => {
  try {
    const simulation = await SimulationConfig.findById(simulationId);
    
    if (!simulation) {
      logger.warn(`Simulation not found: ${simulationId}`);
      return null;
    }
    
    // Get all vehicles and count
    const existingVehicles = await getAllSimulatedVehicles();
    
    // If we need more vehicles, create them
    if (existingVehicles.length < simulation.vehicleCount) {
      const vehiclesToCreate = simulation.vehicleCount - existingVehicles.length;
      await generateSimulatedVehicles(vehiclesToCreate, simulation.region);
    }
    
    logger.info(`Initialized simulation: ${simulationId}`);
    return simulation;
  } catch (error) {
    logger.error(`Failed to initialize simulation: ${simulationId}`, error);
    throw error;
  }
};

/**
 * Process vehicle updates for a simulation cycle
 */
const processVehicleUpdates = async (
  simulation: ISimulationConfig,
  vehicles: IVehicle[],
  activeTrips: ITrip[]
): Promise<void> => {
  const currentTime = new Date();
  const activeVehicleIds = activeTrips.map(trip => trip.vehicleId);
  // const vehiclesToUpdate: IVehicle[] = []; // Unused variable
  
  // Map of vehicle IDs to trips
  const tripsByVehicleId = activeTrips.reduce((map, trip) => {
    map.set(trip.vehicleId, trip);
    return map;
  }, new Map<string, ITrip>());
  
  // Process each vehicle
  for (const vehicle of vehicles) {
    try {
      // If vehicle is on an active trip, update its position
      if (activeVehicleIds.includes(vehicle.vehicleId)) {
        const trip = tripsByVehicleId.get(vehicle.vehicleId);
        if (trip) {
          const nextPoint = getNextRoutePoint(trip, currentTime);
          
          if (nextPoint) {
            // Update vehicle position
            await updateVehicleLocation(
              vehicle.vehicleId,
              nextPoint.point.location,
              nextPoint.point.speed,
              nextPoint.point.heading
            );
            
            // Publish location update to Kafka
            await publishLocationUpdate(
              vehicle.vehicleId,
              nextPoint.point.location.coordinates[1],
              nextPoint.point.location.coordinates[0],
              nextPoint.point.speed,
              nextPoint.point.heading
            );
            
            // Generate sensor data when vehicle is moving
            // Engine sensor data
            await publishSensorData(
              vehicle.vehicleId,
              'engine',
              {
                isRunning: true,
                temperature: 80 + Math.random() * 20, // 80-100 degrees
                rpm: 1200 + Math.random() * 1800, // 1200-3000 rpm
                hoursOperated: vehicle.engineHours + (Math.random() * 0.01), // Small increment
                diagnosticCodes: []
              }
            );
            
            // Calculate fuel consumption based on speed and distance
            const fuelConsumed = (nextPoint.point.speed * 0.01) * (1 + Math.random() * 0.2); // More fuel at higher speeds
            const distanceSinceLastReading = nextPoint.point.speed * (5 / 3600); // km traveled in 5 seconds
            
            // Fuel sensor data
            await publishSensorData(
              vehicle.vehicleId,
              'fuel',
              {
                fuelLevel: Math.max(0, Math.min(100, vehicle.fuelLevel - fuelConsumed * 0.1)),
                fuelConsumed: fuelConsumed,
                distanceSinceLastReading: distanceSinceLastReading
              }
            );
            
            // Utilization sensor data
            await publishSensorData(
              vehicle.vehicleId,
              'utilization',
              {
                utilizationRate: 0.7 + Math.random() * 0.3, // 70-100% when moving
                status: 'active',
                load: Math.random() * 0.8 // 0-80% load
              }
            );
            
            // Complete trip if we've reached the last point
            if (nextPoint.isLastPoint) {
              await completeTrip(trip.tripId);
            }
          }
        }
      } else {
        // Vehicle is not on a trip
        if (vehicle.status === VehicleStatus.IDLE) {
          // Send idle vehicle sensor data occasionally
          if (Math.random() < 0.5) { // 50% chance each cycle
            // Engine sensor data for idle vehicle
            await publishSensorData(
              vehicle.vehicleId,
              'engine',
              {
                isRunning: Math.random() > 0.7, // 30% chance engine is running while idle
                temperature: 40 + Math.random() * 20, // 40-60 degrees when cool
                rpm: Math.random() > 0.7 ? 800 + Math.random() * 200 : 0, // Idle RPM or off
                hoursOperated: vehicle.engineHours,
                diagnosticCodes: []
              }
            );
            
            // Utilization sensor data for idle vehicle
            await publishSensorData(
              vehicle.vehicleId,
              'utilization',
              {
                utilizationRate: Math.random() * 0.2, // 0-20% utilization when idle
                status: 'idle',
                load: 0
              }
            );
          }
          
          // Random chance to start a new trip
          if (Math.random() < 0.3) {
            const trip = await createSimulatedTrip(vehicle, simulation.region);
            await startTrip(trip.tripId);
          }
          
          // Random chance to go into maintenance (only if IDLE)
          else if (Math.random() < simulation.probabilities.maintenance) {
            await updateVehicleStatus(vehicle.vehicleId, VehicleStatus.MAINTENANCE);
            await publishStatusUpdate(vehicle.vehicleId, VehicleStatus.MAINTENANCE);
            await publishMaintenanceEvent(
              vehicle.vehicleId,
              'Scheduled maintenance required',
              new Date()
            );
          }
        } else if (vehicle.status === VehicleStatus.MAINTENANCE) {
          // Maintenance vehicle sensor data
          if (Math.random() < 0.7) { // 70% chance each cycle
            // Engine sensor data for maintenance vehicle
            await publishSensorData(
              vehicle.vehicleId,
              'engine',
              {
                isRunning: false,
                temperature: 20 + Math.random() * 10, // Cold engine
                rpm: 0,
                hoursOperated: vehicle.engineHours,
                diagnosticCodes: ['P0128', 'P0300'] // Sample diagnostic codes
              }
            );
            
            // Utilization sensor data for maintenance vehicle
            await publishSensorData(
              vehicle.vehicleId,
              'utilization',
              {
                utilizationRate: 0, // 0% utilization in maintenance
                status: 'maintenance',
                load: 0
              }
            );
          }
          
          // Random chance to complete maintenance
          if (Math.random() < 0.1) {
            await updateVehicleStatus(vehicle.vehicleId, VehicleStatus.IDLE);
            await publishStatusUpdate(vehicle.vehicleId, VehicleStatus.IDLE);
          }
        }
      }
    } catch (error) {
      logger.error(`Error processing vehicle ${vehicle.vehicleId}`, error);
    }
  }
};

/**
 * Simulation update cycle
 */
const simulationCycle = async (simulationId: string): Promise<void> => {
  try {
    // Get simulation config
    const simulation = await SimulationConfig.findById(simulationId);
    
    if (!simulation || simulation.status !== SimulationStatus.RUNNING) {
      // Stop simulation if not running
      if (simulationIntervals.has(simulationId)) {
        clearInterval(simulationIntervals.get(simulationId));
        simulationIntervals.delete(simulationId);
      }
      return;
    }
    
    // Get all vehicles and active trips
    const vehicles = await getAllSimulatedVehicles();
    const activeTrips = await getActiveTrips();
    
    // Process updates
    await processVehicleUpdates(simulation, vehicles, activeTrips);
    
    // Increment events generated count
    simulation.eventsGenerated += vehicles.length;
    simulation.vehiclesInSimulation = vehicles.length;
    await simulation.save();
    
  } catch (error) {
    logger.error(`Error in simulation cycle for ${simulationId}`, error);
  }
};

/**
 * Start a simulation
 */
export const startSimulation = async (simulationId: string): Promise<ISimulationConfig | null> => {
  try {
    const simulation = await SimulationConfig.findById(simulationId);
    
    if (!simulation) {
      logger.warn(`Simulation not found: ${simulationId}`);
      return null;
    }
    
    // Initialize simulation first
    await initializeSimulation(simulationId);
    
    // Update simulation status
    simulation.status = SimulationStatus.RUNNING;
    simulation.startedAt = new Date();
    simulation.stoppedAt = undefined;
    await simulation.save();
    
    // Stop any existing interval
    if (simulationIntervals.has(simulationId)) {
      clearInterval(simulationIntervals.get(simulationId));
    }
    
    // Start interval for updates
    const interval = setInterval(
      () => simulationCycle(simulationId),
      simulation.updateFrequencyMs
    );
    
    simulationIntervals.set(simulationId, interval);
    
    logger.info(`Started simulation: ${simulationId}`);
    return simulation;
  } catch (error) {
    logger.error(`Failed to start simulation: ${simulationId}`, error);
    throw error;
  }
};

/**
 * Stop a simulation
 */
export const stopSimulation = async (simulationId: string): Promise<ISimulationConfig | null> => {
  try {
    const simulation = await SimulationConfig.findById(simulationId);
    
    if (!simulation) {
      logger.warn(`Simulation not found: ${simulationId}`);
      return null;
    }
    
    // Update simulation status
    simulation.status = SimulationStatus.STOPPED;
    simulation.stoppedAt = new Date();
    await simulation.save();
    
    // Stop interval
    if (simulationIntervals.has(simulationId)) {
      clearInterval(simulationIntervals.get(simulationId));
      simulationIntervals.delete(simulationId);
    }
    
    logger.info(`Stopped simulation: ${simulationId}`);
    return simulation;
  } catch (error) {
    logger.error(`Failed to stop simulation: ${simulationId}`, error);
    throw error;
  }
};

/**
 * Pause a simulation
 */
export const pauseSimulation = async (simulationId: string): Promise<ISimulationConfig | null> => {
  try {
    const simulation = await SimulationConfig.findById(simulationId);
    
    if (!simulation) {
      logger.warn(`Simulation not found: ${simulationId}`);
      return null;
    }
    
    // Update simulation status
    simulation.status = SimulationStatus.PAUSED;
    await simulation.save();
    
    // Stop interval but keep it in the map
    if (simulationIntervals.has(simulationId)) {
      clearInterval(simulationIntervals.get(simulationId));
    }
    
    logger.info(`Paused simulation: ${simulationId}`);
    return simulation;
  } catch (error) {
    logger.error(`Failed to pause simulation: ${simulationId}`, error);
    throw error;
  }
};

/**
 * Initialize default simulation config if none exists
 */
export const initializeDefaultSimulation = async (): Promise<ISimulationConfig> => {
  try {
    const defaultConfig = await getDefaultSimulationConfig();
    
    if (defaultConfig) {
      return defaultConfig;
    }
    
    // Create default simulation config
    const newDefaultConfig = await createSimulationConfig(
      'Default Simulation',
      config.simulation.defaultVehicleCount,
      config.simulation.defaultRegion,
      config.simulation.updateFrequencyMs,
      true
    );
    
    logger.info('Created default simulation configuration');
    return newDefaultConfig;
  } catch (error) {
    logger.error('Failed to initialize default simulation', error);
    throw error;
  }
}; 