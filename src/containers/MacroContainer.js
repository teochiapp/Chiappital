import React, { useState, useEffect } from 'react';
import MacroPage from '../components/Macro/MacroPage';
import finnhubService from '../services/finnhubService';
import yahooFinanceService from '../services/yahooFinanceService';
import symbolSearchService from '../services/symbolSearchService';

const MacroContainer = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    earningsDate: null,
    earnings: { bmo: [], amc: [], other: [] },
    forex: [],
    macro: [],
    commodities: [],
    news: []
  });

  useEffect(() => {
    const fetchMacroData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Fetch Earnings
        // Si es fin de semana (sábado 6 o domingo 0), buscamos los del viernes pasado para que haya datos.
        let earningsDate = new Date();
        const dayOfWeek = earningsDate.getDay();
        if (dayOfWeek === 6) earningsDate.setDate(earningsDate.getDate() - 1);
        if (dayOfWeek === 0) earningsDate.setDate(earningsDate.getDate() - 2);

        const pad = (n) => n.toString().padStart(2, '0');
        const targetEarningsDate = `${earningsDate.getFullYear()}-${pad(earningsDate.getMonth() + 1)}-${pad(earningsDate.getDate())}`;

        // 2. Fetch Forex (Yahoo)
        const forexSymbols = ['EURUSD=X', 'JPY=X', 'BRL=X', 'CNY=X', 'KRW=X'];

        // 3. Fetch Macro (Yahoo) - incluye ETFs para ratios
        const macroSymbols = ['^TNX', 'DX-Y.NYB', '^VIX', 'QQQ', 'SPY', 'IGV', 'SMH', 'IWM'];
        
        // Fetch Commodities (Yahoo)
        const commoditySymbols = ['CL=F', 'XAUUSD=X', 'XAGUSD=X', 'HG=F', 'ZS=F', 'ZW=F', 'ZC=F', 'NG=F'];

        // 4. Fetch DolarAPI (Argentina)
        const fetchDolarApi = fetch('https://dolarapi.com/v1/dolares').then(res => res.json()).catch(() => []);

        // Ejecutamos primero las de Finnhub de forma secuencial para evitar rate limits
        const earningsRes = await finnhubService.getEarningsCalendar(targetEarningsDate, targetEarningsDate);
        const newsRes = await finnhubService.getMarketNews('general');

        // El resto (Yahoo y DolarAPI) puede ir en paralelo
        const [forexRes, macroRes, dolarRes, commodityRes] = await Promise.all([
          yahooFinanceService.getMultipleQuotes(forexSymbols),
          yahooFinanceService.getMultipleQuotes(macroSymbols),
          fetchDolarApi,
          yahooFinanceService.getMultipleQuotes(commoditySymbols)
        ]);

        // Process Earnings
        const processedEarnings = { bmo: [], amc: [], other: [] };
        if (Array.isArray(earningsRes)) {
          const knownSymbols = new Set([
            ...symbolSearchService.getPopularSymbols().map(s => s.symbol),
            ...symbolSearchService.getAllCedears().map(s => s.symbol),
            'FSLR'
          ]);

          earningsRes.forEach(item => {
            if (item.symbol && knownSymbols.has(item.symbol)) {
              if (item.hour === 'bmo') processedEarnings.bmo.push(item);
              else if (item.hour === 'amc') processedEarnings.amc.push(item);
              else processedEarnings.other.push(item);
            }
          });
        }

        // Process Forex
        const processedForex = forexRes.map(item => {
          let name = '';
          let iso = null;
          let price = item.data ? item.data.price : 0;
          const change = item.data ? item.data.changePercent : 0;

          switch (item.symbol) {
            case 'EURUSD=X': name = 'EUR/USD'; iso = 'eu'; break;
            case 'JPY=X': name = 'USD/JPY'; iso = 'jp'; break;
            case 'BRL=X': name = 'USD/BRL'; iso = 'br'; break;
            case 'CNY=X': name = 'USD/CNY'; iso = 'cn'; break;
            case 'KRW=X': name = 'USD/KRW'; iso = 'kr'; break;
            default: name = item.symbol;
          }

          return { symbol: item.symbol, name, price, change, iso };
        });

        // Add Argentina Dolar (from DolarAPI)
        if (Array.isArray(dolarRes)) {
          const mep = dolarRes.find(d => d.casa === 'mep');
          const ccl = dolarRes.find(d => d.casa === 'contadoconliqui');
          const oficial = dolarRes.find(d => d.casa === 'oficial');

          if (oficial) {
            processedForex.push({ symbol: 'ARS_OFICIAL', name: 'USD/ARS Oficial', price: oficial.venta, change: null, iso: 'ar' });
          }
          if (mep) {
            processedForex.push({ symbol: 'ARS_MEP', name: 'USD/ARS MEP', price: mep.venta, change: null, iso: 'ar' });
          }
          if (ccl) {
            processedForex.push({ symbol: 'ARS_CCL', name: 'USD/ARS CCL', price: ccl.venta, change: null, iso: 'ar' });
          }
        }

        // Process Macro
        const processedMacro = [];
        const macroDict = {};

        macroRes.forEach(item => {
          if (!item.data) return;

          let name = '';
          const price = item.data.price || 0;
          const change = item.data.changePercent || 0;

          macroDict[item.symbol] = { price, change };

          switch (item.symbol) {
            case '^TNX': name = '10Y Treasury'; break;
            case 'DX-Y.NYB': name = 'DXY (Dollar Index)'; break;
            case '^VIX': name = 'VIX Volatility'; break;
            default: return; // Ignore ETFs individually
          }
          processedMacro.push({ symbol: item.symbol, name, price, change });
        });

        // Helper for ratio
        const calculateRatio = (symA, symB, nameA, nameB) => {
          const dataA = macroDict[symA];
          const dataB = macroDict[symB];

          if (dataA && dataB && dataB.price > 0) {
            const ratioPrice = dataA.price / dataB.price;

            const oldPriceA = dataA.price / (1 + (dataA.change / 100));
            const oldPriceB = dataB.price / (1 + (dataB.change / 100));
            const oldRatioPrice = oldPriceA / oldPriceB;

            const ratioChange = ((ratioPrice / oldRatioPrice) - 1) * 100;

            const ratioSymbol = `${symA}/${symB}`;

            processedMacro.push({
              symbol: ratioSymbol,
              name: `Ratio ${nameA}/${nameB}`,
              price: ratioPrice,
              change: ratioChange
            });
          }
        };

        calculateRatio('QQQ', 'SPY', 'QQQ', 'SPY');
        calculateRatio('IGV', 'SMH', 'IGV', 'SMH');
        calculateRatio('IWM', 'SPY', 'IWM', 'SPY');

        const goodKeywords = [
          // Bancos centrales
          'fed',
          'fomc',
          'powell',
          'ecb',
          'boj',
          'bank of japan',
          'bank of england',
          'pboc',
          'central bank',

          // Inflación
          'cpi',
          'pce',
          'ppi',
          'inflation',
          'deflation',

          // Economía
          'gdp',
          'payroll',
          'nonfarm payroll',
          'employment',
          'unemployment',
          'jobless claims',
          'retail sales',
          'consumer confidence',
          'manufacturing',
          'ism',
          'pmi',

          // Bonos
          'treasury',
          'yield',
          'bond',

          // Empresas
          'earnings',
          'revenue',
          'eps',
          'guidance',
          'forecast',
          'profit',
          'quarterly results',

          // Mercado
          'recession',
          'tariff',
          'trade',
          'sanctions',
          'oil',
          'brent',
          'gold',
          'bitcoin'
        ];
        const badKeywords = [
          'cramer',
          'odds',
          'prediction',
          'opinion',
          'editorial',
          'watch',
          'live blog',

          // Entretenimiento
          'movie',
          'tv',
          'series',
          'celebrity',
          'hollywood',
          'kardashian',
          'music',

          // Deportes
          'nba',
          'nfl',
          'mlb',
          'soccer',
          'football',
          'tennis',

          // Clickbait
          'should you buy',
          'top 10',
          'best stocks',
          'millionaire',
          'becomes rich',
          'here is why',
          '5 reasons',
          'prediction',

          // Cripto basura
          'memecoin',
          'dogecoin price prediction',
          'shiba',

          // Curiosidades
          'viral',
          'meme',
          'instagram',
          'tiktok'
        ];

        let filteredNews = [];
        if (Array.isArray(newsRes)) {
          filteredNews = newsRes.filter(article => {
            const text = ((article.headline || '') + " " + (article.summary || '')).toLowerCase();

            // Si tiene alguna palabra bloqueada, lo descartamos
            if (badKeywords.some(bad => text.includes(bad))) return false;

            // Si tiene alguna palabra buena, lo aprobamos
            if (goodKeywords.some(good => text.includes(good))) return true;

            // Por defecto, si no califica para ninguna, lo descartamos (para ser estrictos con la calidad)
            return false;
          });
        }

        // Si el filtro estricto nos dejó sin noticias (raro), hacemos fallback a las generales filtrando solo las malas
        if (filteredNews.length < 5 && Array.isArray(newsRes)) {
          filteredNews = newsRes.filter(article => {
            const text = ((article.headline || '') + " " + (article.summary || '')).toLowerCase();
            return !badKeywords.some(bad => text.includes(bad));
          });
        }

        // Process News (take top 15 of the filtered ones)
        const processedNews = filteredNews.slice(0, 15);

        // Process Commodities
        const processedCommodities = commodityRes.map(item => {
          let name = '';
          switch (item.symbol) {
            case 'CL=F': name = '🛢️ Petróleo'; break;
            case 'XAUUSD=X': name = '🥇 Oro'; break;
            case 'XAGUSD=X': name = '🥈 Plata'; break;
            case 'HG=F': name = '🟠 Cobre'; break;
            case 'ZS=F': name = '🌱 Soja'; break;
            case 'ZW=F': name = '🌾 Trigo'; break;
            case 'ZC=F': name = '🌽 Maíz'; break;
            case 'NG=F': name = '🔥 Gas Natural'; break;
            default: name = item.symbol;
          }
          return {
            symbol: item.symbol,
            name,
            price: item.data ? item.data.price : 0,
            change: item.data ? item.data.changePercent : 0
          };
        });

        setData({
          earningsDate: targetEarningsDate,
          earnings: processedEarnings,
          forex: processedForex,
          macro: processedMacro,
          commodities: processedCommodities,
          news: processedNews
        });

      } catch (err) {
        console.error('Error fetching macro data:', err);
        setError('Error al cargar datos macro. Por favor, intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchMacroData();
  }, []);

  return (
    <MacroPage
      data={data}
      loading={loading}
      error={error}
    />
  );
};

export default MacroContainer;
