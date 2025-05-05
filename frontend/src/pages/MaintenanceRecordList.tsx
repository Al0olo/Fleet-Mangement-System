import { useState, useEffect, CSSProperties } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../redux/store';
import { fetchMaintenanceRecords, deleteMaintenanceRecord } from '../redux/slices/maintenanceRecordSlice';
import { MaintenanceRecord, MaintenanceType, MaintenanceStatus } from '../types/maintenance';

const MaintenanceRecordList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const { records, loading, error, total } = useSelector((state: RootState) => state.maintenanceRecords);
  
  const [filters, setFilters] = useState({
    vehicleId: '',
    type: '',
    status: '',
    startDate: '',
    endDate: '',
  });
  
  const [pagination, setPagination] = useState({
    limit: 10,
    skip: 0,
  });
  
  const [sortConfig, setSortConfig] = useState({
    sort: 'performedAt',
    order: 'desc',
  });
  
  // Fetch records on component mount and when filters/pagination/sort change
  useEffect(() => {
    const queryParams = {
      ...filters,
      ...pagination,
      ...sortConfig,
    };
    
    // Remove empty filter values
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] === '') {
        delete queryParams[key];
      }
    });
    
    dispatch(fetchMaintenanceRecords(queryParams));
  }, [dispatch, filters, pagination, sortConfig]);
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    // Reset pagination when filters change
    setPagination(prev => ({
      ...prev,
      skip: 0
    }));
  };
  
  const handleSort = (field: string) => {
    setSortConfig(prev => ({
      sort: field,
      order: prev.sort === field && prev.order === 'asc' ? 'desc' : 'asc',
    }));
  };
  
  const handlePageChange = (newSkip: number) => {
    setPagination(prev => ({
      ...prev,
      skip: newSkip
    }));
  };
  
  const handleView = (id: string) => {
    navigate(`/maintenance/records/${id}`);
  };
  
  const handleEdit = (id: string) => {
    navigate(`/maintenance/records/${id}/edit`);
  };
  
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this maintenance record?')) {
      try {
        await dispatch(deleteMaintenanceRecord(id)).unwrap();
      } catch (err) {
        console.error('Failed to delete record:', err);
      }
    }
  };
  
  const handleAddRecord = () => {
    navigate('/maintenance/records/new');
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Get maintenance type display name
  const getMaintenanceTypeLabel = (type: MaintenanceType) => {
    const typeLabels = {
      routine: 'Routine',
      repair: 'Repair',
      inspection: 'Inspection',
      emergency: 'Emergency',
      recall: 'Recall',
      other: 'Other',
    };
    return typeLabels[type] || type;
  };
  
  // Get status display name and color
  const getStatusInfo = (status: MaintenanceStatus) => {
    const statusMap = {
      scheduled: { label: 'Scheduled', color: '#2196f3' },
      'in-progress': { label: 'In Progress', color: '#ff9800' },
      completed: { label: 'Completed', color: '#4caf50' },
      cancelled: { label: 'Cancelled', color: '#f44336' },
    };
    return statusMap[status] || { label: status, color: '#757575' };
  };
  
  // Define styles
  const styles: Record<string, CSSProperties> = {
    container: {
      padding: '20px',
      width: '100%',
      boxSizing: 'border-box' as const,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      borderBottom: '1px solid var(--border-color)',
      paddingBottom: '12px',
    },
    title: {
      margin: 0,
      color: 'var(--text-primary)',
    },
    addButton: {
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
    filterContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '16px',
      marginBottom: '24px',
      padding: '20px',
      backgroundColor: 'var(--background-secondary)',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    filterGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      minWidth: '200px',
      flex: 1,
    },
    label: {
      marginBottom: '8px',
      fontSize: '14px',
      fontWeight: '500',
      color: 'var(--text-secondary)',
    },
    input: {
      padding: '10px 12px',
      border: '1px solid var(--border-color)',
      borderRadius: '4px',
      fontSize: '14px',
      width: '100%',
      transition: 'border-color 0.2s ease',
    },
    select: {
      padding: '10px 12px',
      border: '1px solid var(--border-color)',
      borderRadius: '4px',
      fontSize: '14px',
      width: '100%',
      backgroundColor: 'white',
    },
    dateInput: {
      padding: '9px 12px',
      border: '1px solid var(--border-color)',
      borderRadius: '4px',
      fontSize: '14px',
      width: '100%',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      marginTop: '20px',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      overflow: 'hidden',
    },
    th: {
      padding: '14px 16px',
      textAlign: 'left' as const,
      backgroundColor: 'var(--background-secondary)',
      borderBottom: '1px solid var(--border-color)',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      color: 'var(--text-secondary)',
      position: 'relative' as const,
      transition: 'background-color 0.2s ease',
    },
    thHover: {
      backgroundColor: 'var(--background-hover)',
    },
    sortIcon: {
      marginLeft: '4px',
      fontSize: '12px',
    },
    td: {
      padding: '12px 16px',
      borderBottom: '1px solid var(--border-color)',
      fontSize: '14px',
      verticalAlign: 'middle' as const,
    },
    trHover: {
      backgroundColor: 'rgba(0,0,0,0.02)',
    },
    pagination: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '24px',
      padding: '16px',
      backgroundColor: 'var(--background-secondary)',
      borderRadius: '8px',
      fontSize: '14px',
    },
    pageInfo: {
      color: 'var(--text-secondary)',
      fontWeight: '500',
    },
    pageControls: {
      display: 'flex',
      alignItems: 'center',
    },
    pageButton: {
      padding: '6px 12px',
      margin: '0 4px',
      border: '1px solid var(--border-color)',
      borderRadius: '4px',
      background: 'white',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontSize: '14px',
    },
    activePageButton: {
      backgroundColor: 'var(--primary-color)',
      color: 'white',
      border: '1px solid var(--primary-color)',
      fontWeight: 'bold',
    },
    disabledPageButton: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    actions: {
      display: 'flex',
      gap: '8px',
    },
    actionButton: {
      padding: '6px 12px',
      borderRadius: '4px',
      cursor: 'pointer',
      border: 'none',
      fontSize: '13px',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      transition: 'all 0.2s ease',
    },
    viewButton: {
      backgroundColor: '#2196f3',
      color: 'white',
      boxShadow: '0 1px 3px rgba(33, 150, 243, 0.3)',
    },
    editButton: {
      backgroundColor: '#ff9800',
      color: 'white',
      boxShadow: '0 1px 3px rgba(255, 152, 0, 0.3)',
    },
    deleteButton: {
      backgroundColor: '#f44336',
      color: 'white',
      boxShadow: '0 1px 3px rgba(244, 67, 54, 0.3)',
    },
    status: {
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '12px',
      display: 'inline-block',
      fontWeight: 'bold',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    loading: {
      textAlign: 'center' as const,
      padding: '40px',
      color: 'var(--text-secondary)',
      fontSize: '16px',
    },
    error: {
      color: 'var(--error-color)',
      padding: '20px',
      textAlign: 'center' as const,
      backgroundColor: 'rgba(244, 67, 54, 0.1)',
      borderRadius: '8px',
      margin: '20px 0',
      fontWeight: '500',
    },
    emptyState: {
      textAlign: 'center' as const,
      padding: '40px',
      color: 'var(--text-secondary)',
      backgroundColor: 'rgba(0,0,0,0.02)',
      borderRadius: '8px',
      margin: '20px 0',
      fontWeight: '500',
    },
    costValue: {
      fontWeight: '500',
      color: 'var(--text-primary)',
    }
  };
  
  // State for hover effects
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);
  
  if (loading && records.length === 0) {
    return <div style={styles.loading}>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}>
        <line x1="12" y1="2" x2="12" y2="6"></line>
        <line x1="12" y1="18" x2="12" y2="22"></line>
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
        <line x1="2" y1="12" x2="6" y2="12"></line>
        <line x1="18" y1="12" x2="22" y2="12"></line>
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
      </svg>
      <div>Loading maintenance records...</div>
    </div>;
  }
  
  if (error) {
    return <div style={styles.error}>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px', color: 'var(--error-color)' }}>
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <div>{error}</div>
    </div>;
  }
  
  const totalPages = Math.ceil(total / pagination.limit);
  const currentPage = Math.floor(pagination.skip / pagination.limit) + 1;
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Maintenance Records</h1>
        <button style={styles.addButton} onClick={handleAddRecord}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
          Add New Record
        </button>
      </div>
      
      <div style={styles.filterContainer}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            Vehicle ID
          </label>
          <input
            style={styles.input}
            type="text"
            name="vehicleId"
            value={filters.vehicleId}
            onChange={handleFilterChange}
            placeholder="Filter by Vehicle ID"
          />
        </div>
        
        <div style={styles.filterGroup}>
          <label style={styles.label}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            Type
          </label>
          <select
            style={styles.select}
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
          >
            <option value="">All Types</option>
            <option value="routine">Routine</option>
            <option value="repair">Repair</option>
            <option value="inspection">Inspection</option>
            <option value="emergency">Emergency</option>
            <option value="recall">Recall</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div style={styles.filterGroup}>
          <label style={styles.label}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Status
          </label>
          <select
            style={styles.select}
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        
        <div style={styles.filterGroup}>
          <label style={styles.label}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Start Date
          </label>
          <input
            style={styles.dateInput}
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
          />
        </div>
        
        <div style={styles.filterGroup}>
          <label style={styles.label}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            End Date
          </label>
          <input
            style={styles.dateInput}
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
          />
        </div>
      </div>
      
      {records.length === 0 ? (
        <div style={styles.emptyState}>
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', opacity: 0.5 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <p>No maintenance records found.</p>
          <button style={styles.addButton} onClick={handleAddRecord}>
            Add New Record
          </button>
        </div>
      ) : (
        <>
          <table style={styles.table}>
            <thead>
              <tr>
                <th 
                  style={{
                    ...styles.th,
                    ...(hoveredColumn === 'vehicleId' ? styles.thHover : {})
                  }}
                  onClick={() => handleSort('vehicleId')}
                  onMouseEnter={() => setHoveredColumn('vehicleId')}
                  onMouseLeave={() => setHoveredColumn(null)}
                >
                  Vehicle ID
                  <span style={styles.sortIcon}>
                    {sortConfig.sort === 'vehicleId' && (sortConfig.order === 'asc' ? '▲' : '▼')}
                  </span>
                </th>
                <th 
                  style={{
                    ...styles.th,
                    ...(hoveredColumn === 'type' ? styles.thHover : {})
                  }}
                  onClick={() => handleSort('type')}
                  onMouseEnter={() => setHoveredColumn('type')}
                  onMouseLeave={() => setHoveredColumn(null)}
                >
                  Type
                  <span style={styles.sortIcon}>
                    {sortConfig.sort === 'type' && (sortConfig.order === 'asc' ? '▲' : '▼')}
                  </span>
                </th>
                <th 
                  style={{
                    ...styles.th,
                    ...(hoveredColumn === 'performedAt' ? styles.thHover : {})
                  }}
                  onClick={() => handleSort('performedAt')}
                  onMouseEnter={() => setHoveredColumn('performedAt')}
                  onMouseLeave={() => setHoveredColumn(null)}
                >
                  Date
                  <span style={styles.sortIcon}>
                    {sortConfig.sort === 'performedAt' && (sortConfig.order === 'asc' ? '▲' : '▼')}
                  </span>
                </th>
                <th 
                  style={{
                    ...styles.th,
                    ...(hoveredColumn === 'performedBy' ? styles.thHover : {})
                  }}
                  onClick={() => handleSort('performedBy')}
                  onMouseEnter={() => setHoveredColumn('performedBy')}
                  onMouseLeave={() => setHoveredColumn(null)}
                >
                  Performed By
                  <span style={styles.sortIcon}>
                    {sortConfig.sort === 'performedBy' && (sortConfig.order === 'asc' ? '▲' : '▼')}
                  </span>
                </th>
                <th 
                  style={{
                    ...styles.th,
                    ...(hoveredColumn === 'cost' ? styles.thHover : {})
                  }}
                  onClick={() => handleSort('cost')}
                  onMouseEnter={() => setHoveredColumn('cost')}
                  onMouseLeave={() => setHoveredColumn(null)}
                >
                  Cost
                  <span style={styles.sortIcon}>
                    {sortConfig.sort === 'cost' && (sortConfig.order === 'asc' ? '▲' : '▼')}
                  </span>
                </th>
                <th 
                  style={{
                    ...styles.th,
                    ...(hoveredColumn === 'status' ? styles.thHover : {})
                  }}
                  onClick={() => handleSort('status')}
                  onMouseEnter={() => setHoveredColumn('status')}
                  onMouseLeave={() => setHoveredColumn(null)}
                >
                  Status
                  <span style={styles.sortIcon}>
                    {sortConfig.sort === 'status' && (sortConfig.order === 'asc' ? '▲' : '▼')}
                  </span>
                </th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record: MaintenanceRecord) => {
                const statusInfo = getStatusInfo(record.status);
                
                return (
                  <tr 
                    key={record.id} 
                    style={hoveredRow === record.id ? styles.trHover : {}}
                    onMouseEnter={() => setHoveredRow(record.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td style={styles.td}>{record.vehicleId}</td>
                    <td style={styles.td}>{getMaintenanceTypeLabel(record.type as MaintenanceType)}</td>
                    <td style={styles.td}>{formatDate(record.performedAt)}</td>
                    <td style={styles.td}>{record.performedBy || 'N/A'}</td>
                    <td style={styles.td}>
                      <span style={styles.costValue}>${record.cost?.toFixed(2) || '0.00'}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.status,
                        backgroundColor: statusInfo.color + '20',
                        color: statusInfo.color
                      }}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        <button
                          style={{ ...styles.actionButton, ...styles.viewButton }}
                          onClick={() => handleView(record.id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                          View
                        </button>
                        <button
                          style={{ ...styles.actionButton, ...styles.editButton }}
                          onClick={() => handleEdit(record.id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                          Edit
                        </button>
                        <button
                          style={{ ...styles.actionButton, ...styles.deleteButton }}
                          onClick={() => handleDelete(record.id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          <div style={styles.pagination}>
            <div style={styles.pageInfo}>
              Showing {pagination.skip + 1} to {Math.min(pagination.skip + pagination.limit, total)} of {total} records
            </div>
            <div style={styles.pageControls}>
              <button
                style={{
                  ...styles.pageButton, 
                  ...(currentPage === 1 ? styles.disabledPageButton : {})
                }}
                disabled={currentPage === 1}
                onClick={() => handlePageChange(0)}
              >
                First
              </button>
              <button
                style={{
                  ...styles.pageButton,
                  ...(currentPage === 1 ? styles.disabledPageButton : {})
                }}
                disabled={currentPage === 1}
                onClick={() => handlePageChange(Math.max(0, pagination.skip - pagination.limit))}
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show pages around current page
                let pageToShow = currentPage;
                if (currentPage < 3) {
                  pageToShow = i + 1;
                } else if (currentPage > totalPages - 2) {
                  pageToShow = totalPages - 4 + i;
                } else {
                  pageToShow = currentPage - 2 + i;
                }
                
                if (pageToShow > 0 && pageToShow <= totalPages) {
                  return (
                    <button
                      key={pageToShow}
                      style={{
                        ...styles.pageButton,
                        ...(pageToShow === currentPage ? styles.activePageButton : {})
                      }}
                      onClick={() => handlePageChange((pageToShow - 1) * pagination.limit)}
                    >
                      {pageToShow}
                    </button>
                  );
                }
                return null;
              })}
              <button
                style={{
                  ...styles.pageButton,
                  ...(currentPage === totalPages ? styles.disabledPageButton : {})
                }}
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(pagination.skip + pagination.limit)}
              >
                Next
              </button>
              <button
                style={{
                  ...styles.pageButton,
                  ...(currentPage === totalPages ? styles.disabledPageButton : {})
                }}
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange((totalPages - 1) * pagination.limit)}
              >
                Last
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MaintenanceRecordList; 