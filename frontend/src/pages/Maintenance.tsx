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
    },
    header: {
      marginBottom: '30px',
    },
    title: {
      margin: '0 0 10px 0',
    },
    subtitle: {
      color: 'var(--text-secondary)',
      margin: 0,
      fontWeight: 'normal',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '20px',
      marginBottom: '30px',
    },
    card: {
      backgroundColor: 'var(--background-secondary)',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '15px',
    },
    cardTitle: {
      margin: 0,
      fontSize: '18px',
    },
    cardValue: {
      fontSize: '24px',
      fontWeight: 'bold',
    },
    section: {
      marginBottom: '30px',
    },
    sectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '15px',
    },
    button: {
      padding: '8px 16px',
      backgroundColor: 'var(--primary-color)',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    secondaryButton: {
      padding: '8px 16px',
      backgroundColor: 'transparent',
      color: 'var(--primary-color)',
      border: '1px solid var(--primary-color)',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    scheduleList: {
      marginTop: '15px',
    },
    scheduleItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px',
      borderBottom: '1px solid #ddd',
      cursor: 'pointer',
    },
    scheduleInfo: {
      display: 'flex',
      flexDirection: 'column' as const,
    },
    scheduleTitle: {
      fontWeight: 'bold',
      marginBottom: '5px',
    },
    scheduleDetails: {
      display: 'flex',
      gap: '15px',
      fontSize: '14px',
      color: 'var(--text-secondary)',
    },
    badge: {
      padding: '3px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      display: 'inline-block',
    },
    loading: {
      textAlign: 'center' as const,
      padding: '20px',
    },
    error: {
      color: 'var(--error-color)',
      padding: '10px',
      margin: '10px 0',
      borderRadius: '4px',
      backgroundColor: 'rgba(244, 67, 54, 0.1)',
    },
    emptyState: {
      textAlign: 'center' as const,
      padding: '20px',
      color: 'var(--text-secondary)',
    },
    chartContainer: {
      height: '250px',
      marginTop: '20px',
    }
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
          <h2>Maintenance Overview</h2>
        </div>
        
        {statsLoading ? (
          <div style={styles.loading}>Loading statistics...</div>
        ) : statsError ? (
          <div style={styles.error}>{statsError}</div>
        ) : stats ? (
          <div style={styles.grid}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Total Records</h3>
              </div>
              <div style={styles.cardValue}>
                {Object.values(stats.countByType).reduce((sum, count) => sum + count, 0)}
              </div>
            </div>
            
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Total Cost</h3>
              </div>
              <div style={styles.cardValue}>
                ${stats.totalCost.toFixed(2)}
              </div>
            </div>
            
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Completed</h3>
              </div>
              <div style={styles.cardValue}>
                {stats.countByStatus.completed || 0}
              </div>
            </div>
            
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>In Progress</h3>
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
          <h2>Maintenance Records</h2>
          <button style={styles.button} onClick={handleRecordsClick}>
            View All Records
          </button>
        </div>
        <p>
          View and manage completed or in-progress maintenance activities for your vehicles.
          Track costs, maintenance types, and service providers.
        </p>
        <div style={styles.grid}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>By Type</h3>
            </div>
            {statsLoading ? (
              <div>Loading...</div>
            ) : stats ? (
              <div>
                {Object.entries(stats.countByType).map(([type, count]) => (
                  <div key={type} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div>No data available</div>
            )}
          </div>
          
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>By Status</h3>
            </div>
            {statsLoading ? (
              <div>Loading...</div>
            ) : stats ? (
              <div>
                {Object.entries(stats.countByStatus).map(([status, count]) => (
                  <div key={status} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div>No data available</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Maintenance Schedules Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2>Maintenance Schedules</h2>
          <button style={styles.button} onClick={handleSchedulesClick}>
            View All Schedules
          </button>
        </div>
        <p>
          Plan and schedule upcoming maintenance activities for your vehicles.
          Track due dates, maintenance types, and assigned service providers.
        </p>
        
        {/* Overdue Maintenance */}
        <div style={{...styles.card, marginBottom: '20px', borderLeft: '4px solid #d32f2f'}}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Overdue Maintenance</h3>
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
                  style={styles.scheduleItem}
                  onClick={() => handleScheduleClick(schedule.id)}
                >
                  <div style={styles.scheduleInfo}>
                    <div style={styles.scheduleTitle}>
                      {schedule.type.charAt(0).toUpperCase() + schedule.type.slice(1)} - Vehicle {schedule.vehicleId}
                    </div>
                    <div style={styles.scheduleDetails}>
                      <span>Due: {formatDate(schedule.scheduledDate)}</span>
                      {schedule.assignedTo && <span>Assigned to: {schedule.assignedTo}</span>}
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
                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                  <button style={styles.secondaryButton} onClick={handleSchedulesClick}>
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
        <div style={{...styles.card, borderLeft: '4px solid #2196f3'}}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Upcoming Maintenance (Next 30 Days)</h3>
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
                  style={styles.scheduleItem}
                  onClick={() => handleScheduleClick(schedule.id)}
                >
                  <div style={styles.scheduleInfo}>
                    <div style={styles.scheduleTitle}>
                      {schedule.type.charAt(0).toUpperCase() + schedule.type.slice(1)} - Vehicle {schedule.vehicleId}
                    </div>
                    <div style={styles.scheduleDetails}>
                      <span>Due: {formatDate(schedule.scheduledDate)}</span>
                      {schedule.assignedTo && <span>Assigned to: {schedule.assignedTo}</span>}
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
                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                  <button style={styles.secondaryButton} onClick={handleSchedulesClick}>
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