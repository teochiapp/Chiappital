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
const marketRouter = require('./routes/market');
const { runSync } = require('./services/marketSyncService');
const logger = require('./utils/logger');

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

// Market Data
app.use('/api/market', marketRouter);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: { message: `Ruta no encontrada: ${req.method} ${req.path}` } });
});

// ─── Error handler global ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: { message: 'Error interno del servidor.' } });
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
async function startServer() {
  try {
    logger.info('Server', 'Conectando a MySQL...');
    await initializeDatabase();

    app.listen(PORT, () => {
      logger.raw(`
─────────────────────────────────────────────
API SERVER
─────────────────────────────────────────────
Environment: ${process.env.NODE_ENV || 'development'}
Port: ${PORT}
Database: connected
Market Sync: enabled
Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}
─────────────────────────────────────────────`);
      
      logger.info('Server', `Health: http://localhost:${PORT}/api/health`);
    });

    // Iniciar scheduler de market data sync (cada 1 minuto)
    setInterval(() => {
      logger.debug('Scheduler', 'MarketSync scheduler tick');
      runSync('scheduled').catch(e => logger.error('MarketSync', `Error in scheduled sync: ${e.message}`));
    }, 60000); // 1 minuto
    
    // Ejecutar un sync inicial pasados unos segundos para no bloquear el arranque
    setTimeout(() => {
      runSync('startup').catch(e => logger.error('MarketSync', `Error in initial sync: ${e.message}`));
    }, 5000);

  } catch (error) {
    logger.error('Server', 'Error al iniciar el servidor:');
    logger.error('Server', `Código: ${error.code || 'N/A'}`);
    logger.error('Server', `Mensaje: ${error.message || String(error)}`);
    
    if (error.code === 'ECONNREFUSED' || error.message.includes('connect ECONNREFUSED')) {
      logger.error('Server', '💡 Verifica el archivo api/.env: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    }
    process.exit(1);
  }
}

startServer();
