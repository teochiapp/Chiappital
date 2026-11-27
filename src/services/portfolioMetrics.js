const PAIRS = { PSQ: 'QQQ', SH: 'SPY', DOG: 'DIA' };
const INDEX_EXPOSURE = { QQQ: { reference: 'QQQ', factor: 1 }, TQQQ: { reference: 'QQQ', factor: 3 },
  SPY: { reference: 'SPY', factor: 1 }, DIA: { reference: 'DIA', factor: 1 } };
const value = input => input == null || input === '' || !Number.isFinite(Number(input)) ? null : Number(input);
const attribute = (row, key) => row.attributes?.[key] ?? row[key];

export function riskSymbols(symbols) {
  const keys = symbols.map(symbol => String(symbol || '').toUpperCase()).filter(Boolean);
  return [...new Set([...keys, ...keys.map(symbol => PAIRS[symbol] || INDEX_EXPOSURE[symbol]?.reference).filter(Boolean)])];
}

function marketBeta(symbol, metrics) {
  const inverse = PAIRS[symbol];
  const index = INDEX_EXPOSURE[symbol];
  const reference = inverse || index?.reference;
  const beta = value(metrics[reference || symbol]?.beta);
  const base = reference === 'SPY' ? 1 : beta;
  if (base == null) return null;
  return inverse ? -Math.abs(base) : index ? Math.abs(base) * index.factor : base;
}

export function portfolioExposure(rows, metrics = {}) {
  const positions = rows.map(row => ({
    symbol: String(attribute(row, 'symbol') || '').trim().toUpperCase(),
    weight: Math.max(0, value(attribute(row, 'portfolio_percentage') ?? row.percentage) ?? 0),
    direction: attribute(row, 'type') === 'sell' ? -1 : 1,
  })).filter(row => row.symbol && row.weight > 0);
  const weights = {};
  positions.filter(row => row.direction === 1).forEach(row => { weights[row.symbol] = (weights[row.symbol] || 0) + row.weight; });
  const total = positions.reduce((sum, row) => sum + row.weight, 0);
  const cash = Math.max(0, 100 - total);
  let hedged = 0;
  const hedges = [];
  function match(inverse, direct, directFactor, inverseFactor, method, limit = Infinity) {
    const exposure = Math.min((weights[inverse] || 0) * inverseFactor, (weights[direct] || 0) * directFactor, limit);
    if (!(exposure > 0)) return;
    const inverseCapital = exposure / inverseFactor;
    const directCapital = exposure / directFactor;
    weights[inverse] = Math.max(0, weights[inverse] - inverseCapital);
    weights[direct] = Math.max(0, weights[direct] - directCapital);
    hedged += inverseCapital + directCapital;
    hedges.push({ inverse, direct, inverseCapital, directCapital, method });
  }
  // Primero compensa el índice equivalente, respetando el objetivo diario 3x de TQQQ.
  for (const [inverse, reference] of Object.entries(PAIRS)) {
    for (const [direct, index] of Object.entries(INDEX_EXPOSURE)) {
      if (index.reference === reference) match(inverse, direct, index.factor, 1, 'index');
    }
  }
  const directHedged = hedged;
  // El SH restante compensa proporcionalmente la sensibilidad positiva conocida al S&P 500.
  // Esta estimación representa riesgo de mercado; conserva los riesgos específicos de los activos.
  const eligible = Object.keys(weights).filter(symbol => !PAIRS[symbol] && weights[symbol] > 0
    && marketBeta(symbol, metrics) > 0);
  const positiveExposure = eligible.reduce((sum, symbol) => sum + weights[symbol] * marketBeta(symbol, metrics), 0);
  const fraction = positiveExposure > 0 ? Math.min(1, (weights.SH || 0) / positiveExposure) : 0;
  for (const symbol of eligible) {
    const directFactor = marketBeta(symbol, metrics);
    const directCapital = weights[symbol] * fraction;
    match('SH', symbol, directFactor, 1, 'beta', directCapital * directFactor);
  }
  const unknownExposure = Object.keys(weights).reduce((sum, symbol) =>
    sum + (!PAIRS[symbol] && marketBeta(symbol, metrics) == null ? weights[symbol] : 0), 0);
  return { positions, residual: weights, total, cash, hedged, directHedged, estimatedHedged: hedged - directHedged,
    hedges, unknownExposure, liquidity: cash + hedged, overallocated: total > 100.01 };
}

export function portfolioRisk(rows, metrics) {
  const exposure = portfolioExposure(rows, metrics);
  let beta = 0;
  let betaMissing = 0;
  let historical = 0;
  let historicalMissing = 0;
  const betaPositions = [
    ...Object.entries(exposure.residual).map(([symbol, weight]) => ({ symbol, weight, direction: 1 })),
    ...exposure.positions.filter(row => row.direction < 0),
  ];
  for (const row of betaPositions) {
    if (row.weight <= 0) continue;
    const itemBeta = marketBeta(row.symbol, metrics);
    if (itemBeta == null) betaMissing += row.weight;
    else beta += itemBeta * row.direction * row.weight / 100;
  }
  for (const [symbol, weight] of Object.entries(exposure.residual)) {
    if (weight <= 0) continue;
    const drawdown = value(metrics[symbol]?.max_drawdown_52w);
    if (drawdown == null) historicalMissing += weight;
    else historical += Math.min(0, drawdown) * weight / 100;
  }
  // Las posiciones vendidas requieren una serie de retornos propia para este escenario.
  historicalMissing += exposure.positions.filter(row => row.direction < 0).reduce((sum, row) => sum + row.weight, 0);
  return { ...exposure, beta, betaMissing, historical, historicalMissing };
}

export function dailyPortfolioReturn(rows, quotes, now = Date.now()) {
  const day = timestamp => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(timestamp));
  let percent = 0;
  let missing = 0;
  for (const row of rows) {
    const symbol = String(attribute(row, 'symbol') || '').toUpperCase();
    const weight = value(attribute(row, 'portfolio_percentage')) || 0;
    if (weight <= 0) continue;
    const quote = quotes[symbol];
    const change = value(quote?.changePercent);
    if (!quote?.quoteTime || !Number.isFinite(new Date(quote.quoteTime).getTime())
        || day(quote.quoteTime) !== day(now) || change == null || quote.isMock) {
      missing += weight;
      continue;
    }
    const direction = attribute(row, 'type') === 'sell' ? -1 : 1;
    const entry = value(attribute(row, 'entry_price'));
    const created = Date.parse(attribute(row, 'createdAt') ?? attribute(row, 'created_at'));
    const intraday = entry > 0 && quote.price > 0 && Number.isFinite(created) && day(created) === day(now);
    const changeToday = intraday ? (quote.price / entry - 1) * 100 : change;
    percent += direction * changeToday * weight / 100;
  }
  return { percent, missing };
}
