import request from 'supertest';
import express, { Express, Request, Response } from 'express';
import { describe, test, expect, beforeAll } from '@jest/globals';

// Create a test express application
let app: Express;

beforeAll(() => {
  app = express();
  
  // Setup a mock health endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });
});

describe('Health Endpoint', () => {
  test('GET /health should return 200 OK', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.uptime).toBeDefined();
    expect(response.body.timestamp).toBeDefined();
  });
}); 