import React from 'react';
import './LoadingScreen.css';

function LoadingScreen({ message = "Loading..." }) {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-spinner">
          <div className="spinner-orbit">
            <div className="spinner-planet"></div>
          </div>
          <div className="spinner-orbit spinner-orbit-2">
            <div className="spinner-planet"></div>
          </div>
          <div className="spinner-orbit spinner-orbit-3">
            <div className="spinner-planet"></div>
          </div>
        </div>
        <h2>Interstellar Mission Simulator</h2>
        <p className="loading-message">{message}</p>
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;
