/**
 * Utility functions for analytics data transformation
 */

/**
 * Interface for trend input data 
 */
interface TrendData {
  period: string;
  avgValue: number;
  count: number;
  minValue: number;
  maxValue: number;
  firstDate: Date;
}

/**
 * Interface for transformed metric trend output 
 */
export interface MetricTrend {
  period: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  count: number;
  minValue: number;
  maxValue: number;
  firstDate: Date;
}

/**
 * Interface for usage statistics
 */
export interface UsageStats {
  totalDistance?: number;
  totalHours?: number;
  totalFuel?: number;
  totalIdle?: number;
  [key: string]: any;
}

/**
 * Interface for performance metrics
 */
export interface PerformanceMetric {
  value: number;
  [key: string]: any;
}

/**
 * Type for flexible performance metrics input
 */
export type PerformanceMetricInput = PerformanceMetric[] | Record<string, any>;

/**
 * Interface for vehicle details
 */
export interface VehicleDetails {
  [key: string]: any;
}

/**
 * Interface for vehicle statistics
 */
export interface VehicleStats {
  countByType?: Record<string, number>;
  countByStatus?: Record<string, number>;
  [key: string]: any;
}

/**
 * Compiled report data structure
 */
export interface ReportData {
  vehicleDetails: VehicleDetails;
  usageStats: UsageStats;
  performanceMetrics: {
    fuelEfficiency: {
      metrics: PerformanceMetric[];
      fleetComparison: any;
    };
    utilization: {
      metrics: PerformanceMetric[];
      fleetComparison: any;
    };
    costMetrics: {
      metrics: PerformanceMetric[];
    };
  };
  data: {
    totalDistance: number;
    totalFuelConsumption: number;
    fuelEfficiency: number;
    utilizationRate: number;
    maintenanceCost: number;
    costPerKm: number;
    totalHours: number;
    totalCost: number;
    idleTime: number;
  };
  generatedAt: Date;
}

/**
 * Fleet report data structure
 */
export interface FleetReportData {
  fleetOverview: {
    totalVehicles: number;
    vehiclesByType: Record<string, number>;
    vehiclesByStatus: Record<string, number>;
  };
  usageStats: UsageStats;
  performanceMetrics: {
    fuelEfficiency: PerformanceMetricInput;
    utilization: PerformanceMetricInput;
    costPerHour: PerformanceMetricInput;
  };
  generatedAt: Date;
}

/**
 * Utilization report data structure
 */
export interface UtilizationReportData {
  fleetUtilization: {
    utilizationAverage: PerformanceMetricInput;
    [key: string]: any;
  };
  topPerformers: {
    byHours: any[];
    byDistance: any[];
  };
  generatedAt: Date;
}

/**
 * Cost report data structure
 */
export interface CostReportData {
  costMetrics: {
    costPerHour: PerformanceMetricInput;
    costPerKm: PerformanceMetricInput;
  };
  generatedAt: Date;
}

/**
 * Transforms raw trend data to match frontend MetricTrend interface
 * Calculates changes and trend directions between periods
 * 
 * @param trends - Array of trend data points with period and metric values
 * @returns Transformed array with added trend direction and change calculations
 */
export function transformTrendData(trends: TrendData[]): MetricTrend[] {
  return trends.map((trend, index, arr) => {
    // Calculate change compared to previous period (if available)
    const prevValue = index > 0 ? arr[index - 1].avgValue : trend.avgValue;
    const change = index > 0 ? trend.avgValue - prevValue : 0;
    
    // Determine trend direction
    let trendDirection: 'up' | 'down' | 'stable' = 'stable';
    if (change > 0.01) {
      trendDirection = 'up';
    } else if (change < -0.01) {
      trendDirection = 'down';
    }
    
    return {
      period: trend.period,
      value: trend.avgValue,
      change: change,
      trend: trendDirection,
      // Include original data for reference
      count: trend.count,
      minValue: trend.minValue,
      maxValue: trend.maxValue,
      firstDate: trend.firstDate
    };
  });
}

/**
 * Calculates and compiles report summary metrics from raw performance and usage data
 * 
 * @param vehicleDetails - Vehicle information details
 * @param usageStats - Vehicle usage statistics
 * @param utilization - Array of utilization metrics
 * @param fuelEfficiency - Array of fuel efficiency metrics
 * @param costMetrics - Array of cost metrics
 * @param utilizationComparison - Comparison of utilization to fleet averages
 * @param fuelComparison - Comparison of fuel efficiency to fleet averages
 * @returns Compiled report data with calculated summary metrics
 */
export function compileReportData(
  vehicleDetails: VehicleDetails,
  usageStats: UsageStats,
  utilization: PerformanceMetric[],
  fuelEfficiency: PerformanceMetric[],
  costMetrics: PerformanceMetric[],
  utilizationComparison: any,
  fuelComparison: any
): ReportData {
  // Calculate summary metrics for key metrics display
  const avgUtilization = utilization && utilization.length > 0 
    ? utilization.reduce((sum, m) => sum + m.value, 0) / utilization.length 
    : 0;
  
  const avgFuelEfficiency = fuelEfficiency && fuelEfficiency.length > 0 
    ? fuelEfficiency.reduce((sum, m) => sum + m.value, 0) / fuelEfficiency.length 
    : 0;
  
  const avgCostPerHour = costMetrics && costMetrics.length > 0 
    ? costMetrics.reduce((sum, m) => sum + m.value, 0) / costMetrics.length 
    : 0;
  
  // Calculate cost per km based on available data
  const totalDistance = usageStats.totalDistance || 0;
  const totalHours = usageStats.totalHours || 0;
  const totalCost = totalHours * avgCostPerHour;
  const costPerKm = totalDistance > 0 ? totalCost / totalDistance : 0;
  
  // Compile report data
  return {
    vehicleDetails,
    usageStats,
    performanceMetrics: {
      fuelEfficiency: {
        metrics: fuelEfficiency,
        fleetComparison: fuelComparison
      },
      utilization: {
        metrics: utilization,
        fleetComparison: utilizationComparison
      },
      costMetrics: {
        metrics: costMetrics
      }
    },
    // Summary data for Key Metrics component
    data: {
      totalDistance: totalDistance,
      totalFuelConsumption: usageStats.totalFuel || 0,
      fuelEfficiency: avgFuelEfficiency,
      utilizationRate: avgUtilization,
      maintenanceCost: totalCost * 0.15, // Estimate maintenance cost as 15% of total operating cost
      costPerKm: costPerKm,
      // Add additional metrics that might be useful
      totalHours: totalHours,
      totalCost: totalCost,
      idleTime: usageStats.totalIdle || 0
    },
    generatedAt: new Date()
  };
}

/**
 * Compiles fleet overview report data from various metrics
 * 
 * @param vehicleData - Statistics about vehicle types and statuses
 * @param fleetUsageStats - Fleet-wide usage statistics
 * @param fuelEfficiency - Fuel efficiency metrics
 * @param utilization - Utilization metrics
 * @param costMetrics - Cost metrics
 * @returns Compiled fleet report data
 */
export function compileFleetReportData(
  vehicleData: VehicleStats,
  fleetUsageStats: UsageStats,
  fuelEfficiency: PerformanceMetricInput,
  utilization: PerformanceMetricInput,
  costMetrics: PerformanceMetricInput
): FleetReportData {
  return {
    fleetOverview: {
      totalVehicles: Object.values(vehicleData.countByType || {})
        .reduce((sum: number, count: any) => sum + count, 0),
      vehiclesByType: vehicleData.countByType || {},
      vehiclesByStatus: vehicleData.countByStatus || {}
    },
    usageStats: fleetUsageStats,
    performanceMetrics: {
      fuelEfficiency,
      utilization,
      costPerHour: costMetrics
    },
    generatedAt: new Date()
  };
}

/**
 * Compiles utilization report data
 * 
 * @param fleetUsageStats - Fleet-wide usage statistics
 * @param utilizationAverage - Average utilization metrics
 * @param topVehiclesByHours - Top vehicles ranked by operating hours
 * @param topVehiclesByDistance - Top vehicles ranked by distance traveled
 * @returns Compiled utilization report data
 */
export function compileUtilizationReportData(
  fleetUsageStats: UsageStats,
  utilizationAverage: PerformanceMetricInput,
  topVehiclesByHours: any[],
  topVehiclesByDistance: any[]
): UtilizationReportData {
  return {
    fleetUtilization: {
      ...fleetUsageStats,
      utilizationAverage
    },
    topPerformers: {
      byHours: topVehiclesByHours,
      byDistance: topVehiclesByDistance
    },
    generatedAt: new Date()
  };
}

/**
 * Compiles cost analysis report data
 * 
 * @param costPerHourAvg - Average cost per hour metrics
 * @param costPerKmAvg - Average cost per kilometer metrics
 * @returns Compiled cost report data
 */
export function compileCostReportData(
  costPerHourAvg: PerformanceMetricInput,
  costPerKmAvg: PerformanceMetricInput
): CostReportData {
  return {
    costMetrics: {
      costPerHour: costPerHourAvg,
      costPerKm: costPerKmAvg
    },
    generatedAt: new Date()
  };
} 