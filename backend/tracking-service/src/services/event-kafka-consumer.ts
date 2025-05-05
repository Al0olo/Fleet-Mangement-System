import { EachMessagePayload } from 'kafkajs';
import { KafkaConsumerService } from './kafka-consumer';
import { EventService } from './event-service';
import winston from 'winston';
import { RedisClientType } from 'redis';
import { IVehicleEvent } from '../models/vehicle-event';

/**
 * Specialized Kafka consumer for vehicle event data
 */
export class EventKafkaConsumer extends KafkaConsumerService {
  private eventService: EventService;

  constructor(
    brokers: string[],
    clientId: string,
    groupId: string,
    logger: winston.Logger,
    redis: RedisClientType<any, any, any>
  ) {
    super(brokers, clientId, groupId, logger);
    this.eventService = new EventService(logger, redis);
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
      this.logger.debug(`Received event message from ${topic}[${partition}]: ${messageValue}`);
      
      const eventData = JSON.parse(messageValue) as Partial<IVehicleEvent>;
      
      // Validate basic message structure
      if (!eventData.vehicleId || !eventData.eventType) {
        this.logger.warn(`Invalid event data format: ${messageValue}`);
        return;
      }

      // Process the event
      const savedEvent = await this.eventService.recordEvent(eventData);
      
      this.logger.info(`Processed ${savedEvent.eventType} event for vehicle ${savedEvent.vehicleId}`);
    } catch (error) {
      if (error instanceof SyntaxError) {
        this.logger.error(`Invalid JSON in message: ${error.message}`);
      } else if (error instanceof Error) {
        this.logger.error(`Error processing event message: ${error.message}`);
      } else {
        this.logger.error('Unknown error processing event message');
      }
    }
  }
} 