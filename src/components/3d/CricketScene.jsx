import React, { Suspense, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { CricketBall3D } from './CricketBall3D';
import { Wickets3D } from './Wickets3D';
import { Trophy3D } from './Trophy3D';
import { StadiumParticles } from './StadiumParticles';

/**
 * CricketScene — The main 3D canvas that combines all cricket elements.
 * Supports mode switching between Ball, Wickets, and Trophy views.
 */
export const CricketScene = ({ mode = 'ball', onSmash, className = '', style = {} }) => {
  return (
    <div className={`cricket-3d-canvas ${className}`} style={{ width: '100%', height: '100%', ...style }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 2, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.3} />
          <directionalLight
            position={[5, 8, 5]}
            intensity={1.5}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-3, 5, -2]} intensity={0.5} color="#93c5fd" />
          <spotLight
            position={[0, 10, 0]}
            angle={0.3}
            penumbra={0.8}
            intensity={1.2}
            color="#fbbf24"
            castShadow
          />

          {/* 3D Content based on mode */}
          {mode === 'ball' && (
            <CricketBall3D position={[0, 1.2, 0]} scale={1.3} spinSpeed={0.5} />
          )}

          {mode === 'wickets' && (
            <Wickets3D position={[0, 0.2, 0]} scale={1.5} onSmash={onSmash} />
          )}

          {mode === 'trophy' && (
            <Trophy3D position={[0, -0.2, 0]} scale={1.1} rotateSpeed={0.35} />
          )}

          {/* Atmosphere */}
          <StadiumParticles count={150} />

          {/* Ground shadow */}
          <ContactShadows
            position={[0, -0.5, 0]}
            opacity={0.4}
            scale={8}
            blur={2.5}
            far={4}
          />

          {/* Environment reflections */}
          <Environment preset="city" />

          {/* Orbit controls (constrained) */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2.2}
            autoRotate={mode === 'trophy'}
            autoRotateSpeed={1.5}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};
