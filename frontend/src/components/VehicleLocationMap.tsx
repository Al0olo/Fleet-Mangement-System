import React from 'react';
import { LocationData } from '../redux/slices/trackingSlice';

interface VehicleLocationMapProps {
  location: LocationData | null;
  width?: string | number;
  height?: string | number;
  zoom?: number;
  loading?: boolean;
  error?: string | null;
}

const VehicleLocationMap: React.FC<VehicleLocationMapProps> = ({
  location,
  width = '100%',
  height = '300px',
  zoom = 14,
  loading = false,
  error = null
}) => {
  if (loading) {
    return (
      <div 
        style={{ 
          width, 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px'
        }}
      >
        Loading map...
      </div>
    );
  }

  if (error) {
    return (
      <div 
        style={{ 
          width, 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#fff0f0',
          color: '#d32f2f',
          borderRadius: '4px',
          padding: '16px'
        }}
      >
        Error loading map: {error}
      </div>
    );
  }

  if (!location || !location.location.coordinates) {
    return (
      <div 
        style={{ 
          width, 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px'
        }}
      >
        No location data available
      </div>
    );
  }

  const [longitude, latitude] = location.location.coordinates;
  
  // Don't use Google Maps embed as it requires an API key
  // Instead use a placeholder map visualization
  return (
    <div style={{ width, height, position: 'relative' }}>
      <div 
        style={{ 
          width: '100%', 
          height: '100%', 
          backgroundColor: '#e5e5e5',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
          Vehicle Location at {new Date(location.timestamp).toLocaleString()}
        </div>
        <div style={{ marginBottom: '8px' }}>
          Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </div>
        {location.speed !== undefined && (
          <div style={{ marginBottom: '5px' }}>Speed: {location.speed} km/h</div>
        )}
        {location.heading !== undefined && (
          <div style={{ marginBottom: '5px' }}>Heading: {location.heading}°</div>
        )}
        
        {/* Map placeholder with a grid to simulate a map */}
        <div style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#d1e5f5',
          zIndex: -1,
          backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          opacity: 0.7
        }} />
        
        {/* Vehicle marker */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '20px',
          height: '20px',
          backgroundColor: 'red',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 0 10px rgba(0,0,0,0.5)',
          zIndex: 10
        }} />
      </div>
    </div>
  );
};

export default VehicleLocationMap; 