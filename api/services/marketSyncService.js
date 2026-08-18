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
        ms.ema_updated_at
      FROM tracked_symbols ts
      LEFT JOIN market_snapshot ms ON ts.symbol = ms.symbol
      WHERE ts.enabled = 1
    `);

    const now = new Date();
    const symbolsToUpdate = [];
    const symbolsForEma = [];
    
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

      // Necesita actualizar EMA? (cada 12 horas)
      if (!row.ema_updated_at || (now.getTime() - new Date(row.ema_updated_at).getTime()) > 12 * 60 * 60 * 1000) {
        symbolsForEma.push(row.symbol);
      }
    }

    if (symbolsToUpdate.length === 0 && symbolsForEma.length === 0) {
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
      const nyTime = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
      const isWeekend = nyTime.getDay() === 0 || nyTime.getDay() === 6;
      const hour = nyTime.getHours();
      const isMarketOpen = !isWeekend && (hour >= 9 && hour <= 16);
      logger.info('MarketSync', `Market status: ${isMarketOpen ? 'OPEN' : 'CLOSED'} | NY Time: ${nyTime.getHours()}:${nyTime.getMinutes().toString().padStart(2,'0')} | Price TTL: 1m/5m | EMA TTL: 12h`);
      
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
            const ema = await calculateEma21(sym);
            if (ema !== null) {
              newEmas.set(sym, ema);
              emaSuccess++;
            } else {
              emaFailed++;
            }
          } catch (e) {
            emaFailed++;
            logger.debug('EMA21', `Failed for ${sym}: ${e.message}`);
          }
        });
        await Promise.allSettled(promises);
      }
    }
    timeEma = performance.now() - emaStartTime;

    // 5. Consolidar y guardar en BD
    const dbStartTime = performance.now();
    // Iteramos sobre todos los símbolos procesados (precios o EMAs) O que fallaron
    const allSymbolsTouched = new Set([...symbolsToUpdate, ...symbolsForEma]);
    let dbUpdated = 0;

    // Preparar transacciones o ejecuciones individuales
    for (const symbol of allSymbolsTouched) {
      const quote = newQuotes.get(symbol);
      const ema = newEmas.get(symbol);

      if (!quote && ema === undefined) {
         if (symbolsToUpdate.includes(symbol)) {
            // Este símbolo falló en actualizar su precio en todos los proveedores
            try {
              await db.execute(
                'INSERT INTO market_snapshot (symbol, status, updated_at) VALUES (?, "ERROR", NOW()) ON DUPLICATE KEY UPDATE status = "ERROR", updated_at = NOW()', 
                [symbol]
              );
            } catch(e) {
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

      if (ema !== undefined) {
        // Obtenemos el precio para calcular la distancia. Puede venir del quote fresco o buscar en db
        let currentPrice = quote ? quote.price : null;
        if (!currentPrice) {
           const [[existing]] = await db.query('SELECT price FROM market_snapshot WHERE symbol = ?', [symbol]);
           if (existing && existing.price) currentPrice = existing.price;
        }

        if (currentPrice && ema) {
          const distance = ((currentPrice - ema) / ema) * 100;
          updateQuery += 'ema21_distance, ema_updated_at';
          updatePlaceholders.push('?', 'NOW()');
          updateValues.push(distance);
          onDuplicateUpdate.push('ema21_distance = VALUES(ema21_distance)', 'ema_updated_at = VALUES(ema_updated_at)');
        } else {
          // Remover la coma extra si no insertamos ema
          updateQuery = updateQuery.replace(/, $/, '');
        }
      } else {
        updateQuery = updateQuery.replace(/, $/, '');
      }

      if (onDuplicateUpdate.length > 0) {
        const sql = `${updateQuery}) VALUES (?${updatePlaceholders.length > 0 ? ',' + updatePlaceholders.join(',') : ''}) ON DUPLICATE KEY UPDATE ${onDuplicateUpdate.join(', ')}`;
        try {
          await db.execute(sql, updateValues);
          dbUpdated++;
        } catch(e) {
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
        stale: symbolsToUpdate.length,
        fresh: rows.length - symbolsToUpdate.length,
        duration: totalDuration
      });

      if (finnhubCount > 0) {
         logger.info('Finnhub', `Requests: ${finnhubCount} | Success: ${finnhubSuccess} | Failed: ${finnhubFailed} | Rate Limited: ${finnhubRateLimited} | Duration: ${(timeFinnhub/1000).toFixed(2)}s`);
      }
      
      if (yahooCount > 0) {
         logger.info('Yahoo', `Symbols: ${yahooCount} | HTTP requests: ${yahooHttpRequests} | Success: ${yahooSuccess} | Failed: ${yahooFailed} | Duration: ${(timeYahoo/1000).toFixed(2)}s`);
      }
      
      if (symbolsForEma.length > 0) {
         logger.info('EMA21', `Updated: ${emaSuccess} | Failed: ${emaFailed} | Duration: ${(timeEma/1000).toFixed(2)}s`);
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
    try { errorText = await response.text(); } catch(e) {}
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

async function calculateEma21(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=3mo`;
  
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });

  if (!response.ok) throw new Error(`Yahoo Chart HTTP ${response.status}`);
  
  const data = await response.json();
  
  if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
    return null;
  }

  const result = data.chart.result[0];
  if (!result.indicators || !result.indicators.quote || result.indicators.quote.length === 0) {
    return null;
  }

  const closes = result.indicators.quote[0].close.filter(c => c !== null && !isNaN(c));
  if (closes.length < 21) return null;

  const N = 21;
  const k = 2 / (N + 1);
  
  // SMA inicial
  let sum = 0;
  for (let i = 0; i < N; i++) {
    sum += closes[i];
  }
  let ema = sum / N;
  
  // Aplicar EMA
  for (let i = N; i < closes.length; i++) {
    ema = (closes[i] * k) + (ema * (1 - k));
  }

  return ema;
}

module.exports = {
  runSync
};
