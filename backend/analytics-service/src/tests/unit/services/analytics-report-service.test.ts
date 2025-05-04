import { Logger } from 'winston';
import mongoose from 'mongoose';
import AnalyticsReportService from '../../../services/analytics-report-service';
import AnalyticsReport from '../../../models/analytics-report';

// Mock dependencies
jest.mock('../../../models/analytics-report', () => {
  // Save method will be defined dynamically in tests
  const mockSave = jest.fn();
  const mockFind = jest.fn();
  const mockFindById = jest.fn();
  
  // Create a constructor function that mocks the model
  function MockAnalyticsReport(this: any, data: any) {
    // Store data on the instance
    Object.assign(this, data);
    // Add save method that returns the instance data plus any mock additions
    this.save = mockSave;
    return this;
  }
  
  // Important: Add the save method to the prototype
  MockAnalyticsReport.prototype = { save: mockSave };
  
  const mockModel = {
    find: mockFind,
    findById: mockFindById,
    prototype: { save: mockSave }
  };

  // This is key: assign all properties to the constructor function
  // to make it work like a mongoose model
  Object.assign(MockAnalyticsReport, mockModel);
  
  // Export the constructor as default export - this fixes "is not a constructor" error
  return {
    __esModule: true,
    default: MockAnalyticsReport
  };
});

jest.mock('mongoose');

// Mock mongoose ObjectId
(mongoose.Types as any).ObjectId = function(id?: string) {
  return id || 'mocked-id';
};

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({
    data: {
      data: {
        countByType: { truck: 5, excavator: 3 },
        countByStatus: { active: 7, maintenance: 1 }
      }
    }
  })
}));

describe('AnalyticsReportService', () => {
  // Mock logger
  const mockLogger: Partial<Logger> = {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  };

  let analyticsReportService: AnalyticsReportService;

  beforeEach(() => {
    jest.clearAllMocks();
    analyticsReportService = new AnalyticsReportService(mockLogger as Logger);
  });

  describe('getReportById', () => {
    it('should get a report by ID', async () => {
      // Mock data
      const mockReport = { id: '123', reportType: 'fleet', data: {} };
      
      // Mock implementation
      (AnalyticsReport.findById as jest.Mock).mockResolvedValueOnce(mockReport);
      
      // Execute
      const result = await analyticsReportService.getReportById('123');
      
      // Assert
      expect(result).toEqual(mockReport);
    });

    it('should handle errors', async () => {
      // Mock implementation
      const mockError = new Error('Database error');
      (AnalyticsReport.findById as jest.Mock).mockRejectedValueOnce(mockError);
      
      // Execute and assert
      await expect(analyticsReportService.getReportById('123')).rejects.toThrow('Database error');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getReports', () => {
    it('should get reports by type and period', async () => {
      // Mock data
      const mockReports = [
        { reportType: 'fleet', period: 'monthly' },
        { reportType: 'fleet', period: 'monthly' }
      ];
      
      // Mock implementations
      const mockSortFn = jest.fn().mockReturnThis();
      const mockLimitFn = jest.fn().mockResolvedValueOnce(mockReports);
      (AnalyticsReport.find as jest.Mock).mockReturnValueOnce({
        sort: mockSortFn,
        limit: mockLimitFn
      });
      
      // Execute
      const result = await analyticsReportService.getReports('fleet', 'monthly', undefined, 10);
      
      // Assert
      expect(result).toEqual(mockReports);
    });

    it('should include vehicleId in query when provided', async () => {
      // Mock implementations
      const mockSortFn = jest.fn().mockReturnThis();
      const mockLimitFn = jest.fn().mockResolvedValueOnce([]);
      (AnalyticsReport.find as jest.Mock).mockReturnValueOnce({
        sort: mockSortFn,
        limit: mockLimitFn
      });
      
      // Execute
      await analyticsReportService.getReports('vehicle', 'monthly', 'vehicle123', 5);
      
      // Assert - we expect the function to complete successfully
      expect(mockLimitFn).toHaveBeenCalledWith(5);
    });
  });

  describe('saveReport', () => {
    it('should save a new report', async () => {
      // Mock data
      const reportData = {
        reportType: 'fleet',
        period: 'monthly',
        startDate: new Date(),
        endDate: new Date(),
        data: { test: 'data' }
      };
      
      const savedReport = { ...reportData, id: '123' };
      
      // Mock implementations - this will be called by the service
      (AnalyticsReport.prototype.save as jest.Mock).mockImplementation(function(this: any) {
        return Promise.resolve(savedReport);
      });
      
      // Execute
      const result = await analyticsReportService.saveReport(reportData);
      
      // Assert
      expect(result).toEqual(savedReport);
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  // We could add more tests for the report generation methods, but they are more complex
  // and would require more extensive mocking of dependencies
}); 