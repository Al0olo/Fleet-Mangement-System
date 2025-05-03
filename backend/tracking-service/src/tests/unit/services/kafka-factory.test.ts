import * as kafkaFactory from '../../../services/kafka-factory';
import { KafkaConsumerService } from '../../../services/kafka-consumer';
import { jest } from '@jest/globals';
import winston from 'winston';

// Mock KafkaConsumerService
jest.mock('../../../services/kafka-consumer', () => {
  return {
    KafkaConsumerService: jest.fn().mockImplementation(() => ({
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
      KAFKA_GROUP_ID: 'test-group'
    };
  });
  
  afterEach(() => {
    // Restore process.env
    process.env = originalEnv;
  });
  
  it('should create a location consumer with environment variable configuration', () => {
    // Call the factory function
    const consumer = kafkaFactory.createLocationConsumer(mockLogger, mockRedisClient as any);
    
    // Verify KafkaConsumerService was created correctly
    expect(KafkaConsumerService).toHaveBeenCalledWith(
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
    expect(KafkaConsumerService).toHaveBeenCalledWith(
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
    expect(KafkaConsumerService).toHaveBeenCalledWith(
      ['kafka1:9092', 'kafka2:9092', 'kafka3:9092'],
      'test-client',
      'test-group',
      mockLogger,
      mockRedisClient
    );
    
    expect(consumer).toBeDefined();
  });
}); 