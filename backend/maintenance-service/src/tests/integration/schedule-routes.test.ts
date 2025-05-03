import request from 'supertest';
import express, { Express, Request, Response, NextFunction } from 'express';
import { describe, test, expect, beforeAll, jest } from '@jest/globals';
import { 
  mockMaintenanceSchedules, 
  newMaintenanceSchedule, 
  maintenanceScheduleUpdate, 
  formatMaintenanceScheduleResponse, 
  formatMaintenanceSchedulesResponse, 
  formatDeleteResponse 
} from '../mocks/mock-maintenance';

// Create a test express application
let app: Express;
let mockScheduleId: string;
let createdScheduleId: string;

beforeAll(() => {
  app = express();
  app.use(express.json());
  
  // Middleware to log requests in test
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });

  // Setup mock routes that simulate the maintenance-service schedule endpoints
  
  // GET all maintenance schedules
  app.get('/api/schedules', (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 100;
    const skip = parseInt(req.query.skip as string) || 0;
    const status = req.query.status as string;
    
    let filteredSchedules = mockMaintenanceSchedules;
    
    if (status) {
      filteredSchedules = filteredSchedules.filter(schedule => schedule.status === status);
    }
    
    res.status(200).json(formatMaintenanceSchedulesResponse(filteredSchedules));
  });
  
  // POST create new maintenance schedule
  app.post('/api/schedules', (req: Request, res: Response) => {
    const schedule = req.body;
    if (!schedule.vehicleId || !schedule.type || !schedule.scheduledDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields'
      });
    }
    
    const newId = '60d21b4667d0d8992e610c89';
    createdScheduleId = newId;
    
    const createdSchedule = {
      id: newId,
      ...schedule,
      reminderSent: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    res.status(201).json(formatMaintenanceScheduleResponse(createdSchedule));
  });
  
  // GET maintenance schedule by ID
  app.get('/api/schedules/:id', (req: Request, res: Response) => {
    const scheduleId = req.params.id;
    const schedule = mockMaintenanceSchedules.find(s => s.id === scheduleId);
    
    if (!schedule) {
      return res.status(404).json({
        status: 'error',
        message: 'Maintenance schedule not found'
      });
    }
    
    res.status(200).json(formatMaintenanceScheduleResponse(schedule));
  });
  
  // PUT update maintenance schedule
  app.put('/api/schedules/:id', (req: Request, res: Response) => {
    const scheduleId = req.params.id;
    const schedule = mockMaintenanceSchedules.find(s => s.id === scheduleId);
    
    if (!schedule) {
      return res.status(404).json({
        status: 'error',
        message: 'Maintenance schedule not found'
      });
    }
    
    const updatedSchedule = {
      ...schedule,
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    res.status(200).json(formatMaintenanceScheduleResponse(updatedSchedule));
  });
  
  // DELETE maintenance schedule
  app.delete('/api/schedules/:id', (req: Request, res: Response) => {
    const scheduleId = req.params.id;
    const scheduleIndex = mockMaintenanceSchedules.findIndex(s => s.id === scheduleId);
    
    if (scheduleIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Maintenance schedule not found'
      });
    }
    
    res.status(200).json(formatDeleteResponse());
  });
  
  // GET upcoming maintenance schedules
  app.get('/api/schedules/upcoming', (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 30;
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(now.getDate() + days);
    
    const upcomingSchedules = mockMaintenanceSchedules.filter(s => {
      const scheduleDate = new Date(s.scheduledDate);
      return scheduleDate >= now && scheduleDate <= futureDate && s.status === 'scheduled';
    });
    
    res.status(200).json(formatMaintenanceSchedulesResponse(upcomingSchedules));
  });
  
  // GET overdue maintenance schedules
  app.get('/api/schedules/overdue', (_req: Request, res: Response) => {
    const now = new Date();
    
    const overdueSchedules = mockMaintenanceSchedules.filter(s => {
      const scheduleDate = new Date(s.scheduledDate);
      return scheduleDate < now && s.status === 'scheduled';
    });
    
    res.status(200).json(formatMaintenanceSchedulesResponse(overdueSchedules));
  });
  
  // POST update overdue schedules status
  app.post('/api/schedules/update-overdue', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'success',
      data: {
        updated: 2
      }
    });
  });
  
  // GET maintenance schedules by vehicle
  app.get('/api/vehicles/:vehicleId/schedules', (req: Request, res: Response) => {
    const vehicleId = req.params.vehicleId;
    const status = req.query.status as string;
    
    let filteredSchedules = mockMaintenanceSchedules.filter(s => s.vehicleId === vehicleId);
    
    if (status) {
      filteredSchedules = filteredSchedules.filter(s => s.status === status);
    }
    
    res.status(200).json(formatMaintenanceSchedulesResponse(filteredSchedules));
  });

  // Set the first mock schedule ID for testing
  mockScheduleId = mockMaintenanceSchedules[0].id;
});

describe('Schedule API Integration Tests', () => {
  test('GET /api/schedules should return all maintenance schedules', async () => {
    const response = await request(app).get('/api/schedules');
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveLength(mockMaintenanceSchedules.length);
    expect(response.body.count).toBe(mockMaintenanceSchedules.length);
  });
  
  test('GET /api/schedules should filter by status when provided', async () => {
    const response = await request(app).get('/api/schedules?status=scheduled');
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0].status).toBe('scheduled');
  });
  
  test('GET /api/schedules/:id should return a specific maintenance schedule', async () => {
    const response = await request(app).get(`/api/schedules/${mockScheduleId}`);
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.id).toBe(mockScheduleId);
    expect(response.body.data.type).toBe(mockMaintenanceSchedules[0].type);
  });
  
  test('GET /api/schedules/:id should return 404 for non-existent schedule', async () => {
    const response = await request(app).get('/api/schedules/nonexistentid');
    
    expect(response.status).toBe(404);
    expect(response.body.status).toBe('error');
  });
  
  test('POST /api/schedules should create a new maintenance schedule', async () => {
    const response = await request(app)
      .post('/api/schedules')
      .send(newMaintenanceSchedule)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json');
    
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
    expect(response.body.data.vehicleId).toBe(newMaintenanceSchedule.vehicleId);
    expect(response.body.data.type).toBe(newMaintenanceSchedule.type);
    expect(response.body.data.id).toBeDefined();
    
    // Save the created schedule ID for subsequent tests
    createdScheduleId = response.body.data.id;
  });
  
  test('POST /api/schedules should return 400 for invalid schedule data', async () => {
    const response = await request(app)
      .post('/api/schedules')
      .send({ 
        // Missing required fields
        type: 'routine' 
      })
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json');
    
    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
  });
  
  test('PUT /api/schedules/:id should update an existing maintenance schedule', async () => {
    const response = await request(app)
      .put(`/api/schedules/${mockScheduleId}`)
      .send(maintenanceScheduleUpdate)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json');
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.id).toBe(mockScheduleId);
    expect(response.body.data.estimatedCost).toBe(maintenanceScheduleUpdate.estimatedCost);
    expect(response.body.data.priority).toBe(maintenanceScheduleUpdate.priority);
    expect(response.body.data.notes).toBe(maintenanceScheduleUpdate.notes);
  });
  
  test('PUT /api/schedules/:id should return 404 for non-existent schedule', async () => {
    const response = await request(app)
      .put('/api/schedules/nonexistentid')
      .send(maintenanceScheduleUpdate)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json');
    
    expect(response.status).toBe(404);
    expect(response.body.status).toBe('error');
  });
  
  test('DELETE /api/schedules/:id should delete a maintenance schedule', async () => {
    const response = await request(app).delete(`/api/schedules/${mockScheduleId}`);
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.message).toContain('deleted successfully');
  });
  
  test('DELETE /api/schedules/:id should return 404 for non-existent schedule', async () => {
    const response = await request(app).delete('/api/schedules/nonexistentid');
    
    expect(response.status).toBe(404);
    expect(response.body.status).toBe('error');
  });
  
  test('GET /api/vehicles/:vehicleId/schedules should return vehicle-specific schedules', async () => {
    const response = await request(app).get('/api/vehicles/vehicle123/schedules');
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0].vehicleId).toBe('vehicle123');
  });
  
  test('POST /api/schedules/update-overdue should update overdue schedules', async () => {
    const response = await request(app).post('/api/schedules/update-overdue');
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.updated).toBeDefined();
  });
}); 