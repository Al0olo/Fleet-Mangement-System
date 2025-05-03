# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Add utilities for builds
RUN apk add --no-cache bash

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Test stage
FROM build AS test

# Run linting and tests with coverage
RUN npm run lint && npm run test:coverage

# Production stage
FROM node:18-alpine AS production

# Add utilities for health checks
RUN apk add --no-cache wget

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built app from build stage
COPY --from=build /app/dist ./dist

# Set user to non-root for security
USER node

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

# Start the server using clustering
CMD ["node", "dist/cluster.js"] 