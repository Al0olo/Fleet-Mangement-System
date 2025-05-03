import mongoose, { Schema, Document } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     TripInfo:
 *       type: object
 *       properties:
 *         tripId:
 *           type: string
 *           description: The unique identifier of the trip
 *         startTime:
 *           type: string
 *           format: date-time
 *           description: Trip start timestamp
 *         endTime:
 *           type: string
 *           format: date-time
 *           description: Trip end timestamp
 *         startLocation:
 *           $ref: '#/components/schemas/GeoLocation'
 *         endLocation:
 *           $ref: '#/components/schemas/GeoLocation'
 *         distance:
 *           type: number
 *           description: Trip distance in kilometers
 *         duration:
 *           type: number
 *           description: Trip duration in minutes
 *     VehicleEvent:
 *       type: object
 *       required:
 *         - vehicleId
 *         - timestamp
 *         - eventType
 *       properties:
 *         vehicleId:
 *           type: string
 *           description: The unique identifier of the vehicle
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: The date and time when the event occurred
 *         eventType:
 *           type: string
 *           description: Type of vehicle event
 *           enum: [TRIP_STARTED, TRIP_COMPLETED, MAINTENANCE_DUE, IDLE_STARTED, IDLE_ENDED, GEOFENCE_ENTER, GEOFENCE_EXIT, BATTERY_LOW, FUEL_LOW]
 *           example: TRIP_COMPLETED
 *         description:
 *           type: string
 *           description: Human-readable description of the event
 *         tripInfo:
 *           $ref: '#/components/schemas/TripInfo'
 *         location:
 *           $ref: '#/components/schemas/GeoLocation'
 *         metadata:
 *           type: object
 *           description: Additional metadata about the event
 */

// Define the interface for trip information
export interface ITripInfo {
  tripId: mongoose.Types.ObjectId | string;
  startTime?: Date;
  endTime?: Date;
  startLocation?: {
    type: string;
    coordinates: number[];
  };
  endLocation?: {
    type: string;
    coordinates: number[];
  };
  distance?: number;
  duration?: number;
}

// Define the interface for vehicle events
export interface IVehicleEvent extends Document {
  vehicleId: mongoose.Types.ObjectId | string;
  timestamp: Date;
  eventType: 'TRIP_STARTED' | 'TRIP_COMPLETED' | 'MAINTENANCE_DUE' | 'IDLE_STARTED' | 'IDLE_ENDED' | 'GEOFENCE_ENTER' | 'GEOFENCE_EXIT' | 'BATTERY_LOW' | 'FUEL_LOW';
  description?: string;
  tripInfo?: ITripInfo;
  location?: {
    type: string;
    coordinates: number[];
  };
  metadata?: Record<string, any>;
}

// Create the vehicle event schema
const VehicleEventSchema: Schema = new Schema({
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
  eventType: {
    type: String,
    required: [true, 'Event type is required'],
    enum: ['TRIP_STARTED', 'TRIP_COMPLETED', 'MAINTENANCE_DUE', 'IDLE_STARTED', 'IDLE_ENDED', 'GEOFENCE_ENTER', 'GEOFENCE_EXIT', 'BATTERY_LOW', 'FUEL_LOW']
  },
  description: {
    type: String
  },
  tripInfo: {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'Trip'
    },
    startTime: Date,
    endTime: Date,
    startLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        validate: {
          validator: function(v: number[]) {
            return v.length === 2 && 
                   v[0] >= -180 && v[0] <= 180 && // Longitude
                   v[1] >= -90 && v[1] <= 90;     // Latitude
          },
          message: 'Invalid coordinates. Must be [longitude, latitude] within valid ranges.'
        }
      }
    },
    endLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        validate: {
          validator: function(v: number[]) {
            return v.length === 2 && 
                   v[0] >= -180 && v[0] <= 180 && // Longitude
                   v[1] >= -90 && v[1] <= 90;     // Latitude
          },
          message: 'Invalid coordinates. Must be [longitude, latitude] within valid ranges.'
        }
      }
    },
    distance: Number,
    duration: Number
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      validate: {
        validator: function(v: number[]) {
          return v.length === 2 && 
                 v[0] >= -180 && v[0] <= 180 && // Longitude
                 v[1] >= -90 && v[1] <= 90;     // Latitude
        },
        message: 'Invalid coordinates. Must be [longitude, latitude] within valid ranges.'
      }
    }
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'vehicleEvents'
});

// Compound index for vehicle and timestamp queries
VehicleEventSchema.index({ vehicleId: 1, timestamp: -1 });
// Index for event type queries
VehicleEventSchema.index({ eventType: 1 });
// Add index for geospatial queries
VehicleEventSchema.index({ location: '2dsphere' });

// Create and export the model
const VehicleEvent = mongoose.model<IVehicleEvent>('VehicleEvent', VehicleEventSchema);

export default VehicleEvent; 