# Fleet Management System - Simulator Service

The Simulator Service generates realistic vehicle data to simulate a fleet of vehicles. It allows for testing the tracking and maintenance features of the Fleet Management System without requiring real vehicles.

## Features

- Vehicle location data generation (GPS coordinates)
- Trip simulation with realistic paths between points
- Vehicle status updates (running, idle, maintenance)
- Configurable simulation parameters (vehicles, frequency, routes)
- Integration with Kafka for event publishing
- REST API for simulation control

## API Endpoints

### Simulation Management

- `GET /api/simulator/simulations` - Get all simulation configurations
- `GET /api/simulator/simulations/:id` - Get a specific simulation
- `POST /api/simulator/simulations` - Create a new simulation configuration
- `PUT /api/simulator/simulations/:id` - Update a simulation configuration
- `DELETE /api/simulator/simulations/:id` - Delete a simulation configuration
- `POST /api/simulator/simulations/:id/start` - Start a simulation
- `POST /api/simulator/simulations/:id/stop` - Stop a simulation
- `POST /api/simulator/simulations/:id/pause` - Pause a simulation
- `POST /api/simulator/simulations/:id/initialize` - Initialize a simulation
- `POST /api/simulator/simulations/initialize-default` - Initialize a default simulation

### Vehicle Management  6817b9d5bb8f13b2f67a990a

- `GET /api/simulator/vehicles` - Get all simulated vehicles
- `GET /api/simulator/vehicles/:id` - Get a specific simulated vehicle
- `POST /api/simulator/vehicles` - Create a new simulated vehicle
- `PUT /api/simulator/vehicles/:id/status` - Update a vehicle's status
- `PUT /api/simulator/vehicles/:id/location` - Update a vehicle's location
- `POST /api/simulator/vehicles/reset` - Reset all vehicles to idle status
- `DELETE /api/simulator/vehicles` - Remove all simulated vehicles

### Trip Management

- `GET /api/simulator/trips` - Get all trips
- `GET /api/simulator/trips/active` - Get all active trips
- `GET /api/simulator/trips/:id` - Get a specific trip
- `GET /api/simulator/vehicles/:vehicleId/trips` - Get trips for a vehicle
- `POST /api/simulator/vehicles/:vehicleId/trips` - Create a trip for a vehicle
- `POST /api/simulator/trips/:id/start` - Start a trip
- `POST /api/simulator/trips/:id/complete` - Complete a trip

## Setup

### Prerequisites

- Node.js 18+
- MongoDB
- Kafka

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Copy the environment file:
   ```
   cp env.example .env
   ```
4. Update the environment variables in the `.env` file

### Running the service

Development mode:
```
npm run dev
```

Production mode:
```
npm run build
npm start
```

### Testing

Run tests:
```
npm test
```

Run unit tests:
```
npm run test:unit
```

Run integration tests:
```
npm run test:integration
```

## Docker

Build the Docker image:
```
docker build -t fleet-simulator-service .
```

Run the container:
```
docker run -p 3004:3004 --env-file .env fleet-simulator-service
```

## Events

The service publishes events to the following Kafka topics:

- `vehicle-location` - Vehicle location updates
- `vehicle-status` - Vehicle status changes
- `vehicle-event` - Trip and maintenance events 