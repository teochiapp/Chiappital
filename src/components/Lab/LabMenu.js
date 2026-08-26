import React from 'react';
import styled from 'styled-components';
import { BookOpen, GraduationCap, PieChart, Globe } from 'lucide-react';

const LabMenu = ({ activeTab, setActiveTab }) => {
  return (
    <MenuContainer>
      <MenuHeader>
        <MenuTitle>Laboratorio de Decisiones</MenuTitle>
        <MenuSubtitle>Selecciona una dimensión para analizar</MenuSubtitle>
      </MenuHeader>
      
      <OptionsGrid>
        <OptionCard 
          $active={activeTab === 'portfolio'} 
          onClick={() => setActiveTab('portfolio')}
        >
          <IconWrapper $active={activeTab === 'portfolio'}>
            <BookOpen size={32} />
          </IconWrapper>
          <OptionInfo>
            <OptionTitle>Portafolio</OptionTitle>
            <OptionDesc>Analiza el estado actual, distribución y riesgo de tus activos.</OptionDesc>
          </OptionInfo>
        </OptionCard>

        <OptionCard 
          $active={activeTab === 'methodology'} 
          onClick={() => setActiveTab('methodology')}
        >
          <IconWrapper $active={activeTab === 'methodology'}>
            <GraduationCap size={32} />
          </IconWrapper>
          <OptionInfo>
            <OptionTitle>Checklist</OptionTitle>
            <OptionDesc>Evalúa si una acción cumple las reglas antes de comprar.</OptionDesc>
          </OptionInfo>
        </OptionCard>

        <OptionCard 
          $active={activeTab === 'sectors'} 
          onClick={() => setActiveTab('sectors')}
        >
          <IconWrapper $active={activeTab === 'sectors'}>
            <PieChart size={32} />
          </IconWrapper>
          <OptionInfo>
            <OptionTitle>Sectores</OptionTitle>
            <OptionDesc>Analiza y define la tendencia de los sectores GICS clave.</OptionDesc>
          </OptionInfo>
        </OptionCard>

        <OptionCard 
          $active={activeTab === 'countries'} 
          onClick={() => setActiveTab('countries')}
        >
          <IconWrapper $active={activeTab === 'countries'}>
            <Globe size={32} />
          </IconWrapper>
          <OptionInfo>
            <OptionTitle>Países</OptionTitle>
            <OptionDesc>Monitorea el flujo de capital en los principales mercados globales.</OptionDesc>
          </OptionInfo>
        </OptionCard>
      </OptionsGrid>
    </MenuContainer>
  );
};

// ─── Estilos ─────────────────────────────────────────────────────────────────

const MenuContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const MenuHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const MenuTitle = styled.h2`
  font-family: 'Unbounded', sans-serif;
  font-size: 2rem;
  color: white;
  margin: 0;
`;

const MenuSubtitle = styled.p`
  color: #94a3b8;
  font-size: 1.1rem;
  margin: 0;
`;

const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
`;

const OptionCard = styled.div`
  background: ${props => props.$active ? 'rgba(52, 211, 153, 0.1)' : '#1e293b'};
  border: 1px solid ${props => props.$active ? 'rgba(52, 211, 153, 0.4)' : 'rgba(255, 255, 255, 0.05)'};
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-4px);
    background: ${props => props.$active ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.03)'};
    border-color: ${props => props.$active ? 'rgba(52, 211, 153, 0.5)' : 'rgba(255, 255, 255, 0.1)'};
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
  }
`;

const IconWrapper = styled.div`
  background: ${props => props.$active ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255, 255, 255, 0.05)'};
  color: ${props => props.$active ? 'white' : '#94a3b8'};
  padding: 1rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  ${OptionCard}:hover & {
    color: ${props => props.$active ? 'white' : '#cbd5e1'};
    background: ${props => props.$active ? 'linear-gradient(135deg, #34d399 0%, #10b981 100%)' : 'rgba(255, 255, 255, 0.1)'};
  }
`;

const OptionInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const OptionTitle = styled.h3`
  font-family: 'Unbounded', sans-serif;
  font-size: 1.25rem;
  color: white;
  margin: 0;
`;

const OptionDesc = styled.p`
  color: #94a3b8;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0;
`;

export default LabMenu;
