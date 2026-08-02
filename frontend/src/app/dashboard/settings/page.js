'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SectionHeading } from '@/components/ui/section-heading';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { ShimmerButton } from '@/components/ui/shimmer-button';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } }
};

export default function SettingsPage() {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [saved, setSaved] = useState(false);
  const [retries, setRetries] = useState('3 Retries (Default)');
  const [enableCerebras, setEnableCerebras] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('aegis_github_token') || '';
      setToken(stored);
    }
  }, []);

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('aegis_github_token', token);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="show" 
      className="w-full max-w-3xl mx-auto space-y-8 pb-12"
    >
      <motion.div variants={itemVariants}>
        <SectionHeading 
          eyebrow="Configuration" 
          title="Settings" 
          subtitle="Manage your pipeline preferences, LLM fallback limits, and GitHub integrations."
        />
      </motion.div>

      <div className="space-y-6">
        {/* Engine Settings */}
        <motion.div variants={itemVariants}>
          <SpotlightCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            <span>LLM Engine Configuration</span>
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Max Synthesis Retries</label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Number of times the engine will attempt to generate a passing patch before failing over.</p>
              <select
                value={retries}
                onChange={(e) => setRetries(e.target.value)}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm"
              >
                <option>3 Retries (Default)</option>
                <option>5 Retries</option>
                <option>10 Retries (Slow)</option>
              </select>
            </div>
            
            <div className="pt-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={enableCerebras}
                  onChange={(e) => setEnableCerebras(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-blue-500" 
                />
                <div>
                  <span className="block text-sm font-bold text-gray-700 dark:text-gray-300">Enable Cerebras Fallback</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">Automatically switch to Llama 3 on Cerebras if Groq rate limits are hit.</span>
                </div>
              </label>
            </div>
          </div>
        </SpotlightCard>
        </motion.div>

        {/* Integration Settings */}
        <motion.div variants={itemVariants}>
        <SpotlightCard className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
              <svg className="w-5 h-5 text-gray-900 dark:text-gray-100" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12" />
              </svg>
              <span>GitHub Integration</span>
            </h3>
            <a
              href="https://github.com/settings/tokens?type=beta"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-bold transition-colors"
            >
              <span>Generate Token on GitHub</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {/* Setup Guide Instruction Note */}
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/40 p-4 rounded-xl space-y-2 text-xs text-gray-700 dark:text-gray-300">
            <div className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5 text-sm">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How to Obtain Your GitHub Personal Access Token (PAT):
            </div>
            <ol className="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300 pl-1">
              <li>Go to <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium">GitHub Developer Settings ➔ Fine-grained Tokens</a>.</li>
              <li>Under <strong>Repository Access</strong>, select your target repository (e.g., <code className="text-gray-900 dark:text-gray-100 font-mono">my-repo</code>) or <em>All repositories</em>.</li>
              <li>Under <strong>Permissions ➔ Repository Permissions</strong>, set:
                <ul className="list-disc list-inside pl-4 pt-0.5 text-gray-600 dark:text-gray-400">
                  <li><strong>Contents</strong>: <span className="text-emerald-600 font-semibold">Read & write</span> (Required for git push)</li>
                  <li><strong>Pull requests</strong>: <span className="text-emerald-600 font-semibold">Read & write</span> (Required for PR creation)</li>
                </ul>
              </li>
              <li>Click <strong>Generate token</strong>, copy your token (<code className="text-gray-900 dark:text-gray-100 font-mono">github_pat_...</code>), and paste it below or in <code className="text-gray-900 dark:text-gray-100 font-mono">backend/.env</code>.</li>
            </ol>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Personal Access Token (PAT)</label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Used for cloning target repositories, committing security patches, and automatically creating Pull Requests.</p>
              <div className="relative">
                <input 
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="github_pat_11BMX... or ghp_..."
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 rounded-xl px-3 py-2.5 pr-10 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-xs shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-400 text-xs font-bold"
                >
                  {showToken ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                {token ? (
                  <span className="text-emerald-600 flex items-center gap-1 font-bold">
                    ✓ Custom GitHub PAT active & saved locally
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium">
                    ℹ Default token from backend environment variables (<code className="text-gray-900 dark:text-gray-100 font-mono">backend/.env</code>) is active.
                  </span>
                )}
              </p>
            </div>
            
            <div className="pt-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-blue-500" />
                <div>
                  <span className="block text-sm font-bold text-gray-700 dark:text-gray-300">Auto-assign PRs</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">Automatically assign generated Pull Requests to the repository owner.</span>
                </div>
              </label>
            </div>
          </div>
        </SpotlightCard>
        </motion.div>
        
        <motion.div variants={itemVariants} className="flex justify-between items-center pt-2">
          {saved && (
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              ✓ Configuration saved successfully!
            </span>
          )}
          <div className="ml-auto">
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm rounded-xl shadow-sm transition-all active:scale-95"
            >
              Save Configuration
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
