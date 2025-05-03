import { setupMetrics } from '../../config/metrics';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import promClient from 'prom-client';

// Define interface for the mock histogram
interface MockHistogram {
  name: string;
  labels: () => { observe: jest.Mock };
}

// Mock prom-client to avoid metric registration conflicts
jest.mock('prom-client', () => {
  return {
    collectDefaultMetrics: jest.fn(),
    Registry: class MockRegistry {
      metrics() { return 'metrics'; }
      registerMetric() { return true; }
    },
    Histogram: class MockHistogram implements MockHistogram {
      name: string;
      
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
    
    // Reset environment for clean tests
    delete process.env.WORKER_ID;
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
      httpRequestDurationMicroseconds.labels('GET', '/test', '200', '0').observe(0.1);
    }).not.toThrow();
  });
  
  test('returns the same instance when called multiple times', () => {
    const instance1 = setupMetrics();
    const instance2 = setupMetrics();
    
    expect(instance1).toBe(instance2);
  });
  
  test('creates worker-specific metrics in cluster mode', () => {
    // Set worker ID to simulate cluster mode
    process.env.WORKER_ID = '1';
    
    // Reset singleton for this specific test
    // @ts-ignore - Accessing private module variable for testing
    const originalModule = require('../../config/metrics');
    originalModule.metricsInstance = null;
    
    const { httpRequestDurationMicroseconds } = setupMetrics();
    
    expect((httpRequestDurationMicroseconds as any).name).toBe('http_request_duration_seconds_worker_1');
    
    // Test with worker-specific labels
    expect(() => {
      httpRequestDurationMicroseconds.labels('GET', '/test', '200', '1').observe(0.1);
    }).not.toThrow();
  });
}); 