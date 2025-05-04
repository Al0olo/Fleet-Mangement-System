import { useState, useEffect, FormEvent, CSSProperties } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { 
  createMaintenanceSchedule, 
  fetchMaintenanceScheduleById, 
  updateMaintenanceSchedule,
  clearMaintenanceSchedule,
  clearError
} from '../redux/slices/maintenanceScheduleSlice';
import { fetchVehicles } from '../redux/slices/vehicleSlice';
import { 
  MaintenanceType, 
  ScheduleStatus, 
  SchedulePriority, 
  CreateMaintenanceSchedulePayload 
} from '../types/maintenance';

const MaintenanceScheduleForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const vehicleIdFromQuery = queryParams.get('vehicleId');
  
  const isEditMode = !!id;
  
  const { schedule, loading, error } = useSelector((state: RootState) => state.maintenanceSchedules);
  const { vehicles } = useSelector((state: RootState) => state.vehicles);
  
  // Calculate default scheduled date (2 weeks from now)
  const getDefaultScheduledDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split('T')[0];
  };
  
  // Form state
  const [formData, setFormData] = useState<CreateMaintenanceSchedulePayload>({
    vehicleId: vehicleIdFromQuery || '',
    type: 'routine',
    description: '',
    scheduledDate: getDefaultScheduledDate(),
    assignedTo: '',
    estimatedCost: undefined,
    priority: 'medium',
    status: 'scheduled',
    notes: '',
    reminderSent: false
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load data for edit mode
  useEffect(() => {
    dispatch(fetchVehicles());
    
    if (isEditMode && id) {
      dispatch(fetchMaintenanceScheduleById(id));
    }
    
    return () => {
      dispatch(clearMaintenanceSchedule());
      dispatch(clearError());
    };
  }, [dispatch, isEditMode, id]);
  
  // Set form data when schedule is loaded in edit mode
  useEffect(() => {
    if (isEditMode && schedule) {
      setFormData({
        vehicleId: schedule.vehicleId,
        type: schedule.type,
        description: schedule.description || '',
        scheduledDate: new Date(schedule.scheduledDate).toISOString().split('T')[0],
        assignedTo: schedule.assignedTo || '',
        estimatedCost: schedule.estimatedCost,
        priority: schedule.priority,
        status: schedule.status,
        notes: schedule.notes || '',
        reminderSent: schedule.reminderSent || false
      });
    }
  }, [isEditMode, schedule]);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    // Handle checkbox (for reminderSent)
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: target.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? (value === '' ? undefined : parseFloat(value)) : value
      }));
    }
    
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
    
    if (!formData.scheduledDate) {
      errors.scheduledDate = 'Scheduled date is required';
    }
    
    // Validate estimated cost is a positive number
    if (formData.estimatedCost !== undefined && (isNaN(formData.estimatedCost) || formData.estimatedCost < 0)) {
      errors.estimatedCost = 'Estimated cost must be a positive number';
    }
    
    // Validate priority is selected
    if (!formData.priority) {
      errors.priority = 'Priority is required';
    }
    
    // Validate status is selected
    if (!formData.status) {
      errors.status = 'Status is required';
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
        await dispatch(updateMaintenanceSchedule({ id, ...formData })).unwrap();
        navigate(`/maintenance/schedules/${id}`);
      } else {
        const result = await dispatch(createMaintenanceSchedule(formData)).unwrap();
        navigate(`/maintenance/schedules/${result.data.id}`);
      }
    } catch (err) {
      setSubmitError(typeof err === 'string' ? err : 'Failed to save maintenance schedule');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get available maintenance types
  const maintenanceTypes: MaintenanceType[] = [
    'routine', 'repair', 'inspection', 'emergency', 'recall', 'other'
  ];
  
  // Get available status options
  const statusOptions: ScheduleStatus[] = [
    'scheduled', 'in-progress', 'completed', 'cancelled', 'overdue'
  ];
  
  // Get available priority options
  const priorityOptions: SchedulePriority[] = [
    'low', 'medium', 'high', 'critical'
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
    checkboxGroup: {
      display: 'flex',
      alignItems: 'center',
      marginTop: '10px',
    },
    checkbox: {
      marginRight: '10px',
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
    return <div style={styles.loading}>Loading maintenance schedule...</div>;
  }
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          {isEditMode ? 'Edit Maintenance Schedule' : 'Add New Maintenance Schedule'}
        </h1>
        <button
          style={styles.backButton}
          onClick={() => navigate('/maintenance/schedules')}
        >
          Back to Schedules
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
        
        {/* Scheduled Date */}
        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="scheduledDate">
            Scheduled Date*
          </label>
          <input
            type="date"
            id="scheduledDate"
            name="scheduledDate"
            value={formData.scheduledDate}
            onChange={handleChange}
            style={styles.input}
            required
            disabled={isSubmitting}
          />
          {formErrors.scheduledDate && (
            <span style={styles.error}>{formErrors.scheduledDate}</span>
          )}
        </div>
        
        {/* Priority */}
        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="priority">
            Priority*
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            style={styles.select}
            required
            disabled={isSubmitting}
          >
            {priorityOptions.map(priority => (
              <option key={priority} value={priority}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </option>
            ))}
          </select>
          {formErrors.priority && (
            <span style={styles.error}>{formErrors.priority}</span>
          )}
        </div>
        
        {/* Status */}
        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="status">
            Status*
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            style={styles.select}
            required
            disabled={isSubmitting}
          >
            {statusOptions.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
              </option>
            ))}
          </select>
          {formErrors.status && (
            <span style={styles.error}>{formErrors.status}</span>
          )}
        </div>
        
        {/* Assigned To */}
        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="assignedTo">
            Assigned To
          </label>
          <input
            type="text"
            id="assignedTo"
            name="assignedTo"
            value={formData.assignedTo}
            onChange={handleChange}
            style={styles.input}
            placeholder="Technician or service provider"
            disabled={isSubmitting}
          />
        </div>
        
        {/* Estimated Cost */}
        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="estimatedCost">
            Estimated Cost
          </label>
          <input
            type="number"
            id="estimatedCost"
            name="estimatedCost"
            value={formData.estimatedCost === undefined ? '' : formData.estimatedCost}
            onChange={handleChange}
            style={styles.input}
            placeholder="Estimated maintenance cost"
            min="0"
            step="0.01"
            disabled={isSubmitting}
          />
          {formErrors.estimatedCost && (
            <span style={styles.error}>{formErrors.estimatedCost}</span>
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
            placeholder="Detailed description of maintenance to be performed"
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
            placeholder="Additional notes or instructions"
            disabled={isSubmitting}
          />
        </div>
        
        {/* Reminder Sent Checkbox */}
        <div style={{...styles.formGroup, ...styles.fullWidth}}>
          <div style={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="reminderSent"
              name="reminderSent"
              checked={formData.reminderSent}
              onChange={handleChange}
              style={styles.checkbox}
              disabled={isSubmitting}
            />
            <label htmlFor="reminderSent">
              Reminder has been sent
            </label>
          </div>
        </div>
        
        {/* Form Actions */}
        <div style={{...styles.buttonGroup, ...styles.fullWidth}}>
          <button
            type="button"
            style={styles.cancelButton}
            onClick={() => navigate('/maintenance/schedules')}
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
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update Schedule' : 'Create Schedule'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MaintenanceScheduleForm; 