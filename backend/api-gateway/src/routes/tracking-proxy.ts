import { Application, Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { Logger } from 'winston';

/**
 * Set up dedicated proxy for the Tracking Service
 */
export async function setupTrackingServiceProxy(app: Application, logger: Logger) {
  try {
    const serviceUrl = process.env.TRACKING_SERVICE_URL || 'http://localhost:3002';
    
    logger.info(`Setting up tracking service proxy to ${serviceUrl}`);
    
    // Add direct health endpoint for quick testing
    app.get('/api/tracking-health', (req: Request, res: Response) => {
      logger.info('Root tracking health check accessed');
      res.status(200).json({
        status: 'ok',
        message: 'Tracking API health endpoint',
        timestamp: new Date().toISOString()
      });
    });
    
    // Create the proxy options
    const proxyOptions = {
      target: serviceUrl,
      changeOrigin: true,
      pathRewrite: {
        '^/api/tracking': '/api'
      },
      logLevel: 'debug' as const,
      onProxyReq: (proxyReq: any, req: Request, _res: Response) => {
        logger.info(`TRACKING PROXY REQ: ${req.method} ${req.originalUrl} -> ${serviceUrl}/api${req.originalUrl.replace('/api/tracking', '')}`);
        try {
          fixRequestBody(proxyReq, req);
        } catch (err) {
          logger.error(`Error fixing request body: ${err}`);
        }
      },
      onProxyRes: (proxyRes: any, req: Request, _res: Response) => {
        logger.info(`TRACKING PROXY RES: ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
      },
      onError: (err: Error, req: Request, res: Response) => {
        logger.error(`Tracking proxy error for ${req.url}: ${err.message}`);
        res.status(502).json({
          status: 'error',
          message: 'Tracking service unavailable',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
    };
    
    // Create the proxy middleware
    const proxy = createProxyMiddleware(proxyOptions);
    
    // Log all tracking requests first
    app.use('/api/tracking', (req: Request, res: Response, next: NextFunction) => {
      logger.info(`TRACKING REQUEST: ${req.method} ${req.originalUrl}`);
      next();
    });
    
    // Add the tracking health check route
    app.get('/api/tracking/health-check', (req: Request, res: Response) => {
      logger.info('Tracking health check endpoint hit');
      res.status(200).json({
        status: 'ok',
        message: 'Tracking service health check',
        timestamp: new Date().toISOString()
      });
    });
    
    // Route all other tracking requests to the proxy
    app.use('/api/tracking', proxy);
    
    logger.info('Tracking service proxy configured successfully');
    return true;
  } catch (error) {
    logger.error(`Failed to set up tracking service proxy: ${error}`);
    return false;
  }
} 