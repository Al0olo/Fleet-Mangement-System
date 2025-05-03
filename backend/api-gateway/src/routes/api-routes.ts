import express, { Request, Response, NextFunction } from 'express';
import { getStandardLimiter, getStrictLimiter } from '../middleware/rate-limiter';
import { Logger } from 'winston';

const router = express.Router();

// Create middleware that uses the rate limiters
const createStandardLimiterMiddleware = (logger: Logger) => async (req: Request, res: Response, next: NextFunction) => {
  const limiter = await getStandardLimiter(logger);
  limiter(req, res, next);
};

const createStrictLimiterMiddleware = (logger: Logger) => async (req: Request, res: Response, next: NextFunction) => {
  const limiter = await getStrictLimiter(logger);
  limiter(req, res, next);
};

/**
 * @swagger
 * /api/gateway/health:
 *   get:
 *     summary: Check API Gateway health
 *     description: Returns health status of the API Gateway
 *     tags: [Gateway]
 *     responses:
 *       200:
 *         description: Gateway is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 message:
 *                   type: string
 *                   example: API Gateway is running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2023-01-01T00:00:00.000Z
 */
router.get('/health', (req, res, next) => {
  const logger = req.app.locals.logger;
  createStandardLimiterMiddleware(logger)(req, res, next);
}, (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'API Gateway is running',
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /api/gateway/version:
 *   get:
 *     summary: Get API version information
 *     description: Returns current API version and environment
 *     tags: [Gateway]
 *     responses:
 *       200:
 *         description: Version information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 environment:
 *                   type: string
 *                   example: development
 */
router.get('/version', (req, res, next) => {
  const logger = req.app.locals.logger;
  createStandardLimiterMiddleware(logger)(req, res, next);
}, (_req: Request, res: Response) => {
  res.status(200).json({
    version: process.env.API_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * @swagger
 * /api/gateway/services:
 *   get:
 *     summary: Get services status
 *     description: Returns status of all microservices
 *     tags: [Gateway]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       302:
 *         description: Redirects to health/services endpoint
 *       200:
 *         description: Services status information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 services:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: vehicle-service
 *                       status:
 *                         type: string
 *                         enum: [active, inactive, error]
 *                         example: active
 *                       url:
 *                         type: string
 *                         example: http://localhost:3000
 */
router.get('/services', (req, res, next) => {
  const logger = req.app.locals.logger;
  createStrictLimiterMiddleware(logger)(req, res, next);
}, (req: Request, res: Response) => {
  // Redirect to the health/services endpoint which has the actual health status
  res.redirect('/api/health/services');
});

export default router; 