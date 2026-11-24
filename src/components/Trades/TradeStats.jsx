import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  CheckSquare, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Target, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  LineChart,
  Building2,
  Globe,
  Layers
} from 'lucide-react';
import { colors } from '../../styles/colors';
import { getSymbolData } from '../../config/marketData';
import priceService from '../../services/priceService';
import marketBenchmarksService from '../../services/marketBenchmarksService';

const StatsContainer = styled.div`
  background: #1e293b;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, ${colors.primary}, ${colors.secondary});
  }
`;

const DEFAULT_STATS = {
  totalTrades: 0,
  openTrades: 0,
  closedTrades: 0,
  winningTrades: 0,
  losingTrades: 0,
  winRate: 0,
  totalProfit: 0,
  averageWin: 0,
  averageLoss: 0,
  profitFactor: 0,
};



const StatsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 2rem 2rem 1.75rem 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    padding: 1.5rem 1.5rem 1.25rem 1.5rem;
  }
`;

const StatsTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  font-family: 'Unbounded', sans-serif;
  color: white;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  @media (max-width: 480px) {
    font-size: 1.35rem;
  }
`;

const TimeframeContainer = styled.div`
  display: flex;
  align-items: center;
  background: rgba(15, 23, 42, 0.65);
  padding: 0.35rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  gap: 0.25rem;

  @media (max-width: 600px) {
    width: 100%;
    overflow-x: auto;
    padding: 0.3rem;
  }
`;

const TimeframePill = styled.button`
  background: ${props => props.$active 
    ? `linear-gradient(135deg, ${colors.primary} 0%, #49151A 100%)` 
    : 'transparent'};
  color: ${props => props.$active ? '#ffffff' : '#94a3b8'};
  border: 1px solid ${props => props.$active ? 'rgba(255, 255, 255, 0.15)' : 'transparent'};
  padding: 0.45rem 1rem;
  border-radius: 9999px;
  font-size: 0.82rem;
  font-weight: ${props => props.$active ? '600' : '500'};
  font-family: 'Unbounded', sans-serif;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  white-space: nowrap;
  box-shadow: ${props => props.$active ? '0 4px 12px rgba(101, 29, 35, 0.35)' : 'none'};

  &:hover {
    color: #ffffff;
    background: ${props => props.$active 
      ? `linear-gradient(135deg, ${colors.primary} 0%, #49151A 100%)` 
      : 'rgba(255, 255, 255, 0.05)'};
  }

  @media (max-width: 600px) {
    padding: 0.4rem 0.65rem;
    font-size: 0.72rem;
    flex: 1;
  }
`;

const TimeframeLabel = styled.span`
  .full-text {
    display: inline;
  }
  .short-text {
    display: none;
  }
  @media (max-width: 640px) {
    .full-text {
      display: none;
    }
    .short-text {
      display: inline;
    }
  }
`;

const TIMEFRAME_OPTIONS = [
  { id: '1m', label: 'Este mes', title: 'Mes en curso' },
  { id: '6m', label: '6 meses', title: 'Últimos 6 meses' },
  { id: '12m', label: 'Este año (12 meses)', shortLabel: 'Este año (12M)', title: 'Últimos 12 meses (1 año)' },
  { id: 'all', label: 'All time', title: 'Histórico completo' },
];

const getTimeframeStartDate = (timeframeKey) => {
  if (timeframeKey === 'all') return null;
  const now = new Date();
  
  if (timeframeKey === '1m') {
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }
  
  if (timeframeKey === '6m') {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  
  if (timeframeKey === '12m') {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 12);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  
  return null;
};

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.25rem;
  padding: 0 2rem 2rem 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const StatCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.03);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1.25rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 100px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 3px;
    background: rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    border-color: ${colors.primary};
    background: rgba(255, 255, 255, 0.05);
    
    &::before {
      background: ${colors.primary};
    }
  }
`;

const StatIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 12px;
  background: rgba(${props => {
    const color = props.color;
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  }}, 0.1);
  color: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  svg {
    width: 36px;
    height: 36px;
  }
`;

const StatContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
`;

const StatValue = styled.div`
  font-size: 1.45rem;
  font-weight: 700;
  font-family: 'Unbounded', sans-serif;
  color: ${props => {
    if (props.$isPositive) return colors.trading.profit;
    if (props.$isWarning) return colors.status.warning;
    if (props.$isNegative) return colors.trading.loss;
    return 'white';
  }};
  line-height: 1.2;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  font-family: 'Unbounded', sans-serif;
  font-weight: 500;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.3;
`;

const StatTrend = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: ${props => {
    if (props.$isPositive) return colors.trading.profit;
    if (props.$isNegative) return colors.trading.loss;
    return colors.gray[500];
  }};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: ${colors.gray[600]};
  font-family: 'Unbounded', sans-serif;
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const EmptyTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${colors.black};
  margin: 0 0 0.5rem 0;
`;

const EmptyText = styled.p`
  font-size: 1rem;
  margin: 0;
`;

const TradeStats = ({ stats: _globalStats, trades = [], openTrades = [], loading, error }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');

  // Funciones de formateo de números
  const formatNumber = (num) => {
    if (num == null || isNaN(num)) return '0.00';
    return Number(num).toFixed(2);
  };

  const formatPercentage = (num) => {
    if (num == null || isNaN(num)) return '0.00';
    return Number(num).toFixed(2);
  };

  const formatCurrency = (amount) => {
    if (amount == null || isNaN(amount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calcular rendimiento promedio (SOLO de trades cerrados)
  const calculateAverageReturn = (stats) => {
    if (!stats || stats.closedTrades === 0) return 0;
    
    // Solo usar trades cerrados para el cálculo
    const totalWinAmount = stats.averageWin * stats.winningTrades;
    const totalLossAmount = Math.abs(stats.averageLoss) * stats.losingTrades;
    const netReturn = totalWinAmount - totalLossAmount;
    
    // Dividir por trades cerrados, no por total de trades
    return netReturn / stats.closedTrades;
  };

  // Helper para obtener atributos de trade (compatible con Strapi)
  const getTradeAttr = (trade, attr) => {
    return trade.attributes ? trade.attributes[attr] : trade[attr];
  };

  // Filtrar trades según la temporalidad seleccionada
  const filteredTrades = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    if (selectedTimeframe === 'all') return trades;

    const startDate = getTimeframeStartDate(selectedTimeframe);
    if (!startDate) return trades;

    return trades.filter(trade => {
      const status = getTradeAttr(trade, 'status');
      const closedAtRaw = getTradeAttr(trade, 'closed_at') || getTradeAttr(trade, 'closedAt');
      const createdAtRaw = getTradeAttr(trade, 'createdAt') || getTradeAttr(trade, 'created_at');

      if (status === 'closed') {
        // En trades cerrados, la ganancia/pérdida se realizó en la fecha de cierre
        const closedDate = closedAtRaw ? new Date(closedAtRaw) : (createdAtRaw ? new Date(createdAtRaw) : null);
        if (!closedDate || isNaN(closedDate.getTime())) return false;
        return closedDate >= startDate;
      } else {
        // En trades abiertos, se considera cuándo se abrió la posición
        const openDate = createdAtRaw ? new Date(createdAtRaw) : null;
        if (!openDate || isNaN(openDate.getTime())) return false;
        return openDate >= startDate;
      }
    });
  }, [trades, selectedTimeframe]);

  const filteredOpenTrades = useMemo(
    () => filteredTrades.filter(trade => getTradeAttr(trade, 'status') === 'open'),
    [filteredTrades]
  );

  const getTradeResultPercentage = (trade) => {
    const entryPrice = parseFloat(getTradeAttr(trade, 'entry_price'));
    const exitPrice = parseFloat(getTradeAttr(trade, 'exit_price'));
    const type = getTradeAttr(trade, 'type');

    if (!entryPrice || !exitPrice) return 0;

    if (type === 'buy') {
      return ((exitPrice - entryPrice) / entryPrice) * 100;
    }

    return ((entryPrice - exitPrice) / entryPrice) * 100;
  };

  const computeStatsForTrades = (tradesList) => {
    if (!tradesList || tradesList.length === 0) {
      return { ...DEFAULT_STATS };
    }

    const open = tradesList.filter(trade => getTradeAttr(trade, 'status') === 'open');
    const closed = tradesList.filter(trade => getTradeAttr(trade, 'status') === 'closed');

    const closedResults = closed.map(trade => getTradeResultPercentage(trade));
    const winningResults = closedResults.filter(result => result > 0);
    const losingResults = closedResults.filter(result => result < 0);

    const totalWins = winningResults.reduce((sum, result) => sum + result, 0);
    const totalLosses = losingResults.reduce((sum, result) => sum + Math.abs(result), 0);
    const totalProfit = closedResults.reduce((sum, result) => sum + result, 0);

    return {
      totalTrades: tradesList.length,
      openTrades: open.length,
      closedTrades: closed.length,
      winningTrades: winningResults.length,
      losingTrades: losingResults.length,
      winRate: closed.length > 0 ? (winningResults.length / closed.length) * 100 : 0,
      totalProfit,
      averageWin: winningResults.length > 0 ? totalWins / winningResults.length : 0,
      averageLoss: losingResults.length > 0 ? totalLosses / losingResults.length : 0,
      profitFactor: totalLosses > 0 ? totalWins / totalLosses : 0,
    };
  };

  const displayStats = useMemo(
    () => computeStatsForTrades(filteredTrades),
    [filteredTrades]
  );

  // MÉTRICAS DE DIVERSIFICACIÓN

  // 1. Diversificación por Empresa
  const calculateCompanyDiversification = (openTrades) => {
    if (!openTrades || openTrades.length === 0) return { show: false };
    
    // Filtrar trades que NO sean ETFs o índices (excluir sector 'ETF')
    const nonEtfTrades = openTrades.filter(trade => {
      const symbol = getTradeAttr(trade, 'symbol');
      const symbolData = getSymbolData(symbol);
      return symbolData.sector !== 'ETF';
    });
    
    // Si no hay trades que no sean ETFs, no mostrar la métrica
    if (nonEtfTrades.length === 0) return { show: false };
    
    // Calcular valor total de posiciones abiertas (solo no-ETFs)
    const totalValue = nonEtfTrades.reduce((sum, trade) => {
      const percentage = getTradeAttr(trade, 'portfolio_percentage') || 0;
      return sum + percentage;
    }, 0);
    
    // Solo evaluar si liquidez < 50% (es decir, posiciones > 50%) - REDUCIDO PARA TESTING
    if (totalValue < 20) return { show: false };
    
    // Agrupar por empresa (símbolo) - solo no-ETFs
    const companiesMap = new Map();
    nonEtfTrades.forEach(trade => {
      const symbol = getTradeAttr(trade, 'symbol');
      const percentage = getTradeAttr(trade, 'portfolio_percentage') || 0;
      
      if (companiesMap.has(symbol)) {
        companiesMap.set(symbol, companiesMap.get(symbol) + percentage);
      } else {
        companiesMap.set(symbol, percentage);
      }
    });
    
    // Verificar que ninguna empresa supere el 20%
    const maxCompanyPercentage = Math.max(...companiesMap.values());
    const isCorrect = maxCompanyPercentage <= 20;
    
    return {
      show: true,
      isCorrect,
      maxPercentage: maxCompanyPercentage,
      companiesCount: companiesMap.size
    };
  };

  // 2. Diversificación Geográfica (testing: reducido a >2 trades)
  const calculateGeographicDiversification = (openTrades) => {
    if (!openTrades || openTrades.length <= 2) return { show: false };
    
    // Obtener países únicos usando getSymbolData
    const countries = new Set();
    openTrades.forEach(trade => {
      const symbol = getTradeAttr(trade, 'symbol');
      if (symbol) {
        const symbolData = getSymbolData(symbol);
        countries.add(symbolData.countryName);
      }
    });
    
    const isCorrect = countries.size >= 2; // Reducido para testing
    
    return {
      show: true,
      isCorrect,
      countryCount: countries.size,
      countries: Array.from(countries)
    };
  };

  // 3. Diversificación por Sector (testing: reducido a >3 trades)
  const calculateSectorDiversification = (openTrades) => {
    if (!openTrades || openTrades.length <= 3) return { show: false };
    
    // Obtener sectores únicos usando getSymbolData
    const sectors = new Set();
    openTrades.forEach(trade => {
      const symbol = getTradeAttr(trade, 'symbol');
      if (symbol) {
        const symbolData = getSymbolData(symbol);
        sectors.add(symbolData.sectorName);
      }
    });
    
    const isCorrect = sectors.size >= 2; // Reducido para testing
    
    return {
      show: true,
      isCorrect,
      sectorCount: sectors.size,
      sectors: Array.from(sectors)
    };
  };

  // Para la diversificación del portafolio:
  // Si en la temporalidad hay suficientes trades abiertos (>=3), se evalúan sobre esos;
  // si la temporalidad es corta (ej. "Este mes" con solo nuevas posiciones), se evalúa la cartera
  // abierta global (openTrades) para mantener siempre visibles las métricas clave de salud de la cartera.
  const diversificationOpenTrades = useMemo(() => {
    if (filteredOpenTrades && filteredOpenTrades.length >= 3) {
      return filteredOpenTrades;
    }
    const allOpen = trades.filter(t => getTradeAttr(t, 'status') === 'open');
    return allOpen.length > 0 ? allOpen : (openTrades || []);
  }, [filteredOpenTrades, trades, openTrades]);

  // Calcular métricas de diversificación
  const companyDiv = calculateCompanyDiversification(diversificationOpenTrades);
  const geoDiv = calculateGeographicDiversification(diversificationOpenTrades);
  const sectorDiv = calculateSectorDiversification(diversificationOpenTrades);

  // Logs para depuración (solo en desarrollo)
  useEffect(() => {
    console.log('🔍 DEBUG - TradeStats recibido:', {
      displayStats: displayStats,
      filteredTrades: filteredTrades?.length || 0,
      filteredOpenTrades: filteredOpenTrades?.length || 0,
      loading: loading,
      error: error
    });
    
    if (filteredOpenTrades && filteredOpenTrades.length > 0) {
      console.log('📊 CÁLCULO DE MÉTRICAS DE DIVERSIFICACIÓN:');
      
      // Debug para Company Diversification
      const totalValue = filteredOpenTrades.reduce((sum, trade) => {
        const percentage = getTradeAttr(trade, 'portfolio_percentage') || 0;
        return sum + percentage;
      }, 0);
      
      console.log('🏢 Diversificación por Empresa:', {
        totalOpenTrades: filteredOpenTrades.length,
        totalPortfolioValue: totalValue,
        needsMoreThan20: totalValue >= 20,
        companyDivResult: companyDiv
      });
      
      console.log('🌍 Diversificación Geográfica:', {
        totalOpenTrades: filteredOpenTrades.length,
        needsMoreThan2: filteredOpenTrades.length > 2,
        geoDivResult: geoDiv
      });
      
      console.log('📚 Diversificación por Sector:', {
        totalOpenTrades: filteredOpenTrades.length,
        needsMoreThan3: filteredOpenTrades.length > 3,
        sectorDivResult: sectorDiv
      });
      
      // Log detallado de cada trade
      filteredOpenTrades.forEach((trade, index) => {
        const symbol = getTradeAttr(trade, 'symbol');
        const percentage = getTradeAttr(trade, 'portfolio_percentage');
        const symbolData = getSymbolData(symbol);
        
        console.log(`Trade ${index} - ${symbol}:`, {
          symbol: symbol,
          portfolio_percentage: percentage,
          status: getTradeAttr(trade, 'status'),
          country: symbolData.countryName,
          sector: symbolData.sectorName,
          symbolData: symbolData
        });
      });
      
      // Mostrar si las cards aparecerán
      console.log('🎯 VISIBILIDAD DE CARDS:', {
        companyCard: companyDiv.show ? '✅ SE MUESTRA' : '❌ NO SE MUESTRA',
        geoCard: geoDiv.show ? '✅ SE MUESTRA' : '❌ NO SE MUESTRA', 
        sectorCard: sectorDiv.show ? '✅ SE MUESTRA' : '❌ NO SE MUESTRA'
      });
      
    } else {
      console.log('⚠️ NO HAY trades filtrados - Métricas de diversificación no disponibles');
    }
  }, [filteredTrades, filteredOpenTrades, companyDiv, geoDiv, sectorDiv, displayStats, loading, error]);

  if (loading) {
    return (
      <StatsContainer>
        <StatsTitle>
          <BarChart3 size={32} />
          Resumen General
        </StatsTitle>
        <EmptyState>
          <EmptyIcon>⏳</EmptyIcon>
          <EmptyTitle>Cargando estadísticas...</EmptyTitle>
          <EmptyText>Por favor espera</EmptyText>
        </EmptyState>
      </StatsContainer>
    );
  }

  if (error) {
    return (
      <StatsContainer>
        <StatsTitle>
          <BarChart3 size={32} />
          Resumen General
        </StatsTitle>
        <EmptyState>
          <EmptyIcon>❌</EmptyIcon>
          <EmptyTitle>Error al cargar estadísticas</EmptyTitle>
          <EmptyText>{error}</EmptyText>
        </EmptyState>
      </StatsContainer>
    );
  }

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <StatsContainer>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <StatsHeader>
          <StatsTitle>
            <BarChart3 size={32} />
            Resumen General
          </StatsTitle>

          <TimeframeContainer>
            {TIMEFRAME_OPTIONS.map((option) => (
              <TimeframePill
                key={option.id}
                $active={selectedTimeframe === option.id}
                onClick={() => setSelectedTimeframe(option.id)}
                title={option.title}
                type="button"
              >
                {option.id === '12m' ? (
                  <TimeframeLabel>
                    <span className="full-text">{option.label}</span>
                    <span className="short-text">{option.shortLabel}</span>
                  </TimeframeLabel>
                ) : (
                  option.label
                )}
              </TimeframePill>
            ))}
          </TimeframeContainer>
        </StatsHeader>
      </motion.div>

      {filteredTrades.length > 0 ? (
        <motion.div
          key={selectedTimeframe}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <StatsGrid>
            <StatCard variants={cardVariants}>
              <StatIcon color={colors.primary}>
                <CheckSquare />
              </StatIcon>
              <StatContent>
                <StatValue>{displayStats.totalTrades}</StatValue>
                <StatLabel>Total Trades Realizados</StatLabel>
              </StatContent>
            </StatCard>

            <StatCard variants={cardVariants}>
              <StatIcon color={colors.status.warning}>
                <Clock />
              </StatIcon>
              <StatContent>
                <StatValue>{displayStats.openTrades}</StatValue>
                <StatLabel>Trades Activos</StatLabel>
              </StatContent>
            </StatCard>

            <StatCard variants={cardVariants}>
              <StatIcon color={colors.trading.profit}>
                <CheckCircle />
              </StatIcon>
              <StatContent>
                <StatValue>{displayStats.winningTrades}</StatValue>
                <StatLabel>Trades Ganadores</StatLabel>
              </StatContent>
            </StatCard>

            <StatCard variants={cardVariants}>
              <StatIcon color={colors.trading.loss}>
                <XCircle />
              </StatIcon>
              <StatContent>
                <StatValue>{displayStats.losingTrades}</StatValue>
                <StatLabel>Trades Perdedores</StatLabel>
              </StatContent>
            </StatCard>

            <StatCard variants={cardVariants}>
              <StatIcon color={displayStats.winRate > 50 ? colors.trading.profit : colors.trading.loss}>
                <Target />
              </StatIcon>
              <StatContent>
                <StatValue $isPositive={displayStats.winRate > 50}>
                  {formatPercentage(displayStats.winRate)}%
                </StatValue>
                <StatLabel>Win Rate</StatLabel>
              </StatContent>
            </StatCard>

            <StatCard variants={cardVariants}>
              <StatIcon color={calculateAverageReturn(displayStats) > 0 ? colors.trading.profit : colors.trading.loss}>
                <Activity />
              </StatIcon>
              <StatContent>
                <StatValue 
                  $isPositive={calculateAverageReturn(displayStats) > 0}
                  $isNegative={calculateAverageReturn(displayStats) < 0}
                >
                  {formatPercentage(calculateAverageReturn(displayStats))}%
                </StatValue>
                <StatLabel>Rendimiento Promedio Por Trade</StatLabel>
              </StatContent>
            </StatCard>

            <StatCard variants={cardVariants}>
              <StatIcon color={colors.trading.profit}>
                <TrendingUp />
              </StatIcon>
              <StatContent>
                <StatValue $isPositive={displayStats.averageWin > 0}>
                  {formatPercentage(displayStats.averageWin)}%
                </StatValue>
                <StatLabel>Promedio Ganancia Ganadores</StatLabel>
              </StatContent>
            </StatCard>

            <StatCard variants={cardVariants}>
              <StatIcon color={colors.trading.loss}>
                <TrendingDown />
              </StatIcon>
              <StatContent>
                <StatValue $isNegative={true}>
                  {formatPercentage(Math.abs(displayStats.averageLoss))}%
                </StatValue>
                <StatLabel>Promedio Pérdida Perdedores</StatLabel>
              </StatContent>
            </StatCard>



            {/* MÉTRICAS DE DIVERSIFICACIÓN */}
            
            {/* Diversificación por Empresa */}
            {companyDiv.show && (
              <StatCard variants={cardVariants}>
                <StatIcon color={companyDiv.isCorrect ? colors.trading.profit : colors.status.warning}>
                  <Building2 />
                </StatIcon>
                <StatContent>
                  <StatValue $isPositive={companyDiv.isCorrect} $isWarning={!companyDiv.isCorrect}>
                    {companyDiv.isCorrect ? 'Correcto' : 'Incorrecto'}
                  </StatValue>
                  <StatLabel>Diversificación por Empresa</StatLabel>
                </StatContent>
              </StatCard>
            )}

            {/* Diversificación Geográfica */}
            {geoDiv.show && (
              <StatCard variants={cardVariants}>
                <StatIcon color={geoDiv.isCorrect ? colors.trading.profit : colors.status.warning}>
                  <Globe />
                </StatIcon>
                <StatContent>
                  <StatValue $isPositive={geoDiv.isCorrect} $isWarning={!geoDiv.isCorrect}>
                    {geoDiv.isCorrect ? 'Correcto' : 'Incorrecto'}
                  </StatValue>
                  <StatLabel>Diversificación Geográfica</StatLabel>
                </StatContent>
              </StatCard>
            )}

            {/* Diversificación por Sector */}
            {sectorDiv.show && (
              <StatCard variants={cardVariants}>
                <StatIcon color={sectorDiv.isCorrect ? colors.trading.profit : colors.status.warning}>
                  <Layers />
                </StatIcon>
                <StatContent>
                  <StatValue $isPositive={sectorDiv.isCorrect} $isWarning={!sectorDiv.isCorrect}>
                    {sectorDiv.isCorrect ? 'Correcto' : 'Incorrecto'}
                  </StatValue>
                  <StatLabel>Diversificación por Sector</StatLabel>
                </StatContent>
              </StatCard>
            )}
          </StatsGrid>
        </motion.div>
      ) : (
        <EmptyState>
          <EmptyIcon>📊</EmptyIcon>
          <EmptyTitle>
            Sin datos en esta temporalidad
          </EmptyTitle>
          <EmptyText>
            {selectedTimeframe === 'all'
              ? 'Agrega nuevos trades para ver las estadísticas'
              : `No hay operaciones registradas para ${TIMEFRAME_OPTIONS.find(o => o.id === selectedTimeframe)?.label.toLowerCase() || 'este período'}.`}
          </EmptyText>
        </EmptyState>
      )}
    </StatsContainer>
  );
};

export default TradeStats;