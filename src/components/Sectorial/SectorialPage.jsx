import React, { useState } from 'react';
import styled from 'styled-components';
import { useSectorialData } from '../../hooks/useSectorialData';
import DotPlotCard from './DotPlotCard';
import { RefreshCw } from 'lucide-react';

const SectorialPage = () => {
  const { data, loading, error, refetch } = useSectorialData();
  const [activeTab, setActiveTab] = useState('sectores'); // 'sectores' | 'paises'
  
  const currentData = activeTab === 'sectores' ? data.sectors : data.regions;

  // Ordenar de mayor a menor rendimiento para cada temporalidad
  const getSortedData = (dataArray, key) => {
    return [...dataArray].sort((a, b) => {
      if (a.error && !b.error) return 1;
      if (!a.error && b.error) return -1;
      return (b[key] || 0) - (a[key] || 0);
    });
  };

  const dailySorted = getSortedData(currentData, 'dailyPerf');
  const weeklySorted = getSortedData(currentData, 'weeklyPerf');
  const monthlySorted = getSortedData(currentData, 'monthlyPerf');

  return (
    <PageWrapper>
      <PageContainer>
      <Header>
        <HeaderLeft>
          <Title>Análisis Sectorial</Title>
          <Subtitle>Datos actualizados en tiempo real o al último cierre.</Subtitle>
        </HeaderLeft>
        <HeaderControls>
          <TabsContainer>
            <Tab $active={activeTab === 'sectores'} onClick={() => setActiveTab('sectores')}>
              Sectores
            </Tab>
            <Tab $active={activeTab === 'paises'} onClick={() => setActiveTab('paises')}>
              Países y Regiones
            </Tab>
          </TabsContainer>
          <RefreshButton onClick={refetch} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            {loading ? 'Cargando...' : 'Cargar / Actualizar'}
          </RefreshButton>
        </HeaderControls>
      </Header>

      {error && <ErrorMessage>Error cargando datos: {error}</ErrorMessage>}

      <Grid>
        <DotPlotCard 
          title="Rendimiento Diario" 
          subtitle="Hoy vs ayer"
          data={dailySorted} 
          dataKey="dailyPerf" 
        />
        <DotPlotCard 
          title="Rendimiento Semanal" 
          subtitle="Últimos 5 días"
          data={weeklySorted} 
          dataKey="weeklyPerf" 
        />
        <DotPlotCard 
          title="Rendimiento Mensual" 
          subtitle="Último mes (21 sesiones)"
          data={monthlySorted} 
          dataKey="monthlyPerf" 
        />
      </Grid>
    </PageContainer>
    </PageWrapper>
  );
};

// ─── Estilos ─────────────────────────────────────────────────────────────────

const PageWrapper = styled.div`
  background-color: #0f172a;
  min-height: calc(100vh - 60px);
  width: 100%;
`;

const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
  color: #e2e8f0;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Title = styled.h1`
  font-family: 'Unbounded', sans-serif;
  font-size: 1.8rem;
  color: white;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 1.4rem;
  }
`;

const Subtitle = styled.p`
  color: #94a3b8;
  margin: 0;
  font-size: 0.95rem;
`;

const HeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const TabsContainer = styled.div`
  display: flex;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 8px;
  padding: 0.25rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Tab = styled.button`
  padding: 0.5rem 1.25rem;
  background: ${props => props.$active ? 'rgba(59, 130, 246, 0.2)' : 'transparent'};
  color: ${props => props.$active ? '#60a5fa' : '#94a3b8'};
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: ${props => props.$active ? '#60a5fa' : 'white'};
  }
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  color: #cbd5e1;
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  background: rgba(244, 63, 94, 0.1);
  color: #f43f5e;
  border: 1px solid rgba(244, 63, 94, 0.2);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  font-weight: 500;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  
  /* Select the 3rd child (Rendimiento Mensual) to center it at the bottom */
  & > *:nth-child(3) {
    grid-column: 1 / -1;
    width: calc(50% - 1rem);
    margin: 0 auto;
  }

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    
    & > *:nth-child(3) {
      grid-column: 1 / -1;
      width: 100%;
    }
  }
`;

export default SectorialPage;
