import { jest } from '@jest/globals';
import * as kafkaService from '../../../services/kafka.service';
import { config } from '../../../config';

// Need to access private module properties
const originalModule = { ...kafkaService };

// Mock the kafkajs library
jest.mock('kafkajs', () => {
  const mockSend = jest.fn().mockResolvedValue({ 
    topicName: 'test-topic',
    partition: 0,
    errorCode: 0 
  });
  
  const mockConnect = jest.fn().mockResolvedValue(undefined);
  const mockDisconnect = jest.fn().mockResolvedValue(undefined);
  
  const mockProducer = {
    connect: mockConnect,
    disconnect: mockDisconnect,
    send: mockSend
  };
  
  return {
    Kafka: jest.fn().mockImplementation(() => ({
      producer: jest.fn().mockReturnValue(mockProducer)
    }))
  };
});

// Create a mock producer and expose it directly
const mockProducer = (new (require('kafkajs').Kafka)()).producer();

describe('Kafka Service', () => {
  beforeAll(() => {
    // Call setupKafkaProducer to initialize correctly
    return kafkaService.setupKafkaProducer();
  });
  
  beforeEach(() => {
    jest.clearAllMocks();

    // Manually inject our mock producer into the module
    jest.spyOn(kafkaService, 'setupKafkaProducer').mockImplementation(async () => {
      // @ts-ignore: Accessing private property
      (kafkaService as any).producer = mockProducer;
    });
    
    // Call setup again to ensure the mock is injected
    return kafkaService.setupKafkaProducer();
  });
  
  afterAll(() => {
    // Restore original module
    Object.assign(kafkaService, originalModule);
  });
  
  describe('publishLocationUpdate', () => {
    it('should publish vehicle location update to Kafka', async () => {
      // Arrange
      const vehicleId = 'vehicle123';
      const latitude = 40.7;
      const longitude = -74.0;
      const speed = 50;
      const heading = 90;
      
      // Act
      await kafkaService.publishLocationUpdate(vehicleId, latitude, longitude, speed, heading);
      
      // Assert
      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: config.kafka.topics.vehicleLocation,
        messages: [
          {
            key: vehicleId,
            value: expect.stringContaining(vehicleId)
          }
        ]
      });
      
      // Verify the message content
      const call = mockProducer.send.mock.calls[0][0];
      const message = JSON.parse(call.messages[0].value);
      
      expect(message).toMatchObject({
        vehicleId,
        speed,
        heading,
        location: {
          type: 'Point',
          coordinates: [longitude, latitude]
        }
      });
    });
  });
  
  describe('publishStatusUpdate', () => {
    it('should publish vehicle status update to Kafka', async () => {
      // Arrange
      const vehicleId = 'vehicle123';
      const status = 'RUNNING';
      
      // Act
      await kafkaService.publishStatusUpdate(vehicleId, status);
      
      // Assert
      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: config.kafka.topics.vehicleStatus,
        messages: [
          {
            key: vehicleId,
            value: expect.stringContaining(vehicleId)
          }
        ]
      });
      
      // Verify the message content
      const call = mockProducer.send.mock.calls[0][0];
      const message = JSON.parse(call.messages[0].value);
      
      expect(message).toMatchObject({
        vehicleId,
        status
      });
    });
  });
  
  describe('publishMaintenanceEvent', () => {
    it('should publish vehicle maintenance event to Kafka', async () => {
      // Arrange
      const vehicleId = 'vehicle123';
      const reason = 'Maintenance required';
      const timestamp = new Date();
      
      // Act
      await kafkaService.publishMaintenanceEvent(vehicleId, reason, timestamp);
      
      // Assert
      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: config.kafka.topics.vehicleEvent,
        messages: [
          {
            key: vehicleId,
            value: expect.stringContaining(vehicleId)
          }
        ]
      });
      
      // Verify the message content
      const call = mockProducer.send.mock.calls[0][0];
      const message = JSON.parse(call.messages[0].value);
      
      expect(message).toMatchObject({
        vehicleId,
        reason,
        timestamp: timestamp.toISOString()
      });
    });
  });
  
  describe('publishTripEvent', () => {
    it('should publish trip start event to Kafka', async () => {
      // Arrange
      const vehicleId = 'vehicle123';
      const tripId = 'trip123';
      const eventType = kafkaService.EventType.TRIP_START;
      
      // Act
      await kafkaService.publishTripEvent(vehicleId, tripId, eventType);
      
      // Assert
      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: config.kafka.topics.vehicleEvent,
        messages: [
          {
            key: vehicleId,
            value: expect.stringContaining(vehicleId)
          }
        ]
      });
      
      // Verify the message content
      const call = mockProducer.send.mock.calls[0][0];
      const message = JSON.parse(call.messages[0].value);
      
      expect(message).toMatchObject({
        vehicleId,
        tripId
      });
    });
    
    it('should publish trip end event to Kafka', async () => {
      // Arrange
      const vehicleId = 'vehicle123';
      const tripId = 'trip123';
      const eventType = kafkaService.EventType.TRIP_END;
      
      // Act
      await kafkaService.publishTripEvent(vehicleId, tripId, eventType);
      
      // Assert
      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: config.kafka.topics.vehicleEvent,
        messages: [
          {
            key: vehicleId,
            value: expect.stringContaining(vehicleId)
          }
        ]
      });
      
      // Verify the message content
      const call = mockProducer.send.mock.calls[0][0];
      const message = JSON.parse(call.messages[0].value);
      
      expect(message).toMatchObject({
        vehicleId,
        tripId
      });
    });
  });
}); 