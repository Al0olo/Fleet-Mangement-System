import { KafkaConsumerService } from '../../../services/kafka-consumer';
import { LocationService } from '../../../services/location-service';
import mongoose from 'mongoose';
import { Kafka } from 'kafkajs';
import { jest } from '@jest/globals';
import winston from 'winston';

// Mock mongoose
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
  
  return {
    ...mongoose,
    connect: jest.fn().mockResolvedValue({}),
    Schema: mockSchema,
    model: jest.fn().mockImplementation(() => ({
      findOne: jest.fn(),
      find: jest.fn(),
      aggregate: jest.fn(),
      prototype: {
        save: jest.fn()
      }
    })),
    Types: {
      ObjectId: jest.fn().mockImplementation(() => 'test-id')
    }
  };
});

// Mock redis
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

// Mock location-service
jest.mock('../../../services/location-service');

// Create a test logger
const testLogger = winston.createLogger({
  level: 'error',
  silent: process.env.NODE_ENV === 'test',
  transports: [new winston.transports.Console()]
});

// Skip real Kafka connection tests
describe.skip('Kafka Real Integration Tests (disabled)', () => {
  // This test is skipped because it requires a real Kafka connection
});

describe('Kafka Consumer Integration Tests (with mocks)', () => {
  // Mock the Kafka library
  let mockConsumer: any;
  let mockProducer: any;
  let kafkaConsumer: KafkaConsumerService;
  let mockLocationService: jest.Mocked<LocationService>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock Kafka consumer
    mockConsumer = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn().mockResolvedValue(undefined),
      run: jest.fn().mockImplementation(({ eachMessage }) => {
        // Store the message handler for later use
        mockConsumer.eachMessage = eachMessage;
        return Promise.resolve();
      })
    };
    
    // Create mock Kafka producer
    mockProducer = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      send: jest.fn().mockResolvedValue(undefined)
    };
    
    // Mock Kafka
    jest.spyOn(Kafka.prototype, 'consumer').mockImplementation(() => mockConsumer);
    jest.spyOn(Kafka.prototype, 'producer').mockImplementation(() => mockProducer);
    
    // Create the consumer service with mocks
    const mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      sAdd: jest.fn().mockResolvedValue(1),
      geoAdd: jest.fn().mockResolvedValue(1)
    } as any;
    
    kafkaConsumer = new KafkaConsumerService(
      ['localhost:9092'],
      'test-client',
      'test-group',
      testLogger,
      mockRedis
    );
    
    // Get the mocked location service
    mockLocationService = (LocationService as jest.MockedClass<typeof LocationService>).mock.instances[0] as jest.Mocked<LocationService>;
    mockLocationService.recordLocation = jest.fn().mockResolvedValue({} as any);
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  it('should start the Kafka consumer', async () => {
    await kafkaConsumer.start('test-topic');
    
    expect(mockConsumer.connect).toHaveBeenCalled();
    expect(mockConsumer.subscribe).toHaveBeenCalledWith({ topic: 'test-topic', fromBeginning: false });
    expect(mockConsumer.run).toHaveBeenCalled();
  });
  
  it('should stop the Kafka consumer', async () => {
    await kafkaConsumer.start('test-topic');
    await kafkaConsumer.stop();
    
    expect(mockConsumer.disconnect).toHaveBeenCalled();
  });
  
  it('should process location updates from Kafka', async () => {
    // Start the consumer
    await kafkaConsumer.start('test-topic');
    
    // Create a test vehicle ID
    const vehicleId = 'test-vehicle-id';
    
    // Prepare test message
    const locationData = {
      vehicleId,
      location: {
        type: 'Point',
        coordinates: [55.378, 3.436]
      },
      speed: 60,
      heading: 180,
      timestamp: new Date().toISOString()
    };
    
    // Create a mock message payload
    const mockPayload = {
      topic: 'test-topic',
      partition: 0,
      message: {
        value: Buffer.from(JSON.stringify(locationData)),
        key: Buffer.from(vehicleId),
        timestamp: Date.now().toString(),
        attributes: 0,
        offset: '0'
      }
    };
    
    // Manually trigger the message handler
    await mockConsumer.eachMessage(mockPayload);
    
    // Verify location service was called with the message data
    expect(mockLocationService.recordLocation).toHaveBeenCalledWith(
      expect.objectContaining({
        vehicleId,
        location: {
          type: 'Point',
          coordinates: [55.378, 3.436]
        }
      })
    );
  });
  
  it('should handle invalid messages', async () => {
    // Start the consumer
    await kafkaConsumer.start('test-topic');
    
    // Create an invalid message payload
    const mockPayload = {
      topic: 'test-topic',
      partition: 0,
      message: {
        value: Buffer.from('not-valid-json'),
        key: Buffer.from('test-key'),
        timestamp: Date.now().toString(),
        attributes: 0,
        offset: '0'
      }
    };
    
    // Manually trigger the message handler
    await mockConsumer.eachMessage(mockPayload);
    
    // Verify location service was not called
    expect(mockLocationService.recordLocation).not.toHaveBeenCalled();
  });
  
  it('should handle messages with missing required fields', async () => {
    // Start the consumer
    await kafkaConsumer.start('test-topic');
    
    // Message missing required fields
    const invalidData = {
      // missing vehicleId
      location: {
        type: 'Point',
        coordinates: [55.378, 3.436]
      }
    };
    
    // Create a mock message payload
    const mockPayload = {
      topic: 'test-topic',
      partition: 0,
      message: {
        value: Buffer.from(JSON.stringify(invalidData)),
        key: Buffer.from('test-key'),
        timestamp: Date.now().toString(),
        attributes: 0,
        offset: '0'
      }
    };
    
    // Manually trigger the message handler
    await mockConsumer.eachMessage(mockPayload);
    
    // Verify location service was not called
    expect(mockLocationService.recordLocation).not.toHaveBeenCalled();
  });
}); 