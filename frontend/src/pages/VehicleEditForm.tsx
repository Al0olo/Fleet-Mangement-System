import { useState, useEffect, CSSProperties } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { AppDispatch, RootState } from '../redux/store';
import { fetchVehicleById, updateVehicle, UpdateVehiclePayload } from '../redux/slices/vehicleSlice';

const VehicleEditForm = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const { vehicle, loading, error } = useSelector((state: RootState) => state.vehicles);
  
  const [formData, setFormData] = useState<UpdateVehiclePayload>({
    id: id || '',
    model: '',
    type: 'truck',
    status: 'active',
    metadata: {
      manufacturer: '',
      year: new Date().getFullYear(),
      fuelType: 'diesel',
      capacity: 0,
      vin: ''
    }
  });
  
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch vehicle data when component mounts
  useEffect(() => {
    if (id) {
      dispatch(fetchVehicleById(id));
    }
  }, [dispatch, id]);
  
  // Update form data when vehicle data is loaded
  useEffect(() => {
    if (vehicle) {
      setFormData({
        id: vehicle.id,
        model: vehicle.model,
        type: vehicle.type,
        status: vehicle.status,
        metadata: {
          manufacturer: vehicle.metadata?.manufacturer || '',
          year: vehicle.metadata?.year || new Date().getFullYear(),
          fuelType: vehicle.metadata?.fuelType || 'diesel',
          capacity: vehicle.metadata?.capacity || 0,
          vin: vehicle.metadata?.vin || '',
        }
      });
    }
  }, [vehicle]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle metadata fields
    if (['manufacturer', 'year', 'fuelType', 'capacity', 'vin'].includes(name)) {
      setFormData({
        ...formData,
        metadata: {
          ...formData.metadata,
          [name]: ['year', 'capacity'].includes(name) ? Number(value) : value
        }
      });
    } else {
      // Handle top-level fields
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');
    
    try {
      await dispatch(updateVehicle(formData)).unwrap();
      navigate(`/vehicles/${id}`);
    } catch (err) {
      setFormError('Failed to update vehicle. Please try again.');
      console.error('Update vehicle error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    navigate(`/vehicles/${id}`);
  };
  
  // Define styles
  const styles: Record<string, CSSProperties> = {
    formContainer: {
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto'
    },
    formHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    },
    form: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '20px'
    },
    fullWidth: {
      gridColumn: '1 / -1'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const
    },
    label: {
      marginBottom: '5px',
      fontWeight: 'bold'
    },
    input: {
      padding: '8px',
      border: '1px solid #ddd',
      borderRadius: '4px'
    },
    select: {
      padding: '8px',
      border: '1px solid #ddd',
      borderRadius: '4px'
    },
    buttonsContainer: {
      gridColumn: '1 / -1',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
      marginTop: '20px'
    },
    cancelButton: {
      padding: '10px 20px',
      background: 'var(--background-secondary)',
      color: 'var(--text-primary)',
      border: '1px solid var(--text-secondary)',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    submitButton: {
      padding: '10px 20px',
      background: 'var(--primary-color)',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    errorMessage: {
      color: 'var(--error-color)',
      marginTop: '20px',
      gridColumn: '1 / -1'
    }
  };
  
  if (loading && !vehicle) {
    return <div>Loading vehicle data...</div>;
  }
  
  if (error) {
    return <div style={styles.errorMessage}>{error}</div>;
  }
  
  if (!id) {
    return <div style={styles.errorMessage}>Vehicle ID is required</div>;
  }
  
  return (
    <div style={styles.formContainer}>
      <div style={styles.formHeader}>
        <h1>Edit Vehicle</h1>
      </div>
      
      {formError && <p style={styles.errorMessage}>{formError}</p>}
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Model</label>
          <input
            type="text"
            name="model"
            value={formData.model}
            onChange={handleChange}
            placeholder="e.g. CAT 336"
            required
            style={styles.input}
          />
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            style={styles.select}
            required
          >
            <option value="truck">Truck</option>
            <option value="excavator">Excavator</option>
            <option value="loader">Loader</option>
            <option value="bulldozer">Bulldozer</option>
            <option value="crane">Crane</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            style={styles.select}
            required
          >
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
            <option value="retired">Retired</option>
          </select>
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Manufacturer</label>
          <input
            type="text"
            name="manufacturer"
            value={formData.metadata?.manufacturer}
            onChange={handleChange}
            placeholder="e.g. Caterpillar"
            style={styles.input}
          />
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Year</label>
          <input
            type="number"
            name="year"
            value={formData.metadata?.year}
            onChange={handleChange}
            min="1900"
            max={new Date().getFullYear() + 1}
            style={styles.input}
          />
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>VIN</label>
          <input
            type="text"
            name="vin"
            value={formData.metadata?.vin}
            onChange={handleChange}
            placeholder="Vehicle Identification Number"
            style={styles.input}
          />
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Fuel Type</label>
          <select
            name="fuelType"
            value={formData.metadata?.fuelType}
            onChange={handleChange}
            style={styles.select}
          >
            <option value="diesel">Diesel</option>
            <option value="gasoline">Gasoline</option>
            <option value="electric">Electric</option>
            <option value="hybrid">Hybrid</option>
            <option value="lpg">LPG</option>
            <option value="cng">CNG</option>
          </select>
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Capacity</label>
          <input
            type="number"
            name="capacity"
            value={formData.metadata?.capacity}
            onChange={handleChange}
            min="0"
            placeholder="Load capacity or engine size"
            style={styles.input}
          />
        </div>
        
        <div style={styles.buttonsContainer}>
          <button 
            type="button" 
            onClick={handleCancel} 
            style={styles.cancelButton}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            style={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Vehicle'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VehicleEditForm; 