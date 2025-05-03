# Fleet Management System - Tracking Service

This service handles real-time vehicle tracking and monitoring in the Fleet Management System. It's responsible for:

- Processing and storing location data from vehicles
- Receiving and managing vehicle status updates
- Handling vehicle events (trips, maintenance, alerts, etc.)
- Providing real-time vehicle location information
- Storing historical location, status, and event data
- Supporting geospatial queries for finding nearby vehicles
- Caching data in Redis for performance
- Integrating with the maintenance service for vehicle maintenance events

## Architecture

The tracking service follows a microservice architecture and uses:

- Express.js for the API layer
- MongoDB for persistent storage of location, status, and event history
- Redis for caching and geospatial queries
- Kafka for consuming events from simulator service

## Kafka Integration

The service consumes data from the following Kafka topics:
- `vehicle-location` - For real-time vehicle location updates
- `vehicle-status` - For vehicle status information (fuel, battery, etc.)
- `vehicle-event` - For vehicle-related events (trips, maintenance, etc.)

## API Endpoints

The service exposes the following REST endpoints:

### Location Tracking
- `POST /api/tracking/location` - Record a new vehicle location
- `GET /api/tracking/vehicles/:vehicleId/location` - Get a vehicle's latest location
- `GET /api/tracking/vehicles/:vehicleId/history` - Get a vehicle's location history
- `GET /api/tracking/nearby` - Find vehicles near a specific location

### Vehicle Status
- `POST /api/tracking/status` - Record a new vehicle status
- `GET /api/tracking/vehicles/:vehicleId/status` - Get a vehicle's latest status
- `GET /api/tracking/vehicles/:vehicleId/status/history` - Get a vehicle's status history
- `GET /api/tracking/status/:statusType` - Get vehicles with a specific status

### Vehicle Events
- `POST /api/tracking/events` - Record a new vehicle event
- `GET /api/tracking/vehicles/:vehicleId/events` - Get events for a vehicle
- `GET /api/tracking/events/:eventType` - Get recent events of a specific type
- `GET /api/tracking/trips/:tripId/events` - Get events for a specific trip

Full API documentation is available via Swagger at `/api-docs` when the service is running.

## Development

### Prerequisites

- Node.js (v18 or higher)
- MongoDB
- Redis
- Kafka
- Docker and Docker Compose (optional)

### Local Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables:
   Copy `.env.example` to `.env` and adjust values as needed.

3. Start the service:
   ```
   npm run dev
   ```

The service will be available at http://localhost:3002 with API documentation at http://localhost:3002/api-docs.

### Docker Setup

To run the service using Docker Compose:

```
docker-compose up -d
```

This will start the tracking service along with MongoDB, Redis, Kafka, and other dependencies.

## Testing

Run tests with:

```
npm test
```

Run specific test suites:

```
npm run test:unit
npm run test:integration
```

## Building for Production

```
npm run build
npm start
``` 