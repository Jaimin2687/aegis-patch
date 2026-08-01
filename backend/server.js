import http from 'http';
import { URL } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { WebSocketServer } from 'ws';
import config from './src/core/config.js';
import eventBus, { EventTypes } from './src/core/eventBus.js';
import { executePipeline } from './src/core/pipeline.js';

// In-memory scan history
const scanHistory = [];

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', config.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/patch') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { repoUrl } = JSON.parse(body);
        if (!repoUrl || !/^https?:\/\//.test(repoUrl)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid repoUrl' }));
          return;
        }

        const sessionId = uuidv4();
        
        // Track scan in history
        const scanRecord = {
          id: sessionId,
          repo: repoUrl.replace(/^https?:\/\/(www\.)?github\.com\//, ''),
          repoUrl,
          date: new Date().toISOString(),
          status: 'running',
          vulnsFound: 0,
          duration: null,
          prUrl: null,
          startTime: Date.now()
        };
        scanHistory.unshift(scanRecord);

        // Fire and forget pipeline execution
        executePipeline(repoUrl, sessionId).catch(err => {
          console.error(`Pipeline error for ${sessionId}:`, err);
          const record = scanHistory.find(s => s.id === sessionId);
          if (record) {
            record.status = 'error';
            record.duration = `${((Date.now() - record.startTime) / 1000).toFixed(0)}s`;
          }
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ sessionId, status: 'started' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
  } else if (req.method === 'GET' && req.url === '/api/history') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(scanHistory.slice(0, 50)));
  } else if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const wss = new WebSocketServer({ server, path: '/ws' });
const clients = new Map();

wss.on('connection', (ws, req) => {
  const urlParams = new URLSearchParams(req.url.split('?')[1]);
  const sessionId = urlParams.get('sessionId');
  
  if (!sessionId) {
    ws.close();
    return;
  }

  if (!clients.has(sessionId)) {
    clients.set(sessionId, new Set());
  }
  clients.get(sessionId).add(ws);

  ws.on('close', () => {
    const sessionClients = clients.get(sessionId);
    if (sessionClients) {
      sessionClients.delete(ws);
      if (sessionClients.size === 0) {
        clients.delete(sessionId);
      }
    }
  });
});

Object.values(EventTypes).forEach(eventType => {
  eventBus.on(eventType, (eventData) => {
    const sessionId = eventData.sessionId;

    // Update scan history on events
    const record = scanHistory.find(s => s.id === sessionId);
    if (record) {
      if (eventType === EventTypes.VULN_FOUND) {
        record.vulnsFound++;
      } else if (eventType === EventTypes.COMPLETE) {
        record.status = 'success';
        record.duration = eventData.data?.totalTime || `${((Date.now() - record.startTime) / 1000).toFixed(0)}s`;
        record.prUrl = eventData.data?.prUrl || null;
      } else if (eventType === EventTypes.ERROR) {
        record.status = 'error';
        record.duration = `${((Date.now() - record.startTime) / 1000).toFixed(0)}s`;
      }
    }

    // Broadcast to WebSocket clients
    const sessionClients = clients.get(sessionId);
    if (sessionClients) {
      const message = JSON.stringify({ type: eventType, ...eventData });
      sessionClients.forEach(client => {
        if (client.readyState === 1) {
          client.send(message);
        }
      });
    }
  });
});

server.listen(config.PORT, () => {
  console.log(`Server listening on port ${config.PORT}`);
});
