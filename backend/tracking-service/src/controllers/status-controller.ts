import { Request, Response } from 'express';
import { StatusService } from '../services/status-service';
import winston from 'winston';
import { RedisClientType } from 'redis';

/**
 * Controller for handling vehicle status operations
 */
export class StatusController {
  private statusService: StatusService;
  private logger: winston.Logger;

  constructor(logger: winston.Logger, redis: RedisClientType<any, any, any>) {
    this.logger = logger;
    this.statusService = new StatusService(logger, redis);
  }

  /**
   * Record a new status
   * @param req Express request
   * @param res Express response
   */
  async recordStatus(req: Request, res: Response): Promise<void> {
    try {
      const statusData = req.body;
      
      // Validate required fields
      if (!statusData.vehicleId || !statusData.status) {
        res.status(400).json({
          status: 'error',
          message: 'Missing required fields: vehicleId and status are required'
        });
        return;
      }
      
      // Record the status
      const savedStatus = await this.statusService.recordStatus(statusData);
      
      res.status(201).json({
        status: 'success',
        data: savedStatus
      });
    } catch (error) {
      this.logger.error(`Error recording status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      res.status(500).json({
        status: 'error',
        message: 'Error recording status'
      });
    }
  }

  /**
   * Get the latest status for a vehicle
   * @param req Express request
   * @param res Express response
   */
  async getLatestStatus(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      
      if (!vehicleId) {
        res.status(400).json({
          status: 'error',
          message: 'Vehicle ID is required'
        });
        return;
      }
      
      const status = await this.statusService.getLatestStatus(vehicleId);
      
      if (!status) {
        res.status(404).json({
          status: 'error',
          message: `No status found for vehicle ${vehicleId}`
        });
        return;
      }
      
      res.status(200).json({
        status: 'success',
        data: status
      });
    } catch (error) {
      this.logger.error(`Error getting latest status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      res.status(500).json({
        status: 'error',
        message: 'Error retrieving vehicle status'
      });
    }
  }

  /**
   * Get status history for a vehicle
   * @param req Express request
   * @param res Express response
   */
  async getStatusHistory(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const { startDate, endDate, limit } = req.query;
      
      if (!vehicleId) {
        res.status(400).json({
          status: 'error',
          message: 'Vehicle ID is required'
        });
        return;
      }
      
      // Parse query parameters
      const parsedStartDate = startDate ? new Date(startDate as string) : undefined;
      const parsedEndDate = endDate ? new Date(endDate as string) : undefined;
      const parsedLimit = limit ? parseInt(limit as string, 10) : 100;
      
      // Get status history
      const statuses = await this.statusService.getStatusHistory(
        vehicleId,
        parsedStartDate,
        parsedEndDate,
        parsedLimit
      );
      
      res.status(200).json({
        status: 'success',
        count: statuses.length,
        data: statuses
      });
    } catch (error) {
      this.logger.error(`Error getting status history: ${error instanceof Error ? error.message : 'Unknown error'}`);
      res.status(500).json({
        status: 'error',
        message: 'Error retrieving status history'
      });
    }
  }

  /**
   * Get vehicles with a specific status
   * @param req Express request
   * @param res Express response
   */
  async getVehiclesByStatus(req: Request, res: Response): Promise<void> {
    try {
      const { statusType } = req.params;
      const { limit } = req.query;
      
      if (!statusType) {
        res.status(400).json({
          status: 'error',
          message: 'Status type is required'
        });
        return;
      }
      
      // Validate status type
      const validStatusTypes = ['ACTIVE', 'IDLE', 'MAINTENANCE', 'OUT_OF_SERVICE'];
      if (!validStatusTypes.includes(statusType.toUpperCase())) {
        res.status(400).json({
          status: 'error',
          message: `Invalid status type. Must be one of: ${validStatusTypes.join(', ')}`
        });
        return;
      }
      
      // Parse limit parameter
      const parsedLimit = limit ? parseInt(limit as string, 10) : 100;
      
      // Get vehicles with the specified status
      const vehicles = await this.statusService.getVehiclesByStatus(
        statusType.toUpperCase(),
        parsedLimit
      );
      
      res.status(200).json({
        status: 'success',
        count: vehicles.length,
        data: vehicles
      });
    } catch (error) {
      this.logger.error(`Error getting vehicles by status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      res.status(500).json({
        status: 'error',
        message: 'Error retrieving vehicles by status'
      });
    }
  }
} 