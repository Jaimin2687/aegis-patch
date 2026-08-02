'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const STAGES = [
  { id: 'CLONING', label: 'Cloning', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /> },
  { id: 'SCANNING', label: 'Scanning', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /> },
  { id: 'PATCHING', label: 'Patching', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l-7-7m7 7l-2.828 2.829m5.656-5.656l2.829-2.828M15.536 8.464a2 2 0 00-2.829-2.829L9.879 8.464a2 2 0 002.828 2.829l2.829-2.829z" /> },
  { id: 'TESTING', label: 'Testing', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /> },
  { id: 'PUSHING', label: 'Pushing', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /> },
  { id: 'COMPLETE', label: 'Complete', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /> },
];

export default function StatusPanel({ currentStage, isError = false }) {
  const [stageIndex, setStageIndex] = useState(-1);
  const rawStageIndex = currentStage ? STAGES.findIndex(s => s.id === currentStage) : -1;

  // Persist the highest achieved stage index so it never flickers backwards or resets to 0 during a run.
  useEffect(() => {
    if (rawStageIndex === 0) {
      // If the backend explicitly restarted to Cloning, reset our tracker.
      setStageIndex(0);
    } else if (rawStageIndex > stageIndex) {
      // Only advance the UI if we've reached a new highest stage.
      // This prevents flickers if the backend momentarily sends an unknown/null stage (-1)
      // or loops backwards rapidly.
      setStageIndex(rawStageIndex);
    }
  }, [rawStageIndex, stageIndex]);

  const isComplete = stageIndex === STAGES.length - 1 || currentStage === 'COMPLETE';
  
  // Calculate percentage of progress for the connecting line
  const progressPercent = Math.max(0, Math.min(100, (stageIndex / (STAGES.length - 1)) * 100));

  return (
    <div className="w-full bg-white dark:bg-gray-900 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 dark:border-gray-800 p-6 md:p-8 rounded-2xl shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-0">
        
        {/* Horizontal background track (Desktop) */}
        <div className="hidden md:block absolute top-5 left-5 right-5 h-[2px] bg-gray-100 dark:bg-gray-800 dark:bg-gray-800 -z-10">
          <div 
            className="h-full bg-blue-500 transition-all duration-700 ease-in-out" 
            style={{ width: `${progressPercent}%` }} 
          />
        </div>

        {/* Vertical background track (Mobile) */}
        <div className="block md:hidden absolute top-5 bottom-[44px] left-5 w-[2px] bg-gray-100 dark:bg-gray-800 dark:bg-gray-800 -z-10">
           <div 
            className="w-full bg-blue-500 transition-all duration-700 ease-in-out" 
            style={{ height: `${progressPercent}%` }} 
          />
        </div>

        {STAGES.map((stage, idx) => {
          const isCompleted = isComplete || (stageIndex !== -1 && idx < stageIndex);
          const isActive = idx === stageIndex;
          const isErrorNode = isActive && isError;

          return (
            <div key={stage.id} className="flex md:flex-col items-center gap-4 md:gap-3 mb-6 md:mb-0 relative z-10 w-full md:w-auto">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: isCompleted ? '#10b981' : isActive ? (isErrorNode ? '#ef4444' : '#f3f4f6') : '#ffffff',
                  borderColor: isCompleted ? '#10b981' : isActive ? (isErrorNode ? '#ef4444' : '#2563eb') : '#e5e7eb',
                  scale: isActive ? 1.1 : 1
                }}
                className={cn(
                  "w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 relative transition-colors duration-300"
                )}
              >
                {isActive && !isErrorNode && (
                  <span className="absolute -inset-2 rounded-full border border-blue-200 animate-ping opacity-75"></span>
                )}
                
                {isCompleted ? (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-5 h-5 text-white"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </motion.svg>
                ) : (
                  <svg className={cn("w-5 h-5", isActive ? (isErrorNode ? "text-white" : "text-blue-600") : "text-gray-400")} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    {stage.icon}
                  </svg>
                )}
              </motion.div>

              <div className="flex flex-col md:items-center">
                <span className={cn(
                  "text-sm font-medium transition-colors duration-300",
                  isCompleted ? "text-gray-900 dark:text-gray-100 dark:text-gray-100" : isActive ? (isErrorNode ? "text-red-600" : "text-blue-600") : "text-gray-400"
                )}>
                  {stage.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
