#!/bin/bash

echo "Building and testing API Gateway changes..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm ci
fi

# Build the code
echo "Building API Gateway..."
npm run build

# Run tests
echo "Running tests..."
npm test

# Create and run Docker container
echo "Building Docker image..."
docker build -t fleet-management/api-gateway:latest .

echo "Done! You can now run the Docker container with:"
echo "cd ../vehicle-service && ./run-docker.sh" 