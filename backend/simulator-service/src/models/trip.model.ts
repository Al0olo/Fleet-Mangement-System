import mongoose, { Document, Schema } from 'mongoose';
import { GeoPoint } from './vehicle.model';

export enum TripStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface IWaypoint {
  location: GeoPoint;
  arrivalTime?: Date;
  departureTime?: Date;
  isVisited: boolean;
  stopDurationMinutes?: number;
}

export interface ITrip extends Document {
  tripId: string;
  vehicleId: string;
  status: TripStatus;
  startLocation: GeoPoint;
  endLocation: GeoPoint;
  waypoints: IWaypoint[];
  startTime?: Date;
  estimatedEndTime?: Date;
  actualEndTime?: Date;
  currentWaypointIndex: number;
  distanceKm: number;
  averageSpeedKmh: number;
  currentLocation?: GeoPoint;
  // For simulation purposes
  routePoints: {
    location: GeoPoint;
    timestamp: Date;
    speed: number;
    heading: number;
  }[];
}

const WaypointSchema = new Schema({
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
  arrivalTime: { type: Date },
  departureTime: { type: Date },
  isVisited: { type: Boolean, default: false },
  stopDurationMinutes: { type: Number }
}, { _id: false });

const RoutePointSchema = new Schema({
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
  timestamp: { type: Date, required: true },
  speed: { type: Number, required: true },
  heading: { type: Number, required: true }
}, { _id: false });

const TripSchema: Schema = new Schema(
  {
    tripId: { type: String, required: true, unique: true },
    vehicleId: { type: String, required: true },
    status: { 
      type: String, 
      enum: Object.values(TripStatus), 
      default: TripStatus.PLANNED 
    },
    startLocation: {
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
    endLocation: {
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
    waypoints: [WaypointSchema],
    startTime: { type: Date },
    estimatedEndTime: { type: Date },
    actualEndTime: { type: Date },
    currentWaypointIndex: { type: Number, default: 0 },
    distanceKm: { type: Number, required: true },
    averageSpeedKmh: { type: Number, required: true },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: [Number]
    },
    routePoints: [RoutePointSchema]
  },
  { 
    timestamps: true 
  }
);

// Create indexes
TripSchema.index({ vehicleId: 1 });
TripSchema.index({ status: 1 });
TripSchema.index({ startLocation: '2dsphere' });
TripSchema.index({ endLocation: '2dsphere' });

export const Trip = mongoose.model<ITrip>('SimulatedTrip', TripSchema); 