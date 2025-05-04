import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { fetchSimulations, startSimulation, stopSimulation } from '../redux/slices/simulatorSlice';

const Simulator = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { simulations, loading, error } = useSelector((state: RootState) => state.simulator);
  const [newSimulation, setNewSimulation] = useState({
    name: '',
    vehicleCount: 5,
    updateInterval: 5000,
  });

  useEffect(() => {
    dispatch(fetchSimulations());
  }, [dispatch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewSimulation((prev) => ({
      ...prev,
      [name]: name === 'vehicleCount' || name === 'updateInterval' ? parseInt(value, 10) : value,
    }));
  };

  const handleStart = (id: string) => {
    dispatch(startSimulation(id));
  };

  const handleStop = (id: string) => {
    dispatch(stopSimulation(id));
  };

  return (
    <div className="simulator-container">
      <h1>Simulation Control</h1>

      <div className="card">
        <h2>Create New Simulation</h2>
        <div className="form-group">
          <label htmlFor="name">Simulation Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={newSimulation.name}
            onChange={handleInputChange}
            placeholder="Enter simulation name"
          />
        </div>
        <div className="form-group">
          <label htmlFor="vehicleCount">Number of Vehicles</label>
          <input
            type="number"
            id="vehicleCount"
            name="vehicleCount"
            value={newSimulation.vehicleCount}
            onChange={handleInputChange}
            min={1}
            max={100}
          />
        </div>
        <div className="form-group">
          <label htmlFor="updateInterval">Update Interval (ms)</label>
          <input
            type="number"
            id="updateInterval"
            name="updateInterval"
            value={newSimulation.updateInterval}
            onChange={handleInputChange}
            min={1000}
            step={1000}
          />
        </div>
        <button className="btn btn-primary">Create Simulation</button>
      </div>

      {loading ? (
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
                <div key={simulation.id} className="card simulation-card">
                  <div className={`simulation-status ${simulation.status}`}>
                    {simulation.status}
                  </div>
                  <h3>{simulation.name}</h3>
                  <div className="simulation-details">
                    <div className="detail-item">
                      <span className="detail-label">Vehicles:</span>
                      <span>{simulation.vehicleCount}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Interval:</span>
                      <span>{simulation.updateInterval}ms</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Created:</span>
                      <span>{new Date(simulation.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="simulation-actions">
                    {simulation.status === 'running' ? (
                      <button
                        className="btn btn-danger"
                        onClick={() => handleStop(simulation.id)}
                      >
                        Stop
                      </button>
                    ) : (
                      <button
                        className="btn btn-success"
                        onClick={() => handleStart(simulation.id)}
                      >
                        Start
                      </button>
                    )}
                    <button className="btn btn-secondary">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .simulator-container {
          padding: 20px;
        }
        
        .card {
          margin-bottom: 20px;
          padding: 20px;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }
        
        .form-group input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .btn {
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: bold;
          cursor: pointer;
          border: none;
        }
        
        .btn-primary {
          background-color: var(--primary-color);
          color: white;
        }
        
        .btn-success {
          background-color: var(--success-color);
          color: white;
        }
        
        .btn-danger {
          background-color: var(--error-color);
          color: white;
        }
        
        .btn-secondary {
          background-color: var(--background-secondary);
          color: var(--text-primary);
          border: 1px solid #ddd;
        }
        
        .simulation-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        
        .simulation-card {
          position: relative;
        }
        
        .simulation-status {
          position: absolute;
          top: 10px;
          right: 10px;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          text-transform: uppercase;
        }
        
        .simulation-status.running {
          background-color: var(--success-color);
          color: white;
        }
        
        .simulation-status.stopped {
          background-color: var(--error-color);
          color: white;
        }
        
        .simulation-status.paused {
          background-color: var(--warning-color);
          color: white;
        }
        
        .simulation-details {
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
        
        .simulation-actions {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }
        
        .error-message {
          color: var(--error-color);
          margin: 20px 0;
        }
      `}</style>
    </div>
  );
};

export default Simulator; 