import { EventEmitter } from 'events';

export const EventTypes = {
  LOG: 'LOG',
  STAGE_CHANGE: 'STAGE_CHANGE',
  VULN_FOUND: 'VULN_FOUND',
  COMPLETE: 'COMPLETE',
  ERROR: 'ERROR',
  // Web Scanner Events
  WEB_SCAN_STAGE: 'WEB_SCAN_STAGE',
  WEB_SCAN_FINDING: 'WEB_SCAN_FINDING',
  WEB_SCAN_COMPLETE: 'WEB_SCAN_COMPLETE'
};

class EventBus extends EventEmitter {
  constructor() {
    super();
  }

  /**
   * Helper to emit a formatted event
   * @param {string} type 
   * @param {string} sessionId 
   * @param {Object} payload 
   */
  emitEvent(type, sessionId, payload) {
    this.emit(type, {
      type,
      sessionId,
      timestamp: new Date().toISOString(),
      ...payload
    });
  }

  /**
   * Emit a log event
   */
  emitLog(sessionId, stage, level, message, data = {}) {
    this.emitEvent(EventTypes.LOG, sessionId, { stage, level, message, data });
  }

  /**
   * Emit a stage change event
   */
  emitStageChange(sessionId, from, to) {
    this.emitEvent(EventTypes.STAGE_CHANGE, sessionId, { from, to });
  }

  /**
   * Emit a vulnerability found event
   */
  emitVulnFound(sessionId, data) {
    this.emitEvent(EventTypes.VULN_FOUND, sessionId, { data });
  }

  /**
   * Emit completion event
   */
  emitComplete(sessionId, data) {
    this.emitEvent(EventTypes.COMPLETE, sessionId, { data });
  }

  /**
   * Emit error event
   */
  emitError(sessionId, message, stage, fatal = true) {
    this.emitEvent(EventTypes.ERROR, sessionId, { message, stage, fatal });
  }
}

const eventBus = new EventBus();
export default eventBus;
