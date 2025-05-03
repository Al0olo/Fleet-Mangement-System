import express, { Application } from 'express';
import dotenv from 'dotenv';
import { Server } from 'http';
import { waitForRedis } from './util/redis-client';

// Load environment variables
dotenv.config();

// Import configurations
import { createLogger } from './config/logger';
import { setupMetrics } from './config/metrics';
import { setupSecurityMiddleware } from './middleware/common/security';
import { setupRequestLogging } from './middleware/common/request-logger';
import { setupErrorHandlers } from './middleware/common/error-handler';
import { setupRoutes } from './routes/routes';

// Create server function - exported for use with clustering
export function createServer(customLogger?: any) {
  // Create the logger
  const logger = customLogger || createLogger();
  
  // Setup metrics
  const { metricsRegistry, httpRequestDurationMicroseconds } = setupMetrics();
  
  // Initialize Express app
  const app: Application = express();
  const PORT: number = parseInt(process.env.PORT || '8080', 10);
  
  // Set logger in app.locals for access in routes
  app.locals.logger = logger;

  // Set up security middleware
  const { 
    corsMiddleware, 
    helmetMiddleware, 
    compressionMiddleware, 
    setupRateLimiting 
  } = setupSecurityMiddleware(logger);
  
  // Apply security middleware
  app.use(corsMiddleware);
  app.use(helmetMiddleware);
  app.use(compressionMiddleware);
  
  // Set up body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Set up request logging
  const { httpLogger, responseTimer, requestIdMiddleware } = setupRequestLogging(logger, httpRequestDurationMicroseconds);
  app.use(responseTimer);
  app.use(httpLogger);
  app.use(requestIdMiddleware);

  // Apply rate limiting if enabled
  if (process.env.ENABLE_GLOBAL_RATE_LIMIT === 'true') {
    logger.info('Global rate limiting enabled');
    app.use(async (req, res, next) => setupRateLimiting(req, res, next));
  }

  // Set up all routes
  setupRoutes(app, logger, metricsRegistry);

  // Set up error handlers - must be last
  const { notFoundHandler, errorHandler } = setupErrorHandlers(logger);
  app.use(notFoundHandler);
  app.use(errorHandler);

  // Function to start the server
  const startServer = (): Server => {
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`API Gateway listening on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`API Documentation available at: http://localhost:${PORT}/api-docs`);
      logger.info(`Worker: ${process.pid}`);
      
      // Log environment configuration
      logger.info(`Vehicle Service URL: ${process.env.VEHICLE_SERVICE_URL || 'Not set'}`);
      logger.info(`Available Routes: GET /api/vehicles/health-check, GET /api/vehicle-health, GET /api/diagnostics`);
      
      // After startup, check Redis connectivity
      waitForRedis(logger).then(available => {
        if (available) {
          logger.info('Redis connectivity confirmed - all systems operational');
        } else {
          logger.warn('Redis is not available - some features will be degraded');
        }
      }).catch(err => {
        logger.error(`Redis check failed: ${err}`);
      });
    });
    
    // Increase default timeout to handle slow upstream services
    server.timeout = parseInt(process.env.SERVER_TIMEOUT || '120000', 10);
    
    // Increase maximum number of listeners
    server.setMaxListeners(30);
    
    return server;
  };

  return { app, startServer, logger };
}

// Don't automatically initialize during tests
export const serverInstance = process.env.NODE_ENV === 'test' 
  ? null 
  : createServer();

// If running this file directly
if (require.main === module) {
  const { startServer } = createServer();
  startServer();
} 