// services/yahooFinanceService.js - Servicio para Yahoo Finance API (GRATUITA)
class YahooFinanceService {
  constructor() {
    this.baseURL = 'https://query1.finance.yahoo.com/v8/finance';
    this.cache = new Map();
    this.lastCallTime = 0;
    this.minIntervalBetweenCalls = 500; // 500ms entre llamadas
  }

  // Rate limiting
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    
    if (timeSinceLastCall < this.minIntervalBetweenCalls) {
      const waitTime = this.minIntervalBetweenCalls - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastCallTime = Date.now();
  }

  // Verificar cache
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < 60000) { // Cache válido por 60 segundos
      return cached.data;
    }
    return null;
  }

  // Guardar en cache
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Obtener cotización en tiempo real
  async getQuote(symbol) {
    try {
      const cacheKey = `quote_${symbol}`;
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        console.log(`📦 Yahoo Finance - Cache hit para ${symbol}`);
        return cachedData;
      }

      await this.waitForRateLimit();

      const response = await fetch(
        `${this.baseURL}/chart/${symbol}?interval=1m&range=1d`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
        throw new Error('No data available for this symbol');
      }

      const result = data.chart.result[0];
      const meta = result.meta;
      
      const quote = {
        symbol: symbol,
        price: meta.regularMarketPrice || meta.previousClose,
        change: meta.regularMarketPrice - meta.previousClose,
        changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
        high: meta.regularMarketDayHigh,
        low: meta.regularMarketDayLow,
        open: meta.regularMarketOpen || meta.previousClose,
        previousClose: meta.previousClose,
        timestamp: meta.regularMarketTime
      };

      this.setCache(cacheKey, quote);
      console.log(`✅ Yahoo Finance - Precio obtenido para ${symbol}: $${quote.price}`);
      
      return quote;
    } catch (error) {
      console.error(`❌ Yahoo Finance - Error fetching quote for ${symbol}:`, error);
      throw error;
    }
  }

  // Obtener datos históricos (candlesticks)
  async getCandles(symbol, interval = '1d', range = '1mo') {
    try {
      const cacheKey = `candles_${symbol}_${interval}_${range}`;
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      await this.waitForRateLimit();

      const targetUrl = `${this.baseURL}/chart/${symbol}?interval=${interval}&range=${range}`;
      
      // Utilizamos corsproxy.io como proxy alternativo
      const response = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
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

      this.setCache(cacheKey, candles);
      
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
      const chunkSize = 20; // Yahoo suele permitir hasta 200, usamos 20 por seguridad
      
      for (let i = 0; i < symbols.length; i += chunkSize) {
        const chunk = symbols.slice(i, i + chunkSize);
        
        // Ajustar sufijos para Yahoo Finance si es necesario (ej: BMA -> BMA, YPF -> YPF)
        // La mayoría de los tickers de USA y ADRs funcionan igual.
        const query = chunk.join(',');
        
        await this.waitForRateLimit();
        
        const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${query}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.quoteResponse && data.quoteResponse.result) {
            data.quoteResponse.result.forEach(q => {
              results.push({
                symbol: q.symbol,
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
