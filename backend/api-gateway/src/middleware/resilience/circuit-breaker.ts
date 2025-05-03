import CircuitBreaker from 'opossum';
import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';

// Default circuit breaker options
const DEFAULT_OPTIONS = {
  timeout: 3000, // If our function takes longer than 3 seconds, trigger a failure
  errorThresholdPercentage: 50, // When 50% of requests fail, open the circuit
  resetTimeout: 30000, // After 30 seconds, try again
  rollingCountTimeout: 10000, // Sets the duration of the statistical rolling window
  rollingCountBuckets: 10, // Sets the number of buckets the rolling window is divided into
  volumeThreshold: 10, // The minimum number of requests in the rolling window required before tripping
  errorFilter: (err: Error) => {
    // Determine which errors should count as failures (return true to filter out)
    return err.message.includes('429'); // Don't count rate limiting as a failure
  }
};

/**
 * A factory function that creates circuit breaker middleware for Express
 * @param serviceName The name of the service being protected
 * @param logger Winston logger instance
 * @param options Custom circuit breaker options
 */
export function createCircuitBreaker(
  serviceName: string, 
  logger: Logger,
  options: Partial<CircuitBreaker.Options> = {}
) {
  const serviceOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
    name: serviceName
  };

  // Create a circuit breaker for this service
  const breaker = new CircuitBreaker(
    // The function to protect
    async (req: Request, res: Response, next: NextFunction) => {
      return new Promise((resolve) => {
        // We'll just use this as a pass-through to the next middleware
        // The actual request will be handled by the proxy middleware
        next();
        resolve(true);
      });
    },
    serviceOptions
  );

  // Set up event listeners
  breaker.on('open', () => {
    logger.warn(`Circuit breaker for ${serviceName} is now OPEN (failing fast)`);
  });

  breaker.on('close', () => {
    logger.info(`Circuit breaker for ${serviceName} is now CLOSED (operating normally)`);
  });

  breaker.on('halfOpen', () => {
    logger.info(`Circuit breaker for ${serviceName} is now HALF OPEN (testing if service is healthy)`);
  });

  breaker.on('fallback', () => {
    logger.warn(`Circuit breaker for ${serviceName} fallback executed`);
  });

  // Return middleware function
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if circuit is open
    if (breaker.opened) {
      logger.warn(`Circuit open for ${serviceName}, rejecting request`);
      return res.status(503).json({
        status: 'error',
        message: `Service ${serviceName} is currently unavailable. Please try again later.`,
        service: serviceName
      });
    }

    breaker.fire(req, res, next)
      .catch((err) => {
        logger.error(`Circuit breaker for ${serviceName} error: ${err.message}`);
        res.status(500).json({
          status: 'error',
          message: 'An unexpected error occurred',
          service: serviceName
        });
      });
  };
}

export default createCircuitBreaker; 