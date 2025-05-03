import mongoose, { Document, Schema } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     MaintenanceRecord:
 *       type: object
 *       required:
 *         - vehicleId
 *         - type
 *         - performedAt
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated unique identifier
 *         vehicleId:
 *           type: string
 *           description: ID of the vehicle receiving maintenance
 *         type:
 *           type: string
 *           description: Type of maintenance performed
 *           enum: [routine, repair, inspection, emergency, recall, other]
 *         description:
 *           type: string
 *           description: Detailed description of the maintenance work
 *         performedAt:
 *           type: string
 *           format: date-time
 *           description: Date when maintenance was performed
 *         performedBy:
 *           type: string
 *           description: Person or company who performed the maintenance
 *         cost:
 *           type: number
 *           description: Cost of the maintenance work
 *         notes:
 *           type: string
 *           description: Additional notes about the maintenance
 *         documents:
 *           type: array
 *           items:
 *             type: string
 *           description: URLs or references to related documents
 *         status:
 *           type: string
 *           description: Status of the maintenance record
 *           enum: [scheduled, in-progress, completed, cancelled]
 *           default: completed
 *       example:
 *         vehicleId: 60d21b4667d0d8992e610c85
 *         type: routine
 *         description: Oil change and filter replacement
 *         performedAt: 2023-06-15T10:30:00Z
 *         performedBy: John's Repair Shop
 *         cost: 150.00
 *         notes: Used synthetic oil as recommended
 *         status: completed
 */

// Interface definitions
export interface IMaintenanceRecordBase {
  vehicleId: string;
  type: string;
  description?: string;
  performedAt: Date;
  performedBy?: string;
  cost?: number;
  notes?: string;
  documents?: string[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// Document interface with typed Document generic
export type IMaintenanceRecord = IMaintenanceRecordBase & Document;

// Maintenance record schema definition
const MaintenanceRecordSchema: Schema = new Schema(
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
        values: ['routine', 'repair', 'inspection', 'emergency', 'recall', 'other'],
        message: '{VALUE} is not a supported maintenance type',
      },
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    performedAt: {
      type: Date,
      required: [true, 'Maintenance date is required'],
      default: Date.now,
    },
    performedBy: {
      type: String,
      trim: true,
    },
    cost: {
      type: Number,
      min: [0, 'Cost cannot be negative'],
    },
    notes: {
      type: String,
      trim: true,
    },
    documents: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: ['scheduled', 'in-progress', 'completed', 'cancelled'],
        message: '{VALUE} is not a valid status',
      },
      default: 'completed',
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
MaintenanceRecordSchema.index({ vehicleId: 1, performedAt: -1 });
MaintenanceRecordSchema.index({ type: 1 });
MaintenanceRecordSchema.index({ status: 1 });
MaintenanceRecordSchema.index({ performedAt: 1 });

// Create the model
const MaintenanceRecord = mongoose.model<IMaintenanceRecord>('MaintenanceRecord', MaintenanceRecordSchema);

export default MaintenanceRecord; 