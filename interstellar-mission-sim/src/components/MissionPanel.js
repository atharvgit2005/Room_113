import React from 'react';
import './MissionPanel.css';

function MissionPanel({ 
  selectedPropulsion, 
  setSelectedPropulsion, 
  launchDate, 
  setLaunchDate, 
  onCalculateMission, 
  propulsionTypes 
}) {
  const handleDateChange = (e) => {
    setLaunchDate(new Date(e.target.value));
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="mission-panel">
      <h2>Mission Design</h2>
      
      <div className="control-section">
        <h3>Propulsion System</h3>
        <div className="propulsion-options">
          {Object.entries(propulsionTypes).map(([key, propulsion]) => (
            <div key={key} className="propulsion-option">
              <label className="radio-label">
                <input
                  type="radio"
                  name="propulsion"
                  value={key}
                  checked={selectedPropulsion === key}
                  onChange={(e) => setSelectedPropulsion(e.target.value)}
                />
                <span className="radio-custom"></span>
                <div className="propulsion-info">
                  <div className="propulsion-name">{propulsion.name}</div>
                  <div className="propulsion-details">
                    <div>ΔV: {propulsion.deltaV === "unlimited" ? "∞" : `${propulsion.deltaV/1000}k`} m/s</div>
                    <div>T/W: {propulsion.thrustToWeight}</div>
                    <div>Isp: {propulsion.specificImpulse === "infinite" ? "∞" : propulsion.specificImpulse}s</div>
                  </div>
                  <div className="propulsion-description">{propulsion.description}</div>
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="control-section">
        <h3>Launch Parameters</h3>
        <div className="launch-controls">
          <label>
            Launch Date:
            <input
              type="date"
              value={formatDate(launchDate)}
              onChange={handleDateChange}
              min="2025-01-01"
              max="2025-12-31"
            />
          </label>
        </div>
      </div>

      <div className="control-section">
        <button className="chase-button" onClick={onCalculateMission}>
          🚀 Click to Chase
        </button>
        <p className="chase-description">
          Calculate intercept trajectory and mission feasibility
        </p>
      </div>

      <div className="control-section">
        <h3>Mission Constraints</h3>
        <div className="constraints">
          <div className="constraint-item">
            <span className="constraint-label">Max Distance:</span>
            <span className="constraint-value">20 AU</span>
          </div>
          <div className="constraint-item">
            <span className="constraint-label">Max Travel Time:</span>
            <span className="constraint-value">1000 days</span>
          </div>
          <div className="constraint-item">
            <span className="constraint-label">Launch Window:</span>
            <span className="constraint-value">2025 only</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MissionPanel;
