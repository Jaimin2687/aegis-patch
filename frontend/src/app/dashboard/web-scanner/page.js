'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';

const STAGES = [
  { id: 'HEADERS', label: 'Headers', icon: '🛡️' },
  { id: 'SSL', label: 'SSL/TLS', icon: '🔒' },
  { id: 'TECH', label: 'Tech Stack', icon: '⚙️' },
  { id: 'COOKIES', label: 'Cookies', icon: '🍪' },
  { id: 'INFO_DISCLOSURE', label: 'Info Disclosure', icon: '🔍' },
  { id: 'AI_ANALYSIS', label: 'AI Analysis', icon: '🤖' }
];

const SEVERITY_STYLES = {
  CRITICAL: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  HIGH: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  MEDIUM: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  LOW: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', badge: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500' },
  INFO: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  PASS: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' }
};

const GRADE_STYLES = {
  'A+': { ring: 'stroke-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', glow: 'shadow-emerald-200' },
  'A':  { ring: 'stroke-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', glow: 'shadow-emerald-200' },
  'B':  { ring: 'stroke-blue-500',    text: 'text-blue-600',    bg: 'bg-blue-50',    glow: 'shadow-blue-200' },
  'C':  { ring: 'stroke-amber-500',   text: 'text-amber-600',   bg: 'bg-amber-50',   glow: 'shadow-amber-200' },
  'D':  { ring: 'stroke-orange-500',  text: 'text-orange-600',  bg: 'bg-orange-50',  glow: 'shadow-orange-200' },
  'F':  { ring: 'stroke-red-500',     text: 'text-red-600',     bg: 'bg-red-50',     glow: 'shadow-red-200' }
};

const CATEGORY_COLORS = {
  Server: 'bg-blue-100 text-blue-700',
  Framework: 'bg-violet-100 text-violet-700',
  CMS: 'bg-emerald-100 text-emerald-700',
  CDN: 'bg-amber-100 text-amber-700',
  Platform: 'bg-indigo-100 text-indigo-700',
  Runtime: 'bg-pink-100 text-pink-700',
  Library: 'bg-cyan-100 text-cyan-700',
  SSG: 'bg-lime-100 text-lime-700',
  Analytics: 'bg-orange-100 text-orange-700',
  'CSS Framework': 'bg-fuchsia-100 text-fuchsia-700',
  'Font Service': 'bg-teal-100 text-teal-700',
  'E-Commerce': 'bg-rose-100 text-rose-700',
  Payment: 'bg-yellow-100 text-yellow-800',
};

export default function WebScannerPage() {
  const { user } = useUser();
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('IDLE');
  const [currentStage, setCurrentStage] = useState(null);
  const [completedStages, setCompletedStages] = useState([]);
  const [findings, setFindings] = useState([]);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [expandedFinding, setExpandedFinding] = useState(null);
  const [copied, setCopied] = useState(null);

  const wsRef = useRef(null);

  const cleanupWs = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanupWs;
  }, [cleanupWs]);

  const handleScan = async (e) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setErrorMsg('URL must start with http:// or https://');
      return;
    }

    setErrorMsg('');
    setStatus('SCANNING');
    setCurrentStage(STAGES[0].id);
    setCompletedStages([]);
    setFindings([]);
    setResult(null);
    setExpandedFinding(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/scan-website`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed, userEmail: user?.primaryEmailAddress?.emailAddress })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to start scan');

      const sessionId = data.sessionId;
      const wsUrl = apiUrl.replace(/^http/, 'ws');
      const ws = new WebSocket(`${wsUrl}/ws?sessionId=${sessionId}`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'WEB_SCAN_STAGE') {
            const stage = msg.data?.stage;
            if (stage) {
              setCurrentStage(stage);
              setCompletedStages(prev => {
                const idx = STAGES.findIndex(s => s.id === stage);
                const done = STAGES.slice(0, idx).map(s => s.id);
                return [...new Set([...prev, ...done])];
              });
            }
          } else if (msg.type === 'WEB_SCAN_FINDING') {
            if (msg.data) setFindings(prev => [...prev, msg.data]);
          } else if (msg.type === 'WEB_SCAN_COMPLETE') {
            setResult(msg.data);
            setStatus('COMPLETE');
            setCompletedStages(STAGES.map(s => s.id));
            cleanupWs();
          } else if (msg.type === 'ERROR') {
            setErrorMsg(msg.message || 'Scan failed');
            setStatus('ERROR');
            cleanupWs();
          }
        } catch (err) {
          console.error('Failed to parse WS message', err);
        }
      };

      ws.onerror = () => {
        setErrorMsg('WebSocket connection error. Is the backend running?');
        setStatus('ERROR');
        cleanupWs();
      };
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('ERROR');
    }
  };

  const handleExport = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `aegis-web-scan-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const gradeStyle = result ? (GRADE_STYLES[result.grade] || GRADE_STYLES['F']) : GRADE_STYLES['F'];
  const circumference = 2 * Math.PI * 54;
  const scoreOffset = result ? circumference - (result.score / 100) * circumference : circumference;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="w-full h-full flex flex-col space-y-8 font-sans bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="flex justify-between items-start flex-wrap gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Website Scanner</h1>
          <p className="text-gray-500">Passive security audit for any website — headers, SSL, tech stack, cookies & AI-powered remediation.</p>
        </div>
        {status === 'COMPLETE' && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export Report</span>
            </button>
            <button
              onClick={() => { setStatus('IDLE'); setResult(null); setFindings([]); setUrl(''); }}
              className="px-3.5 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
            >
              New Scan
            </button>
          </div>
        )}
      </header>

      {/* URL Input */}
      {(status === 'IDLE' || status === 'ERROR') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
        >
          <form onSubmit={handleScan} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={!url.trim() || status === 'SCANNING'}
              className="px-6 py-3.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center gap-2 shadow-sm whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Scan Website
            </button>
          </form>
          <p className="mt-3 text-xs text-gray-400">
            ⚡ Passive scan only — we send standard HTTP requests identical to a browser. No active exploitation.
          </p>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium"
            >
              {errorMsg}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Progress Bar */}
      {(status === 'SCANNING' || status === 'COMPLETE') && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900">Scan Progress</h2>
            <span className="text-xs font-mono text-gray-500">
              {completedStages.length}/{STAGES.length} modules
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            {STAGES.map((stage) => {
              const isCompleted = completedStages.includes(stage.id);
              const isActive = currentStage === stage.id && status === 'SCANNING';
              return (
                <div
                  key={stage.id}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    isCompleted
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : isActive
                      ? 'bg-gray-900 border-gray-900 text-white'
                      : 'bg-gray-50 border-gray-200 text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isActive ? (
                    <svg className="w-4 h-4 shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <span className="w-4 h-4 shrink-0 rounded-full border-2 border-gray-300" />
                  )}
                  <span className="truncate">{stage.label}</span>
                </div>
              );
            })}
          </div>
          {status === 'SCANNING' && (
            <p className="mt-3 text-xs text-gray-400 text-center animate-pulse">
              Analyzing target... {findings.length > 0 ? `${findings.length} finding(s) detected` : ''}
            </p>
          )}
        </motion.div>
      )}

      {/* Results */}
      {status === 'COMPLETE' && result && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Grade Card + Summary Stats */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Grade Ring */}
            <div className={`bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center ${gradeStyle.glow} shadow-lg`}>
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                  <motion.circle
                    cx="60" cy="60" r="54" fill="none"
                    className={gradeStyle.ring}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: scoreOffset }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span
                    className={`text-4xl font-black ${gradeStyle.text}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                  >
                    {result.grade}
                  </motion.span>
                  <span className="text-xs font-bold text-gray-400 mt-0.5">{result.score}/100</span>
                </div>
              </div>
              <p className="mt-3 text-sm font-bold text-gray-700">Security Grade</p>
            </div>

            {/* Summary Stats */}
            <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Findings', value: result.findings?.length || 0, icon: '🔍', color: 'text-gray-900' },
                { label: 'Critical/High', value: (result.findings || []).filter(f => ['CRITICAL', 'HIGH'].includes(f.severity)).length, icon: '🚨', color: 'text-red-600' },
                { label: 'Technologies', value: result.techStack?.length || 0, icon: '⚙️', color: 'text-blue-600' },
                { label: 'Cookies Audited', value: result.cookies?.length || 0, icon: '🍪', color: 'text-amber-600' }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                >
                  <div className="text-lg mb-1">{stat.icon}</div>
                  <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs font-semibold text-gray-400 mt-0.5">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Findings */}
          {result.findings && result.findings.length > 0 && (
            <motion.div variants={itemVariants}>
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Security Findings ({result.findings.length})
              </h2>
              <div className="space-y-2">
                {result.findings.map((finding, idx) => {
                  const sev = SEVERITY_STYLES[finding.severity] || SEVERITY_STYLES.INFO;
                  const isExpanded = expandedFinding === idx;
                  return (
                    <motion.div
                      key={idx}
                      variants={itemVariants}
                      className={`bg-white border ${sev.border} rounded-xl overflow-hidden shadow-sm transition-all`}
                    >
                      <button
                        onClick={() => setExpandedFinding(isExpanded ? null : idx)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${sev.dot}`} />
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase shrink-0 ${sev.badge}`}>
                            {finding.severity}
                          </span>
                          <span className="text-xs font-mono text-gray-400 shrink-0">{finding.module}</span>
                          <span className="text-sm font-semibold text-gray-800 truncate">{finding.title}</span>
                        </div>
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-gray-100"
                          >
                            <div className="p-4 space-y-3 text-sm">
                              <p className="text-gray-600">{finding.description}</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                                  <div className="text-[10px] font-bold text-red-400 uppercase mb-1">Current</div>
                                  <div className="font-mono text-xs text-red-700 break-all whitespace-pre-wrap">{finding.current}</div>
                                </div>
                                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                                  <div className="text-[10px] font-bold text-emerald-400 uppercase mb-1">Expected</div>
                                  <div className="font-mono text-xs text-emerald-700 break-all whitespace-pre-wrap">{finding.expected}</div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Passes */}
          {result.passes && result.passes.length > 0 && (
            <motion.div variants={itemVariants}>
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Passed Checks ({result.passes.length})
              </h2>
              <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {result.passes.map((pass, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-emerald-700">
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-medium truncate">{pass.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Tech Stack */}
          {result.techStack && result.techStack.length > 0 && (
            <motion.div variants={itemVariants}>
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Detected Technologies ({result.techStack.length})
              </h2>
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex flex-wrap gap-2">
                  {result.techStack.map((tech, idx) => (
                    <div
                      key={idx}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${CATEGORY_COLORS[tech.category] || 'bg-gray-100 text-gray-700'}`}
                    >
                      <span>{tech.name}</span>
                      <span className="opacity-50">•</span>
                      <span className="opacity-60 font-medium">{tech.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Cookie Security */}
          {result.cookies && result.cookies.length > 0 && (
            <motion.div variants={itemVariants}>
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Cookie Security ({result.cookies.length})
              </h2>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-bold text-gray-600 text-xs uppercase">Cookie</th>
                      <th className="text-center px-4 py-3 font-bold text-gray-600 text-xs uppercase">Secure</th>
                      <th className="text-center px-4 py-3 font-bold text-gray-600 text-xs uppercase">HttpOnly</th>
                      <th className="text-center px-4 py-3 font-bold text-gray-600 text-xs uppercase">SameSite</th>
                      <th className="text-left px-4 py-3 font-bold text-gray-600 text-xs uppercase">Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.cookies.map((cookie, idx) => (
                      <tr key={idx} className="border-b border-gray-100 last:border-0">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-gray-800 max-w-[200px] truncate">{cookie.name}</td>
                        <td className="text-center px-4 py-3">{cookie.secure ? '✅' : '❌'}</td>
                        <td className="text-center px-4 py-3">{cookie.httpOnly ? '✅' : '❌'}</td>
                        <td className="text-center px-4 py-3">
                          <span className={`text-xs font-mono font-bold ${cookie.sameSite === 'not set' ? 'text-red-500' : 'text-gray-700'}`}>
                            {cookie.sameSite}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-red-600 font-medium">{cookie.issues?.join(', ') || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* AI Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <motion.div variants={itemVariants}>
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-500" />
                AI-Powered Recommendations ({result.recommendations.length})
              </h2>
              <div className="space-y-3">
                {result.recommendations.map((rec, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          rec.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                          rec.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {rec.priority}
                        </span>
                        <h3 className="text-sm font-bold text-gray-900">{rec.title}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                    {rec.fix && (
                      <div className="relative bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-gray-100 border-b border-gray-200">
                          <span className="text-[10px] font-bold text-gray-500 uppercase">Fix</span>
                          <button
                            onClick={() => handleCopy(rec.fix, `rec-${idx}`)}
                            className="text-[10px] font-bold text-gray-500 hover:text-gray-900 transition-colors"
                          >
                            {copied === `rec-${idx}` ? '✓ Copied' : 'Copy'}
                          </button>
                        </div>
                        <pre className="p-3 text-xs font-mono text-gray-800 overflow-x-auto whitespace-pre-wrap">{rec.fix}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Scanning State — Live Findings */}
      {status === 'SCANNING' && findings.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
        >
          <h2 className="text-sm font-bold text-gray-900 mb-3">Live Findings</h2>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {findings.map((f, idx) => {
              const sev = SEVERITY_STYLES[f.severity] || SEVERITY_STYLES.INFO;
              return (
                <div key={idx} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${sev.bg} border ${sev.border}`}>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${sev.dot}`} />
                  <span className={`text-[10px] font-bold uppercase shrink-0 ${sev.text}`}>{f.severity}</span>
                  <span className="text-xs font-medium text-gray-700 truncate">{f.title}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
