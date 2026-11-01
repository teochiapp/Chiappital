import { useState, useEffect } from 'react';
import yahooFinanceService from '../services/yahooFinanceService';
import { GICS_SECTORS } from '../components/Lab/SectorAnalysis';
import { REGIONS } from '../components/Lab/CountryAnalysis';

export const useSectorialData = () => {
  const [data, setData] = useState({ sectors: [], regions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const allSymbols = [...GICS_SECTORS, ...REGIONS];
      const results = [];

      // Procesar en lotes pequeños o uno por uno
      for (const item of allSymbols) {
        try {
          // Obtener velas de 3 meses para asegurar tener al menos 21 sesiones
          const candles = await yahooFinanceService.getCandles(item.ticker, '1d', '3mo');
          
          if (!candles || candles.length < 22) {
            console.warn(`No hay suficientes datos para ${item.ticker}`);
            results.push({ ...item, error: 'Datos insuficientes' });
            continue;
          }

          // Filtramos velas válidas (por si hay algún null)
          const validCandles = candles.filter(c => c && c.close > 0);
          const len = validCandles.length;
          
          if (len < 22) {
             results.push({ ...item, error: 'Datos insuficientes' });
             continue;
          }

          const lastClose = validCandles[len - 1].close;
          const prevClose = validCandles[len - 2].close;
          
          // 5 sesiones (1 semana)
          const weekClose = validCandles[len - 6].close; 
          
          // 21 sesiones (1 mes)
          const monthClose = validCandles[len - 22].close;

          const dailyPerf = ((lastClose - prevClose) / prevClose) * 100;
          const weeklyPerf = ((lastClose - weekClose) / weekClose) * 100;
          const monthlyPerf = ((lastClose - monthClose) / monthClose) * 100;

          // Extraemos las últimas 21 sesiones para el minigráfico (sparkline)
          const sparkline = validCandles.slice(len - 21).map(c => c.close);
          
          results.push({
            ...item,
            dailyPerf,
            weeklyPerf,
            monthlyPerf,
            sparkline,
            error: null
          });
          
        } catch (err) {
          console.error(`Error obteniendo datos para ${item.ticker}:`, err);
          results.push({ ...item, error: err.message });
        }
      }

      const sectors = results.filter(r => GICS_SECTORS.some(s => s.id === r.id));
      const regions = results.filter(r => REGIONS.some(s => s.id === r.id));

      setData({ sectors, regions });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  return { data, loading, error, refetch: fetchPerformance };
};
