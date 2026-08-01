'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatLog } from '@/lib/formatLog';
import { motion } from 'framer-motion';

export default function Terminal({ logs = [], connectionStatus = 'CLOSED' }) {
  const terminalRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const handleScroll = () => {
    if (!terminalRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = terminalRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setAutoScroll(isNearBottom);
  };

  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const copyLogs = () => {
    const text = logs.map(l => `[${l.timestamp}] [${l.stage}] [${l.level}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
  };

  const statusBadgeVariant = {
    OPEN: 'success',
    CONNECTING: 'info',
    ERROR: 'destructive',
    CLOSED: 'default'
  }[connectionStatus] || 'default';

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden border border-white/10 bg-[#0d1117] shadow-2xl font-mono text-sm">
      {/* macOS-style Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#161b22] border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-slate-300 font-semibold tracking-wide text-xs uppercase">AEGIS Terminal</span>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={statusBadgeVariant} className="uppercase text-[10px] tracking-wider px-2 py-0.5">
            {connectionStatus}
          </Badge>
          <button 
            onClick={copyLogs}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/5 cursor-pointer"
            title="Copy Logs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Log Content */}
      <div 
        ref={terminalRef}
        onScroll={handleScroll}
        className="flex-1 p-4 overflow-y-auto space-y-1.5 scroll-smooth custom-scrollbar"
      >
        {logs.length === 0 ? (
          <div className="text-slate-500 italic">Waiting for pipeline events...</div>
        ) : (
          logs.map((log, idx) => {
            const formatted = formatLog(log);
            return (
              <div key={idx} className="flex hover:bg-white/5 px-2 py-1 rounded transition-colors group">
                <div className="w-8 shrink-0 text-[#666] text-right pr-3 select-none tabular-nums">
                  {idx + 1}
                </div>
                <div className="w-28 shrink-0 text-slate-500 tabular-nums">
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
                <div className="w-32 shrink-0 flex items-center gap-1.5 text-slate-400">
                  <span dangerouslySetInnerHTML={{ __html: formatted.stageIcon }} />
                  <span className="text-xs uppercase tracking-wide">{log.stage}</span>
                </div>
                <div className={cn("flex-1 whitespace-pre-wrap break-words", formatted.textColor)}>
                  {log.message}
                </div>
              </div>
            );
          })
        )}
        <motion.div 
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="w-2.5 h-4 bg-slate-400 inline-block ml-10 mt-2"
        />
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0d1117;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #30363d;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #484f58;
        }
      `}</style>
    </div>
  );
}
