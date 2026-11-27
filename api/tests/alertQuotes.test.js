const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = readFileSync(path.join(__dirname, '../../src/services/alertQuotes.js'), 'utf8');
const validation = import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

test('fixed targets require an actual recent regular-session quote, not a fresh cache timestamp', async () => {
  const { canEvaluateAlertQuote } = await validation;
  const now = Date.now();
  const quote = { price: 101, quoteTime: new Date(now - 10000).toISOString(), marketState: 'REGULAR', delayedMinutes: 0 };
  assert.equal(canEvaluateAlertQuote(quote, now), true);
  for (const changed of [
    { quoteTime: new Date(now - 4 * 3600000).toISOString(), timestamp: now },
    { quoteTime: null }, { quoteTime: 'invalid' }, { quoteTime: new Date(now + 60000).toISOString() },
    { price: 0 }, { price: null }, { delayedMinutes: 15 }, { delayedMinutes: null },
    { marketState: 'CLOSED' }, { marketState: undefined }
  ]) assert.equal(canEvaluateAlertQuote({ ...quote, ...changed }, now), false, JSON.stringify(changed));
});

// Exercise the production quote adapter with isolated providers and a controlled clock.
function quoteAdapter() {
  const code = readFileSync(path.join(__dirname, '../services/marketSyncService.js'), 'utf8');
  const start = code.indexOf('const alertQuoteCache =');
  const end = code.indexOf('\nmodule.exports', start);
  const state = { now: Date.now(), yahooPrice: 100, finnhubPrice: 102, calls: 0, failYahoo: false };
  const context = {
    Date: class extends Date { static now() { return state.now; } },
    FINNHUB_API_KEY: 'test-only', REALTIME_EXCHANGES: new Set(['NMS']),
    logger: { warn() {} }, deriveMarketStateFromPeriod: () => 'REGULAR',
    fetchYahooChartDirect: async () => {
      state.calls++;
      if (state.failYahoo) throw new Error('Provider unavailable');
      return { meta: { regularMarketPrice: state.yahooPrice, regularMarketTime: Math.floor(state.now / 1000), marketState: 'REGULAR', exchangeName: 'NMS' } };
    },
    fetchFinnhub: async () => ({ price: state.finnhubPrice, quoteTime: Math.floor(state.now / 1000) }),
  };
  vm.createContext(context);
  vm.runInContext(code.slice(start, end) + '\nthis.fetchQuotes = fetchAlertQuotes;', context);
  return { state, fetchQuotes: context.fetchQuotes };
}

test('uses Portfolio provider priority, short cache and manual bypass', async () => {
  const { state, fetchQuotes } = quoteAdapter();
  assert.equal((await fetchQuotes(['aapl', 'AAPL'])).AAPL.price, 102);
  assert.equal(state.calls, 1);
  state.finnhubPrice = 103;
  assert.equal((await fetchQuotes(['AAPL'])).AAPL.price, 102);
  assert.equal((await fetchQuotes(['AAPL'], { force: true })).AAPL.price, 103);
  state.now += 31000;
  state.finnhubPrice = 104;
  assert.equal((await fetchQuotes(['AAPL'])).AAPL.price, 104);
});

test('provider failure keeps a display quote but cannot invent an open market session', async () => {
  const { state, fetchQuotes } = quoteAdapter();
  state.failYahoo = true;
  const quote = (await fetchQuotes(['AAPL'])).AAPL;
  assert.equal(quote.price, 102);
  const { canEvaluateAlertQuote } = await validation;
  assert.equal(canEvaluateAlertQuote(quote), false);
});
