import mongoose, { Schema, Document } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     GeoLocation:
 *       type: object
 *       required:
 *         - type
 *         - coordinates
 *       properties:
 *         type:
 *           type: string
 *           description: The GeoJSON type
 *           example: Point
 *         coordinates:
 *           type: array
 *           description: Longitude and Latitude coordinates [lng, lat]
 *           items:
 *             type: number
 *           example: [55.3781, 3.4360]
 *     LocationData:
 *       type: object
 *       required:
 *         - vehicleId
 *         - timestamp
 *         - location
 *       properties:
 *         vehicleId:
 *           type: string
 *           description: The unique identifier of the vehicle
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: The date and time when the location was recorded
 *         location:
 *           $ref: '#/components/schemas/GeoLocation'
 *         speed:
 *           type: number
 *           description: Speed in kilometers per hour
 *         heading:
 *           type: number
 *           description: Heading in degrees (0-360)
 *         altitude:
 *           type: number
 *           description: Altitude in meters
 *         accuracy:
 *           type: number
 *           description: Accuracy of the location data in meters
 *         metadata:
 *           type: object
 *           description: Additional metadata about the location
 */

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