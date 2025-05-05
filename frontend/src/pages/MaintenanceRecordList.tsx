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
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
    },
    title: {
      margin: 0,
    },
    addButton: {
      padding: '8px 16px',
      backgroundColor: 'var(--primary-color)',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    filterContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '15px',
      marginBottom: '20px',
      padding: '15px',
      backgroundColor: 'var(--background-secondary)',
      borderRadius: '4px',
    },
    filterGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
    },
    label: {
      marginBottom: '5px',
      fontSize: '14px',
    },
    input: {
      padding: '8px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      minWidth: '150px',
    },
    select: {
      padding: '8px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      minWidth: '150px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      marginTop: '20px',
    },
    th: {
      padding: '12px 15px',
      textAlign: 'left' as const,
      backgroundColor: 'var(--background-secondary)',
      borderBottom: '1px solid #ddd',
      cursor: 'pointer',
    },
    td: {
      padding: '10px 15px',
      borderBottom: '1px solid #ddd',
    },
    pagination: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '20px',
    },
    pageButton: {
      padding: '5px 10px',
      margin: '0 5px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      background: 'none',
      cursor: 'pointer',
    },
    activePageButton: {
      backgroundColor: 'var(--primary-color)',
      color: 'white',
      border: '1px solid var(--primary-color)',
    },
    actions: {
      display: 'flex',
      gap: '8px',
    },
    actionButton: {
      padding: '5px 10px',
      borderRadius: '4px',
      cursor: 'pointer',
      border: 'none',
    },
    viewButton: {
      backgroundColor: '#2196f3',
      color: 'white',
    },
    editButton: {
      backgroundColor: '#ff9800',
      color: 'white',
    },
    deleteButton: {
      backgroundColor: '#f44336',
      color: 'white',
    },
    status: {
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
      padding: '20px',
      textAlign: 'center' as const,
    }
  };
  
  if (loading && records.length === 0) {
    return <div style={styles.loading}>Loading maintenance records...</div>;
  }
  
  if (error) {
    return <div style={styles.error}>{error}</div>;
  }
  
  const totalPages = Math.ceil(total / pagination.limit);
  const currentPage = Math.floor(pagination.skip / pagination.limit) + 1;
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Maintenance Records</h1>
        <button style={styles.addButton} onClick={handleAddRecord}>
          Add New Record
        </button>
      </div>
      
      <div style={styles.filterContainer}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Vehicle ID</label>
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
          <label style={styles.label}>Type</label>
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
          <label style={styles.label}>Status</label>
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
          <label style={styles.label}>Start Date</label>
          <input
            style={styles.input}
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
          />
        </div>
        
        <div style={styles.filterGroup}>
          <label style={styles.label}>End Date</label>
          <input
            style={styles.input}
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
          />
        </div>
      </div>
      
      {records.length === 0 ? (
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          No maintenance records found.
        </div>
      ) : (
        <>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th} onClick={() => handleSort('vehicleId')}>
                  Vehicle ID {sortConfig.sort === 'vehicleId' && (sortConfig.order === 'asc' ? '▲' : '▼')}
                </th>
                <th style={styles.th} onClick={() => handleSort('type')}>
                  Type {sortConfig.sort === 'type' && (sortConfig.order === 'asc' ? '▲' : '▼')}
                </th>
                <th style={styles.th} onClick={() => handleSort('performedAt')}>
                  Date {sortConfig.sort === 'performedAt' && (sortConfig.order === 'asc' ? '▲' : '▼')}
                </th>
                <th style={styles.th} onClick={() => handleSort('performedBy')}>
                  Performed By {sortConfig.sort === 'performedBy' && (sortConfig.order === 'asc' ? '▲' : '▼')}
                </th>
                <th style={styles.th} onClick={() => handleSort('cost')}>
                  Cost {sortConfig.sort === 'cost' && (sortConfig.order === 'asc' ? '▲' : '▼')}
                </th>
                <th style={styles.th} onClick={() => handleSort('status')}>
                  Status {sortConfig.sort === 'status' && (sortConfig.order === 'asc' ? '▲' : '▼')}
                </th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record: MaintenanceRecord) => {
                const statusInfo = getStatusInfo(record.status);
                
                return (
                  <tr key={record.id}>
                    <td style={styles.td}>{record.vehicleId}</td>
                    <td style={styles.td}>{getMaintenanceTypeLabel(record.type as MaintenanceType)}</td>
                    <td style={styles.td}>{formatDate(record.performedAt)}</td>
                    <td style={styles.td}>{record.performedBy || 'N/A'}</td>
                    <td style={styles.td}>${record.cost?.toFixed(2) || '0.00'}</td>
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
                          View
                        </button>
                        <button
                          style={{ ...styles.actionButton, ...styles.editButton }}
                          onClick={() => handleEdit(record.id)}
                        >
                          Edit
                        </button>
                        <button
                          style={{ ...styles.actionButton, ...styles.deleteButton }}
                          onClick={() => handleDelete(record.id)}
                        >
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
            <div>
              Showing {pagination.skip + 1} to {Math.min(pagination.skip + pagination.limit, total)} of {total} records
            </div>
            <div>
              <button
                style={styles.pageButton}
                disabled={currentPage === 1}
                onClick={() => handlePageChange(0)}
              >
                First
              </button>
              <button
                style={styles.pageButton}
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
                style={styles.pageButton}
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(pagination.skip + pagination.limit)}
              >
                Next
              </button>
              <button
                style={styles.pageButton}
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