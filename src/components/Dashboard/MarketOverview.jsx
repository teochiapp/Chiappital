import React from 'react';
import styled from 'styled-components';

const MarketOverviewContainer = styled.div`
  margin-bottom: 2rem;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const Title = styled.h2`
  font-size: 1.8rem;
  font-weight: 600;
  font-family: 'Unbounded', sans-serif;
  color: #2c3e50;
  margin: 0;
`;

const MarketOverview = () => {
  return (
    <MarketOverviewContainer>
      <SectionHeader>
        <Title>Resumen del Mercado</Title>
      </SectionHeader>
      
      <div style={{ 
        textAlign: 'center', 
        padding: '2rem', 
        color: '#7f8c8d', 
        fontFamily: "'Unbounded', sans-serif",
        fontSize: '1.1rem'
      }}>
        <p>Usa el buscador de abajo para encontrar acciones específicas</p>
      </div>
    </MarketOverviewContainer>
  );
};

export default MarketOverview;