# QuickCart API

A lightweight e-commerce backend API for product browsing, order management, and invoice generation.

## Features
- Product catalog with search
- JWT-based authentication
- Order processing with stock management
- Invoice generation
- Admin diagnostics panel

## Quick Start

```bash
npm install
npm start
```

Server runs on `http://localhost:4000`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | Get JWT token |
| GET | `/api/products` | List all products |
| GET | `/api/products/search?q=keyboard` | Search products |
| POST | `/api/orders` | Place an order |
| GET | `/api/invoice/:orderId` | Get order invoice |
| PUT | `/api/profile` | Update user profile |
| GET | `/api/admin/ping?host=google.com` | Network diagnostics |
| GET | `/api/admin/logs?file=app.log` | View server logs |
| GET | `/health` | Health check |
