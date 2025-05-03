import { LocationService } from '../../../services/location-service';
import LocationData, { ILocationData } from '../../../models/location-data';
import winston from 'winston';
import { jest } from '@jest/globals';

// Mock mongoose models
jest.mock('../../../models/location-data');

describe('LocationService', () => {
  // Create mocks
  const mockLogger = {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  } as unknown as winston.Logger;

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    sAdd: jest.fn(),
    geoAdd: jest.fn()
  } as unknown as any;

  let locationService: LocationService;
  let mockLocationData: Partial<ILocationData>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Initialize service with mocks
    locationService = new LocationService(mockLogger, mockRedis);
    
    // Set up test data
    mockLocationData = {
      vehicleId: '6815e0a4a9d11d07e62473a9',
      location: {
        type: 'Point',
        coordinates: [55.378, 3.436]
      },
      speed: 60,
      heading: 180,
      timestamp: new Date().toISOString(),
      altitude: 100,
      accuracy: 5,
      metadata: {
        fuelLevel: 70,
        temperature: 25
      }
    };
  });

  describe('recordLocation', () => {
    it('should save a new location and update Redis', async () => {
      // Mock the mongoose save method
      const mockSavedLocation = { ...mockLocationData, _id: 'some-id' };
      const saveMock = jest.fn().mockResolvedValue(mockSavedLocation);
      (LocationData as jest.Mock).mockImplementation(() => ({
        save: saveMock
      }));

      // Call the method
      const result = await locationService.recordLocation(mockLocationData);

      // Check results
      expect(LocationData).toHaveBeenCalledWith(mockLocationData);
      expect(saveMock).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalled();
      expect(mockRedis.sAdd).toHaveBeenCalledWith('vehicles:active', mockLocationData.vehicleId);
      expect(mockRedis.geoAdd).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Recorded new location'));
      expect(result).toEqual(mockSavedLocation);
    });

    it('should handle errors properly', async () => {
      // Mock an error when saving
      const errorMsg = 'Database error';
      (LocationData as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error(errorMsg))
      }));

      // Call the method and expect it to throw
      await expect(locationService.recordLocation(mockLocationData))
        .rejects.toThrow(errorMsg);
      
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining(errorMsg));
      expect(mockRedis.set).not.toHaveBeenCalled();
    });
  });

  describe('getLatestLocation', () => {
    it('should return location from Redis if available', async () => {
      // Mock Redis returning a cached value
      const cachedLocation = { ...mockLocationData, _id: 'cached-id' };
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedLocation));

      // Call the method
      const result = await locationService.getLatestLocation(mockLocationData.vehicleId as string);

      // Verify Redis was checked but not the database
      expect(mockRedis.get).toHaveBeenCalledWith(`vehicle:location:${mockLocationData.vehicleId}`);
      expect(LocationData.findOne).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining('from cache'));
      expect(result).toEqual(cachedLocation);
    });

    it('should query database if Redis cache misses', async () => {
      // Mock Redis cache miss and database hit
      mockRedis.get.mockResolvedValue(null);
      const dbLocation = { ...mockLocationData, _id: 'db-id' };
      (LocationData.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(dbLocation)
        })
      });

      // Call the method
      const result = await locationService.getLatestLocation(mockLocationData.vehicleId as string);

      // Verify Redis was checked and then the database
      expect(mockRedis.get).toHaveBeenCalledWith(`vehicle:location:${mockLocationData.vehicleId}`);
      expect(LocationData.findOne).toHaveBeenCalledWith({ vehicleId: mockLocationData.vehicleId });
      expect(mockRedis.set).toHaveBeenCalled(); // Cache should be updated
      expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining('from database'));
      expect(result).toEqual(dbLocation);
    });
  });

  describe('getLocationHistory', () => {
    it('should retrieve location history for a vehicle', async () => {
      // Mock database returning history data
      const historyData = [
        { ...mockLocationData, _id: 'loc1', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { ...mockLocationData, _id: 'loc2', timestamp: new Date(Date.now() - 7200000).toISOString() }
      ];
      
      (LocationData.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(historyData)
          })
        })
      });

      // Call the method
      const result = await locationService.getLocationHistory(mockLocationData.vehicleId as string);

      // Verify correct query was made
      expect(LocationData.find).toHaveBeenCalledWith({ vehicleId: mockLocationData.vehicleId });
      expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining('Retrieved 2 location records'));
      expect(result).toEqual(historyData);
    });

    it('should apply date filters when provided', async () => {
      // Set up date range
      const startDate = new Date(Date.now() - 86400000); // 1 day ago
      const endDate = new Date(); // now
      
      // Mock the database response
      (LocationData.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([])
          })
        })
      });

      // Call the method
      await locationService.getLocationHistory(mockLocationData.vehicleId as string, startDate, endDate, 50);

      // Verify the correct query was constructed
      expect(LocationData.find).toHaveBeenCalledWith({
        vehicleId: mockLocationData.vehicleId,
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      });
    });
  });

  describe('findNearbyVehicles', () => {
    it('should find vehicles near a specified location', async () => {
      // Mock data for nearby vehicles
      const nearbyVehicles = [
        { ...mockLocationData, _id: 'v1', vehicleId: 'vehicle1', distance: 100 },
        { ...mockLocationData, _id: 'v2', vehicleId: 'vehicle2', distance: 200 }
      ];
      
      // Mock the aggregation pipeline
      (LocationData.aggregate as jest.Mock).mockResolvedValue(nearbyVehicles);

      // Call the method
      const result = await locationService.findNearbyVehicles(55.378, 3.436, 1000, 10);

      // Verify the correct aggregation was called
      expect(LocationData.aggregate).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          $geoNear: expect.objectContaining({
            near: {
              type: 'Point',
              coordinates: [55.378, 3.436]
            },
            maxDistance: 1000
          })
        })
      ]));
      
      expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining('Found 2 vehicles near'));
      expect(result).toEqual(nearbyVehicles);
    });
  });
}); 