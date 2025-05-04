import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { fetchAnalyticsData } from '../redux/slices/analyticsSlice';

const Analytics = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data: analytics, loading, error } = useSelector((state: RootState) => state.analytics);

  useEffect(() => {
    dispatch(fetchAnalyticsData());
  }, [dispatch]);

  return (
    <div className="analytics-container">
      <h1>Fleet Analytics</h1>

      {loading ? (
        <div>Loading analytics data...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="analytics-content">
          <div className="analytics-summary-cards">
            <div className="card summary-card">
              <h2>Fleet Overview</h2>
              <div className="summary-stat">
                <span className="stat-label">Total Vehicles</span>
                <span className="stat-value">{analytics.totalVehicles || 0}</span>
              </div>
              <div className="summary-stat">
                <span className="stat-label">Active Vehicles</span>
                <span className="stat-value">{analytics.activeVehicles || 0}</span>
              </div>
              <div className="summary-stat">
                <span className="stat-label">Utilization Rate</span>
                <span className="stat-value">
                  {analytics.vehicleUtilization && analytics.vehicleUtilization.length > 0
                    ? `${(analytics.vehicleUtilization.reduce((sum, v) => sum + v.utilizationRate, 0) / analytics.vehicleUtilization.length).toFixed(1)}%`
                    : 'N/A'}
                </span>
              </div>
            </div>

            <div className="card summary-card">
              <h2>Maintenance Costs</h2>
              <div className="summary-stat">
                <span className="stat-label">Total Costs</span>
                <span className="stat-value">
                  {analytics.maintenanceCosts && analytics.maintenanceCosts.length > 0
                    ? `$${analytics.maintenanceCosts.reduce((sum, v) => sum + v.totalCost, 0).toLocaleString()}`
                    : 'N/A'}
                </span>
              </div>
              <div className="summary-stat">
                <span className="stat-label">Average Cost per Vehicle</span>
                <span className="stat-value">
                  {analytics.maintenanceCosts && analytics.maintenanceCosts.length > 0 && analytics.totalVehicles
                    ? `$${(analytics.maintenanceCosts.reduce((sum, v) => sum + v.totalCost, 0) / analytics.totalVehicles).toLocaleString()}`
                    : 'N/A'}
                </span>
              </div>
            </div>
            
            <div className="card summary-card">
              <h2>Performance</h2>
              <div className="summary-stat">
                <span className="stat-label">Total Distance</span>
                <span className="stat-value">
                  {analytics.mileageData && analytics.mileageData.length > 0
                    ? `${analytics.mileageData.reduce((sum, v) => sum + v.totalMileage, 0).toLocaleString()} km`
                    : 'N/A'}
                </span>
              </div>
              <div className="summary-stat">
                <span className="stat-label">Fuel Consumption</span>
                <span className="stat-value">
                  {analytics.fuelConsumption && analytics.fuelConsumption.length > 0
                    ? `${analytics.fuelConsumption.reduce((sum, v) => sum + v.totalConsumption, 0).toLocaleString()} L`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="card chart-container">
            <h2>Performance Charts</h2>
            <div className="placeholder-chart">
              <p>Charts will be displayed here</p>
            </div>
          </div>

          <div className="card">
            <h2>Top Performers</h2>
            <p>No data available</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .analytics-container {
          padding: 20px;
        }
        
        .analytics-content {
          margin-top: 20px;
        }
        
        .analytics-summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .summary-card {
          padding: 20px;
        }
        
        .summary-stat {
          display: flex;
          justify-content: space-between;
          margin: 15px 0;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
        }
        
        .stat-label {
          font-weight: 500;
          color: var(--text-secondary);
        }
        
        .stat-value {
          font-weight: bold;
          font-size: 1.1rem;
        }
        
        .chart-container {
          margin-bottom: 20px;
        }
        
        .placeholder-chart {
          height: 300px;
          background-color: var(--background-secondary);
          display: flex;
          justify-content: center;
          align-items: center;
          color: var(--text-secondary);
          border-radius: 4px;
        }
        
        .error-message {
          color: var(--error-color);
          margin: 20px 0;
        }
      `}</style>
    </div>
  );
};

export default Analytics; 