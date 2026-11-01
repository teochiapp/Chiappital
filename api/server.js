// server.js - Entry point del servidor Express SimpleTrade API
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Cargar .env.local si existe (para desarrollo local), luego .env (producción)
const envLocalPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}
dotenv.config({ path: path.join(__dirname, '.env') });

// Fallbacks de producción para Hostinger en caso de que .env no esté presente
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production';
if (!process.env.DB_HOST) process.env.DB_HOST = '127.0.0.1';
if (!process.env.DB_PORT) process.env.DB_PORT = '3306';
if (!process.env.DB_USER) process.env.DB_USER = 'u639575812_admin';
if (!process.env.DB_PASSWORD) process.env.DB_PASSWORD = 'D3hm3Pa;';
if (!process.env.DB_NAME) process.env.DB_NAME = 'u639575812_trades_data';
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'M1_s3cr3t0_ch1app1t4l_2026';
if (!process.env.JWT_EXPIRES_IN) process.env.JWT_EXPIRES_IN = '7d';
if (!process.env.ALLOWED_ORIGIN) process.env.ALLOWED_ORIGIN = 'https://chiappital.surcodes.com';
if (!process.env.FINNHUB_API_KEY) process.env.FINNHUB_API_KEY = 'd3t6mg9r01qqdgfufaggd3t6mg9r01qqdgfufah0';

// Capturar errores no manejados para que LiteSpeed/Hostinger nunca reciba un exit(1) y devuelva 503
process.on('uncaughtException', (err) => {
  console.error('[Process] Excepción no capturada:', err.message, err.stack);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Process] Promesa rechazada no manejada:', reason);
});

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
const backtestingRouter = require('./routes/backtesting');
const knowledgeRouter = require('./routes/knowledge');
const logger = require('./utils/logger');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || (isProduction ? 3000 : 3001);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.ALLOWED_ORIGIN,
  'http://localhost:3000',
  'http://localhost:5173',
  'https://chiappital.surcodes.com',
  'https://apichiappital.surcodes.com',
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  // Permitir requests sin origin (ej: Postman, curl, server-to-server)
  if (!origin) return true;
  // Permitir cualquier localhost o 127.0.0.1
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return true;
  if (allowedOrigins.includes(origin)) return true;
  // Permitir cualquier subdominio de surcodes.com y hostingersite.com
  if (/^https?:\/\/([a-zA-Z0-9-]+\.)*surcodes\.com(:\d+)?$/.test(origin)) return true;
  if (/^https?:\/\/([a-zA-Z0-9-]+\.)*hostingersite\.com(:\d+)?$/.test(origin)) return true;
  return false;
};

const corsOptions = {
  origin: function (origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS', `Origen bloqueado: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Disposition'],
};

app.use(cors(corsOptions));
// Manejar preflight OPTIONS de manera explícita para todas las rutas
app.options('*', cors(corsOptions));

// ─── Body Parser ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static Files ─────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ─── Rutas ────────────────────────────────────────────────────────────────────

// Root check para Hostinger / LiteSpeed
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Chiappital API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

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

// Knowledge Hub (Second Brain)
app.use('/api/knowledge', knowledgeRouter);

// Alerts
app.use('/api/alerts', alertsRouter);

// Market Data
app.use('/api/market', marketRouter);

// Backtesting
app.use('/api/backtesting', backtestingRouter);

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
function initMarketScheduler() {
  let runSync;
  try {
    const marketSyncService = require('./services/marketSyncService');
    runSync = marketSyncService.runSync;
  } catch (err) {
    logger.error('Scheduler', `No se pudo cargar marketSyncService: ${err.message}`);
    return;
  }

  let lastResetDate = null;

  // Iniciar scheduler de market data sync (cada 1 minuto)
  setInterval(() => {
    logger.debug('Scheduler', 'MarketSync scheduler tick');
    
    const nyTime = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
    const currentDateString = nyTime.toDateString();
    
    // Inicializar lastResetDate en el arranque para no ejecutar inmediatamente
    if (lastResetDate === null) {
      lastResetDate = currentDateString;
    }
    
    // Si cambió el día (ya pasó la medianoche NY), ejecutamos las tareas diarias
    if (lastResetDate !== currentDateString) {
      lastResetDate = currentDateString;
      try {
        const { resetDailyData } = require('./services/marketSyncService');
        const { runEarningsSync } = require('./services/earningsSyncService');
        const { takeDailySnapshots } = require('./services/portfolioSnapshotService');
        
        resetDailyData().then(() => {
          runSync('scheduled').catch(e => logger.error('MarketSync', `Error in scheduled sync: ${e.message}`));
        });
        
        runEarningsSync().catch(e => logger.error('EarningsSync', `Error in scheduled earnings sync: ${e.message}`));
        
        takeDailySnapshots().catch(e => logger.error('PortfolioSnapshot', `Error in daily snapshots: ${e.message}`));
      } catch (e) {
        logger.error('Scheduler', `Error en tareas diarias: ${e.message}`);
      }
      return;
    }

    runSync('scheduled').catch(e => logger.error('MarketSync', `Error in scheduled sync: ${e.message}`));
  }, 60000); // 1 minuto
  
  // Ejecutar un sync inicial pasados unos segundos para no bloquear el arranque
  setTimeout(() => {
    runSync('startup').catch(e => logger.error('MarketSync', `Error in initial sync: ${e.message}`));
  }, 5000);
}

async function startServer() {
  // 1. Iniciar servidor HTTP inmediatamente en el puerto asignado por Hostinger/entorno
  const numericPort = parseInt(PORT, 10);
  const listenHandler = () => {
    logger.raw(`
─────────────────────────────────────────────
API SERVER
─────────────────────────────────────────────
Environment: ${process.env.NODE_ENV || 'development'}
Port: ${PORT}
Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}
─────────────────────────────────────────────`);
    logger.info('Server', `Health: http://localhost:${PORT}/api/health`);
  };

  if (!isNaN(numericPort)) {
    app.listen(numericPort, listenHandler);
  } else {
    app.listen(PORT, listenHandler);
  }

  // 2. Conectar e inicializar la base de datos de manera asíncrona
  try {
    logger.info('Server', 'Conectando a MySQL...');
    await initializeDatabase();
    logger.info('Server', 'Base de datos conectada e inicializada correctamente');
    initMarketScheduler();
  } catch (error) {
    logger.error('Server', 'Error al inicializar base de datos:');
    logger.error('Server', `Código: ${error.code || 'N/A'}`);
    logger.error('Server', `Mensaje: ${error.message || String(error)}`);
    
    if (error.code === 'ECONNREFUSED' || (error.message && error.message.includes('connect ECONNREFUSED'))) {
      logger.error('Server', '💡 Verifica el archivo .env: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    }
    // No matamos el proceso con exit(1) para permitir que el servidor siga vivo y Hostinger no retorne 503
  }
}

startServer();
