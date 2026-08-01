'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('AEGIS-PATCH runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans">
      {/* Subtle grid background */}
      <div className="fixed inset-0 dot-grid opacity-30 pointer-events-none" />

      {/* Radial glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg text-center">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 mb-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center relative">
          <span className="absolute inset-0 rounded-full border border-red-500/30 animate-ping opacity-30" />
          <svg className="w-9 h-9 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
          Runtime Error
        </h1>
        <p className="text-slate-400 text-sm mb-2">
          Something went wrong in AEGIS-PATCH
        </p>

        {/* Error message */}
        {error?.message && (
          <div className="mt-4 mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-left">
            <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-1">Error</p>
            <p className="text-sm text-red-400 font-mono break-words">{error.message}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-white text-black text-sm font-semibold rounded-lg hover:bg-slate-100 transition-colors"
          >
            ↺ Try Again
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-6 py-2.5 bg-white/5 border border-white/10 text-slate-300 text-sm font-semibold rounded-lg hover:bg-white/10 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Footer */}
        <p className="mt-8 text-xs text-slate-600">
          AEGIS-PATCH • Autonomous Security Engine
        </p>
      </div>
    </div>
  );
}
