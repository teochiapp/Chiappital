// EMA alerts use the saved absolute EMA, never the cached percentage distance.
const EMA_CONDITION = 'ema21_above';
const MAX_QUOTE_AGE_MS = 2 * 60 * 1000;
const MAX_EMA_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function getSavedEma21(factors) {
  try {
    const parsed = typeof factors === 'string' ? JSON.parse(factors) : factors;
    const value = Number(parsed?.currentEma21 ?? parsed?.ema21);
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function evaluateEmaAlert(row, quote, now = Date.now()) {
  const ema21 = getSavedEma21(row.snapshot_factors);
  let emaValid = false;
  if (row.ema_age_sec !== undefined && row.ema_age_sec !== null) {
    const ageMs = Number(row.ema_age_sec) * 1000;
    emaValid = Number.isFinite(ageMs) && ageMs >= -60000 && ageMs <= MAX_EMA_AGE_MS;
  } else {
    const emaTime = new Date(row.ema_updated_at || '').getTime();
    emaValid = Number.isFinite(emaTime) && now - emaTime <= MAX_EMA_AGE_MS && emaTime <= now;
  }
  if (!ema21 || !emaValid) {
    return { status: 'missing_ema', ema21 };
  }
  if (!quote || !quote.marketState) return { status: 'unavailable', ema21 };
  if (quote.marketState !== 'REGULAR') return { status: 'market_closed', ema21 };
  const price = Number(quote.price);
  const quoteTime = new Date(quote.quoteTime || '').getTime();
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(quoteTime)
      || now - quoteTime > MAX_QUOTE_AGE_MS || quoteTime > now + 30000
      || quote.delayedMinutes == null || Number(quote.delayedMinutes) !== 0) {
    return { status: 'stale_quote', ema21 };
  }
  return { status: price > ema21 ? 'triggered' : 'watching', ema21, price };
}

async function checkEmaAlerts({ db, userId, fetchQuotes, now = Date.now() }) {
  const [rows] = await db.execute(
    `SELECT a.*, ms.setup_factors AS snapshot_factors, ms.ema_updated_at,
            TIMESTAMPDIFF(SECOND, ms.ema_updated_at, NOW()) AS ema_age_sec
     FROM market_alerts a LEFT JOIN market_snapshot ms ON ms.symbol = a.symbol
     WHERE a.user_id = ? AND a.is_active = 1 AND a.condition_type = ?`,
    [userId, EMA_CONDITION]
  );
  const symbols = [...new Set(rows.map(row => row.symbol))];
  const quotes = symbols.length ? await fetchQuotes(symbols) : {};
  const triggered = [];
  const checks = {};
  const prices = {};
  for (const row of rows) {
    const quote = quotes[row.symbol];
    const result = evaluateEmaAlert(row, quote, now);
    checks[row.id] = result;
    const displayPrice = result.price ?? (Number(quote?.price) > 0 ? Number(quote.price) : null);
    if (displayPrice) prices[row.symbol] = displayPrice;
    if (result.status !== 'triggered') continue;
    // Claim once, even when several tabs check concurrently. An edit invalidates the claim.
    const [claim] = await db.execute(
      `UPDATE market_alerts SET is_active = 0
       WHERE id = ? AND user_id = ? AND is_active = 1 AND condition_type = ?
         AND symbol = ? AND updated_at = ?`,
      [row.id, userId, EMA_CONDITION, row.symbol, row.updated_at]
    );
    if (claim.affectedRows === 0) continue;
    const { snapshot_factors, ema_age_sec, ...alert } = row;
    triggered.push({ ...alert, is_active: 0, triggered_price: result.price, triggered_ema21: result.ema21 });
  }
  return { triggered, checks, prices };
}

function normalizeAlertInput(input) {
  const symbol = typeof input.symbol === 'string' ? input.symbol.trim().toUpperCase() : '';
  const condition = input.condition_type;
  if (!symbol || symbol.length > 20 || !/^[A-Z0-9.^=/_-]+$/.test(symbol)) {
    throw new Error('Ingresá un ticker válido (hasta 20 caracteres).');
  }
  if (!['above', 'below', EMA_CONDITION].includes(condition)) {
    throw new Error('La condición de la alerta no es válida.');
  }
  const target = condition === EMA_CONDITION ? null : Number(input.target_price);
  if (condition !== EMA_CONDITION && (!Number.isFinite(target) || target <= 0)) {
    throw new Error('Ingresá un precio objetivo mayor a cero.');
  }
  return { symbol, condition_type: condition, target_price: target, notes: input.notes ?? null };
}

module.exports = { EMA_CONDITION, getSavedEma21, evaluateEmaAlert, checkEmaAlerts, normalizeAlertInput };
