import { Logger } from 'winston';
import mongoose from 'mongoose';
import MaintenanceSchedule from '../models/maintenance-schedule';

export default class ScheduleService {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Get all maintenance schedules with filters
   */
  async getAllSchedules(
    limit: number = 100,
    skip: number = 0,
    sort: string = 'scheduledDate',
    order: 'asc' | 'desc' = 'asc',
    filters: Record<string, any> = {}
  ) {
    // Build query based on filters
    const query: Record<string, any> = {};
    
    if (filters.vehicleId) {
      query.vehicleId = filters.vehicleId;
    }
    
    if (filters.type) {
      query.type = filters.type;
    }
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.priority) {
      query.priority = filters.priority;
    }
    
    // Date range filter
    if (filters.startDate && filters.endDate) {
      query.scheduledDate = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    } else if (filters.startDate) {
      query.scheduledDate = { $gte: new Date(filters.startDate) };
    } else if (filters.endDate) {
      query.scheduledDate = { $lte: new Date(filters.endDate) };
    }

    // Execute query with pagination and sorting
    const sortOrder = order === 'desc' ? -1 : 1;
    const schedules = await MaintenanceSchedule.find(query)
      .sort({ [sort]: sortOrder })
      .skip(skip)
      .limit(limit);
    
    const count = await MaintenanceSchedule.countDocuments(query);
    
    this.logger.info(`Retrieved ${schedules.length} maintenance schedules`);
    
    return { schedules, count };
  }

  /**
   * Get a single maintenance schedule by ID
   */
  async getScheduleById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid maintenance schedule ID format');
    }
    
    const schedule = await MaintenanceSchedule.findById(id);
    
    if (!schedule) {
      throw new Error('Maintenance schedule not found');
    }
    
    this.logger.info(`Retrieved maintenance schedule ${id}`);
    
    return schedule;
  }

  /**
   * Create a new maintenance schedule
   */
  async createSchedule(scheduleData: Record<string, any>) {
    const newSchedule = await MaintenanceSchedule.create(scheduleData);
    
    this.logger.info(`Created maintenance schedule ${newSchedule.id}`);
    
    // In a real application, here we might also:
    // - Send notifications to responsible parties
    // - Publish events to other systems
    // - Update vehicle availability calendar
    
    return newSchedule;
  }

  /**
   * Update an existing maintenance schedule
   */
  async updateSchedule(id: string, updateData: Record<string, any>) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid maintenance schedule ID format');
    }
    
    const updatedSchedule = await MaintenanceSchedule.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!updatedSchedule) {
      throw new Error('Maintenance schedule not found');
    }
    
    this.logger.info(`Updated maintenance schedule ${id}`);
    
    return updatedSchedule;
  }

  /**
   * Delete a maintenance schedule
   */
  async deleteSchedule(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid maintenance schedule ID format');
    }
    
    const deletedSchedule = await MaintenanceSchedule.findByIdAndDelete(id);
    
    if (!deletedSchedule) {
      throw new Error('Maintenance schedule not found');
    }
    
    this.logger.info(`Deleted maintenance schedule ${id}`);
    
    return deletedSchedule;
  }

  /**
   * Get upcoming maintenance schedules
   */
  async getUpcomingSchedules(days: number = 30, filters: Record<string, any> = {}) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);
    
    const query: Record<string, any> = {
      scheduledDate: { $gte: now, $lte: futureDate },
      status: { $in: ['scheduled', 'in-progress'] }
    };
    
    if (filters.vehicleId) {
      query.vehicleId = filters.vehicleId;
    }
    
    if (filters.priority) {
      query.priority = filters.priority;
    }
    
    const schedules = await MaintenanceSchedule.find(query)
      .sort({ scheduledDate: 1, priority: -1 });
    
    this.logger.info(`Retrieved ${schedules.length} upcoming maintenance schedules`);
    
    return schedules;
  }

  /**
   * Get schedules that are overdue
   */
  async getOverdueSchedules(filters: Record<string, any> = {}) {
    const now = new Date();
    
    const query: Record<string, any> = {
      scheduledDate: { $lt: now },
      status: { $in: ['scheduled', 'in-progress', 'overdue'] }
    };
    
    if (filters.vehicleId) {
      query.vehicleId = filters.vehicleId;
    }
    
    const schedules = await MaintenanceSchedule.find(query)
      .sort({ scheduledDate: 1, priority: -1 });
    
    this.logger.info(`Retrieved ${schedules.length} overdue maintenance schedules`);
    
    return schedules;
  }

  /**
   * Update status of maintenance schedules to 'overdue' if they are past their scheduled date
   * This would typically be called by a scheduled job
   */
  async updateOverdueSchedules() {
    const now = new Date();
    
    const result = await MaintenanceSchedule.updateMany(
      {
        scheduledDate: { $lt: now },
        status: { $in: ['scheduled', 'in-progress'] }
      },
      {
        $set: { status: 'overdue' }
      }
    );
    
    this.logger.info(`Updated ${result.modifiedCount} schedules to overdue status`);
    
    return result.modifiedCount;
  }

  /**
   * Get vehicle maintenance schedules
   */
  async getVehicleSchedules(vehicleId: string, status?: string) {
    const query: Record<string, any> = { vehicleId };
    
    if (status) {
      query.status = status;
    }
    
    const schedules = await MaintenanceSchedule.find(query)
      .sort({ scheduledDate: 1 });
    
    this.logger.info(`Retrieved ${schedules.length} maintenance schedules for vehicle ${vehicleId}`);
    
    return schedules;
  }
} 