import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Simple test script to publish a vehicle location update to Kafka
 */
async function publishLocationUpdate() {
  // Get configuration from environment variables
  // When running outside Docker, we need to use localhost:9092 instead of kafka:9092
  // The port 9092 is mapped from the Docker container to the host machine
  const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
  const topic = process.env.KAFKA_TOPIC || 'vehicle-tracking';
  const vehicleId = process.argv[2] || '6815e0a4a9d11d07e62473a9'; // Default to the vehicle ID we created earlier
  
  console.log(`Publishing test location update for vehicle ${vehicleId}`);
  console.log(`Using Kafka brokers: ${brokers.join(', ')}`);
  console.log(`Publishing to topic: ${topic}`);
  
  // Create Kafka client
  const kafka = new Kafka({
    clientId: 'location-test-producer',
    brokers,
  });
  
  const producer = kafka.producer();
  
  try {
    await producer.connect();
    console.log('Connected to Kafka');
    
    // Generate random coordinates near the previous locations
    const longitude = 55.378 + (Math.random() * 0.01);
    const latitude = 3.436 + (Math.random() * 0.01);
    
    // Create location message
    const locationData = {
      vehicleId,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      speed: 50 + Math.floor(Math.random() * 30),
      heading: Math.floor(Math.random() * 360),
      altitude: 100 + Math.floor(Math.random() * 20),
      accuracy: 3 + Math.floor(Math.random() * 5),
      timestamp: new Date().toISOString(),
      metadata: {
        fuelLevel: 70 + Math.floor(Math.random() * 10),
        temperature: 25 + Math.floor(Math.random() * 5)
      }
    };
    
    // Send the message
    await producer.send({
      topic,
      messages: [
        { 
          value: JSON.stringify(locationData),
          key: vehicleId 
        }
      ],
    });
    
    console.log('Successfully published location update:');
    console.log(JSON.stringify(locationData, null, 2));
    
    await producer.disconnect();
    console.log('Disconnected from Kafka');
  } catch (error) {
    console.error('Error publishing location update:', error);
  } finally {
    process.exit(0);
  }
}

// Run the publisher
publishLocationUpdate().catch(console.error); 