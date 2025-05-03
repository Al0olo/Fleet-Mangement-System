import { RedisClientType } from 'redis';
import VehicleEvent, { IVehicleEvent } from '../models/vehicle-event';
import winston from 'winston';
import axios from 'axios';

/**
 * Service for handling vehicle events
 */
export class EventService {
  private logger: winston.Logger;
  private redis: RedisClientType<any, any, any>;
  private maintenanceServiceUrl: string;

  constructor(logger: winston.Logger, redis: RedisClientType<any, any, any>) {
    this.logger = logger;
    this.redis = redis;
    this.maintenanceServiceUrl = process.env.MAINTENANCE_SERVICE_URL || 'http://maintenance-service:3003';
  }

  /**
   * Record a new vehicle event
   * @param eventData The event data to record
   * @returns The saved event data
   */
  async recordEvent(eventData: Partial<IVehicleEvent>): Promise<IVehicleEvent> {
    try {
      // Create a new event record
      const newEvent = new VehicleEvent(eventData);
      const savedEvent = await newEvent.save();
      
      // Update Redis for quick access to latest events
      await this.updateEventInRedis(savedEvent);
      
      // Process event based on its type
      await this.processEventByType(savedEvent);
      
      this.logger.info(`Recorded new ${savedEvent.eventType} event for vehicle ${savedEvent.vehicleId}`);
      return savedEvent;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error recording event: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get events for a vehicle
   * @param vehicleId The ID of the vehicle
   * @param eventType Optional event type to filter by
   * @param startDate Start date for the query
   * @param endDate End date for the query
   * @param limit Maximum number of records to return
   * @returns Array of event data
   */
  async getVehicleEvents(
    vehicleId: string,
    eventType?: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): Promise<IVehicleEvent[]> {
    try {
      const query: any = { vehicleId };
      
      // Add event type filter if provided
      if (eventType) {
        query.eventType = eventType;
      }
      
      // Add date range if provided
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = startDate;
        if (endDate) query.timestamp.$lte = endDate;
      }
      
      const events = await VehicleEvent.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
      
      this.logger.debug(`Retrieved ${events.length} events for vehicle ${vehicleId}`);
      return events as IVehicleEvent[];
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error getting vehicle events: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get recent events of a specific type
   * @param eventType The event type to filter by
   * @param limit Maximum number of records to return
   * @returns Array of events
   */
  async getRecentEventsByType(
    eventType: string,
    limit: number = 20
  ): Promise<IVehicleEvent[]> {
    try {
      const events = await VehicleEvent.find({ eventType })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
      
      this.logger.debug(`Retrieved ${events.length} ${eventType} events`);
      return events as IVehicleEvent[];
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error getting events by type: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get trip events for a specific trip
   * @param tripId The ID of the trip
   * @returns Array of trip-related events
   */
  async getTripEvents(tripId: string): Promise<IVehicleEvent[]> {
    try {
      const events = await VehicleEvent.find({
        'tripInfo.tripId': tripId
      })
        .sort({ timestamp: 1 })
        .lean();
      
      this.logger.debug(`Retrieved ${events.length} events for trip ${tripId}`);
      return events as IVehicleEvent[];
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error getting trip events: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Update Redis with the event
   * @param event The event data to cache
   * @private
   */
  private async updateEventInRedis(event: IVehicleEvent): Promise<void> {
    try {
      // Add to recent events list for vehicle
      const vehicleEventListKey = `vehicle:events:${event.vehicleId}`;
      await this.redis.lPush(vehicleEventListKey, JSON.stringify(event));
      await this.redis.lTrim(vehicleEventListKey, 0, 19); // Keep only 20 most recent events
      
      // Add to global event type list
      const eventTypeListKey = `events:${event.eventType.toLowerCase()}`;
      await this.redis.lPush(eventTypeListKey, JSON.stringify(event));
      await this.redis.lTrim(eventTypeListKey, 0, 99); // Keep only 100 most recent
      
      // If it's a trip event, add to trip events list
      if (event.tripInfo?.tripId) {
        const tripEventListKey = `trip:events:${event.tripInfo.tripId}`;
        await this.redis.lPush(tripEventListKey, JSON.stringify(event));
        
        // Set an expiration on trip events lists to avoid unbounded growth
        await this.redis.expire(tripEventListKey, 86400 * 30); // 30 days
      }
      
      this.logger.debug(`Updated Redis with ${event.eventType} event for vehicle ${event.vehicleId}`);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error updating Redis with event: ${error.message}`);
      }
      // Don't rethrow since this is a background operation
    }
  }

  /**
   * Process event based on its type
   * @param event The event to process
   * @private
   */
  private async processEventByType(event: IVehicleEvent): Promise<void> {
    try {
      switch (event.eventType) {
        case 'MAINTENANCE_DUE':
          await this.notifyMaintenanceService(event);
          break;
          
        case 'FUEL_LOW':
        case 'BATTERY_LOW':
          // Could implement alerts or notifications here
          this.logger.info(`Alert: ${event.eventType} for vehicle ${event.vehicleId}`);
          break;
          
        case 'TRIP_COMPLETED':
          // Process completed trip - could include
          // analytics, billing, or other business logic
          if (event.tripInfo) {
            this.logger.info(
              `Trip completed: Vehicle ${event.vehicleId}, ` +
              `Distance: ${event.tripInfo.distance?.toFixed(2)}km, ` +
              `Duration: ${event.tripInfo.duration?.toFixed(0)} minutes`
            );
          }
          break;
          
        // Add other event type handling as needed
      }
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error processing ${event.eventType} event: ${error.message}`);
      }
      // Don't rethrow since this is a background operation
    }
  }

  /**
   * Notify the maintenance service about a maintenance event
   * @param event The maintenance event
   * @private
   */
  private async notifyMaintenanceService(event: IVehicleEvent): Promise<void> {
    try {
      const response = await axios.post(
        `${this.maintenanceServiceUrl}/api/maintenance/schedule`,
        {
          vehicleId: event.vehicleId,
          reason: event.description || 'Scheduled maintenance',
          priority: 'NORMAL',
          metadata: event.metadata || {}
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Service-Name': 'tracking-service'
          },
          timeout: 5000 // 5 second timeout
        }
      );
      
      if (response.status === 201 || response.status === 200) {
        this.logger.info(`Successfully notified maintenance service about vehicle ${event.vehicleId}`);
      } else {
        this.logger.warn(`Unexpected response from maintenance service: ${response.status}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(`Error notifying maintenance service: ${error.message}`);
        if (error.response) {
          this.logger.error(`Maintenance service returned ${error.response.status}: ${JSON.stringify(error.response.data)}`);
        }
      } else if (error instanceof Error) {
        this.logger.error(`Error notifying maintenance service: ${error.message}`);
      } else {
        this.logger.error('Unknown error notifying maintenance service');
      }
      // Don't rethrow since this is a background operation
    }
  }
} 