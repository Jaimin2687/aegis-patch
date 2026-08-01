export function formatLog(log) {
  const { level, stage, message, timestamp } = log;
  
  const getLogColor = (l) => {
    const colors = {
      info: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
      error: 'bg-red-500/15 text-red-400 border border-red-500/30',
      warn: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
      debug: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
    };
    return colors[l?.toLowerCase()] || 'bg-slate-500/15 text-slate-400 border border-slate-500/30';
  };

  const getTextColor = (l) => {
    const colors = {
      error: 'text-red-400',
      warn: 'text-amber-400',
    };
    return colors[l?.toLowerCase()] || 'text-slate-300';
  };

  const getStageIcon = (s) => {
    const icons = {
      CLONING: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>',
      SCANNING: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>',
      PATCHING: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.121 14.121L19 19m-7-7l-7-7m7 7l-2.828 2.829m5.656-5.656l2.829-2.828M15.536 8.464a2 2 0 00-2.829-2.829L9.879 8.464a2 2 0 002.828 2.829l2.829-2.829z"></path></svg>',
      TESTING: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>',
      PUSHING: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>',
      COMPLETE: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>',
    };
    return icons[s] || '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>';
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return '00:00:00.000';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '00:00:00.000';
    return d.toISOString().substring(11, 23);
  };

  return {
    levelColor: getLogColor(level),
    textColor: getTextColor(level),
    stageIcon: getStageIcon(stage),
    time: formatTimestamp(timestamp)
  };
}
