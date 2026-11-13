import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import './App.css';
import SolarSystem from './components/SolarSystem';
import Dashboard from './components/Dashboard';
import MissionPanel from './components/MissionPanel';
import TimeControls from './components/TimeControls';
import LoadingScreen from './components/LoadingScreen';
import HorizonsAPI from './services/horizonsAPI';
import orbitalDataFallback from './data/orbitalData.json';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date('2025-01-01'));
  const [timeSpeed, setTimeSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPropulsion, setSelectedPropulsion] = useState('chemical');
  const [launchDate, setLaunchDate] = useState(new Date('2025-03-01'));
  const [missionTrajectory, setMissionTrajectory] = useState(null);
  const [orbitalData, setOrbitalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const selectedObject = 'atlas_3i';

  // Get current positions for all objects
  const getCurrentPosition = (objectData, date) => {
    const positions = objectData.positions;
    if (!positions) return { x: 0, y: 0, z: 0, velocity: { x: 0, y: 0, z: 0 } };
    
    const dateStr = date.toISOString().split('T')[0];
    const exactMatch = positions.find(p => p.date === dateStr);
    if (exactMatch) return exactMatch;
    
    // Simple interpolation between closest dates
    const sortedPositions = positions.sort((a, b) => new Date(a.date) - new Date(b.date));
    const targetTime = date.getTime();
    
    for (let i = 0; i < sortedPositions.length - 1; i++) {
      const current = sortedPositions[i];
      const next = sortedPositions[i + 1];
      const currentTime = new Date(current.date).getTime();
      const nextTime = new Date(next.date).getTime();
      
      if (targetTime >= currentTime && targetTime <= nextTime) {
        const ratio = (targetTime - currentTime) / (nextTime - currentTime);
        return {
          x: current.x + (next.x - current.x) * ratio,
          y: current.y + (next.y - current.y) * ratio,
          z: current.z + (next.z - current.z) * ratio,
          velocity: {
            x: current.velocity.x + (next.velocity.x - current.velocity.x) * ratio,
            y: current.velocity.y + (next.velocity.y - current.velocity.y) * ratio,
            z: current.velocity.z + (next.velocity.z - current.velocity.z) * ratio
          }
        };
      }
    }
    
    return positions[0];
  };

  const currentPositions = orbitalData ? {
    earth: getCurrentPosition(orbitalData.earth, currentDate),
    mars: getCurrentPosition(orbitalData.mars, currentDate),
    jupiter: getCurrentPosition(orbitalData.jupiter, currentDate),
    atlas_3i: getCurrentPosition(orbitalData.atlas_3i, currentDate)
  } : {};

  // Load orbital data from NASA API on component mount
  useEffect(() => {
    const loadOrbitalData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Loading orbital data from NASA JPL Horizons API...');
        const apiData = await HorizonsAPI.getAllCelestialBodies('2025-01-01', '2025-12-31');
        
        // Merge API data with fallback propulsion data
        const completeData = {
          ...apiData,
          propulsionTypes: orbitalDataFallback.propulsionTypes,
          // Add visual properties from fallback data
          sun: { ...apiData.sun, ...orbitalDataFallback.sun },
          earth: { ...apiData.earth, ...orbitalDataFallback.earth },
          mars: { ...apiData.mars, ...orbitalDataFallback.mars },
          jupiter: { ...apiData.jupiter, ...orbitalDataFallback.jupiter },
          atlas_3i: { ...apiData.atlas_3i, ...orbitalDataFallback.atlas_3i }
        };
        
        setOrbitalData(completeData);
        console.log('Successfully loaded orbital data:', completeData);
      } catch (err) {
        console.error('Failed to load orbital data from API, using fallback:', err);
        setError(err.message);
        setOrbitalData(orbitalDataFallback);
      } finally {
        setLoading(false);
      }
    };
    
    loadOrbitalData();
  }, []);

  // Time simulation effect
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentDate(prev => {
          const newDate = new Date(prev);
          newDate.setDate(newDate.getDate() + timeSpeed);
          return newDate;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, timeSpeed]);

  const calculateMission = () => {
    if (!orbitalData) return;
    
    const earthPos = getCurrentPosition(orbitalData.earth, launchDate);
    const atlasPos = getCurrentPosition(orbitalData.atlas_3i, launchDate);
    
    // Simple trajectory calculation (placeholder)
    const trajectory = [];
    const steps = 50;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      trajectory.push({
        x: earthPos.x + (atlasPos.x - earthPos.x) * t,
        y: earthPos.y + (atlasPos.y - earthPos.y) * t,
        z: earthPos.z + (atlasPos.z - earthPos.z) * t
      });
    }
    
    const distance = Math.sqrt(
      Math.pow(atlasPos.x - earthPos.x, 2) +
      Math.pow(atlasPos.y - earthPos.y, 2) +
      Math.pow(atlasPos.z - earthPos.z, 2)
    );
    
    const propulsion = orbitalData.propulsionTypes[selectedPropulsion];
    const travelTime = distance * 30; // days (simplified)
    const fuelUsage = distance * (1 - propulsion.fuelEfficiency) * 1000; // kg
    
    setMissionTrajectory({
      path: trajectory,
      travelTime,
      fuelUsage,
      distance,
      feasible: distance < 20 && travelTime < 1000
    });
  };

  if (loading) {
    return <LoadingScreen message="Loading orbital data from NASA JPL Horizons API..." />;
  }

  if (!orbitalData) {
    return (
      <div className="error-screen">
        <h2>Error Loading Data</h2>
        <p>{error || 'Failed to load orbital data'}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="simulation-container">
        <Canvas camera={{ position: [10, 10, 10], fov: 60 }}>
          <ambientLight intensity={0.3} />
          <pointLight position={[0, 0, 0]} intensity={2} />
          <Stars radius={300} depth={60} count={20000} factor={7} />
          
          <SolarSystem 
            orbitalData={orbitalData}
            currentPositions={currentPositions}
            missionTrajectory={missionTrajectory}
          />
          
          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
        </Canvas>
        
        <div className="ui-overlay">
          <Dashboard 
            currentPositions={currentPositions}
            selectedObject={selectedObject}
            currentDate={currentDate}
            missionTrajectory={missionTrajectory}
            error={error}
          />
          
          <MissionPanel
            selectedPropulsion={selectedPropulsion}
            setSelectedPropulsion={setSelectedPropulsion}
            launchDate={launchDate}
            setLaunchDate={setLaunchDate}
            onCalculateMission={calculateMission}
            propulsionTypes={orbitalData.propulsionTypes}
          />
          
          <TimeControls
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            timeSpeed={timeSpeed}
            setTimeSpeed={setTimeSpeed}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
