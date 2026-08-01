import http from 'http';
import { URL } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { WebSocketServer } from 'ws';
import config from './src/core/config.js';
import eventBus, { EventTypes } from './src/core/eventBus.js';
import { executePipeline } from './src/core/pipeline.js';

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
        
        // Fire and forget pipeline execution
        executePipeline(repoUrl, sessionId).catch(err => {
          console.error(`Pipeline error for ${sessionId}:`, err);
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ sessionId, status: 'started' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
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
    const sessionClients = clients.get(sessionId);
    if (sessionClients) {
      const message = JSON.stringify({ type: eventType, ...eventData });
      sessionClients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(message);
        }
      });
    }
  });
});

server.listen(config.PORT, () => {
  console.log(`Server listening on port ${config.PORT}`);
});
