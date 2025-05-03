import request from 'supertest';
import { createServer } from '../../../server';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import LocationData from '../../../models/location-data';
import winston from 'winston';
import { jest } from '@jest/globals';

// Mock mongoose to avoid real database connections
jest.mock('mongoose', () => {
  const mongoose = jest.requireActual('mongoose');
  
  // Create a mock schema implementation
  const mockSchema = jest.fn().mockImplementation(() => ({
    index: jest.fn().mockReturnThis()
  }));
  
  // Add Types.ObjectId to the mock Schema
  mockSchema.Types = {
    ObjectId: mongoose.Schema.Types.ObjectId
  };
  
  // Create mocks for mongoose methods
  return {
    ...mongoose,
    connect: jest.fn().mockResolvedValue({}),
    Schema: mockSchema,
    model: jest.fn().mockImplementation((name) => {
      // For LocationData model, create a mock implementation
      if (name === 'LocationData') {
        const LocationDataModel = function(data: any) {
          Object.assign(this, data);
          // Add save method to the instance
          this.save = jest.fn().mockResolvedValue(this);
          return this;
        };
        
        // Add static methods to the model
        LocationDataModel.findOne = jest.fn().mockImplementation(() => ({
          sort: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue({
            _id: 'test-id',
            vehicleId: 'test-vehicle-id',
            location: { type: 'Point', coordinates: [55.378, 3.436] },
            timestamp: new Date().toISOString()
          })
        }));
        
        LocationDataModel.find = jest.fn().mockImplementation(() => ({
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([
            {
              _id: 'test-id-1',
              vehicleId: 'test-vehicle-id',
              location: { type: 'Point', coordinates: [55.378, 3.436] },
              timestamp: new Date(Date.now() - 3600000).toISOString()
            },
            {
              _id: 'test-id-2',
              vehicleId: 'test-vehicle-id',
              location: { type: 'Point', coordinates: [55.375, 3.432] },
              timestamp: new Date(Date.now() - 7200000).toISOString()
            }
          ])
        }));
        
        LocationDataModel.aggregate = jest.fn().mockResolvedValue([
          {
            _id: 'vehicle1',
            vehicleId: 'vehicle1',
            location: { type: 'Point', coordinates: [55.378, 3.436] },
            distance: 100
          },
          {
            _id: 'vehicle2',
            vehicleId: 'vehicle2',
            location: { type: 'Point', coordinates: [55.377, 3.437] },
            distance: 200
          }
        ]);
        
        LocationDataModel.deleteMany = jest.fn().mockResolvedValue({});
        LocationDataModel.insertMany = jest.fn().mockResolvedValue([]);
        
        return LocationDataModel;
      }
      
      // Default model implementation
      return {
        findOne: jest.fn().mockResolvedValue(null),
        find: jest.fn().mockResolvedValue([]),
        prototype: {
          save: jest.fn().mockImplementation(function() {
            return Promise.resolve(this);
          })
        }
      };
    }),
    Types: {
      ObjectId: jest.fn().mockImplementation(() => 'test-id')
    }
  };
});

// Mock Redis
jest.mock('redis', () => {
  return {
    createClient: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      sAdd: jest.fn().mockResolvedValue(1),
      geoAdd: jest.fn().mockResolvedValue(1)
    }))
  };
});

// Create a test logger that doesn't output during tests
const testLogger = winston.createLogger({
  level: 'error',
  silent: process.env.NODE_ENV === 'test',
  transports: [new winston.transports.Console()]
});

describe('Tracking API Integration Tests', () => {
  let app: any;
  let mockRedisClient: any;
  const testVehicleId = 'test-vehicle-id';
  
  // Mongoose types for test data  
  const testLocationData = {
    vehicleId: testVehicleId,
    location: {
      type: 'Point' as const,
      coordinates: [55.378, 3.436] 
    },
    speed: 60,
    heading: 180,
    altitude: 100,
    accuracy: 5,
    timestamp: new Date().toISOString(),
    metadata: {
      fuelLevel: 70,
      temperature: 25
    }
  };

  beforeAll(async () => {
    // Setup test server
    const server = createServer(testLogger);
    app = server.app;
    
    // Get the mock Redis client from the redis module
    mockRedisClient = (createClient as jest.Mock)();
    
    // Set Redis client in app.locals
    app.locals.redis = mockRedisClient;
  });

  describe('POST /api/tracking/location', () => {
    it('should record a new location', async () => {
      const newLocationData = {
        ...testLocationData,
        location: {
          type: 'Point',
          coordinates: [55.380, 3.438]
        },
        timestamp: new Date().toISOString()
      };
      
      const response = await request(app)
        .post('/api/tracking/location')
        .send(newLocationData);
      
      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toMatchObject({
        vehicleId: testVehicleId
      });
    });

    it('should return 400 for invalid data', async () => {
      // Missing required fields
      const invalidData = {
        vehicleId: testVehicleId
        // Missing location
      };
      
      const response = await request(app)
        .post('/api/tracking/location')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Missing required fields');
    });
  });

  describe('GET /api/tracking/vehicles/:vehicleId/location', () => {
    it('should get the latest location for a vehicle', async () => {
      const response = await request(app)
        .get(`/api/tracking/vehicles/${testVehicleId}/location`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.status).toBe('success');
      expect(response.body.data).toMatchObject({
        vehicleId: testVehicleId,
        location: {
          type: 'Point',
          coordinates: expect.arrayContaining([expect.any(Number), expect.any(Number)])
        }
      });
    });

    it('should return 404 for non-existent vehicle', async () => {
      // Mock findOne to return null for this test
      const originalFindOne = LocationData.findOne;
      (LocationData.findOne as jest.Mock).mockImplementationOnce(() => ({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null)
      }));
      
      const response = await request(app)
        .get(`/api/tracking/vehicles/non-existent-id/location`)
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('No location data found');
      
      // Restore the original implementation
      (LocationData.findOne as jest.Mock) = originalFindOne;
    });
  });

  describe('GET /api/tracking/vehicles/:vehicleId/history', () => {
    it('should get location history for a vehicle', async () => {
      const response = await request(app)
        .get(`/api/tracking/vehicles/${testVehicleId}/history`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0]).toMatchObject({
        vehicleId: testVehicleId,
        location: {
          type: 'Point',
          coordinates: expect.arrayContaining([expect.any(Number), expect.any(Number)])
        }
      });
    });

    it('should apply date range filters when provided', async () => {
      const startDate = new Date(Date.now() - 24 * 3600 * 1000).toISOString(); // 1 day ago
      const endDate = new Date().toISOString(); // now
      
      const response = await request(app)
        .get(`/api/tracking/vehicles/${testVehicleId}/history`)
        .query({ startDate, endDate, limit: 10 })
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/tracking/nearby', () => {
    it('should find vehicles near a location', async () => {
      const response = await request(app)
        .get('/api/tracking/nearby')
        .query({
          longitude: 55.378,
          latitude: 3.436,
          radius: 1000
        })
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
    
    it('should return 400 if longitude/latitude are missing', async () => {
      const response = await request(app)
        .get('/api/tracking/nearby')
        .query({ radius: '1000' }) // Missing longitude/latitude
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Longitude and latitude are required');
    });
  });
}); 