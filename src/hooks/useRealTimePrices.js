// hooks/useRealTimePrices.js - Hook para manejar precios en tiempo real
import { useState, useEffect, useCallback, useRef } from 'react';
import priceService from '../services/priceService';

// Configuración de actualización de precios
const PRICE_UPDATE_CONFIG = {
  INITIAL_DELAY: 1000, // 1 segundo de delay inicial para evitar llamadas al montar
  UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutos entre actualizaciones
  MAX_RETRIES: 3, // Máximo de reintentos en caso de error
};

export const useRealTimePrices = (trades = [], config = {}) => {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const fetchTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  
  // Merge config con defaults
  const updateInterval = config.updateInterval || PRICE_UPDATE_CONFIG.UPDATE_INTERVAL;

  // Obtener símbolos únicos de los trades
  const symbols = [...new Set(trades.map(trade => {
    const symbol = trade.attributes ? trade.attributes.symbol : trade.symbol;
    return symbol ? symbol.toUpperCase() : null;
  }).filter(Boolean))];

  // Función para obtener precios con debouncing
  const fetchPrices = useCallback(async (isRetry = false) => {
    if (symbols.length === 0) {
      console.log('⏭️ No hay símbolos para obtener precios');
      return;
    }

    // Evitar múltiples llamadas simultáneas
    if (loading && !isRetry) {
      console.log('⏳ Ya hay una carga de precios en progreso, saltando...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🔄 Obteniendo precios para ${symbols.length} símbolos:`, symbols);
      const newPrices = await priceService.getMultiplePrices(symbols);
      
      setPrices(prevPrices => ({
        ...prevPrices,
        ...newPrices
      }));
      
      setLastUpdate(new Date());
      retryCountRef.current = 0; // Reset retry count on success
      console.log('✅ Precios actualizados exitosamente');
    } catch (err) {
      console.error('❌ Error obteniendo precios:', err);
      setError(err.message);
      
      // Retry logic
      if (retryCountRef.current < PRICE_UPDATE_CONFIG.MAX_RETRIES) {
        retryCountRef.current++;
        const retryDelay = 2000 * retryCountRef.current; // Exponential backoff
        console.log(`🔄 Reintentando en ${retryDelay/1000}s (intento ${retryCountRef.current}/${PRICE_UPDATE_CONFIG.MAX_RETRIES})`);
        
        fetchTimeoutRef.current = setTimeout(() => {
          fetchPrices(true);
        }, retryDelay);
      }
    } finally {
      setLoading(false);
    }
  }, [symbols.join(','), loading]); // Dependencia basada en símbolos únicos

  // Obtener precio de un símbolo específico
  const getPrice = useCallback((symbol) => {
    if (!symbol) return null;
    return prices[symbol.toUpperCase()] || null;
  }, [prices]);

  // Calcular PnL no realizado para un trade
  const getUnrealizedPnL = useCallback((trade) => {
    const symbol = trade.attributes ? trade.attributes.symbol : trade.symbol;
    const entryPrice = parseFloat(trade.attributes ? trade.attributes.entry_price : trade.entry_price);
    const tradeType = trade.attributes ? trade.attributes.type : trade.type;
    
    if (!symbol || !entryPrice) return null;

    const currentPrice = getPrice(symbol);
    if (!currentPrice) return null;

    return priceService.calculateUnrealizedPnL(entryPrice, currentPrice, tradeType);
  }, [getPrice]);

  // Obtener el cambio diario porcentual de un símbolo
  const getDailyVariation = useCallback((symbol) => {
    if (!symbol) return null;
    return priceService.getChangePercent(symbol);
  }, [prices]); // dependemos de prices para que re-renderice cuando se actualizan

  // Obtener precios inicialmente con delay
  useEffect(() => {
    if (symbols.length === 0) return;

    // Delay inicial para evitar llamadas al montar
    const initialTimeout = setTimeout(() => {
      console.log('🚀 Carga inicial de precios (con delay de 1s)');
      fetchPrices();
    }, PRICE_UPDATE_CONFIG.INITIAL_DELAY);

    return () => clearTimeout(initialTimeout);
  }, [symbols.join(',')]); // Solo cuando cambian los símbolos

  // Actualizar precios periódicamente (configurable)
  useEffect(() => {
    if (symbols.length === 0) return;

    // Configurar actualización periódica
    const interval = setInterval(() => {
      console.log(`🔄 Actualización periódica de precios (cada ${updateInterval/60000} minutos)`);
      fetchPrices();
    }, updateInterval);

    const minutes = updateInterval / 60000;
    console.log(`📅 Programada actualización de precios cada ${minutes} minutos`);
    
    return () => {
      clearInterval(interval);
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [symbols.join(','), updateInterval, fetchPrices]);

  // Función manual para refrescar
  const refreshPrices = useCallback(() => {
    fetchPrices();
  }, [fetchPrices]);

  return {
    prices,
    loading,
    error,
    lastUpdate,
    getPrice,
    getUnrealizedPnL,
    getDailyVariation,
    refreshPrices,
    symbols
  };
};
