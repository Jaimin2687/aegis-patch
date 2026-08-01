import { useState, useEffect, useRef } from 'react';

export function useWebSocket(backendUrl, sessionId) {
  const [logs, setLogs] = useState([]);
  const [stage, setStage] = useState('');
  const [vulns, setVulns] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('IDLE');
  
  const wsRef = useRef(null);
  const reconnectAttempts = useRef(0);
  
  useEffect(() => {
    if (!backendUrl || !sessionId) {
      setConnectionStatus('IDLE');
      return;
    }
    
    let isMounted = true;
    let reconnectTimeout = null;
    
    const connect = () => {
      setConnectionStatus('CONNECTING');
      const wsUrl = backendUrl.replace(/^http/, 'ws') + `/ws?sessionId=${sessionId}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        if (!isMounted) return;
        setConnectionStatus('OPEN');
        reconnectAttempts.current = 0;
      };
      
      ws.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case 'LOG':
              setLogs(prev => {
                const newLogs = [...prev, data];
                if (newLogs.length > 1000) return newLogs.slice(newLogs.length - 1000);
                return newLogs;
              });
              break;
            case 'STAGE_CHANGE':
              if (data.to) setStage(data.to);
              break;
            case 'VULN_FOUND':
              if (data.data) {
                setVulns(prev => [...prev, data.data]);
              }
              break;
            case 'COMPLETE':
              if (data.data) {
                setResult(data.data);
              }
              break;
            case 'ERROR':
              if (data.message) {
                setError(data.message);
              }
              break;
            default:
              break;
          }
        } catch (e) {
          console.error('WebSocket message parsing error:', e);
        }
      };
      
      ws.onclose = () => {
        if (!isMounted) return;
        setConnectionStatus('CLOSED');
        
        const timeouts = [1000, 2000, 4000, 8000];
        const timeout = reconnectAttempts.current < timeouts.length 
          ? timeouts[reconnectAttempts.current] 
          : 30000;
          
        reconnectAttempts.current += 1;
        
        reconnectTimeout = setTimeout(() => {
          if (isMounted) connect();
        }, timeout);
      };
      
      ws.onerror = () => {
        if (!isMounted) return;
        setConnectionStatus('ERROR');
      };
    };
    
    connect();
    
    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [backendUrl, sessionId]);
  
  return { logs, stage, vulns, result, error, connectionStatus };
}
