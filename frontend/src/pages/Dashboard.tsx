import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { AppDispatch, RootState } from '../redux/store';
import { fetchVehicles } from '../redux/slices/vehicleSlice';
import { fetchAnalyticsData } from '../redux/slices/analyticsSlice';

const Dashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { vehicles, loading: vehiclesLoading } = useSelector((state: RootState) => state.vehicles);
  const { data: analytics, loading: analyticsLoading } = useSelector((state: RootState) => state.analytics);

  useEffect(() => {
    dispatch(fetchVehicles());
    dispatch(fetchAnalyticsData());
  }, [dispatch]);

  const loading = vehiclesLoading || analyticsLoading;

  return (
    <div className="dashboard-container">
      <h1>Fleet Dashboard</h1>
      
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="dashboard-cards">
            <div className="card dashboard-card">
              <h3>Total Vehicles</h3>
              <p className="dashboard-value">{analytics.totalVehicles || vehicles.length}</p>
              <Link to="/vehicles">View All</Link>
            </div>
            
            <div className="card dashboard-card">
              <h3>Active Vehicles</h3>
              <p className="dashboard-value">{analytics.activeVehicles || vehicles.filter(v => v.status === 'active').length}</p>
            </div>
            
            <div className="card dashboard-card">
              <h3>Maintenance Due</h3>
              <p className="dashboard-value">3</p>
              <Link to="/maintenance">View Schedule</Link>
            </div>
            
            <div className="card dashboard-card">
              <h3>Analysis</h3>
              <p className="dashboard-value">View Reports</p>
              <Link to="/analytics">Analytics</Link>
            </div>
          </div>
          
          <div className="card">
            <h3>Recent Activity</h3>
            <div className="activity-list">
              <p>No recent activities</p>
            </div>
          </div>
          
          <div className="card">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <Link to="/vehicles/new" className="btn btn-primary">Add Vehicle</Link>
              <Link to="/maintenance/new" className="btn btn-secondary">Schedule Maintenance</Link>
              <Link to="/simulator" className="btn btn-tertiary">Run Simulation</Link>
            </div>
          </div>
        </>
      )}
      
      <style jsx>{`
        .dashboard-container {
          padding: 20px;
        }
        
        .dashboard-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .dashboard-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 20px;
        }
        
        .dashboard-value {
          font-size: 2rem;
          font-weight: bold;
          margin: 10px 0;
          color: var(--primary-color);
        }
        
        .activity-list {
          margin-top: 10px;
        }
        
        .action-buttons {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }
        
        .btn {
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: bold;
          cursor: pointer;
          text-decoration: none;
        }
        
        .btn-primary {
          background-color: var(--primary-color);
          color: white;
        }
        
        .btn-secondary {
          background-color: var(--secondary-color);
          color: white;
        }
        
        .btn-tertiary {
          background-color: var(--background-secondary);
          color: var(--text-primary);
          border: 1px solid var(--text-secondary);
        }
      `}</style>
    </div>
  );
};

export default Dashboard; 