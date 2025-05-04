import { Application, Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { Logger } from 'winston';

/**
 * Set up dedicated proxy for the Maintenance Service
 */
export async function setupAnalyticsServiceProxy(app: Application, logger: Logger) {
  try {
    const serviceUrl = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3003';
    
    logger.info(`Setting up analytics service proxy to ${serviceUrl}`);
    
    // Add direct health endpoint for quick testing
    app.get('/api/analytics-health', (req: Request, res: Response) => {
      logger.info('Root analytics health check accessed');
      res.status(200).json({
        status: 'ok',
        message: 'Analytics API health endpoint',
        timestamp: new Date().toISOString()
      });
    });
    
    // Create the proxy options
    const proxyOptions = {
      target: serviceUrl,
      changeOrigin: true,
      pathRewrite: {
        '^/api/analytics': '/api'
      },
      logLevel: 'debug' as const,
      onProxyReq: (proxyReq: any, req: Request, _res: Response) => {
        logger.info(`ANALYTICS PROXY REQ: ${req.method} ${req.originalUrl} -> ${serviceUrl}/api${req.originalUrl.replace('/api/analytics', '')}`);
        try {
          fixRequestBody(proxyReq, req);
        } catch (err) {
          logger.error(`Error fixing request body: ${err}`);
        }
      },
      onProxyRes: (proxyRes: any, req: Request, _res: Response) => {
        logger.info(`ANALYTICS PROXY RES: ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
      },
      onError: (err: Error, req: Request, res: Response) => {
        logger.error(`Analytics proxy error for ${req.url}: ${err.message}`);
        res.status(502).json({
          status: 'error',
          message: 'Analytics service unavailable',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
    };
    
    // Create the proxy middleware
    const proxy = createProxyMiddleware(proxyOptions);
    
    // Log all maintenance requests first
    app.use('/api/analytics', (req: Request, res: Response, next: NextFunction) => {
      logger.info(`ANALYTICS REQUEST: ${req.method} ${req.originalUrl}`);
      next();
    });
    
    // Add the maintenance health check route
    app.get('/api/analytics/health-check', (req: Request, res: Response) => {
      logger.info('Analytics health check endpoint hit');
      res.status(200).json({
        status: 'ok',
        message: 'Analytics service health check',
        timestamp: new Date().toISOString()
      });
    });
    
    // Route all other analytics requests to the proxy
    app.use('/api/analytics', proxy);
    
    logger.info('Analytics service proxy configured successfully');
    return true;
  } catch (error) {
    logger.error(`Failed to set up analytics service proxy: ${error}`);
    return false;
  }
} 