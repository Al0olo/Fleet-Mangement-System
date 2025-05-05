import express, { Router } from 'express';
import MaintenanceController from '../controllers/maintenance-controller';
import ScheduleController from '../controllers/schedule-controller';
import { Logger } from 'winston';

/**
 * @swagger
 * tags:
 *   name: Maintenance
 *   description: Maintenance records management
 * 
 * @swagger
 * tags:
 *   name: Schedules
 *   description: Maintenance scheduling operations
 */

export default function setupMaintenanceRoutes(logger: Logger): Router {
  const router: Router = express.Router();
  const maintenanceController = new MaintenanceController(logger);
  const scheduleController = new ScheduleController(logger);

  // Maintenance Records Routes

  /**
   * @swagger
   * /api/maintenance/records:
   *   get:
   *     summary: Get all maintenance records
   *     description: Retrieve a list of maintenance records with optional filtering
   *     tags: [Maintenance]
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 100
   *         description: Maximum number of records to return
   *       - in: query
   *         name: skip
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Number of records to skip
   *       - in: query
   *         name: sort
   *         schema:
   *           type: string
   *           default: performedAt
   *         description: Field to sort by
   *       - in: query
   *         name: order
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: desc
   *         description: Sort order
   *       - in: query
   *         name: vehicleId
   *         schema:
   *           type: string
   *         description: Filter by vehicle ID
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *         description: Filter by maintenance type
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *         description: Filter by status
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter by maintenance date starting from
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter by maintenance date ending at
   *     responses:
   *       200:
   *         description: A list of maintenance records
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 count:
   *                   type: number
   *                   example: 10
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/MaintenanceRecord'
   *       500:
   *         description: Server error
   */
  router.get('/records', maintenanceController.getAllMaintenanceRecords);

  /**
   * @swagger
   * /api/maintenance/records/{id}:
   *   get:
   *     summary: Get a maintenance record by ID
   *     description: Retrieve a single maintenance record
   *     tags: [Maintenance]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: Maintenance record ID
   *     responses:
   *       200:
   *         description: A maintenance record
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 data:
   *                   $ref: '#/components/schemas/MaintenanceRecord'
   *       404:
   *         description: Record not found
   *       500:
   *         description: Server error
   */
  router.get('/records/:id', maintenanceController.getMaintenanceRecordById);

  /**
   * @swagger
   * /api/maintenance/records:
   *   post:
   *     summary: Create a new maintenance record
   *     description: Add a new maintenance record to the system
   *     tags: [Maintenance]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MaintenanceRecord'
   *     responses:
   *       201:
   *         description: Record created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 data:
   *                   $ref: '#/components/schemas/MaintenanceRecord'
   *       400:
   *         description: Invalid input
   *       500:
   *         description: Server error
   */
  router.post('/records', maintenanceController.createMaintenanceRecord);

  /**
   * @swagger
   * /api/maintenance/records/{id}:
   *   put:
   *     summary: Update a maintenance record
   *     description: Update an existing maintenance record
   *     tags: [Maintenance]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: Maintenance record ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MaintenanceRecord'
   *     responses:
   *       200:
   *         description: Record updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 data:
   *                   $ref: '#/components/schemas/MaintenanceRecord'
   *       400:
   *         description: Invalid input
   *       404:
   *         description: Record not found
   *       500:
   *         description: Server error
   */
  router.put('/records/:id', maintenanceController.updateMaintenanceRecord);

  /**
   * @swagger
   * /api/maintenance/records/{id}:
   *   delete:
   *     summary: Delete a maintenance record
   *     description: Remove a maintenance record from the system
   *     tags: [Maintenance]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: Maintenance record ID
   *     responses:
   *       200:
   *         description: Record deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Maintenance record deleted successfully
   *       404:
   *         description: Record not found
   *       500:
   *         description: Server error
   */
  router.delete('/records/:id', maintenanceController.deleteMaintenanceRecord);

  /**
   * @swagger
   * /api/maintenance/vehicles/{vehicleId}/records:
   *   get:
   *     summary: Get maintenance records for a vehicle
   *     description: Retrieve all maintenance records for a specific vehicle
   *     tags: [Maintenance]
   *     parameters:
   *       - in: path
   *         name: vehicleId
   *         schema:
   *           type: string
   *         required: true
   *         description: Vehicle ID
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 100
   *         description: Maximum number of records to return
   *       - in: query
   *         name: skip
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Number of records to skip
   *     responses:
   *       200:
   *         description: A list of maintenance records for the vehicle
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 count:
   *                   type: number
   *                   example: 5
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/MaintenanceRecord'
   *       500:
   *         description: Server error
   */
  router.get('/vehicles/:vehicleId/records', maintenanceController.getVehicleMaintenanceRecords);

  /**
   * @swagger
   * /api/maintenance/stats:
   *   get:
   *     summary: Get maintenance statistics
   *     description: Retrieve statistics about maintenance records
   *     tags: [Maintenance]
   *     responses:
   *       200:
   *         description: Maintenance statistics
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 data:
   *                   type: object
   *                   properties:
   *                     countByType:
   *                       type: object
   *                       example: {"routine": 15, "repair": 7}
   *                     countByStatus:
   *                       type: object
   *                       example: {"completed": 20, "cancelled": 2}
   *                     avgCostByType:
   *                       type: object
   *                       example: {"routine": 120.5, "repair": 350.75}
   *                     monthlyCount:
   *                       type: array
   *                       items:
   *                         type: object
   *                     totalCost:
   *                       type: number
   *                       example: 5420.25
   *       500:
   *         description: Server error
   */
  router.get('/stats', maintenanceController.getMaintenanceStats);

  // Maintenance Schedule Routes

  /**
   * @swagger
   * /api/schedules:
   *   get:
   *     summary: Get all maintenance schedules
   *     description: Retrieve a list of maintenance schedules with optional filtering
   *     tags: [Schedules]
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 100
   *         description: Maximum number of schedules to return
   *       - in: query
   *         name: skip
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Number of schedules to skip
   *       - in: query
   *         name: sort
   *         schema:
   *           type: string
   *           default: scheduledDate
   *         description: Field to sort by
   *       - in: query
   *         name: order
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: asc
   *         description: Sort order
   *       - in: query
   *         name: vehicleId
   *         schema:
   *           type: string
   *         description: Filter by vehicle ID
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *         description: Filter by maintenance type
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *         description: Filter by status
   *       - in: query
   *         name: priority
   *         schema:
   *           type: string
   *         description: Filter by priority
   *     responses:
   *       200:
   *         description: A list of maintenance schedules
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 count:
   *                   type: number
   *                   example: 10
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/MaintenanceSchedule'
   *       500:
   *         description: Server error
   */
  router.get('/schedules', scheduleController.getAllSchedules);

  /**
   * @swagger
   * /api/schedules/upcoming:
   *   get:
   *     summary: Get upcoming maintenance schedules
   *     description: Retrieve maintenance schedules that are coming up
   *     tags: [Schedules]
   *     parameters:
   *       - in: query
   *         name: days
   *         schema:
   *           type: integer
   *           default: 30
   *         description: Number of days to look ahead
   *       - in: query
   *         name: vehicleId
   *         schema:
   *           type: string
   *         description: Filter by vehicle ID
   *       - in: query
   *         name: priority
   *         schema:
   *           type: string
   *         description: Filter by priority
   *     responses:
   *       200:
   *         description: A list of upcoming maintenance schedules
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 count:
   *                   type: number
   *                   example: 5
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/MaintenanceSchedule'
   *       500:
   *         description: Server error
   */
  router.get('/schedules/upcoming', scheduleController.getUpcomingSchedules);

  /**
   * @swagger
   * /api/schedules/overdue:
   *   get:
   *     summary: Get overdue maintenance schedules
   *     description: Retrieve maintenance schedules that are overdue
   *     tags: [Schedules]
   *     parameters:
   *       - in: query
   *         name: vehicleId
   *         schema:
   *           type: string
   *         description: Filter by vehicle ID
   *     responses:
   *       200:
   *         description: A list of overdue maintenance schedules
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 count:
   *                   type: number
   *                   example: 2
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/MaintenanceSchedule'
   *       500:
   *         description: Server error
   */
  router.get('/schedules/overdue', scheduleController.getOverdueSchedules);

  /**
   * @swagger
   * /api/schedules/update-overdue:
   *   post:
   *     summary: Update overdue maintenance schedules
   *     description: Change the status of scheduled maintenance to overdue if the date has passed
   *     tags: [Schedules]
   *     responses:
   *       200:
   *         description: Schedules updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Updated 3 schedules to overdue status
   *       500:
   *         description: Server error
   */
  router.post('/schedules/update-overdue', scheduleController.updateOverdueSchedules);

  /**
   * @swagger
   * /api/schedules/{id}:
   *   get:
   *     summary: Get a maintenance schedule by ID
   *     description: Retrieve a single maintenance schedule
   *     tags: [Schedules]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: Maintenance schedule ID
   *     responses:
   *       200:
   *         description: A maintenance schedule
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 data:
   *                   $ref: '#/components/schemas/MaintenanceSchedule'
   *       404:
   *         description: Schedule not found
   *       500:
   *         description: Server error
   */
  router.get('/schedules/:id', scheduleController.getScheduleById);

  /**
   * @swagger
   * /api/schedules:
   *   post:
   *     summary: Create a new maintenance schedule
   *     description: Add a new maintenance schedule to the system
   *     tags: [Schedules]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MaintenanceSchedule'
   *     responses:
   *       201:
   *         description: Schedule created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 data:
   *                   $ref: '#/components/schemas/MaintenanceSchedule'
   *       400:
   *         description: Invalid input
   *       500:
   *         description: Server error
   */
  router.post('/schedules', scheduleController.createSchedule);

  /**
   * @swagger
   * /api/schedules/{id}:
   *   put:
   *     summary: Update a maintenance schedule
   *     description: Update an existing maintenance schedule
   *     tags: [Schedules]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: Maintenance schedule ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MaintenanceSchedule'
   *     responses:
   *       200:
   *         description: Schedule updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 data:
   *                   $ref: '#/components/schemas/MaintenanceSchedule'
   *       400:
   *         description: Invalid input
   *       404:
   *         description: Schedule not found
   *       500:
   *         description: Server error
   */
  router.put('/schedules/:id', scheduleController.updateSchedule);

  /**
   * @swagger
   * /api/schedules/{id}:
   *   delete:
   *     summary: Delete a maintenance schedule
   *     description: Remove a maintenance schedule from the system
   *     tags: [Schedules]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: Maintenance schedule ID
   *     responses:
   *       200:
   *         description: Schedule deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Maintenance schedule deleted successfully
   *       404:
   *         description: Schedule not found
   *       500:
   *         description: Server error
   */
  router.delete('/schedules/:id', scheduleController.deleteSchedule);

  /**
   * @swagger
   * /api/vehicles/{vehicleId}/schedules:
   *   get:
   *     summary: Get maintenance schedules for a vehicle
   *     description: Retrieve all maintenance schedules for a specific vehicle
   *     tags: [Schedules]
   *     parameters:
   *       - in: path
   *         name: vehicleId
   *         schema:
   *           type: string
   *         required: true
   *         description: Vehicle ID
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *         description: Filter by status
   *     responses:
   *       200:
   *         description: A list of maintenance schedules for the vehicle
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 count:
   *                   type: number
   *                   example: 3
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/MaintenanceSchedule'
   *       500:
   *         description: Server error
   */
  router.get('/vehicles/:vehicleId/schedules', scheduleController.getVehicleSchedules);

  return router;
} 