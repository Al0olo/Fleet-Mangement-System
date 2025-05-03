import { Application } from 'express';
import { Logger } from 'winston';
import { Registry } from 'prom-client';

import apiRoutes from './api-routes';
import setupProxyRoutes from './proxy-routes';
import setupHealthRoutes from './health-routes';
import setupMetricsRoutes from './metrics-routes';
import setupDocsRoutes from './docs-routes';
import swaggerSpec from '../swagger';

/**
 * Setup all application routes
 * @param app Express application
 * @param logger Winston logger
 * @param metricsRegistry Prometheus metrics registry
 */
export function setupRoutes(app: Application, logger: Logger, metricsRegistry: Registry) {
  logger.info('Setting up routes');

  // Set up health and diagnostic routes
  app.use('/', setupHealthRoutes(logger));

  // Set up metrics routes
  app.use('/', setupMetricsRoutes(metricsRegistry, logger));

  // Set up documentation routes
  app.use('/', setupDocsRoutes(swaggerSpec, logger));

  // Set up API Gateway's own routes
  app.use('/api/gateway', apiRoutes);

  // Set up vehicle service route explicitly
  const { setupVehicleServiceProxy } = require('./vehicle-proxy');
  
  // Register vehicle service routes with detailed logging
  logger.info('Explicitly setting up vehicle service routes');
  setupVehicleServiceProxy(app, logger)
    .then((success: boolean) => {
      if (success) {
        logger.info('Vehicle service routes registered successfully');
      } else {
        logger.error('Failed to register vehicle service routes');
      }
    })
    .catch((err: Error) => {
      logger.error(`Error setting up vehicle service routes: ${err}`);
    });

  // Set up all other proxy routes
  setupProxyRoutes(app, logger);

  logger.info('Routes setup complete');
}

export default setupRoutes; 