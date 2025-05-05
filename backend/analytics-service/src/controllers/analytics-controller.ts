import { Request, Response } from 'express';
import { Logger } from 'winston';
import mongoose from 'mongoose';
import AnalyticsReportService from '../services/analytics-report-service';
import UsageStatsService from '../services/usage-stats-service';
import PerformanceMetricService from '../services/performance-metric-service';
import { transformTrendData } from '../util/analytics-helpers';

class AnalyticsController {
  private logger: Logger;
  private analyticsReportService: AnalyticsReportService;
  private usageStatsService: UsageStatsService;
  private performanceMetricService: PerformanceMetricService;

  constructor(logger: Logger) {
    this.logger = logger;
    this.analyticsReportService = new AnalyticsReportService(logger);
    this.usageStatsService = new UsageStatsService(logger);
    this.performanceMetricService = new PerformanceMetricService(logger);
  }

  // Get fleet overview analytics
  public getFleetAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default to last 30 days
        endDate = new Date(),
        period = 'custom'
      } = req.query;
      
      const report = await this.analyticsReportService.generateFleetReport(
        new Date(startDate as string),
        new Date(endDate as string),
        period as string
      );

      res.status(200).json({
        status: 'success',
        data: report
      });
    } catch (error) {
      this.logger.error(`Error getting fleet analytics: ${error}`);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get fleet analytics',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  // Get vehicle-specific analytics
  public getVehicleAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { 
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default to last 30 days
        endDate = new Date(),
        period = 'custom'
      } = req.query;
      
      // Validate vehicle ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid vehicle ID format'
        });
        return;
      }
      
      const report = await this.analyticsReportService.generateVehicleReport(
        id,
        new Date(startDate as string),
        new Date(endDate as string),
        period as string
      );

      res.status(200).json({
        status: 'success',
        data: report
      });
    } catch (error) {
      this.logger.error(`Error getting vehicle analytics: ${error}`);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get vehicle analytics',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  // Get utilization analytics
  public getUtilizationAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default to last 30 days
        endDate = new Date(),
        period = 'custom'
      } = req.query;
      
      const report = await this.analyticsReportService.generateUtilizationReport(
        new Date(startDate as string),
        new Date(endDate as string),
        period as string
      );

      res.status(200).json({
        status: 'success',
        data: report
      });
    } catch (error) {
      this.logger.error(`Error getting utilization analytics: ${error}`);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get utilization analytics',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  // Get cost analytics
  public getCostAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default to last 30 days
        endDate = new Date(),
        period = 'custom'
      } = req.query;
      
      const report = await this.analyticsReportService.generateCostReport(
        new Date(startDate as string),
        new Date(endDate as string),
        period as string
      );

      res.status(200).json({
        status: 'success',
        data: report
      });
    } catch (error) {
      this.logger.error(`Error getting cost analytics: ${error}`);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get cost analytics',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  // Get usage stats
  public getUsageStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { vehicleId } = req.params;
      const { 
        startDate, 
        endDate,
        limit = 10
      } = req.query;
      
      // Validate vehicle ID if provided
      if (vehicleId && !mongoose.Types.ObjectId.isValid(vehicleId)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid vehicle ID format'
        });
        return;
      }
      
      const stats = await this.usageStatsService.getVehicleUsageStats(
        vehicleId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        Number(limit)
      );

      res.status(200).json({
        status: 'success',
        count: stats.length,
        data: stats
      });
    } catch (error) {
      this.logger.error(`Error getting usage stats: ${error}`);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get usage stats',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  // Get performance metrics
  public getPerformanceMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { vehicleId } = req.params;
      const { 
        metricType = 'fuelEfficiency',
        startDate, 
        endDate,
        limit = 100
      } = req.query;
      
      // Validate vehicle ID
      if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid vehicle ID format'
        });
        return;
      }
      
      const metrics = await this.performanceMetricService.getVehicleMetrics(
        vehicleId,
        metricType as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        Number(limit)
      );

      res.status(200).json({
        status: 'success',
        count: metrics.length,
        data: metrics
      });
    } catch (error) {
      this.logger.error(`Error getting performance metrics: ${error}`);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get performance metrics',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  // Get metric trends
  public getMetricTrends = async (req: Request, res: Response): Promise<void> => {
    try {
      const { vehicleId } = req.params;
      const { 
        metricType = 'fuelEfficiency',
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate = new Date(),
        interval = 'day'
      } = req.query;
      
      // Validate vehicle ID
      if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid vehicle ID format'
        });
        return;
      }
      
      // Validate interval
      if (!['day', 'week', 'month'].includes(interval as string)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid interval - must be day, week, or month'
        });
        return;
      }
      
      const trends = await this.performanceMetricService.getMetricTrend(
        vehicleId,
        metricType as string,
        new Date(startDate as string),
        new Date(endDate as string),
        interval as 'day' | 'week' | 'month'
      );

      // Use the helper function to transform data
      const transformedTrends = transformTrendData(trends);

      res.status(200).json({
        status: 'success',
        count: transformedTrends.length,
        data: transformedTrends
      });
    } catch (error) {
      this.logger.error(`Error getting metric trends: ${error}`);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get metric trends',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  // Compare vehicle to fleet
  public compareVehicleToFleet = async (req: Request, res: Response): Promise<void> => {
    try {
      const { vehicleId } = req.params;
      const { 
        metricType = 'fuelEfficiency',
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate = new Date()
      } = req.query;
      
      // Validate vehicle ID
      if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid vehicle ID format'
        });
        return;
      }
      
      const comparison = await this.performanceMetricService.compareVehicleToFleet(
        vehicleId,
        metricType as string,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.status(200).json({
        status: 'success',
        data: comparison
      });
    } catch (error) {
      this.logger.error(`Error comparing vehicle to fleet: ${error}`);
      res.status(500).json({
        status: 'error',
        message: 'Failed to compare vehicle to fleet',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  // Get saved reports
  public getReports = async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        reportType = 'fleet',
        period = 'monthly',
        vehicleId,
        limit = 10
      } = req.query;
      
      // Validate vehicle ID if provided
      if (vehicleId && !mongoose.Types.ObjectId.isValid(vehicleId as string)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid vehicle ID format'
        });
        return;
      }
      
      const reports = await this.analyticsReportService.getReports(
        reportType as string,
        period as string,
        vehicleId as string,
        Number(limit)
      );

      res.status(200).json({
        status: 'success',
        count: reports.length,
        data: reports
      });
    } catch (error) {
      this.logger.error(`Error getting reports: ${error}`);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get reports',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };
}

export default AnalyticsController; 