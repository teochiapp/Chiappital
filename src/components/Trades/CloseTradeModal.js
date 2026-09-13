// components/Trades/CloseTradeModal.js - Modal para cerrar trades o hacer ventas parciales
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { Lock, PieChart, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { colors } from '../../styles/colors';

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled(motion.div)`
  background: #1e293b;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  color: white;
`;

const ModalTitle = styled.h2`
  font-size: 1.6rem;
  font-weight: 700;
  font-family: 'Unbounded', sans-serif;
  color: white;
  margin: 0 0 1.25rem 0;
  display: flex;
  align-items: center;
  gap: 0.6rem;
`;

const TradeSummaryCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  font-family: 'Unbounded', sans-serif;
`;

const TradeSymbolRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const TradeSymbolName = styled.span`
  font-size: 1.2rem;
  font-weight: 700;
  color: white;
`;

const TradeBadge = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  background: ${props => props.$type === 'buy' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(248, 113, 113, 0.15)'};
  color: ${props => props.$type === 'buy' ? '#4ade80' : '#f87171'};
  border: 1px solid ${props => props.$type === 'buy' ? 'rgba(74, 222, 128, 0.3)' : 'rgba(248, 113, 113, 0.3)'};
`;

const TradeInfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #94a3b8;
  margin-top: 0.5rem;
`;

const TradeInfoItem = styled.div`
  strong {
    color: #e2e8f0;
  }
`;

const ModeTabContainer = styled.div`
  display: flex;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 8px;
  padding: 0.3rem;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

const ModeTab = styled.button`
  flex: 1;
  padding: 0.6rem 0.8rem;
  border: none;
  border-radius: 6px;
  font-family: 'Unbounded', sans-serif;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  background: ${props => props.$active ? (props.$isPartial ? 'rgba(245, 158, 11, 0.2)' : colors.primary) : 'transparent'};
  color: ${props => props.$active ? (props.$isPartial ? '#fbbf24' : 'white') : '#94a3b8'};
  border: 1px solid ${props => props.$active ? (props.$isPartial ? 'rgba(245, 158, 11, 0.4)' : colors.primary) : 'transparent'};

  &:hover {
    color: white;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  font-family: 'Unbounded', sans-serif;
  color: #e2e8f0;
  font-size: 0.85rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(15, 23, 42, 0.6);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 1rem;
  color: white;
  font-family: 'Unbounded', sans-serif;
  transition: border-color 0.2s ease;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${colors.primary};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(15, 23, 42, 0.6);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 0.9rem;
  color: white;
  font-family: 'Unbounded', sans-serif;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
  min-height: 70px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${colors.primary};
  }

  &::placeholder {
    color: #64748b;
  }
`;

const CalculationPreviewBox = styled.div`
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-family: 'Unbounded', sans-serif;
`;

const PreviewRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: #94a3b8;

  strong {
    color: white;
  }
`;

const ResultHighlight = styled.div`
  margin-top: 0.4rem;
  padding-top: 0.6rem;
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;
  font-weight: 700;
  color: ${props => props.$isPositive ? '#4ade80' : '#f87171'};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: 'Unbounded', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;

  &.primary {
    background: ${props => props.$isPartial ? '#f59e0b' : colors.trading.profit};
    color: white;

    &:hover {
      opacity: 0.9;
    }

    &:disabled {
      background: #475569;
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &.secondary {
    background: transparent;
    color: #94a3b8;
    border: 1px solid rgba(255, 255, 255, 0.1);

    &:hover {
      background: rgba(255, 255, 255, 0.05);
      color: white;
    }
  }
`;

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  margin-bottom: 1.25rem;
  font-family: 'Unbounded', sans-serif;
  font-size: 0.85rem;
`;

const CloseTradeModal = ({ isOpen, onClose, trade, onTradeClosed }) => {
  const [sellMode, setSellMode] = useState('total'); // 'total' | 'partial'
  const [exitPrice, setExitPrice] = useState('');
  const [soldPositionPercent, setSoldPositionPercent] = useState('50');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getTradeAttr = (trade, attr) => {
    if (!trade) return null;
    return trade.attributes ? trade.attributes[attr] : trade[attr];
  };

  useEffect(() => {
    if (isOpen && trade) {
      setSellMode('total');
      setExitPrice('');
      setSoldPositionPercent('50');
      setNotes(getTradeAttr(trade, 'notes') || '');
      setError('');
    }
  }, [isOpen, trade]);

  const entryPrice = parseFloat(getTradeAttr(trade, 'entry_price')) || 0;
  const originalPortfolioPct = getTradeAttr(trade, 'portfolio_percentage') !== null && getTradeAttr(trade, 'portfolio_percentage') !== undefined
    ? parseFloat(getTradeAttr(trade, 'portfolio_percentage'))
    : null;

  // Calcular resultado en porcentaje
  const calculateResult = () => {
    if (!exitPrice || !entryPrice) return 0;

    const exit = parseFloat(exitPrice);
    let resultPercent = 0;
    if (getTradeAttr(trade, 'type') === 'buy') {
      resultPercent = ((exit - entryPrice) / entryPrice) * 100;
    } else {
      resultPercent = ((entryPrice - exit) / entryPrice) * 100;
    }

    return resultPercent;
  };

  const calculatedResultPct = calculateResult();
  const isPositive = calculatedResultPct >= 0;

  // Cálculos para venta parcial
  const soldPctNumber = parseFloat(soldPositionPercent) || 0;
  
  let closedPortfolioPct = null;
  let remainingPortfolioPct = null;

  if (originalPortfolioPct !== null) {
    closedPortfolioPct = sellMode === 'total' 
      ? originalPortfolioPct 
      : (originalPortfolioPct * (soldPctNumber / 100));
      
    remainingPortfolioPct = sellMode === 'total' 
      ? 0 
      : (originalPortfolioPct - closedPortfolioPct);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!exitPrice || isNaN(parseFloat(exitPrice))) {
      setError('Por favor ingresa un precio de salida válido');
      return;
    }

    if (sellMode === 'partial') {
      if (isNaN(soldPctNumber) || soldPctNumber <= 0 || soldPctNumber > 100) {
        setError('El % de la posición a vender debe ser mayor a 0% y menor o igual a 100%');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const resultVal = calculateResult().toFixed(2);
      const isPartial = sellMode === 'partial' && soldPctNumber < 100;

      const partialData = isPartial ? {
        isPartial: true,
        soldPositionPercent: soldPctNumber,
        originalTrade: trade
      } : null;

      await onTradeClosed(
        trade.id,
        parseFloat(exitPrice),
        parseFloat(resultVal),
        notes.trim(),
        partialData
      );

      onClose();
    } catch (err) {
      console.error('Error al procesar la venta:', err);
      setError(err.message || 'Error al procesar la operación. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  if (!trade) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <ModalContent
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalTitle>
              <Lock size={22} color={colors.primary} />
              Cerrar Trade / Venta
            </ModalTitle>

            <TradeSummaryCard>
              <TradeSymbolRow>
                <TradeSymbolName>{getTradeAttr(trade, 'symbol')}</TradeSymbolName>
                <TradeBadge $type={getTradeAttr(trade, 'type')}>
                  {getTradeAttr(trade, 'type') === 'buy' ? 'COMPRA (LONG)' : 'VENTA (SHORT)'}
                </TradeBadge>
              </TradeSymbolRow>
              <TradeInfoGrid>
                <TradeInfoItem>Precio Entrada: <strong>${entryPrice}</strong></TradeInfoItem>
                <TradeInfoItem>% Cartera Actual: <strong>{originalPortfolioPct !== null ? `${originalPortfolioPct}%` : 'N/A'}</strong></TradeInfoItem>
              </TradeInfoGrid>
            </TradeSummaryCard>

            <ModeTabContainer>
              <ModeTab
                type="button"
                $active={sellMode === 'total'}
                onClick={() => setSellMode('total')}
              >
                <CheckCircle2 size={16} />
                Venta Total (100%)
              </ModeTab>
              <ModeTab
                type="button"
                $active={sellMode === 'partial'}
                $isPartial={true}
                onClick={() => setSellMode('partial')}
              >
                <PieChart size={16} />
                Venta Parcial
              </ModeTab>
            </ModeTabContainer>

            {error && <ErrorMessage>{error}</ErrorMessage>}

            <form onSubmit={handleSubmit}>
              <FormGroup>
                <Label htmlFor="exitPrice">Precio de Salida (USD) *</Label>
                <Input
                  type="number"
                  id="exitPrice"
                  value={exitPrice}
                  onChange={(e) => setExitPrice(e.target.value)}
                  placeholder="0.00"
                  step="any"
                  required
                />
              </FormGroup>

              {sellMode === 'partial' && (
                <FormGroup>
                  <Label htmlFor="soldPositionPercent">% de la Posición a Vender *</Label>
                  <Input
                    type="number"
                    id="soldPositionPercent"
                    value={soldPositionPercent}
                    onChange={(e) => setSoldPositionPercent(e.target.value)}
                    placeholder="Ej: 50"
                    step="any"
                    min="0.01"
                    max="100"
                    required
                  />
                </FormGroup>
              )}

              {exitPrice && !isNaN(parseFloat(exitPrice)) && (
                <CalculationPreviewBox>
                  {sellMode === 'partial' ? (
                    <>
                      <PreviewRow>
                        <span>Posición a vender:</span>
                        <strong>{soldPctNumber}% de la posición</strong>
                      </PreviewRow>
                      {originalPortfolioPct !== null && (
                        <>
                          <PreviewRow>
                            <span>% Cartera cerrado (Historial):</span>
                            <strong>{closedPortfolioPct.toFixed(2)}%</strong>
                          </PreviewRow>
                          <PreviewRow>
                            <span>% Cartera remanente (Queda abierto):</span>
                            <strong>{remainingPortfolioPct.toFixed(2)}%</strong>
                          </PreviewRow>
                        </>
                      )}
                    </>
                  ) : (
                    <PreviewRow>
                      <span>Venta:</span>
                      <strong>100% de la posición</strong>
                    </PreviewRow>
                  )}

                  <ResultHighlight $isPositive={isPositive}>
                    <span>Resultado Rendimiento:</span>
                    <span>
                      {isPositive ? '+' : ''}{calculatedResultPct.toFixed(2)}%
                    </span>
                  </ResultHighlight>
                </CalculationPreviewBox>
              )}

              <FormGroup>
                <Label htmlFor="notes">Notas / Bitácora (Opcional)</Label>
                <TextArea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Escribe algún motivo o reflexión sobre la venta..."
                />
              </FormGroup>

              <ButtonGroup>
                <Button type="button" className="secondary" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="primary"
                  $isPartial={sellMode === 'partial'}
                  disabled={loading || !exitPrice}
                >
                  {loading 
                    ? 'Procesando...' 
                    : sellMode === 'partial' 
                      ? `Confirmar Venta Parcial (${soldPctNumber}%)` 
                      : 'Cerrar Posición Completa'}
                </Button>
              </ButtonGroup>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}
    </AnimatePresence>
  );
};

export default CloseTradeModal;
