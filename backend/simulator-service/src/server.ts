import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import morgan from 'morgan';
import responseTime from 'response-time';
import { config } from './config';
import { setupKafkaProducer } from './services/kafka.service';
import { errorHandler } from './middleware/error.middleware';
import { simulatorRoutes } from './routes/simulator.routes';
import { logger } from './util/logger';

// Initialize express app
const app = express();

// Apply middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));
app.use(responseTime());

// Root-level health check for Docker healthcheck
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'simulator-service',
    timestamp: new Date().toISOString()
  });
});

// Apply routes
app.use('/api', simulatorRoutes);

// Apply error handler
app.use(errorHandler);

// Connect to MongoDB
const startServer = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    logger.info('Connected to MongoDB');

    // Setup Kafka producer
    await setupKafkaProducer();

    // Start the server
    const server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err: Error) => {
      logger.error('Unhandled Rejection:', { 
        error: err.message,
        stack: err.stack
      });
      
      if (process.env.NODE_ENV === 'production') {
        logger.warn('Unhandled rejection occurred');
      } else {
        logger.warn('Shutting down due to unhandled rejection in non-production environment');
        server.close(() => process.exit(1));
      }
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err: Error) => {
      logger.error('Uncaught Exception:', { 
        error: err.message,
        stack: err.stack
      });

      if (process.env.NODE_ENV === 'production') {
        logger.warn('Unhandled exception occurred');
      } else {
        logger.warn('Shutting down due to unhandled exception in non-production environment');
        server.close(() => process.exit(1));
      }
    });

    // Handle SIGTERM
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received');
      server.close(() => process.exit(0));
    });
    
    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    // Don't exit the process during tests
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

// NODE_ENV is typically set to 'test' by Jest
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app, startServer }; 