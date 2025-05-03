import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import winston from 'winston';
import dotenv from 'dotenv';
import compression from 'compression';
import responseTime from 'response-time';
import { getIpLimiter } from './middleware/rate-limiter';
import { createRedisClient, waitForRedis } from './util/redis-client';
import { Server } from 'http';
import promClient from 'prom-client';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';

// Load environment variables
dotenv.config();

// Import routes
import apiRoutes from './routes/api-routes';
import setupProxyRoutes from './routes/proxy-routes';

// Initialize metrics
const collectDefaultMetrics = promClient.collectDefaultMetrics;
const Registry = promClient.Registry;
const metricsRegistry = new Registry();
collectDefaultMetrics({ register: metricsRegistry });

// Create HTTP request duration metric
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});
metricsRegistry.registerMetric(httpRequestDurationMicroseconds);

// Check if request should be compressed
function shouldCompress(req: Request, res: Response) {
  // Don't compress responses for requests that contain 'x-no-compression' header
  if (req.headers['x-no-compression']) {
    return false;
  }
  
  // Skip compression for small responses (less than 1KB)
  // and for SSE which need to flush immediately
  const contentType = res.getHeader('Content-Type') as string || '';
  if (
    contentType.includes('text/event-stream') || 
    contentType.includes('image/') || 
    contentType.includes('video/')
  ) {
    return false;
  }
  
  // Compress everything else
  return true;
}

// Create server function - exported for use with clustering
export function createServer(customLogger?: winston.Logger) {
  // Create a logger
  const logger = customLogger || winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    defaultMeta: { service: 'api-gateway' },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.printf(info => {
            return `${info.timestamp} ${info.level}: ${info.message}`;
          })
        ),
      }),
      // Add file logging in production
      ...(process.env.NODE_ENV === 'production' ? [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
      ] : [])
    ],
  });

  // Initialize Express app
  const app: Application = express();
  const PORT: number = parseInt(process.env.PORT || '8080', 10);
  
  // Set logger in app.locals for access in routes
  app.locals.logger = logger;

  // Set up middleware
  app.use(cors());
  app.use(helmet());
  
  // Add compression for text-based content types
  app.use(compression({ 
    filter: shouldCompress,
    level: 6  // Default compression level (0-9, where 9 is maximum compression but slower)
  }));
  
  app.use(express.json({ limit: '1mb' }));  // Limit payload size
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Add response time measurement
  app.use(responseTime((req: Request, res: Response, time: number) => {
    const route = req.originalUrl.split('?')[0] || 'unknown';
    const method = req.method || 'unknown';
    const statusCode = res.statusCode.toString() || 'unknown';
    
    httpRequestDurationMicroseconds
      .labels(method, route, statusCode)
      .observe(time / 1000); // Convert from ms to seconds
      
    // Log slow requests
    if (time > 1000) { // Longer than 1 second
      logger.warn(`Slow request: ${method} ${route} - ${time.toFixed(2)}ms`);
    }
  }));

  // Use morgan for HTTP request logging, sending logs to winston
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => {
        // Remove newline character
        logger.http(message.trim());
      }
    }
  }));

  // Add request ID to each request
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = req.headers['x-request-id'] || Math.random().toString(36).substring(2, 15);
    res.setHeader('X-Request-ID', requestId);
    next();
  });

  // Apply global IP-based rate limiting as a last defense
  if (process.env.ENABLE_GLOBAL_RATE_LIMIT === 'true') {
    logger.info('Global rate limiting enabled');
    app.use(async (req, res, next) => {
      const limiter = await getIpLimiter(logger);
      limiter(req, res, next);
    });
  }

  // Add metrics endpoint
  app.get('/metrics', async (req: Request, res: Response) => {
    res.set('Content-Type', metricsRegistry.contentType);
    res.end(await metricsRegistry.metrics());
  });

  // Add debug endpoints to test routing
  app.get('/debug', (req: Request, res: Response) => {
    logger.info('Debug endpoint hit');
    res.status(200).json({ 
      status: 'OK', 
      message: 'API Gateway debug endpoint',
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/debug', (req: Request, res: Response) => {
    logger.info('API debug endpoint hit');
    res.status(200).json({ 
      status: 'OK', 
      message: 'API Gateway API debug endpoint',
      path: req.path,
      originalUrl: req.originalUrl,
      timestamp: new Date().toISOString()
    });
  });
  
  // Add diagnostic endpoint
  app.get('/api/diagnostics', async (req: Request, res: Response) => {
    logger.info('Diagnostics endpoint hit');
    
    // Get service URLs from environment
    const vehicleServiceUrl = process.env.VEHICLE_SERVICE_URL || 'http://localhost:3000';
    
    // Test connections
    const results = {
      timestamp: new Date().toISOString(),
      gateway: {
        status: 'ok',
        version: process.env.npm_package_version || '1.0.0'
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT
      },
      services: {} as any
    };
    
    // Import the diagnostics tools
    const { testServiceConnectivity } = await import('./debug-tools');
    
    // Test vehicle service
    try {
      const vehicleConnectivity = await testServiceConnectivity(
        'vehicle-service',
        vehicleServiceUrl,
        '/health',
        logger
      );
      
      results.services['vehicle-service'] = {
        url: vehicleServiceUrl,
        reachable: vehicleConnectivity,
        status: vehicleConnectivity ? 'ok' : 'unreachable'
      };
    } catch (error) {
      results.services['vehicle-service'] = {
        url: vehicleServiceUrl,
        reachable: false,
        status: 'error',
        error: error
      };
    }
    
    res.status(200).json(results);
  });

  // Set up Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "Fleet Management API Documentation",
    customfavIcon: "",
    customJs: '/custom.js'
  }));

  // Expose Swagger spec as JSON
  app.get('/api-docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Set up API Gateway's own routes
  app.use('/api/gateway', apiRoutes);

  // Set up vehicle service route explicitly
  const { setupVehicleServiceProxy } = require('./routes/vehicle-proxy');
  
  // Register vehicle service routes with detailed logging
  logger.info('Explicitly setting up vehicle service routes');
  setupVehicleServiceProxy(app, logger)
    .then((success: boolean) => {
      if (success) {
        logger.info('Vehicle service routes registered successfully');
      } else {
        logger.error('Failed to register vehicle service routes');
      }
    })
    .catch((err: Error) => {
      logger.error(`Error setting up vehicle service routes: ${err}`);
    });

  // Add a simple test endpoint to verify routing
  app.get('/api/test', (req: Request, res: Response) => {
    logger.info('Test endpoint hit');
    res.status(200).json({
      status: 'ok',
      message: 'API Gateway test endpoint',
      timestamp: new Date().toISOString()
    });
  });

  // Set up all the proxy routes
  setupProxyRoutes(app, logger);

  // Handle 404
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ status: 'error', message: 'Not found' });
  });

  // Error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error(`Error: ${err.message}`);
    logger.error(err.stack || 'No stack trace available');
    
    res.status(500).json({ 
      status: 'error', 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message 
    });
  });

  // Function to start the server
  const startServer = (): Server => {
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`API Gateway listening on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`API Documentation available at: http://localhost:${PORT}/api-docs`);
      logger.info(`Worker: ${process.pid}`);
      
      // Log all environment variables for debugging
      logger.info(`Vehicle Service URL: ${process.env.VEHICLE_SERVICE_URL || 'Not set'}`);
      logger.info(`Available Routes: GET /api/vehicles/health-check, GET /api/vehicle-health, GET /api/diagnostics`);
      
      // After startup, ensure Redis is available for optimal operation
      // Do this async to not block the server startup
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
    server.timeout = parseInt(process.env.SERVER_TIMEOUT || '120000', 10); // 2 minutes default
    
    // Increase maximum number of listeners
    server.setMaxListeners(30);
    
    return server;
  };

  // If running this file directly (not through cluster)
  if (require.main === module) {
    startServer();
  }

  return { app, startServer, logger };
}

// Default export for direct execution
export default createServer(); 