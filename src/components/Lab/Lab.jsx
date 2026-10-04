import React, { useState } from 'react';
import styled from 'styled-components';
import { StyledContainer } from '../common/StyledComponents';
import LabMenu from './LabMenu';
import MethodologyChecklist from './MethodologyChecklist';
import SectorAnalysis from './SectorAnalysis';
import CountryAnalysis from './CountryAnalysis';
import LabPortfolio from './LabPortfolio';

const Lab = () => {
  const [activeTab, setActiveTab] = useState('portfolio'); // 'portfolio', 'methodology', 'sectors', 'countries'
  const [selectedTicker, setSelectedTicker] = useState(null);

  const handleEvaluateTrade = (symbol) => {
    setSelectedTicker(symbol);
    setActiveTab('methodology');
  };

  return (
    <LabLayout>
      <StyledContainer>
        <LabMenu activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <LabContent>
          {activeTab === 'portfolio' && (
            <LabPortfolio onEvaluate={handleEvaluateTrade} />
          )}
          
          {activeTab === 'methodology' && (
            <MethodologyChecklist initialTicker={selectedTicker} />
          )}

          {activeTab === 'sectors' && (
            <SectorAnalysis />
          )}

          {activeTab === 'countries' && (
            <CountryAnalysis />
          )}
        </LabContent>
      </StyledContainer>
    </LabLayout>
  );
};

const LabLayout = styled.div`
  padding: 2rem 0;
  min-height: calc(100vh - 80px);
  background-color: #0f172a; /* Dark background matching app theme */
  color: #e2e8f0;
`;

const LabContent = styled.div`
  margin-top: 2rem;
  background: #1e293b;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 2rem;
  min-height: 400px;
`;

export default Lab;
