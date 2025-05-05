import { useEffect, useState, CSSProperties } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../redux/store';
import { fetchVehicleById, deleteVehicle } from '../redux/slices/vehicleSlice';
import { fetchVehicleMaintenanceRecords } from '../redux/slices/maintenanceRecordSlice';
import { fetchVehicleMaintenanceSchedules } from '../redux/slices/maintenanceScheduleSlice';
import { fetchVehicleAnalytics, fetchMetricTrends, fetchVehicleComparison } from '../redux/slices/analyticsSlice';
import { 
  fetchVehicleLocation, 
  fetchVehicleStatus, 
  fetchVehicleEvents,
  clearTrackingData
} from '../redux/slices/trackingSlice';
import VehicleLocationMap from '../components/VehicleLocationMap';
import VehicleStatusCard from '../components/VehicleStatusCard';
import VehicleEventsTimeline from '../components/VehicleEventsTimeline';

// Explicitly define the functional component 
function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const { vehicle, loading: vehicleLoading, error: vehicleError } = useSelector((state: RootState) => state.vehicles);
  const { records, loading: recordsLoading } = useSelector((state: RootState) => state.maintenanceRecords);
  const { schedules, loading: schedulesLoading } = useSelector((state: RootState) => state.maintenanceSchedules);
  const { vehicleData, metricTrends, vehicleComparison, loading: analyticsLoading } = useSelector((state: RootState) => state.analytics);
  const { 
    vehicleLocation, 
    vehicleStatus, 
    vehicleEvents,
    loading: trackingLoading,
    error: trackingError
  } = useSelector((state: RootState) => state.tracking);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [metricType, setMetricType] = useState('fuelEfficiency');
  const [timeRange, setTimeRange] = useState('30');
  
  const vehicleId = id;
  
  useEffect(() => {
    if (id) {
      dispatch(fetchVehicleById(id));
      dispatch(fetchVehicleMaintenanceRecords({ vehicleId: id }));
      dispatch(fetchVehicleMaintenanceSchedules({ vehicleId: id }));
      dispatch(fetchVehicleAnalytics(id));
      
      dispatch(fetchVehicleLocation(id));
      dispatch(fetchVehicleStatus(id));
      dispatch(fetchVehicleEvents({ vehicleId: id }));
      
      const trackingInterval = setInterval(() => {
        dispatch(fetchVehicleLocation(id));
        dispatch(fetchVehicleStatus(id));
      }, 30000);
      
      return () => {
        clearInterval(trackingInterval);
        dispatch(clearTrackingData());
      };
    }
  }, [dispatch, id]);
  
  useEffect(() => {
    if (activeTab === 'analytics' && vehicleId) {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));
      
      // Fetch metric trends
      dispatch(fetchMetricTrends({
        vehicleId,
        metricType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        interval: 'day'
      }));
      
      // Fetch vehicle comparison
      dispatch(fetchVehicleComparison({
        vehicleId,
        metricType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }));
    }
  }, [dispatch, vehicleId, activeTab, metricType, timeRange]);
  
  const handleDelete = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    setDeleteError('');
    
    try {
      await dispatch(deleteVehicle(id)).unwrap();
      navigate('/vehicles');
    } catch (err) {
      setDeleteError('Failed to delete vehicle. Please try again.');
      setShowDeleteConfirm(false);
      console.error('Delete vehicle error:', err);
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleMetricChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMetricType(e.target.value);
  };
  
  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeRange(e.target.value);
  };
  
  const loading = vehicleLoading || recordsLoading || schedulesLoading || analyticsLoading || trackingLoading.location || trackingLoading.status;

  // Define styles as React inline style objects
  const styles: Record<string, CSSProperties> = {
    vehicleDetailContainer: {
      padding: '20px',
    },
    vehicleDetailHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
    },
    tabsContainer: {
      display: 'flex',
      borderBottom: '1px solid #eee',
      marginBottom: '20px',
    },
    tab: {
      padding: '10px 20px',
      cursor: 'pointer',
      fontSize: '16px',
      borderBottom: '2px solid transparent',
    },
    tabActive: {
      borderBottom: '2px solid var(--primary-color)',
      color: 'var(--primary-color)',
      fontWeight: 'bold',
    },
    vehicleStatus: {
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '0.8rem',
      textTransform: 'uppercase' as const,
      marginTop: '5px',
    },
    vehicleStatusActive: {
      backgroundColor: 'var(--success-color)',
      color: 'white',
    },
    vehicleStatusMaintenance: {
      backgroundColor: 'var(--warning-color)',
      color: 'white',
    },
    vehicleStatusInactive: {
      backgroundColor: 'var(--error-color)',
      color: 'white',
    },
    actionButtons: {
      display: 'flex',
      gap: '10px',
    },
    btn: {
      padding: '8px 16px',
      borderRadius: '4px',
      fontWeight: 'bold',
      cursor: 'pointer',
      textDecoration: 'none',
      border: 'none',
    },
    btnSmall: {
      padding: '4px 8px',
      fontSize: '0.8rem',
    },
    btnPrimary: {
      backgroundColor: 'var(--primary-color)',
      color: 'white',
    },
    btnSecondary: {
      backgroundColor: 'var(--secondary-color)',
      color: 'white',
    },
    btnDanger: {
      backgroundColor: 'var(--error-color)',
      color: 'white',
    },
    vehicleDetailsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '20px',
      marginBottom: '20px',
    },
    detailRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: '1px solid #eee',
    },
    detailLabel: {
      fontWeight: 'bold',
      color: 'var(--text-secondary)',
    },
    detailValue: {
      textAlign: 'right' as const,
    },
    sectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '15px',
    },
    maintenanceTable: {
      width: '100%',
      borderCollapse: 'collapse' as const,
    },
    tableCell: {
      padding: '10px',
      textAlign: 'left' as const,
      borderBottom: '1px solid #eee',
    },
    tableHeader: {
      backgroundColor: 'var(--background-secondary)',
      fontWeight: 'bold',
      padding: '10px',
      textAlign: 'left' as const,
      borderBottom: '1px solid #eee',
    },
    viewAllLink: {
      display: 'block',
      marginTop: '10px',
      textAlign: 'right' as const,
    },
    errorMessage: {
      color: 'var(--error-color)',
      margin: '20px 0',
    },
    modalOverlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '20px',
      width: '400px',
      maxWidth: '90%',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    },
    modalActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
      marginTop: '20px',
    },
    trackingGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
      marginBottom: '20px',
    },
    fullWidthSection: {
      gridColumn: '1 / -1',
    },
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return { ...styles.vehicleStatus, ...styles.vehicleStatusActive };
      case 'maintenance':
        return { ...styles.vehicleStatus, ...styles.vehicleStatusMaintenance };
      case 'inactive':
      case 'retired':
        return { ...styles.vehicleStatus, ...styles.vehicleStatusInactive };
      default:
        return styles.vehicleStatus;
    }
  };

  // Add styles for status badges
  const getScheduleStatusStyle = (status: string) => {
    switch (status) {
      case 'scheduled':
        return { backgroundColor: '#2196f3', color: 'white' };
      case 'in-progress':
        return { backgroundColor: '#ff9800', color: 'white' };
      case 'completed':
        return { backgroundColor: '#4caf50', color: 'white' };
      case 'cancelled':
        return { backgroundColor: '#f44336', color: 'white' };
      case 'overdue':
        return { backgroundColor: '#d32f2f', color: 'white' };
      default:
        return { backgroundColor: '#757575', color: 'white' };
    }
  };

  const renderOverviewTab = () => (
    <>
      <div style={styles.trackingGrid}>
        <div style={styles.fullWidthSection}>
          <VehicleLocationMap 
            location={vehicleLocation}
            loading={trackingLoading.location}
            error={trackingError.location}
            height="400px"
          />
        </div>
        
        <VehicleStatusCard 
          status={vehicleStatus}
          loading={trackingLoading.status}
          error={trackingError.status}
        />
        
        <VehicleEventsTimeline 
          events={vehicleEvents}
          loading={trackingLoading.events}
          error={trackingError.events}
          limit={5}
        />
      </div>
      
      <div style={styles.vehicleDetailsGrid}>
        <div className="card">
          <h2>Vehicle Information</h2>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Model:</span>
            <span style={styles.detailValue}>{vehicle?.model}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Type:</span>
            <span style={styles.detailValue}>{vehicle?.type}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Status:</span>
            <span style={styles.detailValue}>{vehicle?.status}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Registration Date:</span>
            <span style={styles.detailValue}>
              {vehicle?.registrationDate ? new Date(vehicle.registrationDate).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          {vehicle?.metadata?.manufacturer && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Manufacturer:</span>
              <span style={styles.detailValue}>{vehicle.metadata.manufacturer}</span>
            </div>
          )}
          {vehicle?.metadata?.year && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Year:</span>
              <span style={styles.detailValue}>{vehicle.metadata.year}</span>
            </div>
          )}
          {vehicle?.metadata?.vin && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>VIN:</span>
              <span style={styles.detailValue}>{vehicle.metadata.vin}</span>
            </div>
          )}
          {vehicle?.metadata?.fuelType && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Fuel Type:</span>
              <span style={styles.detailValue}>{vehicle.metadata.fuelType}</span>
            </div>
          )}
          {vehicle?.metadata?.capacity && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Capacity:</span>
              <span style={styles.detailValue}>{vehicle.metadata.capacity}</span>
            </div>
          )}
        </div>
        
        <div className="card">
          <h2>Analytics</h2>
          {vehicleData ? (
            <>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Total Distance:</span>
                <span style={styles.detailValue}>
                  {vehicleData.mileageData?.[0]?.totalMileage || 'N/A'} km
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Utilization Rate:</span>
                <span style={styles.detailValue}>
                  {vehicleData.vehicleUtilization?.[0]?.utilizationRate || 'N/A'}%
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Fuel Consumption:</span>
                <span style={styles.detailValue}>
                  {vehicleData.fuelConsumption?.[0]?.totalConsumption || 'N/A'} L
                </span>
              </div>
            </>
          ) : (
            <p>No analytics data available</p>
          )}
          <button onClick={() => setActiveTab('analytics')} style={styles.viewAllLink}>View All Analytics</button>
        </div>
      </div>
      
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={styles.sectionHeader}>
          <h2>Upcoming Maintenance</h2>
          <Link 
            to={`/maintenance/schedules/new?vehicleId=${id}`} 
            style={{...styles.btn, ...styles.btnSmall, ...styles.btnPrimary}}
          >
            Schedule Maintenance
          </Link>
        </div>
        
        {schedules && schedules.length > 0 ? (
          <table style={styles.maintenanceTable}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Scheduled Date</th>
                <th style={styles.tableHeader}>Type</th>
                <th style={styles.tableHeader}>Description</th>
                <th style={styles.tableHeader}>Status</th>
                <th style={styles.tableHeader}>Priority</th>
                <th style={styles.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.slice(0, 3).map((schedule) => (
                <tr key={schedule.id}>
                  <td style={styles.tableCell}>
                    {new Date(schedule.scheduledDate).toLocaleDateString()}
                  </td>
                  <td style={styles.tableCell}>{schedule.maintenanceType}</td>
                  <td style={styles.tableCell}>{schedule.description}</td>
                  <td style={styles.tableCell}>
                    <span style={{
                      ...styles.vehicleStatus,
                      ...getScheduleStatusStyle(schedule.status)
                    }}>
                      {schedule.status}
                    </span>
                  </td>
                  <td style={styles.tableCell}>{schedule.priority}</td>
                  <td style={styles.tableCell}>
                    <Link 
                      to={`/maintenance/schedules/${schedule.id}`}
                      style={{...styles.btn, ...styles.btnSmall, ...styles.btnSecondary}}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No maintenance schedules found</p>
        )}
        <Link to={`/maintenance/schedules?vehicleId=${id}`} style={styles.viewAllLink}>View All Schedules</Link>
      </div>
      
      <div className="card">
        <div style={styles.sectionHeader}>
          <h2>Maintenance History</h2>
          <Link 
            to={`/maintenance/records/new?vehicleId=${id}`} 
            style={{...styles.btn, ...styles.btnSmall, ...styles.btnPrimary}}
          >
            Add Record
          </Link>
        </div>
        
        {records && records.length > 0 ? (
          <table style={styles.maintenanceTable}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Date</th>
                <th style={styles.tableHeader}>Type</th>
                <th style={styles.tableHeader}>Description</th>
                <th style={styles.tableHeader}>Cost</th>
                <th style={styles.tableHeader}>Technician</th>
                <th style={styles.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 3).map((record) => (
                <tr key={record.id}>
                  <td style={styles.tableCell}>
                    {new Date(record.serviceDate).toLocaleDateString()}
                  </td>
                  <td style={styles.tableCell}>{record.serviceType}</td>
                  <td style={styles.tableCell}>{record.description}</td>
                  <td style={styles.tableCell}>${record.cost?.toFixed(2) || '0.00'}</td>
                  <td style={styles.tableCell}>{record.technician || 'N/A'}</td>
                  <td style={styles.tableCell}>
                    <Link 
                      to={`/maintenance/records/${record.id}`}
                      style={{...styles.btn, ...styles.btnSmall, ...styles.btnSecondary}}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No maintenance records found</p>
        )}
        <Link to={`/maintenance/records?vehicleId=${id}`} style={styles.viewAllLink}>View All Records</Link>
      </div>
    </>
  );
  
  const renderAnalyticsTab = () => (
    <div className="vehicle-analytics">
      <div className="analytics-controls">
        <div className="control-group">
          <label>Metric:</label>
          <select value={metricType} onChange={handleMetricChange}>
            <option value="fuelEfficiency">Fuel Efficiency</option>
            <option value="utilization">Utilization</option>
            <option value="costPerHour">Cost Per Hour</option>
          </select>
        </div>
      </div>
      
      <div className="analytics-section">
        <div className="analytics-card key-metrics">
          <h3>Key Metrics</h3>
          {vehicleData?.data ? (
            <div className="metrics-grid">
              <div className="metric-item">
                <span className="metric-label">Total Distance</span>
                <span className="metric-value">
                  {(vehicleData.data.data.data.totalDistance || 0).toLocaleString(undefined, {maximumFractionDigits: 2})} km
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Fuel Consumption</span>
                <span className="metric-value">
                  {(vehicleData.data.data.data.totalFuelConsumption || 0).toLocaleString(undefined, {maximumFractionDigits: 2})} L
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Fuel Efficiency</span>
                <span className="metric-value">
                  {(vehicleData.data.data.data.fuelEfficiency || 0).toFixed(2)} km/L
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Utilization Rate</span>
                <span className="metric-value">
                  {((vehicleData.data.data.data.utilizationRate || 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Maintenance Cost</span>
                <span className="metric-value">
                  ${(vehicleData.data.data.data.maintenanceCost || 0).toLocaleString(undefined, {maximumFractionDigits: 2})}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Cost per Km</span>
                <span className="metric-value">
                  ${(vehicleData.data.data.data.costPerKm || 0).toFixed(2)}
                </span>
              </div>
            </div>
          ) : (
            <p>No vehicle data available</p>
          )}
        </div>
      </div>
      
      <div className="analytics-section">
        <div className="analytics-card">
          <h3>Trend Analysis: {metricType === 'fuelEfficiency' ? 'Fuel Efficiency' : 
                              metricType === 'maintenanceFrequency' ? 'Maintenance Frequency' :
                              metricType === 'utilization' ? 'Utilization Rate' :
                              metricType === 'costPerHour' ? 'Cost Per Hour' : 'Cost Per Km'}</h3>
          {metricTrends && metricTrends.length > 0 ? (
            <div className="trend-chart">
              <div className="placeholder-chart">
                <p>Trend chart would be displayed here</p>
              </div>
              <div className="trend-summary">
                <p>
                  <strong>Average:</strong> {metricTrends.length > 0 ? 
                    (metricTrends.reduce((sum, item) => sum + (item?.value || 0), 0) / metricTrends.length).toFixed(2) : '0.00'}
                  {metricType === 'fuelEfficiency' ? ' km/L' : 
                    metricType === 'maintenanceFrequency' ? ' days' :
                    metricType === 'utilization' ? '%' : '$'}
                </p>
                <p>
                  <strong>Trend:</strong> {metricTrends.length > 0 && metricTrends[metricTrends.length - 1]?.trend ? 
                    (metricTrends[metricTrends.length - 1].trend === 'up' ? '↑ Increasing' : 
                     metricTrends[metricTrends.length - 1].trend === 'down' ? '↓ Decreasing' : '→ Stable') 
                    : '→ Stable'}
                </p>
              </div>
            </div>
          ) : (
            <p>No trend data available</p>
          )}
        </div>
        
        <div className="analytics-card">
          <h3>Fleet Comparison</h3>
          {vehicleComparison ? (
            <div className="comparison-data">
              <div className="comparison-chart">
                <div className="placeholder-chart">
                  <p>Comparison chart would be displayed here</p>
                </div>
              </div>
              <div className="comparison-stats">
                <p>
                  <strong>Vehicle Value:</strong> {vehicleComparison.vehicleValue?.toFixed(2) || '0.00'}
                  {metricType === 'fuelEfficiency' ? ' km/L' : 
                    metricType === 'maintenanceFrequency' ? ' days' :
                    metricType === 'utilization' ? '%' : '$'}
                </p>
                <p>
                  <strong>Fleet Average:</strong> {vehicleComparison.fleetAverage?.toFixed(2) || '0.00'}
                  {metricType === 'fuelEfficiency' ? ' km/L' : 
                    metricType === 'maintenanceFrequency' ? ' days' :
                    metricType === 'utilization' ? '%' : '$'}
                </p>
                <p>
                  <strong>Difference:</strong> {vehicleComparison.percentDifference > 0 ? '+' : ''}
                  {vehicleComparison.percentDifference?.toFixed(2) || '0.00'}%
                </p>
                <p>
                  <strong>Rank:</strong> {vehicleComparison.rank || 0} of {vehicleComparison.totalVehicles || 0}
                </p>
              </div>
            </div>
          ) : (
            <p>No comparison data available</p>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .vehicle-analytics {
          padding: 10px 0;
        }
        
        .analytics-controls {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        
        .control-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .analytics-section {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .analytics-card {
          background-color: var(--card-background);
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          padding: 20px;
          height: 100%;
        }
        
        .key-metrics {
          grid-column: 1 / -1;
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }
        
        .metric-item {
          display: flex;
          flex-direction: column;
          padding: 15px;
          background-color: var(--background-secondary);
          border-radius: 4px;
        }
        
        .metric-label {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 5px;
        }
        
        .metric-value {
          font-size: 18px;
          font-weight: bold;
        }
        
        .trend-chart, .comparison-data {
          margin-top: 15px;
        }
        
        .placeholder-chart {
          height: 200px;
          background-color: var(--background-secondary);
          display: flex;
          justify-content: center;
          align-items: center;
          color: var(--text-secondary);
          border-radius: 4px;
          margin-bottom: 15px;
        }
        
        .trend-summary, .comparison-stats {
          background-color: var(--background-secondary);
          padding: 15px;
          border-radius: 4px;
        }
        
        .trend-summary p, .comparison-stats p {
          margin: 5px 0;
        }
      `}</style>
    </div>
  );
  
  if (loading && !vehicle) {
    return <div>Loading vehicle data...</div>;
  }
  
  if (vehicleError) {
    return <div style={styles.errorMessage}>{vehicleError}</div>;
  }
  
  if (!vehicle) {
    return <div>Vehicle not found</div>;
  }
  
  return (
    <div style={styles.vehicleDetailContainer}>
      {showDeleteConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this vehicle?</p>
            {deleteError && <p style={styles.errorMessage}>{deleteError}</p>}
            <div style={styles.modalActions}>
              <button 
                style={{...styles.btn, ...styles.btnSecondary}}
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                style={{...styles.btn, ...styles.btnDanger}}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div style={styles.vehicleDetailHeader}>
        <div>
          <h1>{vehicle.model}</h1>
          <div style={getStatusStyle(vehicle.status)}>{vehicle.status}</div>
        </div>
        <div style={styles.actionButtons}>
          <Link to={`/vehicles/${id}/edit`} style={{...styles.btn, ...styles.btnPrimary}}>Edit</Link>
          <button 
            style={{...styles.btn, ...styles.btnSecondary}} 
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete
          </button>
        </div>
      </div>
      
      <div style={styles.tabsContainer}>
        <div 
          style={{...styles.tab, ...(activeTab === 'overview' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </div>
        <div 
          style={{...styles.tab, ...(activeTab === 'analytics' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </div>
      </div>
      
      {activeTab === 'overview' ? renderOverviewTab() : renderAnalyticsTab()}
    </div>
  );
}

export default VehicleDetail; 