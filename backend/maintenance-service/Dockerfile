# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Build TypeScript code
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3002

# Install wget for health check
RUN apk add --no-cache wget

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built app from build stage
COPY --from=build /app/dist ./dist

# Copy additional required files for runtime
COPY .env* ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nodeuser -u 1001 -G nodejs \
    && chown -R nodeuser:nodejs /app

USER nodeuser

# Expose service port
EXPOSE 3002

# Health check configuration
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

# Start the app
CMD ["node", "dist/server.js"] 