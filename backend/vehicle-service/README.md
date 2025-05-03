# Vehicle Service

## Overview
The Vehicle Service is a microservice component of the Fleet Management System responsible for managing vehicle data. It provides a RESTful API for creating, reading, updating, and deleting vehicle information.

## Features
- Complete CRUD operations for vehicle management
- Vehicle statistics and reporting
- Data validation and error handling
- Comprehensive test coverage

## Tech Stack
- Node.js
- Express
- TypeScript
- MongoDB (for data storage)
- Jest (for testing)

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- MongoDB instance (local or remote)

### Installation
1. Clone the repository
2. Navigate to the vehicle-service directory:
```
cd backend/vehicle-service
```
3. Install dependencies:
```
npm install
```
4. Set up environment variables:
```
cp .env.example .env
```
5. Configure the `.env` file with your MongoDB connection string and other required variables

### Running the Service
- Development mode:
```
npm run dev
```
- Production mode:
```
npm run build
npm start
```

### Testing
- Run unit tests:
```
npm run test:unit
```
- Run integration tests:
```
npm run test:integration
```
- Run all tests:
```
npm test
```
- Generate test coverage:
```
npm run test:coverage
```

## API Endpoints

### Vehicles
- `GET /api/vehicles` - Get all vehicles
- `GET /api/vehicles/:id` - Get a specific vehicle by ID
- `GET /api/vehicles/stats` - Get vehicle statistics
- `POST /api/vehicles` - Create a new vehicle
- `PUT /api/vehicles/:id` - Update a vehicle
- `DELETE /api/vehicles/:id` - Delete a vehicle