const express = require('express');
const router = express.Router();
const { getPool } = require('../database/db');
const { runSync } = require('../services/marketSyncService');

// GET /api/market/snapshot
router.get('/snapshot', async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.query(`
      SELECT symbol, price, change_amount, change_percent, ema21_distance, 
             rsi_weekly, rsi_previous, rsi_delta, rsi_updated_at,
             macd_weekly, macd_signal, macd_hist, macd_prev_weekly, macd_prev_signal, macd_prev_hist,
             drawdown_52w, rs_value, rs_previous, rs_state, rs_updated_at,
             setup_state, setup_verdict, setup_factors, op_score, op_score_conclusions, source, updated_at, status 
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
        rsiWeekly: row.rsi_weekly !== null ? parseFloat(row.rsi_weekly) : null,
        rsiPrevious: row.rsi_previous !== null ? parseFloat(row.rsi_previous) : null,
        rsiDelta: row.rsi_delta !== null ? parseFloat(row.rsi_delta) : null,
        rsiUpdatedAt: row.rsi_updated_at,
        macdWeekly: row.macd_weekly !== null ? parseFloat(row.macd_weekly) : null,
        macdSignal: row.macd_signal !== null ? parseFloat(row.macd_signal) : null,
        macdHist: row.macd_hist !== null ? parseFloat(row.macd_hist) : null,
        macdPrevWeekly: row.macd_prev_weekly !== null ? parseFloat(row.macd_prev_weekly) : null,
        macdPrevSignal: row.macd_prev_signal !== null ? parseFloat(row.macd_prev_signal) : null,
        macdPrevHist: row.macd_prev_hist !== null ? parseFloat(row.macd_prev_hist) : null,
        drawdown52w: row.drawdown_52w !== null ? parseFloat(row.drawdown_52w) : null,
        rsValue: row.rs_value !== null ? parseFloat(row.rs_value) : null,
        rsPrevious: row.rs_previous !== null ? parseFloat(row.rs_previous) : null,
        rsState: row.rs_state,
        rsUpdatedAt: row.rs_updated_at,
        setupState: row.setup_state,
        setupVerdict: row.setup_verdict,
        setupFactors: typeof row.setup_factors === 'string' ? JSON.parse(row.setup_factors) : row.setup_factors,
        opScore: row.op_score !== null ? parseInt(row.op_score, 10) : null,
        opScoreConclusions: typeof row.op_score_conclusions === 'string' ? JSON.parse(row.op_score_conclusions) : row.op_score_conclusions,
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
