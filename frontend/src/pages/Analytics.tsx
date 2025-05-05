import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { 
  fetchAnalyticsData, 
  fetchCostAnalytics,
  fetchUtilizationAnalytics,
  fetchAnalyticsReports 
} from '../redux/slices/analyticsSlice';
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const periodOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom' }
];

// Helper function to generate mock time-series data for charts
const generateMockTrendData = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  // If period is too long, generate fewer data points (e.g. weekly instead of daily)
  const interval = daysDiff > 30 ? Math.floor(daysDiff / 15) : 1;
  const dataPoints: {date: string; utilization: number; distance: number}[] = [];
  
  for (let i = 0; i < daysDiff; i += interval) {
    const currentDate = new Date(start);
    currentDate.setDate(currentDate.getDate() + i);
    
    // Generate some realistic-looking mock data with slight randomness
    const utilization = 70 + Math.random() * 20; // 70-90% utilization
    const distance = Math.round(100 + Math.random() * 50); // 100-150 km
    
    dataPoints.push({
      date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      utilization: Number(utilization.toFixed(1)),
      distance: distance
    });
  }
  
  return dataPoints;
};

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
            <span className="stat-value">
              {analytics?.data?.data?.fleetOverview?.totalVehicles || 0}
            </span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">Active Vehicles</span>
            <span className="stat-value">
              {analytics?.data?.data?.fleetOverview?.vehiclesByStatus?.active || 0}
            </span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">Utilization Rate</span>
            <span className="stat-value">
              {analytics?.data?.data?.performanceMetrics?.utilization?.avgValue
                ? `${(analytics.data.data.performanceMetrics.utilization.avgValue * 100).toFixed(1)}%`
                : 'N/A'}
            </span>
          </div>
        </div>

        <div className="card summary-card">
          <h2>Maintenance Costs</h2>
          <div className="summary-stat">
            <span className="stat-label">Total Costs</span>
            <span className="stat-value">
              {analytics?.data?.data?.performanceMetrics?.costPerHour
                ? `$${(analytics.data.data.performanceMetrics.costPerHour.avgValue * analytics.data.data.usageStats.totalHours).toLocaleString()}`
                : 'N/A'}
            </span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">Average Cost per Hour</span>
            <span className="stat-value">
              {analytics?.data?.data?.performanceMetrics?.costPerHour
                ? `$${analytics.data.data.performanceMetrics.costPerHour.avgValue.toLocaleString()}`
                : 'N/A'}
            </span>
          </div>
        </div>
        
        <div className="card summary-card">
          <h2>Performance</h2>
          <div className="summary-stat">
            <span className="stat-label">Total Distance</span>
            <span className="stat-value">
              {analytics?.data?.data?.usageStats?.totalDistance
                ? `${analytics.data.data.usageStats.totalDistance.toLocaleString()} km`
                : 'N/A'}
            </span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">Fuel Consumption</span>
            <span className="stat-value">
              {analytics?.data?.data?.usageStats?.totalFuel
                ? `${analytics.data.data.usageStats.totalFuel.toLocaleString()} L`
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      <div className="card chart-container">
        <h2>Performance Charts</h2>
        {analytics?.data?.data?.performanceMetrics ? (
          <div className="charts-grid">
            <div className="chart">
              <h3>Utilization Rate</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { 
                      name: 'Utilization', 
                      value: analytics.data.data.performanceMetrics.utilization.avgValue * 100,
                      min: analytics.data.data.performanceMetrics.utilization.minValue * 100,
                      max: analytics.data.data.performanceMetrics.utilization.maxValue * 100
                    }
                  ]}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`${(value as number).toFixed(1)}%`, 'Rate']} />
                  <Legend />
                  <Bar name="Average" dataKey="value" fill="#8884d8" />
                  <Bar name="Min" dataKey="min" fill="#82ca9d" />
                  <Bar name="Max" dataKey="max" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="chart">
              <h3>Cost Per Hour</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { 
                      name: 'Cost', 
                      value: analytics.data.data.performanceMetrics.costPerHour.avgValue,
                      min: analytics.data.data.performanceMetrics.costPerHour.minValue,
                      max: analytics.data.data.performanceMetrics.costPerHour.maxValue
                    }
                  ]}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`$${(value as number).toFixed(2)}`, 'Cost']} />
                  <Legend />
                  <Bar name="Average" dataKey="value" fill="#8884d8" />
                  <Bar name="Min" dataKey="min" fill="#82ca9d" />
                  <Bar name="Max" dataKey="max" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="chart" style={{ gridColumn: '1 / -1' }}>
              <h3>Performance Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={generateMockTrendData(startDate, endDate)}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" label={{ value: 'Utilization (%)', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Distance (km)', angle: 90, position: 'insideRight' }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="utilization" stroke="#8884d8" name="Utilization %" />
                  <Line yAxisId="right" type="monotone" dataKey="distance" stroke="#82ca9d" name="Distance (km)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="placeholder-chart">
            <p>No performance data available</p>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Metrics Overview</h2>
        {analytics?.data?.data?.performanceMetrics ? (
          <div className="performance-metrics">
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Average</th>
                  <th>Min</th>
                  <th>Max</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(analytics.data.data?.performanceMetrics).map(([key, metric]: [string, any]) => (
                  <tr key={key}>
                    <td>{key === 'fuelEfficiency' ? 'Fuel Efficiency' : 
                         key === 'utilization' ? 'Utilization Rate' : 
                         key === 'costPerHour' ? 'Cost Per Hour' : key}</td>
                    <td>{metric.avgValue.toFixed(2)}</td>
                    <td>{metric.minValue.toFixed(2)}</td>
                    <td>{metric.maxValue.toFixed(2)}</td>
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
                  <span className="stat-value">
                    {utilizationData.data.data?.fleetUtilization?.utilizationAverage?.avgValue 
                      ? `${(utilizationData.data.data?.fleetUtilization.utilizationAverage.avgValue * 100).toFixed(1)}%` 
                      : 'N/A'}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Hours Active</span>
                  <span className="stat-value">
                    {utilizationData.data.data?.fleetUtilization?.totalHours 
                      ? `${utilizationData.data.data?.fleetUtilization.totalHours.toLocaleString()} hrs` 
                      : 'N/A'}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Distance</span>
                  <span className="stat-value">
                    {utilizationData.data.data?.fleetUtilization?.totalDistance 
                      ? `${utilizationData.data.data?.fleetUtilization.totalDistance.toLocaleString()} km` 
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            {utilizationData.data.data?.fleetUtilization?.utilizationAverage ? (
              <div className="chart-wrapper">
                <h3>Fleet Utilization Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Utilized', value: utilizationData.data.data.fleetUtilization.utilizationAverage.avgValue },
                        { name: 'Idle/Unavailable', value: 1 - utilizationData.data.data.fleetUtilization.utilizationAverage.avgValue }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#8884d8" />
                      <Cell fill="#d0d0d0" />
                    </Pie>
                    <Tooltip formatter={(value) => `${((value as number) * 100).toFixed(1)}%`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="placeholder-chart">
                <p>No utilization data available for chart</p>
              </div>
            )}
          </div>
        ) : (
          <p>No utilization data available</p>
        )}
      </div>

      <div className="card">
        <h2>Utilization Metrics</h2>
        {utilizationData && utilizationData.data && utilizationData.data.data?.fleetUtilization?.utilizationAverage ? (
          <div className="utilization-metrics">
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Average Utilization</td>
                  <td>{(utilizationData.data.data?.fleetUtilization.utilizationAverage.avgValue * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td>Minimum Utilization</td>
                  <td>{(utilizationData.data.data?.fleetUtilization.utilizationAverage.minValue * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td>Maximum Utilization</td>
                  <td>{(utilizationData.data.data?.fleetUtilization.utilizationAverage.maxValue * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td>Standard Deviation</td>
                  <td>{(utilizationData.data.data?.fleetUtilization.utilizationAverage.stdDev * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td>Number of Records</td>
                  <td>{utilizationData.data.data?.fleetUtilization.utilizationAverage.count}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p>No utilization metrics available</p>
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
                  <span className="stat-label">Average Cost per Hour</span>
                  <span className="stat-value">
                    {costData.data.data?.costMetrics?.costPerHour?.avgValue
                      ? `$${costData.data.data?.costMetrics.costPerHour.avgValue.toLocaleString()}`
                      : 'N/A'}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Min Cost per Hour</span>
                  <span className="stat-value">
                    {costData.data.data?.costMetrics?.costPerHour?.minValue
                      ? `$${costData.data.data?.costMetrics.costPerHour.minValue.toLocaleString()}`
                      : 'N/A'}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Max Cost per Hour</span>
                  <span className="stat-value">
                    {costData.data.data?.costMetrics?.costPerHour?.maxValue
                      ? `$${costData.data.data?.costMetrics.costPerHour.maxValue.toLocaleString()}`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            {costData.data.data?.costMetrics?.costPerHour ? (
              <div className="chart-wrapper">
                <h3>Cost Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      {
                        name: 'Min',
                        value: costData.data.data.costMetrics.costPerHour.minValue
                      },
                      {
                        name: 'Average',
                        value: costData.data.data.costMetrics.costPerHour.avgValue
                      },
                      {
                        name: 'Max',
                        value: costData.data.data.costMetrics.costPerHour.maxValue
                      }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => [`$${(value as number).toFixed(2)}`, 'Cost per Hour']} />
                    <Bar dataKey="value" fill="#82ca9d" name="Cost per Hour" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="placeholder-chart">
                <p>No cost data available for chart</p>
              </div>
            )}
          </div>
        ) : (
          <p>No cost data available</p>
        )}
      </div>

      <div className="card">
        <h2>Cost Metrics</h2>
        {costData && costData.data && costData.data.data?.costMetrics ? (
          <div className="cost-breakdown">
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Average</th>
                  <th>Min</th>
                  <th>Max</th>
                  <th>St. Dev</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(costData.data.data?.costMetrics).map(([category, data]: [string, any]) => (
                  <tr key={category}>
                    <td>{category === 'costPerHour' ? 'Cost Per Hour' : 
                         category === 'costPerKm' ? 'Cost Per Km' : category}</td>
                    <td>${data.avgValue.toFixed(2)}</td>
                    <td>${data.minValue.toFixed(2)}</td>
                    <td>${data.maxValue.toFixed(2)}</td>
                    <td>${data.stdDev.toFixed(2)}</td>
                    <td>{data.count}</td>
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

  const renderReports = () => {
    // Process reports data for the chart
    const reportTypeCount: Record<string, number> = {};
    reports.forEach(report => {
      reportTypeCount[report.reportType] = (reportTypeCount[report.reportType] || 0) + 1;
    });
    
    const reportTypeData = Object.keys(reportTypeCount).map(type => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: reportTypeCount[type]
    }));
    
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
    
    return (
      <div className="analytics-content">
        <div className="card">
          <h2>Saved Analytics Reports</h2>
          {reports && reports.length > 0 ? (
            <>
              <div className="charts-grid">
                <div className="chart-wrapper">
                  <h3>Reports by Type</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportTypeData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {reportTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
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
            </>
          ) : (
            <p>No saved reports available</p>
          )}
        </div>
      </div>
    );
  };

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

      <style>
        {`
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
        
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
          gap: 20px;
        }
        
        .chart, .chart-wrapper {
          background-color: var(--background-secondary);
          border-radius: 4px;
          padding: 15px;
        }
        
        .chart h3, .chart-wrapper h3 {
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 1rem;
          color: var(--text-secondary);
          text-align: center;
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
        `}
      </style>
    </div>
  );
};

export default Analytics; 