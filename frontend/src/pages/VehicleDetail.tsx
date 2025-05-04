import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { AppDispatch, RootState } from '../redux/store';
import { fetchVehicleById } from '../redux/slices/vehicleSlice';
import { fetchVehicleMaintenanceRecords } from '../redux/slices/maintenanceSlice';
import { fetchVehicleAnalytics } from '../redux/slices/analyticsSlice';

const VehicleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  
  const { vehicle, loading: vehicleLoading, error: vehicleError } = useSelector((state: RootState) => state.vehicles);
  const { records, loading: maintenanceLoading } = useSelector((state: RootState) => state.maintenance);
  const { vehicleData, loading: analyticsLoading } = useSelector((state: RootState) => state.analytics);
  
  useEffect(() => {
    if (id) {
      dispatch(fetchVehicleById(id));
      dispatch(fetchVehicleMaintenanceRecords(id));
      dispatch(fetchVehicleAnalytics(id));
    }
  }, [dispatch, id]);
  
  const loading = vehicleLoading || maintenanceLoading || analyticsLoading;
  
  if (loading) {
    return <div>Loading vehicle data...</div>;
  }
  
  if (vehicleError) {
    return <div className="error-message">{vehicleError}</div>;
  }
  
  if (!vehicle) {
    return <div>Vehicle not found</div>;
  }
  
  return (
    <div className="vehicle-detail-container">
      <div className="vehicle-detail-header">
        <div>
          <h1>{vehicle.make} {vehicle.model} ({vehicle.year})</h1>
          <div className={`vehicle-status ${vehicle.status}`}>{vehicle.status}</div>
        </div>
        <div className="action-buttons">
          <Link to={`/vehicles/${id}/edit`} className="btn btn-primary">Edit</Link>
          <button className="btn btn-secondary">Delete</button>
        </div>
      </div>
      
      <div className="vehicle-details-grid">
        <div className="card">
          <h2>Vehicle Information</h2>
          <div className="detail-row">
            <span className="detail-label">VIN:</span>
            <span className="detail-value">{vehicle.vin}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Make:</span>
            <span className="detail-value">{vehicle.make}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Model:</span>
            <span className="detail-value">{vehicle.model}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Year:</span>
            <span className="detail-value">{vehicle.year}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className="detail-value">{vehicle.status}</span>
          </div>
        </div>
        
        <div className="card">
          <h2>Analytics</h2>
          {vehicleData ? (
            <>
              <div className="detail-row">
                <span className="detail-label">Total Distance:</span>
                <span className="detail-value">
                  {vehicleData.mileageData?.[0]?.totalMileage || 'N/A'} km
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Utilization Rate:</span>
                <span className="detail-value">
                  {vehicleData.vehicleUtilization?.[0]?.utilizationRate || 'N/A'}%
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Fuel Consumption:</span>
                <span className="detail-value">
                  {vehicleData.fuelConsumption?.[0]?.totalConsumption || 'N/A'} L
                </span>
              </div>
            </>
          ) : (
            <p>No analytics data available</p>
          )}
          <Link to={`/analytics?vehicleId=${id}`} className="view-all-link">View All Analytics</Link>
        </div>
      </div>
      
      <div className="card">
        <div className="section-header">
          <h2>Maintenance History</h2>
          <Link to={`/maintenance/new?vehicleId=${id}`} className="btn btn-small">Add Record</Link>
        </div>
        
        {records.length > 0 ? (
          <table className="maintenance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th>Performed By</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>{new Date(record.performedAt).toLocaleDateString()}</td>
                  <td>{record.type}</td>
                  <td>{record.description}</td>
                  <td>{record.performedBy}</td>
                  <td>${record.cost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No maintenance records found</p>
        )}
      </div>
      
      <style jsx>{`
        .vehicle-detail-container {
          padding: 20px;
        }
        
        .vehicle-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .vehicle-status {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          text-transform: uppercase;
          margin-top: 5px;
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
        
        .action-buttons {
          display: flex;
          gap: 10px;
        }
        
        .btn {
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: bold;
          cursor: pointer;
          text-decoration: none;
          border: none;
        }
        
        .btn-small {
          padding: 4px 8px;
          font-size: 0.8rem;
        }
        
        .btn-primary {
          background-color: var(--primary-color);
          color: white;
        }
        
        .btn-secondary {
          background-color: var(--secondary-color);
          color: white;
        }
        
        .vehicle-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        
        .detail-label {
          font-weight: bold;
          color: var(--text-secondary);
        }
        
        .detail-value {
          text-align: right;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .maintenance-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .maintenance-table th, .maintenance-table td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        
        .maintenance-table th {
          background-color: var(--background-secondary);
          font-weight: bold;
        }
        
        .view-all-link {
          display: block;
          margin-top: 10px;
          text-align: right;
        }
        
        .error-message {
          color: var(--error-color);
          margin: 20px 0;
        }
      `}</style>
    </div>
  );
};

export default VehicleDetail; 