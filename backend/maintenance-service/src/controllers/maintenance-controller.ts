import { Request, Response } from 'express';
import { Logger } from 'winston';
import MaintenanceService from '../services/maintenance-service';

export default class MaintenanceController {
  private logger: Logger;
  private maintenanceService: MaintenanceService;

  constructor(logger: Logger) {
    this.logger = logger;
    this.maintenanceService = new MaintenanceService(logger);
  }

  /**
   * Get all maintenance records with optional filtering
   */
  getAllMaintenanceRecords = async (req: Request, res: Response): Promise<void> => {
    try {
      // Extract query parameters for filtering and pagination
      const limit = parseInt(req.query.limit as string) || 100;
      const skip = parseInt(req.query.skip as string) || 0;
      const sort = (req.query.sort as string) || 'performedAt';
      const order = (req.query.order as string) === 'asc' ? 'asc' : 'desc';
      
      // Pass filters from request query
      const filters = {
        vehicleId: req.query.vehicleId,
        type: req.query.type,
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const { records, count } = await this.maintenanceService.getAllMaintenanceRecords(
        limit,
        skip,
        sort,
        order,
        filters
      );
      
      res.status(200).json({
        status: 'success',
        count,
        data: records
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to get maintenance records');
    }
  };

  /**
   * Get a single maintenance record by ID
   */
  getMaintenanceRecordById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const record = await this.maintenanceService.getMaintenanceRecordById(id);
      
      res.status(200).json({
        status: 'success',
        data: record
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid maintenance record ID format') {
        res.status(400).json({
          status: 'error',
          message: error.message
        });
        return;
      }
      
      if (error instanceof Error && error.message === 'Maintenance record not found') {
        res.status(404).json({
          status: 'error',
          message: error.message
        });
        return;
      }
      
      this.handleError(error, res, 'Failed to get maintenance record');
    }
  };

  /**
   * Create a new maintenance record
   */
  createMaintenanceRecord = async (req: Request, res: Response): Promise<void> => {
    try {
      const recordData = req.body;
      
      const newRecord = await this.maintenanceService.createMaintenanceRecord(recordData);
      
      res.status(201).json({
        status: 'success',
        data: newRecord
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to create maintenance record');
    }
  };

  /**
   * Update an existing maintenance record
   */
  updateMaintenanceRecord = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const updatedRecord = await this.maintenanceService.updateMaintenanceRecord(id, updateData);
      
      res.status(200).json({
        status: 'success',
        data: updatedRecord
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid maintenance record ID format') {
        res.status(400).json({
          status: 'error',
          message: error.message
        });
        return;
      }
      
      if (error instanceof Error && error.message === 'Maintenance record not found') {
        res.status(404).json({
          status: 'error',
          message: error.message
        });
        return;
      }
      
      this.handleError(error, res, 'Failed to update maintenance record');
    }
  };

  /**
   * Delete a maintenance record
   */
  deleteMaintenanceRecord = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      await this.maintenanceService.deleteMaintenanceRecord(id);
      
      res.status(200).json({
        status: 'success',
        message: 'Maintenance record deleted successfully'
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid maintenance record ID format') {
        res.status(400).json({
          status: 'error',
          message: error.message
        });
        return;
      }
      
      if (error instanceof Error && error.message === 'Maintenance record not found') {
        res.status(404).json({
          status: 'error',
          message: error.message
        });
        return;
      }
      
      this.handleError(error, res, 'Failed to delete maintenance record');
    }
  };

  /**
   * Get maintenance records by vehicle ID
   */
  getVehicleMaintenanceRecords = async (req: Request, res: Response): Promise<void> => {
    try {
      const { vehicleId } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;
      const skip = parseInt(req.query.skip as string) || 0;
      
      const { records, count } = await this.maintenanceService.getVehicleMaintenanceRecords(
        vehicleId,
        limit,
        skip
      );
      
      res.status(200).json({
        status: 'success',
        count,
        data: records
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to get vehicle maintenance records');
    }
  };

  /**
   * Get maintenance stats
   */
  getMaintenanceStats = async (_req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.maintenanceService.getMaintenanceStats();
      
      res.status(200).json({
        status: 'success',
        data: stats
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to get maintenance statistics');
    }
  };

  /**
   * Centralized error handler
   */
  private handleError(error: any, res: Response, defaultMessage: string): void {
    const message = error instanceof Error ? error.message : defaultMessage;
    this.logger.error(`${defaultMessage}: ${message}`);
    
    if (error.name === 'ValidationError') {
      res.status(400).json({
        status: 'error',
        message: error.message,
        errors: error.errors
      });
      return;
    }
    
    res.status(500).json({
      status: 'error',
      message: process.env.NODE_ENV === 'production' ? defaultMessage : message
    });
  }
} 