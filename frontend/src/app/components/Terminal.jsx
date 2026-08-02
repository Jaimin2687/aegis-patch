'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatLog } from '@/lib/formatLog';
import { motion, AnimatePresence } from 'framer-motion';

export default function Terminal({ logs = [], connectionStatus = 'CLOSED' }) {
  const terminalRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleScroll = () => {
    if (!terminalRef.current || !isExpanded) return;
    const { scrollTop, scrollHeight, clientHeight } = terminalRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setAutoScroll(isNearBottom);
  };

  useEffect(() => {
    if (autoScroll && terminalRef.current && isExpanded) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, autoScroll, isExpanded]);

  const copyLogs = (e) => {
    e.stopPropagation();
    const text = logs.map(l => `[${l.timestamp}] [${l.stage}] [${l.level}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
  };

  const statusBadgeVariant = {
    OPEN: 'success',
    CONNECTING: 'info',
    ERROR: 'destructive',
    CLOSED: 'default'
  }[connectionStatus] || 'default';

  const latestLog = logs[logs.length - 1];
  const latestFormatted = latestLog ? formatLog(latestLog) : null;

  return (
    <div className="flex flex-col rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 font-mono text-sm">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <svg className={cn("w-4 h-4 transition-transform", isExpanded ? "rotate-90 text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-900 dark:text-gray-100 font-semibold tracking-wide text-xs uppercase">Execution Logs</span>
          </div>
          {!isExpanded && latestFormatted && (
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className={latestFormatted.levelColor}>{latestLog.level}</span>
              <span className="text-gray-500 dark:text-gray-400 truncate max-w-sm">{latestLog.message}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={statusBadgeVariant} className="uppercase text-[10px] tracking-wider px-2 py-0.5">
            {connectionStatus}
          </Badge>
          <button 
            onClick={copyLogs}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 dark:text-gray-100 transition-colors p-1 rounded-md hover:bg-gray-200 dark:bg-gray-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div 
              ref={terminalRef}
              onScroll={handleScroll}
              className="p-4 max-h-[400px] overflow-y-auto space-y-1.5 scroll-smooth custom-scrollbar bg-white dark:bg-gray-900"
            >
              {logs.length === 0 ? (
                <div className="text-gray-500 dark:text-gray-400 italic">Waiting for pipeline events...</div>
              ) : (
                logs.map((log, idx) => {
                  const formatted = formatLog(log);
                  return (
                    <div key={idx} className="flex hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-950 px-2 py-1 rounded transition-colors group">
                      <div className="w-8 shrink-0 text-gray-400 text-right pr-3 select-none tabular-nums">
                        {idx + 1}
                      </div>
                      <div className="w-28 shrink-0 text-gray-500 dark:text-gray-400 tabular-nums">
                        {formatted.time}
                      </div>
                      <div className="w-32 shrink-0">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                          formatted.levelColor
                        )}>
                          {log.level}
                        </span>
                      </div>
                      <div className="w-32 shrink-0 flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <span dangerouslySetInnerHTML={{ __html: formatted.stageIcon }} />
                        <span className="text-xs uppercase tracking-wide">{log.stage}</span>
                      </div>
                      <div className={cn("flex-1 whitespace-pre-wrap break-words", formatted.textColor || "text-gray-700 dark:text-gray-300")}>
                        {log.message}
                      </div>
                    </div>
                  );
                })
              )}
              {connectionStatus !== 'CLOSED' && (
                <motion.div 
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="w-2.5 h-4 bg-gray-400 inline-block ml-10 mt-2"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
