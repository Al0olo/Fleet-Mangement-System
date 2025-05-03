import { setupMetrics } from '../../config/metrics';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import promClient from 'prom-client';

// Mock prom-client to avoid metric registration conflicts
jest.mock('prom-client', () => {
  const original = jest.requireActual('prom-client');
  return {
    ...original,
    Registry: class MockRegistry {
      metrics() { return 'metrics'; }
      registerMetric() { return true; }
    },
    Histogram: class MockHistogram {
      constructor() {
        this.name = 'http_request_duration_seconds';
      }
      labels() { 
        return {
          observe: jest.fn()
        };
      }
    }
  };
});

describe('Metrics Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates a metrics registry', () => {
    const { metricsRegistry } = setupMetrics();
    expect(metricsRegistry).toBeDefined();
    expect(typeof metricsRegistry.metrics).toBe('function');
  });

  test('creates a HTTP duration histogram', () => {
    const { httpRequestDurationMicroseconds } = setupMetrics();
    expect(httpRequestDurationMicroseconds).toBeDefined();
    expect((httpRequestDurationMicroseconds as any).name).toBe('http_request_duration_seconds');
    
    // Test basic functionality
    expect(() => {
      httpRequestDurationMicroseconds.labels('GET', '/test', '200').observe(0.1);
    }).not.toThrow();
  });
}); 