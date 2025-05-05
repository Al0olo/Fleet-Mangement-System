import { Logger } from 'winston';
import mongoose from 'mongoose';
import UsageStats, { IUsageStats } from '../models/usage-stats';
import { 
  buildDateRangeQuery, 
  ensureObjectId, 
  buildVehicleStatsAggregation, 
  buildTopVehiclesAggregation 
} from '../util/metrics-helpers';

class UsageStatsService {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  // Get usage stats for a specific vehicle
  public async getVehicleUsageStats(
    vehicleId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 10
  ): Promise<IUsageStats[]> {
    try {
      // Build query with optional date range
      const query: Record<string, any> = { 
        vehicleId: new mongoose.Types.ObjectId(vehicleId) 
      };
      
      // Use helper function to build date range queries
      if (startDate) {
        Object.assign(query, buildDateRangeQuery('startDate', startDate, undefined));
      }
      
      if (endDate) {
        Object.assign(query, { endDate: { $lte: endDate } });
      }
      
      const stats = await UsageStats.find(query)
        .sort({ startDate: -1 })
        .limit(limit);
      
      return stats;
    } catch (error) {
      this.logger.error(`Error fetching usage stats for vehicle ${vehicleId}: ${error}`);
      throw error;
    }
  }

  // Create new usage stats record
  public async createUsageStats(statsData: Partial<IUsageStats>): Promise<IUsageStats> {
    try {
      const stats = new UsageStats(statsData);
      const savedStats = await stats.save();
      
      this.logger.info(`Created usage stats record for vehicle ${statsData.vehicleId}`);
      return savedStats;
    } catch (error) {
      this.logger.error(`Error creating usage stats: ${error}`);
      throw error;
    }
  }

  // Record or update usage stats for a specific vehicle and time period
  public async recordOrUpdateUsageStats(statsData: {
    vehicleId: string;
    startDate: Date;
    endDate: Date;
    hoursOperated: number;
    distanceTraveled: number;
    fuelConsumed?: number;
    idleTime?: number;
  }): Promise<IUsageStats> {
    try {
      // Use helper function to ensure vehicleId is an ObjectId
      const vehicleObjectId = ensureObjectId(statsData.vehicleId);
      
      // Try to find an existing record for this vehicle and time period
      const stats = await UsageStats.findOne({
        vehicleId: vehicleObjectId,
        startDate: statsData.startDate,
        endDate: statsData.endDate
      });
      
      if (stats) {
        // Update existing record
        stats.hoursOperated += statsData.hoursOperated || 0;
        stats.distanceTraveled += statsData.distanceTraveled || 0;
        
        if (statsData.fuelConsumed !== undefined) {
          stats.fuelConsumed = (stats.fuelConsumed || 0) + statsData.fuelConsumed;
        }
        
        if (statsData.idleTime !== undefined) {
          stats.idleTime = (stats.idleTime || 0) + statsData.idleTime;
        }
        
        // Calculate efficiency if we have both distance and fuel data
        if (stats.fuelConsumed && stats.fuelConsumed > 0 && stats.distanceTraveled > 0) {
          stats.efficiency = stats.distanceTraveled / stats.fuelConsumed;
        }
        
        await stats.save();
        this.logger.debug(`Updated usage stats for vehicle ${statsData.vehicleId}, time period: ${statsData.startDate.toISOString()} - ${statsData.endDate.toISOString()}`);
        return stats;
      } else {
        // Create new record
        const newStats = await this.createUsageStats({
          vehicleId: vehicleObjectId,
          startDate: statsData.startDate,
          endDate: statsData.endDate,
          hoursOperated: statsData.hoursOperated || 0,
          distanceTraveled: statsData.distanceTraveled || 0,
          fuelConsumed: statsData.fuelConsumed,
          idleTime: statsData.idleTime,
          // Calculate efficiency if possible
          efficiency: statsData.fuelConsumed && statsData.fuelConsumed > 0 && statsData.distanceTraveled > 0
            ? statsData.distanceTraveled / statsData.fuelConsumed
            : undefined
        });
        
        return newStats;
      }
    } catch (error) {
      this.logger.error(`Error recording usage stats: ${error}`);
      throw error;
    }
  }

  // Get aggregate stats for a specific vehicle over a time period
  public async getAggregateVehicleStats(
    vehicleId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, any>> {
    try {
      // Use helper function to build aggregation pipeline
      const aggregationPipeline = buildVehicleStatsAggregation(vehicleId, startDate, endDate);
      const aggregateStats = await UsageStats.aggregate(aggregationPipeline);
      
      if (aggregateStats.length === 0) {
        return {
          totalHours: 0,
          totalDistance: 0,
          totalFuel: 0,
          totalIdle: 0,
          recordCount: 0,
          avgEfficiency: 0
        };
      }
      
      return aggregateStats[0];
    } catch (error) {
      this.logger.error(`Error aggregating vehicle stats for ${vehicleId}: ${error}`);
      throw error;
    }
  }

  // Get fleet-wide usage statistics for a time period
  public async getFleetUsageStats(
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, any>> {
    try {
      // Use helper function to build aggregation pipeline (without vehicleId)
      const aggregationPipeline = buildVehicleStatsAggregation(undefined, startDate, endDate);
      const aggregateStats = await UsageStats.aggregate(aggregationPipeline);
      
      // Get count of unique vehicles
      const uniqueVehicles = await UsageStats.aggregate([
        {
          $match: {
            startDate: { $gte: startDate },
            endDate: { $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$vehicleId'
          }
        },
        {
          $count: 'count'
        }
      ]);
      
      if (aggregateStats.length === 0) {
        return {
          totalHours: 0,
          totalDistance: 0,
          totalFuel: 0,
          totalIdle: 0,
          avgEfficiency: 0,
          uniqueVehicles: 0
        };
      }
      
      return {
        ...aggregateStats[0],
        uniqueVehicles: uniqueVehicles.length > 0 ? uniqueVehicles[0].count : 0
      };
    } catch (error) {
      this.logger.error(`Error aggregating fleet stats: ${error}`);
      throw error;
    }
  }

  // Get top performing vehicles by a specific metric
  public async getTopVehiclesByMetric(
    metric: 'hoursOperated' | 'distanceTraveled' | 'efficiency',
    startDate: Date,
    endDate: Date,
    limit: number = 5
  ): Promise<any[]> {
    try {
      // Use helper function to build top vehicles aggregation
      const aggregationPipeline = buildTopVehiclesAggregation(metric, startDate, endDate, limit);
      const topVehicles = await UsageStats.aggregate(aggregationPipeline);
      
      return topVehicles;
    } catch (error) {
      this.logger.error(`Error getting top vehicles by ${metric}: ${error}`);
      throw error;
    }
  }
}

export default UsageStatsService; 