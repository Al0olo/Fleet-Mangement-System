import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IRegion {
  centerLat: number;
  centerLng: number;
  radiusKm: number;
}

export enum SimulationStatus {
  STOPPED = 'STOPPED',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED'
}

export interface ISimulationConfig extends Document {
  name: string;
  status: SimulationStatus;
  region: IRegion;
  vehicleCount: number;
  updateFrequencyMs: number;
  isDefault: boolean;
  startedAt?: Date;
  stoppedAt?: Date;
  // Stats
  eventsGenerated: number;
  vehiclesInSimulation: number;
  // Configuration for status changes
  probabilities: {
    maintenance: number;
    idle: number;
  };
}

const RegionSchema = new Schema({
  centerLat: { type: Number, required: true },
  centerLng: { type: Number, required: true },
  radiusKm: { type: Number, required: true }
}, { _id: false });

const SimulationConfigSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    status: { 
      type: String, 
      enum: Object.values(SimulationStatus), 
      default: SimulationStatus.STOPPED 
    },
    region: { type: RegionSchema, required: true },
    vehicleCount: { type: Number, required: true, min: 1, max: 1000 },
    updateFrequencyMs: { type: Number, required: true, min: 1000 },
    isDefault: { type: Boolean, default: false },
    startedAt: { type: Date },
    stoppedAt: { type: Date },
    eventsGenerated: { type: Number, default: 0 },
    vehiclesInSimulation: { type: Number, default: 0 },
    probabilities: {
      maintenance: { type: Number, min: 0, max: 1, default: 0.01 },
      idle: { type: Number, min: 0, max: 1, default: 0.1 }
    }
  },
  { 
    timestamps: true 
  }
);

// Ensure only one default configuration
SimulationConfigSchema.pre('save', async function(next) {
  if (this.isDefault) {
    const model = this.constructor as Model<ISimulationConfig>;
    await model.updateMany(
      { _id: { $ne: this._id }, isDefault: true },
      { isDefault: false }
    );
  }
  next();
});

export const SimulationConfig = mongoose.model<ISimulationConfig>('SimulationConfig', SimulationConfigSchema); 