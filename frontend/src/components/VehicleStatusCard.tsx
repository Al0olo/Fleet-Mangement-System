import React from 'react';
import { VehicleStatus } from '../redux/slices/trackingSlice';

interface VehicleStatusCardProps {
  status: VehicleStatus | null;
  loading?: boolean;
  error?: string | null;
}

const VehicleStatusCard: React.FC<VehicleStatusCardProps> = ({
  status,
  loading = false,
  error = null
}) => {
  const getStatusColor = (statusType: string) => {
    switch (statusType) {
      case 'ACTIVE':
        return '#4caf50'; // green
      case 'IDLE':
        return '#ff9800'; // orange
      case 'MAINTENANCE':
        return '#2196f3'; // blue
      case 'OUT_OF_SERVICE':
        return '#f44336'; // red
      default:
        return '#9e9e9e'; // gray
    }
  };

  const getEngineStatusIcon = (engineStatus: string) => {
    switch (engineStatus) {
      case 'ON':
        return '🟢';
      case 'OFF':
        return '⚫';
      case 'ERROR':
        return '🔴';
      default:
        return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: '15px' }}>
        <div style={{ textAlign: 'center' }}>Loading vehicle status...</div>
      </div>
    );
  }

  if (!status || error) {
    return (
      <div className="card" style={{ padding: '15px' }}>
        <div style={{ textAlign: 'center' }}>No status data available</div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '15px' }}>
      <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Vehicle Status
        <span style={{ 
          fontSize: '0.8rem', 
          padding: '3px 8px', 
          backgroundColor: getStatusColor(status.status),
          color: 'white',
          borderRadius: '12px'
        }}>
          {status.status}
        </span>
      </h3>
      
      <div style={{ marginBottom: '15px', fontSize: '0.8rem', color: '#666' }}>
        Last updated: {new Date(status.timestamp).toLocaleString()}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {status.engineStatus && (
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Engine</div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {getEngineStatusIcon(status.engineStatus)} {status.engineStatus}
            </div>
          </div>
        )}
        
        {status.fuelLevel !== undefined && (
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Fuel Level</div>
            <div>
              <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '10px', height: '10px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${status.fuelLevel}%`, 
                    backgroundColor: status.fuelLevel < 20 ? '#f44336' : '#4caf50', 
                    height: '100%' 
                  }} 
                />
              </div>
              <div style={{ fontSize: '0.8rem', marginTop: '5px' }}>{status.fuelLevel}%</div>
            </div>
          </div>
        )}
        
        {status.batteryLevel !== undefined && (
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Battery</div>
            <div>
              <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '10px', height: '10px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${status.batteryLevel}%`, 
                    backgroundColor: status.batteryLevel < 20 ? '#f44336' : '#4caf50', 
                    height: '100%' 
                  }} 
                />
              </div>
              <div style={{ fontSize: '0.8rem', marginTop: '5px' }}>{status.batteryLevel}%</div>
            </div>
          </div>
        )}
        
        {status.odometer !== undefined && (
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Odometer</div>
            <div>{status.odometer.toLocaleString()} km</div>
          </div>
        )}
      </div>

      {status.metadata && Object.keys(status.metadata).length > 0 && (
        <div style={{ marginTop: '15px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Additional Info</div>
          <div style={{ fontSize: '0.9rem' }}>
            {Object.entries(status.metadata).map(([key, value]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>{key}:</span>
                <span>{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleStatusCard; 