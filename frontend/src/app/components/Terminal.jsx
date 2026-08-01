'use client';
import { useEffect, useRef } from 'react';
import { getLogColor, formatTimestamp, getStageIcon } from '../../lib/formatLog';

export default function Terminal({ logs, connectionStatus }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="w-full rounded-xl border border-[#222] overflow-hidden bg-[#050505] shadow-lg mb-8">
      <div className="flex items-center justify-between bg-[#0a0a0a] px-4 py-3 border-b border-[#222]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
            <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
            <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
          </div>
          <span className="ml-3 text-[#888] font-mono text-sm">AEGIS-PATCH Terminal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'OPEN' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 
            connectionStatus === 'ERROR' || connectionStatus === 'CLOSED' ? 'bg-red-500' : 
            'bg-yellow-500'
          }`}></div>
          <span className="text-xs text-[#555] font-mono">{connectionStatus}</span>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="max-h-[500px] min-h-[300px] overflow-y-auto p-4 font-mono text-sm"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {logs.length === 0 ? (
          <div className="text-[#555] flex items-center">
            <span>Waiting for connection...</span>
            <span className="ml-1 animate-blink text-white">█</span>
          </div>
        ) : (
          <div className="flex flex-col space-y-1">
            {logs.map((log, idx) => (
              <div key={idx} className="flex flex-row items-start hover:bg-[#111] rounded px-1 -mx-1 py-0.5 transition-colors">
                <div className="text-[#444] w-12 text-right shrink-0 select-none">
                  {idx + 1}
                </div>
                <div className="text-[#555] mx-3 shrink-0 select-none">
                  {formatTimestamp(log.timestamp)}
                </div>
                {log.stage && (
                  <div className="shrink-0 mr-3 select-none flex items-center">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-[#222] text-[#888] flex items-center gap-1">
                      <span>{getStageIcon(log.stage)}</span>
                      <span>{log.stage}</span>
                    </span>
                  </div>
                )}
                <div className={`whitespace-pre-wrap break-words flex-1 ${getLogColor(log.level)}`}>
                  {log.message}
                </div>
              </div>
            ))}
            <div className="flex items-center mt-1">
              <div className="text-[#444] w-12 text-right shrink-0 select-none">
                {logs.length + 1}
              </div>
              <div className="mx-3 text-white animate-blink">█</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
