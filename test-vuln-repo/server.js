const express = require('express');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const ejs = require('ejs');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── In-memory product catalog ───────────────────────────────────────
const products = [
  { id: 1, name: 'Wireless Earbuds', price: 29.99, stock: 150 },
  { id: 2, name: 'USB-C Hub',        price: 49.99, stock: 80  },
  { id: 3, name: 'Mechanical Keyboard', price: 89.99, stock: 45 },
  { id: 4, name: 'Webcam HD 1080p',  price: 39.99, stock: 200 },
  { id: 5, name: 'Monitor Stand',    price: 24.99, stock: 60  },
];

const JWT_SECRET = 'super-secret-key-12345';

// ─── AUTH ─────────────────────────────────────────────────────────────

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  // Demo: accept any login
  const token = jwt.sign({ username, role: 'user' }, JWT_SECRET);
  res.json({ token });
});

// ─── PRODUCTS ─────────────────────────────────────────────────────────

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/products/search', (req, res) => {
  const query = req.query.q || '';
  // VULNERABILITY: Prototype Pollution via lodash.merge
  // Merging user-controlled input directly into an object
  const filters = {};
  _.merge(filters, req.query);
  
  const results = products.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );
  res.json(results);
});

// ─── ORDER PROCESSING ────────────────────────────────────────────────

app.post('/api/orders', (req, res) => {
  const { productId, quantity, shippingAddress } = req.body;
  const product = products.find(p => p.id === productId);
  
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (product.stock < quantity) return res.status(400).json({ error: 'Insufficient stock' });

  product.stock -= quantity;
  
  const order = {
    orderId: 'ORD-' + Date.now(),
    product: product.name,
    quantity,
    total: product.price * quantity,
    shippingAddress,
    status: 'confirmed'
  };

  res.json(order);
});

// ─── INVOICE GENERATION ──────────────────────────────────────────────

app.get('/api/invoice/:orderId', (req, res) => {
  // VULNERABILITY: Server-Side Template Injection (SSTI) via ejs
  // User-controlled input rendered directly in a template string
  const orderId = req.params.orderId;
  const template = `<h1>Invoice for Order: ${orderId}</h1><p>Thank you for your purchase!</p>`;
  const html = ejs.render(template);
  res.send(html);
});

// ─── ADMIN: SYSTEM DIAGNOSTICS ───────────────────────────────────────

app.get('/api/admin/ping', (req, res) => {
  const host = req.query.host || 'localhost';
  // VULNERABILITY: Command Injection
  // User input passed directly to exec() without sanitization
  exec('ping -c 1 ' + host, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: stderr });
    res.json({ result: stdout });
  });
});

// ─── ADMIN: LOG VIEWER ───────────────────────────────────────────────

app.get('/api/admin/logs', (req, res) => {
  const filename = req.query.file || 'app.log';
  // VULNERABILITY: Path Traversal
  // User can supply ../../etc/passwd as filename
  const logPath = path.join(__dirname, 'logs', filename);
  
  fs.readFile(logPath, 'utf-8', (err, data) => {
    if (err) return res.status(404).json({ error: 'Log file not found' });
    res.json({ content: data });
  });
});

// ─── USER PROFILE UPDATE ─────────────────────────────────────────────

app.put('/api/profile', (req, res) => {
  const userData = {};
  // VULNERABILITY: Prototype Pollution via lodash.defaultsDeep
  // Merging untrusted user input into object prototype chain
  _.defaultsDeep(userData, req.body);
  
  res.json({ message: 'Profile updated', data: userData });
});

// ─── HEALTH CHECK ────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ─── SERVER START ────────────────────────────────────────────────────

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`QuickCart API running on port ${PORT}`);
});
