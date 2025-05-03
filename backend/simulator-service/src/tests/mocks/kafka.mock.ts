import { jest } from '@jest/globals';

// Mock Kafka producer
export const mockKafkaProducer = {
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  send: jest.fn().mockResolvedValue({ 
    topicName: 'test-topic',
    partition: 0,
    errorCode: 0 
  })
};

// Mock Kafka admin
export const mockKafkaAdmin = {
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  createTopics: jest.fn().mockResolvedValue(undefined),
  listTopics: jest.fn().mockResolvedValue(['test-topic'])
};

// Mock Kafka instance
export const mockKafka = {
  producer: jest.fn().mockReturnValue(mockKafkaProducer),
  admin: jest.fn().mockReturnValue(mockKafkaAdmin)
};

// Mock for kafkajs module
export const mockKafkaJs = {
  Kafka: jest.fn().mockImplementation(() => mockKafka)
};

// Utilities to reset mocks
export const resetKafkaMocks = () => {
  mockKafkaProducer.connect.mockClear();
  mockKafkaProducer.disconnect.mockClear();
  mockKafkaProducer.send.mockClear();
  mockKafkaAdmin.connect.mockClear();
  mockKafkaAdmin.disconnect.mockClear();
  mockKafkaAdmin.createTopics.mockClear();
  mockKafkaAdmin.listTopics.mockClear();
  mockKafka.producer.mockClear();
  mockKafka.admin.mockClear();
  mockKafkaJs.Kafka.mockClear();
};

// Mock for the kafka.service.ts file
export const setupKafkaProducer = jest.fn().mockResolvedValue(undefined);
export const publishLocationUpdate = jest.fn().mockResolvedValue(undefined);
export const publishStatusUpdate = jest.fn().mockResolvedValue(undefined);
export const publishMaintenanceEvent = jest.fn().mockResolvedValue(undefined);
export const publishTripEvent = jest.fn().mockResolvedValue(undefined);

export enum EventType {
  TRIP_START = 'TRIP_START',
  TRIP_END = 'TRIP_END'
} 