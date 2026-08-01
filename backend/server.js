import http from 'http';
import { URL } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import config from './src/core/config.js';
import eventBus, { EventTypes } from './src/core/eventBus.js';
import { executePipeline } from './src/core/pipeline.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load scan history from disk or init
let scanHistory = [];
if (fs.existsSync(HISTORY_FILE)) {
  try {
    scanHistory = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
  } catch (e) {
    console.error('Failed to parse history.json, starting fresh');
  }
}

function saveHistory() {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(scanHistory, null, 2));
  } catch (e) {
    console.error('Failed to save history.json', e);
  }
}

// ── Rate Limiter (IP-based, in-memory) ──────────────────────────────
const RATE_LIMIT_MAX = 5;           // max requests per window
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour in ms
const rateLimitMap = new Map();     // Map<ip, timestamps[]>

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress;
}

function isRateLimited(ip) {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  let timestamps = rateLimitMap.get(ip);

  if (timestamps) {
    // Prune expired timestamps
    timestamps = timestamps.filter(t => t > cutoff);
  } else {
    timestamps = [];
  }

  if (timestamps.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(ip, timestamps);
    return true;
  }

  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return false;
}

// Periodic cleanup: sweep stale entries every ~10 minutes
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  for (const [ip, timestamps] of rateLimitMap) {
    const valid = timestamps.filter(t => t > cutoff);
    if (valid.length === 0) {
      rateLimitMap.delete(ip);
    } else {
      rateLimitMap.set(ip, valid);
    }
  }
}, CLEANUP_INTERVAL_MS).unref();   // .unref() so it doesn't prevent graceful shutdown
// ─────────────────────────────────────────────────────────────────────

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
    // ── Rate limit check ──
    const clientIp = getClientIp(req);
    if (isRateLimited(clientIp)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Rate limit exceeded, try again later' }));
      return;
    }

    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { repoUrl } = JSON.parse(body);
        if (!repoUrl) {
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
        saveHistory(); // Save on start

        // Fire and forget pipeline execution
        executePipeline(repoUrl, sessionId).catch(err => {
          console.error(`Pipeline error for ${sessionId}:`, err);
          const record = scanHistory.find(s => s.id === sessionId);
          if (record) {
            record.status = 'error';
            record.duration = `${((Date.now() - record.startTime) / 1000).toFixed(0)}s`;
            saveHistory(); // Save on error
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
        saveHistory();
      } else if (eventType === EventTypes.COMPLETE) {
        record.status = 'success';
        record.duration = eventData.data?.totalTime || `${((Date.now() - record.startTime) / 1000).toFixed(0)}s`;
        record.prUrl = eventData.data?.prUrl || null;
        saveHistory();
      } else if (eventType === EventTypes.ERROR) {
        record.status = 'error';
        record.duration = `${((Date.now() - record.startTime) / 1000).toFixed(0)}s`;
        saveHistory();
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
