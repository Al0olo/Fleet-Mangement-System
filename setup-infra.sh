#!/bin/bash

# Make script exit on any command failure
set -e

echo "Setting up Fleet Management System infrastructure..."

# Create necessary directories if they don't exist
mkdir -p backend/api-gateway/src/routes

# Copy .env.example to .env if it doesn't exist
if [ ! -f backend/api-gateway/.env ]; then
  echo "Creating .env file for API Gateway from .env.example..."
  if [ -f backend/api-gateway/.env.example ]; then
    cp backend/api-gateway/.env.example backend/api-gateway/.env
    echo "Created .env file from .env.example template."
  else
    echo "Warning: .env.example not found, creating basic .env file."
    cat > backend/api-gateway/.env << EOL
PORT=8080
NODE_ENV=development
LOG_LEVEL=debug

# Service URLs
VEHICLE_SERVICE=http://vehicle-service:3000
TRACKING_SERVICE=http://tracking-service:3001
MAINTENANCE_SERVICE=http://maintenance-service:3002
ANALYTICS_SERVICE=http://analytics-service:3003
SIMULATOR_SERVICE=http://simulator-service:3004

# Redis config
REDIS_HOST=redis
REDIS_PORT=6379

# Rate limiting configuration
ENABLE_GLOBAL_RATE_LIMIT=true
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000
STRICT_RATE_LIMIT_MAX=50
STRICT_RATE_LIMIT_WINDOW_MS=900000
API_KEY_RATE_LIMIT_MAX=1000
API_KEY_RATE_LIMIT_WINDOW_MS=900000

# Service-specific rate limits (requests per 15 minutes)
VEHICLE_SERVICE_RATE_LIMIT=200
TRACKING_SERVICE_RATE_LIMIT=300
MAINTENANCE_SERVICE_RATE_LIMIT=150
ANALYTICS_SERVICE_RATE_LIMIT=100
SIMULATOR_SERVICE_RATE_LIMIT=100

# Resilience settings
ENABLE_CIRCUIT_BREAKER=true
CIRCUIT_TIMEOUT=3000
CIRCUIT_ERROR_THRESHOLD_PERCENTAGE=50
CIRCUIT_RESET_TIMEOUT=30000
ENABLE_RESPONSE_CACHING=true
CACHE_TTL=300
CACHE_FALLBACK_MAX_AGE=3600
HEALTH_CHECK_INTERVAL=30000
EOL
  fi
fi

echo "Starting infrastructure services with Docker Compose..."
docker-compose -f .docker/docker-compose.yml up -d mongodb redis zookeeper kafka kafka-ui mongo-express

echo "Infrastructure services started successfully!"
echo "MongoDB is available at mongodb://localhost:27017"
echo "MongoDB Express UI is available at http://localhost:8081"
echo "Redis is available at localhost:6379"
echo "Kafka is available at localhost:9092"
echo "Kafka UI is available at http://localhost:8090"

echo "You can start the API Gateway separately with:"
echo "cd backend/api-gateway && npm install && npm run dev" 