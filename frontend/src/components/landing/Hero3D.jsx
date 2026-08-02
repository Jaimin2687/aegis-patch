'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Environment } from '@react-three/drei';
import { useTheme } from 'next-themes';

function AnimatedBlob({ isDark }) {
  const meshRef = useRef(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
      <Sphere ref={meshRef} args={[1, 64, 64]} scale={2.2} position={[4, 0, -2]}>
        <MeshDistortMaterial
          color={isDark ? "#4f46e5" : "#3b82f6"} // indigo-600 / blue-500
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.1}
          metalness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.2}
          envMapIntensity={1}
        />
      </Sphere>
      <Sphere args={[1, 64, 64]} scale={1.2} position={[-5, 2, -4]}>
        <MeshDistortMaterial
          color={isDark ? "#9333ea" : "#06b6d4"} // purple-600 / cyan-500
          attach="material"
          distort={0.5}
          speed={3}
          roughness={0.1}
          metalness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.2}
        />
      </Sphere>
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
        <AnimatedBlob isDark={isDark} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
