import { generateRandomPoint } from '../../services/vehicle.service';
import * as geolib from 'geolib';

describe('Vehicle Service', () => {
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
      // Add a small tolerance (1%) to account for floating-point calculations
      const radiusMeters = radiusKm * 1000 * 1.01;
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
      // Add a small tolerance (1%) to account for floating-point calculations
      const radiusMeters = radiusKm * 1000 * 1.01;
      expect(distance).toBeLessThanOrEqual(radiusMeters);
    });
  });
}); 