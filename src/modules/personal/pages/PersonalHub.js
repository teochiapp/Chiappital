// modules/personal/pages/PersonalHub.js — Dashboard principal del Personal Hub
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import {
  Flame, Target, CheckCircle2, Circle, TrendingUp, BookOpen,
  Dumbbell, Globe, Calendar, ArrowRight, Leaf, Sparkles, Clock, Brain
} from 'lucide-react';
import { usePersonalHub } from '../../../context/PersonalHubContext';
import { colors } from '../../../styles/colors';
import { getUTC3DateString } from '../../../utils/helpers';

const p = colors.personal;

const PersonalHub = () => {
  const navigate = useNavigate();
  const { habits, goals, loading, toggleHabit } = usePersonalHub();

  const today = getUTC3DateString();

  const todayDayOfWeek = new Date().getDay();

  const todayHabits = useMemo(() => {
    return habits
      .filter(h => (h.days_of_week || [0,1,2,3,4,5,6]).includes(todayDayOfWeek))
      .map(h => ({
        ...h,
        completedToday: (h.completions || []).includes(today),
      }));
  }, [habits, today, todayDayOfWeek]);

  const completedToday = todayHabits.filter(h => h.completedToday).length;
  const totalHabits = todayHabits.length;

  // Calcular racha actual (días consecutivos con al menos 1 hábito completado)
  const currentStreak = useMemo(() => {
    if (!habits.length) return 0;
    let streak = 0;
    const date = new Date();
    while (true) {
      const dateStr = getUTC3DateString(date);
      const anyDone = habits.some(h => (h.completions || []).includes(dateStr));
      if (!anyDone && dateStr !== today) break;
      if (anyDone) streak++;
      date.setDate(date.getDate() - 1);
      if (streak > 365) break;
    }
    return streak;
  }, [habits, today]);

  const activeGoals = goals.filter(g => g.status === 'active');

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const getCategoryEmoji = (cat) => {
    const map = { salud: '💪', carrera: '🚀', aprendizaje: '📚', relaciones: '❤️', viajes: '✈️', desarrollo: '🌱' };
    return map[cat] || '🎯';
  };

  // Últimos 7 días para el resumen de actividad
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = getUTC3DateString(d);
      const dayOfWeek = d.getDay();
      
      const scheduledHabits = habits.filter(h => (h.days_of_week || [0,1,2,3,4,5,6]).includes(dayOfWeek));
      const scheduledCount = scheduledHabits.length;
      const completedCount = scheduledHabits.filter(h => (h.completions || []).includes(dateStr)).length;
      
      return { dateStr, completedCount, scheduledCount, dayLabel: d.toLocaleDateString('es', { weekday: 'short' }).slice(0, 2) };
    });
  }, [habits]);

  return (
    <Container>
      {/* Hero Header */}
      <HeroSection>
        <HeroGlow />
        <HeroContent>
          <HubBadge>
            <Leaf size={14} />
            Personal Hub
          </HubBadge>
          <GreetingTitle>{greeting()}, Teo 👋</GreetingTitle>
          <GreetingSubtitle>Aquí está tu resumen de hoy</GreetingSubtitle>
        </HeroContent>

        <StatsRow>
          <StatCard>
            <StatIcon color={p.primaryLight}><Flame size={22} /></StatIcon>
            <StatNumber>{currentStreak}</StatNumber>
            <StatLabel>días de racha</StatLabel>
          </StatCard>
          <StatCard>
            <StatIcon color="#fbbf24"><Target size={22} /></StatIcon>
            <StatNumber>{activeGoals.length}</StatNumber>
            <StatLabel>objetivos activos</StatLabel>
          </StatCard>
          <StatCard>
            <StatIcon color={p.primaryLight}><CheckCircle2 size={22} /></StatIcon>
            <StatNumber>{completedToday}/{totalHabits}</StatNumber>
            <StatLabel>hábitos hoy</StatLabel>
          </StatCard>
          <StatCard>
            <StatIcon color="#818cf8"><Sparkles size={22} /></StatIcon>
            <StatNumber>
              {totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0}%
            </StatNumber>
            <StatLabel>completado</StatLabel>
          </StatCard>
        </StatsRow>
      </HeroSection>

      <MainGrid>
        {/* Panel de hábitos de hoy */}
        <Panel>
          <PanelHeader>
            <PanelTitle>
              <CheckCircle2 size={18} color={p.primaryLight} />
              Hábitos de hoy
            </PanelTitle>
            <PanelAction onClick={() => navigate('/personal/habits')}>
              Ver todos <ArrowRight size={14} />
            </PanelAction>
          </PanelHeader>

          {loading ? (
            <SkeletonList>
              {[1, 2, 3].map(i => <SkeletonItem key={i} />)}
            </SkeletonList>
          ) : todayHabits.length === 0 ? (
            <EmptyState>
              <EmptyIcon><CheckCircle2 size={32} /></EmptyIcon>
              <EmptyText>No tenés hábitos aún</EmptyText>
              <EmptyAction onClick={() => navigate('/personal/habits')}>
                + Crear primer hábito
              </EmptyAction>
            </EmptyState>
          ) : (
            <HabitList>
              {todayHabits.map(habit => (
                <HabitItem key={habit.id} $done={habit.completedToday} onClick={() => toggleHabit(habit.id)} style={{cursor: 'pointer'}}>
                  <HabitDot style={{ background: habit.color || p.primaryLight }} />
                  <HabitName $done={habit.completedToday}>{habit.name}</HabitName>
                  {habit.completedToday
                    ? <CheckCircle2 size={18} color={p.primaryLight} />
                    : <Circle size={18} color="#475569" />}
                </HabitItem>
              ))}
            </HabitList>
          )}
        </Panel>

        {/* Objetivos activos */}
        <Panel>
          <PanelHeader>
            <PanelTitle>
              <Target size={18} color="#fbbf24" />
              Objetivos activos
            </PanelTitle>
            <PanelAction onClick={() => navigate('/personal/goals')}>
              Ver todos <ArrowRight size={14} />
            </PanelAction>
          </PanelHeader>

          {loading ? (
            <SkeletonList>{[1, 2, 3].map(i => <SkeletonItem key={i} />)}</SkeletonList>
          ) : activeGoals.length === 0 ? (
            <EmptyState>
              <EmptyIcon><Target size={32} /></EmptyIcon>
              <EmptyText>Sin objetivos activos</EmptyText>
              <EmptyAction onClick={() => navigate('/personal/goals')}>
                + Crear objetivo
              </EmptyAction>
            </EmptyState>
          ) : (
            <GoalList>
              {activeGoals.map(goal => (
                <GoalItem key={goal.id} onClick={() => navigate('/personal/goals')}>
                  <GoalTop>
                    <GoalEmoji>{getCategoryEmoji(goal.category)}</GoalEmoji>
                    <GoalTitle>{goal.title}</GoalTitle>
                    <GoalPercent>{Math.round(goal.progress)}%</GoalPercent>
                  </GoalTop>
                  <ProgressBar>
                    <ProgressFill $progress={goal.progress} />
                  </ProgressBar>
                </GoalItem>
              ))}
            </GoalList>
          )}
        </Panel>
      </MainGrid>

      {/* Actividad últimos 7 días */}
      <ActivityPanel>
        <PanelHeader>
          <PanelTitle>
            <Calendar size={18} color={p.primaryLight} />
            Actividad — últimos 7 días
          </PanelTitle>
        </PanelHeader>
        <ActivityGrid>
          {last7Days.map((day, i) => {
            const pct = day.scheduledCount > 0 ? day.completedCount / day.scheduledCount : 0;
            return (
              <DayColumn key={i}>
                <DayBar>
                  <DayBarFill $pct={pct} $isToday={day.dateStr === today} />
                </DayBar>
                <DayLabel $isToday={day.dateStr === today}>{day.dayLabel}</DayLabel>
              </DayColumn>
            );
          })}
        </ActivityGrid>
      </ActivityPanel>

      {/* Módulos disponibles */}
      <ModuleGrid>
        <ModuleCard onClick={() => navigate('/personal/habits')}>
          <ModuleIcon color={p.secondary}><CheckCircle2 size={28} /></ModuleIcon>
          <ModuleName>Hábitos</ModuleName>
          <ModuleDesc>Tracker diario, rachas y calendario</ModuleDesc>
          <ModuleArrow><ArrowRight size={16} /></ModuleArrow>
        </ModuleCard>
        <ModuleCard onClick={() => navigate('/personal/goals')}>
          <ModuleIcon color="#f59e0b"><Target size={28} /></ModuleIcon>
          <ModuleName>Objetivos</ModuleName>
          <ModuleDesc>OKR personal, categorías y progreso</ModuleDesc>
          <ModuleArrow><ArrowRight size={16} /></ModuleArrow>
        </ModuleCard>
        <ModuleCard onClick={() => navigate('/personal/fitness')}>
          <ModuleIcon color="#60a5fa"><Dumbbell size={28} /></ModuleIcon>
          <ModuleName>Fitness</ModuleName>
          <ModuleDesc>Registro de rutinas y PRs</ModuleDesc>
          <ModuleArrow><ArrowRight size={16} /></ModuleArrow>
        </ModuleCard>
        <ModuleCard onClick={() => navigate('/personal/languages')}>
          <ModuleIcon color="#4ADE80"><Globe size={28} /></ModuleIcon>
          <ModuleName>Idiomas</ModuleName>
          <ModuleDesc>Práctica y vocabulario SRS</ModuleDesc>
          <ModuleArrow><ArrowRight size={16} /></ModuleArrow>
        </ModuleCard>
        <ModuleCard onClick={() => navigate('/personal/journal')}>
          <ModuleIcon color="#64748b"><BookOpen size={28} /></ModuleIcon>
          <ModuleName>Daily Journal</ModuleName>
          <ModuleDesc>Reflexiones, aprendizajes y notas diarias</ModuleDesc>
          <ModuleArrow><ArrowRight size={16} /></ModuleArrow>
        </ModuleCard>
        <ModuleCard onClick={() => navigate('/personal/focus')}>
          <ModuleIcon color="#10b981"><Clock size={28} /></ModuleIcon>
          <ModuleName>Focus Session</ModuleName>
          <ModuleDesc>Sesiones de enfoque con música</ModuleDesc>
          <ModuleArrow><ArrowRight size={16} /></ModuleArrow>
        </ModuleCard>
        <ModuleCard onClick={() => navigate('/personal/mental-models')}>
          <ModuleIcon color="#8b5cf6"><Brain size={28} /></ModuleIcon>
          <ModuleName>Mental Models</ModuleName>
          <ModuleDesc>Ideas, conceptos y modelos de estudio</ModuleDesc>
          <ModuleArrow><ArrowRight size={16} /></ModuleArrow>
        </ModuleCard>
        <ModuleCard onClick={() => navigate('/personal/mediterranean')}>
          <ModuleIcon color="#8FAF35"><Leaf size={28} /></ModuleIcon>
          <ModuleName>Recetario Mediterráneo</ModuleName>
          <ModuleDesc>Tus recetas, lista de compras y estadísticas</ModuleDesc>
          <ModuleArrow><ArrowRight size={16} /></ModuleArrow>
        </ModuleCard>
      </ModuleGrid>
    </Container>
  );
};

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
`;

// ─── Styled Components ────────────────────────────────────────────────────────

const Container = styled.div`
  color: #e2e8f0;
  padding: 2rem;
  animation: ${fadeUp} 0.4s ease-out;
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

const HeroSection = styled.div`
  position: relative;
  background: linear-gradient(135deg, ${p.primaryDark} 0%, #0f172a 60%, #0a0f1e 100%);
  border: 1px solid rgba(82, 183, 136, 0.15);
  border-radius: 20px;
  padding: 2.5rem;
  margin-bottom: 2rem;
  overflow: hidden;

  @media (max-width: 480px) {
    padding: 1.5rem 1.25rem;
    border-radius: 16px;
    margin-bottom: 1.25rem;
  }

  @media (max-width: 350px) {
    padding: 1.25rem 1rem;
    border-radius: 12px;
    margin-bottom: 1rem;
  }
`;

const HeroGlow = styled.div`
  position: absolute;
  top: -50px;
  right: -50px;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, ${p.primary}40 0%, transparent 70%);
  pointer-events: none;
`;

const HeroContent = styled.div`
  margin-bottom: 2rem;
`;

const HubBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(82, 183, 136, 0.15);
  color: ${p.primaryLight};
  border: 1px solid rgba(82, 183, 136, 0.25);
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
`;

const GreetingTitle = styled.h1`
  font-family: 'Unbounded', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.5rem 0;

  @media (max-width: 480px) {
    font-size: 1.4rem;
  }

  @media (max-width: 350px) {
    font-size: 1.2rem;
  }
`;

const GreetingSubtitle = styled.p`
  color: #94a3b8;
  margin: 0;
  font-size: 1.05rem;
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 350px) {
    gap: 0.5rem;
  }
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  @media (max-width: 350px) {
    padding: 0.75rem;
  }
`;

const StatIcon = styled.div`
  color: ${props => props.color};
  margin-bottom: 0.25rem;
`;

const StatNumber = styled.div`
  font-family: 'Unbounded', sans-serif;
  font-size: 1.3rem;
  font-weight: 700;
  color: white;

  @media (max-width: 350px) {
    font-size: 1.1rem;
  }
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: #64748b;
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.div`
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 1.25rem;

  @media (max-width: 350px) {
    padding: 1rem;
  }
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
`;

const PanelTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  color: white;
`;

const PanelAction = styled.button`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: transparent;
  border: none;
  color: ${p.primaryLight};
  font-size: 0.85rem;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover { opacity: 0.75; }
`;

const HabitList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const HabitItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: ${props => props.$done ? 'rgba(82, 183, 136, 0.08)' : 'rgba(255,255,255,0.02)'};
  border: 1px solid ${props => props.$done ? 'rgba(82, 183, 136, 0.2)' : 'rgba(255,255,255,0.04)'};
  border-radius: 10px;
  transition: all 0.2s;
`;

const HabitDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
`;

const HabitName = styled.span`
  flex: 1;
  font-size: 0.95rem;
  color: ${props => props.$done ? '#94a3b8' : '#e2e8f0'};
  text-decoration: ${props => props.$done ? 'line-through' : 'none'};
`;

const GoalList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const GoalItem = styled.div`
  cursor: pointer;
  &:hover { opacity: 0.85; }
`;

const GoalTop = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
`;

const GoalEmoji = styled.span`font-size: 1rem;`;

const GoalTitle = styled.span`
  flex: 1;
  font-size: 0.9rem;
  color: #e2e8f0;
  font-weight: 500;
`;

const GoalPercent = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: #fbbf24;
`;

const ProgressBar = styled.div`
  height: 6px;
  background: rgba(255,255,255,0.07);
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${props => Math.min(100, props.$progress || 0)}%;
  background: linear-gradient(90deg, ${p.primary}, ${p.primaryLight});
  border-radius: 3px;
  transition: width 0.6s ease;
`;

const ActivityPanel = styled(Panel)`
  margin-bottom: 1.5rem;
`;

const ActivityGrid = styled.div`
  display: flex;
  gap: 0.75rem;
  height: 80px;
  align-items: flex-end;
`;

const DayColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  height: 100%;
`;

const DayBar = styled.div`
  flex: 1;
  width: 100%;
  background: rgba(255,255,255,0.04);
  border-radius: 6px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
`;

const DayBarFill = styled.div`
  width: 100%;
  height: ${props => Math.max(props.$pct * 100, props.$pct > 0 ? 15 : 0)}%;
  background: ${props => props.$isToday
    ? `linear-gradient(180deg, ${p.primaryLight}, ${p.primary})`
    : `rgba(82, 183, 136, 0.5)`};
  border-radius: 6px;
  transition: height 0.6s ease;
`;

const DayLabel = styled.span`
  font-size: 0.75rem;
  text-transform: capitalize;
  color: ${props => props.$isToday ? p.primaryLight : '#475569'};
  font-weight: ${props => props.$isToday ? '600' : '400'};
`;

const ModuleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
  @media (max-width: 350px) {
    gap: 0.6rem;
  }
`;

const ModuleCard = styled.div`
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 14px;
  padding: 1.25rem;
  cursor: ${props => props.$disabled ? 'default' : 'pointer'};
  opacity: ${props => props.$disabled ? 0.5 : 1};
  position: relative;
  transition: all 0.2s;

  &:hover {
    ${props => !props.$disabled && `
      background: rgba(45, 106, 79, 0.08);
      border-color: rgba(82, 183, 136, 0.2);
      transform: translateY(-2px);
    `}
  }

  @media (max-width: 350px) {
    padding: 1rem;
  }
`;

const ModuleIcon = styled.div`
  color: ${props => props.color};
  margin-bottom: 0.75rem;
`;

const ModuleName = styled.div`
  font-weight: 600;
  font-size: 1rem;
  color: white;
  margin-bottom: 0.3rem;
`;

const ModuleDesc = styled.div`
  font-size: 0.82rem;
  color: #64748b;
`;

const ModuleArrow = styled.div`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  color: #475569;
`;

const ComingSoonBadge = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(100, 116, 139, 0.2);
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  gap: 0.75rem;
`;

const EmptyIcon = styled.div`
  color: #334155;
`;

const EmptyText = styled.p`
  color: #64748b;
  margin: 0;
  font-size: 0.95rem;
`;

const EmptyAction = styled.button`
  background: transparent;
  border: 1px solid rgba(82, 183, 136, 0.3);
  color: ${p.primaryLight};
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: rgba(82, 183, 136, 0.1);
  }
`;

const SkeletonList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SkeletonItem = styled.div`
  height: 44px;
  border-radius: 10px;
  background: rgba(255,255,255,0.04);
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

export default PersonalHub;
