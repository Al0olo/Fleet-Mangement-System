# API Gateway Codebase Structure

## Overview

The API Gateway serves as the central entry point for all client requests in the Fleet Management System. This document outlines the modular code structure implemented to improve maintainability, testability, and scalability.

## Directory Structure

```
backend/api-gateway/
├── src/
│   ├── config/              # Configuration modules
│   │   ├── logger.ts        # Logger configuration
│   │   └── metrics.ts       # Metrics setup
│   ├── middleware/          # Middleware components
│   │   ├── common/          # Common middleware
│   │   │   ├── error-handler.ts    # Error handling
│   │   │   ├── request-logger.ts   # Request logging 
│   │   │   └── security.ts         # Security middleware
│   │   ├── rate-limiter.ts         # Rate limiting
│   │   └── resilience/             # Circuit breaking, etc.
│   ├── routes/              # Route definitions
│   │   ├── api-routes.ts    # API Gateway specific routes
│   │   ├── docs-routes.ts   # Documentation routes
│   │   ├── health-routes.ts # Health and diagnostic routes
│   │   ├── metrics-routes.ts # Metrics endpoints
│   │   ├── proxy-routes.ts  # Generic proxy setup
│   │   ├── routes.ts        # Main route configuration
│   │   └── vehicle-proxy.ts # Vehicle service proxy
│   ├── util/                # Utility functions
│   │   └── redis-client.ts  # Redis client
│   ├── debug-tools.ts       # Diagnostic tools
│   ├── server.ts            # Main server setup
│   ├── cluster.ts           # Cluster mode support
│   └── swagger.ts           # API documentation
└── dist/                    # Compiled JavaScript
```

## Key Components

### Server Configuration

- **server.ts**: Main application entry point that orchestrates the setup of all components
- **config/logger.ts**: Configures Winston logger
- **config/metrics.ts**: Sets up Prometheus metrics collection

### Middleware

- **middleware/common/security.ts**: CORS, Helmet, compression, and other security middleware
- **middleware/common/request-logger.ts**: HTTP request logging, response time tracking
- **middleware/common/error-handler.ts**: Centralized error handling
- **middleware/rate-limiter.ts**: Rate limiting implementation

### Routes

- **routes/routes.ts**: Main route registration module
- **routes/health-routes.ts**: Health checks and diagnostics
- **routes/metrics-routes.ts**: Prometheus metrics endpoints
- **routes/docs-routes.ts**: Swagger documentation
- **routes/api-routes.ts**: API Gateway specific endpoints
- **routes/vehicle-proxy.ts**: Dedicated vehicle service proxy
- **routes/proxy-routes.ts**: Setup for other service proxies

### Utilities

- **util/redis-client.ts**: Redis client setup and connection management
- **debug-tools.ts**: Diagnostic and troubleshooting utilities

## Flow Control

1. **Initialization**: `server.ts` initializes the Express application
2. **Middleware Setup**: Security, logging, and monitoring middleware are applied
3. **Routes Registration**: All routes are registered through the routes setup module
4. **Error Handling**: Error handlers are registered last to catch any errors
5. **Server Start**: The server is started and begins listening for requests

## Service Proxying

The Vehicle Service proxy is explicitly set up to handle `/api/vehicles` requests with:

- Path rewriting from `/api/vehicles/*` to `/api/*`
- Custom error handling and logging
- Health checks

## Extending the Gateway

To add a new service proxy:

1. Create a dedicated proxy file in the routes directory (e.g., `tracking-proxy.ts`)
2. Implement similar pattern to the vehicle-proxy.ts
3. Register the new proxy in routes.ts

## Best Practices

- Each module has a single responsibility
- Configuration is externalized
- Logging is consistent across the application
- Error handling is centralized
- Security middleware is properly applied
- Health and diagnostic endpoints are available 