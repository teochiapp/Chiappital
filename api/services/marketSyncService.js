const { getPool } = require('../database/db');
const logger = require('../utils/logger');
require('dotenv').config();

let isSyncing = false;
let finnhubRateLimited = false;
let finnhubRateLimitResetTime = 0;
let yahooCooldownUntil = 0;

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

// Finnhub Rate Limiter Configuration
const FINNHUB_MAX_CONCURRENT_REQUESTS = process.env.FINNHUB_MAX_CONCURRENT_REQUESTS ? parseInt(process.env.FINNHUB_MAX_CONCURRENT_REQUESTS) : 5;
const FINNHUB_MAX_REQUESTS_PER_WINDOW = process.env.FINNHUB_MAX_REQUESTS_PER_WINDOW ? parseInt(process.env.FINNHUB_MAX_REQUESTS_PER_WINDOW) : 60;
const FINNHUB_RATE_WINDOW_MS = process.env.FINNHUB_RATE_WINDOW_MS ? parseInt(process.env.FINNHUB_RATE_WINDOW_MS) : 60000;

let finnhubWindowStart = 0;
let finnhubWindowRequests = 0;

// Cache para EMA 21 (evitar recalcular innecesariamente en memoria durante la misma corrida si Yahoo falla)
const emaMemoryCache = new Map();

async function runSync(reason = 'manual') {
  if (isSyncing) {
    logger.debug('MarketSync', `Sync skipped: previous sync still running (Triggered by: ${reason})`);
    return;
  }

  isSyncing = true;
  const startTime = performance.now();

  // Timing
  let timeFinnhub = 0;
  let timeYahoo = 0;
  let timeEma = 0;
  let timeDb = 0;

  let finnhubCount = 0;
  let finnhubSuccess = 0;
  let finnhubFailed = 0;
  let yahooCount = 0; // Cantidad de SÍMBOLOS enviados a Yahoo
  let yahooHttpRequests = 0; // Cantidad de LLAMADAS HTTP a Yahoo
  let yahooSuccess = 0;
  let yahooFailed = 0;
  let emaSuccess = 0;
  let emaFailed = 0;

  try {
    // Abort early if both are rate limited
    if (finnhubRateLimited && Date.now() < finnhubRateLimitResetTime && Date.now() < yahooCooldownUntil) {
      logger.warn('MarketSync', 'Both Finnhub and Yahoo are on cooldown. Skipping sync cycle.');
      isSyncing = false;
      return;
    }

    const db = getPool();

    // 1. Obtener símbolos a actualizar
    const [rows] = await db.query(`
      SELECT 
        ts.symbol, 
        ts.priority, 
        ms.updated_at,
        ms.ema_updated_at,
        ms.rsi_updated_at,
        ms.macd_weekly,
        ms.drawdown_52w,
        ms.rs_updated_at,
        ms.rs_value,
        ms.setup_state,
        ts.index_symbol
      FROM tracked_symbols ts
      LEFT JOIN market_snapshot ms ON ts.symbol = ms.symbol
      WHERE ts.enabled = 1
    `);

    const now = new Date();
    const symbolsToUpdate = [];
    const symbolsForEma = [];
    const symbolsForRsi = [];

    // DEBUG Trackers
    let oldestUpdatedAt = null;
    let minThreshold = null;

    for (const row of rows) {
      const isPriority1 = row.priority === 1;
      const syncIntervalMs = isPriority1 ? 60 * 1000 : 5 * 60 * 1000; // 1 min o 5 min

      if (!minThreshold || syncIntervalMs < minThreshold) minThreshold = syncIntervalMs;

      if (row.updated_at) {
        const rowTime = new Date(row.updated_at).getTime();
        if (!oldestUpdatedAt || rowTime < oldestUpdatedAt) oldestUpdatedAt = rowTime;
      }

      // Necesita actualizar precio?
      if (!row.updated_at || (now.getTime() - new Date(row.updated_at).getTime()) > syncIntervalMs) {
        symbolsToUpdate.push(row.symbol);
      }

      // Necesita actualizar EMA / Setup? (cada 12 horas o si falta el setup)
      if (!row.ema_updated_at || row.setup_state === null || (now.getTime() - new Date(row.ema_updated_at).getTime()) > 12 * 60 * 60 * 1000) {
        symbolsForEma.push(row.symbol);
      }

      // Necesita actualizar RSI/MACD/Drawdown/RS? (cada 12 horas o si alguno no se calculó)
      if (!row.rsi_updated_at || row.macd_weekly === null || row.drawdown_52w === null || row.rs_value === null || (now.getTime() - new Date(row.rsi_updated_at).getTime()) > 12 * 60 * 60 * 1000) {
        symbolsForRsi.push({ symbol: row.symbol, index_symbol: row.index_symbol });
      }
    }

    if (symbolsToUpdate.length === 0 && symbolsForEma.length === 0 && symbolsForRsi.length === 0) {
      logger.debug('MarketSync', `No stale symbols found. Skipping sync. Reason: ${reason}`);
      isSyncing = false;
      return;
    }

    const freshCount = rows.length - symbolsToUpdate.length;

    // Log inicial del ciclo
    if (reason !== 'scheduled' || symbolsToUpdate.length > 0) {
      logger.info('MarketSync', `${reason === 'startup' ? 'initial ' : ''}sync started`);
      logger.info('MarketSync', `Reason: ${reason}`);

      // Timezone explícito para el estado del mercado (America/New_York)
      const nyTime = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
      const isWeekend = nyTime.getDay() === 0 || nyTime.getDay() === 6;
      const hour = nyTime.getHours();
      const isMarketOpen = !isWeekend && (hour >= 9 && hour <= 16);
      logger.info('MarketSync', `Market status: ${isMarketOpen ? 'OPEN' : 'CLOSED'} | NY Time: ${nyTime.getHours()}:${nyTime.getMinutes().toString().padStart(2, '0')} | Price TTL: 1m/5m | EMA TTL: 12h`);

      // DEBUG Temporal para TTL
      logger.debug('MarketSync', `[DEBUG] TTL -> currentTime: ${now.getTime()}, thresholdMs: ${minThreshold}, oldestUpdatedAt: ${oldestUpdatedAt}, freshCount: ${freshCount}, staleCount: ${symbolsToUpdate.length}`);

      logger.info('MarketSync', `Symbols: ${rows.length} | Stale: ${symbolsToUpdate.length} | Fresh: ${freshCount}`);
    } else {
      logger.debug('MarketSync', `Sync started. Reason: ${reason}. Symbols: ${rows.length} | Stale: ${symbolsToUpdate.length}`);
    }

    // Map para guardar los nuevos datos
    // { symbol: { price, changePercent, changeAmount, source } }
    const newQuotes = new Map();
    const failedFinnhubSymbols = [];

    // 2. Intentar Finnhub Concurrent (si hay API Key)
    const finnhubStartTime = performance.now();
    if (FINNHUB_API_KEY && symbolsToUpdate.length > 0) {
      let activePromises = [];
      let abortFinnhubQueue = false;

      if (finnhubRateLimited && Date.now() > finnhubRateLimitResetTime) {
        finnhubRateLimited = false;
        finnhubWindowRequests = 0;
        finnhubWindowStart = Date.now();
        logger.warn('MarketSync', 'Finnhub Rate Limit reset. Resuming Finnhub requests.');
      }

      for (const symbol of symbolsToUpdate) {
        // Control de Ventana de Tiempo (Bucket)
        const timeSinceWindow = Date.now() - finnhubWindowStart;
        if (timeSinceWindow >= FINNHUB_RATE_WINDOW_MS) {
          finnhubWindowStart = Date.now();
          finnhubWindowRequests = 0;
        }

        // Bloqueo duro si el Bucket está lleno o si ya activamos el cooldown
        if (finnhubRateLimited || abortFinnhubQueue || finnhubWindowRequests >= FINNHUB_MAX_REQUESTS_PER_WINDOW) {
          if (!finnhubRateLimited && !abortFinnhubQueue) {
            logger.warn('MarketSync', `Finnhub window limit reached (${FINNHUB_MAX_REQUESTS_PER_WINDOW} reqs). Stopping queue.`);
            abortFinnhubQueue = true;
          }
          failedFinnhubSymbols.push(symbol);
          continue;
        }

        finnhubWindowRequests++;
        finnhubCount++;

        const fetchPromise = (async () => {
          try {
            const data = await fetchFinnhub(symbol);
            newQuotes.set(symbol, { ...data, source: 'finnhub' });
            finnhubSuccess++;
          } catch (e) {
            if (e.message.includes('429')) {
              if (!finnhubRateLimited) {
                finnhubRateLimited = true;
                finnhubRateLimitResetTime = Date.now() + FINNHUB_RATE_WINDOW_MS;
                logger.warn('MarketSync', 'Finnhub HTTP 429 rate limit reached. Activating cooldown and aborting queue.');
                logger.info('MarketSync', `Redirecting remaining symbols to Yahoo Bulk`);
                abortFinnhubQueue = true;
              }
            } else {
              logger.debug('Finnhub', `Request failed for ${symbol}: ${e.message}`);
            }
            finnhubFailed++;
            failedFinnhubSymbols.push(symbol);
          }
        })();

        activePromises.push(fetchPromise);

        if (activePromises.length >= FINNHUB_MAX_CONCURRENT_REQUESTS) {
          await Promise.allSettled(activePromises);
          activePromises = [];
        }
      }
      if (activePromises.length > 0) {
        await Promise.allSettled(activePromises);
      }
    } else {
      failedFinnhubSymbols.push(...symbolsToUpdate);
    }
    timeFinnhub = performance.now() - finnhubStartTime;

    // 3. Fallback Yahoo para los que fallaron
    const yahooStartTime = performance.now();
    if (failedFinnhubSymbols.length > 0) {
      if (Date.now() < yahooCooldownUntil) {
        logger.warn('Yahoo', `Yahoo is on cooldown until ${new Date(yahooCooldownUntil).toLocaleTimeString()}. Skipping fallback for ${failedFinnhubSymbols.length} symbols.`);
        yahooFailed += failedFinnhubSymbols.length;
      } else {
        logger.debug('Yahoo', `Yahoo fallback triggered for ${failedFinnhubSymbols.length} symbols`);
        const BATCH_SIZE = 20;

        for (let i = 0; i < failedFinnhubSymbols.length; i += BATCH_SIZE) {
          const batch = failedFinnhubSymbols.slice(i, i + BATCH_SIZE);
          yahooHttpRequests++;
          yahooCount += batch.length;

          try {
            const yahooResults = await fetchYahooBulk(batch);

            // Marcar los procesados con éxito
            const successSet = new Set();
            for (const res of yahooResults) {
              if (res.data && res.data.price) {
                newQuotes.set(res.symbol, { ...res.data, source: 'yahoo' });
                yahooSuccess++;
                successSet.add(res.symbol);
              }
            }
            // Contabilizar fallos en este batch (símbolos del batch que no están en results)
            yahooFailed += (batch.length - successSet.size);
          } catch (error) {
            if (error.message.includes('401') || error.message.includes('403') || error.message.includes('429')) {
              yahooCooldownUntil = Date.now() + 15 * 60 * 1000;
              logger.warn('Yahoo', `Critical HTTP error (${error.message}). Activating 15m cooldown.`);
              yahooFailed += (failedFinnhubSymbols.length - i);
              break; // Abortar cola entera de Yahoo
            } else {
              logger.error('Yahoo', `Bulk request failed: ${error.message}`);
              yahooFailed += batch.length;
            }
          }
        }
      }
    }
    timeYahoo = performance.now() - yahooStartTime;

    // 4. Calcular EMAs pendientes
    const emaStartTime = performance.now();
    const newEmas = new Map();
    if (symbolsForEma.length > 0) {
      // Hacemos el cálculo secuencial (o lotes pequeños) para no spamear la API de histórico de Yahoo
      // ya que esto se hace solo 1 vez cada 12 horas.
      const EMA_CONCURRENCY = 5;
      for (let i = 0; i < symbolsForEma.length; i += EMA_CONCURRENCY) {
        const batch = symbolsForEma.slice(i, i + EMA_CONCURRENCY);
        const promises = batch.map(async (sym) => {
          try {
            const setup = await calculateDailySetup(sym);
            if (setup !== null) {
              newEmas.set(sym, setup);
              emaSuccess++;
            } else {
              emaFailed++;
            }
          } catch (e) {
            emaFailed++;
            logger.error('Setup/EMA', `Failed for ${sym}: ${e.message}`);
          }
        });
        await Promise.allSettled(promises);
      }
    }
    timeEma = performance.now() - emaStartTime;

    // 4.5 Calcular RSIs pendientes
    const rsiStartTime = performance.now();
    const newRsis = new Map();
    let rsiSuccess = 0;
    let rsiFailed = 0;
    if (symbolsForRsi.length > 0) {
      const RSI_CONCURRENCY = 5;
      for (let i = 0; i < symbolsForRsi.length; i += RSI_CONCURRENCY) {
        const batch = symbolsForRsi.slice(i, i + RSI_CONCURRENCY);
        const promises = batch.map(async (item) => {
          const sym = item.symbol;
          const index_symbol = item.index_symbol;
          try {
            const ind = await calculateWeeklyIndicators(sym, index_symbol);
            if (ind) {
              const { rsi, macd } = ind;
              const quoteData = newQuotes.get(sym) || {};

              if (rsi && rsi.current !== null) {
                quoteData.rsi_weekly = rsi.current;
                quoteData.rsi_previous = rsi.previous;
                quoteData.rsi_delta = rsi.delta;
              }
              if (macd && macd.current !== null) {
                quoteData.macd_weekly = macd.current;
                quoteData.macd_signal = macd.signal;
                quoteData.macd_hist = macd.hist;
                quoteData.macd_prev_weekly = macd.prev_current;
                quoteData.macd_prev_signal = macd.prev_signal;
                quoteData.macd_prev_hist = macd.prev_hist;
              }
              if (ind.drawdown52w !== null) {
                quoteData.drawdown_52w = ind.drawdown52w;
              }
              if (ind.rs_value !== undefined) {
                quoteData.rs_value = ind.rs_value;
                quoteData.rs_previous = ind.rs_previous;
                quoteData.rs_state = ind.rs_state;
              }
              newRsis.set(sym, quoteData);
              rsiSuccess++;
            } else {
              rsiFailed++;
            }
          } catch (e) {
            rsiFailed++;
            logger.debug('RSI/MACD', `Failed for ${sym}: ${e.message}`);
          }
        });
        await Promise.allSettled(promises);
      }
    }
    const timeRsi = performance.now() - rsiStartTime;

    // 5. Consolidar y guardar en BD
    const dbStartTime = performance.now();
    // Iteramos sobre todos los símbolos procesados (precios, EMAs o RSIs) O que fallaron
    const allSymbolsTouched = new Set([...symbolsToUpdate, ...symbolsForEma, ...symbolsForRsi.map(s => s.symbol)]);
    let dbUpdated = 0;

    // Preparar transacciones o ejecuciones individuales
    for (const symbol of allSymbolsTouched) {
      const quote = newQuotes.get(symbol);
      const ema = newEmas.get(symbol);
      const rsi = newRsis.get(symbol);

      if (!quote && ema === undefined && rsi === undefined) {
        if (symbolsToUpdate.includes(symbol)) {
          // Este símbolo falló en actualizar su precio en todos los proveedores
          try {
            await db.execute(
              'INSERT INTO market_snapshot (symbol, status, updated_at) VALUES (?, "ERROR", NOW()) ON DUPLICATE KEY UPDATE status = "ERROR", updated_at = NOW()',
              [symbol]
            );
          } catch (e) {
            logger.error('Database', `Error setting ERROR status for ${symbol}: ${e.message}`);
          }
        }
        continue; // Pasamos al siguiente
      }

      let updateQuery = 'INSERT INTO market_snapshot (symbol, ';
      let updateValues = [];
      let updatePlaceholders = [];
      let onDuplicateUpdate = [];

      updateValues.push(symbol);

      if (quote) {
        updateQuery += 'price, change_amount, change_percent, source, ';
        updatePlaceholders.push('?', '?', '?', '?');
        updateValues.push(quote.price, quote.changeAmount, quote.changePercent, quote.source);
        onDuplicateUpdate.push('price = VALUES(price)', 'change_amount = VALUES(change_amount)', 'change_percent = VALUES(change_percent)', 'source = VALUES(source)', 'updated_at = NOW()', 'status = "LIVE"');
      }

      let setup = newEmas.get(symbol);
      if (setup !== undefined) {
        updateQuery += 'ema21_distance, ema_updated_at, setup_state, setup_verdict, setup_factors';
        updatePlaceholders.push('?', 'NOW()', '?', '?', '?');
        updateValues.push(setup.ema21_distance, setup.setup_state, setup.setup_verdict, JSON.stringify(setup.setup_factors));
        onDuplicateUpdate.push(
          'ema21_distance = VALUES(ema21_distance)', 
          'ema_updated_at = VALUES(ema_updated_at)',
          'setup_state = VALUES(setup_state)',
          'setup_verdict = VALUES(setup_verdict)',
          'setup_factors = VALUES(setup_factors)'
        );
      } else {
        updateQuery = updateQuery.replace(/, $/, '');
      }

      const rsiData = newRsis.get(symbol);
      if (rsiData !== undefined) {
        if (!updateQuery.endsWith(', ')) updateQuery += ', ';
        if (rsiData.rsi_weekly !== undefined) {
          updateQuery += 'rsi_weekly, rsi_previous, rsi_delta, rsi_updated_at';
          updatePlaceholders.push('?', '?', '?', 'NOW()');
          updateValues.push(rsiData.rsi_weekly, rsiData.rsi_previous, rsiData.rsi_delta);
          onDuplicateUpdate.push('rsi_weekly = VALUES(rsi_weekly)', 'rsi_previous = VALUES(rsi_previous)', 'rsi_delta = VALUES(rsi_delta)', 'rsi_updated_at = VALUES(rsi_updated_at)');
        }
        if (rsiData.macd_weekly !== undefined) {
          if (!updateQuery.endsWith(', ') && !updateQuery.endsWith('rsi_updated_at')) updateQuery += ', ';
          else if (updateQuery.endsWith('rsi_updated_at')) updateQuery += ', ';
          updateQuery += 'macd_weekly, macd_signal, macd_hist, macd_prev_weekly, macd_prev_signal, macd_prev_hist';
          updatePlaceholders.push('?', '?', '?', '?', '?', '?');
          updateValues.push(rsiData.macd_weekly, rsiData.macd_signal, rsiData.macd_hist, rsiData.macd_prev_weekly, rsiData.macd_prev_signal, rsiData.macd_prev_hist);
          onDuplicateUpdate.push(
            'macd_weekly = VALUES(macd_weekly)', 'macd_signal = VALUES(macd_signal)', 'macd_hist = VALUES(macd_hist)',
            'macd_prev_weekly = VALUES(macd_prev_weekly)', 'macd_prev_signal = VALUES(macd_prev_signal)', 'macd_prev_hist = VALUES(macd_prev_hist)'
          );
        }
        if (rsiData.drawdown_52w !== undefined) {
          if (!updateQuery.endsWith(', ') && !updateQuery.endsWith('macd_prev_hist') && !updateQuery.endsWith('rsi_updated_at')) updateQuery += ', ';
          else if (updateQuery.endsWith('macd_prev_hist') || updateQuery.endsWith('rsi_updated_at')) updateQuery += ', ';
          updateQuery += 'drawdown_52w';
          updatePlaceholders.push('?');
          updateValues.push(rsiData.drawdown_52w);
          onDuplicateUpdate.push('drawdown_52w = VALUES(drawdown_52w)');
        }
        if (rsiData.rs_value !== undefined) {
          if (!updateQuery.endsWith(', ') && !updateQuery.endsWith('drawdown_52w') && !updateQuery.endsWith('macd_prev_hist') && !updateQuery.endsWith('rsi_updated_at')) updateQuery += ', ';
          else if (updateQuery.endsWith('drawdown_52w') || updateQuery.endsWith('macd_prev_hist') || updateQuery.endsWith('rsi_updated_at')) updateQuery += ', ';
          updateQuery += 'rs_value, rs_previous, rs_state, rs_updated_at';
          updatePlaceholders.push('?', '?', '?', 'NOW()');
          updateValues.push(rsiData.rs_value, rsiData.rs_previous, rsiData.rs_state);
          onDuplicateUpdate.push('rs_value = VALUES(rs_value)', 'rs_previous = VALUES(rs_previous)', 'rs_state = VALUES(rs_state)', 'rs_updated_at = VALUES(rs_updated_at)');
        }
      } else {
        updateQuery = updateQuery.replace(/, $/, '');
      }

      if (onDuplicateUpdate.length > 0) {
        const sql = `${updateQuery}) VALUES (?${updatePlaceholders.length > 0 ? ',' + updatePlaceholders.join(',') : ''}) ON DUPLICATE KEY UPDATE ${onDuplicateUpdate.join(', ')}`;
        try {
          await db.execute(sql, updateValues);
          dbUpdated++;
        } catch (e) {
          logger.error('Database', `Error updating ${symbol}: ${e.message}`);
        }
      }
    }
    timeDb = performance.now() - dbStartTime;

    const totalDuration = ((performance.now() - startTime) / 1000).toFixed(2);

    // Summary Blocks (sólo si no fue un scheduled tick vacío)
    if (reason !== 'scheduled' || dbUpdated > 0) {
      // Frontend Bridge Metrics
      logger.setMetrics({
        finnhubRequests: finnhubCount,
        finnhubSuccess: finnhubSuccess,
        yahooRequests: yahooCount,
        yahooSuccess: yahooSuccess,
        emaUpdated: emaSuccess,
        emaFailed: emaFailed,
        rsiUpdated: rsiSuccess,
        rsiFailed: rsiFailed,
        stale: symbolsToUpdate.length,
        fresh: rows.length - symbolsToUpdate.length,
        duration: totalDuration
      });

      if (finnhubCount > 0) {
        logger.info('Finnhub', `Requests: ${finnhubCount} | Success: ${finnhubSuccess} | Failed: ${finnhubFailed} | Rate Limited: ${finnhubRateLimited} | Duration: ${(timeFinnhub / 1000).toFixed(2)}s`);
      }

      if (yahooCount > 0) {
        logger.info('Yahoo', `Symbols: ${yahooCount} | HTTP requests: ${yahooHttpRequests} | Success: ${yahooSuccess} | Failed: ${yahooFailed} | Duration: ${(timeYahoo / 1000).toFixed(2)}s`);
      }

      if (symbolsForEma.length > 0) {
        logger.info('EMA21', `Updated: ${emaSuccess} | Failed: ${emaFailed} | Duration: ${(timeEma / 1000).toFixed(2)}s`);
      }

      if (symbolsForRsi.length > 0) {
        logger.info('RSI', `Updated: ${rsiSuccess} | Failed: ${rsiFailed} | Duration: ${(timeRsi / 1000).toFixed(2)}s`);
      }

      logger.info('MarketSync', 'completed');
      logger.raw(`
┌─────────────────────────────────────────────┐
│ MARKET SYNC SUMMARY                         │
├─────────────────────────────────────────────┤
│ Symbols tracked       ${String(rows.length).padEnd(22)}│
│ Symbols stale         ${String(symbolsToUpdate.length).padEnd(22)}│
│ Updated in DB         ${String(dbUpdated).padEnd(22)}│
│                                             │
│ Finnhub requests      ${finnhubCount.toString().padEnd(20, ' ')}│
│ Finnhub success       ${finnhubSuccess.toString().padEnd(20, ' ')}│
│ Yahoo HTTP requests   ${yahooHttpRequests.toString().padEnd(20, ' ')}│
│ Yahoo fallback syms   ${yahooCount.toString().padEnd(20, ' ')}│
│                                             │
│ EMA21 updated         ${String(emaSuccess).padEnd(22)}│
│ RSI Weekly updated    ${String(rsiSuccess).padEnd(22)}│
│                                             │
│ Duration              ${String(totalDuration + 's').padEnd(22)}│
└─────────────────────────────────────────────┘
      `);
    } else {
      logger.debug('MarketSync', `Completed empty scheduled sync in ${totalDuration}s`);
    }

  } catch (error) {
    logger.error('MarketSync', `Critical error during sync cycle: ${error.message}`);
    logger.debug('MarketSync', error.stack);
  } finally {
    isSyncing = false;
  }
}

// ─── Helpers (Adaptados del frontend) ──────────────────────────────────────────

async function fetchFinnhub(symbol) {
  // Ajuste de BCBA (.BA -> .BA)
  const querySymbol = symbol.endsWith('.BA') ? symbol : symbol;
  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(querySymbol)}&token=${FINNHUB_API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  const price = data.c;
  const changePercent = data.dp;
  const changeAmount = data.d;

  if (!price || isNaN(price) || price <= 0) {
    throw new Error('Invalid price data');
  }

  return { price, changePercent, changeAmount };
}

async function fetchYahooBulk(symbols) {
  const symbolString = symbols.join(',');
  const url = `https://query1.finance.yahoo.com/v8/finance/spark?symbols=${encodeURIComponent(symbolString)}&range=1d&interval=1d`;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });

  if (!response.ok) {
    let errorText = '';
    try { errorText = await response.text(); } catch (e) { }
    throw new Error(`Yahoo HTTP ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const results = [];

  if (data && typeof data === 'object') {
    for (const [sym, item] of Object.entries(data)) {
      if (item && item.close && item.close.length > 0) {
        const validCloses = item.close.filter(c => c !== null && !isNaN(c));
        if (validCloses.length === 0) continue;

        const currentPrice = validCloses[validCloses.length - 1];
        const prevClose = item.chartPreviousClose || item.previousClose;

        results.push({
          symbol: sym,
          data: {
            price: currentPrice,
            changeAmount: prevClose ? currentPrice - prevClose : null,
            changePercent: prevClose ? ((currentPrice - prevClose) / prevClose) * 100 : null
          }
        });
      }
    }
  }
  return results;
}

function calculateEMAArray(data, period) {
  if (!data || data.length < period) return [];
  const k = 2 / (period + 1);
  let emaArray = new Array(data.length).fill(null);

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  let ema = sum / period;
  emaArray[period - 1] = ema;

  for (let i = period; i < data.length; i++) {
    ema = (data[i] * k) + (ema * (1 - k));
    emaArray[i] = ema;
  }
  return emaArray;
}

function calculateSMAArray(data, period) {
  if (!data || data.length < period) return [];
  let smaArray = new Array(data.length).fill(null);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    if (i >= period) {
      sum -= data[i - period];
    }
    if (i >= period - 1) {
      smaArray[i] = sum / period;
    }
  }
  return smaArray;
}

function calculateRsiArray(closes, period = 14) {
  if (!closes || closes.length <= period) return [];
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  let rsiArray = new Array(period).fill(null);
  const getRsi = (ag, al) => al === 0 ? 100 : 100 - (100 / (1 + ag / al));
  rsiArray.push(getRsi(avgGain, avgLoss));

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    let gain = diff >= 0 ? diff : 0;
    let loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rsiArray.push(getRsi(avgGain, avgLoss));
  }
  return rsiArray;
}

function calculateMacdArrays(closes, fast = 12, slow = 26, signal = 9) {
  if (!closes || closes.length <= slow) return { macdLine: [], signalLine: [], histLine: [] };
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
  
  const validMacdLine = macdLine.slice(validMacdStart);
  const signalLineValid = calculateEMAArray(validMacdLine, signal);
  let signalLine = new Array(validMacdStart).fill(null).concat(signalLineValid);
  
  let histLine = [];
  for (let i = 0; i < closes.length; i++) {
    if (macdLine[i] !== null && signalLine[i] !== null) {
      histLine.push(macdLine[i] - signalLine[i]);
    } else {
      histLine.push(null);
    }
  }
  
  return { macdLine, signalLine, histLine };
}

function calculateATRArray(highs, lows, closes, period = 14) {
  if (!highs || !lows || !closes || closes.length <= period) return new Array(closes.length).fill(null);
  
  let trArray = [highs[0] - lows[0]]; // primer TR es H - L
  for (let i = 1; i < closes.length; i++) {
    const hl = highs[i] - lows[i];
    const hpc = Math.abs(highs[i] - closes[i - 1]);
    const lpc = Math.abs(lows[i] - closes[i - 1]);
    trArray.push(Math.max(hl, hpc, lpc));
  }
  
  let atrArray = new Array(closes.length).fill(null);
  let trSum = 0;
  for (let i = 0; i < period; i++) {
    trSum += trArray[i];
  }
  let atr = trSum / period;
  atrArray[period - 1] = atr;
  
  for (let i = period; i < closes.length; i++) {
    atr = (atr * (period - 1) + trArray[i]) / period;
    atrArray[i] = atr;
  }
  return atrArray;
}

async function calculateDailySetup(symbol) {
  // Configurable thresholds
  const SLOPE_THRESHOLD_PCT = 0.20;
  const MIN_SEPARATION_PCT = 1.0;
  
  // Pedimos 2 años de datos diarios para asegurar tener 200 ruedas hábiles (y más) para la EMA200
  let url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2y`;
  let response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  
  if (response.status === 404 && !symbol.includes('.')) {
    url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol + '.BA')}?interval=1d&range=2y`;
    response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  }
  
  if (!response.ok) throw new Error(`Yahoo Chart HTTP ${response.status}`);

  const data = await response.json();
  if (!data.chart || !data.chart.result || data.chart.result.length === 0) return null;
  const result = data.chart.result[0];
  if (!result.indicators || !result.indicators.quote || result.indicators.quote.length === 0) return null;

  // Extraer precios y filtrar inválidos
  const rawCloses = result.indicators.quote[0].close || [];
  const rawHighs = result.indicators.quote[0].high || [];
  const rawLows = result.indicators.quote[0].low || [];
  
  let closes = [], highs = [], lows = [];
  for (let i = 0; i < rawCloses.length; i++) {
    const c = rawCloses[i], h = rawHighs[i], l = rawLows[i];
    if (c !== null && !isNaN(c) && h !== null && !isNaN(h) && l !== null && !isNaN(l)) {
      closes.push(c); highs.push(h); lows.push(l);
    }
  }

  if (closes.length < 30) return null; // Mínimo para SMA30

  // 1. Calcular arreglos de indicadores diarios
  const ema21Array = calculateEMAArray(closes, 21);
  const sma30Array = calculateSMAArray(closes, 30);
  const ema200Array = calculateEMAArray(closes, 200); 
  const rsiArray = calculateRsiArray(closes, 14);
  const macdData = calculateMacdArrays(closes, 12, 26, 9);
  const atrArray = calculateATRArray(highs, lows, closes, 14);
  
  const L = closes.length - 1;
  const currentPrice = closes[L];

  const currentEma21 = ema21Array[L];
  const currentSma30 = sma30Array[L];
  const currentEma200 = ema200Array[L];
  
  // Extraer horizontes de medias (L-5, L-10, L-20)
  const prev5Ema21 = L >= 5 ? ema21Array[L - 5] : ema21Array[0];
  const prev10Ema21 = L >= 10 ? ema21Array[L - 10] : ema21Array[0];
  const prev20Ema21 = L >= 20 ? ema21Array[L - 20] : ema21Array[0];

  const prev5Sma30 = L >= 5 ? sma30Array[L - 5] : sma30Array[0];
  const prev10Sma30 = L >= 10 ? sma30Array[L - 10] : sma30Array[0];
  const prev20Sma30 = L >= 20 ? sma30Array[L - 20] : sma30Array[0];
  
  const currentRsi = rsiArray[L];
  const currentMacd = macdData.macdLine[L];
  const currentSignal = macdData.signalLine[L];
  const currentHist = macdData.histLine[L];
  const prevHist = macdData.histLine[L - 1];
  
  const currentAtr = atrArray[L];

  // Separaciones
  const ema21Distance = currentEma21 ? ((currentPrice - currentEma21) / currentEma21) * 100 : null;
  const sma30Distance = currentSma30 ? ((currentPrice - currentSma30) / currentSma30) * 100 : null;
  const ema21AboveSma30Pct = currentEma21 && currentSma30 ? ((currentEma21 - currentSma30) / currentSma30) * 100 : null;
  
  // Función para determinar DIR
  const getDir = (pct) => pct >= SLOPE_THRESHOLD_PCT ? 'UP' : (pct <= -SLOPE_THRESHOLD_PCT ? 'DOWN' : 'FLAT');

  // Pendientes EMA21
  const ema21Slope5Pct = currentEma21 && prev5Ema21 ? ((currentEma21 / prev5Ema21) - 1) * 100 : 0;
  const ema21Slope10Pct = currentEma21 && prev10Ema21 ? ((currentEma21 / prev10Ema21) - 1) * 100 : 0;
  const ema21Slope20Pct = currentEma21 && prev20Ema21 ? ((currentEma21 / prev20Ema21) - 1) * 100 : 0;

  const ema21Slope5Dir = getDir(ema21Slope5Pct);
  const ema21Slope10Dir = getDir(ema21Slope10Pct);
  const ema21Slope20Dir = getDir(ema21Slope20Pct);
  const ema21Trend = ema21Slope5Pct > ema21Slope10Pct ? 'ACCELERATING' : (ema21Slope5Pct < ema21Slope10Pct ? 'DECELERATING' : 'CONSTANT');

  // Pendientes SMA30
  const sma30Slope5Pct = currentSma30 && prev5Sma30 ? ((currentSma30 / prev5Sma30) - 1) * 100 : 0;
  const sma30Slope10Pct = currentSma30 && prev10Sma30 ? ((currentSma30 / prev10Sma30) - 1) * 100 : 0;
  const sma30Slope20Pct = currentSma30 && prev20Sma30 ? ((currentSma30 / prev20Sma30) - 1) * 100 : 0;

  const sma30Slope5Dir = getDir(sma30Slope5Pct);
  const sma30Slope10Dir = getDir(sma30Slope10Pct);
  const sma30Slope20Dir = getDir(sma30Slope20Pct);
  const sma30Trend = sma30Slope5Pct > sma30Slope10Pct ? 'ACCELERATING' : (sma30Slope5Pct < sma30Slope10Pct ? 'DECELERATING' : 'CONSTANT');

  // Estructura de factores JSON
  let factors = {
    trend: 'neutral',
    ema21: {
      slope5Pct: parseFloat(ema21Slope5Pct.toFixed(2)),
      slope10Pct: parseFloat(ema21Slope10Pct.toFixed(2)),
      slope20Pct: parseFloat(ema21Slope20Pct.toFixed(2)),
      slope5Dir: ema21Slope5Dir,
      slope10Dir: ema21Slope10Dir,
      slope20Dir: ema21Slope20Dir,
      trend: ema21Trend
    },
    sma30: {
      slope5Pct: parseFloat(sma30Slope5Pct.toFixed(2)),
      slope10Pct: parseFloat(sma30Slope10Pct.toFixed(2)),
      slope20Pct: parseFloat(sma30Slope20Pct.toFixed(2)),
      slope5Dir: sma30Slope5Dir,
      slope10Dir: sma30Slope10Dir,
      slope20Dir: sma30Slope20Dir,
      trend: sma30Trend
    },
    ema21AboveSma30Pct: ema21AboveSma30Pct ? parseFloat(ema21AboveSma30Pct.toFixed(2)) : null,
    priceAboveEma21Pct: ema21Distance ? parseFloat(ema21Distance.toFixed(2)) : null,
    atr14: currentAtr ? parseFloat(currentAtr.toFixed(4)) : null,
    distToEma21Atr: currentAtr && currentEma21 ? parseFloat((Math.abs(currentPrice - currentEma21) / currentAtr).toFixed(2)) : null,
    priceAboveEma21: currentEma21 ? currentPrice > currentEma21 : null,
    priceAboveSma30: currentSma30 ? currentPrice > currentSma30 : null,
    rsiDaily: currentRsi,
    macdDailyBullish: currentMacd !== null && currentSignal !== null ? currentMacd > currentSignal : null,
    pullbackDetected: false,
    reversalEarly: false,
    reversalConfirmed: false
  };

  // Helper variables
  const isEma21AllUp = ema21Slope5Dir === 'UP' && ema21Slope10Dir === 'UP' && ema21Slope20Dir === 'UP';
  const isSma30AllUp = sma30Slope5Dir === 'UP' && sma30Slope10Dir === 'UP' && sma30Slope20Dir === 'UP';
  const isEma21AllDown = ema21Slope5Dir === 'DOWN' && ema21Slope10Dir === 'DOWN' && ema21Slope20Dir === 'DOWN';
  const isSma30AllDown = sma30Slope5Dir === 'DOWN' && sma30Slope10Dir === 'DOWN' && sma30Slope20Dir === 'DOWN';
  
  const isPriceAboveEma21 = factors.priceAboveEma21;
  const isPriceAboveSma30 = factors.priceAboveSma30;

  // Lógica de Tendencia Alcista Fuerte (Strong Uptrend)
  let isUptrend = false;
  let isBearish = false;
  
  if (currentEma200 && currentEma21 && currentSma30) {
    if (currentPrice > currentEma21 && currentEma21 > currentSma30 && currentSma30 > currentEma200) {
      if (isEma21AllUp && isSma30AllUp && ema21AboveSma30Pct >= MIN_SEPARATION_PCT && ema21Distance >= MIN_SEPARATION_PCT) {
        isUptrend = true;
        factors.trend = 'bullish';
      }
    } else if (currentPrice < currentEma21 && currentEma21 < currentSma30 && currentSma30 < currentEma200) {
      if (isEma21AllDown && isSma30AllDown && ((currentSma30 - currentEma200)/currentEma200)*100 <= -MIN_SEPARATION_PCT) {
        isBearish = true;
        factors.trend = 'bearish';
      }
    }
  } else {
    // Fallback sin EMA200
    if (currentEma21 && currentSma30) {
      if (currentPrice > currentEma21 && currentEma21 > currentSma30 && isEma21AllUp && isSma30AllUp && ema21AboveSma30Pct >= MIN_SEPARATION_PCT && ema21Distance >= MIN_SEPARATION_PCT) {
        isUptrend = true;
        factors.trend = 'bullish';
      } else if (currentPrice < currentEma21 && currentEma21 < currentSma30 && isEma21AllDown && isSma30AllDown) {
        isBearish = true;
        factors.trend = 'bearish';
      }
    }
  }

  // Si no cumple las condiciones estrictas y está flotando alrededor, la pasamos a NEUTRAL.
  let isLateral = (!isUptrend && !isBearish && 
    (Math.abs(ema21AboveSma30Pct) < MIN_SEPARATION_PCT || 
     (ema21Slope5Dir === 'FLAT' && sma30Slope5Dir === 'FLAT')));

  // Pullback Logic
  let pullbackConfirmed = false;
  if (closes.length >= 15 && currentAtr) {
    const isSma30TolerantUp = sma30Slope5Dir === 'UP' && sma30Slope10Dir === 'UP' && sma30Slope20Dir !== 'DOWN';
    if (isSma30TolerantUp) {
      // La tendencia previa debe haber sido marcada: precio > SMA30 + 1.5% entre hace 5 y 12 días
      let wasStrongAbove = false;
      for (let i = L - 12; i <= L - 5; i++) {
        if (sma30Array[i] && closes[i] >= sma30Array[i] * 1.015) {
          wasStrongAbove = true; break;
        }
      }
      
      // Verificamos si corrigió: distancia a EMA21 o SMA30 <= 0.5 ATR
      let corrected = false;
      for (let i = L - 5; i <= L; i++) {
        if (ema21Array[i] && sma30Array[i]) {
          const distEma21 = Math.abs(closes[i] - ema21Array[i]);
          const distSma30 = Math.abs(closes[i] - sma30Array[i]);
          if (distEma21 <= 0.5 * atrArray[i] || distSma30 <= 0.5 * atrArray[i]) {
            corrected = true; break;
          }
        }
      }
      
      if (wasStrongAbove && corrected && (isPriceAboveEma21 || isPriceAboveSma30)) {
        pullbackConfirmed = true;
        factors.pullbackDetected = true;
      }
    }
  }

  // Reversal Logic
  let reversalEarly = false;
  let reversalConfirmed = false;
  
  if (isBearish || factors.trend === 'bearish' || (!isUptrend && !pullbackConfirmed)) {
    // Early Reversal
    if (isPriceAboveEma21) {
      let improvementSignals = 0;
      if (currentRsi > 45) improvementSignals++;
      if (factors.macdDailyBullish) improvementSignals++;
      if (currentHist && prevHist && currentHist > prevHist) improvementSignals++;
      if (ema21Slope5Dir === 'UP') improvementSignals++;
      if (ema21Trend === 'ACCELERATING') improvementSignals++;
      
      if (improvementSignals >= 2) {
        reversalEarly = true;
        factors.reversalEarly = true;
      }
    }
    
    // Confirmed Reversal
    const isWeakStructure = ema21Slope20Dir === 'DOWN' || sma30Slope20Dir === 'DOWN';
    if (isWeakStructure && isPriceAboveEma21 && isPriceAboveSma30 && ema21Slope5Dir === 'UP' && currentRsi > 50 && factors.macdDailyBullish) {
      reversalConfirmed = true;
      factors.reversalConfirmed = true;
    }
  }

  // Asignar estado según prioridad
  let state = 'neutral';
  let verdict = 'Sin setup alcista claro';

  if (pullbackConfirmed) {
    state = 'bullish_pullback';
    verdict = 'Pullback alcista confirmado';
  } else if (reversalConfirmed) {
    state = 'bullish_reversal_confirmed';
    verdict = 'Reversión alcista confirmada';
  } else if (reversalEarly) {
    state = 'early_bullish_reversal';
    verdict = 'Posible reversión temprana';
  } else if (isUptrend && !isLateral) {
    state = 'strong_uptrend';
    verdict = 'Tendencia alcista establecida';
  } else if (isBearish && !isLateral) {
    state = 'bearish_trend';
    verdict = 'Tendencia bajista';
  }

  return {
    ema21: currentEma21,
    ema21_distance: ema21Distance,
    setup_state: state,
    setup_verdict: verdict,
    setup_factors: factors
  };
}



const indexPromises = new Map();
async function getIndexHistory(indexSymbol) {
  if (!indexSymbol) return null;
  if (indexPromises.has(indexSymbol)) return indexPromises.get(indexSymbol);
  
  const promise = (async () => {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(indexSymbol)}?interval=1wk&range=2y`;
      const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!response.ok) return null;
      const data = await response.json();
      if (!data.chart || !data.chart.result || data.chart.result.length === 0) return null;
      const result = data.chart.result[0];
      if (!result.indicators || !result.indicators.quote || result.indicators.quote.length === 0) return null;
      
      const timestamps = result.timestamp || [];
      const rawCloses = result.indicators.quote[0].close || [];
      
      let closesByTime = new Map();
      if (timestamps.length > 0 && rawCloses.length > 0) {
        for (let i = 0; i < timestamps.length; i++) {
          const t = timestamps[i];
          const c = rawCloses[i];
          if (c !== null && c !== undefined && !isNaN(c)) {
            // Utilizamos una aproximación semanal (ej. agrupar por inicio de semana o simplemente día)
            // Yahoo a veces devuelve timestamps ligeramente distintos, redondeamos a inicio de día UTC
            const date = new Date(t * 1000);
            date.setUTCHours(0, 0, 0, 0);
            closesByTime.set(date.getTime(), c);
          }
        }
      }
      return closesByTime;
    } catch (e) {
      logger.error('IndexHistory', `Error fetching index ${indexSymbol}: ${e.message}`);
      return null;
    }
  })();
  
  indexPromises.set(indexSymbol, promise);
  return promise;
}

async function calculateWeeklyIndicators(symbol, indexSymbol = null, rsiPeriod = 14) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1wk&range=2y`;
  const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!response.ok) throw new Error(`Yahoo Chart HTTP ${response.status}`);

  const data = await response.json();
  if (!data.chart || !data.chart.result || data.chart.result.length === 0) return null;
  const result = data.chart.result[0];
  if (!result.indicators || !result.indicators.quote || result.indicators.quote.length === 0) return null;

  const timestamps = result.timestamp || [];
  const rawCloses = result.indicators.quote[0].close || [];
  const rawHighs = result.indicators.quote[0].high || [];

  let closes = [];
  let highs = [];
  let validTimestamps = [];
  if (timestamps.length > 0 && rawCloses.length > 0 && rawHighs.length > 0) {
    const lastTimestamp = timestamps[timestamps.length - 1] * 1000;
    let endIdx = timestamps.length;
    if (Date.now() < lastTimestamp + (7 * 24 * 60 * 60 * 1000)) {
      endIdx = timestamps.length - 1;
    }
    for (let i = 0; i < endIdx; i++) {
      const c = rawCloses[i];
      const h = rawHighs[i];
      if (c !== null && c !== undefined && !isNaN(c) && h !== null && h !== undefined && !isNaN(h)) {
        closes.push(c);
        highs.push(h);
        
        const date = new Date(timestamps[i] * 1000);
        date.setUTCHours(0, 0, 0, 0);
        validTimestamps.push(date.getTime());
      }
    }
  }

  const emptyRsi = { current: null, previous: null, delta: null };
  const emptyMacd = { current: null, signal: null, hist: null, prev_current: null, prev_signal: null, prev_hist: null };

  let rsi = emptyRsi;
  let macd = emptyMacd;
  let drawdown52w = null;

  if (highs.length > 0 && closes.length > 0) {
    const last52Highs = highs.slice(-52);
    const max52w = Math.max(...last52Highs);
    const currentPrice = closes[closes.length - 1];
    if (max52w > 0) {
      drawdown52w = parseFloat((((currentPrice - max52w) / max52w) * 100).toFixed(4));
    }
  }

  if (closes.length > rsiPeriod) {
    let gains = 0, losses = 0;
    for (let i = 1; i <= rsiPeriod; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }
    let avgGain = gains / rsiPeriod;
    let avgLoss = losses / rsiPeriod;
    let rsiArray = [];
    const getRsi = (ag, al) => al === 0 ? 100 : 100 - (100 / (1 + ag / al));
    rsiArray.push(getRsi(avgGain, avgLoss));

    for (let i = rsiPeriod + 1; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      let gain = diff >= 0 ? diff : 0;
      let loss = diff < 0 ? -diff : 0;
      avgGain = (avgGain * (rsiPeriod - 1) + gain) / rsiPeriod;
      avgLoss = (avgLoss * (rsiPeriod - 1) + loss) / rsiPeriod;
      rsiArray.push(getRsi(avgGain, avgLoss));
    }

    if (rsiArray.length >= 2) {
      const curr = parseFloat(rsiArray[rsiArray.length - 1].toFixed(2));
      const prev = parseFloat(rsiArray[rsiArray.length - 2].toFixed(2));
      rsi = { current: curr, previous: prev, delta: parseFloat((curr - prev).toFixed(2)) };
    }
  }

  if (closes.length > 26) {
    const ema12 = calculateEMAArray(closes, 12);
    const ema26 = calculateEMAArray(closes, 26);

    let macdLine = [];
    let validMacdStart = -1;
    for (let i = 0; i < closes.length; i++) {
      if (ema12[i] !== null && ema26[i] !== null) {
        if (validMacdStart === -1) validMacdStart = i;
        macdLine.push(ema12[i] - ema26[i]);
      } else {
        macdLine.push(null);
      }
    }

    const validMacdLine = macdLine.slice(validMacdStart);
    const signalLineValid = calculateEMAArray(validMacdLine, 9);

    let signalLine = new Array(validMacdStart).fill(null).concat(signalLineValid);

    let histLine = [];
    for (let i = 0; i < closes.length; i++) {
      if (macdLine[i] !== null && signalLine[i] !== null) {
        histLine.push(macdLine[i] - signalLine[i]);
      } else {
        histLine.push(null);
      }
    }

    if (macdLine.length >= 2 && macdLine[macdLine.length - 1] !== null && signalLine[signalLine.length - 1] !== null) {
      macd = {
        current: parseFloat(macdLine[macdLine.length - 1].toFixed(2)),
        signal: parseFloat(signalLine[signalLine.length - 1].toFixed(2)),
        hist: parseFloat(histLine[histLine.length - 1].toFixed(2)),
        prev_current: parseFloat(macdLine[macdLine.length - 2].toFixed(2)),
        prev_signal: parseFloat(signalLine[signalLine.length - 2].toFixed(2)),
        prev_hist: parseFloat(histLine[histLine.length - 2].toFixed(2))
      };
    }
  }

  // Weinstein Relative Strength
  let rs_value = null;
  let rs_previous = null;
  let rs_state = null;

  if (indexSymbol && validTimestamps.length >= 14) {
    const indexHistory = await getIndexHistory(indexSymbol);
    if (indexHistory) {
      // Intentar encontrar el valor del índice para cada timestamp válido
      let indexCloses = [];
      for (let t of validTimestamps) {
        // Tolerancia de 3 días por si los arranques de semana difieren
        let found = indexHistory.get(t);
        if (found === undefined) found = indexHistory.get(t - 86400000);
        if (found === undefined) found = indexHistory.get(t + 86400000);
        if (found === undefined) found = indexHistory.get(t - 172800000);
        if (found === undefined) found = indexHistory.get(t + 172800000);
        if (found === undefined) found = indexHistory.get(t - 259200000);
        if (found === undefined) found = indexHistory.get(t + 259200000);
        
        indexCloses.push(found !== undefined ? found : null);
      }

      const L = closes.length;
      if (L >= 14) {
        const pCurrent = closes[L - 1];
        const p12wAgo = closes[L - 13]; // 12 semanas antes del actual
        
        const iCurrent = indexCloses[L - 1];
        const i12wAgo = indexCloses[L - 13];

        if (pCurrent && p12wAgo && iCurrent && i12wAgo) {
          const stockReturn = pCurrent / p12wAgo;
          const indexReturn = iCurrent / i12wAgo;
          const rs = stockReturn / indexReturn;
          rs_value = parseFloat(((rs - 1) * 100).toFixed(2)); // Guardamos como porcentaje (ej +9.1%)
        }

        const pPrev = closes[L - 2];
        const p13wAgo = closes[L - 14];
        
        const iPrev = indexCloses[L - 2];
        const i13wAgo = indexCloses[L - 14];

        if (pPrev && p13wAgo && iPrev && i13wAgo) {
          const stockReturnP = pPrev / p13wAgo;
          const indexReturnP = iPrev / i13wAgo;
          const rsP = stockReturnP / indexReturnP;
          rs_previous = parseFloat(((rsP - 1) * 100).toFixed(2));
        }

        if (rs_value !== null && rs_previous !== null) {
          if (rs_value > 0) {
            rs_state = (rs_value > rs_previous) ? 'Strong & Rising' : 'Strong but Weakening';
          } else {
            rs_state = (rs_value > rs_previous) ? 'Weak but Recovering' : 'Weak & Falling';
          }
        }
      }
    }
  }

  return { rsi, macd, drawdown52w, rs_value, rs_previous, rs_state };
}

module.exports = {
  runSync,
  calculateWeeklyIndicators
};
