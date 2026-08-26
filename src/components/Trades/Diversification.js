// components/Trades/Diversification.js - Componente para análisis de diversificación
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { BarChart3, Building2, Globe, Factory, Wallet, PieChart as PieChartIcon, AlertTriangle } from 'lucide-react';
import { getSymbolData, CHART_COLORS } from '../../config/marketData';
import { colors, componentColors, getTradingColor, withOpacity } from '../../styles/colors';

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

const Diversification = ({ openTrades, loading, error }) => {
  const [activeTab, setActiveTab] = useState('companies');

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
      const symbol = getTradeAttr(trade, 'symbol');
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

    // --- EXCEPCIÓN: LÓGICA DE NEUTRALIZACIÓN QQQ/PSQ ---
    const qqqPerc = companies['QQQ'] || 0;
    const psqPerc = companies['PSQ'] || 0;

    if (qqqPerc > 0 && psqPerc > 0) {
      const hedgedAmount = Math.min(qqqPerc, psqPerc);
      
      companies['QQQ'] = Math.max(0, qqqPerc - psqPerc);
      companies['PSQ'] = Math.max(0, psqPerc - qqqPerc);
      
      // Si la exposición neta es 0, ocultarlo
      if (companies['QQQ'] <= 0.001) delete companies['QQQ'];
      if (companies['PSQ'] <= 0.001) delete companies['PSQ'];
      
      // Ajustar países y sectores restando la parte neutralizada
      const qqqTrade = openTrades.find(t => getTradeAttr(t, 'symbol') === 'QQQ');
      const psqTrade = openTrades.find(t => getTradeAttr(t, 'symbol') === 'PSQ');
      
      if (qqqTrade) {
        const qqqData = getSymbolData(qqqTrade);
        if (countries[qqqData.countryName]) countries[qqqData.countryName] -= hedgedAmount;
        if (sectors[qqqData.sectorName]) sectors[qqqData.sectorName] -= hedgedAmount;
      }
      
      if (psqTrade) {
        const psqData = getSymbolData(psqTrade);
        if (countries[psqData.countryName]) countries[psqData.countryName] -= hedgedAmount;
        if (sectors[psqData.sectorName]) sectors[psqData.sectorName] -= hedgedAmount;
      }
      
      // Limpiar países o sectores si quedaron en 0
      Object.keys(countries).forEach(k => { if (countries[k] <= 0.001) delete countries[k]; });
      Object.keys(sectors).forEach(k => { if (sectors[k] <= 0.001) delete sectors[k]; });
      
      // Ajustar el totalPortfolio restando el capital neutralizado
      const neutralizedCapital = hedgedAmount * 2;
      totalPortfolio -= neutralizedCapital;
    }
    // ---------------------------------------------------

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
        largestPosition: Math.max(...companiesArray.map(c => c.value)),
        largestCompany: companiesArray.length > 0 ? companiesArray[0].name : 'N/A', // La empresa con mayor posición (primer elemento ya está ordenado)
        mostDiversifiedSector: sectorsArray.length > 0 ? sectorsArray[0].name : 'N/A'
      }
    };
  }, [openTrades]);

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

  if (!diversificationData || diversificationData.totalPortfolio === 0) {
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
          <StatLabel>Total de Cartera Invertido</StatLabel>
        </StatCard>
        <StatCard $color={colors.gray[600]}>
          <StatValue>{(100 - diversificationData.totalPortfolio).toFixed(1)}%</StatValue>
          <StatLabel>Liquidez Disponible</StatLabel>
        </StatCard>
      </GlobalStatsGrid>

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
    </DiversificationContainer>
  );
};

export default Diversification;
