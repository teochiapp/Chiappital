// components/Trades/AddCapitalModal.js - Modal para agregar capital a una posición existente
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { PlusCircle, Calculator } from 'lucide-react';
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
  color: #38bdf8;
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
    background: ${colors.primary};
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

const AddCapitalModal = ({ isOpen, onClose, trade, onTradeUpdated }) => {
  const [newEntryPrice, setNewEntryPrice] = useState('');
  const [newPortfolioPercent, setNewPortfolioPercent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getTradeAttr = (trade, attr) => {
    if (!trade) return null;
    return trade.attributes ? trade.attributes[attr] : trade[attr];
  };

  useEffect(() => {
    if (isOpen && trade) {
      setNewEntryPrice('');
      setNewPortfolioPercent('');
      setError('');
    }
  }, [isOpen, trade]);

  const oldPrice = parseFloat(getTradeAttr(trade, 'entry_price')) || 0;
  const oldPct = getTradeAttr(trade, 'portfolio_percentage') !== null && getTradeAttr(trade, 'portfolio_percentage') !== undefined
    ? parseFloat(getTradeAttr(trade, 'portfolio_percentage'))
    : 0;

  const newPriceNum = parseFloat(newEntryPrice) || 0;
  const newPctNum = parseFloat(newPortfolioPercent) || 0;

  let averagePrice = oldPrice;
  let totalPct = oldPct;

  if (newPriceNum > 0 && newPctNum > 0) {
    totalPct = oldPct + newPctNum;
    averagePrice = ((oldPrice * oldPct) + (newPriceNum * newPctNum)) / totalPct;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newEntryPrice || isNaN(newPriceNum) || newPriceNum <= 0) {
      setError('Por favor ingresa un precio de entrada válido mayor a 0');
      return;
    }

    if (!newPortfolioPercent || isNaN(newPctNum) || newPctNum <= 0) {
      setError('Por favor ingresa un porcentaje de cartera válido mayor a 0');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const updateData = {
        entry_price: parseFloat(averagePrice.toFixed(4)),
        portfolio_percentage: parseFloat(totalPct.toFixed(2))
      };

      await onTradeUpdated(trade.id, updateData);
      onClose();
    } catch (err) {
      console.error('Error al agregar capital:', err);
      setError(err.message || 'Error al agregar capital. Intenta nuevamente.');
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
              <PlusCircle size={22} color={colors.primary} />
              Agregar Capital
            </ModalTitle>

            <TradeSummaryCard>
              <TradeSymbolRow>
                <TradeSymbolName>{getTradeAttr(trade, 'symbol')}</TradeSymbolName>
              </TradeSymbolRow>
              <TradeInfoGrid>
                <TradeInfoItem>Precio Actual Prom.: <strong>${oldPrice}</strong></TradeInfoItem>
                <TradeInfoItem>% Cartera Actual: <strong>{oldPct}%</strong></TradeInfoItem>
              </TradeInfoGrid>
            </TradeSummaryCard>

            {error && <ErrorMessage>{error}</ErrorMessage>}

            <form onSubmit={handleSubmit}>
              <FormGroup>
                <Label htmlFor="newEntryPrice">Precio de Entrada Nueva Compra (USD) *</Label>
                <Input
                  type="number"
                  id="newEntryPrice"
                  value={newEntryPrice}
                  onChange={(e) => setNewEntryPrice(e.target.value)}
                  placeholder="0.00"
                  step="any"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="newPortfolioPercent">% de Cartera a Agregar *</Label>
                <Input
                  type="number"
                  id="newPortfolioPercent"
                  value={newPortfolioPercent}
                  onChange={(e) => setNewPortfolioPercent(e.target.value)}
                  placeholder="Ej: 5"
                  step="any"
                  min="0.01"
                  max="100"
                  required
                />
              </FormGroup>

              {newPriceNum > 0 && newPctNum > 0 && (
                <CalculationPreviewBox>
                  <PreviewRow>
                    <span>Nuevo % Total de Cartera:</span>
                    <strong>{totalPct.toFixed(2)}%</strong>
                  </PreviewRow>
                  <ResultHighlight>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.4rem'}}>
                      <Calculator size={16} />
                      <span>Nuevo Precio Promedio:</span>
                    </div>
                    <span>${averagePrice.toFixed(4)}</span>
                  </ResultHighlight>
                </CalculationPreviewBox>
              )}

              <ButtonGroup>
                <Button type="button" className="secondary" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="primary"
                  disabled={loading || !newEntryPrice || !newPortfolioPercent}
                >
                  {loading ? 'Procesando...' : 'Confirmar y Promediar'}
                </Button>
              </ButtonGroup>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}
    </AnimatePresence>
  );
};

export default AddCapitalModal;
