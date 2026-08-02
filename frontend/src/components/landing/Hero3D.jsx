'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Environment } from '@react-three/drei';
import { useTheme } from 'next-themes';

function AnimatedNoodle({ isDark }) {
  const meshRef = useRef(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef}>
        <torusKnotGeometry args={[1.5, 0.4, 128, 32]} />
        <MeshDistortMaterial
          color={isDark ? "#22d3ee" : "#3b82f6"}
          speed={2}
          distort={0.3}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
}

export default function Hero3D() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden hidden lg:block opacity-30">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} className="w-full h-full">
        <ambientLight intensity={isDark ? 0.8 : 1.5} />
        <directionalLight position={[10, 10, 5]} intensity={isDark ? 1 : 2} />
        <directionalLight position={[-10, -10, -5]} intensity={isDark ? 1.5 : 2} color={isDark ? "#c084fc" : "#60a5fa"} />
        <AnimatedNoodle isDark={isDark} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
