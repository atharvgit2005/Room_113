import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

function CelestialBody({ position, radius, color, name }) {
  const meshRef = useRef();
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Object label */}
      <mesh position={[0, radius + 0.1, 0]}>
        <planeGeometry args={[0.5, 0.1]} />
        <meshBasicMaterial color="white" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

function OrbitPath({ positions, color = "#444444" }) {
  const points = positions.map(pos => new THREE.Vector3(pos.x, pos.y, pos.z));
  
  return (
    <Line
      points={points}
      color={color}
      lineWidth={1}
      transparent
      opacity={0.3}
    />
  );
}

function MissionTrajectory({ trajectory }) {
  if (!trajectory || !trajectory.path) return null;
  
  const points = trajectory.path.map(pos => new THREE.Vector3(pos.x, pos.y, pos.z));
  
  return (
    <Line
      points={points}
      color={trajectory.feasible ? "#00ff00" : "#ff0000"}
      lineWidth={3}
      transparent
      opacity={0.8}
    />
  );
}

function SolarSystem({ orbitalData, currentPositions, missionTrajectory }) {
  return (
    <group>
      {/* Sun */}
      <CelestialBody
        position={orbitalData.sun.position}
        radius={orbitalData.sun.radius}
        color={orbitalData.sun.color}
        name={orbitalData.sun.name}
      />
      
      {/* Earth */}
      <CelestialBody
        position={currentPositions.earth}
        radius={orbitalData.earth.radius}
        color={orbitalData.earth.color}
        name={orbitalData.earth.name}
      />
      
      {/* Mars */}
      <CelestialBody
        position={currentPositions.mars}
        radius={orbitalData.mars.radius}
        color={orbitalData.mars.color}
        name={orbitalData.mars.name}
      />
      
      {/* Jupiter */}
      <CelestialBody
        position={currentPositions.jupiter}
        radius={orbitalData.jupiter.radius}
        color={orbitalData.jupiter.color}
        name={orbitalData.jupiter.name}
      />
      
      {/* 3I/ATLAS */}
      <CelestialBody
        position={currentPositions.atlas_3i}
        radius={orbitalData.atlas_3i.radius}
        color={orbitalData.atlas_3i.color}
        name={orbitalData.atlas_3i.name}
      />
      
      {/* Orbital paths */}
      <OrbitPath positions={orbitalData.earth.positions} color="#6B93D6" />
      <OrbitPath positions={orbitalData.mars.positions} color="#CD5C5C" />
      <OrbitPath positions={orbitalData.jupiter.positions} color="#D8CA9D" />
      <OrbitPath positions={orbitalData.atlas_3i.positions} color="#FF6B6B" />
      
      {/* Mission trajectory */}
      <MissionTrajectory trajectory={missionTrajectory} />
    </group>
  );
}

export default SolarSystem;
