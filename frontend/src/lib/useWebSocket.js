import { useState, useEffect, useRef, useCallback } from 'react';

export default function useWebSocket() {
  const [sessionId, setSessionId] = useState(null);
  const [stage, setStage] = useState('');
  const [logs, setLogs] = useState([]);
  const [vulns, setVulns] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('CLOSED');
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const stageRef = useRef('');

  // Connect only when a sessionId is provided
  useEffect(() => {
    if (!sessionId) return;

    // Reset pipeline state for new session
    setLogs([]);
    setStage('');
    setVulns([]);
    setResult(null);
    setError(null);
    stageRef.current = '';

    const connect = () => {
      setConnectionStatus('CONNECTING');
      
      let backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      backendUrl = backendUrl.replace(/\/+$/, '');
      // Backend expects: ws://host:port/ws?sessionId=xxx
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
            setLogs(prev => [...prev, data.data].slice(-1000));
            if (data.data?.stage && data.data.stage !== stageRef.current) {
              stageRef.current = data.data.stage;
              setStage(data.data.stage);
            }
          } else if (data.type === 'STAGE') {
            stageRef.current = data.stage || data.data?.stage || '';
            setStage(stageRef.current);
          } else if (data.type === 'VULN_FOUND') {
            setVulns(prev => {
              if (prev.some(v => v.cveId === data.data?.cveId)) return prev;
              return [...prev, data.data];
            });
          } else if (data.type === 'RESULT') {
            setResult(data.data);
          } else if (data.type === 'ERROR') {
            setError(data.data?.message || data.message || 'Pipeline error');
          } else if (data.type === 'COMPLETE') {
            stageRef.current = 'COMPLETE';
            setStage('COMPLETE');
            if (data.data) setResult(data.data);
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message', e);
        }
      };

      ws.onclose = (event) => {
        setConnectionStatus('CLOSED');
        // Do not reconnect if completed or clean close
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

  // Called by dashboard after POST /api/patch returns the backend's sessionId
  const startSession = useCallback((backendSessionId) => {
    setSessionId(backendSessionId);
  }, []);

  return { sessionId, stage, logs, vulns, result, error, connectionStatus, startSession };
}
