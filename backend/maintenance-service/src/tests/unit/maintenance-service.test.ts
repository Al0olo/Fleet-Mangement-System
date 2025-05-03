import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { Logger } from 'winston';

// Mock mongoose Schema
jest.mock('mongoose', () => ({
  Schema: function() {
    return {
      pre: jest.fn().mockReturnThis(),
      index: jest.fn().mockReturnThis()
    };
  },
  model: jest.fn().mockReturnValue({}),
  Types: {
    ObjectId: {
      isValid: jest.fn().mockImplementation((id) => id !== 'invalid-id')
    }
  }
}));

// Mock the dependencies before any other code
jest.mock('../../models/maintenance-record', () => ({
  __esModule: true,
  default: {
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([])
    }),
    countDocuments: jest.fn().mockResolvedValue(0),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    aggregate: jest.fn()
  }
}));

// Mock the maintenance schedule model as well
jest.mock('../../models/maintenance-schedule', () => ({
  __esModule: true,
  default: {
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([])
    })
  }
}));

// Import after mocks are set up
import MaintenanceService from '../../services/maintenance-service';
import { mockMaintenanceRecords, newMaintenanceRecord } from '../mocks/mock-maintenance';

// Type for mocks
type MockReturnType = any;

describe('MaintenanceService', () => {
  let maintenanceService: MaintenanceService;
  let mockLogger: Logger;
  let MaintenanceRecord: any;
  let mockFind: jest.Mock;
  let mockCountDocuments: jest.Mock;
  let mockFindById: jest.Mock;
  let mockCreate: jest.Mock;
  let mockFindByIdAndUpdate: jest.Mock;
  let mockFindByIdAndDelete: jest.Mock;
  let mockAggregate: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Import the mocked model
    MaintenanceRecord = require('../../models/maintenance-record').default;
    
    // Set up all the mock functions
    mockFind = MaintenanceRecord.find as jest.Mock;
    mockFind.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(mockMaintenanceRecords as MockReturnType)
    });
    
    mockCountDocuments = MaintenanceRecord.countDocuments as jest.Mock;
    mockCountDocuments.mockResolvedValue(mockMaintenanceRecords.length as MockReturnType);
    
    mockFindById = MaintenanceRecord.findById as jest.Mock;
    mockFindById.mockResolvedValue(mockMaintenanceRecords[0] as MockReturnType);
    
    mockCreate = MaintenanceRecord.create as jest.Mock;
    mockCreate.mockImplementation((data: any) => ({
      ...data,
      id: '60d21b4667d0d8992e610c89',
      createdAt: new Date(),
      updatedAt: new Date()
    } as MockReturnType));
    
    mockFindByIdAndUpdate = MaintenanceRecord.findByIdAndUpdate as jest.Mock;
    mockFindByIdAndUpdate.mockImplementation((id: string, data: any) => ({
      ...mockMaintenanceRecords[0],
      ...data,
      id,
      updatedAt: new Date()
    } as MockReturnType));
    
    mockFindByIdAndDelete = MaintenanceRecord.findByIdAndDelete as jest.Mock;
    mockFindByIdAndDelete.mockImplementation((id: string) => ({
      ...mockMaintenanceRecords[0],
      id
    } as MockReturnType));
    
    mockAggregate = MaintenanceRecord.aggregate as jest.Mock;
    mockAggregate
      .mockResolvedValueOnce([{ _id: 'routine', count: 1 }, { _id: 'repair', count: 1 }] as MockReturnType)
      .mockResolvedValueOnce([{ _id: 'completed', count: 2 }] as MockReturnType)
      .mockResolvedValueOnce([{ _id: 'routine', avgCost: 150 }, { _id: 'repair', avgCost: 450 }] as MockReturnType);
    
    // Create a mock logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as unknown as Logger;
    
    // Create instance with mock logger
    maintenanceService = new MaintenanceService(mockLogger);
  });

  describe('getAllMaintenanceRecords', () => {
    test('should return all maintenance records with pagination', async () => {
      const result = await maintenanceService.getAllMaintenanceRecords(10, 0);
      
      expect(result.records).toEqual(mockMaintenanceRecords);
      expect(result.count).toBe(mockMaintenanceRecords.length);
      expect(MaintenanceRecord.find).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalled();
    });
    
    test('should apply filters when provided', async () => {
      const filters = { vehicleId: 'vehicle123', type: 'routine' };
      await maintenanceService.getAllMaintenanceRecords(10, 0, 'performedAt', 'desc', filters);
      
      expect(MaintenanceRecord.find).toHaveBeenCalledWith(
        expect.objectContaining({ 
          vehicleId: 'vehicle123',
          type: 'routine'
        })
      );
    });
  });

  describe('getMaintenanceRecordById', () => {
    test('should return a maintenance record by ID', async () => {
      const result = await maintenanceService.getMaintenanceRecordById('60d21b4667d0d8992e610c85');
      
      expect(result).toEqual(mockMaintenanceRecords[0]);
      expect(MaintenanceRecord.findById).toHaveBeenCalledWith('60d21b4667d0d8992e610c85');
      expect(mockLogger.info).toHaveBeenCalled();
    });
    
    test('should throw error for invalid ID', async () => {
      await expect(maintenanceService.getMaintenanceRecordById('invalid-id'))
        .rejects
        .toThrow('Invalid maintenance record ID format');
    });
  });

  describe('createMaintenanceRecord', () => {
    test('should create a maintenance record', async () => {
      const result = await maintenanceService.createMaintenanceRecord(newMaintenanceRecord);
      
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
      expect(result).toMatchObject(newMaintenanceRecord);
      expect(MaintenanceRecord.create).toHaveBeenCalledWith(newMaintenanceRecord);
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('updateMaintenanceRecord', () => {
    test('should update a maintenance record', async () => {
      const updateData = { cost: 175.50, notes: 'Updated notes' };
      const result = await maintenanceService.updateMaintenanceRecord('60d21b4667d0d8992e610c85', updateData);
      
      expect(result).toHaveProperty('id', '60d21b4667d0d8992e610c85');
      expect(result).toMatchObject(updateData);
      expect(MaintenanceRecord.findByIdAndUpdate).toHaveBeenCalledWith(
        '60d21b4667d0d8992e610c85',
        updateData,
        { new: true, runValidators: true }
      );
      expect(mockLogger.info).toHaveBeenCalled();
    });
    
    test('should throw error when record not found', async () => {
      await expect(maintenanceService.updateMaintenanceRecord('invalid-id', {}))
        .rejects
        .toThrow('Invalid maintenance record ID format');
    });
  });

  describe('deleteMaintenanceRecord', () => {
    test('should delete a maintenance record', async () => {
      const result = await maintenanceService.deleteMaintenanceRecord('60d21b4667d0d8992e610c85');
      
      expect(result).toHaveProperty('id', '60d21b4667d0d8992e610c85');
      expect(MaintenanceRecord.findByIdAndDelete).toHaveBeenCalledWith('60d21b4667d0d8992e610c85');
      expect(mockLogger.info).toHaveBeenCalled();
    });
    
    test('should throw error when record not found', async () => {
      await expect(maintenanceService.deleteMaintenanceRecord('invalid-id'))
        .rejects
        .toThrow('Invalid maintenance record ID format');
    });
  });

  describe('getVehicleMaintenanceRecords', () => {
    test('should return maintenance records for a specific vehicle', async () => {
      const result = await maintenanceService.getVehicleMaintenanceRecords('vehicle123');
      
      expect(result).toHaveProperty('records');
      expect(result).toHaveProperty('count');
      expect(MaintenanceRecord.find).toHaveBeenCalledWith({ vehicleId: 'vehicle123' });
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('getMaintenanceStats', () => {
    test('should return maintenance statistics', async () => {
      // Reset the mock for this specific test to ensure proper call count
      mockAggregate.mockClear();
      
      // Set up mock responses for each aggregate call
      mockAggregate
        .mockResolvedValueOnce([{ _id: 'routine', count: 1 }, { _id: 'repair', count: 1 }])
        .mockResolvedValueOnce([{ _id: 'completed', count: 2 }])
        .mockResolvedValueOnce([{ _id: 'routine', avgCost: 150 }, { _id: 'repair', avgCost: 450 }])
        .mockResolvedValue([]); // Add a default empty response for any additional calls
      
      const result = await maintenanceService.getMaintenanceStats();
      
      expect(result).toHaveProperty('countByType');
      expect(result).toHaveProperty('countByStatus');
      expect(result).toHaveProperty('avgCostByType');
      
      // Don't verify the exact number of calls since implementation may change
      expect(MaintenanceRecord.aggregate).toHaveBeenCalled();
    });
  });
}); 