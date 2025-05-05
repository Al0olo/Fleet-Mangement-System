import { useEffect, useState, CSSProperties } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { AppDispatch, RootState } from '../redux/store';
import { fetchVehicles } from '../redux/slices/vehicleSlice';

const VehicleList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { vehicles, loading, error } = useSelector((state: RootState) => state.vehicles);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    // Force refetch vehicles when component mounts
    dispatch(fetchVehicles());
  }, [dispatch]);

  // Log vehicles to console for debugging
  useEffect(() => {
    console.log('Vehicles in component:', vehicles);
  }, [vehicles]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const handleTypeFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTypeFilter(e.target.value);
  };

  const filteredVehicles = Array.isArray(vehicles) 
    ? vehicles.filter((vehicle) => {
        // Check if all required fields exist to prevent undefined errors
        if (!vehicle || !vehicle.model) return false;
        
        const model = vehicle.model || '';
        const manufacturer = vehicle.metadata?.manufacturer || '';
        const vin = vehicle.metadata?.vin || '';
        
        const matchesSearch = searchTerm === '' || 
          model.toLowerCase().includes(searchTerm.toLowerCase()) ||
          manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vin.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
        const matchesType = typeFilter === 'all' || vehicle.type === typeFilter;
        
        return matchesSearch && matchesStatus && matchesType;
      })
    : [];

  // Define styles as React inline style objects
  const styles: Record<string, CSSProperties> = {
    vehicleListContainer: {
      padding: '20px',
      width: '100%',
      boxSizing: 'border-box' as const,
    },
    vehicleListHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      borderBottom: '1px solid var(--border-color)',
      paddingBottom: '12px',
    },
    btnPrimary: {
      backgroundColor: 'var(--primary-color)',
      color: 'white',
      padding: '10px 16px',
      borderRadius: '4px',
      textDecoration: 'none',
      fontWeight: 'bold',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      transition: 'all 0.2s ease',
    },
    vehicleListFilters: {
      display: 'flex',
      marginBottom: '24px',
      gap: '16px',
      flexWrap: 'wrap',
      backgroundColor: 'var(--background-secondary)',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    filterGroup: {
      flex: 1,
      minWidth: '200px',
    },
    filterLabel: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '500',
      color: 'var(--text-secondary)',
    },
    searchInput: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid var(--border-color)',
      borderRadius: '4px',
      fontSize: '1rem',
      transition: 'border-color 0.2s ease',
    },
    statusFilter: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid var(--border-color)',
      borderRadius: '4px',
      fontSize: '1rem',
      backgroundColor: 'white',
    },
    vehicleGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '24px',
    },
    vehicleCard: {
      position: 'relative',
      padding: '20px',
      textDecoration: 'none',
      color: 'var(--text-primary)',
      transition: 'all 0.3s ease',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    },
    vehicleCardHover: {
      transform: 'translateY(-5px)',
      boxShadow: '0 6px 12px rgba(0,0,0,0.1)',
    },
    vehicleHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '16px',
    },
    vehicleModel: {
      margin: '0 0 4px 0',
      fontSize: '1.3rem',
      fontWeight: 'bold',
      color: 'var(--text-primary)',
      maxWidth: '70%',
    },
    vehicleDetails: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px',
      margin: '16px 0',
    },
    vehicleDetail: {
      display: 'flex',
      flexDirection: 'column',
    },
    detailLabel: {
      fontSize: '0.8rem',
      color: 'var(--text-secondary)',
      marginBottom: '4px',
    },
    detailValue: {
      fontWeight: '500',
    },
    vehicleStatus: {
      position: 'absolute',
      top: '12px',
      right: '12px',
      padding: '6px 10px',
      borderRadius: '16px',
      fontSize: '0.75rem',
      fontWeight: 'bold',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    statusActive: {
      backgroundColor: '#4CAF50',
      color: 'white',
    },
    statusMaintenance: {
      backgroundColor: '#FF9800',
      color: 'white',
    },
    statusInactive: {
      backgroundColor: '#F44336',
      color: 'white',
    },
    statusRetired: {
      backgroundColor: '#9E9E9E',
      color: 'white',
    },
    noVehiclesMessage: {
      padding: '40px',
      textAlign: 'center' as const,
      backgroundColor: 'var(--background-secondary)',
      borderRadius: '8px',
      color: 'var(--text-secondary)',
      fontWeight: '500',
      gridColumn: '1 / -1',
    },
    loadingMessage: {
      padding: '40px',
      textAlign: 'center' as const,
      color: 'var(--text-secondary)',
    },
    errorMessage: {
      color: 'var(--error-color)',
      margin: '20px 0',
      padding: '16px',
      backgroundColor: 'rgba(244, 67, 54, 0.1)',
      borderRadius: '8px',
      fontWeight: '500',
    },
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return { ...styles.vehicleStatus, ...styles.statusActive };
      case 'maintenance':
        return { ...styles.vehicleStatus, ...styles.statusMaintenance };
      case 'inactive':
        return { ...styles.vehicleStatus, ...styles.statusInactive };
      case 'retired':
        return { ...styles.vehicleStatus, ...styles.statusRetired };
      default:
        return styles.vehicleStatus;
    }
  };

  const [hoveredVehicleId, setHoveredVehicleId] = useState<string | null>(null);

  return (
    <div style={styles.vehicleListContainer}>
      <div style={styles.vehicleListHeader}>
        <h1>Vehicles</h1>
        <Link to="/vehicles/new" style={styles.btnPrimary}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          Add Vehicle
        </Link>
      </div>

      <div style={styles.vehicleListFilters}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Search</label>
          <input
            type="text"
            placeholder="Search by model, manufacturer, or VIN"
            value={searchTerm}
            onChange={handleSearch}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Status</label>
          <select value={statusFilter} onChange={handleStatusFilter} style={styles.statusFilter}>
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
            <option value="retired">Retired</option>
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Type</label>
          <select value={typeFilter} onChange={handleTypeFilter} style={styles.statusFilter}>
            <option value="all">All Types</option>
            <option value="truck">Truck</option>
            <option value="excavator">Excavator</option>
            <option value="loader">Loader</option>
            <option value="bulldozer">Bulldozer</option>
            <option value="crane">Crane</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={styles.loadingMessage}>Loading vehicles...</div>
      ) : error ? (
        <div style={styles.errorMessage}>{error}</div>
      ) : (
        <div style={styles.vehicleGrid}>
          {!Array.isArray(vehicles) || vehicles.length === 0 ? (
            <div style={styles.noVehiclesMessage}>No vehicles found. Please add a vehicle.</div>
          ) : filteredVehicles.length === 0 ? (
            <div style={styles.noVehiclesMessage}>No vehicles found matching your filters.</div>
          ) : (
            filteredVehicles.map((vehicle) => (
              <Link 
                to={`/vehicles/${vehicle.id}`} 
                key={vehicle.id} 
                className="card" 
                style={{
                  ...styles.vehicleCard,
                  ...(hoveredVehicleId === vehicle.id ? styles.vehicleCardHover : {})
                }}
                onMouseEnter={() => setHoveredVehicleId(vehicle.id)}
                onMouseLeave={() => setHoveredVehicleId(null)}
              >
                <div style={getStatusStyle(vehicle.status)}>{vehicle.status}</div>
                <h3 style={styles.vehicleModel}>{vehicle.model}</h3>
                
                <div style={styles.vehicleDetails}>
                  <div style={styles.vehicleDetail}>
                    <span style={styles.detailLabel}>Type</span>
                    <span style={styles.detailValue}>{vehicle.type}</span>
                  </div>
                  
                  <div style={styles.vehicleDetail}>
                    <span style={styles.detailLabel}>Manufacturer</span>
                    <span style={styles.detailValue}>{vehicle.metadata?.manufacturer || 'N/A'}</span>
                  </div>
                  
                  <div style={styles.vehicleDetail}>
                    <span style={styles.detailLabel}>Year</span>
                    <span style={styles.detailValue}>{vehicle.metadata?.year || 'N/A'}</span>
                  </div>
                  
                  {vehicle.metadata?.vin && (
                    <div style={styles.vehicleDetail}>
                      <span style={styles.detailLabel}>VIN</span>
                      <span style={styles.detailValue}>{vehicle.metadata.vin}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default VehicleList; 