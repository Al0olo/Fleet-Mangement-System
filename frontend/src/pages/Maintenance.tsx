import { useState, useEffect, CSSProperties } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../redux/store';
import { fetchMaintenanceStats } from '../redux/slices/maintenanceStatsSlice';
import { 
  fetchUpcomingSchedules, 
  fetchOverdueSchedules
} from '../redux/slices/maintenanceScheduleSlice';
import { ScheduleStatus, SchedulePriority } from '../types/maintenance';

const Maintenance = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const { stats, loading: statsLoading, error: statsError } = useSelector((state: RootState) => state.maintenanceStats);
  const { 
    upcomingSchedules, 
    overdueSchedules, 
    loading: schedulesLoading, 
    error: schedulesError 
  } = useSelector((state: RootState) => state.maintenanceSchedules);
  
  // State for hover effects
  const [hoveredScheduleId, setHoveredScheduleId] = useState<string | null>(null);
  
  useEffect(() => {
    dispatch(fetchMaintenanceStats());
    dispatch(fetchUpcomingSchedules({ days: 30 }));
    dispatch(fetchOverdueSchedules({}));
  }, [dispatch]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      scheduled: '#2196f3',
      'in-progress': '#ff9800',
      completed: '#4caf50',
      cancelled: '#f44336',
      overdue: '#d32f2f',
    };
    return statusColors[status] || '#757575';
  };
  
  // Get priority color
  const getPriorityColor = (priority: string) => {
    const priorityColors: Record<string, string> = {
      low: '#4caf50',
      medium: '#ff9800',
      high: '#f44336',
      critical: '#d32f2f',
    };
    return priorityColors[priority] || '#757575';
  };
  
  const handleRecordsClick = () => {
    navigate('/maintenance/records');
  };
  
  const handleSchedulesClick = () => {
    navigate('/maintenance/schedules');
  };
  
  const handleScheduleClick = (id: string) => {
    navigate(`/maintenance/schedules/${id}`);
  };
  
  // Define styles
  const styles: Record<string, CSSProperties> = {
    container: {
      padding: '20px',
      width: '100%',
      boxSizing: 'border-box' as const,
    },
    header: {
      marginBottom: '30px',
      borderBottom: '1px solid var(--border-color)',
      paddingBottom: '12px',
    },
    title: {
      margin: '0 0 10px 0',
      color: 'var(--text-primary)',
    },
    subtitle: {
      color: 'var(--text-secondary)',
      margin: 0,
      fontWeight: 'normal',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '24px',
      marginBottom: '30px',
    },
    card: {
      backgroundColor: 'var(--background-secondary)',
      borderRadius: '8px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      transition: 'all 0.2s ease',
      border: '1px solid var(--border-color)',
    },
    cardHover: {
      transform: 'translateY(-4px)',
      boxShadow: '0 6px 12px rgba(0,0,0,0.1)',
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
    },
    cardTitle: {
      margin: 0,
      fontSize: '18px',
      fontWeight: 'bold',
      color: 'var(--text-primary)',
    },
    cardValue: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: 'var(--primary-color)',
      marginTop: '10px',
    },
    section: {
      marginBottom: '40px',
    },
    sectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
      borderBottom: '1px solid var(--border-color)',
      paddingBottom: '8px',
    },
    sectionTitle: {
      margin: 0,
      fontSize: '20px',
      fontWeight: 'bold',
      color: 'var(--text-primary)',
    },
    sectionDescription: {
      color: 'var(--text-secondary)',
      marginBottom: '20px',
      lineHeight: '1.5',
    },
    button: {
      padding: '10px 16px',
      backgroundColor: 'var(--primary-color)',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 'bold',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      transition: 'all 0.2s ease',
    },
    secondaryButton: {
      padding: '8px 16px',
      backgroundColor: 'transparent',
      color: 'var(--primary-color)',
      border: '1px solid var(--primary-color)',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
    },
    scheduleList: {
      marginTop: '15px',
    },
    scheduleItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px',
      borderBottom: '1px solid var(--border-color)',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      borderRadius: '4px',
    },
    scheduleItemHover: {
      backgroundColor: 'rgba(0,0,0,0.02)',
    },
    scheduleInfo: {
      display: 'flex',
      flexDirection: 'column' as const,
    },
    scheduleTitle: {
      fontWeight: 'bold',
      marginBottom: '8px',
      color: 'var(--text-primary)',
    },
    scheduleDetails: {
      display: 'flex',
      gap: '15px',
      fontSize: '14px',
      color: 'var(--text-secondary)',
    },
    badge: {
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 'bold',
      display: 'inline-block',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    loading: {
      textAlign: 'center' as const,
      padding: '30px',
      color: 'var(--text-secondary)',
    },
    error: {
      color: 'var(--error-color)',
      padding: '15px',
      margin: '15px 0',
      borderRadius: '8px',
      backgroundColor: 'rgba(244, 67, 54, 0.1)',
      fontWeight: '500',
    },
    emptyState: {
      textAlign: 'center' as const,
      padding: '30px',
      color: 'var(--text-secondary)',
      backgroundColor: 'rgba(0,0,0,0.02)',
      borderRadius: '8px',
      fontWeight: '500',
    },
    chartContainer: {
      height: '250px',
      marginTop: '20px',
    },
    statItem: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: '1px solid var(--border-color)',
    },
    statName: {
      textTransform: 'capitalize',
      color: 'var(--text-secondary)',
    },
    statValue: {
      fontWeight: 'bold',
      color: 'var(--text-primary)',
    },
    overdueCard: {
      borderLeft: '4px solid #d32f2f',
      marginBottom: '24px',
    },
    upcomingCard: {
      borderLeft: '4px solid #2196f3',
    },
  };
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Maintenance Management</h1>
        <p style={styles.subtitle}>
          Manage maintenance records and schedules for your fleet
        </p>
      </div>
      
      {/* Quick Statistics */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Maintenance Overview</h2>
        </div>
        
        {statsLoading ? (
          <div style={styles.loading}>Loading statistics...</div>
        ) : statsError ? (
          <div style={styles.error}>{statsError}</div>
        ) : stats ? (
          <div style={styles.grid}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  Total Records
                </h3>
              </div>
              <div style={styles.cardValue}>
                {Object.values(stats.countByType).reduce((sum, count) => sum + count, 0)}
              </div>
            </div>
            
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                  Total Cost
                </h3>
              </div>
              <div style={styles.cardValue}>
                ${stats.totalCost.toFixed(2)}
              </div>
            </div>
            
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle', color: '#4caf50' }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  Completed
                </h3>
              </div>
              <div style={styles.cardValue}>
                {stats.countByStatus.completed || 0}
              </div>
            </div>
            
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle', color: '#ff9800' }}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  In Progress
                </h3>
              </div>
              <div style={styles.cardValue}>
                {stats.countByStatus['in-progress'] || 0}
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.emptyState}>No statistics available</div>
        )}
      </div>
      
      {/* Maintenance Records Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Maintenance Records</h2>
          <button style={styles.button} onClick={handleRecordsClick}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            View All Records
          </button>
        </div>
        <p style={styles.sectionDescription}>
          View and manage completed or in-progress maintenance activities for your vehicles.
          Track costs, maintenance types, and service providers.
        </p>
        <div style={styles.grid}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
                By Type
              </h3>
            </div>
            {statsLoading ? (
              <div style={styles.loading}>Loading...</div>
            ) : stats ? (
              <div>
                {Object.entries(stats.countByType).map(([type, count]) => (
                  <div key={type} style={styles.statItem}>
                    <span style={styles.statName}>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                    <span style={styles.statValue}>{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.emptyState}>No data available</div>
            )}
          </div>
          
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
                By Status
              </h3>
            </div>
            {statsLoading ? (
              <div style={styles.loading}>Loading...</div>
            ) : stats ? (
              <div>
                {Object.entries(stats.countByStatus).map(([status, count]) => (
                  <div key={status} style={styles.statItem}>
                    <span style={styles.statName}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                    <span style={styles.statValue}>{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.emptyState}>No data available</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Maintenance Schedules Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Maintenance Schedules</h2>
          <button style={styles.button} onClick={handleSchedulesClick}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            View All Schedules
          </button>
        </div>
        <p style={styles.sectionDescription}>
          Plan and schedule upcoming maintenance activities for your vehicles.
          Track due dates, maintenance types, and assigned service providers.
        </p>
        
        {/* Overdue Maintenance */}
        <div style={{...styles.card, ...styles.overdueCard}}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d32f2f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              Overdue Maintenance
            </h3>
            <span style={{
              ...styles.badge,
              backgroundColor: '#d32f2f20',
              color: '#d32f2f'
            }}>
              {schedulesLoading ? '...' : overdueSchedules.length}
            </span>
          </div>
          
          {schedulesLoading ? (
            <div style={styles.loading}>Loading overdue maintenance...</div>
          ) : schedulesError ? (
            <div style={styles.error}>{schedulesError}</div>
          ) : overdueSchedules.length > 0 ? (
            <div style={styles.scheduleList}>
              {overdueSchedules.slice(0, 5).map(schedule => (
                <div
                  key={schedule.id}
                  style={{
                    ...styles.scheduleItem,
                    ...(hoveredScheduleId === schedule.id ? styles.scheduleItemHover : {})
                  }}
                  onClick={() => handleScheduleClick(schedule.id)}
                  onMouseEnter={() => setHoveredScheduleId(schedule.id)}
                  onMouseLeave={() => setHoveredScheduleId(null)}
                >
                  <div style={styles.scheduleInfo}>
                    <div style={styles.scheduleTitle}>
                      {schedule.type.charAt(0).toUpperCase() + schedule.type.slice(1)} - Vehicle {schedule.vehicleId}
                    </div>
                    <div style={styles.scheduleDetails}>
                      <span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        Due: {formatDate(schedule.scheduledDate)}
                      </span>
                      {schedule.assignedTo && (
                        <span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                          {schedule.assignedTo}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: getPriorityColor(schedule.priority) + '20',
                    color: getPriorityColor(schedule.priority)
                  }}>
                    {schedule.priority.charAt(0).toUpperCase() + schedule.priority.slice(1)}
                  </span>
                </div>
              ))}
              {overdueSchedules.length > 5 && (
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <button style={styles.secondaryButton} onClick={handleSchedulesClick}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <polyline points="19 12 12 19 5 12"></polyline>
                    </svg>
                    View All Overdue ({overdueSchedules.length})
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={styles.emptyState}>No overdue maintenance</div>
          )}
        </div>
        
        {/* Upcoming Maintenance */}
        <div style={{...styles.card, ...styles.upcomingCard}}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2196f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Upcoming Maintenance (Next 30 Days)
            </h3>
            <span style={{
              ...styles.badge,
              backgroundColor: '#2196f320',
              color: '#2196f3'
            }}>
              {schedulesLoading ? '...' : upcomingSchedules.length}
            </span>
          </div>
          
          {schedulesLoading ? (
            <div style={styles.loading}>Loading upcoming maintenance...</div>
          ) : schedulesError ? (
            <div style={styles.error}>{schedulesError}</div>
          ) : upcomingSchedules.length > 0 ? (
            <div style={styles.scheduleList}>
              {upcomingSchedules.slice(0, 5).map(schedule => (
                <div
                  key={schedule.id}
                  style={{
                    ...styles.scheduleItem,
                    ...(hoveredScheduleId === schedule.id ? styles.scheduleItemHover : {})
                  }}
                  onClick={() => handleScheduleClick(schedule.id)}
                  onMouseEnter={() => setHoveredScheduleId(schedule.id)}
                  onMouseLeave={() => setHoveredScheduleId(null)}
                >
                  <div style={styles.scheduleInfo}>
                    <div style={styles.scheduleTitle}>
                      {schedule.type.charAt(0).toUpperCase() + schedule.type.slice(1)} - Vehicle {schedule.vehicleId}
                    </div>
                    <div style={styles.scheduleDetails}>
                      <span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        Due: {formatDate(schedule.scheduledDate)}
                      </span>
                      {schedule.assignedTo && (
                        <span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                          {schedule.assignedTo}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: getPriorityColor(schedule.priority) + '20',
                    color: getPriorityColor(schedule.priority)
                  }}>
                    {schedule.priority.charAt(0).toUpperCase() + schedule.priority.slice(1)}
                  </span>
                </div>
              ))}
              {upcomingSchedules.length > 5 && (
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <button style={styles.secondaryButton} onClick={handleSchedulesClick}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <polyline points="19 12 12 19 5 12"></polyline>
                    </svg>
                    View All Upcoming ({upcomingSchedules.length})
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={styles.emptyState}>No upcoming maintenance scheduled</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Maintenance; 