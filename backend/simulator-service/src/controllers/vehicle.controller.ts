import { Request, Response } from 'express';
import { HttpError } from '../middleware/error.middleware';
import { 
  getAllSimulatedVehicles,
  getSimulatedVehicleById,
  createSimulatedVehicle,
  updateVehicleStatus,
  updateVehicleLocation,
  resetSimulatedVehicles,
  removeAllSimulatedVehicles
} from '../services/vehicle.service';
import { VehicleStatus } from '../models/vehicle.model';
import { logger } from '../util/logger';
import { config } from '../config';

/**
 * Get all simulated vehicles
 */
export const getAllVehiclesController = async (_req: Request, res: Response): Promise<void> => {
  try {
    const vehicles = await getAllSimulatedVehicles();
    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });
  } catch (error) {
    logger.error('Error getting all vehicles', error);
    throw new HttpError('Failed to get vehicles', 500);
  }
};

/**
 * Get a simulated vehicle by ID
 */
export const getVehicleByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const vehicle = await getSimulatedVehicleById(id);
    
    if (!vehicle) {
      throw new HttpError('Vehicle not found', 404);
    }
    
    res.status(200).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    logger.error(`Error getting vehicle by ID: ${req.params.id}`, error);
    throw new HttpError('Failed to get vehicle', 500);
  }
};

/**
 * Create a new simulated vehicle
 */
export const createVehicleController = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract all vehicle data from the request body
    const { vehicleId, type, vin, name, location, speed, heading, fuelLevel, odometer, engineHours, active } = req.body;
    
    // Create vehicle using the data from request
    const vehicle = await createSimulatedVehicle(
      config.simulation.defaultRegion, 
      type,
      { 
        vehicleId, 
        vin, 
        name,
        location,
        speed,
        heading,
        fuelLevel,
        odometer,
        engineHours,
        active
      }
    );
    
    res.status(201).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    logger.error('Error creating vehicle', error);
    throw new HttpError('Failed to create vehicle', 500);
  }
};

/**
 * Update a vehicle's status
 */
export const updateVehicleStatusController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !Object.values(VehicleStatus).includes(status as VehicleStatus)) {
      throw new HttpError('Invalid status value', 400);
    }
    
    const vehicle = await updateVehicleStatus(id, status as VehicleStatus);
    
    if (!vehicle) {
      throw new HttpError('Vehicle not found', 404);
    }
    
    res.status(200).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    logger.error(`Error updating vehicle status: ${req.params.id}`, error);
    throw new HttpError('Failed to update vehicle status', 500);
  }
};

/**
 * Update a vehicle's location
 */
export const updateVehicleLocationController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { latitude, longitude, speed, heading } = req.body;
    
    if (!latitude || !longitude) {
      throw new HttpError('Missing required location data', 400);
    }
    
    const location = {
      type: 'Point' as const,
      coordinates: [longitude, latitude] as [number, number]
    };
    
    const vehicle = await updateVehicleLocation(
      id, 
      location, 
      speed || 0, 
      heading || 0
    );
    
    if (!vehicle) {
      throw new HttpError('Vehicle not found', 404);
    }
    
    res.status(200).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    logger.error(`Error updating vehicle location: ${req.params.id}`, error);
    throw new HttpError('Failed to update vehicle location', 500);
  }
};

/**
 * Reset all simulated vehicles
 */
export const resetVehiclesController = async (_req: Request, res: Response): Promise<void> => {
  try {
    await resetSimulatedVehicles();
    
    res.status(200).json({
      success: true,
      message: 'All vehicles reset to idle status'
    });
  } catch (error) {
    logger.error('Error resetting vehicles', error);
    throw new HttpError('Failed to reset vehicles', 500);
  }
};

/**
 * Remove all simulated vehicles
 */
export const removeAllVehiclesController = async (_req: Request, res: Response): Promise<void> => {
  try {
    await removeAllSimulatedVehicles();
    
    res.status(200).json({
      success: true,
      message: 'All vehicles removed successfully'
    });
  } catch (error) {
    logger.error('Error removing all vehicles', error);
    throw new HttpError('Failed to remove vehicles', 500);
  }
}; 