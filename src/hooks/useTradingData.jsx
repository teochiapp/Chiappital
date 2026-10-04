// hooks/useTradingData.js - Hook personalizado para datos de trading con Finnhub
import { useState, useEffect, useCallback, useRef } from 'react';
import finnhubService from '../services/finnhubService';

export const useTradingData = (symbols = ['AAPL', 'MSFT', 'GOOGL']) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const intervalRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Obteniendo datos de trading con Finnhub...');
      const results = await finnhubService.getMultipleQuotes(symbols);
      
      // Verificar si hay errores de rate limiting (Finnhub es más generoso)
      const rateLimitErrors = results.filter(r => r.error && (
        r.error.includes('rate limit') || 
        r.error.includes('too many requests') ||
        r.error.includes('429')
      ));
      if (rateLimitErrors.length > 0) {
        setIsRateLimited(true);
        console.warn('Rate limit detectado, pausando actualizaciones automáticas');
      } else {
        setIsRateLimited(false);
      }
      
      setData(results);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error en fetchData:', err);
      setError(err.message);
      
      // Si es error de rate limiting, pausar actualizaciones
      if (err.message.includes('rate limit') || err.message.includes('too many requests') || err.message.includes('429')) {
        setIsRateLimited(true);
      }
    } finally {
      setLoading(false);
    }
  }, [symbols]);

  const refreshData = useCallback(() => {
    if (isRateLimited) {
      console.log('Rate limit activo, esperando antes de actualizar...');
      return;
    }
    fetchData();
  }, [fetchData, isRateLimited]);

  // Función para reintentar después de rate limiting
  const retryAfterRateLimit = useCallback(() => {
    if (isRateLimited) {
      console.log('Reintentando después de rate limit...');
      setIsRateLimited(false);
      fetchData();
    }
  }, [isRateLimited, fetchData]);

  useEffect(() => {
    fetchData();
    
    // Actualizar datos cada 5 minutos (Finnhub es más generoso)
    intervalRef.current = setInterval(() => {
      if (!isRateLimited) {
        fetchData();
      }
    }, 5 * 60 * 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [fetchData, isRateLimited]);

  // Auto-retry después de rate limiting (5 minutos)
  useEffect(() => {
    if (isRateLimited) {
      retryTimeoutRef.current = setTimeout(() => {
        retryAfterRateLimit();
      }, 5 * 60 * 1000); // 5 minutos
    }
  }, [isRateLimited, retryAfterRateLimit]);

  return {
    data,
    loading,
    error,
    lastUpdate,
    isRateLimited,
    refreshData,
    retryAfterRateLimit
  };
};

export const useSingleSymbol = (symbol) => {
  const [quote, setQuote] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSymbolData = useCallback(async () => {
    if (!symbol) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const quoteData = await finnhubService.getQuote(symbol);
      
      // Obtener datos históricos de los últimos 30 días
      const to = Math.floor(Date.now() / 1000);
      const from = to - (30 * 24 * 60 * 60); // 30 días atrás
      const historicalData = await finnhubService.getCandles(symbol, 'D', from, to);
      
      setQuote(quoteData);
      setHistoricalData(historicalData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchSymbolData();
  }, [fetchSymbolData]);

  return {
    quote,
    historicalData,
    loading,
    error,
    refetch: fetchSymbolData
  };
};

export const useSymbolSearch = (keywords) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchSymbols = useCallback(async (searchKeywords) => {
    if (!searchKeywords || searchKeywords.length < 2) {
      setResults([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const searchResults = await finnhubService.searchSymbol(searchKeywords);
      setResults(searchResults);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (keywords) {
      const timeoutId = setTimeout(() => {
        searchSymbols(keywords);
      }, 500); // Debounce de 500ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [keywords, searchSymbols]);

  return {
    results,
    loading,
    error,
    searchSymbols
  };
};
