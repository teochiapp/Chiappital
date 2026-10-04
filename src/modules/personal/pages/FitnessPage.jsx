import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { usePersonalHub } from '../../../context/PersonalHubContext';
import { Dumbbell, Trophy, Activity, Edit2, CheckCircle, TrendingUp } from 'lucide-react';
import { colors } from '../../../styles/colors';

const p = colors.personal;

const ROUTINE = {
  'Día 1': [
    'Press de Banca',
    'Press de Hombro en Máquina',
    'Press de Banca con Agarre Cerrado',
    'Elevaciones Laterales',
    'Prensa de Piernas',
    'Extensiones de Tríceps'
  ],
  'Día 2': [
    'Dominadas',
    'Curl de Piernas Acostado',
    'Jalón de Espalda',
    'Press de Banca',
    'Curl con Barra EZ',
    'Abdominales en Polea Alta'
  ],
  'Día 3': [
    'Sentadilla',
    'Press de Banca',
    'Remo con Mancuerna',
    'Elevación de Gemelos en Máquina',
    'Extensión de Piernas',
    'Curl con Mancuernas'
  ]
};

const FitnessPage = () => {
  const { fitness, loading, updateFitnessPr, logWorkout } = usePersonalHub();
  const [editingExercise, setEditingExercise] = useState(null); // stores `${day}-${ex}`
  const [prValue, setPrValue] = useState('');

  if (loading) return <Container><LoadingText>Cargando...</LoadingText></Container>;

  const prs = fitness?.prs || [];
  const weeklyWorkouts = fitness?.weekly_workouts || 0;
  
  // Encontrar último PR (el más reciente)
  const lastPr = [...prs].sort((a, b) => new Date(b.record_date) - new Date(a.record_date))[0];

  const getPrFor = (ex) => prs.find(p => p.exercise === ex);

  const handleEditPr = (day, ex) => {
    const current = getPrFor(ex);
    setPrValue(current ? current.record_value : '');
    setEditingExercise(`${day}-${ex}`);
  };

  const handleSavePr = async (e, ex) => {
    e.preventDefault();
    if (!prValue.trim()) return;
    await updateFitnessPr(ex, prValue);
    setEditingExercise(null);
    setPrValue('');
  };

  const handleLogWorkout = async () => {
    await logWorkout();
  };

  return (
    <Container>
      <TopBar>
        <div>
          <PageTitle>Fitness</PageTitle>
          <PageSubtitle>Registro de rutinas y récords personales</PageSubtitle>
        </div>
      </TopBar>

      <DashboardGrid>
        <DashCard>
          <DashIcon><Activity size={24} color="#60a5fa" /></DashIcon>
          <DashInfo>
            <DashLabel>Entrenamientos (Semana)</DashLabel>
            <DashValue>{weeklyWorkouts}</DashValue>
          </DashInfo>
          <LogWorkoutBtn onClick={handleLogWorkout} title="Marcar entrenamiento completado hoy">
            <CheckCircle size={18} />
          </LogWorkoutBtn>
        </DashCard>

        <DashCard>
          <DashIcon><Trophy size={24} color="#fbbf24" /></DashIcon>
          <DashInfo>
            <DashLabel>Último PR</DashLabel>
            {lastPr ? (
              <>
                <DashValue>{lastPr.record_value}</DashValue>
                <DashSub>{lastPr.exercise} ({lastPr.record_date.split('T')[0]})</DashSub>
              </>
            ) : (
              <DashSub>Ninguno todavía</DashSub>
            )}
          </DashInfo>
        </DashCard>

        <DashCard>
          <DashIcon><TrendingUp size={24} color="#34d399" /></DashIcon>
          <DashInfo>
            <DashLabel>Los 3 Grandes</DashLabel>
            <BigThree>
              <B3Item>
                <span>Banca:</span> {getPrFor('Press de Banca')?.record_value || '-'}
              </B3Item>
              <B3Item>
                <span>Sentadilla:</span> {getPrFor('Sentadilla')?.record_value || '-'}
              </B3Item>
              <B3Item>
                <span>Dominadas:</span> {getPrFor('Dominadas')?.record_value || '-'}
              </B3Item>
            </BigThree>
          </DashInfo>
        </DashCard>
      </DashboardGrid>

      <RoutineContainer>
        {Object.entries(ROUTINE).map(([day, exercises]) => (
          <DayColumn key={day}>
            <DayTitle>{day}</DayTitle>
            <ExerciseList>
              {exercises.map(ex => {
                const pr = getPrFor(ex);
                const isEditing = editingExercise === `${day}-${ex}`;
                return (
                  <ExerciseCard key={ex}>
                    <ExerciseName>{ex}</ExerciseName>
                    
                    {isEditing ? (
                      <PrForm onSubmit={(e) => handleSavePr(e, ex)}>
                        <PrInput 
                          autoFocus
                          placeholder="Ej: 85 kg"
                          value={prValue}
                          onChange={e => setPrValue(e.target.value)}
                        />
                        <SaveBtn type="submit"><CheckCircle size={16}/></SaveBtn>
                        <CancelBtn type="button" onClick={() => setEditingExercise(null)}>Cancelar</CancelBtn>
                      </PrForm>
                    ) : (
                      <PrDisplay>
                        <PrValue>{pr ? pr.record_value : 'Sin PR'}</PrValue>
                        {pr && <PrDate>{pr.record_date.split('T')[0]}</PrDate>}
                        <EditBtn onClick={() => handleEditPr(day, ex)}><Edit2 size={14}/></EditBtn>
                      </PrDisplay>
                    )}
                  </ExerciseCard>
                );
              })}
            </ExerciseList>
          </DayColumn>
        ))}
      </RoutineContainer>
    </Container>
  );
};

// --- Styles ---

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  color: #e2e8f0;
  padding: 2rem;
  animation: ${fadeUp} 0.35s ease-out;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 1.25rem 1rem;
  }

  @media (max-width: 480px) {
    padding: 1rem 0.75rem;
  }

  @media (max-width: 350px) {
    padding: 0.75rem 0.5rem;
  }
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
`;

const PageTitle = styled.h1`
  font-family: 'Unbounded', sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.25rem 0;
`;

const PageSubtitle = styled.p`
  color: #64748b;
  margin: 0;
  font-size: 0.95rem;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const DashCard = styled.div`
  background: #0f172a;
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  position: relative;
`;

const DashIcon = styled.div`
  background: rgba(255,255,255,0.03);
  padding: 1rem;
  border-radius: 12px;
`;

const DashInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const DashLabel = styled.div`
  color: #64748b;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
`;

const DashValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
`;

const DashSub = styled.div`
  font-size: 0.75rem;
  color: #475569;
  margin-top: 0.2rem;
`;

const BigThree = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.25rem;
`;

const B3Item = styled.div`
  font-size: 0.85rem;
  color: #e2e8f0;
  span { color: #64748b; }
`;

const LogWorkoutBtn = styled.button`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: ${p.primaryLight}20;
  color: ${p.primaryLight};
  border: 1px solid ${p.primaryLight}40;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: ${p.primaryLight};
    color: white;
    transform: scale(1.05);
  }
`;

const RoutineContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
`;

const DayColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const DayTitle = styled.h2`
  font-family: 'Unbounded', sans-serif;
  font-size: 1.25rem;
  color: white;
  margin: 0 0 0.5rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.05);
`;

const ExerciseList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ExerciseCard = styled.div`
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: all 0.2s;
  &:hover { background: rgba(255,255,255,0.04); }
`;

const ExerciseName = styled.div`
  font-weight: 600;
  color: white;
  font-size: 0.95rem;
`;

const PrDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const PrValue = styled.span`
  color: ${p.primaryLight};
  font-weight: 700;
  background: ${p.primaryLight}15;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.85rem;
`;

const PrDate = styled.span`
  color: #64748b;
  font-size: 0.75rem;
`;

const EditBtn = styled.button`
  background: transparent;
  border: none;
  color: #475569;
  cursor: pointer;
  padding: 0.25rem;
  margin-left: auto;
  transition: color 0.2s;
  &:hover { color: white; }
`;

const PrForm = styled.form`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PrInput = styled.input`
  background: #0f172a;
  border: 1px solid ${p.primaryLight}50;
  border-radius: 6px;
  color: white;
  padding: 0.4rem 0.5rem;
  font-size: 0.85rem;
  width: 120px;
  outline: none;
`;

const SaveBtn = styled.button`
  background: ${p.primaryLight};
  border: none;
  border-radius: 6px;
  color: white;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  &:hover { opacity: 0.9; }
`;

const CancelBtn = styled.button`
  background: transparent;
  border: 1px solid rgba(255,255,255,0.1);
  color: #94a3b8;
  border-radius: 6px;
  padding: 0.4rem 0.5rem;
  font-size: 0.8rem;
  cursor: pointer;
  &:hover { color: white; border-color: rgba(255,255,255,0.3); }
`;

const LoadingText = styled.div`
  color: #64748b;
  padding: 4rem;
  text-align: center;
`;

export default FitnessPage;
