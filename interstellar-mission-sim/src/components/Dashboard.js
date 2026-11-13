import React from 'react';
import './Dashboard.css';

function Dashboard({ currentPositions, selectedObject, currentDate, missionTrajectory, error }) {
  const selectedData = currentPositions[selectedObject];
  
  const formatNumber = (num) => {
    return typeof num === 'number' ? num.toFixed(3) : '0.000';
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const calculateSpeed = (velocity) => {
    if (!velocity) return 0;
    return Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);
  };

  return (
    <div className="dashboard">
      <h2>Mission Dashboard</h2>
      
      <div className="info-section">
        <h3>Current Date</h3>
        <p>{formatDate(currentDate)}</p>
        {error && (
          <div className="api-status">
            <span className="status-indicator warning">⚠️</span>
            <span className="status-text">Using fallback data</span>
          </div>
        )}
        {!error && (
          <div className="api-status">
            <span className="status-indicator success">✓</span>
            <span className="status-text">NASA JPL Horizons API</span>
          </div>
        )}
      </div>

      <div className="info-section">
        <h3>3I/ATLAS Status</h3>
        <div className="data-grid">
          <div className="data-item">
            <label>Position (AU)</label>
            <div>
              X: {formatNumber(selectedData?.x)}<br/>
              Y: {formatNumber(selectedData?.y)}<br/>
              Z: {formatNumber(selectedData?.z)}
            </div>
          </div>
          <div className="data-item">
            <label>Velocity (km/s)</label>
            <div>
              X: {formatNumber(selectedData?.velocity?.x)}<br/>
              Y: {formatNumber(selectedData?.velocity?.y)}<br/>
              Z: {formatNumber(selectedData?.velocity?.z)}
            </div>
          </div>
          <div className="data-item">
            <label>Speed</label>
            <div>{formatNumber(calculateSpeed(selectedData?.velocity))} km/s</div>
          </div>
        </div>
      </div>

      {missionTrajectory && (
        <div className="info-section">
          <h3>Mission Analysis</h3>
          <div className="mission-data">
            <div className="data-item">
              <label>Distance to Target</label>
              <div>{formatNumber(missionTrajectory.distance)} AU</div>
            </div>
            <div className="data-item">
              <label>Travel Time</label>
              <div>{Math.round(missionTrajectory.travelTime)} days</div>
            </div>
            <div className="data-item">
              <label>Fuel Usage</label>
              <div>{Math.round(missionTrajectory.fuelUsage)} kg</div>
            </div>
            <div className="data-item">
              <label>Mission Status</label>
              <div className={`status ${missionTrajectory.feasible ? 'feasible' : 'infeasible'}`}>
                {missionTrajectory.feasible ? '✓ Feasible' : '✗ Infeasible'}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="info-section">
        <h3>Educational Info</h3>
        <div className="tooltip">
          <p><strong>Astronomical Unit (AU):</strong> The average distance from Earth to the Sun (~150 million km)</p>
          <p><strong>Interstellar Object:</strong> An object that originates from outside our solar system</p>
          <p><strong>Delta-V:</strong> The change in velocity needed for spacecraft maneuvers</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
