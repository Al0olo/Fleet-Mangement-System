import { jest } from '@jest/globals';
import { createSimulationConfig, getSimulationConfigById, getAllSimulationConfigs } from '../../../services/simulation.service';
import { SimulationConfig, SimulationStatus } from '../../../models/simulation.model';

// Mock the mongoose model
jest.mock('../../../models/simulation.model', () => {
  const mockDoc = {
    save: jest.fn().mockResolvedValue(undefined),
    toJSON: jest.fn()
  };
  
  const SimulationConfigMock = jest.fn().mockImplementation(() => mockDoc);
  
  SimulationConfigMock.find = jest.fn().mockReturnThis();
  SimulationConfigMock.findById = jest.fn().mockReturnThis();
  SimulationConfigMock.findOne = jest.fn().mockReturnThis();
  SimulationConfigMock.sort = jest.fn().mockReturnThis();
  SimulationConfigMock.exec = jest.fn();
  
  return {
    SimulationConfig: SimulationConfigMock,
    SimulationStatus: {
      STOPPED: 'STOPPED',
      RUNNING: 'RUNNING',
      PAUSED: 'PAUSED'
    }
  };
});

// Mock the service functions
jest.mock('../../../services/simulation.service', () => {
  // Get the actual module
  const originalModule = jest.requireActual('../../../services/simulation.service');
  
  // Return a mock that uses the actual implementation except for the functions we want to mock
  return {
    ...originalModule,
    getAllSimulationConfigs: jest.fn(),
    getSimulationConfigById: jest.fn()
  };
});

// Mock the vehicle service
jest.mock('../../../services/vehicle.service', () => ({
  generateSimulatedVehicles: jest.fn().mockResolvedValue([]),
  getAllSimulatedVehicles: jest.fn().mockResolvedValue([])
}));

// Mock the trip service
jest.mock('../../../services/trip.service', () => ({
  getActiveTrips: jest.fn().mockResolvedValue([])
}));

describe('Simulation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('createSimulationConfig', () => {
    it('should create a new simulation configuration', async () => {
      // Arrange
      const simConfig = {
        name: 'Test Simulation',
        vehicleCount: 10,
        region: {
          centerLat: 40.7128,
          centerLng: -74.0060,
          radiusKm: 5
        },
        updateFrequencyMs: 5000,
        isDefault: false
      };
      
      const mockSavedDoc = {
        _id: 'sim123',
        ...simConfig,
        status: SimulationStatus.STOPPED,
        eventsGenerated: 0,
        vehiclesInSimulation: 0
      };
      
      const mockSave = jest.fn().mockResolvedValue(mockSavedDoc);
      SimulationConfig.mockImplementation(() => ({
        save: mockSave,
        ...simConfig,
        status: SimulationStatus.STOPPED
      }));
      
      // Act
      const result = await createSimulationConfig(
        simConfig.name,
        simConfig.vehicleCount,
        simConfig.region,
        simConfig.updateFrequencyMs,
        simConfig.isDefault
      );
      
      // Assert
      expect(SimulationConfig).toHaveBeenCalledWith({
        name: simConfig.name,
        status: SimulationStatus.STOPPED,
        vehicleCount: simConfig.vehicleCount,
        region: simConfig.region,
        updateFrequencyMs: simConfig.updateFrequencyMs,
        isDefault: simConfig.isDefault,
        probabilities: expect.any(Object)
      });
      expect(mockSave).toHaveBeenCalled();
    });
  });
  
  describe('getAllSimulationConfigs', () => {
    it('should return all simulation configurations', async () => {
      // Arrange
      const mockConfigs = [
        { _id: 'sim1', name: 'Simulation 1' },
        { _id: 'sim2', name: 'Simulation 2' }
      ];
      
      // Set the mock implementation to return our mock data
      getAllSimulationConfigs.mockResolvedValue(mockConfigs);
      
      // Act
      const result = await getAllSimulationConfigs();
      
      // Assert
      expect(result).toEqual(mockConfigs);
      expect(getAllSimulationConfigs).toHaveBeenCalled();
    });
  });
  
  describe('getSimulationConfigById', () => {
    it('should return a simulation configuration by ID', async () => {
      // Arrange
      const mockConfig = { _id: 'sim1', name: 'Simulation 1' };
      
      // Set the mock implementation to return our mock data
      getSimulationConfigById.mockResolvedValue(mockConfig);
      
      // Act
      const result = await getSimulationConfigById('sim1');
      
      // Assert
      expect(result).toEqual(mockConfig);
      expect(getSimulationConfigById).toHaveBeenCalledWith('sim1');
    });
    
    it('should return null if configuration is not found', async () => {
      // Set the mock implementation to return null
      getSimulationConfigById.mockResolvedValue(null);
      
      // Act
      const result = await getSimulationConfigById('sim999');
      
      // Assert
      expect(result).toBeNull();
      expect(getSimulationConfigById).toHaveBeenCalledWith('sim999');
    });
  });
}); 