# Fleet Management System

## Overview
This is a full-stack web application for managing a fleet of vehicles. The system allows tracking vehicle locations, maintenance records, and usage statistics. This project is presented to Tenderd as a Software Engineering Assignment.

## Architecture
This project follows a microservice architecture with:

- **Frontend**: React-based web dashboard
- **API Gateway**: Single entry point for all client requests
- **Backend Microservices**: 
  - Vehicle Service
  - Tracking Service
  - Maintenance Service
  - Analytics Service
  - Simulator Service
- **Data Layer**:
  - MongoDB for persistent storage
  - Redis for caching
  - Kafka for event streaming
  - Mongo Express for database administration

> **Detailed Architecture Documentation**: For comprehensive architecture diagrams, data flows, component interactions, and detailed descriptions of each microservice, please refer to the [Architecture Documentation](docs/architecture.md) in the docs directory.

### Why Microservices?
I've chosen a microservice architecture for this system for several key benefits:
- **Scalability**: Individual services can be scaled independently based on demand
- **Fault Isolation**: Issues in one service don't affect the entire system
- **Technology Flexibility**: Each service can use the most suitable technology stack
- **Independent Deployment**: Services can be developed, tested and deployed separately
- **Easier Maintenance**: Smaller codebases are easier to understand and maintain

### Component Architecture

#### API Gateway
Acts as a single entry point for all client requests with these key responsibilities:
- Request routing to appropriate microservices
- Authentication and authorization
- Request/response transformation
- Rate limiting and throttling
- Service discovery
- Load balancing
- Logging and monitoring
- Caching frequently accessed data

#### Vehicle Service
Handles vehicle registration, updates, and management.

#### Tracking Service
Processes location data from IoT devices and provides real-time tracking.

#### Maintenance Service
Manages maintenance records and schedules.

#### Analytics Service
Provides comprehensive analytics and reporting features:
- Usage statistics for individual vehicles and entire fleet
- Performance metrics tracking and analysis
- Cost analysis and reporting
- Customizable reports with different time periods
- Real-time data processing via Kafka integration
- Historical data aggregation and analysis

#### Simulator Service
Generates realistic IoT device data to simulate vehicle movements, sensor readings, and status updates. This service:
- Creates synthetic location data for vehicles
- Simulates sensor readings (fuel levels, engine status, etc.)
- Generates events at configurable intervals
- Allows testing the system without physical devices

### Data Flow
The system uses event-driven architecture with key flows:
- Real-time location updates
- Vehicle registration
- Maintenance scheduling
- Analytics event processing

## Technology Stack

### Backend
- **Node.js/Express**: Core server framework
- **TypeScript**: For enhanced type safety and development experience
- **MongoDB**: Main persistent storage
- **Mongoose**: MongoDB object modeling
- **Redis**: Fast caching layer
- **Kafka**: Event streaming platform for real-time data processing
- **API Gateway**: Express-based API gateway
- **Swagger/OpenAPI**: API documentation
- **Winston**: Advanced logging
- **Prometheus**: Metrics collection for monitoring
- **Mongo Express**: Web-based MongoDB admin interface

### Frontend
- React
- Redux
- Map integration (e.g., Google Maps)

### DevOps
- Docker
- Docker Compose
- GitHub Actions CI/CD
- Jest for testing
- ESLint for code quality

### Testing Infrastructure
- **Unit Tests**: For isolated testing of service components
- **Integration Tests**: For testing service interactions and API endpoints
- **Mocking Framework**: For simulating dependencies during testing
- **CI Pipeline**: Automated testing on pull requests and pushes
- **Test Coverage Reports**: Track code coverage across services
- **JUnit Reports**: Standardized test reporting

## Features

### Backend Requirements
- API Gateway:
  - Unified entry point for all client requests
  - Authentication and authorization
  - Service discovery and routing
  - Request/response transformation
  - Monitoring and observability

- Vehicle Service:
  - CRUD operations for vehicle management
  - Vehicle registration with type, model, status etc.
  - Fleet overview endpoints

- Tracking Service:
  - Real-time location tracking
  - Location history
  - Geofencing capabilities
  - Processing IoT device data

- Maintenance Service:
  - Maintenance records
  - Service scheduling
  - Alerts and notifications

- Analytics Service:
  - Usage statistics and fleet-wide analytics
  - Performance metrics tracking
  - Cost analysis and reporting
  - Customizable report generation
  - Data aggregation and historical analysis
  - Real-time event processing with Kafka

- Simulator Service:
  - Generation of synthetic IoT device data
  - Configurable simulation parameters
  - Multiple vehicle simulation support
  - Various sensor data simulation (GPS, fuel, engine metrics)

### Frontend Requirements
- Dashboard with:
  - Map view of vehicles
  - Vehicle list with filters and search
  - Detailed vehicle information
  - Maintenance history and schedules
  - Analytics charts and reports

## Installation and Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB
- Redis
- Kafka
- Docker and Docker Compose (for containerized setup)

### Docker Setup
1. Clone the repository
2. Run `docker-compose up` to spin up all services
3. Access the following services:
   - Frontend: http://localhost:5000
   - API Gateway: http://localhost:8080
   - Mongo Express: http://localhost:8081
   - Kafka UI: http://localhost:8090

## Testing
The project includes a comprehensive testing suite:

```shell
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Generate test coverage report
npm run test:coverage
```

## CI/CD
The project uses GitHub Actions for continuous integration and delivery. Each service has its own CI pipeline that runs on pull requests and pushes to main branches.

## API Documentation
API documentation is available at `/api/docs` when running the services.

## Project Structure
```
Fleet-Management-System/
├── frontend/         # React-based web dashboard
├── backend/          # Microservices
│   ├── api-gateway/  # API Gateway service
│   ├── vehicle/      # Vehicle service
│   ├── tracking/     # Tracking service
│   ├── maintenance/  # Maintenance service
│   ├── analytics/    # Analytics service
│   └── simulator/    # IoT data simulator service
├── docs/             # Documentation
├── .github/          # GitHub Actions workflows
└── .docker/          # Docker configuration
```