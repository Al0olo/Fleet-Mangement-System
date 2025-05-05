import { Request, Response } from 'express';
import { HttpError } from '../middleware/error.middleware';
import { 
  getAllTrips,
  getTripById,
  getTripsForVehicle,
  createSimulatedTrip,
  startTrip,
  completeTrip,
  getActiveTrips
} from '../services/trip.service';
import { getSimulatedVehicleById } from '../services/vehicle.service';
import { logger } from '../util/logger';
import { config } from '../config';

/**
 * Get all trips
 */
export const getAllTripsController = async (_req: Request, res: Response): Promise<void> => {
  try {
    const trips = await getAllTrips();
    res.status(200).json({
      success: true,
      count: trips.length,
      data: trips
    });
  } catch (error) {
    logger.error('Error getting all trips', error);
    throw new HttpError('Failed to get trips', 500);
  }
};

/**
 * Get all active trips
 */
export const getActiveTripsController = async (_req: Request, res: Response): Promise<void> => {
  try {
    const trips = await getActiveTrips();
    res.status(200).json({
      success: true,
      count: trips.length,
      data: trips
    });
  } catch (error) {
    logger.error('Error getting active trips', error);
    throw new HttpError('Failed to get active trips', 500);
  }
};

/**
 * Get a trip by ID
 */
export const getTripByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const trip = await getTripById(id);
    
    if (!trip) {
      throw new HttpError('Trip not found', 404);
    }
    
    res.status(200).json({
      success: true,
      data: trip
    });
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    logger.error(`Error getting trip by ID: ${req.params.id}`, error);
    throw new HttpError('Failed to get trip', 500);
  }
};

/**
 * Get trips for a vehicle
 */
export const getTripsForVehicleController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vehicleId } = req.params;
    const trips = await getTripsForVehicle(vehicleId);
    
    res.status(200).json({
      success: true,
      count: trips.length,
      data: trips
    });
  } catch (error) {
    logger.error(`Error getting trips for vehicle: ${req.params.vehicleId}`, error);
    throw new HttpError('Failed to get trips for vehicle', 500);
  }
};

/**
 * Create a trip for a vehicle
 */
export const createTripController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vehicleId } = req.params;
    const { includeWaypoints } = req.body;
    
    const vehicle = await getSimulatedVehicleById(vehicleId);
    
    if (!vehicle) {
      throw new HttpError('Vehicle not found', 404);
    }
    
    const trip = await createSimulatedTrip(
      vehicle, 
      config.simulation.defaultRegion,
      includeWaypoints !== undefined ? includeWaypoints : true
    );
    
    res.status(201).json({
      success: true,
      data: trip
    });
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    logger.error(`Error creating trip for vehicle: ${req.params.vehicleId}`, error);
    throw new HttpError('Failed to create trip', 500);
  }
};

/**
 * Start a trip
 */
export const startTripController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const trip = await startTrip(id);
    
    if (!trip) {
      logger.warn(`Trip not found: ${id}`);
      res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: trip,
      message: 'Trip started successfully'
    });
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    logger.error(`Error starting trip: ${req.params.id}`, error);
    throw new HttpError('Failed to start trip', 500);
  }
};

/**
 * Complete a trip
 */
export const completeTripController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const trip = await completeTrip(id);
    
    if (!trip) {
      logger.warn(`Trip not found: ${id}`);
      res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: trip,
      message: 'Trip completed successfully'
    });
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    logger.error(`Error completing trip: ${req.params.id}`, error);
    throw new HttpError('Failed to complete trip', 500);
  }
}; 