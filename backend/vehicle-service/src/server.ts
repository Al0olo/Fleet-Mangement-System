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

// Load environment variables
dotenv.config();

// Import routes
import setupVehicleRoutes from './routes/vehicle-routes';

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
    defaultMeta: { service: 'vehicle-service' },
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
  const PORT: number = parseInt(process.env.PORT || '3000', 10);
  
  // Set logger in app.locals for access in routes
  app.locals.logger = logger;

  // Connect to MongoDB
  const connectDB = async () => {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fleet-vehicles');
      logger.info(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Error: ${error.message}`);
      } else {
        logger.error('Unknown error connecting to MongoDB');
      }
      process.exit(1);
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
    customSiteTitle: "Vehicle Service API Documentation",
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
      message: 'Vehicle Service is running',
      timestamp: new Date().toISOString()
    });
  });

  // Debug routes - will help us verify API Gateway connectivity
  app.get('/api/debug', (_req: Request, res: Response) => {
    logger.info('Debug route accessed');
    res.status(200).json({
      status: 'OK',
      message: 'Vehicle Service debug route',
      timestamp: new Date().toISOString(),
      service: 'vehicle-service'
    });
  });

  // Debug route for proxy testing
  app.get('/debug', (_req: Request, res: Response) => {
    logger.info('Root debug route accessed');
    res.status(200).json({
      status: 'OK',
      message: 'Vehicle Service ROOT debug route',
      timestamp: new Date().toISOString(),
      service: 'vehicle-service-root'
    });
  });

  // Debug middleware to log all requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(`Received request: ${req.method} ${req.path}`);
    next();
  });

  // Set up routes - use the setup function with our logger
  app.use('/api', setupVehicleRoutes(logger));

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
  const startServer = async (): Promise<Server> => {
    // Connect to MongoDB first
    await connectDB();
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Vehicle Service listening on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`API Documentation available at: http://localhost:${PORT}/api-docs`);
      logger.info(`Worker: ${process.pid}`);
    });
    
    // Increase default timeout
    server.timeout = parseInt(process.env.SERVER_TIMEOUT || '60000', 10);
    
    return server;
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