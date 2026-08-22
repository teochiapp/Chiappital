import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { RefreshCw, AlertCircle, TrendingUp, TrendingDown, Clock, ChevronDown, ChevronUp, Globe, Layers, Zap, X, 
Target, ChevronRight, BellRing, Activity, BarChart2, Award, Bitcoin, PlayCircle } from 'lucide-react';
import { StyledContainer } from '../common/StyledComponents';
import { SiTradingview } from 'react-icons/si';
import symbolSearchService from '../../services/symbolSearchService';
import priceService from '../../services/priceService';
import rsiService from '../../services/rsiService';
import CreateAlertModal from '../Alerts/CreateAlertModal';
import { colors } from '../../styles/colors';
import { useLabData } from '../../context/LabContext';
import ETFComponentsModal from './ETFComponentsModal';

export const getTVSymbol = (symbol) => {
  if (!symbol) return '';
  if (symbol === 'XAUUSD=X') return 'XAUUSD';
  if (symbol === 'XAGUSD=X') return 'XAGUSD';
  if (symbol === 'CL=F') return 'USOIL';
  if (symbol === 'HG=F') return 'COPPER';
  if (symbol === 'NG=F') return 'NATGAS';
  if (symbol.endsWith('=X')) return symbol.replace('=X', '');
  if (symbol.endsWith('=F')) return symbol.replace('=F', '1!');
  return symbol;
};

// ── MAPEOS LAB (constantes de módulo, fuera del componente para evitar re-creación) ─
const MAP_REGION = {
  'US': 'spy',
  'AR': 'merval',
  'BR': 'ewz',
  'CN': 'fxi',
  'EU': 'vgk',
  'JP': 'ewj',
  'Global': 'btc'
};

const MAP_SECTOR = {
  'Software': 'igv',
  'Semiconductores': 'smh',
  'Inteligencia Artificial': 'botz',
  'IA': 'botz',
  'Criptomonedas': 'btc',
  'Consumo Discrecional': 'xly',
  'Comunicaciones': 'xlc',
  'Financiero': 'xlf',
  'Industrial': 'xli',
  'Salud': 'xlv',
  'Consumo Básico': 'xlp',
  'Energía': 'xle',
  'Servicios Públicos': 'xlu',
  'Real Estate': 'xlre',
  'Materiales': 'xlb',
  'Technology': 'igv',
  'Financial': 'xlf',
  'Energy': 'xle',
};

// Nombres de las regiones
const REGION_LABELS = {
  US:     'USA',
  AR:     'Argentina',
  BR:     'Brasil',
  CN:     'China',
  EU:     'Europa',
  JP:     'Japón',
  IN:     'India',
  Global: 'Criptos',
  Commodities: 'Commodities',
};

// Códigos ISO 3166-1 alpha-2 para flagcdn.com
const REGION_ISO = {
  US:     'us',
  AR:     'ar',
  BR:     'br',
  CN:     'cn',
  EU:     'eu',
  JP:     'jp',
  IN:     'in',
  Global: null, // sin bandera
  Commodities: null, // sin bandera
};

const ACTIONABLE_STATES = new Set([
  'bullish_breakout',
  'bullish_pullback',
  'bullish_reversal_confirmed',
  'early_bullish_reversal'
]);

const isActionable = (setupState) => {
  return ACTIONABLE_STATES.has(setupState);
};

// Componente bandera + nombre
export const RegionFlag = ({ code, showName = true }) => {
  const iso = REGION_ISO[code];
  const name = REGION_LABELS[code] || code;
  return (
    <RegionFlagWrap>
      {iso
        ? <img
            src={`https://flagcdn.com/20x15/${iso}.png`}
            srcSet={`https://flagcdn.com/40x30/${iso}.png 2x`}
            width="20" height="15"
            alt={name}
            style={{ borderRadius: 2, objectFit: 'cover', flexShrink: 0 }}
          />
        : (code === 'Commodities' 
            ? <Layers size={18} color="#eab308" style={{ flexShrink: 0 }} /> 
            : <Bitcoin size={18} color="#f59e0b" style={{ flexShrink: 0 }} />)
      }
      {showName && <span>{name}</span>}
    </RegionFlagWrap>
  );
};

const ScreenerPage = () => {
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [stockData, setStockData]   = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [sortKey, setSortKey]       = useState('symbol');
  const [sortDir, setSortDir]       = useState('asc');
  const [filterRegion, setFilterRegion] = useState('ALL');
  const [filterSector, setFilterSector] = useState('ALL');
  const [selectedScanRsi, setSelectedScanRsi] = useState([]);
  const [selectedScanMacd, setSelectedScanMacd] = useState([]);
  const [selectedScanDrawdown, setSelectedScanDrawdown] = useState([]);
  const [selectedScanRs, setSelectedScanRs] = useState([]);
  const [selectedScanOpScore, setSelectedScanOpScore] = useState([]);
  const [groupMode, setGroupMode]   = useState('general'); // 'region' | 'sector' | 'general'
  const [symbolsList] = useState(() => symbolSearchService.getPopularSymbols());

  const toggleFilter = (setState, value) => {
    setState(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  // Data del laboratorio (Sectores y Paises)
  const { sectorData, countryData } = useLabData();

  // ── Scan Rápido ──────────────────────────────────────────────────────────────
  const [showScan, setShowScan]         = useState(false);
  const [selectedScanRegions, setSelectedScanRegions] = useState([]);
  const [selectedScanSectors, setSelectedScanSectors] = useState([]);
  const [selectedScanStates, setSelectedScanStates] = useState([]);
  const [scanThreshold, setScanThreshold] = useState(1.0); // %
  const [scanResults, setScanResults]   = useState([]);
  const [scanRan, setScanRan]           = useState(false);
  const [scanLoading, setScanLoading]   = useState(false);

  // ── Alertas ───────────────────────────────────────────────────────────────
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertInitialData, setAlertInitialData] = useState(null);

  const handleOpenAlert = (symbol, price) => {
    setAlertInitialData({ symbol, currentPrice: price });
    setShowAlertModal(true);
  };

  // ── OP Score Modal ────────────────────────────────────────────────────────
  const [showOpScoreModal, setShowOpScoreModal] = useState(false);
  const [opScoreModalData, setOpScoreModalData] = useState(null);

  const handleOpenOpScore = (stock) => {
    if (!stock.opScoreConclusions || stock.opScoreConclusions.length === 0) return;
    setOpScoreModalData(stock);
    setShowOpScoreModal(true);
  };

  // ── ETF Component Drill-down Modal ────────────────────────────────────────
  const [selectedETF, setSelectedETF] = useState(null);
  
  const handleOpenETF = (symbol) => {
    const symbolLower = symbol.toLowerCase();
    
    // Buscar en MAP_REGION
    const regionEntries = Object.entries(MAP_REGION);
    const rMatch = regionEntries.find(([k, v]) => v === symbolLower);
    if (rMatch) {
      const regionName = rMatch[0];
      setSelectedETF({
        symbol,
        title: `${symbol} · ${REGION_LABELS[regionName] || regionName}`,
        type: 'Región',
        key: regionName,
        filterType: 'region'
      });
      return;
    }
    
    // Buscar en MAP_SECTOR
    const sectorEntries = Object.entries(MAP_SECTOR);
    const sMatch = sectorEntries.find(([k, v]) => v === symbolLower);
    if (sMatch) {
      const sectorName = sMatch[0];
      setSelectedETF({
        symbol,
        title: `${symbol} · ${sectorName}`,
        type: 'Sector',
        key: sectorName,
        filterType: 'sector'
      });
      return;
    }
  };

  const handleCloseETF = () => setSelectedETF(null);

  const etfComponents = useMemo(() => {
    if (!selectedETF || !stockData || stockData.length === 0) return [];
    let comps = [];
    if (selectedETF.filterType === 'region') {
      comps = stockData.filter(s => s.region === selectedETF.key && s.symbol.toUpperCase() !== selectedETF.symbol.toUpperCase());
    } else if (selectedETF.filterType === 'sector') {
      comps = stockData.filter(s => s.sector === selectedETF.key && s.symbol.toUpperCase() !== selectedETF.symbol.toUpperCase());
    }
    return comps.sort((a, b) => (b.opScore || 0) - (a.opScore || 0));
  }, [stockData, selectedETF]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchScreenerData(false); }, []);

  const fetchScreenerData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      if (forceRefresh) priceService.clearCache();
      const tickers = symbolsList.map(s => s.symbol);
      const quotesMap = await priceService.getMultipleQuotes(tickers);
      
      let latestUpdate = null;

      const combined = symbolsList.map(item => {
        const symbolStr = item.symbol.toUpperCase();
        const quoteData = quotesMap[symbolStr];
        const price = quoteData?.price || 0;
        const changePercent = (quoteData && typeof quoteData.changePercent === 'number' && !isNaN(quoteData.changePercent))
          ? quoteData.changePercent
          : null;
        
        if (quoteData?.updatedAt) {
          const d = new Date(quoteData.updatedAt);
          if (!latestUpdate || d > latestUpdate) latestUpdate = d;
        }
        
        return {
          ...item,
          price,
          changePercent,
          change: (price && changePercent !== null) ? (price * changePercent / 100) : null,
          emaDistance: quoteData?.ema21Distance ?? null,
          weeklyRsi: quoteData?.weeklyRsi ?? null,
          weeklyRsiPrevious: quoteData?.weeklyRsiPrevious ?? null,
          weeklyRsiDelta: quoteData?.weeklyRsiDelta ?? null,
          weeklyMacd: quoteData?.weeklyMacd ?? null,
          weeklyMacdSignal: quoteData?.weeklyMacdSignal ?? null,
          weeklyMacdHist: quoteData?.weeklyMacdHist ?? null,
          weeklyMacdPrev: quoteData?.weeklyMacdPrev ?? null,
          weeklyMacdPrevSignal: quoteData?.weeklyMacdPrevSignal ?? null,
          weeklyMacdPrevHist: quoteData?.weeklyMacdPrevHist ?? null,
          drawdown52w: quoteData?.drawdown52w ?? null,
          rsValue: quoteData?.rsValue ?? null,
          rsPrevious: quoteData?.rsPrevious ?? null,
          rsState: quoteData?.rsState ?? null,
          setupState: quoteData?.setupState ?? null,
          setupVerdict: quoteData?.setupVerdict ?? null,
          setupFactors: quoteData?.setupFactors ?? null,
          opScore: quoteData?.opScore ?? null,
          opScoreConclusions: quoteData?.opScoreConclusions ?? null,
          status: quoteData?.status || 'ERROR'
        };
      });
      setStockData(combined);
      setLastUpdate(latestUpdate || new Date());
      
      const symbolsToFetchRsi = combined
        .filter(item => item.weeklyRsi === null)
        .map(item => item.symbol);

      if (symbolsToFetchRsi.length > 0) {
        rsiService.getMultipleWeeklyRsi(symbolsToFetchRsi, (symbol, rsiData) => {
          if (rsiData && rsiData.current !== null) {
            setStockData(prevData => prevData.map(item => 
              item.symbol === symbol ? { 
                ...item, 
                weeklyRsi: rsiData.current,
                weeklyRsiPrevious: rsiData.previous,
                weeklyRsiDelta: rsiData.delta
              } : item
            ));
          } else if (rsiData && rsiData.current === null) {
            // Manejo de error gracefully: marcamos como N/A para no quedar iterando
            setStockData(prevData => prevData.map(item => 
              item.symbol === symbol ? { ...item, weeklyRsi: 'N/A' } : item
            ));
          }
        }).catch(err => console.warn('Error en fetch RSI:', err));
      }
      
    } catch (err) {
      console.error(err);
      setError('Error al obtener datos del screener');
    } finally {
      setLoading(false);
    }
  }, [symbolsList]);


  const handleRefresh = () => fetchScreenerData(true);

  // ── Ejecutar Scan Rápido ─────────────────────────────────────────────────────
  const runQuickScan = useCallback(() => {
    setScanLoading(true);
    setScanRan(false);

    // Pequeño timeout para que el spinner se vea
    setTimeout(() => {
      let pool = stockData.filter(s => s.type !== 'ETF' && s.sector !== 'ETF');

      const isRegionSelected = selectedScanRegions.length > 0;
      const isSectorSelected = selectedScanSectors.length > 0;

      if (isRegionSelected && isSectorSelected) {
        pool = pool.filter(s => selectedScanRegions.includes(s.region) || selectedScanSectors.includes(s.sector));
      } else if (isRegionSelected) {
        pool = pool.filter(s => selectedScanRegions.includes(s.region));
      } else if (isSectorSelected) {
        pool = pool.filter(s => selectedScanSectors.includes(s.sector));
      } else {
        // Ninguno seleccionado: filtrar los que sean de país alcista o sector alcista
        pool = pool.filter(s => {
          const mappedRegId = MAP_REGION[s.region];
          const rData = mappedRegId ? countryData?.[mappedRegId] || {} : {};
          const rTrend = rData.dailyTrend || rData.trend || 'lateral';
          const passRegion = rTrend === 'alcista';

          const mappedSecId = MAP_SECTOR[s.sector];
          const sData = mappedSecId ? sectorData?.[mappedSecId] || {} : {};
          const sTrend = sData.dailyTrend || sData.trend || 'lateral';
          const passSector = sTrend === 'alcista';

          return passRegion || passSector;
        });
      }

      if (selectedScanStates.length > 0) {
        pool = pool.filter(s => {
          if (!s.setupState) return false;
          return selectedScanStates.includes(s.setupState);
        });
      }

      if (selectedScanRsi.length > 0) {
        pool = pool.filter(s => {
          if (typeof s.weeklyRsi !== 'number') return false;
          return selectedScanRsi.some(r => {
            if (r === '< 30') return s.weeklyRsi < 30;
            if (r === '30-50') return s.weeklyRsi >= 30 && s.weeklyRsi < 50;
            if (r === '50-70') return s.weeklyRsi >= 50 && s.weeklyRsi < 70;
            if (r === '> 70') return s.weeklyRsi >= 70;
            return false;
          });
        });
      }

      if (selectedScanMacd.length > 0) {
        pool = pool.filter(s => {
          if (s.weeklyMacd === null || s.weeklyMacd === 'N/A') return false;
          const isGoldenCross = (s.weeklyMacdPrev !== null && s.weeklyMacdPrevSignal !== null && s.weeklyMacdPrev <= s.weeklyMacdPrevSignal && s.weeklyMacd > s.weeklyMacdSignal);
          const isBullishGrowing = !isGoldenCross && (s.weeklyMacd > s.weeklyMacdSignal) && (s.weeklyMacdPrevHist !== null && s.weeklyMacdHist > s.weeklyMacdPrevHist);
          const isBullishShrinking = !isGoldenCross && (s.weeklyMacd > s.weeklyMacdSignal) && (s.weeklyMacdPrevHist !== null && s.weeklyMacdHist <= s.weeklyMacdPrevHist);
          const isBearishGrowing = (s.weeklyMacd <= s.weeklyMacdSignal) && (s.weeklyMacdPrevHist !== null && s.weeklyMacdHist < s.weeklyMacdPrevHist);
          const isBearishShrinking = (s.weeklyMacd <= s.weeklyMacdSignal) && (s.weeklyMacdPrevHist !== null && s.weeklyMacdHist >= s.weeklyMacdPrevHist);
          
          return selectedScanMacd.some(m => {
            if (m === 'Golden Cross') return isGoldenCross;
            if (m === 'Bullish (+)') return isBullishGrowing;
            if (m === 'Bullish (-)') return isBullishShrinking;
            if (m === 'Bearish (+)') return isBearishGrowing;
            if (m === 'Bearish (-)') return isBearishShrinking;
            return false;
          });
        });
      }

      if (selectedScanDrawdown.length > 0) {
        pool = pool.filter(s => {
          if (typeof s.drawdown52w !== 'number') return false;
          return selectedScanDrawdown.some(r => {
            if (r === '0 a -10%') return s.drawdown52w >= -10;
            if (r === '-10% a -20%') return s.drawdown52w < -10 && s.drawdown52w >= -20;
            if (r === '-20% a -30%') return s.drawdown52w < -20 && s.drawdown52w >= -30;
            if (r === '< -30%') return s.drawdown52w < -30;
            return false;
          });
        });
      }

      if (selectedScanRs.length > 0) {
        pool = pool.filter(s => {
          if (typeof s.rsValue !== 'number') return false;
          return selectedScanRs.some(r => {
            if (r === '> 10%') return s.rsValue > 10;
            if (r === '0 a 10%') return s.rsValue >= 0 && s.rsValue <= 10;
            if (r === '-10% a 0%') return s.rsValue < 0 && s.rsValue >= -10;
            if (r === '< -10%') return s.rsValue < -10;
            return false;
          });
        });
      }

      if (selectedScanOpScore.length > 0) {
        pool = pool.filter(s => {
          if (typeof s.opScore !== 'number') return false;
          return selectedScanOpScore.some(r => {
            if (r === '>= 80') return s.opScore >= 80;
            if (r === '60 - 79') return s.opScore >= 60 && s.opScore < 80;
            if (r === '40 - 59') return s.opScore >= 40 && s.opScore < 60;
            if (r === '< 40') return s.opScore < 40;
            return false;
          });
        });
      }

      const results = pool
        .filter(s => s.emaDistance !== null && Math.abs(s.emaDistance) <= scanThreshold)
        .sort((a, b) => Math.abs(a.emaDistance) - Math.abs(b.emaDistance));

      setScanResults(results);
      setScanRan(true);
      setScanLoading(false);
    }, 300);
  }, [stockData, selectedScanRegions, selectedScanSectors, selectedScanStates, selectedScanRsi, selectedScanMacd, selectedScanDrawdown, selectedScanRs, selectedScanOpScore, scanThreshold, countryData, sectorData]);

  // Sectores disponibles para el scan (independientes y solo ALCISTAS)
  const scanSectors = useMemo(() => {
    let pool = stockData.filter(s => s.type !== 'ETF' && s.sector !== 'ETF');
    
    // Sectores únicos en el universo actual
    const unique = [...new Set(pool.map(s => s.sector).filter(Boolean))];
    
    // Filtrar solo los sectores que estén marcados como ALCISTAS (diario)
    const bullSectors = unique.filter(sec => {
      const mappedId = MAP_SECTOR[sec];
      if (!mappedId) return false; // si no mapea o es 'General', se oculta
      const data = sectorData?.[mappedId] || {};
      const trend = data.dailyTrend || data.trend || 'lateral';
      return trend === 'alcista';
    });

    return bullSectors.sort((a, b) => a.localeCompare(b));
  }, [stockData, sectorData]);

  // Regiones disponibles para el scan (solo las ALCISTAS)
  const scanRegions = useMemo(() => {
    const data = stockData.filter(s => s.type !== 'ETF' && s.sector !== 'ETF');
    const unique = [...new Set(data.map(s => s.region).filter(Boolean))];
    
    const bullRegions = unique.filter(reg => {
      const mappedId = MAP_REGION[reg];
      if (!mappedId) return false;
      const rData = countryData?.[mappedId] || {};
      const trend = rData.dailyTrend || rData.trend || 'lateral';
      return trend === 'alcista';
    });

    return bullRegions.sort();
  }, [stockData, countryData]);

  // Contar cuántos símbolos en el universo actual ya tienen EMA calculada
  const emaReadyCount = useMemo(() => {
    let pool = stockData.filter(s => s.type !== 'ETF' && s.sector !== 'ETF');
    
    const isRegionSelected = selectedScanRegions.length > 0;
    const isSectorSelected = selectedScanSectors.length > 0;

    if (isRegionSelected && isSectorSelected) {
      pool = pool.filter(s => selectedScanRegions.includes(s.region) || selectedScanSectors.includes(s.sector));
    } else if (isRegionSelected) {
      pool = pool.filter(s => selectedScanRegions.includes(s.region));
    } else if (isSectorSelected) {
      pool = pool.filter(s => selectedScanSectors.includes(s.sector));
    } else {
      pool = pool.filter(s => {
        const mappedRegId = MAP_REGION[s.region];
        const rData = mappedRegId ? countryData?.[mappedRegId] || {} : {};
        const passRegion = (rData.dailyTrend || rData.trend || 'lateral') === 'alcista';
        
        const mappedSecId = MAP_SECTOR[s.sector];
        const sData = mappedSecId ? sectorData?.[mappedSecId] || {} : {};
        const passSector = (sData.dailyTrend || sData.trend || 'lateral') === 'alcista';
        
        return passRegion || passSector;
      });
    }

    return {
      ready: pool.filter(s => s.emaDistance !== null).length,
      total: pool.length,
    };
  }, [stockData, selectedScanRegions, selectedScanSectors, countryData, sectorData]);

  const formatLastUpdate = () => {
    if (!lastUpdate) return null;
    const m = Math.floor((Date.now() - lastUpdate.getTime()) / 60000);
    if (m < 1) return 'hace un momento';
    if (m === 1) return 'hace 1 min';
    if (m < 60) return `hace ${m} min`;
    return `hace ${Math.floor(m / 60)}h`;
  };

  // Listas únicas de regiones y sectores
  const regions = useMemo(() => {
    const data = stockData.filter(s => s.type !== 'ETF' && s.sector !== 'ETF');
    const unique = [...new Set(data.map(s => s.region).filter(Boolean))];
    return unique.sort();
  }, [stockData]);

  const sectors = useMemo(() => {
    const data = stockData.filter(s => s.type !== 'ETF' && s.sector !== 'ETF');
    const pool = filterRegion === 'ALL'
      ? data
      : data.filter(s => s.region === filterRegion);
    const unique = [...new Set(pool.map(s => s.sector).filter(Boolean))];
    return unique.sort((a, b) => a.localeCompare(b));
  }, [stockData, filterRegion]);

  // Datos filtrados + ordenados
  const visibleData = useMemo(() => {
    let d = stockData;
    
    // Si no estamos en General, excluimos los ETFs
    if (groupMode !== 'general') {
      d = d.filter(s => s.type !== 'ETF' && s.sector !== 'ETF');
    }
    
    if (filterRegion !== 'ALL') d = d.filter(s => s.region === filterRegion);
    if (filterSector !== 'ALL') d = d.filter(s => s.sector === filterSector);

    return [...d].sort((a, b) => {
      let va = a[sortKey];
      let vb = b[sortKey];
      
      const isEmpty = (val) => val === null || val === undefined || val === 'N/A' || val === '';
      const emptyA = isEmpty(va);
      const emptyB = isEmpty(vb);

      if (emptyA && emptyB) return 0;
      if (emptyA) return 1;
      if (emptyB) return -1;

      const numA = Number(va);
      const numB = Number(vb);

      if (!isNaN(numA) && !isNaN(numB) && typeof va !== 'boolean' && typeof vb !== 'boolean') {
        return sortDir === 'asc' ? numA - numB : numB - numA;
      }

      let strA = String(va).toLowerCase();
      let strB = String(vb).toLowerCase();
      
      if (strA < strB) return sortDir === 'asc' ? -1 : 1;
      if (strA > strB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [stockData, filterRegion, filterSector, sortKey, sortDir, groupMode]);

  // Agrupar datos filtrados según el modo activo
  const groupedData = useMemo(() => {
    const groups = {};
    visibleData.forEach(s => {
      let key = 'Otros';
      if (groupMode === 'region') key = (REGION_LABELS[s.region] || s.region);
      else if (groupMode === 'sector') key = (s.sector || 'Otros');
      else if (groupMode === 'opScore') key = 'Ranking OP Score';
      else if (groupMode === 'general') {
        const isGeneralOnlyETFs = (filterRegion === 'US' || filterRegion === 'ALL') && filterSector === 'ALL';
        if (isGeneralOnlyETFs) {
          if (s.type !== 'ETF') return; // En vista general, solo mostrar ETFs
          key = s.macroCategory || 'Otros ETFs';
        } else {
          key = s.sector || 'General';
        }
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    return Object.entries(groups).sort(([a], [b]) => {
      if (groupMode === 'sector') {
        if (a === 'ETF') return -1;
        if (b === 'ETF') return 1;
      }
      if (groupMode === 'general') {
        // Orden particular para vista general
        const order = ['Índices', 'Países', 'Sectores', 'Materias Primas', 'Temáticos', 'Otros ETFs'];
        const idxA = order.indexOf(a);
        const idxB = order.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
      }
      return a.localeCompare(b);
    });
  }, [visibleData, groupMode, filterRegion, filterSector]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { 
      setSortKey(key); 
      const defaultDesc = ['price', 'changePercent', 'emaDistance', 'weeklyRsi', 'weeklyMacd', 'rsValue', 'opScore', 'drawdown52w'];
      setSortDir(defaultDesc.includes(key) ? 'desc' : 'asc'); 
    }
  };

  // Al cambiar región, resetear filtro de sector
  const handleRegionChange = (r) => {
    setFilterRegion(r);
    setFilterSector('ALL');
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <Neutral>⇅</Neutral>;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  return (
    <Layout>
      <StyledContainer>

        {/* ── Header ─────────────────────────────── */}
        <Header>
          <TitleArea>
            <Title>Screener de Mercado</Title>
            <Sub>Precios con caché inteligente · {visibleData.length} instrumentos</Sub>
          </TitleArea>
          <RefreshWrapper>
            <HeaderBtns>
              <RefreshBtn onClick={handleRefresh} disabled={loading}>
                <RefreshCw size={14} className={loading ? 'spin' : ''} />
                Actualizar
              </RefreshBtn>
              <ScanBtn onClick={() => setShowScan(true)} disabled={loading}>
                <Zap size={14} />
                Scan Rápido
              </ScanBtn>
            </HeaderBtns>
            {lastUpdate && (
              <UpdateLabel><Clock size={10} />{formatLastUpdate()}</UpdateLabel>
            )}
          </RefreshWrapper>
        </Header>

        {/* ── Filtros ────────────────────────────── */}
        <FiltersBar>
          {/* Fila: País */}
          <FilterRow>
            <FilterLabel><Globe size={13} /> País</FilterLabel>
            <PillGroup>
              <Pill $active={filterRegion === 'ALL'} onClick={() => handleRegionChange('ALL')}>
                Todos
              </Pill>
              {regions.map(r => (
                <Pill key={r} $active={filterRegion === r} onClick={() => handleRegionChange(r)}>
                  <RegionFlag code={r} showName />
                </Pill>
              ))}
            </PillGroup>
          </FilterRow>

          {/* Fila: Sector */}
          <FilterRow>
            <FilterLabel><Layers size={13} /> Sector</FilterLabel>
            <PillGroup>
              <Pill $active={filterSector === 'ALL'} onClick={() => setFilterSector('ALL')}>
                Todos
              </Pill>
              {sectors.map(s => (
                <Pill key={s} $active={filterSector === s} onClick={() => setFilterSector(s)}>
                  {s}
                </Pill>
              ))}
            </PillGroup>
          </FilterRow>

        </FiltersBar>

        {/* ── Toggle de agrupación ────────────────── */}
        <GroupToggleBar>
          <GroupToggleLabel>Agrupar por:</GroupToggleLabel>
          <GroupToggleBtns>
            <GroupToggleBtn $active={groupMode === 'general'} onClick={() => setGroupMode('general')}>
              General
            </GroupToggleBtn>
            <GroupToggleBtn $active={groupMode === 'region'} onClick={() => setGroupMode('region')}>
              País
            </GroupToggleBtn>
            <GroupToggleBtn $active={groupMode === 'sector'} onClick={() => setGroupMode('sector')}>
              Sector
            </GroupToggleBtn>
            <GroupToggleBtn $active={groupMode === 'opScore'} onClick={() => {
              setGroupMode('opScore');
              setSortKey('opScore');
              setSortDir('desc');
            }}>
              OP Score
            </GroupToggleBtn>
          </GroupToggleBtns>
        </GroupToggleBar>

        {/* ── Grupos con tabla ────────────────────── */}
        {loading && stockData.length === 0 ? (
          <StateBox>
            <RefreshCw size={26} className="spin" color={colors.primary} />
            <p>Obteniendo cotizaciones...</p>
          </StateBox>
        ) : error && stockData.length === 0 ? (
          <StateBox $error>
            <AlertCircle size={26} color="#f43f5e" />
            <p>{error}</p>
          </StateBox>
        ) : visibleData.length === 0 ? (
          <StateBox>
            <p style={{ color: '#475569' }}>Sin resultados para ese filtro.</p>
          </StateBox>
        ) : (
          <GroupsContainer>
            {groupedData.map(([groupName, stocks]) => (
              <GroupSection key={groupName}>
                <GroupHeader>
                  {groupMode === 'region' ? (
                    <RegionFlag code={Object.keys(REGION_LABELS).find(k => REGION_LABELS[k] === groupName) || groupName} showName />
                  ) : (
                    <GroupTitle>{groupName}</GroupTitle>
                  )}
                  <GroupCount>{stocks.length}</GroupCount>
                </GroupHeader>
                <TableWrap>
                  <Table>
                    <thead>
                      <tr>
                        <Th $w="220px" $sort onClick={() => handleSort('symbol')}>
                          Activo <SortIcon col="symbol" />
                        </Th>
                        {groupMode === 'region' ? (
                          <Th $w="170px" $sort onClick={() => handleSort('sector')}>
                            Sector <SortIcon col="sector" />
                          </Th>
                        ) : (
                          <Th $w="90px" $sort onClick={() => handleSort('region')}>
                            País <SortIcon col="region" />
                          </Th>
                        )}
                        <Th $w="110px" $sort $right onClick={() => handleSort('price')}>
                          Precio <SortIcon col="price" />
                        </Th>
                        <Th $w="95px" $sort $right onClick={() => handleSort('changePercent')}>
                          Cambio <SortIcon col="changePercent" />
                        </Th>
                        <Th $w="105px" $sort $right onClick={() => handleSort('emaDistance')}>
                          EMA21 <SortIcon col="emaDistance" />
                        </Th>
                        <Th $w="105px" $sort $center onClick={() => handleSort('weeklyRsi')}>
                          RSI Sem. <SortIcon col="weeklyRsi" />
                        </Th>
                        <Th $w="105px" $sort $center onClick={() => handleSort('weeklyMacd')}>
                          MACD <SortIcon col="weeklyMacd" />
                        </Th>
                        <Th $w="105px" $sort $center onClick={() => handleSort('drawdown52w')}>
                          52W Max <SortIcon col="drawdown52w" />
                        </Th>
                        <Th $w="105px" $sort $center onClick={() => handleSort('rsValue')}>
                          RS 12W <SortIcon col="rsValue" />
                        </Th>
                        <Th $w="90px" $sort $center onClick={() => handleSort('opScore')}>
                          OP Score <SortIcon col="opScore" />
                        </Th>
                        <Th $w="90px" $center>Acciones</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {stocks.map((s, i) => (
                        <Row key={s.symbol} $even={i % 2 === 0}>
                          <Td $w="220px">
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <SymTxt>{s.symbol}</SymTxt>
                                {(Object.values(MAP_REGION).includes(s.symbol.toLowerCase()) || Object.values(MAP_SECTOR).includes(s.symbol.toLowerCase())) && (
                                  <PlayCircle 
                                    size={16} 
                                    color="#3b82f6" 
                                    style={{ cursor: 'pointer', flexShrink: 0 }}
                                    onClick={(e) => { e.stopPropagation(); handleOpenETF(s.symbol); }}
                                    title="Ver componentes vinculados"
                                  />
                                )}
                              </div>
                              <NameTxt style={{ fontSize: '0.75rem', marginTop: '2px', whiteSpace: 'normal', overflow: 'visible' }}>{s.name}</NameTxt>
                            </div>
                          </Td>
                          {groupMode === 'region' ? (
                            <Td $w="170px"><SectorBadge>{s.sector}</SectorBadge></Td>
                          ) : (
                            <Td $w="90px"><RegionFlag code={s.region} showName /></Td>
                          )}
                          <Td $w="110px" $right>
                            <PriceTxt $dim={!s.price}>
                              {s.price ? `$${s.price.toFixed(2)}` : '—'}
                            </PriceTxt>
                          </Td>
                          <Td $w="95px" $right>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                              {s.changePercent === null ? (
                                <MetaTxt>—</MetaTxt>
                              ) : (
                                <ChangeBadge $pos={s.changePercent >= 0}>
                                  {s.changePercent >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                  {Math.abs(s.changePercent).toFixed(2)}%
                                </ChangeBadge>
                              )}
                              {s.setupFactors?.volume?.rvol >= 1.2 && (
                                <VolBadge $acc={s.setupFactors.volume.isAccumulationDay}>
                                  {s.setupFactors.volume.isAccumulationDay ? '🔥' : '🔻'} {s.setupFactors.volume.rvol}x Vol
                                </VolBadge>
                              )}
                            </div>
                          </Td>
                          <Td $w="105px" $right>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                              {s.emaDistance === null ? (
                                <MetaTxt style={{display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'4px'}}>
                                  <RefreshCw size={10} className="spin" /> Calc...
                                </MetaTxt>
                              ) : (
                                <ChangeBadge $pos={s.emaDistance >= 0}>
                                  {s.emaDistance >= 0 ? '+' : ''}{s.emaDistance.toFixed(2)}%
                                </ChangeBadge>
                              )}
                              {s.setupState && s.setupVerdict && (
                                <div 
                                  style={{
                                    marginTop: '4px',
                                    fontSize: '0.6rem',
                                    lineHeight: '1.2',
                                    textAlign: 'right',
                                    whiteSpace: 'normal',
                                    color: 
                                      s.setupState === 'strong_uptrend' ? '#10b981' :
                                      s.setupState === 'bullish_breakout' ? '#f97316' :
                                      s.setupState === 'bullish_pullback' ? '#3b82f6' :
                                      s.setupState === 'bullish_reversal_confirmed' ? '#8b5cf6' :
                                      s.setupState === 'early_bullish_reversal' ? '#d946ef' :
                                      s.setupState === 'bearish_trend' ? '#ef4444' :
                                      s.setupState === 'lateral_trend' ? '#eab308' :
                                      '#94a3b8'
                                  }}
                                >
                                  {(() => {
                                    if (s.setupVerdict === 'Transición Alcista') {
                                      return <><span style={{color: '#eab308'}}>Transición</span> <span style={{color: '#10b981'}}>Alcista</span></>;
                                    }
                                    if (s.setupVerdict === 'Transición Bajista') {
                                      return <><span style={{color: '#eab308'}}>Transición</span> <span style={{color: '#ef4444'}}>Bajista</span></>;
                                    }
                                    if (s.setupVerdict === 'Alcista Tardío') {
                                      return <><span style={{color: '#10b981'}}>Alcista</span> <span style={{color: '#ef4444'}}>Tardío</span></>;
                                    }
                                    return s.setupVerdict;
                                  })()}
                                </div>
                              )}
                            </div>
                          </Td>
                          <Td $w="105px" $center>
                            {s.weeklyRsi === null ? (
                              <MetaTxt style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'4px'}}>
                                <RefreshCw size={10} className="spin" /> Calc...
                              </MetaTxt>
                            ) : s.weeklyRsi === 'N/A' ? (
                              <MetaTxt style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', color: '#64748b'}}>
                                N/A
                              </MetaTxt>
                            ) : (
                              <MetaTxt 
                                style={{color: s.weeklyRsi > 70 ? '#f43f5e' : s.weeklyRsi < 30 ? '#10b981' : '#e2e8f0', fontWeight: 'bold'}}
                                title={`Prev: ${s.weeklyRsiPrevious} | Delta: ${s.weeklyRsiDelta > 0 ? '+' : ''}${s.weeklyRsiDelta}`}
                              >
                                {typeof s.weeklyRsi === 'number' ? s.weeklyRsi.toFixed(1) : s.weeklyRsi}
                              </MetaTxt>
                            )}
                          </Td>
                          <Td $w="105px" $center>
                            {s.weeklyMacd === null ? (
                              <MetaTxt style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'4px'}}>
                                <RefreshCw size={10} className="spin" /> Calc...
                              </MetaTxt>
                            ) : s.weeklyMacd === 'N/A' ? (
                              <MetaTxt style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', color: '#64748b'}}>
                                N/A
                              </MetaTxt>
                            ) : (
                              <MetaTxt 
                                style={{
                                  color: (s.weeklyMacdPrev !== null && s.weeklyMacdPrevSignal !== null && s.weeklyMacdPrev <= s.weeklyMacdPrevSignal && s.weeklyMacd > s.weeklyMacdSignal) ? '#f59e0b' :
                                         (s.weeklyMacd > s.weeklyMacdSignal) ? ((s.weeklyMacdPrevHist !== null && s.weeklyMacdHist > s.weeklyMacdPrevHist) ? '#10b981' : '#a7f3d0') :
                                         ((s.weeklyMacdPrevHist !== null && s.weeklyMacdHist < s.weeklyMacdPrevHist) ? '#f43f5e' : '#fda4af'),
                                  fontWeight: 'bold'
                                }}
                                title={`MACD: ${s.weeklyMacd} | Signal: ${s.weeklyMacdSignal} | Hist: ${s.weeklyMacdHist}\nPrev MACD: ${s.weeklyMacdPrev} | Prev Signal: ${s.weeklyMacdPrevSignal} | Prev Hist: ${s.weeklyMacdPrevHist}`}
                              >
                                {typeof s.weeklyMacd === 'number' ? s.weeklyMacd.toFixed(2) : s.weeklyMacd}
                              </MetaTxt>
                            )}
                          </Td>
                          <Td $w="105px" $center>
                            {s.drawdown52w === null ? (
                              <MetaTxt style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'4px'}}>
                                <RefreshCw size={10} className="spin" /> Calc...
                              </MetaTxt>
                            ) : s.drawdown52w === 'N/A' ? (
                              <MetaTxt style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', color: '#64748b'}}>
                                N/A
                              </MetaTxt>
                            ) : (
                              <MetaTxt 
                                style={{
                                  color: s.drawdown52w >= -5 ? '#e2e8f0' : '#f43f5e',
                                  fontWeight: 'bold'
                                }}
                              >
                                {s.drawdown52w.toFixed(1)}%
                              </MetaTxt>
                            )}
                          </Td>
                          <Td $w="105px" $center>
                            {s.rsValue === null || s.rsValue === undefined ? (
                              <MetaTxt style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', color: '#64748b'}}>
                                N/A
                              </MetaTxt>
                            ) : (
                              <MetaTxt
                                title={s.rsState}
                                style={{
                                  color: 
                                    s.rsState === 'Strong & Rising' ? '#22c55e' :
                                    s.rsState === 'Strong but Weakening' ? '#86efac' :
                                    s.rsState === 'Weak but Recovering' ? '#fca5a5' :
                                    '#ef4444',
                                  fontWeight: 'bold'
                                }}
                              >
                                {s.rsValue > 0 ? '+' : ''}{s.rsValue.toFixed(1)}%
                              </MetaTxt>
                            )}
                          </Td>
                          <Td $w="90px" $center>
                            {s.opScore === null || s.opScore === undefined ? (
                              <MetaTxt style={{display:'flex', alignItems:'center', justifyContent:'center', color: '#64748b'}}>
                                N/A
                              </MetaTxt>
                            ) : (
                              <OpScoreCircle 
                                $score={s.opScore} 
                                onClick={() => handleOpenOpScore(s)}
                                title="Ver Conclusiones"
                              >
                                {s.opScore}
                              </OpScoreCircle>
                            )}
                          </Td>
                          <Td $w="90px" $center>
                            <ActionsWrap>
                              <TVLink 
                                href={`https://es.tradingview.com/chart/iI2KiaxW/?symbol=${getTVSymbol(s.symbol)}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                title="Ver en TradingView"
                              >
                                <SiTradingview size={15} />
                              </TVLink>
                              <AlertActionBtn 
                                onClick={() => handleOpenAlert(s.symbol, s.price)}
                                title="Crear Alerta"
                              >
                                <BellRing size={15} />
                              </AlertActionBtn>
                            </ActionsWrap>
                          </Td>
                        </Row>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
              </GroupSection>
            ))}
          </GroupsContainer>
        )}

      </StyledContainer>

      {/* ── Panel Scan Rápido ─────────────────────────────────── */}
      {showScan && (
        <ScanOverlay onClick={() => setShowScan(false)}>
          <ScanPanel onClick={e => e.stopPropagation()}>

            {/* Header del panel */}
            <ScanPanelHeader>
              <ScanPanelTitle>
                <Zap size={18} color="#f59e0b" />
                Scan Avanzado Multicriterio
              </ScanPanelTitle>
              <ScanCloseBtn onClick={() => setShowScan(false)}>
                <X size={18} />
              </ScanCloseBtn>
            </ScanPanelHeader>

            <ScanBody>
              {/* Descripción */}
              <ScanDescription>
                Encuentra oportunidades combinando la tendencia diaria del Lab, indicadores semanales (RSI, MACD, RS) y distancia a la EMA 21.<br/>
                <span style={{color: colors.primary}}>Las opciones de País y Sector solo muestran los marcados como <strong>Alcistas</strong>.</span>
              </ScanDescription>

              {/* Filtro País */}
              <ScanFilterBlock>
                <ScanFilterLabel><Globe size={12} /> País (Solo Alcistas)</ScanFilterLabel>
                <PillGroup>
                  <Pill $active={selectedScanRegions.length === 0} onClick={() => setSelectedScanRegions([])}>
                    Todos
                  </Pill>
                  {scanRegions.map(r => (
                    <Pill key={r} $active={selectedScanRegions.includes(r)} onClick={() => {
                      if (selectedScanRegions.includes(r)) {
                        setSelectedScanRegions(selectedScanRegions.filter(x => x !== r));
                      } else {
                        setSelectedScanRegions([...selectedScanRegions, r]);
                      }
                    }}>
                      <RegionFlag code={r} showName />
                    </Pill>
                  ))}
                  {scanRegions.length === 0 && <span style={{ fontSize: '0.85rem', color: colors.textSecondary, fontStyle: 'italic', padding: '6px' }}>Ningún país alcista</span>}
                </PillGroup>
              </ScanFilterBlock>

              {/* Filtro Sector */}
              <ScanFilterBlock>
                <ScanFilterLabel><Layers size={12} /> Sector (Solo Alcistas)</ScanFilterLabel>
                <PillGroup>
                  <Pill $active={selectedScanSectors.length === 0} onClick={() => setSelectedScanSectors([])}>
                    Todos
                  </Pill>
                  {scanSectors.map(s => (
                    <Pill key={s} $active={selectedScanSectors.includes(s)} onClick={() => {
                      if (selectedScanSectors.includes(s)) {
                        setSelectedScanSectors(selectedScanSectors.filter(x => x !== s));
                      } else {
                        setSelectedScanSectors([...selectedScanSectors, s]);
                      }
                    }}>
                      {s}
                    </Pill>
                  ))}
                  {scanSectors.length === 0 && <span style={{ fontSize: '0.85rem', color: colors.textSecondary, fontStyle: 'italic', padding: '6px' }}>Ningún sector alcista</span>}
                </PillGroup>
              </ScanFilterBlock>

              {/* Fila: Estados de Estructura */}
              <ScanFilterBlock>
                <ScanFilterLabel><Activity size={12} /> Estructura (Setup)</ScanFilterLabel>
                <PillGroup>
                  <Pill $active={selectedScanStates.length === 0} onClick={() => setSelectedScanStates([])}>
                    Todos
                  </Pill>
                  {[
                    { id: 'bullish_breakout', label: 'Breakout' },
                    { id: 'bullish_pullback', label: 'Pullback' },
                    { id: 'strong_uptrend', label: 'Alcista (Base)' },
                    { id: 'strong_uptrend_extended', label: 'Alcista (Ext)' },
                    { id: 'bullish_reversal_confirmed', label: 'Rev. Conf.' },
                    { id: 'early_bullish_reversal', label: 'Rev. Temprana' },
                    { id: 'lateral_trend', label: 'Lateral' },
                    { id: 'bearish_trend', label: 'Bajista' },
                    { id: 'bullish_transition', label: 'Trans. Alcista' },
                    { id: 'bearish_transition', label: 'Trans. Bajista' },
                    { id: 'messy_chop', label: 'Tendencia Indefinida' },
                    { id: 'neutral', label: 'Peligro (Neutral)' }
                  ].map(state => (
                    <Pill key={state.id} $active={selectedScanStates.includes(state.id)} onClick={() => toggleFilter(setSelectedScanStates, state.id)}>
                      {state.label}
                    </Pill>
                  ))}
                </PillGroup>
              </ScanFilterBlock>

              {/* Fila: RSI Semanal */}
          <ScanFilterBlock>
            <ScanFilterLabel><Activity size={13} /> RSI Sem.</ScanFilterLabel>
            <PillGroup>
              <Pill $active={selectedScanRsi.length === 0} onClick={() => setSelectedScanRsi([])}>
                Todos
              </Pill>
              {['< 30', '30-50', '50-70', '> 70'].map(val => (
                <Pill key={val} $active={selectedScanRsi.includes(val)} onClick={() => toggleFilter(setSelectedScanRsi, val)}>
                  {val}
                </Pill>
              ))}
            </PillGroup>
          </ScanFilterBlock>

          {/* Fila: MACD Semanal */}
          <ScanFilterBlock>
            <ScanFilterLabel><BarChart2 size={13} /> MACD</ScanFilterLabel>
            <PillGroup>
              <Pill $active={selectedScanMacd.length === 0} onClick={() => setSelectedScanMacd([])}>
                Todos
              </Pill>
              {[
                { label: 'Golden Cross', color: '#f59e0b' },
                { label: 'Bullish (+)', color: '#10b981' },
                { label: 'Bullish (-)', color: '#a7f3d0' },
                { label: 'Bearish (-)', color: '#fda4af' },
                { label: 'Bearish (+)', color: '#f43f5e' }
              ].map(item => (
                <Pill key={item.label} $active={selectedScanMacd.includes(item.label)} onClick={() => toggleFilter(setSelectedScanMacd, item.label)}>
                  <ColorDot style={{ backgroundColor: item.color }} /> {item.label}
                </Pill>
              ))}
            </PillGroup>
          </ScanFilterBlock>

          {/* Fila: Drawdown 52W */}
          <ScanFilterBlock>
            <ScanFilterLabel><TrendingDown size={13} /> Drawdown</ScanFilterLabel>
            <PillGroup>
              <Pill $active={selectedScanDrawdown.length === 0} onClick={() => setSelectedScanDrawdown([])}>
                Todos
              </Pill>
              {['0 a -10%', '-10% a -20%', '-20% a -30%', '< -30%'].map(val => (
                <Pill key={val} $active={selectedScanDrawdown.includes(val)} onClick={() => toggleFilter(setSelectedScanDrawdown, val)}>
                  {val}
                </Pill>
              ))}
            </PillGroup>
          </ScanFilterBlock>

          {/* Fila: RS 12W */}
          <ScanFilterBlock>
            <ScanFilterLabel><Award size={13} /> RS 12W</ScanFilterLabel>
            <PillGroup>
              <Pill $active={selectedScanRs.length === 0} onClick={() => setSelectedScanRs([])}>
                Todos
              </Pill>
              {['> 10%', '0 a 10%', '-10% a 0%', '< -10%'].map(val => (
                <Pill key={val} $active={selectedScanRs.includes(val)} onClick={() => toggleFilter(setSelectedScanRs, val)}>
                  {val}
                </Pill>
              ))}
            </PillGroup>
          </ScanFilterBlock>

          <ScanFilterBlock>
            <ScanFilterLabel><Target size={12}/> OP Score</ScanFilterLabel>
            <PillGroup>
              <Pill $active={selectedScanOpScore.length === 0} onClick={() => setSelectedScanOpScore([])}>
                Todos
              </Pill>
              {['>= 80', '60 - 79', '40 - 59', '< 40'].map(val => (
                <Pill key={val} $active={selectedScanOpScore.includes(val)} onClick={() => toggleFilter(setSelectedScanOpScore, val)}>
                  {val}
                </Pill>
              ))}
            </PillGroup>
          </ScanFilterBlock>
        
              {/* Umbral EMA */}
              <ScanFilterBlock>
                <ScanFilterLabel>
                  <Target size={12} /> Distancia máx. EMA 21
                  <ScanThresholdValue>±{scanThreshold.toFixed(1)}%</ScanThresholdValue>
                </ScanFilterLabel>
                <ScanSliderRow>
                  <ScanSliderLabel>0.1%</ScanSliderLabel>
                  <ScanSlider
                    type="range"
                    min="0.1" max="5" step="0.1"
                    value={scanThreshold}
                    onChange={e => setScanThreshold(parseFloat(e.target.value))}
                  />
                  <ScanSliderLabel>5%</ScanSliderLabel>
                </ScanSliderRow>
                <EmaReadyNote>
                  {emaReadyCount.ready} de {emaReadyCount.total} acciones tienen EMA calculada en este universo
                </EmaReadyNote>
              </ScanFilterBlock>

              {/* Botón ejecutar */}
              <ScanRunBtn onClick={runQuickScan} disabled={scanLoading}>
                {scanLoading
                  ? <><RefreshCw size={15} className="spin" /> Escaneando...</>
                  : <><Zap size={15} /> Ejecutar Scan</>}
              </ScanRunBtn>

              {/* Resultados */}
              {scanRan && (
                <ScanResultsSection>
                  <ScanResultsHeader>
                    <ScanResultsTitle>
                      {scanResults.length > 0
                        ? <>✅ {scanResults.length} acción{scanResults.length !== 1 ? 'es' : ''} cerca de EMA 21</>
                        : <>❌ Sin resultados con los filtros actuales</>}
                    </ScanResultsTitle>
                    
                    <ScanActiveFiltersBox>
                      {selectedScanRegions.length > 0 && <ActiveFilterPill>Regiones: {selectedScanRegions.join(', ')}</ActiveFilterPill>}
                      {selectedScanSectors.length > 0 && <ActiveFilterPill>Sectores: {selectedScanSectors.join(', ')}</ActiveFilterPill>}
                      {selectedScanRsi.length > 0 && <ActiveFilterPill>RSI: {selectedScanRsi.join(', ')}</ActiveFilterPill>}
                      {selectedScanMacd.length > 0 && <ActiveFilterPill>MACD: {selectedScanMacd.join(', ')}</ActiveFilterPill>}
                      {selectedScanDrawdown.length > 0 && <ActiveFilterPill>Drawdown: {selectedScanDrawdown.join(', ')}</ActiveFilterPill>}
                      {selectedScanRs.length > 0 && <ActiveFilterPill>RS: {selectedScanRs.join(', ')}</ActiveFilterPill>}
                      {selectedScanOpScore.length > 0 && <ActiveFilterPill>OP Score: {selectedScanOpScore.join(', ')}</ActiveFilterPill>}
                      <ActiveFilterPill>Cerca EMA 21: ±{scanThreshold.toFixed(1)}%</ActiveFilterPill>
                    </ScanActiveFiltersBox>

                    {scanResults.length === 0 && emaReadyCount.ready < emaReadyCount.total && (
                      <ScanResultsHint>
                        {emaReadyCount.total - emaReadyCount.ready} acciones aún calculando EMA — volvé a scanear en unos segundos.
                      </ScanResultsHint>
                    )}
                  </ScanResultsHeader>

                  {scanResults.map(s => (
                    <ScanResultRow key={s.symbol}>
                      <ScanResultLeft>
                        <ScanResultSymbol>{s.symbol}</ScanResultSymbol>
                        <ScanResultName>{s.name}</ScanResultName>
                        <ScanResultMeta>
                          <RegionFlag code={s.region} showName={false} />
                          {s.sector && s.sector !== 'General' && <ScanResultSector>{s.sector}</ScanResultSector>}
                        </ScanResultMeta>
                      </ScanResultLeft>
                      <ScanResultRight>
                        <ScanResultPrice>{s.price ? `$${s.price.toFixed(2)}` : '—'}</ScanResultPrice>
                        <ScanEmaChip $pos={s.emaDistance >= 0} $close={Math.abs(s.emaDistance) < 0.5}>
                          {s.emaDistance >= 0 ? '+' : ''}{s.emaDistance.toFixed(2)}% EMA21
                        </ScanEmaChip>
                        <ActionsWrap>
                          <ScanTVLink
                            href={`https://es.tradingview.com/chart/iI2KiaxW/?symbol=${getTVSymbol(s.symbol)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Ver en TradingView"
                          >
                            <ChevronRight size={14} />
                          </ScanTVLink>
                          <AlertActionBtn style={{ padding: '4px', marginTop: '0.1rem' }} onClick={() => handleOpenAlert(s.symbol, s.price)} title="Crear Alerta">
                            <BellRing size={14} />
                          </AlertActionBtn>
                        </ActionsWrap>
                      </ScanResultRight>
                    </ScanResultRow>
                  ))}
                </ScanResultsSection>
              )}
            </ScanBody>
          </ScanPanel>
        </ScanOverlay>
      )}

      <ETFComponentsModal 
        selectedETF={selectedETF} 
        etfComponents={etfComponents} 
        onClose={handleCloseETF} 
        onOpenOpScore={handleOpenOpScore} 
        onOpenAlert={handleOpenAlert} 
      />


      {/* ── Modal Nueva Alerta ────────────────────────────────────────── */}
      <CreateAlertModal 
        isOpen={showAlertModal} 
        onClose={() => setShowAlertModal(false)}
        initialData={alertInitialData}
        onSuccess={() => {
          // Opcionalmente recargar algo si fuera necesario
        }}
      />

      {/* ── Modal OP Score ────────────────────────────────────────── */}
      {showOpScoreModal && opScoreModalData && (
        <ScanOverlay onClick={() => setShowOpScoreModal(false)}>
          <ScanPanel onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
            <ScanPanelHeader>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={18} color="#8b5cf6" /> 
                OP Score - {opScoreModalData.symbol}
              </h3>
              <ScanCloseBtn onClick={() => setShowOpScoreModal(false)}><X size={18} /></ScanCloseBtn>
            </ScanPanelHeader>
            <ScanBody>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <OpScoreCircle $score={opScoreModalData.opScore} style={{ width: '60px', height: '60px', fontSize: '1.5rem', cursor: 'default' }}>
                  {opScoreModalData.opScore}
                </OpScoreCircle>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#f8fafc' }}>{opScoreModalData.name}</div>
                  <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Análisis Estructural Completo</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ margin: '0 0 4px 0', color: '#e2e8f0', fontSize: '0.95rem' }}>Conclusiones:</h4>
                {opScoreModalData.opScoreConclusions.map((conc, idx) => (
                  <div key={idx} style={{ 
                    padding: '12px 16px', 
                    background: 'rgba(15, 23, 42, 0.6)', 
                    borderRadius: '6px', 
                    borderLeft: '3px solid #8b5cf6',
                    fontSize: '0.95rem',
                    lineHeight: '1.5',
                    color: '#cbd5e1',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {conc}
                  </div>
                ))}
              </div>
            </ScanBody>
          </ScanPanel>
        </ScanOverlay>
      )}
    </Layout>
  );
};

// ─── Animations ───────────────────────────────────────────────────────────────
const fadeIn = keyframes`from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}`;
const spin   = keyframes`from{transform:rotate(0deg)}to{transform:rotate(360deg)}`;

// ─── Layout ───────────────────────────────────────────────────────────────────
const Layout = styled.div`
  padding: 2rem 0;
  min-height: calc(100vh - 80px);
  background: #0f172a;
  color: #e2e8f0;
  animation: ${fadeIn} 0.35s ease-out;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 1.5rem;
  @media(max-width:600px){flex-direction:column;align-items:flex-start;gap:.75rem;}
`;

const TitleArea = styled.div`display:flex;flex-direction:column;gap:.25rem;`;

const Title = styled.h1`
  font-family: 'Unbounded', sans-serif;
  font-size: 1.9rem;
  margin: 0;
  background: linear-gradient(135deg,#fff 0%,#94a3b8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Sub = styled.p`color:#475569;font-size:.85rem;margin:0;`;

const RefreshWrapper = styled.div`display:flex;flex-direction:column;align-items:flex-end;gap:.25rem;`;

const HeaderBtns = styled.div`display:flex;gap:.5rem;align-items:center;`;

const RefreshBtn = styled.button`
  display:flex;align-items:center;gap:.4rem;
  background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
  color:white;padding:.4rem .9rem;border-radius:8px;font-size:.85rem;font-weight:500;
  cursor:pointer;transition:background .2s;
  &:hover{background:rgba(255,255,255,.1);}
  &:disabled{opacity:.5;cursor:not-allowed;}
  .spin{animation:${spin} 1s linear infinite;}
`;

const ScanBtn = styled.button`
  display:flex;align-items:center;gap:.4rem;
  background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(234,88,12,0.15));
  border: 1px solid rgba(245,158,11,0.35);
  color: #f59e0b;
  padding:.4rem .9rem;border-radius:8px;font-size:.85rem;font-weight:600;
  cursor:pointer;transition:all .2s;
  &:hover{
    background: linear-gradient(135deg, rgba(245,158,11,0.25), rgba(234,88,12,0.25));
    border-color: rgba(245,158,11,0.6);
    box-shadow: 0 0 12px rgba(245,158,11,0.2);
  }
  &:disabled{opacity:.5;cursor:not-allowed;}
  .spin{animation:${spin} 1s linear infinite;}
`;

// ─── Scan Panel ───────────────────────────────────────────────────────────────
const ScanOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(3px);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
`;

const ScanPanel = styled.div`
  width: min(480px, 100vw);
  height: 100%;
  background: #0f172a;
  border-left: 1px solid rgba(245,158,11,0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideIn 0.25s ease-out;
  @keyframes slideIn {
    from { transform: translateX(100%); }
    to   { transform: translateX(0); }
  }
`;

const ScanPanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  background: #111827;
  flex-shrink: 0;
`;

const ScanPanelTitle = styled.h2`
  font-family: 'Unbounded', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: white;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ScanCloseBtn = styled.button`
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: #94a3b8;
  border-radius: 8px;
  padding: 0.35rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all .2s;
  &:hover { background: rgba(255,255,255,0.1); color: white; }
`;

const ScanBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.1) transparent;
`;

const ScanDescription = styled.p`
  font-size: 0.82rem;
  color: #475569;
  margin: 0;
  line-height: 1.5;
`;

const ScanFilterBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ScanFilterLabel = styled.span`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #334155;
`;

const ScanThresholdValue = styled.span`
  margin-left: auto;
  font-size: 0.85rem;
  font-weight: 700;
  color: #f59e0b;
  letter-spacing: 0;
  text-transform: none;
`;

const ScanSliderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ScanSliderLabel = styled.span`
  font-size: 0.7rem;
  color: #334155;
  white-space: nowrap;
`;

const ScanSlider = styled.input`
  flex: 1;
  -webkit-appearance: none;
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(
    to right,
    #f59e0b 0%,
    #f59e0b ${p => ((p.value - 0.5) / 4.5) * 100}%,
    rgba(255,255,255,0.1) ${p => ((p.value - 0.5) / 4.5) * 100}%,
    rgba(255,255,255,0.1) 100%
  );
  outline: none;
  cursor: pointer;
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px; height: 16px;
    border-radius: 50%;
    background: #f59e0b;
    cursor: pointer;
    border: 2px solid #0f172a;
    box-shadow: 0 0 6px rgba(245,158,11,0.5);
  }
`;

const EmaReadyNote = styled.div`
  font-size: 0.72rem;
  color: #334155;
  font-style: italic;
`;

const ScanRunBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.8rem;
  background: linear-gradient(135deg, #f59e0b, #ea580c);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 0.95rem;
  font-weight: 700;
  font-family: 'Unbounded', sans-serif;
  cursor: pointer;
  transition: all 0.2s;
  .spin { animation: ${spin} 1s linear infinite; }
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(245,158,11,0.35);
  }
  &:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
`;

export const ScanResultsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const ScanResultsHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
`;

const ScanActiveFiltersBox = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.25rem;
`;

const ActiveFilterPill = styled.span`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
`;

export const ScanResultsTitle = styled.div`
  font-family: 'Unbounded', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  color: #e2e8f0;
`;

export const ScanResultsHint = styled.div`
  font-size: 0.72rem;
  color: #475569;
`;

export const ScanResultRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  transition: all 0.15s;
  &:hover {
    background: rgba(245,158,11,0.05);
    border-color: rgba(245,158,11,0.2);
  }
`;

export const ScanResultLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
`;

export const ScanResultSymbol = styled.span`
  font-family: 'Unbounded', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  color: white;
`;

export const ScanResultName = styled.span`
  font-size: 0.75rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
`;

export const ScanResultMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.1rem;
`;

export const ScanResultSector = styled.span`
  font-size: 0.65rem;
  color: #334155;
  background: rgba(255,255,255,0.05);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
`;

export const ScanResultRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  flex-shrink: 0;
`;

export const ScanResultPrice = styled.span`
  font-size: 0.85rem;
  font-weight: 700;
  color: white;
  font-variant-numeric: tabular-nums;
`;

export const ScanEmaChip = styled.span`
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 5px;
  background: ${p => p.$close
    ? 'rgba(245,158,11,0.15)'
    : p.$pos ? 'rgba(52,211,153,0.12)' : 'rgba(244,63,94,0.12)'};
  color: ${p => p.$close ? '#f59e0b' : p.$pos ? '#34d399' : '#f43f5e'};
  border: 1px solid ${p => p.$close
    ? 'rgba(245,158,11,0.3)'
    : p.$pos ? 'rgba(52,211,153,0.25)' : 'rgba(244,63,94,0.25)'};
`;

export const ScanTVLink = styled.a`
  color: #2962FF;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: rgba(41,98,255,0.1);
  border-radius: 6px;
  transition: all 0.2s;
  margin-top: 0.1rem;
  &:hover { background: rgba(41,98,255,0.2); transform: scale(1.1); }
`;

const UpdateLabel = styled.div`
  display:flex;align-items:center;gap:.25rem;font-size:.7rem;color:#334155;
`;

// ─── Filters ──────────────────────────────────────────────────────────────────
const FiltersBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: .75rem;
  background: #111827;
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 14px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
`;

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: .75rem;
  flex-wrap: wrap;
`;

const FilterLabel = styled.span`
  display: flex;
  align-items: center;
  gap: .3rem;
  font-size: .72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: #334155;
  min-width: 72px;
  flex-shrink: 0;
`;

const PillGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: .35rem;
`;

const Pill = styled.button`
  display: inline-flex;
  align-items: center;
  padding: .28rem .75rem;
  border-radius: 99px;
  border: 1px solid ${p => p.$active ? colors.primary : 'rgba(255,255,255,.08)'};
  background: ${p => p.$active ? `${colors.primary}20` : 'transparent'};
  color: ${p => p.$active ? colors.primary : '#64748b'};
  font-size: .78rem;
  font-weight: ${p => p.$active ? 700 : 500};
  cursor: pointer;
  transition: all .18s;
  white-space: nowrap;
  &:hover { border-color: ${colors.primary}80; color: #e2e8f0; }
`;

// ─── States ───────────────────────────────────────────────────────────────────
const StateBox = styled.div`
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  height:260px;gap:1rem;color:${p=>p.$error?'#f43f5e':'#475569'};
  .spin{animation:${spin} 1s linear infinite;}
`;

// ─── Group toggle ─────────────────────────────────────────────────────────────
const GroupToggleBar = styled.div`
  display: flex;
  align-items: center;
  gap: .75rem;
  margin-bottom: 1.5rem;
`;

const GroupToggleLabel = styled.span`
  font-size: .75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: #334155;
`;

const GroupToggleBtns = styled.div`
  display: flex;
  gap: .35rem;
  background: rgba(15,23,42,.8);
  padding: .3rem;
  border-radius: 9px;
  border: 1px solid rgba(255,255,255,.06);
`;

const GroupToggleBtn = styled.button`
  display: flex;
  align-items: center;
  gap: .35rem;
  padding: .35rem .85rem;
  border-radius: 6px;
  border: none;
  font-size: .8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all .2s;
  background: ${p => p.$active ? `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark || colors.primary})` : 'transparent'};
  color: ${p => p.$active ? 'white' : '#475569'};
  &:hover { color: white; }
`;

// ─── Groups ───────────────────────────────────────────────────────────────────
const GroupsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2.25rem;
`;

const GroupSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: .65rem;
`;

const GroupHeader = styled.div`
  display: flex;
  align-items: center;
  gap: .65rem;
`;

const GroupTitle = styled.h2`
  font-family: 'Unbounded', sans-serif;
  font-size: .95rem;
  font-weight: 700;
  color: #e2e8f0;
  margin: 0;
  letter-spacing: .02em;
`;

const GroupCount = styled.span`
  font-size: .68rem;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.07);
  color: #475569;
  padding: .12rem .5rem;
  border-radius: 99px;
  font-weight: 600;
`;

const TableWrap = styled.div`
  width: 100%;
  overflow-x: auto;
  padding-bottom: 8px; /* For scrollbar */
`;

const TVLink = styled.a`
  color: #2962FF;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  background: rgba(41, 98, 255, 0.1);
  border-radius: 6px;
  transition: all 0.2s ease;
  width: max-content;
  margin: 0 auto;
  &:hover {
    background: rgba(41, 98, 255, 0.2);
    transform: scale(1.1);
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: .875rem;
`;

const Th = styled.th`
  background: #0b1120;
  color: #334155;
  font-size: .68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .07em;
  padding: .6rem 1rem;
  text-align: ${p => p.$right ? 'right' : p.$center ? 'center' : 'left'};
  white-space: nowrap;
  width: ${p => p.$w || 'auto'};
  cursor: ${p => p.$sort ? 'pointer' : 'default'};
  user-select: none;
  border-bottom: 1px solid rgba(255,255,255,.05);
  ${p => p.$sort && '&:hover{color:#64748b;}'}
`;

const Row = styled.tr`
  background: ${p => p.$even ? 'rgba(15,23,42,.6)' : 'rgba(30,41,59,.25)'};
  border-bottom: 1px solid rgba(255,255,255,.03);
  transition: background .12s;
  &:hover{background:rgba(99,102,241,.07);}
  &:last-child{border-bottom:none;}
`;

const Td = styled.td`
  padding: .7rem 1rem;
  text-align: ${p => p.$right ? 'right' : p.$center ? 'center' : 'left'};
  width: ${p => p.$w || 'auto'};
`;

// ─── Cell content ─────────────────────────────────────────────────────────────
const SymTxt = styled.span`
  font-family: 'Unbounded', sans-serif;
  font-size: .78rem;
  font-weight: 700;
  color: white;
  letter-spacing: .04em;
`;

const NameTxt = styled.span`
  color: #94a3b8;
  font-size: .84rem;
  display: block;
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SectorBadge = styled.span`
  background: rgba(255,255,255,.06);
  color: #64748b;
  font-size: .68rem;
  font-weight: 600;
  padding: .18rem .55rem;
  border-radius: 5px;
  letter-spacing: .03em;
`;


const PriceTxt = styled.span`
  font-weight: 700;
  font-size: .9rem;
  color: ${p => p.$dim ? '#1e293b' : 'white'};
  font-variant-numeric: tabular-nums;
`;

const ChangeBadge = styled.div`
  display:inline-flex;align-items:center;justify-content:flex-end;gap:.2rem;
  font-size:.78rem;font-weight:600;
  color:${p=>p.$pos?'#34d399':'#f43f5e'};
`;

const VolBadge = styled.div`
  display:inline-flex;align-items:center;justify-content:flex-end;gap:.2rem;
  font-size:.65rem;font-weight:600;
  color:${p=>p.$acc?'#34d399':'#f59e0b'};
  margin-top: 2px;
`;

const MetaTxt = styled.span`color:#334155;font-size:.75rem;`;

const Neutral = styled.span`color:#1e293b;font-size:.72rem;margin-left:2px;`;

export const ActionsWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
`;

export const AlertActionBtn = styled.button`
  color: #f59e0b;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    background: rgba(245, 158, 11, 0.2);
    transform: scale(1.1);
  }
`;

export const RegionFlagWrap = styled.div`
  display: flex;
  align-items: center;
  gap: .45rem;
  font-size: .82rem;
  color: #94a3b8;
  font-weight: 500;
`;


export default ScreenerPage;

const ColorDot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
`;

export const OpScoreCircle = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  color: white;
  background: ${p => {
    if (p.$score >= 80) return 'linear-gradient(135deg, #22c55e, #16a34a)';
    if (p.$score >= 60) return 'linear-gradient(135deg, #eab308, #ca8a04)';
    if (p.$score >= 40) return 'linear-gradient(135deg, #f97316, #ea580c)';
    return 'linear-gradient(135deg, #ef4444, #dc2626)';
  }};
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  margin: 0 auto;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 14px rgba(0,0,0,0.25);
  }
`;
