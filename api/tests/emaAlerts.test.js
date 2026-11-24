const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getSavedEma21, evaluateEmaAlert, checkEmaAlerts, normalizeAlertInput } = require('../services/emaAlertService');

const now = Date.parse('2026-11-23T16:00:00Z');
const row = {
  id: 1, user_id: 7, symbol: 'AAPL', condition_type: 'ema21_above', is_active: 1,
  updated_at: new Date(now - 60000), ema_updated_at: new Date(now - 86400000),
  snapshot_factors: JSON.stringify({ currentEma21: 100, currentPrice: 90, priceAboveEma21Pct: -10 })
};
const quote = { price: 101, marketState: 'REGULAR', quoteTime: new Date(now - 10000), delayedMinutes: 0 };

test('uses the absolute saved EMA, including serialized MySQL JSON', () => {
  assert.equal(getSavedEma21(row.snapshot_factors), 100);
  assert.equal(getSavedEma21({ currentEma21: '103.123456' }), 103.123456);
  assert.equal(getSavedEma21({ ema21: '105.5' }), 105.5);
  for (const invalid of [null, '{}', 'broken JSON', { currentEma21: 0 }, { currentEma21: -5 }]) {
    assert.equal(getSavedEma21(invalid), null);
  }
});

test('only triggers strictly above the EMA, even if the saved distance was negative', () => {
  assert.equal(evaluateEmaAlert(row, quote, now).status, 'triggered');
  assert.equal(evaluateEmaAlert(row, { ...quote, price: 100 }, now).status, 'watching');
  assert.equal(evaluateEmaAlert(row, { ...quote, price: 99 }, now).status, 'watching');
});

test('uses a newly saved EMA on subsequent checks', () => {
  assert.equal(evaluateEmaAlert({ ...row, snapshot_factors: { currentEma21: 102 } }, quote, now).status, 'watching');
});

test('waits on market holidays, premarket, after hours and closed markets', () => {
  for (const marketState of ['CLOSED', 'PRE', 'PREPRE', 'POST', 'POSTPOST']) {
    assert.equal(evaluateEmaAlert(row, { ...quote, marketState }, now).status, 'market_closed');
  }
});

test('waits for a valid recent quote without exchange delay', () => {
  for (const changed of [
    { price: 0 }, { price: NaN }, { quoteTime: null }, { quoteTime: 'invalid' },
    { quoteTime: new Date(now - 121000) }, { quoteTime: new Date(now + 60000) },
    { delayedMinutes: 15 }, { delayedMinutes: undefined }
  ]) {
    assert.equal(evaluateEmaAlert(row, { ...quote, ...changed }, now).status, 'stale_quote');
  }
  assert.equal(evaluateEmaAlert(row, null, now).status, 'unavailable');
  assert.equal(evaluateEmaAlert(row, { ...quote, marketState: undefined }, now).status, 'unavailable');
});

test('waits for missing, invalid or obsolete daily EMA data', () => {
  for (const changed of [
    { snapshot_factors: null }, { snapshot_factors: 'invalid' }, { ema_updated_at: null },
    { ema_updated_at: new Date(now - 8 * 86400000) }, { ema_updated_at: new Date(now + 60000) }
  ]) {
    assert.equal(evaluateEmaAlert({ ...row, ...changed }, quote, now).status, 'missing_ema');
  }
});

test('normalizes EMA alerts without requiring or freezing a target price', () => {
  const data = normalizeAlertInput({ symbol: ' aapl ', condition_type: 'ema21_above', target_price: 42 });
  assert.equal(data.symbol, 'AAPL');
  assert.equal(data.target_price, null);
  for (const condition_type of ['above', 'below']) {
    assert.equal(normalizeAlertInput({ symbol: 'SPY', condition_type, target_price: '150.50' }).target_price, 150.5);
    for (const target_price of [null, 0, -1, 'abc', Infinity]) {
      assert.throws(() => normalizeAlertInput({ symbol: 'SPY', condition_type, target_price }));
    }
  }
  assert.throws(() => normalizeAlertInput({ symbol: 'AAPL', condition_type: 'unknown' }));
  assert.throws(() => normalizeAlertInput({ symbol: ' ', condition_type: 'ema21_above' }));
});

function makeDb(alertRows = [row]) {
  let active = true;
  const calls = [];
  return {
    calls,
    async execute(sql, params) {
      calls.push({ sql, params });
      if (sql.includes('SELECT')) return [alertRows];
      const affectedRows = active ? 1 : 0;
      active = false;
      return [{ affectedRows }];
    }
  };
}

test('claims a trigger exactly once across concurrent tabs and scopes it to its owner', async () => {
  const db = makeDb();
  const options = { db, userId: 7, fetchQuotes: async () => ({ AAPL: quote }), now };
  const results = await Promise.all([checkEmaAlerts(options), checkEmaAlerts(options)]);
  const triggered = results.flatMap(result => result.triggered);
  assert.equal(triggered.length, 1);
  assert.equal(triggered[0].triggered_ema21, 100);
  assert.equal(triggered[0].triggered_price, 101);
  assert.equal(triggered[0].is_active, 0);
  assert.equal('snapshot_factors' in triggered[0], false);
  for (const { sql, params } of db.calls) {
    assert.match(sql, /user_id = \?/);
    assert.equal(params[sql.includes('SELECT') ? 0 : 1], 7);
  }
  assert.match(db.calls.find(call => call.sql.includes('UPDATE')).sql, /updated_at = \?/);
});

test('does not deactivate alerts when data is unavailable or the market is closed', async () => {
  for (const quotes of [{}, { AAPL: { ...quote, marketState: 'CLOSED' } }]) {
    const db = makeDb();
    const result = await checkEmaAlerts({ db, userId: 7, fetchQuotes: async () => quotes, now });
    assert.equal(result.triggered.length, 0);
    assert.equal(db.calls.length, 1);
  }
});

test('requests each ticker once and avoids provider calls when there are no alerts', async () => {
  let symbols;
  await checkEmaAlerts({ db: makeDb([row, { ...row, id: 2 }]), userId: 7, now,
    fetchQuotes: async input => { symbols = input; return {}; } });
  assert.deepEqual(symbols, ['AAPL']);
  await checkEmaAlerts({ db: makeDb([]), userId: 7, now,
    fetchQuotes: async () => { assert.fail('No quotes should be requested'); } });
});
