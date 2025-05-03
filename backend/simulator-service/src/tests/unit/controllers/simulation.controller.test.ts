import { jest } from '@jest/globals';
import { 
  getAllSimulationsController,
  getSimulationByIdController,
  createSimulationController,
  updateSimulationController,
  startSimulationController
} from '../../../controllers/simulation.controller';
import * as simulationService from '../../../services/simulation.service';
import { SimulationStatus } from '../../../models/simulation.model';
import { HttpError } from '../../../middleware/error.middleware';

// Mock the simulation service
jest.mock('../../../services/simulation.service', () => ({
  getAllSimulationConfigs: jest.fn(),
  getSimulationConfigById: jest.fn(),
  createSimulationConfig: jest.fn(),
  updateSimulationConfig: jest.fn(),
  startSimulation: jest.fn()
}));

describe('Simulation Controller', () => {
  // Mock request and response
  let mockRequest;
  let mockResponse;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      params: {},
      body: {}
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });
  
  describe('getAllSimulationsController', () => {
    it('should return all simulations', async () => {
      // Arrange
      const mockSimulations = [
        { _id: 'sim1', name: 'Simulation 1' },
        { _id: 'sim2', name: 'Simulation 2' }
      ];
      
      simulationService.getAllSimulationConfigs.mockResolvedValue(mockSimulations);
      
      // Act
      await getAllSimulationsController(mockRequest, mockResponse);
      
      // Assert
      expect(simulationService.getAllSimulationConfigs).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockSimulations
      });
    });
    
    it('should handle errors', async () => {
      // Arrange
      simulationService.getAllSimulationConfigs.mockRejectedValue(new Error('Database error'));
      
      // Act & Assert
      await expect(getAllSimulationsController(mockRequest, mockResponse))
        .rejects
        .toThrow(HttpError);
    });
  });
  
  describe('getSimulationByIdController', () => {
    it('should return a simulation by ID', async () => {
      // Arrange
      const simulationId = 'sim123';
      const mockSimulation = { _id: simulationId, name: 'Test Simulation' };
      
      mockRequest.params.id = simulationId;
      simulationService.getSimulationConfigById.mockResolvedValue(mockSimulation);
      
      // Act
      await getSimulationByIdController(mockRequest, mockResponse);
      
      // Assert
      expect(simulationService.getSimulationConfigById).toHaveBeenCalledWith(simulationId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockSimulation
      });
    });
    
    it('should return 404 if simulation is not found', async () => {
      // Arrange
      mockRequest.params.id = 'nonexistent';
      simulationService.getSimulationConfigById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(getSimulationByIdController(mockRequest, mockResponse))
        .rejects
        .toThrow(new HttpError('Simulation not found', 404));
    });
  });
  
  describe('createSimulationController', () => {
    it('should create a new simulation configuration', async () => {
      // Arrange
      const simulationData = {
        name: 'New Simulation',
        vehicleCount: 10,
        region: {
          centerLat: 40.7128,
          centerLng: -74.0060,
          radiusKm: 5
        },
        updateFrequencyMs: 5000,
        isDefault: false
      };
      
      mockRequest.body = simulationData;
      
      const mockCreatedSimulation = {
        _id: 'sim123',
        ...simulationData,
        status: SimulationStatus.STOPPED
      };
      
      simulationService.createSimulationConfig.mockResolvedValue(mockCreatedSimulation);
      
      // Act
      await createSimulationController(mockRequest, mockResponse);
      
      // Assert
      expect(simulationService.createSimulationConfig).toHaveBeenCalledWith(
        simulationData.name,
        simulationData.vehicleCount,
        simulationData.region,
        simulationData.updateFrequencyMs,
        simulationData.isDefault,
        simulationData.probabilities
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedSimulation
      });
    });
    
    it('should return 400 if required fields are missing', async () => {
      // Arrange
      mockRequest.body = { name: 'Incomplete Simulation' };
      
      // Act & Assert
      await expect(createSimulationController(mockRequest, mockResponse))
        .rejects
        .toThrow(new HttpError('Missing required fields', 400));
    });
  });
  
  describe('updateSimulationController', () => {
    it('should update a simulation configuration', async () => {
      // Arrange
      const simulationId = 'sim123';
      const updates = {
        name: 'Updated Simulation',
        vehicleCount: 20
      };
      
      mockRequest.params.id = simulationId;
      mockRequest.body = updates;
      
      const mockUpdatedSimulation = {
        _id: simulationId,
        name: updates.name,
        vehicleCount: updates.vehicleCount,
        status: SimulationStatus.STOPPED
      };
      
      simulationService.updateSimulationConfig.mockResolvedValue(mockUpdatedSimulation);
      
      // Act
      await updateSimulationController(mockRequest, mockResponse);
      
      // Assert
      expect(simulationService.updateSimulationConfig).toHaveBeenCalledWith(simulationId, updates);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedSimulation
      });
    });
    
    it('should return 404 if simulation is not found', async () => {
      // Arrange
      mockRequest.params.id = 'nonexistent';
      mockRequest.body = { name: 'Updated Simulation' };
      
      simulationService.updateSimulationConfig.mockResolvedValue(null);
      
      // Act & Assert
      await expect(updateSimulationController(mockRequest, mockResponse))
        .rejects
        .toThrow(new HttpError('Simulation not found', 404));
    });
  });
  
  describe('startSimulationController', () => {
    it('should start a simulation', async () => {
      // Arrange
      const simulationId = 'sim123';
      
      mockRequest.params.id = simulationId;
      
      const mockStartedSimulation = {
        _id: simulationId,
        name: 'Test Simulation',
        status: SimulationStatus.RUNNING,
        startedAt: new Date()
      };
      
      simulationService.startSimulation.mockResolvedValue(mockStartedSimulation);
      
      // Act
      await startSimulationController(mockRequest, mockResponse);
      
      // Assert
      expect(simulationService.startSimulation).toHaveBeenCalledWith(simulationId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStartedSimulation,
        message: 'Simulation started successfully'
      });
    });
    
    it('should return 404 if simulation is not found', async () => {
      // Arrange
      mockRequest.params.id = 'nonexistent';
      
      simulationService.startSimulation.mockResolvedValue(null);
      
      // Act & Assert
      await expect(startSimulationController(mockRequest, mockResponse))
        .rejects
        .toThrow(new HttpError('Simulation not found', 404));
    });
  });
}); 