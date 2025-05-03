import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import RedisStore from 'rate-limit-redis';
import { Logger } from 'winston';
import RedisClient from "../util/redis-client";

// Load environment variables for rate limiting configuration
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15 minutes default

// Create singleton limiters - these will be initialized when first needed
let standardLimiter: ReturnType<typeof rateLimit>;
let strictLimiter: ReturnType<typeof rateLimit>;
let ipLimiter: any = null;

/**
 * Get a standard rate limiter with moderate limits
 */
export const getStandardLimiter = async (logger: Logger) => {
  // Return cached limiter if already created
  if (standardLimiter) {
    return standardLimiter;
  }

  // Standard rate limits - more generous than strict
  const windowMs = process.env.STANDARD_RATE_LIMIT_WINDOW_MS 
    ? parseInt(process.env.STANDARD_RATE_LIMIT_WINDOW_MS, 10) 
    : 60 * 1000; // 1 minute default
  
  const max = process.env.STANDARD_RATE_LIMIT_MAX 
    ? parseInt(process.env.STANDARD_RATE_LIMIT_MAX, 10) 
    : 120; // 120 requests per window default
    
  try {
    // Try to get a Redis client for the rate limiter
    const redisClient = await RedisClient.getRedisClient(logger);
    
    if (redisClient) {
      // Create Redis store for rate limiting
      const redisStore = new RedisStore({
        sendCommand: async (command: string, ...args: any[]) => {
          return redisClient.call(command, ...args) as any;
        },
        prefix: 'ratelimit:standard:',
      });
      
      // Create and cache the rate limiter
      standardLimiter = rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        store: redisStore,
        handler: (req: Request, res: Response) => {
          logger.warn(`Standard rate limit exceeded for IP: ${req.ip}`);
          res.status(429).json({
            status: 'error',
            message: 'Too many requests, please try again later.'
          });
        },
      });
      
      return standardLimiter;
    } else {
      throw new Error('Redis client not available');
    }
  } catch (err) {
    // Fallback to memory store if Redis is not available
    logger.warn(`Falling back to memory store for standard rate limiting: ${err}`);
    
    standardLimiter = rateLimit({
      windowMs,
      max,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        logger.warn(`Standard rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
          status: 'error',
          message: 'Too many requests, please try again later.'
        });
      },
    });
    
    return standardLimiter;
  }
};

/**
 * Get a strict rate limiter with lower limits
 */
export const getStrictLimiter = async (logger: Logger) => {
  // Return cached limiter if already created
  if (strictLimiter) {
    return strictLimiter;
  }

  // Strict rate limits - more restrictive
  const windowMs = process.env.STRICT_RATE_LIMIT_WINDOW_MS 
    ? parseInt(process.env.STRICT_RATE_LIMIT_WINDOW_MS, 10) 
    : 60 * 1000; // 1 minute default
  
  const max = process.env.STRICT_RATE_LIMIT_MAX 
    ? parseInt(process.env.STRICT_RATE_LIMIT_MAX, 10) 
    : 20; // 20 requests per window default
    
  try {
    // Try to get a Redis client for the rate limiter
    const redisClient = await RedisClient.getRedisClient(logger);
    
    if (redisClient) {
      // Create Redis store for rate limiting
      const redisStore = new RedisStore({
        sendCommand: async (command: string, ...args: any[]) => {
          return redisClient.call(command, ...args) as any;
        },
        prefix: 'ratelimit:strict:',
      });
      
      // Create and cache the rate limiter
      strictLimiter = rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        store: redisStore,
        handler: (req: Request, res: Response) => {
          logger.warn(`Strict rate limit exceeded for IP: ${req.ip}`);
          res.status(429).json({
            status: 'error',
            message: 'Too many requests, please try again later.'
          });
        },
      });
      
      return strictLimiter;
    } else {
      throw new Error('Redis client not available');
    }
  } catch (err) {
    // Fallback to memory store if Redis is not available
    logger.warn(`Falling back to memory store for strict rate limiting: ${err}`);
    
    strictLimiter = rateLimit({
      windowMs,
      max,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        logger.warn(`Strict rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
          status: 'error',
          message: 'Too many requests, please try again later.'
        });
      },
    });
    
    return strictLimiter;
  }
};

/**
 * Get an IP-based rate limiter
 */
export const getIpLimiter = async (logger: Logger) => {
  // Return cached rate limiter if already created
  if (ipLimiter) {
    return ipLimiter;
  }

  // Determine window and max based on environment
  const windowMs = process.env.RATE_LIMIT_WINDOW_MS 
    ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) 
    : 60 * 1000; // 1 minute default
  
  const max = process.env.RATE_LIMIT_MAX 
    ? parseInt(process.env.RATE_LIMIT_MAX, 10) 
    : 100; // 100 requests per window default
    
  try {
    // Try to get a Redis client for the rate limiter
    const redisClient = await RedisClient.getRedisClient(logger);
    
    if (redisClient) {
      logger.info(`Creating rate limiter with Redis store`);
      
      // Create Redis store for rate limiting
      const redisStore = new RedisStore({
        // Fix the type issue by using type assertion
        sendCommand: async (command: string, ...args: any[]) => {
          return redisClient.call(command, ...args) as any;
        },
        prefix: 'ratelimit:',
      });
      
      // Create and cache the rate limiter
      ipLimiter = rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        store: redisStore,
        handler: (req: Request, res: Response) => {
          logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
          res.status(429).json({
            status: 'error',
            message: 'Too many requests, please try again later.'
          });
        },
      });
      
      logger.info('Rate limiter created with store type: Redis');
      return ipLimiter;
    } else {
      throw new Error('Redis client not available');
    }
  } catch (err) {
    // Fallback to memory store if Redis is not available
    logger.warn(`Falling back to memory store for rate limiting: ${err}`);
    
    ipLimiter = rateLimit({
      windowMs,
      max,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
          status: 'error',
          message: 'Too many requests, please try again later.'
        });
      },
    });
    
    logger.info('Rate limiter created with store type: Memory');
    return ipLimiter;
  }
};

// Service-specific rate limiter factory function
export const createServiceLimiter = async (
  serviceName: string, 
  maxRequests: number | undefined = undefined,
  logger: Logger
) => {
  // Create a new limiter for the service
  const windowMs = WINDOW_MS;
  const max = maxRequests || MAX_REQUESTS;
  
  try {
    // Try to get a Redis client for the rate limiter
    const redisClient = await RedisClient.getRedisClient(logger);
    
    if (redisClient) {
      // Create Redis store for rate limiting
      const redisStore = new RedisStore({
        // Fix the type issue by using type assertion
        sendCommand: async (command: string, ...args: any[]) => {
          return redisClient.call(command, ...args) as any;
        },
        prefix: `ratelimit:${serviceName}:`,
      });
      
      return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        store: redisStore,
        keyGenerator: (req) => {
          const instanceId = process.env.INSTANCE_ID || 'default';
          const clientIP = req.ip || 'unknown';
          return `${instanceId}:${clientIP}`;
        },
        handler: (req: Request, res: Response) => {
          logger.warn(`Rate limit exceeded for IP: ${req.ip} on service: ${serviceName}`);
          res.status(429).json({
            status: 'error',
            message: 'Too many requests, please try again later.'
          });
        },
      });
    } else {
      throw new Error('Redis client not available');
    }
  } catch (err) {
    // Fallback to memory store if Redis is not available
    logger.warn(`Falling back to memory store for rate limiting service ${serviceName}: ${err}`);
    
    return rateLimit({
      windowMs,
      max,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        const instanceId = process.env.INSTANCE_ID || 'default';
        const clientIP = req.ip || 'unknown';
        return `${instanceId}:${serviceName}:${clientIP}`;
      },
      handler: (req: Request, res: Response) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip} on service: ${serviceName}`);
        res.status(429).json({
          status: 'error',
          message: 'Too many requests, please try again later.'
        });
      },
    });
  }
};

export default {
  getIpLimiter,
  createServiceLimiter,
}; 