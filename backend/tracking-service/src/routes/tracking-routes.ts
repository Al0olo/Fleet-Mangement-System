import { Application, Router } from 'express';
import { TrackingController } from '../controllers/tracking-controller';
import { StatusController } from '../controllers/status-controller';
import { EventController } from '../controllers/event-controller';
import winston from 'winston';
import { RedisClientType } from 'redis';

/**
 * @swagger
 * tags:
 *   - name: Tracking
 *     description: Vehicle tracking operations
 *   - name: Status
 *     description: Vehicle status operations
 *   - name: Events
 *     description: Vehicle events operations
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
 * @swagger
 * /api/tracking/status:
 *   post:
 *     summary: Record a new status for a vehicle
 *     tags: [Status]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VehicleStatus'
 *     responses:
 *       201:
 *         description: Status recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/VehicleStatus'
 *       400:
 *         description: Bad request - missing required fields
 *       500:
 *         description: Server error
 * 
 * /api/tracking/vehicles/{vehicleId}/status:
 *   get:
 *     summary: Get the latest status for a vehicle
 *     tags: [Status]
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the vehicle
 *     responses:
 *       200:
 *         description: Latest status data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/VehicleStatus'
 *       404:
 *         description: Vehicle status not found
 *       500:
 *         description: Server error
 *
 * /api/tracking/vehicles/{vehicleId}/status/history:
 *   get:
 *     summary: Get status history for a vehicle
 *     tags: [Status]
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
 *         description: Status history data
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
 *                     $ref: '#/components/schemas/VehicleStatus'
 *       500:
 *         description: Server error
 *
 * /api/tracking/status/{statusType}:
 *   get:
 *     summary: Get vehicles with a specific status
 *     tags: [Status]
 *     parameters:
 *       - in: path
 *         name: statusType
 *         schema:
 *           type: string
 *           enum: [ACTIVE, IDLE, MAINTENANCE, OUT_OF_SERVICE]
 *         required: true
 *         description: Status type to filter by
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of records to return
 *     responses:
 *       200:
 *         description: Vehicles with the specified status
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
 *                     $ref: '#/components/schemas/VehicleStatus'
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/tracking/events:
 *   post:
 *     summary: Record a new event for a vehicle
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VehicleEvent'
 *     responses:
 *       201:
 *         description: Event recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/VehicleEvent'
 *       400:
 *         description: Bad request - missing required fields
 *       500:
 *         description: Server error
 * 
 * /api/tracking/vehicles/{vehicleId}/events:
 *   get:
 *     summary: Get events for a vehicle
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the vehicle
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *           enum: [TRIP_STARTED, TRIP_COMPLETED, MAINTENANCE_DUE, IDLE_STARTED, IDLE_ENDED, GEOFENCE_ENTER, GEOFENCE_EXIT, BATTERY_LOW, FUEL_LOW]
 *         description: Event type to filter by
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
 *         description: Vehicle events
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
 *                     $ref: '#/components/schemas/VehicleEvent'
 *       500:
 *         description: Server error
 *
 * /api/tracking/events/{eventType}:
 *   get:
 *     summary: Get recent events of a specific type
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: eventType
 *         schema:
 *           type: string
 *           enum: [TRIP_STARTED, TRIP_COMPLETED, MAINTENANCE_DUE, IDLE_STARTED, IDLE_ENDED, GEOFENCE_ENTER, GEOFENCE_EXIT, BATTERY_LOW, FUEL_LOW]
 *         required: true
 *         description: Event type to filter by
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of records to return
 *     responses:
 *       200:
 *         description: Events of the specified type
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
 *                     $ref: '#/components/schemas/VehicleEvent'
 *       500:
 *         description: Server error
 *
 * /api/tracking/trips/{tripId}/events:
 *   get:
 *     summary: Get events for a specific trip
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: tripId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the trip
 *     responses:
 *       200:
 *         description: Trip events
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
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/VehicleEvent'
 *       404:
 *         description: Trip not found
 *       500:
 *         description: Server error
 */

/**
 * Configure the tracking routes
 * @param app Express application
 */
const setupTrackingRoutes = (app: Application): void => {
  const router = Router();
  const logger = app.locals.logger as winston.Logger;
  
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
  
  // Initialize controllers
  const trackingController = (req: any) => 
    new TrackingController(logger, req.app.locals.redis as RedisClientType<any, any, any>);

  const statusController = (req: any) =>
    new StatusController(logger, req.app.locals.redis as RedisClientType<any, any, any>);

  const eventController = (req: any) =>
    new EventController(logger, req.app.locals.redis as RedisClientType<any, any, any>);

  // Tracking Routes
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

  // Status Routes
  // Record a new status
  router.post('/status', (req, res) =>
    statusController(req).recordStatus(req, res));

  // Get the latest status for a vehicle
  router.get('/vehicles/:vehicleId/status', (req, res) =>
    statusController(req).getLatestStatus(req, res));

  // Get status history for a vehicle
  router.get('/vehicles/:vehicleId/status/history', (req, res) =>
    statusController(req).getStatusHistory(req, res));

  // Get vehicles with a specific status
  router.get('/status/:statusType', (req, res) =>
    statusController(req).getVehiclesByStatus(req, res));

  // Event Routes
  // Record a new event
  router.post('/events', (req, res) =>
    eventController(req).recordEvent(req, res));

  // Get events for a vehicle
  router.get('/vehicles/:vehicleId/events', (req, res) =>
    eventController(req).getVehicleEvents(req, res));

  // Get recent events of a specific type
  router.get('/events/:eventType', (req, res) =>
    eventController(req).getRecentEventsByType(req, res));

  // Get events for a specific trip
  router.get('/trips/:tripId/events', (req, res) =>
    eventController(req).getTripEvents(req, res));

  // Register routes
  app.use('/api', router);
};

export default setupTrackingRoutes; 