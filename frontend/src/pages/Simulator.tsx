import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { 
  fetchSimulations, 
  fetchSimulatedVehicles,
  fetchActiveTrips,
  startSimulation, 
  stopSimulation,
  pauseSimulation,
  createSimulation,
  deleteSimulation,
  createSimulatedVehicle,
  addExistingVehicle,
  createVehicleTrip,
  startVehicleTrip,
  completeVehicleTrip,
  setActiveSimulation,
  setActiveVehicle,
  SimulationConfig,
  SimulatedVehicle
} from '../redux/slices/simulatorSlice';
import { fetchVehicles } from '../redux/slices/vehicleSlice';

const Simulator = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    simulations, 
    vehicles, 
    trips,
    activeSimulation,
    activeVehicle,
    loading, 
    error 
  } = useSelector((state: RootState) => state.simulator);
  
  const { vehicles: realVehicles } = useSelector((state: RootState) => state.vehicles);
  
  const [newSimulation, setNewSimulation] = useState<Partial<SimulationConfig>>({
    name: '',
    region: {
      centerLat: 40.7128,
      centerLng: -74.0060,
      radiusKm: 10
    },
    vehicleCount: 5,
    updateFrequencyMs: 5000,
    probabilities: {
      maintenance: 0.05,
      idle: 0.1
    }
  });
  
  const [newVehicle, setNewVehicle] = useState<Partial<SimulatedVehicle>>({
    name: '',
    type: 'PASSENGER',
    location: {
      type: 'Point',
      coordinates: [-74.0060, 40.7128]
    }
  });
  
  const [activeTab, setActiveTab] = useState('simulations');
  const [showExistingVehicles, setShowExistingVehicles] = useState(false);
  const [selectedRealVehicleId, setSelectedRealVehicleId] = useState('');

  useEffect(() => {
    dispatch(fetchSimulations());
    dispatch(fetchSimulatedVehicles());
    dispatch(fetchActiveTrips());
    dispatch(fetchVehicles());
    
    // Set up polling interval for active trips and vehicles
    const interval = setInterval(() => {
      if (simulations.some(sim => sim.status === 'RUNNING')) {
        dispatch(fetchSimulatedVehicles());
        dispatch(fetchActiveTrips());
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleSimulationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'centerLat' || name === 'centerLng' || name === 'radiusKm') {
      setNewSimulation(prev => ({
        ...prev,
        region: {
          ...prev.region!,
          [name]: name === 'radiusKm' ? parseInt(value, 10) : parseFloat(value)
        }
      }));
    } else if (name === 'maintenance' || name === 'idle') {
      setNewSimulation(prev => ({
        ...prev,
        probabilities: {
          ...prev.probabilities!,
          [name]: parseFloat(value)
        }
      }));
    } else {
      setNewSimulation(prev => ({
        ...prev,
        [name]: name === 'vehicleCount' || name === 'updateFrequencyMs' ? parseInt(value, 10) : value,
      }));
    }
  };
  
  const handleVehicleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'longitude' || name === 'latitude') {
      setNewVehicle(prev => ({
        ...prev,
        location: {
          type: 'Point',
          coordinates: name === 'longitude' 
            ? [parseFloat(value), prev.location?.coordinates[1] || 0] 
            : [prev.location?.coordinates[0] || 0, parseFloat(value)]
        }
      }));
    } else {
      setNewVehicle(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCreateSimulation = () => {
    dispatch(createSimulation(newSimulation));
    setNewSimulation({
      name: '',
      region: {
        centerLat: 40.7128,
        centerLng: -74.0060,
        radiusKm: 10
      },
      vehicleCount: 5,
      updateFrequencyMs: 5000,
      probabilities: {
        maintenance: 0.05,
        idle: 0.1
      }
    });
  };
  
  const handleCreateVehicle = () => {
    dispatch(createSimulatedVehicle(newVehicle));
    setNewVehicle({
      name: '',
      type: 'PASSENGER',
      location: {
        type: 'Point',
        coordinates: [-74.0060, 40.7128]
      }
    });
  };
  
  const handleCreateTrip = (vehicleId: string) => {
    dispatch(createVehicleTrip({ vehicleId }));
  };
  
  const handleStartTrip = (tripId: string) => {
    dispatch(startVehicleTrip(tripId));
  };
  
  const handleCompleteTrip = (tripId: string) => {
    dispatch(completeVehicleTrip(tripId));
  };

  const handleStart = (id: string) => {
    dispatch(startSimulation(id));
  };

  const handleStop = (id: string) => {
    dispatch(stopSimulation(id));
  };
  
  const handlePause = (id: string) => {
    dispatch(pauseSimulation(id));
  };
  
  const handleDelete = (id: string) => {
    dispatch(deleteSimulation(id));
  };
  
  const handleSelectSimulation = (simulation: SimulationConfig) => {
    dispatch(setActiveSimulation(simulation));
    setActiveTab('vehicles');
  };
  
  const handleSelectVehicle = (vehicle: SimulatedVehicle) => {
    dispatch(setActiveVehicle(vehicle));
    setActiveTab('trips');
  };
  
  const getVehicleStatusClass = (status: string) => {
    switch(status) {
      case 'RUNNING': return 'status-running';
      case 'IDLE': return 'status-idle';
      case 'MAINTENANCE': return 'status-maintenance';
      default: return '';
    }
  };
  
  const getTripStatusClass = (status: string) => {
    switch(status) {
      case 'PLANNED': return 'status-planned';
      case 'IN_PROGRESS': return 'status-running';
      case 'COMPLETED': return 'status-completed';
      case 'CANCELLED': return 'status-cancelled';
      default: return '';
    }
  };

  const handleAddExistingVehicle = () => {
    if (selectedRealVehicleId) {
      dispatch(addExistingVehicle(selectedRealVehicleId));
      setSelectedRealVehicleId('');
    }
  };

  return (
    <div className="simulator-container">
      <h1>Simulation Control</h1>
      
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'simulations' ? 'active' : ''}`}
          onClick={() => setActiveTab('simulations')}
        >
          Simulations
        </button>
        <button 
          className={`tab ${activeTab === 'vehicles' ? 'active' : ''}`}
          onClick={() => setActiveTab('vehicles')}
          disabled={!activeSimulation}
        >
          Vehicles {activeSimulation && `(${activeSimulation.name})`}
        </button>
        <button 
          className={`tab ${activeTab === 'trips' ? 'active' : ''}`}
          onClick={() => setActiveTab('trips')}
          disabled={!activeVehicle}
        >
          Trips {activeVehicle && `(${activeVehicle.name})`}
        </button>
      </div>
      
      {activeTab === 'simulations' && (
        <>
          <div className="card">
            <h2>Create New Simulation</h2>
            <div className="form-group">
              <label htmlFor="name">Simulation Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={newSimulation.name}
                onChange={handleSimulationInputChange}
                placeholder="Enter simulation name"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="centerLat">Center Latitude</label>
                <input
                  type="number"
                  id="centerLat"
                  name="centerLat"
                  value={newSimulation.region?.centerLat}
                  onChange={handleSimulationInputChange}
                  step="0.0001"
                />
              </div>
              <div className="form-group">
                <label htmlFor="centerLng">Center Longitude</label>
                <input
                  type="number"
                  id="centerLng"
                  name="centerLng"
                  value={newSimulation.region?.centerLng}
                  onChange={handleSimulationInputChange}
                  step="0.0001"
                />
              </div>
              <div className="form-group">
                <label htmlFor="radiusKm">Radius (km)</label>
                <input
                  type="number"
                  id="radiusKm"
                  name="radiusKm"
                  value={newSimulation.region?.radiusKm}
                  onChange={handleSimulationInputChange}
                  min={1}
                  max={100}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="vehicleCount">Vehicle Count</label>
                <input
                  type="number"
                  id="vehicleCount"
                  name="vehicleCount"
                  value={newSimulation.vehicleCount}
                  onChange={handleSimulationInputChange}
                  min={1}
                  max={100}
                />
              </div>
              <div className="form-group">
                <label htmlFor="updateFrequencyMs">Update Interval (ms)</label>
                <input
                  type="number"
                  id="updateFrequencyMs"
                  name="updateFrequencyMs"
                  value={newSimulation.updateFrequencyMs}
                  onChange={handleSimulationInputChange}
                  min={1000}
                  step={1000}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="maintenance">Maintenance Probability</label>
                <input
                  type="number"
                  id="maintenance"
                  name="maintenance"
                  value={newSimulation.probabilities?.maintenance}
                  onChange={handleSimulationInputChange}
                  min={0}
                  max={1}
                  step={0.01}
                />
              </div>
              <div className="form-group">
                <label htmlFor="idle">Idle Probability</label>
                <input
                  type="number"
                  id="idle"
                  name="idle"
                  value={newSimulation.probabilities?.idle}
                  onChange={handleSimulationInputChange}
                  min={0}
                  max={1}
                  step={0.01}
                />
              </div>
            </div>
            <button 
              className="btn btn-primary"
              onClick={handleCreateSimulation}
              disabled={loading.simulations}
            >
              {loading.simulations ? 'Creating...' : 'Create Simulation'}
            </button>
          </div>

          {loading.simulations ? (
            <div>Loading simulations...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <div className="simulator-list">
              <h2>Simulations</h2>
              {simulations.length === 0 ? (
                <p>No simulations found. Create one to begin.</p>
              ) : (
                <div className="simulation-cards">
                  {simulations.map((simulation) => (
                    <div key={simulation._id} className="card simulation-card">
                      <div className={`simulation-status status-${simulation.status.toLowerCase()}`}>
                        {simulation.status}
                      </div>
                      <h3>{simulation.name}</h3>
                      <div className="simulation-details">
                        <div className="detail-item">
                          <span className="detail-label">Vehicles:</span>
                          <span>{simulation.vehiclesInSimulation}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Updates:</span>
                          <span>{simulation.updateFrequencyMs}ms</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Events:</span>
                          <span>{simulation.eventsGenerated}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Region:</span>
                          <span>{simulation.region.radiusKm}km radius</span>
                        </div>
                        {simulation.startedAt && (
                          <div className="detail-item">
                            <span className="detail-label">Started:</span>
                            <span>{new Date(simulation.startedAt).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                      <div className="simulation-actions">
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleSelectSimulation(simulation)}
                        >
                          Manage
                        </button>
                        {simulation.status === 'RUNNING' ? (
                          <>
                            <button
                              className="btn btn-warning"
                              onClick={() => handlePause(simulation._id)}
                            >
                              Pause
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => handleStop(simulation._id)}
                            >
                              Stop
                            </button>
                          </>
                        ) : simulation.status === 'PAUSED' ? (
                          <>
                            <button
                              className="btn btn-success"
                              onClick={() => handleStart(simulation._id)}
                            >
                              Resume
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => handleStop(simulation._id)}
                            >
                              Stop
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn btn-success"
                              onClick={() => handleStart(simulation._id)}
                            >
                              Start
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => handleDelete(simulation._id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
      
      {activeTab === 'vehicles' && activeSimulation && (
        <>
          <div className="card">
            <h2>Add Vehicle to {activeSimulation.name}</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="vehicleSource">Vehicle Source</label>
                <div className="toggle-buttons">
                  <button 
                    className={`toggle-btn ${!showExistingVehicles ? 'active' : ''}`}
                    onClick={() => setShowExistingVehicles(false)}
                  >
                    Create New
                  </button>
                  <button 
                    className={`toggle-btn ${showExistingVehicles ? 'active' : ''}`}
                    onClick={() => setShowExistingVehicles(true)}
                  >
                    Add Existing
                  </button>
                </div>
              </div>
            </div>
            
            {showExistingVehicles ? (
              // Existing vehicle selector form
              <>
                <div className="form-group">
                  <label htmlFor="existingVehicle">Select Existing Vehicle</label>
                  <select
                    id="existingVehicle"
                    value={selectedRealVehicleId}
                    onChange={(e) => setSelectedRealVehicleId(e.target.value)}
                  >
                    <option value="">Select a vehicle</option>
                    {realVehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.model} ({vehicle.metadata.manufacturer} {vehicle.metadata.year}) - {vehicle.id}
                      </option>
                    ))}
                  </select>
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={handleAddExistingVehicle}
                  disabled={!selectedRealVehicleId || loading.vehicles}
                >
                  {loading.vehicles ? 'Adding...' : 'Add to Simulation'}
                </button>
              </>
            ) : (
              // New vehicle form
              <>
                <div className="form-group">
                  <label htmlFor="vehicleName">Vehicle Name</label>
                  <input
                    type="text"
                    id="vehicleName"
                    name="name"
                    value={newVehicle.name}
                    onChange={handleVehicleInputChange}
                    placeholder="Enter vehicle name"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="vehicleType">Type</label>
                    <select
                      id="vehicleType"
                      name="type"
                      value={newVehicle.type}
                      onChange={handleVehicleInputChange}
                    >
                      <option value="PASSENGER">Passenger</option>
                      <option value="CARGO">Cargo</option>
                      <option value="HEAVY_DUTY">Heavy Duty</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="longitude">Longitude</label>
                    <input
                      type="number"
                      id="longitude"
                      name="longitude"
                      value={newVehicle.location?.coordinates[0]}
                      onChange={handleVehicleInputChange}
                      step="0.0001"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="latitude">Latitude</label>
                    <input
                      type="number"
                      id="latitude"
                      name="latitude"
                      value={newVehicle.location?.coordinates[1]}
                      onChange={handleVehicleInputChange}
                      step="0.0001"
                    />
                  </div>
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={handleCreateVehicle}
                  disabled={loading.vehicles}
                >
                  {loading.vehicles ? 'Adding...' : 'Add Vehicle'}
                </button>
              </>
            )}
          </div>
          
          <div className="simulator-list">
            <h2>Vehicles in Simulation</h2>
            {loading.vehicles ? (
              <div>Loading vehicles...</div>
            ) : vehicles.length === 0 ? (
              <p>No vehicles found. Add one to begin.</p>
            ) : (
              <div className="vehicle-cards">
                {vehicles.map((vehicle) => (
                  <div key={vehicle._id} className="card vehicle-card">
                    <div className={`vehicle-status ${getVehicleStatusClass(vehicle.status)}`}>
                      {vehicle.status}
                    </div>
                    <h3>{vehicle.name}</h3>
                    <div className="vehicle-details">
                      <div className="detail-item">
                        <span className="detail-label">Type:</span>
                        <span>{vehicle.type}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Speed:</span>
                        <span>{vehicle.speed} km/h</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Fuel:</span>
                        <span>{vehicle.fuelLevel}%</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Location:</span>
                        <span>{vehicle.location.coordinates[1].toFixed(4)}, {vehicle.location.coordinates[0].toFixed(4)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Last Updated:</span>
                        <span>{new Date(vehicle.lastUpdated).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <div className="vehicle-actions">
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleSelectVehicle(vehicle)}
                      >
                        View Trips
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleCreateTrip(vehicle.vehicleId)}
                        disabled={vehicle.status !== 'IDLE' || vehicle.currentTrip !== undefined}
                      >
                        Create Trip
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      
      {activeTab === 'trips' && activeVehicle && (
        <div className="simulator-list">
          <h2>Trips for {activeVehicle.name}</h2>
          {loading.trips ? (
            <div>Loading trips...</div>
          ) : (
            <div className="trip-cards">
              {trips
                .filter(trip => trip.vehicleId === activeVehicle.vehicleId)
                .map((trip) => (
                  <div key={trip._id} className="card trip-card">
                    <div className={`trip-status ${getTripStatusClass(trip.status)}`}>
                      {trip.status}
                    </div>
                    <h3>Trip {trip.tripId}</h3>
                    <div className="trip-details">
                      <div className="detail-item">
                        <span className="detail-label">Distance:</span>
                        <span>{trip.distanceKm} km</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Avg Speed:</span>
                        <span>{trip.averageSpeedKmh} km/h</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Start:</span>
                        <span>{trip.startLocation.coordinates[1].toFixed(4)}, {trip.startLocation.coordinates[0].toFixed(4)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">End:</span>
                        <span>{trip.endLocation.coordinates[1].toFixed(4)}, {trip.endLocation.coordinates[0].toFixed(4)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Waypoints:</span>
                        <span>{trip.waypoints.length}</span>
                      </div>
                      {trip.estimatedEndTime && (
                        <div className="detail-item">
                          <span className="detail-label">Est. End Time:</span>
                          <span>{new Date(trip.estimatedEndTime).toLocaleTimeString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="trip-actions">
                      {trip.status === 'PLANNED' && (
                        <button
                          className="btn btn-success"
                          onClick={() => handleStartTrip(trip.tripId)}
                        >
                          Start Trip
                        </button>
                      )}
                      {trip.status === 'IN_PROGRESS' && (
                        <button
                          className="btn btn-warning"
                          onClick={() => handleCompleteTrip(trip.tripId)}
                        >
                          Complete Trip
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              {trips.filter(trip => trip.vehicleId === activeVehicle.vehicleId).length === 0 && (
                <p>No trips found for this vehicle. Create one to begin.</p>
              )}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .simulator-container {
          padding: 20px;
        }
        
        .tabs {
          display: flex;
          margin-bottom: 20px;
          border-bottom: 1px solid #ddd;
        }
        
        .tab {
          padding: 10px 20px;
          cursor: pointer;
          background: none;
          border: none;
          font-weight: 500;
          color: var(--text-secondary);
        }
        
        .tab.active {
          color: var(--primary-color);
          border-bottom: 2px solid var(--primary-color);
        }
        
        .tab:disabled {
          color: #ccc;
          cursor: not-allowed;
        }
        
        .card {
          margin-bottom: 20px;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          background-color: var(--card-bg);
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        .form-row {
          display: flex;
          gap: 15px;
          margin-bottom: 15px;
        }
        
        .form-row .form-group {
          flex: 1;
          margin-bottom: 0;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: var(--text-secondary);
        }
        
        .form-group input,
        .form-group select {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: var(--input-bg);
          color: var(--text-primary);
        }
        
        .btn {
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: bold;
          cursor: pointer;
          border: none;
          transition: background-color 0.2s;
        }
        
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .btn-primary {
          background-color: var(--primary-color);
          color: white;
        }
        
        .btn-secondary {
          background-color: var(--background-secondary);
          color: var(--text-primary);
          border: 1px solid #ddd;
        }
        
        .btn-success {
          background-color: var(--success-color);
          color: white;
        }
        
        .btn-warning {
          background-color: var(--warning-color);
          color: white;
        }
        
        .btn-danger {
          background-color: var(--error-color);
          color: white;
        }
        
        .simulation-cards,
        .vehicle-cards,
        .trip-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        
        .simulation-card,
        .vehicle-card,
        .trip-card {
          position: relative;
          transition: transform 0.2s;
        }
        
        .simulation-card:hover,
        .vehicle-card:hover,
        .trip-card:hover {
          transform: translateY(-5px);
        }
        
        .simulation-status,
        .vehicle-status,
        .trip-status {
          position: absolute;
          top: 10px;
          right: 10px;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          text-transform: uppercase;
          font-weight: bold;
        }
        
        .status-running {
          background-color: var(--success-color);
          color: white;
        }
        
        .status-stopped,
        .status-cancelled {
          background-color: var(--error-color);
          color: white;
        }
        
        .status-paused,
        .status-planned {
          background-color: var(--warning-color);
          color: white;
        }
        
        .status-idle {
          background-color: var(--background-secondary);
          color: var(--text-primary);
        }
        
        .status-maintenance {
          background-color: var(--warning-color);
          color: white;
        }
        
        .status-completed {
          background-color: var(--success-color);
          color: white;
        }
        
        .simulation-details,
        .vehicle-details,
        .trip-details {
          margin: 15px 0;
        }
        
        .detail-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        
        .detail-label {
          font-weight: 500;
          color: var(--text-secondary);
        }
        
        .simulation-actions,
        .vehicle-actions,
        .trip-actions {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }
        
        .error-message {
          color: var(--error-color);
          margin: 20px 0;
        }
        
        .toggle-buttons {
          display: flex;
          width: 100%;
          margin-bottom: 10px;
        }
        
        .toggle-btn {
          flex: 1;
          padding: 8px;
          background-color: var(--background-secondary);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          cursor: pointer;
          text-align: center;
          transition: all 0.2s;
        }
        
        .toggle-btn:first-child {
          border-radius: 4px 0 0 4px;
        }
        
        .toggle-btn:last-child {
          border-radius: 0 4px 4px 0;
        }
        
        .toggle-btn.active {
          background-color: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }
      `}</style>
    </div>
  );
};

export default Simulator; 