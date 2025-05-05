import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for location data
export interface ILocationData extends Document {
  vehicleId: mongoose.Types.ObjectId | string;
  timestamp: Date;
  location: {
    type: string;
    coordinates: number[];
  };
  speed?: number;
  heading?: number;
  altitude?: number;
  accuracy?: number;
  metadata?: Record<string, any>;
}

// Create the location data schema
const LocationDataSchema: Schema = new Schema({
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
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: [true, 'Coordinates are required'],
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
  speed: {
    type: Number,
    min: 0,
    default: 0
  },
  heading: {
    type: Number,
    min: 0,
    max: 360,
    default: 0
  },
  altitude: {
    type: Number,
    default: 0
  },
  accuracy: {
    type: Number,
    min: 0,
    default: 0
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'locationData'
});

// Add index for geospatial queries
LocationDataSchema.index({ location: '2dsphere' });
// Compound index for vehicle and timestamp queries
LocationDataSchema.index({ vehicleId: 1, timestamp: -1 });

// Create and export the model
const LocationData = mongoose.model<ILocationData>('LocationData', LocationDataSchema);

export default LocationData; 