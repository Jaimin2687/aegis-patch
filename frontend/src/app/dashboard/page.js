'use client';

import React, { useState, useEffect } from 'react';
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

  const { sessionId, stage, logs, vulns, result, error: wsError, connectionStatus, startSession, clearSession } = useWebSocket();

  // Keep pipelineStarted in sync if session ID exists
  useEffect(() => {
    if (sessionId) {
      setPipelineStarted(true);
    }
  }, [sessionId]);

  const handleStartNewScan = () => {
    clearSession();
    setPipelineStarted(false);
    setRepoUrl('');
    setSubmitError(null);
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
        body: JSON.stringify({ repoUrl })
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

        {pipelineStarted && (
          <button
            onClick={handleStartNewScan}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-white/15 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-md hover:border-cyan-500/30"
          >
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Start New Scan</span>
          </button>
        )}
      </header>

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
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Detected Vulnerabilities ({vulns.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {vulns.map((vuln) => (
                      <VulnCard key={vuln.cveId || vuln.ghsaId || Math.random().toString()} vuln={vuln} />
                    ))}
                  </AnimatePresence>
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
