import request from 'supertest';
import express, { Express, Request, Response, NextFunction } from 'express';
import { describe, test, expect, beforeAll, jest } from '@jest/globals';
import { 
  mockMaintenanceRecords, 
  newMaintenanceRecord, 
  maintenanceRecordUpdate, 
  formatMaintenanceRecordResponse, 
  formatMaintenanceRecordsResponse, 
  formatDeleteResponse 
} from '../mocks/mock-maintenance';

// Create a test express application
let app: Express;
let mockRecordId: string;
let createdRecordId: string;

beforeAll(() => {
  app = express();
  app.use(express.json());
  
  // Middleware to log requests in test
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });

  // Setup mock routes that simulate the maintenance-service endpoints
  
  // GET all maintenance records
  app.get('/api/records', (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 100;
    const skip = parseInt(req.query.skip as string) || 0;
    const type = req.query.type as string;
    
    let filteredRecords = mockMaintenanceRecords;
    
    if (type) {
      filteredRecords = filteredRecords.filter(record => record.type === type);
    }
    
    res.status(200).json(formatMaintenanceRecordsResponse(filteredRecords));
  });
  
  // GET maintenance stats 
  app.get('/api/stats', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'success',
      data: {
        countByType: {
          routine: 1,
          repair: 1
        },
        countByStatus: {
          completed: 2
        },
        avgCostByType: {
          routine: 150,
          repair: 450
        },
        monthlyCount: [],
        totalCost: 600
      }
    });
  });
  
  // POST create new maintenance record
  app.post('/api/records', (req: Request, res: Response) => {
    const record = req.body;
    if (!record.vehicleId || !record.type || !record.performedAt) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields'
      });
    }
    
    const newId = '60d21b4667d0d8992e610c89';
    createdRecordId = newId;
    
    const createdRecord = {
      id: newId,
      ...record,
      documents: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    res.status(201).json(formatMaintenanceRecordResponse(createdRecord));
  });
  
  // GET maintenance record by ID
  app.get('/api/records/:id', (req: Request, res: Response) => {
    const recordId = req.params.id;
    const record = mockMaintenanceRecords.find(r => r.id === recordId);
    
    if (!record) {
      return res.status(404).json({
        status: 'error',
        message: 'Maintenance record not found'
      });
    }
    
    res.status(200).json(formatMaintenanceRecordResponse(record));
  });
  
  // PUT update maintenance record
  app.put('/api/records/:id', (req: Request, res: Response) => {
    const recordId = req.params.id;
    const record = mockMaintenanceRecords.find(r => r.id === recordId);
    
    if (!record) {
      return res.status(404).json({
        status: 'error',
        message: 'Maintenance record not found'
      });
    }
    
    const updatedRecord = {
      ...record,
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    res.status(200).json(formatMaintenanceRecordResponse(updatedRecord));
  });
  
  // DELETE maintenance record
  app.delete('/api/records/:id', (req: Request, res: Response) => {
    const recordId = req.params.id;
    const recordIndex = mockMaintenanceRecords.findIndex(r => r.id === recordId);
    
    if (recordIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Maintenance record not found'
      });
    }
    
    res.status(200).json(formatDeleteResponse());
  });
  
  // GET maintenance records by vehicle
  app.get('/api/vehicles/:vehicleId/records', (req: Request, res: Response) => {
    const vehicleId = req.params.vehicleId;
    const records = mockMaintenanceRecords.filter(r => r.vehicleId === vehicleId);
    
    res.status(200).json(formatMaintenanceRecordsResponse(records));
  });

  // Set the first mock record ID for testing
  mockRecordId = mockMaintenanceRecords[0].id;
});

describe('Maintenance API Integration Tests', () => {
  test('GET /api/records should return all maintenance records', async () => {
    const response = await request(app).get('/api/records');
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveLength(mockMaintenanceRecords.length);
    expect(response.body.count).toBe(mockMaintenanceRecords.length);
  });
  
  test('GET /api/records should filter by type when provided', async () => {
    const response = await request(app).get('/api/records?type=routine');
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].type).toBe('routine');
  });
  
  test('GET /api/records/:id should return a specific maintenance record', async () => {
    const response = await request(app).get(`/api/records/${mockRecordId}`);
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.id).toBe(mockRecordId);
    expect(response.body.data.type).toBe(mockMaintenanceRecords[0].type);
  });
  
  test('GET /api/records/:id should return 404 for non-existent record', async () => {
    const response = await request(app).get('/api/records/nonexistentid');
    
    expect(response.status).toBe(404);
    expect(response.body.status).toBe('error');
  });
  
  test('POST /api/records should create a new maintenance record', async () => {
    const response = await request(app)
      .post('/api/records')
      .send(newMaintenanceRecord)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json');
    
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
    expect(response.body.data.vehicleId).toBe(newMaintenanceRecord.vehicleId);
    expect(response.body.data.type).toBe(newMaintenanceRecord.type);
    expect(response.body.data.id).toBeDefined();
    
    // Save the created record ID for subsequent tests
    createdRecordId = response.body.data.id;
  });
  
  test('POST /api/records should return 400 for invalid record data', async () => {
    const response = await request(app)
      .post('/api/records')
      .send({ 
        // Missing required fields
        type: 'routine' 
      })
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json');
    
    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
  });
  
  test('PUT /api/records/:id should update an existing maintenance record', async () => {
    const response = await request(app)
      .put(`/api/records/${mockRecordId}`)
      .send(maintenanceRecordUpdate)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json');
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.id).toBe(mockRecordId);
    expect(response.body.data.cost).toBe(maintenanceRecordUpdate.cost);
    expect(response.body.data.notes).toBe(maintenanceRecordUpdate.notes);
  });
  
  test('PUT /api/records/:id should return 404 for non-existent record', async () => {
    const response = await request(app)
      .put('/api/records/nonexistentid')
      .send(maintenanceRecordUpdate)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json');
    
    expect(response.status).toBe(404);
    expect(response.body.status).toBe('error');
  });
  
  test('DELETE /api/records/:id should delete a maintenance record', async () => {
    const response = await request(app).delete(`/api/records/${mockRecordId}`);
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.message).toContain('deleted successfully');
  });
  
  test('DELETE /api/records/:id should return 404 for non-existent record', async () => {
    const response = await request(app).delete('/api/records/nonexistentid');
    
    expect(response.status).toBe(404);
    expect(response.body.status).toBe('error');
  });
  
  test('GET /api/vehicles/:vehicleId/records should return vehicle-specific records', async () => {
    const response = await request(app).get('/api/vehicles/vehicle123/records');
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0].vehicleId).toBe('vehicle123');
  });
  
  test('GET /api/stats should return maintenance statistics', async () => {
    const response = await request(app).get('/api/stats');
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.countByType).toBeDefined();
    expect(response.body.data.countByStatus).toBeDefined();
    expect(response.body.data.avgCostByType).toBeDefined();
    expect(response.body.data.totalCost).toBeDefined();
  });
}); 