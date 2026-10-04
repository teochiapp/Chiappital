// hooks/useApiTrades.js - Hook para manejar trades con el backend Express
// (Reemplaza useStrapiTrades.js - la interfaz exportada es 100% compatible)
import { useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../services/apiService';
import { useAccount } from '../context/AccountContext';

// Configuración de caché y polling
const API_CONFIG = {
  CACHE_DURATION: 30 * 1000, // 30 segundos de caché
  POLLING_INTERVAL: 60 * 1000, // 1 minuto entre actualizaciones automáticas
  ENABLE_POLLING: false, // Solo refresh manual por defecto
};

export const useStrapiTrades = () => {
  const { accountType } = useAccount();
  const [trades, setTrades] = useState([]);
  const [openTrades, setOpenTrades] = useState([]);
  const [closedTrades, setClosedTrades] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastFetchRef = useRef(0);
  const isFetchingRef = useRef(false);

  const loadTrades = useCallback(async (force = false) => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchRef.current;

    if (!force && timeSinceLastFetch < API_CONFIG.CACHE_DURATION) {
      console.log(`📦 Usando datos en caché (${Math.round(timeSinceLastFetch / 1000)}s desde última carga)`);
      return;
    }

    if (isFetchingRef.current) {
      console.log('⏳ Ya hay una carga de trades en progreso, saltando...');
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      console.log(`🔄 Cargando trades desde API (cartera: ${accountType})...`);
      const tradesData = await apiService.getTrades(accountType);
      const statsData = await apiService.getTradeStats(accountType);

      const open = tradesData.filter(t => t.status === 'open');
      const closed = tradesData.filter(t => t.status === 'closed');

      setTrades(tradesData);
      setOpenTrades(open);
      setClosedTrades(closed);
      setStats(statsData);

      lastFetchRef.current = now;
      console.log('✅ Trades cargados exitosamente');
    } catch (err) {
      console.error('❌ Error cargando trades:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [accountType]);

  const createTrade = useCallback(async (tradeData) => {
    try {
      const newTrade = await apiService.createTrade(tradeData, accountType);
      await loadTrades(true);
      return newTrade;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [loadTrades, accountType]);

  const updateTrade = useCallback(async (tradeId, tradeData) => {
    try {
      const updatedTrade = await apiService.updateTrade(tradeId, tradeData);
      await loadTrades(true);
      return updatedTrade;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [loadTrades]);

  const deleteTrade = useCallback(async (tradeId) => {
    try {
      await apiService.deleteTrade(tradeId);
      await loadTrades(true);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [loadTrades]);

  const closeTrade = useCallback(async (tradeId, exitPrice, result, notes = '', partialData = null) => {
    try {
      const closedTrade = await apiService.closeTrade(tradeId, exitPrice, result, notes, partialData);
      await loadTrades(true);
      return closedTrade;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [loadTrades]);

  // Carga inicial y cuando cambia la cuenta
  useEffect(() => {
    console.log(`🚀 Carga inicial de trades para cuenta: ${accountType}`);
    loadTrades(true);
  }, [accountType]); // Dependencia clave para recargar al cambiar de cuenta

  // Polling opcional (desactivado por defecto)
  useEffect(() => {
    if (!API_CONFIG.ENABLE_POLLING) return;

    const interval = setInterval(() => {
      console.log('🔄 Actualización periódica de trades');
      loadTrades();
    }, API_CONFIG.POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [loadTrades]);

  return {
    trades,
    openTrades,
    closedTrades,
    stats,
    loading,
    error,
    createTrade,
    updateTrade,
    deleteTrade,
    closeTrade,
    refreshTrades: loadTrades
  };
};

export const useStrapiAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔐 Intentando login...', { email });
      const result = await apiService.login(email, password);

      if (result.success) {
        console.log('✅ Login exitoso:', result.user);
        setUser(result.user);
        setLoading(false);
        return result;
      } else {
        console.error('❌ Login falló:', result.error);
        setError(result.error);
        setLoading(false);
        return result;
      }
    } catch (err) {
      console.error('💥 Error en login:', err);
      const errorMsg = 'Error de conexión con el servidor';
      setError(errorMsg);
      setLoading(false);
      return { success: false, error: errorMsg };
    }
  }, []);

  const familyLogin = useCallback(async (answer) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔐 Intentando login familiar...');
      const result = await apiService.familyLogin(answer);

      if (result.success) {
        console.log('✅ Login familiar exitoso:', result.user);
        setUser(result.user);
        setLoading(false);
        return result;
      } else {
        console.error('❌ Login falló:', result.error);
        setError(result.error);
        setLoading(false);
        return result;
      }
    } catch (err) {
      console.error('💥 Error en login familiar:', err);
      const errorMsg = 'Error de conexión con el servidor';
      setError(errorMsg);
      setLoading(false);
      return { success: false, error: errorMsg };
    }
  }, []);

  const logout = useCallback(() => {
    console.log('🚪 Cerrando sesión...');
    apiService.clearToken();
    setUser(null);
    setError(null);
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      console.log('🔍 Verificando autenticación...');
      setLoading(true);

      const isAuthenticated = await apiService.checkAuth();
      console.log('🔍 Resultado checkAuth:', isAuthenticated);

      if (isAuthenticated) {
        const userProfile = await apiService.getUserProfile();
        console.log('👤 Perfil obtenido:', userProfile);
        setUser(userProfile);
      } else {
        console.log('❌ No autenticado');
        setUser(null);
      }
    } catch (err) {
      console.error('💥 Error verificando auth:', err);
      setUser(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Verificar autenticación al montar
  useEffect(() => {
    checkAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    user,
    loading,
    error,
    login,
    familyLogin,
    logout,
    checkAuth
  };
};
