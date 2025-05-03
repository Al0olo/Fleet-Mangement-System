import request from 'supertest';
import express from 'express';
import { describe, test, expect, beforeEach } from '@jest/globals';

// Create a simple Express app for testing
const app = express();

// Mock a health route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'vehicle-service' });
});

app.get('/api/vehicles/health-check', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'vehicle-service' });
});

describe('Health Endpoints', () => {
  test('GET /health returns 200', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'OK', service: 'vehicle-service' });
  });

  test('GET /api/vehicles/health-check returns 200', async () => {
    const response = await request(app).get('/api/vehicles/health-check');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'OK', service: 'vehicle-service' });
  });
}); 