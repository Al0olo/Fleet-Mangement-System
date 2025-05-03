import mongoose, { Document, Schema } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     MaintenanceSchedule:
 *       type: object
 *       required:
 *         - vehicleId
 *         - type
 *         - scheduledDate
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated unique identifier
 *         vehicleId:
 *           type: string
 *           description: ID of the vehicle for scheduled maintenance
 *         type:
 *           type: string
 *           description: Type of maintenance to be performed
 *           enum: [routine, repair, inspection, recall, other]
 *         description:
 *           type: string
 *           description: Detailed description of the planned maintenance
 *         scheduledDate:
 *           type: string
 *           format: date-time
 *           description: Date when maintenance is scheduled
 *         assignedTo:
 *           type: string
 *           description: Person or company assigned to perform the maintenance
 *         estimatedCost:
 *           type: number
 *           description: Estimated cost of the maintenance work
 *         priority:
 *           type: string
 *           description: Priority level of the maintenance
 *           enum: [low, medium, high, critical]
 *           default: medium
 *         status:
 *           type: string
 *           description: Status of the scheduled maintenance
 *           enum: [scheduled, in-progress, completed, cancelled, overdue]
 *           default: scheduled
 *         notes:
 *           type: string
 *           description: Additional notes about the maintenance
 *         reminderSent:
 *           type: boolean
 *           description: Whether a reminder has been sent
 *           default: false
 *       example:
 *         vehicleId: 60d21b4667d0d8992e610c85
 *         type: routine
 *         description: Scheduled 5000 hour maintenance
 *         scheduledDate: 2023-08-15T10:00:00Z
 *         assignedTo: John's Repair Shop
 *         estimatedCost: 250.00
 *         priority: medium
 *         status: scheduled
 *         notes: Will need to be out of service for 1 day
 *         reminderSent: false
 */

// Interface definitions
export interface IMaintenanceScheduleBase {
  vehicleId: string;
  type: string;
  description?: string;
  scheduledDate: Date;
  assignedTo?: string;
  estimatedCost?: number;
  priority: string;
  status: string;
  notes?: string;
  reminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Document interface with typed Document generic
export type IMaintenanceSchedule = IMaintenanceScheduleBase & Document;

// Maintenance schedule schema definition
const MaintenanceScheduleSchema: Schema = new Schema(
  {
    vehicleId: {
      type: String,
      required: [true, 'Vehicle ID is required'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Maintenance type is required'],
      enum: {
        values: ['routine', 'repair', 'inspection', 'recall', 'other'],
        message: '{VALUE} is not a supported maintenance type',
      },
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
    },
    assignedTo: {
      type: String,
      trim: true,
    },
    estimatedCost: {
      type: Number,
      min: [0, 'Estimated cost cannot be negative'],
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'critical'],
        message: '{VALUE} is not a valid priority level',
      },
      default: 'medium',
    },
    status: {
      type: String,
      enum: {
        values: ['scheduled', 'in-progress', 'completed', 'cancelled', 'overdue'],
        message: '{VALUE} is not a valid status',
      },
      default: 'scheduled',
    },
    notes: {
      type: String,
      trim: true,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Create indexes for commonly queried fields
MaintenanceScheduleSchema.index({ vehicleId: 1, scheduledDate: 1 });
MaintenanceScheduleSchema.index({ scheduledDate: 1 });
MaintenanceScheduleSchema.index({ status: 1 });
MaintenanceScheduleSchema.index({ priority: 1 });

// Create the model
const MaintenanceSchedule = mongoose.model<IMaintenanceSchedule>('MaintenanceSchedule', MaintenanceScheduleSchema);

export default MaintenanceSchedule; 