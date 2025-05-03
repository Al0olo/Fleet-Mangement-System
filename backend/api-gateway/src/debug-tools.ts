import http from 'http';
import { Logger } from 'winston';

/**
 * Tests connectivity to another service by making a simple HTTP request
 */
export function testServiceConnectivity(
  serviceName: string,
  serviceUrl: string,
  path: string = '/health',
  logger: Logger
): Promise<boolean> {
  return new Promise((resolve) => {
    logger.info(`Testing connectivity to ${serviceName} at ${serviceUrl}${path}`);
    
    // Parse the URL to get hostname, port, and protocol
    let url: URL;
    try {
      url = new URL(serviceUrl);
    } catch (err) {
      logger.error(`Invalid URL ${serviceUrl}: ${err}`);
      resolve(false);
      return;
    }
    
    const hostname = url.hostname;
    const port = url.port ? parseInt(url.port) : (url.protocol === 'https:' ? 443 : 80);
    const fullPath = path.startsWith('/') ? path : `/${path}`;
    
    logger.info(`Making HTTP request to ${hostname}:${port}${fullPath}`);
    
    const options = {
      hostname: hostname,
      port: port,
      path: fullPath,
      method: 'GET',
      timeout: 5000
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        logger.info(`Response from ${serviceName}: Status ${res.statusCode}`);
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          logger.info(`Successfully connected to ${serviceName}`);
          try {
            logger.debug(`Response data: ${data}`);
            resolve(true);
          } catch (err) {
            logger.warn(`Error parsing response: ${err}`);
            resolve(true); // Still consider it successful if we got a response
          }
        } else {
          logger.error(`Failed to connect to ${serviceName}: Status ${res.statusCode}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      logger.error(`Error connecting to ${serviceName}: ${err.message}`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      logger.error(`Connection to ${serviceName} timed out`);
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

/**
 * Run connectivity tests to all dependent services
 */
export async function runServiceDiagnostics(logger: Logger): Promise<void> {
  // Get service URLs from environment
  const vehicleServiceUrl = process.env.VEHICLE_SERVICE_URL || 'http://localhost:3000';
  
  logger.info('Running service diagnostics...');
  
  // Test vehicle service connectivity
  const vehicleServiceOk = await testServiceConnectivity(
    'vehicle-service',
    vehicleServiceUrl,
    '/health',
    logger
  );
  
  logger.info(`Vehicle Service: ${vehicleServiceOk ? 'OK' : 'FAILED'}`);
  
  // Add more service tests as needed
} 