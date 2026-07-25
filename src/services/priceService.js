import { priceConfig, buildPriceUrl, extractPriceFromResponse } from '../config/priceConfig';
import yahooFinanceService from './yahooFinanceService';
import loggerService from './loggerService';

// Variables globales para rate-limiting de Twelve Data
let lastTwelveDataCall = 0;
const TWELVE_DATA_RATE_LIMIT_MS = 8000; // 8 segundos entre llamadas para respetar 8/minuto
let twelveDataQueuePromise = Promise.resolve();

class PriceService {
  constructor() {
    this.config = priceConfig;
    this.cache = new Map(); // Cache para evitar muchas llamadas
    this.cacheExpiry = 4 * 60 * 60 * 1000; // 4 horas de cache (suficiente para trading diario)
    this.pendingRequests = new Map(); // Para evitar requests duplicados
    
    console.log('🔧 PriceService inicializado con:', {
      provider: this.config.provider,
      hasApiKey: !!this.config.apiKey && this.config.apiKey !== 'demo',
      gracefulDegradation: this.config.gracefulDegradation,
      cacheExpiry: '4 horas'
    });
  }

  // Método genérico para obtener precio actual
  async getCurrentPrice(symbol) {
    const cacheKey = symbol.toUpperCase();
    
    try {
      // Si está en modo demo, generar precio mock directamente
      if (this.config.demoMode) {
        console.log(`🎭 Demo mode enabled - generating mock price for ${symbol}`);
        const mockPrice = this.generateMockPrice(symbol);
        console.log(`🎭 Mock price for ${symbol}: $${mockPrice}`);
        return mockPrice;
      }
      
      // Verificar cache primero (memoria + localStorage)
      const cached = this.getPriceFromCache(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        const minutesOld = Math.round((Date.now() - cached.timestamp) / (1000 * 60));
        const priceType = cached.isMock ? 'mock' : (cached.isDelayed ? 'delayed' : 'real');
        loggerService.incrementCacheHit();
        loggerService.info(`[HIT] Precio de ${symbol}: $${cached.price} (${minutesOld} min, ${priceType})`, 'CACHE');
        return cached.price;
      }

      loggerService.incrementCacheMiss();

      // Verificar si ya hay una request pendiente para este símbolo
      if (this.pendingRequests.has(cacheKey)) {
        loggerService.info(`Precio para ${symbol} ya está en curso, esperando...`, 'API');
        return await this.pendingRequests.get(cacheKey);
      }

      console.log(`🔍 Obteniendo precio para ${symbol}`);
      
      // Crear promesa para la request y guardarla
      const requestPromise = this.fetchPriceWithFallback(symbol, cacheKey);

      // Guardar la promesa como request pendiente
      this.pendingRequests.set(cacheKey, requestPromise);
      
      return await requestPromise;
    } catch (error) {
      console.error(`❌ Error getting price for ${symbol}:`, error);
      
      // Si gracefulDegradation está activado, retornar null en lugar de mock
      if (this.config.gracefulDegradation) {
        console.log(`⚠️ Graceful degradation activado - retornando null para ${symbol}`);
        return null;
      }
      
      // Generar precio mock en caso de error
      loggerService.warn(`Fallo al obtener precio real para ${symbol}. Generando simulación.`, 'API');
      const mockPrice = this.generateMockPrice(symbol);
      
      // Guardar precio mock en cache
      this.savePriceToCache(cacheKey, {
        price: mockPrice,
        timestamp: Date.now(),
        isMock: true
      });
      
      return mockPrice;
    }
  }

  // Método con fallback en cascada: Finnhub -> Yahoo (si se configuró) -> null/mock
  async fetchPriceWithFallback(symbol, cacheKey) {
    let lastError = null;

    // Intentar con Finnhub primero (si no está en demoMode)
    if (!this.config.demoMode && this.config.provider === 'finnhub') {
      try {
        loggerService.info(`Solicitando precio de ${symbol} a Finnhub...`, 'API');
        const price = await this.fetchFromFinnhub(symbol);
        this.savePriceToCache(cacheKey, {
          price,
          timestamp: Date.now(),
          isDelayed: false
        });
        this.pendingRequests.delete(cacheKey);
        loggerService.success(`[Finnhub] Precio ${symbol}: $${price}`, 'API');
        return price;
      } catch (error) {
        lastError = error;
        loggerService.warn(`Finnhub falló para ${symbol}: ${error.message}`, 'API');
      }
    }

    // Intentar con Yahoo Finance
    try {
      loggerService.info(`[FALLBACK] Solicitando cotización de ${symbol} a Yahoo Finance...`, 'API');
      const quote = await yahooFinanceService.getQuote(symbol);
      if (quote?.price) {
        const price = quote.price;
        this.savePriceToCache(cacheKey, {
          price,
          timestamp: Date.now(),
          isDelayed: true
        });
        this.pendingRequests.delete(cacheKey);
        loggerService.success(`[Yahoo] Precio ${symbol}: $${price} (Demorado)`, 'API');
        return price;
      }
    } catch (error) {
      lastError = error;
      loggerService.warn(`Yahoo Finance falló para ${symbol}: ${error.message}`, 'API');
    }

    this.pendingRequests.delete(cacheKey);
    throw lastError || new Error(`No se pudo obtener precio para ${symbol}`);
  }

  // Fetch desde Finnhub
  async fetchFromFinnhub(symbol) {
    const url = buildPriceUrl(symbol, 'finnhub', this.config.apiKey);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const price = extractPriceFromResponse(data, 'finnhub');
    
    if (!price || isNaN(price) || price <= 0) {
      throw new Error('Invalid price data');
    }
    
    return price;
  }

  // Método para obtener múltiples precios de una vez
  async getMultiplePrices(symbols) {
    const promises = symbols.map(symbol => this.getCurrentPrice(symbol));
    const results = await Promise.allSettled(promises);
    
    const prices = {};
    symbols.forEach((symbol, index) => {
      if (results[index].status === 'fulfilled') {
        prices[symbol.toUpperCase()] = results[index].value;
      } else {
        prices[symbol.toUpperCase()] = null;
      }
    });

    return prices;
  }

  // Generar precio simulado para demo
  generateMockPrice(symbol) {
    // Precios base simulados para diferentes símbolos
    const basePrices = {
      // ETFs
      'SPY': 450,
      'QQQ': 380,
      'DIA': 350,
      'IWM': 200,
      'VTI': 240,
      'VOO': 420,
      'TQQQ': 120,
      'PSQ': 12,
      // US Stocks
      'AAPL': 150,
      'GOOGL': 130,
      'MSFT': 300,
      'TSLA': 200,
      'AMZN': 120,
      'NVDA': 400,
      'META': 250,
      // ADRs Argentinos
      'YPF': 18,
      'PAM': 12,
      'BMA': 20,
      'GGAL': 13,
      'SUPV': 5,
      'TEO': 6,
      'CEPU': 10,
      'TX': 40,
      'LOMA': 8,
      'TGS': 9,
      'EDN': 4,
      'DESP': 10,
      'MELI': 1200,
      'IRS': 7,
      // Brasil ADR
      'PBR': 15,
      // Genérico
      'VALE': 14,
      'PETR4': 7,
      'ITUB': 6,
      'BBDC4': 4,
      'ABEV': 3
    };
    
    const upperSymbol = symbol.toUpperCase();
    const basePrice = basePrices[upperSymbol] || 100;
    // Agregar variación aleatoria de ±5%
    const variation = (Math.random() - 0.5) * 0.1; // -5% a +5%
    const mockPrice = basePrice * (1 + variation);
    
    console.log(`🎭 Precio simulado para ${symbol}: $${mockPrice.toFixed(2)}`);
    return parseFloat(mockPrice.toFixed(2));
  }

  // Método de utilidad para calcular ganancia/pérdida no realizada
  calculateUnrealizedPnL(entryPrice, currentPrice, tradeType) {
    if (!currentPrice || !entryPrice) return 0;

    let pnlPercent = 0;
    if (tradeType === 'buy') {
      pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
    } else { // sell (short)
      pnlPercent = ((entryPrice - currentPrice) / entryPrice) * 100;
    }

    return pnlPercent;
  }

  // Limpiar cache manualmente si es necesario
  clearCache() {
    this.cache.clear();
    // Limpiar también las entradas de localStorage para precios
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('price_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {}
  }

  // Helpers para caché persistente de precios
  getPriceFromCache(cacheKey) {
    let cached = this.cache.get(cacheKey);
    if (!cached) {
      try {
        const stored = localStorage.getItem(`price_${cacheKey}`);
        if (stored) {
          cached = JSON.parse(stored);
          this.cache.set(cacheKey, cached); // sincronizar a memoria
        }
      } catch (e) {}
    }
    return cached;
  }

  savePriceToCache(cacheKey, data) {
    this.cache.set(cacheKey, data);
    try {
      localStorage.setItem(`price_${cacheKey}`, JSON.stringify(data));
    } catch (e) {}
  }

  // Método síncrono para leer desde la caché de localStorage (usado para inicializar al instante)
  getCachedEma21Distance(symbol, currentPrice) {
    if (!currentPrice || currentPrice <= 0) return null;
    
    if (this.config && this.config.demoMode) {
      const charSum = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return ((charSum * 17) % 300) / 10 - 15;
    }

    const safeSymbol = symbol.toUpperCase();
    const CACHE_KEY = `ema21_${safeSymbol}`;
    const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 horas

    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < CACHE_TTL) {
          const cachedEma = parsed.ema;
          // console.log(`[CACHE HIT] EMA21 para ${safeSymbol}:`, cachedEma);
          return ((currentPrice - cachedEma) / cachedEma) * 100;
        } else {
          // console.log(`[CACHE EXPIRED] EMA21 para ${safeSymbol}`);
        }
      }
    } catch (e) {
      console.warn('Error leyendo caché:', e);
    }
    
    return null;
  }

  // Calcular la distancia porcentual a la EMA 21 usando histórico
  // USANDO TWELVE DATA API (con fallback a Yahoo manual)
  // IMPORTANTE: Límite de 800 llamadas/día en Twelve Data -> Cache estricto 12hs.
  async getEma21Distance(symbol, currentPrice, forceYahoo = false) {
    if (!currentPrice) return null;

    const safeSymbol = symbol.toUpperCase();
    const CACHE_KEY = `ema21_${safeSymbol}`;
    const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 horas de cache
    const TWELVE_DATA_API_KEY = '46895546a0ed453c80694154f07e3a11';

    // 1. Revisar si tenemos la EMA guardada en localStorage
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < CACHE_TTL) {
          const cachedEma = parsed.ema;
          loggerService.incrementCacheHit();
          loggerService.info(`[HIT] EMA 21 para ${safeSymbol} desde caché`, 'CACHE');
          return ((currentPrice - cachedEma) / cachedEma) * 100;
        }
      }
    } catch (e) {}

    loggerService.incrementCacheMiss();

    // 2. Intentar obtener EMA desde Twelve Data API (solo si no forzamos Yahoo)
    let ema = null;
    
    if (!forceYahoo) {
      try {
        // 2.a RATE LIMITING ESTRICTO (8 llamadas por minuto = 1 llamada cada 7.5s)
        const executeTwelveDataFetch = async () => {
          const now = Date.now();
          const timeSinceLastCall = now - lastTwelveDataCall;
          if (timeSinceLastCall < TWELVE_DATA_RATE_LIMIT_MS) {
            const delay = TWELVE_DATA_RATE_LIMIT_MS - timeSinceLastCall;
            loggerService.warn(`[Rate Limit] Esperando ${delay}ms para Twelve Data (${safeSymbol})...`, 'API');
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          lastTwelveDataCall = Date.now();

          loggerService.info(`Solicitando EMA 21 de ${safeSymbol} a TwelveData...`, 'API');
          loggerService.incrementTwelveData();
          
          const tdUrl = `https://api.twelvedata.com/ema?symbol=${safeSymbol}&interval=1day&time_period=21&apikey=${TWELVE_DATA_API_KEY}`;
          const tdResponse = await fetch(tdUrl, { signal: AbortSignal.timeout(15000) });
          return await tdResponse.json();
        };

        // Encadenar en la cola global
        twelveDataQueuePromise = twelveDataQueuePromise.then(executeTwelveDataFetch).catch(() => null);
        const tdData = await twelveDataQueuePromise;

        if (tdData && tdData.status === 'ok' && tdData.values && tdData.values.length > 0) {
          ema = parseFloat(tdData.values[0].ema);
          loggerService.success(`[TwelveData] EMA 21 para ${safeSymbol}: ${ema}`, 'API');
        } else if (tdData && tdData.code === 429) {
          loggerService.error(`TwelveData API Limit alcanzado (429) para ${safeSymbol}`, 'API');
          loggerService.incrementTwelveDataLimit();
        } else if (tdData) {
          loggerService.warn(`TwelveData no devolvió datos válidos para ${safeSymbol}: ${tdData.message || 'Sin mensaje'}`, 'API');
        }
      } catch (e) {
        loggerService.error(`Error TwelveData para ${safeSymbol}: ${e.message}`, 'API');
      }
    }

    // 3. Fallback a Yahoo Finance (cálculo manual) si Twelve Data falló o límite alcanzado
    if (ema === null) {
      try {
        loggerService.info(`[FALLBACK] Calculando EMA 21 manual con Yahoo para ${safeSymbol}...`, 'API');
        // Pedimos 3 meses para tener al menos ~63 días hábiles
        const candles = await yahooFinanceService.getCandles(symbol, '1d', '3mo');
        
        if (!candles || candles.length < 21) {
          return null;
        }

        // Filtrar cierres válidos
        const closes = candles.map(c => c.close).filter(c => c && !isNaN(c));
        if (closes.length < 21) return null;

        const N = 21;
        const k = 2 / (N + 1);
        
        // SMA inicial como semilla
        let sum = 0;
        for (let i = 0; i < N; i++) {
          sum += closes[i];
        }
        ema = sum / N;
        
        // Aplicar fórmula EMA
        for (let i = N; i < closes.length; i++) {
          ema = (closes[i] * k) + (ema * (1 - k));
        }
        loggerService.success(`[Yahoo Fallback] EMA 21 calculada manual para ${safeSymbol}: ${ema.toFixed(2)}`, 'API');
      } catch (err) {
        loggerService.error(`Fallo crítico: Fallback Yahoo falló para EMA de ${safeSymbol}: ${err.message}`, 'API');
        return null;
      }
    }

    // 4. Guardar resultado final en caché y retornar distancia
    if (ema !== null && !isNaN(ema)) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          ema,
          timestamp: Date.now()
        }));
      } catch (e) {}
      
      return ((currentPrice - ema) / ema) * 100;
    }

    return null;
  }
}

export default new PriceService();
