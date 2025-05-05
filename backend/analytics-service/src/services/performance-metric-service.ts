import { Logger } from 'winston';
import mongoose from 'mongoose';
import PerformanceMetric, { IPerformanceMetric } from '../models/performance-metric';
import { buildDateRangeQuery, getIntervalConfig } from '../util/metrics-helpers';

class PerformanceMetricService {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  // Record a new performance metric
  public async recordMetric(metricData: Partial<IPerformanceMetric>): Promise<IPerformanceMetric> {
    try {
      const metric = new PerformanceMetric(metricData);
      const savedMetric = await metric.save();
      
      this.logger.info(`Recorded ${metricData.metricType} metric for vehicle ${metricData.vehicleId}`);
      return savedMetric;
    } catch (error) {
      this.logger.error(`Error recording performance metric: ${error}`);
      throw error;
    }
  }

  // Get metrics for a specific vehicle and metric type
  public async getVehicleMetrics(
    vehicleId: string,
    metricType: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): Promise<IPerformanceMetric[]> {
    try {
      const query: Record<string, any> = { vehicleId, metricType };
      
      // Use the helper function to build date range query
      const dateQuery = buildDateRangeQuery('timestamp', startDate, endDate);
      Object.assign(query, dateQuery);
      
      const metrics = await PerformanceMetric.find(query)
        .sort({ timestamp: -1 })
        .limit(limit);
      
      return metrics;
    } catch (error) {
      this.logger.error(`Error fetching metrics for vehicle ${vehicleId}: ${error}`);
      throw error;
    }
  }

  // Get historical trend data for a specific metric
  public async getMetricTrend(
    vehicleId: string,
    metricType: string,
    startDate: Date,
    endDate: Date,
    interval: 'day' | 'week' | 'month' = 'day'
  ): Promise<any[]> {
    try {
      // Use the helper function to get date format and grouping config
      const { dateFormat, groupByFormat } = getIntervalConfig(interval);
      
      const trendData = await PerformanceMetric.aggregate([
        {
          $match: {
            vehicleId: new mongoose.Types.ObjectId(vehicleId),
            metricType,
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: groupByFormat,
            avgValue: { $avg: '$value' },
            minValue: { $min: '$value' },
            maxValue: { $max: '$value' },
            count: { $sum: 1 },
            firstDate: { $min: '$timestamp' }
          }
        },
        {
          $project: {
            _id: 0,
            period: {
              $dateToString: {
                format: dateFormat,
                date: '$firstDate'
              }
            },
            avgValue: 1,
            minValue: 1,
            maxValue: 1,
            count: 1,
            firstDate: 1
          }
        },
        {
          $sort: { firstDate: 1 }
        }
      ]);
      
      return trendData;
    } catch (error) {
      this.logger.error(`Error fetching metric trend for vehicle ${vehicleId}: ${error}`);
      throw error;
    }
  }

  // Get fleet-wide averages for a specific metric type
  public async getFleetMetricAverages(
    metricType: string,
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, any>> {
    try {
      const fleetAverage = await PerformanceMetric.aggregate([
        {
          $match: {
            metricType,
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            avgValue: { $avg: '$value' },
            minValue: { $min: '$value' },
            maxValue: { $max: '$value' },
            stdDev: { $stdDevPop: '$value' },
            count: { $sum: 1 }
          }
        }
      ]);
      
      if (fleetAverage.length === 0) {
        return {
          avgValue: 0,
          minValue: 0,
          maxValue: 0,
          stdDev: 0,
          count: 0
        };
      }
      
      return fleetAverage[0];
    } catch (error) {
      this.logger.error(`Error getting fleet averages for ${metricType}: ${error}`);
      throw error;
    }
  }

  // Compare a vehicle's performance against fleet average
  public async compareVehicleToFleet(
    vehicleId: string,
    metricType: string,
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, any>> {
    try {
      // Get vehicle average
      const vehicleAvg = await PerformanceMetric.aggregate([
        {
          $match: {
            vehicleId: new mongoose.Types.ObjectId(vehicleId),
            metricType,
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            avgValue: { $avg: '$value' },
            count: { $sum: 1 }
          }
        }
      ]);
      
      // Get fleet average
      const fleetAverage = await this.getFleetMetricAverages(metricType, startDate, endDate);
      
      if (vehicleAvg.length === 0) {
        return {
          vehicleAvg: 0,
          fleetAvg: fleetAverage.avgValue,
          difference: 0,
          percentDifference: 0,
          percentileRank: 0
        };
      }
      
      // Get vehicle percentile rank
      const allVehicleAverages = await PerformanceMetric.aggregate([
        {
          $match: {
            metricType,
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$vehicleId',
            avgValue: { $avg: '$value' }
          }
        },
        {
          $sort: { avgValue: 1 }
        }
      ]);
      
      // Find the position of this vehicle in the sorted list
      const vehiclePosition = allVehicleAverages.findIndex(v => 
        v._id.toString() === vehicleId
      );
      
      // Calculate percentile rank
      const percentileRank = vehiclePosition >= 0 ? 
        (vehiclePosition / (allVehicleAverages.length - 1)) * 100 : 0;
      
      return {
        vehicleAvg: vehicleAvg[0].avgValue,
        fleetAvg: fleetAverage.avgValue,
        difference: vehicleAvg[0].avgValue - fleetAverage.avgValue,
        percentDifference: fleetAverage.avgValue !== 0 ? 
          ((vehicleAvg[0].avgValue - fleetAverage.avgValue) / fleetAverage.avgValue) * 100 : 0,
        percentileRank
      };
    } catch (error) {
      this.logger.error(`Error comparing vehicle ${vehicleId} to fleet: ${error}`);
      throw error;
    }
  }
}

export default PerformanceMetricService; 