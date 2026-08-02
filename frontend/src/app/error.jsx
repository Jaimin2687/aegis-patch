'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('AEGIS-PATCH runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 dark:bg-gray-950 flex items-center justify-center p-6 font-sans">
      <div className="relative z-10 w-full max-w-lg text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 mb-6 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shadow-sm">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 mb-2 tracking-tight">
          Application Error
        </h1>
        <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 text-sm mb-6">
          We encountered an unexpected issue while loading this page.
        </p>

        {/* Error message */}
        {error?.message && (
          <div className="mb-8 p-4 bg-white dark:bg-gray-900 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 dark:border-gray-800 rounded-xl text-left shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 font-semibold uppercase tracking-wider mb-1">Details</p>
            <p className="text-sm text-red-600 font-mono break-words">{error.message}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-6 py-2.5 bg-white dark:bg-gray-900 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 dark:border-gray-800 text-gray-700 dark:text-gray-300 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:bg-gray-950 transition-colors shadow-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
