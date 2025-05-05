import { RedisClientType } from 'redis';
import LocationData, { ILocationData } from '../models/location-data';
import winston from 'winston';

/**
 * Service for handling vehicle location operations
 */
export class LocationService {
  private logger: winston.Logger;
  private redis: RedisClientType<any, any, any>;

  constructor(logger: winston.Logger, redis: RedisClientType<any, any, any>) {
    this.logger = logger;
    this.redis = redis;
  }

  /**
   * Record a new location data point
   * @param locationData The location data to record
   * @returns The saved location data
   */
  async recordLocation(locationData: Partial<ILocationData>): Promise<ILocationData> {
    try {
      // Create a new location data record
      const newLocation = new LocationData(locationData);
      const savedLocation = await newLocation.save();
      
      // Update the latest location in Redis
      await this.updateLatestLocationInRedis(savedLocation);
      
      // Update the geospatial index
      await this.updateGeoIndex(savedLocation);
      
      this.logger.info(`Recorded new location for vehicle ${savedLocation.vehicleId}`);
      return savedLocation;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error recording location: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get the latest location for a vehicle
   * @param vehicleId The ID of the vehicle
   * @returns The latest location data or null if not found
   */
  async getLatestLocation(vehicleId: string): Promise<ILocationData | null> {
    try {
      // Try to get from Redis first
      const cacheKey = `vehicle:location:${vehicleId}`;
      const cachedLocation = await this.redis.get(cacheKey);
      
      if (cachedLocation) {
        this.logger.debug(`Retrieved latest location for vehicle ${vehicleId} from cache`);
        return JSON.parse(cachedLocation) as ILocationData;
      }
      
      // If not in cache, get from database
      const location = await LocationData.findOne({ vehicleId })
        .sort({ timestamp: -1 })
        .lean();
      
      if (location) {
        // Update the cache
        await this.updateLatestLocationInRedis(location as ILocationData);
        this.logger.debug(`Retrieved latest location for vehicle ${vehicleId} from database`);
      }
      
      return location as ILocationData | null;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error getting latest location: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get location history for a vehicle
   * @param vehicleId The ID of the vehicle
   * @param startDate Start date for the query
   * @param endDate End date for the query
   * @param limit Maximum number of records to return
   * @returns Array of location data
   */
  async getLocationHistory(
    vehicleId: string, 
    startDate?: Date, 
    endDate?: Date, 
    limit: number = 100
  ): Promise<ILocationData[]> {
    try {
      const query: any = { vehicleId };
      
      // Add date range if provided
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = startDate;
        if (endDate) query.timestamp.$lte = endDate;
      }
      
      const locations = await LocationData.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
      
      this.logger.debug(`Retrieved ${locations.length} location records for vehicle ${vehicleId}`);
      return locations as ILocationData[];
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error getting location history: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Find vehicles near a specific location
   * @param longitude Longitude coordinate
   * @param latitude Latitude coordinate
   * @param radius Radius in meters
   * @param limit Maximum number of results
   * @returns Array of nearby vehicle locations
   */
  async findNearbyVehicles(
    longitude: number,
    latitude: number,
    radius: number = 1000,
    limit: number = 20
  ): Promise<ILocationData[]> {
    try {
      // Query for vehicles near the specified point
      const nearbyLocations = await LocationData.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            distanceField: 'distance',
            maxDistance: radius,
            spherical: true
          }
        },
        {
          $sort: { distance: 1 }
        },
        {
          $group: {
            _id: '$vehicleId',
            location: { $first: '$$ROOT' }
          }
        },
        {
          $replaceRoot: { newRoot: '$location' }
        },
        {
          $limit: limit
        }
      ]);
      
      this.logger.debug(`Found ${nearbyLocations.length} vehicles near [${longitude}, ${latitude}]`);
      return nearbyLocations as ILocationData[];
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error finding nearby vehicles: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Update the latest location in Redis
   * @param location The location data to cache
   * @private
   */
  private async updateLatestLocationInRedis(location: ILocationData): Promise<void> {
    const cacheKey = `vehicle:location:${location.vehicleId}`;
    
    try {
      // Set the latest location with an expiration time
      await this.redis.set(
        cacheKey,
        JSON.stringify(location),
        { EX: 86400 } // Expire after 24 hours
      );
      
      // Add to active vehicles set
      await this.redis.sAdd('vehicles:active', location.vehicleId.toString());
      
      this.logger.debug(`Updated latest location in cache for vehicle ${location.vehicleId}`);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error updating Redis cache: ${error.message}`);
      }
    }
  }

  /**
   * Update the geospatial index in Redis
   * @param location The location data to add to the index
   * @private
   */
  private async updateGeoIndex(location: ILocationData): Promise<void> {
    try {
      const [longitude, latitude] = location.location.coordinates;
      
      // Add to geospatial index
      await this.redis.geoAdd(
        'geo:vehicles',
        {
          longitude,
          latitude,
          member: location.vehicleId.toString()
        }
      );
      
      this.logger.debug(`Updated geo index for vehicle ${location.vehicleId}`);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error updating geo index: ${error.message}`);
      }
    }
  }
} 