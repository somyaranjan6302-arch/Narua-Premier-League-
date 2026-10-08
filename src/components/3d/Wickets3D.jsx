import React, { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Wickets3D — 3 stumps with 2 bails. Click to smash them!
 * Bails fly off with physics-like animation when clicked.
 */
export const Wickets3D = ({ position = [0, 0, 0], scale = 1, onSmash }) => {
  const groupRef = useRef();
  const [smashed, setSmashed] = useState(false);
  const [bailVelocities] = useState([
    { vx: 0.08, vy: 0.15, vz: 0.04, rx: 0.12 },
    { vx: -0.06, vy: 0.18, vz: -0.03, rx: -0.15 }
  ]);
  const bail1Ref = useRef();
  const bail2Ref = useRef();
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }

    if (smashed) {
      timeRef.current += delta;
      const t = timeRef.current;
      const gravity = -0.4;

      if (bail1Ref.current) {
        bail1Ref.current.position.x += bailVelocities[0].vx;
        bail1Ref.current.position.y += bailVelocities[0].vy + gravity * t;
        bail1Ref.current.position.z += bailVelocities[0].vz;
        bail1Ref.current.rotation.z += bailVelocities[0].rx;
      }
      if (bail2Ref.current) {
        bail2Ref.current.position.x += bailVelocities[1].vx;
        bail2Ref.current.position.y += bailVelocities[1].vy + gravity * t;
        bail2Ref.current.position.z += bailVelocities[1].vz;
        bail2Ref.current.rotation.z += bailVelocities[1].rx;
      }
    }
  });

  const handleClick = useCallback(() => {
    if (!smashed) {
      setSmashed(true);
      timeRef.current = 0;
      onSmash?.();
      // Reset after 3 seconds
      setTimeout(() => {
        setSmashed(false);
        timeRef.current = 0;
        if (bail1Ref.current) {
          bail1Ref.current.position.set(-0.12, 1.55, 0);
          bail1Ref.current.rotation.set(0, 0, 0);
        }
        if (bail2Ref.current) {
          bail2Ref.current.position.set(0.12, 1.55, 0);
          bail2Ref.current.rotation.set(0, 0, 0);
        }
      }, 3000);
    }
  }, [smashed, onSmash]);

  const stumpMaterial = (
    <meshPhysicalMaterial
      color="#f5deb3"
      roughness={0.6}
      metalness={0.02}
    />
  );

  const bailMaterial = (
    <meshPhysicalMaterial
      color="#daa520"
      roughness={0.4}
      metalness={0.15}
      emissive={smashed ? "#ff4400" : "#000000"}
      emissiveIntensity={smashed ? 0.5 : 0}
    />
  );

  return (
    <group ref={groupRef} position={position} scale={scale} onClick={handleClick}>
      {/* Three stumps */}
      {[-0.22, 0, 0.22].map((xOff, i) => (
        <mesh key={`stump-${i}`} position={[xOff, 0.75, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.03, 1.5, 12]} />
          {stumpMaterial}
        </mesh>
      ))}

      {/* Ground base */}
      <mesh position={[0, -0.02, 0]} receiveShadow>
        <boxGeometry args={[0.8, 0.04, 0.15]} />
        <meshStandardMaterial color="#3d2b1f" roughness={0.9} />
      </mesh>

      {/* Bail 1 */}
      <mesh ref={bail1Ref} position={[-0.12, 1.55, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.28, 8]} />
        {bailMaterial}
      </mesh>

      {/* Bail 2 */}
      <mesh ref={bail2Ref} position={[0.12, 1.55, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.28, 8]} />
        {bailMaterial}
      </mesh>

      {/* Red LED glow on stumps (Zing stumps effect) */}
      {smashed && [-0.22, 0, 0.22].map((xOff, i) => (
        <pointLight
          key={`glow-${i}`}
          position={[xOff, 0.75, 0.05]}
          color="#ff2200"
          intensity={3}
          distance={1.5}
          decay={2}
        />
      ))}
    </group>
  );
};
