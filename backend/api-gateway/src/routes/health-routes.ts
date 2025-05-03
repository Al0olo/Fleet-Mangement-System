import { Router, Request, Response } from 'express';
import { Logger } from 'winston';

export function setupHealthRoutes(logger: Logger): Router {
  const router = Router();

  // Basic health endpoint
  router.get('/health', (_req: Request, res: Response) => {
    logger.info('Health check endpoint hit');
    res.status(200).json({ 
      status: 'OK', 
      message: 'API Gateway is running',
      timestamp: new Date().toISOString()
    });
  });

  // Debug endpoint
  router.get('/debug', (req: Request, res: Response) => {
    logger.info('Debug endpoint hit');
    res.status(200).json({ 
      status: 'OK', 
      message: 'API Gateway debug endpoint',
      timestamp: new Date().toISOString()
    });
  });

  // API Debug endpoint
  router.get('/api/debug', (req: Request, res: Response) => {
    logger.info('API debug endpoint hit');
    res.status(200).json({ 
      status: 'OK', 
      message: 'API Gateway API debug endpoint',
      path: req.path,
      originalUrl: req.originalUrl,
      timestamp: new Date().toISOString()
    });
  });
  
  // Diagnostics endpoint
  router.get('/api/diagnostics', async (req: Request, res: Response) => {
    logger.info('Diagnostics endpoint hit');
    
    // Get service URLs from environment
    const vehicleServiceUrl = process.env.VEHICLE_SERVICE_URL || 'http://localhost:3000';
    
    // Test connections
    const results = {
      timestamp: new Date().toISOString(),
      gateway: {
        status: 'ok',
        version: process.env.npm_package_version || '1.0.0'
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT
      },
      services: {} as any
    };
    
    // Import the diagnostics tools
    const { testServiceConnectivity } = await import('../debug-tools');
    
    // Test vehicle service
    try {
      const vehicleConnectivity = await testServiceConnectivity(
        'vehicle-service',
        vehicleServiceUrl,
        '/health',
        logger
      );
      
      results.services['vehicle-service'] = {
        url: vehicleServiceUrl,
        reachable: vehicleConnectivity,
        status: vehicleConnectivity ? 'ok' : 'unreachable'
      };
    } catch (error) {
      results.services['vehicle-service'] = {
        url: vehicleServiceUrl,
        reachable: false,
        status: 'error',
        error: error
      };
    }
    
    res.status(200).json(results);
  });

  // Simple test endpoint
  router.get('/api/test', (req: Request, res: Response) => {
    logger.info('Test endpoint hit');
    res.status(200).json({
      status: 'ok',
      message: 'API Gateway test endpoint',
      timestamp: new Date().toISOString()
    });
  });

  return router;
}

export default setupHealthRoutes; 