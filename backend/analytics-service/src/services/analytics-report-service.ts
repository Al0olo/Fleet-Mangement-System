import { Logger } from 'winston';
import mongoose from 'mongoose';
import axios from 'axios';
import AnalyticsReport, { IAnalyticsReport } from '../models/analytics-report';
import UsageStatsService from './usage-stats-service';
import PerformanceMetricService from './performance-metric-service';

class AnalyticsReportService {
  private logger: Logger;
  private usageStatsService: UsageStatsService;
  private performanceMetricService: PerformanceMetricService;
  private vehicleServiceUrl: string;

  constructor(logger: Logger) {
    this.logger = logger;
    this.usageStatsService = new UsageStatsService(logger);
    this.performanceMetricService = new PerformanceMetricService(logger);
    this.vehicleServiceUrl = process.env.VEHICLE_SERVICE_URL || 'http://api-gateway:8080/api';
  }

  // Get an existing report by ID
  public async getReportById(reportId: string): Promise<IAnalyticsReport | null> {
    try {
      const report = await AnalyticsReport.findById(reportId);
      return report;
    } catch (error) {
      this.logger.error(`Error fetching report ${reportId}: ${error}`);
      throw error;
    }
  }

  // Get reports by type and period
  public async getReports(
    reportType: string,
    period: string,
    vehicleId?: string,
    limit: number = 10
  ): Promise<IAnalyticsReport[]> {
    try {
      const query: Record<string, any> = { reportType, period };
      
      if (vehicleId) {
        query.vehicleId = new mongoose.Types.ObjectId(vehicleId);
      }
      
      const reports = await AnalyticsReport.find(query)
        .sort({ endDate: -1 })
        .limit(limit);
      
      return reports;
    } catch (error) {
      this.logger.error(`Error fetching reports: ${error}`);
      throw error;
    }
  }

  // Save a new analytics report
  public async saveReport(reportData: Partial<IAnalyticsReport>): Promise<IAnalyticsReport> {
    try {
      const report = new AnalyticsReport(reportData);
      const savedReport = await report.save();
      
      this.logger.info(`Saved ${reportData.reportType} report for period ${reportData.period}`);
      return savedReport;
    } catch (error) {
      this.logger.error(`Error saving report: ${error}`);
      throw error;
    }
  }

  // Generate a fleet overview report
  public async generateFleetReport(
    startDate: Date,
    endDate: Date,
    period: string = 'custom'
  ): Promise<IAnalyticsReport> {
    try {
      this.logger.info(`Generating fleet report from ${startDate} to ${endDate}`);
      
      // Get fleet usage statistics
      const fleetUsageStats = await this.usageStatsService.getFleetUsageStats(startDate, endDate);
      
      // Get vehicles data
      let vehicleData;
      try {
        const response = await axios.get(`${this.vehicleServiceUrl}/vehicles/stats`);
        vehicleData = response.data.data;
      } catch (error) {
        this.logger.error(`Error fetching vehicle stats: ${error}`);
        vehicleData = { countByType: {}, countByStatus: {} };
      }
      
      // Get performance metrics for fleet
      const fuelEfficiency = await this.performanceMetricService.getFleetMetricAverages(
        'fuelEfficiency', startDate, endDate
      );
      
      const utilization = await this.performanceMetricService.getFleetMetricAverages(
        'utilization', startDate, endDate
      );
      
      const costMetrics = await this.performanceMetricService.getFleetMetricAverages(
        'costPerHour', startDate, endDate
      );
      
      // Compile report data
      const reportData = {
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
      
      // Save the report
      const report = await this.saveReport({
        reportType: 'fleet',
        period,
        startDate,
        endDate,
        data: reportData
      });
      
      return report;
    } catch (error) {
      this.logger.error(`Error generating fleet report: ${error}`);
      throw error;
    }
  }

  // Generate a vehicle-specific report
  public async generateVehicleReport(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
    period: string = 'custom'
  ): Promise<IAnalyticsReport> {
    try {
      this.logger.info(`Generating vehicle report for ${vehicleId} from ${startDate} to ${endDate}`);
      
      // Get vehicle details
      let vehicleDetails;
      try {
        const response = await axios.get(`${this.vehicleServiceUrl}/vehicles/${vehicleId}`);
        vehicleDetails = response.data.data;
      } catch (error) {
        this.logger.error(`Error fetching vehicle details: ${error}`);
        vehicleDetails = { id: vehicleId };
      }
      
      // Get vehicle usage statistics
      const usageStats = await this.usageStatsService.getAggregateVehicleStats(
        vehicleId, startDate, endDate
      );
      
      // Get performance metrics
      const fuelEfficiency = await this.performanceMetricService.getVehicleMetrics(
        vehicleId, 'fuelEfficiency', startDate, endDate, 100
      );
      
      const utilization = await this.performanceMetricService.getVehicleMetrics(
        vehicleId, 'utilization', startDate, endDate, 100
      );
      
      const costMetrics = await this.performanceMetricService.getVehicleMetrics(
        vehicleId, 'costPerHour', startDate, endDate, 100
      );
      
      // Get comparison to fleet averages
      const fuelComparison = await this.performanceMetricService.compareVehicleToFleet(
        vehicleId, 'fuelEfficiency', startDate, endDate
      );
      
      const utilizationComparison = await this.performanceMetricService.compareVehicleToFleet(
        vehicleId, 'utilization', startDate, endDate
      );
      
      // Compile report data
      const reportData = {
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
        generatedAt: new Date()
      };
      
      // Save the report
      const report = await this.saveReport({
        reportType: 'vehicle',
        period,
        startDate,
        endDate,
        vehicleId: new mongoose.Types.ObjectId(vehicleId),
        data: reportData
      });
      
      return report;
    } catch (error) {
      this.logger.error(`Error generating vehicle report: ${error}`);
      throw error;
    }
  }

  // Generate a utilization report
  public async generateUtilizationReport(
    startDate: Date,
    endDate: Date,
    period: string = 'custom'
  ): Promise<IAnalyticsReport> {
    try {
      this.logger.info(`Generating utilization report from ${startDate} to ${endDate}`);
      
      // Get fleet usage statistics
      const fleetUsageStats = await this.usageStatsService.getFleetUsageStats(startDate, endDate);
      
      // Get top vehicles by utilization
      const topVehiclesByHours = await this.usageStatsService.getTopVehiclesByMetric(
        'hoursOperated', startDate, endDate, 10
      );
      
      const topVehiclesByDistance = await this.usageStatsService.getTopVehiclesByMetric(
        'distanceTraveled', startDate, endDate, 10
      );
      
      // Get utilization metrics
      const utilizationAverage = await this.performanceMetricService.getFleetMetricAverages(
        'utilization', startDate, endDate
      );
      
      // Compile report data
      const reportData = {
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
      
      // Save the report
      const report = await this.saveReport({
        reportType: 'utilization',
        period,
        startDate,
        endDate,
        data: reportData
      });
      
      return report;
    } catch (error) {
      this.logger.error(`Error generating utilization report: ${error}`);
      throw error;
    }
  }

  // Generate a cost analysis report
  public async generateCostReport(
    startDate: Date,
    endDate: Date,
    period: string = 'custom'
  ): Promise<IAnalyticsReport> {
    try {
      this.logger.info(`Generating cost report from ${startDate} to ${endDate}`);
      
      // Get cost metrics
      const costPerHourAvg = await this.performanceMetricService.getFleetMetricAverages(
        'costPerHour', startDate, endDate
      );
      
      const costPerKmAvg = await this.performanceMetricService.getFleetMetricAverages(
        'costPerKm', startDate, endDate
      );
      
      // Compile report data
      const reportData = {
        costMetrics: {
          costPerHour: costPerHourAvg,
          costPerKm: costPerKmAvg
        },
        generatedAt: new Date()
      };
      
      // Save the report
      const report = await this.saveReport({
        reportType: 'cost',
        period,
        startDate,
        endDate,
        data: reportData
      });
      
      return report;
    } catch (error) {
      this.logger.error(`Error generating cost report: ${error}`);
      throw error;
    }
  }
}

export default AnalyticsReportService; 