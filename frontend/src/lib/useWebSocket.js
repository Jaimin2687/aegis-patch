import { useState, useEffect, useRef, useCallback } from 'react';

export default function useWebSocket() {
  const [sessionId, setSessionId] = useState(() => {
    if (typeof window !== 'undefined') return sessionStorage.getItem('aegis_session_id') || null;
    return null;
  });
  const [stage, setStage] = useState(() => {
    if (typeof window !== 'undefined') return sessionStorage.getItem('aegis_stage') || '';
    return '';
  });
  const [logs, setLogs] = useState(() => {
    if (typeof window !== 'undefined') {
      try { return JSON.parse(sessionStorage.getItem('aegis_logs')) || []; } catch { return []; }
    }
    return [];
  });
  const [vulns, setVulns] = useState(() => {
    if (typeof window !== 'undefined') {
      try { return JSON.parse(sessionStorage.getItem('aegis_vulns')) || []; } catch { return []; }
    }
    return [];
  });
  const [result, setResult] = useState(() => {
    if (typeof window !== 'undefined') {
      try { return JSON.parse(sessionStorage.getItem('aegis_result')) || null; } catch { return null; }
    }
    return null;
  });
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('CLOSED');

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const stageRef = useRef(stage);

  // Sync state to sessionStorage whenever updated
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionId) sessionStorage.setItem('aegis_session_id', sessionId);
    if (stage) sessionStorage.setItem('aegis_stage', stage);
    if (logs.length > 0) sessionStorage.setItem('aegis_logs', JSON.stringify(logs));
    if (vulns.length > 0) sessionStorage.setItem('aegis_vulns', JSON.stringify(vulns));
    if (result) sessionStorage.setItem('aegis_result', JSON.stringify(result));
  }, [sessionId, stage, logs, vulns, result]);

  // Connect only when a sessionId is provided
  useEffect(() => {
    if (!sessionId) return;

    const connect = () => {
      setConnectionStatus('CONNECTING');

      let backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      backendUrl = backendUrl.replace(/\/+$/, '');
      const wsUrl = backendUrl.replace(/^http/, 'ws') + `/ws?sessionId=${sessionId}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('OPEN');
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'LOG') {
            const logEntry = {
              timestamp: data.timestamp,
              stage: data.stage,
              level: data.level,
              message: data.message,
            };
            setLogs(prev => {
              const updated = [...prev, logEntry].slice(-1000);
              if (typeof window !== 'undefined') sessionStorage.setItem('aegis_logs', JSON.stringify(updated));
              return updated;
            });
            if (data.stage && data.stage !== stageRef.current) {
              stageRef.current = data.stage;
              setStage(data.stage);
            }
          } else if (data.type === 'STAGE_CHANGE') {
            stageRef.current = data.to || '';
            setStage(stageRef.current);
          } else if (data.type === 'VULN_FOUND') {
            setVulns(prev => {
              const vuln = data.data;
              if (!vuln) return prev;
              if (prev.some(v => (v.cveId && v.cveId === vuln.cveId) || (v.ghsaId && v.ghsaId === vuln.ghsaId))) return prev;
              const updated = [...prev, vuln];
              if (typeof window !== 'undefined') sessionStorage.setItem('aegis_vulns', JSON.stringify(updated));
              return updated;
            });
          } else if (data.type === 'ERROR') {
            setError(data.message || 'Pipeline error');
          } else if (data.type === 'COMPLETE') {
            stageRef.current = 'COMPLETE';
            setStage('COMPLETE');
            if (data.data) {
              setResult(data.data);
              if (typeof window !== 'undefined') sessionStorage.setItem('aegis_result', JSON.stringify(data.data));
            }
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message', e);
        }
      };

      ws.onclose = (event) => {
        setConnectionStatus('CLOSED');
        if (stageRef.current === 'COMPLETE' || event.code === 1000) return;

        const timeout = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectAttemptsRef.current += 1;

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, timeout);
      };

      ws.onerror = () => {
        setError('WebSocket connection error.');
      };
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close(1000);
      }
    };
  }, [sessionId]);

  const startSession = useCallback((backendSessionId) => {
    // Reset state for new session
    setSessionId(backendSessionId);
    setLogs([]);
    setStage('');
    setVulns([]);
    setResult(null);
    setError(null);
    stageRef.current = '';
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('aegis_session_id', backendSessionId);
      sessionStorage.removeItem('aegis_logs');
      sessionStorage.removeItem('aegis_vulns');
      sessionStorage.removeItem('aegis_result');
      sessionStorage.removeItem('aegis_stage');
    }
  }, []);

  const clearSession = useCallback(() => {
    setSessionId(null);
    setStage('');
    setLogs([]);
    setVulns([]);
    setResult(null);
    setError(null);
    stageRef.current = '';
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('aegis_session_id');
      sessionStorage.removeItem('aegis_stage');
      sessionStorage.removeItem('aegis_logs');
      sessionStorage.removeItem('aegis_vulns');
      sessionStorage.removeItem('aegis_result');
      sessionStorage.removeItem('aegis_repo_url');
    }
  }, []);

  return { sessionId, stage, logs, vulns, result, error, connectionStatus, startSession, clearSession };
}
