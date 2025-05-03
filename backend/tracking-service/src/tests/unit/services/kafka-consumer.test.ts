import { KafkaConsumerService } from '../../../services/kafka-consumer';
import { LocationKafkaConsumer } from '../../../services/location-kafka-consumer';
import { LocationService } from '../../../services/location-service';
import { jest } from '@jest/globals';
import winston from 'winston';

// Mock dependencies before any imports
jest.mock('kafkajs', () => {
  // Create mock functions for Kafka
  const mockConsumerRun = jest.fn().mockImplementation(({ eachMessage }) => {
    // Store the message handler for later use in tests
    mockConsumerRun.eachMessage = eachMessage;
    return Promise.resolve();
  });
  
  const mockConsumer = {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockResolvedValue(undefined),
    run: mockConsumerRun
  };
  
  const mockKafka = {
    consumer: jest.fn().mockReturnValue(mockConsumer)
  };
  
  return {
    Kafka: jest.fn().mockImplementation(() => mockKafka),
    mockConsumer, // Export these for direct access in tests
    mockKafka
  };
});

// Mock the location service
jest.mock('../../../services/location-service');

// Import the mocked modules
const kafkajs = jest.requireMock('kafkajs');
const mockConsumer = kafkajs.mockConsumer;

describe('KafkaConsumerService', () => {
  // Mock dependencies
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  } as unknown as winston.Logger;

  const mockRedis = {} as any;

  let kafkaConsumerService: LocationKafkaConsumer;
  let mockLocationService: jest.Mocked<LocationService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a new instance for each test
    kafkaConsumerService = new LocationKafkaConsumer(
      ['localhost:9092'],
      'test-client',
      'test-group',
      mockLogger,
      mockRedis
    );
    
    // Get the mocked location service instance
    mockLocationService = (LocationService as jest.MockedClass<typeof LocationService>).mock.instances[0] as jest.Mocked<LocationService>;
    mockLocationService.recordLocation = jest.fn().mockResolvedValue({} as any);
  });

  describe('start', () => {
    it('should connect to Kafka and subscribe to the topic', async () => {
      await kafkaConsumerService.start('test-topic');
      
      expect(mockConsumer.connect).toHaveBeenCalled();
      expect(mockConsumer.subscribe).toHaveBeenCalledWith({ topic: 'test-topic', fromBeginning: false });
      expect(mockConsumer.run).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Kafka consumer connected'));
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('started successfully'));
    });

    it('should not restart if already running', async () => {
      // Start once
      await kafkaConsumerService.start('test-topic');
      jest.clearAllMocks();
      
      // Try to start again
      await kafkaConsumerService.start('test-topic');
      
      expect(mockConsumer.connect).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('already running'));
    });

    it('should handle connection errors', async () => {
      // Mock an error for this test only
      const errorMsg = 'Connection error';
      mockConsumer.connect.mockRejectedValueOnce(new Error(errorMsg));
      
      await expect(kafkaConsumerService.start('test-topic')).rejects.toThrow(errorMsg);
      
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining(errorMsg));
    });
  });

  describe('stop', () => {
    it('should disconnect from Kafka if running', async () => {
      // First start the consumer
      await kafkaConsumerService.start('test-topic');
      jest.clearAllMocks();
      
      // Then stop it
      await kafkaConsumerService.stop();
      
      expect(mockConsumer.disconnect).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('stopped'));
    });

    it('should do nothing if not running', async () => {
      await kafkaConsumerService.stop();
      
      expect(mockConsumer.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('processMessage', () => {
    // Helper to create a mock message payload
    const createMockPayload = (value: any) => ({
      topic: 'test-topic',
      partition: 0,
      message: {
        value: Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)),
        key: Buffer.from('test-key'),
        timestamp: '12345',
        attributes: 0,
        offset: '0'
      }
    });

    it('should process a valid location message', async () => {
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
      
      // Start the consumer to initialize
      await kafkaConsumerService.start('test-topic');
      
      // Directly access the private method using type assertion
      await (kafkaConsumerService as any).processMessage(createMockPayload(locationData));
      
      expect(mockLocationService.recordLocation).toHaveBeenCalledWith(expect.objectContaining({
        vehicleId: locationData.vehicleId,
        location: locationData.location
      }));
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Processed location update'));
    });

    it('should handle empty messages', async () => {
      // Create a payload with no value
      const payload = {
        topic: 'test-topic',
        partition: 0,
        message: { value: null } as any
      };
      
      // Directly call the process method
      await (kafkaConsumerService as any).processMessage(payload);
      
      expect(mockLocationService.recordLocation).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Received empty message'));
    });

    it('should handle invalid JSON', async () => {
      // Create a payload with invalid JSON
      await (kafkaConsumerService as any).processMessage(createMockPayload('not-json'));
      
      expect(mockLocationService.recordLocation).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Invalid JSON'));
    });

    it('should validate required fields', async () => {
      // Create payloads with missing required fields
      const missingVehicleId = {
        location: {
          type: 'Point',
          coordinates: [55.378, 3.436]
        }
      };
      
      await (kafkaConsumerService as any).processMessage(createMockPayload(missingVehicleId));
      
      expect(mockLocationService.recordLocation).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Invalid location data format'));
    });

    it('should handle errors during processing', async () => {
      // Set up test data
      const locationData = {
        vehicleId: 'test-vehicle',
        location: {
          type: 'Point',
          coordinates: [55.378, 3.436]
        }
      };
      
      // Mock the locationService to throw an error
      const errorMsg = 'Processing error';
      mockLocationService.recordLocation.mockRejectedValueOnce(new Error(errorMsg));
      
      await (kafkaConsumerService as any).processMessage(createMockPayload(locationData));
      
      expect(mockLocationService.recordLocation).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining(errorMsg));
    });
  });
}); 