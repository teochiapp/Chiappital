import { riskSymbols, portfolioRisk } from '../../services/portfolioMetrics';
// components/Trades/Diversification.js - Componente para análisis de diversificación
import React, { useMemo, useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { BarChart3, Building2, Globe, Factory, Wallet, PieChart as PieChartIcon, AlertTriangle, Activity, Info } from 'lucide-react';
import { getSymbolData, CHART_COLORS } from '../../config/marketData';
import { colors, componentColors, getTradingColor, withOpacity } from '../../styles/colors';
import apiService from '../../services/apiService';

const DiversificationContainer = styled.div`
  background: #1e293b;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Header = styled.div`
  padding: 2rem;
  padding-bottom: 0;

  @media (max-width: 768px) {
    padding: 1.5rem;
    padding-bottom: 0;
  }
`;

const Title = styled.h2`
  font-size: 1.8rem;
  font-weight: 600;
  font-family: 'Unbounded', sans-serif;
  color: white;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1rem;
  font-family: 'Unbounded', sans-serif;
  margin: 0 0 1.5rem 0;
  color: #94a3b8;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 1rem;
  padding: 0 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  overflow-x: auto;
  
  /* Esconder scrollbar pero permitir scroll */
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;

  @media (max-width: 768px) {
    padding: 0 1.5rem;
  }
`;

const TabButton = styled(motion.button)`
  flex: 1;
  padding: 1rem 1.5rem;
  border: none;
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.05)' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#94a3b8'};
  font-size: 1rem;
  font-weight: 500;
  font-family: 'Unbounded', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 3px solid ${props => props.$active ? '#3b82f6' : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
  }
`;

const TabContent = styled.div`
  padding: 2rem;
  min-height: 500px;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const ChartContainer = styled.div`
  height: 400px;
  margin-bottom: 2rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const GlobalStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding: 1.5rem 2rem 0;

  @media (max-width: 768px) {
    padding: 1.5rem 1.5rem 0;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid ${props => props.$color || colors.primary};
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  font-family: 'Unbounded', sans-serif;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #94a3b8;
  font-family: 'Unbounded', sans-serif;
  font-weight: 500;
`;

const StatSubLabel = styled.div`
  font-size: 0.75rem;
  color: #cbd5e1;
  font-family: 'Unbounded', sans-serif;
  font-weight: 600;
  margin-top: 0.25rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem;
  color: #94a3b8;
`;

const EmptyIcon = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
  color: rgba(255, 255, 255, 0.1);
`;

const EmptyTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  margin: 0 0 0.5rem 0;
  font-family: 'Unbounded', sans-serif;
`;

const EmptyText = styled.p`
  font-size: 1rem;
  margin: 0;
  font-family: 'Unbounded', sans-serif;
  color: #94a3b8;
`;

const RiskSection = styled.div`
  padding: 1.5rem 2rem 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 1rem;

  @media (max-width: 768px) {
    padding: 1.5rem 1.5rem 2rem;
  }
`;

const RiskHeader = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Unbounded', sans-serif;
`;

const RiskGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const RiskCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-left: 4px solid ${props => props.$color || '#94a3b8'};
`;

const RiskLabel = styled.div`
  font-size: 0.85rem;
  color: #94a3b8;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-family: 'Unbounded', sans-serif;
`;

const RiskValue = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  color: ${props => props.$color || 'white'};
  font-family: 'Unbounded', sans-serif;
`;

const RiskDesc = styled.div`
  font-size: 0.75rem;
  color: ${props => props.$color || '#cbd5e1'};
  font-family: 'Unbounded', sans-serif;
`;

const Diversification = ({ openTrades, loading, error }) => {
  const [activeTab, setActiveTab] = useState('companies');

  // Risk metrics cache
  const [metricsCache, setMetricsCache] = useState(() => {
    try {
      const cached = localStorage.getItem('st_risk_metrics_v2');
      return cached ? JSON.parse(cached) : {};
    } catch { return {}; }
  });

  // Fetch missing risk metrics
  useEffect(() => {
    if (!openTrades || openTrades.length === 0) return;

    const symbols = riskSymbols(openTrades.map(t => getTradeAttr(t, 'symbol')));
    const missing = symbols.filter(s => {
      const cached = metricsCache[s];
      if (!cached) return true;
      return Date.now() - (cached.timestamp || 0) > (cached.max_drawdown_52w == null ? 60000 : 3600000);
    });

    if (missing.length > 0) {
      apiService.getRiskMetrics(missing)
        .then(data => {
          setMetricsCache(prev => {
            const newMetrics = { ...prev };
            const now = Date.now();
            for (const [sym, metric] of Object.entries(data.metrics || {})) {
              newMetrics[sym] = { ...metric, timestamp: now };
            }
            localStorage.setItem('st_risk_metrics_v2', JSON.stringify(newMetrics));
            return newMetrics;
          });
        })
        .catch(err => console.error('Error fetching risk metrics:', err));
    }
  }, [openTrades, metricsCache]);

  // Función para adaptar estructura de Strapi
  const getTradeAttr = (trade, attr) => {
    if (!trade) return null;
    return trade.attributes ? trade.attributes[attr] : trade[attr];
  };

  // Procesar datos de diversificación
  const diversificationData = useMemo(() => {
    if (!openTrades || openTrades.length === 0) return null;

    const companies = {};
    const countries = {};
    const sectors = {};
    let totalPortfolio = 0;

    openTrades.forEach(trade => {
      const symbol = String(getTradeAttr(trade, 'symbol') || '').trim().toUpperCase();
      const portfolioPercentage = parseFloat(getTradeAttr(trade, 'portfolio_percentage')) || 0;
      
      if (!symbol || portfolioPercentage === 0) return;

      const symbolData = getSymbolData(trade);
      totalPortfolio += portfolioPercentage;

      // Por empresa (incluyendo ETFs para visualización completa de la cartera)
      if (companies[symbol]) {
        companies[symbol] += portfolioPercentage;
      } else {
        companies[symbol] = portfolioPercentage;
      }

      // Por país
      const countryName = symbolData.countryName;
      if (countries[countryName]) {
        countries[countryName] += portfolioPercentage;
      } else {
        countries[countryName] = portfolioPercentage;
      }

      // Por sector
      const sectorName = symbolData.sectorName;
      if (sectors[sectorName]) {
        sectors[sectorName] += portfolioPercentage;
      } else {
        sectors[sectorName] = portfolioPercentage;
      }
    });

    const exposure = portfolioRisk(openTrades, metricsCache);
    for (const [symbol, gross] of Object.entries(companies)) {
      const remaining = exposure.residual[symbol.toUpperCase()] ?? gross;
      const removed = gross - remaining;
      if (removed <= 0) continue;
      companies[symbol] = remaining;
      const trade = openTrades.find(row => String(getTradeAttr(row, 'symbol')).toUpperCase() === symbol.toUpperCase());
      const data = getSymbolData(trade);
      countries[data.countryName] -= removed;
      sectors[data.sectorName] -= removed;
      totalPortfolio -= removed;
    }
    for (const groups of [companies, countries, sectors]) {
      Object.keys(groups).forEach(key => { if (groups[key] <= .001) delete groups[key]; });
    }

    // Convertir a arrays para gráficos
    const companiesArray = Object.entries(companies).map(([name, value], index) => ({
      name,
      value: parseFloat(value.toFixed(2)),
      color: CHART_COLORS[index % CHART_COLORS.length]
    })).sort((a, b) => b.value - a.value);

    const countriesArray = Object.entries(countries).map(([name, value], index) => ({
      name,
      value: parseFloat(value.toFixed(2)),
      color: CHART_COLORS[index % CHART_COLORS.length]
    })).sort((a, b) => b.value - a.value);

    const sectorsArray = Object.entries(sectors).map(([name, value], index) => ({
      name,
      value: parseFloat(value.toFixed(2)),
      color: CHART_COLORS[index % CHART_COLORS.length]
    })).sort((a, b) => b.value - a.value);

    return {
      companies: companiesArray,
      countries: countriesArray,
      sectors: sectorsArray,
      totalPortfolio: parseFloat(totalPortfolio.toFixed(2)),
      stats: {
        totalCompanies: companiesArray.length,
        totalCountries: countriesArray.length,
        totalSectors: sectorsArray.length,
        largestPosition: Math.max(0, ...companiesArray.map(c => c.value)),
        largestCompany: companiesArray.length > 0 ? companiesArray[0].name : 'N/A', // La empresa con mayor posición (primer elemento ya está ordenado)
        mostDiversifiedSector: sectorsArray.length > 0 ? sectorsArray[0].name : 'N/A'
      }
    };
  }, [openTrades, metricsCache]);

  // Procesar riesgo de la cartera
  const riskMetrics = useMemo(() => {
    if (!openTrades || openTrades.length === 0) return null;

    const risk = portfolioRisk(openTrades, metricsCache);
    return { ...risk, weightedBeta: risk.beta, weightedDrawdown: risk.historical };
  }, [openTrades, metricsCache]);

  const getBetaColor = (b) => {
    if (b < 0) return '#a78bfa';
    if (b > 1.2) return '#f87171'; // Red
    if (b < 0.8) return '#34d399'; // Green
    return '#fbbf24'; // Yellow
  };
  const getBetaDesc = (b) => {
    if (b < 0) return 'Exposición neta inversa';
    if (b > 1.2) return 'Agresiva / Alta volatilidad';
    if (b < 0.8) return 'Conservadora / Baja volatilidad';
    return 'Neutral / Mercado';
  };
  const getDrawdownColor = (d) => {
    if (d < -20) return '#f87171';
    if (d < -10) return '#fbbf24';
    if (d < 0) return '#34d399';
    return '#94a3b8';
  };

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          fontFamily: 'Unbounded'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{`${payload[0].name}: ${payload[0].value}%`}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <DiversificationContainer>
        <Header>
          <Title>
            <BarChart3 size={24} />
            Diversificación
          </Title>
          <Subtitle>Cargando análisis de cartera...</Subtitle>
        </Header>
        <EmptyState>
          <EmptyIcon>
            <PieChartIcon size={64} strokeWidth={1} />
          </EmptyIcon>
          <EmptyTitle>Cargando...</EmptyTitle>
          <EmptyText>Analizando tu diversificación</EmptyText>
        </EmptyState>
      </DiversificationContainer>
    );
  }

  if (error) {
    return (
      <DiversificationContainer>
        <Header>
          <Title>
            <BarChart3 size={24} />
            Diversificación
          </Title>
          <Subtitle>Error al cargar datos</Subtitle>
        </Header>
        <EmptyState>
          <EmptyIcon>
            <AlertTriangle size={64} strokeWidth={1} />
          </EmptyIcon>
          <EmptyTitle>Error</EmptyTitle>
          <EmptyText>{error}</EmptyText>
        </EmptyState>
      </DiversificationContainer>
    );
  }

  if (!diversificationData || riskMetrics.total === 0) {
    return (
      <DiversificationContainer>
        <Header>
          <Title>
            <BarChart3 size={24} />
            Diversificación
          </Title>
          <Subtitle>Análisis de distribución de tu cartera</Subtitle>
        </Header>
        <EmptyState>
          <EmptyIcon>
            <PieChartIcon size={64} strokeWidth={1} />
          </EmptyIcon>
          <EmptyTitle>Sin datos de diversificación</EmptyTitle>
          <EmptyText>
            Agrega el porcentaje de cartera en tus posiciones para ver el análisis de diversificación
          </EmptyText>
        </EmptyState>
      </DiversificationContainer>
    );
  }

  const renderCompaniesTab = () => (
    <div>
      <StatsGrid>
        <StatCard $color={colors.secondary}>
          <StatValue>{diversificationData.stats.totalCompanies}</StatValue>
          <StatLabel>Empresas</StatLabel>
        </StatCard>
        <StatCard $color={colors.primary}>
          <StatValue>{diversificationData.stats.largestPosition}%</StatValue>
          <StatLabel>
            Mayor Posición
            <StatSubLabel>{diversificationData.stats.largestCompany}</StatSubLabel>
          </StatLabel>
        </StatCard>
      </StatsGrid>

      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={diversificationData.companies}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {diversificationData.companies.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );

  const renderCountriesTab = () => (
    <div>
      <StatsGrid>
        <StatCard $color={colors.primary}>
          <StatValue>{diversificationData.stats.totalCountries}</StatValue>
          <StatLabel>Países</StatLabel>
        </StatCard>
        <StatCard $color={colors.status.warning}>
          <StatValue>{diversificationData.countries[0]?.name || 'N/A'}</StatValue>
          <StatLabel>
            País Principal
            <StatSubLabel>{diversificationData.countries[0]?.value || 0}% del portafolio</StatSubLabel>
          </StatLabel>
        </StatCard>
        <StatCard $color={colors.secondary}>
          <StatValue>{diversificationData.countries[0]?.value || 0}%</StatValue>
          <StatLabel>Concentración Geográfica</StatLabel>
        </StatCard>
      </StatsGrid>

      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={diversificationData.countries}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {diversificationData.countries.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );

  const renderSectorsTab = () => (
    <div>
      <StatsGrid>
        <StatCard $color={colors.black}>
          <StatValue>{diversificationData.stats.totalSectors}</StatValue>
          <StatLabel>Sectores</StatLabel>
        </StatCard>
        <StatCard $color={colors.status.warning}>
          <StatValue>{diversificationData.sectors[0]?.name || 'N/A'}</StatValue>
          <StatLabel>
            Sector Principal
            <StatSubLabel>{diversificationData.sectors[0]?.value || 0}% del portafolio</StatSubLabel>
          </StatLabel>
        </StatCard>
        <StatCard $color={colors.trading.profit}>
          <StatValue>{diversificationData.sectors[0]?.value || 0}%</StatValue>
          <StatLabel>Concentración Sectorial</StatLabel>
        </StatCard>
      </StatsGrid>

      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={diversificationData.sectors}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${value}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {diversificationData.sectors.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );

  return (
    <DiversificationContainer>
      <Header>
        <Title>
          <BarChart3 size={24} />
          Diversificación
        </Title>
        <Subtitle>Análisis de distribución de tu cartera</Subtitle>
      </Header>

      <GlobalStatsGrid>
        <StatCard $color={colors.trading.profit}>
          <StatValue>{diversificationData.totalPortfolio}%</StatValue>
          <StatLabel>Exposición sin cobertura</StatLabel>
        </StatCard>
        <StatCard $color={colors.gray[600]}>
          <StatValue>{riskMetrics.liquidity.toFixed(1)}%</StatValue>
          <StatLabel title="Efectivo más capital cubierto. PSQ compensa QQQ y TQQQ según su exposición diaria. SH compensa SPY y la sensibilidad positiva restante al mercado, estimada por beta.">Liquidez efectiva estimada</StatLabel>
          <StatLabel>Efectivo estimado {riskMetrics.cash.toFixed(1)} % · Cobertura {riskMetrics.hedged.toFixed(1)} %</StatLabel>
          <StatLabel>Por índice {riskMetrics.directHedged.toFixed(1)} % · Por beta {riskMetrics.estimatedHedged.toFixed(1)} %</StatLabel>
          {riskMetrics.unknownExposure > 0 && <StatLabel>Sin beta para estimar cobertura: {riskMetrics.unknownExposure.toFixed(1)} %</StatLabel>}
        </StatCard>
      </GlobalStatsGrid>
      {riskMetrics.hedges.length > 0 && <details style={{ padding: '1rem 2rem', color: '#94a3b8' }}>
        <summary>Cómo se calculó la cobertura</summary>
        {riskMetrics.hedges.map(hedge => <p key={hedge.inverse + hedge.direct}>
          {hedge.inverse} {hedge.inverseCapital.toFixed(2)} % + {hedge.direct} {hedge.directCapital.toFixed(2)} %
          {' · '}{hedge.method === 'index' ? 'Por exposición al mismo índice' : 'Cobertura de mercado estimada por beta'}
        </p>)}
        <p>La compensación por beta estima la sensibilidad al mercado. Las posiciones conservan riesgo específico, costos y diferencias de seguimiento.</p>
      </details>}
      {riskMetrics.overallocated && <p role="alert" style={{ color: '#fbbf24', padding: '0 2rem' }}>Los pesos superan el 100 % del patrimonio. Revisá las posiciones duplicadas o sus porcentajes.</p>}

      <TabsContainer style={{ marginTop: '1.5rem' }}>
        <TabButton
          $active={activeTab === 'companies'}
          onClick={() => setActiveTab('companies')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Building2 size={18} />
          Por Empresa
        </TabButton>
        <TabButton
          $active={activeTab === 'countries'}
          onClick={() => setActiveTab('countries')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Globe size={18} />
          Por Geografía
        </TabButton>
        <TabButton
          $active={activeTab === 'sectors'}
          onClick={() => setActiveTab('sectors')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Factory size={18} />
          Por Sector
        </TabButton>
      </TabsContainer>

      <TabContent>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'companies' && renderCompaniesTab()}
          {activeTab === 'countries' && renderCountriesTab()}
          {activeTab === 'sectors' && renderSectorsTab()}
        </motion.div>
      </TabContent>

      {riskMetrics && (
        <RiskSection>
          <RiskHeader>
            <Activity size={18} /> Análisis de Riesgo Estimado de la Cartera
          </RiskHeader>
          <RiskGrid>
            <RiskCard $color={getBetaColor(riskMetrics.weightedBeta)}>
              <RiskLabel>Beta Ponderado <Info size={14} color="#64748b" title="Sensibilidad al mercado ponderada por patrimonio, con signo negativo para los inversos" style={{ cursor: 'help' }}/></RiskLabel>
              <RiskValue $color={getBetaColor(riskMetrics.weightedBeta)}>
                {riskMetrics.betaMissing ? 'Datos incompletos' : riskMetrics.weightedBeta.toFixed(2)}
              </RiskValue>
              <RiskDesc $color={getBetaColor(riskMetrics.weightedBeta)}>{riskMetrics.betaMissing ? 'Falta beta para ' + riskMetrics.betaMissing.toFixed(1) + '% del patrimonio' : getBetaDesc(riskMetrics.weightedBeta)}</RiskDesc>
            </RiskCard>
            <RiskCard $color={getDrawdownColor(riskMetrics.weightedDrawdown)}>
              <RiskLabel>Escenario de caída histórica (52 semanas) <Info size={14} color="#64748b" title="Suma ponderada de las peores caídas entre cierres semanales de cada componente en las últimas 52 semanas. La porción emparejada de coberturas aporta cero bajo el criterio de dolarización." style={{ cursor: 'help' }}/></RiskLabel>
              <RiskValue $color={getDrawdownColor(riskMetrics.weightedDrawdown)}>
                {riskMetrics.historicalMissing ? 'Datos incompletos' : riskMetrics.weightedDrawdown.toFixed(1) + '%'}
              </RiskValue>
              <RiskDesc $color={getDrawdownColor(riskMetrics.weightedDrawdown)}>
                {riskMetrics.historicalMissing ? 'Falta historial para ' + riskMetrics.historicalMissing.toFixed(1) + '% del patrimonio' : 'Estimación semanal por componentes y pesos actuales'}
              </RiskDesc>
            </RiskCard>
          </RiskGrid>
        </RiskSection>
      )}
    </DiversificationContainer>
  );
};

export default Diversification;
