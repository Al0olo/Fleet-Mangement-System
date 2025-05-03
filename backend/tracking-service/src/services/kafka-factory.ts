import winston from 'winston';
import { RedisClientType } from 'redis';
import { KafkaConsumerService } from './kafka-consumer';

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
  const topic = process.env.KAFKA_TOPIC || 'vehicle-tracking';
  
  logger.info(`Initializing Kafka consumer with brokers: ${brokers.join(', ')}`);
  logger.info(`Kafka client ID: ${clientId}, group ID: ${groupId}, topic: ${topic}`);
  
  const consumer = new KafkaConsumerService(
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
        logger.info('Kafka consumer started successfully');
      } catch (error) {
        retries++;
        logger.error(`Failed to start Kafka consumer (attempt ${retries}/${maxRetries}): ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        if (retries < maxRetries) {
          logger.info(`Retrying in ${retryInterval / 1000} seconds...`);
          setTimeout(attemptStart, retryInterval);
        } else {
          logger.error(`Failed to start Kafka consumer after ${maxRetries} attempts`);
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
    logger.error(`Error in consumer startup: ${err instanceof Error ? err.message : 'Unknown error'}`);
  });
  
  return consumer;
}; 