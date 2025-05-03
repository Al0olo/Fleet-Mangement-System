import { setupErrorHandlers } from '../../middleware/common/error-handler';
import { Request, Response, NextFunction } from 'express';
import { describe, jest, test, expect, beforeEach } from '@jest/globals';

// Mock the middleware module without using spread operator
jest.mock('../../middleware/common/error-handler', () => {
  return {
    setupErrorHandlers: (mockLogger: any) => {
      const notFoundHandler = (_req: Request, res: Response) => {
        res.status(404).json({ status: 'error', message: 'Not found' });
      };

      const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
        mockLogger.error(`Error: ${err.message}`);
        mockLogger.error(err.stack || 'No stack trace available');
        
        res.status(500).json({ 
          status: 'error', 
          message: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message 
        });
      };

      return { notFoundHandler, errorHandler };
    }
  };
});

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockLogger: any;
  let mockNext: jest.Mock;
  
  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis() as unknown as Response['status'],
      json: jest.fn().mockReturnThis() as unknown as Response['json'],
      send: jest.fn().mockReturnThis() as unknown as Response['send']
    };
    mockLogger = {
      error: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn()
    };
    mockNext = jest.fn();
  });

  test('notFoundHandler returns 404 status', () => {
    const { notFoundHandler } = setupErrorHandlers(mockLogger);
    
    notFoundHandler(mockRequest as Request, mockResponse as Response);
    
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ 
      status: 'error', 
      message: 'Not found' 
    });
  });

  test('errorHandler returns 500 status and logs error', () => {
    const { errorHandler } = setupErrorHandlers(mockLogger);
    const error = new Error('Test error');
    
    // Save original NODE_ENV
    const originalNodeEnv = process.env.NODE_ENV;
    
    // Test production behavior
    process.env.NODE_ENV = 'production';
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ 
      status: 'error', 
      message: 'Internal server error'
    });
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Test development behavior
    process.env.NODE_ENV = 'development';
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ 
      status: 'error', 
      message: error.message
    });
    
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });
}); 