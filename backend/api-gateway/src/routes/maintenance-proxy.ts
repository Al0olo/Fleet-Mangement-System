import { Application, Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { Logger } from 'winston';

/**
 * Set up dedicated proxy for the Maintenance Service
 */
export async function setupMaintenanceServiceProxy(app: Application, logger: Logger) {
  try {
    const serviceUrl = process.env.MAINTENANCE_SERVICE_URL || 'http://localhost:3002';
    
    logger.info(`Setting up maintenance service proxy to ${serviceUrl}`);
    
    // Add direct health endpoint for quick testing
    app.get('/api/maintenance-health', (req: Request, res: Response) => {
      logger.info('Root maintenance health check accessed');
      res.status(200).json({
        status: 'ok',
        message: 'Maintenance API health endpoint',
        timestamp: new Date().toISOString()
      });
    });
    
    // Create the proxy options
    const proxyOptions = {
      target: serviceUrl,
      changeOrigin: true,
      pathRewrite: {
        '^/api/maintenance': '/api'
      },
      logLevel: 'debug' as const,
      onProxyReq: (proxyReq: any, req: Request, _res: Response) => {
        logger.info(`MAINTENANCE PROXY REQ: ${req.method} ${req.originalUrl} -> ${serviceUrl}/api${req.originalUrl.replace('/api/maintenance', '')}`);
        try {
          fixRequestBody(proxyReq, req);
        } catch (err) {
          logger.error(`Error fixing request body: ${err}`);
        }
      },
      onProxyRes: (proxyRes: any, req: Request, _res: Response) => {
        logger.info(`MAINTENANCE PROXY RES: ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
      },
      onError: (err: Error, req: Request, res: Response) => {
        logger.error(`Maintenance proxy error for ${req.url}: ${err.message}`);
        res.status(502).json({
          status: 'error',
          message: 'Maintenance service unavailable',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
    };
    
    // Create the proxy middleware
    const proxy = createProxyMiddleware(proxyOptions);
    
    // Log all maintenance requests first
    app.use('/api/maintenance', (req: Request, res: Response, next: NextFunction) => {
      logger.info(`MAINTENANCE REQUEST: ${req.method} ${req.originalUrl}`);
      next();
    });
    
    // Add the maintenance health check route
    app.get('/api/maintenance/health-check', (req: Request, res: Response) => {
      logger.info('Maintenance health check endpoint hit');
      res.status(200).json({
        status: 'ok',
        message: 'Maintenance service health check',
        timestamp: new Date().toISOString()
      });
    });
    
    // Route all other maintenance requests to the proxy
    app.use('/api/maintenance', proxy);
    
    logger.info('Maintenance service proxy configured successfully');
    return true;
  } catch (error) {
    logger.error(`Failed to set up maintenance service proxy: ${error}`);
    return false;
  }
} 