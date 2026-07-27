// server.js - Entry point del servidor Express SimpleTrade API
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./database/db');
const authRouter = require('./routes/auth');
const tradesRouter = require('./routes/trades');
const balancesRouter = require('./routes/balances');
const historicalMetricsRouter = require('./routes/historicalMetrics');
const labRouter = require('./routes/lab');
const personalRouter = require('./routes/personal');
const alertsRouter = require('./routes/alerts');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.ALLOWED_ORIGIN,
  'http://localhost:3000', // React dev server
  'https://chiappital.surcodes.com', // Producción frontend
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (ej: Postman, curl, SSR)
    if (!origin) return callback(null, true);
    // Permitir cualquier localhost en desarrollo
    if (origin.startsWith('http://localhost:')) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: origen no permitido: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parser ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Rutas ────────────────────────────────────────────────────────────────────

// Health check (útil para Hostinger)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Autenticación
app.use('/api/auth', authRouter);

// Perfil de usuario
app.get('/api/users/me', (req, res, next) => {
  // Redirigir al handler de /me en authRouter
  req.url = '/me';
  authRouter(req, res, next);
});

// Trades CRUD
app.use('/api/trades', tradesRouter);

// Balances
app.use('/api/balances', balancesRouter);

// Historical Metrics
app.use('/api/historical-metrics', historicalMetricsRouter);

// Lab Preferences
app.use('/api/lab', labRouter);

// Personal Hub
app.use('/api/personal', personalRouter);

// Alerts
app.use('/api/alerts', alertsRouter);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: { message: `Ruta no encontrada: ${req.method} ${req.path}` } });
});

// ─── Error handler global ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: { message: 'Error interno del servidor.' } });
});

// ─── Inicialización ───────────────────────────────────────────────────────────
async function start() {
  try {
    console.log('🔌 Conectando a MySQL...');
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 SimpleTrade API escuchando en puerto ${PORT}`);
      console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Health: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:');
    console.error('   Código:', error.code || 'N/A');
    console.error('   Mensaje:', error.message || String(error));
    if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Verifica el archivo api/.env: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    }
    process.exit(1);
  }
}

start();
