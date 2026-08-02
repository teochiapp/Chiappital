// services/finnhubService.js - Servicio para Finnhub API
class FinnhubService {
  constructor() {
    this.apiKey = 'd3t6mg9r01qqdgfufaggd3t6mg9r01qqdgfufah0';
    this.baseURL = 'https://finnhub.io/api/v1';
    this.cache = new Map();
    this.lastCallTime = 0;
    this.minIntervalBetweenCalls = 1000; // 1 segundo entre llamadas (más generoso que Alpha Vantage)
  }

  // Rate limiting: esperar si es necesario
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    
    if (timeSinceLastCall < this.minIntervalBetweenCalls) {
      const waitTime = this.minIntervalBetweenCalls - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastCallTime = Date.now();
  }

  // Verificar cache antes de hacer llamada
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < 30000) { // Cache válido por 30 segundos
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

  // Limpiar cache viejo
  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > 300000) { // Limpiar cache de más de 5 minutos
        this.cache.delete(key);
      }
    }
  }

  // Obtener cotización en tiempo real
  async getQuote(symbol) {
    try {
      // Verificar cache primero
      const cacheKey = `quote_${symbol}`;
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        console.log(`Usando datos en cache para ${symbol}`);
        return cachedData;
      }

      // Rate limiting
      await this.waitForRateLimit();

      const response = await fetch(
        `${this.baseURL}/quote?symbol=${symbol}&token=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Finnhub devuelve datos en formato diferente
      const result = {
        symbol: symbol,
        price: data.c,
        change: data.d,
        changePercent: data.dp,
        high: data.h,
        low: data.l,
        open: data.o,
        previousClose: data.pc,
        timestamp: data.t
      };

      // Guardar en cache
      this.setCache(cacheKey, result);
      this.cleanCache();
      
      return result;
    } catch (error) {
      console.error('Error fetching quote:', error);
      throw error;
    }
  }

  // Obtener datos históricos (candlesticks)
  async getCandles(symbol, resolution = 'D', from, to) {
    try {
      const cacheKey = `candles_${symbol}_${resolution}_${from}_${to}`;
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      await this.waitForRateLimit();

      const response = await fetch(
        `${this.baseURL}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.s !== 'ok') {
        throw new Error('No data available for this symbol');
      }
      
      // Convertir datos de Finnhub a formato más usable
      const candles = data.t.map((timestamp, index) => ({
        timestamp,
        open: data.o[index],
        high: data.h[index],
        low: data.l[index],
        close: data.c[index],
        volume: data.v[index]
      }));

      this.setCache(cacheKey, candles);
      this.cleanCache();
      
      return candles;
    } catch (error) {
      console.error('Error fetching candles:', error);
      throw error;
    }
  }

  // Obtener múltiples cotizaciones
  async getMultipleQuotes(symbols) {
    try {
      const results = [];
      
      // Procesar símbolos uno por uno para respetar rate limits
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
          console.warn(`Error obteniendo datos para ${symbol}:`, error.message);
          results.push({
            symbol,
            data: null,
            error: error.message
          });
        }
        
        // Pausa entre símbolos
        if (i < symbols.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 segundo entre símbolos
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error fetching multiple quotes:', error);
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
        `${this.baseURL}/search?q=${query}&token=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      const results = data.result.map(item => ({
        symbol: item.symbol,
        name: item.description,
        type: item.type,
        displaySymbol: item.displaySymbol
      }));

      this.setCache(cacheKey, results);
      this.cleanCache();
      
      return results;
    } catch (error) {
      console.error('Error searching symbols:', error);
      throw error;
    }
  }

  // Obtener información de la empresa
  async getCompanyProfile(symbol) {
    try {
      const cacheKey = `profile_${symbol}`;
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      await this.waitForRateLimit();

      const response = await fetch(
        `${this.baseURL}/stock/profile2?symbol=${symbol}&token=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.name) {
        throw new Error('No company profile available for this symbol');
      }

      this.setCache(cacheKey, data);
      this.cleanCache();
      
      return data;
    } catch (error) {
      console.error('Error fetching company profile:', error);
      throw error;
    }
  }

  // Obtener noticias de la empresa
  async getCompanyNews(symbol, from, to) {
    try {
      const cacheKey = `news_${symbol}_${from}_${to}`;
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      await this.waitForRateLimit();

      const response = await fetch(
        `${this.baseURL}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      this.setCache(cacheKey, data);
      this.cleanCache();
      
      return data;
    } catch (error) {
      console.error('Error fetching company news:', error);
      throw error;
    }
  }

  // Obtener noticias del mercado (general)
  async getMarketNews(category = 'general') {
    try {
      const cacheKey = `market_news_${category}`;
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      await this.waitForRateLimit();

      const response = await fetch(
        `${this.baseURL}/news?category=${category}&token=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      this.setCache(cacheKey, data);
      this.cleanCache();
      
      return data;
    } catch (error) {
      console.error('Error fetching market news:', error);
      throw error;
    }
  }

  // Obtener calendario de earnings
  async getEarningsCalendar(from, to) {
    try {
      const cacheKey = `earnings_${from}_${to}`;
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      await this.waitForRateLimit();

      const response = await fetch(
        `${this.baseURL}/calendar/earnings?from=${from}&to=${to}&token=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // La API devuelve un objeto con { earningsCalendar: [...] }
      const results = data.earningsCalendar || [];

      this.setCache(cacheKey, results);
      this.cleanCache();
      
      return results;
    } catch (error) {
      console.error('Error fetching earnings calendar:', error);
      throw error;
    }
  }
}

// Crear instancia singleton
const finnhubService = new FinnhubService();

export default finnhubService;
