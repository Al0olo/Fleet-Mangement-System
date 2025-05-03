#!/bin/bash

echo "Building and running Fleet Management System containers..."

# Stop any running containers
echo "Stopping existing containers..."
docker-compose down

# Build the images
echo "Building vehicle-service and api-gateway images..."
docker-compose build

# Start the containers
echo "Starting containers..."
docker-compose up -d

# Monitor the health status
echo "Monitoring container health status..."
echo "Press Ctrl+C to stop monitoring"
docker-compose ps

# Monitor logs for troubleshooting
echo "Showing logs (Press Ctrl+C to exit logs but keep containers running)..."
docker-compose logs -f 