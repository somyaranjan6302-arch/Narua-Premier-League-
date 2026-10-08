import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Trophy3D — A golden championship trophy with cup, handles, base, and nameplate.
 * Auto-rotates and catches light beautifully with metallic gold material.
 */
export const Trophy3D = ({ position = [0, 0, 0], scale = 1, rotateSpeed = 0.3 }) => {
  const groupRef = useRef();

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * rotateSpeed;
    }
  });

  const goldMaterial = (
    <meshPhysicalMaterial
      color="#d4a017"
      roughness={0.18}
      metalness={0.95}
      clearcoat={1.0}
      clearcoatRoughness={0.08}
      reflectivity={1}
      envMapIntensity={1.5}
    />
  );

  const darkBaseMaterial = (
    <meshPhysicalMaterial
      color="#1a1a2e"
      roughness={0.3}
      metalness={0.6}
      clearcoat={0.5}
    />
  );

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Base — dark marble block */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.55, 0.25, 32]} />
        {darkBaseMaterial}
      </mesh>

      {/* Gold ring on base */}
      <mesh position={[0, 0.14, 0]}>
        <torusGeometry args={[0.48, 0.03, 16, 48]} />
        {goldMaterial}
      </mesh>

      {/* Stem — narrow gold pillar */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.65, 16]} />
        {goldMaterial}
      </mesh>

      {/* Stem knob */}
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        {goldMaterial}
      </mesh>

      {/* Cup bowl — lathe geometry */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.45, 0.15, 0.7, 32, 1, true]} />
        {goldMaterial}
      </mesh>

      {/* Cup inner */}
      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.42, 0.12, 0.65, 32, 1, true]} />
        <meshPhysicalMaterial
          color="#b8860b"
          roughness={0.3}
          metalness={0.8}
          side={1} // BackSide
        />
      </mesh>

      {/* Cup rim ring */}
      <mesh position={[0, 1.5, 0]}>
        <torusGeometry args={[0.44, 0.025, 12, 48]} />
        {goldMaterial}
      </mesh>

      {/* Handle Left */}
      <mesh position={[-0.55, 1.15, 0]} rotation={[0, 0, 0.3]}>
        <torusGeometry args={[0.18, 0.025, 12, 24, Math.PI]} />
        {goldMaterial}
      </mesh>

      {/* Handle Right */}
      <mesh position={[0.55, 1.15, 0]} rotation={[0, 0, -0.3]}>
        <torusGeometry args={[0.18, 0.025, 12, 24, Math.PI]} />
        {goldMaterial}
      </mesh>

      {/* Star on top */}
      <mesh position={[0, 1.65, 0]}>
        <octahedronGeometry args={[0.08, 0]} />
        <meshPhysicalMaterial
          color="#ffd700"
          emissive="#ffa500"
          emissiveIntensity={0.4}
          roughness={0.1}
          metalness={1}
        />
      </mesh>

      {/* Nameplate on base */}
      <mesh position={[0, 0.04, 0.48]} rotation={[-0.1, 0, 0]}>
        <boxGeometry args={[0.4, 0.12, 0.02]} />
        {goldMaterial}
      </mesh>

      {/* Ambient golden glow */}
      <pointLight position={[0, 1.5, 0]} color="#ffd700" intensity={1.5} distance={4} decay={2} />
    </group>
  );
};
