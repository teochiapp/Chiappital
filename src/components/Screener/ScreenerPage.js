import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { RefreshCw, AlertCircle, TrendingUp, TrendingDown, Clock, ChevronDown, ChevronUp, Globe, Layers, Map, Briefcase, ExternalLink } from 'lucide-react';
import { StyledContainer } from '../common/StyledComponents';
import { SiTradingview } from 'react-icons/si';
import symbolSearchService from '../../services/symbolSearchService';
import priceService from '../../services/priceService';
import { colors, withOpacity } from '../../styles/colors';

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

  // Función para cargar las EMA faltantes de a poco en segundo plano
  const loadEmaDistances = async (dataList) => {
    const missing = dataList.filter(s => s.emaDistance === null && s.price > 0);
    
    for (let i = 0; i < missing.length; i++) {
      const item = missing[i];
      try {
        const emaDistance = await priceService.getEma21Distance(item.symbol, item.price);
        setStockData(prev => prev.map(s => 
          s.symbol === item.symbol ? { ...s, emaDistance } : s
        ));
      } catch (e) {
        console.warn(`Error procesando EMA para ${item.symbol}`);
      }
    }
  };

  const handleRefresh = () => fetchScreenerData(true);

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
    const data = groupMode === 'general' ? stockData : stockData.filter(s => s.type !== 'ETF');
    const unique = [...new Set(data.map(s => s.region).filter(Boolean))];
    return unique.sort();
  }, [stockData, groupMode]);

  const sectors = useMemo(() => {
    const data = groupMode === 'general' ? stockData : stockData.filter(s => s.type !== 'ETF');
    const pool = filterRegion === 'ALL'
      ? data
      : data.filter(s => s.region === filterRegion);
    const unique = [...new Set(pool.map(s => s.sector).filter(Boolean))];
    return unique.sort((a, b) => {
      if (a === 'ETF') return -1;
      if (b === 'ETF') return 1;
      return a.localeCompare(b);
    });
  }, [stockData, filterRegion, groupMode]);

  // Datos filtrados + ordenados
  const visibleData = useMemo(() => {
    let d = stockData;
    
    // Si no estamos en General, excluimos los ETFs
    if (groupMode !== 'general') {
      d = d.filter(s => s.type !== 'ETF');
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
  }, [stockData, filterRegion, filterSector, sortKey, sortDir]);

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
            <RefreshBtn onClick={handleRefresh} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              Actualizar
            </RefreshBtn>
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
                          <Th $w="130px" $sort onClick={() => handleSort('sector')}>
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
                        <Th $w="65px" $center>Gráfico</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {stocks.map((s, i) => (
                        <Row key={s.symbol} $even={i % 2 === 0}>
                          <Td $w="105px"><SymTxt>{s.symbol}</SymTxt></Td>
                          <Td $w="auto"><NameTxt>{s.name}</NameTxt></Td>
                          {groupMode === 'region' ? (
                            <Td $w="130px"><SectorBadge>{s.sector}</SectorBadge></Td>
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
                          <Td $w="65px" $center>
                            <TVLink 
                              href={`https://es.tradingview.com/chart/iI2KiaxW/?symbol=${s.symbol}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              title="Ver en TradingView"
                            >
                              <SiTradingview size={15} />
                            </TVLink>
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

const RefreshBtn = styled.button`
  display:flex;align-items:center;gap:.4rem;
  background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
  color:white;padding:.4rem .9rem;border-radius:8px;font-size:.85rem;font-weight:500;
  cursor:pointer;transition:background .2s;
  &:hover{background:rgba(255,255,255,.1);}
  &:disabled{opacity:.5;cursor:not-allowed;}
  .spin{animation:${spin} 1s linear infinite;}
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

const RegionFlagWrap = styled.div`
  display: flex;
  align-items: center;
  gap: .45rem;
  font-size: .82rem;
  color: #94a3b8;
  font-weight: 500;
`;


export default ScreenerPage;
