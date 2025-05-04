import { Logger } from 'winston';
import mongoose from 'mongoose';
import UsageStatsService from '../../../services/usage-stats-service';
import UsageStats from '../../../models/usage-stats';

// Mock dependencies
jest.mock('../../../models/usage-stats', () => {
  // Save method will be defined dynamically in tests
  const mockSave = jest.fn();
  const mockFind = jest.fn();
  const mockAggregate = jest.fn();
  
  // Create a constructor function that mocks the model
  function MockUsageStats(this: any, data: any) {
    // Store data on the instance
    Object.assign(this, data);
    // Add save method that returns the instance data plus any mock additions
    this.save = mockSave;
    return this;
  }
  
  // Important: Add the save method to the prototype
  MockUsageStats.prototype = { save: mockSave };
  
  const mockModel = {
    find: mockFind,
    aggregate: mockAggregate,
    prototype: { save: mockSave }
  };

  // This is key: assign all properties to the constructor function
  // to make it work like a mongoose model
  Object.assign(MockUsageStats, mockModel);
  
  // Export the constructor as default export - this fixes "is not a constructor" error
  return {
    __esModule: true,
    default: MockUsageStats
  };
});
jest.mock('mongoose');

// Mock mongoose ObjectId
(mongoose.Types as any).ObjectId = function(id?: string) {
  return id || 'mocked-id';
};

describe('UsageStatsService', () => {
  // Mock logger
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  } as unknown as Logger;

  let usageStatsService: UsageStatsService;

  beforeEach(() => {
    jest.clearAllMocks();
    usageStatsService = new UsageStatsService(mockLogger);
  });

  describe('getVehicleUsageStats', () => {
    it('should get usage stats for a vehicle', async () => {
      // Mock data
      const vehicleId = '60d21b4667d0d8992e610c85';
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      const mockStats = [
        { 
          vehicleId, 
          hoursOperated: 150,
          distanceTraveled: 1200,
          fuelConsumed: 450,
          date: new Date('2023-01-15')
        }
      ];
      
      // Mock implementations
      const mockSortFn = jest.fn().mockReturnThis();
      const mockLimitFn = jest.fn().mockResolvedValue(mockStats);
      (UsageStats.find as jest.Mock).mockReturnValue({
        sort: mockSortFn,
        limit: mockLimitFn
      });
      
      // Execute
      const result = await usageStatsService.getVehicleUsageStats(vehicleId, startDate, endDate);
      
      // Assert
      expect(result).toEqual(mockStats);
    });

    it('should handle errors', async () => {
      // Mock implementation
      const mockError = new Error('Database error');
      (UsageStats.find as jest.Mock).mockImplementation(() => {
        throw mockError;
      });
      
      // Execute and assert
      await expect(usageStatsService.getVehicleUsageStats('123')).rejects.toThrow('Database error');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('createUsageStats', () => {
    it('should save new usage stats', async () => {
      // Mock data
      const statsData = {
        vehicleId: new mongoose.Types.ObjectId('60d21b4667d0d8992e610c85'),
        hoursOperated: 8,
        distanceTraveled: 120,
        fuelConsumed: 45,
        date: new Date()
      };
      
      const savedStats = { ...statsData, _id: '123' };
      
      // Mock implementations - this will be called by the service
      (UsageStats.prototype.save as jest.Mock).mockImplementation(function(this: any) {
        return Promise.resolve(savedStats);
      });
      
      // Execute
      const result = await usageStatsService.createUsageStats(statsData);
      
      // Assert
      expect(result).toEqual(savedStats);
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('getFleetUsageStats', () => {
    it('should return aggregated fleet stats', async () => {
      // Mock data
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      const mockAggregation = [{
        totalHours: 1500,
        totalDistance: 12000,
        totalFuel: 3600,
        avgEfficiency: 0.75
      }];
      
      const uniqueVehicles = [{ count: 35 }];
      
      // Mock implementations
      (UsageStats.aggregate as jest.Mock)
        .mockResolvedValueOnce(mockAggregation)
        .mockResolvedValueOnce(uniqueVehicles);
      
      // Execute
      const result = await usageStatsService.getFleetUsageStats(startDate, endDate);
      
      // Assert
      expect(result).toEqual({
        ...mockAggregation[0],
        uniqueVehicles: 35
      });
    });

    it('should return empty object if no data found', async () => {
      // Mock implementation
      (UsageStats.aggregate as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      
      // Execute
      const result = await usageStatsService.getFleetUsageStats(new Date(), new Date());
      
      // Assert
      expect(result).toEqual({
        totalHours: 0,
        totalDistance: 0,
        totalFuel: 0,
        totalIdle: 0,
        avgEfficiency: 0,
        uniqueVehicles: 0
      });
    });
  });

  describe('getAggregateVehicleStats', () => {
    it('should return vehicle utilization metrics', async () => {
      // Mock data
      const vehicleId = '60d21b4667d0d8992e610c85';
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      const mockAggregation = [{
        totalHours: 180,
        totalDistance: 1500,
        totalFuel: 350,
        totalIdle: 25,
        recordCount: 12,
        avgEfficiency: 0.82
      }];
      
      // Mock implementations
      (UsageStats.aggregate as jest.Mock).mockResolvedValue(mockAggregation);
      
      // Execute
      const result = await usageStatsService.getAggregateVehicleStats(vehicleId, startDate, endDate);
      
      // Assert
      expect(result).toEqual(mockAggregation[0]);
    });

    it('should handle empty result set', async () => {
      // Mock implementation
      (UsageStats.aggregate as jest.Mock).mockResolvedValue([]);
      
      // Execute
      const result = await usageStatsService.getAggregateVehicleStats('123', new Date(), new Date());
      
      // Assert
      expect(result).toEqual({
        totalHours: 0,
        totalDistance: 0,
        totalFuel: 0,
        totalIdle: 0,
        recordCount: 0,
        avgEfficiency: 0
      });
    });
  });
}); 