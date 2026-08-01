'use client';

import React from 'react';
import { SectionHeading } from '@/components/ui/section-heading';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { ShimmerButton } from '@/components/ui/shimmer-button';

export default function SettingsPage() {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <SectionHeading 
        eyebrow="Configuration" 
        title="Settings" 
        subtitle="Manage your pipeline preferences, LLM fallback limits, and GitHub integrations."
      />

      <div className="space-y-6">
        {/* Engine Settings */}
        <SpotlightCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            <span>LLM Engine Configuration</span>
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Max Synthesis Retries</label>
              <p className="text-xs text-slate-500 mb-2">Number of times the engine will attempt to generate a passing patch before failing over.</p>
              <select className="w-full bg-slate-900/50 border border-white/10 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500">
                <option>3 Retries (Default)</option>
                <option>5 Retries</option>
                <option>10 Retries (Slow)</option>
              </select>
            </div>
            
            <div className="pt-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="form-checkbox h-5 w-5 text-cyan-500 rounded border-white/20 bg-slate-900/50 focus:ring-cyan-500 focus:ring-offset-slate-900" />
                <div>
                  <span className="block text-sm font-medium text-slate-300">Enable Cerebras Fallback</span>
                  <span className="block text-xs text-slate-500">Automatically switch to Llama 3 on Cerebras if Groq rate limits are hit.</span>
                </div>
              </label>
            </div>
          </div>
        </SpotlightCard>

        {/* Integration Settings */}
        <SpotlightCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span>GitHub Integration</span>
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Personal Access Token</label>
              <p className="text-xs text-slate-500 mb-2">Required for cloning private repositories and creating PRs. Token is loaded from environment variables.</p>
              <input 
                type="password" 
                value="••••••••••••••••••••••••••••••••••••••••" 
                disabled
                className="w-full bg-slate-900/30 border border-white/5 text-slate-500 rounded-lg px-3 py-2 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-emerald-400">Token loaded successfully from .env</p>
            </div>
            
            <div className="pt-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="form-checkbox h-5 w-5 text-indigo-500 rounded border-white/20 bg-slate-900/50 focus:ring-indigo-500 focus:ring-offset-slate-900" />
                <div>
                  <span className="block text-sm font-medium text-slate-300">Auto-assign PRs</span>
                  <span className="block text-xs text-slate-500">Automatically assign generated Pull Requests to the repository owner.</span>
                </div>
              </label>
            </div>
          </div>
        </SpotlightCard>
        
        <div className="flex justify-end pt-4">
          <ShimmerButton variant="solid" onClick={() => alert('Settings saved!')}>
            Save Configuration
          </ShimmerButton>
        </div>
      </div>
    </div>
  );
}
