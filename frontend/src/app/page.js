'use client';
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import UrlInput from './components/UrlInput';
import StatusPanel from './components/StatusPanel';
import VulnCard from './components/VulnCard';
import Terminal from './components/Terminal';
import PrResult from './components/PrResult';
import { useWebSocket } from '../lib/useWebSocket';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default function Dashboard() {
  const [sessionId, setSessionId] = useState(null);
  const [pipelineStarted, setPipelineStarted] = useState(false);
  
  const { logs, stage, vulns, result, error, connectionStatus } = useWebSocket(
    BACKEND_URL,
    sessionId
  );
  
  const isRunning = !!stage && stage !== 'COMPLETE' && stage !== 'ERROR';
  
  const handleSubmit = async (url) => {
    try {
      setPipelineStarted(true);
      const res = await fetch(`${BACKEND_URL}/api/patch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoUrl: url }),
      });
      
      if (!res.ok) {
        throw new Error(`Failed to start patch: ${res.statusText}`);
      }
      
      const data = await res.json();
      if (data.sessionId) {
        setSessionId(data.sessionId);
      }
    } catch (err) {
      console.error(err);
      // Let the UI know it failed here
    }
  };
  
  return (
    <div className="flex bg-black min-h-screen text-white font-sans">
      <Sidebar currentStage={stage} />
      
      <main className="flex-1 ml-64 p-10 max-w-7xl">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">Command Center</h1>
          <p className="text-[#888]">Initiate and monitor autonomous security patches for your repositories.</p>
        </header>
        
        <UrlInput onSubmit={handleSubmit} isRunning={isRunning} />
        
        {pipelineStarted && (
          <div className="animate-in fade-in duration-500 flex flex-col gap-8">
            <StatusPanel currentStage={stage} error={error} />
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-start gap-3">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-red-300">Pipeline Error</h4>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}
            
            {result && <PrResult result={result} />}
            
            {vulns.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Vulnerabilities Addressed
                  <span className="text-sm font-normal text-[#666] bg-[#111] px-2 py-0.5 rounded-full ml-2">
                    {vulns.length}
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {vulns.map((vuln, idx) => (
                    <VulnCard key={idx} vuln={vuln} />
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-4">
              <h3 className="text-lg font-bold mb-4 text-white">Execution Logs</h3>
              <Terminal logs={logs} connectionStatus={connectionStatus} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
