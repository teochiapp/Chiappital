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
  runSync('force').catch(e => console.error('Error in manual sync:', e));
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

// POST /api/market/truncate-snapshot
router.post('/truncate-snapshot', async (req, res) => {
  try {
    const db = getPool();
    await db.query('TRUNCATE TABLE market_snapshot');
    const logger = require('../utils/logger');
    logger.info('System', 'market_snapshot table truncated manually.');
    res.json({ message: 'Table truncated successfully' });
  } catch (error) {
    console.error('Error truncating table:', error);
    res.status(500).json({ error: 'Error truncating table' });
  }
});
// GET /api/market/risk-metrics?symbols=AAPL,MSFT
router.get('/risk-metrics', async (req, res) => {
  try {
    const { symbols } = req.query;
    if (!symbols) return res.json({ metrics: {} });

    const symbolList = symbols.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    if (!symbolList.length) return res.json({ metrics: {} });

    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
    const db = getPool();
    
    // 1. Fetch drawdown_52w from market_snapshot
    const placeholders = symbolList.map(() => '?').join(',');
    const [rows] = await db.query(
      `SELECT symbol, drawdown_52w FROM market_snapshot WHERE symbol IN (${placeholders})`, 
      symbolList
    );
    const dbMetrics = {};
    rows.forEach(r => { 
      dbMetrics[r.symbol] = { 
        drawdown_52w: r.drawdown_52w !== null ? parseFloat(r.drawdown_52w) : null 
      }; 
    });

    const metrics = {};
    
    // 2. Fetch Beta from Finnhub Basic Financials
    for (const sym of symbolList) {
      metrics[sym] = { drawdown_52w: dbMetrics[sym]?.drawdown_52w || null, beta: null };
      
      if (FINNHUB_API_KEY) {
        try {
          // Utiliza fetch nativo (Node 18+)
          const response = await fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${sym}&metric=all&token=${FINNHUB_API_KEY}`);
          if (response.ok) {
            const data = await response.json();
            if (data && data.metric && data.metric.beta !== undefined) {
              metrics[sym].beta = data.metric.beta;
            }
          }
        } catch (err) {
          console.error(`Error fetching beta for ${sym} from Finnhub:`, err.message);
        }
      }
      
      // Default to Beta = 1 if not found or crypto (so it doesn't skew to 0)
      if (metrics[sym].beta === null || isNaN(metrics[sym].beta)) {
        // Crypto or missing Beta -> Assume 1.0 (neutral) or 2.0 (aggressive). Let's use 1.0 for neutral fallback, or 1.5 for crypto? 
        // For now, if no beta is found, we don't assign it, and frontend will handle it (e.g. assume 1.0).
        metrics[sym].beta = null;
      }
    }

    res.json({ metrics });
  } catch (error) {
    console.error('❌ Error obteniendo risk metrics:', error);
    res.status(500).json({ error: 'Error obteniendo risk metrics' });
  }
});

module.exports = router;
