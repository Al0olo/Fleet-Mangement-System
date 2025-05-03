import { v4 as uuidv4 } from 'uuid';
import * as turf from '@turf/turf';
import * as geolib from 'geolib';
import { Trip, ITrip, TripStatus } from '../models/trip.model';
import { GeoPoint, IVehicle, VehicleStatus } from '../models/vehicle.model';
import { logger } from '../util/logger';
import { generateRandomPoint } from './vehicle.service';
import { updateVehicleStatus, updateVehicleLocation } from './vehicle.service';
import { EventType, publishTripEvent } from './kafka.service';

/**
 * Calculate a realistic path between two points with optional waypoints
 */
export const calculatePath = (
  startLocation: GeoPoint,
  endLocation: GeoPoint,
  numPoints: number = 50,
  waypoints: GeoPoint[] = []
): GeoPoint[] => {
  const points: GeoPoint[] = [];
  
  // Add start location
  points.push(startLocation);
  
  // Add waypoints
  if (waypoints.length > 0) {
    points.push(...waypoints);
  }
  
  // Add end location
  points.push(endLocation);
  
  // Use Turf.js to create a line
  const lineFeature = turf.lineString(points.map(p => p.coordinates));
  
  // Use the bezier spline to make the path more natural
  const bezierOptions = { resolution: 10000, sharpness: 0.85 };
  const bezierLine = turf.bezierSpline(lineFeature, bezierOptions);
  
  // Sample points along the path
  const pathDistance = turf.length(bezierLine, { units: 'kilometers' });
  const distancePerPoint = pathDistance / numPoints;
  
  const pathPoints: GeoPoint[] = [];
  
  // Add the starting point
  pathPoints.push(startLocation);
  
  // Interpolate points along the line
  for (let i = 1; i < numPoints - 1; i++) {
    const point = turf.along(bezierLine, i * distancePerPoint, { units: 'kilometers' });
    
    if (point && point.geometry) {
      pathPoints.push({
        type: 'Point',
        coordinates: [point.geometry.coordinates[0], point.geometry.coordinates[1]] as [number, number]
      });
    }
  }
  
  // Add the end point
  pathPoints.push(endLocation);
  
  return pathPoints;
};

/**
 * Generate random waypoints within a region
 */
const generateRandomWaypoints = (
  region: { centerLat: number; centerLng: number; radiusKm: number },
  count: number
): GeoPoint[] => {
  const waypoints: GeoPoint[] = [];
  
  for (let i = 0; i < count; i++) {
    const point = generateRandomPoint(region.centerLat, region.centerLng, region.radiusKm);
    
    waypoints.push({
      type: 'Point',
      coordinates: [point.longitude, point.latitude]
    });
  }
  
  return waypoints;
};

/**
 * Create a simulated trip
 */
export const createSimulatedTrip = async (
  vehicle: IVehicle,
  region: { centerLat: number; centerLng: number; radiusKm: number },
  includeWaypoints: boolean = true
): Promise<ITrip> => {
  // Generate random end location 
  const endPoint = generateRandomPoint(region.centerLat, region.centerLng, region.radiusKm * 0.8);
  
  // Create end location point
  const endLocation: GeoPoint = {
    type: 'Point',
    coordinates: [endPoint.longitude, endPoint.latitude]
  };
  
  // Generate waypoints (0-3 random points)
  const waypointCount = includeWaypoints ? Math.floor(Math.random() * 3) : 0;
  const waypointGeoPoints = generateRandomWaypoints(region, waypointCount);
  
  // Calculate realistic route path with waypoints
  const routePath = calculatePath(
    vehicle.location,
    endLocation,
    50,
    waypointGeoPoints
  );
  
  // Calculate average speed based on vehicle type (30-90 km/h)
  const minSpeed = 30;
  const maxSpeed = 90;
  const averageSpeedKmh = minSpeed + Math.floor(Math.random() * (maxSpeed - minSpeed));
  
  // Calculate total distance in kilometers
  let totalDistanceKm = 0;
  
  for (let i = 1; i < routePath.length; i++) {
    const pointA = {
      latitude: routePath[i-1].coordinates[1],
      longitude: routePath[i-1].coordinates[0]
    };
    
    const pointB = {
      latitude: routePath[i].coordinates[1],
      longitude: routePath[i].coordinates[0]
    };
    
    totalDistanceKm += geolib.getDistance(pointA, pointB) / 1000;
  }
  
  // Calculate estimated travel time in hours
  const estimatedTravelHours = totalDistanceKm / averageSpeedKmh;
  
  // Create waypoints with time information
  const waypoints = waypointGeoPoints.map(waypoint => {
    return {
      location: waypoint,
      isVisited: false,
      stopDurationMinutes: Math.floor(Math.random() * 10) + 5 // 5-15 minutes
    };
  });
  
  // Create route points with timestamps and speed/heading
  const now = new Date();
  const routePoints = routePath.map((point, index) => {
    // Calculate time to reach this point
    const progress = index / (routePath.length - 1);
    const timeOffset = estimatedTravelHours * progress * 60 * 60 * 1000; // ms
    const timestamp = new Date(now.getTime() + timeOffset);
    
    // Calculate heading between points
    let heading = 0;
    if (index > 0) {
      const prev = routePath[index - 1];
      heading = geolib.getGreatCircleBearing(
        { latitude: prev.coordinates[1], longitude: prev.coordinates[0] },
        { latitude: point.coordinates[1], longitude: point.coordinates[0] }
      );
    }
    
    // Randomize speed a bit around the average
    const speed = Math.max(5, averageSpeedKmh + (Math.random() * 20 - 10));
    
    return {
      location: point,
      timestamp,
      speed,
      heading
    };
  });
  
  // Create trip document
  const trip = new Trip({
    tripId: uuidv4(),
    vehicleId: vehicle.vehicleId,
    status: TripStatus.PLANNED,
    startLocation: vehicle.location,
    endLocation,
    waypoints,
    distanceKm: totalDistanceKm,
    averageSpeedKmh,
    routePoints,
    estimatedEndTime: new Date(now.getTime() + estimatedTravelHours * 60 * 60 * 1000)
  });
  
  try {
    await trip.save();
    logger.info(`Created simulated trip: ${trip.tripId} for vehicle ${vehicle.vehicleId}`);
    return trip;
  } catch (error) {
    logger.error(`Failed to create simulated trip for vehicle ${vehicle.vehicleId}`, error);
    throw error;
  }
};

/**
 * Start a trip
 */
export const startTrip = async (tripId: string): Promise<ITrip | null> => {
  try {
    const trip = await Trip.findOne({ tripId });
    
    if (!trip) {
      logger.warn(`Trip not found: ${tripId}`);
      return null;
    }
    
    // Update trip status
    trip.status = TripStatus.IN_PROGRESS;
    trip.startTime = new Date();
    trip.currentLocation = trip.startLocation;
    await trip.save();
    
    // Update vehicle status
    await updateVehicleStatus(trip.vehicleId, VehicleStatus.RUNNING);
    
    // Publish trip start event
    await publishTripEvent(trip.vehicleId, trip.tripId, EventType.TRIP_START);
    
    logger.info(`Started trip: ${tripId} for vehicle ${trip.vehicleId}`);
    return trip;
  } catch (error) {
    logger.error(`Failed to start trip: ${tripId}`, error);
    throw error;
  }
};

/**
 * Complete a trip
 */
export const completeTrip = async (tripId: string): Promise<ITrip | null> => {
  try {
    const trip = await Trip.findOne({ tripId });
    
    if (!trip) {
      logger.warn(`Trip not found: ${tripId}`);
      return null;
    }
    
    // Update trip status
    trip.status = TripStatus.COMPLETED;
    trip.actualEndTime = new Date();
    trip.currentLocation = trip.endLocation;
    await trip.save();
    
    // Update vehicle status and location
    await updateVehicleStatus(trip.vehicleId, VehicleStatus.IDLE);
    await updateVehicleLocation(
      trip.vehicleId, 
      trip.endLocation, 
      0, 
      0
    );
    
    // Publish trip end event
    await publishTripEvent(trip.vehicleId, trip.tripId, EventType.TRIP_END);
    
    logger.info(`Completed trip: ${tripId} for vehicle ${trip.vehicleId}`);
    return trip;
  } catch (error) {
    logger.error(`Failed to complete trip: ${tripId}`, error);
    throw error;
  }
};

/**
 * Get all trips
 */
export const getAllTrips = async (): Promise<ITrip[]> => {
  try {
    return await Trip.find().sort({ createdAt: -1 });
  } catch (error) {
    logger.error('Failed to get all trips', error);
    throw error;
  }
};

/**
 * Get a trip by ID
 */
export const getTripById = async (tripId: string): Promise<ITrip | null> => {
  try {
    return await Trip.findOne({ tripId });
  } catch (error) {
    logger.error(`Failed to get trip: ${tripId}`, error);
    throw error;
  }
};

/**
 * Get active trips (in progress)
 */
export const getActiveTrips = async (): Promise<ITrip[]> => {
  try {
    return await Trip.find({ status: TripStatus.IN_PROGRESS });
  } catch (error) {
    logger.error('Failed to get active trips', error);
    throw error;
  }
};

/**
 * Get trips for a vehicle
 */
export const getTripsForVehicle = async (vehicleId: string): Promise<ITrip[]> => {
  try {
    return await Trip.find({ vehicleId }).sort({ createdAt: -1 });
  } catch (error) {
    logger.error(`Failed to get trips for vehicle: ${vehicleId}`, error);
    throw error;
  }
};

/**
 * Get next point in route
 */
export const getNextRoutePoint = (trip: ITrip, currentTime: Date): { point: any; isLastPoint: boolean } | null => {
  if (!trip.routePoints || trip.routePoints.length === 0) {
    return null;
  }
  
  // Find the first point that is scheduled after the current time
  for (let i = 0; i < trip.routePoints.length; i++) {
    const point = trip.routePoints[i];
    if (point.timestamp > currentTime) {
      return { 
        point, 
        isLastPoint: (i === trip.routePoints.length - 1)
      };
    }
  }
  
  // If we've gone past all points, return the last point
  return { 
    point: trip.routePoints[trip.routePoints.length - 1],
    isLastPoint: true
  };
}; 