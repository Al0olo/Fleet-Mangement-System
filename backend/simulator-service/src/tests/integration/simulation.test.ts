// Set NODE_ENV to 'test' before importing the app
process.env.NODE_ENV = 'test';

// Import libraries
import { jest } from '@jest/globals';
import supertest from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../server';

// Mock Kafka service
jest.mock('../../services/kafka.service', () => ({
  setupKafkaProducer: jest.fn().mockResolvedValue(undefined),
  publishLocationUpdate: jest.fn().mockResolvedValue(undefined),
  publishStatusUpdate: jest.fn().mockResolvedValue(undefined),
  publishMaintenanceEvent: jest.fn().mockResolvedValue(undefined),
  publishTripEvent: jest.fn().mockResolvedValue(undefined),
  EventType: {
    TRIP_START: 'TRIP_START',
    TRIP_END: 'TRIP_END'
  }
}));

// Mock mongoose to prevent actual database connections
jest.mock('mongoose', () => {
  const originalModule = jest.requireActual('mongoose');
  
  return {
    ...originalModule,
    connect: jest.fn().mockResolvedValue(undefined),
    connection: {
      ...originalModule.connection,
      readyState: 1, // Connected
      dropDatabase: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined)
    }
  };
});

// Get a supertest instance
const request = supertest(app);

// Basic integration test
describe('Simulation API Integration Tests', () => {
  // Use a lower timeout
  jest.setTimeout(5000);
  
  beforeAll(async () => {
    console.log('Starting integration tests');
  });

  afterAll(async () => {
    console.log('Integration tests completed');
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  // Just a simple test to make sure things are working
  it('should respond with a 501 status for unimplemented endpoints', async () => {
    // Make a request to a route that should use our ensureController wrapper
    const response = await request.get('/api/simulator/vehicles');
    
    // This should return our fallback response
    expect(response.status).toBe(501);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Controller not implemented');
  });
}); 