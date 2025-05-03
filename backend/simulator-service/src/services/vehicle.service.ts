import { v4 as uuidv4 } from 'uuid';
import * as geolib from 'geolib';
import { Vehicle, IVehicle, VehicleStatus, VehicleType, GeoPoint } from '../models/vehicle.model';
import { logger } from '../util/logger';
import axios from 'axios';
import { config } from '../config';

/**
 * Generate a random point within a radius of a center point
 */
export const generateRandomPoint = (
  centerLat: number,
  centerLng: number,
  radiusKm: number
): { latitude: number; longitude: number } => {
  // Convert radius from km to meters
  const radiusMeters = radiusKm * 1000;
  
  // Generate a random distance within the radius
  const randomDistance = Math.sqrt(Math.random()) * radiusMeters;
  
  // Generate a random angle in radians
  const randomAngle = Math.random() * Math.PI * 2;
  
  // Calculate the offset
  const point = geolib.computeDestinationPoint(
    { latitude: centerLat, longitude: centerLng },
    randomDistance,
    randomAngle
  );
  
  return { latitude: point.latitude, longitude: point.longitude };
};

/**
 * Generate a random VIN number
 */
const generateRandomVIN = (): string => {
  const characters = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let vin = '';
  for (let i = 0; i < 17; i++) {
    vin += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return vin;
};

/**
 * Generate a random vehicle name
 */
const generateVehicleName = (type: VehicleType): string => {
  const prefixes = {
    [VehicleType.PASSENGER]: ['Car', 'Sedan', 'SUV'],
    [VehicleType.CARGO]: ['Van', 'Truck', 'Delivery'],
    [VehicleType.HEAVY_DUTY]: ['Truck', 'Semi', 'Heavy']
  };
  
  const prefix = prefixes[type][Math.floor(Math.random() * prefixes[type].length)];
  const suffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `${prefix}-${suffix}`;
};

/**
 * Create a simulated vehicle
 */
export const createSimulatedVehicle = async (
  region: { centerLat: number; centerLng: number; radiusKm: number },
  type?: VehicleType
): Promise<IVehicle> => {
  const vehicleType = type || Object.values(VehicleType)[
    Math.floor(Math.random() * Object.values(VehicleType).length)
  ];
  
  const point = generateRandomPoint(region.centerLat, region.centerLng, region.radiusKm);
  
  const vehicle = new Vehicle({
    vehicleId: uuidv4(),
    vin: generateRandomVIN(),
    name: generateVehicleName(vehicleType),
    type: vehicleType,
    status: VehicleStatus.IDLE,
    location: {
      type: 'Point',
      coordinates: [point.longitude, point.latitude]
    },
    speed: 0,
    heading: Math.floor(Math.random() * 360),
    fuelLevel: 70 + Math.floor(Math.random() * 30), // 70-100%
    odometer: Math.floor(Math.random() * 50000),
    engineHours: Math.floor(Math.random() * 1000),
    active: true
  });
  
  try {
    await vehicle.save();
    logger.info(`Created simulated vehicle: ${vehicle.name} (${vehicle.vehicleId})`);
    return vehicle;
  } catch (error) {
    logger.error('Failed to create simulated vehicle', error);
    throw error;
  }
};

/**
 * Generate multiple simulated vehicles
 */
export const generateSimulatedVehicles = async (count: number, region: { centerLat: number; centerLng: number; radiusKm: number }): Promise<IVehicle[]> => {
  const vehicles: IVehicle[] = [];
  
  // Distribute vehicle types
  const vehicleTypeDistribution = {
    [VehicleType.PASSENGER]: 0.6,
    [VehicleType.CARGO]: 0.3,
    [VehicleType.HEAVY_DUTY]: 0.1
  };
  
  for (let i = 0; i < count; i++) {
    // Determine vehicle type based on distribution
    const randValue = Math.random();
    let vehicleType: VehicleType = VehicleType.PASSENGER; // Default initialization
    let cumulative = 0;
    
    for (const [type, probability] of Object.entries(vehicleTypeDistribution)) {
      cumulative += probability;
      if (randValue <= cumulative) {
        vehicleType = type as VehicleType;
        break;
      }
    }
    
    try {
      const vehicle = await createSimulatedVehicle(region, vehicleType);
      vehicles.push(vehicle);
    } catch (error) {
      logger.error(`Failed to create vehicle ${i + 1}/${count}`, error);
    }
  }
  
  logger.info(`Generated ${vehicles.length} simulated vehicles`);
  return vehicles;
};

/**
 * Update vehicle status
 */
export const updateVehicleStatus = async (vehicleId: string, status: VehicleStatus): Promise<IVehicle | null> => {
  try {
    const vehicle = await Vehicle.findOneAndUpdate(
      { vehicleId },
      { 
        status,
        lastUpdated: new Date()
      },
      { new: true }
    );
    
    if (!vehicle) {
      logger.warn(`Vehicle not found: ${vehicleId}`);
      return null;
    }
    
    logger.debug(`Updated vehicle status: ${vehicleId} -> ${status}`);
    return vehicle;
  } catch (error) {
    logger.error(`Failed to update vehicle status: ${vehicleId}`, error);
    throw error;
  }
};

/**
 * Update vehicle location
 */
export const updateVehicleLocation = async (
  vehicleId: string,
  location: GeoPoint,
  speed: number,
  heading: number
): Promise<IVehicle | null> => {
  try {
    const vehicle = await Vehicle.findOneAndUpdate(
      { vehicleId },
      { 
        location,
        speed,
        heading,
        lastUpdated: new Date()
      },
      { new: true }
    );
    
    if (!vehicle) {
      logger.warn(`Vehicle not found: ${vehicleId}`);
      return null;
    }
    
    logger.debug(`Updated vehicle location: ${vehicleId}`);
    return vehicle;
  } catch (error) {
    logger.error(`Failed to update vehicle location: ${vehicleId}`, error);
    throw error;
  }
};

/**
 * Get all simulated vehicles
 */
export const getAllSimulatedVehicles = async (): Promise<IVehicle[]> => {
  try {
    return await Vehicle.find({ active: true });
  } catch (error) {
    logger.error('Failed to get all simulated vehicles', error);
    throw error;
  }
};

/**
 * Get a simulated vehicle by ID
 */
export const getSimulatedVehicleById = async (vehicleId: string): Promise<IVehicle | null> => {
  try {
    return await Vehicle.findOne({ vehicleId });
  } catch (error) {
    logger.error(`Failed to get simulated vehicle: ${vehicleId}`, error);
    throw error;
  }
};

/**
 * Fetch real vehicles from vehicle service API
 */
export const fetchVehiclesFromApi = async (): Promise<any[]> => {
  try {
    const response = await axios.get(`${config.vehicleService.baseUrl}/api/vehicles`);
    
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    return [];
  } catch (error) {
    logger.error('Failed to fetch vehicles from API', error);
    return [];
  }
};

/**
 * Reset all simulated vehicles to idle status
 */
export const resetSimulatedVehicles = async (): Promise<void> => {
  try {
    await Vehicle.updateMany(
      {},
      { 
        status: VehicleStatus.IDLE,
        speed: 0,
        currentTrip: null
      }
    );
    logger.info('Reset all simulated vehicles to idle status');
  } catch (error) {
    logger.error('Failed to reset simulated vehicles', error);
    throw error;
  }
};

/**
 * Remove all simulated vehicles
 */
export const removeAllSimulatedVehicles = async (): Promise<void> => {
  try {
    await Vehicle.deleteMany({});
    logger.info('Removed all simulated vehicles');
  } catch (error) {
    logger.error('Failed to remove all simulated vehicles', error);
    throw error;
  }
}; 