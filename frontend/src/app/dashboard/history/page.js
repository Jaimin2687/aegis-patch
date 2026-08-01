'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { SectionHeading } from '@/components/ui/section-heading';
import { motion, AnimatePresence } from 'framer-motion';

export default function ScanHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch scan history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount + poll every 5 seconds for live updates
  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const statusConfig = {
    success: { variant: 'success', label: 'Patched' },
    error: { variant: 'error', label: 'Failed' },
    running: { variant: 'info', label: 'Running' },
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <SectionHeading 
        eyebrow="Audit Log" 
        title="Scan History" 
        subtitle="Review previous autonomous patching pipelines and generated pull requests."
      />

      <SpotlightCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-white/10">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">Repository</th>
                <th scope="col" className="px-6 py-4 font-medium">Date</th>
                <th scope="col" className="px-6 py-4 font-medium">Vulns</th>
                <th scope="col" className="px-6 py-4 font-medium">Status</th>
                <th scope="col" className="px-6 py-4 font-medium">Duration</th>
                <th scope="col" className="px-6 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Loading scan history...
                      </div>
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No scans yet. Run a pipeline from the Dashboard to see results here.
                    </td>
                  </tr>
                ) : (
                  history.map((item) => {
                    const status = statusConfig[item.status] || statusConfig.running;
                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-slate-200">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-slate-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            <span className="truncate max-w-[200px]">{item.repo}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-400 whitespace-nowrap">{formatDate(item.date)}</td>
                        <td className="px-6 py-4 text-slate-300 font-mono">{item.vulnsFound}</td>
                        <td className="px-6 py-4">
                          <Badge variant={status.variant}>
                            {item.status === 'running' && (
                              <span className="relative flex h-2 w-2 mr-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                              </span>
                            )}
                            {status.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-mono">{item.duration || '—'}</td>
                        <td className="px-6 py-4">
                          {item.prUrl ? (
                            <a href={item.prUrl} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300 font-medium text-xs flex items-center space-x-1">
                              <span>View PR</span>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          ) : (
                            <span className="text-slate-600 text-xs">—</span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </SpotlightCard>
    </div>
  );
}
