/**
 * backtestingService.js
 *
 * Motor de backtesting On-Demand.
 *
 * Arquitectura:
 *   Yahoo Finance (1d + SPY 1d)
 *     ↓
 *   fetchHistoricalData() — descarga única, con warm-up
 *     ↓
 *   buildDailyArrays() — normaliza OHLCV + adjClose
 *     ↓
 *   buildWeeklyBuckets() — agrupa diario→semanal sin look-ahead
 *     ↓
 *   Para cada día i en el período:
 *     computeIndicatorsAtIndex(i)    — todos los indicadores
 *     detectSetupAtIndex(i)          — setupState sincrónico
 *     calculateOpScore(setup, data)  — mismo Score que el Screener
 *     SignalEngine(score)            — BUY | HOLD | SELL
 *     PortfolioEngine.step(signal)   — posición y equity
 *     ↓
 *   MetricsEngine — estadísticas finales
 *     ↓
 *   JSON result
 *
 * Decisiones de close vs adjClose:
 *   - INDICADORES (EMAs, SMA, RSI, MACD, setup detection): close
 *     Consistente con el Screener, que recibe datos sin ajustar de Yahoo en tiempo real.
 *   - BUY & HOLD retorno y comparaciones de performance: adjClose
 *     El adjClose incorpora splits y dividendos para retornos históricos correctos.
 *   - PRECIO DE EJECUCIÓN de órdenes: open del día T+1 (dato OHLC, sin ajustar)
 *     Para evitar look-ahead bias: señal en Close(T) → ejecución en Open(T+1).
 *
 * Stops con datos OHLC diarios:
 *   Si en la misma vela se activan SL y TP, se asume que el SL ocurrió primero.
 *   Esto es conservador (peor caso) con datos diarios ya que no disponemos de datos intradía.
 */

'use strict';

const { default: YahooFinance } = require('yahoo-finance2');
const { calculateOpScore } = require('./opScoreService');

const yahooFinance = new YahooFinance({ validation: { logErrors: false } });

// ─── Constantes ───────────────────────────────────────────────────────────────
const SLOPE_THRESHOLD_PCT = 0.20;     // Mismo que calculateDailySetup
const MIN_SEPARATION_PCT  = 1.0;      // Mismo que calculateDailySetup
const EMA200_SLOPE_THRESHOLD_PCT = 0.05;
const WARM_UP_DAYS = 280;             // 200 (SMA200) + 80 de buffer para MACD semanal, etc.
const WEEKLY_MACD_WARM_UP = 35;      // Semanas: 26 (EMA lenta) + 9 (señal) = 35

// ─── Yahoo Finance wrapper con timeout ────────────────────────────────────────
function withTimeout(promise, ms, label = 'request') {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms [${label}]`)), ms);
    })
  ]).finally(() => clearTimeout(timer));
}

// ─── Funciones de indicadores (idénticas a marketSyncService.js) ──────────────

function calculateEMAArray(data, period) {
  if (!data || data.length < period) return new Array(data.length).fill(null);
  const k = 2 / (period + 1);
  let emaArray = new Array(data.length).fill(null);
  let sum = 0;
  for (let i = 0; i < period; i++) sum += data[i];
  let ema = sum / period;
  emaArray[period - 1] = ema;
  for (let i = period; i < data.length; i++) {
    ema = (data[i] * k) + (ema * (1 - k));
    emaArray[i] = ema;
  }
  return emaArray;
}

function calculateSMAArray(data, period) {
  if (!data || data.length < period) return new Array(data.length).fill(null);
  let smaArray = new Array(data.length).fill(null);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    if (i >= period) sum -= data[i - period];
    if (i >= period - 1) smaArray[i] = sum / period;
  }
  return smaArray;
}

function calculateRsiArray(closes, period = 14) {
  if (!closes || closes.length <= period) return new Array(closes.length).fill(null);
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  let rsiArray = new Array(period).fill(null);
  const getRsi = (ag, al) => al === 0 ? 100 : 100 - (100 / (1 + ag / al));
  rsiArray.push(getRsi(avgGain, avgLoss));
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rsiArray.push(getRsi(avgGain, avgLoss));
  }
  return rsiArray;
}

function calculateMacdArrays(closes, fast = 12, slow = 26, signal = 9) {
  if (!closes || closes.length <= slow) return { macdLine: new Array(closes.length).fill(null), signalLine: new Array(closes.length).fill(null), histLine: new Array(closes.length).fill(null) };
  const emaFast = calculateEMAArray(closes, fast);
  const emaSlow = calculateEMAArray(closes, slow);
  let macdLine = [];
  let validMacdStart = -1;
  for (let i = 0; i < closes.length; i++) {
    if (emaFast[i] !== null && emaSlow[i] !== null) {
      if (validMacdStart === -1) validMacdStart = i;
      macdLine.push(emaFast[i] - emaSlow[i]);
    } else {
      macdLine.push(null);
    }
  }
  if (validMacdStart === -1) return { macdLine, signalLine: new Array(closes.length).fill(null), histLine: new Array(closes.length).fill(null) };
  const validMacdLine = macdLine.slice(validMacdStart).filter(v => v !== null);
  const signalLineValid = calculateEMAArray(validMacdLine, signal);
  let signalLine = new Array(validMacdStart).fill(null);
  // Re-insert nulls from macdLine after validMacdStart
  let validIdx = 0;
  for (let i = validMacdStart; i < closes.length; i++) {
    signalLine.push(macdLine[i] !== null ? signalLineValid[validIdx++] : null);
  }
  let histLine = [];
  for (let i = 0; i < closes.length; i++) {
    histLine.push((macdLine[i] !== null && signalLine[i] !== null) ? macdLine[i] - signalLine[i] : null);
  }
  return { macdLine, signalLine, histLine };
}

function calculateATRArray(highs, lows, closes, period = 14) {
  if (!highs || !lows || !closes || closes.length <= period) return new Array(closes.length).fill(null);
  let trArray = [highs[0] - lows[0]];
  for (let i = 1; i < closes.length; i++) {
    const hl = highs[i] - lows[i];
    const hpc = Math.abs(highs[i] - closes[i - 1]);
    const lpc = Math.abs(lows[i] - closes[i - 1]);
    trArray.push(Math.max(hl, hpc, lpc));
  }
  let atrArray = new Array(closes.length).fill(null);
  let trSum = 0;
  for (let i = 0; i < period; i++) trSum += trArray[i];
  let atr = trSum / period;
  atrArray[period - 1] = atr;
  for (let i = period; i < closes.length; i++) {
    atr = (atr * (period - 1) + trArray[i]) / period;
    atrArray[i] = atr;
  }
  return atrArray;
}

// ─── 1. Descarga histórica ─────────────────────────────────────────────────────

/**
 * Descarga el histórico diario de un ticker y de SPY (benchmark RS).
 * Incluye warm-up automático antes de startDate.
 *
 * @param {string} ticker
 * @param {Date} startDate — fecha de inicio del backtest (sin warm-up)
 * @param {Date} endDate
 * @param {string} benchmarkSymbol — default 'SPY'
 * @returns {{ ticker: quotes[], benchmark: quotes[] }}
 */
async function fetchHistoricalData(ticker, startDate, endDate, benchmarkSymbol = 'SPY') {
  // Warm-up: retrocedemos WARM_UP_DAYS días calendario (~280 días de negociación real)
  const warmupStart = new Date(startDate);
  warmupStart.setDate(warmupStart.getDate() - WARM_UP_DAYS);
  const period1 = warmupStart.toISOString().split('T')[0];
  const period2 = endDate.toISOString().split('T')[0];

  const chartOptions = { period1, period2: period2, interval: '1d' };

  const [tickerData, benchmarkData] = await Promise.all([
    withTimeout(
      yahooFinance.chart(ticker, chartOptions),
      30000, `chart ${ticker}`
    ).catch(async (e) => {
      // Fallback .BA para tickers argentinos
      if (!ticker.includes('.') && !ticker.includes('=')) {
        return withTimeout(
          yahooFinance.chart(ticker + '.BA', chartOptions),
          30000, `chart ${ticker}.BA`
        );
      }
      throw e;
    }),
    withTimeout(
      yahooFinance.chart(benchmarkSymbol, chartOptions),
      30000, `chart ${benchmarkSymbol}`
    ).catch(() => null) // Si falla SPY, continuamos sin RS
  ]);

  if (!tickerData || !tickerData.quotes || tickerData.quotes.length === 0) {
    throw new Error(`No historical data found for ${ticker}`);
  }

  // También intentamos obtener el nombre del ticker
  let companyName = ticker;
  try {
    const quote = await withTimeout(yahooFinance.quote(ticker), 10000, `quote ${ticker}`);
    if (quote && quote.shortName) companyName = quote.shortName;
  } catch (_) { /* no crítico */ }

  return {
    tickerQuotes: tickerData.quotes,
    benchmarkQuotes: benchmarkData ? benchmarkData.quotes : [],
    companyName
  };
}

// ─── 2. Normalización de arrays diarios ───────────────────────────────────────

/**
 * Convierte las quotes crudas de Yahoo en arrays paralelos limpios,
 * ordenados cronológicamente.
 *
 * @param {Array} quotes — raw quotes de yahoo-finance2
 * @returns {Object} dailyArrays con: dates, opens, highs, lows, closes, adjCloses, volumes
 */
function buildDailyArrays(quotes) {
  // Ordenar cronológicamente y filtrar velas inválidas
  const valid = quotes
    .filter(q =>
      q.date && q.open != null && !isNaN(q.open) &&
      q.high != null && !isNaN(q.high) &&
      q.low != null && !isNaN(q.low) &&
      q.close != null && !isNaN(q.close) &&
      q.volume != null && !isNaN(q.volume)
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Eliminar fechas duplicadas (tomar la primera ocurrencia)
  const seen = new Set();
  const deduped = valid.filter(q => {
    const key = new Date(q.date).toISOString().split('T')[0];
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const dates      = deduped.map(q => new Date(q.date).toISOString().split('T')[0]);
  const opens      = deduped.map(q => q.open);
  const highs      = deduped.map(q => q.high);
  const lows       = deduped.map(q => q.low);
  const closes     = deduped.map(q => q.close);
  const adjCloses  = deduped.map(q => q.adjclose != null ? q.adjclose : q.close);
  const volumes    = deduped.map(q => q.volume);

  return { dates, opens, highs, lows, closes, adjCloses, volumes };
}

// ─── 3. Indicadores diarios precalculados (arrays completos) ──────────────────

/**
 * Precalcula todos los arrays de indicadores diarios sobre el histórico completo.
 * Se llama UNA SOLA VEZ y luego se accede por índice en el loop del backtest.
 */
function buildIndicatorArrays(dailyArrays) {
  const { closes, highs, lows, volumes } = dailyArrays;

  const ema21   = calculateEMAArray(closes, 21);
  const sma30   = calculateSMAArray(closes, 30);
  const sma50   = calculateSMAArray(closes, 50);
  const ema200  = calculateEMAArray(closes, 200);
  const atr14   = calculateATRArray(highs, lows, closes, 14);
  const rsiDaily = calculateRsiArray(closes, 14);
  const volSma20 = calculateSMAArray(volumes, 20);
  const macdDaily = calculateMacdArrays(closes, 12, 26, 9);

  // Slopes
  const getDir = (pct) => pct >= SLOPE_THRESHOLD_PCT ? 'UP' : (pct <= -SLOPE_THRESHOLD_PCT ? 'DOWN' : 'FLAT');
  const getDir200 = (pct) => pct >= EMA200_SLOPE_THRESHOLD_PCT ? 'UP' : (pct <= -EMA200_SLOPE_THRESHOLD_PCT ? 'DOWN' : 'FLAT');

  return { ema21, sma30, sma50, ema200, atr14, rsiDaily, volSma20, macdDaily, getDir, getDir200 };
}

// ─── 4. Indicadores semanales sin look-ahead bias ────────────────────────────

/**
 * Agrupa velas diarias en semanas ISO y calcula RSI/MACD semanales.
 * Para cada día t, el valor semanal disponible es el de la ÚLTIMA SEMANA
 * cerrada ANTES O EN el día t.
 *
 * Definición de "semana cerrada": una semana cuyo viernes (o último día de trading
 * de esa semana) ya pasó con respecto a la fecha t actual.
 *
 * Convención: el cierre de la vela semanal se toma como el close del último día
 * de esa semana presente en los datos.
 *
 * @param {Object} dailyArrays — { dates, closes, highs, volumes }
 * @returns {Object} weeklySnapshot[i] = { rsiWeekly, macdWeekly, macdSignalWeekly, macdHistWeekly, macdPrevWeekly, macdPrevSignal, macdPrevHist, drawdown52w, high52w }
 */
function buildWeeklySnapshots(dailyArrays) {
  const { dates, closes, highs } = dailyArrays;
  const n = dates.length;

  // Paso 1: agrupar días en semanas. Una semana = lunes a viernes (o lunes al siguiente lunes-1).
  // Usamos la semana ISO (getISOWeek): días con mismo año-semana van juntos.
  function getISOYearWeek(dateStr) {
    const d = new Date(dateStr + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  }

  // Construir array de semanas: cada semana tiene { weekKey, lastDayIdx, close, high }
  const weeks = [];
  let currentWeekKey = null;
  let currentWeek = null;

  for (let i = 0; i < n; i++) {
    const wk = getISOYearWeek(dates[i]);
    if (wk !== currentWeekKey) {
      if (currentWeek) weeks.push(currentWeek);
      currentWeekKey = wk;
      currentWeek = { weekKey: wk, lastDayIdx: i, close: closes[i], high: highs[i] };
    } else {
      currentWeek.lastDayIdx = i;
      currentWeek.close = closes[i];
      currentWeek.high = Math.max(currentWeek.high, highs[i]);
    }
  }
  if (currentWeek) weeks.push(currentWeek);

  // Paso 2: calcular RSI y MACD semanales sobre los closes semanales
  const weeklyCloses = weeks.map(w => w.close);
  const weeklyHighs  = weeks.map(w => w.high);
  const weeklyRsiArr = calculateRsiArray(weeklyCloses, 14);
  const weeklyMacd   = calculateMacdArrays(weeklyCloses, 12, 26, 9);

  // Paso 3: calcular drawdown52w semanal (basado en los últimos 52 cierres semanales)
  const weeklyDrawdown52 = weeklyHighs.map((_, wi) => {
    const start = Math.max(0, wi - 51);
    const max52wHigh = Math.max(...weeklyHighs.slice(start, wi + 1));
    return max52wHigh > 0 ? ((weeklyCloses[wi] - max52wHigh) / max52wHigh) * 100 : null;
  });

  // Paso 4: para cada día i, encontrar el índice de la última semana CERRADA.
  // Una semana está "cerrada" si su lastDayIdx <= i (es decir, ya pasó completamente).
  // Excepción: si i ES el lastDayIdx de una semana, esa semana cierra al final de ese día.
  // Por tanto, en el día t=viernes, el cierre semanal YA ESTÁ disponible para el Score del mismo día.
  // Esto es correcto para "Signal en Close(T) → Ejecución en Open(T+1)".

  const weeklySnapshot = new Array(n).fill(null);

  let weekIdx = -1; // índice de la última semana "vista"

  for (let i = 0; i < n; i++) {
    // Avanzar al último índice de semana cuyo lastDayIdx <= i
    while (weekIdx + 1 < weeks.length && weeks[weekIdx + 1].lastDayIdx <= i) {
      weekIdx++;
    }

    if (weekIdx < 0) {
      weeklySnapshot[i] = null;
      continue;
    }

    const wi = weekIdx;
    const rsiWeekly  = weeklyRsiArr[wi] != null ? parseFloat(weeklyRsiArr[wi].toFixed(2)) : null;
    const rsiWPrev   = wi >= 1 ? (weeklyRsiArr[wi - 1] != null ? parseFloat(weeklyRsiArr[wi - 1].toFixed(2)) : null) : null;
    const macdW      = weeklyMacd.macdLine[wi];
    const signalW    = weeklyMacd.signalLine[wi];
    const histW      = weeklyMacd.histLine[wi];
    const macdWPrev  = wi >= 1 ? weeklyMacd.macdLine[wi - 1] : null;
    const signalWPrev = wi >= 1 ? weeklyMacd.signalLine[wi - 1] : null;
    const histWPrev  = wi >= 1 ? weeklyMacd.histLine[wi - 1] : null;

    weeklySnapshot[i] = {
      rsiWeekly,
      rsiWeeklyPrev: rsiWPrev,
      macdWeekly:    macdW    != null ? parseFloat(macdW.toFixed(4))    : null,
      macdSignal:    signalW  != null ? parseFloat(signalW.toFixed(4))  : null,
      macdHist:      histW    != null ? parseFloat(histW.toFixed(4))    : null,
      macdPrevWeekly:  macdWPrev  != null ? parseFloat(macdWPrev.toFixed(4))   : null,
      macdPrevSignal:  signalWPrev != null ? parseFloat(signalWPrev.toFixed(4)) : null,
      macdPrevHist:    histWPrev   != null ? parseFloat(histWPrev.toFixed(4))  : null,
      drawdown52w:   weeklyDrawdown52[wi] != null ? parseFloat(weeklyDrawdown52[wi].toFixed(4)) : null,
      high52w:       Math.max(...weeklyHighs.slice(Math.max(0, wi - 51), wi + 1))
    };
  }

  return weeklySnapshot;
}

// ─── 5. Weinstein RS — snapshot diario ────────────────────────────────────────

/**
 * Calcula el RS de Weinstein (12-week rolling) para cada día del período
 * usando solo datos disponibles hasta ese día.
 *
 * Estrategia: construir el RS usando los closes semanales del ticker vs benchmark.
 * Sincronizar ambas series por fecha de inicio de semana.
 *
 * @param {Object} tickerDaily  — dailyArrays del ticker
 * @param {Object} benchmarkDaily — dailyArrays del benchmark (SPY)
 * @returns {Array} rsSnapshots[i] = { rs_value, rs_previous, rs_state }
 */
function buildRsSnapshots(tickerDaily, benchmarkDaily) {
  const n = tickerDaily.dates.length;

  if (!benchmarkDaily || benchmarkDaily.dates.length === 0) {
    return new Array(n).fill({ rs_value: null, rs_previous: null, rs_state: null });
  }

  // Función auxiliar: ISO year-week
  function getISOYearWeek(dateStr) {
    const d = new Date(dateStr + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  }

  // Construir mapa semana→close para cada serie
  function buildWeeklyCloseMap(dailyArrays) {
    const map = new Map(); // weekKey → { lastDayIdx, close }
    for (let i = 0; i < dailyArrays.dates.length; i++) {
      const wk = getISOYearWeek(dailyArrays.dates[i]);
      if (!map.has(wk) || i > map.get(wk).lastDayIdx) {
        map.set(wk, { lastDayIdx: i, close: dailyArrays.closes[i] });
      }
    }
    return map;
  }

  const tickerWeekMap = buildWeeklyCloseMap(tickerDaily);
  const benchWeekMap  = buildWeeklyCloseMap(benchmarkDaily);

  // Intersección de semanas comunes (ambas series tienen dato)
  const commonWeeks = [...tickerWeekMap.keys()]
    .filter(wk => benchWeekMap.has(wk))
    .sort();

  if (commonWeeks.length < 14) {
    return new Array(n).fill({ rs_value: null, rs_previous: null, rs_state: null });
  }

  // Para cada día i, encontrar cuántas semanas comunes han cerrado hasta ese día
  // y calcular el RS con las últimas 13 semanas disponibles (12 períodos de cambio).
  const tickerDates = tickerDaily.dates;

  function getRsAtWeekIdx(wi) {
    if (wi < 13) return { rs_value: null, rs_previous: null, rs_state: null };
    const wk = commonWeeks[wi];
    const wkPrev = commonWeeks[wi - 1];

    const tCurr   = tickerWeekMap.get(wk).close;
    const t12wAgo = tickerWeekMap.get(commonWeeks[wi - 12]).close;
    const bCurr   = benchWeekMap.get(wk).close;
    const b12wAgo = benchWeekMap.get(commonWeeks[wi - 12]).close;

    const tPrev    = tickerWeekMap.get(wkPrev).close;
    const t13wAgo  = tickerWeekMap.get(commonWeeks[wi - 13]).close;
    const bPrev    = benchWeekMap.get(wkPrev).close;
    const b13wAgo  = benchWeekMap.get(commonWeeks[wi - 13]).close;

    let rs_value = null, rs_previous = null, rs_state = null;

    if (tCurr && t12wAgo && bCurr && b12wAgo) {
      rs_value = parseFloat((((tCurr / t12wAgo) / (bCurr / b12wAgo) - 1) * 100).toFixed(2));
    }
    if (tPrev && t13wAgo && bPrev && b13wAgo) {
      rs_previous = parseFloat((((tPrev / t13wAgo) / (bPrev / b13wAgo) - 1) * 100).toFixed(2));
    }
    if (rs_value !== null && rs_previous !== null) {
      const isRising = rs_value > rs_previous;
      if (rs_value > 15) {
        rs_state = isRising ? 'Very Strong' : 'Strong';
      } else if (rs_value > 5) {
        rs_state = isRising ? 'Strong & Rising' : 'Strong but Weakening';
      } else if (rs_value > 0) {
        rs_state = 'Positive';
      } else if (rs_value > -5) {
        rs_state = isRising ? 'Weak but Recovering' : 'Weak';
      } else {
        rs_state = isRising ? 'Weak & Falling' : 'Very Weak';
      }
    }
    return { rs_value, rs_previous, rs_state };
  }

  // Construir snapshot por día: para el día i, usar la última semana común cerrada
  const rsSnapshots = new Array(n).fill(null).map(() => ({ rs_value: null, rs_previous: null, rs_state: null }));

  // Mapa de weekKey → índice en commonWeeks
  const weekToCommonIdx = new Map(commonWeeks.map((wk, idx) => [wk, idx]));

  for (let i = 0; i < n; i++) {
    const dayWk = getISOYearWeek(tickerDates[i]);
    // ¿Cuál es la última semana común cerrada en o antes de este día?
    // Una semana está cerrada si tickerWeekMap.get(wk).lastDayIdx <= i
    let latestCommonWi = -1;
    // Búsqueda binaria sobre commonWeeks
    let lo = 0, hi = commonWeeks.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const wk = commonWeeks[mid];
      const tkIdx = tickerWeekMap.get(wk).lastDayIdx;
      if (tkIdx <= i) {
        latestCommonWi = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    if (latestCommonWi >= 13) {
      rsSnapshots[i] = getRsAtWeekIdx(latestCommonWi);
    }
  }

  return rsSnapshots;
}

// ─── 6. Detect setup at index (sincrónico, misma lógica que calculateDailySetup) ─

/**
 * Detecta el setupState para el día i usando solo datos hasta i.
 * Lógica portada sincrónicamente desde calculateDailySetup() en marketSyncService.js.
 *
 * @param {number} i — índice del día actual
 * @param {Object} daily — dailyArrays
 * @param {Object} ind — indicatorArrays (EMAs, ATR, etc.)
 * @returns {string} setupState
 */
function detectSetupAtIndex(i, daily, ind) {
  const { closes, opens, highs, lows, volumes } = daily;
  const { ema21, sma30, ema200, atr14, volSma20, macdDaily, getDir, getDir200 } = ind;

  const L = i;
  if (L < 29) return { state: 'neutral' }; // insuficientes datos

  const currentPrice = closes[L];
  const currentEma21 = ema21[L];
  const currentSma30 = sma30[L];
  const currentEma200 = ema200[L];
  const currentAtr = atr14[L];

  if (!currentEma21 || !currentSma30) return { state: 'neutral' };

  // Slopes EMA21
  const prev5Ema21  = L >= 5  ? ema21[L - 5]  : ema21[0];
  const prev10Ema21 = L >= 10 ? ema21[L - 10] : ema21[0];
  const prev20Ema21 = L >= 20 ? ema21[L - 20] : ema21[0];
  const prev5Sma30  = L >= 5  ? sma30[L - 5]  : sma30[0];
  const prev10Sma30 = L >= 10 ? sma30[L - 10] : sma30[0];
  const prev20Sma30 = L >= 20 ? sma30[L - 20] : sma30[0];

  const ema21Slope5Pct  = currentEma21 && prev5Ema21  ? ((currentEma21 / prev5Ema21)  - 1) * 100 : 0;
  const ema21Slope10Pct = currentEma21 && prev10Ema21 ? ((currentEma21 / prev10Ema21) - 1) * 100 : 0;
  const ema21Slope20Pct = currentEma21 && prev20Ema21 ? ((currentEma21 / prev20Ema21) - 1) * 100 : 0;
  const sma30Slope5Pct  = currentSma30 && prev5Sma30  ? ((currentSma30 / prev5Sma30)  - 1) * 100 : 0;
  const sma30Slope10Pct = currentSma30 && prev10Sma30 ? ((currentSma30 / prev10Sma30) - 1) * 100 : 0;
  const sma30Slope20Pct = currentSma30 && prev20Sma30 ? ((currentSma30 / prev20Sma30) - 1) * 100 : 0;

  const ema21Slope5Dir  = getDir(ema21Slope5Pct);
  const ema21Slope10Dir = getDir(ema21Slope10Pct);
  const ema21Slope20Dir = getDir(ema21Slope20Pct);
  const sma30Slope5Dir  = getDir(sma30Slope5Pct);
  const sma30Slope10Dir = getDir(sma30Slope10Pct);
  const sma30Slope20Dir = getDir(sma30Slope20Pct);

  const ema21Rate5  = ema21Slope5Pct  / 5;
  const ema21Rate10 = ema21Slope10Pct / 10;
  const ema21Trend  = ema21Rate5 > ema21Rate10 ? 'ACCELERATING' : (ema21Rate5 < ema21Rate10 ? 'DECELERATING' : 'CONSTANT');

  const ema21AboveSma30Pct = (currentEma21 && currentSma30) ? ((currentEma21 - currentSma30) / currentSma30) * 100 : null;
  const ema21Distance = currentEma21 ? ((currentPrice - currentEma21) / currentEma21) * 100 : null;

  const isEma21AllUp   = ema21Slope5Dir === 'UP'   && ema21Slope10Dir === 'UP'   && ema21Slope20Dir === 'UP';
  const isSma30AllUp   = sma30Slope5Dir === 'UP'   && sma30Slope10Dir === 'UP'   && sma30Slope20Dir === 'UP';
  const isEma21AllDown = ema21Slope5Dir === 'DOWN'  && ema21Slope10Dir === 'DOWN'  && ema21Slope20Dir === 'DOWN';
  const isSma30AllDown = sma30Slope5Dir === 'DOWN'  && sma30Slope10Dir === 'DOWN'  && sma30Slope20Dir === 'DOWN';

  const isPriceAboveEma21 = currentPrice > currentEma21;
  const isPriceAboveSma30 = currentPrice > currentSma30;

  // Trend detection
  let isUptrend = false, isBearish = false;
  if (currentEma200 && currentEma21 && currentSma30) {
    if (currentEma21 > currentSma30 && currentSma30 > currentEma200) {
      if (isEma21AllUp && isSma30AllUp && ema21AboveSma30Pct >= MIN_SEPARATION_PCT) {
        isUptrend = true;
      }
    } else if (currentEma21 < currentSma30 && currentSma30 < currentEma200) {
      if (isEma21AllDown && isSma30AllDown && ((currentSma30 - currentEma200) / currentEma200) * 100 <= -MIN_SEPARATION_PCT) {
        isBearish = true;
      }
    }
  } else if (currentEma21 && currentSma30) {
    if (currentEma21 > currentSma30 && isEma21AllUp && isSma30AllUp && ema21AboveSma30Pct >= MIN_SEPARATION_PCT) {
      isUptrend = true;
    } else if (currentEma21 < currentSma30 && isEma21AllDown && isSma30AllDown) {
      isBearish = true;
    }
  }

  const separationTooSmall = ema21AboveSma30Pct !== null ? Math.abs(ema21AboveSma30Pct) < MIN_SEPARATION_PCT : false;
  const bothSlopesFlat = ema21Slope5Dir === 'FLAT' && sma30Slope5Dir === 'FLAT';
  const priceCloseToMAs = ema21Distance !== null ? Math.abs(ema21Distance) < 4.0 : true;
  const isLateral = !isUptrend && !isBearish
    && (separationTooSmall || bothSlopesFlat)
    && priceCloseToMAs
    && ema21Slope10Dir !== 'DOWN';

  // MACD daily for setup
  const currentHist = macdDaily.histLine[L];
  const prevHist    = L >= 1 ? macdDaily.histLine[L - 1] : null;
  const currentRsi  = ind.rsiDaily[L];
  const currentVolume   = volumes[L];
  const currentVolSma20 = volSma20[L];
  const currentRVol     = currentVolSma20 ? currentVolume / currentVolSma20 : null;
  const isAccumulationDay = L > 0 ? closes[L] > closes[L - 1] : true;

  // Uptrend tolerant (para pullback): permite pendiente 5d no-UP
  let isUptrendTolerant = false;
  if (currentEma21 && currentSma30) {
    const isEma21TolerantUp = ema21Slope10Dir === 'UP' && ema21Slope20Dir === 'UP';
    const isSma30TolerantUp = sma30Slope10Dir === 'UP' && sma30Slope20Dir === 'UP';
    const isStructureBullish = currentEma200 ? (currentEma21 > currentSma30 && currentSma30 > currentEma200) : (currentEma21 > currentSma30);
    if (isStructureBullish && isEma21TolerantUp && isSma30TolerantUp && ema21AboveSma30Pct >= MIN_SEPARATION_PCT) {
      isUptrendTolerant = true;
    }
  }

  // Pullback
  let pullbackConfirmed = false;
  if (L >= 15 && currentAtr && isUptrendTolerant) {
    let wasStrongAbove = false;
    for (let k = Math.max(0, L - 12); k <= L - 5; k++) {
      if (sma30[k] && closes[k] >= sma30[k] * 1.015) { wasStrongAbove = true; break; }
    }
    let corrected = false;
    for (let k = L - 5; k <= L; k++) {
      if (ema21[k] && sma30[k] && atr14[k]) {
        const distEma21 = Math.abs(closes[k] - ema21[k]);
        const distSma30 = Math.abs(closes[k] - sma30[k]);
        if (distEma21 <= 0.5 * atr14[k] || distSma30 <= 0.5 * atr14[k]) { corrected = true; break; }
      }
    }
    const distToEma21AtrNow = currentAtr ? Math.abs(currentPrice - currentEma21) / currentAtr : null;
    const stillNearEma21 = distToEma21AtrNow !== null && distToEma21AtrNow <= 1.2;
    const isPriceAboveBoth = isPriceAboveEma21 && isPriceAboveSma30;
    const isStrengthCandle = (closes[L] > opens[L]) || (closes[L] > closes[L - 1]);

    if (wasStrongAbove && corrected && isPriceAboveBoth && stillNearEma21 && isStrengthCandle) {
      pullbackConfirmed = true;
    }
  }

  // Reversals
  const macdDailyBullish = currentHist !== null && prevHist !== null && currentHist > prevHist;
  const isWeakContextForEarly = isBearish || (currentEma21 < currentSma30 && sma30Slope20Dir === 'DOWN');

  let reversalEarly = false, reversalConfirmed = false;
  if (isWeakContextForEarly && !pullbackConfirmed) {
    if (isPriceAboveEma21) {
      let improvementSignals = 0;
      if (currentRsi !== null && currentRsi > 45) improvementSignals++;
      if (macdDailyBullish) improvementSignals++;
      if (ema21Slope5Dir === 'UP') improvementSignals++;
      if (ema21Trend === 'ACCELERATING') improvementSignals++;
      if (improvementSignals >= 2) reversalEarly = true;
    }
    const isTrueWeakStructure = isBearish || (currentEma21 < currentSma30 && sma30Slope20Dir === 'DOWN');
    if (isTrueWeakStructure && isPriceAboveEma21 && isPriceAboveSma30 && ema21Slope5Dir === 'UP'
      && currentRsi !== null && currentRsi > 50 && macdDailyBullish) {
      reversalConfirmed = true;
    }
  }

  // Breakout (últimos 20 días)
  let breakoutConfirmed = false;
  let breakoutResistance = null;
  let breakoutLateral = false;
  if (L >= 21) {
    const max20 = Math.max(...closes.slice(Math.max(0, L - 20), L));
    const isNewHigh = currentPrice > max20;
    if (isNewHigh && currentRVol !== null && currentRVol >= 1.2 && isAccumulationDay && isPriceAboveEma21 && isPriceAboveSma30) {
      const max5 = Math.max(...closes.slice(Math.max(0, L - 5), L));
      const wasConsolidating = max5 < max20 || isLateral;
      if (wasConsolidating) {
        breakoutConfirmed = true;
        breakoutResistance = max20;
        breakoutLateral = isLateral;
      }
    }
  }

  // EMA200 slope dir
  let ema200SlopeDir = null;
  if (currentEma200) {
    const prev20Ema200 = L >= 20 ? ema200[L - 20] : null;
    const prev40Ema200 = L >= 40 ? ema200[L - 40] : null;
    if (closes.length >= 240 && prev20Ema200 && prev40Ema200) {
      const sl20 = ((currentEma200 / prev20Ema200) - 1) * 100;
      const sl40 = ((currentEma200 / prev40Ema200) - 1) * 100;
      const d20 = getDir200(sl20), d40 = getDir200(sl40);
      if (d20 === 'DOWN' && d40 === 'DOWN') ema200SlopeDir = 'DOWN';
      else if (d20 === 'UP' && d40 === 'UP') ema200SlopeDir = 'UP';
      else ema200SlopeDir = 'FLAT';
    }
  }

  // Determine state (misma cascada que calculateDailySetup)
  let state = 'neutral';
  if (breakoutConfirmed) {
    state = 'bullish_breakout';
  } else if (pullbackConfirmed) {
    state = 'bullish_pullback';
  } else if (reversalConfirmed) {
    state = 'bullish_reversal_confirmed';
  } else if (reversalEarly) {
    state = 'early_bullish_reversal';
  } else if (isUptrend) {
    if (!isPriceAboveEma21 && !isPriceAboveSma30) {
      state = 'neutral';
    } else {
      const distToEma21Atr = currentAtr ? Math.abs(currentPrice - currentEma21) / currentAtr : null;
      const isExtended = ema21Distance !== null && ema21Distance > 8
        && distToEma21Atr !== null && distToEma21Atr > 2.5;
      state = isExtended ? 'strong_uptrend_extended' : 'strong_uptrend';
    }
  } else if (isBearish) {
    state = (isPriceAboveEma21 && isPriceAboveSma30) ? 'neutral' : 'bearish_trend';
  } else if (isLateral) {
    state = 'lateral_trend';
  } else {
    if (currentEma200 && currentEma21 && currentSma30) {
      state = currentEma21 < currentSma30 ? 'bearish_transition'
            : currentEma21 > currentSma30 ? 'bullish_transition'
            : 'messy_chop';
    } else {
      state = 'messy_chop';
    }
  }

  return {
    state,
    breakoutResistance,
    breakoutLateral,
    ema21Distance,
    ema21AboveSma30Pct,
    ema200SlopeDir,
    ema21Slope5Dir,
    ema21Slope10Dir,
    ema21Slope20Dir,
    ema21Slope5Pct,
    ema21Trend,
    sma30Slope5Dir,
    sma30Slope10Dir,
    sma30Slope20Dir,
    distToEma21Atr: currentAtr && currentEma21 ? Math.abs(currentPrice - currentEma21) / currentAtr : null,
    priceAboveEma21: isPriceAboveEma21,
    priceAboveSma30: isPriceAboveSma30,
    trend: isUptrend ? 'bullish' : (isBearish ? 'bearish' : (isLateral ? 'lateral' : 'neutral'))
  };
}

// ─── 7. Construir el objeto opData compatible con calculateOpScore ─────────────

/**
 * Construye el objeto "data" que recibe calculateOpScore, idéntico en estructura
 * al "opData" que construye marketSyncService.js (líneas 622-664).
 *
 * @param {number} i — índice del día
 * @param {Object} daily — dailyArrays
 * @param {Object} ind — indicatorArrays
 * @param {Object} setup — resultado de detectSetupAtIndex
 * @param {Object} weekly — weeklySnapshot[i]
 * @param {Object} rs — rsSnapshots[i]
 * @returns {Object} opData compatible con calculateOpScore
 */
function buildOpData(i, daily, ind, setup, weekly, rs) {
  const { closes, opens, highs, lows, volumes } = daily;
  const { ema21, sma30, ema200, atr14, rsiDaily, volSma20, macdDaily } = ind;
  const L = i;

  const currentPrice = closes[L];
  const currentEma21 = ema21[L];
  const currentSma30 = sma30[L];
  const currentEma200 = ema200[L];
  const currentRsi = rsiDaily[L];
  const currentAtr = atr14[L];

  // MACD diario
  const macdObj = {
    current:    macdDaily.macdLine[L],
    signal:     macdDaily.signalLine[L],
    hist:       macdDaily.histLine[L],
    prevMacd:   L >= 1 ? macdDaily.macdLine[L - 1] : null,
    prevSignal: L >= 1 ? macdDaily.signalLine[L - 1] : null,
    prevHist:   L >= 1 ? macdDaily.histLine[L - 1] : null,
  };

  // Volumen
  const currentVolume = volumes[L];
  const currentVolSma20 = volSma20[L];
  const currentRVol = currentVolSma20 ? parseFloat((currentVolume / currentVolSma20).toFixed(2)) : null;

  // Recent candles (últimas 10 velas) — idéntico a calculateDailySetup
  const recentCandles = [];
  const startIdx = Math.max(0, L - 9);
  for (let k = startIdx; k <= L; k++) {
    const isRed = closes[k] < opens[k];
    const rvol = volSma20[k] ? parseFloat((volumes[k] / volSma20[k]).toFixed(2)) : null;
    recentCandles.push({
      open:    opens[k],
      high:    highs[k],
      low:     lows[k],
      close:   closes[k],
      volume:  volumes[k],
      rvol,
      isRed,
      isGreen: !isRed
    });
  }

  // RS Weinstein — mapeado al formato que usa calculateOpScore
  const rsStateMapped = (() => {
    const s = rs ? rs.rs_state : null;
    if (!s) return 'Neutral';
    // El mapeador del opScoreService convierte los estados del backtesting al formato interno
    if (s === 'Strong & Rising')      return 'Very Strong';
    if (s === 'Strong but Weakening') return 'Strong but Weakening';
    if (s === 'Weak but Recovering')  return 'Weak but Recovering';
    if (s === 'Weak & Falling')       return 'Weak & Falling';
    return 'Neutral';
  })();

  // Días desde trigger (decay) — no disponible en tiempo real sin estado previo.
  // En el backtester lo mantenemos en 0 para no introducir look-ahead.
  // El decay se acumulará en futuras versiones si se rastrea el trigger entre días.
  const daysSinceTrigger = 0;

  return {
    // Precio
    price:         currentPrice,

    // Medias
    ema21:         currentEma21,
    sma30:         currentSma30,
    ema200:        currentEma200,

    // RSI diario y semanal
    rsiDaily:      currentRsi,
    rsiWeekly:     weekly ? weekly.rsiWeekly : null,

    // MACD diario
    macd:          macdObj,

    // MACD semanal (campos escalares como los usa opScoreService en strong_uptrend)
    macdWeekly:    weekly ? weekly.macdWeekly    : null,
    macdSignal:    weekly ? weekly.macdSignal     : null,
    macdHist:      weekly ? weekly.macdHist       : null,
    macdPrevHist:  weekly ? weekly.macdPrevHist   : null,
    macdPrevWeekly: weekly ? weekly.macdPrevWeekly : null,
    macdPrevSignal: weekly ? weekly.macdPrevSignal : null,

    // Drawdown 52 semanas
    drawdown52w:   weekly ? weekly.drawdown52w : null,

    // Distancia EMA21 y ATR
    ema21Distance:    setup.ema21Distance,
    ema21DistanceAtr: setup.distToEma21Atr,
    ema21AboveSma30Pct: setup.ema21AboveSma30Pct,

    // ATR14
    atr14:         currentAtr,

    // Relative Strength Weinstein
    rsState:       rsStateMapped,
    rsValue:       rs ? rs.rs_value : null,
    rsPrevious:    rs ? rs.rs_previous : null,

    // EMA200 slope
    ema200SlopeDir: setup.ema200SlopeDir,

    // EMA21 slope para early_bullish_reversal
    ema21SlopeDir:   setup.ema21Slope5Dir || null,
    ema21SlopeTrend: setup.ema21Trend || null,
    ema21SlopePct:   setup.ema21Slope5Pct != null ? parseFloat(setup.ema21Slope5Pct.toFixed(2)) : null,

    // Trend del setup
    trend:         setup.trend,

    // Breakout data
    breakoutResistance: setup.breakoutResistance || null,
    breakoutLateral:    setup.breakoutLateral || false,

    // Candles
    recentCandles,

    // Earnings: no disponibles en backtesting histórico → null (sin penalización)
    daysToEarnings: null,

    // Sector y régimen: no disponibles históricamente → null (sin modificación)
    sectorTrend:   null,
    marketRegime:  null,

    // Trigger decay
    daysSinceTrigger,

    // invalidBreakStreak: no rastreado en Fase 1 → 0
    invalidBreakStreak: 0,

    // baseLengthDays (breakout)
    baseLengthDays: null,

    // currentRVol para setups que lo leen directamente (bearish, late_bullish)
    currentRVol,
  };
}

// ─── 8. Signal Engine ─────────────────────────────────────────────────────────

/**
 * Convierte el OP Score en una señal de trading.
 *
 * La estrategia representa "OP Score + reglas reales de trading":
 * - BUY: score >= entryThreshold y no hay posición abierta
 * - SELL: score < exitThreshold (deterioro del Score)
 * - HOLD: en cualquier otro caso con posición abierta
 * - NONE: sin posición y sin señal de entrada
 *
 * Filtros adicionales (solo los que existen actualmente en la estrategia):
 * - No entrar en setups puramente bajistas (bearish_trend, bearish_transition)
 * - No entrar en messy_chop o neutral con Score bajo
 *
 * @param {number} score
 * @param {string} setupState
 * @param {boolean} hasPosition
 * @param {Object} strategyConfig
 * @returns {'BUY' | 'SELL' | 'HOLD' | 'NONE'}
 */
function signalEngine(score, setupState, hasPosition, strategyConfig, dailyData) {
  const { entryScoreThreshold, allowedSetups, exitStrategy } = strategyConfig;

  const isBearishSetup = ['bearish_trend', 'bearish_transition', 'neutral', 'messy_chop'].includes(setupState);

  if (hasPosition) {
    // Condición de salida estructural
    if (exitStrategy === 'loss_ema21') {
      if (dailyData && dailyData.ema21 && dailyData.price < dailyData.ema21) {
        return { type: 'SELL', reasons: ['Price closed below EMA 21', `Setup: ${setupState}`] };
      }
    } else if (exitStrategy === 'loss_sma30') {
      if (dailyData && dailyData.sma30 && dailyData.price < dailyData.sma30) {
        return { type: 'SELL', reasons: ['Price closed below SMA 30', `Setup: ${setupState}`] };
      }
    } else {
      // Default: setup_deterioration
      if (isBearishSetup) {
        return { type: 'SELL', reasons: ['Setup deteriorated to bearish/neutral state', `Setup: ${setupState}`] };
      }
    }
    return { type: 'HOLD' };
  } else {
    // Condición de entrada
    if (score >= entryScoreThreshold && !isBearishSetup) {
      // Si allowedSetups está definido, filtrar por él
      if (allowedSetups && allowedSetups.length > 0 && !allowedSetups.includes(setupState)) {
        return { type: 'NONE' };
      }
      return { type: 'BUY', reasons: [`OP Score ${score} crossed entry threshold ${entryScoreThreshold}`, `Setup: ${setupState}`] };
    }
    return { type: 'NONE' };
  }
}

// ─── 9. Portfolio Engine ──────────────────────────────────────────────────────

class PortfolioEngine {
  constructor(initialCapital, positionSizePct, commission, slippage) {
    this.initialCapital  = initialCapital;
    this.positionSizePct = positionSizePct; // 0–1
    this.commission      = commission;       // fracción (ej. 0.001 = 0.1%)
    this.slippage        = slippage;         // fracción (ej. 0.001 = 0.1%)

    this.cash      = initialCapital;
    this.shares    = 0;
    this.entryPrice  = null;
    this.entryDate   = null;
    this.entryScore  = null;
    this.entryReasons = [];
    this.peakPrice   = null; // para trailing stop futuro

    this.trades      = [];
    this.openTrade   = null;
  }

  get hasPosition() {
    return this.shares > 0;
  }

  get equity() {
    return this.cash + (this.shares * this._lastPrice || 0);
  }

  /**
   * Ejecuta una compra al precio dado (Open de T+1).
   */
  buy(date, price, score, reasons) {
    const execPrice = price * (1 + this.slippage);
    const capitalToUse = this.cash * this.positionSizePct;
    const commission = capitalToUse * this.commission;
    const capitalAfterCommission = capitalToUse - commission;
    const shares = Math.floor(capitalAfterCommission / execPrice);

    if (shares <= 0) return;

    const totalCost = shares * execPrice + commission;
    this.cash    -= totalCost;
    this.shares   = shares;
    this.entryPrice = execPrice;
    this.entryDate  = date;
    this.entryScore = score;
    this.entryReasons = reasons;
    this.peakPrice  = execPrice;
    this._lastPrice = price;

    this.openTrade = {
      entryDate:     date,
      entryPrice:    parseFloat(execPrice.toFixed(4)),
      shares,
      entryScore:    score,
      entryReasons:  reasons,
    };
  }

  /**
   * Ejecuta una venta al precio dado (Open de T+1 o Stop en mismo día).
   * @param {string} exitType — 'SCORE_DETERIORATION' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'END_OF_PERIOD'
   */
  sell(date, price, score, reasons, exitType = 'SCORE_DETERIORATION') {
    if (!this.hasPosition) return null;

    const execPrice = price * (1 - this.slippage);
    const commission = this.shares * execPrice * this.commission;
    const proceeds = this.shares * execPrice - commission;

    const pnl = proceeds - (this.shares * this.entryPrice);
    const returnPct = (execPrice - this.entryPrice) / this.entryPrice * 100;
    const holdingDays = Math.round((new Date(date) - new Date(this.entryDate)) / 86400000);

    const trade = {
      entryDate:    this.openTrade.entryDate,
      exitDate:     date,
      entryPrice:   this.openTrade.entryPrice,
      exitPrice:    parseFloat(execPrice.toFixed(4)),
      shares:       this.shares,
      pnl:          parseFloat(pnl.toFixed(2)),
      returnPct:    parseFloat(returnPct.toFixed(2)),
      holdingDays,
      entryScore:   this.openTrade.entryScore,
      exitScore:    score,
      entryReasons: this.openTrade.entryReasons,
      exitReasons:  reasons,
      exitType,
    };

    this.trades.push(trade);
    this.cash   += proceeds;
    this.shares  = 0;
    this.entryPrice = null;
    this.entryDate  = null;
    this.peakPrice  = null;
    this.openTrade  = null;

    return trade;
  }

  /**
   * Comprueba stops (SL / TP) usando datos OHLC del día.
   * Política: si ambos se activan en la misma vela, SL tiene prioridad (caso conservador).
   */
  checkStops(date, high, low, open, score, reasons, strategyConfig) {
    if (!this.hasPosition || !this.entryPrice) return null;

    const { stopLossPct, takeProfitPct } = strategyConfig;
    let stopTriggered = false;
    let exitPrice = null;
    let exitType = null;

    if (stopLossPct > 0) {
      const stopLevel = this.entryPrice * (1 - stopLossPct);
      if (low <= stopLevel) {
        stopTriggered = true;
        exitPrice = Math.max(stopLevel, low); // worst case dentro de la vela
        exitType = 'STOP_LOSS';
      }
    }

    if (!stopTriggered && takeProfitPct > 0) {
      const tpLevel = this.entryPrice * (1 + takeProfitPct);
      if (high >= tpLevel) {
        stopTriggered = true;
        exitPrice = Math.min(tpLevel, high);
        exitType = 'TAKE_PROFIT';
      }
    }

    if (stopTriggered && exitPrice) {
      return this.sell(date, exitPrice, score, reasons, exitType);
    }
    return null;
  }

  updatePeakPrice(price) {
    if (this.hasPosition && (this.peakPrice === null || price > this.peakPrice)) {
      this.peakPrice = price;
    }
    this._lastPrice = price;
  }

  getEquityAt(price) {
    return this.cash + this.shares * price;
  }
}

// ─── 10. Metrics Engine ───────────────────────────────────────────────────────

function calculateMetrics(trades, equityCurve, initialCapital, startDate, endDate, buyAndHold) {
  if (equityCurve.length === 0) {
    return {
      initialCapital,
      finalCapital: initialCapital,
      netProfit: 0,
      returnPct: 0,
      cagr: 0,
      investedCagr: 0,
      maxDrawdown: 0,
      maxDrawdownPct: 0,
      timeInMarketPct: 0,
      volatility: null,
      sharpeRatio: null,
      numTrades: 0,
      numWinners: 0,
      numLosers: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      profitFactor: 0,
      expectancy: 0,
      avgHoldingDays: 0,
      buyAndHold,
    };
  }

  const finalCapital = equityCurve[equityCurve.length - 1].equity;
  const netProfit = finalCapital - initialCapital;
  const returnPct = (netProfit / initialCapital) * 100;

  // CAGR
  const years = (new Date(endDate) - new Date(startDate)) / (365.25 * 24 * 3600 * 1000);
  const cagr = years > 0 ? (Math.pow(finalCapital / initialCapital, 1 / years) - 1) * 100 : 0;

  // Drawdown
  let maxDrawdown = 0, maxDrawdownPct = 0, peak = initialCapital;
  for (const point of equityCurve) {
    if (point.equity > peak) peak = point.equity;
    const dd = peak - point.equity;
    const ddPct = (dd / peak) * 100;
    if (dd > maxDrawdown) { maxDrawdown = dd; maxDrawdownPct = ddPct; }
  }

  // Volatilidad diaria (std dev de retornos diarios)
  let volatility = null, sharpeRatio = null;
  if (equityCurve.length >= 2) {
    const dailyReturns = [];
    for (let i = 1; i < equityCurve.length; i++) {
      const prev = equityCurve[i - 1].equity;
      const curr = equityCurve[i].equity;
      if (prev > 0) dailyReturns.push((curr - prev) / prev);
    }
    if (dailyReturns.length > 1) {
      const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
      const variance = dailyReturns.reduce((a, b) => a + (b - mean) ** 2, 0) / dailyReturns.length;
      const dailyStdDev = Math.sqrt(variance);
      volatility = parseFloat((dailyStdDev * Math.sqrt(252) * 100).toFixed(2)); // anualizada
      sharpeRatio = dailyStdDev > 0 ? parseFloat(((mean / dailyStdDev) * Math.sqrt(252)).toFixed(2)) : null;
    }
  }

  // Trade stats
  const winners = trades.filter(t => t.pnl > 0);
  const losers  = trades.filter(t => t.pnl <= 0);
  const numTrades = trades.length;
  const numWinners = winners.length;
  const numLosers  = losers.length;
  const winRate = numTrades > 0 ? parseFloat(((numWinners / numTrades) * 100).toFixed(1)) : 0;
  const avgWin  = numWinners > 0 ? parseFloat((winners.reduce((a, t) => a + t.pnl, 0) / numWinners).toFixed(2)) : 0;
  const avgLoss = numLosers  > 0 ? parseFloat((losers.reduce((a, t) => a + t.pnl, 0)  / numLosers).toFixed(2))  : 0;
  const largestWin  = numWinners > 0 ? parseFloat(Math.max(...winners.map(t => t.pnl)).toFixed(2)) : 0;
  const largestLoss = numLosers  > 0 ? parseFloat(Math.min(...losers.map(t => t.pnl)).toFixed(2))  : 0;

  const totalGain = winners.reduce((a, t) => a + t.pnl, 0);
  const totalLoss = Math.abs(losers.reduce((a, t) => a + t.pnl, 0));
  const profitFactor = totalLoss > 0 ? parseFloat((totalGain / totalLoss).toFixed(2)) : (totalGain > 0 ? Infinity : 0);

  const expectancy = numTrades > 0
    ? parseFloat(((winRate / 100 * avgWin) + ((1 - winRate / 100) * avgLoss)).toFixed(2))
    : 0;

  const avgHoldingDays = numTrades > 0
    ? parseFloat((trades.reduce((a, t) => a + t.holdingDays, 0) / numTrades).toFixed(1))
    : 0;

  const totalHoldingDays = trades.reduce((a, t) => a + t.holdingDays, 0);
  const totalCalendarDays = (new Date(endDate) - new Date(startDate)) / (1000 * 3600 * 24);
  const timeInMarketPct = totalCalendarDays > 0 ? parseFloat(((totalHoldingDays / totalCalendarDays) * 100).toFixed(2)) : 0;

  const investedYears = years * (timeInMarketPct / 100);
  const investedCagr = investedYears > 0
    ? (Math.pow(finalCapital / initialCapital, 1 / investedYears) - 1) * 100
    : 0;

  return {
    initialCapital: parseFloat(initialCapital.toFixed(2)),
    finalCapital:   parseFloat(finalCapital.toFixed(2)),
    netProfit:      parseFloat(netProfit.toFixed(2)),
    returnPct:      parseFloat(returnPct.toFixed(2)),
    cagr:           parseFloat(cagr.toFixed(2)),
    investedCagr:   parseFloat(investedCagr.toFixed(2)),
    maxDrawdown:    parseFloat(maxDrawdown.toFixed(2)),
    maxDrawdownPct: parseFloat(maxDrawdownPct.toFixed(2)),
    timeInMarketPct,
    volatility,
    sharpeRatio,
    numTrades,
    numWinners,
    numLosers,
    winRate,
    avgWin,
    avgLoss,
    largestWin,
    largestLoss,
    profitFactor,
    expectancy,
    avgHoldingDays,
    buyAndHold,
  };
}

// ─── 11. Buy & Hold benchmark ─────────────────────────────────────────────────

function calculateBuyAndHold(dailyArrays, startIdx, endIdx, initialCapital) {
  const { adjCloses, dates } = dailyArrays;
  // Nota: usamos adjClose para B&H (retornos históricos correctos con splits/dividendos)
  if (startIdx >= endIdx || startIdx < 0 || endIdx > adjCloses.length) {
    return { returnPct: 0, cagr: 0, maxDrawdownPct: 0, finalCapital: initialCapital };
  }

  const entryAdj = adjCloses[startIdx];
  if (!entryAdj || entryAdj <= 0) return { returnPct: 0, cagr: 0, maxDrawdownPct: 0, finalCapital: initialCapital };

  const shares = initialCapital / entryAdj;
  const equityCurve = [];
  let peak = initialCapital;
  let maxDdPct = 0;

  for (let i = startIdx; i <= endIdx; i++) {
    const adj = adjCloses[i];
    if (!adj) continue;
    const equity = shares * adj;
    if (equity > peak) peak = equity;
    const ddPct = ((peak - equity) / peak) * 100;
    if (ddPct > maxDdPct) maxDdPct = ddPct;
    equityCurve.push({ date: dates[i], equity: parseFloat(equity.toFixed(2)) });
  }

  const finalAdj = adjCloses[endIdx] || entryAdj;
  const finalCapital = shares * finalAdj;
  const returnPct = ((finalAdj - entryAdj) / entryAdj) * 100;
  const years = (new Date(dates[endIdx]) - new Date(dates[startIdx])) / (365.25 * 24 * 3600 * 1000);
  const cagr = years > 0 ? (Math.pow(finalCapital / initialCapital, 1 / years) - 1) * 100 : 0;

  return {
    returnPct:       parseFloat(returnPct.toFixed(2)),
    cagr:            parseFloat(cagr.toFixed(2)),
    maxDrawdownPct:  parseFloat(maxDdPct.toFixed(2)),
    finalCapital:    parseFloat(finalCapital.toFixed(2)),
    equityCurve,
  };
}

// ─── 12. Motor principal ──────────────────────────────────────────────────────

/**
 * Ejecuta el backtest completo On-Demand.
 *
 * @param {Object} config
 * @param {string}  config.ticker
 * @param {string}  config.startDate — ISO date 'YYYY-MM-DD'
 * @param {string}  config.endDate   — ISO date 'YYYY-MM-DD'
 * @param {number}  config.initialCapital
 * @param {number}  config.positionSizePct — 0–1 (default 1.0 = 100%)
 * @param {number}  config.commission      — fracción (default 0)
 * @param {number}  config.slippage        — fracción (default 0)
 * @param {number}  config.entryScoreThreshold — default 55
 * @param {number}  config.exitScoreThreshold  — default 40
 * @param {number}  config.stopLossPct         — 0–1 (default 0 = sin SL)
 * @param {number}  config.takeProfitPct       — 0–1 (default 0 = sin TP)
 * @param {string}  config.benchmarkSymbol     — default 'SPY'
 * @param {boolean} config.debug              — incluir indicatorHistory completo
 * @returns {Object} resultado completo del backtest
 */
async function runBacktest(config) {
  const {
    ticker,
    startDate,
    endDate,
    initialCapital = 10000,
    positionSizePct = 1.0,
    commission = 0,
    slippage = 0,
    entryScoreThreshold = 55,
    exitStrategy = 'setup_deterioration',
    stopLossPct = 0,
    takeProfitPct = 0,
    benchmarkSymbol = 'SPY',
    debug = false,
    allowedSetups = [],
  } = config;

  const strategyConfig = {
    entryScoreThreshold,
    exitStrategy,
    stopLossPct,
    takeProfitPct,
    allowedSetups,
  };

  const startDt = new Date(startDate + 'T00:00:00Z');
  const endDt   = new Date(endDate   + 'T00:00:00Z');

  // 1. Descargar datos
  const { tickerQuotes, benchmarkQuotes, companyName } = await fetchHistoricalData(
    ticker, startDt, endDt, benchmarkSymbol
  );

  // 2. Normalizar
  const tickerDaily    = buildDailyArrays(tickerQuotes);
  const benchmarkDaily = benchmarkQuotes.length > 0 ? buildDailyArrays(benchmarkQuotes) : null;

  if (tickerDaily.dates.length < 30) {
    throw new Error(`Insufficient data for ${ticker}: only ${tickerDaily.dates.length} trading days`);
  }

  // 3. Calcular arrays de indicadores (UNA sola vez)
  const ind = buildIndicatorArrays(tickerDaily);

  // 4. Construir snapshots semanales y de RS (sin look-ahead)
  const weeklySnapshots = buildWeeklySnapshots(tickerDaily);
  const rsSnapshots     = buildRsSnapshots(tickerDaily, benchmarkDaily);

  // 5. Encontrar índices del período del backtest (post warm-up)
  const dates = tickerDaily.dates;
  let startIdx = -1, endIdx = -1;
  for (let i = 0; i < dates.length; i++) {
    if (dates[i] >= startDate && startIdx === -1) startIdx = i;
    if (dates[i] <= endDate) endIdx = i;
  }

  if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) {
    throw new Error(`No trading days found for ${ticker} in period ${startDate} to ${endDate}`);
  }

  // 6. Portfolio
  const portfolio = new PortfolioEngine(initialCapital, positionSizePct, commission, slippage);

  const equityCurve  = [];
  const scoreHistory = [];
  const signals      = [];
  const indicatorHistory = debug ? [] : null;

  let pendingSignal = null; // { type: 'BUY'|'SELL', score, reasons, setup } — ejecutar el próximo día

  for (let i = startIdx; i <= endIdx; i++) {
    const date  = dates[i];
    const close = tickerDaily.closes[i];
    const open  = tickerDaily.opens[i];
    const high  = tickerDaily.highs[i];
    const low   = tickerDaily.lows[i];

    portfolio.updatePeakPrice(close);

    // a. Comprobar stops con los datos OHLC del día actual
    if (portfolio.hasPosition) {
      const stopResult = portfolio.checkStops(date, high, low, open, 0, ['Stop triggered'], strategyConfig);
      if (stopResult) {
        signals.push({ type: 'SELL', date, price: stopResult.exitPrice, exitType: stopResult.exitType });
      }
    }

    // b. Ejecutar señal pendiente del día anterior (Open de hoy)
    if (pendingSignal && !portfolio.hasPosition && pendingSignal.type === 'BUY') {
      portfolio.buy(date, open, pendingSignal.score, pendingSignal.reasons);
      signals.push({ type: 'BUY', date, price: open, score: pendingSignal.score, setupState: pendingSignal.setupState });
    } else if (pendingSignal && portfolio.hasPosition && pendingSignal.type === 'SELL') {
      const trade = portfolio.sell(date, open, pendingSignal.score, pendingSignal.reasons, 'SCORE_DETERIORATION');
      if (trade) {
        signals.push({ type: 'SELL', date, price: open, score: pendingSignal.score });
      }
    }
    pendingSignal = null;

    // c. Calcular indicadores, setup y OP Score al cierre del día
    const setup   = detectSetupAtIndex(i, tickerDaily, ind);
    const weekly  = weeklySnapshots[i];
    const rs      = rsSnapshots[i];
    const opData  = buildOpData(i, tickerDaily, ind, setup, weekly, rs);
    const opResult = calculateOpScore(setup.state, opData);
    const score    = opResult.valid ? opResult.score : 0;

    // d. Signal Engine
    const signalResult = signalEngine(score, setup.state, portfolio.hasPosition, strategyConfig, { price: close, ema21: opData.ema21, sma30: opData.sma30 });
    const signalType = signalResult.type;

    const scoreEntry = {
      date,
      score,
      rawScore:  opResult.rawScore,
      setupState: setup.state,
      valid:     opResult.valid,
    };
    scoreHistory.push(scoreEntry);

    if (debug && indicatorHistory !== null) {
      indicatorHistory.push({
        date,
        indicators: {
          close,
          ema21:          opData.ema21,
          sma30:          opData.sma30,
          sma50:          tickerDaily.closes[i] ? ind.sma50?.[i] ?? null : null,
          ema200:         opData.ema200,
          rsiDaily:       opData.rsiDaily,
          rsiWeekly:      opData.rsiWeekly,
          macdLine:       opData.macd?.current,
          macdSignalLine: opData.macd?.signal,
          macdHist:       opData.macd?.hist,
          macdWeekly:     opData.macdWeekly,
          macdSignalWeekly: opData.macdSignal,
          macdHistWeekly:   opData.macdHist,
          atr14:          opData.atr14,
          relativeVolume: opData.currentRVol,
          drawdown52w:    opData.drawdown52w,
          ema21Distance:  opData.ema21Distance,
          rsValue:        opData.rsValue,
          rsState:        opData.rsState,
          ema21SlopeDir:  opData.ema21SlopeDir,
          ema200SlopeDir: opData.ema200SlopeDir,
          trend:          opData.trend,
        },
        scoreComponents: opResult.conclusions,
        opScore: score,
        setupState: setup.state,
      });
    }

    // e. Generar señal para el próximo día (Open de T+1)
    if (signalType === 'BUY') {
      pendingSignal = { type: 'BUY', score, reasons: signalResult.reasons, setupState: setup.state };
    } else if (signalType === 'SELL') {
      pendingSignal = { type: 'SELL', score, reasons: signalResult.reasons };
    }

    // f. Equity al cierre
    const equity = portfolio.getEquityAt(close);
    equityCurve.push({ date, equity: parseFloat(equity.toFixed(2)), score });
  }

  // Cerrar posición abierta al final del período (al Close del último día)
  if (portfolio.hasPosition) {
    const lastClose = tickerDaily.closes[endIdx];
    const lastDate  = dates[endIdx];
    const lastScore = scoreHistory.length > 0 ? scoreHistory[scoreHistory.length - 1].score : 0;
    portfolio.sell(lastDate, lastClose, lastScore, ['End of backtest period'], 'END_OF_PERIOD');
    signals.push({ type: 'SELL', date: lastDate, price: lastClose, score: lastScore, exitType: 'END_OF_PERIOD' });
  }

  // 7. Buy & Hold
  const buyAndHold = calculateBuyAndHold(tickerDaily, startIdx, endIdx, initialCapital);

  // 8. Métricas
  const summary = calculateMetrics(
    portfolio.trades, equityCurve, initialCapital, startDate, endDate, {
      returnPct:      buyAndHold.returnPct,
      cagr:           buyAndHold.cagr,
      maxDrawdownPct: buyAndHold.maxDrawdownPct,
      finalCapital:   buyAndHold.finalCapital,
    }
  );

  return {
    ticker,
    companyName,
    benchmarkSymbol,
    period: { startDate, endDate },
    config: {
      initialCapital,
      positionSizePct,
      commission,
      slippage,
      entryScoreThreshold,
      exitStrategy,
      stopLossPct,
      takeProfitPct,
    },
    summary,
    equityCurve,
    buyAndHoldCurve: buyAndHold.equityCurve,
    trades: portfolio.trades,
    signals,
    scoreHistory,
    indicatorHistory, // null si debug=false
  };
}

module.exports = { runBacktest };
