import { Logger } from 'winston';
import mongoose from 'mongoose';
import MaintenanceRecord from '../models/maintenance-record';
import MaintenanceSchedule from '../models/maintenance-schedule';

export default class MaintenanceService {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Get all maintenance records with filters
   */
  async getAllMaintenanceRecords(
    limit: number = 100,
    skip: number = 0,
    sort: string = 'performedAt',
    order: 'asc' | 'desc' = 'desc',
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
    
    // Date range filter
    if (filters.startDate && filters.endDate) {
      query.performedAt = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    } else if (filters.startDate) {
      query.performedAt = { $gte: new Date(filters.startDate) };
    } else if (filters.endDate) {
      query.performedAt = { $lte: new Date(filters.endDate) };
    }

    // Execute query with pagination and sorting
    const sortOrder = order === 'asc' ? 1 : -1;
    const records = await MaintenanceRecord.find(query)
      .sort({ [sort]: sortOrder })
      .skip(skip)
      .limit(limit);
    
    const count = await MaintenanceRecord.countDocuments(query);
    
    this.logger.info(`Retrieved ${records.length} maintenance records`);
    
    return { records, count };
  }

  /**
   * Get a single maintenance record by ID
   */
  async getMaintenanceRecordById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid maintenance record ID format');
    }
    
    const record = await MaintenanceRecord.findById(id);
    
    if (!record) {
      throw new Error('Maintenance record not found');
    }
    
    this.logger.info(`Retrieved maintenance record ${id}`);
    
    return record;
  }

  /**
   * Create a new maintenance record
   */
  async createMaintenanceRecord(recordData: Record<string, any>) {
    const newRecord = await MaintenanceRecord.create(recordData);
    
    this.logger.info(`Created maintenance record ${newRecord.id}`);
    
    // If this record was previously scheduled, update the schedule status
    if (recordData.scheduledMaintenanceId) {
      await MaintenanceSchedule.findByIdAndUpdate(
        recordData.scheduledMaintenanceId,
        { status: 'completed' }
      );
      this.logger.info(`Updated maintenance schedule ${recordData.scheduledMaintenanceId} to completed`);
    }
    
    // In a real application, here we might also:
    // - Publish Kafka event to notify the Vehicle Service about maintenance completion
    // - Send email notifications
    // - Update vehicle status
    
    return newRecord;
  }

  /**
   * Update an existing maintenance record
   */
  async updateMaintenanceRecord(id: string, updateData: Record<string, any>) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid maintenance record ID format');
    }
    
    const updatedRecord = await MaintenanceRecord.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!updatedRecord) {
      throw new Error('Maintenance record not found');
    }
    
    this.logger.info(`Updated maintenance record ${id}`);
    
    return updatedRecord;
  }

  /**
   * Delete a maintenance record
   */
  async deleteMaintenanceRecord(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid maintenance record ID format');
    }
    
    const deletedRecord = await MaintenanceRecord.findByIdAndDelete(id);
    
    if (!deletedRecord) {
      throw new Error('Maintenance record not found');
    }
    
    this.logger.info(`Deleted maintenance record ${id}`);
    
    return deletedRecord;
  }

  /**
   * Get maintenance records by vehicle ID
   */
  async getVehicleMaintenanceRecords(vehicleId: string, limit: number = 100, skip: number = 0) {
    const records = await MaintenanceRecord.find({ vehicleId })
      .sort({ performedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const count = await MaintenanceRecord.countDocuments({ vehicleId });
    
    this.logger.info(`Retrieved ${records.length} maintenance records for vehicle ${vehicleId}`);
    
    return { records, count };
  }

  /**
   * Get maintenance stats
   */
  async getMaintenanceStats() {
    // Aggregate stats by type
    const countByType = await MaintenanceRecord.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    // Aggregate stats by status
    const countByStatus = await MaintenanceRecord.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Calculate average cost by maintenance type
    const avgCostByType = await MaintenanceRecord.aggregate([
      { $match: { cost: { $exists: true, $ne: null } } },
      { $group: { _id: '$type', avgCost: { $avg: '$cost' } } }
    ]);
    
    // Get monthly maintenance count for the past year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const monthlyCount = await MaintenanceRecord.aggregate([
      { $match: { performedAt: { $gte: oneYearAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$performedAt' },
            month: { $month: '$performedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Total maintenance cost
    const totalCost = await MaintenanceRecord.aggregate([
      { $match: { cost: { $exists: true, $ne: null } } },
      { $group: { _id: null, total: { $sum: '$cost' } } }
    ]);
    
    this.logger.info('Retrieved maintenance statistics');
    
    return {
      countByType: countByType.reduce((acc: Record<string, number>, curr: any) => ({ ...acc, [curr._id]: curr.count }), {}),
      countByStatus: countByStatus.reduce((acc: Record<string, number>, curr: any) => ({ ...acc, [curr._id]: curr.count }), {}),
      avgCostByType: avgCostByType.reduce((acc: Record<string, number>, curr: any) => ({ ...acc, [curr._id]: curr.avgCost }), {}),
      monthlyCount,
      totalCost: totalCost.length > 0 ? totalCost[0].total : 0
    };
  }
} 