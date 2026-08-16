const express = require('express');
const router = express.Router();
const { getPool } = require('../database/db');
const { runSync } = require('../services/marketSyncService');

// GET /api/market/snapshot
router.get('/snapshot', async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.query(`
      SELECT symbol, price, change_amount, change_percent, ema21_distance, source, updated_at, status 
      FROM market_snapshot
    `);

    // Transformamos el array en un objeto indexado por symbol para facilidad del frontend
    const snapshot = {};
    rows.forEach(row => {
      snapshot[row.symbol] = {
        price: row.price !== null ? parseFloat(row.price) : null,
        changeAmount: row.change_amount !== null ? parseFloat(row.change_amount) : null,
        changePercent: row.change_percent !== null ? parseFloat(row.change_percent) : null,
        ema21Distance: row.ema21_distance !== null ? parseFloat(row.ema21_distance) : null,
        source: row.source,
        updatedAt: row.updated_at,
        status: row.status
      };
    });

    res.json({ snapshot });
  } catch (error) {
    console.error('❌ Error obteniendo market snapshot:', error);
    res.status(500).json({ error: 'Error obteniendo market snapshot' });
  }
});

// GET /api/market/sync-now (opcional, para forzar)
router.post('/sync-now', async (req, res) => {
  // Disparamos asíncronamente
  runSync().catch(e => console.error('Error in manual sync:', e));
  res.json({ message: 'Sync started' });
});

// GET /api/market/logs (para frontend DebugConsole)
router.get('/logs', (req, res) => {
  const logger = require('../utils/logger');
  res.json({
    logs: logger.getLogs(),
    metrics: logger.getMetrics()
  });
});

module.exports = router;
