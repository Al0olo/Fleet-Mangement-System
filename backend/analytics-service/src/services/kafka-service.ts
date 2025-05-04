import { Kafka, Consumer, Producer, KafkaMessage } from 'kafkajs';
import { Logger } from 'winston';
import UsageStatsService from './usage-stats-service';
import PerformanceMetricService from './performance-metric-service';

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
            'location-updates',
            'sensor-data',
            'maintenance-events'
          ],
          fromBeginning: false 
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

  // Process incoming messages
  private async processMessage(topic: string, message: KafkaMessage): Promise<void> {
    if (!message.value) {
      return;
    }

    try {
      const content = JSON.parse(message.value.toString());
      this.logger.debug(`Processing message from topic ${topic}`, { content });

      switch (topic) {
        case 'vehicle-events':
          await this.processVehicleEvent(content);
          break;
        
        case 'location-updates':
          await this.processLocationUpdate(content);
          break;
        
        case 'sensor-data':
          await this.processSensorData(content);
          break;
        
        case 'maintenance-events':
          await this.processMaintenanceEvent(content);
          break;
        
        default:
          this.logger.warn(`No handler for topic: ${topic}`);
      }
    } catch (error) {
      this.logger.error(`Error processing message from topic ${topic}: ${error}`);
    }
  }

  // Process vehicle events (created, updated, deleted)
  private async processVehicleEvent(event: any): Promise<void> {
    const { eventType, vehicle } = event;
    
    this.logger.info(`Processing vehicle event: ${eventType}`, { vehicleId: vehicle?.id });
    
    // We don't need to do much with vehicle events directly in analytics service,
    // but we could trigger report generation or update cached stats
  }

  // Process location updates
  private async processLocationUpdate(data: any): Promise<void> {
    const { vehicleId, _timestamp, _latitude, _longitude, _speed, _heading } = data;
    
    this.logger.debug(`Processing location update for vehicle ${vehicleId}`);
    
    // Location updates might contribute to usage statistics
    // For example, if we detect the vehicle has moved significantly, we can update
    // the distance traveled and possibly calculate utilization metrics
  }

  // Process sensor data for analytics
  private async processSensorData(data: any): Promise<void> {
    const { vehicleId, timestamp, sensorType, _value } = data;
    
    this.logger.debug(`Processing sensor data: ${sensorType} for vehicle ${vehicleId}`);
    
    // Different sensor types contribute to different analytics
    switch (sensorType) {
      case 'engine':
        // Engine data might indicate hours operated
        if (data.isRunning) {
          // Could update hours operated
        }
        break;
      
      case 'fuel':
        // Fuel level changes could indicate consumption
        // Could calculate and record fuel efficiency metrics
        if (data.fuelLevel !== undefined && data.distanceSinceLastReading) {
          try {
            await this.performanceMetricService.recordMetric({
              vehicleId,
              metricType: 'fuelEfficiency',
              timestamp: new Date(timestamp),
              value: data.distanceSinceLastReading / data.fuelConsumed,
              unit: 'km/l'
            });
          } catch (error) {
            this.logger.error(`Error recording fuel efficiency metric: ${error}`);
          }
        }
        break;
      
      case 'utilization':
        // Direct utilization readings
        if (data.utilizationRate !== undefined) {
          try {
            await this.performanceMetricService.recordMetric({
              vehicleId,
              metricType: 'utilization',
              timestamp: new Date(timestamp),
              value: data.utilizationRate,
              unit: 'percent'
            });
          } catch (error) {
            this.logger.error(`Error recording utilization metric: ${error}`);
          }
        }
        break;
      
      default:
        // Other sensor types might be relevant for different metrics
        break;
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