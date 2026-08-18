// services/rsiService.js - Servicio para el cálculo del RSI
import yahooFinanceService from './yahooFinanceService';

class RsiService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Calcula el RSI estándar de Wilder (Smooth Moving Average).
   * @param {number[]} prices - Array de precios de cierre.
   * @param {number} period - Períodos para el cálculo (usualmente 14).
   * @returns {Object} { current, previous, delta }
   */
  calculateRSI(prices, period = 14) {
    if (!prices || prices.length <= period) {
      return { current: null, previous: null, delta: null };
    }

    let gains = 0;
    let losses = 0;

    // Calcular ganancia/pérdida media inicial (Simple Moving Average para la primera vela)
    for (let i = 1; i <= period; i++) {
      const difference = prices[i] - prices[i - 1];
      if (difference >= 0) {
        gains += difference;
      } else {
        losses -= difference;
      }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    let rsiArray = [];

    const getRsi = (ag, al) => {
      if (al === 0) return 100; // Sin pérdidas = RSI 100
      const rs = ag / al;
      return 100 - (100 / (1 + rs));
    };

    rsiArray.push(getRsi(avgGain, avgLoss));

    // Calcular valores subsiguientes usando la Media Móvil Suavizada (SMMA) de Wilder
    for (let i = period + 1; i < prices.length; i++) {
      const difference = prices[i] - prices[i - 1];
      let gain = 0;
      let loss = 0;

      if (difference >= 0) {
        gain = difference;
      } else {
        loss = -difference;
      }

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;

      rsiArray.push(getRsi(avgGain, avgLoss));
    }

    if (rsiArray.length < 2) {
      return { 
        current: parseFloat(rsiArray[0].toFixed(2)), 
        previous: null, 
        delta: null 
      };
    }

    const current = parseFloat(rsiArray[rsiArray.length - 1].toFixed(2));
    const previous = parseFloat(rsiArray[rsiArray.length - 2].toFixed(2));
    const delta = parseFloat((current - previous).toFixed(2));

    return { current, previous, delta };
  }

  /**
   * Obtiene el RSI semanal (y su delta) para un símbolo.
   * @param {string} symbol - Símbolo (ticker).
   * @param {number} period - Períodos del RSI (por defecto 14).
   * @returns {Promise<Object>} { current, previous, delta } o nulls en caso de error.
   */
  async getWeeklyRsi(symbol, period = 14) {
    const timeframe = '1wk';
    // Se incluye symbol, timeframe y period en la key para evitar colisiones en caché.
    const cacheKey = `rsi_${symbol}_${timeframe}_${period}`;
    
    const emptyResult = { current: null, previous: null, delta: null };

    // 1. Verificar sessionStorage (TTL ~24 horas)
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed.value; // Retorna el objeto {current, previous, delta}
        }
      }
    } catch (e) {
      console.warn('Error leyendo sessionStorage en rsiService:', e);
    }

    // 2. Fetch y cálculo si no hay caché
    try {
      // 2 años de datos semanales (~104 velas) aseguran un historial robusto para
      // que el RSI inicialice correctamente y absorba las fluctuaciones iniciales de Wilder.
      const candles = await yahooFinanceService.getCandles(symbol, timeframe, '2y');
      
      if (!candles || !Array.isArray(candles) || candles.length < period + 1) {
        return emptyResult;
      }

      // 3. Lógica de vela cerrada:
      // Es importante evitar que el RSI semanal cambie durante la semana por utilizar una vela semanal que todavía está en formación.
      // Siempre que sea posible, utilizamos la última vela semanal completamente cerrada.
      // Asumimos que los timestamps de Yahoo están en segundos. Si el inicio de la vela + 7 días está en el futuro, no ha cerrado.
      if (candles.length > 0) {
        const lastCandle = candles[candles.length - 1];
        const lastCandleStartMs = (lastCandle.timestamp || 0) * 1000;
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        
        // Si el momento actual es menor al inicio de la vela + 7 días, la vela sigue abierta, la descartamos.
        // Además, como fallback de seguridad, verificamos si la fecha actual es la misma semana en curso.
        if (Date.now() < lastCandleStartMs + sevenDaysMs) {
           candles.pop(); // Descartar vela abierta para que el RSI quede estable
        }
      }

      // Filtrar cierres válidos
      const closes = candles
        .map(c => c.close)
        .filter(c => c !== null && c !== undefined && !isNaN(c));

      // Re-verificar que sigan quedando suficientes velas después de descartar nulos y la última
      if (closes.length <= period) {
        return emptyResult;
      }

      // 4. Calcular RSI
      const rsiData = this.calculateRSI(closes, period);
      
      // 5. Guardar en caché
      if (rsiData.current !== null) {
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            value: rsiData,
            timestamp: Date.now()
          }));
        } catch (e) {
          // Ignorar silenciosamente errores de cuota de storage
        }
      }

      return rsiData;
    } catch (error) {
      console.warn(`[RSI Service] No se pudo obtener datos para RSI Semanal de ${symbol}:`, error.message);
      return emptyResult; // Fallback graceful sin romper React
    }
  }

  /**
   * Obtiene el RSI para múltiples símbolos, reportando progreso progresivamente.
   */
  async getMultipleWeeklyRsi(symbols, onProgress) {
    const results = {};
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      const rsiData = await this.getWeeklyRsi(symbol, 14);
      results[symbol] = rsiData;
      
      if (onProgress) {
        onProgress(symbol, rsiData);
      }
      
      // Pequeña pausa para no saturar requests en concurrencia (rate-limiting)
      if (i < symbols.length - 1) {
        await new Promise(res => setTimeout(res, 200));
      }
    }
    return results;
  }
}

const rsiService = new RsiService();
export default rsiService;
