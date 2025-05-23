# Fleet Management System

## Overview
This is a full-stack web application for managing a fleet of vehicles. The system allows tracking vehicle locations, maintenance records, and usage statistics. This project is presented to Tenderd as a Software Engineering Assignment.

## Screenshots

### Dashboard
![Main Dashboard](./assets/main_dashboard.png)
*Fleet overview dashboard with real-time statistics and activity charts*

### Analytics
![Analytics Dashboard](./assets/analytics_dashboard.png)
*Comprehensive analytics dashboard with interactive charts and performance metrics*

### Maintenance Management
![Maintenance Dashboard](./assets/maintenance_dashboard.png)
*Maintenance scheduling and record management interface*

### Vehicle Management
![Vehicle Dashboard](./assets/vehicle_dashboard.png)
*Detailed vehicle information with tracking and performance data*

## Architecture
This project follows a microservice architecture with:

- **Frontend**: React-based web dashboard with TypeScript and Redux
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
- **React**: UI library for building component-based interfaces
- **TypeScript**: For type safety and better developer experience
- **Redux**: For state management
- **Recharts**: For data visualization and interactive charts
- **CSS-in-JS**: Styled components using inline styles
- **Responsive Design**: Mobile-friendly layouts
- **SVG Icons**: For consistent and scalable visual elements

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

### Frontend Features
- **Dashboard**:
  - Summary cards with key metrics
  - Interactive charts for analytics visualization
  - Quick action buttons for common tasks
  - Recent activity feed
- **Vehicles Management**:
  - Detailed vehicle listings with search and filter
  - Comprehensive vehicle detail pages
  - Real-time location tracking with map integration
  - Status indicators and visual feedback
- **Maintenance System**:
  - Record management with detailed history
  - Schedule planning with priority indicators
  - Alerts for overdue maintenance
  - Status tracking for in-progress work
- **Analytics Platform**:
  - Fleet-wide performance metrics
  - Cost analysis and utilization statistics
  - Customizable date ranges and filters
  - Multiple visualization types (bar, line, pie charts)
  - Data export capabilities

## Installation and Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB
- Redis
- Kafka
- Docker and Docker Compose (for containerized setup)

### Starting the Backend (Microservices)
1. Navigate to the `.docker` directory:
   ```bash
   cd .docker
   ```
2. Start all backend services using Docker Compose:
   ```bash
   docker-compose up
   ```
   This will start all the microservices, databases, and supporting infrastructure.

### Starting the Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Access the application in your browser at http://localhost:5000

### Access Details
When running the full stack, you can access:
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