import React from 'react';
import './TimeControls.css';

function TimeControls({ 
  currentDate, 
  setCurrentDate, 
  timeSpeed, 
  setTimeSpeed, 
  isPlaying, 
  setIsPlaying 
}) {
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleDateChange = (e) => {
    setCurrentDate(new Date(e.target.value));
  };

  const speedOptions = [
    { value: 0.1, label: '0.1x' },
    { value: 0.5, label: '0.5x' },
    { value: 1, label: '1x' },
    { value: 5, label: '5x' },
    { value: 10, label: '10x' },
    { value: 30, label: '30x' },
    { value: 100, label: '100x' }
  ];

  return (
    <div className="time-controls">
      <h3>Time Simulation</h3>
      
      <div className="current-date">
        <label>Current Date:</label>
        <div className="date-display">{formatDate(currentDate)}</div>
      </div>

      <div className="playback-controls">
        <button 
          className={`play-button ${isPlaying ? 'playing' : 'paused'}`}
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        
        <button 
          className="reset-button"
          onClick={() => {
            setCurrentDate(new Date('2025-01-01'));
            setIsPlaying(false);
          }}
        >
          🔄
        </button>
      </div>

      <div className="speed-controls">
        <label>Speed:</label>
        <div className="speed-buttons">
          {speedOptions.map(option => (
            <button
              key={option.value}
              className={`speed-button ${timeSpeed === option.value ? 'active' : ''}`}
              onClick={() => setTimeSpeed(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="manual-date">
        <label>Jump to Date:</label>
        <input
          type="date"
          value={currentDate.toISOString().split('T')[0]}
          onChange={handleDateChange}
          min="2025-01-01"
          max="2025-12-31"
        />
      </div>

      <div className="simulation-info">
        <div className="info-item">
          <span>Status:</span>
          <span className={isPlaying ? 'running' : 'paused'}>
            {isPlaying ? 'Running' : 'Paused'}
          </span>
        </div>
        <div className="info-item">
          <span>Rate:</span>
          <span>{timeSpeed}x speed</span>
        </div>
      </div>
    </div>
  );
}

export default TimeControls;
