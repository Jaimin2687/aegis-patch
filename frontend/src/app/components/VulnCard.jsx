'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { Badge } from '@/components/ui/badge';

export default function VulnCard({ vuln }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const v = vuln || {};
  const cveId = v.cveId || v.ghsaId || 'UNKNOWN-CVE';
  const ghsaId = v.ghsaId || v.cveId;
  const severity = (v.severity || 'MEDIUM').toUpperCase();
  const description = v.description || v.vulnData?.details || v.title || 'No detailed vulnerability description available for this advisory.';
  const title = v.title || 'Security Vulnerability';
  const packageName = v.packageName || 'Unknown Package';
  const installedVersion = v.installedVersion || '0.0.0';
  const targetVersion = v.targetVersion || v.patchedVersion || 'Latest Safe';
  const cvss = Number(v.cvssScore) || (severity === 'CRITICAL' ? 9.5 : severity === 'HIGH' ? 8.2 : severity === 'MEDIUM' ? 5.5 : 3.1);
  const patchedVersion = v.patchedVersion;
  const advisoryUrl = v.fixCommitUrl || (ghsaId ? `https://osv.dev/vulnerability/${ghsaId}` : `https://osv.dev/list?q=${packageName}`);

  const severityConfig = {
    CRITICAL: { variant: 'destructive', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', gradient: 'from-red-500 to-rose-600', badgeBg: 'bg-red-950/80 text-red-300 border-red-500/40' },
    HIGH: { variant: 'destructive', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', gradient: 'from-orange-500 to-amber-600', badgeBg: 'bg-orange-950/80 text-orange-300 border-orange-500/40' },
    MEDIUM: { variant: 'warning', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', gradient: 'from-amber-400 to-yellow-500', badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-500/40' },
    LOW: { variant: 'info', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', gradient: 'from-cyan-400 to-blue-500', badgeBg: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40' }
  }[severity] || { variant: 'default', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30', gradient: 'from-slate-400 to-slate-600', badgeBg: 'bg-slate-900 text-slate-300 border-slate-700' };

  // Keyboard escape listener & body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') setIsOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);

  const copyCommand = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`npm install ${packageName}@${targetVersion}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* ─── Vulnerability Tile Card ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, type: 'spring' }}
        className="h-full cursor-pointer group"
        onClick={() => setIsOpen(true)}
      >
        <SpotlightCard className="h-full p-5 bg-[#0a0a0a] border border-white/10 group-hover:border-cyan-500/50 group-hover:shadow-lg group-hover:shadow-cyan-500/10 transition-all duration-300 rounded-xl flex flex-col gap-4 relative overflow-hidden">
          {/* Subtle Glow Corner */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/15 transition-all duration-500 pointer-events-none" />

          {/* Card Header */}
          <div className="flex justify-between items-start gap-2 relative z-10">
            <div>
              <h4 className="font-bold text-lg text-white tracking-tight group-hover:text-cyan-400 transition-colors flex items-center gap-2">
                {cveId}
                <svg className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </h4>
              <p className="text-xs text-slate-400 font-mono mt-0.5 line-clamp-1">{title}</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end shrink-0">
              <Badge variant={severityConfig.variant} className="text-xs font-semibold">
                {severity}
              </Badge>
              {patchedVersion && (
                <Badge variant="success" className="text-xs border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
                  Patched
                </Badge>
              )}
            </div>
          </div>

          {/* Description snippet */}
          <p className="text-sm text-slate-400 line-clamp-2 relative z-10" title={description}>
            {description}
          </p>

          {/* Package details & CVSS bar */}
          <div className="mt-auto pt-2 space-y-3 relative z-10">
            <div className="bg-slate-900/60 p-3 rounded-lg border border-white/5 group-hover:border-cyan-500/20 transition-colors">
              <div className="text-xs font-mono text-slate-400 mb-1 flex justify-between items-center">
                <span>{packageName}</span>
                <span className="text-[10px] text-slate-500">npm</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-mono">
                <span className="text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">{installedVersion}</span>
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">{targetVersion}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-400">CVSS Score</span>
                <span className={severityConfig.color}>{cvss.toFixed(1)} / 10</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${severityConfig.gradient} transition-all duration-1000 ease-out`}
                  style={{ width: `${(cvss / 10) * 100}%` }}
                />
              </div>
            </div>

            {/* Click inspect hint */}
            <div className="pt-1 flex items-center justify-between text-xs text-slate-500 group-hover:text-cyan-400 transition-colors">
              <span className="flex items-center gap-1 font-medium">
                <span>Inspect Breakdown & Patch Strategy</span>
              </span>
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </SpotlightCard>
      </motion.div>

      {/* ─── Full-Screen Detail Modal ─── */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto">
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-3xl bg-[#0e0e11] border border-white/15 rounded-2xl shadow-2xl shadow-cyan-950/40 overflow-hidden z-10 my-8 text-slate-200"
            >
              {/* Top Accent Line */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${severityConfig.gradient}`} />

              {/* Modal Body */}
              <div className="p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
                
                {/* 1. Header Section */}
                <div className="flex justify-between items-start gap-4 pb-4 border-b border-white/10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded-full font-semibold tracking-wide">
                        {cveId}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${severityConfig.badgeBg}`}>
                        {severity} SEVERITY
                      </span>
                      {patchedVersion && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/80 text-emerald-300">
                          ✓ PATCH SYNTHESIZED
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight pt-1">
                      {title}
                    </h2>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
                    aria-label="Close modal"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* 2. Key Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* CVSS Metric Card */}
                  <div className="bg-slate-900/80 border border-white/10 p-4 rounded-xl space-y-2">
                    <div className="text-xs text-slate-400 font-medium">CVSS v3 Score</div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-3xl font-extrabold ${severityConfig.color}`}>{cvss.toFixed(1)}</span>
                      <span className="text-xs text-slate-500">/ 10.0</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${severityConfig.gradient}`}
                        style={{ width: `${(cvss / 10) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Affected Package Metric */}
                  <div className="bg-slate-900/80 border border-white/10 p-4 rounded-xl space-y-1">
                    <div className="text-xs text-slate-400 font-medium">Affected Package</div>
                    <div className="font-mono text-base font-bold text-white truncate" title={packageName}>
                      {packageName}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">Ecosystem: npm</div>
                  </div>

                  {/* Remediation Version Metric */}
                  <div className="bg-slate-900/80 border border-white/10 p-4 rounded-xl space-y-1">
                    <div className="text-xs text-slate-400 font-medium">Version Upgrade</div>
                    <div className="flex items-center gap-2 font-mono text-sm pt-1">
                      <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">{installedVersion}</span>
                      <span className="text-slate-500">➔</span>
                      <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{targetVersion}</span>
                    </div>
                  </div>
                </div>

                {/* 3. What is this Vulnerability? (Detailed Overview) */}
                <div className="space-y-3 bg-slate-900/50 border border-white/10 p-5 rounded-xl">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Vulnerability Breakdown & Overview
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {description}
                  </p>
                  {ghsaId && (
                    <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-medium text-slate-500">Database Reference:</span>
                      <a 
                        href={advisoryUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 flex items-center gap-1 font-mono"
                      >
                        {ghsaId}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>

                {/* 4. AEGIS-PATCH Autonomous Fix Strategy */}
                <div className="space-y-4 bg-slate-950/80 border border-cyan-500/20 p-5 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

                  <h3 className="text-base font-semibold text-white flex items-center gap-2 relative z-10">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    How AEGIS-PATCH Resolves This Vulnerability
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                    <div className="bg-slate-900/90 border border-white/5 p-3.5 rounded-lg space-y-1">
                      <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                        <span>1. Dependency Graph Isolation</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Pins <code className="text-cyan-300 font-mono">{packageName}</code> lockfile entry from version <span className="text-red-400">{installedVersion}</span> to secure release <span className="text-emerald-400">{targetVersion}</span>.
                      </p>
                    </div>

                    <div className="bg-slate-900/90 border border-white/5 p-3.5 rounded-lg space-y-1">
                      <div className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                        <span>2. LLM Code Patch Synthesis</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Feeds vulnerable source files into Groq → Cerebras → Gemini to rewrite breaking changes while preserving API contracts.
                      </p>
                    </div>

                    <div className="bg-slate-900/90 border border-white/5 p-3.5 rounded-lg space-y-1">
                      <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <span>3. Regression Test Suite</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Runs native <code className="text-emerald-300 font-mono">npm test</code> inside isolated workspace to guarantee zero functional regressions.
                      </p>
                    </div>

                    <div className="bg-slate-900/90 border border-white/5 p-3.5 rounded-lg space-y-1">
                      <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <span>4. Automated GitHub Pull Request</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Creates branch <code className="text-amber-300 font-mono">aegis-patch/fix-...</code> and opens a complete Pull Request with fix notes.
                      </p>
                    </div>
                  </div>

                  {/* Manual Quick Upgrade Command */}
                  <div className="pt-2 relative z-10">
                    <div className="text-xs text-slate-400 font-medium mb-1.5">Direct CLI Upgrade Command:</div>
                    <div className="flex items-center justify-between bg-black/90 border border-white/15 p-2.5 rounded-lg font-mono text-xs text-cyan-300">
                      <span>npm install {packageName}@{targetVersion}</span>
                      <button
                        onClick={copyCommand}
                        className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded transition-colors text-[11px] font-sans flex items-center gap-1"
                      >
                        {copied ? (
                          <>
                            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 5. Modal Action Footer */}
                <div className="pt-2 flex items-center justify-between gap-4 border-t border-white/10">
                  <a
                    href={advisoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <span>View Official Advisory on OSV.dev</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black font-semibold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all transform active:scale-95"
                  >
                    Close Breakdown
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
