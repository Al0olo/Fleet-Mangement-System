import mongoose, { Document, Schema } from 'mongoose';

// Base interface without Document
interface IUsageStatsBase {
  vehicleId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  hoursOperated: number;
  distanceTraveled: number;
  fuelConsumed?: number;
  idleTime?: number;
  efficiency?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Usage stats document interface
export type IUsageStats = IUsageStatsBase & Document;

// Usage stats schema definition
const UsageStatsSchema: Schema = new Schema(
  {
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle ID is required'],
      index: true
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    hoursOperated: {
      type: Number,
      required: [true, 'Hours operated is required'],
      min: [0, 'Hours operated cannot be negative']
    },
    distanceTraveled: {
      type: Number,
      required: [true, 'Distance traveled is required'],
      min: [0, 'Distance traveled cannot be negative']
    },
    fuelConsumed: {
      type: Number,
      min: [0, 'Fuel consumed cannot be negative']
    },
    idleTime: {
      type: Number,
      min: [0, 'Idle time cannot be negative']
    },
    efficiency: {
      type: Number,
      min: [0, 'Efficiency cannot be negative'],
      max: [1, 'Efficiency cannot be greater than 1']
    }
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
      }
    }
  }
);

// Create indexes for commonly queried fields
UsageStatsSchema.index({ startDate: 1, endDate: 1 });
UsageStatsSchema.index({ vehicleId: 1, startDate: 1 });

// Create the model
const UsageStats = mongoose.model<IUsageStats>('UsageStats', UsageStatsSchema);

export default UsageStats; 