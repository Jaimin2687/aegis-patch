import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function useWebSocket() {
  const [sessionId, setSessionId] = useState('');
  const [stage, setStage] = useState('');
  const [logs, setLogs] = useState([]);
  const [vulns, setVulns] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('CLOSED');
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    // Reset state on new session
    setLogs([]);
    setStage('');
    setVulns([]);
    setResult(null);
    setError(null);
    
    const newSessionId = uuidv4();
    setSessionId(newSessionId);

    const connect = () => {
      setConnectionStatus('CONNECTING');
      
      let backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      backendUrl = backendUrl.replace(/\/+$/, ''); // Strip trailing slashes
      const wsUrl = backendUrl.replace(/^http/, 'ws') + `/ws/${newSessionId}`;
      
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
            if (data.data.stage && data.data.stage !== stage) {
              setStage(data.data.stage);
            }
          } else if (data.type === 'VULN_FOUND') {
            setVulns(prev => {
              if (prev.some(v => v.cveId === data.data.cveId)) return prev;
              return [...prev, data.data];
            });
          } else if (data.type === 'RESULT') {
            setResult(data.data);
          } else if (data.type === 'ERROR') {
            setError(data.data.message);
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message', e);
        }
      };

      ws.onclose = (event) => {
        setConnectionStatus('CLOSED');
        // Do not reconnect if completed or clean close
        if (stage === 'COMPLETE' || event.code === 1000) return;
        
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
        wsRef.current.close(1000); // Clean close on unmount
      }
    };
  }, []); // Only run once on mount

  return { sessionId, stage, logs, vulns, result, error, connectionStatus };
}
