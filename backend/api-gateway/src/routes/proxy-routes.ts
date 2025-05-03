import { Application } from 'express';
import { Logger } from 'winston';
import { Request, Response, NextFunction } from 'express';

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
  // Add a global middleware to log all incoming API requests
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    logger.info(`API Request: ${req.method} ${req.originalUrl}`);
    next();
  });

  // Add an additional test endpoint to ensure this function is called
  app.get('/api/proxy-test', (req: Request, res: Response) => {
    logger.info('Proxy test endpoint hit');
    res.status(200).json({
      status: 'ok',
      message: 'Proxy routes are configured',
      timestamp: new Date().toISOString()
    });
  });

  // Vehicle proxy is set up directly in server.ts
  logger.info('Proxy routes setup complete');
};

export default setupProxyRoutes; 