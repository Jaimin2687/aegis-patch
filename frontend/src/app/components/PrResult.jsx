'use client';
import { useEffect, useState } from 'react';

export default function PrResult({ result }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!result) return null;
  
  return (
    <div className={`bg-gradient-to-b from-[#0a0a0a] to-[#050505] border border-[#222] rounded-xl p-8 mb-8 transition-all duration-700 transform ${mounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.15)] relative">
          <div className="absolute inset-0 rounded-full border border-emerald-500/40 animate-ping opacity-20"></div>
          <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Patch Deployed Successfully</h2>
        <p className="text-[#888] mb-8">All detected vulnerabilities have been patched and verified.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-8">
          <div className="bg-[#111] border border-[#222] rounded-lg p-4 flex flex-col items-center">
            <span className="text-3xl font-bold text-white mb-1">{result.patchedVulns || 0}</span>
            <span className="text-xs text-[#888] uppercase tracking-wider">Vulns Patched</span>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-lg p-4 flex flex-col items-center">
            <span className="text-3xl font-bold text-white mb-1">{result.testsPassed || 0}/{result.testsRun || 0}</span>
            <span className="text-xs text-[#888] uppercase tracking-wider">Tests Passed</span>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-lg p-4 flex flex-col items-center">
            <span className="text-3xl font-bold text-white mb-1">{result.totalTime || '0s'}</span>
            <span className="text-xs text-[#888] uppercase tracking-wider">Total Time</span>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-lg p-4 flex flex-col items-center">
            <span className="text-3xl font-bold text-white mb-1">{result.iterations || 0}</span>
            <span className="text-xs text-[#888] uppercase tracking-wider">Iterations</span>
          </div>
        </div>
        
        {result.prUrl && (
          <a 
            href={result.prUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-3 bg-white text-black font-semibold rounded-md hover:bg-gray-200 transition-colors shadow-lg"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            View Pull Request →
          </a>
        )}
      </div>
    </div>
  );
}
