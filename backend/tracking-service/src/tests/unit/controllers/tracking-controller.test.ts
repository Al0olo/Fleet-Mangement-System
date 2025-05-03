import { TrackingController } from '../../../controllers/tracking-controller';
import { LocationService } from '../../../services/location-service';
import { jest } from '@jest/globals';
import { Request, Response } from 'express';
import winston from 'winston';

// Mock the location service
jest.mock('../../../services/location-service');

describe('TrackingController', () => {
  // Create mocks
  const mockLogger = {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  } as unknown as winston.Logger;

  const mockRedis = {} as any;
  
  let trackingController: TrackingController;
  let mockLocationService: jest.Mocked<LocationService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock response functions
    responseJson = jest.fn().mockReturnThis();
    responseStatus = jest.fn().mockReturnValue({ json: responseJson });
    
    // Create mock request and response
    mockRequest = {};
    mockResponse = {
      status: responseStatus,
      json: responseJson
    };
    
    // Create controller
    trackingController = new TrackingController(mockLogger, mockRedis);
    
    // Get the mocked location service instance
    mockLocationService = (LocationService as jest.MockedClass<typeof LocationService>).mock.instances[0] as jest.Mocked<LocationService>;
  });

  describe('recordLocation', () => {
    it('should record a valid location', async () => {
      // Set up test data
      const locationData = {
        vehicleId: 'test-vehicle',
        location: {
          type: 'Point',
          coordinates: [55.378, 3.436]
        },
        speed: 60,
        timestamp: new Date().toISOString()
      };
      
      mockRequest.body = locationData;
      mockLocationService.recordLocation.mockResolvedValueOnce(locationData as any);
      
      // Call the method
      await trackingController.recordLocation(mockRequest as Request, mockResponse as Response);
      
      // Verify results
      expect(mockLocationService.recordLocation).toHaveBeenCalledWith(locationData);
      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith({
        status: 'success',
        data: locationData
      });
    });

    it('should return 400 for invalid location data', async () => {
      // Set up invalid request
      mockRequest.body = { vehicleId: 'test-vehicle' }; // Missing location
      
      // Call the method
      await trackingController.recordLocation(mockRequest as Request, mockResponse as Response);
      
      // Verify error response
      expect(mockLocationService.recordLocation).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        message: expect.stringContaining('Missing required fields')
      }));
    });

    it('should handle service errors', async () => {
      // Set up test data
      const locationData = {
        vehicleId: 'test-vehicle',
        location: {
          type: 'Point',
          coordinates: [55.378, 3.436]
        }
      };
      
      mockRequest.body = locationData;
      
      // Mock service error
      const errorMsg = 'Service error';
      mockLocationService.recordLocation.mockRejectedValueOnce(new Error(errorMsg));
      
      // Call the method
      await trackingController.recordLocation(mockRequest as Request, mockResponse as Response);
      
      // Verify error handling
      expect(mockLocationService.recordLocation).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining(errorMsg));
      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        message: expect.stringContaining(errorMsg)
      }));
    });
  });

  describe('getLatestLocation', () => {
    it('should return the latest location for a vehicle', async () => {
      // Set up test data
      const vehicleId = 'test-vehicle';
      const locationData = {
        vehicleId,
        location: {
          type: 'Point',
          coordinates: [55.378, 3.436]
        },
        timestamp: new Date().toISOString()
      };
      
      mockRequest.params = { vehicleId };
      mockLocationService.getLatestLocation.mockResolvedValueOnce(locationData as any);
      
      // Call the method
      await trackingController.getLatestLocation(mockRequest as Request, mockResponse as Response);
      
      // Verify results
      expect(mockLocationService.getLatestLocation).toHaveBeenCalledWith(vehicleId);
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        status: 'success',
        data: locationData
      });
    });

    it('should return 404 when no location is found', async () => {
      // Set up test data
      const vehicleId = 'non-existent-vehicle';
      
      mockRequest.params = { vehicleId };
      mockLocationService.getLatestLocation.mockResolvedValueOnce(null);
      
      // Call the method
      await trackingController.getLatestLocation(mockRequest as Request, mockResponse as Response);
      
      // Verify results
      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        message: expect.stringContaining('No location data found')
      }));
    });

    it('should return 400 if vehicleId is missing', async () => {
      // Set up request with no vehicleId
      mockRequest.params = {};
      
      // Call the method
      await trackingController.getLatestLocation(mockRequest as Request, mockResponse as Response);
      
      // Verify results
      expect(mockLocationService.getLatestLocation).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
    });
  });

  describe('getLocationHistory', () => {
    it('should return location history for a vehicle', async () => {
      // Set up test data
      const vehicleId = 'test-vehicle';
      const historyData = [
        {
          vehicleId,
          location: { type: 'Point', coordinates: [55.378, 3.436] },
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          vehicleId,
          location: { type: 'Point', coordinates: [55.375, 3.432] },
          timestamp: new Date(Date.now() - 7200000).toISOString()
        }
      ];
      
      mockRequest.params = { vehicleId };
      mockRequest.query = {};
      mockLocationService.getLocationHistory.mockResolvedValueOnce(historyData as any);
      
      // Call the method
      await trackingController.getLocationHistory(mockRequest as Request, mockResponse as Response);
      
      // Verify results
      expect(mockLocationService.getLocationHistory).toHaveBeenCalledWith(vehicleId, undefined, undefined, 100);
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        status: 'success',
        count: 2,
        data: historyData
      });
    });

    it('should apply query parameters for date range and limit', async () => {
      // Set up test data with query params
      const vehicleId = 'test-vehicle';
      const startDate = '2023-01-01T00:00:00Z';
      const endDate = '2023-01-31T23:59:59Z';
      const limit = '50';
      
      mockRequest.params = { vehicleId };
      mockRequest.query = { startDate, endDate, limit };
      mockLocationService.getLocationHistory.mockResolvedValueOnce([]);
      
      // Call the method
      await trackingController.getLocationHistory(mockRequest as Request, mockResponse as Response);
      
      // Verify the correct parameters were passed
      expect(mockLocationService.getLocationHistory).toHaveBeenCalledWith(
        vehicleId,
        new Date(startDate),
        new Date(endDate),
        50
      );
    });
  });

  describe('findNearbyVehicles', () => {
    it('should return vehicles near a location', async () => {
      // Set up test data
      const longitude = '55.378';
      const latitude = '3.436';
      const radius = '1000';
      const limit = '10';
      
      const nearbyVehicles = [
        {
          vehicleId: 'vehicle1',
          location: { type: 'Point', coordinates: [55.378, 3.436] },
          distance: 100
        },
        {
          vehicleId: 'vehicle2',
          location: { type: 'Point', coordinates: [55.377, 3.437] },
          distance: 200
        }
      ];
      
      mockRequest.query = { longitude, latitude, radius, limit };
      mockLocationService.findNearbyVehicles.mockResolvedValueOnce(nearbyVehicles as any);
      
      // Call the method
      await trackingController.findNearbyVehicles(mockRequest as Request, mockResponse as Response);
      
      // Verify results
      expect(mockLocationService.findNearbyVehicles).toHaveBeenCalledWith(
        parseFloat(longitude),
        parseFloat(latitude),
        parseFloat(radius),
        parseInt(limit)
      );
      
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        status: 'success',
        count: 2,
        data: nearbyVehicles
      });
    });

    it('should return 400 if required parameters are missing', async () => {
      // Test with missing longitude
      mockRequest.query = { latitude: '3.436' };
      
      await trackingController.findNearbyVehicles(mockRequest as Request, mockResponse as Response);
      
      expect(mockLocationService.findNearbyVehicles).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        message: expect.stringContaining('Longitude and latitude are required')
      }));
    });

    it('should return 400 if parameters have invalid format', async () => {
      // Test with invalid longitude
      mockRequest.query = { longitude: 'not-a-number', latitude: '3.436' };
      
      await trackingController.findNearbyVehicles(mockRequest as Request, mockResponse as Response);
      
      expect(mockLocationService.findNearbyVehicles).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        message: expect.stringContaining('Invalid longitude or latitude format')
      }));
    });
  });
}); 