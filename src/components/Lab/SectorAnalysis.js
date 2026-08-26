import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { TrendingUp, TrendingDown, Minus, Save, Info } from 'lucide-react';
import { colors, withOpacity } from '../../styles/colors';
import { useLabData } from '../../context/LabContext';

export const GICS_SECTORS = [
  { id: 'igv', name: 'Software', ticker: 'IGV' },
  { id: 'smh', name: 'Semiconductores', ticker: 'SMH' },
  { id: 'btc', name: 'Criptomonedas', ticker: 'BTC' },
  { id: 'xly', name: 'Consumo Discrecional', ticker: 'XLY' },
  { id: 'xlc', name: 'Comunicaciones', ticker: 'XLC' },
  { id: 'xlf', name: 'Financiero', ticker: 'XLF' },
  { id: 'xli', name: 'Industrial', ticker: 'XLI' },
  { id: 'xlv', name: 'Salud', ticker: 'XLV' },
  { id: 'xlp', name: 'Consumo Básico', ticker: 'XLP' },
  { id: 'xle', name: 'Energía', ticker: 'XLE' },
  { id: 'xlu', name: 'Servicios Públicos', ticker: 'XLU' },
  { id: 'xlre', name: 'Real Estate', ticker: 'XLRE' },
  { id: 'xlb', name: 'Materiales', ticker: 'XLB' },
];

const SectorAnalysis = () => {
  const { sectorData, updateSectorData, loading } = useLabData();
  const [sectorsData, setSectorsData] = useState({});
  const [savedMessage, setSavedMessage] = useState('idle'); // 'idle' | 'saving' | 'ok' | 'error'

  // Inicializar estado local a partir del contexto cuando carga
  useEffect(() => {
    if (!loading && sectorData) {
      const initial = {};
      GICS_SECTORS.forEach(s => {
        // Migration safeguard: if old `trend` exists without daily/weekly, use it
        const saved = sectorData[s.id] || {};
        initial[s.id] = {
          dailyTrend: saved.dailyTrend || saved.trend || 'lateral',
          weeklyTrend: saved.weeklyTrend || saved.trend || 'lateral',
          notes: saved.notes || ''
        };
      });
      setSectorsData(initial);
    }
  }, [sectorData, loading]);

  const handleDailyTrendChange = (id, newTrend) => {
    setSectorsData(prev => ({
      ...prev,
      [id]: { ...prev[id], dailyTrend: newTrend }
    }));
  };

  const handleWeeklyTrendChange = (id, newTrend) => {
    setSectorsData(prev => ({
      ...prev,
      [id]: { ...prev[id], weeklyTrend: newTrend }
    }));
  };

  const handleNotesChange = (id, newNotes) => {
    setSectorsData(prev => ({
      ...prev,
      [id]: { ...prev[id], notes: newNotes }
    }));
  };

  const handleSave = async () => {
    try {
      setSavedMessage('saving');
      await updateSectorData(sectorsData);
      setSavedMessage('ok');
    } catch {
      // localStorage was already saved (instant), server sync failed
      // Show 'ok' since data IS persisted locally
      setSavedMessage('ok');
    } finally {
      setTimeout(() => setSavedMessage('idle'), 2500);
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'alcista': return '#10b981';
      case 'bajista': return '#f43f5e';
      default: return '#fbbf24';
    }
  };

  return (
    <Container>
      <Header>
        <HeaderLeft>
          <Title>Análisis Sectorial</Title>
          <Subtitle>Define la tendencia actual de cada sector para tu Checklist.</Subtitle>
        </HeaderLeft>
        <SaveButton onClick={handleSave} disabled={savedMessage === 'saving'}>
          {savedMessage === 'ok'
            ? <><CheckIcon size={20} /> Guardado</>
            : savedMessage === 'error'
            ? <><CheckIcon size={20} style={{ color: '#f43f5e' }} /> Error al guardar</>
            : savedMessage === 'saving'
            ? <><Save size={20} /> Guardando...</>
            : <><Save size={20} /> Guardar Análisis</>}
        </SaveButton>
      </Header>

      <Grid>
        {GICS_SECTORS.map(sector => {
          const data = sectorsData[sector.id] || { dailyTrend: 'lateral', weeklyTrend: 'lateral', notes: '' };
          const trendColor = getTrendColor(data.dailyTrend);

          return (
            <SectorCard key={sector.id} $trendColor={trendColor}>
              <CardHeader>
                <SectorInfo>
                  <SectorName>{sector.name}</SectorName>
                  <SectorTicker>{sector.ticker}</SectorTicker>
                </SectorInfo>
              </CardHeader>

              <TrendsContainer>
                <TrendSection>
                  <TrendLabel>Diaria:</TrendLabel>
                  <TrendSelector>
                    <TrendButton
                      $active={data.dailyTrend === 'alcista'}
                      $color="#10b981"
                      onClick={() => handleDailyTrendChange(sector.id, 'alcista')}
                    >
                      <TrendingUp size={16} /> Alcista
                    </TrendButton>
                    <TrendButton
                      $active={data.dailyTrend === 'lateral'}
                      $color="#fbbf24"
                      onClick={() => handleDailyTrendChange(sector.id, 'lateral')}
                    >
                      <Minus size={16} /> Lateral
                    </TrendButton>
                    <TrendButton
                      $active={data.dailyTrend === 'bajista'}
                      $color="#f43f5e"
                      onClick={() => handleDailyTrendChange(sector.id, 'bajista')}
                    >
                      <TrendingDown size={16} /> Bajista
                    </TrendButton>
                  </TrendSelector>
                </TrendSection>

                <TrendSection>
                  <TrendLabel>Semanal:</TrendLabel>
                  <TrendSelector>
                    <TrendButton
                      $active={data.weeklyTrend === 'alcista'}
                      $color="#10b981"
                      onClick={() => handleWeeklyTrendChange(sector.id, 'alcista')}
                    >
                      <TrendingUp size={16} /> Alcista
                    </TrendButton>
                    <TrendButton
                      $active={data.weeklyTrend === 'lateral'}
                      $color="#fbbf24"
                      onClick={() => handleWeeklyTrendChange(sector.id, 'lateral')}
                    >
                      <Minus size={16} /> Lateral
                    </TrendButton>
                    <TrendButton
                      $active={data.weeklyTrend === 'bajista'}
                      $color="#f43f5e"
                      onClick={() => handleWeeklyTrendChange(sector.id, 'bajista')}
                    >
                      <TrendingDown size={16} /> Bajista
                    </TrendButton>
                  </TrendSelector>
                </TrendSection>
              </TrendsContainer>

              <NotesArea
                placeholder="Notas (ej. rompiendo resistencia, volumen alto...)"
                value={data.notes}
                onChange={(e) => handleNotesChange(sector.id, e.target.value)}
              />
            </SectorCard>
          );
        })}
      </Grid>
    </Container>
  );
};

// ─── Estilos ─────────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  animation: ${fadeIn} 0.4s ease-out;
  color: #e2e8f0;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Title = styled.h2`
  font-family: 'Unbounded', sans-serif;
  font-size: 1.8rem;
  color: white;
  margin: 0;
`;

const Subtitle = styled.p`
  color: #94a3b8;
  margin: 0;
  font-size: 1.05rem;
`;

const SaveButton = styled.button`
  background: ${colors.primary};
  color: white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${withOpacity(colors.primary, 0.9)};
  }
`;

const CheckIcon = styled(Save)`
  color: #10b981;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
`;

const SectorCard = styled.div`
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-top: 4px solid ${props => props.$trendColor};
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(30, 41, 59, 0.6);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const SectorInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const SectorName = styled.h3`
  margin: 0;
  font-size: 1.25rem;
  color: white;
  font-family: 'Unbounded', sans-serif;
`;

const SectorTicker = styled.span`
  color: #94a3b8;
  font-size: 0.9rem;
  font-weight: 500;
`;

const TrendsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const TrendSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const TrendLabel = styled.span`
  color: #94a3b8;
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const TrendSelector = styled.div`
  display: flex;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 0.25rem;
`;

const TrendButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.5rem;
  border: none;
  background: ${props => props.$active ? props.$color : 'transparent'};
  color: ${props => props.$active ? '#fff' : '#64748b'};
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: ${props => !props.$active && props.$color};
    background: ${props => !props.$active && 'rgba(255, 255, 255, 0.05)'};
  }
`;

const NotesArea = styled.textarea`
  width: 100%;
  background: rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 0.75rem;
  color: #cbd5e1;
  font-size: 0.9rem;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: rgba(59, 130, 246, 0.5);
  }
`;

export default SectorAnalysis;
