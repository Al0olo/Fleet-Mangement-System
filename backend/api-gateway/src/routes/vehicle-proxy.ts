import { Application, Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { Logger } from 'winston';

/**
 * Set up dedicated proxy for the Vehicle Service
 */
export async function setupVehicleServiceProxy(app: Application, logger: Logger) {
  try {
    const serviceUrl = process.env.VEHICLE_SERVICE_URL || 'http://localhost:3000';
    
    logger.info(`Setting up vehicle service proxy to ${serviceUrl}`);
    
    // Add direct health endpoint for quick testing
    app.get('/api/vehicle-health', (req: Request, res: Response) => {
      logger.info('Root vehicle health check accessed');
      res.status(200).json({
        status: 'ok',
        message: 'Vehicle API health endpoint',
        timestamp: new Date().toISOString()
      });
    });
    
    // Create the proxy options
    const proxyOptions = {
      target: serviceUrl,
      changeOrigin: true,
      pathRewrite: {
        '^/api/vehicles': '/api'
      },
      logLevel: 'debug' as const,
      onProxyReq: (proxyReq: any, req: Request, _res: Response) => {
        logger.info(`VEHICLE PROXY REQ: ${req.method} ${req.originalUrl} -> ${serviceUrl}/api${req.originalUrl.replace('/api/vehicles', '')}`);
        try {
          fixRequestBody(proxyReq, req);
        } catch (err) {
          logger.error(`Error fixing request body: ${err}`);
        }
      },
      onProxyRes: (proxyRes: any, req: Request, _res: Response) => {
        logger.info(`VEHICLE PROXY RES: ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
      },
      onError: (err: Error, req: Request, res: Response) => {
        logger.error(`Vehicle proxy error for ${req.url}: ${err.message}`);
        res.status(502).json({
          status: 'error',
          message: 'Vehicle service unavailable',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
    };
    
    // Create the proxy middleware
    const proxy = createProxyMiddleware(proxyOptions);
    
    // Log all vehicle requests first
    app.use('/api/vehicles', (req: Request, res: Response, next: NextFunction) => {
      logger.info(`VEHICLE REQUEST: ${req.method} ${req.originalUrl}`);
      next();
    });
    
    // Add the vehicle health check route
    app.get('/api/vehicles/health-check', (req: Request, res: Response) => {
      logger.info('Vehicle health check endpoint hit');
      res.status(200).json({
        status: 'ok',
        message: 'Vehicle service health check',
        timestamp: new Date().toISOString()
      });
    });
    
    // Route all other vehicle requests to the proxy
    app.use('/api/vehicles', proxy);
    
    logger.info('Vehicle service proxy configured successfully');
    return true;
  } catch (error) {
    logger.error(`Failed to set up vehicle service proxy: ${error}`);
    return false;
  }
} 