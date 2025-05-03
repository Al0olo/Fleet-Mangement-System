import { RedisClientType } from 'redis';
import VehicleStatus, { IVehicleStatus } from '../models/vehicle-status';
import winston from 'winston';

/**
 * Service for handling vehicle status operations
 */
export class StatusService {
  private logger: winston.Logger;
  private redis: RedisClientType<any, any, any>;

  constructor(logger: winston.Logger, redis: RedisClientType<any, any, any>) {
    this.logger = logger;
    this.redis = redis;
  }

  /**
   * Record a new vehicle status
   * @param statusData The status data to record
   * @returns The saved status data
   */
  async recordStatus(statusData: Partial<IVehicleStatus>): Promise<IVehicleStatus> {
    try {
      // Create a new status record
      const newStatus = new VehicleStatus(statusData);
      const savedStatus = await newStatus.save();
      
      // Update the latest status in Redis
      await this.updateLatestStatusInRedis(savedStatus);
      
      // Check if maintenance is needed based on status data
      await this.checkMaintenanceNeeds(savedStatus);
      
      this.logger.info(`Recorded new status for vehicle ${savedStatus.vehicleId}`);
      return savedStatus;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error recording status: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get the latest status for a vehicle
   * @param vehicleId The ID of the vehicle
   * @returns The latest status data or null if not found
   */
  async getLatestStatus(vehicleId: string): Promise<IVehicleStatus | null> {
    try {
      // Try to get from Redis first
      const cacheKey = `vehicle:status:${vehicleId}`;
      const cachedStatus = await this.redis.get(cacheKey);
      
      if (cachedStatus) {
        this.logger.debug(`Retrieved latest status for vehicle ${vehicleId} from cache`);
        return JSON.parse(cachedStatus) as IVehicleStatus;
      }
      
      // If not in cache, get from database
      const status = await VehicleStatus.findOne({ vehicleId })
        .sort({ timestamp: -1 })
        .lean();
      
      if (status) {
        // Update the cache
        await this.updateLatestStatusInRedis(status as IVehicleStatus);
        this.logger.debug(`Retrieved latest status for vehicle ${vehicleId} from database`);
      }
      
      return status as IVehicleStatus | null;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error getting latest status: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get status history for a vehicle
   * @param vehicleId The ID of the vehicle
   * @param startDate Start date for the query
   * @param endDate End date for the query
   * @param limit Maximum number of records to return
   * @returns Array of status data
   */
  async getStatusHistory(
    vehicleId: string, 
    startDate?: Date, 
    endDate?: Date, 
    limit: number = 100
  ): Promise<IVehicleStatus[]> {
    try {
      const query: any = { vehicleId };
      
      // Add date range if provided
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = startDate;
        if (endDate) query.timestamp.$lte = endDate;
      }
      
      const statuses = await VehicleStatus.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
      
      this.logger.debug(`Retrieved ${statuses.length} status records for vehicle ${vehicleId}`);
      return statuses as IVehicleStatus[];
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error getting status history: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get vehicles with a specific status
   * @param status The status to filter by
   * @param limit Maximum number of records to return
   * @returns Array of vehicles with the specified status
   */
  async getVehiclesByStatus(
    status: string,
    limit: number = 100
  ): Promise<IVehicleStatus[]> {
    try {
      // Get unique vehicles with the latest status matching the filter
      const vehicles = await VehicleStatus.aggregate([
        {
          $match: { status }
        },
        {
          $sort: { timestamp: -1 }
        },
        {
          $group: {
            _id: '$vehicleId',
            latestStatus: { $first: '$$ROOT' }
          }
        },
        {
          $replaceRoot: { newRoot: '$latestStatus' }
        },
        {
          $limit: limit
        }
      ]);
      
      this.logger.debug(`Found ${vehicles.length} vehicles with status ${status}`);
      return vehicles as IVehicleStatus[];
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error getting vehicles by status: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Update the latest status in Redis
   * @param status The status data to cache
   * @private
   */
  private async updateLatestStatusInRedis(status: IVehicleStatus): Promise<void> {
    const cacheKey = `vehicle:status:${status.vehicleId}`;
    
    try {
      // Set the latest status with an expiration time
      await this.redis.set(
        cacheKey,
        JSON.stringify(status),
        { EX: 86400 } // Expire after 24 hours
      );
      
      // Update status list by type for quick lookup
      await this.redis.sAdd(`vehicles:${status.status.toLowerCase()}`, status.vehicleId.toString());
      
      this.logger.debug(`Updated latest status in cache for vehicle ${status.vehicleId}`);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error updating Redis cache: ${error.message}`);
      }
      // Don't rethrow since this is a background operation
    }
  }

  /**
   * Check if the vehicle needs maintenance based on status data
   * @param status The status data to check
   * @private
   */
  private async checkMaintenanceNeeds(status: IVehicleStatus): Promise<void> {
    try {
      // Implement maintenance check logic
      // This could check fuel levels, odometer readings, etc.
      // For example, check if fuel level is below 15%
      if (status.fuelLevel !== undefined && status.fuelLevel < 15) {
        this.logger.info(`Vehicle ${status.vehicleId} has low fuel: ${status.fuelLevel}%`);
        // This could trigger an event or notification
        // We'll leave the implementation of those details for another time
      }
      
      // Check battery level
      if (status.batteryLevel !== undefined && status.batteryLevel < 20) {
        this.logger.info(`Vehicle ${status.vehicleId} has low battery: ${status.batteryLevel}%`);
      }
      
      // Check odometer for maintenance schedule
      // This is just a simple example - in a real system you would have
      // maintenance schedules and would compare against those
      if (status.odometer !== undefined && status.odometer % 10000 < 500) {
        // Vehicle is within 500km of a 10000km maintenance interval
        this.logger.info(`Vehicle ${status.vehicleId} is due for maintenance at ${status.odometer}km`);
      }
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error checking maintenance needs: ${error.message}`);
      }
      // Don't rethrow since this is a background operation
    }
  }
} 