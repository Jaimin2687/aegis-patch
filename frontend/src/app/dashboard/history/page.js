import React from 'react';
import { Badge } from '@/components/ui/badge';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { SectionHeading } from '@/components/ui/section-heading';

export default function ScanHistoryPage() {
  const history = [
    {
      id: 1,
      repo: 'username/vulnerable-webapp',
      date: '2026-08-01 10:45 AM',
      vulnsFound: 4,
      status: 'success',
      duration: '4m 12s',
      prUrl: 'https://github.com/username/vulnerable-webapp/pull/12'
    },
    {
      id: 2,
      repo: 'company/core-auth-service',
      date: '2026-07-28 02:15 PM',
      vulnsFound: 1,
      status: 'success',
      duration: '2m 30s',
      prUrl: 'https://github.com/company/core-auth-service/pull/44'
    },
    {
      id: 3,
      repo: 'startup/legacy-api',
      date: '2026-07-25 09:00 AM',
      vulnsFound: 12,
      status: 'error',
      duration: '8m 05s',
      prUrl: null
    }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <SectionHeading 
        eyebrow="Audit Log" 
        title="Scan History" 
        subtitle="Review previous autonomous patching pipelines and generated pull requests."
      />

      <SpotlightCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-white/10">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">Repository</th>
                <th scope="col" className="px-6 py-4 font-medium">Date</th>
                <th scope="col" className="px-6 py-4 font-medium">Vulns</th>
                <th scope="col" className="px-6 py-4 font-medium">Status</th>
                <th scope="col" className="px-6 py-4 font-medium">Duration</th>
                <th scope="col" className="px-6 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-200">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      <span>{item.repo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 whitespace-nowrap">{item.date}</td>
                  <td className="px-6 py-4 text-slate-300 font-mono">{item.vulnsFound}</td>
                  <td className="px-6 py-4">
                    {item.status === 'success' ? (
                      <Badge variant="success">Patched</Badge>
                    ) : (
                      <Badge variant="error">Failed</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-mono">{item.duration}</td>
                  <td className="px-6 py-4">
                    {item.prUrl ? (
                      <a href={item.prUrl} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300 font-medium text-xs flex items-center space-x-1">
                        <span>View PR</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ) : (
                      <span className="text-slate-600 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SpotlightCard>
    </div>
  );
}
