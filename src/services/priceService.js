import { readInstruments } from './marketReadService';
import { priceConfig, buildPriceUrl, extractPriceFromResponse } from '../config/priceConfig';
import yahooFinanceService from './yahooFinanceService';
import loggerService from './loggerService';

// Variables globales para estado de API
let finnhubRateLimited = false;
let finnhubRateLimitResetTime = 0;

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
  async getCurrentPrice(symbol, force = false) {
    if (!symbol) return null;
    const cacheKey = symbol.toUpperCase();
    
    try {
      // Si está en modo demo, generar precio mock directamente
      if (this.config.demoMode) {
        console.log(`🎭 Demo mode enabled - generating mock price for ${symbol}`);
        const mockPrice = this.generateMockPrice(symbol);
        console.log(`🎭 Mock price for ${symbol}: $${mockPrice}`);
        return mockPrice;
      }
      
      if (force) {
        this.invalidatePriceCache(symbol);
      } else {
        // Verificar cache primero (memoria + localStorage)
        const cached = this.getPriceFromCache(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
          const minutesOld = Math.round((Date.now() - cached.timestamp) / (1000 * 60));
          const priceType = cached.isMock ? 'mock' : (cached.isDelayed ? 'delayed' : 'real');
          loggerService.incrementCacheHit();
          loggerService.info(`[HIT] Precio de ${symbol}: $${cached.price} (${minutesOld} min, ${priceType})`, 'CACHE');
          return cached.price;
        }
      }

      loggerService.incrementCacheMiss();

      // Verificar si ya hay una request pendiente para este símbolo
      if (this.pendingRequests.has(cacheKey) && !force) {
        loggerService.info(`Precio para ${symbol} ya está en curso, esperando...`, 'API');
        return await this.pendingRequests.get(cacheKey);
      }

      console.log(`🔍 Obteniendo precio fresco para ${symbol}`);
      
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
        changePercent: null,
        timestamp: Date.now(),
        isMock: true
      });
      
      return mockPrice;
    }
  }

  // Método para obtener el cambio porcentual guardado en caché
  getChangePercent(symbol) {
    if (!symbol) return null;
    const cacheKey = symbol.toUpperCase();
    const cached = this.getPriceFromCache(cacheKey);
    return cached && typeof cached.changePercent === 'number' && !isNaN(cached.changePercent)
      ? cached.changePercent
      : null;
  }

  // Método con fallback en cascada: Finnhub -> Yahoo (si se configuró) -> null/mock
  async fetchPriceWithFallback(symbol, cacheKey) {
    let lastError = null;

    // Intentar con Finnhub primero (si no está en demoMode)
    if (!this.config.demoMode && this.config.provider === 'finnhub') {
      try {
        loggerService.info(`Solicitando precio de ${symbol} a Finnhub...`, 'API');
        const finnhubData = await this.fetchFromFinnhub(symbol);
        const price = finnhubData.price;
        const changePercent = finnhubData.changePercent;
        this.savePriceToCache(cacheKey, {
          price,
          changePercent: changePercent,
          quoteTime: finnhubData.quoteTime,
          timestamp: Date.now(),
          isDelayed: false
        });
        this.pendingRequests.delete(cacheKey);
        loggerService.success(`[Finnhub] Precio ${symbol}: $${price}, cambio: ${changePercent?.toFixed(2) ?? 'N/A'}%`, 'API');
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
        const changePercent = (typeof quote.changePercent === 'number' && !isNaN(quote.changePercent))
          ? quote.changePercent
          : null;
        this.savePriceToCache(cacheKey, {
          price,
          changePercent,
          quoteTime: quote.timestamp > 0 ? quote.timestamp * 1000 : null,
          timestamp: Date.now(),
          isDelayed: true
        });
        this.pendingRequests.delete(cacheKey);
        loggerService.success(`[Yahoo] Precio ${symbol}: $${price}, cambio: ${changePercent?.toFixed(2) ?? 'N/A'}% (Demorado)`, 'API');
        return price; // ← retorna solo el número, igual que antes
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
    const changePercent = data.dp !== undefined && data.dp !== null ? parseFloat(data.dp) : null;
    
    if (!price || isNaN(price) || price <= 0) {
      throw new Error('Invalid price data');
    }
    
    return { price, changePercent, quoteTime: data.t > 0 ? data.t * 1000 : null };
  }

  // Método para obtener múltiples precios de una vez
  // Retorna un mapa { SYMBOL: precio_numérico } — compatible con todo el resto de la app
  async getMultiplePrices(symbols, force = false) {
    if (!symbols || symbols.length === 0) return {};
    if (force) {
      this.invalidateMultiplePriceCache(symbols);
    }
    const promises = symbols.map(symbol => this.getCurrentPrice(symbol, force));
    const results = await Promise.allSettled(promises);
    
    const prices = {};
    symbols.forEach((symbol, index) => {
      const upper = symbol.toUpperCase();
      if (results[index].status === 'fulfilled') {
        prices[upper] = results[index].value;
      } else {
        prices[upper] = null;
      }
    });

    return prices;
  }

  // Método para obtener cotizaciones en tiempo real directamente de proveedores externos (Finnhub / Yahoo)
  // Devuelve { [SYMBOL]: { price, changePercent } } garantizando datos frescos de HOY en vivo
  async getLiveQuotes(symbols, force = false) {
    if (!symbols || symbols.length === 0) return {};
    if (force) {
      this.invalidateMultiplePriceCache(symbols);
    }
    await this.getMultiplePrices(symbols, force);
    const quotes = {};
    symbols.forEach(sym => {
      const upper = sym.toUpperCase();
      const cached = this.getPriceFromCache(upper);
      const price = cached?.price ?? null;
      const changePercent = (cached && typeof cached.changePercent === 'number' && !isNaN(cached.changePercent))
        ? cached.changePercent
        : 0;
      quotes[upper] = { price, changePercent };
      quotes[sym] = quotes[upper];
    });
    return quotes;
  }

  // Método para obtener múltiples precios + changePercent para el Screener y Dashboard
  // Consume el snapshot del Backend con fallback individual a Yahoo / Finnhub para los símbolos faltantes
  async getMultipleQuotes(symbols, force = false) {
    if (!symbols || symbols.length === 0) return {};
    if (force) {
      this.invalidateMultiplePriceCache(symbols);
    }

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      let snapshot = {};
      try {
        const response = await fetch(`${baseUrl}/api/market/snapshot`);
        if (response.ok) {
          const data = await response.json();
          snapshot = data.snapshot || {};
        }
      } catch (err) {
        loggerService.warn(`No se pudo conectar con market snapshot: ${err.message}`, 'API');
      }
      
      const quotes = {};
      const missingSymbols = [];

      symbols.forEach(symbol => {
        const cacheKey = symbol.toUpperCase();
        if (snapshot[cacheKey] && snapshot[cacheKey].price !== null) {
          const item = snapshot[cacheKey];
          quotes[cacheKey] = {
            price: item.price,
            changePercent: item.changePercent,
            ema21Distance: item.ema21Distance,
            weeklyRsi: item.rsiWeekly,
            weeklyRsiPrevious: item.rsiPrevious,
            weeklyRsiDelta: item.rsiDelta,
            weeklyMacd: item.macdWeekly,
            weeklyMacdSignal: item.macdSignal,
            weeklyMacdHist: item.macdHist,
            weeklyMacdPrev: item.macdPrevWeekly,
            weeklyMacdPrevSignal: item.macdPrevSignal,
            weeklyMacdPrevHist: item.macdPrevHist,
            drawdown52w: item.drawdown52w,
            rsValue: item.rsValue,
            rsPrevious: item.rsPrevious,
            rsState: item.rsState,
            setupState: item.setupState,
            setupVerdict: item.setupVerdict,
            setupFactors: item.setupFactors,
            opScore: item.opScore,
            opScoreConclusions: item.opScoreConclusions,
            status: item.status,
            updatedAt: item.updatedAt
          };
          quotes[symbol] = quotes[cacheKey];
          this.savePriceToCache(cacheKey, {
            price: item.price,
            changePercent: item.changePercent,
            timestamp: Date.now(),
            isDelayed: item.source !== 'finnhub'
          });
        } else {
          missingSymbols.push(symbol);
        }
      });

      // Para los símbolos que no estaban en el snapshot o no tenían precio, buscar vía Yahoo / Finnhub
      if (missingSymbols.length > 0) {
        await Promise.all(missingSymbols.map(async (symbol) => {
          const cacheKey = symbol.toUpperCase();
          try {
            const yfQuote = await yahooFinanceService.getQuote(cacheKey);
            if (yfQuote && typeof yfQuote.price === 'number') {
              const cp = (typeof yfQuote.changePercent === 'number' && !isNaN(yfQuote.changePercent))
                ? yfQuote.changePercent
                : 0;
              quotes[cacheKey] = {
                price: yfQuote.price,
                changePercent: cp,
                ema21Distance: null,
                status: 'OK',
                updatedAt: new Date().toISOString()
              };
              quotes[symbol] = quotes[cacheKey];
              this.savePriceToCache(cacheKey, {
                price: yfQuote.price,
                changePercent: cp,
                timestamp: Date.now(),
                isDelayed: true
              });
              return;
            }
          } catch (e) {}

          // Fallback final: getCurrentPrice
          try {
            const price = await this.getCurrentPrice(cacheKey, force);
            const cp = this.getChangePercent(cacheKey);
            quotes[cacheKey] = {
              price,
              changePercent: cp !== null ? cp : 0,
              ema21Distance: null,
              status: price ? 'OK' : 'ERROR',
              updatedAt: new Date().toISOString()
            };
            quotes[symbol] = quotes[cacheKey];
          } catch (err) {
            quotes[cacheKey] = { price: null, changePercent: null, status: 'ERROR' };
            quotes[symbol] = quotes[cacheKey];
          }
        }));
      }
      
      return quotes;
    } catch (error) {
      loggerService.error(`Error obteniendo snapshot del backend: ${error.message}`, 'API');
      
      const quotes = {};
      await Promise.all(symbols.map(async (symbol) => {
        const cacheKey = symbol.toUpperCase();
        try {
          const price = await this.getCurrentPrice(cacheKey, force);
          const cp = this.getChangePercent(cacheKey);
          quotes[cacheKey] = { price, changePercent: cp !== null ? cp : 0, status: price ? 'OK' : 'ERROR' };
          quotes[symbol] = quotes[cacheKey];
        } catch (e) {
          quotes[cacheKey] = { price: null, changePercent: null, status: 'ERROR' };
          quotes[symbol] = quotes[cacheKey];
        }
      }));
      return quotes;
    }
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
    this.pendingRequests.clear();
    // Limpiar también las entradas de localStorage para precios y sessionStorage para cotizaciones
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('price_') || key.startsWith('ema21_')) {
          localStorage.removeItem(key);
        }
      });
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('yf_')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (e) {}
    if (yahooFinanceService && typeof yahooFinanceService.clearCache === 'function') {
      yahooFinanceService.clearCache();
    }
  }

  // Invalidar caché para un símbolo específico
  invalidatePriceCache(symbol) {
    if (!symbol) return;
    const cacheKey = symbol.toUpperCase();
    this.cache.delete(cacheKey);
    this.pendingRequests.delete(cacheKey);
    try {
      localStorage.removeItem(`price_${cacheKey}`);
      localStorage.removeItem(`ema21_${cacheKey}`);
    } catch (e) {}
    if (yahooFinanceService && typeof yahooFinanceService.invalidateCache === 'function') {
      yahooFinanceService.invalidateCache(symbol);
    }
  }

  // Invalidar caché para múltiples símbolos
  invalidateMultiplePriceCache(symbols = []) {
    if (!Array.isArray(symbols)) return;
    symbols.forEach(s => this.invalidatePriceCache(s));
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

  async getEma21Distance(symbol, currentPrice) {
    if (!symbol || !(currentPrice > 0)) return null;
    const key = symbol.toUpperCase();
    try {
      const rows = await readInstruments([key], 60 * 60 * 1000);
      return rows[key]?.ema21 > 0 ? (currentPrice / rows[key].ema21 - 1) * 100 : null;
    } catch {
      return null;
    }
  }

}

const priceService = new PriceService();
export default priceService;
