import express, { Router } from 'express';
import VehicleController from '../controllers/vehicle-controller';
import { Logger } from 'winston';

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Vehicles
 *   description: Vehicle management operations
 * components:
 *   schemas:
 *     Vehicle:
 *       type: object
 *       required:
 *         - model
 *         - type
 *         - status
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated unique identifier
 *         model:
 *           type: string
 *           description: Vehicle model
 *         type:
 *           type: string
 *           description: Type of vehicle (e.g., truck, excavator, loader)
 *           enum: [truck, excavator, loader, bulldozer, crane, other]
 *         status:
 *           type: string
 *           description: Current vehicle status
 *           enum: [active, maintenance, inactive, retired]
 *         registrationDate:
 *           type: string
 *           format: date-time
 *           description: Date vehicle was registered in the system
 *         metadata:
 *           type: object
 *           description: Additional vehicle specifications
 *           properties:
 *             year:
 *               type: number
 *               description: Manufacturing year
 *             manufacturer:
 *               type: string
 *               description: Vehicle manufacturer
 *             fuelType:
 *               type: string
 *               description: Type of fuel used
 *             capacity:
 *               type: number
 *               description: Load capacity or engine size
 *             vin:
 *               type: string
 *               description: Vehicle Identification Number
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when the vehicle was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the vehicle was last updated
 *       example:
 *         model: CAT 336
 *         type: excavator
 *         status: active
 *         registrationDate: 2023-01-15T08:30:00Z
 *         metadata:
 *           year: 2022
 *           manufacturer: Caterpillar
 *           fuelType: diesel
 *           capacity: 36
 *           vin: 4Y1SL65848Z411439
 */

export default function setupVehicleRoutes(logger: Logger): Router {
  const vehicleController = new VehicleController(logger);

  /**
   * @swagger
   * /api:
   *   get:
   *     summary: Get all vehicles
   *     description: Retrieve a list of vehicles with optional filtering
   *     tags: [Vehicles]
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 100
   *         description: Maximum number of vehicles to return
   *       - in: query
   *         name: skip
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Number of vehicles to skip
   *       - in: query
   *         name: sort
   *         schema:
   *           type: string
   *           default: createdAt
   *         description: Field to sort by
   *       - in: query
   *         name: order
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: desc
   *         description: Sort order
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *         description: Filter by vehicle type
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *         description: Filter by vehicle status
   *       - in: query
   *         name: manufacturer
   *         schema:
   *           type: string
   *         description: Filter by manufacturer
   *     responses:
   *       200:
   *         description: A list of vehicles
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
   *                     $ref: '#/components/schemas/Vehicle'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Failed to get vehicles
   */
  router.get('/', vehicleController.getAllVehicles);

  /**
   * @swagger
   * /api/stats:
   *   get:
   *     summary: Get vehicle statistics
   *     description: Retrieve statistics about the vehicle fleet
   *     tags: [Vehicles]
   *     responses:
   *       200:
   *         description: Vehicle statistics
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
   *                       example: {"truck": 5, "excavator": 3}
   *                     countByStatus:
   *                       type: object
   *                       example: {"active": 7, "maintenance": 1}
   *       500:
   *         description: Server error
   */
  router.get('/stats', vehicleController.getVehicleStats);

  /**
   * @swagger
   * /api/{id}:
   *   get:
   *     summary: Get a vehicle by ID
   *     description: Retrieve a single vehicle by its ID
   *     tags: [Vehicles]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: ID of the vehicle to get
   *     responses:
   *       200:
   *         description: A single vehicle
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 data:
   *                   $ref: '#/components/schemas/Vehicle'
   *       404:
   *         description: Vehicle not found
   *       500:
   *         description: Server error
   */
  router.get('/:id', vehicleController.getVehicleById);

  /**
   * @swagger
   * /api/{id}:
   *   put:
   *     summary: Update a vehicle
   *     description: Update vehicle information by ID
   *     tags: [Vehicles]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: ID of the vehicle to update
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Vehicle'
   *     responses:
   *       200:
   *         description: Vehicle updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 data:
   *                   $ref: '#/components/schemas/Vehicle'
   *       400:
   *         description: Invalid input
   *       404:
   *         description: Vehicle not found
   *       500:
   *         description: Server error
   */
  router.put('/:id', vehicleController.updateVehicle);

  /**
   * @swagger
   * /api/{id}:
   *   delete:
   *     summary: Delete a vehicle
   *     description: Remove a vehicle from the system
   *     tags: [Vehicles]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: ID of the vehicle to delete
   *     responses:
   *       200:
   *         description: Vehicle deleted successfully
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
   *                   example: Vehicle deleted successfully
   *       404:
   *         description: Vehicle not found
   *       500:
   *         description: Server error
   */
  router.delete('/:id', vehicleController.deleteVehicle);

  /**
   * @swagger
   * /api/:
   *   post:
   *     summary: Create a new vehicle
   *     description: Add a new vehicle to the fleet
   *     tags: [Vehicles]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Vehicle'
   *     responses:
   *       201:
   *         description: Vehicle created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 data:
   *                   $ref: '#/components/schemas/Vehicle'
   *       400:
   *         description: Invalid input
   *       500:
   *         description: Server error
   */
  router.post('/', vehicleController.createVehicle);

  return router;
}

// If imported directly, create the router with an empty logger
const defaultRouter = setupVehicleRoutes(console as unknown as Logger);
export { defaultRouter }; 