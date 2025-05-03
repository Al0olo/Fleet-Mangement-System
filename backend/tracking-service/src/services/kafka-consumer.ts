import { Consumer, Kafka, EachMessagePayload } from 'kafkajs';
import { LocationService } from './location-service';
import winston from 'winston';
import { RedisClientType } from 'redis';
import { ILocationData } from '../models/location-data';

/**
 * Service for consuming location events from Kafka
 */
export class KafkaConsumerService {
  private kafka: Kafka;
  private consumer: Consumer;
  private locationService: LocationService;
  private logger: winston.Logger;
  private isRunning = false;

  constructor(
    brokers: string[],
    clientId: string,
    groupId: string,
    logger: winston.Logger,
    redis: RedisClientType<any, any, any>
  ) {
    this.kafka = new Kafka({
      clientId,
      brokers,
    });

    this.consumer = this.kafka.consumer({ groupId });
    this.logger = logger;
    this.locationService = new LocationService(logger, redis);
  }

  /**
   * Start the Kafka consumer
   * @param topic The topic to subscribe to
   */
  async start(topic: string): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Kafka consumer is already running');
      return;
    }

    try {
      await this.consumer.connect();
      this.logger.info(`Kafka consumer connected to topic: ${topic}`);

      await this.consumer.subscribe({ topic, fromBeginning: false });
      
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.processMessage(payload);
        },
      });

      this.isRunning = true;
      this.logger.info('Kafka consumer started successfully');
    } catch (error) {
      this.logger.error(`Error starting Kafka consumer: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Stop the Kafka consumer gracefully
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      await this.consumer.disconnect();
      this.isRunning = false;
      this.logger.info('Kafka consumer stopped');
    } catch (error) {
      this.logger.error(`Error stopping Kafka consumer: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Process a message from Kafka
   * @param payload The Kafka message payload
   * @private
   */
  private async processMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;
    
    if (!message.value) {
      this.logger.warn(`Received empty message from ${topic}[${partition}]`);
      return;
    }

    try {
      const messageValue = message.value.toString();
      this.logger.debug(`Received message from ${topic}[${partition}]: ${messageValue}`);
      
      const locationData = JSON.parse(messageValue) as Partial<ILocationData>;
      
      // Validate basic message structure
      if (!locationData.vehicleId || !locationData.location || !locationData.location.coordinates) {
        this.logger.warn(`Invalid location data format: ${messageValue}`);
        return;
      }

      // Process the location update
      const savedLocation = await this.locationService.recordLocation(locationData);
      
      this.logger.info(`Processed location update for vehicle ${savedLocation.vehicleId}`);
    } catch (error) {
      if (error instanceof SyntaxError) {
        this.logger.error(`Invalid JSON in message: ${error.message}`);
      } else if (error instanceof Error) {
        this.logger.error(`Error processing message: ${error.message}`);
      } else {
        this.logger.error('Unknown error processing message');
      }
      
      // We don't rethrow the error to prevent the consumer from crashing
      // Instead, we'll continue processing the next message
    }
  }
} 