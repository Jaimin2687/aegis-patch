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
import VulnChart from '@/app/components/VulnChart';
import PackageChart from '@/app/components/PackageChart';
import MetricCard from '@/app/components/MetricCard';

export default function DashboardPage() {
  const [repoUrl, setRepoUrl] = useState('');
  const [pipelineStarted, setPipelineStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [showPatGuide, setShowPatGuide] = useState(true);
  const [userPat, setUserPat] = useState('');

  useEffect(() => {
    setRepoUrl(sessionStorage.getItem('aegis_repo_url') || '');
    setPipelineStarted(Boolean(sessionStorage.getItem('aegis_session_id')));
    setUserPat(localStorage.getItem('aegis_github_token') || '');
  }, []);
  const [patSaved, setPatSaved] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  
  const [globalStats, setGlobalStats] = useState({ totalScans: 0, successRate: 0, criticalVulns: 0, mttr: '0s' });

  const fetchGlobalStats = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/history`);
      if (res.ok) {
        const history = await res.json();
        
        let successCount = 0;
        let critCount = 0;
        let totalTimeSec = 0;
        let completeCount = 0;

        history.forEach(scan => {
          if (scan.status === 'success') successCount++;
          if (scan.status === 'success' || scan.status === 'error') {
             completeCount++;
             if (scan.duration) totalTimeSec += parseFloat(scan.duration) || 0;
          }
          if (scan.vulns && Array.isArray(scan.vulns)) {
             critCount += scan.vulns.filter(v => (v.severity || '').toUpperCase() === 'CRITICAL').length;
          }
        });

        const rate = history.length ? Math.round((successCount / history.length) * 100) : 0;
        const avgTime = completeCount ? Math.round(totalTimeSec / completeCount) : 0;
        
        setGlobalStats({
          totalScans: history.length,
          successRate: rate,
          criticalVulns: critCount,
          mttr: avgTime ? `${avgTime}s` : '--',
        });
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  const { sessionId, stage, logs, vulns, result, error: wsError, connectionStatus, startSession, clearSession } = useWebSocket();

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
        let errMsg = 'Failed to start pipeline';
        try {
          const errData = await res.json();
          if (errData.error) errMsg = errData.error;
        } catch (e) {
          // ignore parsing error
        }
        throw new Error(errMsg);
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

  const severityCounts = useMemo(() => {
    const counts = { ALL: vulns.length, CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    vulns.forEach(v => {
      const sev = (v.severity || 'MEDIUM').toUpperCase();
      if (counts[sev] !== undefined) counts[sev]++;
    });
    return counts;
  }, [vulns]);

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
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="w-full h-full flex flex-col space-y-8 font-sans bg-gray-50 text-gray-900">
      <header className="flex justify-between items-start flex-wrap gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Command Center</h1>
          <p className="text-gray-500">Launch and monitor vulnerability patching pipelines.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowPatGuide(!showPatGuide)}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <span>{showPatGuide ? 'Hide Token Setup' : 'GitHub Token Guide'}</span>
          </button>

          {pipelineStarted && (
            <>
              {vulns.length > 0 && (
                <button
                  onClick={handleExportReport}
                  className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                  title="Export audit report as JSON"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Export Report</span>
                </button>
              )}
              <button
                onClick={handleStartNewScan}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-transparent text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Start New Scan</span>
              </button>
            </>
          )}
        </div>
      </header>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={itemVariants}>
          <MetricCard 
            title="Total Scans" 
            value={globalStats.totalScans} 
            trend={globalStats.totalScans > 0 ? "+1" : null}
            trendLabel="recently"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <MetricCard 
            title="Avg. Time to Patch" 
            value={globalStats.mttr} 
            trend="-12%"
            trendLabel="vs last week"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <MetricCard 
            title="Pipeline Success Rate" 
            value={`${globalStats.successRate}%`} 
            trend="+5%"
            trendLabel="vs last week"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <MetricCard 
            title="Critical Risks Found" 
            value={globalStats.criticalVulns} 
            trend={globalStats.criticalVulns > 0 ? "-2" : null}
            trendLabel="mitigated"
            icon={
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showPatGuide && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5 relative"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 shrink-0">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                      GitHub Personal Access Token (PAT) Setup
                    </h3>
                    <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                      Required for Pull Requests
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
                    AEGIS-PATCH uses your Personal Access Token to commit fix branches and open Pull Requests. Follow the 3 steps below to set up your token:
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowPatGuide(false)}
                className="text-gray-400 hover:text-gray-900 p-1.5 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
                aria-label="Close setup guide"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-1.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-900 mb-1">
                    <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-[11px]">1</span>
                    <span>Generate Token</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Go to <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium">GitHub Developer Settings</a> to create a Fine-grained Token.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-1.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-900 mb-1">
                    <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-[11px]">2</span>
                    <span>Set Permissions</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Under <em>Repository Permissions</em>, grant <strong className="text-gray-900">Read & write</strong> for both <strong className="text-gray-900">Contents</strong> and <strong className="text-gray-900">Pull requests</strong>.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-1.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-900 mb-1">
                    <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-[11px]">3</span>
                    <span>Paste or Save Token</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Paste your PAT (<code className="text-gray-800 font-mono">github_pat_...</code>) in the input below.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-xl">
                <input
                  type="password"
                  value={userPat}
                  onChange={(e) => setUserPat(e.target.value)}
                  placeholder="Paste your GitHub Personal Access Token (github_pat_...)"
                  className="flex-1 bg-white border border-gray-200 focus:border-gray-400 rounded-xl px-3.5 py-2 text-xs text-gray-900 placeholder-gray-400 font-mono outline-none transition-colors"
                />
                <button
                  onClick={handleSavePat}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-all shrink-0 active:scale-95"
                >
                  {patSaved ? '✓ Saved!' : 'Save PAT'}
                </button>
              </div>

              <div className="flex items-center gap-3 justify-end shrink-0">
                <a
                  href="https://github.com/settings/tokens?type=beta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <span>Generate on GitHub</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <Link
                  href="/dashboard/settings"
                  className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="w-32 h-32 mb-6 rounded-full bg-white border border-gray-200 flex items-center justify-center relative shadow-sm">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Awaiting Target</h3>
            <p className="text-gray-500 max-w-md">
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
              <motion.div variants={itemVariants} className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
                <svg className="w-5 h-5 shrink-0 mt-0.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold">Pipeline Error</h4>
                  <p className="text-sm mt-1 opacity-80">{wsError}</p>
                </div>
                <button
                  onClick={handleStartNewScan}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 border border-red-200 text-red-700 transition-colors font-medium"
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
              <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                
                {/* Analytics / Chart Column */}
                <div className="xl:col-span-1 flex flex-col gap-6">
                  {/* Severity Breakdown */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                    <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                      </svg>
                      Severity Breakdown
                    </h3>
                    <div className="flex-1 flex items-center justify-center">
                      <VulnChart severityCounts={severityCounts} />
                    </div>
                  </div>

                  {/* Top Vulnerable Packages */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                    <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      Top Affected Packages
                    </h3>
                    <div className="flex-1">
                      <PackageChart vulns={vulns} />
                    </div>
                  </div>
                </div>

                {/* Vulnerabilities List Column */}
                <div className="xl:col-span-3 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Detected Vulnerabilities ({filteredVulns.length} of {vulns.length})
                    </h3>

                    <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search package or CVE..."
                          className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-500 outline-none transition-colors"
                        />
                      </div>

                      <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200 text-xs font-medium">
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
                                  ? 'bg-white text-gray-900 font-bold shadow-sm border border-gray-200'
                                  : 'text-gray-500 hover:text-gray-900 hover:bg-white'
                              }`}
                            >
                              {sev} ({count})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {filteredVulns.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                      <AnimatePresence>
                        {filteredVulns.map((vuln, idx) => (
                          <VulnCard key={`${vuln.cveId || vuln.ghsaId || vuln.packageName || 'vuln'}-${idx}`} vuln={vuln} />
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-white border border-gray-200 rounded-xl text-gray-500 text-sm shadow-sm">
                      No vulnerabilities match your filter criteria "{searchQuery || selectedSeverity}".
                    </div>
                  )}
                </div>
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
