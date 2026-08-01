'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';

export function SectionHeading({ eyebrow, title, subtitle, className }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn('flex flex-col items-center text-center space-y-4 max-w-3xl mx-auto', className)}
    >
      {eyebrow && (
        <span className="inline-flex items-center px-3 py-1 rounded-full font-mono text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          {eyebrow}
        </span>
      )}
      
      <h2 className="text-3xl md:text-5xl font-semibold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
        {title}
      </h2>
      
      {subtitle && (
        <p className="text-base md:text-lg text-slate-400 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
