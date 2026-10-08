import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * CricketBall3D — A realistic procedural cricket ball with seam stitching,
 * smooth leather material, and a continuous spin animation.
 */
export const CricketBall3D = ({ position = [0, 0, 0], scale = 1, spinSpeed = 0.4 }) => {
  const groupRef = useRef();

  // Spin the ball continuously
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * spinSpeed;
      groupRef.current.rotation.x += delta * spinSpeed * 0.3;
    }
  });

  // Create seam curve (great circle)
  const seamPoints = useMemo(() => {
    const pts = [];
    const segments = 128;
    const radius = 1.012; // just above surface
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        Math.cos(t) * radius,
        Math.sin(t * 6) * 0.04, // subtle wave for stitching
        Math.sin(t) * radius
      ));
    }
    return pts;
  }, []);

  // Create cross-stitch lines along the seam
  const stitchLines = useMemo(() => {
    const lines = [];
    const count = 60;
    const radius = 1.015;
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2;
      const cx = Math.cos(t) * radius;
      const cz = Math.sin(t) * radius;
      const cy = Math.sin(t * 6) * 0.04;
      // Perpendicular stitches
      const nx = -Math.sin(t) * 0.03;
      const nz = Math.cos(t) * 0.03;
      lines.push([
        new THREE.Vector3(cx + nx, cy + 0.025, cz + nz),
        new THREE.Vector3(cx - nx, cy - 0.025, cz - nz)
      ]);
    }
    return lines;
  }, []);

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Main ball body */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhysicalMaterial
          color="#b91c1c"
          roughness={0.35}
          metalness={0.05}
          clearcoat={0.8}
          clearcoatRoughness={0.15}
          sheen={0.3}
          sheenColor="#ff4444"
        />
      </mesh>

      {/* Seam line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={seamPoints.length}
            array={new Float32Array(seamPoints.flatMap(p => [p.x, p.y, p.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#f5e6c8" linewidth={2} />
      </line>

      {/* Cross stitches */}
      {stitchLines.map((pair, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                pair[0].x, pair[0].y, pair[0].z,
                pair[1].x, pair[1].y, pair[1].z
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#f5e6c8" linewidth={1} />
        </line>
      ))}
    </group>
  );
};
