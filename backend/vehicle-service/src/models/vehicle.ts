import mongoose, { Document, Schema } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     Vehicle:
 *       type: object
 *       required:
 *         - model
 *         - type
 *         - status
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated unique identifier
 *         model:
 *           type: string
 *           description: Vehicle model
 *         type:
 *           type: string
 *           description: Type of vehicle (e.g., truck, excavator, loader)
 *           enum: [truck, excavator, loader, bulldozer, crane, other]
 *         status:
 *           type: string
 *           description: Current vehicle status
 *           enum: [active, maintenance, inactive, retired]
 *         registrationDate:
 *           type: string
 *           format: date-time
 *           description: Date vehicle was registered in the system
 *         metadata:
 *           type: object
 *           description: Additional vehicle specifications
 *           properties:
 *             year:
 *               type: number
 *               description: Manufacturing year
 *             manufacturer:
 *               type: string
 *               description: Vehicle manufacturer
 *             fuelType:
 *               type: string
 *               description: Type of fuel used
 *             capacity:
 *               type: number
 *               description: Load capacity or engine size
 *             vin:
 *               type: string
 *               description: Vehicle Identification Number
 *       example:
 *         model: CAT 336
 *         type: excavator
 *         status: active
 *         registrationDate: 2023-01-15T08:30:00Z
 *         metadata:
 *           year: 2022
 *           manufacturer: Caterpillar
 *           fuelType: diesel
 *           capacity: 36
 *           vin: 4Y1SL65848Z411439
 */

// Metadata schema definition
interface IMetadata {
  year?: number;
  manufacturer?: string;
  fuelType?: string;
  capacity?: number;
  vin?: string;
  [key: string]: any; // For additional flexible properties
}

// Base vehicle interface without Document
interface IVehicleBase {
  model: string;
  type: string;
  status: string;
  registrationDate: Date;
  metadata: IMetadata;
  createdAt: Date;
  updatedAt: Date;
}

// Vehicle document interface with typed Document generic
export type IVehicle = IVehicleBase & Document;

// Vehicle schema definition
const VehicleSchema: Schema = new Schema(
  {
    model: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Vehicle type is required'],
      enum: {
        values: ['truck', 'excavator', 'loader', 'bulldozer', 'crane', 'other'],
        message: '{VALUE} is not a supported vehicle type',
      },
      trim: true,
    },
    status: {
      type: String,
      required: [true, 'Vehicle status is required'],
      enum: {
        values: ['active', 'maintenance', 'inactive', 'retired'],
        message: '{VALUE} is not a valid status',
      },
      default: 'inactive',
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: Object,
      default: {},
      year: Number,
      manufacturer: String,
      fuelType: String,
      capacity: Number,
      vin: {
        type: String,
        sparse: true,
        index: true,
      },
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
VehicleSchema.index({ type: 1 });
VehicleSchema.index({ status: 1 });
VehicleSchema.index({ 'metadata.manufacturer': 1 });

// Create the model
const Vehicle = mongoose.model<IVehicle>('Vehicle', VehicleSchema);

export default Vehicle; 