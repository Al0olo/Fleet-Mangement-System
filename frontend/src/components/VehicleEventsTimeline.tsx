import React from 'react';
import { VehicleEvent } from '../redux/slices/trackingSlice';

interface VehicleEventsTimelineProps {
  events: VehicleEvent[];
  loading?: boolean;
  error?: string | null;
  limit?: number;
}

const VehicleEventsTimeline: React.FC<VehicleEventsTimelineProps> = ({
  events,
  loading = false,
  error = null,
  limit = 10
}) => {
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'TRIP_STARTED':
        return '🚗';
      case 'TRIP_COMPLETED':
        return '🏁';
      case 'MAINTENANCE_DUE':
        return '🔧';
      case 'IDLE_STARTED':
        return '⏸️';
      case 'IDLE_ENDED':
        return '▶️';
      case 'GEOFENCE_ENTER':
        return '⭕';
      case 'GEOFENCE_EXIT':
        return '🚪';
      case 'BATTERY_LOW':
        return '🔋';
      case 'FUEL_LOW':
        return '⛽';
      default:
        return '📌';
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'TRIP_STARTED':
        return '#4caf50'; // green
      case 'TRIP_COMPLETED':
        return '#2196f3'; // blue
      case 'MAINTENANCE_DUE':
        return '#f44336'; // red
      case 'IDLE_STARTED':
        return '#ff9800'; // orange
      case 'IDLE_ENDED':
        return '#4caf50'; // green
      case 'GEOFENCE_ENTER':
      case 'GEOFENCE_EXIT':
        return '#9c27b0'; // purple
      case 'BATTERY_LOW':
      case 'FUEL_LOW':
        return '#f44336'; // red
      default:
        return '#9e9e9e'; // gray
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: '15px' }}>
        <div style={{ textAlign: 'center' }}>Loading vehicle events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: '15px', backgroundColor: '#fff0f0' }}>
        <div style={{ color: '#d32f2f' }}>Error loading events: {error}</div>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="card" style={{ padding: '15px' }}>
        <div style={{ textAlign: 'center' }}>No events available</div>
      </div>
    );
  }

  // Sort events by timestamp in descending order (newest first)
  const sortedEvents = [...events]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);

  return (
    <div className="card" style={{ padding: '15px' }}>
      <h3 style={{ marginTop: 0 }}>Recent Events</h3>
      
      <div className="timeline" style={{ position: 'relative' }}>
        {/* Vertical timeline line */}
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          bottom: 0, 
          left: '20px', 
          width: '2px', 
          backgroundColor: '#e0e0e0',
          zIndex: 0
        }} />
        
        {sortedEvents.map((event, index) => (
          <div 
            key={event.id || index} 
            style={{ 
              position: 'relative', 
              marginBottom: '20px', 
              paddingLeft: '50px'
            }}
          >
            {/* Event icon */}
            <div style={{ 
              position: 'absolute', 
              left: 0, 
              top: 0, 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              backgroundColor: getEventColor(event.eventType),
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              zIndex: 1
            }}>
              {getEventIcon(event.eventType)}
            </div>
            
            {/* Event content */}
            <div style={{ 
              backgroundColor: '#f5f5f5', 
              borderRadius: '4px', 
              padding: '10px 15px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ 
                fontSize: '0.8rem', 
                color: '#666', 
                marginBottom: '5px' 
              }}>
                {new Date(event.timestamp).toLocaleString()}
              </div>
              
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                {event.eventType.replace(/_/g, ' ')}
              </div>
              
              {event.description && (
                <div style={{ marginBottom: '10px' }}>{event.description}</div>
              )}
              
              {event.tripInfo && (
                <div style={{ fontSize: '0.9rem' }}>
                  <div>Trip ID: {event.tripInfo.tripId}</div>
                  {event.tripInfo.distance && (
                    <div>Distance: {event.tripInfo.distance.toFixed(1)} km</div>
                  )}
                  {event.tripInfo.duration && (
                    <div>Duration: {(event.tripInfo.duration / 60).toFixed(0)} mins</div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {events.length > limit && (
        <div style={{ textAlign: 'center', marginTop: '10px', color: '#666' }}>
          + {events.length - limit} more events
        </div>
      )}
    </div>
  );
};

export default VehicleEventsTimeline; 