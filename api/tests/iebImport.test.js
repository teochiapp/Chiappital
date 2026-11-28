const { test } = require('node:test');
const assert = require('node:assert/strict');
const { importIeb } = require('../services/iebImportService');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const stamp = '2026-11-24T12:00:00.000Z';
const existing = { id: 1, symbol: 'CAT', type: 'buy', portfolio_percentage: '5', updated_at: new Date(stamp) };
function payload() {
  return {
    accountType: 'propia', expected: [{ id: 1, symbol: 'CAT', percentage: 5, updatedAt: stamp }],
    report: { fileName: 'IEB.xlsx', date: '2026-11-20', total: 30754021.94 },
    items: [{ symbol: 'CAT', percentage: 3, targetId: 1 }, { symbol: 'PEP', percentage: 4.26, targetId: null }],
    zeroIds: [],
  };
}
function pool(failInsert = false, rows = [existing]) {
  const calls = [];
  const connection = {
    beginTransaction: async () => calls.push('begin'),
    commit: async () => calls.push('commit'),
    rollback: async () => calls.push('rollback'),
    release: () => calls.push('release'),
    execute: async (sql, values) => {
      calls.push({ sql, values });
      if (sql.includes('SELECT *')) return [rows];
      if (failInsert && sql.includes('INSERT')) throw new Error('Simulated failure');
      return [[]];
    },
  };
  return { calls, getConnection: async () => connection };
}

test('writes one transaction, scopes destinations and reports exact counts', async () => {
  const db = pool();
  assert.deepEqual(await importIeb(db, 7, payload()), { created: 1, updated: 1, zeroed: 0 });
  assert.ok(db.calls.includes('commit'));
  assert.ok(!db.calls.includes('rollback'));
  const select = db.calls.find(call => call.sql?.includes('SELECT *'));
  assert.deepEqual(select.values, [7, 'propia']);
  const update = db.calls.find(call => call.sql?.startsWith('UPDATE'));
  assert.deepEqual(update.values, [3, 1, 7, 'propia']);
});

test('rolls back the whole batch on an intermediate failure', async () => {
  const db = pool(true);
  await assert.rejects(importIeb(db, 7, payload()), /Simulated/);
  assert.ok(db.calls.includes('rollback'));
  assert.ok(!db.calls.includes('commit'));
  assert.equal(db.calls.at(-1), 'release');
});

test('rejects a stale preview or replay after new positions were created', async () => {
  const db = pool(false, [existing, { ...existing, id: 2, symbol: 'PEP' }]);
  await assert.rejects(importIeb(db, 7, payload()), error => error.status === 409);
  assert.equal(db.calls.filter(call => call.sql?.startsWith('UPDATE')).length, 0);
});

test('requires unique tickers, owned destinations and explicit zero assignments', async () => {
  const duplicate = payload();
  duplicate.items[1].symbol = 'CAT';
  await assert.rejects(importIeb(pool(), 7, duplicate), /repetidos/);
  const foreign = payload();
  foreign.items[0].targetId = 999;
  await assert.rejects(importIeb(pool(), 7, foreign), /destino/);
  const conflicting = payload();
  conflicting.zeroIds = [1];
  await assert.rejects(importIeb(pool(), 7, conflicting), /selección/);
});

test('detects headers, derives missing percentages and excludes settlement detail rows', async () => {
  const code = readFileSync(path.join(__dirname, '../../src/services/iebImport.js'), 'utf8');
  const { parseIebRows, iebNumber } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
  const parsed = parseIebRows([
    ['Fecha:', 46346.125], ['Patrimonio total', 1000], ['Cedears'],
    ['Especie', 'Posición total', '% del total', 'Cantidad', 'PPP'],
    ['PEP - Pepsi', 200, '-', 2, 90], ['Liquidar', 200, '-'],
    ['IBIT - Bitcoin', 4, .4, 1, 3], ['Subtotal', 204, 20.4],
  ], 'IEB.xlsx');
  assert.equal(parsed.date, '2026-11-20');
  assert.equal(parsed.items.length, 2);
  assert.equal(parsed.items[0].percentage, 20);
  assert.equal(parsed.items[0].calculated, true);
  assert.equal(parsed.items[1].percentage, .4);
  assert.equal(iebNumber('1.234,56'), 1234.56);
  assert.equal(iebNumber('-'), null);
});

test('supports IEB reports using Instrumento header across Cedears, Bonos, Otros and cash tables', async () => {
  const code = readFileSync(path.join(__dirname, '../../src/services/iebImport.js'), 'utf8');
  const { parseIebRows } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
  const parsed = parseIebRows([
    ['Fecha:', '2026-11-27'],
    ['Patrimonio total', 31985953.75],
    ['Tenencia Mercado Argentino'],
    ['Cedears'],
    ['Instrumento', 'Moneda de emisión', 'Cantidad', 'Precio', '% del total', 'PPP', 'Var%', 'Resultado', 'Actualizado', 'Posición total'],
    ['CAT - CEDEAR CAATERPIL', 'ARS', 22, 49300, 3.3908634, 69458.8290909, -29.0227022, -443494.2400007, '16:31:43', 1084600],
    ['Disponible', '-', 22, 49300, '-', '-', '-', '-', '-', 1084600],
    ['GOOGL - CEDEAR ALPHABET INC. CL  A', 'ARS', 200, 8330, '-', '-', '-', '-', '16:35:35', 1666000],
    ['Liquidar', '-', 200, 8330, '-', '-', '-', '-', '-', 1666000],
    ['Subtotal', '-', '-', '-', 76.4234521, '-', '-', -2570111.42, '-', 27173370],
    ['Bonos'],
    ['Instrumento', 'Moneda de emisión', 'Cantidad', 'Precio', '% del total', 'PPP', 'Var%', 'Resultado', 'Actualizado', 'Posición total'],
    ['AO28 - BONO TESORO NACIONAL 6% 31/10/28 USD', 'USD', 1446, 132210, 5.9768629, 132072.7206118, 0.1039423, 1985.0599534, '16:35:04', 1911756.6],
    ['Otros'],
    ['Instrumento', 'Moneda de emisión', 'Cantidad', 'Precio', '% del total', 'PPP', 'Var%', 'Resultado', 'Actualizado', 'Posición total'],
    ['DOLARUSA - DOLARES USA ESP 7000', 'USD', 2.13, 1711, 0.0113938, 1627.7230047, 5.116165, 177.38, '16:35:04', 3644.43],
    ['ARS '],
    ['Plazo', 'Fecha', 'Saldo'],
    ['Hoy', '2026-11-27', 563.33],
  ], 'IEB-2026-11-27-Portafolio-ARS.xlsx');
  assert.equal(parsed.date, '2026-11-27');
  assert.equal(parsed.currency, 'ARS');
  assert.deepEqual(parsed.items.map(i => i.symbol), ['CAT', 'GOOGL', 'AO28', 'DOLARUSA']);
  assert.equal(parsed.items[1].calculated, true);
  assert.ok(Math.abs(parsed.items[1].percentage - (1666000 / 31985953.75 * 100)) < 1e-6);
  assert.equal(parsed.items[2].section, 'Bonos');
  assert.equal(parsed.items[3].cash, true);
});
