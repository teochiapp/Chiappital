// config/priceConfig.js - Configuración para APIs de precios en tiempo real

export const PRICE_PROVIDERS = {
  IEX_CLOUD: 'iexcloud',
  FINNHUB: 'finnhub',
  POLYGON: 'polygon',
  YAHOO: 'yahoo' // Gratuita pero no oficial
};

export const priceConfig = {
  // Configuración por defecto
  provider: import.meta.env.VITE_PRICE_API_PROVIDER || PRICE_PROVIDERS.FINNHUB, // Finnhub primero, luego Stooq
  apiKey: import.meta.env.VITE_PRICE_API_KEY || 'd3t6mg9r01qqdgfufaggd3t6mg9r01qqdgfufah0', // Finnhub API key
  demoMode: false, // DESACTIVADO: Usa precios reales con fallback a Stooq
  gracefulDegradation: true, // Si falla la API, mostrar dashboard sin precios en lugar de error
  
  // URLs base por proveedor
  baseUrls: {
    [PRICE_PROVIDERS.IEX_CLOUD]: 'https://cloud.iexapis.com/stable',
    [PRICE_PROVIDERS.FINNHUB]: 'https://finnhub.io/api/v1',
    [PRICE_PROVIDERS.POLYGON]: 'https://api.polygon.io/v2',
    [PRICE_PROVIDERS.YAHOO]: 'https://query1.finance.yahoo.com/v8/finance/chart'
  },

  // Configuraciones específicas por proveedor
  configs: {
    [PRICE_PROVIDERS.IEX_CLOUD]: {
      rateLimit: 100,
      dailyLimit: 500000
    },
    [PRICE_PROVIDERS.FINNHUB]: {
      rateLimit: 60,
      dailyLimit: null
    },
    [PRICE_PROVIDERS.POLYGON]: {
      rateLimit: 5,
      dailyLimit: null
    },
    [PRICE_PROVIDERS.YAHOO]: {
      rateLimit: 2000, // No oficial, usar con moderación
      dailyLimit: null
    }
  }
};

// Función para obtener URL según el proveedor
export const buildPriceUrl = (symbol, provider = priceConfig.provider, apiKey = priceConfig.apiKey) => {
  const baseUrl = priceConfig.baseUrls[provider];
  
  switch (provider) {
    case PRICE_PROVIDERS.IEX_CLOUD:
      return `${baseUrl}/stock/${symbol}/quote?token=${apiKey}`;
    
    case PRICE_PROVIDERS.FINNHUB:
      return `${baseUrl}/quote?symbol=${symbol}&token=${apiKey}`;
    
    case PRICE_PROVIDERS.POLYGON:
      return `${baseUrl}/aggs/ticker/${symbol}/prev?adjusted=true&apikey=${apiKey}`;
    
    case PRICE_PROVIDERS.YAHOO:
      return `${baseUrl}/${symbol}?interval=1m&range=1d`;
    
    default:
      throw new Error(`Proveedor no soportado: ${provider}`);
  }
};

// Función para extraer precio de la respuesta según el proveedor
export const extractPriceFromResponse = (data, provider = priceConfig.provider) => {
  console.log(`🔍 Extracting price from response for provider: ${provider}`, data);
  
  try {
    switch (provider) {
      case PRICE_PROVIDERS.IEX_CLOUD:
        if (data && typeof data.latestPrice !== 'undefined') {
          return parseFloat(data.latestPrice);
        }
        throw new Error('Invalid IEX Cloud response structure');
      
      case PRICE_PROVIDERS.FINNHUB:
        if (data && typeof data.c !== 'undefined') {
          return parseFloat(data.c); // current price
        }
        throw new Error('Invalid Finnhub response structure');
      
      case PRICE_PROVIDERS.POLYGON:
        if (data && data.results && data.results.length > 0 && data.results[0].c) {
          return parseFloat(data.results[0].c); // close price
        }
        throw new Error('Invalid Polygon response structure');
      
      case PRICE_PROVIDERS.YAHOO:
        if (data && data.chart && data.chart.result && data.chart.result[0] && data.chart.result[0].meta) {
          return parseFloat(data.chart.result[0].meta.regularMarketPrice);
        }
        throw new Error('Invalid Yahoo response structure');
    
    default:
      throw new Error(`Proveedor no soportado: ${provider}`);
  }
  } catch (error) {
    console.error(`❌ Error extracting price:`, error);
    throw new Error(`Failed to extract price: ${error.message}`);
  }
};
