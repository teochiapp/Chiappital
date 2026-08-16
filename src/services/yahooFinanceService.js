// services/yahooFinanceService.js - Servicio para Yahoo Finance API (GRATUITA)

import loggerService from './loggerService';

// En desarrollo usamos el proxy del dev server de CRA (src/setupProxy.js)
// para evitar CORS. En producción usamos proxies públicos en cascada.
const IS_DEV = process.env.NODE_ENV === 'development';

class YahooFinanceService {
  constructor() {
    this.baseURL = 'https://query1.finance.yahoo.com/v8/finance';
    this.devProxyBase = '/api/yahoo'; // mapeado en setupProxy.js → query1.finance.yahoo.com/v8/finance
    this.cache = new Map();
    this.queuePromise = Promise.resolve(); // Cola para asegurar requests secuenciales
    this.lastCallTime = 0;
    this.minIntervalBetweenCalls = IS_DEV ? 500 : 1500; // 500ms local, 1500ms prod para no enojar a proxies públicos

    // Proxies CORS públicos — se usan en cascada en producción.
    // Solo se intentan si el proxy de dev o el proxy anterior fallaron.
    this.corsProxies = [
      (url) => `/proxy.php?url=${encodeURIComponent(url)}`,
      (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
      (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
      (url) => `https://thingproxy.freeboard.io/fetch/${url}`,
      (url) => `https://cors-anywhere.herokuapp.com/${url}`,
    ];
  }

  // Rate limiting usando cola (para evitar ráfagas simultáneas)
  async waitForRateLimit() {
    const executeWait = async () => {
      const now = Date.now();
      const timeSinceLastCall = now - this.lastCallTime;
      
      if (timeSinceLastCall < this.minIntervalBetweenCalls) {
        const waitTime = this.minIntervalBetweenCalls - timeSinceLastCall;
        loggerService.warn(`[Yahoo Queue] Pausando ${waitTime}ms para respetar intervalo...`, 'PROXY');
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      this.lastCallTime = Date.now();
    };

    this.queuePromise = this.queuePromise.then(executeWait).catch(() => null);
    await this.queuePromise;
  }

  // Verificar cache en memoria (sesión)
  getFromCache(key, ttlMs = 60000) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttlMs) {
      return cached.data;
    }
    return null;
  }

  // Guardar en cache en memoria
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Verificar cache persistente en sessionStorage (sobrevive F5)
  getFromSessionCache(key, ttlMs) {
    try {
      const raw = sessionStorage.getItem(`yf_${key}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp < ttlMs) {
        return parsed.data;
      }
    } catch (e) {/* ignorar */}
    return null;
  }

  // Guardar en sessionStorage
  setSessionCache(key, data) {
    try {
      sessionStorage.setItem(`yf_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (e) {/* ignorar si está lleno */}
  }

  // Obtiene la URL correcta del endpoint según el entorno:
  // - dev  → /api/yahoo/chart/AAPL  (ruteado por setupProxy.js sin CORS)
  // - prod → URL pública de Yahoo (se pasa a fetchWithCorsProxies)
  getYahooPath(path) {
    if (IS_DEV) {
      return `${this.devProxyBase}${path}`;
    }
    return `${this.baseURL}${path}`;
  }

  // Fetch a través de múltiples proxies CORS en cascada (solo producción).
  // En dev este método no debería llamarse porque getYahooPath ya da una URL local.
  async fetchWithCorsProxies(targetUrl) {
    const symbol = targetUrl.split('/').pop().split('?')[0]; // AAPL/KO
    
    for (let i = 0; i < this.corsProxies.length; i++) {
      const proxyUrl = this.corsProxies[i](targetUrl);
      const startTime = Date.now();
      
      // Nombre limpio del proxy
      let proxyName = 'Unknown';
      if (proxyUrl.startsWith('/proxy.php')) proxyName = 'LocalServerProxy';
      else if (proxyUrl.includes('codetabs')) proxyName = 'CodeTabs';
      else if (proxyUrl.includes('allorigins')) proxyName = 'AllOrigins';
      else if (proxyUrl.includes('corsproxy.io')) proxyName = 'CorsProxy.io';
      else if (proxyUrl.includes('thingproxy')) proxyName = 'ThingProxy';
      else if (proxyUrl.includes('cors-anywhere')) proxyName = 'CorsAnywhere';

      try {
        loggerService.info(`[Intento ${i}] Consultando ${symbol} vía CORS Proxy ${proxyName}...`, 'PROXY');
        const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
        const timeMs = Date.now() - startTime;
        
        if (response.ok) {
          loggerService.recordProxyCall(i, proxyName, true, timeMs);
          loggerService.success(`[Proxy ${proxyName}] Respondió OK en ${timeMs}ms para ${symbol}`, 'PROXY');
          return response;
        }
        
        loggerService.recordProxyCall(i, proxyName, false, timeMs);
        loggerService.warn(`Proxy ${proxyName} devolvió HTTP ${response.status} para ${symbol}`, 'PROXY');
      } catch (err) {
        const timeMs = Date.now() - startTime;
        loggerService.recordProxyCall(i, proxyName, false, timeMs);
        loggerService.warn(`Proxy ${proxyName} falló para ${symbol}: ${err.message} (${timeMs}ms)`, 'PROXY');
      }
    }
    
    loggerService.error(`Todos los proxies CORS fallaron para: ${targetUrl}`, 'PROXY');
    throw new Error('Todos los proxies CORS fallaron para: ' + targetUrl);
  }

  // Helper para mapear criptomonedas y otros símbolos especiales para Yahoo Finance
  _mapSymbol(symbol) {
    if (!symbol) return symbol;
    const cryptoMap = {
      'BTC': 'BTC-USD',
      'ETH': 'ETH-USD',
      'SOL': 'SOL-USD',
      'ADA': 'ADA-USD',
      'XRP': 'XRP-USD',
      'USDT': 'USDT-USD',
      'BRKB': 'BRK-B',
      'BRK.B': 'BRK-B',
      'SMSN': 'SMSN.IL'
    };
    return cryptoMap[symbol.toUpperCase()] || symbol;
  }

  // Fetch universal: dev usa proxy local, prod usa cascada pública.
  // Nunca hace fetch directo a Yahoo Finance (siempre falla por CORS en browser).
  async fetchYahoo(path) {
    if (IS_DEV) {
      // El dev server de CRA reescribe /api/yahoo → query1.finance.yahoo.com/v8/finance
      const devUrl = `${this.devProxyBase}${path}`;
      const res = await fetch(devUrl, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`HTTP ${res.status} (dev proxy)`);
      // Verificar que la respuesta sea JSON y no HTML (bot-detection de Yahoo)
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json') && !ct.includes('text/plain')) {
        const preview = await res.text();
        throw new Error(`Yahoo devolvió contenido no-JSON (${ct}). Reiniciá el servidor. Preview: ${preview.slice(0, 80)}`);
      }
      return res;
    }
    // Producción: ir directo a proxies públicos (Yahoo bloquea fetch directo por CORS)
    const targetUrl = `${this.baseURL}${path}`;
    return this.fetchWithCorsProxies(targetUrl);
  }

  // Obtener cotización en tiempo real
  async getQuote(symbol) {
    const cacheKey = `quote_${symbol}`;
    const QUOTE_TTL = 4 * 60 * 60 * 1000; // 4 horas

    // Nivel 1: cache en memoria
    const memCached = this.getFromCache(cacheKey, QUOTE_TTL);
    if (memCached) {
      console.log(`📦 [MEM] Quote para ${symbol} desde caché en memoria`);
      return memCached;
    }

    // Nivel 2: sessionStorage (sobrevive F5)
    const sessionCached = this.getFromSessionCache(cacheKey, QUOTE_TTL);
    if (sessionCached) {
      console.log(`📦 [SESSION] Quote para ${symbol} desde sessionStorage`);
      this.setCache(cacheKey, sessionCached);
      return sessionCached;
    }

    try {
      await this.waitForRateLimit();

      const mappedSymbol = this._mapSymbol(symbol);
      // Usamos interval=1d en lugar de 5m/1m para evitar errores 404 absolutos en acciones de bajo volumen (ej: DESP, ADRs, WBA, MMC)
      const res = await this.fetchYahoo(`/chart/${mappedSymbol}?interval=1d&range=1d`);
      const data = await res.json();

      if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
        throw new Error('No data available for this symbol');
      }

      const result = data.chart.result[0];
      const meta = result.meta;

      const prevClose = meta.chartPreviousClose || meta.previousClose;
      const quote = {
        symbol: symbol,
        price: meta.regularMarketPrice || prevClose,
        change: meta.regularMarketPrice - prevClose,
        changePercent: ((meta.regularMarketPrice - prevClose) / prevClose) * 100,
        high: meta.regularMarketDayHigh,
        low: meta.regularMarketDayLow,
        open: meta.regularMarketOpen || prevClose,
        previousClose: prevClose,
        timestamp: meta.regularMarketTime
      };

      // Guardar en ambos niveles de caché
      this.setCache(cacheKey, quote);
      this.setSessionCache(cacheKey, quote);
      console.log(`✅ Yahoo Finance - Precio obtenido para ${symbol}: $${quote.price}`);

      return quote;
    } catch (error) {
      console.error(`❌ Yahoo Finance - Error fetching quote for ${symbol}:`, error);
      throw error;
    }
  }

  // Obtener datos históricos (candlesticks)
  // Cache en dos niveles:
  //  1. Memoria (in-process, ultra-rápido)
  //  2. sessionStorage (sobrevive F5 dentro de la misma pestaña)
  async getCandles(symbol, interval = '1d', range = '3mo') {
    const cacheKey = `candles_${symbol}_${interval}_${range}`;
    const SESSION_TTL = 12 * 60 * 60 * 1000; // 12 horas

    // Nivel 1: cache en memoria
    const memCached = this.getFromCache(cacheKey, SESSION_TTL);
    if (memCached) {
      console.log(`📦 [MEM] Candles para ${symbol} desde caché en memoria`);
      return memCached;
    }

    // Nivel 2: sessionStorage (sobrevive F5)
    const sessionCached = this.getFromSessionCache(cacheKey, SESSION_TTL);
    if (sessionCached) {
      console.log(`📦 [SESSION] Candles para ${symbol} desde sessionStorage`);
      this.setCache(cacheKey, sessionCached); // re-poblar memoria
      return sessionCached;
    }

    try {
      await this.waitForRateLimit();

      const mappedSymbol = this._mapSymbol(symbol);
      const res = await this.fetchYahoo(`/chart/${mappedSymbol}?interval=${interval}&range=${range}`);
      const data = await res.json();
      
      if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
        throw new Error('No data available for this symbol');
      }

      const result = data.chart.result[0];
      const timestamps = result.timestamp;
      const quotes = result.indicators.quote[0];
      
      const candles = timestamps.map((timestamp, index) => ({
        timestamp,
        open: quotes.open[index],
        high: quotes.high[index],
        low: quotes.low[index],
        close: quotes.close[index],
        volume: quotes.volume[index]
      }));

      // Guardar en ambos niveles de caché
      this.setCache(cacheKey, candles);
      this.setSessionCache(cacheKey, candles);
      
      return candles;
    } catch (error) {
      console.error(`❌ Yahoo Finance - Error fetching candles for ${symbol}:`, error);
      throw error;
    }
  }

  // Obtener múltiples cotizaciones
  async getMultipleQuotes(symbols) {
    try {
      const results = [];
      
      for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i];
        try {
          const quote = await this.getQuote(symbol);
          results.push({
            symbol,
            data: quote,
            error: null
          });
        } catch (error) {
          console.warn(`⚠️ Yahoo Finance - Error obteniendo datos para ${symbol}:`, error.message);
          results.push({
            symbol,
            data: null,
            error: error.message
          });
        }
        
        // Pausa entre símbolos
        if (i < symbols.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      return results;
    } catch (error) {
      console.error('❌ Yahoo Finance - Error fetching multiple quotes:', error);
      throw error;
    }
  }

  // Obtener cotizaciones en bloque (solo Yahoo Finance v7)
  async getBulkQuotes(symbols) {
    try {
      const results = [];
      const chunkSize = 50; // Yahoo suele permitir hasta 200, usamos 50 por seguridad
      
      for (let i = 0; i < symbols.length; i += chunkSize) {
        const chunk = symbols.slice(i, i + chunkSize);
        
        // Ajustar sufijos para Yahoo Finance si es necesario (ej: BMA -> BMA, YPF -> YPF)
        const mappedChunk = chunk.map(sym => this._mapSymbol(sym));
        const query = mappedChunk.join(',');
        
        await this.waitForRateLimit();
        
        // Usar fetchYahoo adaptado para v7
        let response;
        if (IS_DEV) {
          const devUrl = `/api/yahoo-v7/quote?symbols=${query}`;
          response = await fetch(devUrl, { signal: AbortSignal.timeout(10000) });
        } else {
          const targetUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${query}`;
          response = await this.fetchWithCorsProxies(targetUrl);
        }
        
        if (response && response.ok) {
          const data = await response.json();
          if (data.quoteResponse && data.quoteResponse.result) {
            data.quoteResponse.result.forEach(q => {
              // Buscar el symbol original basado en el mapeado
              const originalIndex = mappedChunk.indexOf(q.symbol);
              const originalSymbol = originalIndex !== -1 ? chunk[originalIndex] : q.symbol;
              results.push({
                symbol: originalSymbol,
                data: {
                  price: q.regularMarketPrice,
                  change: q.regularMarketChange,
                  changePercent: q.regularMarketChangePercent
                },
                error: null
              });
            });
          }
        }
      }
      
      // Mapear los resultados al orden y formato esperado
      return symbols.map(symbol => {
        const found = results.find(r => r.symbol === symbol || r.symbol.startsWith(symbol));
        return {
          symbol,
          data: found ? found.data : null,
          error: found ? null : 'No data'
        };
      });

    } catch (error) {
      console.error('❌ Yahoo Finance - Error fetching bulk quotes:', error);
      throw error;
    }
  }

  // Buscar símbolos
  async searchSymbol(query) {
    try {
      const cacheKey = `search_${query}`;
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      await this.waitForRateLimit();

      const response = await fetch(
        `${this.baseURL}/search?q=${query}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      const results = data.quotes.map(item => ({
        symbol: item.symbol,
        name: item.longname || item.shortname,
        type: item.quoteType,
        exchange: item.exchange
      }));

      this.setCache(cacheKey, results);
      
      return results;
    } catch (error) {
      console.error('❌ Yahoo Finance - Error searching symbols:', error);
      throw error;
    }
  }
}

// Crear instancia singleton
const yahooFinanceService = new YahooFinanceService();

export default yahooFinanceService;
