// components/Trades/ActivePositions.js - Componente para posiciones activas
import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, Hand, Target, Building2, ArrowUpCircle, ArrowDownCircle, Edit2, Briefcase, FolderOpen, RefreshCw, Activity } from 'lucide-react';
import CloseTradeModal from './CloseTradeModal';
import EditTradeModal from './EditTradeModal';
import { useRealTimePrices } from '../../hooks/useRealTimePrices';
import companyLogoService from '../../services/companyLogoService';
import priceService from '../../services/priceService';
import { getStrategyDisplayName } from './TradeForm';
import { colors, componentColors, getTradingColor, withOpacity } from '../../styles/colors';

const PositionsContainer = styled.div`
  background: #1e293b;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const PositionsHeader = styled.div`
  padding: 2rem;
  padding-bottom: 0;
`;

const PositionsTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 600;
  font-family: 'Unbounded', sans-serif;
  color: white;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PositionsSubtitle = styled.p`
  font-size: 1rem;
  font-family: 'Unbounded', sans-serif;
  margin: 0 0 1.5rem 0;
  color: #94a3b8;
`;

const PositionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
`;

const PositionCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    border-color: ${colors.primary};
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 0.05);
  }
`;

const PositionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const CompanyLogo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: transparent;
  padding: 4px;
  flex-shrink: 0;
`;

const LogoImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const LogoFallback = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  background: #f1f5f9;
  border-radius: 8px;
`;

const SymbolName = styled.div`
  font-size: 1.4rem;
  font-weight: 700;
  font-family: 'Unbounded', sans-serif;
  color: white;
  text-align: center;
  flex: 1;
`;

const TradeTypeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TradeType = styled.div`
  background: ${props => props.type === 'buy' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)'};
  color: ${props => props.type === 'buy' ? '#4ade80' : '#f87171'};
  border: 1px solid ${props => props.type === 'buy' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(248, 113, 113, 0.2)'};
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'Unbounded', sans-serif;
  display: flex;
  align-items: center;
  gap: 0.3rem;
`;

const CloseButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const CloseButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: 'Unbounded', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &.danger {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.2);
    
    &:hover {
      background: rgba(239, 68, 68, 0.2);
    }
  }

  &.secondary {
    background: rgba(255, 255, 255, 0.05);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
`;

const PositionDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const DetailLabel = styled.span`
  font-size: 0.8rem;
  color: #94a3b8;
  font-family: 'Unbounded', sans-serif;
  font-weight: 500;
`;

const DetailValue = styled.span`
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Unbounded', sans-serif;
  color: white;
`;

const PositionFooter = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PortfolioPercentage = styled.div`
  font-size: 0.9rem;
  color: #94a3b8;
  font-family: 'Unbounded', sans-serif;
`;

const DaysOpen = styled.div`
  font-size: 0.9rem;
  color: #94a3b8;
  font-family: 'Unbounded', sans-serif;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #94a3b8;
  font-family: 'Unbounded', sans-serif;
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
`;

const EmptyText = styled.p`
  font-size: 1rem;
  margin: 0;
`;

const PriceUpdateHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.8rem;
  color: #94a3b8;
  font-family: 'Unbounded', sans-serif;
`;

const RefreshButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  font-family: 'Unbounded', sans-serif;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CurrentPrice = styled.div`
  font-weight: 600;
  color: white;
`;

const UnrealizedPnL = styled.div`
  font-weight: 700;
  color: ${props => {
    if (props.$pnl > 0) return '#4ade80';
    if (props.$pnl < 0) return '#f87171';
    return '#94a3b8';
  }};
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const PnLIcon = styled.span`
  font-size: 0.8rem;
`;

const RecommendationContainer = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  border: 2px solid ${props => props.$borderColor};
  background: ${props => props.$bgColor};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const RecommendationText = styled.span`
  font-family: 'Unbounded', sans-serif;
  font-weight: 600;
  font-size: 0.9rem;
  color: ${props => props.$color};
`;

const RecommendationLabel = styled.div`
  font-family: 'Unbounded', sans-serif;
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
`;

// Animación del spinner
const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const EmaBadgeWrapper = styled.div`
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  background: ${props => {
    if (props.$loading) return 'rgba(255,255,255,0.04)';
    if (props.$value === null) return 'rgba(255,255,255,0.04)';
    return props.$value >= 0
      ? 'rgba(74, 222, 128, 0.08)'
      : 'rgba(248, 113, 113, 0.08)';
  }};
  border: 1px solid ${props => {
    if (props.$loading) return 'rgba(255,255,255,0.1)';
    if (props.$value === null) return 'rgba(255,255,255,0.1)';
    return props.$value >= 0
      ? 'rgba(74, 222, 128, 0.25)'
      : 'rgba(248, 113, 113, 0.25)';
  }};
`;

const EmaSpinner = styled.div`
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.15);
  border-top-color: #94a3b8;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
  flex-shrink: 0;
`;

const EmaLabel = styled.span`
  font-family: 'Unbounded', sans-serif;
  font-size: 0.72rem;
  color: #94a3b8;
  font-weight: 500;
  white-space: nowrap;
`;

const EmaValue = styled.span`
  font-family: 'Unbounded', sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  margin-left: auto;
  color: ${props => {
    if (props.$value === null) return '#64748b';
    if (Math.abs(props.$value) < 1) return '#fbbf24'; // muy cerca → amarillo
    return props.$value >= 0 ? '#4ade80' : '#f87171';
  }};
`;

const ActivePositions = ({ openTrades, loading, error, onCloseTrade, onUpdateTrade }) => {
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [companyLogos, setCompanyLogos] = useState(new Map());
  // EMA 21: { [symbol]: { value: number|null, loading: boolean } }
  const [ema21Map, setEma21Map] = useState({});
  const ema21Fetched = useRef(new Set()); // evita re-fetch duplicado
  
  // Hook para precios en tiempo real
  const { 
    prices, 
    loading: pricesLoading, 
    error: pricesError, 
    lastUpdate, 
    getPrice, 
    getUnrealizedPnL, 
    refreshPrices 
  } = useRealTimePrices(openTrades || []);

  // Cargar logos de empresas
  useEffect(() => {
    const loadLogos = async () => {
      if (!openTrades || openTrades.length === 0) return;

      const newLogos = new Map();
      
      for (const trade of openTrades) {
        const symbol = getTradeAttr(trade, 'symbol');
        if (symbol && !companyLogos.has(symbol)) {
          try {
            const logoUrl = await companyLogoService.getCompanyLogo(symbol);
            newLogos.set(symbol, logoUrl);
          } catch (error) {
            console.warn(`Error cargando logo para ${symbol}:`, error);
            newLogos.set(symbol, null);
          }
        }
      }

      if (newLogos.size > 0) {
        setCompanyLogos(prev => new Map([...prev, ...newLogos]));
      }
    };

    loadLogos();
  }, [openTrades]);

  // Calcular EMA 21 para cada posición activa
  // Se ejecuta cuando cambian los precios (necesitamos currentPrice para el cálculo)
  useEffect(() => {
    if (!openTrades || openTrades.length === 0) return;

    const fetchEma = async (trade) => {
      const symbol = getTradeAttr(trade, 'symbol');
      if (!symbol) return;

      const currentPrice = getPrice(symbol);
      // Wait until we have a valid price before attempting to calculate EMA distance
      if (!currentPrice || currentPrice <= 0) return;

      // Evitar refetch si ya está en progreso o calculado en esta sesión
      if (ema21Fetched.current.has(symbol)) return;
      ema21Fetched.current.add(symbol);

      // Intentar leer desde localStorage primero (sincrónico, rápido)
      const cached = priceService.getCachedEma21Distance(symbol, currentPrice);
      if (cached !== null) {
        setEma21Map(prev => ({ ...prev, [symbol]: { value: cached, loading: false } }));
        return;
      }

      // Marcar como cargando solo si no había cache
      setEma21Map(prev => ({ ...prev, [symbol]: { value: null, loading: true } }));

      try {
        const distance = await priceService.getEma21Distance(symbol, currentPrice);
        setEma21Map(prev => ({ ...prev, [symbol]: { value: distance, loading: false } }));
      } catch (err) {
        setEma21Map(prev => ({ ...prev, [symbol]: { value: null, loading: false } }));
      }
    };

    openTrades.forEach(trade => fetchEma(trade));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openTrades, prices]); // re-evaluar cuando lleguen los precios reales

  // Función para adaptar estructura de Strapi
  const getTradeAttr = (trade, attr) => {
    if (!trade) return null;
    return trade.attributes ? trade.attributes[attr] : trade[attr];
  };

  // Función para generar recomendación basada en precios
  const getRecommendation = (trade) => {
    const currentPrice = getPrice(getTradeAttr(trade, 'symbol'));
    const stopLoss = parseFloat(getTradeAttr(trade, 'stop_loss'));
    const takeProfit = parseFloat(getTradeAttr(trade, 'take_profit'));
    
    // Si no hay precio actual o niveles, no mostrar recomendación
    if (!currentPrice) {
      return null;
    }

    // Si no hay stop loss ni take profit configurados
    if (!stopLoss && !takeProfit) {
      return null;
    }

    // Lógica de recomendaciones
    if (stopLoss && currentPrice < stopLoss) {
      return {
        text: 'Efectuar Stop Loss',
        icon: <AlertTriangle size={16} />,
        color: '#f87171',
        bgColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.2)'
      };
    }
    
    if (takeProfit && currentPrice >= takeProfit) {
      return {
        text: 'Tomar Ganancias',
        icon: <TrendingUp size={16} />,
        color: '#4ade80',
        bgColor: 'rgba(34, 197, 94, 0.1)',
        borderColor: 'rgba(34, 197, 94, 0.2)'
      };
    }
    
    // Si está entre stop loss y take profit (o solo hay uno configurado)
    if ((stopLoss && takeProfit && currentPrice >= stopLoss && currentPrice < takeProfit) ||
        (stopLoss && !takeProfit && currentPrice >= stopLoss) ||
        (!stopLoss && takeProfit && currentPrice < takeProfit)) {
      return {
        text: 'Holdear',
        icon: <Hand size={16} />,
        color: '#fbbf24',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        borderColor: 'rgba(245, 158, 11, 0.2)'
      };
    }

    return null;
  };

  const handleCloseTrade = (trade) => {
    setSelectedTrade(trade);
    setShowCloseModal(true);
  };

  const handleEditTrade = (trade) => {
    setSelectedTrade(trade);
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowCloseModal(false);
    setSelectedTrade(null);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedTrade(null);
  };

  const handleTradeClosed = async (tradeId, exitPrice, result, notes) => {
    try {
      await onCloseTrade(tradeId, exitPrice, result, notes);
      handleCloseModal();
    } catch (err) {
      console.error('Error closing trade:', err);
      // Propagar el error para que el modal lo pueda mostrar
      throw err;
    }
  };

  const handleTradeUpdated = async (tradeId, updateData) => {
    try {
      await onUpdateTrade(tradeId, updateData);
      handleCloseEditModal();
    } catch (err) {
      console.error('Error updating trade:', err);
      throw err;
    }
  };

  const calculateDaysOpen = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <PositionsContainer>
        <PositionsHeader>
          <PositionsTitle>
            <Briefcase size={24} />
            Posiciones Activas
          </PositionsTitle>
          <PositionsSubtitle>Cargando posiciones...</PositionsSubtitle>
        </PositionsHeader>
        <EmptyState>
          <EmptyIcon>
            <FolderOpen size={64} strokeWidth={1} />
          </EmptyIcon>
          <EmptyTitle>Cargando...</EmptyTitle>
          <EmptyText>Por favor espera mientras cargamos tus posiciones</EmptyText>
        </EmptyState>
      </PositionsContainer>
    );
  }

  if (error) {
    return (
      <PositionsContainer>
        <PositionsHeader>
          <PositionsTitle>
            <Briefcase size={24} />
            Posiciones Activas
          </PositionsTitle>
          <PositionsSubtitle>Error al cargar</PositionsSubtitle>
        </PositionsHeader>
        <EmptyState>
          <EmptyIcon>
            <AlertTriangle size={64} strokeWidth={1} />
          </EmptyIcon>
          <EmptyTitle>Error</EmptyTitle>
          <EmptyText>{error}</EmptyText>
        </EmptyState>
      </PositionsContainer>
    );
  }

  if (openTrades.length === 0) {
    return (
      <PositionsContainer>
        <PositionsHeader>
          <PositionsTitle>
            <Briefcase size={24} />
            Posiciones Activas
          </PositionsTitle>
          <PositionsSubtitle>No hay posiciones abiertas</PositionsSubtitle>
        </PositionsHeader>
        <EmptyState>
          <EmptyIcon>
            <FolderOpen size={64} strokeWidth={1} />
          </EmptyIcon>
          <EmptyTitle>Sin posiciones activas</EmptyTitle>
          <EmptyText>Registra un nuevo trade para verlo aquí</EmptyText>
        </EmptyState>
      </PositionsContainer>
    );
  }

  return (
    <>
      <PositionsContainer>
        <PositionsHeader>
          <PositionsTitle>
            <Briefcase size={24} />
            Posiciones Activas
          </PositionsTitle>
          <PositionsSubtitle>{openTrades.length} posición(es) abierta(s)</PositionsSubtitle>
        </PositionsHeader>

        <PriceUpdateHeader>
          <div>
            {lastUpdate ? (
              <>
                📅 Última actualización: {lastUpdate.toLocaleDateString()} {lastUpdate.toLocaleTimeString()} 
                <span style={{color: '#64748b', fontSize: '0.75rem', marginLeft: '0.5rem'}}>
                  (Actualización automática)
                </span>
              </>
            ) : (
              <>Obteniendo precios...</>
            )}
            {pricesError && (
              <span style={{color: colors.status.error, marginLeft: '0.5rem'}}>
                ⚠️ Error: {pricesError}
              </span>
            )}
          </div>
          <RefreshButton 
            onClick={refreshPrices} 
            disabled={pricesLoading}
          >
            {pricesLoading ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <RefreshCw size={14} />
                Actualizar Manual
              </>
            )}
          </RefreshButton>
        </PriceUpdateHeader>
        
        <PositionsGrid>
          {[...openTrades].sort((a, b) => {
            const pnlA = getUnrealizedPnL(a);
            const pnlB = getUnrealizedPnL(b);
            if (pnlA === null && pnlB === null) return 0;
            if (pnlA === null) return 1;
            if (pnlB === null) return -1;
            return pnlB - pnlA;
          }).map((trade, index) => (
            <PositionCard
              key={trade.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <PositionHeader>
                {/* Logo de la empresa */}
                <CompanyLogo>
                  {companyLogos.get(getTradeAttr(trade, 'symbol')) ? (
                    <LogoImage 
                      src={companyLogos.get(getTradeAttr(trade, 'symbol'))} 
                      alt={`${getTradeAttr(trade, 'symbol')} logo`}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <LogoFallback style={{ display: companyLogos.get(getTradeAttr(trade, 'symbol')) ? 'none' : 'flex' }}>
                    <Building2 size={20} />
                  </LogoFallback>
                </CompanyLogo>

                {/* Nombre del símbolo */}
                <SymbolName>{getTradeAttr(trade, 'symbol')}</SymbolName>

                {/* Tipo de trade con icono */}
                <TradeTypeContainer>
                  <TradeType type={getTradeAttr(trade, 'type')}>
                    {getTradeAttr(trade, 'type') === 'buy' ? (
                      <>
                        <ArrowUpCircle size={16} />
                        LONG
                      </>
                    ) : (
                      <>
                        <ArrowDownCircle size={16} />
                        SHORT
                      </>
                    )}
                  </TradeType>
                </TradeTypeContainer>
              </PositionHeader>

              <PositionDetails>
                <DetailItem>
                  <DetailLabel>Precio Entrada</DetailLabel>
                  <DetailValue>{formatCurrency(getTradeAttr(trade, 'entry_price'))}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Precio Actual</DetailLabel>
                  <CurrentPrice>
                    {(() => {
                      const currentPrice = getPrice(getTradeAttr(trade, 'symbol'));
                      if (currentPrice === null) return <span style={{ color: '#95a5a6', fontSize: '0.9rem' }}>No disponible</span>;
                      return currentPrice ? formatCurrency(currentPrice) : 'Cargando...';
                    })()}
                  </CurrentPrice>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>PnL No Realizado</DetailLabel>
                  {(() => {
                    const pnl = getUnrealizedPnL(trade);
                    return (
                      <UnrealizedPnL $pnl={pnl}>
                        <PnLIcon>
                          {pnl > 0 ? <TrendingUp size={14} /> : pnl < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                        </PnLIcon>
                        {pnl !== null && pnl !== 0 ? `${pnl > 0 ? '+' : ''}${pnl.toFixed(2)}%` : <span style={{ color: '#64748b', fontSize: '0.9rem' }}>No disponible</span>}
                      </UnrealizedPnL>
                    );
                  })()}
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Stop Loss</DetailLabel>
                  <DetailValue>
                    {getTradeAttr(trade, 'stop_loss') ? formatCurrency(getTradeAttr(trade, 'stop_loss')) : 'N/A'}
                  </DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Take Profit</DetailLabel>
                  <DetailValue>
                    {getTradeAttr(trade, 'take_profit') ? formatCurrency(getTradeAttr(trade, 'take_profit')) : 'N/A'}
                  </DetailValue>
                </DetailItem>

                {/* Distancia a EMA 21 */}
                {(() => {
                  const symbol = getTradeAttr(trade, 'symbol');
                  const emaState = ema21Map[symbol];
                  const isLoading = emaState?.loading ?? true;
                  const emaValue = emaState?.value ?? null;

                  return (
                    <EmaBadgeWrapper $value={emaValue} $loading={isLoading}>
                      {isLoading
                        ? <EmaSpinner />
                        : <Activity size={14} color={emaValue === null ? '#64748b' : emaValue >= 0 ? '#4ade80' : '#f87171'} />
                      }
                      <EmaLabel>Dist. EMA 21</EmaLabel>
                      <EmaValue $value={emaValue}>
                        {isLoading
                          ? 'Calculando…'
                          : emaValue !== null
                            ? `${emaValue >= 0 ? '+' : ''}${emaValue.toFixed(2)}%`
                            : '—'
                        }
                      </EmaValue>
                    </EmaBadgeWrapper>
                  );
                })()}

              </PositionDetails>

              {/* Recomendación inteligente */}
              {(() => {
                const recommendation = getRecommendation(trade);
                return recommendation ? (
                  <>
                    <RecommendationLabel>
                      <Target size={14} style={{marginRight: '0.25rem'}} />
                      Recomendación
                    </RecommendationLabel>
                    <RecommendationContainer
                      $bgColor={recommendation.bgColor}
                      $borderColor={recommendation.borderColor}
                    >
                      {recommendation.icon}
                      <RecommendationText $color={recommendation.color}>
                        {recommendation.text}
                      </RecommendationText>
                    </RecommendationContainer>
                  </>
                ) : null;
              })()}

              <PositionFooter>
                <PortfolioPercentage>
                  {getTradeAttr(trade, 'portfolio_percentage') ? `${getTradeAttr(trade, 'portfolio_percentage')}% cartera` : 'Sin % cartera'}
                </PortfolioPercentage>
                <DaysOpen>
                  {calculateDaysOpen(getTradeAttr(trade, 'createdAt'))} días
                </DaysOpen>
              </PositionFooter>

              {/* Botones de acción */}
              <CloseButtonContainer>
                <CloseButton 
                  className="secondary"
                  onClick={() => handleEditTrade(trade)}
                >
                  <Edit2 size={16} />
                  Editar
                </CloseButton>
                <CloseButton 
                  className="danger"
                  onClick={() => handleCloseTrade(trade)}
                >
                  Cerrar Posición
                </CloseButton>
              </CloseButtonContainer>
            </PositionCard>
          ))}
        </PositionsGrid>
      </PositionsContainer>

      {/* Modal para cerrar trade */}
      {showCloseModal && (
        <CloseTradeModal
          isOpen={showCloseModal}
          onClose={handleCloseModal}
          trade={selectedTrade}
          onTradeClosed={handleTradeClosed}
        />
      )}

      {/* Modal para editar trade */}
      {showEditModal && (
        <EditTradeModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          trade={selectedTrade}
          onTradeUpdated={handleTradeUpdated}
        />
      )}
    </>
  );
};

export default ActivePositions;
