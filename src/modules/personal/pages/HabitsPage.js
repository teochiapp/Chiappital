// modules/personal/pages/HabitsPage.js — Habit Tracker completo
import React, { useState, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  CheckCircle2, Circle, Plus, Trash2, Edit3, X, Flame,
  Calendar, BarChart2, ChevronLeft, ChevronRight, Save
} from 'lucide-react';
import { usePersonalHub } from '../../../context/PersonalHubContext';
import { colors } from '../../../styles/colors';
import { getUTC3DateString } from '../../../utils/helpers';

const p = colors.personal;

const HABIT_COLORS = ['#52B788', '#60a5fa', '#f472b6', '#fb923c', '#a78bfa', '#fbbf24', '#f43f5e', '#34d399'];
const WEEKDAYS = [
  { val: 1, label: 'L' },
  { val: 2, label: 'M' },
  { val: 3, label: 'X' },
  { val: 4, label: 'J' },
  { val: 5, label: 'V' },
  { val: 6, label: 'S' },
  { val: 0, label: 'D' },
];

const HabitsPage = () => {
  const { habits, loading, createHabit, updateHabit, deleteHabit, toggleHabit } = usePersonalHub();
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', color: '#52B788', frequency: 'daily', days_of_week: [0,1,2,3,4,5,6] });
  const [calendarOffset, setCalendarOffset] = useState(0); // months back

  const [selectedDateObj, setSelectedDateObj] = useState(new Date());
  const selectedDateStr = getUTC3DateString(selectedDateObj);
  const today = getUTC3DateString();

  const prevDay = () => {
    const d = new Date(selectedDateObj);
    d.setDate(d.getDate() - 1);
    setSelectedDateObj(d);
  };
  const nextDay = () => {
    const d = new Date(selectedDateObj);
    d.setDate(d.getDate() + 1);
    setSelectedDateObj(d);
  };
  const goToToday = () => setSelectedDateObj(new Date());

  const toggleDay = (val) => {
    setFormData(prev => {
      const arr = prev.days_of_week || [];
      if (arr.includes(val)) return { ...prev, days_of_week: arr.filter(d => d !== val) };
      return { ...prev, days_of_week: [...arr, val] };
    });
  };

  // Calcular racha para un hábito
  const getStreak = (habit) => {
    let streak = 0;
    const d = new Date();
    const days = habit.days_of_week || [0,1,2,3,4,5,6];
    // Fecha de creación (solo la parte de fecha)
    const createdAt = habit.created_at ? habit.created_at.split('T')[0] : null;
    
    while (true) {
      if (!days.includes(d.getDay())) {
        d.setDate(d.getDate() - 1);
        continue;
      }
      const ds = getUTC3DateString(d);
      // No contar días anteriores a la creación del hábito
      if (createdAt && ds < createdAt) break;
      if ((habit.completions || []).includes(ds)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else if (ds === today) {
        // Hoy aún no completado, no rompe racha
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
      if (streak > 365) break;
    }
    return streak;
  };

  // Calcular porcentaje de los últimos 30 días
  const getCompletionRate = (habit) => {
    let completed = 0;
    let scheduled = 0;
    const days = habit.days_of_week || [0,1,2,3,4,5,6];
    const createdAt = habit.created_at ? habit.created_at.split('T')[0] : null;
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = getUTC3DateString(d);
      // Ignorar días anteriores a la creación del hábito
      if (createdAt && ds < createdAt) continue;
      if (days.includes(d.getDay())) {
        scheduled++;
        if ((habit.completions || []).includes(ds)) completed++;
      }
    }
    return scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100);
  };

  // Generar días del mes actual (o pasados según offset)
  const calendarDays = useMemo(() => {
    const now = new Date();
    now.setMonth(now.getMonth() - calendarOffset);
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(year, month, i + 1);
      return getUTC3DateString(d);
    });
  }, [calendarOffset]);

  const calendarMonth = useMemo(() => {
    const now = new Date();
    now.setMonth(now.getMonth() - calendarOffset);
    return now.toLocaleDateString('es', { month: 'long', year: 'numeric' });
  }, [calendarOffset]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    if (editingHabit) {
      await updateHabit(editingHabit.id, formData);
    } else {
      await createHabit(formData);
    }
    setShowForm(false);
    setEditingHabit(null);
    setFormData({ name: '', description: '', color: '#52B788', frequency: 'daily', days_of_week: [0,1,2,3,4,5,6] });
  };

  const handleEdit = (habit) => {
    setEditingHabit(habit);
    setFormData({ 
      name: habit.name, 
      description: habit.description || '', 
      color: habit.color || '#52B788', 
      frequency: habit.frequency || 'daily',
      days_of_week: habit.days_of_week || [0,1,2,3,4,5,6]
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este hábito?')) {
      await deleteHabit(id);
    }
  };

  const handleToggle = async (id) => {
    await toggleHabit(id, selectedDateStr);
  };

  if (loading) return <Container><LoadingText>Cargando...</LoadingText></Container>;

  return (
    <Container>
      <TopBar>
        <div>
          <PageTitle>Hábitos</PageTitle>
          <PageSubtitle>Construye tu mejor versión, un día a la vez</PageSubtitle>
        </div>
        <AddButton onClick={() => { setEditingHabit(null); setFormData({ name: '', description: '', color: '#52B788', frequency: 'daily', days_of_week: [0,1,2,3,4,5,6] }); setShowForm(true); }}>
          <Plus size={18} /> Nuevo hábito
        </AddButton>
      </TopBar>

      {/* Formulario */}
      {showForm && (
        <FormOverlay>
          <FormCard>
            <FormHeader>
              <FormTitle>{editingHabit ? 'Editar hábito' : 'Nuevo hábito'}</FormTitle>
              <CloseBtn onClick={() => setShowForm(false)}><X size={18} /></CloseBtn>
            </FormHeader>
            <form onSubmit={handleSubmit}>
              <FormGroup>
                <Label>Nombre *</Label>
                <Input
                  type="text"
                  placeholder="Ej: Leer 30 minutos"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  autoFocus
                />
              </FormGroup>
              <FormGroup>
                <Label>Descripción</Label>
                <Input
                  type="text"
                  placeholder="Opcional..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </FormGroup>
              <FormGroup>
                <Label>Días de la semana</Label>
                <DaysRow>
                  {WEEKDAYS.map(d => (
                    <DaySwatch
                      key={d.val}
                      type="button"
                      $selected={(formData.days_of_week || []).includes(d.val)}
                      onClick={() => toggleDay(d.val)}
                    >
                      {d.label}
                    </DaySwatch>
                  ))}
                </DaysRow>
              </FormGroup>
              <FormGroup>
                <Label>Color</Label>
                <ColorRow>
                  {HABIT_COLORS.map(c => (
                    <ColorSwatch
                      key={c}
                      style={{ background: c }}
                      $selected={formData.color === c}
                      onClick={() => setFormData({ ...formData, color: c })}
                      type="button"
                    />
                  ))}
                </ColorRow>
              </FormGroup>
              <FormActions>
                <CancelBtn type="button" onClick={() => setShowForm(false)}>Cancelar</CancelBtn>
                <SubmitBtn type="submit"><Save size={16} /> {editingHabit ? 'Guardar' : 'Crear'}</SubmitBtn>
              </FormActions>
            </form>
          </FormCard>
        </FormOverlay>
      )}

      {habits.length === 0 ? (
        <EmptyState>
          <EmptyIcon>🌱</EmptyIcon>
          <EmptyTitle>Aún no tenés hábitos</EmptyTitle>
          <EmptyText>Empieza con uno pequeño. La consistencia es todo.</EmptyText>
          <AddButton onClick={() => setShowForm(true)}><Plus size={18} /> Crear primer hábito</AddButton>
        </EmptyState>
      ) : (
        <>
          <DateNav>
            <DateNavBtn onClick={prevDay}><ChevronLeft size={20} /></DateNavBtn>
            <DateNavLabel onClick={goToToday} $isToday={selectedDateStr === today}>
              <Calendar size={16} />
              {selectedDateStr === today ? 'Hoy' : selectedDateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
            </DateNavLabel>
            <DateNavBtn onClick={nextDay} disabled={selectedDateStr >= today}><ChevronRight size={20} /></DateNavBtn>
          </DateNav>

          {(() => {
            const selectedDayOfWeek = selectedDateObj.getDay();
            const filteredHabits = habits.filter(h => {
              if (!h.created_at) return true;
              return selectedDateStr >= h.created_at.split('T')[0];
            });

            const habitsToday = filteredHabits.filter(h => (h.days_of_week || [0,1,2,3,4,5,6]).includes(selectedDayOfWeek));
            const habitsOther = filteredHabits.filter(h => !(h.days_of_week || [0,1,2,3,4,5,6]).includes(selectedDayOfWeek));
            
            const renderHabitCard = (habit, isOther = false) => {
              const completedToday = (habit.completions || []).includes(selectedDateStr);
              const streak = getStreak(habit);
              const rate = getCompletionRate(habit);
              return (
                <HabitCard key={habit.id} $done={completedToday} $color={isOther ? '#475569' : habit.color} $isOther={isOther}>
                  <HabitCardLeft>
                    <ToggleBtn onClick={() => isOther ? null : handleToggle(habit.id)} $done={completedToday} disabled={isOther}>
                      {completedToday ? <CheckCircle2 size={28} /> : <Circle size={28} />}
                    </ToggleBtn>
                    <HabitInfo>
                      <HabitName $done={completedToday}>{habit.name}</HabitName>
                      {habit.description && <HabitDesc>{habit.description}</HabitDesc>}
                    </HabitInfo>
                  </HabitCardLeft>
                  <HabitCardRight>
                    <HabitStat>
                      <Flame size={14} color={isOther ? "#64748b" : "#fb923c"} />
                      <span>{streak}d</span>
                    </HabitStat>
                    <HabitStat>
                      <BarChart2 size={14} color={isOther ? "#64748b" : p.primaryLight} />
                      <span>{rate}%</span>
                    </HabitStat>
                    <ActionBtn onClick={() => handleEdit(habit)} title="Editar"><Edit3 size={14} /></ActionBtn>
                    <ActionBtn onClick={() => handleDelete(habit.id)} title="Eliminar" $danger><Trash2 size={14} /></ActionBtn>
                  </HabitCardRight>
                </HabitCard>
              );
            };

            return (
              <>
                {habitsToday.length > 0 && (
                  <HabitGrid>
                    {habitsToday.map(h => renderHabitCard(h, false))}
                  </HabitGrid>
                )}
                {habitsOther.length > 0 && (
                  <>
                    <SectionTitle>Descanso</SectionTitle>
                    <HabitGrid>
                      {habitsOther.map(h => renderHabitCard(h, true))}
                    </HabitGrid>
                  </>
                )}
              </>
            );
          })()}

          {/* Calendario de actividad */}
          <CalendarSection>
            <CalendarHeader>
              <CalendarNav onClick={() => setCalendarOffset(o => o + 1)}><ChevronLeft size={18} /></CalendarNav>
              <CalendarMonth>{calendarMonth}</CalendarMonth>
              <CalendarNav onClick={() => setCalendarOffset(o => Math.max(0, o - 1))} $disabled={calendarOffset === 0}>
                <ChevronRight size={18} />
              </CalendarNav>
            </CalendarHeader>
            <CalendarLegend>
              <LegendItem><LegendDot style={{ background: 'rgba(255,255,255,0.06)' }} /> Sin hábitos</LegendItem>
              <LegendItem><LegendDot style={{ background: `${p.primaryLight}60` }} /> Parcial</LegendItem>
              <LegendItem><LegendDot style={{ background: p.primaryLight }} /> Completo</LegendItem>
            </CalendarLegend>
            <CalendarGrid>
              {['L','M','X','J','V','S','D'].map(d => <WeekdayLabel key={d}>{d}</WeekdayLabel>)}
              {/* padding del primer día del mes */}
              {Array.from({ length: (new Date(calendarDays[0]).getDay() + 6) % 7 }, (_, i) => (
                <CalDay key={`pad-${i}`} style={{ background: 'transparent' }} />
              ))}
              {calendarDays.map(dateStr => {
                const dDate = new Date(dateStr + 'T12:00:00');
                const dayOfWeek = dDate.getDay();
                // Solo incluir hábitos que ya existían en esa fecha
                const scheduledHabits = habits.filter(h => {
                  if (!(h.days_of_week || [0,1,2,3,4,5,6]).includes(dayOfWeek)) return false;
                  if (h.created_at) {
                    const createdDate = h.created_at.split('T')[0];
                    if (dateStr < createdDate) return false;
                  }
                  return true;
                });
                
                const totalDone = scheduledHabits.filter(h => (h.completions || []).includes(dateStr)).length;
                const pct = scheduledHabits.length > 0 ? totalDone / scheduledHabits.length : 0;
                
                const isToday = dateStr === today;
                const isFuture = dateStr > today;
                return (
                  <CalDay
                    key={dateStr}
                    $pct={pct}
                    $isToday={isToday}
                    $isFuture={isFuture}
                    title={`${dateStr}: ${totalDone}/${scheduledHabits.length} hábitos`}
                  >
                    {isToday && <TodayDot />}
                  </CalDay>
                );
              })}
            </CalendarGrid>
          </CalendarSection>
        </>
      )}
    </Container>
  );
};

// ─── Animations ───────────────────────────────────────────────────────────────
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ─── Styled Components ────────────────────────────────────────────────────────
const Container = styled.div`
  color: #e2e8f0;
  padding: 2rem;
  animation: ${fadeUp} 0.35s ease-out;
  max-width: 1000px;
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
  gap: 1rem;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 1.25rem;
  }
`;

const PageTitle = styled.h1`
  font-family: 'Unbounded', sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.25rem 0;

  @media (max-width: 480px) {
    font-size: 1.3rem;
  }

  @media (max-width: 350px) {
    font-size: 1.1rem;
  }
`;

const PageSubtitle = styled.p`
  color: #64748b;
  margin: 0;
  font-size: 0.95rem;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, ${p.primary}, ${p.primaryLight});
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0.75rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { opacity: 0.9; transform: translateY(-1px); }
`;

const HabitGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
`;

const HabitCard = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${props => props.$done ? 'rgba(82,183,136,0.07)' : (props.$isOther ? 'rgba(255,255,255,0.02)' : '#0f172a')};
  border: 1px solid ${props => props.$done ? `${props.$color}40` : (props.$isOther ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)')};
  border-left: 3px solid ${props => props.$color || p.primaryLight};
  border-radius: 12px;
  padding: 1rem 1.25rem;
  transition: all 0.2s;
  opacity: ${props => props.$isOther ? 0.6 : 1};
  &:hover { transform: ${props => props.$isOther ? 'none' : 'translateX(2px)'}; opacity: 1; }

  @media (max-width: 480px) {
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.85rem 1rem;
  }

  @media (max-width: 350px) {
    padding: 0.7rem 0.75rem;
  }
`;

const HabitCardLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ToggleBtn = styled.button`
  background: transparent;
  border: none;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  color: ${props => props.$done ? p.primaryLight : '#475569'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;
  transform: translateY(-2px);
  &:hover { transform: ${props => props.disabled ? 'translateY(-2px)' : 'translateY(-2px) scale(1.1)'}; }
`;

const HabitInfo = styled.div``;

const HabitName = styled.div`
  font-weight: 600;
  font-size: 1rem;
  color: ${props => props.$done ? '#64748b' : 'white'};
  text-decoration: ${props => props.$done ? 'line-through' : 'none'};
`;

const HabitDesc = styled.div`
  font-size: 0.82rem;
  color: #475569;
  margin-top: 0.15rem;
`;

const HabitCardRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const HabitStat = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.82rem;
  color: #94a3b8;
`;

const ActionBtn = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  color: ${props => props.$danger ? '#f43f5e' : '#64748b'};
  display: flex;
  padding: 0.25rem;
  border-radius: 6px;
  transition: all 0.2s;
  &:hover {
    background: ${props => props.$danger ? 'rgba(244,63,94,0.1)' : 'rgba(255,255,255,0.05)'};
    color: ${props => props.$danger ? '#f43f5e' : 'white'};
  }
`;

const CalendarSection = styled.div`
  background: #0f172a;
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 16px;
  padding: 1.5rem;
`;

const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const CalendarNav = styled.button`
  background: transparent;
  border: none;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  color: ${props => props.$disabled ? '#1e293b' : '#64748b'};
  display: flex;
  padding: 0.4rem;
  border-radius: 8px;
  transition: all 0.2s;
  &:hover:not(:disabled) { background: rgba(255,255,255,0.05); color: white; }
`;

const CalendarMonth = styled.span`
  font-weight: 600;
  font-size: 1rem;
  color: white;
  text-transform: capitalize;
  min-width: 160px;
  text-align: center;
`;

const CalendarLegend = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1rem;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: #64748b;
`;

const LegendDot = styled.div`
  width: 14px;
  height: 14px;
  border-radius: 4px;
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
`;

const WeekdayLabel = styled.div`
  text-align: center;
  font-size: 0.72rem;
  color: #475569;
  font-weight: 600;
  padding: 0.25rem 0;
`;

const CalDay = styled.div`
  aspect-ratio: 1;
  border-radius: 6px;
  position: relative;
  background: ${props => {
    if (props.$isFuture) return 'rgba(255,255,255,0.02)';
    if (props.$pct === 0) return 'rgba(255,255,255,0.04)';
    if (props.$pct < 0.5) return `${p.primaryLight}40`;
    if (props.$pct < 1) return `${p.primaryLight}80`;
    return p.primaryLight;
  }};
  outline: ${props => props.$isToday ? `2px solid ${p.primaryLight}` : 'none'};
  cursor: default;
  transition: background 0.3s;
`;

const TodayDot = styled.div`
  position: absolute;
  bottom: 3px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: white;
`;

// Form overlay
const FormOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: ${fadeUp} 0.2s ease-out;
  padding: 1rem;

  @media (max-width: 480px) {
    padding: 0;
    align-items: flex-end;
  }
`;

const FormCard = styled.div`
  background: #0f172a;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 18px;
  padding: 2rem;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;

  @media (max-width: 480px) {
    border-radius: 18px 18px 0 0;
    max-height: 85vh;
    padding: 1.5rem;
  }

  @media (max-width: 350px) {
    padding: 1.25rem 1rem;
  }
`;

const FormHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const FormTitle = styled.h2`
  font-family: 'Unbounded', sans-serif;
  font-size: 1.2rem;
  font-weight: 700;
  color: white;
  margin: 0;
`;

const CloseBtn = styled.button`
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  display: flex;
  padding: 0.25rem;
  &:hover { color: white; }
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: #94a3b8;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  color: white;
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
  &:focus { border-color: ${p.primaryLight}; }
  &::placeholder { color: #475569; }
`;

const ColorRow = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const ColorSwatch = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid ${props => props.$selected ? 'white' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s;
  transform: ${props => props.$selected ? 'scale(1.15)' : 'scale(1)'};
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

const CancelBtn = styled.button`
  background: transparent;
  border: 1px solid rgba(255,255,255,0.1);
  color: #94a3b8;
  border-radius: 8px;
  padding: 0.6rem 1.2rem;
  cursor: pointer;
  font-size: 0.9rem;
  &:hover { color: white; border-color: rgba(255,255,255,0.2); }
`;

const SubmitBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: linear-gradient(135deg, ${p.primary}, ${p.primaryLight});
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.6rem 1.25rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  &:hover { opacity: 0.9; }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 1rem;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
`;

const EmptyTitle = styled.h2`
  color: white;
  font-size: 1.25rem;
  margin: 0;
`;

const EmptyText = styled.p`
  color: #64748b;
  margin: 0;
`;

const LoadingText = styled.div`
  color: #64748b;
  padding: 4rem;
  text-align: center;
`;

const SectionTitle = styled.h3`
  font-family: 'Unbounded', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: #64748b;
  margin: 1.5rem 0 1rem 0;
`;

const DaysRow = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const DaySwatch = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid ${props => props.$selected ? p.primaryLight : 'rgba(255,255,255,0.1)'};
  background: ${props => props.$selected ? `${p.primaryLight}20` : 'transparent'};
  color: ${props => props.$selected ? p.primaryLight : '#94a3b8'};
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s;
  &:hover {
    border-color: ${p.primaryLight};
    color: white;
  }
`;

const DateNav = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  background: #0f172a;
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px;
`;

const DateNavBtn = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.disabled ? '#475569' : '#94a3b8'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem;
  border-radius: 8px;
  transition: all 0.2s;
  &:hover:not(:disabled) {
    background: rgba(255,255,255,0.05);
    color: white;
  }
`;

const DateNavLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  color: ${props => props.$isToday ? p.primaryLight : 'white'};
  text-transform: capitalize;
  cursor: pointer;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  transition: all 0.2s;
  min-width: 140px;
  justify-content: center;
  &:hover {
    background: rgba(255,255,255,0.05);
  }
`;

export default HabitsPage;
