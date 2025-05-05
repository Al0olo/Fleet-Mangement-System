import mongoose from 'mongoose';
import { PipelineStage } from 'mongoose';

/**
 * Helper functions for metrics processing and query building
 */

/**
 * Builds a MongoDB date range query object for the specified field
 * 
 * @param fieldName - The field to apply the date range to
 * @param startDate - Optional start date for the range
 * @param endDate - Optional end date for the range
 * @returns Query object that can be added to a MongoDB query
 */
export function buildDateRangeQuery(
  fieldName: string,
  startDate?: Date,
  endDate?: Date
): Record<string, any> {
  const query: Record<string, any> = {};
  
  if (startDate || endDate) {
    query[fieldName] = {};
    
    if (startDate) {
      query[fieldName].$gte = startDate;
    }
    
    if (endDate) {
      query[fieldName].$lte = endDate;
    }
  }
  
  return query;
}

/**
 * Returns date format and grouping configuration for aggregation pipelines
 * based on the specified time interval
 * 
 * @param interval - Time grouping interval ('day', 'week', or 'month')
 * @returns Object containing dateFormat string and groupByFormat for MongoDB aggregation
 */
export function getIntervalConfig(interval: 'day' | 'week' | 'month'): {
  dateFormat: string;
  groupByFormat: Record<string, any>;
} {
  let dateFormat: string;
  let groupByFormat: Record<string, any>;
  
  // Define date formats and groupings based on interval
  if (interval === 'day') {
    dateFormat = '%Y-%m-%d';
    groupByFormat = {
      year: { $year: '$timestamp' },
      month: { $month: '$timestamp' },
      day: { $dayOfMonth: '$timestamp' }
    };
  } else if (interval === 'week') {
    dateFormat = '%Y-W%U';
    groupByFormat = {
      year: { $year: '$timestamp' },
      week: { $week: '$timestamp' }
    };
  } else { // month
    dateFormat = '%Y-%m';
    groupByFormat = {
      year: { $year: '$timestamp' },
      month: { $month: '$timestamp' }
    };
  }
  
  return { dateFormat, groupByFormat };
}

/**
 * Ensures a vehicleId is converted to a MongoDB ObjectId if needed
 * 
 * @param vehicleId - The vehicle ID which might be a string or ObjectId
 * @returns The vehicleId as a MongoDB ObjectId
 */
export function ensureObjectId(vehicleId: string | mongoose.Types.ObjectId): mongoose.Types.ObjectId {
  return typeof vehicleId === 'string' 
    ? new mongoose.Types.ObjectId(vehicleId) 
    : vehicleId;
}

/**
 * Builds a MongoDB aggregation pipeline for computing vehicle usage statistics
 * 
 * @param vehicleId - Optional vehicle ID to filter by specific vehicle
 * @param startDate - Start date for the analysis period
 * @param endDate - End date for the analysis period
 * @returns MongoDB aggregation pipeline array
 */
export function buildVehicleStatsAggregation(
  vehicleId: string | undefined,
  startDate: Date,
  endDate: Date
): PipelineStage[] {
  const matchStage: Record<string, any> = {
    startDate: { $gte: startDate },
    endDate: { $lte: endDate }
  };
  
  if (vehicleId) {
    matchStage.vehicleId = ensureObjectId(vehicleId);
  }
  
  return [
    { $match: matchStage },
    {
      $group: {
        _id: vehicleId ? null : '$vehicleId',
        totalHours: { $sum: '$hoursOperated' },
        totalDistance: { $sum: '$distanceTraveled' },
        totalFuel: { $sum: '$fuelConsumed' },
        totalIdle: { $sum: '$idleTime' },
        recordCount: { $sum: 1 },
        avgEfficiency: { $avg: '$efficiency' }
      }
    }
  ];
}

/**
 * Builds an aggregation pipeline for finding top vehicles by a specific metric
 * 
 * @param metric - The metric to rank vehicles by
 * @param startDate - Start date for the analysis period
 * @param endDate - End date for the analysis period
 * @param limit - Maximum number of vehicles to return
 * @returns MongoDB aggregation pipeline array
 */
export function buildTopVehiclesAggregation(
  metric: string,
  startDate: Date,
  endDate: Date,
  limit: number = 5
): PipelineStage[] {
  const sortDirection = -1; // Higher is better for most metrics
  
  return [
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
  ] as PipelineStage[];
} 