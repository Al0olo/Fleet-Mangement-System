import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { Logger } from 'winston';
import responseTime from 'response-time';

/**
 * Setup request logging middleware
 * @param logger Winston logger instance
 * @param durationMetric Optional Prometheus duration metric
 */
export function setupRequestLogging(logger: Logger, durationMetric?: any) {
  // Morgan HTTP logger that sends to winston
  const httpLogger = morgan('combined', {
    stream: {
      write: (message: string) => {
        logger.http(message.trim());
      }
    }
  });

  // Response time tracker
  const responseTimer = responseTime((req: Request, res: Response, time: number) => {
    const route = req.originalUrl.split('?')[0] || 'unknown';
    const method = req.method || 'unknown';
    const statusCode = res.statusCode.toString() || 'unknown';
    
    // Record metric if provided
    if (durationMetric) {
      durationMetric
        .labels(method, route, statusCode)
        .observe(time / 1000); // Convert from ms to seconds
    }
      
    // Log slow requests
    if (time > 1000) { // Longer than 1 second
      logger.warn(`Slow request: ${method} ${route} - ${time.toFixed(2)}ms`);
    }
  });

  // Request ID middleware
  const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.headers['x-request-id'] || Math.random().toString(36).substring(2, 15);
    res.setHeader('X-Request-ID', requestId);
    next();
  };

  return {
    httpLogger,
    responseTimer,
    requestIdMiddleware
  };
}

export default setupRequestLogging; 