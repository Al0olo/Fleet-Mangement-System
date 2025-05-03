import { Request, Response } from 'express';
import { Logger } from 'winston';
import ScheduleService from '../services/schedule-service';

export default class ScheduleController {
  private logger: Logger;
  private scheduleService: ScheduleService;

  constructor(logger: Logger) {
    this.logger = logger;
    this.scheduleService = new ScheduleService(logger);
  }

  /**
   * Get all maintenance schedules with optional filtering
   */
  getAllSchedules = async (req: Request, res: Response): Promise<void> => {
    try {
      // Extract query parameters for filtering and pagination
      const limit = parseInt(req.query.limit as string) || 100;
      const skip = parseInt(req.query.skip as string) || 0;
      const sort = (req.query.sort as string) || 'scheduledDate';
      const order = (req.query.order as string) === 'desc' ? 'desc' : 'asc';
      
      // Pass filters from request query
      const filters = {
        vehicleId: req.query.vehicleId,
        type: req.query.type,
        status: req.query.status,
        priority: req.query.priority,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const { schedules, count } = await this.scheduleService.getAllSchedules(
        limit,
        skip,
        sort,
        order,
        filters
      );
      
      res.status(200).json({
        status: 'success',
        count,
        data: schedules
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to get maintenance schedules');
    }
  };

  /**
   * Get a single maintenance schedule by ID
   */
  getScheduleById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const schedule = await this.scheduleService.getScheduleById(id);
      
      res.status(200).json({
        status: 'success',
        data: schedule
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid maintenance schedule ID format') {
        res.status(400).json({
          status: 'error',
          message: error.message
        });
        return;
      }
      
      if (error instanceof Error && error.message === 'Maintenance schedule not found') {
        res.status(404).json({
          status: 'error',
          message: error.message
        });
        return;
      }
      
      this.handleError(error, res, 'Failed to get maintenance schedule');
    }
  };

  /**
   * Create a new maintenance schedule
   */
  createSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
      const scheduleData = req.body;
      
      const newSchedule = await this.scheduleService.createSchedule(scheduleData);
      
      res.status(201).json({
        status: 'success',
        data: newSchedule
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to create maintenance schedule');
    }
  };

  /**
   * Update an existing maintenance schedule
   */
  updateSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const updatedSchedule = await this.scheduleService.updateSchedule(id, updateData);
      
      res.status(200).json({
        status: 'success',
        data: updatedSchedule
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid maintenance schedule ID format') {
        res.status(400).json({
          status: 'error',
          message: error.message
        });
        return;
      }
      
      if (error instanceof Error && error.message === 'Maintenance schedule not found') {
        res.status(404).json({
          status: 'error',
          message: error.message
        });
        return;
      }
      
      this.handleError(error, res, 'Failed to update maintenance schedule');
    }
  };

  /**
   * Delete a maintenance schedule
   */
  deleteSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      await this.scheduleService.deleteSchedule(id);
      
      res.status(200).json({
        status: 'success',
        message: 'Maintenance schedule deleted successfully'
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid maintenance schedule ID format') {
        res.status(400).json({
          status: 'error',
          message: error.message
        });
        return;
      }
      
      if (error instanceof Error && error.message === 'Maintenance schedule not found') {
        res.status(404).json({
          status: 'error',
          message: error.message
        });
        return;
      }
      
      this.handleError(error, res, 'Failed to delete maintenance schedule');
    }
  };

  /**
   * Get upcoming maintenance schedules
   */
  getUpcomingSchedules = async (req: Request, res: Response): Promise<void> => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      
      const filters = {
        vehicleId: req.query.vehicleId,
        priority: req.query.priority
      };
      
      const schedules = await this.scheduleService.getUpcomingSchedules(days, filters);
      
      res.status(200).json({
        status: 'success',
        count: schedules.length,
        data: schedules
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to get upcoming maintenance schedules');
    }
  };

  /**
   * Get schedules that are overdue
   */
  getOverdueSchedules = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters = {
        vehicleId: req.query.vehicleId
      };
      
      const schedules = await this.scheduleService.getOverdueSchedules(filters);
      
      res.status(200).json({
        status: 'success',
        count: schedules.length,
        data: schedules
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to get overdue maintenance schedules');
    }
  };

  /**
   * Update status of maintenance schedules to 'overdue' if they are past their scheduled date
   * This would typically be called by a scheduled job
   */
  updateOverdueSchedules = async (_req: Request, res: Response): Promise<void> => {
    try {
      const modifiedCount = await this.scheduleService.updateOverdueSchedules();
      
      res.status(200).json({
        status: 'success',
        message: `Updated ${modifiedCount} schedules to overdue status`
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to update overdue schedules');
    }
  };

  /**
   * Get vehicle maintenance schedules
   */
  getVehicleSchedules = async (req: Request, res: Response): Promise<void> => {
    try {
      const { vehicleId } = req.params;
      const status = req.query.status as string;
      
      const schedules = await this.scheduleService.getVehicleSchedules(vehicleId, status);
      
      res.status(200).json({
        status: 'success',
        count: schedules.length,
        data: schedules
      });
    } catch (error) {
      this.handleError(error, res, 'Failed to get vehicle maintenance schedules');
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