'use client';

export default function Sidebar({ currentStage }) {
  return (
    <div className="fixed left-0 top-0 w-64 h-screen border-r border-[#222] bg-black flex flex-col justify-between">
      <div>
        <div className="p-6 border-b border-[#222]">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <h1 className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
              AEGIS-PATCH
            </h1>
          </div>
          <p className="text-[#888] text-xs mt-1">Autonomous Security Engine</p>
        </div>
        
        <nav className="p-4 space-y-2">
          <a href="#" className="flex items-center gap-3 px-3 py-2 bg-[#111] rounded-lg text-white">
            <svg className="w-5 h-5 text-[#888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="flex-1 font-medium text-sm">Dashboard</span>
            <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-[#888] hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-sm">Scan History</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-[#888] hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium text-sm">Settings</span>
          </a>
        </nav>
      </div>
      
      <div className="p-4 border-t border-[#222] flex items-center justify-between">
        <span className="text-[#888] text-xs font-mono">v1.0.0</span>
        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-2 py-0.5 rounded-full font-medium">
          Pro
        </span>
      </div>
    </div>
  );
}
