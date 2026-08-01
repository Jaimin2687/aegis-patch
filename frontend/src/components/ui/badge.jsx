'use client';

import React from 'react';
import { cn } from '@/lib/utils';

const variantStyles = {
  default: 'bg-slate-800/50 text-slate-300 border-slate-700',
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  error: 'bg-red-500/15 text-red-400 border-red-500/30',
  info: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
};

export function Badge({ variant = 'default', className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full font-mono text-xs border',
        variantStyles[variant] || variantStyles.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
