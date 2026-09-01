const { getPool } = require('../database/db');
const logger = require('../utils/logger');
const opScoreService = require('./opScoreService');
require('dotenv').config();

const { default: YahooFinance } = require('yahoo-finance2');
const yahooFinance = new YahooFinance({ validation: { logErrors: false } });

let isSyncing = false;
let finnhubRateLimited = false;
let finnhubRateLimitResetTime = 0;
let yahooCooldownUntil = 0;

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

// Finnhub Rate Limiter Configuration
const FINNHUB_MAX_CONCURRENT_REQUESTS = process.env.FINNHUB_MAX_CONCURRENT_REQUESTS ? parseInt(process.env.FINNHUB_MAX_CONCURRENT_REQUESTS) : 5;
const FINNHUB_MAX_REQUESTS_PER_WINDOW = process.env.FINNHUB_MAX_REQUESTS_PER_WINDOW ? parseInt(process.env.FINNHUB_MAX_REQUESTS_PER_WINDOW) : 30;
const FINNHUB_RATE_WINDOW_MS = process.env.FINNHUB_RATE_WINDOW_MS ? parseInt(process.env.FINNHUB_RATE_WINDOW_MS) : 60000;

let finnhubWindowStart = 0;
let finnhubWindowRequests = 0;

// Cache para EMA 21 (evitar recalcular innecesariamente en memoria durante la misma corrida si Yahoo falla)
const emaMemoryCache = new Map();
const invalidBreakStreakCache = new Map(); // symbol -> streak count

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
        ts.next_earnings_date,
        ts.priority, 
        ms.updated_at,
        ms.ema_updated_at,
        ms.rsi_updated_at,
        ms.macd_weekly,
        ms.drawdown_52w,
        ms.rs_updated_at,
        ms.rs_value,
        ms.rs_previous,
        ms.rs_state,
        ms.setup_state,
        ms.setup_factors,
        ms.rsi_weekly,
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
      if (reason === 'force' || !row.updated_at || (now.getTime() - new Date(row.updated_at).getTime()) > syncIntervalMs) {
        symbolsToUpdate.push(row.symbol);
      }

      // Necesita actualizar EMA / Setup? (cada 1 hora o si falta el setup)
      if (reason === 'force' || !row.ema_updated_at || row.setup_state === null || (now.getTime() - new Date(row.ema_updated_at).getTime()) > 1 * 60 * 60 * 1000) {
        symbolsForEma.push(row.symbol);
      }

      // Necesita actualizar RSI/MACD/Drawdown/RS? (cada 1 hora o si alguno no se calculó)
      if (reason === 'force' || !row.rsi_updated_at || row.macd_weekly === null || row.drawdown_52w === null || row.rs_value === null || (now.getTime() - new Date(row.rsi_updated_at).getTime()) > 1 * 60 * 60 * 1000) {
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
      logger.info('MarketSync', `Market status: ${isMarketOpen ? 'OPEN' : 'CLOSED'} | NY Time: ${nyTime.getHours()}:${nyTime.getMinutes().toString().padStart(2, '0')} | Price TTL: 1m/5m | EMA TTL: 1h`);

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
        // Finnhub no soporta BCBA ni futuros de commodities (=F), los enviamos directo a Yahoo
        if (symbol.endsWith('.BA') || symbol.includes('=F')) {
          failedFinnhubSymbols.push(symbol);
          continue;
        }

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
      yahooCount = failedFinnhubSymbols.length;
      if (Date.now() < yahooCooldownUntil) {
        logger.warn('Yahoo', `Yahoo is on cooldown until ${new Date(yahooCooldownUntil).toLocaleTimeString()}. Skipping fallback for ${failedFinnhubSymbols.length} symbols.`);
        yahooFailed += failedFinnhubSymbols.length;
      } else {
        logger.debug('Yahoo', `Yahoo fallback triggered for ${failedFinnhubSymbols.length} symbols`);
        // Batch reducido a 10 para minimizar errores de rate-limit en el bulk quote de Yahoo.
        const BATCH_SIZE = 10;

        for (let i = 0; i < failedFinnhubSymbols.length; i += BATCH_SIZE) {
          const batch = failedFinnhubSymbols.slice(i, i + BATCH_SIZE);
          yahooHttpRequests++;

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
          // Pausa entre batches de precios para no saturar Yahoo quote.
          if (i + BATCH_SIZE < failedFinnhubSymbols.length) {
            await new Promise(r => setTimeout(r, 200));
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
      // CONCURRENCIA REDUCIDA a 3 + delay entre batches para evitar rate-limit de Yahoo.
      const EMA_CONCURRENCY = 3;
      logger.info('Setup/EMA', `Starting EMA/Setup calculation for ${symbolsForEma.length} symbols...`);
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
        // Log de progreso cada 15 símbolos para confirmar que el proceso avanza.
        if ((i + EMA_CONCURRENCY) % 15 === 0 || i + EMA_CONCURRENCY >= symbolsForEma.length) {
          logger.debug('Setup/EMA', `Progress: ${Math.min(i + EMA_CONCURRENCY, symbolsForEma.length)}/${symbolsForEma.length} | OK: ${emaSuccess} | Fail: ${emaFailed}`);
        }
        // Pausa entre batches para no saturar Yahoo Finance y evitar rate-limit.
        if (i + EMA_CONCURRENCY < symbolsForEma.length) {
          await new Promise(r => setTimeout(r, 600));
        }
      }
    }
    timeEma = performance.now() - emaStartTime;

    // 4.5 Calcular RSIs pendientes
    const rsiStartTime = performance.now();
    const newRsis = new Map();
    let rsiSuccess = 0;
    let rsiFailed = 0;
    if (symbolsForRsi.length > 0) {
      // CONCURRENCIA REDUCIDA a 3 + delay entre batches para evitar rate-limit de Yahoo.
      const RSI_CONCURRENCY = 3;

      // Pre-calentar la caché de índices ANTES del loop paralelo.
      // Esto evita que múltiples promises disparen la misma llamada a Yahoo al mismo tiempo.
      const uniqueIndexSymbols = [...new Set(symbolsForRsi.map(s => s.index_symbol).filter(Boolean))];
      if (uniqueIndexSymbols.length > 0) {
        logger.debug('RSI/MACD', `Pre-fetching index history for: ${uniqueIndexSymbols.join(', ')}`);
        for (const idxSym of uniqueIndexSymbols) {
          await getIndexHistory(idxSym); // Popula indexCache de forma secuencial
        }
      }

      logger.info('RSI/MACD', `Starting RSI/MACD/RS calculation for ${symbolsForRsi.length} symbols...`);
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

              if (index_symbol) {
                quoteData.market_regime = await calculateIndexRegime(index_symbol);
              }
              quoteData.index_symbol = index_symbol; // Needed for grouping

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
        // Log de progreso cada 15 símbolos para confirmar que el proceso avanza.
        if ((i + RSI_CONCURRENCY) % 15 === 0 || i + RSI_CONCURRENCY >= symbolsForRsi.length) {
          logger.debug('RSI/MACD', `Progress: ${Math.min(i + RSI_CONCURRENCY, symbolsForRsi.length)}/${symbolsForRsi.length} | OK: ${rsiSuccess} | Fail: ${rsiFailed}`);
        }
        // Pausa entre batches para no saturar Yahoo Finance y evitar rate-limit.
        if (i + RSI_CONCURRENCY < symbolsForRsi.length) {
          await new Promise(r => setTimeout(r, 500));
        }
      }
      
      // --- Z-SCORE POST-PROCESSING ---
      // We process the full universe of RS values (DB + freshly calculated)
      const rsGroups = new Map();
      for (const row of rows) {
        if (!row.index_symbol) continue;
        
        let currentRsValue = row.rs_value;
        let currentRsPrev = row.rs_previous;
        let currentRegime = null;
        
        const fresh = newRsis.get(row.symbol);
        if (fresh && fresh.rs_value !== undefined) {
          currentRsValue = fresh.rs_value;
          currentRsPrev = fresh.rs_previous;
        }
        if (fresh && fresh.market_regime) {
          currentRegime = fresh.market_regime;
        }

        if (currentRsValue !== null && currentRsValue !== undefined && currentRsPrev !== null && currentRsPrev !== undefined) {
          if (!rsGroups.has(row.index_symbol)) {
            rsGroups.set(row.index_symbol, []);
          }
          rsGroups.get(row.index_symbol).push({
            symbol: row.symbol,
            rsValue: currentRsValue,
            rsPrev: currentRsPrev,
            regime: currentRegime
          });
        }
      }

      for (const [idxSym, group] of rsGroups.entries()) {
        // Obtenemos el regime para este grupo en caso de que lo necesitemos guardar
        // (Podemos llamar a calculateIndexRegime que está cacheada)
        const groupRegime = await calculateIndexRegime(idxSym);
        
        if (group.length >= 10) {
          const meanV = group.reduce((sum, item) => sum + item.rsValue, 0) / group.length;
          const stdV = Math.sqrt(group.reduce((sum, item) => sum + Math.pow(item.rsValue - meanV, 2), 0) / group.length) || 1;
          
          const meanP = group.reduce((sum, item) => sum + item.rsPrev, 0) / group.length;
          const stdP = Math.sqrt(group.reduce((sum, item) => sum + Math.pow(item.rsPrev - meanP, 2), 0) / group.length) || 1;

          for (const item of group) {
            const zV = (item.rsValue - meanV) / stdV;
            const zP = (item.rsPrev - meanP) / stdP;
            
            let state = 'Neutral';
            const isRising = zV > zP;
            
            if (zV > 1.5) {
               state = isRising ? 'Very Strong' : 'Strong';
            } else if (zV > 0.5 && zV <= 1.5) {
               state = isRising ? 'Strong & Rising' : 'Strong but Weakening';
            } else if (zV > -0.5 && zV <= 0.5) {
               state = 'Positive';
            } else if (zV > -1.5 && zV <= -0.5) {
               state = isRising ? 'Weak but Recovering' : 'Weak';
            } else if (zV <= -1.5) {
               state = isRising ? 'Weak & Falling' : 'Very Weak';
            }
            
            if (!newRsis.has(item.symbol)) {
               newRsis.set(item.symbol, {});
            }
            const quoteData = newRsis.get(item.symbol);
            quoteData.rs_value = item.rsValue;
            quoteData.rs_previous = item.rsPrev;
            quoteData.rs_state = state;
            quoteData.market_regime = groupRegime;
          }
        } else {
          // Fallback a los estados originales si N < 10
          for (const item of group) {
            let state = 'Neutral';
            if (item.rsValue > 0) {
              state = (item.rsValue > item.rsPrev) ? 'Strong & Rising' : 'Strong but Weakening';
            } else {
              state = (item.rsValue > item.rsPrev) ? 'Weak but Recovering' : 'Weak & Falling';
            }
            if (!newRsis.has(item.symbol)) {
               newRsis.set(item.symbol, {});
            }
            const quoteData = newRsis.get(item.symbol);
            quoteData.rs_value = item.rsValue;
            quoteData.rs_previous = item.rsPrev;
            quoteData.rs_state = state;
            quoteData.market_regime = groupRegime;
          }
        }
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
        // No hacemos 'continue;'. Permitimos que el flujo siga para calcular el OP Score 
        // usando los datos cacheados en la base de datos (dbRow).
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
        if (rsiData.market_regime !== undefined) {
          if (!updateQuery.endsWith(', ') && !updateQuery.endsWith('rs_updated_at') && !updateQuery.endsWith('drawdown_52w') && !updateQuery.endsWith('macd_prev_hist') && !updateQuery.endsWith('rsi_updated_at')) updateQuery += ', ';
          else if (updateQuery.endsWith('rs_updated_at') || updateQuery.endsWith('drawdown_52w') || updateQuery.endsWith('macd_prev_hist') || updateQuery.endsWith('rsi_updated_at')) updateQuery += ', ';
          updateQuery += 'market_regime';
          updatePlaceholders.push('?');
          updateValues.push(rsiData.market_regime);
          onDuplicateUpdate.push('market_regime = VALUES(market_regime)');
        }
      } else {
        updateQuery = updateQuery.replace(/, $/, '');
      }

      // --- OP SCORE CALCULATION ---
      const dbRow = rows.find(r => r.symbol === symbol) || {};
      const finalSetupState = setup !== undefined ? setup.setup_state : dbRow.setup_state;
      const finalFactors = setup !== undefined ? setup.setup_factors : (typeof dbRow.setup_factors === 'string' ? JSON.parse(dbRow.setup_factors) : dbRow.setup_factors) || {};

      let invalidBreakStreak = 0;
      const isBullishSetup = ['bullish_breakout', 'bullish_pullback', 'bullish_reversal_confirmed', 'early_bullish_reversal', 'strong_uptrend', 'strong_uptrend_extended'].includes(finalSetupState);
      if (isBullishSetup) {
        const _price = quote !== undefined ? quote.price : finalFactors.currentPrice;
        const _ema21 = finalFactors.currentEma21;
        const _sma30 = finalFactors.currentSma30;
        const _atr14 = finalFactors.atr14;
        let currentBreach = false;
        if (_price && _ema21 && _sma30 && _atr14 && _price < _ema21 && _price < _sma30) {
          const dist = Math.min(_ema21, _sma30) - _price;
          currentBreach = dist > (0.5 * _atr14);
        }
        const priorStreak = invalidBreakStreakCache.get(symbol) || 0;
        invalidBreakStreak = currentBreach ? priorStreak + 1 : 0;
        invalidBreakStreakCache.set(symbol, invalidBreakStreak);
      }

      const opData = {
        marketRegime: rsiData !== undefined && rsiData.market_regime !== undefined ? rsiData.market_regime : dbRow.market_regime,
        rsValue: rsiData !== undefined && rsiData.rs_value !== undefined ? rsiData.rs_value : dbRow.rs_value,
        rsPrevious: rsiData !== undefined && rsiData.rs_previous !== undefined ? rsiData.rs_previous : dbRow.rs_previous,
        rsState: rsiData !== undefined && rsiData.rs_state !== undefined ? rsiData.rs_state : dbRow.rs_state,
        rsiWeekly: rsiData !== undefined && rsiData.rsi_weekly !== undefined ? rsiData.rsi_weekly : dbRow.rsi_weekly,
        currentRVol: finalFactors.volume?.rvol,
        drawdown52w: rsiData !== undefined && rsiData.drawdown_52w !== undefined ? rsiData.drawdown_52w : dbRow.drawdown_52w,
        rsiDaily: finalFactors.rsiDaily,
        atr14: finalFactors.atr14,
        price: quote !== undefined ? quote.price : finalFactors.currentPrice,
        trend: finalFactors.trend,
        ema21: finalFactors.currentEma21,
        sma30: finalFactors.currentSma30,
        ema200: finalFactors.currentEma200,
        recentCandles: finalFactors.recentCandles,
        ema21Distance: finalFactors.priceAboveEma21Pct,
        ema21DistanceAtr: finalFactors.distToEma21Atr,
        ema21AboveSma30Pct: finalFactors.ema21AboveSma30Pct,
        ema200SlopeDir: finalFactors.ema200SlopeDir,
        macd: finalFactors.macd,
        macdWeekly: rsiData !== undefined && rsiData.macd_weekly !== undefined ? rsiData.macd_weekly : dbRow.macd_weekly,
        macdSignal: rsiData !== undefined && rsiData.macd_signal !== undefined ? rsiData.macd_signal : dbRow.macd_signal,
        macdHist: rsiData !== undefined && rsiData.macd_hist !== undefined ? rsiData.macd_hist : dbRow.macd_hist,
        macdPrevHist: rsiData !== undefined && rsiData.macd_prev_hist !== undefined ? rsiData.macd_prev_hist : dbRow.macd_prev_hist,
        macdPrevWeekly: rsiData !== undefined && rsiData.macd_prev_weekly !== undefined ? rsiData.macd_prev_weekly : dbRow.macd_prev_weekly,
        macdPrevSignal: rsiData !== undefined && rsiData.macd_prev_signal !== undefined ? rsiData.macd_prev_signal : dbRow.macd_prev_signal,
        sectorTrend: finalFactors.sectorTrend !== undefined ? finalFactors.sectorTrend : (dbRow.sector_trend || null),
        daysSinceTrigger: finalFactors.daysSinceTrigger,
        baseLengthDays: finalFactors.baseLengthDays,
        invalidBreakStreak: invalidBreakStreak,
        daysToEarnings: (() => {
          if (!dbRow.next_earnings_date) return null;
          const today = new Date(); today.setHours(0,0,0,0);
          const earningsDate = new Date(dbRow.next_earnings_date); earningsDate.setHours(0,0,0,0);
          const diffMs = earningsDate - today;
          return Math.round(diffMs / (1000 * 60 * 60 * 24));
        })(),
        // EMA21 slope data — usado en early_bullish_reversal y futuros setups
        ema21SlopeDir:   finalFactors.ema21?.slope5Dir  || null,   // 'UP' | 'DOWN' | 'FLAT'
        ema21SlopePct:   finalFactors.ema21?.slope5Pct  ?? null,   // % cambio en 5 velas
        ema21SlopeTrend: finalFactors.ema21?.trend      || null    // 'ACCELERATING' | 'DECELERATING' | 'CONSTANT'
      };

      let opScoreResult = null;
      if (finalSetupState) {
        opScoreResult = opScoreService.calculateOpScore(finalSetupState, opData);
        if (!updateQuery.endsWith(', ') && !updateQuery.endsWith('(')) updateQuery += ', ';
        updateQuery += 'op_score, op_score_conclusions';
        updatePlaceholders.push('?', '?');
        updateValues.push(opScoreResult.score, JSON.stringify(opScoreResult.conclusions));
        onDuplicateUpdate.push('op_score = VALUES(op_score)', 'op_score_conclusions = VALUES(op_score_conclusions)');
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
  const querySymbol = symbol;
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
  try {
    const quotes = await yahooFinance.quote(symbols);
    // Yahoo a veces devuelve q.symbol sin el sufijo '=F' para futuros de commodities
    // (ej: devuelve 'GC' en lugar de 'GC=F'). Usamos el símbolo original de entrada
    // para evitar el mismatch de key al guardar en newQuotes.
    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];
    return quotesArray.map((q, idx) => ({
      symbol: symbols[idx] || q.symbol,
      data: {
        price: q.regularMarketPrice,
        changeAmount: q.regularMarketChange,
        changePercent: q.regularMarketChangePercent
      }
    }));
  } catch (error) {
    throw new Error(`Yahoo Bulk Quote Error - ${error.message}`);
  }
}

/**
 * Wrapper que agrega un timeout a cualquier Promise de Yahoo Finance.
 * Previene que el proceso quede clavado si Yahoo no responde.
 * @param {Promise} promise - La promesa a ejecutar
 * @param {number} ms - Tiempo máximo de espera en milisegundos
 * @param {string} label - Etiqueta para el mensaje de error
 */
function withTimeout(promise, ms, label = 'request') {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms [${label}]`)), ms);
    })
  ]).finally(() => clearTimeout(timer));
}

function computeBaseLengthDays(closes, triggerIdx, resistanceLevel, maxLookback = 90) {
  const floor = resistanceLevel * 0.98;
  for (let i = triggerIdx - 1; i >= Math.max(0, triggerIdx - maxLookback); i--) {
    if (closes[i] >= floor) {
      return triggerIdx - i;
    }
  }
  return maxLookback;
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

  const chartOptions = { period1: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], interval: '1d' };
  let data;
  try {
    // Timeout de 20s: si Yahoo no responde, lanzamos error en lugar de quedar clavados.
    data = await withTimeout(yahooFinance.chart(symbol, chartOptions), 20000, `daily chart ${symbol}`);
  } catch (e) {
    // Los commodities (=F) y símbolos ya con sufijo no necesitan el fallback .BA
    if (!symbol.includes('.') && !symbol.includes('=')) {
      try {
        data = await withTimeout(yahooFinance.chart(symbol + '.BA', chartOptions), 20000, `daily chart ${symbol}.BA`);
      } catch (e2) {
        throw new Error(`Yahoo Chart Error ${e2.message}`);
      }
    } else {
      throw new Error(`Yahoo Chart Error ${e.message}`);
    }
  }

  if (!data || !data.quotes || data.quotes.length === 0) return null;

  let closes = [], highs = [], lows = [], opens = [], volumes = [];
  for (const q of data.quotes) {
    if (q.close !== null && !isNaN(q.close) && q.high !== null && !isNaN(q.high) && q.low !== null && !isNaN(q.low) && q.open !== null && !isNaN(q.open) && q.volume !== null && !isNaN(q.volume)) {
      closes.push(q.close); highs.push(q.high); lows.push(q.low); opens.push(q.open); volumes.push(q.volume);
    }
  }

  // Antes exigía 30. Para EMA200 real (no fallback) conviene un mínimo mayor,
  // pero mantenemos 30 como piso y dejamos que el fallback maneje el resto.
  if (closes.length < 30) return null;

  const ema21Array = calculateEMAArray(closes, 21);
  const sma30Array = calculateSMAArray(closes, 30);
  const ema200Array = calculateEMAArray(closes, 200);
  const rsiArray = calculateRsiArray(closes, 14);
  const macdData = calculateMacdArrays(closes, 12, 26, 9);
  const atrArray = calculateATRArray(highs, lows, closes, 14);
  const volumeSma20Array = calculateSMAArray(volumes, 20);

  const L = closes.length - 1;
  const currentPrice = closes[L];

  const currentEma21 = ema21Array[L];
  const currentSma30 = sma30Array[L];
  const currentEma200 = ema200Array[L];

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
  const prevHist = L >= 1 ? macdData.histLine[L - 1] : null;

  const currentAtr = atrArray[L];

  const currentVolume = volumes[L];
  const currentVolumeSma20 = volumeSma20Array[L];
  const currentRVol = currentVolumeSma20 ? currentVolume / currentVolumeSma20 : null;
  const isAccumulationDay = L > 0 ? (closes[L] > closes[L - 1]) : true;

  const ema21Distance = currentEma21 ? ((currentPrice - currentEma21) / currentEma21) * 100 : null;
  const ema21AboveSma30Pct = (currentEma21 && currentSma30) ? ((currentEma21 - currentSma30) / currentSma30) * 100 : null;

  const getDir = (pct) => pct >= SLOPE_THRESHOLD_PCT ? 'UP' : (pct <= -SLOPE_THRESHOLD_PCT ? 'DOWN' : 'FLAT');

  const ema21Slope5Pct = currentEma21 && prev5Ema21 ? ((currentEma21 / prev5Ema21) - 1) * 100 : 0;
  const ema21Slope10Pct = currentEma21 && prev10Ema21 ? ((currentEma21 / prev10Ema21) - 1) * 100 : 0;
  const ema21Slope20Pct = currentEma21 && prev20Ema21 ? ((currentEma21 / prev20Ema21) - 1) * 100 : 0;

  const ema21Slope5Dir = getDir(ema21Slope5Pct);
  const ema21Slope10Dir = getDir(ema21Slope10Pct);
  const ema21Slope20Dir = getDir(ema21Slope20Pct);
  
  const ema21Rate5 = ema21Slope5Pct / 5;
  const ema21Rate10 = ema21Slope10Pct / 10;
  const ema21Trend = ema21Rate5 > ema21Rate10 ? 'ACCELERATING' : (ema21Rate5 < ema21Rate10 ? 'DECELERATING' : 'CONSTANT');

  const sma30Slope5Pct = currentSma30 && prev5Sma30 ? ((currentSma30 / prev5Sma30) - 1) * 100 : 0;
  const sma30Slope10Pct = currentSma30 && prev10Sma30 ? ((currentSma30 / prev10Sma30) - 1) * 100 : 0;
  const sma30Slope20Pct = currentSma30 && prev20Sma30 ? ((currentSma30 / prev20Sma30) - 1) * 100 : 0;

  const sma30Slope5Dir = getDir(sma30Slope5Pct);
  const sma30Slope10Dir = getDir(sma30Slope10Pct);
  const sma30Slope20Dir = getDir(sma30Slope20Pct);
  
  const sma30Rate5 = sma30Slope5Pct / 5;
  const sma30Rate10 = sma30Slope10Pct / 10;
  const sma30Trend = sma30Rate5 > sma30Rate10 ? 'ACCELERATING' : (sma30Rate5 < sma30Rate10 ? 'DECELERATING' : 'CONSTANT');

  // EMA200 se mueve mucho más lento que EMA21/SMA30 — usamos ventanas más largas
  // (10/20/40 ruedas en vez de 5/10/20) para que la pendiente sea una señal real 
  // y no ruido de corto plazo. Umbral también reducido (0.05% vs 0.20%) porque 
  // el % de cambio esperado en una media de 200 días es mucho menor.
  const EMA200_SLOPE_THRESHOLD_PCT = 0.05;

  const prev10Ema200 = L >= 10 ? ema200Array[L - 10] : null;
  const prev20Ema200 = L >= 20 ? ema200Array[L - 20] : null;
  const prev40Ema200 = L >= 40 ? ema200Array[L - 40] : null;

  const getDir200 = (pct) => pct >= EMA200_SLOPE_THRESHOLD_PCT ? 'UP' 
    : (pct <= -EMA200_SLOPE_THRESHOLD_PCT ? 'DOWN' : 'FLAT');

  let ema200SlopeDir = null;
  let ema200Slope20Pct = null;
  let ema200Slope40Pct = null;

  if (currentEma200 && prev20Ema200) {
    ema200Slope20Pct = ((currentEma200 / prev20Ema200) - 1) * 100;
  }
  if (currentEma200 && prev40Ema200) {
    ema200Slope40Pct = ((currentEma200 / prev40Ema200) - 1) * 100;
  }

  // Exigimos que AMBAS ventanas (20 y 40 ruedas) coincidan en la dirección para 
  // declarar DOWN — evita marcar como "descendente" una media que tuvo una caída 
  // corta hace 3-4 semanas pero ya está girando. Si difieren, es zona de transición 
  // y la tratamos como FLAT (no penalizar en zona ambigua).
  if (closes.length >= 240 && ema200Slope20Pct !== null && ema200Slope40Pct !== null) {
    const dir20 = getDir200(ema200Slope20Pct);
    const dir40 = getDir200(ema200Slope40Pct);
    if (dir20 === 'DOWN' && dir40 === 'DOWN') {
      ema200SlopeDir = 'DOWN';
    } else if (dir20 === 'UP' && dir40 === 'UP') {
      ema200SlopeDir = 'UP';
    } else {
      ema200SlopeDir = 'FLAT';
    }
  }
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
    ema21AboveSma30Pct: ema21AboveSma30Pct !== null ? parseFloat(ema21AboveSma30Pct.toFixed(2)) : null,
    ema200SlopeDir: ema200SlopeDir,
    priceAboveEma21Pct: ema21Distance !== null ? parseFloat(ema21Distance.toFixed(2)) : null,
    atr14: currentAtr ? parseFloat(currentAtr.toFixed(4)) : null,
    distToEma21Atr: currentAtr && currentEma21 ? parseFloat((Math.abs(currentPrice - currentEma21) / currentAtr).toFixed(2)) : null,
    priceAboveEma21: currentEma21 ? currentPrice > currentEma21 : null,
    priceAboveSma30: currentSma30 ? currentPrice > currentSma30 : null,
    rsiDaily: currentRsi,
    macd: {
      current: currentMacd,
      signal: currentSignal,
      hist: currentHist,
      prevMacd: L >= 1 ? macdData.macdLine[L - 1] : null,
      prevSignal: L >= 1 ? macdData.signalLine[L - 1] : null,
      prevHist: prevHist
    },
    pullbackDetected: false,
    reversalEarly: false,
    reversalConfirmed: false,
    lateralDetected: false,
    volume: {
      rvol: currentRVol !== null ? parseFloat(currentRVol.toFixed(2)) : null,
      isAccumulationDay: isAccumulationDay
    },
    currentPrice: currentPrice,
    currentEma21: currentEma21,
    currentSma30: currentSma30,
    currentEma200: currentEma200,
    recentCandles: [] // Llenado dinámicamente
  };

  // Guardar últimas 10 velas para análisis OP Score
  if (L >= 0) {
    const startIdx = Math.max(0, L - 9);
    for (let i = startIdx; i <= L; i++) {
      const isRed = closes[i] < opens[i];
      const rvol = volumeSma20Array[i] ? volumes[i] / volumeSma20Array[i] : null;
      factors.recentCandles.push({
        open: opens[i],
        high: highs[i],
        low: lows[i],
        close: closes[i],
        volume: volumes[i],
        rvol: rvol,
        isRed: isRed,
        isGreen: !isRed
      });
    }
  }

  const isEma21AllUp = ema21Slope5Dir === 'UP' && ema21Slope10Dir === 'UP' && ema21Slope20Dir === 'UP';
  const isSma30AllUp = sma30Slope5Dir === 'UP' && sma30Slope10Dir === 'UP' && sma30Slope20Dir === 'UP';
  const isEma21AllDown = ema21Slope5Dir === 'DOWN' && ema21Slope10Dir === 'DOWN' && ema21Slope20Dir === 'DOWN';
  const isSma30AllDown = sma30Slope5Dir === 'DOWN' && sma30Slope10Dir === 'DOWN' && sma30Slope20Dir === 'DOWN';

  const isPriceAboveEma21 = factors.priceAboveEma21;
  const isPriceAboveSma30 = factors.priceAboveSma30;

  let isUptrend = false;
  let isBearish = false;

  // BULLISH/BEARISH STRUCTURE
  if (currentEma200 && currentEma21 && currentSma30) {
    if (currentEma21 > currentSma30 && currentSma30 > currentEma200) {
      if (isEma21AllUp && isSma30AllUp && ema21AboveSma30Pct >= MIN_SEPARATION_PCT) {
        isUptrend = true;
        factors.trend = 'bullish';
      }
    } else if (currentEma21 < currentSma30 && currentSma30 < currentEma200) {
      if (isEma21AllDown && isSma30AllDown && ((currentSma30 - currentEma200) / currentEma200) * 100 <= -MIN_SEPARATION_PCT) {
        isBearish = true;
        factors.trend = 'bearish';
      }
    }
  } else if (currentEma21 && currentSma30) {
    if (currentEma21 > currentSma30 && isEma21AllUp && isSma30AllUp && ema21AboveSma30Pct >= MIN_SEPARATION_PCT) {
      isUptrend = true;
      factors.trend = 'bullish';
    } else if (currentEma21 < currentSma30 && isEma21AllDown && isSma30AllDown) {
      isBearish = true;
      factors.trend = 'bearish';
    }
  }

  // FIX: manejo seguro de null en la distancia EMA21/SMA30 — antes Math.abs(null) = 0
  // podía marcar lateral falsamente. Ahora, si falta el dato, no se asume lateral por eso.
  const separationTooSmall = ema21AboveSma30Pct !== null
    ? Math.abs(ema21AboveSma30Pct) < MIN_SEPARATION_PCT
    : false;
  const bothSlopesFlat = ema21Slope5Dir === 'FLAT' && sma30Slope5Dir === 'FLAT';

  // FIX: isLateral ahora exige que el precio siga cerca de las medias y que el slope
  // de 10 días no venga en caída — evita clasificar como 'lateral' activos que ya
  // rompieron a la baja pero no cumplen todos los criterios bajistas estrictos, y
  // activos en recuperación donde las medias convergen pero el precio ya se alejó.
  const priceCloseToMAs = ema21Distance !== null ? Math.abs(ema21Distance) < 4.0 : true;
  let isLateral = !isUptrend && !isBearish
    && (separationTooSmall || bothSlopesFlat)
    && priceCloseToMAs
    && ema21Slope10Dir !== 'DOWN';
  if (isLateral) factors.lateralDetected = true;

  // Pullback Logic
  let pullbackConfirmed = false;
  
  // FIX: El pullback exige que la estructura sea de uptrend maduro, pero es
  // tolerante con la caída de la pendiente rápida (5 días) ya que el precio
  // lógicamente retrocede.
  let isUptrendTolerant = false;
  if (currentEma21 && currentSma30) {
    const isEma21TolerantUp = ema21Slope10Dir === 'UP' && ema21Slope20Dir === 'UP';
    const isSma30TolerantUp = sma30Slope10Dir === 'UP' && sma30Slope20Dir === 'UP';
    const isStructureBullish = currentEma200 ? (currentEma21 > currentSma30 && currentSma30 > currentEma200) : (currentEma21 > currentSma30);
    
    if (isStructureBullish && isEma21TolerantUp && isSma30TolerantUp && (ema21AboveSma30Pct !== null && ema21AboveSma30Pct >= MIN_SEPARATION_PCT)) {
      isUptrendTolerant = true;
    }
  }

  if (closes.length >= 15 && currentAtr && isUptrendTolerant) {
    let wasStrongAbove = false;
    for (let i = Math.max(0, L - 12); i <= L - 5; i++) {
      if (sma30Array[i] && closes[i] >= sma30Array[i] * 1.015) {
        wasStrongAbove = true; break;
      }
    }

    let corrected = false;
    for (let i = L - 5; i <= L; i++) {
      if (ema21Array[i] && sma30Array[i] && atrArray[i]) {
        const distEma21 = Math.abs(closes[i] - ema21Array[i]);
        const distSma30 = Math.abs(closes[i] - sma30Array[i]);
        if (distEma21 <= 0.5 * atrArray[i] || distSma30 <= 0.5 * atrArray[i]) {
          corrected = true; break;
        }
      }
    }

    const distToEma21AtrNow = currentAtr ? Math.abs(currentPrice - currentEma21) / currentAtr : null;
    const stillNearEma21 = distToEma21AtrNow !== null && distToEma21AtrNow <= 1.2;

    // A pedido estricto: el precio debe haber rebotado o mantenerse POR ENCIMA de ambas medias.
    const isPriceAboveBoth = isPriceAboveEma21 && isPriceAboveSma30;

    // Nueva regla solicitada: Vela de fortaleza (rebote confirmado hoy)
    // Puede ser una vela verde (cierre > apertura) o que cerró por encima de ayer
    const isStrengthCandle = (closes[L] > opens[L]) || (closes[L] > closes[L - 1]);

    if (wasStrongAbove && corrected && isPriceAboveBoth && stillNearEma21 && isStrengthCandle) {
      pullbackConfirmed = true;
      factors.pullbackDetected = true;

      // Calcular daysSinceTrigger
      let lowestIdx = L;
      for (let i = L - 5; i <= L; i++) {
        if (lows[i] < lows[lowestIdx]) lowestIdx = i;
      }
      let triggerDay = L;
      for (let i = lowestIdx; i <= L; i++) {
        const strengthCandle = (closes[i] > opens[i]) || (closes[i] > closes[i - 1]);
        const priceAboveBoth = closes[i] > ema21Array[i] && closes[i] > sma30Array[i];
        if (priceAboveBoth && strengthCandle) {
          triggerDay = i;
          break;
        }
      }
      factors.daysSinceTrigger = L - triggerDay;
    }
  }

  let reversalEarly = false;
  let reversalConfirmed = false;

  const macdDailyBullish = currentHist !== null && prevHist !== null && currentHist > prevHist;

  // FIX: Al igual que con la reversión confirmada, una reversión temprana debe venir
  // de un contexto de debilidad estructural genuina. Antes, dependía de `isBearish` (que 
  // matemáticamente se cancelaba si el precio rebotaba) o de `isLateral` (que exige pendiente plana).
  const isWeakContextForEarly = isBearish || (currentEma21 < currentSma30 && sma30Slope20Dir === 'DOWN');

  if (isWeakContextForEarly && !pullbackConfirmed) {
    if (isPriceAboveEma21) {
      let improvementSignals = 0;
      if (currentRsi !== null && currentRsi > 45) improvementSignals++;
      if (macdDailyBullish) improvementSignals++;
      if (ema21Slope5Dir === 'UP') improvementSignals++;
      if (ema21Trend === 'ACCELERATING') improvementSignals++;

      // Si el precio cruzó la EMA21 en un contexto bajista/hundido, y al menos 2
      // indicadores de momentum están mejorando, es una reversión temprana.
      if (improvementSignals >= 2) {
        reversalEarly = true;
        factors.reversalEarly = true;

        // Calcular daysSinceTrigger
        let triggerDay = L;
        for (let i = L; i >= L - 5; i--) {
          if (closes[i] > ema21Array[i]) {
            triggerDay = i;
          } else {
            break;
          }
        }
        factors.daysSinceTrigger = L - triggerDay;
      }
    }

    // FIX: Una verdadera reversión exige que el activo venga de un estado genuinamente bajista 
    // (isBearish) o que al menos haya cruzado sus medias a la baja recientemente con pendiente 
    // negativa (EMA21 < SMA30). Un lateral con pendiente temporalmente negativa no califica.
    const isTrueWeakStructure = isBearish || (currentEma21 < currentSma30 && sma30Slope20Dir === 'DOWN');

    if (isTrueWeakStructure && isPriceAboveEma21 && isPriceAboveSma30 && ema21Slope5Dir === 'UP'
      && currentRsi !== null && currentRsi > 50 && macdDailyBullish) {
      reversalConfirmed = true;
      factors.reversalConfirmed = true;

      // Calcular daysSinceTrigger
      let triggerDay = L;
      for (let i = L; i >= L - 5; i--) {
        if (closes[i] > ema21Array[i] && closes[i] > sma30Array[i]) {
          triggerDay = i;
        } else {
          break;
        }
      }
      factors.daysSinceTrigger = L - triggerDay;
    }
  }

  // Breakout Logic (Swing - 20 días)
  let breakoutConfirmed = false;
  if (closes.length >= 21) {
    // Máximo de los últimos 20 días excluyendo hoy
    const max20 = Math.max(...closes.slice(Math.max(0, L - 20), L));
    const isNewHigh = currentPrice > max20;

    // Si rompe un máximo de 20 días con fuerte volumen y está sobre sus medias
    if (isNewHigh && currentRVol !== null && currentRVol >= 1.2 && isAccumulationDay && isPriceAboveEma21 && isPriceAboveSma30) {
      // Para diferenciar de una tendencia alcista ya disparada, comprobamos que 
      // hubo cierta consolidación (el máximo de 20 días no se tocó en los últimos 5 días)
      // O venía de un contexto lateral
      const max5 = Math.max(...closes.slice(Math.max(0, L - 5), L));
      const wasConsolidating = max5 < max20 || isLateral;

      if (wasConsolidating) {
        breakoutConfirmed = true;
        factors.breakoutDetected = true;
        factors.breakoutResistance = max20;
        factors.breakoutLateral = isLateral;

        // Calcular daysSinceTrigger
        let triggerDay = L;
        for (let i = L - 5; i <= L; i++) {
          const max20_i = Math.max(...closes.slice(Math.max(0, i - 20), i));
          if (closes[i] > max20_i) {
            triggerDay = i;
            break;
          }
        }
        factors.daysSinceTrigger = L - triggerDay;
        
        // Calcular duración de la base con el historial completo
        factors.baseLengthDays = computeBaseLengthDays(closes, L, max20, 90);
      }
    }
  }

  // Asignar estado según prioridad
  // FIX: se agrega 'lateral_trend' explícito en la cascada — antes isLateral
  // se calculaba pero nunca decidía el estado final, cayendo siempre a 'neutral'.
  // FIX: pullbackConfirmed ya requiere isUptrend, por lo que no puede "robar" el
  // estado a activos que no son alcistas confirmados.
  // NUEVO: strong_uptrend_extended detecta entradas tardías cuando el precio se alejó
  // demasiado de la EMA21 (> 8% Y > 2.5 ATRs), útil para penalizar en el OP Score.
  let state = 'neutral';
  let verdict = 'Sin setup alcista claro';

  if (breakoutConfirmed) {
    state = 'bullish_breakout';
    verdict = 'Breakout';
  } else if (pullbackConfirmed) {
    state = 'bullish_pullback';
    verdict = 'Pullback';
  } else if (reversalConfirmed) {
    state = 'bullish_reversal_confirmed';
    verdict = 'Reversión con confirmación';
  } else if (reversalEarly) {
    state = 'early_bullish_reversal';
    verdict = 'Reversión temprana';
  } else if (isUptrend) {
    // Si la estructura es alcista pero el precio rompió ambas medias (EMA21 y SMA30),
    // la tendencia de corto plazo está invalidada o en gran peligro.
    if (!factors.priceAboveEma21 && !factors.priceAboveSma30) {
      state = 'neutral';
      verdict = 'Tendencia en peligro';
    } else {
      // Detectar si el precio está demasiado extendido respecto a la EMA21
      const distToEma21AtrExtended = factors.distToEma21Atr;
      const isExtended = ema21Distance !== null && ema21Distance > 8
        && distToEma21AtrExtended !== null && distToEma21AtrExtended > 2.5;

      if (isExtended) {
        state = 'strong_uptrend_extended';
        verdict = 'Alcista Tardío';
      } else {
        state = 'strong_uptrend';
        verdict = 'Alcista';
      }
    }
  } else if (isBearish) {
    // Si la estructura es bajista pero el rebote cruzó por encima de ambas medias 
    // sin llegar a ser una reversión confirmada, el setup bajista se desdibuja.
    if (factors.priceAboveEma21 && factors.priceAboveSma30) {
      state = 'neutral';
      verdict = 'Bajista perdiendo fuerza';
    } else {
      state = 'bearish_trend';
      verdict = 'Bajista';
    }
  } else if (isLateral) {
    state = 'lateral_trend';
    verdict = 'Lateral';
  } else {
    // Si no es Uptrend, ni Bearish, ni Lateral, es una transición o ruido
    if (currentEma200 && currentEma21 && currentSma30) {
      if (currentEma21 < currentSma30) {
        state = 'bearish_transition';
        verdict = 'Transición Bajista';
      } else if (currentEma21 > currentSma30) {
        state = 'bullish_transition';
        verdict = 'Transición Alcista';
      } else {
        state = 'messy_chop';
        verdict = 'Tendencia Indefinida';
      }
    } else {
      state = 'messy_chop';
      verdict = 'Tendencia Indefinida';
    }
  }

  return {
    ema21: currentEma21,
    ema21_distance: ema21Distance,
    setup_state: state,
    setup_verdict: verdict,
    setup_factors: factors
  };
}


const indexCache = new Map();
async function getIndexHistory(indexSymbol) {
  if (!indexSymbol) return null;
  const now = Date.now();
  const cached = indexCache.get(indexSymbol);
  if (cached && (now - cached.timestamp < 24 * 60 * 60 * 1000)) {
    return cached.promise;
  }

  const promise = (async () => {
    try {
      const data = await yahooFinance.chart(indexSymbol, { period1: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], interval: '1wk' });
      if (!data || !data.quotes || data.quotes.length === 0) return null;

      let closesByTime = new Map();
      for (const q of data.quotes) {
        if (q.close !== null && q.close !== undefined && !isNaN(q.close)) {
          // Utilizamos una aproximación semanal (ej. agrupar por inicio de semana o simplemente día)
          // Yahoo a veces devuelve timestamps ligeramente distintos, redondeamos a inicio de día UTC
          const date = new Date(q.date);
          date.setUTCHours(0, 0, 0, 0);
          closesByTime.set(date.getTime(), q.close);
        }
      }
      return closesByTime;
    } catch (e) {
      logger.error('IndexHistory', `Error fetching index ${indexSymbol}: ${e.message}`);
      return null;
    }
  })();

  indexCache.set(indexSymbol, { timestamp: now, promise });
  return promise;
}

const indexRegimeCache = new Map();
async function calculateIndexRegime(indexSymbol) {
  if (!indexSymbol) return null;
  const now = Date.now();
  const cached = indexRegimeCache.get(indexSymbol);
  if (cached && (now - cached.timestamp < 12 * 60 * 60 * 1000)) {
    return cached.regime;
  }

  const history = await getIndexHistory(indexSymbol);
  if (!history) return 'NEUTRAL';

  const sortedTimestamps = Array.from(history.keys()).sort((a, b) => a - b);
  const closes = sortedTimestamps.map(t => history.get(t));

  if (closes.length < 30) return 'NEUTRAL';

  const ema30Array = calculateEMAArray(closes, 30);
  const L = closes.length - 1;
  const currentPrice = closes[L];
  const currentEma30 = ema30Array[L];
  const prev5Ema30 = L >= 5 ? ema30Array[L - 5] : ema30Array[0];
  const prev10Ema30 = L >= 10 ? ema30Array[L - 10] : ema30Array[0];

  const getDir = (pct) => pct >= 0.20 ? 'UP' : (pct <= -0.20 ? 'DOWN' : 'FLAT');
  const ema30Slope5Pct = currentEma30 && prev5Ema30 ? ((currentEma30 / prev5Ema30) - 1) * 100 : 0;
  const ema30Slope10Pct = currentEma30 && prev10Ema30 ? ((currentEma30 / prev10Ema30) - 1) * 100 : 0;
  const ema30Slope5Dir = getDir(ema30Slope5Pct);
  const ema30Slope10Dir = getDir(ema30Slope10Pct);

  let regime = 'NEUTRAL';
  if (currentEma30) {
    if (currentPrice > currentEma30 && ema30Slope5Dir === 'UP' && ema30Slope10Dir === 'UP') {
      regime = 'BULLISH';
    } else if (currentPrice < currentEma30 && ema30Slope5Dir === 'DOWN' && ema30Slope10Dir === 'DOWN') {
      regime = 'BEARISH';
    }
  }

  indexRegimeCache.set(indexSymbol, { timestamp: now, regime });
  return regime;
}

async function calculateWeeklyIndicators(symbol, indexSymbol = null, rsiPeriod = 14) {
  let data;
  try {
    // Timeout de 20s: si Yahoo no responde, lanzamos error en lugar de quedar clavados.
    data = await withTimeout(
      yahooFinance.chart(symbol, { period1: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], interval: '1wk' }),
      20000,
      `weekly chart ${symbol}`
    );
  } catch (e) {
    throw new Error(`Yahoo Chart Error ${e.message}`);
  }

  if (!data || !data.quotes || data.quotes.length === 0) return null;

  let closes = [];
  let highs = [];
  let validTimestamps = [];

  const lastTimestamp = new Date(data.quotes[data.quotes.length - 1].date).getTime();
  let endIdx = data.quotes.length;
  if (Date.now() < lastTimestamp + (7 * 24 * 60 * 60 * 1000)) {
    endIdx = data.quotes.length - 1;
  }

  for (let i = 0; i < endIdx; i++) {
    const q = data.quotes[i];
    if (q.close !== null && q.close !== undefined && !isNaN(q.close) && q.high !== null && q.high !== undefined && !isNaN(q.high)) {
      closes.push(q.close);
      highs.push(q.high);

      const date = new Date(q.date);
      date.setUTCHours(0, 0, 0, 0);
      validTimestamps.push(date.getTime());
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

  // FIX: Usar el helper calculateRsiArray en lugar de duplicar el cálculo inline.
  if (closes.length > rsiPeriod) {
    const rsiArr = calculateRsiArray(closes, rsiPeriod);
    if (rsiArr.length >= 2) {
      const curr = parseFloat(rsiArr[rsiArr.length - 1].toFixed(2));
      const prev = parseFloat(rsiArr[rsiArr.length - 2].toFixed(2));
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

async function resetDailyData() {
  const db = getPool();
  try {
    logger.info('MarketSync', 'Midnight reset: clearing setups, EMAs, RSIs, RS and OP Scores...');
    await db.execute(`
      UPDATE market_snapshot 
      SET ema_updated_at = NULL, 
          rsi_updated_at = NULL, 
          rs_updated_at  = NULL,
          setup_state = NULL, 
          op_score = NULL,
          setup_verdict = NULL,
          setup_factors = NULL,
          op_score_conclusions = NULL,
          market_regime = NULL
    `);
    logger.info('MarketSync', 'Midnight reset complete. Next sync will recalculate everything.');
  } catch (error) {
    logger.error('MarketSync', `Error in midnight reset: ${error.message}`);
  }
}

module.exports = {
  runSync,
  calculateWeeklyIndicators,
  calculateDailySetup,
  resetDailyData
};
