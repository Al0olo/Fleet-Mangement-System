import mongoose, { Schema, Document } from 'mongoose';


// Define the interface for vehicle status
export interface IVehicleStatus extends Document {
  vehicleId: mongoose.Types.ObjectId | string;
  timestamp: Date;
  status: 'ACTIVE' | 'IDLE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  fuelLevel?: number;
  batteryLevel?: number;
  engineStatus?: 'ON' | 'OFF' | 'ERROR';
  odometer?: number;
  metadata?: Record<string, any>;
}

// Create the vehicle status schema
const VehicleStatusSchema: Schema = new Schema({
  vehicleId: {
    type: Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle ID is required'],
    index: true
  },
  timestamp: {
    type: Date,
    required: [true, 'Timestamp is required'],
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['ACTIVE', 'IDLE', 'MAINTENANCE', 'OUT_OF_SERVICE'],
    default: 'ACTIVE'
  },
  fuelLevel: {
    type: Number,
    min: 0,
    max: 100
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100
  },
  engineStatus: {
    type: String,
    enum: ['ON', 'OFF', 'ERROR']
  },
  odometer: {
    type: Number,
    min: 0
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'vehicleStatus'
});

// Compound index for vehicle and timestamp queries
VehicleStatusSchema.index({ vehicleId: 1, timestamp: -1 });

// Create and export the model
const VehicleStatus = mongoose.model<IVehicleStatus>('VehicleStatus', VehicleStatusSchema);

export default VehicleStatus; 