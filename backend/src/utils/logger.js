import eventBus from '../core/eventBus.js';

const Colors = {
  INFO: '\x1b[36m', // Cyan
  WARN: '\x1b[33m', // Yellow
  ERROR: '\x1b[31m', // Red
  SUCCESS: '\x1b[32m', // Green
  DEBUG: '\x1b[90m', // Gray
  RESET: '\x1b[0m'
};

/**
 * Creates a structured logger for a specific session
 * @param {string} sessionId 
 * @returns {Object} logger instance
 */
export function createLogger(sessionId) {
  const log = (level, color, stage, message, data) => {
    const ts = new Date().toISOString();
    let consoleMsg = `[${ts}] [${sessionId}] [${stage}] ${color}[${level.toUpperCase()}]${Colors.RESET} ${message}`;
    if (data && Object.keys(data).length > 0) {
      consoleMsg += ` ${JSON.stringify(data)}`;
    }
    console.log(consoleMsg);
    eventBus.emitLog(sessionId, stage, level, message, data);
  };

  return {
    info: (stage, message, data) => log('info', Colors.INFO, stage, message, data),
    warn: (stage, message, data) => log('warn', Colors.WARN, stage, message, data),
    error: (stage, message, data) => log('error', Colors.ERROR, stage, message, data),
    success: (stage, message, data) => log('success', Colors.SUCCESS, stage, message, data),
    debug: (stage, message, data) => log('debug', Colors.DEBUG, stage, message, data)
  };
}
