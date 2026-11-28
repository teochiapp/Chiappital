// Cálculo de Relative Rotation Graph (RRG): Fuerza Relativa vs SPY y Momentum

function computeEMA(values, period) {
  const out = new Array(values.length).fill(null);
  if (values.length < period) return out;
  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  let ema = sum / period;
  out[period - 1] = ema;
  const k = 2 / (period + 1);
  for (let i = period; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
    out[i] = ema;
  }
  return out;
}

function robustScale(values, minScale, percentile = 0.65, factor = 1.1) {
  const abs = values
    .map(v => Math.abs(v))
    .filter(v => Number.isFinite(v) && v > 0)
    .sort((a, b) => a - b);
  if (!abs.length) return minScale;
  const idx = Math.min(abs.length - 1, Math.floor(abs.length * percentile));
  return Math.max(abs[idx] * factor, minScale);
}

export function getRrgQuadrant(x, y) {
  if (x >= 0 && y >= 0) return 'leading';
  if (x >= 0 && y < 0) return 'weakening';
  if (x < 0 && y < 0) return 'lagging';
  return 'improving';
}

export function computeRrgGroup(itemsWithSeries, benchmarkSeries, { trailPoints = 10, stepDays = 3 } = {}) {
  if (!benchmarkSeries || benchmarkSeries.length < 45) return [];
  const spyMap = new Map(benchmarkSeries.map(p => [p.date, p.close]));

  const rawItems = [];
  const allRecentRs = [];
  const allRecentMom = [];

  for (const item of itemsWithSeries) {
    if (!item || item.error || item.ticker === 'SPY' || !Array.isArray(item.series)) continue;

    const aligned = [];
    for (const pt of item.series) {
      const spyClose = spyMap.get(pt.date);
      if (spyClose > 0 && pt.close > 0) {
        aligned.push({ date: pt.date, rs: (pt.close / spyClose) * 100 });
      }
    }
    if (aligned.length < 50) continue;

    const rsValues = aligned.map(a => a.rs);
    const emaShort = computeEMA(rsValues, 10);
    const emaLong = computeEMA(rsValues, 40);

    const rawRsSeries = [];
    for (let i = 0; i < aligned.length; i++) {
      if (emaShort[i] != null && emaLong[i] != null && emaLong[i] > 0) {
        rawRsSeries.push({
          date: aligned[i].date,
          rawRs: ((emaShort[i] / emaLong[i]) - 1) * 100
        });
      }
    }
    if (rawRsSeries.length < 20) continue;

    const smoothRs = computeEMA(rawRsSeries.map(p => p.rawRs), 5);
    const points = [];
    const MOM_LOOKBACK = 10;
    for (let i = MOM_LOOKBACK; i < rawRsSeries.length; i++) {
      if (smoothRs[i] != null && smoothRs[i - MOM_LOOKBACK] != null) {
        points.push({
          date: rawRsSeries[i].date,
          rawRs: smoothRs[i],
          rawMom: smoothRs[i] - smoothRs[i - MOM_LOOKBACK]
        });
      }
    }
    if (points.length < 5) continue;

    const tail = [];
    const lastIdx = points.length - 1;
    for (let k = trailPoints - 1; k >= 0; k--) {
      const idx = lastIdx - k * stepDays;
      if (idx >= 0) tail.push(points[idx]);
    }
    if (tail[tail.length - 1] !== points[lastIdx]) {
      tail.push(points[lastIdx]);
    }

    for (const p of tail) {
      allRecentRs.push(p.rawRs);
      allRecentMom.push(p.rawMom);
    }

    rawItems.push({ item, tail });
  }

  if (!rawItems.length) return [];

  const scaleX = robustScale(allRecentRs, 0.8, 0.65, 1.05);
  const scaleY = robustScale(allRecentMom, 0.35, 0.50, 0.85);
  const clamp = (v, lim = 2.25) => Math.max(-lim, Math.min(lim, v));

  return rawItems.map(({ item, tail }) => {
    const trail = tail.map(p => ({
      date: p.date,
      x: Number(clamp(p.rawRs / scaleX).toFixed(3)),
      y: Number(clamp(p.rawMom / scaleY).toFixed(3)),
      rawRs: Number(p.rawRs.toFixed(2)),
      rawMom: Number(p.rawMom.toFixed(2))
    }));
    const head = trail[trail.length - 1];
    return {
      id: item.id,
      ticker: item.ticker,
      name: item.name,
      x: head.x,
      y: head.y,
      rawRs: head.rawRs,
      rawMom: head.rawMom,
      quadrant: getRrgQuadrant(head.x, head.y),
      dailyPerf: item.dailyPerf,
      weeklyPerf: item.weeklyPerf,
      monthlyPerf: item.monthlyPerf,
      trail
    };
  });
}
