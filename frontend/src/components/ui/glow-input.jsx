'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function GlowInput({
  value,
  onChange,
  onSubmit,
  error,
  isLoading,
  placeholder,
  className,
}) {
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className={cn('relative w-full max-w-xl flex flex-col gap-2', className)}>
      <div
        className={cn(
          'relative flex items-center p-[1px] rounded-xl overflow-hidden transition-all duration-300',
          isFocused ? 'bg-gradient-to-r from-cyan-400 to-indigo-500 shadow-[0_0_20px_rgba(34,211,238,0.2)]' : 'bg-white/10'
        )}
      >
        <div className="flex w-full items-center bg-slate-950 rounded-[11px] overflow-hidden">
          <div className="pl-4 pr-2 text-slate-400 flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12" />
            </svg>
          </div>
          <input
            type="text"
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder || 'Enter repository URL...'}
            className="flex-1 bg-transparent border-none outline-none py-3 px-2 text-white placeholder-slate-500 font-mono text-sm"
          />
          <div className="pr-2 py-2 flex-shrink-0">
            <button
              type="button"
              onClick={onSubmit}
              disabled={isLoading}
              className="flex items-center justify-center bg-white text-black hover:bg-white/90 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : null}
              {isLoading ? 'Patching...' : 'Start Patching'}
            </button>
          </div>
        </div>
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-xs pl-1 font-mono"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
