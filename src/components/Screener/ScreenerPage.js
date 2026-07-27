import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { RefreshCw, AlertCircle, TrendingUp, TrendingDown, Clock, ChevronDown, ChevronUp, Globe, Layers, Map, Briefcase, ExternalLink, Zap, X, Target, ChevronRight, BellRing } from 'lucide-react';
import { StyledContainer } from '../common/StyledComponents';
import { SiTradingview } from 'react-icons/si';
import symbolSearchService from '../../services/symbolSearchService';
import priceService from '../../services/priceService';
import CreateAlertModal from '../Alerts/CreateAlertModal';
import { colors, withOpacity } from '../../styles/colors';
import { useLabData } from '../../context/LabContext';

// Nombres de las regiones
const REGION_LABELS = {
  US:     'USA',
  AR:     'Argentina',
  BR:     'Brasil',
  CN:     'China',
  EU:     'Europa',
  JP:     'Japón',
  IN:     'India',
  Global: 'Global',
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
};

// Componente bandera + nombre
const RegionFlag = ({ code, showName = true }) => {
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
        : <span style={{ fontSize: '1rem' }}>🌐</span>
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
  const [groupMode, setGroupMode]   = useState('general'); // 'region' | 'sector' | 'general'
  const [symbolsList] = useState(() => symbolSearchService.getPopularSymbols());

  // Data del laboratorio (Sectores y Paises)
  const { sectorData, countryData } = useLabData();

  // ── Scan Rápido ──────────────────────────────────────────────────────────────
  const [showScan, setShowScan]         = useState(false);
  const [selectedScanRegions, setSelectedScanRegions] = useState([]);
  const [selectedScanSectors, setSelectedScanSectors] = useState([]);
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

  useEffect(() => { fetchScreenerData(false); }, []);

  const fetchScreenerData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      if (forceRefresh) priceService.clearCache();
      const tickers = symbolsList.map(s => s.symbol);
      const pricesMap = await priceService.getMultiplePrices(tickers);
      const combined = symbolsList.map(item => {
        const symbolStr = item.symbol.toUpperCase();
        const price = pricesMap[symbolStr] || 0;
        
        // Pseudo-random consistente para changePercent basado en el string (entre -5% y +5%)
        const charSum = symbolStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const pseudoRandom = (charSum % 110) / 10 - 5.5; 
        
        // Obtener de cache síncrona si existe
        const cachedEmaDistance = priceService.getCachedEma21Distance(item.symbol, price);
        
        return {
          ...item,
          price,
          changePercent: price ? pseudoRandom : 0,
          change: price ? (price * pseudoRandom / 100) : 0,
          emaDistance: cachedEmaDistance,
        };
      });
      setStockData(combined);
      setLastUpdate(new Date());
      
      // Iniciar carga en segundo plano de EMA 21 para no bloquear UI
      setTimeout(() => {
        loadEmaDistances(combined);
      }, 500);
      
    } catch (err) {
      console.error(err);
      setError('Error al obtener datos del screener');
    } finally {
      setLoading(false);
    }
  }, [symbolsList]);

  // Función para cargar las EMA faltantes en lotes paralelos (Chunking) usando Yahoo
  const loadEmaDistances = async (dataList) => {
    const missing = dataList.filter(s => s.emaDistance === null && s.price > 0);
    // En local (dev) podemos usar lotes de 5 porque el proxy es local y robusto.
    // En producción usamos lotes de 1 (secuencial) para que los proxies públicos no colapsen (Error 429).
    const isDev = process.env.NODE_ENV === 'development';
    const CHUNK_SIZE = isDev ? 5 : 1; 

    for (let i = 0; i < missing.length; i += CHUNK_SIZE) {
      const chunk = missing.slice(i, i + CHUNK_SIZE);
      
      const promises = chunk.map(async (item) => {
        try {
          // pasamos "true" al final para forzar Yahoo y saltar la cola de TwelveData
          const emaDistance = await priceService.getEma21Distance(item.symbol, item.price, true);
          return { symbol: item.symbol, emaDistance };
        } catch (e) {
          console.warn(`Error procesando EMA para ${item.symbol}`);
          return { symbol: item.symbol, emaDistance: null };
        }
      });

      const results = await Promise.all(promises);

      // Actualizar el estado de a bloques
      setStockData(prev => {
        let next = [...prev];
        results.forEach(res => {
          if (res.emaDistance !== null) {
            const idx = next.findIndex(s => s.symbol === res.symbol);
            if (idx !== -1) {
              next[idx] = { ...next[idx], emaDistance: res.emaDistance };
            }
          }
        });
        return next;
      });
      
      // Pequeña pausa entre lotes para que el navegador respire y React renderice
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  };

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

      const results = pool
        .filter(s => s.emaDistance !== null && Math.abs(s.emaDistance) <= scanThreshold)
        .sort((a, b) => Math.abs(a.emaDistance) - Math.abs(b.emaDistance));

      setScanResults(results);
      setScanRan(true);
      setScanLoading(false);
    }, 300);
  }, [stockData, selectedScanRegions, selectedScanSectors, scanThreshold, countryData, sectorData]);

  // ── MAPEOS LAB ──────────────────────────────────────────────────────────────
  const MAP_REGION = {
    'US': 'spy',
    'AR': 'merval',
    'BR': 'ewz',
    'CN': 'fxi',
    'EU': 'vgk',
    'JP': 'ewj',
    'Global': 'eem'
  };

  const MAP_SECTOR = {
    'Software': 'igv',
    'Semiconductores': 'smh',
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
    // Si la db local los tiene en inglés o diferente
    'Technology': 'igv', // fallback
    'Financial': 'xlf',
    'Energy': 'xle',
  };

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
      
      // Tratar null/undefined como un valor por defecto según el tipo
      if (va === null || va === undefined) va = (typeof vb === 'number') ? 0 : '';
      if (vb === null || vb === undefined) vb = (typeof va === 'number') ? 0 : '';

      // Si ambos son números, orden matemático
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }

      // Si son strings, orden alfabético
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
      else if (groupMode === 'general') {
        if (s.type !== 'ETF') return; // En vista general, solo mostrar ETFs
        key = s.macroCategory || 'Otros ETFs';
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
  }, [visibleData, groupMode]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
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
                        <Th $w="105px" $sort onClick={() => handleSort('symbol')}>
                          Símbolo <SortIcon col="symbol" />
                        </Th>
                        <Th $w="auto">Nombre</Th>
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
                        <Th $w="90px" $center>Acciones</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {stocks.map((s, i) => (
                        <Row key={s.symbol} $even={i % 2 === 0}>
                          <Td $w="105px"><SymTxt>{s.symbol}</SymTxt></Td>
                          <Td $w="auto"><NameTxt>{s.name}</NameTxt></Td>
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
                            <ChangeBadge $pos={s.changePercent >= 0}>
                              {s.changePercent >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                              {Math.abs(s.changePercent).toFixed(2)}%
                            </ChangeBadge>
                          </Td>
                          <Td $w="105px" $right>
                            {s.emaDistance === null ? (
                              <MetaTxt style={{display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'4px'}}>
                                <RefreshCw size={10} className="spin" /> Calc...
                              </MetaTxt>
                            ) : (
                              <ChangeBadge $pos={s.emaDistance >= 0}>
                                {s.emaDistance >= 0 ? '+' : ''}{s.emaDistance.toFixed(2)}%
                              </ChangeBadge>
                            )}
                          </Td>
                          <Td $w="90px" $center>
                            <ActionsWrap>
                              <TVLink 
                                href={`https://es.tradingview.com/chart/iI2KiaxW/?symbol=${s.symbol}`} 
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
                Scan Rápido — EMA 21
              </ScanPanelTitle>
              <ScanCloseBtn onClick={() => setShowScan(false)}>
                <X size={18} />
              </ScanCloseBtn>
            </ScanPanelHeader>

            <ScanBody>
              {/* Descripción */}
              <ScanDescription>
                Filtra por País y Sector, buscando acciones a <strong>1% o menos</strong> de la EMA 21.<br/>
                <span style={{color: colors.primary}}>Solo aparecen opciones marcadas como <strong>Alcistas (Diario)</strong> en el Lab.</span>
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
                        : <>❌ Sin resultados dentro de ±{scanThreshold}%</>}
                    </ScanResultsTitle>
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
                            href={`https://es.tradingview.com/chart/iI2KiaxW/?symbol=${s.symbol}`}
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

      {/* ── Modal Nueva Alerta ────────────────────────────────────────── */}
      <CreateAlertModal 
        isOpen={showAlertModal} 
        onClose={() => setShowAlertModal(false)}
        initialData={alertInitialData}
        onSuccess={() => {
          // Opcionalmente recargar algo si fuera necesario
        }}
      />
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

const ScanResultsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ScanResultsHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
`;

const ScanResultsTitle = styled.div`
  font-family: 'Unbounded', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  color: #e2e8f0;
`;

const ScanResultsHint = styled.div`
  font-size: 0.72rem;
  color: #475569;
`;

const ScanResultRow = styled.div`
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

const ScanResultLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
`;

const ScanResultSymbol = styled.span`
  font-family: 'Unbounded', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  color: white;
`;

const ScanResultName = styled.span`
  font-size: 0.75rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
`;

const ScanResultMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.1rem;
`;

const ScanResultSector = styled.span`
  font-size: 0.65rem;
  color: #334155;
  background: rgba(255,255,255,0.05);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
`;

const ScanResultRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  flex-shrink: 0;
`;

const ScanResultPrice = styled.span`
  font-size: 0.85rem;
  font-weight: 700;
  color: white;
  font-variant-numeric: tabular-nums;
`;

const ScanEmaChip = styled.span`
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

const ScanTVLink = styled.a`
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

const RegionTxt = styled.span`
  font-size: .8rem;
  color: #64748b;
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

const MetaTxt = styled.span`color:#334155;font-size:.75rem;`;

const Neutral = styled.span`color:#1e293b;font-size:.72rem;margin-left:2px;`;

const ActionsWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
`;

const AlertActionBtn = styled.button`
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

const RegionFlagWrap = styled.div`
  display: flex;
  align-items: center;
  gap: .45rem;
  font-size: .82rem;
  color: #94a3b8;
  font-weight: 500;
`;


export default ScreenerPage;
