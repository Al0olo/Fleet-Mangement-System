import { Logger } from 'winston';
import mongoose from 'mongoose';
import UsageStats, { IUsageStats } from '../models/usage-stats';

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
      const query: Record<string, any> = { vehicleId: new mongoose.Types.ObjectId(vehicleId) };
      
      if (startDate || endDate) {
        query.startDate = {};
        
        if (startDate) {
          query.startDate.$gte = startDate;
        }
        
        if (endDate) {
          query.endDate = { $lte: endDate };
        }
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

  // Get aggregate stats for a specific vehicle over a time period
  public async getAggregateVehicleStats(
    vehicleId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, any>> {
    try {
      const aggregateStats = await UsageStats.aggregate([
        {
          $match: {
            vehicleId: new mongoose.Types.ObjectId(vehicleId),
            startDate: { $gte: startDate },
            endDate: { $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalHours: { $sum: '$hoursOperated' },
            totalDistance: { $sum: '$distanceTraveled' },
            totalFuel: { $sum: '$fuelConsumed' },
            totalIdle: { $sum: '$idleTime' },
            recordCount: { $sum: 1 },
            avgEfficiency: { $avg: '$efficiency' }
          }
        }
      ]);
      
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
      const aggregateStats = await UsageStats.aggregate([
        {
          $match: {
            startDate: { $gte: startDate },
            endDate: { $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalHours: { $sum: '$hoursOperated' },
            totalDistance: { $sum: '$distanceTraveled' },
            totalFuel: { $sum: '$fuelConsumed' },
            totalIdle: { $sum: '$idleTime' },
            avgEfficiency: { $avg: '$efficiency' }
          }
        }
      ]);
      
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
      const sortDirection = metric === 'efficiency' ? -1 : -1; // Higher is better for all metrics
      
      const topVehicles = await UsageStats.aggregate([
        {
          $match: {
            startDate: { $gte: startDate },
            endDate: { $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$vehicleId',
            total: { $sum: `$${metric}` }
          }
        },
        {
          $sort: { total: sortDirection }
        },
        {
          $limit: limit
        }
      ]);
      
      return topVehicles;
    } catch (error) {
      this.logger.error(`Error getting top vehicles by ${metric}: ${error}`);
      throw error;
    }
  }
}

export default UsageStatsService; 