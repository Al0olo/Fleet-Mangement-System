# Fleet Management Analytics Service

## Overview

The Analytics Service is a crucial component of the Fleet Management System, responsible for generating, storing, and retrieving analytical reports about the fleet's performance, utilization, and maintenance metrics. This microservice provides insights to help fleet managers make data-driven decisions and optimize operations.

## Features

- Generates fleet-wide and vehicle-specific analytics reports
- Supports different report types (vehicle performance, utilization, maintenance costs)
- Offers various reporting periods (daily, weekly, monthly, quarterly)
- Provides historical data tracking and trend analysis
- Exposes REST API endpoints for report access and generation

## Architecture

The Analytics Service follows a microservice architecture pattern and:

- Consumes data from other services via Kafka
- Processes and aggregates real-time and historical data
- Stores reports in MongoDB
- Exposes RESTful API endpoints for clients

## Dependencies

- Node.js (v18+)
- MongoDB
- Kafka
- Express.js
- Mongoose
- Winston (logging)
- Jest (testing)

## Environment Variables

The following environment variables are required:

```
MONGODB_URI=mongodb://localhost:27017/fleet-analytics
KAFKA_BROKERS=localhost:9092
KAFKA_GROUP_ID=analytics-service
PORT=3003
LOG_LEVEL=info
```

## API Endpoints

### Reports

- `GET /api/reports` - Get all reports (with filtering options)
- `GET /api/reports/:id` - Get a specific report by ID
- `GET /api/reports/vehicle/:vehicleId` - Get reports for a specific vehicle
- `POST /api/reports` - Generate a new report

### Analytics

- `GET /api/analytics/fleet` - Get fleet-wide analytics
- `GET /api/analytics/vehicle/:vehicleId` - Get vehicle-specific analytics
- `GET /api/analytics/utilization` - Get fleet utilization metrics
- `GET /api/analytics/cost` - Get cost analysis data

## Setup Instructions

1. Clone the repository
2. Navigate to the analytics service directory:
   ```
   cd backend/analytics-service
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Setup environment variables (create a `.env` file based on the example above)
5. Start the service:
   ```
   npm start
   ```

For development:
```
npm run dev
```

## Database Models

### AnalyticsReport

The main model for storing generated reports:

- `reportType`: Type of report (fleet, vehicle, maintenance, utilization)
- `period`: Time period (daily, weekly, monthly, quarterly)
- `startDate`: Start date of the reporting period
- `endDate`: End date of the reporting period
- `vehicleId`: Optional vehicle ID for vehicle-specific reports
- `data`: Report data (schema varies by report type)
- `createdAt`: Report creation timestamp
- `updatedAt`: Last update timestamp

## Testing

This service uses Jest for unit and integration testing.

Run the tests:
```
npm test
```

Run tests with coverage:
```
npm run test:coverage
```

Run CI tests:
```
npm run test:ci
```

## Development

### Code Structure

- `src/controllers/` - Request handlers
- `src/models/` - Data models and schemas
- `src/routes/` - API route definitions
- `src/services/` - Business logic
- `src/db/` - Database connection and setup
- `src/middleware/` - Express middleware
- `src/util/` - Utility functions
- `src/tests/` - Test files

## Integration with Other Services

The Analytics Service communicates with:

- Tracking Service: Vehicle location and movement data
- Vehicle Service: Vehicle details and status
- Maintenance Service: Maintenance records and schedules

## Kafka Topics Consumed

- `vehicle-location` - Real-time location updates
- `vehicle-status` - Status changes
- `vehicle-events` - Vehicle operational events
- `maintenance-events` - Maintenance activities

## License

This project is part of the Fleet Management System and is subject to the same licensing terms.

## Contributing

Please follow the project's coding standards and submit pull requests for review. 