import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { getStrategyDisplayName } from './TradeForm';

const ListContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
`;

const ListHeader = styled.div`
  background: #f8f9fa;
  padding: 1.5rem;
  border-bottom: 1px solid #e1e8ed;
`;

const ListTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 600;
  font-family: 'Unbounded', sans-serif;
  color: #2c3e50;
  margin: 0 0 1rem 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
`;

const StatCard = styled.div`
  text-align: center;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e1e8ed;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  font-family: 'Unbounded', sans-serif;
  color: ${props => props.$positive ? '#27ae60' : props.$negative ? '#e74c3c' : '#2c3e50'};
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: #7f8c8d;
  font-family: 'Unbounded', sans-serif;
  margin-top: 0.25rem;
`;

const FiltersContainer = styled.div`
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e1e8ed;
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
`;

const FilterInput = styled.input`
  padding: 0.5rem;
  border: 1px solid #e1e8ed;
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: 'Unbounded', sans-serif;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const FilterSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid #e1e8ed;
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: 'Unbounded', sans-serif;
  background: white;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const TradesList = styled.div`
  max-height: 600px;
  overflow-y: auto;
`;

const TradeItem = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e1e8ed;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f8f9fa;
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
  font-size: 1.2rem;
  font-weight: 600;
  font-family: 'Unbounded', sans-serif;
  color: #2c3e50;
`;

const TradeResult = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  font-family: 'Unbounded', sans-serif;
  color: ${props => props.$positive ? '#27ae60' : '#e74c3c'};
`;

const TradeDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 0.5rem;
`;

const TradeDetail = styled.div`
  font-size: 0.9rem;
  color: #7f8c8d;
  font-family: 'Unbounded', sans-serif;
`;

const TradeNotes = styled.div`
  font-size: 0.9rem;
  color: #2c3e50;
  font-family: 'Unbounded', sans-serif;
  margin-top: 0.5rem;
  font-style: italic;
`;

const TradeDate = styled.div`
  font-size: 0.8rem;
  color: #bdc3c7;
  font-family: 'Unbounded', sans-serif;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
  font-family: 'Unbounded', sans-serif;
`;

const ActionButton = styled.button`
  background: ${props => props.danger ? '#e74c3c' : '#3498db'};
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-family: 'Unbounded', sans-serif;
  cursor: pointer;
  margin-left: 0.5rem;
  transition: background-color 0.2s ease;

  &:hover {
    background: ${props => props.danger ? '#c0392b' : '#2980b9'};
  }
`;

const TradeList = ({ trades, loading, error, onTradeDeleted }) => {
  const [filters, setFilters] = useState({
    symbol: '',
    type: '',
    dateFrom: '',
    dateTo: ''
  });

  const [filteredTrades, setFilteredTrades] = useState([]);

  useEffect(() => {
    if (trades) {
      applyFilters();
    }
  }, [trades, filters]);

  const applyFilters = () => {
    if (!trades) return;

    let filtered = [...trades];

    if (filters.symbol) {
      filtered = filtered.filter(trade => 
        trade.attributes.symbol.toLowerCase().includes(filters.symbol.toLowerCase())
      );
    }

    if (filters.type) {
      filtered = filtered.filter(trade => trade.attributes.type === filters.type);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(trade => 
        new Date(trade.attributes.createdAt) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(trade => 
        new Date(trade.attributes.createdAt) <= new Date(filters.dateTo)
      );
    }

    setFilteredTrades(filtered);
  };

  const handleDeleteTrade = async (tradeId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este trade?')) {
      try {
        await onTradeDeleted(tradeId);
      } catch (err) {
        console.error('Error deleting trade:', err);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <ListContainer>
        <ListHeader>
          <ListTitle>📊 Historial de Trades</ListTitle>
        </ListHeader>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div>⏳ Cargando trades...</div>
        </div>
      </ListContainer>
    );
  }

  if (error) {
    return (
      <ListContainer>
        <ListHeader>
          <ListTitle>📊 Historial de Trades</ListTitle>
        </ListHeader>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#e74c3c' }}>
          <div>❌ Error: {error}</div>
        </div>
      </ListContainer>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <ListContainer>
        <ListHeader>
          <ListTitle>📊 Historial de Trades</ListTitle>
        </ListHeader>

        <FiltersContainer>
          <FilterInput
            type="text"
            placeholder="Buscar por símbolo..."
            value={filters.symbol}
            onChange={(e) => setFilters(prev => ({ ...prev, symbol: e.target.value }))}
          />
          <FilterSelect
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
          >
            <option value="">Todos los tipos</option>
            <option value="buy">Compra</option>
            <option value="sell">Venta</option>
          </FilterSelect>
          <FilterInput
            type="date"
            placeholder="Desde"
            value={filters.dateFrom}
            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
          />
          <FilterInput
            type="date"
            placeholder="Hasta"
            value={filters.dateTo}
            onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
          />
        </FiltersContainer>

        <TradesList>
          {filteredTrades.length === 0 ? (
            <EmptyState>
              <p>No hay trades registrados</p>
              <p>¡Comienza registrando tu primer trade!</p>
            </EmptyState>
          ) : (
            filteredTrades.map((trade, index) => (
              <motion.div
                key={trade.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <TradeItem>
                  <TradeHeader>
                    <TradeSymbol>
                      {trade.attributes.symbol} - {trade.attributes.type === 'buy' ? 'Compra' : 'Venta'}
                    </TradeSymbol>
                    <div>
                      <TradeResult $positive={trade.attributes.result >= 0}>
                        {trade.attributes.result ? formatCurrency(trade.attributes.result) : 'Abierto'}
                      </TradeResult>
                      <ActionButton 
                        danger 
                        onClick={() => handleDeleteTrade(trade.id)}
                      >
                        Eliminar
                      </ActionButton>
                    </div>
                  </TradeHeader>
                  
                  <TradeDetails>
                    <TradeDetail>
                      <strong>Entrada:</strong> {formatCurrency(trade.attributes.entry_price)}
                    </TradeDetail>
                    <TradeDetail>
                      <strong>Salida:</strong> {trade.attributes.exit_price ? formatCurrency(trade.attributes.exit_price) : 'Abierto'}
                    </TradeDetail>
                    {trade.attributes.portfolio_percentage && (
                      <TradeDetail>
                        <strong>% Cartera:</strong> {trade.attributes.portfolio_percentage}%
                      </TradeDetail>
                    )}
                    {trade.attributes.stop_loss && (
                      <TradeDetail>
                        <strong>Stop Loss:</strong> {formatCurrency(trade.attributes.stop_loss)}
                      </TradeDetail>
                    )}
                    {trade.attributes.take_profit && (
                      <TradeDetail>
                        <strong>Take Profit:</strong> {formatCurrency(trade.attributes.take_profit)}
                      </TradeDetail>
                    )}
                    <TradeDetail>
                      <strong>Estado:</strong> {trade.attributes.status === 'open' ? 'Abierto' : 'Cerrado'}
                    </TradeDetail>
                    <TradeDetail>
                      <strong>Fecha:</strong> {formatDate(trade.attributes.createdAt)}
                    </TradeDetail>
                    {trade.attributes.strategy && (
                      <TradeDetail>
                        <strong>Estrategia:</strong> {getStrategyDisplayName(trade.attributes.strategy)}
                      </TradeDetail>
                    )}
                    {trade.attributes.emotions && (
                      <TradeDetail>
                        <strong>Emoción:</strong> {trade.attributes.emotions}
                      </TradeDetail>
                    )}
                    {trade.attributes.notes && (
                      <TradeDetail>
                        <strong>Notas:</strong> {trade.attributes.notes}
                      </TradeDetail>
                    )}
                  </TradeDetails>
                  
                  {trade.notes && (
                    <TradeNotes>
                      "{trade.notes}"
                    </TradeNotes>
                  )}
                  
                  <TradeDate>
                    {formatDate(trade.createdAt)}
                  </TradeDate>
                </TradeItem>
              </motion.div>
            ))
          )}
        </TradesList>
      </ListContainer>
    </motion.div>
  );
};

export default TradeList;

