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
    },
    vehicleListHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
    },
    btnPrimary: {
      backgroundColor: 'var(--primary-color)',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '4px',
      textDecoration: 'none',
      fontWeight: 'bold',
    },
    vehicleListFilters: {
      display: 'flex',
      marginBottom: '20px',
      gap: '10px',
    },
    filterGroup: {
      flex: 1,
    },
    searchInput: {
      width: '100%',
      padding: '8px',
      border: '1px solid #ddd',
      borderRadius: '4px',
    },
    statusFilter: {
      width: '100%',
      padding: '8px',
      border: '1px solid #ddd',
      borderRadius: '4px',
    },
    vehicleGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '20px',
    },
    vehicleCard: {
      position: 'relative',
      padding: '20px',
      textDecoration: 'none',
      color: 'var(--text-primary)',
      transition: 'transform 0.2s',
    },
    vehicleCardHover: {
      transform: 'translateY(-5px)',
    },
    vehicleStatus: {
      position: 'absolute',
      top: '10px',
      right: '10px',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '0.8rem',
      textTransform: 'uppercase' as const,
    },
    statusActive: {
      backgroundColor: 'var(--success-color)',
      color: 'white',
    },
    statusMaintenance: {
      backgroundColor: 'var(--warning-color)',
      color: 'white',
    },
    statusInactive: {
      backgroundColor: 'var(--error-color)',
      color: 'white',
    },
    errorMessage: {
      color: 'var(--error-color)',
      margin: '20px 0',
    },
    debugInfo: {
      marginTop: '20px',
      padding: '10px',
      backgroundColor: '#f5f5f5',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontFamily: 'monospace',
      whiteSpace: 'pre-wrap',
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return { ...styles.vehicleStatus, ...styles.statusActive };
      case 'maintenance':
        return { ...styles.vehicleStatus, ...styles.statusMaintenance };
      case 'inactive':
      case 'retired':
        return { ...styles.vehicleStatus, ...styles.statusInactive };
      default:
        return styles.vehicleStatus;
    }
  };

  return (
    <div style={styles.vehicleListContainer}>
      <div style={styles.vehicleListHeader}>
        <h1>Vehicles</h1>
        <Link to="/vehicles/new" style={styles.btnPrimary}>Add Vehicle</Link>
      </div>

      <div style={styles.vehicleListFilters}>
        <div style={styles.filterGroup}>
          <input
            type="text"
            placeholder="Search by model, manufacturer, or VIN"
            value={searchTerm}
            onChange={handleSearch}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.filterGroup}>
          <select value={statusFilter} onChange={handleStatusFilter} style={styles.statusFilter}>
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
            <option value="retired">Retired</option>
          </select>
        </div>
        <div style={styles.filterGroup}>
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
        <div>Loading vehicles...</div>
      ) : error ? (
        <div style={styles.errorMessage}>{error}</div>
      ) : (
        <div style={styles.vehicleGrid}>
          {!Array.isArray(vehicles) || vehicles.length === 0 ? (
            <div>No vehicles found. Please add a vehicle.</div>
          ) : filteredVehicles.length === 0 ? (
            <div>No vehicles found matching your filters.</div>
          ) : (
            filteredVehicles.map((vehicle) => (
              <Link to={`/vehicles/${vehicle.id}`} key={vehicle.id} className="card" style={styles.vehicleCard}>
                <div style={getStatusStyle(vehicle.status)}>{vehicle.status}</div>
                <h3>{vehicle.model}</h3>
                <p><strong>Type:</strong> {vehicle.type}</p>
                <p><strong>Manufacturer:</strong> {vehicle.metadata?.manufacturer || 'N/A'}</p>
                <p><strong>Year:</strong> {vehicle.metadata?.year || 'N/A'}</p>
                {vehicle.metadata?.vin && <p><strong>VIN:</strong> {vehicle.metadata.vin}</p>}
              </Link>
            ))
          )}
        </div>
      )}

      
    </div>
  );
};

export default VehicleList; 