import { Kafka, Producer, KafkaMessage } from 'kafkajs';
import { Logger } from 'winston';
import { IVehicle } from '../models/vehicle';

// Define the topics
export const TOPICS = {
  VEHICLE_CREATED: 'vehicle.created',
  VEHICLE_UPDATED: 'vehicle.updated',
  VEHICLE_DELETED: 'vehicle.deleted',
  VEHICLE_STATUS_CHANGED: 'vehicle.status.changed'
};

export interface EventPayload {
  eventType: string;
  data: any;
  metadata: {
    timestamp: string;
    source: string;
  };
}

class KafkaService {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private isConnected: boolean = false;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
    
    this.kafka = new Kafka({
      clientId: 'vehicle-service',
      brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });
  }

  public async connect(): Promise<void> {
    try {
      this.producer = this.kafka.producer();
      await this.producer.connect();
      this.isConnected = true;
      this.logger.info('Successfully connected to Kafka');
    } catch (error) {
      this.isConnected = false;
      this.logger.error(`Failed to connect to Kafka: ${error}`);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.producer && this.isConnected) {
      await this.producer.disconnect();
      this.isConnected = false;
      this.logger.info('Disconnected from Kafka');
    }
  }

  // Helper to create a standard event payload
  private createEventPayload(eventType: string, data: any): EventPayload {
    return {
      eventType,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'vehicle-service'
      }
    };
  }

  // Publish a vehicle created event
  public async publishVehicleCreated(vehicle: IVehicle): Promise<void> {
    const payload = this.createEventPayload(TOPICS.VEHICLE_CREATED, vehicle);
    await this.publishMessage(TOPICS.VEHICLE_CREATED, payload);
  }

  // Publish a vehicle updated event
  public async publishVehicleUpdated(vehicle: IVehicle): Promise<void> {
    const payload = this.createEventPayload(TOPICS.VEHICLE_UPDATED, vehicle);
    await this.publishMessage(TOPICS.VEHICLE_UPDATED, payload);
  }

  // Publish a vehicle deleted event
  public async publishVehicleDeleted(vehicleId: string): Promise<void> {
    const payload = this.createEventPayload(TOPICS.VEHICLE_DELETED, { id: vehicleId });
    await this.publishMessage(TOPICS.VEHICLE_DELETED, payload);
  }

  // Publish a vehicle status changed event
  public async publishVehicleStatusChanged(vehicle: IVehicle, previousStatus: string): Promise<void> {
    const payload = this.createEventPayload(TOPICS.VEHICLE_STATUS_CHANGED, {
      id: vehicle.id,
      currentStatus: vehicle.status,
      previousStatus,
      timestamp: new Date().toISOString()
    });
    await this.publishMessage(TOPICS.VEHICLE_STATUS_CHANGED, payload);
  }

  // Generic method to publish a message to a topic
  private async publishMessage(topic: string, message: any): Promise<void> {
    if (!this.producer || !this.isConnected) {
      this.logger.warn('Kafka producer not connected, trying to reconnect...');
      await this.connect();
    }

    try {
      if (this.producer) {
        await this.producer.send({
          topic,
          messages: [{
            value: JSON.stringify(message)
          }]
        });
        this.logger.debug(`Message published to topic ${topic}`);
      }
    } catch (error) {
      this.logger.error(`Failed to publish message to Kafka topic ${topic}: ${error}`);
      // If in production, we might want to retry or queue the message
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }
}

export default KafkaService; 