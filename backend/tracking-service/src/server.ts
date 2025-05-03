import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import winston from 'winston';
import dotenv from 'dotenv';
import compression from 'compression';
import responseTime from 'response-time';
import { Server } from 'http';
import promClient from 'prom-client';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';
import mongoose from 'mongoose';
import { createClient } from 'redis';

// Load environment variables
dotenv.config();

// Import routes and services
import setupTrackingRoutes from './routes/tracking-routes';
import { createLocationConsumer, createStatusConsumer, createEventConsumer } from './services/kafka-factory';

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
  if (req.headers['x-no-compression']) {
    return false;
  }
  
  const contentType = res.getHeader('Content-Type') as string || '';
  if (
    contentType.includes('text/event-stream') || 
    contentType.includes('image/') || 
    contentType.includes('video/')
  ) {
    return false;
  }
  
  return true;
}

// Create server function
export function createServer(customLogger?: winston.Logger) {
  // Create a logger
  const logger = customLogger || winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    defaultMeta: { service: 'tracking-service' },
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
  const PORT: number = parseInt(process.env.PORT || '3002', 10);
  
  // Set logger in app.locals for access in routes
  app.locals.logger = logger;

  // Connect to MongoDB
  const connectDB = async () => {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fleet-tracking';
    const RETRY_CONNECTS = parseInt(process.env.MONGODB_RETRY_CONNECTS || '5', 10);
    const RETRY_INTERVAL = parseInt(process.env.MONGODB_RETRY_INTERVAL || '5000', 10);
    
    let retries = 0;
    
    while (retries < RETRY_CONNECTS) {
      try {
        logger.info(`Connecting to MongoDB at ${MONGODB_URI} (attempt ${retries + 1}/${RETRY_CONNECTS})`);
        const conn = await mongoose.connect(MONGODB_URI);
        logger.info(`MongoDB Connected: ${conn.connection.host}`);
        return;
      } catch (error) {
        retries++;
        if (error instanceof Error) {
          logger.error(`MongoDB connection error: ${error.message}`);
        } else {
          logger.error('Unknown error connecting to MongoDB');
        }
        
        if (retries >= RETRY_CONNECTS) {
          logger.error(`Failed to connect to MongoDB after ${RETRY_CONNECTS} attempts. Exiting.`);
          process.exit(1);
        }
        
        logger.info(`Retrying in ${RETRY_INTERVAL}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
      }
    }
  };

  // Connect to Redis
  const connectRedis = async () => {
    const REDIS_URI = process.env.REDIS_URI || 'redis://localhost:6379';
    const RETRY_CONNECTS = parseInt(process.env.REDIS_RETRY_CONNECTS || '5', 10);
    const RETRY_INTERVAL = parseInt(process.env.REDIS_RETRY_INTERVAL || '5000', 10);
    
    let retries = 0;
    
    while (retries < RETRY_CONNECTS) {
      try {
        logger.info(`Connecting to Redis at ${REDIS_URI} (attempt ${retries + 1}/${RETRY_CONNECTS})`);
        const redisClient = createClient({ url: REDIS_URI });
        
        // Set up error logging for Redis
        redisClient.on('error', (err) => {
          logger.error(`Redis Error: ${err}`);
        });
        
        await redisClient.connect();
        logger.info(`Redis Connected: ${REDIS_URI}`);
        
        // Store the Redis client in app.locals for access in routes
        app.locals.redis = redisClient;
        
        return redisClient;
      } catch (error) {
        retries++;
        if (error instanceof Error) {
          logger.error(`Redis connection error: ${error.message}`);
        } else {
          logger.error('Unknown error connecting to Redis');
        }
        
        if (retries >= RETRY_CONNECTS) {
          logger.error(`Failed to connect to Redis after ${RETRY_CONNECTS} attempts. Exiting.`);
          process.exit(1);
        }
        
        logger.info(`Retrying in ${RETRY_INTERVAL}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
      }
    }
  };

  // Set up middleware
  app.use(cors());
  app.use(helmet());
  
  // Add compression for text-based content types
  app.use(compression({ 
    filter: shouldCompress,
    level: 6
  }));
  
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Add response time measurement
  app.use(responseTime((req: Request, res: Response, time: number) => {
    const route = req.originalUrl.split('?')[0] || 'unknown';
    const method = req.method || 'unknown';
    const statusCode = res.statusCode.toString() || 'unknown';
    
    httpRequestDurationMicroseconds
      .labels(method, route, statusCode)
      .observe(time / 1000);
      
    // Log slow requests
    if (time > 1000) {
      logger.warn(`Slow request: ${method} ${route} - ${time.toFixed(2)}ms`);
    }
  }));

  // Use morgan for HTTP request logging, sending logs to winston
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => {
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

  // Add metrics endpoint
  app.get('/metrics', async (req: Request, res: Response) => {
    res.set('Content-Type', metricsRegistry.contentType);
    res.end(await metricsRegistry.metrics());
  });

  // Set up Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "Tracking Service API Documentation",
    customfavIcon: "",
    customJs: '/custom.js'
  }));

  // Expose Swagger spec as JSON
  app.get('/api-docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ 
      status: 'OK', 
      message: 'Tracking Service is running',
      timestamp: new Date().toISOString()
    });
  });

  // Debug routes - will help us verify API Gateway connectivity
  app.get('/api/debug', (_req: Request, res: Response) => {
    logger.info('Debug route accessed');
    res.status(200).json({
      status: 'OK',
      message: 'Tracking Service debug route',
      timestamp: new Date().toISOString(),
      service: 'tracking-service'
    });
  });

  // Debug route for proxy testing
  app.get('/debug', (_req: Request, res: Response) => {
    logger.info('Root debug route accessed');
    res.status(200).json({
      status: 'OK',
      message: 'Tracking Service ROOT debug route',
      timestamp: new Date().toISOString(),
      service: 'tracking-service-root'
    });
  });

  // Debug middleware to log all requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(`Received request: ${req.method} ${req.path}`);
    next();
  });

  // Initialize Kafka consumers
  const initKafkaConsumers = () => {
    logger.info('Initializing Kafka consumers');
    
    // Create location consumer
    const locationConsumer = createLocationConsumer(logger, app.locals.redis);
    app.locals.locationConsumer = locationConsumer;
    
    // Create status consumer
    const statusConsumer = createStatusConsumer(logger, app.locals.redis);
    app.locals.statusConsumer = statusConsumer;
    
    // Create event consumer
    const eventConsumer = createEventConsumer(logger, app.locals.redis);
    app.locals.eventConsumer = eventConsumer;
    
    logger.info('Kafka consumers initialized');
  };

  // Set up routes - use the setup function with our logger
  setupTrackingRoutes(app);

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

  // Start the server
  const startServer = async (): Promise<Server> => {
    try {
      // Connect to MongoDB
      await connectDB();
      
      // Connect to Redis
      await connectRedis();
      
      // Initialize Kafka consumers
      initKafkaConsumers();
      
      // Global error handler
      app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
        logger.error(`Unhandled error: ${err.message}`);
        logger.error(err.stack || 'No stack trace available');
        
        res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
        });
      });
      
      // Start listening
      const server = app.listen(PORT, () => {
        logger.info(`Tracking Service running on port ${PORT}`);
      });
      
      // Set up graceful shutdown
      process.on('SIGTERM', () => {
        logger.info('SIGTERM received, shutting down gracefully');
        server.close(() => {
          logger.info('HTTP server closed');
          process.exit(0);
        });
      });
      
      return server;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Server startup error: ${error.message}`);
        logger.error(error.stack || 'No stack trace available');
      } else {
        logger.error('Unknown server startup error');
      }
      process.exit(1);
    }
  };

  return { app, startServer, logger };
}

// Default export for direct execution
export default createServer(); 

// If running this file directly
if (require.main === module) {
  const { startServer, logger } = createServer();
  startServer().catch(err => {
    logger.error(`Failed to start server: ${err}`);
    process.exit(1);
  });
} 