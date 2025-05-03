import { Request, Response } from 'express';
import { EventService } from '../services/event-service';
import winston from 'winston';
import { RedisClientType } from 'redis';

/**
 * Controller for handling vehicle event operations
 */
export class EventController {
  private eventService: EventService;
  private logger: winston.Logger;

  constructor(logger: winston.Logger, redis: RedisClientType<any, any, any>) {
    this.logger = logger;
    this.eventService = new EventService(logger, redis);
  }

  /**
   * Record a new event
   * @param req Express request
   * @param res Express response
   */
  async recordEvent(req: Request, res: Response): Promise<void> {
    try {
      const eventData = req.body;
      
      // Validate required fields
      if (!eventData.vehicleId || !eventData.eventType) {
        res.status(400).json({
          status: 'error',
          message: 'Missing required fields: vehicleId and eventType are required'
        });
        return;
      }
      
      // Validate event type
      const validEventTypes = [
        'TRIP_STARTED', 'TRIP_COMPLETED', 'MAINTENANCE_DUE', 
        'IDLE_STARTED', 'IDLE_ENDED', 'GEOFENCE_ENTER', 
        'GEOFENCE_EXIT', 'BATTERY_LOW', 'FUEL_LOW'
      ];
      
      if (!validEventTypes.includes(eventData.eventType)) {
        res.status(400).json({
          status: 'error',
          message: `Invalid event type. Must be one of: ${validEventTypes.join(', ')}`
        });
        return;
      }
      
      // Record the event
      const savedEvent = await this.eventService.recordEvent(eventData);
      
      res.status(201).json({
        status: 'success',
        data: savedEvent
      });
    } catch (error) {
      this.logger.error(`Error recording event: ${error instanceof Error ? error.message : 'Unknown error'}`);
      res.status(500).json({
        status: 'error',
        message: 'Error recording event'
      });
    }
  }

  /**
   * Get events for a vehicle
   * @param req Express request
   * @param res Express response
   */
  async getVehicleEvents(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const { eventType, startDate, endDate, limit } = req.query;
      
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
      
      // Get events
      const events = await this.eventService.getVehicleEvents(
        vehicleId,
        eventType as string,
        parsedStartDate,
        parsedEndDate,
        parsedLimit
      );
      
      res.status(200).json({
        status: 'success',
        count: events.length,
        data: events
      });
    } catch (error) {
      this.logger.error(`Error getting vehicle events: ${error instanceof Error ? error.message : 'Unknown error'}`);
      res.status(500).json({
        status: 'error',
        message: 'Error retrieving vehicle events'
      });
    }
  }

  /**
   * Get recent events of a specific type
   * @param req Express request
   * @param res Express response
   */
  async getRecentEventsByType(req: Request, res: Response): Promise<void> {
    try {
      const { eventType } = req.params;
      const { limit } = req.query;
      
      if (!eventType) {
        res.status(400).json({
          status: 'error',
          message: 'Event type is required'
        });
        return;
      }
      
      // Validate event type
      const validEventTypes = [
        'TRIP_STARTED', 'TRIP_COMPLETED', 'MAINTENANCE_DUE', 
        'IDLE_STARTED', 'IDLE_ENDED', 'GEOFENCE_ENTER', 
        'GEOFENCE_EXIT', 'BATTERY_LOW', 'FUEL_LOW'
      ];
      
      if (!validEventTypes.includes(eventType.toUpperCase())) {
        res.status(400).json({
          status: 'error',
          message: `Invalid event type. Must be one of: ${validEventTypes.join(', ')}`
        });
        return;
      }
      
      // Parse limit parameter
      const parsedLimit = limit ? parseInt(limit as string, 10) : 20;
      
      // Get events
      const events = await this.eventService.getRecentEventsByType(
        eventType.toUpperCase(),
        parsedLimit
      );
      
      res.status(200).json({
        status: 'success',
        count: events.length,
        data: events
      });
    } catch (error) {
      this.logger.error(`Error getting events by type: ${error instanceof Error ? error.message : 'Unknown error'}`);
      res.status(500).json({
        status: 'error',
        message: 'Error retrieving events by type'
      });
    }
  }

  /**
   * Get events for a specific trip
   * @param req Express request
   * @param res Express response
   */
  async getTripEvents(req: Request, res: Response): Promise<void> {
    try {
      const { tripId } = req.params;
      
      if (!tripId) {
        res.status(400).json({
          status: 'error',
          message: 'Trip ID is required'
        });
        return;
      }
      
      // Get trip events
      const events = await this.eventService.getTripEvents(tripId);
      
      if (events.length === 0) {
        res.status(404).json({
          status: 'error',
          message: `No events found for trip ${tripId}`
        });
        return;
      }
      
      res.status(200).json({
        status: 'success',
        count: events.length,
        data: events
      });
    } catch (error) {
      this.logger.error(`Error getting trip events: ${error instanceof Error ? error.message : 'Unknown error'}`);
      res.status(500).json({
        status: 'error',
        message: 'Error retrieving trip events'
      });
    }
  }
} 