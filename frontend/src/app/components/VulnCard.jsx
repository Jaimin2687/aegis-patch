'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function VulnCard({ vuln }) {
  const v = vuln || {};
  const cveId = v.cveId || 'UNKNOWN-CVE';
  const severity = v.severity || 'UNKNOWN';
  const description = v.description || 'No description available.';
  const packageName = v.packageName || 'Unknown Package';
  const installedVersion = v.installedVersion || '0.0.0';
  const targetVersion = v.targetVersion || '0.0.0';
  const cvss = Number(v.cvssScore) || 0;
  const patchedVersion = v.patchedVersion;

  const severityVariant = {
    CRITICAL: 'destructive',
    HIGH: 'destructive',
    MEDIUM: 'warning',
    LOW: 'info'
  }[severity.toUpperCase()] || 'default';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, type: 'spring' }}
      className="h-full"
    >
      <SpotlightCard className="h-full p-5 bg-[#0a0a0a] border border-white/10 rounded-xl flex flex-col gap-4">
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-bold text-lg text-white tracking-tight">{cveId}</h4>
          <div className="flex gap-2 flex-wrap justify-end">
            <Badge variant={severityVariant} className="text-xs">
              {severity}
            </Badge>
            {patchedVersion && (
              <Badge variant="success" className="text-xs border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
                Patched
              </Badge>
            )}
          </div>
        </div>

        <p className="text-sm text-slate-400 line-clamp-2" title={description}>
          {description}
        </p>

        <div className="mt-auto pt-2 space-y-4">
          <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5">
            <div className="text-xs font-mono text-slate-400 mb-1">{packageName}</div>
            <div className="flex items-center gap-2 text-sm font-mono">
              <span className="text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">{installedVersion}</span>
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{targetVersion}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-500">CVSS Score</span>
              <span className="text-slate-300">{cvss.toFixed(1)} / 10</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-1000 ease-out"
                style={{ width: `${(cvss / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </SpotlightCard>
    </motion.div>
  );
}
