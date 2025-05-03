import { createServer } from '../../server';
import * as loggerConfig from '../../config/logger';
import * as metricsConfig from '../../config/metrics';
import { describe, test, expect, beforeEach, jest, afterAll } from '@jest/globals';

// Mock external dependencies
jest.mock('../../config/logger');
jest.mock('../../config/metrics', () => ({
  setupMetrics: jest.fn().mockReturnValue({
    metricsRegistry: {
      metrics: jest.fn().mockReturnValue('metrics')
    },
    httpRequestDurationMicroseconds: {
      labels: jest.fn().mockReturnValue({
        observe: jest.fn()
      })
    }
  })
}));
jest.mock('../../middleware/common/security', () => ({
  setupSecurityMiddleware: jest.fn().mockReturnValue({
    corsMiddleware: jest.fn(),
    helmetMiddleware: jest.fn(),
    compressionMiddleware: jest.fn(),
    setupRateLimiting: jest.fn()
  })
}));
jest.mock('../../middleware/common/request-logger', () => ({
  setupRequestLogging: jest.fn().mockReturnValue({
    httpLogger: jest.fn(),
    responseTimer: jest.fn(),
    requestIdMiddleware: jest.fn()
  })
}));
jest.mock('../../middleware/common/error-handler', () => ({
  setupErrorHandlers: jest.fn().mockReturnValue({
    notFoundHandler: jest.fn(),
    errorHandler: jest.fn()
  })
}));
jest.mock('../../routes/routes', () => ({
  setupRoutes: jest.fn()
}));
jest.mock('../../util/redis-client', () => ({
  waitForRedis: jest.fn().mockResolvedValue(true)
}));

// Save and restore environment variables
const originalEnv = { ...process.env };

describe('Server', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.ENABLE_GLOBAL_RATE_LIMIT = 'false';
    
    // Setup mocks
    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };
    
    (loggerConfig.createLogger as jest.Mock).mockReturnValue(mockLogger);
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });
  
  test('createServer initializes app and returns expected interface', () => {
    const server = createServer();
    
    // Check that server returns expected interface
    expect(server).toHaveProperty('app');
    expect(server).toHaveProperty('startServer');
    expect(server).toHaveProperty('logger');
    
    // Check that logger was created
    expect(loggerConfig.createLogger).toHaveBeenCalled();
  });
  
  test('createServer can use provided logger', () => {
    const customLogger = { 
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };
    const server = createServer(customLogger);
    
    expect(server.logger).toBe(customLogger);
    expect(loggerConfig.createLogger).not.toHaveBeenCalled();
  });
}); 