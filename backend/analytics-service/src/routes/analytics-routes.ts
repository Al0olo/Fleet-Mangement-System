import express, { Router } from 'express';
import AnalyticsController from '../controllers/analytics-controller';
import { Logger } from 'winston';

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Fleet analytics operations
 */

export default function setupAnalyticsRoutes(logger: Logger): Router {
  const analyticsController = new AnalyticsController(logger);

  /**
   * @swagger
   * /api/analytics/fleet:
   *   get:
   *     summary: Get fleet analytics
   *     description: Retrieve analytics overview for the entire fleet
   *     tags: [Analytics]
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Start date for analytics period (defaults to 30 days ago)
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: End date for analytics period (defaults to current date)
   *       - in: query
   *         name: period
   *         schema:
   *           type: string
   *           enum: [daily, weekly, monthly, quarterly, yearly, custom]
   *           default: custom
   *         description: Time period for the report
   *     responses:
   *       200:
   *         description: Fleet analytics report
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 data:
   *                   $ref: '#/components/schemas/AnalyticsReport'
   *       500:
   *         description: Server error
   */
  router.get('/fleet', analyticsController.getFleetAnalytics);

  /**
   * @swagger
   * /api/analytics/vehicles/{id}:
   *   get:
   *     summary: Get vehicle analytics
   *     description: Retrieve analytics for a specific vehicle
   *     tags: [Analytics]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: Vehicle ID
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Start date for analytics period (defaults to 30 days ago)
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: End date for analytics period (defaults to current date)
   *       - in: query
   *         name: period
   *         schema:
   *           type: string
   *           enum: [daily, weekly, monthly, quarterly, yearly, custom]
   *           default: custom
   *         description: Time period for the report
   *     responses:
   *       200:
   *         description: Vehicle analytics report
   *       400:
   *         description: Invalid vehicle ID
   *       500:
   *         description: Server error
   */
  router.get('/vehicles/:id', analyticsController.getVehicleAnalytics);

  /**
   * @swagger
   * /api/analytics/utilization:
   *   get:
   *     summary: Get utilization analytics
   *     description: Retrieve utilization analytics for the fleet
   *     tags: [Analytics]
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Start date (defaults to 30 days ago)
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: End date (defaults to current date)
   *       - in: query
   *         name: period
   *         schema:
   *           type: string
   *           enum: [daily, weekly, monthly, quarterly, yearly, custom]
   *           default: custom
   *         description: Time period for the report
   *     responses:
   *       200:
   *         description: Utilization analytics report
   *       500:
   *         description: Server error
   */
  router.get('/utilization', analyticsController.getUtilizationAnalytics);

  /**
   * @swagger
   * /api/analytics/cost:
   *   get:
   *     summary: Get cost analytics
   *     description: Retrieve cost analytics for the fleet
   *     tags: [Analytics]
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Start date (defaults to 30 days ago)
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: End date (defaults to current date)
   *       - in: query
   *         name: period
   *         schema:
   *           type: string
   *           enum: [daily, weekly, monthly, quarterly, yearly, custom]
   *           default: custom
   *         description: Time period for the report
   *     responses:
   *       200:
   *         description: Cost analytics report
   *       500:
   *         description: Server error
   */
  router.get('/cost', analyticsController.getCostAnalytics);

  /**
   * @swagger
   * /api/analytics/usage/{vehicleId}:
   *   get:
   *     summary: Get vehicle usage statistics
   *     description: Retrieve usage statistics for a specific vehicle
   *     tags: [Analytics]
   *     parameters:
   *       - in: path
   *         name: vehicleId
   *         schema:
   *           type: string
   *         required: true
   *         description: Vehicle ID
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Start date for filtering
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: End date for filtering
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Maximum number of records to return
   *     responses:
   *       200:
   *         description: Usage statistics
   *       400:
   *         description: Invalid vehicle ID
   *       500:
   *         description: Server error
   */
  router.get('/usage/:vehicleId', analyticsController.getUsageStats);

  /**
   * @swagger
   * /api/analytics/metrics/{vehicleId}:
   *   get:
   *     summary: Get vehicle performance metrics
   *     description: Retrieve performance metrics for a specific vehicle
   *     tags: [Analytics]
   *     parameters:
   *       - in: path
   *         name: vehicleId
   *         schema:
   *           type: string
   *         required: true
   *         description: Vehicle ID
   *       - in: query
   *         name: metricType
   *         schema:
   *           type: string
   *           enum: [fuelEfficiency, maintenanceFrequency, utilization, costPerHour, costPerKm]
   *           default: fuelEfficiency
   *         description: Type of metric to retrieve
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Start date for filtering
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: End date for filtering
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 100
   *         description: Maximum number of records to return
   *     responses:
   *       200:
   *         description: Performance metrics
   *       400:
   *         description: Invalid vehicle ID
   *       500:
   *         description: Server error
   */
  router.get('/metrics/:vehicleId', analyticsController.getPerformanceMetrics);

  /**
   * @swagger
   * /api/analytics/trends/{vehicleId}:
   *   get:
   *     summary: Get vehicle metric trends
   *     description: Retrieve trends for a specific performance metric
   *     tags: [Analytics]
   *     parameters:
   *       - in: path
   *         name: vehicleId
   *         schema:
   *           type: string
   *         required: true
   *         description: Vehicle ID
   *       - in: query
   *         name: metricType
   *         schema:
   *           type: string
   *           enum: [fuelEfficiency, maintenanceFrequency, utilization, costPerHour, costPerKm]
   *           default: fuelEfficiency
   *         description: Type of metric to analyze
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Start date (defaults to 30 days ago)
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: End date (defaults to current date)
   *       - in: query
   *         name: interval
   *         schema:
   *           type: string
   *           enum: [day, week, month]
   *           default: day
   *         description: Interval for trend grouping
   *     responses:
   *       200:
   *         description: Metric trends
   *       400:
   *         description: Invalid vehicle ID or interval
   *       500:
   *         description: Server error
   */
  router.get('/trends/:vehicleId', analyticsController.getMetricTrends);

  /**
   * @swagger
   * /api/analytics/compare/{vehicleId}:
   *   get:
   *     summary: Compare vehicle to fleet
   *     description: Compare a vehicle's performance metrics to fleet averages
   *     tags: [Analytics]
   *     parameters:
   *       - in: path
   *         name: vehicleId
   *         schema:
   *           type: string
   *         required: true
   *         description: Vehicle ID
   *       - in: query
   *         name: metricType
   *         schema:
   *           type: string
   *           enum: [fuelEfficiency, maintenanceFrequency, utilization, costPerHour, costPerKm]
   *           default: fuelEfficiency
   *         description: Type of metric to compare
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Start date (defaults to 30 days ago)
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: End date (defaults to current date)
   *     responses:
   *       200:
   *         description: Comparison results
   *       400:
   *         description: Invalid vehicle ID
   *       500:
   *         description: Server error
   */
  router.get('/compare/:vehicleId', analyticsController.compareVehicleToFleet);

  /**
   * @swagger
   * /api/analytics/reports:
   *   get:
   *     summary: Get saved analytics reports
   *     description: Retrieve previously generated analytics reports
   *     tags: [Analytics]
   *     parameters:
   *       - in: query
   *         name: reportType
   *         schema:
   *           type: string
   *           enum: [fleet, vehicle, maintenance, cost, utilization]
   *           default: fleet
   *         description: Type of report
   *       - in: query
   *         name: period
   *         schema:
   *           type: string
   *           enum: [daily, weekly, monthly, quarterly, yearly, custom]
   *           default: monthly
   *         description: Time period of the report
   *       - in: query
   *         name: vehicleId
   *         schema:
   *           type: string
   *         description: Vehicle ID for vehicle-specific reports
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Maximum number of reports to return
   *     responses:
   *       200:
   *         description: List of reports
   *       400:
   *         description: Invalid vehicle ID
   *       500:
   *         description: Server error
   */
  router.get('/reports', analyticsController.getReports);

  return router;
} 