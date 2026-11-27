const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');

test('alert HTTP workflow with isolated database, quote provider and email transport', async t => {
  const records = [];
  let livePrice = 99;
  let emailFails = false;
  let emailCount = 0;
  let quoteOptions;
  const savedEma = { snapshot_factors: { currentEma21: 100 }, ema_updated_at: new Date() };
  const db = { async execute(sql, params) {
    if (sql.includes('FROM users')) return [[{ id: params[0], username: 'QA' }]];
    if (sql.includes('INSERT INTO market_alerts')) {
      const [user_id, symbol, target_price, condition_type, notes] = params;
      records.push({ id: records.length + 1, user_id, symbol, target_price, condition_type, notes,
        is_active: 1, updated_at: new Date() });
      return [{ insertId: records.length }];
    }
    if (sql.startsWith('SELECT *')) return [records.filter(row => row.id === Number(params[0]) && row.user_id === params[1])];
    if (sql.startsWith('SELECT a.symbol')) return [records.filter(row => row.user_id === params[0])];
    if (sql.includes('SELECT a.*')) return [records.filter(row => row.user_id === params[0]
      && (!sql.includes('a.is_active = 1') || (row.is_active && row.condition_type === params[1])))
      .map(row => ({ ...row, ...savedEma }))];
    if (sql.includes('SET symbol =')) {
      const [symbol, target_price, condition_type, active, notes, id, userId] = params;
      const row = records.find(row => row.id === Number(id) && row.user_id === userId);
      Object.assign(row, { symbol, target_price, condition_type, notes });
      if (active !== null) row.is_active = active;
      return [{ affectedRows: 1 }];
    }
    if (sql.includes('SET is_active = 0')) {
      const row = records.find(row => row.id === Number(params[0]) && row.user_id === params[1] && row.is_active);
      if (row) row.is_active = 0;
      return [{ affectedRows: row ? 1 : 0 }];
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  } };
  const replacements = {
    '../database/db': { getPool: () => db },
    '../services/marketSyncService': { fetchAlertQuotes: async (symbols, options) => {
      quoteOptions = options;
      return Object.fromEntries(symbols.map(symbol => [symbol,
        { price: livePrice, marketState: 'REGULAR', quoteTime: new Date(), delayedMinutes: 0 }]));
    } },
    '../services/emailService': { sendEmail: async () => { emailCount++; if (emailFails) throw new Error('Test SMTP unavailable'); return true; } }
  };
  const previous = {};
  for (const [name, exports] of Object.entries(replacements)) {
    const id = require.resolve(name);
    previous[id] = require.cache[id];
    require.cache[id] = { id, filename: id, loaded: true, exports };
  }
  const oldSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'isolated-alert-test-secret';
  const app = express();
  app.use(express.json());
  app.use('/api/alerts', require('../routes/alerts'));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/alerts`;
  async function request(path = '', method = 'GET', body, userId = 7) {
    const headers = { 'Content-Type': 'application/json' };
    if (userId) headers.Authorization = `Bearer ${jwt.sign({ userId }, process.env.JWT_SECRET)}`;
    const response = await fetch(url + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, data: await response.json() };
  }
  try {
    await t.test('requires authentication', async () => {
      assert.equal((await request('/ema21/check', 'POST', {}, null)).status, 401);
      assert.equal((await request('/quotes', 'POST', {}, null)).status, 401);
    });
    await t.test('creates a dynamic EMA alert without a target and lists its saved EMA', async () => {
      const result = await request('', 'POST', { symbol: ' aapl ', condition_type: 'ema21_above' });
      assert.equal(result.status, 201);
      assert.equal(result.data.target_price, null);
      const list = await request();
      assert.equal(list.data[0].ema21_value, 100);
      assert.equal('snapshot_factors' in list.data[0], false);
    });
    await t.test('quotes current user tickers, forces refresh and never exposes another user quotes', async () => {
      const result = await request('/quotes', 'POST', { force: true });
      assert.equal(result.status, 200);
      assert.equal(result.data.quotes.AAPL.price, livePrice);
      assert.deepEqual(quoteOptions, { force: true });
      livePrice = 98;
      assert.equal((await request('/quotes', 'POST', {})).data.quotes.AAPL.price, 98);
      assert.deepEqual(quoteOptions, { force: false });
      assert.deepEqual((await request('/quotes', 'POST', {}, 8)).data.quotes, {});
      livePrice = 99;
    });
    await t.test('validates fixed targets and supports switching back to EMA', async () => {
      assert.equal((await request('/1', 'PUT', { condition_type: 'above' })).status, 400);
      assert.equal((await request('/1', 'PUT', { condition_type: 'above', target_price: 110 })).status, 200);
      assert.equal((await request('/1', 'PUT', { condition_type: 'ema21_above' })).status, 200);
      assert.equal(records[0].target_price, null);
    });
    await t.test('preserves ownership on updates and checks', async () => {
      assert.equal((await request('/1', 'PUT', { is_active: 0 }, 8)).status, 404);
      assert.equal((await request('/ema21/check', 'POST', {}, 8)).data.triggered.length, 0);
    });
    await t.test('checks live data, triggers once, reactivates and keeps sound notification when email fails', async () => {
      assert.equal((await request('/ema21/check', 'POST', {})).data.checks[1].status, 'watching');
      Object.assign(records[0], { email_enabled: 1, email_recipient: 'qa@example.test' });
      livePrice = 101;
      const result = await request('/ema21/check', 'POST', {});
      assert.equal(result.data.triggered[0].triggered_ema21, 100);
      assert.equal(emailCount, 1);
      assert.equal((await request('/ema21/check', 'POST', {})).data.triggered.length, 0);
      assert.equal(emailCount, 1);
      assert.equal((await request('/1', 'PUT', { is_active: 1 })).status, 200);
      emailFails = true;
      const retry = await request('/ema21/check', 'POST', {});
      assert.equal(retry.status, 200);
      assert.equal(retry.data.triggered[0].email_failed, true);
    });
  } finally {
    await new Promise(resolve => server.close(resolve));
    for (const [id, original] of Object.entries(previous)) {
      if (original) require.cache[id] = original;
      else delete require.cache[id];
    }
    if (oldSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = oldSecret;
  }
});
