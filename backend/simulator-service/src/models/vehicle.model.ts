import mongoose, { Document, Schema } from 'mongoose';

// Define vehicle status types
export enum VehicleStatus {
  RUNNING = 'RUNNING',
  IDLE = 'IDLE',
  MAINTENANCE = 'MAINTENANCE'
}

// Define vehicle type (for different types of fleet vehicles)
export enum VehicleType {
  PASSENGER = 'PASSENGER',
  CARGO = 'CARGO',
  HEAVY_DUTY = 'HEAVY_DUTY'
}

// Interface for GeoJSON point
export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

// Interface for vehicle document
export interface IVehicle extends Document {
  vehicleId: string;
  vin: string;
  name: string;
  type: VehicleType;
  status: VehicleStatus;
  location: GeoPoint;
  speed: number;
  heading: number;
  fuelLevel: number;
  odometer: number;
  engineHours: number;
  lastUpdated: Date;
  active: boolean;
  // If on a trip
  currentTrip?: string;
  destinationLocation?: GeoPoint;
}

// Schema definition
const VehicleSchema: Schema = new Schema(
  {
    vehicleId: { type: String, required: true, unique: true },
    vin: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { 
      type: String, 
      enum: Object.values(VehicleType),
      default: VehicleType.PASSENGER 
    },
    status: { 
      type: String, 
      enum: Object.values(VehicleStatus), 
      default: VehicleStatus.IDLE 
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true
      },
      coordinates: {
        type: [Number],
        required: true
      }
    },
    speed: { type: Number, default: 0 },
    heading: { type: Number, default: 0 },
    fuelLevel: { type: Number, default: 100 },
    odometer: { type: Number, default: 0 },
    engineHours: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
    currentTrip: { type: String, required: false },
    destinationLocation: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: [Number]
    }
  },
  { 
    timestamps: true 
  }
);

// Create geospatial index for location
VehicleSchema.index({ location: '2dsphere' });

// Create the model
export const Vehicle = mongoose.model<IVehicle>('SimulatedVehicle', VehicleSchema); 