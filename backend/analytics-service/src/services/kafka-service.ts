import { Kafka, Consumer, Producer } from 'kafkajs';
import { Logger } from 'winston';
import UsageStatsService from './usage-stats-service';
import PerformanceMetricService from './performance-metric-service';
import { 
  processKafkaMessage, 
  processSensorTypeData, 
  TopicHandlers, 
  SensorServices 
} from '../util/kafka-helpers';

class KafkaService {
  private logger: Logger;
  private kafka: Kafka;
  private consumer: Consumer | null = null;
  private producer: Producer | null = null;
  private usageStatsService: UsageStatsService;
  private performanceMetricService: PerformanceMetricService;
  private isConnected: boolean = false;

  constructor(logger: Logger) {
    this.logger = logger;
    this.usageStatsService = new UsageStatsService(logger);
    this.performanceMetricService = new PerformanceMetricService(logger);

    const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
    const clientId = process.env.KAFKA_CLIENT_ID || 'analytics-service-client';
    const groupId = process.env.KAFKA_GROUP_ID || 'analytics-service';

    this.logger.info(`Initializing Kafka with brokers: ${brokers.join(', ')}`);
    
    this.kafka = new Kafka({
      clientId,
      brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    this.consumer = this.kafka.consumer({ groupId });
    this.producer = this.kafka.producer();
  }

  // Connect to Kafka
  public async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      if (this.consumer) {
        await this.consumer.connect();
      }
      
      if (this.producer) {
        await this.producer.connect();
      }

      this.isConnected = true;
      this.logger.info('Connected to Kafka');
    } catch (error) {
      this.logger.error(`Failed to connect to Kafka: ${error}`);
      throw error;
    }
  }

  // Disconnect from Kafka
  public async disconnect(): Promise<void> {
    try {
      if (this.consumer) {
        await this.consumer.disconnect();
      }
      
      if (this.producer) {
        await this.producer.disconnect();
      }

      this.isConnected = false;
      this.logger.info('Disconnected from Kafka');
    } catch (error) {
      this.logger.error(`Error disconnecting from Kafka: ${error}`);
    }
  }

  // Subscribe to topics
  public async subscribeToTopics(): Promise<void> {
    if (!this.consumer || !this.isConnected) {
      await this.connect();
    }

    try {
      if (this.consumer) {
        // Subscribe to vehicle topics
        await this.consumer.subscribe({ 
          topics: [
            'vehicle-events', 
            'vehicle-status',
            'vehicle-location',
            'sensor-data',
            'maintenance-events'
          ],
          fromBeginning: true 
        });

        this.logger.info('Subscribed to Kafka topics');
        
        // Start processing messages
        await this.startConsumer();
      }
    } catch (error) {
      this.logger.error(`Failed to subscribe to topics: ${error}`);
      throw error;
    }
  }

  // Start the consumer
  private async startConsumer(): Promise<void> {
    if (!this.consumer) {
      throw new Error('Consumer not initialized');
    }

    await this.consumer.run({
      eachMessage: async ({ topic, partition: _partition, message }) => {
        try {
          await this.processMessage(topic, message);
        } catch (error) {
          this.logger.error(`Error processing message: ${error}`);
        }
      }
    });

    this.logger.info('Kafka consumer started');
  }

  // Process received messages
  private async processMessage(topic: string, message: any): Promise<void> {
    try {
      let content: any;
      
      try {
        content = JSON.parse(message.value.toString());
      } catch (error) {
        this.logger.error(`Failed to parse message for topic ${topic}: ${error}`);
        return;
      }
      
      this.logger.debug(`Processing message from topic ${topic}: ${JSON.stringify(content)}`);
      
      const handlers: TopicHandlers = {
        processVehicleEvent: this.processVehicleEvent.bind(this),
        processLocationUpdate: this.processLocationUpdate.bind(this),
        processSensorData: this.processSensorData.bind(this),
        processMaintenanceEvent: this.processMaintenanceEvent.bind(this)
      };
      
      await processKafkaMessage(topic, content, this.logger, handlers);
    } catch (error) {
      this.logger.error(`Error processing message: ${error}`);
    }
  }

  // Process vehicle events (created, updated, deleted)
  private async processVehicleEvent(event: any): Promise<void> {
    const { eventType, vehicle } = event;
    
    this.logger.info(`Processing vehicle event: ${eventType}`, { vehicleId: vehicle?.id });
  }

  // Process location updates
  private async processLocationUpdate(data: any): Promise<void> {
    const { vehicleId, _timestamp, _latitude, _longitude, _speed, _heading } = data;
    
    this.logger.debug(`Processing location update for vehicle ${vehicleId}`);
  }

  // Process sensor data for analytics
  private async processSensorData(data: any): Promise<void> {
    try {

      const services: SensorServices = {
        usageStatsService: this.usageStatsService,
        performanceMetricService: this.performanceMetricService
      };
      
      await processSensorTypeData(data, this.logger, services);
    } catch (error) {
      this.logger.error(`Error processing sensor data: ${error}`);
    }
  }

  // Process maintenance events
  private async processMaintenanceEvent(event: any): Promise<void> {
    const { vehicleId, eventType, maintenanceRecord, timestamp } = event;
    
    this.logger.info(`Processing maintenance event: ${eventType} for vehicle ${vehicleId}`);
    
    // Maintenance events can be used to calculate maintenance frequency and costs
    if (eventType === 'maintenance_performed' && maintenanceRecord) {
      if (maintenanceRecord.cost) {
        try {
          // Record the maintenance cost metrics
          await this.performanceMetricService.recordMetric({
            vehicleId,
            metricType: 'maintenanceFrequency',
            timestamp: new Date(timestamp),
            value: 1, // Increment count
            unit: 'events'
          });
          
          // Could also record cost per hour metrics if we have hours operated data
        } catch (error) {
          this.logger.error(`Error recording maintenance metrics: ${error}`);
        }
      }
    }
  }

  // Publish an analytics event
  public async publishAnalyticsEvent(eventType: string, data: any): Promise<void> {
    if (!this.producer || !this.isConnected) {
      await this.connect();
    }

    try {
      const message = {
        eventType,
        timestamp: new Date().toISOString(),
        data
      };

      if (this.producer) {
        await this.producer.send({
          topic: 'analytics-events',
          messages: [
            { value: JSON.stringify(message) }
          ]
        });

        this.logger.debug(`Published analytics event: ${eventType}`);
      }
    } catch (error) {
      this.logger.error(`Error publishing analytics event: ${error}`);
      throw error;
    }
  }
}

export default KafkaService; 