import mongoose, { Document, Schema } from 'mongoose';



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