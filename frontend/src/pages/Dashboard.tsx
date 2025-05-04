import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { AppDispatch, RootState } from '../redux/store';
import { fetchVehicles } from '../redux/slices/vehicleSlice';
import { fetchAnalyticsData } from '../redux/slices/analyticsSlice';
import { fetchUpcomingSchedules, fetchOverdueSchedules, updateOverdueSchedules } from '../redux/slices/maintenanceScheduleSlice';
import { CSSProperties } from 'react';

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

  // Define styles as React inline style objects
  const styles: Record<string, CSSProperties> = {
    dashboardContainer: {
      padding: '20px',
    },
    dashboardCards: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
      gap: '20px',
      marginBottom: '20px',
    },
    dashboardCard: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'flex-start' as const,
      padding: '20px',
    },
    dashboardValue: {
      fontSize: '2rem',
      fontWeight: 'bold',
      margin: '10px 0',
      color: 'var(--primary-color)',
    },
    emergencyValue: {
      fontSize: '2rem',
      fontWeight: 'bold',
      margin: '10px 0',
      color: overdueCount > 0 ? '#f44336' : 'var(--primary-color)', // Red if overdue items exist
    },
    activityList: {
      marginTop: '10px',
    },
    actionButtons: {
      display: 'flex',
      gap: '10px',
      marginTop: '10px',
    },
    btn: {
      padding: '8px 16px',
      borderRadius: '4px',
      fontWeight: 'bold',
      cursor: 'pointer',
      textDecoration: 'none',
    },
    btnPrimary: {
      backgroundColor: 'var(--primary-color)',
      color: 'white',
    },
    btnSecondary: {
      backgroundColor: 'var(--secondary-color)',
      color: 'white',
    },
    btnTertiary: {
      backgroundColor: 'var(--background-secondary)',
      color: 'var(--text-primary)',
      border: '1px solid var(--text-secondary)',
    },
    badge: {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '10px',
      fontSize: '0.8rem',
      fontWeight: 'bold',
      color: 'white',
      backgroundColor: '#f44336',
      marginLeft: '8px',
    }
  };

  return (
    <div style={styles.dashboardContainer}>
      <h1>Fleet Dashboard</h1>
      
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div style={styles.dashboardCards}>
            <div className="card" style={styles.dashboardCard}>
              <h3>Total Vehicles</h3>
              <p style={styles.dashboardValue}>{analytics.totalVehicles || (Array.isArray(vehicles) ? vehicles.length : 0)}</p>
              <Link to="/vehicles">View All</Link>
            </div>
            
            <div className="card" style={styles.dashboardCard}>
              <h3>Active Vehicles</h3>
              <p style={styles.dashboardValue}>{analytics.activeVehicles || (Array.isArray(vehicles) ? vehicles.filter(v => v.status === 'active').length : 0)}</p>
            </div>
            
            <div className="card" style={styles.dashboardCard}>
              <h3>Maintenance Due</h3>
              <p style={styles.emergencyValue}>
                {maintenanceDueCount}
                {overdueCount > 0 && (
                  <span style={styles.badge}>{overdueCount} overdue</span>
                )}
              </p>
              <Link to="/maintenance/schedules">View Schedule</Link>
            </div>
            
            <div className="card" style={styles.dashboardCard}>
              <h3>Analysis</h3>
              <p style={styles.dashboardValue}>View Reports</p>
              <Link to="/analytics">Analytics</Link>
            </div>
          </div>
          
          <div className="card">
            <h3>Recent Activity</h3>
            <div style={styles.activityList}>
              {overdueCount > 0 ? (
                <ul>
                  {overdueSchedules.slice(0, 3).map(schedule => (
                    <li key={schedule.id}>
                      <Link to={`/maintenance/schedules/${schedule.id}`}>
                        Overdue: {schedule.description || 'Maintenance'} ({new Date(schedule.scheduledDate).toLocaleDateString()})
                      </Link>
                    </li>
                  ))}
                  {overdueCount > 3 && (
                    <li>
                      <Link to="/maintenance/schedules">...and {overdueCount - 3} more overdue items</Link>
                    </li>
                  )}
                </ul>
              ) : upcomingCount > 0 ? (
                <ul>
                  {upcomingSchedules.slice(0, 3).map(schedule => (
                    <li key={schedule.id}>
                      <Link to={`/maintenance/schedules/${schedule.id}`}>
                        Upcoming: {schedule.description || 'Maintenance'} ({new Date(schedule.scheduledDate).toLocaleDateString()})
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No recent activities</p>
              )}
            </div>
          </div>
          
          <div className="card">
            <h3>Quick Actions</h3>
            <div style={styles.actionButtons}>
              <Link to="/vehicles/new" style={{...styles.btn, ...styles.btnPrimary}}>Add Vehicle</Link>
              <Link to="/maintenance/schedules/new" style={{...styles.btn, ...styles.btnSecondary}}>Schedule Maintenance</Link>
              <Link to="/simulator" style={{...styles.btn, ...styles.btnTertiary}}>Run Simulation</Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard; 