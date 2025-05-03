import { Kafka, Producer } from 'kafkajs';
import { config } from '../config';
import { logger } from '../util/logger';
import { VehicleStatus } from '../models/vehicle.model';

// Event types
export enum EventType {
  LOCATION_UPDATE = 'LOCATION_UPDATE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  TRIP_START = 'TRIP_START',
  TRIP_END = 'TRIP_END',
  MAINTENANCE_REQUIRED = 'MAINTENANCE_REQUIRED'
}

// Initialize Kafka client
const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: config.kafka.brokers
});

// Producer instance
let producer: Producer;

/**
 * Set up the Kafka producer
 */
export const setupKafkaProducer = async (): Promise<void> => {
  try {
    producer = kafka.producer();
    await producer.connect();
    logger.info('Connected to Kafka producer');
  } catch (error) {
    logger.error('Failed to connect to Kafka producer', error);
    throw error;
  }
};

/**
 * Publish a location update event to Kafka
 */
export const publishLocationUpdate = async (
  vehicleId: string,
  latitude: number, 
  longitude: number,
  speed: number,
  heading: number,
  timestamp: Date = new Date()
): Promise<void> => {
  if (!producer) {
    throw new Error('Kafka producer not initialized');
  }

  const message = {
    vehicleId,
    location: {
      type: 'Point',
      coordinates: [longitude, latitude]
    },
    speed,
    heading,
    timestamp: timestamp.toISOString(),
    eventType: EventType.LOCATION_UPDATE
  };

  try {
    await producer.send({
      topic: config.kafka.topics.vehicleLocation,
      messages: [
        { 
          key: vehicleId,
          value: JSON.stringify(message)
        }
      ]
    });
    logger.debug(`Published location update for vehicle ${vehicleId}`);
  } catch (error) {
    logger.error(`Failed to publish location update for vehicle ${vehicleId}`, error);
    throw error;
  }
};

/**
 * Publish a vehicle status change event to Kafka
 */
export const publishStatusUpdate = async (
  vehicleId: string,
  status: VehicleStatus,
  timestamp: Date = new Date()
): Promise<void> => {
  if (!producer) {
    throw new Error('Kafka producer not initialized');
  }

  const message = {
    vehicleId,
    status,
    timestamp: timestamp.toISOString(),
    eventType: EventType.STATUS_CHANGE
  };

  try {
    await producer.send({
      topic: config.kafka.topics.vehicleStatus,
      messages: [
        { 
          key: vehicleId,
          value: JSON.stringify(message)
        }
      ]
    });
    logger.debug(`Published status update for vehicle ${vehicleId}: ${status}`);
  } catch (error) {
    logger.error(`Failed to publish status update for vehicle ${vehicleId}`, error);
    throw error;
  }
};

/**
 * Publish a trip event to Kafka
 */
export const publishTripEvent = async (
  vehicleId: string,
  tripId: string,
  eventType: EventType.TRIP_START | EventType.TRIP_END,
  timestamp: Date = new Date()
): Promise<void> => {
  if (!producer) {
    throw new Error('Kafka producer not initialized');
  }

  const message = {
    vehicleId,
    tripId,
    timestamp: timestamp.toISOString(),
    eventType
  };

  try {
    await producer.send({
      topic: config.kafka.topics.vehicleEvent,
      messages: [
        { 
          key: vehicleId,
          value: JSON.stringify(message)
        }
      ]
    });
    logger.debug(`Published trip event for vehicle ${vehicleId}: ${eventType}`);
  } catch (error) {
    logger.error(`Failed to publish trip event for vehicle ${vehicleId}`, error);
    throw error;
  }
};

/**
 * Publish a maintenance required event to Kafka
 */
export const publishMaintenanceEvent = async (
  vehicleId: string,
  reason: string,
  timestamp: Date = new Date()
): Promise<void> => {
  if (!producer) {
    throw new Error('Kafka producer not initialized');
  }

  const message = {
    vehicleId,
    reason,
    timestamp: timestamp.toISOString(),
    eventType: EventType.MAINTENANCE_REQUIRED
  };

  try {
    await producer.send({
      topic: config.kafka.topics.vehicleEvent,
      messages: [
        { 
          key: vehicleId,
          value: JSON.stringify(message)
        }
      ]
    });
    logger.debug(`Published maintenance event for vehicle ${vehicleId}`);
  } catch (error) {
    logger.error(`Failed to publish maintenance event for vehicle ${vehicleId}`, error);
    throw error;
  }
}; 