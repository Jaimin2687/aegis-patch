'use client';
import { getSeverityColor } from '../../lib/formatLog';

export default function VulnCard({ vuln }) {
  const severityClass = getSeverityColor(vuln.severity || 'moderate');
  const cvss = vuln.cvssScore || 0;
  
  return (
    <div className="bg-gradient-to-b from-[#0a0a0a] to-[#050505] border border-[#222] hover:border-[#444] transition-colors rounded-xl p-5 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${severityClass} inline-block mb-2 capitalize`}>
            {vuln.severity || 'Moderate'}
          </span>
          <h3 className="font-bold text-white text-lg">{vuln.cveId || 'Unknown CVE'}</h3>
        </div>
        {vuln.patchedVersion && (
          <span className="bg-[#111] text-emerald-400 text-xs px-2 py-1 rounded-md border border-[#222] font-mono">
            Patched
          </span>
        )}
      </div>
      
      <p className="text-[#888] text-sm leading-relaxed line-clamp-2">
        {vuln.title || 'Vulnerability detected during scanning phase.'}
      </p>
      
      <div className="bg-[#111] border border-[#222] rounded-lg p-3 space-y-2 mt-auto">
        <div className="flex justify-between text-sm">
          <span className="text-[#666]">Package</span>
          <span className="text-white font-mono">{vuln.packageName || 'unknown'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#666]">Installed</span>
          <span className="text-red-400 font-mono">{vuln.installedVersion || 'unknown'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#666]">Target</span>
          <span className="text-emerald-400 font-mono">{vuln.patchedVersion || 'unknown'}</span>
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-[#666]">CVSS Score</span>
          <span className="text-white">{cvss.toFixed(1)} / 10.0</span>
        </div>
        <div className="w-full bg-[#222] h-1.5 rounded-full overflow-hidden">
          <div 
            className={`h-full ${cvss >= 9 ? 'bg-red-500' : cvss >= 7 ? 'bg-orange-500' : cvss >= 4 ? 'bg-yellow-500' : 'bg-green-500'}`} 
            style={{ width: `${(cvss / 10) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
