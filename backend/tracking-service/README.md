# Fleet Management System - Tracking Service

This service handles real-time vehicle tracking in the Fleet Management System. It's responsible for:

- Processing and storing location data from vehicles
- Providing real-time vehicle location information
- Storing historical location data
- Supporting geospatial queries for finding nearby vehicles
- Caching location data in Redis for performance

## Architecture

The tracking service follows a microservice architecture and uses:

- Express.js for the API layer
- MongoDB for persistent storage of location history
- Redis for caching and geospatial queries
- Kafka for consuming events (future implementation)

## API Endpoints

The service exposes the following REST endpoints:

- `POST /api/tracking/location` - Record a new vehicle location
- `GET /api/tracking/vehicles/:vehicleId/location` - Get a vehicle's latest location
- `GET /api/tracking/vehicles/:vehicleId/history` - Get a vehicle's location history
- `GET /api/tracking/nearby` - Find vehicles near a specific location

Full API documentation is available via Swagger at `/api-docs` when the service is running.

## Development

### Prerequisites

- Node.js (v18 or higher)
- MongoDB
- Redis
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

This will start the tracking service along with MongoDB, Redis, and other dependencies.

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