import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3004', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/fleet-simulator',
  
  // Kafka configuration
  kafka: {
    clientId: process.env.KAFKA_CLIENT_ID || 'simulator-service',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    topics: {
      vehicleLocation: process.env.KAFKA_TOPIC_VEHICLE_LOCATION || 'vehicle-location',
      vehicleStatus: process.env.KAFKA_TOPIC_VEHICLE_STATUS || 'vehicle-status',
      vehicleEvent: process.env.KAFKA_TOPIC_VEHICLE_EVENT || 'vehicle-event',
      sensorData: process.env.KAFKA_TOPIC_SENSOR_DATA || 'sensor-data'
    }
  },

  // Vehicle service API
  vehicleService: {
    baseUrl: process.env.VEHICLE_SERVICE_URL || 'http://localhost:3001'
  },

  // Tracking service API
  trackingService: {
    baseUrl: process.env.TRACKING_SERVICE_URL || 'http://localhost:3002'
  },

  // Simulation defaults
  simulation: {
    updateFrequencyMs: parseInt(process.env.SIMULATION_UPDATE_FREQUENCY_MS || '5000', 10),
    defaultVehicleCount: parseInt(process.env.SIMULATION_DEFAULT_VEHICLE_COUNT || '10', 10),
    defaultRegion: {
      // Default: New York City area
      centerLat: parseFloat(process.env.SIMULATION_CENTER_LAT || '40.7128'),
      centerLng: parseFloat(process.env.SIMULATION_CENTER_LNG || '-74.0060'),
      radiusKm: parseFloat(process.env.SIMULATION_RADIUS_KM || '20')
    },
    // Probabilities for status changes (0-1)
    probabilities: {
      maintenance: parseFloat(process.env.SIMULATION_PROB_MAINTENANCE || '0.01'), 
      idle: parseFloat(process.env.SIMULATION_PROB_IDLE || '0.1')
    }
  }
}; 