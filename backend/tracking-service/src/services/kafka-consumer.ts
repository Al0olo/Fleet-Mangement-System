import { Consumer, Kafka, EachMessagePayload } from 'kafkajs';
import winston from 'winston';

/**
 * Abstract base class for Kafka consumers
 */
export abstract class KafkaConsumerService {
  protected kafka: Kafka;
  protected consumer: Consumer;
  protected logger: winston.Logger;
  protected isRunning = false;

  constructor(
    brokers: string[],
    clientId: string,
    groupId: string,
    logger: winston.Logger
  ) {
    this.kafka = new Kafka({
      clientId,
      brokers,
    });

    this.consumer = this.kafka.consumer({ groupId });
    this.logger = logger;
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
   * Process a message from Kafka - to be implemented by derived classes
   * @param payload The Kafka message payload
   * @protected
   */
  protected abstract processMessage(payload: EachMessagePayload): Promise<void>;
} 