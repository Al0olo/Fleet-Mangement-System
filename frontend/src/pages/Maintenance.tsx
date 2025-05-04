import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { AppDispatch, RootState } from '../redux/store';
import { fetchMaintenanceRecords } from '../redux/slices/maintenanceSlice';

const Maintenance = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { records, loading, error } = useSelector((state: RootState) => state.maintenance);

  useEffect(() => {
    dispatch(fetchMaintenanceRecords());
  }, [dispatch]);

  return (
    <div className="maintenance-container">
      <div className="maintenance-header">
        <h1>Maintenance Records</h1>
        <Link to="/maintenance/new" className="btn btn-primary">Add Maintenance Record</Link>
      </div>

      {loading ? (
        <div>Loading maintenance records...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          <div className="card">
            <h2>Upcoming Maintenance</h2>
            <p>No upcoming maintenance scheduled</p>
          </div>

          <div className="card">
            <h2>Maintenance History</h2>
            {records.length > 0 ? (
              <table className="maintenance-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Performed By</th>
                    <th>Cost</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <Link to={`/vehicles/${record.vehicleId}`}>
                          {record.vehicleId}
                        </Link>
                      </td>
                      <td>{new Date(record.performedAt).toLocaleDateString()}</td>
                      <td>{record.type}</td>
                      <td>{record.description}</td>
                      <td>{record.performedBy}</td>
                      <td>${record.cost.toFixed(2)}</td>
                      <td>
                        <div className="action-buttons">
                          <Link to={`/maintenance/${record.id}/edit`} className="btn-action">Edit</Link>
                          <button className="btn-action delete">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No maintenance records found</p>
            )}
          </div>
        </>
      )}

      <style jsx>{`
        .maintenance-container {
          padding: 20px;
        }
        
        .maintenance-header {
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
        
        .card {
          margin-bottom: 20px;
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
        
        .action-buttons {
          display: flex;
          gap: 8px;
        }
        
        .btn-action {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          cursor: pointer;
          background-color: var(--background-secondary);
          border: none;
          color: var(--primary-color);
          text-decoration: none;
        }
        
        .btn-action.delete {
          color: var(--error-color);
        }
        
        .error-message {
          color: var(--error-color);
          margin: 20px 0;
        }
      `}</style>
    </div>
  );
};

export default Maintenance; 