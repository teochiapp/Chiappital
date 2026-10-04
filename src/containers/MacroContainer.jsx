import React, { useState, useEffect, useRef } from 'react';
import MacroPage from '../components/Macro/MacroPage';
import finnhubService from '../services/finnhubService';
import yahooFinanceService from '../services/yahooFinanceService';
import symbolSearchService from '../services/symbolSearchService';

// ─── Caché de sesión con TTL ──────────────────────────────────────────────────
const CACHE_KEY = 'chiappital_macro_v1';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function getCached() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { payload, ts } = JSON.parse(raw);
    if (Date.now() - ts < CACHE_TTL) return payload;
    sessionStorage.removeItem(CACHE_KEY);
  } catch { /* ignorar */ }
  return null;
}

function saveCache(payload) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ payload, ts: Date.now() }));
  } catch { /* ignorar si el storage está lleno */ }
}

// ─── Helpers de procesamiento (extraídos para reutilización) ──────────────────
function processEarnings(earningsRes) {
  const result = { bmo: [], amc: [], other: [] };
  if (!Array.isArray(earningsRes)) return result;
  const knownSymbols = new Set([
    ...symbolSearchService.getPopularSymbols().map(s => s.symbol),
    ...symbolSearchService.getAllCedears().map(s => s.symbol),
    'FSLR'
  ]);
  earningsRes.forEach(item => {
    if (item.symbol && knownSymbols.has(item.symbol)) {
      if (item.hour === 'bmo') result.bmo.push(item);
      else if (item.hour === 'amc') result.amc.push(item);
      else result.other.push(item);
    }
  });
  return result;
}

function processForex(forexRes, dolarRes) {
  const processed = (forexRes || []).map(item => {
    let name = item.symbol;
    let iso = null;
    switch (item.symbol) {
      case 'EURUSD=X': name = 'EUR/USD'; iso = 'eu'; break;
      case 'JPY=X':    name = 'USD/JPY'; iso = 'jp'; break;
      case 'BRL=X':    name = 'USD/BRL'; iso = 'br'; break;
      case 'CNY=X':    name = 'USD/CNY'; iso = 'cn'; break;
      case 'KRW=X':    name = 'USD/KRW'; iso = 'kr'; break;
      default: break;
    }
    return {
      symbol: item.symbol, name,
      price:  item.data ? item.data.price        : 0,
      change: item.data ? item.data.changePercent : 0,
      iso
    };
  });

  if (Array.isArray(dolarRes)) {
    const oficial = dolarRes.find(d => d.casa === 'oficial');
    const mep     = dolarRes.find(d => d.casa === 'mep');
    const ccl     = dolarRes.find(d => d.casa === 'contadoconliqui');
    if (oficial) processed.push({ symbol: 'ARS_OFICIAL', name: 'USD/ARS Oficial', price: oficial.venta, change: null, iso: 'ar' });
    if (mep)     processed.push({ symbol: 'ARS_MEP',     name: 'USD/ARS MEP',     price: mep.venta,     change: null, iso: 'ar' });
    if (ccl)     processed.push({ symbol: 'ARS_CCL',     name: 'USD/ARS CCL',     price: ccl.venta,     change: null, iso: 'ar' });
  }
  return processed;
}

function processMacro(macroRes) {
  const processed = [];
  const dict = {};

  (macroRes || []).forEach(item => {
    if (!item.data) return;
    const price  = item.data.price        || 0;
    const change = item.data.changePercent || 0;
    dict[item.symbol] = { price, change };

    let name = '';
    switch (item.symbol) {
      case '^TNX':     name = '10Y Treasury';    break;
      case 'DX-Y.NYB': name = 'DXY (Dollar Index)'; break;
      case '^VIX':     name = 'VIX Volatility'; break;
      default: return;
    }
    processed.push({ symbol: item.symbol, name, price, change });
  });

  const addRatio = (symA, symB, nameA, nameB) => {
    const a = dict[symA], b = dict[symB];
    if (!a || !b || b.price <= 0) return;
    const ratioPrice   = a.price / b.price;
    const oldA = a.price / (1 + a.change / 100);
    const oldB = b.price / (1 + b.change / 100);
    const ratioChange  = ((ratioPrice / (oldA / oldB)) - 1) * 100;
    processed.push({ symbol: `${symA}/${symB}`, name: `Ratio ${nameA}/${nameB}`, price: ratioPrice, change: ratioChange });
  };
  addRatio('QQQ', 'SPY', 'QQQ', 'SPY');
  addRatio('IGV', 'SMH', 'IGV', 'SMH');
  addRatio('IWM', 'SPY', 'IWM', 'SPY');
  return processed;
}

function processNews(newsRes) {
  const goodKeywords = [
    'fed','fomc','powell','ecb','boj','bank of japan','bank of england','pboc','central bank',
    'cpi','pce','ppi','inflation','deflation',
    'gdp','payroll','nonfarm payroll','employment','unemployment','jobless claims',
    'retail sales','consumer confidence','manufacturing','ism','pmi',
    'treasury','yield','bond',
    'earnings','revenue','eps','guidance','forecast','profit','quarterly results',
    'recession','tariff','trade','sanctions','oil','brent','gold','bitcoin'
  ];
  const badKeywords = [
    'cramer','odds','opinion','editorial','watch','live blog',
    'movie','tv','series','celebrity','hollywood','kardashian','music',
    'nba','nfl','mlb','soccer','football','tennis',
    'should you buy','top 10','best stocks','millionaire','becomes rich','here is why','5 reasons',
    'memecoin','dogecoin price prediction','shiba',
    'viral','meme','instagram','tiktok'
  ];

  if (!Array.isArray(newsRes)) return [];
  let filtered = newsRes.filter(a => {
    const t = ((a.headline || '') + ' ' + (a.summary || '')).toLowerCase();
    if (badKeywords.some(b => t.includes(b))) return false;
    return goodKeywords.some(g => t.includes(g));
  });
  // Fallback si el filtro estricto dejó muy pocas noticias
  if (filtered.length < 5) {
    filtered = newsRes.filter(a => {
      const t = ((a.headline || '') + ' ' + (a.summary || '')).toLowerCase();
      return !badKeywords.some(b => t.includes(b));
    });
  }
  return filtered.slice(0, 15);
}

function processCommodities(commodityRes) {
  return (commodityRes || []).map(item => {
    let name = item.symbol;
    switch (item.symbol) {
      case 'CL=F':     name = '🛢️ Petróleo';    break;
      case 'GC=F':     name = '🥇 Oro';          break;
      case 'SI=F':     name = '🥈 Plata';         break;
      case 'HG=F':     name = '🟠 Cobre';         break;
      case 'ZS=F':     name = '🌱 Soja';          break;
      case 'ZW=F':     name = '🌾 Trigo';         break;
      case 'ZC=F':     name = '🌽 Maíz';          break;
      case 'NG=F':     name = '🔥 Gas Natural';   break;
      default: break;
    }
    return {
      symbol: item.symbol, name,
      price:  item.data ? item.data.price        : 0,
      change: item.data ? item.data.changePercent : 0
    };
  });
}

// ─── Estado inicial vacío reutilizable ───────────────────────────────────────
const EMPTY_DATA = {
  earningsDate: null,
  earnings: { bmo: [], amc: [], other: [] },
  forex: [],
  macro: [],
  commodities: [],
  news: []
};

// ─── Estado de loading por sección ───────────────────────────────────────────
const ALL_LOADING = { earnings: true, forex: true, macro: true, commodities: true, news: true };
const ALL_DONE    = { earnings: false, forex: false, macro: false, commodities: false, news: false };

// ─── Componente ──────────────────────────────────────────────────────────────
const MacroContainer = () => {
  const [data, setData]               = useState(EMPTY_DATA);
  const [sectionLoading, setSL]       = useState(ALL_LOADING);
  const [error, setError]             = useState(null);
  const isMounted                     = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    // ── 1. Intentar caché primero (carga instantánea en revisitas) ────────
    const cached = getCached();
    if (cached) {
      setData(cached);
      setSL(ALL_DONE);
      return;
    }

    // ── 2. Preparar fecha de earnings ─────────────────────────────────────
    const earningsDate = new Date();
    const dow = earningsDate.getDay();
    if (dow === 6) earningsDate.setDate(earningsDate.getDate() - 1);
    if (dow === 0) earningsDate.setDate(earningsDate.getDate() - 2);
    const pad = n => n.toString().padStart(2, '0');
    const targetEarningsDate = `${earningsDate.getFullYear()}-${pad(earningsDate.getMonth() + 1)}-${pad(earningsDate.getDate())}`;

    // ── 3. Disparar TODAS las fetches en paralelo ────────────────────────
    // Ninguna espera a otra — Yahoo, Finnhub y DolarAPI arrancan al mismo tiempo.
    const forexSymbols     = ['DX-Y.NYB', 'EURUSD=X', 'JPY=X', 'CNY=X', 'BRL=X', 'KRW=X'];
    const macroSymbols     = ['SPY', 'QQQ', 'IWM', '^VIX', '^TNX', 'SMH', 'IGV'];
    const commoditySymbols = ['CL=F', 'GC=F', 'SI=F', 'HG=F', 'ZS=F', 'ZW=F', 'ZC=F', 'NG=F'];

    const earningsPromise    = finnhubService.getEarningsCalendar(targetEarningsDate, targetEarningsDate).catch(() => []);
    const newsPromise        = finnhubService.getMarketNews('general').catch(() => []);
    const forexPromise       = yahooFinanceService.getMultipleQuotes(forexSymbols).catch(() => []);
    const macroPromise       = yahooFinanceService.getMultipleQuotes(macroSymbols).catch(() => []);
    const commodityPromise   = yahooFinanceService.getMultipleQuotes(commoditySymbols).catch(() => []);
    const dolarPromise       = fetch('https://dolarapi.com/v1/dolares').then(r => r.json()).catch(() => []);

    // ── 4. Actualizar cada sección apenas llegue (progressive rendering) ──

    // Forex + Dólar (se combinan porque el dólar enriquece forex)
    Promise.all([forexPromise, dolarPromise]).then(([forexRes, dolarRes]) => {
      if (!isMounted.current) return;
      setData(prev => ({ ...prev, forex: processForex(forexRes, dolarRes) }));
      setSL(prev => ({ ...prev, forex: false }));
    });

    // Macro (ratios dependen de macroRes solo)
    macroPromise.then(macroRes => {
      if (!isMounted.current) return;
      setData(prev => ({ ...prev, macro: processMacro(macroRes) }));
      setSL(prev => ({ ...prev, macro: false }));
    });

    // Commodities
    commodityPromise.then(commodityRes => {
      if (!isMounted.current) return;
      setData(prev => ({ ...prev, commodities: processCommodities(commodityRes) }));
      setSL(prev => ({ ...prev, commodities: false }));
    });

    // News (Finnhub — puede ser más lenta)
    newsPromise.then(newsRes => {
      if (!isMounted.current) return;
      setData(prev => ({ ...prev, news: processNews(newsRes) }));
      setSL(prev => ({ ...prev, news: false }));
    });

    // Earnings (Finnhub — puede ser más lenta)
    earningsPromise.then(earningsRes => {
      if (!isMounted.current) return;
      setData(prev => ({ ...prev, earnings: processEarnings(earningsRes), earningsDate: targetEarningsDate }));
      setSL(prev => ({ ...prev, earnings: false }));
    });

    // ── 5. Guardar en caché cuando TODO esté listo ─────────────────────
    Promise.all([forexPromise, dolarPromise, macroPromise, commodityPromise, newsPromise, earningsPromise])
      .then(([forexRes, dolarRes, macroRes, commodityRes, newsRes, earningsRes]) => {
        if (!isMounted.current) return;
        const fullData = {
          earningsDate: targetEarningsDate,
          earnings:    processEarnings(earningsRes),
          forex:       processForex(forexRes, dolarRes),
          macro:       processMacro(macroRes),
          commodities: processCommodities(commodityRes),
          news:        processNews(newsRes)
        };
        saveCache(fullData);
      })
      .catch(err => {
        if (!isMounted.current) return;
        console.error('Error fetching macro data:', err);
        setError('Error al cargar datos macro. Intenta de nuevo más tarde.');
        setSL(ALL_DONE);
      });

    return () => { isMounted.current = false; };
  }, []);

  return (
    <MacroPage
      data={data}
      sectionLoading={sectionLoading}
      error={error}
    />
  );
};

export default MacroContainer;
