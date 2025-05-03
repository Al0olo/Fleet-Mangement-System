import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';

/**
 * Setup error handling middleware
 * @param logger Winston logger instance
 */
export function setupErrorHandlers(logger: Logger) {
  // 404 handler middleware
  const notFoundHandler = (_req: Request, res: Response) => {
    res.status(404).json({ status: 'error', message: 'Not found' });
  };

  // Error handler middleware
  const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error(`Error: ${err.message}`);
    logger.error(err.stack || 'No stack trace available');
    
    res.status(500).json({ 
      status: 'error', 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message 
    });
  };

  return {
    notFoundHandler,
    errorHandler
  };
}

export default setupErrorHandlers; 