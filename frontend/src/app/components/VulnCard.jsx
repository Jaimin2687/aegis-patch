'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';

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
    CRITICAL: { variant: 'destructive', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', badgeBg: 'bg-red-100 text-red-800 border-red-200', bar: 'bg-red-500' },
    HIGH: { variant: 'destructive', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', badgeBg: 'bg-orange-100 text-orange-800 border-orange-200', bar: 'bg-orange-500' },
    MEDIUM: { variant: 'warning', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', badgeBg: 'bg-amber-100 text-amber-800 border-amber-200', bar: 'bg-amber-500' },
    LOW: { variant: 'info', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', badgeBg: 'bg-blue-100 text-blue-800 border-blue-200', bar: 'bg-blue-500' }
  }[severity] || { variant: 'default', color: 'text-gray-500 dark:text-gray-400 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-950 dark:bg-gray-950', border: 'border-gray-200 dark:border-gray-800 dark:border-gray-800', badgeBg: 'bg-gray-100 dark:bg-gray-800 dark:bg-gray-800 text-gray-800 dark:text-gray-200 dark:text-gray-200 border-gray-200 dark:border-gray-800 dark:border-gray-800', bar: 'bg-gray-400' };

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
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, type: 'spring' }}
        className="h-full cursor-pointer group"
        onClick={() => setIsOpen(true)}
      >
        <SpotlightCard className="h-full p-5 bg-white dark:bg-gray-900 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 dark:border-gray-800 hover:border-gray-300 dark:border-gray-700 dark:border-gray-700 transition-all duration-300 rounded-xl flex flex-col gap-4 relative overflow-hidden">
          <div className="flex justify-between items-start gap-2 relative z-10">
            <div>
              <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 dark:text-gray-100 tracking-tight group-hover:text-blue-600 transition-colors flex items-center gap-2">
                {cveId}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 font-mono mt-0.5 line-clamp-1">{title}</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end shrink-0">
              <Badge variant={severityConfig.variant} className="text-xs font-semibold">
                {severity}
              </Badge>
              {patchedVersion && (
                <Badge variant="success" className="text-xs border-emerald-200 bg-emerald-50 text-emerald-700">
                  Patched
                </Badge>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400 line-clamp-2 relative z-10 prose prose-sm prose-gray max-w-none">
            <ReactMarkdown>{description}</ReactMarkdown>
          </div>

          <div className="mt-auto pt-2 space-y-3 relative z-10">
            <div className="bg-gray-50 dark:bg-gray-950 dark:bg-gray-950 p-3 rounded-lg border border-gray-200 dark:border-gray-800 dark:border-gray-800">
              <div className="text-xs font-mono text-gray-500 dark:text-gray-400 dark:text-gray-400 mb-1 flex justify-between items-center">
                <span>{packageName}</span>
                <span className="text-[10px] text-gray-400">npm</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-mono">
                <span className="text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">{installedVersion}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{targetVersion}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-500 dark:text-gray-400 dark:text-gray-400">CVSS Score</span>
                <span className={severityConfig.color}>{cvss.toFixed(1)} / 10</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${severityConfig.bar} transition-all duration-1000 ease-out`}
                  style={{ width: `${(cvss / 10) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </SpotlightCard>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-3xl bg-white dark:bg-gray-900 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden z-10 my-8 text-gray-900 dark:text-gray-100 dark:text-gray-100"
            >
              <div className={`h-1.5 w-full ${severityConfig.bar}`} />

              <div className="p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-start gap-4 pb-4 border-b border-gray-100 dark:border-gray-800 dark:border-gray-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full font-semibold tracking-wide">
                        {cveId}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${severityConfig.badgeBg}`}>
                        {severity} SEVERITY
                      </span>
                      {patchedVersion && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                          ✓ PATCH SYNTHESIZED
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 tracking-tight pt-1">
                      {title}
                    </h2>
                  </div>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 dark:text-gray-100 dark:hover:text-gray-100 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-800 dark:bg-gray-800 rounded-lg transition-colors shrink-0"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-950 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 dark:border-gray-800 p-4 rounded-xl space-y-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 font-medium">CVSS v3 Score</div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-3xl font-extrabold ${severityConfig.color}`}>{cvss.toFixed(1)}</span>
                      <span className="text-xs text-gray-400">/ 10.0</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${severityConfig.bar}`}
                        style={{ width: `${(cvss / 10) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-950 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 dark:border-gray-800 p-4 rounded-xl space-y-1">
                    <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 font-medium">Affected Package</div>
                    <div className="font-mono text-base font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 truncate" title={packageName}>
                      {packageName}
                    </div>
                    <div className="text-xs text-gray-400 font-mono">Ecosystem: npm</div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-950 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 dark:border-gray-800 p-4 rounded-xl space-y-1">
                    <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 font-medium">Version Upgrade</div>
                    <div className="flex items-center gap-2 font-mono text-sm pt-1">
                      <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">{installedVersion}</span>
                      <span className="text-gray-400">➔</span>
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{targetVersion}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 bg-gray-50 dark:bg-gray-950 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 dark:border-gray-800 p-5 rounded-xl">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 dark:text-gray-100 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Vulnerability Breakdown & Overview
                  </h3>
                  <div className="prose prose-sm prose-gray max-w-none">
                    <ReactMarkdown>{description}</ReactMarkdown>
                  </div>
                  {ghsaId && (
                    <div className="pt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">
                      <span className="font-medium text-gray-600 dark:text-gray-400 dark:text-gray-400">Database Reference:</span>
                      <a 
                        href={advisoryUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline underline-offset-4 flex items-center gap-1 font-mono"
                      >
                        {ghsaId}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>

                <div className="space-y-4 bg-gray-50 dark:bg-gray-950 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 dark:border-gray-800 p-5 rounded-xl">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 dark:text-gray-100 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    How AEGIS-PATCH Resolves This Vulnerability
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-gray-900 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 dark:border-gray-800 p-3.5 rounded-lg space-y-1">
                      <div className="text-xs font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 flex items-center gap-1.5">
                        <span>1. Dependency Graph Isolation</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-400">
                        Pins <code className="text-gray-800 dark:text-gray-200 dark:text-gray-200 font-mono">{packageName}</code> lockfile entry from version <span className="text-red-600">{installedVersion}</span> to secure release <span className="text-emerald-600">{targetVersion}</span>.
                      </p>
                    </div>

                    <div className="bg-white dark:bg-gray-900 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 dark:border-gray-800 p-3.5 rounded-lg space-y-1">
                      <div className="text-xs font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 flex items-center gap-1.5">
                        <span>2. LLM Code Patch Synthesis</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-400">
                        Feeds vulnerable source files into Groq → Cerebras → Gemini to rewrite breaking changes while preserving API contracts.
                      </p>
                    </div>

                    <div className="bg-white dark:bg-gray-900 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 dark:border-gray-800 p-3.5 rounded-lg space-y-1">
                      <div className="text-xs font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 flex items-center gap-1.5">
                        <span>3. Regression Test Suite</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-400">
                        Runs native <code className="text-gray-800 dark:text-gray-200 dark:text-gray-200 font-mono">npm test</code> inside isolated workspace to guarantee zero functional regressions.
                      </p>
                    </div>

                    <div className="bg-white dark:bg-gray-900 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 dark:border-gray-800 p-3.5 rounded-lg space-y-1">
                      <div className="text-xs font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 flex items-center gap-1.5">
                        <span>4. Automated GitHub Pull Request</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-400">
                        Creates branch <code className="text-gray-800 dark:text-gray-200 dark:text-gray-200 font-mono">aegis-patch/fix-...</code> and opens a complete Pull Request with fix notes.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 font-medium mb-1.5">Direct CLI Upgrade Command:</div>
                    <div className="flex items-center justify-between bg-gray-900 border border-gray-700 p-2.5 rounded-lg font-mono text-xs text-gray-100">
                      <span>npm install {packageName}@{targetVersion}</span>
                      <button
                        onClick={copyCommand}
                        className="px-2.5 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors text-[11px] font-sans flex items-center gap-1"
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

                <div className="pt-2 flex items-center justify-between gap-4 border-t border-gray-100 dark:border-gray-800 dark:border-gray-800">
                  <a
                    href={advisoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <span>View Official Advisory on OSV.dev</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs rounded-xl transition-all active:scale-95"
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
