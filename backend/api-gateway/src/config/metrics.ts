import promClient from 'prom-client';

// Initialize metrics registry
export function setupMetrics() {
  const collectDefaultMetrics = promClient.collectDefaultMetrics;
  const Registry = promClient.Registry;
  const metricsRegistry = new Registry();
  collectDefaultMetrics({ register: metricsRegistry });

  // Create HTTP request duration metric
  const httpRequestDurationMicroseconds = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
  });
  metricsRegistry.registerMetric(httpRequestDurationMicroseconds);

  return { metricsRegistry, httpRequestDurationMicroseconds };
}

export default setupMetrics; 