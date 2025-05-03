import { Request, Response } from 'express';
import { LocationService } from '../services/location-service';
import winston from 'winston';
import { RedisClientType } from 'redis';

/**
 * Controller for handling tracking-related API endpoints
 */
export class TrackingController {
  private locationService: LocationService;
  private logger: winston.Logger;

  constructor(logger: winston.Logger, redis: RedisClientType<any, any, any>) {
    this.logger = logger;
    this.locationService = new LocationService(logger, redis);
  }

  /**
   * Record a new location data point for a vehicle
   * @param req Request
   * @param res Response
   */
  recordLocation = async (req: Request, res: Response): Promise<void> => {
    try {
      const locationData = req.body;
      
      // Validate request body
      if (!locationData.vehicleId || !locationData.location || !locationData.location.coordinates) {
        res.status(400).json({ 
          status: 'error', 
          message: 'Missing required fields: vehicleId and location coordinates' 
        });
        return;
      }
      
      const savedLocation = await this.locationService.recordLocation(locationData);
      
      res.status(201).json({
        status: 'success',
        data: savedLocation
      });
    } catch (error) {
      this.logger.error(`Error in recordLocation: ${error instanceof Error ? error.message : 'Unknown error'}`);
      res.status(500).json({ 
        status: 'error', 
        message: `Failed to record location: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  /**
   * Get the latest location for a vehicle
   * @param req Request
   * @param res Response
   */
  getLatestLocation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { vehicleId } = req.params;
      
      if (!vehicleId) {
        res.status(400).json({ status: 'error', message: 'Vehicle ID is required' });
        return;
      }
      
      const location = await this.locationService.getLatestLocation(vehicleId);
      
      if (!location) {
        res.status(404).json({ status: 'error', message: 'No location data found for this vehicle' });
        return;
      }
      
      res.status(200).json({
        status: 'success',
        data: location
      });
    } catch (error) {
      this.logger.error(`Error in getLatestLocation: ${error instanceof Error ? error.message : 'Unknown error'}`);
      res.status(500).json({ 
        status: 'error', 
        message: `Failed to get latest location: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  /**
   * Get location history for a vehicle
   * @param req Request
   * @param res Response
   */
  getLocationHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { vehicleId } = req.params;
      const { startDate, endDate, limit } = req.query;
      
      if (!vehicleId) {
        res.status(400).json({ status: 'error', message: 'Vehicle ID is required' });
        return;
      }
      
      // Parse query parameters
      const parsedStartDate = startDate ? new Date(startDate as string) : undefined;
      const parsedEndDate = endDate ? new Date(endDate as string) : undefined;
      const parsedLimit = limit ? parseInt(limit as string, 10) : 100;
      
      const locations = await this.locationService.getLocationHistory(
        vehicleId,
        parsedStartDate,
        parsedEndDate,
        parsedLimit
      );
      
      res.status(200).json({
        status: 'success',
        count: locations.length,
        data: locations
      });
    } catch (error) {
      this.logger.error(`Error in getLocationHistory: ${error instanceof Error ? error.message : 'Unknown error'}`);
      res.status(500).json({ 
        status: 'error', 
        message: `Failed to get location history: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  /**
   * Find vehicles near a specific location
   * @param req Request
   * @param res Response
   */
  findNearbyVehicles = async (req: Request, res: Response): Promise<void> => {
    try {
      const { longitude, latitude, radius, limit } = req.query;
      
      // Validate required parameters
      if (!longitude || !latitude) {
        res.status(400).json({ 
          status: 'error', 
          message: 'Longitude and latitude are required' 
        });
        return;
      }
      
      // Parse parameters
      const parsedLongitude = parseFloat(longitude as string);
      const parsedLatitude = parseFloat(latitude as string);
      const parsedRadius = radius ? parseFloat(radius as string) : 1000; // Default: 1km
      const parsedLimit = limit ? parseInt(limit as string, 10) : 20; // Default: 20 results
      
      // Validate parsed values
      if (isNaN(parsedLongitude) || isNaN(parsedLatitude)) {
        res.status(400).json({ 
          status: 'error', 
          message: 'Invalid longitude or latitude format' 
        });
        return;
      }
      
      const nearbyVehicles = await this.locationService.findNearbyVehicles(
        parsedLongitude,
        parsedLatitude,
        parsedRadius,
        parsedLimit
      );
      
      res.status(200).json({
        status: 'success',
        count: nearbyVehicles.length,
        data: nearbyVehicles
      });
    } catch (error) {
      this.logger.error(`Error in findNearbyVehicles: ${error instanceof Error ? error.message : 'Unknown error'}`);
      res.status(500).json({ 
        status: 'error', 
        message: `Failed to find nearby vehicles: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };
} 