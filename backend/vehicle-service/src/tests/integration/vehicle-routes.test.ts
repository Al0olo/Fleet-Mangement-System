import request from 'supertest';
import express, { Express, Request, Response, NextFunction } from 'express';
import { describe, test, expect, beforeEach, jest, beforeAll, afterAll } from '@jest/globals';
import { mockVehicles, newVehicle, vehicleUpdate, formatVehicleResponse, formatVehiclesResponse, formatDeleteResponse } from '../mocks/mock-vehicle';

// Create a test express application
let app: Express;
let mockVehicleId: string;
let createdVehicleId: string;

beforeAll(() => {
  app = express();
  app.use(express.json());
  
  // Middleware to log requests in test
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });

  // Setup mock routes that simulate the vehicle-service endpoints
  
  // GET all vehicles
  app.get('/api/vehicles', (_req: Request, res: Response) => {
    res.status(200).json(formatVehiclesResponse(mockVehicles));
  });
  
  // GET vehicle stats (specific route before the dynamic :id route)
  app.get('/api/vehicles/stats', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'success',
      data: {
        countByType: {
          excavator: 1,
          truck: 1
        },
        countByStatus: {
          active: 1,
          maintenance: 1
        }
      }
    });
  });
  
  // POST create new vehicle
  app.post('/api/vehicles', (req: Request, res: Response) => {
    const vehicle = req.body;
    if (!vehicle.model || !vehicle.type || !vehicle.status) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields'
      });
    }
    
    const newId = '60d21b4667d0d8992e610c87';
    createdVehicleId = newId;
    
    const createdVehicle = {
      id: newId,
      ...vehicle,
      registrationDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    res.status(201).json(formatVehicleResponse(createdVehicle));
  });
  
  // GET vehicle by ID - must come after specific routes to avoid conflicts
  app.get('/api/vehicles/:id', (req: Request, res: Response) => {
    const vehicleId = req.params.id;
    const vehicle = mockVehicles.find(v => v.id === vehicleId);
    
    if (!vehicle) {
      return res.status(404).json({
        status: 'error',
        message: 'Vehicle not found'
      });
    }
    
    res.status(200).json(formatVehicleResponse(vehicle));
  });
  
  // PUT update vehicle
  app.put('/api/vehicles/:id', (req: Request, res: Response) => {
    const vehicleId = req.params.id;
    const vehicle = mockVehicles.find(v => v.id === vehicleId);
    
    if (!vehicle) {
      return res.status(404).json({
        status: 'error',
        message: 'Vehicle not found'
      });
    }
    
    const updatedVehicle = {
      ...vehicle,
      ...req.body,
      metadata: {
        ...vehicle.metadata,
        ...req.body.metadata
      },
      updatedAt: new Date().toISOString()
    };
    
    res.status(200).json(formatVehicleResponse(updatedVehicle));
  });
  
  // DELETE vehicle
  app.delete('/api/vehicles/:id', (req: Request, res: Response) => {
    const vehicleId = req.params.id;
    const vehicleIndex = mockVehicles.findIndex(v => v.id === vehicleId);
    
    if (vehicleIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Vehicle not found'
      });
    }
    
    res.status(200).json(formatDeleteResponse());
  });

  // Set the first mock vehicle ID for testing
  mockVehicleId = mockVehicles[0].id;
});

describe('Vehicle API Integration Tests', () => {
  test('GET /api/vehicles should return all vehicles', async () => {
    const response = await request(app).get('/api/vehicles');
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveLength(mockVehicles.length);
    expect(response.body.count).toBe(mockVehicles.length);
  });
  
  test('GET /api/vehicles/:id should return a specific vehicle', async () => {
    const response = await request(app).get(`/api/vehicles/${mockVehicleId}`);
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.id).toBe(mockVehicleId);
    expect(response.body.data.model).toBe(mockVehicles[0].model);
  });
  
  test('GET /api/vehicles/:id should return 404 for non-existent vehicle', async () => {
    const response = await request(app).get('/api/vehicles/nonexistentid');
    
    expect(response.status).toBe(404);
    expect(response.body.status).toBe('error');
  });
  
  test('POST /api/vehicles should create a new vehicle', async () => {
    const response = await request(app)
      .post('/api/vehicles')
      .send(newVehicle)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json');
    
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
    expect(response.body.data.model).toBe(newVehicle.model);
    expect(response.body.data.type).toBe(newVehicle.type);
    expect(response.body.data.status).toBe(newVehicle.status);
    expect(response.body.data.id).toBeDefined();
    
    // Save the created vehicle ID for subsequent tests
    createdVehicleId = response.body.data.id;
  });
  
  test('POST /api/vehicles should return 400 for invalid vehicle data', async () => {
    const response = await request(app)
      .post('/api/vehicles')
      .send({ 
        // Missing required fields
        type: 'truck' 
      })
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json');
    
    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
  });
  
  test('PUT /api/vehicles/:id should update an existing vehicle', async () => {
    const response = await request(app)
      .put(`/api/vehicles/${mockVehicleId}`)
      .send(vehicleUpdate)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json');
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.id).toBe(mockVehicleId);
    expect(response.body.data.status).toBe(vehicleUpdate.status);
    expect(response.body.data.metadata.fuelType).toBe(vehicleUpdate.metadata.fuelType);
  });
  
  test('PUT /api/vehicles/:id should return 404 for non-existent vehicle', async () => {
    const response = await request(app)
      .put('/api/vehicles/nonexistentid')
      .send(vehicleUpdate)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json');
    
    expect(response.status).toBe(404);
    expect(response.body.status).toBe('error');
  });
  
  test('DELETE /api/vehicles/:id should delete a vehicle', async () => {
    const response = await request(app).delete(`/api/vehicles/${mockVehicleId}`);
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.message).toContain('deleted successfully');
  });
  
  test('DELETE /api/vehicles/:id should return 404 for non-existent vehicle', async () => {
    const response = await request(app).delete('/api/vehicles/nonexistentid');
    
    expect(response.status).toBe(404);
    expect(response.body.status).toBe('error');
  });
  
  test('GET /api/vehicles/stats should return vehicle statistics', async () => {
    const response = await request(app).get('/api/vehicles/stats');
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.countByType).toBeDefined();
    expect(response.body.data.countByStatus).toBeDefined();
  });
}); 