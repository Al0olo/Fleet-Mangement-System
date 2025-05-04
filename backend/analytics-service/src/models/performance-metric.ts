import mongoose, { Document, Schema } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     PerformanceMetric:
 *       type: object
 *       required:
 *         - vehicleId
 *         - metricType
 *         - timestamp
 *         - value
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated unique identifier
 *         vehicleId:
 *           type: string
 *           description: Reference to the vehicle
 *         metricType:
 *           type: string
 *           description: Type of metric being recorded
 *           enum: [fuelEfficiency, maintenanceFrequency, utilization, costPerHour, costPerKm]
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When the metric was recorded
 *         value:
 *           type: number
 *           description: The metric value
 *         unit:
 *           type: string
 *           description: Unit of measurement
 *       example:
 *         vehicleId: "60d21b4667d0d8992e610c85"
 *         metricType: "fuelEfficiency"
 *         timestamp: "2023-07-15T14:30:00Z"
 *         value: 6.8
 *         unit: "km/l"
 */

// Base interface without Document
interface IPerformanceMetricBase {
  vehicleId: mongoose.Types.ObjectId;
  metricType: string;
  timestamp: Date;
  value: number;
  unit?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Performance metric document interface
export type IPerformanceMetric = IPerformanceMetricBase & Document;

// Performance metric schema definition
const PerformanceMetricSchema: Schema = new Schema(
  {
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle ID is required'],
      index: true
    },
    metricType: {
      type: String,
      required: [true, 'Metric type is required'],
      enum: {
        values: ['fuelEfficiency', 'maintenanceFrequency', 'utilization', 'costPerHour', 'costPerKm'],
        message: '{VALUE} is not a supported metric type'
      },
      index: true
    },
    timestamp: {
      type: Date,
      required: [true, 'Timestamp is required'],
      default: Date.now
    },
    value: {
      type: Number,
      required: [true, 'Value is required']
    },
    unit: {
      type: String
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
PerformanceMetricSchema.index({ vehicleId: 1, metricType: 1, timestamp: -1 });

// Create the model
const PerformanceMetric = mongoose.model<IPerformanceMetric>('PerformanceMetric', PerformanceMetricSchema);

export default PerformanceMetric; 