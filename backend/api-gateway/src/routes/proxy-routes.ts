import { Application } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { Logger } from 'winston';
import { createResilientProxy } from '../middleware/resilience/resilient-proxy';
import { createServiceLimiter } from '../middleware/rate-limiter';
import { Request, Response } from 'express';

/**
 * @swagger
 * tags:
 *   name: Vehicles
 *   description: Vehicle management endpoints
 */

/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     summary: Get all vehicles
 *     description: Retrieve a list of all vehicles in the fleet
 *     tags: [Vehicles]
 *     responses:
 *       200:
 *         description: List of vehicles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: v123
 *                   make:
 *                     type: string
 *                     example: Toyota
 *                   model:
 *                     type: string
 *                     example: Camry
 *                   year:
 *                     type: number
 *                     example: 2022
 *                   vin:
 *                     type: string
 *                     example: 1HGCM82633A123456
 *                   status:
 *                     type: string
 *                     example: active
 */

/**
 * @swagger
 * /api/tracking/location:
 *   get:
 *     summary: Get real-time vehicle locations
 *     description: Retrieve the current location of all vehicles in the fleet
 *     tags: [Tracking]
 *     responses:
 *       200:
 *         description: Vehicle locations
 */

/**
 * @swagger
 * /api/maintenance/schedule:
 *   get:
 *     summary: Get maintenance schedules
 *     description: Retrieve the maintenance schedule for all vehicles
 *     tags: [Maintenance]
 *     responses:
 *       200:
 *         description: Maintenance schedules
 */

/**
 * @swagger
 * /api/analytics/usage:
 *   get:
 *     summary: Get vehicle usage analytics
 *     description: Retrieve usage statistics for the fleet
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Usage analytics
 */

/**
 * @swagger
 * /api/simulator/start:
 *   post:
 *     summary: Start a fleet simulation
 *     description: Begin a simulation of fleet operations
 *     tags: [Simulator]
 *     responses:
 *       200:
 *         description: Simulation started
 */

// Setup proxy routes
const setupProxyRoutes = (app: Application, logger: Logger) => {
  // Define services
  const services = [
    {
      name: 'vehicle-service',
      url: process.env.VEHICLE_SERVICE_URL || 'http://localhost:3000',
      path: '/api/vehicles',
      rateLimit: 100
    },
    {
      name: 'tracking-service',
      url: process.env.TRACKING_SERVICE_URL || 'http://localhost:3001',
      path: '/api/tracking',
      rateLimit: 200
    },
    {
      name: 'maintenance-service',
      url: process.env.MAINTENANCE_SERVICE_URL || 'http://localhost:3002',
      path: '/api/maintenance',
      rateLimit: 50
    },
    {
      name: 'analytics-service',
      url: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3003',
      path: '/api/analytics',
      rateLimit: 30
    },
    {
      name: 'simulator-service',
      url: process.env.SIMULATOR_SERVICE_URL || 'http://localhost:3004',
      path: '/api/simulator',
      rateLimit: 20
    }
  ];

  // Create proxy for each service
  services.forEach(async service => {
    try {
      // Create rate limiter for this service
      const limiter = await createServiceLimiter(service.name, service.rateLimit, logger);
      
      // Create resilient proxy with retry, circuit breaker and caching
      const proxyMiddleware = createResilientProxy({
        target: service.url,
        serviceName: service.name,
        pathRewrite: {
          [`^${service.path}`]: '/api'  // Rewrite path
        },
        logger,
        onProxyReq: fixRequestBody, // Fix issues with modified request bodies
        onError: (err: Error, req: Request, res: Response) => {
          logger.error(`Proxy error for ${service.name}: ${err.message}`);
          res.status(500).json({
            status: 'error',
            message: 'Service temporarily unavailable',
            service: service.name
          });
        }
      });

      // Register the proxy with rate limiting
      app.use(service.path, limiter, proxyMiddleware);
      
      logger.debug(`Proxy registered for ${service.name} at ${service.path}`);
    } catch (error) {
      logger.error(`Failed to set up proxy for ${service.name}: ${error}`);
    }
  });
};

export default setupProxyRoutes; 