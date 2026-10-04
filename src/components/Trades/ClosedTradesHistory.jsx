// components/Trades/ClosedTradesHistory.js - Historial de trades cerrados
import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, 
  AlertTriangle, 
  X, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield, 
  Clock,
  BarChart3,
  Eye,
  Edit2,
  ClipboardList,
  FolderOpen
} from 'lucide-react';
import { getStrategyDisplayName } from './TradeForm';
import EditTradeModal from './EditTradeModal';
import { colors, componentColors, getTradingColor, withOpacity } from '../../styles/colors';

const HistoryContainer = styled.div`
  background: #1e293b;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const HistoryHeader = styled.div`
  padding: 2rem;
  padding-bottom: 0;
`;

const HistoryTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 600;
  font-family: 'Unbounded', sans-serif;
  color: white;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const HistorySubtitle = styled.p`
  font-size: 1rem;
  font-family: 'Unbounded', sans-serif;
  margin: 0 0 1.5rem 0;
  color: #94a3b8;
`;

const FiltersContainer = styled.div`
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const FilterInput = styled.input`
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: 'Unbounded', sans-serif;
  min-width: 150px;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const FilterSelect = styled.select`
  padding: 0.5rem;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: 'Unbounded', sans-serif;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const TradesList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const TradeItem = styled(motion.div)`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  &:last-child {
    border-bottom: none;
  }
`;

const TradeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const TradeSymbol = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  font-family: 'Unbounded', sans-serif;
  color: white;
`;

const TradeResult = styled.div`
  font-size: 1rem;
  font-weight: 700;
  font-family: 'Unbounded', sans-serif;
  color: ${props => props.$positive ? '#4ade80' : '#f87171'};
`;

const TradeDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #94a3b8;
  font-family: 'Unbounded', sans-serif;
`;

const TradeDetail = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const DetailLabel = styled.span`
  font-size: 0.8rem;
  font-weight: 500;
`;

const DetailValue = styled.span`
  font-weight: 600;
  color: white;
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
  color: #94a3b8;
`;

const TradeHeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: ${colors.status.error};
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${withOpacity(colors.status.error, 0.1)};
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;

// Modal de confirmación
const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled(motion.div)`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  min-width: 300px;
  max-width: 500px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
`;

// Modal de detalles del trade
const TradeDetailModal = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
`;

const TradeDetailContent = styled(motion.div)`
  background: ${colors.white};
  border-radius: 16px;
  padding: 0;
  min-width: 500px;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: ${colors.shadows.xl};
  border: 1px solid ${colors.gray[200]};
`;

const DetailHeader = styled.div`
  background: ${colors.gradients.primary};
  color: ${colors.white};
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DetailTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  font-family: 'Unbounded', sans-serif;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${colors.white};
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }
`;

const DetailBody = styled.div`
  padding: 2rem;
`;

const DetailSection = styled.div`
  margin-bottom: 2rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  font-family: 'Unbounded', sans-serif;
  color: ${colors.black};
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid ${colors.gray[100]};
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ModalDetailLabel = styled.span`
  font-size: 0.85rem;
  color: ${colors.gray[600]};
  font-family: 'Unbounded', sans-serif;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ModalDetailValue = styled.span`
  font-size: 1.1rem;
  font-weight: 600;
  font-family: 'Unbounded', sans-serif;
  color: ${colors.black};
  
  ${props => props.$positive && `color: ${colors.trading.profit};`}
  ${props => props.$negative && `color: ${colors.trading.loss};`}
  ${props => props.$highlight && `
    background: ${colors.gray[50]};
    padding: 0.5rem;
    border-radius: 8px;
    border-left: 4px solid ${colors.primary};
  `}
`;

const TradeTypeChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  font-family: 'Unbounded', sans-serif;
  background: ${props => props.type === 'buy' ? colors.trading.long : colors.trading.short};
  color: ${colors.white};
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const ModalTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  font-family: 'Unbounded', sans-serif;
  color: ${colors.status.error};
  margin: 0;
`;

const ModalText = styled.p`
  font-size: 1rem;
  color: ${colors.gray[600]};
  margin-bottom: 1.5rem;
  line-height: 1.5;
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
`;

const ModalButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: 'Unbounded', sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  ${props => props.$variant === 'danger' ? `
    background-color: ${colors.status.error};
    color: ${colors.white};
    &:hover { background-color: ${colors.primaryDark}; }
  ` : `
    background-color: ${colors.gray[100]};
    color: ${colors.black};
    &:hover { background-color: ${colors.gray[200]}; }
  `}
`;

const ClosedTradesHistory = ({ closedTrades, loading, error, onDeleteTrade, onUpdateTrade }) => {
  const [filters, setFilters] = useState({
    symbol: '',
    type: '',
    dateFrom: '',
    dateTo: ''
  });

  const [filteredTrades, setFilteredTrades] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, trade: null });
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [showTradeDetail, setShowTradeDetail] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Función para adaptar estructura de Strapi
  const getTradeAttr = (trade, attr) => {
    if (!trade) return null;
    return trade.attributes ? trade.attributes[attr] : trade[attr];
  };

  // Calcular resultado en porcentaje para cada trade
  const calculateTradeResult = (trade) => {
    const entryPrice = parseFloat(getTradeAttr(trade, 'entry_price'));
    const exitPrice = parseFloat(getTradeAttr(trade, 'exit_price'));
    const type = getTradeAttr(trade, 'type');
    
    if (!entryPrice || !exitPrice) return 0;

    let resultPercent = 0;
    if (type === 'buy') {
      resultPercent = ((exitPrice - entryPrice) / entryPrice) * 100;
    } else { // sell (short)
      resultPercent = ((entryPrice - exitPrice) / entryPrice) * 100;
    }
    
    return resultPercent;
  };

  // Función de formateo mejorada
  const formatCurrency = (amount) => {
    if (amount == null || isNaN(amount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (num) => {
    if (num == null || isNaN(num)) return '0.00';
    return Number(num).toFixed(2);
  };

  React.useEffect(() => {
    if (closedTrades) {
      applyFilters();
    }
  }, [closedTrades, filters]);

  const applyFilters = () => {
    if (!closedTrades) return;

    let filtered = [...closedTrades];

    if (filters.symbol) {
      filtered = filtered.filter(trade => {
        const symbol = getTradeAttr(trade, 'symbol');
        return symbol && symbol.toLowerCase().includes(filters.symbol.toLowerCase());
      });
    }

    if (filters.type) {
      filtered = filtered.filter(trade => getTradeAttr(trade, 'type') === filters.type);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(trade => {
        const closedAt = getTradeAttr(trade, 'closed_at');
        return closedAt && new Date(closedAt) >= new Date(filters.dateFrom);
      });
    }

    if (filters.dateTo) {
      filtered = filtered.filter(trade => {
        const closedAt = getTradeAttr(trade, 'closed_at');
        return closedAt && new Date(closedAt) <= new Date(filters.dateTo);
      });
    }

    setFilteredTrades(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleDeleteClick = (trade) => {
    setDeleteConfirm({ show: true, trade });
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.trade && onDeleteTrade) {
      try {
        await onDeleteTrade(deleteConfirm.trade.id);
        setDeleteConfirm({ show: false, trade: null });
      } catch (error) {
        console.error('Error eliminando trade:', error);
        // Podrías agregar una notificación de error aquí
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, trade: null });
  };

  // Funciones para el modal de detalles
  const handleTradeClick = (trade) => {
    setSelectedTrade(trade);
    setShowTradeDetail(true);
  };

  const handleCloseDetail = () => {
    setShowTradeDetail(false);
    setSelectedTrade(null);
  };

  // Funciones para edición
  const handleEditClick = (trade, e) => {
    e.stopPropagation(); // Evitar que se abra el modal de detalles
    setSelectedTrade(trade);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedTrade(null);
  };

  const handleTradeUpdated = async (tradeId, updateData) => {
    try {
      if (onUpdateTrade) {
        await onUpdateTrade(tradeId, updateData);
      }
      handleCloseEditModal();
    } catch (err) {
      console.error('Error updating trade:', err);
      throw err;
    }
  };

  // Función para calcular días que estuvo abierto el trade
  const calculateTradeDuration = (trade) => {
    const entryDate = new Date(getTradeAttr(trade, 'createdAt'));
    const exitDate = new Date(getTradeAttr(trade, 'closed_at'));
    const diffTime = Math.abs(exitDate - entryDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Función para formatear fechas
  const formatTradeDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <HistoryContainer>
        <HistoryHeader>
          <HistoryTitle>
            <ClipboardList size={24} />
            Historial Cerrado
          </HistoryTitle>
          <HistorySubtitle>Cargando historial...</HistorySubtitle>
        </HistoryHeader>
        <EmptyState>
          <EmptyIcon>
            <FolderOpen size={64} strokeWidth={1} />
          </EmptyIcon>
          <EmptyTitle>Cargando...</EmptyTitle>
          <EmptyText>Por favor espera mientras cargamos tu historial</EmptyText>
        </EmptyState>
      </HistoryContainer>
    );
  }

  if (error) {
    return (
      <HistoryContainer>
        <HistoryHeader>
          <HistoryTitle>
            <ClipboardList size={24} />
            Historial Cerrado
          </HistoryTitle>
          <HistorySubtitle>Error al cargar</HistorySubtitle>
        </HistoryHeader>
        <EmptyState>
          <EmptyIcon>
            <AlertTriangle size={64} strokeWidth={1} />
          </EmptyIcon>
          <EmptyTitle>Error</EmptyTitle>
          <EmptyText>{error}</EmptyText>
        </EmptyState>
      </HistoryContainer>
    );
  }

  if (closedTrades.length === 0) {
    return (
      <HistoryContainer>
        <HistoryHeader>
          <HistoryTitle>
            <ClipboardList size={24} />
            Historial Cerrado
          </HistoryTitle>
          <HistorySubtitle>No hay trades cerrados</HistorySubtitle>
        </HistoryHeader>
        <EmptyState>
          <EmptyIcon>
            <FolderOpen size={64} strokeWidth={1} />
          </EmptyIcon>
          <EmptyTitle>Sin historial</EmptyTitle>
          <EmptyText>Cierra tu primera posición para ver el historial aquí</EmptyText>
        </EmptyState>
      </HistoryContainer>
    );
  }

  return (
    <HistoryContainer>
      <HistoryHeader>
        <HistoryTitle>
          <ClipboardList size={24} />
          Historial Cerrado
        </HistoryTitle>
        <HistorySubtitle>{filteredTrades.length} trade(s) cerrado(s)</HistorySubtitle>
      </HistoryHeader>

      <FiltersContainer>
        <FilterInput
          type="text"
          placeholder="Buscar por símbolo..."
          name="symbol"
          value={filters.symbol}
          onChange={handleFilterChange}
        />
        <FilterSelect
          name="type"
          value={filters.type}
          onChange={handleFilterChange}
        >
          <option value="">Todos los tipos</option>
          <option value="buy">Compra</option>
          <option value="sell">Venta</option>
        </FilterSelect>
        <FilterInput
          type="date"
          placeholder="Fecha desde..."
          name="dateFrom"
          value={filters.dateFrom}
          onChange={handleFilterChange}
        />
        <FilterInput
          type="date"
          placeholder="Fecha hasta..."
          name="dateTo"
          value={filters.dateTo}
          onChange={handleFilterChange}
        />
      </FiltersContainer>

      <TradesList>
        {filteredTrades.length === 0 ? (
          <EmptyState>
            <EmptyIcon>
              <FolderOpen size={64} strokeWidth={1} />
            </EmptyIcon>
            <EmptyTitle>Sin resultados</EmptyTitle>
            <EmptyText>No se encontraron trades con los filtros aplicados</EmptyText>
          </EmptyState>
        ) : (
          filteredTrades.map((trade, index) => (
            <TradeItem
              key={trade.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => handleTradeClick(trade)}
              style={{ cursor: 'pointer' }}
            >
              <TradeHeader>
                <TradeSymbol>
                  {getTradeAttr(trade, 'symbol')} - {getTradeAttr(trade, 'type') === 'buy' ? 'Compra' : 'Venta'}
                </TradeSymbol>
                <TradeHeaderRight>
                  <TradeResult $positive={calculateTradeResult(trade) >= 0}>
                    {formatPercentage(calculateTradeResult(trade))}%
                  </TradeResult>
                  <DeleteButton 
                    onClick={(e) => handleEditClick(trade, e)}
                    title="Editar trade"
                    style={{ marginRight: '0.5rem', background: colors.primary }}
                  >
                    <Edit2 size={16} />
                  </DeleteButton>
                  <DeleteButton 
                    onClick={(e) => {
                      e.stopPropagation(); // Evitar que se abra el modal
                      handleDeleteClick(trade);
                    }}
                    title="Eliminar trade del historial"
                  >
                    <Trash2 size={16} />
                  </DeleteButton>
                </TradeHeaderRight>
              </TradeHeader>

              <TradeDetails>
                <TradeDetail>
                  <DetailLabel>Entrada</DetailLabel>
                  <DetailValue>{formatCurrency(getTradeAttr(trade, 'entry_price'))}</DetailValue>
                </TradeDetail>
                <TradeDetail>
                  <DetailLabel>Salida</DetailLabel>
                  <DetailValue>{formatCurrency(getTradeAttr(trade, 'exit_price'))}</DetailValue>
                </TradeDetail>
                <TradeDetail>
                  <DetailLabel>% Cartera</DetailLabel>
                  <DetailValue>
                    {getTradeAttr(trade, 'portfolio_percentage') ? `${getTradeAttr(trade, 'portfolio_percentage')}%` : 'N/A'}
                  </DetailValue>
                </TradeDetail>
                <TradeDetail>
                  <DetailLabel>Estrategia</DetailLabel>
                  <DetailValue>{getStrategyDisplayName(getTradeAttr(trade, 'strategy'))}</DetailValue>
                </TradeDetail>
                <TradeDetail>
                  <DetailLabel>Cerrado</DetailLabel>
                  <DetailValue>{formatTradeDate(getTradeAttr(trade, 'closed_at'))}</DetailValue>
                </TradeDetail>
              </TradeDetails>
            </TradeItem>
          ))
        )}
      </TradesList>

      {/* Modal de confirmación */}
      {deleteConfirm.show && (
        <ModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleDeleteCancel}
        >
          <ModalContent
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader>
              <AlertTriangle size={20} />
              <ModalTitle>Confirmar Eliminación</ModalTitle>
            </ModalHeader>
            <ModalText>
              ¿Estás seguro de que quieres eliminar este trade del historial?<br/>
              <strong>{getTradeAttr(deleteConfirm.trade, 'symbol')}</strong> - {getTradeAttr(deleteConfirm.trade, 'type') === 'buy' ? 'Compra' : 'Venta'}<br/>
              Esta acción no se puede deshacer.
            </ModalText>
            <ModalButtons>
              <ModalButton onClick={handleDeleteCancel}>
                Cancelar
              </ModalButton>
              <ModalButton $variant="danger" onClick={handleDeleteConfirm}>
                Eliminar
              </ModalButton>
            </ModalButtons>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Modal de detalles del trade */}
      <AnimatePresence>
        {showTradeDetail && selectedTrade && (
          <TradeDetailModal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseDetail}
          >
            <TradeDetailContent
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <DetailHeader>
                <DetailTitle>
                  <Eye size={24} />
                  Detalles del Trade
                </DetailTitle>
                <CloseButton onClick={handleCloseDetail}>
                  <X size={20} />
                </CloseButton>
              </DetailHeader>

              <DetailBody>
                {/* Información básica */}
                <DetailSection>
                  <SectionTitle>
                    <BarChart3 size={20} />
                    Información General
                  </SectionTitle>
                  <DetailGrid>
                    <DetailItem>
                      <ModalDetailLabel>Símbolo</ModalDetailLabel>
                      <ModalDetailValue $highlight>
                        {getTradeAttr(selectedTrade, 'symbol')}
                      </ModalDetailValue>
                    </DetailItem>
                    <DetailItem>
                      <ModalDetailLabel>Tipo de Operación</ModalDetailLabel>
                      <TradeTypeChip type={getTradeAttr(selectedTrade, 'type')}>
                        {getTradeAttr(selectedTrade, 'type') === 'buy' ? (
                          <>
                            <TrendingUp size={14} />
                            COMPRA (LONG)
                          </>
                        ) : (
                          <>
                            <TrendingDown size={14} />
                            VENTA (SHORT)
                          </>
                        )}
                      </TradeTypeChip>
                    </DetailItem>
                    <DetailItem>
                      <ModalDetailLabel>Estrategia</ModalDetailLabel>
                      <ModalDetailValue>
                        {getStrategyDisplayName(getTradeAttr(selectedTrade, 'strategy'))}
                      </ModalDetailValue>
                    </DetailItem>
                    <DetailItem>
                      <ModalDetailLabel>% de Cartera</ModalDetailLabel>
                      <ModalDetailValue>
                        {getTradeAttr(selectedTrade, 'portfolio_percentage') || 0}%
                      </ModalDetailValue>
                    </DetailItem>
                  </DetailGrid>
                </DetailSection>

                {/* Precios y rendimiento */}
                <DetailSection>
                  <SectionTitle>
                    <DollarSign size={20} />
                    Precios y Rendimiento
                  </SectionTitle>
                  <DetailGrid>
                    <DetailItem>
                      <ModalDetailLabel>Precio de Entrada</ModalDetailLabel>
                      <ModalDetailValue>
                        ${Number(getTradeAttr(selectedTrade, 'entry_price')).toFixed(2)}
                      </ModalDetailValue>
                    </DetailItem>
                    <DetailItem>
                      <ModalDetailLabel>Precio de Salida</ModalDetailLabel>
                      <ModalDetailValue>
                        ${Number(getTradeAttr(selectedTrade, 'exit_price')).toFixed(2)}
                      </ModalDetailValue>
                    </DetailItem>
                    <DetailItem>
                      <ModalDetailLabel>Resultado</ModalDetailLabel>
                      <ModalDetailValue 
                        $positive={calculateTradeResult(selectedTrade) >= 0}
                        $negative={calculateTradeResult(selectedTrade) < 0}
                        $highlight
                      >
                        {calculateTradeResult(selectedTrade) >= 0 ? '+' : ''}
                        {formatPercentage(calculateTradeResult(selectedTrade))}%
                      </ModalDetailValue>
                    </DetailItem>
                    <DetailItem>
                      <ModalDetailLabel>Diferencia de Precio</ModalDetailLabel>
                      <ModalDetailValue>
                        ${Math.abs(
                          Number(getTradeAttr(selectedTrade, 'exit_price')) - 
                          Number(getTradeAttr(selectedTrade, 'entry_price'))
                        ).toFixed(2)}
                      </ModalDetailValue>
                    </DetailItem>
                  </DetailGrid>
                </DetailSection>

                {/* Stop Loss y Take Profit */}
                {(getTradeAttr(selectedTrade, 'stop_loss') || getTradeAttr(selectedTrade, 'take_profit')) && (
                  <DetailSection>
                    <SectionTitle>
                      <Shield size={20} />
                      Gestión de Riesgo
                    </SectionTitle>
                    <DetailGrid>
                      {getTradeAttr(selectedTrade, 'stop_loss') && (
                        <DetailItem>
                          <ModalDetailLabel>Stop Loss</ModalDetailLabel>
                          <ModalDetailValue>
                            ${Number(getTradeAttr(selectedTrade, 'stop_loss')).toFixed(2)}
                          </ModalDetailValue>
                        </DetailItem>
                      )}
                      {getTradeAttr(selectedTrade, 'take_profit') && (
                        <DetailItem>
                          <ModalDetailLabel>Take Profit</ModalDetailLabel>
                          <ModalDetailValue>
                            ${Number(getTradeAttr(selectedTrade, 'take_profit')).toFixed(2)}
                          </ModalDetailValue>
                        </DetailItem>
                      )}
                    </DetailGrid>
                  </DetailSection>
                )}

                {/* Observaciones - Sección más prominente */}
                {getTradeAttr(selectedTrade, 'notes') && (
                  <DetailSection>
                    <SectionTitle>
                      <Eye size={20} />
                      Observaciones del Trade (Análisis)
                    </SectionTitle>
                    <DetailGrid>
                      <DetailItem style={{ gridColumn: '1 / -1' }}>
                        <ModalDetailLabel>Notas y Aprendizajes</ModalDetailLabel>
                        <ModalDetailValue 
                          $highlight
                          style={{ 
                            padding: '1rem',
                            backgroundColor: '#f8f9fa',
                            borderLeft: `4px solid ${colors.primary}`,
                            borderRadius: '8px',
                            fontStyle: 'italic',
                            lineHeight: '1.6',
                            whiteSpace: 'pre-wrap'
                          }}
                        >
                          "{getTradeAttr(selectedTrade, 'notes')}"
                        </ModalDetailValue>
                      </DetailItem>
                    </DetailGrid>
                  </DetailSection>
                )}

                {/* Fechas y duración */}
                <DetailSection>
                  <SectionTitle>
                    <Calendar size={20} />
                    Cronología
                  </SectionTitle>
                  <DetailGrid>
                    <DetailItem>
                      <ModalDetailLabel>Fecha de Apertura</ModalDetailLabel>
                      <ModalDetailValue>
                        {formatTradeDate(getTradeAttr(selectedTrade, 'createdAt'))}
                      </ModalDetailValue>
                    </DetailItem>
                    <DetailItem>
                      <ModalDetailLabel>Fecha de Cierre</ModalDetailLabel>
                      <ModalDetailValue>
                        {formatTradeDate(getTradeAttr(selectedTrade, 'closed_at'))}
                      </ModalDetailValue>
                    </DetailItem>
                    <DetailItem>
                      <ModalDetailLabel>Duración</ModalDetailLabel>
                      <ModalDetailValue $highlight>
                        <Clock size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                        {calculateTradeDuration(selectedTrade)} día{calculateTradeDuration(selectedTrade) !== 1 ? 's' : ''}
                      </ModalDetailValue>
                    </DetailItem>
                  </DetailGrid>
                </DetailSection>
              </DetailBody>
            </TradeDetailContent>
          </TradeDetailModal>
        )}
      </AnimatePresence>

      {/* Modal para editar trade */}
      {showEditModal && (
        <EditTradeModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          trade={selectedTrade}
          onTradeUpdated={handleTradeUpdated}
        />
      )}
    </HistoryContainer>
  );
};

export default ClosedTradesHistory;
