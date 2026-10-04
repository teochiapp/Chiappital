import React, { useState, useMemo } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { usePersonalHub } from '../../../context/PersonalHubContext';
import { Clock, Plus, Trash2, Edit2, CheckCircle, XCircle, ChevronLeft, ChevronRight, X, Play, Calendar } from 'lucide-react';
import { colors } from '../../../styles/colors';
import { getUTC3DateString } from '../../../utils/helpers';

const p = colors.personal;

const FocusSessionsPage = () => {
  const { focusSessions, loading, createFocusSession, updateFocusSession, deleteFocusSession } = usePersonalHub();

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(getUTC3DateString()); // YYYY-MM-DD
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    description: '',
    duration: 30,
    session_date: '',
    session_time: ''
  });

  // ─── All hooks must be called before any early return ───────────────────

  // Sessions indexed by date string YYYY-MM-DD
  const sessionsByDate = useMemo(() => {
    const map = {};
    (focusSessions || []).forEach(s => {
      const dateStr = s.session_date
        ? String(s.session_date).split('T')[0].split(' ')[0]
        : null;
      if (!dateStr) return;
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(s);
    });
    return map;
  }, [focusSessions]);

  const sessionsForSelectedDay = useMemo(() => {
    return (sessionsByDate[selectedDay] || []).sort((a, b) => {
      return new Date(a.session_date) - new Date(b.session_date);
    });
  }, [sessionsByDate, selectedDay]);

  const today = getUTC3DateString();

  // Calendar computed values (non-hooks, safe after hooks)
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();
  const paddingDays = (firstDayOfMonth + 6) % 7;
  const calDays = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(calYear, calMonth, i + 1);
    return getUTC3DateString(d);
  });
  const monthLabel = calendarDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    const d = new Date(calendarDate);
    d.setMonth(d.getMonth() - 1);
    setCalendarDate(d);
  };
  const nextMonth = () => {
    const d = new Date(calendarDate);
    d.setMonth(d.getMonth() + 1);
    setCalendarDate(d);
  };

  // Early return AFTER all hooks
  if (loading) return <Container><LoadingText>Cargando...</LoadingText></Container>;

  const handleOpenForm = (session = null) => {
    if (session) {
      const d = new Date(session.session_date);
      setFormData({
        description: session.description,
        duration: session.duration,
        session_date: selectedDay,
        session_time: d.toTimeString().slice(0, 5)
      });
      setEditingId(session.id);
    } else {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 10);
      setFormData({
        description: '',
        duration: 30,
        session_date: selectedDay,
        session_time: now.toTimeString().slice(0, 5)
      });
      setEditingId(null);
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const sessionDate = new Date(`${formData.session_date}T${formData.session_time}:00`);
    const payload = {
      description: formData.description,
      duration: parseInt(formData.duration, 10),
      session_date: sessionDate.toISOString().replace('T', ' ').slice(0, 19)
    };
    if (editingId) {
      await updateFocusSession(editingId, payload);
    } else {
      await createFocusSession(payload);
    }
    handleCloseForm();
  };

  const handleStatusChange = async (id, status) => {
    await updateFocusSession(id, { status });
  };

  const formatTime = (sessionDate) => {
    try {
      return new Date(sessionDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const statusColor = (status) => {
    if (status === 'completed') return '#34d399';
    if (status === 'cancelled') return '#f87171';
    return '#fbbf24';
  };

  return (
    <Container>
      <TopBar>
        <div>
          <PageTitle>Focus Sessions</PageTitle>
          <PageSubtitle>Programa tus sesiones de enfoque</PageSubtitle>
        </div>
      </TopBar>

      <Layout>
        {/* ── Calendar ── */}
        <CalendarPanel>
          <CalHeader>
            <NavBtn onClick={prevMonth}><ChevronLeft size={18} /></NavBtn>
            <MonthLabel>{monthLabel}</MonthLabel>
            <NavBtn onClick={nextMonth}><ChevronRight size={18} /></NavBtn>
          </CalHeader>

          <WeekRow>
            {['L','M','X','J','V','S','D'].map(d => (
              <WeekLabel key={d}>{d}</WeekLabel>
            ))}
          </WeekRow>

          <DaysGrid>
            {Array.from({ length: paddingDays }, (_, i) => (
              <DayCell key={`pad-${i}`} $pad />
            ))}
            {calDays.map(dateStr => {
              const sessions = sessionsByDate[dateStr] || [];
              const pending = sessions.filter(s => s.status === 'pending').length;
              const completed = sessions.filter(s => s.status === 'completed').length;
              const isToday = dateStr === today;
              const isSelected = dateStr === selectedDay;
              const dayNum = parseInt(dateStr.split('-')[2], 10);

              return (
                <DayCell
                  key={dateStr}
                  $isToday={isToday}
                  $isSelected={isSelected}
                  $hasSessions={sessions.length > 0}
                  onClick={() => setSelectedDay(dateStr)}
                  title={`${sessions.length} sesiones`}
                >
                  <DayNum $isToday={isToday} $isSelected={isSelected}>{dayNum}</DayNum>
                  {sessions.length > 0 && (
                    <DotRow>
                      {pending > 0 && <Dot $color="#fbbf24" />}
                      {completed > 0 && <Dot $color="#34d399" />}
                    </DotRow>
                  )}
                </DayCell>
              );
            })}
          </DaysGrid>

          <CalLegend>
            <LegItem><Dot $color="#fbbf24" /> Pendiente</LegItem>
            <LegItem><Dot $color="#34d399" /> Completada</LegItem>
          </CalLegend>
        </CalendarPanel>

        {/* ── Day Panel ── */}
        <DayPanel>
          <DayHeader>
            <DayTitle>
              <Calendar size={18} />
              {selectedDay === today
                ? 'Hoy'
                : new Date(selectedDay + 'T12:00:00').toLocaleDateString('es-ES', {
                    weekday: 'long', day: 'numeric', month: 'long'
                  })
              }
            </DayTitle>
            <AddBtn onClick={() => handleOpenForm()}>
              <Plus size={16} /> Nueva
            </AddBtn>
          </DayHeader>

          {showForm && (
            <FormCard>
              <FormTitleRow>
                <FormTitle>{editingId ? 'Editar Sesión' : 'Nueva Sesión'}</FormTitle>
                <CloseBtn onClick={handleCloseForm}><X size={16} /></CloseBtn>
              </FormTitleRow>
              <Form onSubmit={handleSubmit}>
                <FormGroup style={{ flex: 2 }}>
                  <Label>Descripción</Label>
                  <Input
                    required
                    placeholder="Ej: Estudiar React"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    autoFocus
                  />
                </FormGroup>
                <FormRow>
                  <FormGroup>
                    <Label>Duración (min)</Label>
                    <Input
                      required type="number" min="5" max="240"
                      value={formData.duration}
                      onChange={e => setFormData({ ...formData, duration: e.target.value })}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Hora</Label>
                    <Input
                      required type="time"
                      value={formData.session_time}
                      onChange={e => setFormData({ ...formData, session_time: e.target.value })}
                    />
                  </FormGroup>
                </FormRow>
                <FormActions>
                  <CancelBtn type="button" onClick={handleCloseForm}>Cancelar</CancelBtn>
                  <SaveBtn type="submit">Guardar</SaveBtn>
                </FormActions>
              </Form>
            </FormCard>
          )}

          {sessionsForSelectedDay.length === 0 && !showForm ? (
            <EmptyDay>
              <EmptyIcon>🗓️</EmptyIcon>
              <EmptyText>Sin sesiones para este día</EmptyText>
              <AddBtn onClick={() => handleOpenForm()} style={{ marginTop: '0.75rem' }}>
                <Plus size={16} /> Agregar sesión
              </AddBtn>
            </EmptyDay>
          ) : (
            <SessionList>
              {sessionsForSelectedDay.map(session => (
                <SessionItem key={session.id} $status={session.status}>
                  <SessionLeft>
                    <TimeChip $status={session.status}>
                      <Clock size={12} />
                      {formatTime(session.session_date)}
                    </TimeChip>
                    <SessionInfo>
                      <SessionName $status={session.status}>{session.description}</SessionName>
                      <SessionMeta>
                        <Play size={11} /> {session.duration} min
                        <StatusDot $color={statusColor(session.status)} />
                        {session.status === 'completed' ? 'Completada' : session.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                      </SessionMeta>
                    </SessionInfo>
                  </SessionLeft>
                  <SessionActions>
                    {session.status === 'pending' && (
                      <>
                        <IconBtn
                          onClick={() => handleStatusChange(session.id, 'completed')}
                          title="Completar"
                          $color="#34d399"
                        >
                          <CheckCircle size={16} />
                        </IconBtn>
                        <IconBtn
                          onClick={() => handleStatusChange(session.id, 'cancelled')}
                          title="Cancelar"
                          $color="#f87171"
                        >
                          <XCircle size={16} />
                        </IconBtn>
                        <IconBtn onClick={() => handleOpenForm(session)} title="Editar">
                          <Edit2 size={14} />
                        </IconBtn>
                      </>
                    )}
                    <IconBtn onClick={() => deleteFocusSession(session.id)} title="Eliminar" $color="#f87171">
                      <Trash2 size={14} />
                    </IconBtn>
                  </SessionActions>
                </SessionItem>
              ))}
            </SessionList>
          )}
        </DayPanel>
      </Layout>
    </Container>
  );
};

// ─── Animations ───────────────────────────────────────────────────────────────
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// ─── Styled Components ────────────────────────────────────────────────────────

const Container = styled.div`
  color: #e2e8f0;
  padding: 2rem;
  animation: ${fadeUp} 0.35s ease-out;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 1.25rem 1rem;
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

const Layout = styled.div`
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 1.5rem;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

// ── Calendar Panel ──────────────────────────────────────────────────────────

const CalendarPanel = styled.div`
  background: #0f172a;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 16px;
  padding: 1.5rem;
  position: sticky;
  top: 1rem;
`;

const CalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
`;

const NavBtn = styled.button`
  background: rgba(255,255,255,0.05);
  border: none;
  color: #94a3b8;
  padding: 0.4rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  transition: all 0.2s;
  &:hover { background: rgba(255,255,255,0.1); color: white; }
`;

const MonthLabel = styled.span`
  font-weight: 600;
  font-size: 1rem;
  color: white;
  text-transform: capitalize;
`;

const WeekRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 0.5rem;
`;

const WeekLabel = styled.div`
  text-align: center;
  font-size: 0.72rem;
  color: #475569;
  font-weight: 600;
  padding: 0.2rem 0;
`;

const DaysGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
`;

const DayCell = styled.div`
  aspect-ratio: 1;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: ${props => props.$pad ? 'default' : 'pointer'};
  transition: all 0.15s;
  background: ${props => {
    if (props.$pad) return 'transparent';
    if (props.$isSelected) return `${p.primary}30`;
    if (props.$hasSessions) return 'rgba(255,255,255,0.04)';
    return 'transparent';
  }};
  outline: ${props => {
    if (props.$isSelected) return `2px solid ${p.primary}`;
    if (props.$isToday) return `1px solid rgba(255,255,255,0.2)`;
    return 'none';
  }};
  &:hover {
    ${props => !props.$pad && css`background: rgba(255,255,255,0.07);`}
  }
`;

const DayNum = styled.span`
  font-size: 0.8rem;
  font-weight: ${props => props.$isToday || props.$isSelected ? '700' : '400'};
  color: ${props => props.$isSelected ? p.primaryLight : props.$isToday ? 'white' : '#94a3b8'};
`;

const DotRow = styled.div`
  display: flex;
  gap: 2px;
  align-items: center;
`;

const Dot = styled.div`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${props => props.$color};
  flex-shrink: 0;
`;

const CalLegend = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  justify-content: center;
`;

const LegItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: #64748b;
`;

// ── Day Panel ───────────────────────────────────────────────────────────────

const DayPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  animation: ${fadeIn} 0.2s ease-out;
`;

const DayHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const DayTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  text-transform: capitalize;
`;

const AddBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: ${p.primary};
  color: #0f172a;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 0.9rem;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover { opacity: 0.9; }
`;

// Form

const FormCard = styled.div`
  background: #0f172a;
  border: 1px solid rgba(82, 183, 136, 0.25);
  border-radius: 12px;
  padding: 1.25rem;
  animation: ${fadeUp} 0.2s ease-out;
`;

const FormTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const FormTitle = styled.h3`
  margin: 0;
  color: white;
  font-size: 1rem;
`;

const CloseBtn = styled.button`
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  display: flex;
  &:hover { color: white; }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const FormRow = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
`;

const Label = styled.label`
  font-size: 0.8rem;
  color: #94a3b8;
`;

const Input = styled.input`
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  color: white;
  padding: 0.55rem 0.75rem;
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
  &:focus { border-color: ${p.primaryLight}; }
  &::placeholder { color: #475569; }
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.25rem;
`;

const CancelBtn = styled.button`
  background: transparent;
  border: 1px solid rgba(255,255,255,0.1);
  color: #94a3b8;
  padding: 0.45rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  &:hover { color: white; }
`;

const SaveBtn = styled.button`
  background: ${p.primaryLight};
  border: none;
  color: #0f172a;
  padding: 0.45rem 1.25rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  &:hover { opacity: 0.9; }
`;

// Session list

const EmptyDay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  border: 1px dashed rgba(255,255,255,0.08);
  border-radius: 12px;
  gap: 0.5rem;
`;

const EmptyIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.25rem;
`;

const EmptyText = styled.p`
  color: #64748b;
  margin: 0;
  font-size: 0.9rem;
`;

const SessionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SessionItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #0f172a;
  border: 1px solid ${props =>
    props.$status === 'completed' ? 'rgba(52,211,153,0.2)' :
    props.$status === 'cancelled' ? 'rgba(248,113,113,0.1)' :
    'rgba(255,255,255,0.06)'};
  border-radius: 12px;
  padding: 1rem 1.25rem;
  opacity: ${props => props.$status === 'cancelled' ? 0.55 : 1};
  transition: all 0.2s;
  animation: ${fadeUp} 0.25s ease-out;
  &:hover { border-color: rgba(255,255,255,0.1); }
`;

const SessionLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.85rem;
`;

const TimeChip = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: ${props =>
    props.$status === 'completed' ? 'rgba(52,211,153,0.12)' :
    props.$status === 'cancelled' ? 'rgba(248,113,113,0.1)' :
    'rgba(251,191,36,0.12)'};
  color: ${props =>
    props.$status === 'completed' ? '#34d399' :
    props.$status === 'cancelled' ? '#f87171' :
    '#fbbf24'};
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  white-space: nowrap;
`;

const SessionInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const SessionName = styled.div`
  font-weight: 600;
  color: ${props => props.$status === 'completed' ? '#64748b' : 'white'};
  text-decoration: ${props => props.$status === 'completed' ? 'line-through' : 'none'};
  font-size: 0.95rem;
`;

const SessionMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: #64748b;
`;

const StatusDot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${props => props.$color};
`;

const SessionActions = styled.div`
  display: flex;
  gap: 0.35rem;
  flex-shrink: 0;
`;

const IconBtn = styled.button`
  background: rgba(255,255,255,0.03);
  border: none;
  border-radius: 6px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$color || '#64748b'};
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: rgba(255,255,255,0.08);
    color: ${props => props.$color || 'white'};
  }
`;

const LoadingText = styled.div`
  color: #64748b;
  padding: 4rem;
  text-align: center;
`;

export default FocusSessionsPage;
