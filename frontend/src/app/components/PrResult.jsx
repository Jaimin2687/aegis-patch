'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { cn } from '@/lib/utils';

export default function PrResult({ result }) {
  if (!result) return null;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      className="w-full bg-[#050505] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
    >
      {/* Background glow effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none" />

      <div className="flex flex-col items-center text-center space-y-4 mb-8">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
          <div className="relative w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Patch Deployed Successfully</h2>
          <p className="text-slate-400 mt-1 max-w-lg mx-auto">
            All detected vulnerabilities have been patched and verified.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Vulns Patched', value: result.vulnsPatched || 0 },
          { label: 'Tests Passed', value: result.testsPassed || 0 },
          { label: 'Total Time', value: result.totalTimeSeconds || 0, suffix: 's' },
          { label: 'Iterations', value: result.iterations || 1 }
        ].map((metric, idx) => (
          <div key={idx} className="bg-slate-900/50 border border-white/[0.08] rounded-xl p-4 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-white flex items-baseline gap-1">
              <AnimatedCounter value={metric.value} />
              {metric.suffix && <span className="text-lg text-slate-500">{metric.suffix}</span>}
            </div>
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">{metric.label}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        {result.prUrl ? (
          <a
            href={result.prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-slate-200 transition-colors shadow-lg"
          >
            View Pull Request
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        ) : (
          <div className="px-4 py-2 bg-slate-800/50 border border-white/5 rounded-lg text-sm text-slate-400 flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Patches applied locally (no PR URL provided)
          </div>
        )}
      </div>
    </motion.div>
  );
}
