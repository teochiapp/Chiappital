// api/services/macroSectorService.js
// Servicio backend agregador para Macro y Sectores con caché en memoria y concurrencia optimizada

const logger = require('../utils/logger');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'd3t6mg9r01qqdgfufaggd3t6mg9r01qqdgfufah0';

// Tickers e IDs canónicos
const GICS_SECTORS = [
  { id: 'xlk', name: 'Tecnología', ticker: 'XLK' },
  { id: 'igv', name: 'Software', ticker: 'IGV' },
  { id: 'smh', name: 'Semiconductores', ticker: 'SMH' },
  { id: 'btc', name: 'Criptomonedas', ticker: 'BTC-USD' },
  { id: 'xly', name: 'Consumo Discrecional', ticker: 'XLY' },
  { id: 'xlc', name: 'Comunicaciones', ticker: 'XLC' },
  { id: 'xlf', name: 'Financiero', ticker: 'XLF' },
  { id: 'xli', name: 'Industrial', ticker: 'XLI' },
  { id: 'xlv', name: 'Salud', ticker: 'XLV' },
  { id: 'xlp', name: 'Consumo Básico', ticker: 'XLP' },
  { id: 'xle', name: 'Energía', ticker: 'XLE' },
  { id: 'xlu', name: 'Servicios Públicos', ticker: 'XLU' },
  { id: 'xlre', name: 'Real Estate', ticker: 'XLRE' },
  { id: 'xlb', name: 'Materiales', ticker: 'XLB' }
];

const REGIONS = [
  { id: 'spy', name: 'USA Large Cap', ticker: 'SPY' },
  { id: 'iwm', name: 'USA Small Cap', ticker: 'IWM' },
  { id: 'merval', name: 'Argentina', ticker: '^MERV' },
  { id: 'ewz', name: 'Brasil', ticker: 'EWZ' },
  { id: 'fxi', name: 'China', ticker: 'FXI' },
  { id: 'vgk', name: 'Europa', ticker: 'VGK' },
  { id: 'ewj', name: 'Japón', ticker: 'EWJ' },
  { id: 'eem', name: 'Emergentes', ticker: 'EEM' }
];

// Helper para mapear símbolos
function mapYahooSymbol(symbol) {
  const map = {
    'BTC': 'BTC-USD',
    'ETH': 'ETH-USD',
    'MERVAL': '^MERV'
  };
  return map[symbol.toUpperCase()] || symbol;
}

// ─── Estructuras de Caché en Memoria ───────────────────────────────────────────
let macroCache = { data: null, timestamp: 0 };
let sectorCache = { data: null, timestamp: 0 };

const MACRO_CACHE_TTL = 10 * 60 * 1000;  // 10 minutos
const SECTOR_CACHE_TTL = 20 * 60 * 1000; // 20 minutos

let pendingMacroPromise = null;
let pendingSectorPromise = null;

// ─── Helper de Fetch a Yahoo Chart ───────────────────────────────────────────
async function fetchYahooChart(symbol, range = '5d', interval = '1d') {
  const mapped = mapYahooSymbol(symbol);
  const encoded = encodeURIComponent(mapped);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=${interval}&range=${range}`;
  
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(8000)
  });

  if (!response.ok) {
    throw new Error(`Yahoo HTTP ${response.status} para ${symbol}`);
  }

  const data = await response.json();
  const result = data.chart?.result?.[0];
  if (!result) {
    throw new Error(`Sin datos para ${symbol}`);
  }

  const meta = result.meta;
  const quotes = result.indicators?.quote?.[0];
  const timestamps = result.timestamp || [];
  
  const price = meta.regularMarketPrice || meta.chartPreviousClose || 0;
  const prevClose = meta.chartPreviousClose || meta.previousClose || price;
  const changePercent = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;

  return {
    symbol,
    price,
    changePercent,
    timestamps,
    quotes
  };
}

// ─── Procesador Macro ─────────────────────────────────────────────────────────
async function fetchMacroData() {
  const forexSymbols = ['EURUSD=X', 'JPY=X', 'CNY=X', 'BRL=X', 'KRW=X'];
  const macroSymbols = ['SPY', 'QQQ', 'IWM', '^VIX', '^TNX', 'SMH', 'IGV', 'DX-Y.NYB'];
  const commoditySymbols = ['CL=F', 'GC=F', 'SI=F', 'HG=F', 'ZS=F', 'ZW=F', 'ZC=F', 'NG=F'];

  // Fecha para earnings
  const earningsDate = new Date();
  const dow = earningsDate.getDay();
  if (dow === 6) earningsDate.setDate(earningsDate.getDate() - 1);
  if (dow === 0) earningsDate.setDate(earningsDate.getDate() - 2);
  const pad = n => n.toString().padStart(2, '0');
  const targetEarningsDate = `${earningsDate.getFullYear()}-${pad(earningsDate.getMonth() + 1)}-${pad(earningsDate.getDate())}`;

  // 1. Fetch DolarAPI
  const dolarPromise = (async () => {
    try {
      const res = await fetch('https://dolarapi.com/v1/dolares', { signal: AbortSignal.timeout(5000) });
      if (res.ok) return await res.json();
    } catch (e) {
      logger.warn('MacroService', `DolarAPI error: ${e.message}`);
    }
    return [];
  })();

  // 2. Fetch Finnhub News
  const newsPromise = (async () => {
    try {
      const res = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const raw = await res.json();
        return processNews(raw);
      }
    } catch (e) {
      logger.warn('MacroService', `Finnhub News error: ${e.message}`);
    }
    return [];
  })();

  // 3. Fetch Finnhub Earnings
  const earningsPromise = (async () => {
    try {
      const res = await fetch(
        `https://finnhub.io/api/v1/calendar/earnings?from=${targetEarningsDate}&to=${targetEarningsDate}&token=${FINNHUB_API_KEY}`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (res.ok) {
        const data = await res.json();
        return processEarnings(data.earningsCalendar || []);
      }
    } catch (e) {
      logger.warn('MacroService', `Finnhub Earnings error: ${e.message}`);
    }
    return { bmo: [], amc: [], other: [] };
  })();

  // 4. Fetch cotizaciones Yahoo en paralelo por lotes
  const allYahooSymbols = [...forexSymbols, ...macroSymbols, ...commoditySymbols];
  const yahooResults = new Map();

  const BATCH_SIZE = 6;
  for (let i = 0; i < allYahooSymbols.length; i += BATCH_SIZE) {
    const chunk = allYahooSymbols.slice(i, i + BATCH_SIZE);
    const chunkPromises = chunk.map(sym => 
      fetchYahooChart(sym, '5d', '1d')
        .then(res => yahooResults.set(sym, res))
        .catch(err => logger.debug('MacroService', `Fallo Yahoo para ${sym}: ${err.message}`))
    );
    await Promise.allSettled(chunkPromises);
  }

  const [dolarRes, newsRes, earningsRes] = await Promise.all([dolarPromise, newsPromise, earningsPromise]);

  // Formatear Forex + Dólar
  const forex = forexSymbols.map(sym => {
    const item = yahooResults.get(sym);
    let name = sym;
    let iso = null;
    switch (sym) {
      case 'EURUSD=X': name = 'EUR/USD'; iso = 'eu'; break;
      case 'JPY=X':    name = 'USD/JPY'; iso = 'jp'; break;
      case 'BRL=X':    name = 'USD/BRL'; iso = 'br'; break;
      case 'CNY=X':    name = 'USD/CNY'; iso = 'cn'; break;
      case 'KRW=X':    name = 'USD/KRW'; iso = 'kr'; break;
      default: break;
    }
    return {
      symbol: sym,
      name,
      price: item ? item.price : 0,
      change: item ? item.changePercent : 0,
      iso
    };
  });

  if (Array.isArray(dolarRes)) {
    const oficial = dolarRes.find(d => d.casa === 'oficial');
    const mep     = dolarRes.find(d => d.casa === 'mep');
    const ccl     = dolarRes.find(d => d.casa === 'contadoconliqui');
    if (oficial) forex.push({ symbol: 'ARS_OFICIAL', name: 'USD/ARS Oficial', price: oficial.venta, change: null, iso: 'ar' });
    if (mep)     forex.push({ symbol: 'ARS_MEP',     name: 'USD/ARS MEP',     price: mep.venta,     change: null, iso: 'ar' });
    if (ccl)     forex.push({ symbol: 'ARS_CCL',     name: 'USD/ARS CCL',     price: ccl.venta,     change: null, iso: 'ar' });
  }

  // Formatear Macro y Ratios
  const macro = [];
  const dict = {};
  macroSymbols.forEach(sym => {
    const item = yahooResults.get(sym);
    if (!item) return;
    dict[sym] = { price: item.price, change: item.changePercent };
    let name = '';
    switch (sym) {
      case '^TNX':     name = '10Y Treasury';       break;
      case 'DX-Y.NYB': name = 'DXY (Dollar Index)';  break;
      case '^VIX':     name = 'VIX Volatility';     break;
      default: return;
    }
    macro.push({ symbol: sym, name, price: item.price, change: item.changePercent });
  });

  const addRatio = (symA, symB, nameA, nameB) => {
    const a = dict[symA], b = dict[symB];
    if (!a || !b || b.price <= 0) return;
    const ratioPrice = a.price / b.price;
    const oldA = a.price / (1 + a.change / 100);
    const oldB = b.price / (1 + b.change / 100);
    const ratioChange = ((ratioPrice / (oldA / oldB)) - 1) * 100;
    macro.push({ symbol: `${symA}/${symB}`, name: `Ratio ${nameA}/${nameB}`, price: ratioPrice, change: ratioChange });
  };
  addRatio('QQQ', 'SPY', 'QQQ', 'SPY');
  addRatio('IGV', 'SMH', 'IGV', 'SMH');
  addRatio('IWM', 'SPY', 'IWM', 'SPY');

  // Formatear Commodities
  const commodities = commoditySymbols.map(sym => {
    const item = yahooResults.get(sym);
    let name = sym;
    switch (sym) {
      case 'CL=F': name = '🛢️ Petróleo';    break;
      case 'GC=F': name = '🥇 Oro';          break;
      case 'SI=F': name = '🥈 Plata';         break;
      case 'HG=F': name = '🟠 Cobre';         break;
      case 'ZS=F': name = '🌱 Soja';          break;
      case 'ZW=F': name = '🌾 Trigo';         break;
      case 'ZC=F': name = '🌽 Maíz';          break;
      case 'NG=F': name = '🔥 Gas Natural';   break;
      default: break;
    }
    return {
      symbol: sym,
      name,
      price: item ? item.price : 0,
      change: item ? item.changePercent : 0
    };
  });

  return {
    earningsDate: targetEarningsDate,
    earnings: earningsRes,
    forex,
    macro,
    commodities,
    news: newsRes,
    timestamp: Date.now()
  };
}

// ─── Cálculo RRG (Fuerza Relativa vs SPY y Momentum) ────────────────────────────
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

function getRrgQuadrant(x, y) {
  if (x >= 0 && y >= 0) return 'leading';
  if (x >= 0 && y < 0) return 'weakening';
  if (x < 0 && y < 0) return 'lagging';
  return 'improving';
}

function computeRrgGroup(itemsWithSeries, benchmarkSeries, { trailPoints = 10, stepDays = 3 } = {}) {
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

    // Tomar muestras espaciadas hacia atrás para construir la estela
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

// ─── Procesador Sectores ──────────────────────────────────────────────────────
async function fetchSectorData() {
  const allItems = [...GICS_SECTORS, ...REGIONS];
  const results = [];

  const BATCH_SIZE = 5;
  for (let i = 0; i < allItems.length; i += BATCH_SIZE) {
    const chunk = allItems.slice(i, i + BATCH_SIZE);
    const promises = chunk.map(async (item) => {
      try {
        const chartData = await fetchYahooChart(item.ticker, '6mo', '1d');
        const rawCloses = chartData.quotes?.close || [];
        const rawTimestamps = chartData.timestamps || [];

        const series = [];
        const closes = [];
        for (let idx = 0; idx < rawCloses.length; idx++) {
          const c = rawCloses[idx];
          const ts = rawTimestamps[idx];
          if (typeof c === 'number' && Number.isFinite(c) && c > 0) {
            closes.push(c);
            if (typeof ts === 'number' && ts > 0) {
              series.push({
                date: new Date(ts * 1000).toISOString().slice(0, 10),
                close: c
              });
            }
          }
        }
        const len = closes.length;

        if (len < 22) {
          return { ...item, error: 'Datos insuficientes' };
        }

        const lastClose = closes[len - 1];
        const prevClose = closes[len - 2];
        const weekClose = closes[Math.max(0, len - 6)];
        const monthClose = closes[Math.max(0, len - 22)];

        const dailyPerf = ((lastClose - prevClose) / prevClose) * 100;
        const weeklyPerf = ((lastClose - weekClose) / weekClose) * 100;
        const monthlyPerf = ((lastClose - monthClose) / monthClose) * 100;
        const sparkline = closes.slice(Math.max(0, len - 21));

        return {
          ...item,
          dailyPerf,
          weeklyPerf,
          monthlyPerf,
          sparkline,
          series,
          error: null
        };
      } catch (err) {
        logger.warn('SectorService', `Error para ${item.ticker}: ${err.message}`);
        return { ...item, error: err.message };
      }
    });

    const chunkResults = await Promise.all(promises);
    results.push(...chunkResults);
  }

  const spyItem = results.find(r => r.ticker === 'SPY');
  const spySeries = spyItem?.series || [];

  const sectorsWithSeries = results.filter(r => GICS_SECTORS.some(s => s.id === r.id));
  const regionsWithSeries = results.filter(r => REGIONS.some(s => s.id === r.id));

  const rrg = {
    benchmark: 'SPY',
    sectors: computeRrgGroup(sectorsWithSeries, spySeries),
    regions: computeRrgGroup(regionsWithSeries, spySeries)
  };

  // No inflamos el payload enviando la serie diaria completa en sectors/regions
  const stripSeries = ({ series, ...rest }) => rest;

  return {
    sectors: sectorsWithSeries.map(stripSeries),
    regions: regionsWithSeries.map(stripSeries),
    rrg,
    timestamp: Date.now()
  };
}

// ─── Helpers de Filtrado ───────────────────────────────────────────────────────
function processEarnings(earningsList) {
  const result = { bmo: [], amc: [], other: [] };
  if (!Array.isArray(earningsList)) return result;

  // Filtrar activos conocidos / populares
  earningsList.forEach(item => {
    if (item.symbol) {
      if (item.hour === 'bmo') result.bmo.push(item);
      else if (item.hour === 'amc') result.amc.push(item);
      else result.other.push(item);
    }
  });

  return result;
}

function processNews(newsList) {
  const goodKeywords = [
    'fed','fomc','powell','ecb','boj','bank of japan','bank of england','pboc','central bank',
    'cpi','pce','ppi','inflation','deflation',
    'gdp','payroll','nonfarm payroll','employment','unemployment','jobless claims',
    'retail sales','consumer confidence','manufacturing','ism','pmi',
    'treasury','yield','bond',
    'earnings','revenue','eps','guidance','forecast','profit','quarterly results',
    'recession','tariff','trade','sanctions','oil','brent','gold','bitcoin'
  ];
  const badKeywords = [
    'cramer','odds','opinion','editorial','watch','live blog',
    'movie','tv','series','celebrity','hollywood','kardashian','music',
    'nba','nfl','mlb','soccer','football','tennis',
    'should you buy','top 10','best stocks','millionaire','becomes rich','here is why','5 reasons',
    'memecoin','dogecoin price prediction','shiba',
    'viral','meme','instagram','tiktok'
  ];

  if (!Array.isArray(newsList)) return [];
  let filtered = newsList.filter(a => {
    const t = ((a.headline || '') + ' ' + (a.summary || '')).toLowerCase();
    if (badKeywords.some(b => t.includes(b))) return false;
    return goodKeywords.some(g => t.includes(g));
  });

  if (filtered.length < 5) {
    filtered = newsList.filter(a => {
      const t = ((a.headline || '') + ' ' + (a.summary || '')).toLowerCase();
      return !badKeywords.some(b => t.includes(b));
    });
  }

  return filtered.slice(0, 15);
}

// ─── Métodos Públicos con Caché ───────────────────────────────────────────────
async function getMacroSummary(force = false) {
  const now = Date.now();
  if (!force && macroCache.data && (now - macroCache.timestamp < MACRO_CACHE_TTL)) {
    return { ...macroCache.data, cached: true };
  }

  if (pendingMacroPromise && !force) {
    return await pendingMacroPromise;
  }

  pendingMacroPromise = (async () => {
    try {
      const data = await fetchMacroData();
      macroCache = { data, timestamp: Date.now() };
      return { ...data, cached: false };
    } finally {
      pendingMacroPromise = null;
    }
  })();

  return await pendingMacroPromise;
}

async function getSectorSummary(force = false) {
  const now = Date.now();
  if (!force && sectorCache.data && (now - sectorCache.timestamp < SECTOR_CACHE_TTL)) {
    return { ...sectorCache.data, cached: true };
  }

  if (pendingSectorPromise && !force) {
    return await pendingSectorPromise;
  }

  pendingSectorPromise = (async () => {
    try {
      const data = await fetchSectorData();
      sectorCache = { data, timestamp: Date.now() };
      return { ...data, cached: false };
    } finally {
      pendingSectorPromise = null;
    }
  })();

  return await pendingSectorPromise;
}

module.exports = {
  getMacroSummary,
  getSectorSummary,
  GICS_SECTORS,
  REGIONS
};
