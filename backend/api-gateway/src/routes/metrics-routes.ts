import { Router, Request, Response } from 'express';
import { Registry } from 'prom-client';
import { Logger } from 'winston';

export function setupMetricsRoutes(metricsRegistry: Registry, logger: Logger): Router {
  const router = Router();

  // Prometheus metrics endpoint
  router.get('/metrics', async (_req: Request, res: Response) => {
    logger.debug('Metrics endpoint hit');
    res.set('Content-Type', metricsRegistry.contentType);
    res.end(await metricsRegistry.metrics());
  });

  return router;
}

export default setupMetricsRoutes; 