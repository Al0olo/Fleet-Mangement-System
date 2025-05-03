# API Gateway

## Overview

The API Gateway serves as the central entry point for all client requests in the Fleet Management System. It manages authentication, routing, rate limiting, and other cross-cutting concerns.

## Features

- Request routing to appropriate microservices
- Path rewriting
- Health and diagnostics endpoints
- Prometheus metrics collection
- Swagger API documentation
- Rate limiting
- Request logging
- Error handling

## Architecture

The API Gateway has been organized using a modular architecture:

```
backend/api-gateway/
├── src/
│   ├── config/              # Configuration modules
│   ├── middleware/          # Middleware components
│   │   ├── common/          # Common middleware
│   │   ├── rate-limiter.ts  # Rate limiting
│   │   └── resilience/      # Circuit breaking, etc.
│   ├── routes/              # Route definitions
│   ├── tests/               # Test files
│   │   ├── unit/            # Unit tests
│   │   └── integration/     # Integration tests
│   ├── util/                # Utility functions
│   ├── debug-tools.ts       # Diagnostic tools
│   ├── server.ts            # Main server setup
│   ├── cluster.ts           # Cluster mode support
│   └── swagger.ts           # API documentation
└── dist/                    # Compiled JavaScript
```

For a detailed description of the codebase structure, see [CODEBASE.md](./CODEBASE.md).

## Proxied Services

The API Gateway currently proxies requests to:

- **Vehicle Service** - `/api/vehicles/*` → Vehicle Service `/api/*`

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Redis (for rate limiting and caching)

### Environment Variables

```
PORT=8080                     # Port to run the API Gateway on
NODE_ENV=development          # Environment (development, production)
LOG_LEVEL=info                # Logging level
REDIS_URL=redis://localhost:6379 # Redis URL for rate limiting
VEHICLE_SERVICE_URL=http://localhost:3000 # Vehicle Service URL
ENABLE_GLOBAL_RATE_LIMIT=true # Enable global rate limiting
SERVER_TIMEOUT=120000         # Server timeout in ms
```

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start

# Start in development mode with auto-reload
npm run dev

# Start in cluster mode (production)
npm run start:cluster
```

## Testing

The API Gateway includes a comprehensive test suite:

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests with coverage report
npm run test:coverage
```

For more details on testing, see [src/tests/README.md](./src/tests/README.md).

## API Documentation

API documentation is available at `/api-docs` when running the service.

## Diagnostics

Health and diagnostic endpoints:

- `/health` - General health check
- `/api/diagnostics` - Detailed diagnostics with upstream service connectivity
- `/metrics` - Prometheus metrics

## Development

### Adding a New Service Proxy

1. Create a new proxy file in `src/routes/` (e.g., `tracking-proxy.ts`)
2. Implement the proxy using the http-proxy-middleware package
3. Register the proxy in `src/routes/routes.ts`

### Testing

```bash
# Run tests
npm test

# Lint code
npm run lint
```

## CI/CD

The API Gateway is built and tested using GitHub Actions. The workflow:

1. Builds the TypeScript code
2. Runs linting checks
3. Executes unit and integration tests
4. Generates and uploads test coverage reports
5. Builds a Docker image for deployment 