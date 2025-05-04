import { Logger } from 'winston';
import mongoose from 'mongoose';
import PerformanceMetricService from '../../../services/performance-metric-service';
import PerformanceMetric from '../../../models/performance-metric';

// Mock dependencies
jest.mock('../../../models/performance-metric', () => {
  // Save method will be defined dynamically in tests
  const mockSave = jest.fn();
  const mockFind = jest.fn();
  const mockAggregate = jest.fn();
  
  // Create a constructor function that mocks the model
  function MockPerformanceMetric(this: any, data: any) {
    // Store data on the instance
    Object.assign(this, data);
    // Add save method that returns the instance data plus any mock additions
    this.save = mockSave;
    return this;
  }
  
  // Important: Add the save method to the prototype
  MockPerformanceMetric.prototype = { save: mockSave };
  
  const mockModel = {
    find: mockFind,
    aggregate: mockAggregate,
    prototype: { save: mockSave }
  };

  // This is key: assign all properties to the constructor function
  // to make it work like a mongoose model
  Object.assign(MockPerformanceMetric, mockModel);
  
  // Export the constructor as default export - this fixes "is not a constructor" error
  return {
    __esModule: true,
    default: MockPerformanceMetric
  };
});
jest.mock('mongoose');

// Mock mongoose ObjectId
(mongoose.Types as any).ObjectId = function(id?: string) {
  return id || 'mocked-id';
};

describe('PerformanceMetricService', () => {
  // Mock logger
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  } as unknown as Logger;

  let performanceMetricService: PerformanceMetricService;

  beforeEach(() => {
    jest.clearAllMocks();
    performanceMetricService = new PerformanceMetricService(mockLogger);
  });

  describe('recordMetric', () => {
    it('should save a new metric', async () => {
      // Mock data
      const metricData = {
        vehicleId: new mongoose.Types.ObjectId('60d21b4667d0d8992e610c85'),
        metricType: 'engineEfficiency',
        value: 0.85,
        timestamp: new Date()
      };
      
      const savedMetric = { ...metricData, _id: '123' };
      
      // Mock implementations - this will be called by the service
      // Make it return the expected saved object
      (PerformanceMetric.prototype.save as jest.Mock).mockImplementation(function(this: any) {
        return Promise.resolve(savedMetric);
      });
      
      // Execute
      const result = await performanceMetricService.recordMetric(metricData);
      
      // Assert
      expect(result).toEqual(savedMetric);
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      // Mock implementation
      const validationError = new mongoose.Error.ValidationError();
      (PerformanceMetric.prototype.save as jest.Mock).mockImplementation(() => {
        return Promise.reject(validationError);
      });
      
      // Execute and assert
      await expect(performanceMetricService.recordMetric({} as any)).rejects.toBeInstanceOf(mongoose.Error.ValidationError);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getVehicleMetrics', () => {
    it('should get metrics by vehicle ID and metric type', async () => {
      // Mock data
      const vehicleId = '60d21b4667d0d8992e610c85';
      const metricType = 'fuelEfficiency';
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      const mockMetrics = [
        { vehicleId, metricType, value: 6.8, timestamp: new Date() },
        { vehicleId, metricType, value: 7.2, timestamp: new Date() }
      ];
      
      // Mock implementations
      const mockSortFn = jest.fn().mockReturnThis();
      const mockLimitFn = jest.fn().mockResolvedValue(mockMetrics);
      (PerformanceMetric.find as jest.Mock).mockReturnValue({
        sort: mockSortFn,
        limit: mockLimitFn
      });
      
      // Execute
      const result = await performanceMetricService.getVehicleMetrics(vehicleId, metricType, startDate, endDate);
      
      // Assert
      expect(result).toEqual(mockMetrics);
    });

    it('should handle errors', async () => {
      // Mock implementation
      const mockError = new Error('Database error');
      (PerformanceMetric.find as jest.Mock).mockImplementation(() => {
        throw mockError;
      });
      
      // Execute and assert
      await expect(performanceMetricService.getVehicleMetrics('123', 'fuelEfficiency')).rejects.toThrow('Database error');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getFleetMetricAverages', () => {
    it('should return aggregated metrics for a vehicle', async () => {
      // Mock data
      const metricType = 'fuelEfficiency';
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      const mockAggregation = [{
        _id: null,
        avgValue: 6.8,
        minValue: 5.5,
        maxValue: 8.2,
        stdDev: 0.7,
        count: 42
      }];
      
      // Mock implementations
      (PerformanceMetric.aggregate as jest.Mock).mockResolvedValue(mockAggregation);
      
      // Execute
      const result = await performanceMetricService.getFleetMetricAverages(metricType, startDate, endDate);
      
      // Assert
      expect(result).toEqual(mockAggregation[0]);
    });

    it('should handle empty results', async () => {
      // Mock implementation
      (PerformanceMetric.aggregate as jest.Mock).mockResolvedValue([]);
      
      // Execute
      const result = await performanceMetricService.getFleetMetricAverages('fuelEfficiency', new Date(), new Date());
      
      // Assert
      expect(result).toEqual({
        avgValue: 0,
        minValue: 0,
        maxValue: 0,
        stdDev: 0,
        count: 0
      });
    });

    it('should handle errors in aggregation', async () => {
      // Mock implementation
      const mockError = new Error('Aggregation error');
      (PerformanceMetric.aggregate as jest.Mock).mockRejectedValue(mockError);
      
      // Execute and assert
      await expect(performanceMetricService.getFleetMetricAverages('fuelEfficiency', new Date(), new Date())).rejects.toThrow('Aggregation error');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
}); 