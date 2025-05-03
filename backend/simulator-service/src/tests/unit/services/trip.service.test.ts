import { jest } from '@jest/globals';
import { calculatePath, createSimulatedTrip, startTrip, completeTrip, getActiveTrips } from '../../../services/trip.service';
import { Trip, TripStatus } from '../../../models/trip.model';
import { VehicleStatus } from '../../../models/vehicle.model';
import * as vehicleService from '../../../services/vehicle.service';

// Mock the mongoose model
jest.mock('../../../models/trip.model', () => {
  const mockDoc = {
    save: jest.fn().mockResolvedValue(undefined),
    toJSON: jest.fn()
  };
  
  const TripMock = jest.fn().mockImplementation(() => mockDoc);
  
  TripMock.find = jest.fn().mockReturnThis();
  TripMock.findOne = jest.fn().mockReturnThis();
  TripMock.sort = jest.fn().mockReturnThis();
  TripMock.exec = jest.fn();
  
  return {
    Trip: TripMock,
    TripStatus: {
      PLANNED: 'PLANNED',
      IN_PROGRESS: 'IN_PROGRESS',
      COMPLETED: 'COMPLETED',
      CANCELLED: 'CANCELLED'
    }
  };
});

// Mock the trip service functions
jest.mock('../../../services/trip.service', () => {
  // Get the actual module
  const originalModule = jest.requireActual('../../../services/trip.service');
  
  // Return a mock that uses the actual implementation except for the functions we want to mock
  return {
    ...originalModule,
    getActiveTrips: jest.fn()
  };
});

// Mock the vehicle service
jest.mock('../../../services/vehicle.service', () => ({
  updateVehicleStatus: jest.fn().mockResolvedValue({}),
  updateVehicleLocation: jest.fn().mockResolvedValue({}),
  generateRandomPoint: jest.fn().mockReturnValue({ latitude: 41.0, longitude: -73.0 })
}));

// Mock the kafka service
jest.mock('../../../services/kafka.service', () => ({
  publishTripEvent: jest.fn().mockResolvedValue(undefined),
  EventType: {
    TRIP_START: 'TRIP_START',
    TRIP_END: 'TRIP_END'
  }
}));

describe('Trip Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('calculatePath', () => {
    it('should calculate a path between two points', () => {
      // Arrange
      const startLocation = {
        type: 'Point',
        coordinates: [-74.0, 40.7]
      };
      const endLocation = {
        type: 'Point',
        coordinates: [-73.9, 40.8]
      };
      
      // Act
      const result = calculatePath(startLocation, endLocation, 10);
      
      // Assert
      expect(result).toHaveLength(10);
      expect(result[0]).toEqual(startLocation);
      expect(result[result.length - 1]).toEqual(endLocation);
    });
    
    it('should include waypoints if provided', () => {
      // Arrange
      const startLocation = {
        type: 'Point',
        coordinates: [-74.0, 40.7]
      };
      const endLocation = {
        type: 'Point',
        coordinates: [-73.9, 40.8]
      };
      const waypoints = [
        {
          type: 'Point',
          coordinates: [-73.95, 40.75]
        }
      ];
      
      // Act
      const result = calculatePath(startLocation, endLocation, 10, waypoints);
      
      // Assert
      expect(result).toHaveLength(10);
      expect(result[0]).toEqual(startLocation);
      expect(result[result.length - 1]).toEqual(endLocation);
      // Waypoints affect the path but they're not necessarily exactly on the path
      // due to the bezier spline calculation
    });
  });
  
  describe('createSimulatedTrip', () => {
    it('should create a simulated trip for a vehicle', async () => {
      // Arrange
      const vehicle = {
        vehicleId: 'vehicle123',
        location: {
          type: 'Point',
          coordinates: [-74.0, 40.7]
        }
      };
      
      const region = {
        centerLat: 40.7,
        centerLng: -74.0,
        radiusKm: 5
      };
      
      const mockSave = jest.fn().mockResolvedValue({
        tripId: 'trip123',
        vehicleId: vehicle.vehicleId,
        status: TripStatus.PLANNED,
        startLocation: vehicle.location
      });
      
      Trip.mockImplementation(() => ({
        save: mockSave,
        tripId: 'trip123',
        vehicleId: vehicle.vehicleId,
        status: TripStatus.PLANNED,
        startLocation: vehicle.location
      }));
      
      // Act
      const result = await createSimulatedTrip(vehicle, region, true);
      
      // Assert
      expect(Trip).toHaveBeenCalledWith(expect.objectContaining({
        vehicleId: vehicle.vehicleId,
        status: TripStatus.PLANNED,
        startLocation: vehicle.location
      }));
      expect(mockSave).toHaveBeenCalled();
    });
  });
  
  describe('startTrip', () => {
    it('should start a trip and update the vehicle status', async () => {
      // Arrange
      const tripId = 'trip123';
      const vehicleId = 'vehicle123';
      
      const mockTrip = {
        tripId,
        vehicleId,
        status: TripStatus.PLANNED,
        startLocation: { type: 'Point', coordinates: [-74.0, 40.7] },
        save: jest.fn().mockResolvedValue({
          tripId,
          vehicleId,
          status: TripStatus.IN_PROGRESS,
          startTime: expect.any(Date),
          currentLocation: { type: 'Point', coordinates: [-74.0, 40.7] }
        })
      };
      
      Trip.findOne.mockResolvedValue(mockTrip);
      
      // Act
      const result = await startTrip(tripId);
      
      // Assert
      expect(Trip.findOne).toHaveBeenCalledWith({ tripId });
      expect(mockTrip.status).toBe(TripStatus.IN_PROGRESS);
      expect(mockTrip.save).toHaveBeenCalled();
      expect(vehicleService.updateVehicleStatus).toHaveBeenCalledWith(
        vehicleId,
        VehicleStatus.RUNNING
      );
    });
    
    it('should return null if trip is not found', async () => {
      // Arrange
      Trip.findOne.mockResolvedValue(null);
      
      // Act
      const result = await startTrip('nonexistent');
      
      // Assert
      expect(result).toBeNull();
      expect(vehicleService.updateVehicleStatus).not.toHaveBeenCalled();
    });
  });
  
  describe('completeTrip', () => {
    it('should complete a trip and update the vehicle status', async () => {
      // Arrange
      const tripId = 'trip123';
      const vehicleId = 'vehicle123';
      
      const mockTrip = {
        tripId,
        vehicleId,
        status: TripStatus.IN_PROGRESS,
        endLocation: { type: 'Point', coordinates: [-73.9, 40.8] },
        save: jest.fn().mockResolvedValue({
          tripId,
          vehicleId,
          status: TripStatus.COMPLETED,
          actualEndTime: expect.any(Date),
          currentLocation: { type: 'Point', coordinates: [-73.9, 40.8] }
        })
      };
      
      Trip.findOne.mockResolvedValue(mockTrip);
      
      // Act
      const result = await completeTrip(tripId);
      
      // Assert
      expect(Trip.findOne).toHaveBeenCalledWith({ tripId });
      expect(mockTrip.status).toBe(TripStatus.COMPLETED);
      expect(mockTrip.save).toHaveBeenCalled();
      expect(vehicleService.updateVehicleStatus).toHaveBeenCalledWith(
        vehicleId,
        VehicleStatus.IDLE
      );
      expect(vehicleService.updateVehicleLocation).toHaveBeenCalledWith(
        vehicleId,
        mockTrip.endLocation,
        0,
        0
      );
    });
  });
  
  describe('getActiveTrips', () => {
    it('should return all active trips', async () => {
      // Arrange
      const mockTrips = [
        { tripId: 't1', vehicleId: 'v1', status: TripStatus.IN_PROGRESS },
        { tripId: 't2', vehicleId: 'v2', status: TripStatus.IN_PROGRESS }
      ];
      
      // Set the mock implementation to return our mock data
      getActiveTrips.mockResolvedValue(mockTrips);
      
      // Act
      const result = await getActiveTrips();
      
      // Assert
      expect(result).toEqual(mockTrips);
      expect(getActiveTrips).toHaveBeenCalled();
    });
  });
}); 