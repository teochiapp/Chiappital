import React, { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { CheckCircle2, XCircle, Search, AlertCircle, ChevronRight, RotateCcw, Save, Clock, Trash2, PieChart, Globe, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { GICS_SECTORS } from './SectorAnalysis';
import { REGIONS } from './CountryAnalysis';
import { colors, withOpacity } from '../../styles/colors';
import { useLabData } from '../../context/LabContext';

const restrictions = [
  { id: 'global_trend', expected: true, question: '¿La tendencia del mercado global es ALCISTA o LATERAL?', negativeDesc: 'No comprar acciones cuando la tendencia del mercado global es bajista.' },
  { id: 'sector_trend', expected: true, question: '¿El sector de la acción es ALCISTA o LATERAL?', negativeDesc: 'No comprar acciones pertenecientes a un sector bajista.' },
  { id: 'earnings_report', expected: false, question: '¿La acción está próxima a un reporte de ganancias?', negativeDesc: 'No mantener posiciones en una acción durante un reporte de ganancias.' },
  { id: 'known_events', expected: false, question: '¿Hay eventos conocidos próximos (ej. elecciones)?', negativeDesc: 'No mantener posiciones durante eventos conocidos (por ejemplo, elecciones).' },
  { id: 'risk_reward', expected: false, question: '¿Se está invirtiendo en exceso en esta posición, rompiendo el plan de riesgo-beneficio?', negativeDesc: 'Seguir el plan de riesgo-beneficio y no invertir en exceso en una sola posición.' },
  { id: 'ema_30_price', expected: true, question: '¿El precio está POR ENCIMA de la EMA de 30 semanal?', negativeDesc: 'No compre un valor por debajo de la EMA de 30 semanal.' },
  { id: 'ema_30_trend', expected: true, question: '¿La EMA de 30 semanal es ASCENDENTE?', negativeDesc: 'No compre un valor que tenga una EMA de 30 semanas descendente, aunque el valor esté por encima de la MM.' },
  { id: 'entry_point', expected: false, question: '¿El precio está demasiado extendido desde el punto ideal?', negativeDesc: 'No importa lo alcista que sea un valor, no lo compre demasiado tarde en el avance.' },
  { id: 'breakout_volume', expected: true, question: '¿Hay FUERTE VOLUMEN acompañando la fuga (breakout)?', negativeDesc: 'No compre un valor que tenga poco volumen en la fuga.' },
  { id: 'relative_strength', expected: true, question: '¿El valor muestra FUERTE fuerza relativa?', negativeDesc: 'No compre un valor que muestre poca fuerza relativa.' },
  { id: 'overhead_resistance', expected: false, question: '¿Hay una fuerte resistencia por encima cercana?', negativeDesc: 'No compre un valor que tenga cerca una fuerte resistencia por encima.' },
  { id: 'bottom_fishing', expected: true, question: '¿Está comprando en una fuga (y no adivinando suelos)?', negativeDesc: 'No se imagine los suelos. Compre en las fugas por encima de la resistencia.' }
];

const MethodologyChecklist = ({ initialTicker }) => {
  const { checklistHistory, updateChecklistHistory, sectorData, countryData, loading } = useLabData();
  const [ticker, setTicker] = useState(initialTicker || '');
  const [activeTicker, setActiveTicker] = useState(initialTicker || null);
  const [answers, setAnswers] = useState({});
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

  React.useEffect(() => {
    if (initialTicker) {
      setTicker(initialTicker);
      setActiveTicker(initialTicker);
      setAnswers({});
    }
  }, [initialTicker]);

  const handleStart = (e) => {
    e.preventDefault();
    if (ticker.trim()) {
      setActiveTicker(ticker.toUpperCase());
      setAnswers({});
    }
  };

  const handleAnswer = (id, value) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleReset = () => {
    setTicker('');
    setActiveTicker(null);
    setAnswers({});
  };

  const answeredCount = Object.keys(answers).length;
  const isComplete = answeredCount === restrictions.length;
  const passedAll = isComplete && restrictions.every(r => answers[r.id] === r.expected);
  const failedRestrictions = restrictions.filter(r => answers[r.id] !== undefined && answers[r.id] !== r.expected);

  const progressPercentage = (answeredCount / restrictions.length) * 100;

  const handleSaveAndReset = () => {
    const newRecord = {
      id: Date.now(),
      ticker: activeTicker,
      date: new Date().toISOString(),
      passedAll,
      failedCount: failedRestrictions.length,
      failedReasons: failedRestrictions.map(r => r.negativeDesc)
    };
    const updatedHistory = [newRecord, ...checklistHistory];
    updateChecklistHistory(updatedHistory);

    setTicker('');
    setActiveTicker(null);
    setAnswers({});
  };
  const handleDeleteHistory = (id, e) => {
    e.stopPropagation();
    const updatedHistory = checklistHistory.filter(record => record.id !== id);
    updateChecklistHistory(updatedHistory);
  };

  return (
    <Container>
      {!activeTicker ? (
        <>
          <StartScreen>
            <IconCircle>
              <Search size={40} color="#10b981" />
            </IconCircle>
            <Title>Evaluar Nueva Operación</Title>
            <Subtitle>Ingresa el ticker de la acción para verificar si cumple con las reglas de la metodología.</Subtitle>
            <SearchForm onSubmit={handleStart}>
              <TickerInput
                type="text"
                placeholder="Ej. AAPL"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                maxLength={10}
              />
              <StartButton type="submit" disabled={!ticker.trim()}>
                Comenzar Evaluación
                <ChevronRight size={20} />
              </StartButton>
            </SearchForm>
          </StartScreen>

          {checklistHistory && checklistHistory.length > 0 && (
            <HistorySection>
              <HistoryTitle>
                <Clock size={20} /> Historial de Evaluaciones
              </HistoryTitle>
              <HistoryList>
                {checklistHistory.map(record => {
                  const isExpanded = expandedHistoryId === record.id;
                  return (
                    <HistoryCardContainer key={record.id}>
                      <HistoryCard
                        $passed={record.passedAll}
                        onClick={() => setExpandedHistoryId(isExpanded ? null : record.id)}
                      >
                        <HistoryHeader>
                          <HistoryTicker>{record.ticker}</HistoryTicker>
                          <HistoryDate>{new Date(record.date).toLocaleDateString()}</HistoryDate>
                        </HistoryHeader>
                        <HistoryRightSide>
                          <HistoryStatus $passed={record.passedAll}>
                            {record.passedAll ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                            {record.passedAll ? 'Aprobada' : `Rechazada (${record.failedCount})`}
                          </HistoryStatus>
                          <DeleteButton onClick={(e) => handleDeleteHistory(record.id, e)} title="Eliminar del historial">
                            <Trash2 size={16} />
                          </DeleteButton>
                        </HistoryRightSide>
                      </HistoryCard>

                      {isExpanded && (
                        <HistoryDetails>
                          {record.passedAll ? (
                            <SuccessDetail>
                              <CheckCircle2 size={16} />
                              Cumple con todas las restricciones de la metodología.
                            </SuccessDetail>
                          ) : (
                            <FailureDetailList>
                              {record.failedReasons?.map((reason, idx) => (
                                <FailureDetailItem key={idx}>
                                  <AlertCircle size={14} />
                                  {reason}
                                </FailureDetailItem>
                              ))}
                            </FailureDetailList>
                          )}
                        </HistoryDetails>
                      )}
                    </HistoryCardContainer>
                  );
                })}
              </HistoryList>
            </HistorySection>
          )}
        </>
      ) : (
        <EvaluationScreen>
          <HeaderSection>
            <HeaderInfo>
              <TickerBadge>{activeTicker}</TickerBadge>
              <ProgressText>
                {answeredCount} de {restrictions.length} restricciones evaluadas
              </ProgressText>
            </HeaderInfo>
            <ProgressBarContainer>
              <ProgressBar $progress={progressPercentage} />
            </ProgressBarContainer>
            <ResetButton onClick={handleReset} title="Evaluar otra acción">
              <RotateCcw size={18} />
            </ResetButton>
          </HeaderSection>

          <EvaluationLayout>
            <ChecklistGrid>
              {restrictions.map((restriction, index) => {
                const answer = answers[restriction.id];
                const isAnswered = answer !== undefined;
                const isPassed = answer === restriction.expected;

                return (
                  <ChecklistItem key={restriction.id} $isAnswered={isAnswered} $passed={isPassed}>
                    <QuestionHeader>
                      <QuestionNumber>{index + 1}</QuestionNumber>
                      <QuestionText>{restriction.question}</QuestionText>
                    </QuestionHeader>

                    <ActionButtons>
                      <ChoiceButton
                        $type="yes"
                        $selected={answer === true}
                        onClick={() => handleAnswer(restriction.id, true)}
                      >
                        <CheckCircle2 size={18} /> Sí
                      </ChoiceButton>
                      <ChoiceButton
                        $type="no"
                        $selected={answer === false}
                        onClick={() => handleAnswer(restriction.id, false)}
                      >
                        <XCircle size={18} /> No
                      </ChoiceButton>
                    </ActionButtons>

                    {isAnswered && !isPassed && (
                      <WarningMessage>
                        <AlertCircle size={16} />
                        {restriction.negativeDesc}
                      </WarningMessage>
                    )}
                  </ChecklistItem>
                );
              })}

              {isComplete && (
                <ResultPanel $passed={passedAll}>
                  <ResultIconWrapper $passed={passedAll}>
                    {passedAll ? <CheckCircle2 size={48} /> : <XCircle size={48} />}
                  </ResultIconWrapper>
                  <ResultTitle $passed={passedAll}>
                    {passedAll ? 'Operación Aprobada' : 'Operación Rechazada'}
                  </ResultTitle>
                  <ResultSubtitle>
                    {passedAll
                      ? `${activeTicker} cumple con todas las restricciones de tu metodología.`
                      : `${activeTicker} no superó ${failedRestrictions.length} ${failedRestrictions.length === 1 ? 'restricción' : 'restricciones'}.`}
                  </ResultSubtitle>

                  {!passedAll && (
                    <FailedList>
                      {failedRestrictions.map((r, i) => (
                        <FailedItem key={i}>
                          <AlertCircle size={14} color="#f43f5e" />
                          {r.negativeDesc}
                        </FailedItem>
                      ))}
                    </FailedList>
                  )}

                  <FinishButton $disabled={!isComplete} onClick={handleSaveAndReset}>
                    <Save size={18} />
                    Guardar Resultado
                  </FinishButton>
                </ResultPanel>
              )}
            </ChecklistGrid>

            <ContextPanel>
              <ContextTitle><PieChart size={18} /> Sectores (Tu Análisis)</ContextTitle>
              <ContextList>
                {GICS_SECTORS.map(s => {
                  const sTrend = sectorData[s.id]?.dailyTrend || sectorData[s.id]?.trend;
                  const icon = sTrend === 'alcista' ? <TrendingUp size={16} color="#10b981" /> : (sTrend === 'bajista' ? <TrendingDown size={16} color="#f43f5e" /> : <Minus size={16} color="#fbbf24" />);
                  return (
                    <ContextItem key={s.id}>
                      <ContextLabel>{s.name} ({s.ticker}) {icon}</ContextLabel>
                      <ContextTrend $trend={sTrend}>{sTrend?.toUpperCase()}</ContextTrend>
                    </ContextItem>
                  );
                })}
              </ContextList>

              <ContextTitle style={{ marginTop: '1.5rem' }}><Globe size={18} /> Países</ContextTitle>
              <ContextList>
                {REGIONS.map(r => {
                  const cTrend = countryData[r.id]?.dailyTrend || countryData[r.id]?.trend;
                  const icon = cTrend === 'alcista' ? <TrendingUp size={16} color="#10b981" /> : (cTrend === 'bajista' ? <TrendingDown size={16} color="#f43f5e" /> : <Minus size={16} color="#fbbf24" />);
                  return (
                    <ContextItem key={r.id}>
                      <ContextLabel>{r.name} ({r.ticker}) {icon}</ContextLabel>
                      <ContextTrend $trend={cTrend}>{cTrend?.toUpperCase()}</ContextTrend>
                    </ContextItem>
                  );
                })}
              </ContextList>
            </ContextPanel>
          </EvaluationLayout>
        </EvaluationScreen>
      )}
    </Container>
  );
};

// ─── Estilos ─────────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  width: 100%;
  animation: ${fadeIn} 0.4s ease-out;
`;

// Start Screen
const StartScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: #1e293b;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.3);
`;

const IconCircle = styled.div`
  width: 80px;
  height: 80px;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
`;

const Title = styled.h2`
  font-family: 'Unbounded', sans-serif;
  font-size: 2rem;
  color: white;
  margin: 0 0 0.5rem 0;
  text-align: center;
`;

const Subtitle = styled.p`
  color: #94a3b8;
  font-size: 1.1rem;
  margin: 0 0 2rem 0;
  text-align: center;
  max-width: 500px;
`;

const SearchForm = styled.form`
  display: flex;
  gap: 1rem;
  width: 100%;
  max-width: 500px;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const TickerInput = styled.input`
  flex: 1;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem 1.5rem;
  font-size: 1.25rem;
  color: white;
  text-transform: uppercase;
  font-family: 'Unbounded', sans-serif;
  letter-spacing: 1px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #10b981;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
  }

  &::placeholder {
    color: #475569;
    font-family: 'Inter', sans-serif;
    text-transform: none;
    letter-spacing: normal;
  }
`;

const StartButton = styled.button`
  background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${withOpacity(colors.primary, 0.3)};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #334155;
  }
`;

// Evaluation Screen
const EvaluationScreen = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const HeaderSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #1e293b;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
`;

const HeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const TickerBadge = styled.div`
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-family: 'Unbounded', sans-serif;
  font-size: 1.25rem;
  font-weight: bold;
  letter-spacing: 1px;
`;

const ProgressText = styled.span`
  color: #94a3b8;
  font-size: 1rem;
  font-weight: 500;
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 6px;
  background: #0f172a;
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressBar = styled.div`
  height: 100%;
  background: #10b981;
  width: ${props => props.$progress}%;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
`;

const ResetButton = styled.button`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
  }
`;

const ChecklistGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
`;

const ChecklistItem = styled.div`
  background: ${props => {
    if (!props.$isAnswered) return 'rgba(30, 41, 59, 0.5)';
    return props.$passed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(244, 63, 94, 0.05)';
  }};
  border: 1px solid ${props => {
    if (!props.$isAnswered) return 'rgba(255, 255, 255, 0.05)';
    return props.$passed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)';
  }};
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  transition: all 0.3s ease;

  &:hover {
    background: #1e293b;
    border-color: rgba(255, 255, 255, 0.1);
  }
`;

const QuestionHeader = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-start;
`;

const QuestionNumber = styled.div`
  background: #0f172a;
  color: #64748b;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: bold;
  flex-shrink: 0;
`;

const QuestionText = styled.h4`
  color: #e2e8f0;
  font-size: 1.05rem;
  margin: 0;
  line-height: 1.4;
  font-weight: 500;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
`;

const ChoiceButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  ${props => {
    if (!props.$selected) {
      return css`
        background: rgba(15, 23, 42, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.05);
        color: #94a3b8;
        &:hover {
          background: rgba(15, 23, 42, 0.8);
          color: white;
        }
      `;
    }

    if (props.$type === 'yes') {
      return css`
        background: rgba(16, 185, 129, 0.15);
        border: 1px solid rgba(16, 185, 129, 0.5);
        color: #10b981;
      `;
    }

    return css`
      background: rgba(244, 63, 94, 0.15);
      border: 1px solid rgba(244, 63, 94, 0.5);
      color: #f43f5e;
    `;
  }}
`;

const WarningMessage = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  padding: 1rem;
  background: rgba(244, 63, 94, 0.1);
  border-radius: 8px;
  color: #f43f5e;
  font-size: 0.9rem;
  line-height: 1.5;
  animation: ${fadeIn} 0.3s ease;
  
  svg {
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

const ResultPanel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: ${props => props.$passed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(244, 63, 94, 0.05)'};
  border: 1px solid ${props => props.$passed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'};
  border-radius: 16px;
  padding: 3rem 2rem;
  text-align: center;
  animation: ${fadeIn} 0.5s ease-out;
  margin-top: 1rem;
`;

const ResultIconWrapper = styled.div`
  color: ${props => props.$passed ? '#10b981' : '#f43f5e'};
  margin-bottom: 1rem;
`;

const ResultTitle = styled.h3`
  font-family: 'Unbounded', sans-serif;
  font-size: 2rem;
  color: ${props => props.$passed ? '#10b981' : '#f43f5e'};
  margin: 0 0 1rem 0;
`;

const ResultSubtitle = styled.p`
  color: #e2e8f0;
  font-size: 1.1rem;
  margin: 0 0 2rem 0;
  max-width: 600px;
`;

const FailedList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-width: 700px;
  text-align: left;
`;

const FailedItem = styled.li`
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  background: rgba(15, 23, 42, 0.4);
  padding: 1rem 1.25rem;
  border-radius: 8px;
  border-left: 3px solid #f43f5e;
  color: #cbd5e1;
  font-size: 0.95rem;

  svg {
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

const FinishButton = styled.button`
  background: transparent;
  color: ${props => props.$passed ? '#10b981' : '#f43f5e'};
  border: 1px solid ${props => props.$passed ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'};
  border-radius: 8px;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 2rem;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    background: ${props => props.$passed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)'};
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: transparent;
  }
`;

const HistorySection = styled.div`
  width: 100%;
  max-width: 600px;
  margin-top: 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: ${fadeIn} 0.5s ease-out;
`;

const HistoryTitle = styled.h3`
  font-family: 'Unbounded', sans-serif;
  font-size: 1.3rem;
  color: white;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const EvaluationLayout = styled.div`
  display: flex;
  gap: 2rem;
  align-items: flex-start;
  
  @media (max-width: 1024px) {
    flex-direction: column;
  }
`;

const ContextPanel = styled.div`
  flex: 1;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  position: sticky;
  top: 100px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;

  @media (max-width: 1024px) {
    width: 100%;
    position: static;
    max-height: none;
  }
`;

const ContextTitle = styled.h4`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  font-family: 'Unbounded', sans-serif;
  font-size: 1.1rem;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const ContextList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ContextItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 6px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const ContextLabel = styled.span`
  color: #cbd5e1;
  font-size: 0.9rem;
`;

const ContextTrend = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  background: ${props =>
    props.$trend === 'alcista' ? 'rgba(16, 185, 129, 0.15)' :
      props.$trend === 'bajista' ? 'rgba(244, 63, 94, 0.15)' :
        'rgba(251, 191, 36, 0.15)'};
  color: ${props =>
    props.$trend === 'alcista' ? '#34d399' :
      props.$trend === 'bajista' ? '#fb7185' :
        '#fbbf24'};
`;

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const HistoryCardContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const HistoryCard = styled.div`
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid ${props => props.$passed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'};
  border-left: 4px solid ${props => props.$passed ? '#10b981' : '#f43f5e'};
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(30, 41, 59, 0.8);
    transform: translateX(4px);
  }
`;

const HistoryHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const HistoryTicker = styled.span`
  font-family: 'Unbounded', sans-serif;
  font-size: 1.2rem;
  color: white;
  font-weight: bold;
`;

const HistoryDate = styled.span`
  font-size: 0.85rem;
  color: #94a3b8;
`;

const HistoryStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => props.$passed ? '#10b981' : '#f43f5e'};
  font-weight: 500;
  font-size: 0.95rem;
  background: ${props => props.$passed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)'};
  padding: 0.5rem 0.75rem;
  border-radius: 20px;
`;

const HistoryRightSide = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const DeleteButton = styled.button`
  background: transparent;
  border: none;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: #f43f5e;
    background: rgba(244, 63, 94, 0.1);
  }
`;

const HistoryDetails = styled.div`
  margin-top: 0.5rem;
  padding: 1rem 1.25rem;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  animation: ${fadeIn} 0.3s ease;
`;

const SuccessDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #10b981;
  font-size: 0.95rem;
`;

const FailureDetailList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const FailureDetailItem = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  color: #cbd5e1;
  font-size: 0.9rem;
  
  svg {
    color: #f43f5e;
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

export default MethodologyChecklist;
