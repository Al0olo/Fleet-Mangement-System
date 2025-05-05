import { useState, useEffect, FormEvent, CSSProperties } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { 
  createMaintenanceRecord, 
  fetchMaintenanceRecordById, 
  updateMaintenanceRecord,
  clearMaintenanceRecord,
  clearError
} from '../redux/slices/maintenanceRecordSlice';
import { fetchVehicles } from '../redux/slices/vehicleSlice';
import { MaintenanceType, MaintenanceStatus, CreateMaintenanceRecordPayload } from '../types/maintenance';

const MaintenanceRecordForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const vehicleIdFromQuery = queryParams.get('vehicleId');
  
  const isEditMode = !!id;
  
  const { record, loading, error } = useSelector((state: RootState) => state.maintenanceRecords);
  const { vehicles } = useSelector((state: RootState) => state.vehicles);
  
  // Form state
  const [formData, setFormData] = useState<CreateMaintenanceRecordPayload>({
    vehicleId: vehicleIdFromQuery || '',
    type: 'routine',
    description: '',
    performedAt: new Date().toISOString().split('T')[0],
    performedBy: '',
    cost: undefined,
    notes: '',
    status: 'completed'
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load data for edit mode
  useEffect(() => {
    dispatch(fetchVehicles());
    
    if (isEditMode && id) {
      dispatch(fetchMaintenanceRecordById(id));
    }
    
    return () => {
      dispatch(clearMaintenanceRecord());
      dispatch(clearError());
    };
  }, [dispatch, isEditMode, id]);
  
  // Set form data when record is loaded in edit mode
  useEffect(() => {
    if (isEditMode && record) {
      setFormData({
        vehicleId: record.vehicleId,
        type: record.type,
        description: record.description || '',
        performedAt: new Date(record.performedAt).toISOString().split('T')[0],
        performedBy: record.performedBy || '',
        cost: record.cost,
        notes: record.notes || '',
        status: record.status
      });
    }
  }, [isEditMode, record]);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? undefined : parseFloat(value)) : value
    }));
    
    // Clear error for this field when user changes it
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.vehicleId) {
      errors.vehicleId = 'Vehicle is required';
    }
    
    if (!formData.type) {
      errors.type = 'Maintenance type is required';
    }
    
    if (!formData.performedAt) {
      errors.performedAt = 'Date performed is required';
    }
    
    if (formData.cost !== undefined && (isNaN(formData.cost) || formData.cost < 0)) {
      errors.cost = 'Cost must be a positive number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isEditMode && id) {
        await dispatch(updateMaintenanceRecord({ id, ...formData })).unwrap();
        navigate(`/maintenance/records/${id}`);
      } else {
        const result = await dispatch(createMaintenanceRecord(formData)).unwrap();
        navigate(`/maintenance/records/${result.data.id}`);
      }
    } catch (err) {
      setSubmitError(typeof err === 'string' ? err : 'Failed to save maintenance record');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get available maintenance types
  const maintenanceTypes: MaintenanceType[] = [
    'routine', 'repair', 'inspection', 'emergency', 'recall', 'other'
  ];
  
  // Get available status options
  const statusOptions: MaintenanceStatus[] = [
    'scheduled', 'in-progress', 'completed', 'cancelled'
  ];
  
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
    },
    backButton: {
      padding: '8px 16px',
      backgroundColor: 'var(--background-secondary)',
      color: 'var(--text-primary)',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    form: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
    },
    fullWidth: {
      gridColumn: '1 / -1',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
    },
    label: {
      marginBottom: '8px',
      fontWeight: 'bold',
    },
    input: {
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '16px',
    },
    select: {
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '16px',
      backgroundColor: 'white',
    },
    textarea: {
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '16px',
      minHeight: '100px',
      resize: 'vertical' as const,
    },
    error: {
      color: 'var(--error-color)',
      fontSize: '14px',
      marginTop: '4px',
    },
    submitError: {
      padding: '10px',
      backgroundColor: 'rgba(244, 67, 54, 0.1)',
      color: 'var(--error-color)',
      borderRadius: '4px',
      marginBottom: '20px',
    },
    submitButton: {
      padding: '12px 24px',
      backgroundColor: 'var(--primary-color)',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 'bold',
    },
    disabled: {
      opacity: 0.7,
      cursor: 'not-allowed',
    },
    buttonGroup: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
      marginTop: '20px',
    },
    cancelButton: {
      padding: '12px 24px',
      backgroundColor: 'var(--background-secondary)',
      color: 'var(--text-primary)',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '16px',
    },
    loading: {
      textAlign: 'center' as const,
      padding: '20px',
    },
  };
  
  if (loading && isEditMode) {
    return <div style={styles.loading}>Loading maintenance record...</div>;
  }
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          {isEditMode ? 'Edit Maintenance Record' : 'Add New Maintenance Record'}
        </h1>
        <button
          style={styles.backButton}
          onClick={() => navigate('/maintenance/records')}
        >
          Back to Records
        </button>
      </div>
      
      {error && !submitError && (
        <div style={styles.submitError}>
          {error}
        </div>
      )}
      
      {submitError && (
        <div style={styles.submitError}>
          {submitError}
        </div>
      )}
      
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Vehicle Selection */}
        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="vehicleId">
            Vehicle*
          </label>
          <select
            id="vehicleId"
            name="vehicleId"
            value={formData.vehicleId}
            onChange={handleChange}
            style={styles.select}
            required
            disabled={isSubmitting}
          >
            <option value="">Select a vehicle</option>
            {Array.isArray(vehicles) && vehicles.map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.model} ({vehicle.metadata?.manufacturer || ''} - {vehicle.metadata?.vin || 'No VIN'})
              </option>
            ))}
          </select>
          {formErrors.vehicleId && (
            <span style={styles.error}>{formErrors.vehicleId}</span>
          )}
        </div>
        
        {/* Maintenance Type */}
        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="type">
            Maintenance Type*
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            style={styles.select}
            required
            disabled={isSubmitting}
          >
            {maintenanceTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          {formErrors.type && (
            <span style={styles.error}>{formErrors.type}</span>
          )}
        </div>
        
        {/* Date Performed */}
        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="performedAt">
            Date Performed*
          </label>
          <input
            type="date"
            id="performedAt"
            name="performedAt"
            value={formData.performedAt}
            onChange={handleChange}
            style={styles.input}
            required
            disabled={isSubmitting}
          />
          {formErrors.performedAt && (
            <span style={styles.error}>{formErrors.performedAt}</span>
          )}
        </div>
        
        {/* Status */}
        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            style={styles.select}
            disabled={isSubmitting}
          >
            {statusOptions.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
              </option>
            ))}
          </select>
        </div>
        
        {/* Performed By */}
        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="performedBy">
            Performed By
          </label>
          <input
            type="text"
            id="performedBy"
            name="performedBy"
            value={formData.performedBy}
            onChange={handleChange}
            style={styles.input}
            placeholder="Technician or service provider"
            disabled={isSubmitting}
          />
        </div>
        
        {/* Cost */}
        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="cost">
            Cost
          </label>
          <input
            type="number"
            id="cost"
            name="cost"
            value={formData.cost === undefined ? '' : formData.cost}
            onChange={handleChange}
            style={styles.input}
            placeholder="Maintenance cost"
            min="0"
            step="0.01"
            disabled={isSubmitting}
          />
          {formErrors.cost && (
            <span style={styles.error}>{formErrors.cost}</span>
          )}
        </div>
        
        {/* Description */}
        <div style={{...styles.formGroup, ...styles.fullWidth}}>
          <label style={styles.label} htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            style={styles.textarea}
            placeholder="Detailed description of maintenance performed"
            disabled={isSubmitting}
          />
        </div>
        
        {/* Notes */}
        <div style={{...styles.formGroup, ...styles.fullWidth}}>
          <label style={styles.label} htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            style={styles.textarea}
            placeholder="Additional notes or observations"
            disabled={isSubmitting}
          />
        </div>
        
        {/* Form Actions */}
        <div style={{...styles.buttonGroup, ...styles.fullWidth}}>
          <button
            type="button"
            style={styles.cancelButton}
            onClick={() => navigate('/maintenance/records')}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              ...styles.submitButton,
              ...(isSubmitting ? styles.disabled : {})
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update Record' : 'Create Record'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MaintenanceRecordForm; 