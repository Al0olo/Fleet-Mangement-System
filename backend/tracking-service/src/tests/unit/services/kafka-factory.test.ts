import * as kafkaFactory from '../../../services/kafka-factory';
import { LocationKafkaConsumer } from '../../../services/location-kafka-consumer';
import { StatusKafkaConsumer } from '../../../services/status-kafka-consumer';
import { EventKafkaConsumer } from '../../../services/event-kafka-consumer';
import { jest } from '@jest/globals';
import winston from 'winston';

// Mock the Kafka consumer classes
jest.mock('../../../services/location-kafka-consumer', () => {
  return {
    LocationKafkaConsumer: jest.fn().mockImplementation(() => ({
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined)
    }))
  };
});

jest.mock('../../../services/status-kafka-consumer', () => {
  return {
    StatusKafkaConsumer: jest.fn().mockImplementation(() => ({
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined)
    }))
  };
});

jest.mock('../../../services/event-kafka-consumer', () => {
  return {
    EventKafkaConsumer: jest.fn().mockImplementation(() => ({
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined)
    }))
  };
});

// Mock environment variables
const originalEnv = process.env;

describe('Kafka Factory', () => {
  // Mock logger
  const mockLogger = {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  } as unknown as winston.Logger;
  
  // Mock Redis client
  const mockRedisClient = {
    get: jest.fn(),
    set: jest.fn(),
    sAdd: jest.fn(),
    geoAdd: jest.fn()
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock environment variables for each test
    process.env = { 
      ...originalEnv,
      KAFKA_BROKERS: 'kafka:9092',
      KAFKA_CLIENT_ID: 'test-client',
      KAFKA_GROUP_ID: 'test-group',
      KAFKA_LOCATION_TOPIC: 'test-location-topic',
      KAFKA_STATUS_TOPIC: 'test-status-topic',
      KAFKA_EVENT_TOPIC: 'test-event-topic'
    };
  });
  
  afterEach(() => {
    // Restore process.env
    process.env = originalEnv;
  });
  
  it('should create a location consumer with environment variable configuration', () => {
    // Call the factory function
    const consumer = kafkaFactory.createLocationConsumer(mockLogger, mockRedisClient as any);
    
    // Verify the correct class was instantiated with the right parameters
    expect(LocationKafkaConsumer).toHaveBeenCalledWith(
      ['kafka:9092'],
      'test-client',
      'test-group',
      mockLogger,
      mockRedisClient
    );
    
    expect(consumer).toBeDefined();
  });
  
  it('should use default values when environment variables are not set', () => {
    // Remove environment variables to test defaults
    delete process.env.KAFKA_BROKERS;
    delete process.env.KAFKA_CLIENT_ID;
    delete process.env.KAFKA_GROUP_ID;
    
    // Call the factory function
    const consumer = kafkaFactory.createLocationConsumer(mockLogger, mockRedisClient as any);
    
    // Verify KafkaConsumerService was created with default values
    expect(LocationKafkaConsumer).toHaveBeenCalledWith(
      ['localhost:9092'], // Default broker
      'tracking-service', // Default client ID
      'tracking-group', // Default group ID
      mockLogger,
      mockRedisClient
    );
    
    expect(consumer).toBeDefined();
  });
  
  it('should handle multiple brokers in the environment variable', () => {
    // Set multiple brokers
    process.env.KAFKA_BROKERS = 'kafka1:9092,kafka2:9092,kafka3:9092';
    
    // Call the factory function
    const consumer = kafkaFactory.createLocationConsumer(mockLogger, mockRedisClient as any);
    
    // Verify KafkaConsumerService was created with the array of brokers
    expect(LocationKafkaConsumer).toHaveBeenCalledWith(
      ['kafka1:9092', 'kafka2:9092', 'kafka3:9092'],
      'test-client',
      'test-group',
      mockLogger,
      mockRedisClient
    );
    
    expect(consumer).toBeDefined();
  });

  it('should create a status consumer with correct group ID suffix', () => {
    // Call the factory function
    const consumer = kafkaFactory.createStatusConsumer(mockLogger, mockRedisClient as any);
    
    // Verify the status consumer was created with the correct group ID suffix
    expect(StatusKafkaConsumer).toHaveBeenCalledWith(
      ['kafka:9092'],
      'test-client',
      'test-group-status',
      mockLogger,
      mockRedisClient
    );
    
    expect(consumer).toBeDefined();
  });

  it('should create an event consumer with correct group ID suffix', () => {
    // Call the factory function
    const consumer = kafkaFactory.createEventConsumer(mockLogger, mockRedisClient as any);
    
    // Verify the event consumer was created with the correct group ID suffix
    expect(EventKafkaConsumer).toHaveBeenCalledWith(
      ['kafka:9092'],
      'test-client',
      'test-group-event',
      mockLogger,
      mockRedisClient
    );
    
    expect(consumer).toBeDefined();
  });
}); 