import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { AppDispatch, RootState } from '../redux/store';
import { fetchVehicles, Vehicle } from '../redux/slices/vehicleSlice';

const VehicleList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { vehicles, loading, error } = useSelector((state: RootState) => state.vehicles);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.vin.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="vehicle-list-container">
      <div className="vehicle-list-header">
        <h1>Vehicles</h1>
        <Link to="/vehicles/new" className="btn btn-primary">Add Vehicle</Link>
      </div>

      <div className="vehicle-list-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search by make, model, or VIN"
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <select value={statusFilter} onChange={handleStatusFilter} className="status-filter">
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div>Loading vehicles...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="vehicle-grid">
          {filteredVehicles.length === 0 ? (
            <div>No vehicles found matching your filters.</div>
          ) : (
            filteredVehicles.map((vehicle) => (
              <Link to={`/vehicles/${vehicle.id}`} key={vehicle.id} className="vehicle-card card">
                <div className={`vehicle-status ${vehicle.status}`}>{vehicle.status}</div>
                <h3>{vehicle.make} {vehicle.model}</h3>
                <p>Year: {vehicle.year}</p>
                <p>VIN: {vehicle.vin}</p>
              </Link>
            ))
          )}
        </div>
      )}

      <style jsx>{`
        .vehicle-list-container {
          padding: 20px;
        }
        
        .vehicle-list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .btn-primary {
          background-color: var(--primary-color);
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          text-decoration: none;
          font-weight: bold;
        }
        
        .vehicle-list-filters {
          display: flex;
          margin-bottom: 20px;
          gap: 10px;
        }
        
        .filter-group {
          flex: 1;
        }
        
        .search-input, .status-filter {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .vehicle-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        
        .vehicle-card {
          position: relative;
          padding: 20px;
          text-decoration: none;
          color: var(--text-primary);
          transition: transform 0.2s;
        }
        
        .vehicle-card:hover {
          transform: translateY(-5px);
        }
        
        .vehicle-status {
          position: absolute;
          top: 10px;
          right: 10px;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          text-transform: uppercase;
        }
        
        .vehicle-status.active {
          background-color: var(--success-color);
          color: white;
        }
        
        .vehicle-status.maintenance {
          background-color: var(--warning-color);
          color: white;
        }
        
        .vehicle-status.inactive {
          background-color: var(--error-color);
          color: white;
        }
        
        .error-message {
          color: var(--error-color);
          margin: 20px 0;
        }
      `}</style>
    </div>
  );
};

export default VehicleList; 