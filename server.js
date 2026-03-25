// server.js
// Entry point. Loads config first (which calls dotenv.config()),
// then sets up Express middleware, routes, and the error handler.

const express = require('express');
const cors = require('cors');
const { port } = require('./src/config');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────────────
// Allow requests from the Vite dev server. In production, replace the origin
// with your actual frontend domain (or an array of allowed origins).
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Server is running.' });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./src/routes/auth'));
app.use('/api/rides',    require('./src/routes/rides'));
app.use('/api/bookings', require('./src/routes/bookings'));

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: 'The requested endpoint does not exist.',
  });
});

// ── Global error handler (must be last) ───────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`✓ Ride-Sharing API running at http://localhost:${port}`);
});

module.exports = app;
