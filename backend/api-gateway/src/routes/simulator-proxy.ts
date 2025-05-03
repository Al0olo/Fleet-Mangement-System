import { Application, Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { Logger } from 'winston';

/**
 * Set up dedicated proxy for the Simulator Service
 */
export async function setupSimulatorServiceProxy(app: Application, logger: Logger) {
  try {
    const serviceUrl = process.env.SIMULATOR_SERVICE_URL || 'http://localhost:3004';
    
    logger.info(`Setting up simulator service proxy to ${serviceUrl}`);
    
    // Add direct health endpoint for quick testing
    app.get('/api/simulator-health', (req: Request, res: Response) => {
      logger.info('Root simulator health check accessed');
      res.status(200).json({
        status: 'ok',
        message: 'Simulator API health endpoint',
        timestamp: new Date().toISOString()
      });
    });
    
    // Create the proxy options
    const proxyOptions = {
      target: serviceUrl,
      changeOrigin: true,
      pathRewrite: {
        '^/api/simulator': '/api'
      },
      logLevel: 'debug' as const,
      onProxyReq: (proxyReq: any, req: Request, _res: Response) => {
        logger.info(`SIMULATOR PROXY REQ: ${req.method} ${req.originalUrl} -> ${serviceUrl}/api${req.originalUrl.replace('/api/simulator', '')}`);
        try {
          fixRequestBody(proxyReq, req);
        } catch (err) {
          logger.error(`Error fixing request body: ${err}`);
        }
      },
      onProxyRes: (proxyRes: any, req: Request, _res: Response) => {
        logger.info(`SIMULATOR PROXY RES: ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
      },
      onError: (err: Error, req: Request, res: Response) => {
        logger.error(`Simulator proxy error for ${req.url}: ${err.message}`);
        res.status(502).json({
          status: 'error',
          message: 'Simulator service unavailable',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
    };
    
    // Create the proxy middleware
    const proxy = createProxyMiddleware(proxyOptions);
    
    // Log all simulator requests first
    app.use('/api/simulator', (req: Request, res: Response, next: NextFunction) => {
      logger.info(`SIMULATOR REQUEST: ${req.method} ${req.originalUrl}`);
      next();
    });
    
    // Add the simulator health check route
    app.get('/api/simulator/health-check', (req: Request, res: Response) => {
      logger.info('Simulator health check endpoint hit');
      res.status(200).json({
        status: 'ok',
        message: 'Simulator service health check',
        timestamp: new Date().toISOString()
      });
    });
    
    // Route all other simulator requests to the proxy
    app.use('/api/simulator', proxy);
    
    logger.info('Simulator service proxy configured successfully');
    return true;
  } catch (error) {
    logger.error(`Failed to set up simulator service proxy: ${error}`);
    return false;
  }
} 