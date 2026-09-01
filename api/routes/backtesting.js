const express = require('express');
const router = express.Router();
const { runBacktest } = require('../services/backtestingService');

/**
 * GET /api/backtesting/:ticker
 *
 * Query params opcionales:
 * - startDate: YYYY-MM-DD (default: hace 3 años)
 * - endDate: YYYY-MM-DD (default: hoy)
 * - initialCapital: number (default: 10000)
 * - positionSizePct: number 0-1 (default: 1.0)
 * - commission: number (default: 0)
 * - slippage: number (default: 0)
 * - entryScoreThreshold: number (default: 55)
 * - exitStrategy: string (default: 'setup_deterioration')
 * - stopLossPct: number 0-1 (default: 0)
 * - takeProfitPct: number 0-1 (default: 0)
 * - benchmarkSymbol: string (default: 'SPY')
 * - debug: boolean (default: false)
 * - allowedSetups: string (comma-separated, default: '')
 */
router.get('/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;

    // Valores por defecto
    const today = new Date();
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(today.getFullYear() - 3);

    const defaultStartDate = threeYearsAgo.toISOString().split('T')[0];
    const defaultEndDate = today.toISOString().split('T')[0];

    const config = {
      ticker: ticker.toUpperCase(),
      startDate: req.query.startDate || defaultStartDate,
      endDate: req.query.endDate || defaultEndDate,
      initialCapital: req.query.initialCapital ? parseFloat(req.query.initialCapital) : 10000,
      positionSizePct: req.query.positionSizePct ? parseFloat(req.query.positionSizePct) : 1.0,
      commission: req.query.commission ? parseFloat(req.query.commission) : 0,
      slippage: req.query.slippage ? parseFloat(req.query.slippage) : 0,
      entryScoreThreshold: req.query.entryScoreThreshold ? parseFloat(req.query.entryScoreThreshold) : 55,
      exitStrategy: req.query.exitStrategy || 'setup_deterioration',
      stopLossPct: req.query.stopLossPct ? parseFloat(req.query.stopLossPct) : 0,
      takeProfitPct: req.query.takeProfitPct ? parseFloat(req.query.takeProfitPct) : 0,
      benchmarkSymbol: req.query.benchmarkSymbol || 'SPY',
      debug: req.query.debug === 'true',
      allowedSetups: req.query.allowedSetups ? req.query.allowedSetups.split(',') : []
    };

    const result = await runBacktest(config);
    res.json(result);

  } catch (error) {
    console.error(`Backtesting Error para ${req.params.ticker}:`, error.message);
    res.status(500).json({ error: error.message || 'Error executing backtest' });
  }
});

module.exports = router;
