# Fleet Management - Maintenance Service

A microservice for managing fleet vehicle maintenance records and schedules.

## Features

- CRUD operations for maintenance records
- Maintenance scheduling and reminders
- Vehicle maintenance history tracking
- Maintenance statistics and reporting
- Integration with Vehicle Service for status updates

## Tech Stack

- Node.js with Express
- TypeScript
- MongoDB for data storage
- Swagger for API documentation
- Jest for testing

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB

### Installation

1. Clone the repository
2. Navigate to the maintenance-service directory:
   ```
   cd backend/maintenance-service
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file in the root directory with the following content:
   ```
   PORT=3002
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/fleet-maintenance
   LOG_LEVEL=info
   KAFKA_BROKERS=localhost:9092
   KAFKA_CLIENT_ID=maintenance-service
   KAFKA_GROUP_ID=maintenance-service-group
   JWT_SECRET=your-secret-key-maintenance-service
   ```

### Running the Service

For development:
```
npm run dev
```

For production:
```
npm run build
npm start
```

### API Documentation

When the service is running, access the Swagger API documentation at:
```
http://localhost:3002/api-docs
```

## API Endpoints

### Maintenance Records

- `GET /api/maintenance/records` - Get all maintenance records
- `GET /api/maintenance/records/:id` - Get a specific maintenance record
- `POST /api/maintenance/records` - Create a new maintenance record
- `PUT /api/maintenance/records/:id` - Update a maintenance record
- `DELETE /api/maintenance/records/:id` - Delete a maintenance record
- `GET /api/maintenance/vehicles/:vehicleId/records` - Get maintenance records for a vehicle
- `GET /api/maintenance/stats` - Get maintenance statistics

### Maintenance Schedules

- `GET /api/schedules` - Get all maintenance schedules
- `GET /api/schedules/:id` - Get a specific maintenance schedule
- `POST /api/schedules` - Create a new maintenance schedule
- `PUT /api/schedules/:id` - Update a maintenance schedule
- `DELETE /api/schedules/:id` - Delete a maintenance schedule
- `GET /api/schedules/upcoming` - Get upcoming maintenance schedules
- `GET /api/schedules/overdue` - Get overdue maintenance schedules
- `POST /api/schedules/update-overdue` - Update overdue maintenance schedules
- `GET /api/vehicles/:vehicleId/schedules` - Get maintenance schedules for a vehicle

## Testing

Run tests:
```
npm test
```

Run unit tests only:
```
npm run test:unit
```

Run integration tests only:
```
npm run test:integration
```

Generate test coverage report:
```
npm run test:coverage
``` 