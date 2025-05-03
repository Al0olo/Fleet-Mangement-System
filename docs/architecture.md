# Fleet Management System - Tenderd Assignment

## System Architecture

```mermaid
graph TB
    subgraph Client ["Client Layer"]
        WEB[Web Dashboard]
    end

    subgraph Gateway ["API Gateway"]
        GATEWAY[Express Gateway]
    end

    subgraph Services ["Microservices Layer"]
        VS[Vehicle Service]
        TS[Tracking Service]
        MS[Maintenance Service]
        AS[Analytics Service]
        SIM[Simulator Service]
    end

    subgraph Data ["Data Layer"]
        MONGO[(MongoDB)]
        REDIS[(Redis Cache)]
        KAFKA[Kafka]
    end

    WEB --> GATEWAY
    GATEWAY --> Services
    Services --> Data
    SIM --> KAFKA
    KAFKA --> TS
```

## Why Microservices?

I've chosen a microservice architecture for this system for several key benefits:
- **Scalability**: Individual services can be scaled independently based on demand
- **Fault Isolation**: Issues in one service don't affect the entire system
- **Technology Flexibility**: Each service can use the most suitable technology stack
- **Independent Deployment**: Services can be developed, tested and deployed separately
- **Easier Maintenance**: Smaller codebases are easier to understand and maintain

## Component Architecture

### API Gateway

```mermaid
graph LR
    CLIENT[Client Requests] --> GATEWAY[Express Gateway]
    GATEWAY --> ROUTE[Request Routing]
    GATEWAY --> AUTH[Authentication]
    GATEWAY --> TRAN[Transformation]
    GATEWAY --> LIMIT[Rate Limiting]
    GATEWAY --> DISC[Service Discovery]
    ROUTE --> SERVICES[Microservices]
    AUTH --> SERVICES
    TRAN --> SERVICES
    LIMIT --> SERVICES
    DISC --> SERVICES
```

### Vehicle Service

```mermaid
graph LR
    API[REST API] --> CTRL[Controller]
    CTRL --> BL[Business Logic]
    BL --> REPO[Repository]
    REPO --> MONGO[(MongoDB)]
    BL --> KAFKA[Event Stream]
```

### Tracking Service

```mermaid
graph LR
    CONSUMER[Event Consumer] --> PROC[Location Processor]
    PROC --> CACHE[Cache Manager]
    CACHE --> REDIS[(Redis)]
    KAFKA --> CONSUMER
```

### Maintenance Service

```mermaid
graph LR
    API[REST API] --> CTRL[Controller]
    CTRL --> BL[Business Logic]
    BL --> REPO[Repository]
    REPO --> MONGO[(MongoDB)]
```

### Analytics Service

```mermaid
graph LR
    API[Analytics API] --> AGG[Data Aggregator]
    AGG --> CALC[Metrics Calculator]
    CALC --> MONGO[(MongoDB)]
```

### Simulator Service

```mermaid
graph LR
    CONFIG[Simulation Config] --> GEN[Data Generator]
    GEN --> LOC[Location Data]
    GEN --> SENS[Sensor Data]
    GEN --> STATUS[Status Data]
    LOC --> PUB[Event Publisher]
    SENS --> PUB
    STATUS --> PUB
    PUB --> KAFKA[Kafka]
```

## Data Flow

### Real-time Location Update

```mermaid
sequenceDiagram
    participant S as Simulator Service
    participant K as Kafka/Redis Stream
    participant TS as Tracking Service
    participant R as Redis
    participant M as MongoDB
    participant D as Dashboard

    S->>K: Publish Location Data
    K->>TS: Consume Event
    TS->>R: Update Live Cache
    TS->>M: Store Historical Data
    TS->>D: Send Live Update
```

### Vehicle Registration

```mermaid
sequenceDiagram
    participant D as Dashboard
    participant G as API Gateway
    participant VS as Vehicle Service
    participant M as MongoDB
    participant K as Event Stream

    D->>G: Register Vehicle Request
    G->>VS: Route to Vehicle Service
    VS->>M: Save Vehicle Data
    VS->>K: Publish Created Event
    VS-->>G: Response
    G-->>D: Success Response
```

## Technology Stack

### Backend
- Node.js/Express
- MongoDB
- Redis
- Kafka/Event Streaming
- API Gateway: Express Gateway

### Frontend
- React
- Redux
- Map integration (e.g., Google Maps)

### DevOps
- Docker
- Docker Compose
- Github Actions

## Database Schema

### MongoDB Collections

```mermaid
erDiagram
    Vehicles ||--o{ MaintenanceRecords : has
    Vehicles ||--o{ UsageStats : tracks
    
    Vehicles {
        string id PK
        string model
        string type
        string status
        date registrationDate
        object metadata
    }
    
    MaintenanceRecords {
        string id PK
        string vehicleId FK
        string type
        string description
        date performedAt
        string performedBy
        number cost
    }
    
    UsageStats {
        string id PK
        string vehicleId FK
        date startDate
        date endDate
        number hoursOperated
        number distanceTraveled
    }
```

### Redis Data Structure

```mermaid
graph TD
    REDIS[(Redis)]
    
    REDIS --> |Keys| LOCATIONS["vehicle:location:{id}"]
    REDIS --> |Keys| STATUS["vehicle:status:{id}"]
    REDIS --> |Sets| ACTIVE["vehicles:active"]
    REDIS --> |GeoSpatial| GEO["geo:vehicles"]
```

## Docker Architecture

### Containerized Services

```mermaid
graph TD
    subgraph Docker ["Docker Environment"]
        FRONT[React Frontend]
        GW[API Gateway]
        VS_C[Vehicle Service]
        TS_C[Tracking Service]
        MS_C[Maintenance Service]
        AS_C[Analytics Service]
        SIM_C[Simulator Service]
        MONGO_C[MongoDB Container]
        REDIS_C[Redis Container]
        KAFKA_C[Kafka Container]
    end

    FRONT --> GW
    GW --> VS_C
    GW --> TS_C
    GW --> MS_C
    GW --> AS_C
    
    VS_C --> MONGO_C
    TS_C --> REDIS_C
    MS_C --> MONGO_C
    AS_C --> MONGO_C
    SIM_C --> KAFKA_C
    KAFKA_C --> TS_C
```

### Docker Compose Structure

```mermaid
graph LR
    subgraph ComposerServices ["Docker Compose"]
        FRONTEND[frontend]
        GATEWAY[api-gateway]
        VEHICLE[vehicle-service]
        TRACKING[tracking-service]
        MAINTENANCE[maintenance-service]
        ANALYTICS[analytics-service]
        SIMULATOR[simulator-service]
        MONGO_S[mongodb]
        REDIS_S[redis]
        KAFKA_S[kafka]
    end
    
    FRONTEND --> GATEWAY
    GATEWAY --> VEHICLE
    GATEWAY --> TRACKING
    GATEWAY --> MAINTENANCE
    GATEWAY --> ANALYTICS
    VEHICLE --> MONGO_S
    TRACKING --> MONGO_S
    MAINTENANCE --> MONGO_S
    ANALYTICS --> MONGO_S
    TRACKING --> REDIS_S
    SIMULATOR --> KAFKA_S
    KAFKA_S --> TRACKING
```

## API Architecture

### API Gateway Routes

```mermaid
graph TD
    GATEWAY[API Gateway]
    
    GATEWAY --> |/api/vehicles/*| VS[Vehicle Service]
    GATEWAY --> |/api/tracking/*| TS[Tracking Service]
    GATEWAY --> |/api/maintenance/*| MS[Maintenance Service]
    GATEWAY --> |/api/analytics/*| AS[Analytics Service]
    GATEWAY --> |/api/simulator/*| SIM[Simulator Service]
```

### RESTful Endpoints

```mermaid
graph TD
    API[REST API Layer]
    
    API -->|POST| VR["/api/vehicles"]
    API -->|GET| VL["/api/vehicles"]
    API -->|GET| VD["/api/vehicles/:id"]
    API -->|POST| VT["/api/tracking/location"]
    API -->|GET| VTL["/api/tracking/vehicles/:id"]
    API -->|POST| VM["/api/maintenance/records"]
    API -->|GET| VA["/api/analytics/vehicles/:id"]
    API -->|POST| SIM["/api/simulator/config"]
    API -->|GET| SIMS["/api/simulator/status"]
```

## Frontend Architecture

### React Component Structure

```mermaid
graph TD
    APP[App Component]
    
    APP --> DASHBOARD[Dashboard]
    APP --> VEHICLE_LIST[Vehicle List]
    APP --> VEHICLE_DETAIL[Vehicle Detail]
    APP --> REGISTER[Vehicle Registration]
    APP --> MAINTENANCE[Maintenance View]
    APP --> ANALYTICS[Analytics View]
    APP --> MAP_VIEW[Map View]
    
    DASHBOARD --> APISERVICE[API Service Layer]
    VEHICLE_LIST --> APISERVICE
    VEHICLE_DETAIL --> APISERVICE
    REGISTER --> APISERVICE
    MAINTENANCE --> APISERVICE
    ANALYTICS --> APISERVICE
    MAP_VIEW --> APISERVICE
    
    APISERVICE --> GATEWAY[API Gateway]
```

## Deployment Flow

### Development to Production

```mermaid
graph LR
    DEV[Development] --> TEST[Testing]
    TEST --> BUILD[Build Process]
    BUILD --> DOCKER[Docker Build]
    DOCKER --> COMPOSE[Docker Compose]
    COMPOSE --> CI[GitHub Actions CI/CD]
    CI --> DEPLOY[Deployment]
```

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

### Event System

```mermaid
graph LR
    subgraph EVENTS ["Event Types"]
        LOC[Location Events]
        STATUS[Status Events]
        MAINT[Maintenance Events]
    end

    subgraph PROCESSORS ["Event Processors"]
        LOC_P[Location Processor]
        STATUS_P[Status Processor]
        MAINT_P[Maintenance Processor]
    end

    SIM[Simulator Service] --> KAFKA[Event Stream]
    KAFKA --> EVENTS
    EVENTS --> PROCESSORS
    PROCESSORS --> DB[(Database)]
```