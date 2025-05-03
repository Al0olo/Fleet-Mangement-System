// Mock data for maintenance records and schedules

// Mock maintenance records
export const mockMaintenanceRecords = [
  {
    id: '60d21b4667d0d8992e610c85',
    vehicleId: 'vehicle123',
    type: 'routine',
    description: 'Oil change and filter replacement',
    performedAt: new Date('2023-06-15T10:30:00Z'),
    performedBy: 'John\'s Repair Shop',
    cost: 150.00,
    notes: 'Used synthetic oil as recommended',
    documents: [],
    status: 'completed',
    createdAt: new Date('2023-06-15T11:00:00Z'),
    updatedAt: new Date('2023-06-15T11:00:00Z')
  },
  {
    id: '60d21b4667d0d8992e610c86',
    vehicleId: 'vehicle456',
    type: 'repair',
    description: 'Engine diagnostic and repair',
    performedAt: new Date('2023-07-20T14:30:00Z'),
    performedBy: 'Elite Auto Repair',
    cost: 450.00,
    notes: 'Replaced faulty engine sensor',
    documents: [],
    status: 'completed',
    createdAt: new Date('2023-07-20T15:00:00Z'),
    updatedAt: new Date('2023-07-20T15:00:00Z')
  }
];

// New maintenance record for create tests
export const newMaintenanceRecord = {
  vehicleId: 'vehicle789',
  type: 'inspection',
  description: 'Annual safety inspection',
  performedAt: new Date('2023-08-15T09:00:00Z'),
  performedBy: 'City Inspection Center',
  cost: 120.00,
  notes: 'All systems checked and approved',
  status: 'completed'
};

// Maintenance record update data
export const maintenanceRecordUpdate = {
  cost: 175.50,
  notes: 'Used premium synthetic oil and replaced air filter',
  status: 'completed'
};

// Mock maintenance schedules
export const mockMaintenanceSchedules = [
  {
    id: '60d21b4667d0d8992e610c87',
    vehicleId: 'vehicle123',
    type: 'routine',
    description: 'Scheduled 5000 hour maintenance',
    scheduledDate: new Date('2023-09-15T10:00:00Z'),
    assignedTo: 'John\'s Repair Shop',
    estimatedCost: 250.00,
    priority: 'medium',
    status: 'scheduled',
    notes: 'Will need to be out of service for 1 day',
    reminderSent: false,
    createdAt: new Date('2023-08-01T10:00:00Z'),
    updatedAt: new Date('2023-08-01T10:00:00Z')
  },
  {
    id: '60d21b4667d0d8992e610c88',
    vehicleId: 'vehicle456',
    type: 'inspection',
    description: 'Annual safety inspection',
    scheduledDate: new Date('2023-10-10T09:00:00Z'),
    assignedTo: 'City Inspection Center',
    estimatedCost: 120.00,
    priority: 'high',
    status: 'scheduled',
    notes: 'Required for regulatory compliance',
    reminderSent: false,
    createdAt: new Date('2023-08-15T09:00:00Z'),
    updatedAt: new Date('2023-08-15T09:00:00Z')
  }
];

// New maintenance schedule for create tests
export const newMaintenanceSchedule = {
  vehicleId: 'vehicle789',
  type: 'repair',
  description: 'Replacement of hydraulic system',
  scheduledDate: new Date('2023-11-20T10:00:00Z'),
  assignedTo: 'Specialized Hydraulics Ltd',
  estimatedCost: 850.00,
  priority: 'high',
  notes: 'Equipment showing signs of hydraulic pressure loss',
  status: 'scheduled'
};

// Maintenance schedule update data
export const maintenanceScheduleUpdate = {
  estimatedCost: 900.00,
  priority: 'critical',
  notes: 'Hydraulic system failing faster than expected, need immediate attention',
  status: 'scheduled'
};

// Format response for a single maintenance record
export const formatMaintenanceRecordResponse = (record: any) => ({
  status: 'success',
  data: record
});

// Format response for multiple maintenance records
export const formatMaintenanceRecordsResponse = (records: any[]) => ({
  status: 'success',
  count: records.length,
  data: records
});

// Format response for a single maintenance schedule
export const formatMaintenanceScheduleResponse = (schedule: any) => ({
  status: 'success',
  data: schedule
});

// Format response for multiple maintenance schedules
export const formatMaintenanceSchedulesResponse = (schedules: any[]) => ({
  status: 'success',
  count: schedules.length,
  data: schedules
});

// Format delete response
export const formatDeleteResponse = () => ({
  status: 'success',
  message: 'Record deleted successfully'
}); 