# Fleet Management System API Gateway

## Overview

The API Gateway serves as the single entry point for the Fleet Management System microservices architecture. It handles routing, rate limiting, request transformation, and implements various resilience patterns to ensure high availability and fault tolerance.

## Architecture

The gateway follows a modern Node.js architecture with the following key components:

- **Express.js Framework**: Core HTTP server
- **TypeScript**: For type safety and enhanced developer experience
- **Node.js Clustering**: For improved performance and reliability
- **Redis**: For distributed rate limiting and caching
- **Prometheus**: For metrics collection

## Features

### High Availability

#### Node.js Clustering

The API Gateway leverages Node.js clustering to utilize all available CPU cores:

- **Worker Management**: Automatic spawning of worker processes (one per CPU)
- **Zero-Downtime Restarts**: Graceful shutdown and replacement of workers
- **Automatic Recovery**: Dead workers are automatically replaced
- **Environment-Aware**: Uses all CPUs in production, fewer in development for easier debugging

### Rate Limiting

The gateway implements sophisticated rate limiting to protect services:

- **Distributed Rate Limiting**: Redis-backed rate limiting with memory store fallback
- **Tiered Limiting**:
  - Standard limits for normal endpoints
  - Strict limits for sensitive endpoints
  - API key-based limits for authenticated clients
  - IP-based limits for global protection
  - Service-specific limits for targeted resource protection
- **Dynamic Configuration**: Limits configurable via environment variables
- **Graceful Degradation**: Falls back to in-memory rate limiting if Redis is unavailable

### Resilience Patterns

#### Circuit Breakers

Implemented using the Opossum library to prevent cascading failures:

- **Automatic Detection**: Detects when services are failing and stops sending requests
- **Half-Open State**: Tests if service has recovered before fully resuming traffic
- **Configurable Parameters**: Custom timeouts, error thresholds, and reset timeouts for each service

#### Retry Logic

Smart retry logic using p-retry:

- **Exponential Backoff**: Increasing delay between retries
- **Maximum Retries**: Configurable per service
- **Failure Classification**: Only retries on transient errors

#### Response Caching

Redis-based caching strategy:

- **Service-Specific TTL**: Different cache durations based on service characteristics
- **Cache Invalidation**: Automatic expiry and manual purge options
- **Conditional Caching**: Only caches successful responses

#### Cache Fallbacks

Provides data when services are unavailable:

- **Graceful Degradation**: Returns cached data (even if stale) when services are down
- **Custom Max-Age**: Configurable stale cache acceptance time
- **Cache Staleness Indicator**: Response headers indicate when using stale cache

#### Health Checks

Continuous monitoring of service health:

- **Periodic Polling**: Regular health checks to all microservices
- **Status Tracking**: Maintains current health status of all services
- **Health API**: Exposes current service health through API endpoints

### Performance Optimizations

#### Connection Pooling

Redis connection pooling for better resource utilization:

- **Resource Management**: Maintains optimal number of connections
- **Connection Reuse**: Avoids connection establishment overhead
- **Graceful Handling**: Handles connection errors and timeouts

#### Response Compression

Automatic compression for appropriate content:

- **Content-Type Based**: Compresses text-based responses only
- **Size Threshold**: Skips compression for small responses
- **Client Capability Detection**: Only compresses for clients that support it

#### Request/Response Metrics

Comprehensive metrics collection:

- **Latency Tracking**: Measures and logs response times
- **Prometheus Integration**: Exports metrics for monitoring systems
- **Custom Histograms**: Detailed response time distribution

## API Routes

### Gateway Status Routes

#### Health Check
- **Endpoint**: `/api/gateway/health`
- **Method**: GET
- **Rate Limit**: Standard
- **Description**: Basic health check for the API Gateway itself
- **Response**: Status code 200 with timestamp

#### Version
- **Endpoint**: `/api/gateway/version`
- **Method**: GET
- **Rate Limit**: Standard
- **Description**: Returns the current API version
- **Response**: Version and environment information

#### Services Status
- **Endpoint**: `/api/gateway/services`
- **Method**: GET
- **Rate Limit**: Strict
- **Description**: Returns health status of all microservices
- **Response**: List of services with their health status

#### Metrics
- **Endpoint**: `/metrics`
- **Method**: GET
- **Rate Limit**: None
- **Description**: Prometheus-formatted metrics
- **Response**: Plain text metrics in Prometheus format

### Proxied Service Routes

#### Vehicle Service
- **Base Path**: `/api/vehicles`
- **Target Service**: Vehicle Service
- **Cache TTL**: 300 seconds
- **Timeout**: 5000ms
- **Retry Attempts**: 3

#### Tracking Service
- **Base Path**: `/api/tracking`
- **Target Service**: Tracking Service
- **Cache TTL**: 60 seconds
- **Timeout**: 10000ms
- **Retry Attempts**: 3

#### Maintenance Service
- **Base Path**: `/api/maintenance`
- **Target Service**: Maintenance Service
- **Cache TTL**: 600 seconds
- **Timeout**: 5000ms
- **Retry Attempts**: 3

#### Analytics Service
- **Base Path**: `/api/analytics`
- **Target Service**: Analytics Service
- **Cache TTL**: 1800 seconds
- **Timeout**: 15000ms
- **Retry Attempts**: 2
- **Circuit Breaker**: Custom parameters (higher tolerance)

#### Simulator Service
- **Base Path**: `/api/simulator`
- **Target Service**: Simulator Service
- **Cache TTL**: 60 seconds
- **Timeout**: 5000ms
- **Retry Attempts**: 3

## Configuration

The API Gateway is configured using environment variables:

### Server Configuration
- `PORT`: Server port (default: 8080)
- `NODE_ENV`: Environment (development/production)
- `LOG_LEVEL`: Logging verbosity (default: info)
- `SERVER_TIMEOUT`: Server timeout in ms (default: 120000)
- `INSTANCE_ID`: Unique identifier for this gateway instance

### Rate Limiting
- `RATE_LIMIT_MAX`: Default request limit (default: 100)
- `RATE_LIMIT_WINDOW_MS`: Time window in ms (default: 900000)
- `ENABLE_GLOBAL_RATE_LIMIT`: Whether to enable global IP-based rate limiting
- `STRICT_RATE_LIMIT_MAX`: Limit for sensitive endpoints (default: 50)
- `STRICT_RATE_LIMIT_WINDOW_MS`: Time window for strict limits (default: 900000)
- `API_KEY_RATE_LIMIT_MAX`: Limit for API key auth (default: 1000)
- `API_KEY_RATE_LIMIT_WINDOW_MS`: Time window for API keys (default: 900000)

### Redis Configuration
- `REDIS_HOST`: Redis server hostname (default: localhost)
- `REDIS_PORT`: Redis server port (default: 6379)
- `REDIS_PASSWORD`: Redis password (optional)

### Service URLs
- `VEHICLE_SERVICE`: URL for Vehicle Service
- `TRACKING_SERVICE`: URL for Tracking Service
- `MAINTENANCE_SERVICE`: URL for Maintenance Service
- `ANALYTICS_SERVICE`: URL for Analytics Service
- `SIMULATOR_SERVICE`: URL for Simulator Service

## Resilience in Action: Request Flow

Here's how a typical request flows through the API Gateway with all resilience patterns active:

1. **Client makes request** to `/api/vehicles/status`
2. **Rate limiting** checks if request is within allowed limits
3. **Request transformation** converts to `/api/status` for internal routing
4. **Circuit breaker** checks if service is healthy
5. **Cache check** looks for existing response
6. If cached response exists, return it
7. If service is unhealthy, **fallback** to stale cache if available
8. If service is healthy, **proxy request** to Vehicle Service
9. If initial request fails, **retry logic** attempts the request again
10. **Response caching** stores successful response
11. **Metrics** record response time and status
12. **Response compression** compresses the payload if appropriate
13. **Response** sent back to client

## Deployment

The Gateway supports multiple deployment modes:

### Development
```bash
npm run dev
```

### Production with Clustering
```bash
npm run build
npm run start:cluster
```

## Troubleshooting

### Common Issues

#### Redis Connection Failures
- The gateway will fall back to in-memory storage
- Check Redis connection parameters
- Verify Redis server is running

#### Rate Limiting Too Aggressive
- Adjust rate limit parameters via environment variables
- Consider different tiers for different clients

#### High Latency
- Check the `/metrics` endpoint for service-specific latency
- Examine logs for slow requests (logs warnings for requests >1s)
- Consider adjusting timeouts for specific services

#### Circuit Breaker Tripping
- Check service health endpoints
- Verify upstream service functionality
- Consider adjusting circuit breaker parameters for specific services 