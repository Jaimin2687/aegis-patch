'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function ShimmerButton({ variant = 'solid', className, children, ...props }) {
  const isSolid = variant === 'solid';

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900',
        isSolid
          ? 'bg-white dark:bg-gray-900 dark:bg-gray-900 text-black dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800'
          : 'bg-transparent text-white border border-white/20 hover:bg-white dark:bg-gray-900/10 dark:hover:bg-white dark:bg-gray-900/10',
        className
      )}
      {...props}
    >
      {isSolid && (
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-black/10 dark:via-white/10 to-transparent pointer-events-none"
        />
      )}
      <span className="relative z-10 px-6 py-2.5 text-sm">{children}</span>
    </motion.button>
  );
}
