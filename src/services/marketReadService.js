import config from '../config/environment';

const marketUrl = `${config.API_URL}/api/market`;
const cache = new Map();
const pending = new Map();
let snapshotRequest;

async function readJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export function readSnapshot() {
  if (!snapshotRequest) {
    snapshotRequest = readJson(`${marketUrl}/snapshot`)
      .then(data => data.snapshot)
      .finally(() => { snapshotRequest = null; });
  }
  return snapshotRequest;
}

async function readBatch(symbols) {
  const query = new URLSearchParams({ symbols: symbols.join(',') });
  const { instruments } = await readJson(`${marketUrl}/instruments?${query}`);
  for (const symbol of symbols) {
    cache.set(symbol, { row: instruments[symbol] ?? null, readAt: Date.now() });
  }
}

export async function readInstruments(symbols, maxAge = 60000) {
  const keys = [...new Set(symbols.map(s => s.toUpperCase()))];
  const now = Date.now();
  const missing = keys.filter(symbol => {
    if (pending.has(symbol)) return false;
    const cached = cache.get(symbol);
    const ttl = cached?.row?.ema21 ? maxAge : Math.min(maxAge, 60000);
    return !cached || now - cached.readAt >= ttl;
  });
  for (let i = 0; i < missing.length; i += 100) {
    const batch = missing.slice(i, i + 100);
    const request = readBatch(batch).finally(() => batch.forEach(s => pending.delete(s)));
    batch.forEach(s => pending.set(s, request));
  }
  await Promise.all(new Set(keys.map(s => pending.get(s)).filter(Boolean)));
  return Object.fromEntries(keys.map(s => [s, cache.get(s)?.row ?? null]));
}
