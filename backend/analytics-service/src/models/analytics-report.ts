import mongoose, { Document, Schema } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     AnalyticsReport:
 *       type: object
 *       required:
 *         - reportType
 *         - period
 *         - startDate
 *         - endDate
 *         - data
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated unique identifier
 *         reportType:
 *           type: string
 *           description: Type of report
 *           enum: [fleet, vehicle, maintenance, cost, utilization]
 *         period:
 *           type: string
 *           description: Time period the report covers
 *           enum: [daily, weekly, monthly, quarterly, yearly, custom]
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Start date of the report period
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: End date of the report period
 *         vehicleId:
 *           type: string
 *           description: Vehicle ID if this is a vehicle-specific report
 *         data:
 *           type: object
 *           description: Report data structure (varies by report type)
 *       example:
 *         reportType: "fleet"
 *         period: "monthly"
 *         startDate: "2023-07-01T00:00:00Z"
 *         endDate: "2023-07-31T23:59:59Z"
 *         data: {
 *           "totalVehicles": 42,
 *           "activeVehicles": 38,
 *           "inMaintenanceVehicles": 4,
 *           "totalDistanceTraveled": 28520,
 *           "totalHoursOperated": 3240,
 *           "avgUtilization": 0.72,
 *           "vehicleTypeDistribution": {
 *             "truck": 15,
 *             "excavator": 12,
 *             "loader": 8,
 *             "bulldozer": 5,
 *             "crane": 2
 *           }
 *         }
 */

// Base interface without Document
interface IAnalyticsReportBase {
  reportType: string;
  period: string;
  startDate: Date;
  endDate: Date;
  vehicleId?: mongoose.Types.ObjectId;
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics report document interface
export type IAnalyticsReport = IAnalyticsReportBase & Document;

// Analytics report schema definition
const AnalyticsReportSchema: Schema = new Schema(
  {
    reportType: {
      type: String,
      required: [true, 'Report type is required'],
      enum: {
        values: ['fleet', 'vehicle', 'maintenance', 'cost', 'utilization'],
        message: '{VALUE} is not a supported report type'
      },
      index: true
    },
    period: {
      type: String,
      required: [true, 'Report period is required'],
      enum: {
        values: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'],
        message: '{VALUE} is not a supported period'
      }
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      index: true
    },
    data: {
      type: Schema.Types.Mixed,
      required: [true, 'Report data is required']
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
AnalyticsReportSchema.index({ reportType: 1, period: 1, startDate: -1 });
AnalyticsReportSchema.index({ vehicleId: 1, reportType: 1 });

// Create the model
const AnalyticsReport = mongoose.model<IAnalyticsReport>('AnalyticsReport', AnalyticsReportSchema);

export default AnalyticsReport; 