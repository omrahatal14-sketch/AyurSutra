// AyurSutra - Node.js Backend Server
// Serves the existing frontend files AND provides REST API endpoints backed by Firebase Cloud Firestore / MySQL

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { DB_TYPE, testConnection } = require('./server/db');
const { ensureDefaultAdmin } = require('./server/utils/bootstrap');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ────────────────────────────────────────────────────────────
// Disable caching for development
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Expires', '-1');
  res.set('Pragma', 'no-cache');
  next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Serve existing frontend (HTML, CSS, JS, Images, Uploads) ─────────────
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── API Routes (all under /api prefix) ───────────────────────────────────
app.use('/api/auth', require('./server/routes/auth'));
app.use('/api/users', require('./server/routes/users'));
app.use('/api/patients', require('./server/routes/patients'));
app.use('/api/sessions', require('./server/routes/sessions'));
app.use('/api/requests', require('./server/routes/requests'));
app.use('/api/feedbacks', require('./server/routes/feedbacks'));
app.use('/api/notifications', require('./server/routes/notifications'));
app.use('/api/progress', require('./server/routes/progress'));
app.use('/api/payments', require('./server/routes/payments'));
app.use('/api/verify-doctor', require('./server/routes/verifyDoctor'));
app.use('/api/ai', require('./server/routes/ai'));

// ─── Health check endpoint ─────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    const isConnected = await testConnection();
    res.json({
      server: 'running',
      database: isConnected ? 'connected' : 'error',
      databaseType: DB_TYPE,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      server: 'running',
      database: 'disconnected',
      databaseType: DB_TYPE,
      error: err.message
    });
  }
});

// ─── Fallback: serve login page for unmatched routes ───────────────────────
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// ─── Start Server ──────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log('==============================================================');
  console.log(' Starting AyurSutra Server........');
  console.log(`\n🌿 AyurSutra Server running at---> http://localhost:${PORT}  ||`);
  console.log(`||   Frontend:  http://localhost:${PORT}/login.html             ||`);
  console.log(`||   Database:  ${DB_TYPE.toUpperCase()} (Firebase Cloud Firestore) ||`);
  console.log(`||   API Base:  http://localhost:${PORT}/api                    ||`);
  console.log(`||   Health:    http://localhost:${PORT}/api/health             ||\n`);
  console.log('==============================================================');
  await testConnection();
  await ensureDefaultAdmin();
});
