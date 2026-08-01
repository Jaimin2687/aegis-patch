'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { GlowInput } from '@/components/ui/glow-input';
import useWebSocket from '@/lib/useWebSocket';
import StatusPanel from '@/app/components/StatusPanel';
import Terminal from '@/app/components/Terminal';
import VulnCard from '@/app/components/VulnCard';
import PrResult from '@/app/components/PrResult';

export default function DashboardPage() {
  const [repoUrl, setRepoUrl] = useState(() => {
    if (typeof window !== 'undefined') return sessionStorage.getItem('aegis_repo_url') || '';
    return '';
  });
  const [pipelineStarted, setPipelineStarted] = useState(() => {
    if (typeof window !== 'undefined') return Boolean(sessionStorage.getItem('aegis_session_id'));
    return false;
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // GitHub PAT Guide & Quick Token Input state
  const [showPatGuide, setShowPatGuide] = useState(true);
  const [userPat, setUserPat] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('aegis_github_token') || '';
    return '';
  });
  const [patSaved, setPatSaved] = useState(false);

  // Vulnerability search & severity filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');

  const { sessionId, stage, logs, vulns, result, error: wsError, connectionStatus, startSession, clearSession } = useWebSocket();

  // Keep pipelineStarted in sync if session ID exists
  useEffect(() => {
    if (sessionId) {
      setPipelineStarted(true);
    }
  }, [sessionId]);

  const handleSavePat = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('aegis_github_token', userPat.trim());
    }
    setPatSaved(true);
    setTimeout(() => setPatSaved(false), 3000);
  };

  const handleStartNewScan = () => {
    clearSession();
    setPipelineStarted(false);
    setRepoUrl('');
    setSubmitError(null);
    setSearchQuery('');
    setSelectedSeverity('ALL');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    // Validate GitHub URL format
    if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\.git)?\/?$/.test(repoUrl.trim())) {
      setSubmitError('Please enter a valid GitHub repository URL (e.g., https://github.com/user/repo)');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      if (typeof window !== 'undefined') sessionStorage.setItem('aegis_repo_url', repoUrl);
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/patch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, token: userPat.trim() || undefined })
      });

      if (!res.ok) {
        throw new Error('Failed to start pipeline');
      }

      const data = await res.json();
      startSession(data.sessionId);
      setPipelineStarted(true);
    } catch (err) {
      setSubmitError(err.message || 'An error occurred while connecting to the pipeline.');
    } finally {
      setSubmitting(false);
    }
  };

  // Severity counts computation
  const severityCounts = useMemo(() => {
    const counts = { ALL: vulns.length, CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    vulns.forEach(v => {
      const sev = (v.severity || 'MEDIUM').toUpperCase();
      if (counts[sev] !== undefined) counts[sev]++;
    });
    return counts;
  }, [vulns]);

  // Filtered vulnerabilities list
  const filteredVulns = useMemo(() => {
    return vulns.filter(v => {
      const matchesSeverity = selectedSeverity === 'ALL' || (v.severity || '').toUpperCase() === selectedSeverity;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery = !q || 
        (v.packageName || '').toLowerCase().includes(q) ||
        (v.cveId || '').toLowerCase().includes(q) ||
        (v.ghsaId || '').toLowerCase().includes(q) ||
        (v.title || '').toLowerCase().includes(q);
      return matchesSeverity && matchesQuery;
    });
  }, [vulns, selectedSeverity, searchQuery]);

  // Export audit report as JSON
  const handleExportReport = () => {
    const reportData = {
      sessionId,
      repoUrl,
      timestamp: new Date().toISOString(),
      summary: {
        totalVulnerabilities: vulns.length,
        severityBreakdown: severityCounts,
        prUrl: result?.prUrl || null
      },
      vulnerabilities: vulns
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aegis-audit-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="w-full h-full flex flex-col space-y-8 font-sans">
      <header className="flex justify-between items-start flex-wrap gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-white">Command Center</h1>
          <p className="text-slate-400">Launch and monitor vulnerability patching pipelines.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowPatGuide(!showPatGuide)}
            className="px-3.5 py-2 bg-slate-900/90 hover:bg-slate-800 border border-white/15 text-slate-300 hover:text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-md hover:border-cyan-500/40"
          >
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <span>{showPatGuide ? 'Hide Token Setup' : 'GitHub Token Guide'}</span>
          </button>

          {pipelineStarted && (
            <>
              {vulns.length > 0 && (
                <button
                  onClick={handleExportReport}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md"
                  title="Export audit report as JSON"
                >
                  <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Export Report</span>
                </button>
              )}
              <button
                onClick={handleStartNewScan}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-white/15 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-md hover:border-cyan-500/30"
              >
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Start New Scan</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* ─── Premium GitHub Integration Personal Access Token Note Card ─── */}
      <AnimatePresence>
        {showPatGuide && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="w-full bg-[#0c0e14] border border-cyan-500/25 rounded-2xl p-6 shadow-2xl shadow-cyan-950/20 relative overflow-hidden space-y-5"
          >
            {/* Subtle Gradient Glow Corner */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header Bar */}
            <div className="flex justify-between items-start gap-4 relative z-10">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-cyan-500/15 border border-cyan-500/30 rounded-xl text-cyan-400 shrink-0">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      GitHub Personal Access Token (PAT) Setup
                    </h3>
                    <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                      Required for Pull Requests
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    AEGIS-PATCH uses your Personal Access Token to commit fix branches and open Pull Requests. Follow the 3 steps below to set up your token:
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowPatGuide(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0"
                aria-label="Close setup guide"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 3 Step Instruction Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 relative z-10">
              {/* Step 1 */}
              <div className="bg-[#11131c] border border-white/10 p-4 rounded-xl space-y-1.5 hover:border-cyan-500/30 transition-colors">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[11px]">1</span>
                  <span>Generate Token</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Go to <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline font-medium">GitHub Developer Settings</a> to create a Fine-grained Token.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-[#11131c] border border-white/10 p-4 rounded-xl space-y-1.5 hover:border-indigo-500/30 transition-colors">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[11px]">2</span>
                  <span>Set Permissions</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Under <em>Repository Permissions</em>, grant <strong className="text-emerald-400">Read & write</strong> for both <strong className="text-white">Contents</strong> and <strong className="text-white">Pull requests</strong>.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-[#11131c] border border-white/10 p-4 rounded-xl space-y-1.5 hover:border-emerald-500/30 transition-colors">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[11px]">3</span>
                  <span>Paste or Save Token</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Paste your PAT (<code className="text-cyan-300 font-mono">github_pat_...</code>) in the input below or add to <code className="text-cyan-300 font-mono">backend/.env</code>.
                </p>
              </div>
            </div>

            {/* Quick PAT Input & Actions */}
            <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-2 flex-1 max-w-xl">
                <input
                  type="password"
                  value={userPat}
                  onChange={(e) => setUserPat(e.target.value)}
                  placeholder="Paste your GitHub Personal Access Token (github_pat_...)"
                  className="flex-1 bg-black/80 border border-white/15 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 font-mono outline-none transition-colors"
                />
                <button
                  onClick={handleSavePat}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black font-semibold text-xs rounded-xl shadow-md transition-all shrink-0 active:scale-95"
                >
                  {patSaved ? '✓ Saved!' : 'Save PAT'}
                </button>
              </div>

              <div className="flex items-center gap-3 justify-end shrink-0">
                <a
                  href="https://github.com/settings/tokens?type=beta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-white/15 text-cyan-300 hover:text-white text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <span>Generate on GitHub</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <Link
                  href="/dashboard/settings"
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-white/15 text-slate-300 hover:text-white text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Settings</span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="w-full max-w-2xl">
        <GlowInput
          value={repoUrl}
          onChange={(e) => { setRepoUrl(e.target.value); setSubmitError(null); }}
          onSubmit={handleSubmit}
          placeholder="https://github.com/username/repository"
          isLoading={submitting}
          error={submitError}
          disabled={submitting || pipelineStarted}
        />
      </form>

      <AnimatePresence mode="wait">
        {!pipelineStarted ? (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-32 h-32 mb-6 rounded-full bg-slate-900/50 border border-white/5 flex items-center justify-center relative shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <svg className="w-12 h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-white mb-2">Awaiting Target</h3>
            <p className="text-slate-400 max-w-md">
              Enter a repository URL above to begin the autonomous security patching process.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="pipeline-active"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex-1 flex flex-col space-y-8 pb-12"
          >
            <motion.div variants={itemVariants}>
              <StatusPanel currentStage={stage} isError={!!wsError} />
            </motion.div>

            {wsError && connectionStatus !== 'OPEN' && (
              <motion.div variants={itemVariants} className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold">Pipeline Error</h4>
                  <p className="text-sm mt-1 opacity-80">{wsError}</p>
                </div>
                <button
                  onClick={handleStartNewScan}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 transition-colors font-medium"
                >
                  ↺ Retry / Reset
                </button>
              </motion.div>
            )}

            {result && (
              <motion.div variants={itemVariants}>
                <PrResult result={result} />
              </motion.div>
            )}

            {vulns.length > 0 && (
              <motion.div variants={itemVariants} className="space-y-4">
                {/* Vulnerability Filter Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/40 p-4 rounded-2xl border border-white/10">
                  <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Detected Vulnerabilities ({filteredVulns.length} of {vulns.length})
                  </h3>

                  {/* Filter Pills & Search */}
                  <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
                    {/* Search Input */}
                    <div className="relative flex-1 sm:w-64">
                      <svg className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search package or CVE..."
                        className="w-full bg-slate-950/80 border border-white/15 focus:border-cyan-500/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
                      />
                    </div>

                    {/* Severity Pills */}
                    <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10 text-xs font-medium">
                      {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => {
                        const count = severityCounts[sev] || 0;
                        if (sev !== 'ALL' && count === 0) return null;
                        const isSelected = selectedSeverity === sev;
                        return (
                          <button
                            key={sev}
                            onClick={() => setSelectedSeverity(sev)}
                            className={`px-2.5 py-1 rounded-lg transition-all text-[11px] ${
                              isSelected
                                ? 'bg-cyan-500 text-black font-bold shadow-sm shadow-cyan-500/30'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {sev} ({count})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Cards Grid */}
                {filteredVulns.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {filteredVulns.map((vuln) => (
                        <VulnCard key={vuln.cveId || vuln.ghsaId || Math.random().toString()} vuln={vuln} />
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-900/30 border border-white/5 rounded-xl text-slate-400 text-sm">
                    No vulnerabilities match your filter criteria "{searchQuery || selectedSeverity}".
                  </div>
                )}
              </motion.div>
            )}

            <motion.div variants={itemVariants} className="flex-1 min-h-[400px]">
              <Terminal logs={logs} connectionStatus={connectionStatus} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
