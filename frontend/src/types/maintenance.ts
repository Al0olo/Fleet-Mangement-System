// Maintenance Record types
export type MaintenanceType = 'routine' | 'repair' | 'inspection' | 'emergency' | 'recall' | 'other';
export type MaintenanceStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: MaintenanceType;
  description?: string;
  performedAt: string;
  performedBy?: string;
  cost?: number;
  notes?: string;
  documents?: string[];
  status: MaintenanceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaintenanceRecordPayload {
  vehicleId: string;
  type: MaintenanceType;
  description?: string;
  performedAt: string;
  performedBy?: string;
  cost?: number;
  notes?: string;
  documents?: string[];
  status?: MaintenanceStatus;
}

export interface UpdateMaintenanceRecordPayload extends Partial<CreateMaintenanceRecordPayload> {
  id: string;
}

// Maintenance Schedule types
export type SchedulePriority = 'low' | 'medium' | 'high' | 'critical';
export type ScheduleStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'overdue';

export interface MaintenanceSchedule {
  id: string;
  vehicleId: string;
  type: MaintenanceType;
  description?: string;
  scheduledDate: string;
  assignedTo?: string;
  estimatedCost?: number;
  priority: SchedulePriority;
  status: ScheduleStatus;
  notes?: string;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaintenanceSchedulePayload {
  vehicleId: string;
  type: MaintenanceType;
  description?: string;
  scheduledDate: string;
  assignedTo?: string;
  estimatedCost?: number;
  priority?: SchedulePriority;
  status?: ScheduleStatus;
  notes?: string;
}

export interface UpdateMaintenanceSchedulePayload extends Partial<CreateMaintenanceSchedulePayload> {
  id: string;
}

// Maintenance statistics types
export interface MaintenanceStats {
  countByType: Record<MaintenanceType, number>;
  countByStatus: Record<MaintenanceStatus, number>;
  avgCostByType: Record<MaintenanceType, number>;
  monthlyCount: Array<any>; // This could be more specific depending on the actual data
  totalCost: number;
}

// API response types
export interface MaintenanceResponse<T> {
  status: string;
  data: T;
}

export interface MaintenanceListResponse<T> {
  status: string;
  count: number;
  data: T[];
}

export interface MaintenanceStatsResponse {
  status: string;
  data: MaintenanceStats;
} 