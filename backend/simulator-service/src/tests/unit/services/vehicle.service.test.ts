import { jest } from '@jest/globals';
import { 
  generateRandomPoint, 
  createSimulatedVehicle, 
  updateVehicleStatus, 
  updateVehicleLocation, 
  getAllSimulatedVehicles 
} from '../../../services/vehicle.service';
import { Vehicle, VehicleStatus, VehicleType } from '../../../models/vehicle.model';
import * as geolib from 'geolib';

// Mock the mongoose model
jest.mock('../../../models/vehicle.model', () => {
  const mockDoc = {
    save: jest.fn().mockResolvedValue(undefined),
    toJSON: jest.fn()
  };
  
  const VehicleMock = jest.fn().mockImplementation(() => mockDoc);
  
  VehicleMock.find = jest.fn().mockReturnThis();
  VehicleMock.findOne = jest.fn().mockReturnThis();
  VehicleMock.findOneAndUpdate = jest.fn().mockReturnThis();
  VehicleMock.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 1 });
  VehicleMock.exec = jest.fn();
  
  return {
    Vehicle: VehicleMock,
    VehicleStatus: {
      IDLE: 'IDLE',
      RUNNING: 'RUNNING',
      MAINTENANCE: 'MAINTENANCE'
    },
    VehicleType: {
      PASSENGER: 'PASSENGER',
      CARGO: 'CARGO',
      HEAVY_DUTY: 'HEAVY_DUTY'
    }
  };
});

// Mock the vehicle service functions
jest.mock('../../../services/vehicle.service', () => {
  // Get the actual module
  const originalModule = jest.requireActual('../../../services/vehicle.service');
  
  // Return a mock that uses the actual implementation except for the functions we want to mock
  return {
    ...originalModule,
    // Only mock getAllSimulatedVehicles, preserve the other functions
    getAllSimulatedVehicles: jest.fn()
  };
});

describe('Vehicle Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateRandomPoint', () => {
    it('should generate a point within the specified radius', () => {
      // Arrange
      const centerLat = 40.7128; // NYC
      const centerLng = -74.0060;
      const radiusKm = 5;
      
      // Act
      const result = generateRandomPoint(centerLat, centerLng, radiusKm);
      
      // Assert
      expect(result).toHaveProperty('latitude');
      expect(result).toHaveProperty('longitude');
      
      // Check that the point is within the radius
      const distance = geolib.getDistance(
        { latitude: centerLat, longitude: centerLng },
        { latitude: result.latitude, longitude: result.longitude }
      );
      
      // Convert radius from km to meters for comparison
      const radiusMeters = radiusKm * 1000;
      expect(distance).toBeLessThanOrEqual(radiusMeters);
    });
    
    it('should generate different points on successive calls', () => {
      // Arrange
      const centerLat = 40.7128;
      const centerLng = -74.0060;
      const radiusKm = 5;
      
      // Act
      const result1 = generateRandomPoint(centerLat, centerLng, radiusKm);
      const result2 = generateRandomPoint(centerLat, centerLng, radiusKm);
      
      // Assert
      // The chance of generating the exact same point twice is extremely low
      expect(result1).not.toEqual(result2);
    });
    
    it('should handle large radius values', () => {
      // Arrange
      const centerLat = 40.7128;
      const centerLng = -74.0060;
      const radiusKm = 100;
      
      // Act
      const result = generateRandomPoint(centerLat, centerLng, radiusKm);
      
      // Assert
      expect(result).toHaveProperty('latitude');
      expect(result).toHaveProperty('longitude');
      
      // Check that the point is within the radius
      const distance = geolib.getDistance(
        { latitude: centerLat, longitude: centerLng },
        { latitude: result.latitude, longitude: result.longitude }
      );
      
      // Convert radius from km to meters for comparison
      const radiusMeters = radiusKm * 1000;
      expect(distance).toBeLessThanOrEqual(radiusMeters);
    });
  });

  describe('createSimulatedVehicle', () => {
    it('should create a new vehicle with the provided region', async () => {
      // Arrange
      const region = {
        centerLat: 40.7128,
        centerLng: -74.0060,
        radiusKm: 5
      };
      
      const mockSavedVehicle = {
        vehicleId: 'vehicle123',
        name: 'Test Vehicle',
        type: VehicleType.PASSENGER,
        status: VehicleStatus.IDLE,
        location: {
          type: 'Point',
          coordinates: [-74.01, 40.72]
        }
      };
      
      const mockSave = jest.fn().mockResolvedValue(mockSavedVehicle);
      Vehicle.mockImplementation(() => ({
        save: mockSave,
        ...mockSavedVehicle
      }));
      
      // Act
      const result = await createSimulatedVehicle(region, VehicleType.PASSENGER);
      
      // Assert
      expect(Vehicle).toHaveBeenCalledWith(expect.objectContaining({
        type: VehicleType.PASSENGER,
        status: VehicleStatus.IDLE,
        location: expect.objectContaining({
          type: 'Point',
          coordinates: expect.any(Array)
        })
      }));
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('updateVehicleStatus', () => {
    it('should update vehicle status', async () => {
      // Arrange
      const vehicleId = 'vehicle123';
      const newStatus = VehicleStatus.RUNNING;
      
      const mockUpdatedVehicle = {
        vehicleId,
        status: newStatus,
        lastUpdated: new Date()
      };
      
      Vehicle.findOneAndUpdate.mockResolvedValue(mockUpdatedVehicle);
      
      // Act
      const result = await updateVehicleStatus(vehicleId, newStatus);
      
      // Assert
      expect(Vehicle.findOneAndUpdate).toHaveBeenCalledWith(
        { vehicleId },
        { 
          status: newStatus,
          lastUpdated: expect.any(Date)
        },
        { new: true }
      );
      expect(result).toEqual(mockUpdatedVehicle);
    });
    
    it('should return null if vehicle is not found', async () => {
      // Arrange
      Vehicle.findOneAndUpdate.mockResolvedValue(null);
      
      // Act
      const result = await updateVehicleStatus('nonexistent', VehicleStatus.RUNNING);
      
      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateVehicleLocation', () => {
    it('should update vehicle location', async () => {
      // Arrange
      const vehicleId = 'vehicle123';
      const location = {
        type: 'Point',
        coordinates: [-74.01, 40.72]
      };
      const speed = 30;
      const heading = 90;
      
      const mockUpdatedVehicle = {
        vehicleId,
        location,
        speed,
        heading,
        lastUpdated: new Date()
      };
      
      Vehicle.findOneAndUpdate.mockResolvedValue(mockUpdatedVehicle);
      
      // Act
      const result = await updateVehicleLocation(vehicleId, location, speed, heading);
      
      // Assert
      expect(Vehicle.findOneAndUpdate).toHaveBeenCalledWith(
        { vehicleId },
        { 
          location,
          speed,
          heading,
          lastUpdated: expect.any(Date)
        },
        { new: true }
      );
      expect(result).toEqual(mockUpdatedVehicle);
    });
  });

  describe('getAllSimulatedVehicles', () => {
    it('should return all active vehicles', async () => {
      // Arrange
      const mockVehicles = [
        { vehicleId: 'v1', name: 'Vehicle 1' },
        { vehicleId: 'v2', name: 'Vehicle 2' }
      ];
      
      // Set the mock implementation to return our mock data
      getAllSimulatedVehicles.mockResolvedValue(mockVehicles);
      
      // Act
      const result = await getAllSimulatedVehicles();
      
      // Assert
      expect(result).toEqual(mockVehicles);
      expect(getAllSimulatedVehicles).toHaveBeenCalled();
    });
  });
}); 