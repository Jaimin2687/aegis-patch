export function getLogColor(level) {
  const colors = {
    info: 'log-info',
    warn: 'log-warn',
    error: 'log-error',
    success: 'log-success',
    debug: 'log-debug'
  };
  return colors[level] || 'log-info';
}

export function formatTimestamp(isoString) {
  if (!isoString) return '00:00:00.000';
  const d = new Date(isoString);
  return d.toTimeString().split(' ')[0] + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

export function getStageIcon(stage) {
  const icons = {
    CLONING: '📦', SCANNING: '🔍', PATCHING: '🔧',
    TESTING: '🧪', PUSHING: '🚀', COMPLETE: '✅', ERROR: '❌'
  };
  return icons[stage] || '⚙️';
}

export function getSeverityColor(severity) {
  const colors = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    moderate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-green-500/20 text-green-400 border-green-500/30'
  };
  return colors[severity] || colors.moderate;
}
