import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useStrapiTrades } from '../../hooks/useApiTrades';
import { ClipboardCheck, TrendingUp, AlertCircle, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import symbolSearchService from '../../services/symbolSearchService';
import companyLogoService from '../../services/companyLogoService';
import { GICS_SECTORS } from './SectorAnalysis';
import { REGIONS } from './CountryAnalysis';
import { colors, withOpacity } from '../../styles/colors';
import { useLabData } from '../../context/LabContext';

const LabPortfolio = ({ onEvaluate }) => {
  const { openTrades, loading, error } = useStrapiTrades();
  const { checklistHistory, sectorData, countryData } = useLabData();

  const [logos, setLogos] = useState({});

  useEffect(() => {
    const loadLogos = async () => {
      if (openTrades && openTrades.length > 0) {
        const newLogos = {};
        let hasNew = false;
        for (const trade of openTrades) {
          if (logos[trade.symbol] === undefined) {
            try {
              const url = await companyLogoService.getCompanyLogo(trade.symbol);
              newLogos[trade.symbol] = url;
              hasNew = true;
            } catch (e) {
              newLogos[trade.symbol] = null;
              hasNew = true;
            }
          }
        }
        if (hasNew) {
          setLogos(prev => ({ ...prev, ...newLogos }));
        }
      }
    };
    loadLogos();
  }, [openTrades]);



  const getTradeContext = (symbol) => {
    const historyRecord = checklistHistory.find(r => r.ticker === symbol);
    
    const allSymbols = [
      ...symbolSearchService.getPopularSymbols(),
      ...symbolSearchService.getAllMockSymbols()
    ];
    const symbolData = allSymbols.find(s => s.symbol === symbol);
    
    let sectorTrend = null;
    let countryTrend = null;
    let sectorName = 'N/A';
    let countryName = 'N/A';
    
    if (symbolData) {
      const gics = GICS_SECTORS.find(g => g.name === symbolData.sector || g.ticker === symbolData.sector);
      if (gics) {
        sectorName = gics.name;
        sectorTrend = sectorData[gics.id]?.dailyTrend || sectorData[gics.id]?.trend;
      } else {
        sectorName = symbolData.sector;
      }
      
      const regionMap = {
        'US': 'spy',
        'AR': 'merval',
        'BR': 'ewz',
        'CN': 'fxi',
        'Global': 'btc'
      };
      const regionId = regionMap[symbolData.region];
      if (regionId) {
        const regionObj = REGIONS.find(r => r.id === regionId);
        if (regionObj) countryName = regionObj.name;
        countryTrend = countryData[regionId]?.dailyTrend || countryData[regionId]?.trend;
      }
    }
    
    return { historyRecord, sectorName, sectorTrend, countryName, countryTrend };
  };

  if (loading) {
    return (
      <LoadingContainer>
        <RefreshCw size={32} className="spin" color={colors.primary} />
        <p>Cargando tus posiciones activas...</p>
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <ErrorContainer>
        <AlertCircle size={32} color="#f43f5e" />
        <p>Hubo un error cargando el portafolio: {error}</p>
      </ErrorContainer>
    );
  }

  if (!openTrades || openTrades.length === 0) {
    return (
      <EmptyContainer>
        <TrendingUp size={48} color="#64748b" />
        <EmptyTitle>No hay posiciones activas</EmptyTitle>
        <EmptyDesc>Tus operaciones abiertas aparecerán aquí para que puedas analizarlas.</EmptyDesc>
      </EmptyContainer>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Posiciones Activas</Title>
        <Subtitle>Revisa tus operaciones abiertas y evalúalas contra las reglas de tu metodología para asegurarte de que siguen cumpliendo los criterios.</Subtitle>
      </Header>

      <Grid>
        {openTrades.map(trade => (
          <TradeCard key={trade.id}>
            <CardTop>
              <TradeSymbol>{trade.symbol}</TradeSymbol>
              {logos[trade.symbol] ? (
                <CompanyLogo src={logos[trade.symbol]} alt={`${trade.symbol} logo`} />
              ) : (
                <TradeType $type={trade.type}>
                  {trade.type === 'buy' ? 'LONG' : 'SHORT'}
                </TradeType>
              )}
            </CardTop>
            <CardBody>
              {(() => {
                const ctx = getTradeContext(trade.symbol);
                return (
                  <>
                    {ctx.historyRecord && (
                      <ChecklistResultRow $passed={ctx.historyRecord.passedAll}>
                        <DataLabel style={{ color: 'inherit' }}>Checklist</DataLabel>
                        <DataValue style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          {ctx.historyRecord.passedAll ? (
                            <><CheckCircle2 size={14} /> Aprobada</>
                          ) : (
                            <><XCircle size={14} /> Rechazada</>
                          )}
                        </DataValue>
                      </ChecklistResultRow>
                    )}
                    {ctx.sectorName !== 'ETF' && (
                      <DataRow>
                        <DataLabel>Sector ({ctx.sectorName})</DataLabel>
                        <TrendBadge $trend={ctx.sectorTrend}>
                          {ctx.sectorTrend ? ctx.sectorTrend.toUpperCase() : '-'}
                        </TrendBadge>
                      </DataRow>
                    )}
                    <DataRow>
                      <DataLabel>País ({ctx.countryName})</DataLabel>
                      <TrendBadge $trend={ctx.countryTrend}>
                        {ctx.countryTrend ? ctx.countryTrend.toUpperCase() : '-'}
                      </TrendBadge>
                    </DataRow>
                  </>
                );
              })()}
            </CardBody>
            
            <EvaluateButton onClick={() => onEvaluate(trade.symbol)}>
              <ClipboardCheck size={16} />
              Evaluar en Checklist
            </EvaluateButton>
          </TradeCard>
        ))}
      </Grid>
    </Container>
  );
};

// ─── Estilos ─────────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Container = styled.div`
  animation: ${fadeIn} 0.4s ease-out;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #94a3b8;
  gap: 1rem;

  .spin {
    animation: ${spin} 1s linear infinite;
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #f43f5e;
  gap: 1rem;
`;

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
  gap: 1rem;
`;

const EmptyTitle = styled.h3`
  font-family: 'Unbounded', sans-serif;
  font-size: 1.5rem;
  color: white;
  margin: 0;
`;

const EmptyDesc = styled.p`
  color: #94a3b8;
  max-width: 400px;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h2`
  font-family: 'Unbounded', sans-serif;
  font-size: 1.8rem;
  color: white;
  margin: 0 0 0.5rem 0;
`;

const Subtitle = styled.p`
  color: #94a3b8;
  margin: 0;
  font-size: 1.05rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.5rem;
`;

const TradeCard = styled.div`
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(30, 41, 59, 0.8);
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }
`;

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TradeSymbol = styled.h3`
  font-family: 'Unbounded', sans-serif;
  font-size: 1.4rem;
  font-weight: 700;
  color: white;
  margin: 0;
`;

const CompanyLogo = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  background: white;
  padding: 2px;
`;

const TradeType = styled.span`
  background: ${props => props.$type === 'buy' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)'};
  color: ${props => props.$type === 'buy' ? '#34d399' : '#fb7185'};
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  padding: 1rem;
  border-radius: 8px;
  flex: 1;
`;

const DataRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DataLabel = styled.span`
  color: #94a3b8;
  font-size: 0.85rem;
`;

const DataValue = styled.span`
  color: white;
  font-weight: 500;
  font-size: 0.9rem;
`;

const EvaluateButton = styled.button`
  background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.85rem;
  font-size: 0.95rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: auto;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${withOpacity(colors.primary, 0.3)};
  }
`;

const ChecklistResultRow = styled(DataRow)`
  background: ${props => props.$passed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)'};
  color: ${props => props.$passed ? '#34d399' : '#fb7185'};
  padding: 0.5rem;
  border-radius: 6px;
  margin-bottom: 0.25rem;
`;

const TrendBadge = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  background: ${props => 
    props.$trend === 'alcista' ? 'rgba(16, 185, 129, 0.15)' : 
    props.$trend === 'bajista' ? 'rgba(244, 63, 94, 0.15)' : 
    props.$trend === 'lateral' ? 'rgba(251, 191, 36, 0.15)' :
    'rgba(255, 255, 255, 0.05)'};
  color: ${props => 
    props.$trend === 'alcista' ? '#34d399' : 
    props.$trend === 'bajista' ? '#fb7185' : 
    props.$trend === 'lateral' ? '#fbbf24' :
    '#94a3b8'};
`;

export default LabPortfolio;
