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
import {
  BarChart, Bar,
  LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Helper function to format date
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Helper function to format currency
const formatCurrency = (value: number | undefined) => {
  if (value === undefined || value === null) return '$0.00';
  return `$${value.toFixed(2)}`;
};

// Helper function to generate random data for demo charts when real data is not available
const generateRandomData = (length: number = 30) => {
  const data = [];
  const today = new Date();
  
  for (let i = 0; i < length; i++) {
    const date = new Date();
    date.setDate(today.getDate() - (length - i - 1));
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.floor(Math.random() * 100) / 10 + 5,
      average: 8.5,
    });
  }
  
  return data;
};

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
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  
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
    container: {
      padding: '20px',
      width: '100%',
      boxSizing: 'border-box' as const,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      borderBottom: '1px solid var(--border-color)',
      paddingBottom: '12px',
    },
    title: {
      margin: '0 0 8px 0',
      color: 'var(--text-primary)',
      fontSize: '24px',
      fontWeight: 'bold',
    },
    subtitle: {
      margin: '0 0 16px 0',
      color: 'var(--text-secondary)',
      fontSize: '16px',
    },
    tabsContainer: {
      display: 'flex',
      borderBottom: '1px solid var(--border-color)',
      marginBottom: '24px',
    },
    tab: {
      padding: '12px 24px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '500',
      color: 'var(--text-secondary)',
      borderBottom: '2px solid transparent',
      transition: 'all 0.2s ease',
    },
    tabActive: {
      borderBottom: '2px solid var(--primary-color)',
      color: 'var(--primary-color)',
      fontWeight: 'bold',
    },
    tabHover: {
      backgroundColor: 'var(--background-hover)',
    },
    vehicleStatus: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '6px 12px',
      borderRadius: '16px',
      fontSize: '13px',
      fontWeight: 'bold',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      marginRight: '12px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    vehicleStatusActive: {
      backgroundColor: '#4caf50',
      color: 'white',
    },
    vehicleStatusMaintenance: {
      backgroundColor: '#ff9800',
      color: 'white',
    },
    vehicleStatusInactive: {
      backgroundColor: '#f44336',
      color: 'white',
    },
    actionButtons: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
    },
    btn: {
      padding: '10px 16px',
      borderRadius: '4px',
      fontWeight: 'bold',
      cursor: 'pointer',
      textDecoration: 'none',
      border: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
      fontSize: '14px',
    },
    btnSmall: {
      padding: '6px 12px',
      fontSize: '13px',
    },
    btnPrimary: {
      backgroundColor: 'var(--primary-color)',
      color: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    btnSecondary: {
      backgroundColor: 'var(--secondary-color)',
      color: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    btnOutline: {
      backgroundColor: 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-color)',
    },
    btnDanger: {
      backgroundColor: 'var(--error-color)',
      color: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: '24px',
      marginBottom: '2rem',
    },
    fullWidth: {
      gridColumn: '1 / -1',
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      padding: '24px',
      height: '100%',
      border: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column' as const,
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginTop: 0,
      marginBottom: '16px',
      borderBottom: '1px solid var(--border-color)',
      paddingBottom: '8px',
      color: 'var(--text-primary)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    detailRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: '1px solid var(--border-color)',
    },
    detailLabel: {
      fontWeight: '500',
      color: 'var(--text-secondary)',
    },
    detailValue: {
      fontWeight: '500',
      color: 'var(--text-primary)',
    },
    emptyState: {
      textAlign: 'center' as const,
      padding: '32px',
      color: 'var(--text-secondary)',
      borderRadius: '8px',
      backgroundColor: 'rgba(0,0,0,0.02)',
      border: '1px dashed var(--border-color)',
    },
    emptyStateIcon: {
      width: '48px',
      height: '48px',
      marginBottom: '16px',
      opacity: 0.5,
    },
    sectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
      borderBottom: '1px solid var(--border-color)',
      paddingBottom: '8px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      overflow: 'hidden',
    },
    th: {
      padding: '14px 16px',
      textAlign: 'left' as const,
      backgroundColor: 'var(--background-secondary)',
      borderBottom: '1px solid var(--border-color)',
      fontSize: '14px',
      fontWeight: '600',
      color: 'var(--text-secondary)',
    },
    td: {
      padding: '12px 16px',
      borderBottom: '1px solid var(--border-color)',
      fontSize: '14px',
      verticalAlign: 'middle' as const,
    },
    badge: {
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '12px',
      display: 'inline-block',
      fontWeight: 'bold',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    viewAllLink: {
      display: 'block',
      marginTop: '16px',
      textAlign: 'right' as const,
      color: 'var(--primary-color)',
      textDecoration: 'none',
      fontWeight: '500',
      fontSize: '14px',
    },
    loadingState: {
      textAlign: 'center' as const,
      padding: '40px',
      color: 'var(--text-secondary)',
      fontSize: '16px',
    },
    errorMessage: {
      color: 'var(--error-color)',
      margin: '20px 0',
      padding: '16px',
      borderRadius: '8px',
      backgroundColor: 'rgba(244, 67, 54, 0.1)',
      fontWeight: '500',
      textAlign: 'center' as const,
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
      padding: '24px',
      width: '450px',
      maxWidth: '90%',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
    },
    modalTitle: {
      margin: '0 0 16px 0',
      color: 'var(--text-primary)',
      borderBottom: '1px solid var(--border-color)',
      paddingBottom: '12px',
    },
    modalText: {
      marginBottom: '24px',
      color: 'var(--text-secondary)',
      fontSize: '16px',
    },
    modalActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      marginTop: '24px',
    },
    formGroup: {
      marginBottom: '20px',
    },
    formLabel: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '500',
      color: 'var(--text-secondary)',
    },
    formSelect: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid var(--border-color)',
      borderRadius: '4px',
      fontSize: '14px',
      backgroundColor: 'white',
    },
    chartContainer: {
      height: '300px',
      width: '100%',
      marginTop: '16px',
    },
    metricCard: {
      backgroundColor: 'var(--background-secondary)',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '8px',
    },
    metricLabel: {
      fontSize: '14px',
      color: 'var(--text-secondary)',
      marginBottom: '4px',
    },
    metricValue: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: 'var(--text-primary)',
    },
    flexRow: {
      display: 'flex',
      gap: '16px',
      marginBottom: '16px',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '16px',
      marginTop: '16px',
    },
    comparisonContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginTop: '16px',
    },
    comparisonItem: {
      flex: 1,
      textAlign: 'center' as const,
      padding: '16px',
      backgroundColor: 'var(--background-secondary)',
      borderRadius: '8px',
    },
    comparisonLabel: {
      fontSize: '14px',
      color: 'var(--text-secondary)',
      marginBottom: '8px',
    },
    comparisonValue: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: 'var(--text-primary)',
    },
    diffPositive: {
      color: '#4caf50',
    },
    diffNegative: {
      color: '#f44336',
    },
    diffNeutral: {
      color: 'var(--text-secondary)',
    },
    iconButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--text-secondary)',
      transition: 'color 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px',
      borderRadius: '4px',
    },
    mapContainer: {
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid var(--border-color)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      height: '400px',
    },
    mapError: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      backgroundColor: 'var(--background-secondary)',
      padding: '24px',
      borderRadius: '8px',
      color: 'var(--text-secondary)',
    },
    noDataIcon: {
      marginBottom: '16px',
      opacity: 0.5,
      width: '48px',
      height: '48px',
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
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
  const getMaintenanceStatusBadge = (status: string) => {
    let style = { ...styles.badge };
    let color = '';
    
    switch (status?.toLowerCase()) {
      case 'scheduled':
        color = '#2196f3';
        break;
      case 'in-progress':
        color = '#ff9800';
        break;
      case 'completed':
        color = '#4caf50';
        break;
      case 'cancelled':
        color = '#f44336';
        break;
      case 'overdue':
        color = '#d32f2f';
        break;
      default:
        color = '#757575';
    }
    
    return {
      ...style,
      backgroundColor: color + '20',
      color: color,
    };
  };
  
  // Format metric value based on type
  const formatMetricValue = (value: number | undefined, type: string) => {
    if (value === undefined || value === null) return 'N/A';
    
    switch (type) {
      case 'fuelEfficiency':
        return `${value.toFixed(2)} km/L`;
      case 'utilization':
        return `${(value * 100).toFixed(1)}%`;
      case 'costPerHour':
      case 'costPerKm':
        return formatCurrency(value);
      default:
        return value.toFixed(2);
    }
  };
  
  // Function to render the vehicle information section
  const renderVehicleInformation = () => (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2"/>
          <path d="M16 2v4"/>
          <path d="M8 2v4"/>
          <path d="M3 10h18"/>
        </svg>
        Vehicle Information
      </h3>
      
      {vehicle ? (
        <>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Model</span>
            <span style={styles.detailValue}>{vehicle.model || 'N/A'}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Type</span>
            <span style={styles.detailValue}>{vehicle.type || 'N/A'}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Status</span>
            <span style={{...styles.detailValue, display: 'inline-flex', alignItems: 'center'}}>
              <span style={getStatusStyle(vehicle.status || '')}>
                {vehicle.status || 'Unknown'}
              </span>
            </span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Registration Date</span>
            <span style={styles.detailValue}>
              {formatDate(vehicle.registrationDate || '')}
            </span>
          </div>
          {vehicle.metadata?.manufacturer && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Manufacturer</span>
              <span style={styles.detailValue}>{vehicle.metadata.manufacturer}</span>
            </div>
          )}
          {vehicle.metadata?.year && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Year</span>
              <span style={styles.detailValue}>{vehicle.metadata.year}</span>
            </div>
          )}
          {vehicle.metadata?.vin && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>VIN</span>
              <span style={styles.detailValue}>{vehicle.metadata.vin}</span>
            </div>
          )}
          {vehicle.metadata?.fuelType && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Fuel Type</span>
              <span style={styles.detailValue}>{vehicle.metadata.fuelType}</span>
            </div>
          )}
          {vehicle.metadata?.capacity && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Capacity</span>
              <span style={styles.detailValue}>{vehicle.metadata.capacity}</span>
            </div>
          )}
        </>
      ) : (
        <div style={styles.emptyState}>
          <svg style={styles.noDataIcon} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p>No vehicle information available</p>
        </div>
      )}
    </div>
  );
  
  // Function to render the location map section
  const renderLocationSection = () => (
    <div style={{...styles.card, ...styles.fullWidth}}>
      <h3 style={styles.cardTitle}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s-8-4.5-8-11.8a8 8 0 0 1 16 0c0 7.3-8 11.8-8 11.8z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        Vehicle Location
      </h3>
      
      <div style={styles.mapContainer}>
        {trackingLoading.location ? (
          <div style={{...styles.emptyState, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
            <svg className="spinner" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom: '16px'}}>
              <line x1="12" y1="2" x2="12" y2="6"></line>
              <line x1="12" y1="18" x2="12" y2="22"></line>
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
              <line x1="2" y1="12" x2="6" y2="12"></line>
              <line x1="18" y1="12" x2="22" y2="12"></line>
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
            </svg>
            <p>Loading location data...</p>
          </div>
        ) : trackingError.location ? (
          <div style={styles.mapError}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom: '8px', color: 'var(--error-color)'}}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>Could not load location data: {trackingError.location}</p>
          </div>
        ) : !vehicleLocation ? (
          <div style={styles.mapError}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom: '16px', opacity: 0.5}}>
              <path d="M12 22s-8-4.5-8-11.8a8 8 0 0 1 16 0c0 7.3-8 11.8-8 11.8z"/>
              <line x1="5" y1="5" x2="19" y2="19"></line>
            </svg>
            <p>No location data available for this vehicle</p>
          </div>
        ) : (
          <VehicleLocationMap 
            location={vehicleLocation}
            loading={trackingLoading.location}
            error={trackingError.location}
            height="350px"
          />
        )}
      </div>
      
      {vehicleLocation && (vehicleLocation.latitude || vehicleLocation.longitude) && (
        <div style={{marginTop: '16px'}}>
              <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Coordinates</span>
                <span style={styles.detailValue}>
              {vehicleLocation.latitude}, {vehicleLocation.longitude}
                </span>
              </div>
          {vehicleLocation.speed !== undefined && (
              <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Speed</span>
              <span style={styles.detailValue}>{vehicleLocation.speed} km/h</span>
              </div>
          )}
          {vehicleLocation.timestamp && (
              <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Last Updated</span>
              <span style={styles.detailValue}>{formatDate(vehicleLocation.timestamp)} {new Date(vehicleLocation.timestamp).toLocaleTimeString()}</span>
              </div>
          )}
        </div>
      )}
      </div>
  );
  
  // Function to render the status and events timeline section
  const renderStatusAndEvents = () => (
    <>
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
          Vehicle Status
        </h3>
        
        <VehicleStatusCard 
          status={vehicleStatus}
          loading={trackingLoading.status}
          error={trackingError.status}
        />
      </div>
      
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s-8-4.5-8-11.8a8 8 0 0 1 16 0c0 7.3-8 11.8-8 11.8z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          Recent Events
        </h3>
        
        <VehicleEventsTimeline 
          events={vehicleEvents}
          loading={trackingLoading.events}
          error={trackingError.events}
          limit={5}
        />
      </div>
    </>
  );
  
  // Function to render the upcoming maintenance section
  const renderUpcomingMaintenance = () => (
    <div style={{...styles.card, ...styles.fullWidth}}>
        <div style={styles.sectionHeader}>
        <h3 style={styles.cardTitle}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          Upcoming Maintenance
        </h3>
          <Link 
            to={`/maintenance/schedules/new?vehicleId=${id}`} 
            style={{...styles.btn, ...styles.btnSmall, ...styles.btnPrimary}}
          >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
            Schedule Maintenance
          </Link>
        </div>
        
      {schedulesLoading ? (
        <div style={styles.loadingState}>
          <svg className="spinner" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom: '8px'}}>
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
            <line x1="2" y1="12" x2="6" y2="12"></line>
            <line x1="18" y1="12" x2="22" y2="12"></line>
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
          </svg>
          <p>Loading maintenance schedules...</p>
        </div>
      ) : schedules && schedules.length > 0 ? (
        <>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Scheduled Date</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Priority</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.slice(0, 3).map((schedule) => (
                <tr key={schedule.id}>
                  <td style={styles.td}>
                    {formatDate(schedule.scheduledDate)}
                  </td>
                  <td style={styles.td}>{schedule.type || schedule.maintenanceType}</td>
                  <td style={styles.td}>{schedule.description || 'No description'}</td>
                  <td style={styles.td}>
                    <span style={getMaintenanceStatusBadge(schedule.status)}>
                      {schedule.status?.charAt(0).toUpperCase() + schedule.status?.slice(1) || 'Unknown'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={getMaintenanceStatusBadge(schedule.priority)}>
                      {schedule.priority?.charAt(0).toUpperCase() + schedule.priority?.slice(1) || 'Normal'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <Link 
                      to={`/maintenance/schedules/${schedule.id}`}
                      style={{...styles.btn, ...styles.btnSmall, ...styles.btnSecondary}}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link to={`/maintenance/schedules?vehicleId=${id}`} style={styles.viewAllLink}>
            View All Schedules →
          </Link>
        </>
      ) : (
        <div style={styles.emptyState}>
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom: '16px', opacity: 0.5}}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <p>No upcoming maintenance scheduled for this vehicle</p>
          <Link 
            to={`/maintenance/schedules/new?vehicleId=${id}`} 
            style={{...styles.btn, ...styles.btnPrimary, marginTop: '16px'}}
          >
            Schedule Maintenance
          </Link>
        </div>
      )}
      </div>
  );
      
  // Function to render the maintenance history section
  const renderMaintenanceHistory = () => (
    <div style={{...styles.card, ...styles.fullWidth}}>
        <div style={styles.sectionHeader}>
        <h3 style={styles.cardTitle}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          Maintenance History
        </h3>
          <Link 
            to={`/maintenance/records/new?vehicleId=${id}`} 
            style={{...styles.btn, ...styles.btnSmall, ...styles.btnPrimary}}
          >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
            Add Record
          </Link>
        </div>
        
      {recordsLoading ? (
        <div style={styles.loadingState}>
          <svg className="spinner" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom: '8px'}}>
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
            <line x1="2" y1="12" x2="6" y2="12"></line>
            <line x1="18" y1="12" x2="22" y2="12"></line>
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
          </svg>
          <p>Loading maintenance records...</p>
        </div>
      ) : records && records.length > 0 ? (
        <>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Cost</th>
                <th style={styles.th}>Technician</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 3).map((record) => (
                <tr key={record.id}>
                  <td style={styles.td}>
                    {formatDate(record.performedAt || record.serviceDate || '')}
                  </td>
                  <td style={styles.td}>{record.type || 'N/A'}</td>
                  <td style={styles.td}>{record.description || 'No description'}</td>
                  <td style={styles.td}>{formatCurrency(record.cost)}</td>
                  <td style={styles.td}>{record.performedBy || record.technician || 'N/A'}</td>
                  <td style={styles.td}>
                    <Link 
                      to={`/maintenance/records/${record.id}`}
                      style={{...styles.btn, ...styles.btnSmall, ...styles.btnSecondary}}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link to={`/maintenance/records?vehicleId=${id}`} style={styles.viewAllLink}>
            View All Records →
          </Link>
        </>
      ) : (
        <div style={styles.emptyState}>
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom: '16px', opacity: 0.5}}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <p>No maintenance records found for this vehicle</p>
          <Link 
            to={`/maintenance/records/new?vehicleId=${id}`} 
            style={{...styles.btn, ...styles.btnPrimary, marginTop: '16px'}}
          >
            Add Maintenance Record
          </Link>
        </div>
      )}
      </div>
  );
  
  // Function to render the analytics tab with actual charts
  const renderAnalyticsTab = () => {
    // Check if there's at least some data available
    const hasVehicleData = vehicleData && vehicleData.data && vehicleData.data.data && vehicleData.data.data.data;
    
    // For trend data, use actual data if available, otherwise generate demo data
    const trendData = metricTrends && metricTrends.length > 0 
      ? metricTrends.map(item => ({
          date: item.date,
          value: item.value,
          average: item.average || null
        }))
      : generateRandomData(30);
    
    // Get color for performance indicators
    const getPerformanceColor = (diff: number) => {
      if (diff > 5) return styles.diffPositive;
      if (diff < -5) return styles.diffNegative;
      return styles.diffNeutral;
    };
    
    const getMetricLabel = () => {
      switch (metricType) {
        case 'fuelEfficiency': return 'Fuel Efficiency';
        case 'utilization': return 'Utilization Rate';
        case 'costPerHour': return 'Cost Per Hour';
        case 'costPerKm': return 'Cost Per Km';
        default: return 'Metric';
      }
    };
    
    
    return (
      <div>
        <div style={styles.formGroup}>
          <div style={styles.flexRow}>
            <div style={{ flex: 1 }}>
              <label style={styles.formLabel}>Metric</label>
              <select 
                style={styles.formSelect} 
                value={metricType} 
                onChange={handleMetricChange}
              >
            <option value="fuelEfficiency">Fuel Efficiency</option>
                <option value="utilization">Utilization Rate</option>
            <option value="costPerHour">Cost Per Hour</option>
                <option value="costPerKm">Cost Per Km</option>
          </select>
        </div>
            <div style={{ flex: 1 }}>
              <label style={styles.formLabel}>Time Period</label>
              <select 
                style={styles.formSelect} 
                value={timeRange} 
                onChange={handleTimeRangeChange}
              >
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="180">Last 6 Months</option>
                <option value="365">Last Year</option>
              </select>
      </div>
              </div>
              </div>
        
        {analyticsLoading ? (
          <div style={styles.loadingState}>
            <svg className="spinner" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom: '8px'}}>
              <line x1="12" y1="2" x2="12" y2="6"></line>
              <line x1="12" y1="18" x2="12" y2="22"></line>
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
              <line x1="2" y1="12" x2="6" y2="12"></line>
              <line x1="18" y1="12" x2="22" y2="12"></line>
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
            </svg>
            <p>Loading analytics data...</p>
              </div>
        ) : (
          <>
            <div style={{...styles.card, ...styles.fullWidth, marginBottom: '24px'}}>
              <h3 style={styles.cardTitle}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
                Key Metrics
              </h3>
              
              {hasVehicleData ? (
                <div style={styles.statsGrid}>
                  <div style={styles.metricCard}>
                    <div style={styles.metricLabel}>Total Distance</div>
                    <div style={styles.metricValue}>
                      {vehicleData.data.data.data.totalDistance?.toLocaleString(undefined, {maximumFractionDigits: 2}) || 'N/A'} km
              </div>
              </div>
                  <div style={styles.metricCard}>
                    <div style={styles.metricLabel}>Fuel Consumption</div>
                    <div style={styles.metricValue}>
                      {vehicleData.data.data.data.totalFuelConsumption?.toLocaleString(undefined, {maximumFractionDigits: 2}) || 'N/A'} L
              </div>
            </div>
                  <div style={styles.metricCard}>
                    <div style={styles.metricLabel}>Fuel Efficiency</div>
                    <div style={styles.metricValue}>
                      {vehicleData.data.data.data.fuelEfficiency?.toFixed(2) || 'N/A'} km/L
        </div>
      </div>
                  <div style={styles.metricCard}>
                    <div style={styles.metricLabel}>Utilization Rate</div>
                    <div style={styles.metricValue}>
                      {vehicleData.data.data.data.utilizationRate ? (vehicleData.data.data.data.utilizationRate * 100).toFixed(1) : 'N/A'}%
              </div>
              </div>
                  <div style={styles.metricCard}>
                    <div style={styles.metricLabel}>Maintenance Cost</div>
                    <div style={styles.metricValue}>
                      {formatCurrency(vehicleData.data.data.data.maintenanceCost)}
            </div>
        </div>
                  <div style={styles.metricCard}>
                    <div style={styles.metricLabel}>Cost per Km</div>
                    <div style={styles.metricValue}>
                      {formatCurrency(vehicleData.data.data.data.costPerKm)}
                </div>
              </div>
            </div>
          ) : (
                <div style={styles.emptyState}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom: '16px', opacity: 0.5}}>
                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                    <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                  </svg>
                  <p>No analytics data available for this vehicle</p>
        </div>
              )}
      </div>
      
            <div style={styles.grid}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                  </svg>
                  {getMetricLabel()} Trend
                </h3>
                
                <div style={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickMargin={10}
                      />
                      <YAxis 
                        domain={['auto', 'auto']} 
                        tick={{ fontSize: 12 }}
                        tickMargin={10}
                        tickFormatter={(value) => {
                          if (metricType === 'utilization') {
                            return `${value}%`;
                          }
                          if (metricType === 'costPerHour' || metricType === 'costPerKm') {
                            return `$${value}`;
                          }
                          return value;
                        }}
                      />
                      <Tooltip 
                        formatter={(value) => [formatMetricValue(value as number, metricType), getMetricLabel()]} 
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        name={getMetricLabel()} 
                        stroke="#2196F3" 
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                      />
                      {metricType !== 'utilization' && (
                        <Line 
                          type="monotone" 
                          dataKey="average" 
                          name="Fleet Average" 
                          stroke="#757575" 
                          strokeDasharray="5 5"
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                {trendData.length > 0 && (
                  <div style={{marginTop: '16px'}}>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Average</span>
                      <span style={styles.detailValue}>
                        {formatMetricValue(
                          trendData.reduce((sum, item) => sum + (item.value || 0), 0) / trendData.length,
                          metricType
                        )}
                      </span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Highest</span>
                      <span style={styles.detailValue}>
                        {formatMetricValue(
                          Math.max(...trendData.map(item => item.value || 0)),
                          metricType
                        )}
                      </span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Lowest</span>
                      <span style={styles.detailValue}>
                        {formatMetricValue(
                          Math.min(...trendData.filter(item => item.value !== undefined && item.value !== null)
                            .map(item => item.value || 0)),
                          metricType
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                    <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                  </svg>
                  Fleet Comparison
                </h3>
                
                {vehicleComparison ? (
                  <>
                    <div style={styles.chartContainer}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: 'Vehicle', value: vehicleComparison.vehicleValue || 0 },
                            { name: 'Fleet Average', value: vehicleComparison.fleetAverage || 0 }
                          ]}
                          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" />
                          <YAxis 
                            domain={['auto', 'auto']} 
                            tickFormatter={(value) => {
                              if (metricType === 'utilization') {
                                return `${value}%`;
        }
                              if (metricType === 'costPerHour' || metricType === 'costPerKm') {
                                return `$${value}`;
                              }
                              return value;
                            }}
                          />
                          <Tooltip 
                            formatter={(value) => [formatMetricValue(value as number, metricType), '']} 
                          />
                          <Legend />
                          <Bar 
                            dataKey="value" 
                            fill="#8884d8" 
                            name={getMetricLabel()}
                          >
                            <Cell fill="#2196F3" />
                            <Cell fill="#757575" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div style={styles.comparisonContainer}>
                      <div style={styles.comparisonItem}>
                        <div style={styles.comparisonLabel}>Vehicle Value</div>
                        <div style={styles.comparisonValue}>
                          {formatMetricValue(vehicleComparison.vehicleValue, metricType)}
                        </div>
                      </div>
                      <div style={styles.comparisonItem}>
                        <div style={styles.comparisonLabel}>Fleet Average</div>
                        <div style={styles.comparisonValue}>
                          {formatMetricValue(vehicleComparison.fleetAverage, metricType)}
                        </div>
                      </div>
                      <div style={styles.comparisonItem}>
                        <div style={styles.comparisonLabel}>Difference</div>
                        <div style={{
                          ...styles.comparisonValue,
                          ...getPerformanceColor(vehicleComparison.percentDifference || 0)
                        }}>
                          {vehicleComparison.percentDifference > 0 ? '+' : ''}
                          {vehicleComparison.percentDifference?.toFixed(1) || '0.0'}%
                        </div>
                      </div>
                    </div>
                    
                    <div style={{marginTop: '16px'}}>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Rank</span>
                        <span style={styles.detailValue}>
                          {vehicleComparison.rank || 'N/A'} of {vehicleComparison.totalVehicles || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={styles.emptyState}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom: '16px', opacity: 0.5}}>
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="8.5" cy="7" r="4"></circle>
                      <line x1="20" y1="8" x2="20" y2="14"></line>
                      <line x1="23" y1="11" x2="17" y2="11"></line>
                    </svg>
                    <p>No comparison data available</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };
  
  // Function to render the Overview tab
  const renderOverviewTab = () => (
    <div>
      
      <div style={styles.grid}>
        {renderLocationSection()}
      </div>
      <div style={styles.grid}>
        {renderVehicleInformation()}
        {renderStatusAndEvents()}
      </div>
      
      <div style={styles.grid}>
        {renderUpcomingMaintenance()}
        {renderMaintenanceHistory()}
      </div>
    </div>
  );
  
  if (loading && !vehicle) {
    return (
      <div style={styles.loadingState}>
        <svg className="spinner" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom: '8px'}}>
          <line x1="12" y1="2" x2="12" y2="6"></line>
          <line x1="12" y1="18" x2="12" y2="22"></line>
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
          <line x1="2" y1="12" x2="6" y2="12"></line>
          <line x1="18" y1="12" x2="22" y2="12"></line>
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
        </svg>
        <p>Loading vehicle data...</p>
      </div>
    );
  }
  
  if (vehicleError) {
    return (
      <div style={styles.errorMessage}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom: '8px', color: 'var(--error-color)'}}>
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p>{vehicleError}</p>
      </div>
    );
  }
  
  if (!vehicle) {
    return (
      <div style={styles.emptyState}>
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom: '16px', opacity: 0.5}}>
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p>Vehicle not found</p>
        <Link to="/vehicles" style={{...styles.btn, ...styles.btnPrimary, marginTop: '16px'}}>
          Return to Vehicles List
        </Link>
      </div>
    );
  }
  
  return (
    <div style={styles.container}>
      {showDeleteConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Confirm Delete</h3>
            <p style={styles.modalText}>Are you sure you want to delete this vehicle? This action cannot be undone.</p>
            {deleteError && <div style={styles.errorMessage}>{deleteError}</div>}
            <div style={styles.modalActions}>
              <button 
                style={{...styles.btn, ...styles.btnOutline}}
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
                {isDeleting ? 'Deleting...' : 'Delete Vehicle'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{vehicle.model || 'Unknown Vehicle'}</h1>
          <div style={{display: 'flex', alignItems: 'center'}}>
            <div style={getStatusStyle(vehicle.status || '')}>
              {vehicle.status?.toUpperCase() || 'UNKNOWN'}
            </div>
            {vehicle.type && (
              <span style={styles.subtitle}>{vehicle.type}</span>
            )}
          </div>
        </div>
        <div style={styles.actionButtons}>
          <Link to={`/vehicles/${id}/edit`} style={{...styles.btn, ...styles.btnPrimary}}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Edit
          </Link>
          <button 
            style={{...styles.btn, ...styles.btnDanger}} 
            onClick={() => setShowDeleteConfirm(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            Delete
          </button>
        </div>
      </div>
      
      <div style={styles.tabsContainer}>
        <div 
          style={{
            ...styles.tab, 
            ...(activeTab === 'overview' ? styles.tabActive : {}),
            ...(activeTab !== 'overview' && hoveredTab === 'overview' ? styles.tabHover : {})
          }}
          onClick={() => setActiveTab('overview')}
          onMouseEnter={() => setHoveredTab('overview')}
          onMouseLeave={() => setHoveredTab(null)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px', verticalAlign: 'middle'}}>
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          Overview
        </div>
        <div 
          style={{
            ...styles.tab, 
            ...(activeTab === 'analytics' ? styles.tabActive : {}),
            ...(activeTab !== 'analytics' && hoveredTab === 'analytics' ? styles.tabHover : {})
          }}
          onClick={() => setActiveTab('analytics')}
          onMouseEnter={() => setHoveredTab('analytics')}
          onMouseLeave={() => setHoveredTab(null)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px', verticalAlign: 'middle'}}>
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          Analytics
        </div>
      </div>
      
      {activeTab === 'overview' ? renderOverviewTab() : renderAnalyticsTab()}
    </div>
  );
}

export default VehicleDetail; 