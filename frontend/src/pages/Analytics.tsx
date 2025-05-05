import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { 
  fetchAnalyticsData, 
  fetchCostAnalytics,
  fetchUtilizationAnalytics,
  fetchAnalyticsReports 
} from '../redux/slices/analyticsSlice';

const periodOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom' }
];

const Analytics = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    data: analytics, 
    utilizationData,
    costData,
    reports,
    loading, 
    error 
  } = useSelector((state: RootState) => state.analytics);

  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('overview');

  useEffect(() => {
    // Set default date range to last 30 days if not set
    if (!startDate) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    }
    
    if (!endDate) {
      setEndDate(new Date().toISOString().split('T')[0]);
    }
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      loadDashboardData();
    }
  }, [dispatch, startDate, endDate, selectedPeriod]);

  const loadDashboardData = () => {
    const params = {
      startDate,
      endDate,
      period: selectedPeriod
    };
    
    dispatch(fetchAnalyticsData(params));
    dispatch(fetchUtilizationAnalytics(params));
    dispatch(fetchCostAnalytics(params));
    dispatch(fetchAnalyticsReports({ period: 'custom', limit: 5 }));
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPeriod(e.target.value);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'startDate') {
      setStartDate(value);
    } else if (name === 'endDate') {
      setEndDate(value);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'utilization':
        return renderUtilization();
      case 'costs':
        return renderCosts();
      case 'reports':
        return renderReports();
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => (
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
        {analytics.vehicleUtilization && analytics.vehicleUtilization.length > 0 ? (
          <div className="top-performers">
            <table>
              <thead>
                <tr>
                  <th>Vehicle ID</th>
                  <th>Utilization Rate</th>
                  <th>Hours Active</th>
                </tr>
              </thead>
              <tbody>
                {analytics.vehicleUtilization
                  .sort((a, b) => b.utilizationRate - a.utilizationRate)
                  .slice(0, 5)
                  .map((vehicle) => (
                    <tr key={vehicle.vehicleId}>
                      <td>{vehicle.vehicleId}</td>
                      <td>{vehicle.utilizationRate.toFixed(1)}%</td>
                      <td>{vehicle.hoursActive.toLocaleString()} hrs</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No data available</p>
        )}
      </div>
    </div>
  );

  const renderUtilization = () => (
    <div className="analytics-content">
      <div className="card">
        <h2>Fleet Utilization</h2>
        {utilizationData && utilizationData.data ? (
          <div className="utilization-data">
            <div className="summary-stats">
              <div className="stat-group">
                <div className="stat-item">
                  <span className="stat-label">Average Utilization Rate</span>
                  <span className="stat-value">{utilizationData.data.averageUtilizationRate?.toFixed(1)}%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Hours Active</span>
                  <span className="stat-value">{utilizationData.data.totalHoursActive?.toLocaleString()} hrs</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Hours Available</span>
                  <span className="stat-value">{utilizationData.data.totalHoursAvailable?.toLocaleString()} hrs</span>
                </div>
              </div>
            </div>
            <div className="placeholder-chart">
              <p>Utilization chart would be displayed here</p>
            </div>
          </div>
        ) : (
          <p>No utilization data available</p>
        )}
      </div>

      <div className="card">
        <h2>Vehicle Utilization Breakdown</h2>
        {utilizationData && utilizationData.data && utilizationData.data.vehicleUtilization ? (
          <div className="vehicle-breakdown">
            <table>
              <thead>
                <tr>
                  <th>Vehicle ID</th>
                  <th>Utilization Rate</th>
                  <th>Hours Active</th>
                  <th>Hours Available</th>
                </tr>
              </thead>
              <tbody>
                {utilizationData.data.vehicleUtilization.map((vehicle: any) => (
                  <tr key={vehicle.vehicleId}>
                    <td>{vehicle.vehicleId}</td>
                    <td>{vehicle.utilizationRate.toFixed(1)}%</td>
                    <td>{vehicle.hoursActive.toLocaleString()} hrs</td>
                    <td>{vehicle.hoursAvailable.toLocaleString()} hrs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No vehicle utilization data available</p>
        )}
      </div>
    </div>
  );

  const renderCosts = () => (
    <div className="analytics-content">
      <div className="card">
        <h2>Cost Analysis</h2>
        {costData && costData.data ? (
          <div className="cost-data">
            <div className="summary-stats">
              <div className="stat-group">
                <div className="stat-item">
                  <span className="stat-label">Total Costs</span>
                  <span className="stat-value">${costData.data.totalCost?.toLocaleString()}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Average Cost per Vehicle</span>
                  <span className="stat-value">${costData.data.averageCostPerVehicle?.toLocaleString()}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Cost per Distance</span>
                  <span className="stat-value">${costData.data.costPerKm?.toFixed(2)}/km</span>
                </div>
              </div>
            </div>
            <div className="placeholder-chart">
              <p>Cost breakdown chart would be displayed here</p>
            </div>
          </div>
        ) : (
          <p>No cost data available</p>
        )}
      </div>

      <div className="card">
        <h2>Cost Breakdown</h2>
        {costData && costData.data && costData.data.costBreakdown ? (
          <div className="cost-breakdown">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(costData.data.costBreakdown).map(([category, data]: [string, any]) => (
                  <tr key={category}>
                    <td>{category}</td>
                    <td>${data.amount.toLocaleString()}</td>
                    <td>{data.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No cost breakdown data available</p>
        )}
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="analytics-content">
      <div className="card">
        <h2>Saved Analytics Reports</h2>
        {reports && reports.length > 0 ? (
          <div className="reports-list">
            <table>
              <thead>
                <tr>
                  <th>Report Type</th>
                  <th>Period</th>
                  <th>Date Range</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>{report.reportType}</td>
                    <td>{report.period}</td>
                    <td>
                      {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}
                    </td>
                    <td>{new Date(report.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-sm">View</button>
                      <button className="btn btn-sm">Download</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No saved reports available</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Fleet Analytics</h1>
        <div className="filters">
          <div className="filter-group">
            <label>Period:</label>
            <select value={selectedPeriod} onChange={handlePeriodChange}>
              {periodOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          {selectedPeriod === 'custom' && (
            <div className="date-filters">
              <div className="filter-group">
                <label>Start Date:</label>
                <input 
                  type="date" 
                  name="startDate" 
                  value={startDate} 
                  onChange={handleDateChange} 
                />
              </div>
              <div className="filter-group">
                <label>End Date:</label>
                <input 
                  type="date" 
                  name="endDate" 
                  value={endDate} 
                  onChange={handleDateChange} 
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'utilization' ? 'active' : ''}`}
          onClick={() => setActiveTab('utilization')}
        >
          Utilization
        </button>
        <button 
          className={`tab-button ${activeTab === 'costs' ? 'active' : ''}`}
          onClick={() => setActiveTab('costs')}
        >
          Costs
        </button>
        <button 
          className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Reports
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading analytics data...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        renderTabContent()
      )}

      <style jsx>{`
        .analytics-container {
          padding: 20px;
        }
        
        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        
        .filters {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }
        
        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .date-filters {
          display: flex;
          gap: 10px;
        }
        
        .tabs {
          display: flex;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 20px;
        }
        
        .tab-button {
          padding: 10px 20px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          color: var(--text-secondary);
          transition: all 0.2s;
        }
        
        .tab-button.active {
          color: var(--text-primary);
          border-bottom: 2px solid var(--primary-color);
        }
        
        .tab-button:hover {
          background-color: var(--background-hover);
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
        
        .loading {
          display: flex;
          justify-content: center;
          padding: 40px;
          color: var(--text-secondary);
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
        }
        
        th {
          font-weight: 600;
          color: var(--text-secondary);
        }
        
        .btn {
          padding: 5px 10px;
          margin-right: 5px;
          background-color: var(--primary-color);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .btn-sm {
          font-size: 12px;
          padding: 3px 8px;
        }
        
        .stat-group {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .stat-item {
          display: flex;
          flex-direction: column;
          padding: 15px;
          background-color: var(--background-secondary);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default Analytics; 