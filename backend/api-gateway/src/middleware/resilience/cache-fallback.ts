import { Request, Response, NextFunction } from 'express';
import { createClient, RedisClientType } from 'redis';
import { Logger } from 'winston';

let redisClient: RedisClientType | null = null;

// Initialize Redis client
async function getRedisClient(): Promise<RedisClientType | null> {
  if (redisClient) return redisClient;
  
  const host = process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  
  try {
    redisClient = createClient({
      url: `redis://${host}:${port}`
    });
    
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Redis connection error:', error);
    return null;
  }
}

/**
 * Cache response data for fallback
 */
export function cacheResponse(
  serviceName: string,
  cacheTtl: number = 300, // Default 5 minutes
  logger: Logger
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET methods
    if (req.method !== 'GET') {
      return next();
    }
    
    // Generate a cache key based on the service and URL
    const cacheKey = `cache:${serviceName}:${req.originalUrl}`;
    
    // Store the original response methods
    const originalSend = res.send;
    const originalJson = res.json;
    const originalStatus = res.status;
    
    // Track if the response is cacheable (2xx response)
    let statusCode = 200;
    
    // Override status method to track status code
    res.status = function(code: number) {
      statusCode = code;
      return originalStatus.apply(res, [code]);
    };
    
    // Override send method to intercept and cache the response
    res.send = function(body: any) {
      // Only cache successful responses
      if (statusCode >= 200 && statusCode < 300) {
        // Run caching asynchronously - don't await
        (async () => {
          try {
            const client = await getRedisClient();
            if (client) {
              const cacheValue = JSON.stringify({
                statusCode,
                body,
                timestamp: Date.now()
              });
              await client.set(cacheKey, cacheValue, { EX: cacheTtl });
              logger.debug(`Cached response for ${cacheKey}`);
            }
          } catch (error) {
            logger.error(`Error caching response: ${error}`);
          }
        })();
      }
      
      return originalSend.apply(res, [body]);
    };
    
    // Override json method to intercept and cache the response
    res.json = function(body: any) {
      // Only cache successful responses
      if (statusCode >= 200 && statusCode < 300) {
        // Run caching asynchronously - don't await
        (async () => {
          try {
            const client = await getRedisClient();
            if (client) {
              const cacheValue = JSON.stringify({
                statusCode,
                body,
                timestamp: Date.now()
              });
              await client.set(cacheKey, cacheValue, { EX: cacheTtl });
              logger.debug(`Cached response for ${cacheKey}`);
            }
          } catch (error) {
            logger.error(`Error caching response: ${error}`);
          }
        })();
      }
      
      return originalJson.apply(res, [body]);
    };
    
    next();
  };
}

/**
 * Fallback to cached response if service fails
 */
export function cacheFallback(
  serviceName: string,
  maxAge: number = 3600, // Max age of cache to use as fallback (1 hour)
  logger: Logger
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip fallback for non-GET methods
    if (req.method !== 'GET') {
      return next();
    }
    
    // Generate a cache key based on the service and URL
    const cacheKey = `cache:${serviceName}:${req.originalUrl}`;
    
    try {
      // Attempt to get response from circuit breaker
      next();
    } catch (error) {
      // If we hit this, the circuit breaker has failed, try to use a cached response
      try {
        const client = await getRedisClient();
        if (client) {
          const cachedValue = await client.get(cacheKey);
          
          if (cachedValue) {
            const cached = JSON.parse(cachedValue);
            const cacheAge = (Date.now() - cached.timestamp) / 1000; // seconds
            
            // Only use cache if it's not too old
            if (cacheAge <= maxAge) {
              logger.info(`Using cached response for ${cacheKey} (age: ${cacheAge.toFixed(1)}s)`);
              
              // Add cache header
              res.setHeader('X-Cache', 'HIT');
              res.setHeader('X-Cache-Age', cacheAge.toFixed(1));
              
              return res.status(cached.statusCode).json(cached.body);
            }
          }
        }
      } catch (cacheError) {
        logger.error(`Error retrieving cache: ${cacheError}`);
      }
      
      // No valid cache, return a 503 error
      res.status(503).json({
        status: 'error',
        message: `Service ${serviceName} is currently unavailable`,
        service: serviceName
      });
    }
  };
}

export default {
  cacheResponse,
  cacheFallback
}; 