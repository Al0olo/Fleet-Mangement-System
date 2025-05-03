// Using require for problematic imports
const request = require('supertest');
const express = require('express');
import { setupHealthRoutes } from '../../routes/health-routes';
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response } from 'express';

// Mock logger
const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

describe('API Routes', () => {
  const app = express();
  
  // Setup routes for testing
  app.use('/', setupHealthRoutes(mockLogger as any));
  
  // Add 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ status: 'error', message: 'Not found' });
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Health Check Endpoints', () => {
    test('GET /health returns 200', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
      expect(mockLogger.info).toHaveBeenCalled();
    });
    
    test('GET /debug returns 200', async () => {
      const response = await request(app).get('/debug');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
      expect(mockLogger.info).toHaveBeenCalled();
    });
    
    test('GET /api/test returns 200', async () => {
      const response = await request(app).get('/api/test');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });
  
  describe('Error Handling', () => {
    test('GET /non-existent-path returns 404', async () => {
      const response = await request(app).get('/non-existent-path');
      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
    });
  });
}); 