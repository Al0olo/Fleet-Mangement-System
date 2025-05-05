import { useState, useEffect, CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { 
  fetchMaintenanceRecordById, 
  deleteMaintenanceRecord,
  clearMaintenanceRecord 
} from '../redux/slices/maintenanceRecordSlice';
import { fetchVehicleById } from '../redux/slices/vehicleSlice';
import { MaintenanceRecord, MaintenanceType, MaintenanceStatus } from '../types/maintenance';

const MaintenanceRecordDetail = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useParams<{ id: string }>();
  
  const { record, loading, error } = useSelector((state: RootState) => state.maintenanceRecords);
  const { vehicle } = useSelector((state: RootState) => state.vehicles);
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // Fetch record data
  useEffect(() => {
    if (id) {
      dispatch(fetchMaintenanceRecordById(id));
    }
    
    // Cleanup on unmount
    return () => {
      dispatch(clearMaintenanceRecord());
    };
  }, [dispatch, id]);
  
  // Fetch vehicle data when record is loaded
  useEffect(() => {
    if (record?.vehicleId) {
      dispatch(fetchVehicleById(record.vehicleId));
    }
  }, [dispatch, record?.vehicleId]);
  
  // Handle delete action
  const handleDelete = async () => {
    if (!id) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to delete this maintenance record? This action cannot be undone.'
    );
    
    if (!confirmed) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      await dispatch(deleteMaintenanceRecord(id)).unwrap();
      navigate('/maintenance/records');
    } catch (err) {
      setDeleteError(typeof err === 'string' ? err : 'Failed to delete maintenance record');
      setIsDeleting(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  // Get maintenance type display name
  const getMaintenanceTypeLabel = (type: MaintenanceType) => {
    const typeLabels: Record<MaintenanceType, string> = {
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
  
  // Styles
  const styles: Record<string, CSSProperties> = {
    container: {
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
    },
    header: {
      marginBottom: '30px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      margin: 0,
      color: 'var(--text-primary)',
    },
    backButton: {
      padding: '8px 16px',
      backgroundColor: 'var(--background-secondary)',
      color: 'var(--text-primary)',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    buttonGroup: {
      display: 'flex',
      gap: '10px',
      marginTop: '20px',
    },
    editButton: {
      padding: '8px 16px',
      backgroundColor: '#ff9800',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    deleteButton: {
      padding: '8px 16px',
      backgroundColor: '#f44336',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    disabledButton: {
      opacity: 0.7,
      cursor: 'not-allowed',
    },
    detailCard: {
      padding: '20px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      backgroundColor: 'var(--background-card)',
      marginBottom: '20px',
    },
    detailGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
    },
    fullWidth: {
      gridColumn: '1 / -1',
    },
    detailRow: {
      marginBottom: '15px',
    },
    detailLabel: {
      fontWeight: 'bold',
      marginBottom: '5px',
      color: 'var(--text-secondary)',
    },
    detailValue: {
      fontSize: '16px',
    },
    errorMessage: {
      padding: '10px',
      backgroundColor: 'rgba(244, 67, 54, 0.1)',
      color: '#f44336',
      borderRadius: '4px',
      marginBottom: '20px',
    },
    loading: {
      textAlign: 'center' as const,
      padding: '50px',
      color: 'var(--text-secondary)',
    },
    statusBadge: {
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: '12px',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '14px',
    },
    cost: {
      fontWeight: 'bold',
      fontSize: '18px',
      color: 'var(--primary-color)',
    },
    notes: {
      whiteSpace: 'pre-wrap' as const,
      fontSize: '16px',
      lineHeight: '1.6',
    },
  };
  
  if (loading) {
    return <div style={styles.loading}>Loading maintenance record...</div>;
  }
  
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorMessage}>
          <p>{error}</p>
          <button
            style={styles.backButton}
            onClick={() => navigate('/maintenance/records')}
          >
            Back to Records
          </button>
        </div>
      </div>
    );
  }
  
  if (!record) {
    return (
      <div style={styles.container}>
        <div style={styles.errorMessage}>
          <p>Record not found</p>
          <button
            style={styles.backButton}
            onClick={() => navigate('/maintenance/records')}
          >
            Back to Records
          </button>
        </div>
      </div>
    );
  }
  
  const { type, description, performedAt, performedBy, cost, notes, status } = record;
  const statusInfo = getStatusInfo(status);
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Maintenance Record Details</h1>
        <button
          style={styles.backButton}
          onClick={() => navigate('/maintenance/records')}
        >
          Back to Records
        </button>
      </div>
      
      {deleteError && (
        <div style={styles.errorMessage}>
          {deleteError}
        </div>
      )}
      
      <div style={styles.detailCard}>
        <div style={styles.detailGrid}>
          <div style={styles.detailRow}>
            <div style={styles.detailLabel}>Vehicle</div>
            <div style={styles.detailValue}>
              {vehicle ? (
                `${vehicle.model} (${vehicle.metadata?.vin || 'No VIN'})`
              ) : (
                `ID: ${record.vehicleId}`
              )}
            </div>
          </div>
          
          <div style={styles.detailRow}>
            <div style={styles.detailLabel}>Maintenance Type</div>
            <div style={styles.detailValue}>{getMaintenanceTypeLabel(type)}</div>
          </div>
          
          <div style={styles.detailRow}>
            <div style={styles.detailLabel}>Status</div>
            <div>
              <span 
                style={{
                  ...styles.statusBadge,
                  backgroundColor: statusInfo.color,
                }}
              >
                {statusInfo.label}
              </span>
            </div>
          </div>
          
          <div style={styles.detailRow}>
            <div style={styles.detailLabel}>Date Performed</div>
            <div style={styles.detailValue}>{formatDate(performedAt)}</div>
          </div>
          
          <div style={styles.detailRow}>
            <div style={styles.detailLabel}>Performed By</div>
            <div style={styles.detailValue}>{performedBy || '-'}</div>
          </div>
          
          <div style={styles.detailRow}>
            <div style={styles.detailLabel}>Cost</div>
            <div style={styles.cost}>
              {cost !== undefined ? `$${cost.toFixed(2)}` : '-'}
            </div>
          </div>
          
          <div style={{...styles.detailRow, ...styles.fullWidth}}>
            <div style={styles.detailLabel}>Description</div>
            <div style={styles.detailValue}>{description || '-'}</div>
          </div>
          
          <div style={{...styles.detailRow, ...styles.fullWidth}}>
            <div style={styles.detailLabel}>Notes</div>
            <div style={styles.notes}>{notes || '-'}</div>
          </div>
        </div>
      </div>
      
      <div style={styles.detailCard}>
        <div style={styles.detailLabel}>Record Information</div>
        <div style={styles.detailGrid}>
          <div style={styles.detailRow}>
            <div style={styles.detailLabel}>Record ID</div>
            <div style={styles.detailValue}>{record.id}</div>
          </div>
          <div style={styles.detailRow}>
            <div style={styles.detailLabel}>Created</div>
            <div style={styles.detailValue}>
              {record.createdAt ? formatDate(record.createdAt) : '-'}
            </div>
          </div>
          <div style={styles.detailRow}>
            <div style={styles.detailLabel}>Last Updated</div>
            <div style={styles.detailValue}>
              {record.updatedAt ? formatDate(record.updatedAt) : '-'}
            </div>
          </div>
        </div>
      </div>
      
      <div style={styles.buttonGroup}>
        <button
          style={styles.editButton}
          onClick={() => navigate(`/maintenance/records/${id}/edit`)}
        >
          Edit Record
        </button>
        <button
          style={{
            ...styles.deleteButton,
            ...(isDeleting ? styles.disabledButton : {})
          }}
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete Record'}
        </button>
      </div>
    </div>
  );
};

export default MaintenanceRecordDetail; 