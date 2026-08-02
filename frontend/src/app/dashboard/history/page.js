'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { SectionHeading } from '@/components/ui/section-heading';
import { motion, AnimatePresence } from 'framer-motion';
import VulnCard from '@/app/components/VulnCard';
import Terminal from '@/app/components/Terminal';

const SEVERITY_COLORS = {
  CRITICAL: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  LOW: 'bg-sky-100 text-sky-700',
  INFO: 'bg-slate-100 text-slate-600',
  PASS: 'bg-emerald-100 text-emerald-700'
};

const GRADE_COLORS = {
  'A+': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'A': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'B': 'bg-blue-100 text-blue-700 border-blue-200',
  'C': 'bg-amber-100 text-amber-700 border-amber-200',
  'D': 'bg-orange-100 text-orange-700 border-orange-200',
  'F': 'bg-red-100 text-red-700 border-red-200',
};

export default function ScanHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const router = useRouter();

  useEffect(() => {
    setShowLogs(false);
  }, [selectedScan?.id]);

  const fetchHistory = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  useEffect(() => {
    if (!selectedScan) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedScan(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedScan]);

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

  const webStatusConfig = {
    success: { variant: 'success', label: 'Scanned' },
    error: { variant: 'error', label: 'Failed' },
    running: { variant: 'info', label: 'Scanning' },
  };

  const handleOpenActiveWorkspace = (scan) => {
    if (typeof window !== 'undefined' && scan) {
      sessionStorage.setItem('aegis_session_id', scan.id);
      sessionStorage.setItem('aegis_repo_url', scan.repoUrl || `https://github.com/${scan.repo}`);
      if (scan.vulns) sessionStorage.setItem('aegis_vulns', JSON.stringify(scan.vulns));
      if (scan.logs) sessionStorage.setItem('aegis_logs', JSON.stringify(scan.logs));
      if (scan.prUrl) sessionStorage.setItem('aegis_result', JSON.stringify({ prUrl: scan.prUrl }));
      sessionStorage.setItem('aegis_stage', scan.status === 'success' ? 'COMPLETE' : scan.status === 'error' ? 'ERROR' : 'RUNNING');
    }
    router.push('/dashboard');
  };

  const isWebScan = (item) => item.type === 'website';

  const filteredHistory = activeTab === 'all'
    ? history
    : activeTab === 'repo'
    ? history.filter(h => !isWebScan(h))
    : history.filter(h => isWebScan(h));

  const repoCount = history.filter(h => !isWebScan(h)).length;
  const webCount = history.filter(h => isWebScan(h)).length;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1, transition: { staggerChildren: 0.1 } }} 
      className="w-full max-w-5xl mx-auto space-y-8 pb-12"
    >
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } }}>
        <SectionHeading 
          eyebrow="Audit Log" 
          title="Scan History" 
          subtitle="Review past autonomous patching pipelines & website vulnerability scans."
        />
      </motion.div>

      {/* Tab Filter */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }}>
        <div className="flex items-center gap-2">
          {[
            { key: 'all', label: 'All Scans', count: history.length },
            { key: 'repo', label: 'Repo Patches', count: repoCount },
            { key: 'web', label: 'Website Scans', count: webCount },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all border ${
                activeTab === tab.key
                  ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md ${
                activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20, delay: 0.1 } }}>
      <SpotlightCard className="p-0 overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">Target</th>
                <th scope="col" className="px-6 py-4 font-medium">Type</th>
                <th scope="col" className="px-6 py-4 font-medium">Date</th>
                <th scope="col" className="px-6 py-4 font-medium">Result</th>
                <th scope="col" className="px-6 py-4 font-medium">Status</th>
                <th scope="col" className="px-6 py-4 font-medium">Duration</th>
                <th scope="col" className="px-6 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Loading scan history...
                      </div>
                    </td>
                  </tr>
                ) : filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      {activeTab === 'web' ? 'No website scans yet. Use the Web Scanner to audit a URL.' : activeTab === 'repo' ? 'No repo patches yet. Run a pipeline from the Dashboard.' : 'No scans yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item, index) => {
                    const isWeb = isWebScan(item);
                    const cfg = isWeb ? webStatusConfig : statusConfig;
                    const status = cfg[item.status] || cfg.running;
                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24, delay: index * 0.03 } }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedScan(item)}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-950 cursor-pointer transition-colors group"
                      >
                        {/* Target */}
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                          <div className="flex items-center space-x-2">
                            {isWeb ? (
                              <svg className="w-4 h-4 text-cyan-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                              </svg>
                            )}
                            <span className="truncate max-w-[220px] transition-colors">
                              {isWeb ? (item.url || '—') : (item.repo || '—')}
                            </span>
                          </div>
                        </td>
                        {/* Type badge */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            isWeb ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800' : 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800'
                          }`}>
                            {isWeb ? 'Web Scan' : 'Repo Patch'}
                          </span>
                        </td>
                        {/* Date */}
                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{formatDate(item.date)}</td>
                        {/* Result */}
                        <td className="px-6 py-4">
                          {isWeb ? (
                            item.grade ? (
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black border ${GRADE_COLORS[item.grade] || GRADE_COLORS['F']}`}>
                                {item.grade}
                                <span className="font-medium opacity-70">{item.score}/100</span>
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )
                          ) : (
                            <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200 font-mono text-gray-900">
                              {item.vulnsFound ?? 0}
                            </span>
                          )}
                        </td>
                        {/* Status */}
                        <td className="px-6 py-4">
                          <Badge variant={status.variant}>
                            {item.status === 'running' && (
                              <span className="relative flex h-2 w-2 mr-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                              </span>
                            )}
                            {status.label}
                          </Badge>
                        </td>
                        {/* Duration */}
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono">{item.duration || '—'}</td>
                        {/* Action */}
                        <td className="px-6 py-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedScan(item); }}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                          >
                            <span>{isWeb ? 'View Report' : 'Inspect Scan'}</span>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
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
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedScan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedScan(null)}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-4xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden z-10 my-8 text-gray-900 dark:text-gray-100"
            >
              <div className={`h-1.5 w-full ${isWebScan(selectedScan) ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-800'}`} />

              <div className="p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
                
                {/* Header */}
                <div className="flex justify-between items-start gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                        isWebScan(selectedScan) ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800' : 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800'
                      }`}>
                        {isWebScan(selectedScan) ? 'Website Scan' : 'Repo Patch'}
                      </span>
                      <span className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 px-2.5 py-0.5 rounded-full font-semibold">
                        {selectedScan.id.slice(0, 8)}...
                      </span>
                      <Badge variant={((isWebScan(selectedScan) ? webStatusConfig : statusConfig)[selectedScan.status] || statusConfig.running).variant}>
                        {selectedScan.status.toUpperCase()}
                      </Badge>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight pt-1 flex items-center gap-2">
                      {isWebScan(selectedScan) ? (
                        <svg className="w-6 h-6 text-cyan-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-gray-500 dark:text-gray-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                      )}
                      {isWebScan(selectedScan) ? selectedScan.url : selectedScan.repo}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono pt-0.5">Scanned on {formatDate(selectedScan.date)}</p>
                  </div>

                  <button
                    onClick={() => setSelectedScan(null)}
                    className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-800 rounded-lg transition-colors shrink-0"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {isWebScan(selectedScan) ? (
                  <>
                    {/* Grade + Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className={`p-4 rounded-xl border text-center ${GRADE_COLORS[selectedScan.grade] || 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800'}`}>
                        <div className="text-3xl font-black text-gray-900 dark:text-gray-100">{selectedScan.grade || '—'}</div>
                        <div className="text-xs font-bold mt-1 opacity-70 text-gray-600 dark:text-gray-400">{selectedScan.score != null ? `${selectedScan.score}/100` : 'Score'}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-4 rounded-xl space-y-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Findings</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-mono">{selectedScan.findingsCount ?? selectedScan.results?.findings?.length ?? 0}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-4 rounded-xl space-y-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Technologies</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-mono">{selectedScan.techStack?.length ?? selectedScan.results?.techStack?.length ?? 0}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-4 rounded-xl space-y-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Duration</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-mono">{selectedScan.duration || '—'}</div>
                      </div>
                    </div>

                    {/* Findings list */}
                    {selectedScan.results?.findings && selectedScan.results.findings.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Security Findings ({selectedScan.results.findings.length})
                        </h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {selectedScan.results.findings.map((f, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl">
                              <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${SEVERITY_COLORS[f.severity] || SEVERITY_COLORS.INFO}`}>
                                {f.severity}
                              </span>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{f.title}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{f.module} — {f.description}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Passed checks */}
                    {selectedScan.results?.passes && selectedScan.results.passes.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-500 mb-2">Passed Checks ({selectedScan.results.passes.length})</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {selectedScan.results.passes.map((p, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-500">
                              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="font-medium">{p.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tech stack */}
                    {(selectedScan.techStack || selectedScan.results?.techStack) && (selectedScan.techStack || selectedScan.results?.techStack).length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Detected Technologies</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedScan.techStack || selectedScan.results?.techStack).map((t, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300">
                              {t.name} <span className="opacity-50 font-medium">• {t.category}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Recommendations */}
                    {selectedScan.results?.recommendations && selectedScan.results.recommendations.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">AI Recommendations ({selectedScan.results.recommendations.length})</h3>
                        {selectedScan.results.recommendations.map((rec, idx) => (
                          <div key={idx} className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                rec.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                rec.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>{rec.priority}</span>
                              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{rec.title}</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{rec.description}</p>
                            {rec.fix && (
                              <pre className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap">{rec.fix}</pre>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-4 rounded-xl space-y-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Vulnerabilities Detected</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-mono">{selectedScan.vulnsFound}</div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-4 rounded-xl space-y-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Pipeline Duration</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-mono">{selectedScan.duration || '—'}</div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-4 rounded-xl space-y-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Pull Request Status</div>
                        {selectedScan.prUrl ? (
                          <a
                            href={selectedScan.prUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 underline font-medium flex items-center gap-1 pt-1 truncate"
                          >
                            <span>View Open PR</span>
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400 pt-1">No PR generated</div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Detected Vulnerabilities ({selectedScan.vulns ? selectedScan.vulns.length : selectedScan.vulnsFound})
                        </span>
                      </h3>

                      {selectedScan.vulns && selectedScan.vulns.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedScan.vulns.map((v, idx) => (
                            <VulnCard key={`${v.cveId || v.ghsaId || v.packageName || 'vuln'}-${idx}`} vuln={v} />
                          ))}
                        </div>
                      ) : (
                        <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-6 rounded-xl text-center text-gray-500 dark:text-gray-400 space-y-1">
                          <p className="text-sm font-medium">Summary Report Only</p>
                          <p className="text-xs text-gray-400">
                            {selectedScan.vulnsFound > 0 
                              ? `${selectedScan.vulnsFound} vulnerability flags detected during this run.`
                              : 'Zero vulnerabilities were detected during this scan execution.'}
                          </p>
                        </div>
                      )}
                    </div>

                    {selectedScan.logs && selectedScan.logs.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <button
                          onClick={() => setShowLogs((v) => !v)}
                          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 dark:text-gray-100 flex items-center gap-2 font-medium transition-colors"
                        >
                          <svg className={`w-4 h-4 transform transition-transform ${showLogs ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                          <span>{showLogs ? 'Hide Historical Execution Logs' : `Show Execution Logs (${selectedScan.logs.length} entries)`}</span>
                        </button>

                        {showLogs && (
                          <div className="min-h-[300px]">
                            <Terminal logs={selectedScan.logs} connectionStatus="CLOSED" />
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                <div className="pt-4 flex items-center justify-between gap-4 border-t border-gray-200 dark:border-gray-800">
                  {!isWebScan(selectedScan) ? (
                    <button
                      onClick={() => handleOpenActiveWorkspace(selectedScan)}
                      className="px-4 py-2 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 dark:text-gray-100 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm"
                    >
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>Open Session in Command Center</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (selectedScan.results) {
                          const blob = new Blob([JSON.stringify(selectedScan.results, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `aegis-web-scan-${selectedScan.id.slice(0,8)}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }
                      }}
                      disabled={!selectedScan.results}
                      className="px-4 py-2 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm"
                    >
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Export Full Report</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedScan(null)}
                    className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
                  >
                    Close
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
