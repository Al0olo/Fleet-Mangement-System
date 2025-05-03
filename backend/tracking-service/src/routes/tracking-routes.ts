import { Router } from 'express';
import { TrackingController } from '../controllers/tracking-controller';
import winston from 'winston';
import { RedisClientType } from 'redis';

/**
 * @swagger
 * tags:
 *   name: Tracking
 *   description: Vehicle tracking operations
 */

/**
 * @swagger
 * /api/tracking/location:
 *   post:
 *     summary: Record a new location for a vehicle
 *     tags: [Tracking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LocationData'
 *     responses:
 *       201:
 *         description: Location recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/LocationData'
 *       400:
 *         description: Bad request - missing required fields
 *       500:
 *         description: Server error
 * 
 * /api/tracking/vehicles/{vehicleId}/location:
 *   get:
 *     summary: Get the latest location for a vehicle
 *     tags: [Tracking]
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the vehicle
 *     responses:
 *       200:
 *         description: Latest location data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/LocationData'
 *       404:
 *         description: Vehicle location not found
 *       500:
 *         description: Server error
 * 
 * /api/tracking/vehicles/{vehicleId}/history:
 *   get:
 *     summary: Get location history for a vehicle
 *     tags: [Tracking]
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the vehicle
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for the history query (ISO format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for the history query (ISO format)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of records to return
 *     responses:
 *       200:
 *         description: Location history data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 count:
 *                   type: integer
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LocationData'
 *       500:
 *         description: Server error
 * 
 * /api/tracking/nearby:
 *   get:
 *     summary: Find vehicles near a specific location
 *     tags: [Tracking]
 *     parameters:
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *         required: true
 *         description: Longitude coordinate
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *         required: true
 *         description: Latitude coordinate
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 1000
 *         description: Radius in meters (default 1000m)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: List of nearby vehicles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LocationData'
 *       400:
 *         description: Bad request - missing or invalid parameters
 *       500:
 *         description: Server error
 */

/**
 * Configure the tracking routes
 * @param logger Winston logger instance
 */
const setupTrackingRoutes = (logger: winston.Logger) => {
  const router = Router();
  
  // Use app.locals to get the Redis client at runtime
  router.use((req, _res, next) => {
    req.app.locals.logger = logger;
    next();
  });
  
  // Handle case where app doesn't have a redis client yet
  router.use((req, res, next) => {
    if (!req.app.locals.redis) {
      logger.error('Redis client not available');
      res.status(503).json({ 
        status: 'error', 
        message: 'Service temporarily unavailable - Redis connection not established' 
      });
      return;
    }
    next();
  });
  
  // Initialize controller
  const trackingController = (req: any) => 
    new TrackingController(logger, req.app.locals.redis as RedisClientType<any, any, any>);

  // Record a new location
  router.post('/location', (req, res) => 
    trackingController(req).recordLocation(req, res));
  
  // Get the latest location for a vehicle
  router.get('/vehicles/:vehicleId/location', (req, res) => 
    trackingController(req).getLatestLocation(req, res));
  
  // Get location history for a vehicle
  router.get('/vehicles/:vehicleId/history', (req, res) => 
    trackingController(req).getLocationHistory(req, res));
  
  // Find vehicles near a specific location
  router.get('/nearby', (req, res) => 
    trackingController(req).findNearbyVehicles(req, res));
  
  return router;
};

export default setupTrackingRoutes; 