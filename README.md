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
Provides usage statistics and reports.

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

## Technology Stack

### Backend
- Node.js/Express
- MongoDB
- Redis
- Kafka/Event Streaming
- API Gateway : Express Gateway

### Frontend
- React
- Redux
- Map integration (e.g., Google Maps)

### DevOps
- Docker
- Docker Compose
- Github Actions

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
  - Usage statistics
  - Performance metrics
  - Cost analysis

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
- Docker and Docker Compose (for containerized setup)

### Docker Setup
1. Clone the repository
2. Run `docker-compose up` to spin up all services

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
└── .docker/          # Docker configuration
```