import { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { Logger } from 'winston';
import { getIpLimiter } from '../rate-limiter';

/**
 * Configure security middleware
 * @param logger Winston logger instance
 */
export function setupSecurityMiddleware(logger: Logger) {
  // Check if request should be compressed
  const shouldCompress = (req: Request, res: Response) => {
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
  };

  // Setup rate limiting middleware
  const setupRateLimiting = async (req: Request, res: Response, next: Function) => {
    const limiter = await getIpLimiter(logger);
    limiter(req, res, next);
  };

  // Create middleware
  const corsMiddleware = cors();
  const helmetMiddleware = helmet();
  const compressionMiddleware = compression({ 
    filter: shouldCompress,
    level: 6
  });

  return {
    corsMiddleware,
    helmetMiddleware,
    compressionMiddleware,
    setupRateLimiting
  };
}

export default setupSecurityMiddleware; 