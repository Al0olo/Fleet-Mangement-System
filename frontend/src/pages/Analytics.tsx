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
    <div>
      <div style={styles.grid}>
        <div style={{...styles.card, marginBottom: '24px'}}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Fleet Overview</h2>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#3a85ff'}}>
              <path d="M16 6l-8.3 8.3a1.9 1.9 0 1 0 2.7 2.7L19 8"></path>
              <path d="M8.6 13.8L5 17.4"></path>
              <path d="M15 4l1-1 4 4-1 1"></path>
            </svg>
          </div>
          
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px'}}>
            <div style={{padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px'}}>
              <span style={styles.statLabel}>Total Vehicles</span>
              <span style={{...styles.statValue, display: 'block'}}>
                {analytics?.data?.data?.fleetOverview?.totalVehicles || 0}
              </span>
            </div>
            <div style={{padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px'}}>
              <span style={styles.statLabel}>Active Vehicles</span>
              <span style={{...styles.statValue, display: 'block'}}>
                {analytics?.data?.data?.fleetOverview?.vehiclesByStatus?.active || 0}
              </span>
            </div>
            <div style={{padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px'}}>
              <span style={styles.statLabel}>Utilization Rate</span>
              <span style={{...styles.statValue, display: 'block'}}>
                {analytics?.data?.data?.performanceMetrics?.utilization?.avgValue
                  ? `${(analytics.data.data.performanceMetrics.utilization.avgValue * 100).toFixed(1)}%`
                  : 'N/A'}
              </span>
            </div>
            <div style={{padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px'}}>
              <span style={styles.statLabel}>Maintenance Costs</span>
              <span style={{...styles.statValue, display: 'block'}}>
                {analytics?.data?.data?.performanceMetrics?.costPerHour
                  ? `$${(analytics.data.data.performanceMetrics.costPerHour.avgValue * analytics.data.data.usageStats.totalHours).toLocaleString()}`
                  : 'N/A'}
              </span>
            </div>
            <div style={{padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px'}}>
              <span style={styles.statLabel}>Total Distance</span>
              <span style={{...styles.statValue, display: 'block'}}>
                {analytics?.data?.data?.usageStats?.totalDistance
                  ? `${analytics.data.data.usageStats.totalDistance.toLocaleString()} km`
                  : 'N/A'}
              </span>
            </div>
            <div style={{padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px'}}>
              <span style={styles.statLabel}>Fuel Consumption</span>
              <span style={{...styles.statValue, display: 'block'}}>
                {analytics?.data?.data?.usageStats?.totalFuel
                  ? `${analytics.data.data.usageStats.totalFuel.toLocaleString()} L`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div style={{...styles.card, marginBottom: '24px'}}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Performance Charts</h2>
          </div>
          
          {analytics?.data?.data?.performanceMetrics ? (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px'}}>
              <div>
                <h3 style={{fontSize: '16px', fontWeight: 500, color: '#555', marginBottom: '16px', textAlign: 'center' as const}}>Utilization Rate</h3>
                <div style={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height="100%">
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
                      <Bar name="Average" dataKey="value" fill="#3a85ff" />
                      <Bar name="Min" dataKey="min" fill="#82ca9d" />
                      <Bar name="Max" dataKey="max" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div>
                <h3 style={{fontSize: '16px', fontWeight: 500, color: '#555', marginBottom: '16px', textAlign: 'center' as const}}>Cost Per Hour</h3>
                <div style={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height="100%">
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
                      <Bar name="Average" dataKey="value" fill="#3a85ff" />
                      <Bar name="Min" dataKey="min" fill="#82ca9d" />
                      <Bar name="Max" dataKey="max" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div style={{gridColumn: '1 / -1'}}>
                <h3 style={{fontSize: '16px', fontWeight: 500, color: '#555', marginBottom: '16px', textAlign: 'center' as const}}>Performance Trends</h3>
                <div style={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height="100%">
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
                      <Line yAxisId="left" type="monotone" dataKey="utilization" stroke="#3a85ff" strokeWidth={2} name="Utilization %" />
                      <Line yAxisId="right" type="monotone" dataKey="distance" stroke="#82ca9d" strokeWidth={2} name="Distance (km)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.emptyState}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18"></path>
                <path d="m19 9-5 5-4-4-3 3"></path>
              </svg>
              <p>No performance data available</p>
            </div>
          )}
        </div>

        <div style={{...styles.card}}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Metrics Overview</h2>
          </div>
          
          {analytics?.data?.data?.performanceMetrics ? (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Metric</th>
                  <th style={styles.th}>Average</th>
                  <th style={styles.th}>Min</th>
                  <th style={styles.th}>Max</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(analytics.data.data?.performanceMetrics).map(([key, metric]: [string, any]) => (
                  <tr key={key} style={styles.tableRow}>
                    <td style={styles.td}>{key === 'fuelEfficiency' ? 'Fuel Efficiency' : 
                       key === 'utilization' ? 'Utilization Rate' : 
                       key === 'costPerHour' ? 'Cost Per Hour' : key}</td>
                    <td style={styles.td}>{metric.avgValue.toFixed(2)}</td>
                    <td style={styles.td}>{metric.minValue.toFixed(2)}</td>
                    <td style={styles.td}>{metric.maxValue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={styles.emptyState}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                <path d="M3 9h18"></path>
                <path d="M3 15h18"></path>
                <path d="M9 9v12"></path>
                <path d="M15 9v12"></path>
              </svg>
              <p>No data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderUtilization = () => (
    <div>
      <div style={{...styles.card, ...styles.fullWidth, marginBottom: '24px'}}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>Fleet Utilization</h2>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#3a85ff'}}>
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
          </svg>
        </div>
        
        {utilizationData && utilizationData.data ? (
          <>
            <div style={styles.statGrid}>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Average Utilization Rate</span>
                <span style={styles.statValue}>
                  {utilizationData.data.data?.fleetUtilization?.utilizationAverage?.avgValue 
                    ? `${(utilizationData.data.data?.fleetUtilization.utilizationAverage.avgValue * 100).toFixed(1)}%` 
                    : 'N/A'}
                </span>
              </div>
              
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Total Hours Active</span>
                <span style={styles.statValue}>
                  {utilizationData.data.data?.fleetUtilization?.totalHours 
                    ? `${utilizationData.data.data?.fleetUtilization.totalHours.toLocaleString()} hrs` 
                    : 'N/A'}
                </span>
              </div>
              
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Total Distance</span>
                <span style={styles.statValue}>
                  {utilizationData.data.data?.fleetUtilization?.totalDistance 
                    ? `${utilizationData.data.data?.fleetUtilization.totalDistance.toLocaleString()} km` 
                    : 'N/A'}
                </span>
              </div>
            </div>
            
            {utilizationData.data.data?.fleetUtilization?.utilizationAverage ? (
              <div style={styles.chartContainer}>
                <h3 style={{fontSize: '16px', fontWeight: 500, color: '#555', marginBottom: '16px', textAlign: 'center'}}>Fleet Utilization Breakdown</h3>
                <ResponsiveContainer width="100%" height="100%">
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
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#3a85ff" />
                      <Cell fill="#eaeaea" />
                    </Pie>
                    <Tooltip formatter={(value) => `${((value as number) * 100).toFixed(1)}%`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={styles.emptyState}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                  <line x1="9" y1="9" x2="9.01" y2="9"></line>
                  <line x1="15" y1="9" x2="15.01" y2="9"></line>
                </svg>
                <p>No utilization data available for chart</p>
              </div>
            )}
          </>
        ) : (
          <div style={styles.emptyState}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
            <p>No utilization data available</p>
          </div>
        )}
      </div>

      <div style={{...styles.card, ...styles.fullWidth}}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>Utilization Metrics</h2>
        </div>
        
        {utilizationData && utilizationData.data && utilizationData.data.data?.fleetUtilization?.utilizationAverage ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Metric</th>
                <th style={styles.th}>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr style={styles.tableRow}>
                <td style={styles.td}>Average Utilization</td>
                <td style={styles.td}>{(utilizationData.data.data?.fleetUtilization.utilizationAverage.avgValue * 100).toFixed(1)}%</td>
              </tr>
              <tr style={styles.tableRow}>
                <td style={styles.td}>Minimum Utilization</td>
                <td style={styles.td}>{(utilizationData.data.data?.fleetUtilization.utilizationAverage.minValue * 100).toFixed(1)}%</td>
              </tr>
              <tr style={styles.tableRow}>
                <td style={styles.td}>Maximum Utilization</td>
                <td style={styles.td}>{(utilizationData.data.data?.fleetUtilization.utilizationAverage.maxValue * 100).toFixed(1)}%</td>
              </tr>
              <tr style={styles.tableRow}>
                <td style={styles.td}>Standard Deviation</td>
                <td style={styles.td}>{(utilizationData.data.data?.fleetUtilization.utilizationAverage.stdDev * 100).toFixed(1)}%</td>
              </tr>
              <tr style={styles.tableRow}>
                <td style={styles.td}>Number of Records</td>
                <td style={styles.td}>{utilizationData.data.data?.fleetUtilization.utilizationAverage.count}</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div style={styles.emptyState}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2"></rect>
              <path d="M3 9h18"></path>
              <path d="M3 15h18"></path>
              <path d="M9 9v12"></path>
              <path d="M15 9v12"></path>
            </svg>
            <p>No utilization metrics available</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderCosts = () => (
    <div>
      <div style={{...styles.card, ...styles.fullWidth, marginBottom: '24px'}}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>Cost Analysis</h2>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#3a85ff'}}>
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        
        {costData && costData.data ? (
          <>
            <div style={styles.statGrid}>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Average Cost per Hour</span>
                <span style={styles.statValue}>
                  {costData.data.data?.costMetrics?.costPerHour?.avgValue
                    ? `$${costData.data.data?.costMetrics.costPerHour.avgValue.toLocaleString()}`
                    : 'N/A'}
                </span>
              </div>
              
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Min Cost per Hour</span>
                <span style={styles.statValue}>
                  {costData.data.data?.costMetrics?.costPerHour?.minValue
                    ? `$${costData.data.data?.costMetrics.costPerHour.minValue.toLocaleString()}`
                    : 'N/A'}
                </span>
              </div>
              
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Max Cost per Hour</span>
                <span style={styles.statValue}>
                  {costData.data.data?.costMetrics?.costPerHour?.maxValue
                    ? `$${costData.data.data?.costMetrics.costPerHour.maxValue.toLocaleString()}`
                    : 'N/A'}
                </span>
              </div>
            </div>
            
            {costData.data.data?.costMetrics?.costPerHour ? (
              <div style={styles.chartContainer}>
                <h3 style={{fontSize: '16px', fontWeight: 500, color: '#555', marginBottom: '16px', textAlign: 'center'}}>Cost Distribution</h3>
                <ResponsiveContainer width="100%" height="100%">
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
                    <Bar dataKey="value" fill="#3a85ff" name="Cost per Hour" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={styles.emptyState}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18"></path>
                  <path d="m19 9-5 5-4-4-3 3"></path>
                </svg>
                <p>No cost data available for chart</p>
              </div>
            )}
          </>
        ) : (
          <div style={styles.emptyState}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            <p>No cost data available</p>
          </div>
        )}
      </div>

      <div style={{...styles.card, ...styles.fullWidth}}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>Cost Metrics</h2>
        </div>
        
        {costData && costData.data && costData.data.data?.costMetrics ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Metric</th>
                <th style={styles.th}>Average</th>
                <th style={styles.th}>Min</th>
                <th style={styles.th}>Max</th>
                <th style={styles.th}>St. Dev</th>
                <th style={styles.th}>Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(costData.data.data?.costMetrics).map(([category, data]: [string, any]) => (
                <tr key={category} style={styles.tableRow}>
                  <td style={styles.td}>{category === 'costPerHour' ? 'Cost Per Hour' : 
                       category === 'costPerKm' ? 'Cost Per Km' : category}</td>
                  <td style={styles.td}>${data.avgValue.toFixed(2)}</td>
                  <td style={styles.td}>${data.minValue.toFixed(2)}</td>
                  <td style={styles.td}>${data.maxValue.toFixed(2)}</td>
                  <td style={styles.td}>${data.stdDev.toFixed(2)}</td>
                  <td style={styles.td}>{data.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={styles.emptyState}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2"></rect>
              <path d="M3 9h18"></path>
              <path d="M3 15h18"></path>
              <path d="M9 9v12"></path>
              <path d="M15 9v12"></path>
            </svg>
            <p>No cost breakdown data available</p>
          </div>
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
    
    const COLORS = ['#3a85ff', '#48BB78', '#F6AD55', '#FC8181', '#9F7AEA'];
    
    return (
      <div>
        <div style={{...styles.card, ...styles.fullWidth, marginBottom: '24px'}}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Report Distribution</h2>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#3a85ff'}}>
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
              <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
            </svg>
          </div>
          
          {reports && reports.length > 0 ? (
            <div style={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
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
          ) : (
            <div style={styles.emptyState}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
              </svg>
              <p>No report data available for chart</p>
            </div>
          )}
        </div>
              
        <div style={{...styles.card, ...styles.fullWidth}}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Saved Reports</h2>
            <button style={styles.button}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download All
            </button>
          </div>
          
          {reports && reports.length > 0 ? (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Report Type</th>
                  <th style={styles.th}>Period</th>
                  <th style={styles.th}>Date Range</th>
                  <th style={styles.th}>Created At</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} style={styles.tableRow}>
                    <td style={styles.td}>{report.reportType}</td>
                    <td style={styles.td}>{report.period}</td>
                    <td style={styles.td}>
                      {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}
                    </td>
                    <td style={styles.td}>{new Date(report.createdAt).toLocaleDateString()}</td>
                    <td style={styles.td}>
                      <button style={{...styles.button, ...styles.buttonSmall, marginRight: '8px'}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        View
                      </button>
                      <button style={{...styles.button, ...styles.buttonSmall, ...styles.buttonSecondary}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={styles.emptyState}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <line x1="10" y1="9" x2="8" y2="9"></line>
              </svg>
              <p>No saved reports available</p>
              <button style={styles.button}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
                Create New Report
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Fleet Analytics</h1>
        <div style={styles.filters}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Period:</label>
            <select 
              style={styles.select} 
              value={selectedPeriod} 
              onChange={handlePeriodChange}
            >
              {periodOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          {selectedPeriod === 'custom' && (
            <div style={styles.dateFilters}>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Start Date:</label>
                <input 
                  type="date" 
                  name="startDate" 
                  value={startDate} 
                  onChange={handleDateChange} 
                  style={styles.input}
                />
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>End Date:</label>
                <input 
                  type="date" 
                  name="endDate" 
                  value={endDate} 
                  onChange={handleDateChange} 
                  style={styles.input}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={styles.tabs}>
        <button 
          style={activeTab === 'overview' ? {...styles.tabButton, ...styles.activeTab} : styles.tabButton}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          style={activeTab === 'utilization' ? {...styles.tabButton, ...styles.activeTab} : styles.tabButton}
          onClick={() => setActiveTab('utilization')}
        >
          Utilization
        </button>
        <button 
          style={activeTab === 'costs' ? {...styles.tabButton, ...styles.activeTab} : styles.tabButton}
          onClick={() => setActiveTab('costs')}
        >
          Costs
        </button>
        <button 
          style={activeTab === 'reports' ? {...styles.tabButton, ...styles.activeTab} : styles.tabButton}
          onClick={() => setActiveTab('reports')}
        >
          Reports
        </button>
      </div>

      {loading ? (
        <div style={styles.loadingContainer}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.loadingIcon}>
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v6l4 2"></path>
          </svg>
          <p>Loading analytics data...</p>
        </div>
      ) : error ? (
        <div style={styles.errorContainer}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.errorIcon}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p>{error}</p>
        </div>
      ) : (
        renderTabContent()
      )}
    </div>
  );
};

// Styles object
const styles = {
  container: {
    padding: '24px',
    maxWidth: '1600px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap' as const,
    gap: '20px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    margin: 0
  },
  filters: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap' as const,
    alignItems: 'center'
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  filterLabel: {
    fontWeight: 500,
    fontSize: '14px'
  },
  select: {
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    backgroundColor: '#fff',
    minWidth: '150px'
  },
  input: {
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ddd'
  },
  dateFilters: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center'
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #eee',
    marginBottom: '24px'
  },
  tabButton: {
    padding: '12px 20px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '15px',
    color: '#555',
    transition: 'all 0.2s',
    position: 'relative' as const
  },
  activeTab: {
    color: '#3a85ff',
    fontWeight: 500,
    borderBottom: '2px solid #3a85ff'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    color: '#666',
    gap: '16px'
  },
  loadingIcon: {
    animation: 'spin 2s linear infinite',
    color: '#3a85ff'
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    color: '#e74c3c',
    gap: '12px',
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderRadius: '8px',
    margin: '24px 0'
  },
  errorIcon: {
    color: '#e74c3c'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr', // Updated to single column for full width
    gap: '24px',
    marginBottom: '2rem'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: 0
  },
  chartContainer: {
    height: '300px',
    marginTop: '16px'
  },
  fullWidth: {
    gridColumn: '1 / -1'
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px'
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 600
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginTop: '16px'
  },
  th: {
    textAlign: 'left' as const,
    padding: '12px 16px',
    borderBottom: '1px solid #eee',
    fontWeight: 500,
    color: '#555',
    fontSize: '14px'
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid #eee',
    fontSize: '14px'
  },
  tableRow: {
    transition: 'background-color 0.2s'
  },
  tableRowHover: {
    backgroundColor: '#f9f9f9'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    color: '#666',
    gap: '16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    textAlign: 'center' as const
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#3a85ff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  },
  buttonSecondary: {
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: '1px solid #ddd'
  },
  buttonSmall: {
    padding: '4px 8px',
    fontSize: '12px'
  }
};

export default Analytics; 