import React from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';

const PriceCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-left: 4px solid ${props => props.isPositive ? '#27ae60' : '#e74c3c'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  }
`;

const SymbolHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const Symbol = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  font-family: 'Unbounded', sans-serif;
  color: #2c3e50;
  margin: 0;
`;

const Price = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  font-family: 'Unbounded', sans-serif;
  color: #2c3e50;
`;

const ChangeInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
`;

const Change = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  font-family: 'Unbounded', sans-serif;
  color: ${props => props.isPositive ? '#27ae60' : '#e74c3c'};
`;

const ChangePercent = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  font-family: 'Unbounded', sans-serif;
  color: ${props => props.isPositive ? '#27ae60' : '#e74c3c'};
`;

const Volume = styled.div`
  font-size: 0.8rem;
  color: #7f8c8d;
  margin-top: 0.5rem;
`;

const ErrorCard = styled.div`
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  font-family: 'Unbounded', sans-serif;
  font-weight: 500;
`;

const LoadingCard = styled.div`
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  color: #7f8c8d;
  font-family: 'Unbounded', sans-serif;
  font-weight: 500;
`;

const PriceDisplay = ({ symbol, data, error, loading }) => {
  if (loading) {
    return (
      <LoadingCard>
        Cargando datos de {symbol}...
      </LoadingCard>
    );
  }

  if (error) {
    return (
      <ErrorCard>
        Error: {error}
      </ErrorCard>
    );
  }

  if (!data) {
    return (
      <ErrorCard>
        No hay datos disponibles para {symbol}
      </ErrorCard>
    );
  }

  const isPositive = data.change >= 0;
  const changeSign = isPositive ? '+' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <PriceCard isPositive={isPositive}>
        <SymbolHeader>
          <Symbol>{data.symbol}</Symbol>
        </SymbolHeader>
        
        <Price>${data.price.toFixed(2)}</Price>
        
        <ChangeInfo>
          <Change isPositive={isPositive}>
            {changeSign}{data.change.toFixed(2)}
          </Change>
          <ChangePercent isPositive={isPositive}>
            ({changeSign}{data.changePercent.toFixed(2)}%)
          </ChangePercent>
        </ChangeInfo>
        
        <Volume>
          Alta: ${data.high.toFixed(2)} | Baja: ${data.low.toFixed(2)}
        </Volume>
      </PriceCard>
    </motion.div>
  );
};

export default PriceDisplay;
