import { Request, Response } from 'express';
import VehicleService from '../services/vehicle-service';
import { Logger } from 'winston';

class VehicleController {
  private vehicleService: VehicleService;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.vehicleService = new VehicleService(logger);
  }

  // Get all vehicles with optional filtering
  public getAllVehicles = async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        limit = 100,
        skip = 0,
        sort = 'createdAt',
        order = 'desc',
        type,
        status,
        manufacturer
      } = req.query;

      // Build filter object based on query parameters
      const filter: Record<string, any> = {};
      
      if (type) {
        filter.type = type;
      }
      
      if (status) {
        filter.status = status;
      }
      
      if (manufacturer) {
        filter['metadata.manufacturer'] = manufacturer;
      }
      
      // Build sort object
      const sortObj: Record<string, number> = {};
      const sortField = sort as string;
      sortObj[sortField] = order === 'desc' ? -1 : 1;

      const vehicles = await this.vehicleService.getAllVehicles(
        filter,
        Number(limit),
        Number(skip),
        sortObj
      );

      res.status(200).json({
        status: 'success',
        count: vehicles.length,
        data: vehicles
      });
    } catch (error) {
      this.logger.error(`Error getting vehicles: ${error}`);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get vehicles',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  // Get a single vehicle by ID
  public getVehicleById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const vehicle = await this.vehicleService.getVehicleById(id);

      if (!vehicle) {
        res.status(404).json({
          status: 'error',
          message: 'Vehicle not found'
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: vehicle
      });
    } catch (error) {
      this.logger.error(`Error getting vehicle: ${error}`);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get vehicle',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  // Create a new vehicle
  public createVehicle = async (req: Request, res: Response): Promise<void> => {
    try {
      const vehicleData = req.body;
      const newVehicle = await this.vehicleService.createVehicle(vehicleData);

      res.status(201).json({
        status: 'success',
        data: newVehicle
      });
    } catch (error) {
      this.logger.error(`Error creating vehicle: ${error}`);
      
      // Handle validation errors separately
      if ((error as any).name === 'ValidationError') {
        res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: (error as any).errors
        });
        return;
      }

      res.status(500).json({
        status: 'error',
        message: 'Failed to create vehicle',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  // Update a vehicle
  public updateVehicle = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedVehicle = await this.vehicleService.updateVehicle(id, updates);

      if (!updatedVehicle) {
        res.status(404).json({
          status: 'error',
          message: 'Vehicle not found'
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: updatedVehicle
      });
    } catch (error) {
      this.logger.error(`Error updating vehicle: ${error}`);
      
      // Handle validation errors separately
      if ((error as any).name === 'ValidationError') {
        res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: (error as any).errors
        });
        return;
      }

      res.status(500).json({
        status: 'error',
        message: 'Failed to update vehicle',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  // Delete a vehicle
  public deleteVehicle = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = await this.vehicleService.deleteVehicle(id);

      if (!deleted) {
        res.status(404).json({
          status: 'error',
          message: 'Vehicle not found'
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        message: 'Vehicle deleted successfully'
      });
    } catch (error) {
      this.logger.error(`Error deleting vehicle: ${error}`);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete vehicle',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  // Get vehicle statistics
  public getVehicleStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const [countByType, countByStatus] = await Promise.all([
        this.vehicleService.getVehicleCountByType(),
        this.vehicleService.getVehicleCountByStatus()
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          countByType,
          countByStatus
        }
      });
    } catch (error) {
      this.logger.error(`Error getting vehicle stats: ${error}`);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get vehicle statistics',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };
}

export default VehicleController; 