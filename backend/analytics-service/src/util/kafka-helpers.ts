import { Logger } from 'winston';

/**
 * Process a message based on its topic
 * 
 * @param topic - The Kafka topic of the message
 * @param content - The message content
 * @param logger - Logger instance
 * @param handlers - Object containing handler functions for different topics
 * @returns Promise that resolves when processing is complete
 */
export async function processKafkaMessage(
  topic: string, 
  content: any, 
  logger: Logger,
  handlers: TopicHandlers
): Promise<void> {
  switch (topic) {
    case 'vehicle-events':
      await handlers.processVehicleEvent(content);
      break;
    
    case 'vehicle-location':
      await handlers.processLocationUpdate(content);
      break;
    
    case 'sensor-data':
      await handlers.processSensorData(content);
      break;
    
    case 'maintenance-events':
      await handlers.processMaintenanceEvent(content);
      break;
    
    case 'vehicle-status':
      await handlers.processVehicleEvent(content);
      break;
    
    default:
      logger.warn(`No handler for topic: ${topic}`);
  }
}

/**
 * Process sensor data based on its type
 * 
 * @param data - The sensor data
 * @param logger - Logger instance
 * @param services - Object containing services for recording metrics
 * @returns Promise that resolves when processing is complete
 */
export async function processSensorTypeData(
  data: any,
  logger: Logger,
  services: SensorServices
): Promise<void> {
  const { vehicleId, timestamp, sensorType } = data;
    
  if (!vehicleId || !timestamp || !sensorType) {
    logger.warn('Received incomplete sensor data', { data });
    return;
  }
  
  logger.debug(`Processing sensor data: ${sensorType} for vehicle ${vehicleId}`);
  
  // Create a timestamp Date object from the string
  const timestampDate = new Date(timestamp);
  
  // Different sensor types contribute to different analytics
  switch (sensorType) {
    case 'engine':
      // Record engine data for hours operated
      if (data.isRunning) {
        try {
          // Determine the time period for this usage stat (use the current hour)
          const startDate = new Date(timestampDate);
          startDate.setMinutes(0, 0, 0); // Start of the hour
          
          const endDate = new Date(startDate);
          endDate.setHours(endDate.getHours() + 1); // End of the hour
          
          // Small increment to hours operated
          const incrementHours = 0.01; // 36 seconds
          
          // Create or update a usage stat for this hour
          await services.usageStatsService.recordOrUpdateUsageStats({
            vehicleId,
            startDate,
            endDate,
            hoursOperated: incrementHours,
            distanceTraveled: 0,
            idleTime: data.rpm < 1000 ? incrementHours : 0 // If RPM is low, count as idle
          });
          
          // Record engine hours as a performance metric
          await services.performanceMetricService.recordMetric({
            vehicleId,
            metricType: 'engineHours',
            timestamp: timestampDate,
            value: data.hoursOperated || 0,
            unit: 'hours'
          });
        } catch (error) {
          logger.error(`Error recording engine data: ${error}`);
        }
      }
      break;
    
    case 'fuel':
      // Record fuel consumption and efficiency metrics
      if (data.fuelConsumed !== undefined && data.distanceSinceLastReading) {
        try {
          // Determine the time period for this usage stat (use the current hour)
          const startDate = new Date(timestampDate);
          startDate.setMinutes(0, 0, 0); // Start of the hour
          
          const endDate = new Date(startDate);
          endDate.setHours(endDate.getHours() + 1); // End of the hour
          
          // Update usage stats with distance traveled and fuel consumed
          await services.usageStatsService.recordOrUpdateUsageStats({
            vehicleId,
            startDate,
            endDate,
            hoursOperated: 0, // We handle this in engine sensor
            distanceTraveled: data.distanceSinceLastReading,
            fuelConsumed: data.fuelConsumed
          });
          
          // Calculate and record fuel efficiency
          if (data.fuelConsumed > 0) {
            const efficiency = data.distanceSinceLastReading / data.fuelConsumed;
            await services.performanceMetricService.recordMetric({
              vehicleId,
              metricType: 'fuelEfficiency',
              timestamp: timestampDate,
              value: efficiency,
              unit: 'km/l'
            });
          }
        } catch (error) {
          logger.error(`Error recording fuel efficiency metric: ${error}`);
        }
      }
      break;
    
    case 'utilization':
      // Record utilization metrics
      if (data.utilizationRate !== undefined) {
        try {
          // Record the utilization rate
          await services.performanceMetricService.recordMetric({
            vehicleId,
            metricType: 'utilization',
            timestamp: timestampDate,
            value: data.utilizationRate,
            unit: 'percent'
          });
          
          // If we have a separate cost metric, we could calculate cost per hour
          const costPerHour = 50.0 * data.utilizationRate; // Simplified cost model: $50/hr at 100% utilization
          
          await services.performanceMetricService.recordMetric({
            vehicleId,
            metricType: 'costPerHour',
            timestamp: timestampDate,
            value: costPerHour,
            unit: 'usd'
          });
        } catch (error) {
          logger.error(`Error recording utilization metric: ${error}`);
        }
      }
      break;
    
    default:
      // Other sensor types might be relevant for different metrics
      logger.debug(`Unhandled sensor type: ${sensorType}`);
      break;
  }
}

/**
 * Interface defining the handlers for different message types
 */
export interface TopicHandlers {
  processVehicleEvent: (content: any) => Promise<void>;
  processLocationUpdate: (content: any) => Promise<void>;
  processSensorData: (content: any) => Promise<void>;
  processMaintenanceEvent: (content: any) => Promise<void>;
}

/**
 * Interface defining the services needed for sensor data processing
 */
export interface SensorServices {
  usageStatsService: {
    recordOrUpdateUsageStats: (data: any) => Promise<any>;
  };
  performanceMetricService: {
    recordMetric: (data: any) => Promise<any>;
  };
} 