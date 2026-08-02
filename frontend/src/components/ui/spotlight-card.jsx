'use client';

import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export function SpotlightCard({ children, className, ...props }) {
  const divRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 dark:border-gray-800 shadow-sm transition-shadow hover:shadow-md',
        className
      )}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(59, 130, 246, 0.04), transparent 40%)`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 dark:from-white/5 to-transparent pointer-events-none" />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
