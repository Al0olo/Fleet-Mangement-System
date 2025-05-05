import winston from 'winston';
import { RedisClientType } from 'redis';
import { KafkaConsumerService } from './kafka-consumer';
import { LocationKafkaConsumer } from './location-kafka-consumer';
import { StatusKafkaConsumer } from './status-kafka-consumer';
import { EventKafkaConsumer } from './event-kafka-consumer';

/**
 * Factory function to create a Kafka consumer for vehicle location events
 * @param logger Winston logger instance
 * @param redis Redis client
 */
export const createLocationConsumer = (
  logger: winston.Logger,
  redis: RedisClientType<any, any, any>
): KafkaConsumerService => {
  const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
  const clientId = process.env.KAFKA_CLIENT_ID || 'tracking-service';
  const groupId = process.env.KAFKA_GROUP_ID || 'tracking-group';
  const topic = process.env.KAFKA_LOCATION_TOPIC || 'vehicle-location';
  
  logger.info(`Initializing Location Kafka consumer with brokers: ${brokers.join(', ')}`);
  logger.info(`Kafka client ID: ${clientId}, group ID: ${groupId}, topic: ${topic}`);
  
  const consumer = new LocationKafkaConsumer(
    brokers,
    clientId,
    groupId,
    logger,
    redis
  );
  
  // Set up start attempt with retries
  const startConsumerWithRetries = async (
    maxRetries = 5,
    retryInterval = 10000
  ): Promise<void> => {
    let retries = 0;
    
    const attemptStart = async (): Promise<void> => {
      try {
        await consumer.start(topic);
        logger.info('Location Kafka consumer started successfully');
      } catch (error) {
        retries++;
        logger.error(`Failed to start Location Kafka consumer (attempt ${retries}/${maxRetries}): ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        if (retries < maxRetries) {
          logger.info(`Retrying in ${retryInterval / 1000} seconds...`);
          setTimeout(attemptStart, retryInterval);
        } else {
          logger.error(`Failed to start Location Kafka consumer after ${maxRetries} attempts`);
          // Don't crash the application, just warn that the Kafka consumer is not available
        }
      }
    };
    
    // Start the first attempt
    await attemptStart();
  };
  
  // Register process shutdown handlers
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal received, shutting down Kafka consumer');
    await consumer.stop();
  });
  
  process.on('SIGINT', async () => {
    logger.info('SIGINT signal received, shutting down Kafka consumer');
    await consumer.stop();
  });
  
  // Start the consumer with retries (but don't await it to avoid blocking server startup)
  startConsumerWithRetries().catch(err => {
    logger.error(`Error in location consumer startup: ${err instanceof Error ? err.message : 'Unknown error'}`);
  });
  
  return consumer;
};

/**
 * Factory function to create a Kafka consumer for vehicle status events
 * @param logger Winston logger instance
 * @param redis Redis client
 */
export const createStatusConsumer = (
  logger: winston.Logger,
  redis: RedisClientType<any, any, any>
): KafkaConsumerService => {
  const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
  const clientId = process.env.KAFKA_CLIENT_ID || 'tracking-service';
  const groupId = `${process.env.KAFKA_GROUP_ID || 'tracking-group'}-status`;
  const topic = process.env.KAFKA_STATUS_TOPIC || 'vehicle-status';
  
  logger.info(`Initializing Status Kafka consumer with brokers: ${brokers.join(', ')}`);
  logger.info(`Kafka client ID: ${clientId}, group ID: ${groupId}, topic: ${topic}`);
  
  const consumer = new StatusKafkaConsumer(
    brokers,
    clientId,
    groupId,
    logger,
    redis
  );
  
  // Set up start attempt with retries
  const startConsumerWithRetries = async (
    maxRetries = 5,
    retryInterval = 10000
  ): Promise<void> => {
    let retries = 0;
    
    const attemptStart = async (): Promise<void> => {
      try {
        await consumer.start(topic);
        logger.info('Status Kafka consumer started successfully');
      } catch (error) {
        retries++;
        logger.error(`Failed to start Status Kafka consumer (attempt ${retries}/${maxRetries}): ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        if (retries < maxRetries) {
          logger.info(`Retrying in ${retryInterval / 1000} seconds...`);
          setTimeout(attemptStart, retryInterval);
        } else {
          logger.error(`Failed to start Status Kafka consumer after ${maxRetries} attempts`);
        }
      }
    };
    
    // Start the first attempt
    await attemptStart();
  };
  
  // Start the consumer with retries (but don't await it to avoid blocking server startup)
  startConsumerWithRetries().catch(err => {
    logger.error(`Error in status consumer startup: ${err instanceof Error ? err.message : 'Unknown error'}`);
  });
  
  return consumer;
};

/**
 * Factory function to create a Kafka consumer for vehicle event events
 * @param logger Winston logger instance
 * @param redis Redis client
 */
export const createEventConsumer = (
  logger: winston.Logger,
  redis: RedisClientType<any, any, any>
): KafkaConsumerService => {
  const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
  const clientId = process.env.KAFKA_CLIENT_ID || 'tracking-service';
  const groupId = `${process.env.KAFKA_GROUP_ID || 'tracking-group'}-event`;
  const topic = process.env.KAFKA_EVENT_TOPIC || 'vehicle-event';
  
  logger.info(`Initializing Event Kafka consumer with brokers: ${brokers.join(', ')}`);
  logger.info(`Kafka client ID: ${clientId}, group ID: ${groupId}, topic: ${topic}`);
  
  const consumer = new EventKafkaConsumer(
    brokers,
    clientId,
    groupId,
    logger,
    redis
  );
  
  // Set up start attempt with retries
  const startConsumerWithRetries = async (
    maxRetries = 5,
    retryInterval = 10000
  ): Promise<void> => {
    let retries = 0;
    
    const attemptStart = async (): Promise<void> => {
      try {
        await consumer.start(topic);
        logger.info('Event Kafka consumer started successfully');
      } catch (error) {
        retries++;
        logger.error(`Failed to start Event Kafka consumer (attempt ${retries}/${maxRetries}): ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        if (retries < maxRetries) {
          logger.info(`Retrying in ${retryInterval / 1000} seconds...`);
          setTimeout(attemptStart, retryInterval);
        } else {
          logger.error(`Failed to start Event Kafka consumer after ${maxRetries} attempts`);
        }
      }
    };
    
    // Start the first attempt
    await attemptStart();
  };
  
  // Start the consumer with retries (but don't await it to avoid blocking server startup)
  startConsumerWithRetries().catch(err => {
    logger.error(`Error in event consumer startup: ${err instanceof Error ? err.message : 'Unknown error'}`);
  });
  
  return consumer;
}; 