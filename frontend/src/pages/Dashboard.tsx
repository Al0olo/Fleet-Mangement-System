import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { AppDispatch, RootState } from '../redux/store';
import { fetchVehicles } from '../redux/slices/vehicleSlice';
import { fetchAnalyticsData } from '../redux/slices/analyticsSlice';
import { fetchUpcomingSchedules, fetchOverdueSchedules, updateOverdueSchedules } from '../redux/slices/maintenanceScheduleSlice';
import { CSSProperties } from 'react';
import {
  BarChart, Bar,
  PieChart, Pie, Cell,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const Dashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { vehicles, loading: vehiclesLoading } = useSelector((state: RootState) => state.vehicles);
  const { data: analytics, loading: analyticsLoading } = useSelector((state: RootState) => state.analytics);
  const { 
    upcomingSchedules, 
    overdueSchedules, 
    loading: schedulesLoading 
  } = useSelector((state: RootState) => state.maintenanceSchedules);

  useEffect(() => {
    // Update overdue schedules first to ensure we have the latest status
    dispatch(updateOverdueSchedules({}));
    
    // Then fetch the data
    dispatch(fetchVehicles());
    dispatch(fetchAnalyticsData());
    dispatch(fetchUpcomingSchedules({ days: 7 })); // Get schedules due in the next 7 days
    dispatch(fetchOverdueSchedules({})); // Pass empty object as parameter
  }, [dispatch]);

  const loading = vehiclesLoading || analyticsLoading || schedulesLoading;

  // Calculate total maintenance due (upcoming + overdue)
  const upcomingCount = upcomingSchedules && Array.isArray(upcomingSchedules) ? upcomingSchedules.length : 0;
  const overdueCount = overdueSchedules && Array.isArray(overdueSchedules) ? overdueSchedules.length : 0;
  const maintenanceDueCount = upcomingCount + overdueCount;
     
  // For debugging
  useEffect(() => {
    console.log('Upcoming schedules:', upcomingSchedules);
    console.log('Overdue schedules:', overdueSchedules);
    console.log('Total maintenance due:', maintenanceDueCount);
  }, [upcomingSchedules, overdueSchedules, maintenanceDueCount]);

  // Helper function to generate vehicle status data for pie chart
  const getVehicleStatusData = (vehicles: any[]) => {
    const statusCount: Record<string, number> = {};
    
    vehicles.forEach(vehicle => {
      const status = vehicle.status || 'unknown';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    return Object.keys(statusCount).map(status => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: statusCount[status]
    }));
  };

  // Helper function to get colors for vehicle status
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Active': '#4caf50',
      'Inactive': '#f44336',
      'Maintenance': '#ff9800',
      'Unknown': '#9e9e9e'
    };
    
    return colors[status] || '#9e9e9e';
  };

  // Helper function to generate maintenance chart data
  const getMaintenanceChartData = (upcomingSchedules: any[], overdueSchedules: any[]) => {
    const upcoming = Array.isArray(upcomingSchedules) ? upcomingSchedules.length : 0;
    const overdue = Array.isArray(overdueSchedules) ? overdueSchedules.length : 0;
    
    // Group upcoming by date ranges
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    let todayCount = 0;
    let weekCount = 0;
    let laterCount = 0;
    
    if (Array.isArray(upcomingSchedules)) {
      upcomingSchedules.forEach(schedule => {
        const scheduleDate = new Date(schedule.scheduledDate);
        if (scheduleDate <= tomorrow) {
          todayCount++;
        } else if (scheduleDate <= nextWeek) {
          weekCount++;
        } else {
          laterCount++;
        }
      });
    }
    
    return [
      { name: 'Overdue', value: overdue },
      { name: 'Due Today', value: todayCount },
      { name: 'Next 7 Days', value: weekCount },
      { name: 'Later', value: laterCount }
    ];
  };

  // Helper function to generate vehicle activity data over time (simulated)
  const getVehicleActivityData = () => {
    const today = new Date();
    const data = [];
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      // Generate some random but realistic-looking data
      const totalVehicles = 10; // Simulated total fleet size
      const activeCount = Math.floor(Math.random() * 3) + (totalVehicles - 4); // Between 7-9 active
      const maintenanceCount = Math.floor(Math.random() * 3) + 1; // Between 1-3 in maintenance
      const inactiveCount = totalVehicles - activeCount - maintenanceCount;
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        active: activeCount,
        maintenance: maintenanceCount,
        inactive: inactiveCount
      });
    }
    
    return data;
  };

  // Helper function to get maintenance status color
  const getMaintenanceStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Overdue': '#f44336',
      'Due Today': '#4caf50',
      'Next 7 Days': '#ff9800',
      'Later': '#9e9e9e'
    };
    
    return colors[status] || '#9e9e9e';
  };

  // Define styles as React inline style objects
  const styles: Record<string, CSSProperties> = {
    dashboardContainer: {
      padding: '20px',
      maxWidth: '100%',
    },
    dashboardHeader: {
      marginBottom: '24px',
      borderBottom: '1px solid var(--border-color)',
      paddingBottom: '12px',
    },
    dashboardCards: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: '20px',
      marginBottom: '24px',
    },
    dashboardCard: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'flex-start' as const,
      padding: '20px',
      transition: 'all 0.2s ease',
      borderLeft: '4px solid transparent',
      height: '100%',
    },
    vehiclesCard: {
      borderLeftColor: 'var(--primary-color)',
    },
    activeCard: {
      borderLeftColor: '#4caf50',
    },
    maintenanceCard: {
      borderLeftColor: overdueCount > 0 ? '#f44336' : '#ff9800',
    },
    analyticsCard: {
      borderLeftColor: '#2196f3',
    },
    dashboardValue: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      margin: '10px 0',
      color: 'var(--primary-color)',
    },
    emergencyValue: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      margin: '10px 0',
      color: overdueCount > 0 ? '#f44336' : '#ff9800',
    },
    analyticsValue: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      margin: '10px 0',
      color: '#2196f3',
    },
    cardLink: {
      color: 'var(--primary-color)',
      textDecoration: 'none',
      fontWeight: 'bold',
      marginTop: 'auto',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
    },
    activityList: {
      marginTop: '10px',
    },
    actionButtons: {
      display: 'flex',
      gap: '10px',
      marginTop: '10px',
      flexWrap: 'wrap',
    },
    btn: {
      padding: '10px 16px',
      borderRadius: '4px',
      fontWeight: 'bold',
      cursor: 'pointer',
      textDecoration: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
    },
    btnPrimary: {
      backgroundColor: 'var(--primary-color)',
      color: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    btnSecondary: {
      backgroundColor: 'var(--secondary-color)',
      color: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    btnTertiary: {
      backgroundColor: 'var(--background-secondary)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-color)',
    },
    badge: {
      display: 'inline-block',
      padding: '3px 8px',
      borderRadius: '12px',
      fontSize: '0.8rem',
      fontWeight: 'bold',
      color: 'white',
      backgroundColor: '#f44336',
      marginLeft: '8px',
      verticalAlign: 'middle',
    },
    chartWrapper: {
      background: 'var(--background-secondary)',
      padding: '15px',
      borderRadius: '4px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    chartTitle: {
      marginTop: 0,
      marginBottom: '15px',
      textAlign: 'center' as const,
      fontSize: '1.1rem',
      fontWeight: 'bold',
      color: 'var(--text-secondary)',
    },
    activityItem: {
      padding: '8px 0',
      borderBottom: '1px solid var(--border-color)',
    },
    activityLink: {
      color: 'var(--primary-color)',
      textDecoration: 'none',
      display: 'inline-block',
      maxWidth: '100%',
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  };

  return (
    <div style={styles.dashboardContainer}>
      <h1 style={styles.dashboardHeader}>Fleet Dashboard</h1>
      
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div style={styles.dashboardCards}>
            <div className="card" style={{...styles.dashboardCard, ...styles.vehiclesCard}}>
              <h3>Total Vehicles</h3>
              <p style={styles.dashboardValue}>{analytics.totalVehicles || (Array.isArray(vehicles) ? vehicles.length : 0)}</p>
              <Link to="/vehicles" style={styles.cardLink}>View All</Link>
            </div>
            
            <div className="card" style={{...styles.dashboardCard, ...styles.activeCard}}>
              <h3>Active Vehicles</h3>
              <p style={{...styles.dashboardValue, color: '#4caf50'}}>{analytics.activeVehicles || (Array.isArray(vehicles) ? vehicles.filter(v => v.status === 'active').length : 0)}</p>
              <Link to="/vehicles?status=active" style={styles.cardLink}>View Active</Link>
            </div>
            
            <div className="card" style={{...styles.dashboardCard, ...styles.maintenanceCard}}>
              <h3>Maintenance Due</h3>
              <p style={styles.emergencyValue}>
                {maintenanceDueCount}
                {overdueCount > 0 && (
                  <span style={styles.badge}>{overdueCount} overdue</span>
                )}
              </p>
              <Link to="/maintenance/schedules" style={styles.cardLink}>View Schedule</Link>
            </div>
            
            <div className="card" style={{...styles.dashboardCard, ...styles.analyticsCard}}>
              <h3>Analysis</h3>
              <p style={styles.analyticsValue}>View Reports</p>
              <Link to="/analytics" style={styles.cardLink}>Analytics</Link>
            </div>
          </div>
          
          {/* Dashboard Charts Section */}
          <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ marginBottom: '24px', color: 'var(--text-primary)' }}>Fleet Analytics Overview</h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
              gap: '24px', 
              marginBottom: '24px' 
            }}>
              {/* Vehicle Status Distribution Chart */}
              <div style={styles.chartWrapper}>
                <h3 style={styles.chartTitle}>Vehicle Status Distribution</h3>
                <div style={{ height: '280px' }}>
                  {Array.isArray(vehicles) && vehicles.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getVehicleStatusData(vehicles)}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {getVehicleStatusData(vehicles).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getStatusColor(entry.name)} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [value, 'Count']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <p>No vehicle data available</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Maintenance Overview Chart */}
              <div style={styles.chartWrapper}>
                <h3 style={styles.chartTitle}>Maintenance Schedule Overview</h3>
                <div style={{ height: '280px' }}>
                  {(Array.isArray(upcomingSchedules) || Array.isArray(overdueSchedules)) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getMaintenanceChartData(upcomingSchedules, overdueSchedules)}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Count">
                          {getMaintenanceChartData(upcomingSchedules, overdueSchedules).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getMaintenanceStatusColor(entry.name)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <p>No maintenance data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Activity Over Time Chart - Spans full width */}
            <div style={styles.chartWrapper}>
              <h3 style={styles.chartTitle}>Vehicle Activity Over Time</h3>
              <div style={{ height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={getVehicleActivityData()}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        return [value, name === 'active' ? 'Active Vehicles' : 
                                     name === 'maintenance' ? 'In Maintenance' : 
                                     'Inactive Vehicles'];
                      }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="active" stackId="1" stroke="#8884d8" fill="#8884d8" name="Active" />
                    <Area type="monotone" dataKey="maintenance" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Maintenance" />
                    <Area type="monotone" dataKey="inactive" stackId="1" stroke="#ffc658" fill="#ffc658" name="Inactive" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Activity and Quick Actions - Side by Side */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
            gap: '24px', 
            marginBottom: '24px'
          }}>
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Recent Activity</h3>
              <div style={styles.activityList}>
                {overdueCount > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {overdueSchedules.slice(0, 3).map(schedule => (
                      <li key={schedule.id} style={styles.activityItem}>
                        <Link to={`/maintenance/schedules/${schedule.id}`} style={styles.activityLink}>
                          <span style={{ color: '#f44336', fontWeight: 'bold' }}>Overdue:</span> {schedule.description || 'Maintenance'} ({new Date(schedule.scheduledDate).toLocaleDateString()})
                        </Link>
                      </li>
                    ))}
                    {overdueCount > 3 && (
                      <li style={styles.activityItem}>
                        <Link to="/maintenance/schedules" style={styles.activityLink}>
                          ...and {overdueCount - 3} more overdue items
                        </Link>
                      </li>
                    )}
                  </ul>
                ) : upcomingCount > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {upcomingSchedules.slice(0, 3).map(schedule => (
                      <li key={schedule.id} style={styles.activityItem}>
                        <Link to={`/maintenance/schedules/${schedule.id}`} style={styles.activityLink}>
                          <span style={{ color: '#ff9800', fontWeight: 'bold' }}>Upcoming:</span> {schedule.description || 'Maintenance'} ({new Date(schedule.scheduledDate).toLocaleDateString()})
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No recent activities</p>
                )}
              </div>
            </div>
            
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Quick Actions</h3>
              <div style={styles.actionButtons}>
                <Link to="/vehicles/new" style={{...styles.btn, ...styles.btnPrimary}}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                  Add Vehicle
                </Link>
                <Link to="/maintenance/schedules/new" style={{...styles.btn, ...styles.btnSecondary}}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  Schedule Maintenance
                </Link>
                <Link to="/simulator" style={{...styles.btn, ...styles.btnTertiary}}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                  Run Simulation
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard; 