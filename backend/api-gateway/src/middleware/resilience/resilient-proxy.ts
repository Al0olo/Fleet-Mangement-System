import { Application } from 'express';
import { createProxyMiddleware, Options as ProxyOptions } from 'http-proxy-middleware';
import pRetry from 'p-retry';
import axios from 'axios';
import { Logger } from 'winston';
import createCircuitBreaker from './circuit-breaker';

interface ResilientProxyOptions extends Omit<ProxyOptions, 'target'> {
  target: string;
  pathRewrite?: Record<string, string>;
  serviceName: string;
  timeout?: number;
  retries?: number;
  logger: Logger;
  circuitBreakerOptions?: any;
}

/**
 * Creates a proxy middleware with resilience patterns (circuit breaker, retries, timeouts)
 */
export function createResilientProxy({
  target,
  pathRewrite,
  serviceName,
  timeout = 5000, // Default 5 second timeout
  retries = 3, // Default 3 retries
  logger,
  circuitBreakerOptions = {},
  ...proxyOpts
}: ResilientProxyOptions) {
  // Common proxy options
  const proxyOptions: ProxyOptions = {
    target,
    changeOrigin: true,
    pathRewrite,
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    proxyTimeout: timeout,
    // Handle errors in the proxy
    onError: (err, req, res) => {
      logger.error(`Proxy error for ${serviceName}: ${err.message}`);
      
      // If response is already sent, we can't do anything
      if (res.headersSent) {
        return;
      }
      
      res.status(503).json({
        status: 'error',
        message: `Service ${serviceName} is currently unavailable`,
        service: serviceName
      });
    },
    ...proxyOpts // Spread remaining proxy options
  };
  
  // Create the proxy middleware
  const proxyMiddleware = createProxyMiddleware(proxyOptions);
  
  // Create circuit breaker for this service
  const circuitBreaker = createCircuitBreaker(serviceName, logger, circuitBreakerOptions);
  
  // Return the middleware stack
  return [circuitBreaker, proxyMiddleware];
}

/**
 * Performs a health check against a service
 */
export async function checkServiceHealth(serviceUrl: string, timeout: number = 3000): Promise<boolean> {
  try {
    // Add /health if it doesn't exist
    const healthUrl = serviceUrl.endsWith('/health') ? serviceUrl : `${serviceUrl}/health`;
    
    // Attempt to call the health endpoint with a timeout
    const response = await axios.get(healthUrl, { timeout });
    
    // Check the response
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Setup monitoring for services with periodic health checks
 */
export function setupHealthChecks(
  services: Array<{ name: string; url: string }>,
  logger: Logger,
  interval: number = 30000 // Default 30 seconds
) {
  const healthStatuses = new Map<string, boolean>();
  
  // Set initial status to unknown
  services.forEach(service => {
    healthStatuses.set(service.name, true);
  });
  
  // Perform health checks periodically
  setInterval(async () => {
    for (const service of services) {
      try {
        const isHealthy = await checkServiceHealth(service.url);
        const previousStatus = healthStatuses.get(service.name);
        
        // Update status
        healthStatuses.set(service.name, isHealthy);
        
        // Log status changes
        if (isHealthy !== previousStatus) {
          if (isHealthy) {
            logger.info(`Service ${service.name} is now HEALTHY`);
          } else {
            logger.warn(`Service ${service.name} is now UNHEALTHY`);
          }
        }
      } catch (error) {
        logger.error(`Error checking health for ${service.name}: ${error}`);
      }
    }
  }, interval);
  
  return healthStatuses;
}

export default {
  createResilientProxy,
  checkServiceHealth,
  setupHealthChecks
}; 