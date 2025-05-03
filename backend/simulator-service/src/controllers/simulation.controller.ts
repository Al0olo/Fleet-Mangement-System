import { Request, Response } from 'express';
import { HttpError } from '../middleware/error.middleware';
import { 
  createSimulationConfig, 
  getAllSimulationConfigs, 
  getSimulationConfigById, 
  updateSimulationConfig, 
  deleteSimulationConfig,
  startSimulation,
  stopSimulation,
  pauseSimulation,
  initializeDefaultSimulation
} from '../services/simulation.service';
import { initializeSimulation } from '../services/simulation.service';
import { logger } from '../util/logger';

/**
 * Get all simulation configurations
 */
export const getAllSimulationsController = async (_req: Request, res: Response): Promise<void> => {
  try {
    const simulations = await getAllSimulationConfigs();
    res.status(200).json({
      success: true,
      data: simulations
    });
  } catch (error) {
    logger.error('Error getting all simulations', error);
    throw new HttpError('Failed to get simulations', 500);
  }
};

/**
 * Get a simulation configuration by ID
 */
export const getSimulationByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const simulation = await getSimulationConfigById(id);
    
    if (!simulation) {
      throw new HttpError('Simulation not found', 404);
    }
    
    res.status(200).json({
      success: true,
      data: simulation
    });
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    logger.error(`Error getting simulation by ID: ${req.params.id}`, error);
    throw new HttpError('Failed to get simulation', 500);
  }
};

/**
 * Create a new simulation configuration
 */
export const createSimulationController = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      vehicleCount,
      region,
      updateFrequencyMs,
      isDefault,
      probabilities
    } = req.body;
    
    if (!name || !vehicleCount || !region) {
      throw new HttpError('Missing required fields', 400);
    }
    
    const simulation = await createSimulationConfig(
      name,
      vehicleCount,
      region,
      updateFrequencyMs,
      isDefault,
      probabilities
    );
    
    res.status(201).json({
      success: true,
      data: simulation
    });
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    logger.error('Error creating simulation', error);
    throw new HttpError('Failed to create simulation', 500);
  }
};

/**
 * Update a simulation configuration
 */
export const updateSimulationController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const simulation = await updateSimulationConfig(id, updates);
    
    if (!simulation) {
      throw new HttpError('Simulation not found', 404);
    }
    
    res.status(200).json({
      success: true,
      data: simulation
    });
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    logger.error(`Error updating simulation: ${req.params.id}`, error);
    throw new HttpError('Failed to update simulation', 500);
  }
};

/**
 * Delete a simulation configuration
 */
export const deleteSimulationController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await deleteSimulationConfig(id);
    
    if (!result) {
      throw new HttpError('Simulation not found', 404);
    }
    
    res.status(200).json({
      success: true,
      message: 'Simulation deleted successfully'
    });
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    logger.error(`Error deleting simulation: ${req.params.id}`, error);
    throw new HttpError('Failed to delete simulation', 500);
  }
};

/**
 * Start a simulation
 */
export const startSimulationController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const simulation = await startSimulation(id);
    
    if (!simulation) {
      throw new HttpError('Simulation not found', 404);
    }
    
    res.status(200).json({
      success: true,
      data: simulation,
      message: 'Simulation started successfully'
    });
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    logger.error(`Error starting simulation: ${req.params.id}`, error);
    throw new HttpError('Failed to start simulation', 500);
  }
};

/**
 * Stop a simulation
 */
export const stopSimulationController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const simulation = await stopSimulation(id);
    
    if (!simulation) {
      throw new HttpError('Simulation not found', 404);
    }
    
    res.status(200).json({
      success: true,
      data: simulation,
      message: 'Simulation stopped successfully'
    });
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    logger.error(`Error stopping simulation: ${req.params.id}`, error);
    throw new HttpError('Failed to stop simulation', 500);
  }
};

/**
 * Pause a simulation
 */
export const pauseSimulationController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const simulation = await pauseSimulation(id);
    
    if (!simulation) {
      throw new HttpError('Simulation not found', 404);
    }
    
    res.status(200).json({
      success: true,
      data: simulation,
      message: 'Simulation paused successfully'
    });
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    logger.error(`Error pausing simulation: ${req.params.id}`, error);
    throw new HttpError('Failed to pause simulation', 500);
  }
};

/**
 * Initialize a simulation
 */
export const initializeSimulationController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const simulation = await initializeSimulation(id);
    
    if (!simulation) {
      throw new HttpError('Simulation not found', 404);
    }
    
    res.status(200).json({
      success: true,
      data: simulation,
      message: 'Simulation initialized successfully'
    });
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    logger.error(`Error initializing simulation: ${req.params.id}`, error);
    throw new HttpError('Failed to initialize simulation', 500);
  }
};

/**
 * Initialize default simulation
 */
export const initializeDefaultSimulationController = async (_req: Request, res: Response): Promise<void> => {
  try {
    const simulation = await initializeDefaultSimulation();
    
    res.status(200).json({
      success: true,
      data: simulation,
      message: 'Default simulation initialized successfully'
    });
  } catch (error) {
    logger.error('Error initializing default simulation', error);
    throw new HttpError('Failed to initialize default simulation', 500);
  }
}; 