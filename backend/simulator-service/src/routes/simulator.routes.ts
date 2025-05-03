import { Router, Request, Response } from 'express';
import {
  getAllSimulationsController,
  getSimulationByIdController,
  createSimulationController,
  updateSimulationController,
  deleteSimulationController,
  startSimulationController,
  stopSimulationController,
  pauseSimulationController,
  initializeSimulationController,
  initializeDefaultSimulationController
} from '../controllers/simulation.controller';

import {
  getAllVehiclesController,
  getVehicleByIdController,
  createVehicleController,
  updateVehicleStatusController,
  updateVehicleLocationController,
  resetVehiclesController,
  removeAllVehiclesController
} from '../controllers/vehicle.controller';

import {
  getAllTripsController,
  getActiveTripsController,
  getTripByIdController,
  getTripsForVehicleController,
  createTripController,
  startTripController,
  completeTripController
} from '../controllers/trip.controller';

const router = Router();

// Helper function to handle undefined controller functions during tests
type ControllerFunction = (req: Request, res: Response) => void | Promise<void>;

const ensureController = (controller: ControllerFunction | undefined): ControllerFunction => {
  if (!controller) {
    return (_req: Request, res: Response) => {
      res.status(501).json({
        success: false,
        message: 'Controller not implemented'
      });
    };
  }
  return controller;
};

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    service: 'simulator-service',
    timestamp: new Date().toISOString()
  });
});

// Simulation routes
router.get('/simulations', getAllSimulationsController);
router.get('/simulations/:id', getSimulationByIdController);
router.post('/simulations', createSimulationController);
router.put('/simulations/:id', ensureController(updateSimulationController));
router.delete('/simulations/:id', ensureController(deleteSimulationController));
router.post('/simulations/:id/start', ensureController(startSimulationController));
router.post('/simulations/:id/stop', ensureController(stopSimulationController));
router.post('/simulations/:id/pause', ensureController(pauseSimulationController));
router.post('/simulations/:id/initialize', ensureController(initializeSimulationController));
router.post('/simulations/initialize-default', ensureController(initializeDefaultSimulationController));

// Vehicle routes
router.get('/vehicles', ensureController(getAllVehiclesController));
router.get('/vehicles/:id', ensureController(getVehicleByIdController));
router.post('/vehicles', ensureController(createVehicleController));
router.put('/vehicles/:id/status', ensureController(updateVehicleStatusController));
router.put('/vehicles/:id/location', ensureController(updateVehicleLocationController));
router.post('/vehicles/reset', ensureController(resetVehiclesController));
router.delete('/vehicles', ensureController(removeAllVehiclesController));

// Trip routes
router.get('/trips', ensureController(getAllTripsController));
router.get('/trips/active', ensureController(getActiveTripsController));
router.get('/trips/:id', ensureController(getTripByIdController));
router.get('/vehicles/:vehicleId/trips', ensureController(getTripsForVehicleController));
router.post('/vehicles/:vehicleId/trips', ensureController(createTripController));
router.post('/trips/:id/start', ensureController(startTripController));
router.post('/trips/:id/complete', ensureController(completeTripController));

export { router as simulatorRoutes }; 