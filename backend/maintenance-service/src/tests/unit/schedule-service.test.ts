import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { Logger } from 'winston';

// Mock the dependencies before any other code
jest.mock('../../models/maintenance-schedule', () => ({
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
    updateMany: jest.fn().mockResolvedValue({ nModified: 2 })
  }
}));

jest.mock('mongoose', () => ({
  Types: {
    ObjectId: {
      isValid: jest.fn().mockImplementation((id) => id !== 'invalid-id')
    }
  }
}));

// Import after mocks are set up
import ScheduleService from '../../services/schedule-service';
import { mockMaintenanceSchedules, newMaintenanceSchedule } from '../mocks/mock-maintenance';

// Type for mocks
type MockReturnType = any;

describe('ScheduleService', () => {
  let scheduleService: ScheduleService;
  let mockLogger: Logger;
  let MaintenanceSchedule: any;
  let mockFind: jest.Mock;
  let mockCountDocuments: jest.Mock;
  let mockFindById: jest.Mock;
  let mockCreate: jest.Mock;
  let mockFindByIdAndUpdate: jest.Mock;
  let mockFindByIdAndDelete: jest.Mock;
  let mockUpdateMany: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Import the mocked model
    MaintenanceSchedule = require('../../models/maintenance-schedule').default;
    
    // Set up all the mock functions
    mockFind = MaintenanceSchedule.find as jest.Mock;
    mockFind.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(mockMaintenanceSchedules as MockReturnType)
    });
    
    mockCountDocuments = MaintenanceSchedule.countDocuments as jest.Mock;
    mockCountDocuments.mockResolvedValue(mockMaintenanceSchedules.length as MockReturnType);
    
    mockFindById = MaintenanceSchedule.findById as jest.Mock;
    mockFindById.mockResolvedValue(mockMaintenanceSchedules[0] as MockReturnType);
    
    mockCreate = MaintenanceSchedule.create as jest.Mock;
    mockCreate.mockImplementation((data: any) => ({
      ...data,
      id: '60d21b4667d0d8992e610c89',
      reminderSent: false,
      createdAt: new Date(),
      updatedAt: new Date()
    } as MockReturnType));
    
    mockFindByIdAndUpdate = MaintenanceSchedule.findByIdAndUpdate as jest.Mock;
    mockFindByIdAndUpdate.mockImplementation((id: string, data: any) => ({
      ...mockMaintenanceSchedules[0],
      ...data,
      id,
      updatedAt: new Date()
    } as MockReturnType));
    
    mockFindByIdAndDelete = MaintenanceSchedule.findByIdAndDelete as jest.Mock;
    mockFindByIdAndDelete.mockImplementation((id: string) => ({
      ...mockMaintenanceSchedules[0],
      id
    } as MockReturnType));
    
    mockUpdateMany = MaintenanceSchedule.updateMany as jest.Mock;
    mockUpdateMany.mockResolvedValue({ nModified: 2 } as MockReturnType);
    
    // Create a mock logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as unknown as Logger;
    
    // Create instance with mock logger
    scheduleService = new ScheduleService(mockLogger);
  });

  describe('getAllSchedules', () => {
    test('should return all maintenance schedules with pagination', async () => {
      const result = await scheduleService.getAllSchedules(10, 0);
      
      expect(result.schedules).toEqual(mockMaintenanceSchedules);
      expect(result.count).toBe(mockMaintenanceSchedules.length);
      expect(MaintenanceSchedule.find).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalled();
    });
    
    test('should apply filters when provided', async () => {
      const filters = { vehicleId: 'vehicle123', status: 'scheduled' };
      await scheduleService.getAllSchedules(10, 0, 'scheduledDate', 'asc', filters);
      
      expect(MaintenanceSchedule.find).toHaveBeenCalledWith(
        expect.objectContaining({ 
          vehicleId: 'vehicle123',
          status: 'scheduled'
        })
      );
    });
  });

  describe('getScheduleById', () => {
    test('should return a maintenance schedule by ID', async () => {
      const result = await scheduleService.getScheduleById('60d21b4667d0d8992e610c87');
      
      expect(result).toEqual(mockMaintenanceSchedules[0]);
      expect(MaintenanceSchedule.findById).toHaveBeenCalledWith('60d21b4667d0d8992e610c87');
      expect(mockLogger.info).toHaveBeenCalled();
    });
    
    test('should throw error for invalid ID', async () => {
      await expect(scheduleService.getScheduleById('invalid-id'))
        .rejects
        .toThrow('Invalid maintenance schedule ID format');
    });
  });

  describe('createSchedule', () => {
    test('should create a maintenance schedule', async () => {
      const result = await scheduleService.createSchedule(newMaintenanceSchedule);
      
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
      expect(result).toHaveProperty('reminderSent', false);
      expect(result).toMatchObject(newMaintenanceSchedule);
      expect(MaintenanceSchedule.create).toHaveBeenCalledWith(newMaintenanceSchedule);
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('updateSchedule', () => {
    test('should update a maintenance schedule', async () => {
      const updateData = { estimatedCost: 300.00, priority: 'high' };
      const result = await scheduleService.updateSchedule('60d21b4667d0d8992e610c87', updateData);
      
      expect(result).toHaveProperty('id', '60d21b4667d0d8992e610c87');
      expect(result).toMatchObject(updateData);
      expect(MaintenanceSchedule.findByIdAndUpdate).toHaveBeenCalledWith(
        '60d21b4667d0d8992e610c87',
        updateData,
        { new: true, runValidators: true }
      );
      expect(mockLogger.info).toHaveBeenCalled();
    });
    
    test('should throw error when schedule not found', async () => {
      await expect(scheduleService.updateSchedule('invalid-id', {}))
        .rejects
        .toThrow('Invalid maintenance schedule ID format');
    });
  });

  describe('deleteSchedule', () => {
    test('should delete a maintenance schedule', async () => {
      const result = await scheduleService.deleteSchedule('60d21b4667d0d8992e610c87');
      
      expect(result).toHaveProperty('id', '60d21b4667d0d8992e610c87');
      expect(MaintenanceSchedule.findByIdAndDelete).toHaveBeenCalledWith('60d21b4667d0d8992e610c87');
      expect(mockLogger.info).toHaveBeenCalled();
    });
    
    test('should throw error when schedule not found', async () => {
      await expect(scheduleService.deleteSchedule('invalid-id'))
        .rejects
        .toThrow('Invalid maintenance schedule ID format');
    });
  });

  describe('getUpcomingSchedules', () => {
    test('should return upcoming maintenance schedules', async () => {
      const now = new Date();
      const futureDate = new Date(now);
      futureDate.setDate(now.getDate() + 30); // 30 days in the future
      
      await scheduleService.getUpcomingSchedules(30);
      
      expect(MaintenanceSchedule.find).toHaveBeenCalledWith(
        expect.objectContaining({
          scheduledDate: expect.objectContaining({
            $gte: expect.any(Date),
            $lte: expect.any(Date)
          }),
          status: expect.objectContaining({
            $in: expect.arrayContaining(['scheduled', 'in-progress'])
          })
        })
      );
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('getOverdueSchedules', () => {
    test('should return overdue maintenance schedules', async () => {
      await scheduleService.getOverdueSchedules();
      
      expect(MaintenanceSchedule.find).toHaveBeenCalledWith(
        expect.objectContaining({
          scheduledDate: expect.objectContaining({
            $lt: expect.any(Date)
          }),
          status: expect.objectContaining({
            $in: expect.arrayContaining(['scheduled', 'in-progress'])
          })
        })
      );
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('updateOverdueSchedules', () => {
    test('should update overdue schedules status', async () => {
      // Check the implementation in schedule-service.ts - it returns result.modifiedCount
      mockUpdateMany.mockResolvedValueOnce({ modifiedCount: 2 });
      
      const result = await scheduleService.updateOverdueSchedules();
      
      expect(result).toBe(2); // It should return the modifiedCount directly
      
      expect(MaintenanceSchedule.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          scheduledDate: expect.objectContaining({
            $lt: expect.any(Date)
          }),
          status: expect.objectContaining({
            $in: expect.arrayContaining(['scheduled', 'in-progress'])
          })
        }),
        { $set: { status: 'overdue' } }
      );
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('getVehicleSchedules', () => {
    test('should return maintenance schedules for a specific vehicle', async () => {
      await scheduleService.getVehicleSchedules('vehicle123');
      
      expect(MaintenanceSchedule.find).toHaveBeenCalledWith({ vehicleId: 'vehicle123' });
      expect(mockLogger.info).toHaveBeenCalled();
    });
    
    test('should filter by status when provided', async () => {
      await scheduleService.getVehicleSchedules('vehicle123', 'scheduled');
      
      expect(MaintenanceSchedule.find).toHaveBeenCalledWith({
        vehicleId: 'vehicle123',
        status: 'scheduled'
      });
    });
  });
}); 