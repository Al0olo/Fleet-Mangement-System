import { createClient, RedisClientType } from 'redis';
import IORedis from 'ioredis';
import { Logger } from 'winston';
import cluster from 'cluster';

// Singleton redis clients per worker
let redisClient: RedisClientType | null = null;
let ioRedisClient: IORedis | null = null;

// Worker ID for logging
const workerId = process.pid;

/**
 * Wait for Redis to be available before proceeding
 */
export const waitForRedis = async (logger: Logger): Promise<boolean> => {
  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const maxRetries = parseInt(process.env.REDIS_CONNECT_RETRIES || '30', 10);
  const retryDelay = parseInt(process.env.REDIS_CONNECT_RETRY_DELAY || '1000', 10);
  
  logger.info(`Worker ${workerId}: Waiting for Redis at ${host}:${port}...`);
  
  let redis: IORedis | null = null;
  
  try {
    redis = new IORedis({
      host,
      port,
      connectTimeout: 5000,
      maxRetriesPerRequest: 1,
      retryStrategy: () => retryDelay,
      showFriendlyErrorStack: true
    });
    
    let isConnected = false;
    let retries = 0;
    
    // Handle connection events
    redis.on('connect', () => {
      logger.info(`Worker ${workerId}: Redis connection established!`);
      isConnected = true;
    });
    
    redis.on('error', (err) => {
      if (retries < maxRetries) {
        logger.error(`Worker ${workerId}: Redis connection error (attempt ${retries}): ${err.message}`);
      }
    });
    
    // Retry until connected or max retries reached
    while (!isConnected && retries < maxRetries) {
      try {
        await redis.ping();
        isConnected = true;
        logger.info(`Worker ${workerId}: Successfully connected to Redis`);
      } catch (err) {
        retries++;
        if (retries % 5 === 0) { // Only log every 5th retry to reduce noise
          logger.warn(`Worker ${workerId}: Redis not available yet. Retrying (${retries}/${maxRetries})...`);
        }
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    // Clean up this temporary connection
    try {
      if (redis) {
        await redis.quit();
      }
    } catch (err) {
      // Ignore quit errors
    }
    
    if (!isConnected) {
      logger.error(`Worker ${workerId}: Failed to connect to Redis after ${maxRetries} attempts`);
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error(`Worker ${workerId}: Error in waitForRedis: ${error}`);
    
    // Clean up on error
    if (redis) {
      try {
        await redis.quit();
      } catch (err) {
        // Ignore quit errors
      }
    }
    
    return false;
  }
};

/**
 * Get a Redis client (IORedis)
 * This uses IORedis's built-in connection pooling rather than a separate pool
 */
export const getRedisClient = async (logger: Logger): Promise<IORedis> => {
  if (ioRedisClient) {
    try {
      // Test the existing connection before returning it
      await ioRedisClient.ping();
      return ioRedisClient;
    } catch (err) {
      // Connection is broken, create a new one
      logger.warn(`Worker ${workerId}: Redis connection failed, will create a new one: ${err}`);
      try {
        await ioRedisClient.disconnect();
      } catch (e) {
        // Ignore disconnection errors
      }
      ioRedisClient = null;
    }
  }
  
  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  
  // Use a small delay based on worker ID to prevent all workers from connecting simultaneously
  // This helps avoid overwhelming Redis with concurrent connection attempts
  const workerStartupDelay = (cluster.isWorker ? parseInt(process.env.WORKER_ID || '0', 10) % 5 : 0) * 200;
  
  if (workerStartupDelay > 0) {
    logger.debug(`Worker ${workerId}: Staggered Redis connection initialization, waiting ${workerStartupDelay}ms`);
    await new Promise(resolve => setTimeout(resolve, workerStartupDelay));
  }
  
  // Create a new client with built-in connection pooling
  logger.info(`Worker ${workerId}: Creating new Redis client`);
  
  ioRedisClient = new IORedis({
    host,
    port,
    db: 0,
    connectTimeout: 10000,
    // IORedis has its own connection pooling - configure it
    connectionName: `api-gateway-worker-${workerId}`,
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      // Exponential backoff with jitter
      const delay = Math.min(times * 100, 2000) + Math.floor(Math.random() * 100);
      logger.debug(`Worker ${workerId}: Redis connection retry in ${delay}ms (attempt ${times})`);
      return delay;
    },
    reconnectOnError: (err) => {
      const targetError = "READONLY";
      if (err.message.includes(targetError)) {
        // Only reconnect on specific errors
        return true;
      }
      return false;
    }
  });
  
  // Set up event listeners
  ioRedisClient.on('error', (err) => {
    logger.error(`Worker ${workerId}: Redis error: ${err.message}`);
  });
  
  ioRedisClient.on('ready', () => {
    logger.info(`Worker ${workerId}: Redis client ready`);
  });
  
  ioRedisClient.on('reconnecting', () => {
    logger.warn(`Worker ${workerId}: Redis reconnecting...`);
  });
  
  ioRedisClient.on('close', () => {
    logger.debug(`Worker ${workerId}: Redis connection closed`);
  });
  
  ioRedisClient.on('end', () => {
    logger.info(`Worker ${workerId}: Redis connection ended`);
    ioRedisClient = null;
  });
  
  // Wait for the connection to be ready
  try {
    await ioRedisClient.ping();
    logger.info(`Worker ${workerId}: Successfully connected to Redis`);
    return ioRedisClient;
  } catch (err) {
    logger.error(`Worker ${workerId}: Failed to connect to Redis: ${err}`);
    throw err;
  }
};

/**
 * Get standard Node Redis client (legacy)
 */
export const getLegacyRedisClient = async (): Promise<RedisClientType | null> => {
  if (redisClient) return redisClient;
  
  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  
  try {
    redisClient = createClient({
      url: `redis://${host}:${port}`,
      socket: {
        connectTimeout: 20000,
        reconnectStrategy: (retries) => {
          const delay = Math.min(retries * 100, 3000);
          return delay;
        }
      }
    });
    
    // Set up listeners before connecting
    redisClient.on('error', (err) => {
      console.error(`Worker ${workerId}: Redis client error:`, err);
    });
    
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error(`Worker ${workerId}: Redis connection error:`, error);
    return null;
  }
};

/**
 * Create Redis client with appropriate approach
 */
export const createRedisClient = async (logger: Logger, useLegacy = false): Promise<IORedis | RedisClientType | null> => {
  try {
    if (useLegacy) {
      return getLegacyRedisClient();
    } else {
      return getRedisClient(logger);
    }
  } catch (err) {
    logger.error(`Worker ${workerId}: Failed to create Redis client: ${err}`);
    return null;
  }
};

/**
 * Gracefully disconnect Redis
 */
export const shutdownRedis = async (logger: Logger): Promise<void> => {
  logger.info(`Worker ${workerId}: Shutting down Redis connections`);
  
  // Cleanup IORedis client
  if (ioRedisClient) {
    try {
      await ioRedisClient.quit();
      ioRedisClient = null;
      logger.info(`Worker ${workerId}: IORedis client shutdown complete`);
    } catch (err) {
      logger.error(`Worker ${workerId}: Error shutting down IORedis client: ${err}`);
    }
  }
  
  // Cleanup legacy Redis client
  if (redisClient) {
    try {
      await redisClient.quit();
      redisClient = null;
      logger.info(`Worker ${workerId}: Legacy Redis client shutdown complete`);
    } catch (err) {
      logger.error(`Worker ${workerId}: Error shutting down legacy Redis client: ${err}`);
    }
  }
};

export default {
  waitForRedis,
  getRedisClient,
  getLegacyRedisClient,
  createRedisClient,
  shutdownRedis
}; 