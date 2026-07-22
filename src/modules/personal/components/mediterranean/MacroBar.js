// components/mediterranean/MacroBar.js — Barra visual de macronutrientes
import React from 'react';
import styled from 'styled-components';

const MacroBar = ({ calories, protein, carbs, fat, fiber }) => {
  const total = (protein || 0) * 4 + (carbs || 0) * 4 + (fat || 0) * 9;
  const proteinPct = total > 0 ? Math.round((protein * 4 / total) * 100) : 0;
  const carbsPct = total > 0 ? Math.round((carbs * 4 / total) * 100) : 0;
  const fatPct = total > 0 ? Math.round((fat * 9 / total) * 100) : 0;

  return (
    <Container>
      <Header>
        <CalCard>
          <CalValue>{calories || '—'}</CalValue>
          <CalLabel>kcal</CalLabel>
        </CalCard>
        <MacroCards>
          {protein != null && (
            <MacroCard $color="#6B8E23">
              <MacroValue>{protein}g</MacroValue>
              <MacroLabel>Proteínas</MacroLabel>
              <MacroPct>{proteinPct}%</MacroPct>
            </MacroCard>
          )}
          {carbs != null && (
            <MacroCard $color="#2E6E9E">
              <MacroValue>{carbs}g</MacroValue>
              <MacroLabel>Carbos</MacroLabel>
              <MacroPct>{carbsPct}%</MacroPct>
            </MacroCard>
          )}
          {fat != null && (
            <MacroCard $color="#C49A1A">
              <MacroValue>{fat}g</MacroValue>
              <MacroLabel>Grasas</MacroLabel>
              <MacroPct>{fatPct}%</MacroPct>
            </MacroCard>
          )}
          {fiber != null && (
            <MacroCard $color="#10b981">
              <MacroValue>{fiber}g</MacroValue>
              <MacroLabel>Fibra</MacroLabel>
            </MacroCard>
          )}
        </MacroCards>
      </Header>

      {total > 0 && (
        <BarContainer>
          <BarSegment $pct={proteinPct} $color="#6B8E23" title={`Proteínas ${proteinPct}%`} />
          <BarSegment $pct={carbsPct} $color="#2E6E9E" title={`Carbohidratos ${carbsPct}%`} />
          <BarSegment $pct={fatPct} $color="#C49A1A" title={`Grasas ${fatPct}%`} />
        </BarContainer>
      )}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Header = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  flex-wrap: wrap;
`;

const CalCard = styled.div`
  background: rgba(196, 154, 26, 0.12);
  border: 1px solid rgba(196, 154, 26, 0.25);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  text-align: center;
  flex-shrink: 0;
`;

const CalValue = styled.div`
  font-family: 'Unbounded', sans-serif;
  font-size: 1.4rem;
  font-weight: 700;
  color: #C49A1A;
`;

const CalLabel = styled.div`
  font-size: 0.72rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const MacroCards = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  flex: 1;
`;

const MacroCard = styled.div`
  background: ${p => `${p.$color}10`};
  border: 1px solid ${p => `${p.$color}25`};
  border-radius: 10px;
  padding: 0.6rem 0.8rem;
  min-width: 70px;
  text-align: center;
`;

const MacroValue = styled.div`
  font-weight: 700;
  font-size: 1rem;
  color: #e2e8f0;
`;

const MacroLabel = styled.div`
  font-size: 0.7rem;
  color: #64748b;
`;

const MacroPct = styled.div`
  font-size: 0.7rem;
  color: #94a3b8;
  margin-top: 2px;
`;

const BarContainer = styled.div`
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  background: rgba(255,255,255,0.04);
  gap: 1px;
`;

const BarSegment = styled.div`
  height: 100%;
  width: ${p => p.$pct}%;
  background: ${p => p.$color};
  border-radius: 4px;
  transition: width 0.6s ease;
`;

export default MacroBar;
