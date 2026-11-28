import { useState, useEffect, useCallback, useRef } from 'react';
import yahooFinanceService from '../services/yahooFinanceService';
import { GICS_SECTORS } from '../components/Lab/SectorAnalysis';
import { REGIONS } from '../components/Lab/CountryAnalysis';
import { computeRrgGroup } from '../utils/rrgCalculator';

const CACHE_KEY = 'chiappital_sectorial_v4';
const FRESH_TTL = 15 * 60 * 1000;         // 15 minutos fresco
const MAX_STALE_TTL = 48 * 60 * 60 * 1000; // 48 horas apto para render instantáneo SWR

function getCachedData() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return { payload: null, isFresh: false };
    const { payload, ts } = JSON.parse(raw);
    const age = Date.now() - ts;
    if (age < FRESH_TTL) {
      return { payload, isFresh: true };
    }
    if (age < MAX_STALE_TTL) {
      return { payload, isFresh: false };
    }
  } catch { /* ignorar */ }
  return { payload: null, isFresh: false };
}

function saveCachedData(payload) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ payload, ts: Date.now() }));
  } catch { /* ignorar */ }
}

export const useSectorialData = () => {
  const [data, setData] = useState({ sectors: [], regions: [], rrg: { benchmark: 'SPY', sectors: [], regions: [] } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  // Fallback en cliente procesado en lotes paralelos si el backend falla o aún no incluye rrg
  const runClientFallback = useCallback(async () => {
    const allSymbols = [...GICS_SECTORS, ...REGIONS];
    const results = [];
    const BATCH_SIZE = 4;

    for (let i = 0; i < allSymbols.length; i += BATCH_SIZE) {
      const chunk = allSymbols.slice(i, i + BATCH_SIZE);
      const promises = chunk.map(async (item) => {
        try {
          const candles = await yahooFinanceService.getCandles(item.ticker, '1d', '6mo');
          if (!candles || candles.length < 22) {
            return { ...item, error: 'Datos insuficientes' };
          }

          const validCandles = candles.filter(c => c && c.close > 0);
          const len = validCandles.length;
          if (len < 22) {
            return { ...item, error: 'Datos insuficientes' };
          }

          const lastClose = validCandles[len - 1].close;
          const prevClose = validCandles[len - 2].close;
          const weekClose = validCandles[Math.max(0, len - 6)].close;
          const monthClose = validCandles[Math.max(0, len - 22)].close;

          const dailyPerf = ((lastClose - prevClose) / prevClose) * 100;
          const weeklyPerf = ((lastClose - weekClose) / weekClose) * 100;
          const monthlyPerf = ((lastClose - monthClose) / monthClose) * 100;
          const sparkline = validCandles.slice(Math.max(0, len - 21)).map(c => c.close);
          const series = validCandles
            .filter(c => c.time || c.date)
            .map(c => ({
              date: typeof c.time === 'number'
                ? new Date(c.time * 1000).toISOString().slice(0, 10)
                : String(c.date || c.time).slice(0, 10),
              close: c.close
            }));

          return {
            ...item,
            dailyPerf,
            weeklyPerf,
            monthlyPerf,
            sparkline,
            series,
            error: null
          };
        } catch (err) {
          console.error(`Error obteniendo datos para ${item.ticker}:`, err);
          return { ...item, error: err.message };
        }
      });

      const chunkResults = await Promise.all(promises);
      results.push(...chunkResults);
    }

    const spySeries = results.find(r => r.ticker === 'SPY')?.series || [];
    const sectorsWithSeries = results.filter(r => GICS_SECTORS.some(s => s.id === r.id));
    const regionsWithSeries = results.filter(r => REGIONS.some(s => s.id === r.id));
    const stripSeries = ({ series, ...rest }) => rest;

    const fullResult = {
      sectors: sectorsWithSeries.map(stripSeries),
      regions: regionsWithSeries.map(stripSeries),
      rrg: {
        benchmark: 'SPY',
        sectors: computeRrgGroup(sectorsWithSeries, spySeries),
        regions: computeRrgGroup(regionsWithSeries, spySeries)
      }
    };

    if (isMounted.current) {
      setData(fullResult);
      saveCachedData(fullResult);
    }
  }, []);

  // Función principal de carga (Backend primario + Fallback cliente)
  const fetchPerformance = useCallback(async (force = false) => {
    try {
      setLoading(true);
      setError(null);

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${baseUrl}/api/market/sector-summary${force ? '?force=true' : ''}`, {
        signal: AbortSignal.timeout(12000)
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} en sector-summary`);
      }

      const backendData = await res.json();
      if (!isMounted.current) return;

      if (backendData && (backendData.sectors?.length > 0 || backendData.regions?.length > 0)) {
        const hasRrg = backendData.rrg && (backendData.rrg.sectors?.length > 0 || backendData.rrg.regions?.length > 0);
        const payload = {
          sectors: backendData.sectors || [],
          regions: backendData.regions || [],
          rrg: backendData.rrg || { benchmark: 'SPY', sectors: [], regions: [] }
        };
        setData(payload);
        if (hasRrg) {
          saveCachedData(payload);
          return;
        }
        // Si el backend remoto aún no tiene RRG desplegado, enriquecemos en cliente
        await runClientFallback();
        return;
      }

      throw new Error('Respuesta vacía del backend');
    } catch (err) {
      console.warn('Backend sector-summary no disponible, usando fallback en cliente:', err.message);
      await runClientFallback();
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [runClientFallback]);

  useEffect(() => {
    isMounted.current = true;

    // ── 1. SWR: Intentar leer inmediatamente de caché ──────────────────────
    const { payload, isFresh } = getCachedData();
    const hasRrg = payload?.rrg && (payload.rrg.sectors?.length > 0 || payload.rrg.regions?.length > 0);
    if (payload && (payload.sectors?.length > 0 || payload.regions?.length > 0) && hasRrg) {
      setData(payload);
      setLoading(false);
      if (isFresh) {
        return;
      }
    }

    // ── 2. En segundo plano o si no hay caché, revalidar ──────────────────
    fetchPerformance(false);

    return () => { isMounted.current = false; };
  }, [fetchPerformance]);

  const refetch = useCallback(() => {
    return fetchPerformance(true);
  }, [fetchPerformance]);

  return { data, loading, error, refetch };
};
