import promClient from 'prom-client';

// Create a singleton for metrics to prevent duplicate registration in cluster mode
let metricsInstance: { 
  metricsRegistry: promClient.Registry; 
  httpRequestDurationMicroseconds: promClient.Histogram<string>; 
} | null = null;

// Initialize metrics registry
export function setupMetrics() {
  // If metrics are already initialized, return the existing instance
  if (metricsInstance) {
    return metricsInstance;
  }

  // Check if we're in a worker process
  const isWorker = process.env.WORKER_ID !== undefined;
  
  // Create a unique registry
  const Registry = promClient.Registry;
  const metricsRegistry = new Registry();
  
  // Only collect default metrics in the first worker or master process
  if (!isWorker || process.env.WORKER_ID === '0') {
    const collectDefaultMetrics = promClient.collectDefaultMetrics;
    collectDefaultMetrics({ 
      register: metricsRegistry,
      prefix: 'api_gateway_'
    });
  }

  // Create HTTP request duration metric with worker ID in the name if in cluster mode
  const metricNameSuffix = isWorker ? `_worker_${process.env.WORKER_ID}` : '';
  const httpRequestDurationMicroseconds = new promClient.Histogram({
    name: `http_request_duration_seconds${metricNameSuffix}`,
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code', 'worker'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
  });
  
  metricsRegistry.registerMetric(httpRequestDurationMicroseconds);

  // Store the instance
  metricsInstance = { metricsRegistry, httpRequestDurationMicroseconds };
  
  return metricsInstance;
}

export default setupMetrics; 