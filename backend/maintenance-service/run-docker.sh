#!/bin/bash

# Stop and remove existing containers
docker-compose down

# Build images
docker-compose build

# Run the service and its dependencies
docker-compose up -d

# Display logs
docker-compose logs -f maintenance-service

# Note: Press Ctrl+C to stop viewing logs, containers will continue running
# To stop all containers: docker-compose down 