import { EachMessagePayload } from 'kafkajs';
import { KafkaConsumerService } from './kafka-consumer';
import { LocationService } from './location-service';
import winston from 'winston';
import { RedisClientType } from 'redis';
import { ILocationData } from '../models/location-data';

/**
 * Specialized Kafka consumer for location data
 */
export class LocationKafkaConsumer extends KafkaConsumerService {
  private locationService: LocationService;

  constructor(
    brokers: string[],
    clientId: string,
    groupId: string,
    logger: winston.Logger,
    redis: RedisClientType<any, any, any>
  ) {
    super(brokers, clientId, groupId, logger);
    this.locationService = new LocationService(logger, redis);
  }

  /**
   * Process a message from Kafka
   * @param payload The Kafka message payload
   * @protected
   */
  protected async processMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;
    
    if (!message.value) {
      this.logger.warn(`Received empty message from ${topic}[${partition}]`);
      return;
    }

    try {
      const messageValue = message.value.toString();
      this.logger.debug(`Received location message from ${topic}[${partition}]: ${messageValue}`);
      
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
        this.logger.error(`Error processing location message: ${error.message}`);
      } else {
        this.logger.error('Unknown error processing location message');
      }
      
      // We don't rethrow the error to prevent the consumer from crashing
      // Instead, we'll continue processing the next message
    }
  }
} 