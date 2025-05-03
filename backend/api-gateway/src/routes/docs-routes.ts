import { Router, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { Logger } from 'winston';

export function setupDocsRoutes(swaggerSpec: any, logger: Logger): Router {
  const router = Router();

  // Swagger UI setup
  router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "Fleet Management API Documentation",
    customfavIcon: "",
    customJs: '/custom.js'
  }));

  // Expose Swagger spec as JSON
  router.get('/api-docs.json', (req: Request, res: Response) => {
    logger.debug('Swagger JSON endpoint hit');
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  return router;
}

export default setupDocsRoutes; 