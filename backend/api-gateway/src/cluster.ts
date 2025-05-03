import cluster from 'cluster';
import os from 'os';
import { createServer } from './server';
import winston from 'winston';

// Get number of CPUs
const numCPUs = os.cpus().length;

// Create logger for cluster
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-gateway-cluster' },
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
  ],
});

// Determine number of workers to spawn
// In production, use all CPUs; in development, use fewer for easier debugging
const workerCount = process.env.NODE_ENV === 'production' 
  ? numCPUs 
  : Math.max(2, Math.min(numCPUs - 3, 4)); // At least 2, at most 4 or (numCPUs-1)

// Set worker count as environment variable for Redis client optimization
process.env.WORKER_COUNT = workerCount.toString();

// If we're the master process, spawn workers
if (cluster.isPrimary) {
  logger.info(`Master ${process.pid} is running`);
  logger.info(`Starting ${workerCount} workers out of ${numCPUs} available CPUs`);

  // Create workers with sequential IDs
  for (let i = 0; i < workerCount; i++) {
    // Set WORKER_ID environment variable for the worker
    // This helps with staggered service initialization
    cluster.fork({ WORKER_ID: i.toString() });
  }

  // Log when a worker exits and replace it
  cluster.on('exit', (worker, code, signal) => {
    const workerId = worker.process.pid || 'unknown';
    logger.warn(`Worker ${worker.process.pid} (ID: ${workerId}) died (code: ${code}, signal: ${signal})`);
    logger.info('Starting a new worker...');
    
    // When replacing a worker, try to reuse the same ID if possible
    const newWorker = cluster.fork({ WORKER_ID: workerId });
    logger.info(`Replacement worker ${newWorker.process.pid} started with ID: ${workerId}`);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down workers gracefully...');
    
    // Notify workers to finish their current request and then exit
    for (const id in cluster.workers) {
      if (cluster.workers[id]) {
        cluster.workers[id]?.send('shutdown');
      }
    }
    
    // After a timeout, force kill any remaining workers
    setTimeout(() => {
      logger.warn('Forcing shutdown of remaining workers...');
      process.exit(0);
    }, 30000);
  });
} else {
  // We're a worker process
  // Get WORKER_ID from environment
  const workerId = process.env.WORKER_ID || '0';
  
  // Create and start the server
  const { app, startServer } = createServer(logger);
  
  // Start the server
  const server = startServer();
  
  // Handle shutdown request from master
  process.on('message', msg => {
    if (msg === 'shutdown') {
      logger.info(`Worker ${process.pid} (ID: ${workerId}) shutting down...`);
      
      // Stop accepting new connections
      server.close(() => {
        logger.info(`Worker ${process.pid} has closed all connections`);
        process.exit(0);
      });
      
      // Force shutdown after timeout if connections are hanging
      setTimeout(() => {
        logger.warn(`Worker ${process.pid} forcing exit after timeout`);
        process.exit(1);
      }, 10000);
    }
  });
  
  logger.info(`Worker ${process.pid} (ID: ${workerId}) started`);
} 