const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { maxDrawdown52w } = require('../services/portfolioHistory');
const code = readFileSync(require('node:path').join(__dirname, '../../src/services/portfolioMetrics.js'), 'utf8');
const modulePromise = import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
const row = (symbol, weight, extra = {}) => ({ symbol, portfolio_percentage: weight, ...extra });
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, a + ' != ' + b);

test('QQQ/PSQ and SPY/SH match only available capital, adding both legs to effective liquidity', async () => {
  const { portfolioRisk } = await modulePromise;
  const matched = portfolioRisk([row('QQQ', 10), row('PSQ', 10), row('AAPL', 80)], { AAPL: { beta: 1.2, max_drawdown_52w: -30 } });
  near(matched.liquidity, 20); near(matched.beta, .96); near(matched.historical, -24);
  assert.equal(matched.betaMissing, 0);
  const partial = portfolioRisk([row('QQQ', 15), row('PSQ', 10), row('SPY', 20), row('SH', 5)], { QQQ: { beta: 1.4 } });
  near(partial.hedged, 30); near(partial.cash, 50); near(partial.liquidity, 80); near(partial.beta, .22);
});

test('an unpaired inverse has negative beta and missing data stays visible', async () => {
  const { portfolioRisk } = await modulePromise;
  const inverse = portfolioRisk([row('PSQ', 20)], { QQQ: { beta: 1.4 }, PSQ: { beta: 1.9 } });
  near(inverse.beta, -.28);
  assert.equal(portfolioRisk([row('UNKNOWN', 40)], {}).betaMissing, 40);
  assert.equal(portfolioRisk([row('UNKNOWN', 40)], {}).historicalMissing, 40);
  assert.equal(portfolioRisk([row('A', 110)], {}).overallocated, true);
});

test('TQQQ 3x consumes three times as much PSQ and preserves unhedged capital', async () => {
  const { portfolioRisk } = await modulePromise;
  const risk = portfolioRisk([row('TQQQ', 16.81), row('PSQ', 15.57)], { QQQ: { beta: 1.4 } });
  near(risk.hedged, 20.76);
  near(risk.residual.TQQQ, 11.62);
  near(risk.residual.PSQ, 0);
  near(risk.beta, 11.62 * 3 * 1.4 / 100);
  const full = portfolioRisk([row('TQQQ', 10), row('PSQ', 30)], {});
  near(full.hedged, 40);
  near(full.liquidity, 100);
});

test('SH estimates a proportional cross hedge only for known positive betas', async () => {
  const { portfolioRisk } = await modulePromise;
  const risk = portfolioRisk([row('A', 20), row('B', 20), row('SH', 15), row('UNKNOWN', 10)], {
    A: { beta: 1 }, B: { beta: 2 },
  });
  near(risk.residual.A, 15);
  near(risk.residual.B, 15);
  near(risk.hedged, 25);
  near(risk.estimatedHedged, 25);
  near(risk.unknownExposure, 10);
  near(risk.beta, .45);
  near(risk.residual.SH, 0);
});

test('index hedges take priority and the same SH or PSQ capital is never counted twice', async () => {
  const { portfolioRisk } = await modulePromise;
  const risk = portfolioRisk([row('QQQ', 10), row('PSQ', 10), row('A', 20), row('SPY', 10), row('SH', 20)], {
    QQQ: { beta: 1.4 }, A: { beta: 2 },
  });
  near(risk.directHedged, 40);
  near(risk.estimatedHedged, 15);
  near(risk.hedged, 55);
  near(risk.liquidity, 85);
  near(risk.residual.A, 15);
  const inverse = portfolioRisk([row('SH', 20)], {});
  near(inverse.hedged, 0);
  near(inverse.beta, -.2);
});

test('daily return never substitutes accumulated returns or yesterday quotes', async () => {
  const { dailyPortfolioReturn } = await modulePromise;
  const now = Date.parse('2026-11-24T18:00:00Z');
  const trades = [row('A', 50, { entry_price: 50, createdAt: '2026-10-01T18:00:00Z' })];
  assert.equal(dailyPortfolioReturn(trades, { A: { price: 100, changePercent: null, quoteTime: now } }, now).missing, 50);
  assert.equal(dailyPortfolioReturn(trades, { A: { price: 100, changePercent: 28.2, quoteTime: now - 86400000 } }, now).missing, 50);
  near(dailyPortfolioReturn(trades, { A: { price: 100, changePercent: -2, quoteTime: now } }, now).percent, -1);
  near(dailyPortfolioReturn(trades, { A: { price: 100, changePercent: 0, quoteTime: now } }, now).percent, 0);
  const intraday = [row('A', 50, { entry_price: 100, createdAt: '2026-11-24T16:00:00Z' })];
  near(dailyPortfolioReturn(intraday, { A: { price: 110, changePercent: 20, quoteTime: now } }, now).percent, 5);
});

test('historical max drawdown remembers a fall after recovery, and requires 52 observations', () => {
  near(maxDrawdown52w([100, 50, ...Array(50).fill(100)]), -50);
  near(maxDrawdown52w(Array(52).fill(100)), 0);
  assert.equal(maxDrawdown52w([100, 50, 100]), null);
});
