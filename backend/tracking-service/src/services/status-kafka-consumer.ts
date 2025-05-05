import { EachMessagePayload } from 'kafkajs';
import { KafkaConsumerService } from './kafka-consumer';
import { StatusService } from './status-service';
import winston from 'winston';
import { RedisClientType } from 'redis';
import { IVehicleStatus } from '../models/vehicle-status';

/**
 * Specialized Kafka consumer for vehicle status data
 */
export class StatusKafkaConsumer extends KafkaConsumerService {
  private statusService: StatusService;

  constructor(
    brokers: string[],
    clientId: string,
    groupId: string,
    logger: winston.Logger,
    redis: RedisClientType<any, any, any>
  ) {
    super(brokers, clientId, groupId, logger);
    this.statusService = new StatusService(logger, redis);
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
      this.logger.debug(`Received status message from ${topic}[${partition}]: ${messageValue}`);
      
      const statusData = JSON.parse(messageValue) as Partial<IVehicleStatus>;
      
      // Validate basic message structure
      if (!statusData.vehicleId || !statusData.status) {
        this.logger.warn(`Invalid status data format: ${messageValue}`);
        return;
      }

      // Process the status update
      const savedStatus = await this.statusService.recordStatus(statusData);
      
      this.logger.info(`Processed status update for vehicle ${savedStatus.vehicleId}: ${savedStatus.status}`);
    } catch (error) {
      if (error instanceof SyntaxError) {
        this.logger.error(`Invalid JSON in message: ${error.message}`);
      } else if (error instanceof Error) {
        this.logger.error(`Error processing status message: ${error.message}`);
      } else {
        this.logger.error('Unknown error processing status message');
      }
    }
  }
} 