import { createLogger } from '../../config/logger';
import { describe, test, expect } from '@jest/globals';

describe('Logger Configuration', () => {
  test('creates a logger with default service name', () => {
    const logger = createLogger();
    expect(logger).toBeDefined();
    expect(logger.defaultMeta).toBeDefined();
    expect(logger.defaultMeta.service).toBe('api-gateway');
  });

  test('creates a logger with custom service name', () => {
    const serviceName = 'test-service';
    const logger = createLogger(serviceName);
    expect(logger).toBeDefined();
    expect(logger.defaultMeta).toBeDefined();
    expect(logger.defaultMeta.service).toBe(serviceName);
  });
}); 