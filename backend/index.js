require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./db');

// Import modular API route handlers
const authRoutes = require('./routes/auth');
const { router: categoryRoutes } = require('./routes/categories');
const requestRoutes = require('./routes/requests');
const providerRoutes = require('./routes/providers');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const { seed } = require('./seed');

const app = express();
const port = process.env.PORT || 8080;

// Enable CORS for local Vite dev server and external callers
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Test database pool connectivity on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error on startup:', err.message);
  } else {
    console.log('✅ Supabase PostgreSQL Pool initialized successfully!');
    release();
  }
});

// Health check endpoint (for Cloud Run or local liveness)
app.get('/health', async (req, res) => {
  try {
    const dbTest = await pool.query('SELECT NOW()');
    res.status(200).json({
      status: 'OK',
      message: 'Local Service System API is running smoothly!',
      database: 'Connected',
      timestamp: dbTest.rows[0].now,
    });
  } catch (err) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Database check failed',
      error: err.message,
    });
  }
});

// Reseed endpoint for quick demo reset
app.post('/api/seed', async (req, res) => {
  try {
    // Run seeder in background
    seed().catch(console.error);
    res.json({ success: true, message: 'Database reseeding triggered.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found.` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Start Express server if run directly
if (require.main === module) {
  app.listen(port, () => {
    console.log(`🚀 Server listening on http://localhost:${port}`);
    console.log(`📡 Health Check: http://localhost:${port}/health`);
    console.log(`📋 API Docs/Routes: /api/auth, /api/categories, /api/requests, /api/providers, /api/reviews, /api/admin`);
  });
}

module.exports = app;