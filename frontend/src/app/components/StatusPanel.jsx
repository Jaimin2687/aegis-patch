'use client';

import React from 'react';
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
  // Gracefully handle unknown stages by clamping to -1
  const stageIndex = currentStage ? STAGES.findIndex(s => s.id === currentStage) : -1;
  const isComplete = currentStage === 'COMPLETE';

  return (
    <div className="w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-2xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative">
        {/* Desktop connection lines */}
        <div className="hidden md:block absolute top-5 left-[20px] right-[20px] h-[2px] bg-slate-800 -z-10" />
        {/* Mobile connection lines */}
        <div className="block md:hidden absolute top-[20px] bottom-[20px] left-5 w-[2px] bg-slate-800 -z-10" />

        {STAGES.map((stage, idx) => {
          const isCompleted = isComplete || (stageIndex !== -1 && idx < stageIndex);
          const isActive = idx === stageIndex;
          const isErrorNode = isActive && isError;
          const isFuture = stageIndex !== -1 && idx > stageIndex;

          return (
            <div key={stage.id} className="flex md:flex-col items-center gap-4 md:gap-3 mb-6 md:mb-0 relative z-10 w-full md:w-auto">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: isCompleted ? '#34d399' : isActive ? (isErrorNode ? '#f87171' : '#0a0a0a') : '#0a0a0a',
                  borderColor: isCompleted ? '#34d399' : isActive ? (isErrorNode ? '#f87171' : '#06b6d4') : '#334155',
                  scale: isActive ? 1.1 : 1
                }}
                className={cn(
                  "w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 relative transition-colors duration-300",
                  isActive && !isErrorNode && "shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                )}
              >
                {/* Active pulse ring */}
                {isActive && !isErrorNode && (
                  <span className="absolute -inset-2 rounded-full border border-cyan-400/50 animate-ping opacity-75"></span>
                )}
                
                {isCompleted ? (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-5 h-5 text-slate-900"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </motion.svg>
                ) : (
                  <svg className={cn("w-5 h-5", isActive ? (isErrorNode ? "text-white" : "text-cyan-400") : "text-slate-500")} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    {stage.icon}
                  </svg>
                )}
              </motion.div>

              <div className="flex flex-col md:items-center">
                <span className={cn(
                  "text-sm font-medium transition-colors duration-300",
                  isCompleted ? "text-slate-300" : isActive ? (isErrorNode ? "text-red-400" : "text-cyan-400") : "text-slate-500"
                )}>
                  {stage.label}
                </span>
              </div>
              
              {/* Connector line overlay for active/completed segments */}
              {idx < STAGES.length - 1 && (
                <>
                  {/* Desktop Active line */}
                  <div className="hidden md:block absolute top-5 left-[calc(50%+20px)] w-[calc(100%-40px)] h-[2px] -z-10 origin-left">
                    <motion.div 
                      className={cn("h-full", isCompleted ? "bg-emerald-400/50" : isActive ? "bg-cyan-500/50" : "bg-transparent")}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: (isCompleted || isActive) ? 1 : 0 }}
                      transition={{ duration: 0.5 }}
                      style={{ transformOrigin: 'left' }}
                    />
                  </div>
                  {/* Mobile Active line */}
                  <div className="block md:hidden absolute top-[40px] left-5 w-[2px] h-[calc(100%-40px)] -z-10 origin-top">
                    <motion.div 
                      className={cn("w-full", isCompleted ? "bg-emerald-400/50" : isActive ? "bg-cyan-500/50" : "bg-transparent")}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: (isCompleted || isActive) ? 1 : 0 }}
                      transition={{ duration: 0.5 }}
                      style={{ transformOrigin: 'top' }}
                    />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
