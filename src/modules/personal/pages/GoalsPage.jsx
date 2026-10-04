// modules/personal/pages/GoalsPage.js — OKR-style goals board
import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  Target, Plus, Trash2, Edit3, X, Save, CheckCircle2,
  RotateCcw, Calendar, ArrowRight, Clock
} from 'lucide-react';
import { usePersonalHub } from '../../../context/PersonalHubContext';
import { colors } from '../../../styles/colors';
import { getUTC3DateString } from '../../../utils/helpers';

const p = colors.personal;

const STATUS_OPTIONS = [
  { id: 'active', label: 'Activo', color: p.primaryLight },
  { id: 'completed', label: 'Completado', color: '#10b981' },
  { id: 'cancelled', label: 'Cancelado', color: '#f43f5e' },
];

const get12WeekYearStats = () => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentQuarter = Math.floor(currentMonth / 3) + 1;
  const quarterStartMonth = (currentQuarter - 1) * 3;
  const quarterStart = new Date(now.getFullYear(), quarterStartMonth, 1);
  const quarterEnd = new Date(now.getFullYear(), quarterStartMonth + 3, 0); // Last day of quarter
  
  const msInWeek = 1000 * 60 * 60 * 24 * 7;
  const diffTime = now.getTime() - quarterStart.getTime();
  let currentWeek = Math.floor(diffTime / msInWeek) + 1;
  if (currentWeek > 13) currentWeek = 13;
  
  const daysLeft = Math.ceil((quarterEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const totalDays = Math.ceil((quarterEnd.getTime() - quarterStart.getTime()) / (1000 * 60 * 60 * 24));
  const progressPct = Math.max(0, Math.min(100, 100 - ((daysLeft / totalDays) * 100)));

  return {
    quarter: currentQuarter,
    year: now.getFullYear(),
    week: currentWeek,
    daysLeft,
    quarterEndStr: getUTC3DateString(quarterEnd),
    progressPct
  };
};

const GoalCardItem = ({ goal, handleEdit, handleDelete, handleStatusChange, updateGoal }) => {
  const [localProgress, setLocalProgress] = useState(Math.round(goal.progress) || 0);

  useEffect(() => {
    setLocalProgress(Math.round(goal.progress) || 0);
  }, [goal.progress]);

  const handleSliderChange = (e) => {
    setLocalProgress(parseInt(e.target.value));
  };

  const saveProgress = async () => {
    if (localProgress !== Math.round(goal.progress)) {
      const status = localProgress >= 100 ? 'completed' : goal.status;
      await updateGoal(goal.id, { progress: localProgress, status });
    }
  };

  return (
    <GoalCard>
      <GoalCardHeader>
        <GoalTitle>{goal.title}</GoalTitle>
        <GoalActions>
          <ActionBtn onClick={() => handleEdit(goal)}><Edit3 size={13} /></ActionBtn>
          <ActionBtn $danger onClick={() => handleDelete(goal.id)}><Trash2 size={13} /></ActionBtn>
        </GoalActions>
      </GoalCardHeader>
      {goal.description && <GoalDesc>{goal.description}</GoalDesc>}
      <ProgressSection>
        <ProgressHeader>
          <span>Progreso: {localProgress}%</span>
        </ProgressHeader>
        <ProgressSlider
          type="range"
          min={0}
          max={100}
          value={localProgress}
          onChange={handleSliderChange}
          onMouseUp={saveProgress}
          onTouchEnd={saveProgress}
        />
      </ProgressSection>
      <StatusRow>
        {STATUS_OPTIONS.filter(s => s.id !== 'active').map(s => (
          <StatusBtn key={s.id} $color={s.color} onClick={() => handleStatusChange(goal, s.id)}
            title={s.label}>
            {s.id === 'completed' && <CheckCircle2 size={12} />}
            {s.id === 'cancelled' && <X size={12} />}
            {s.label}
          </StatusBtn>
        ))}
      </StatusRow>
    </GoalCard>
  );
};

const GoalsPage = () => {
  const { goals, loading, createGoal, updateGoal, deleteGoal } = usePersonalHub();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const twy = get12WeekYearStats();
  const [formData, setFormData] = useState({
    title: '', description: '', category: 'general', deadline: twy.quarterEndStr, progress: 0,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    if (editingGoal) {
      await updateGoal(editingGoal.id, formData);
    } else {
      await createGoal(formData);
    }
    setShowForm(false);
    setEditingGoal(null);
    resetForm();
  };

  const resetForm = () => setFormData({ title: '', description: '', category: 'general', deadline: twy.quarterEndStr, progress: 0 });

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      category: goal.category || 'general',
      deadline: twy.quarterEndStr,
      progress: goal.progress || 0,
    });
    setShowForm(true);
  };

  const handleStatusChange = async (goal, status) => {
    await updateGoal(goal.id, { status });
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este objetivo?')) await deleteGoal(id);
  };

  const getStatus = (id) => STATUS_OPTIONS.find(s => s.id === id) || STATUS_OPTIONS[0];

  if (loading) return <Container><LoadingText>Cargando...</LoadingText></Container>;

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const avgProgress = activeGoals.length > 0
    ? Math.round(activeGoals.reduce((s, g) => s + parseFloat(g.progress || 0), 0) / activeGoals.length)
    : 0;

  return (
    <Container>
      <TopBar>
        <div>
          <PageTitle>Objetivos <span style={{ color: p.primaryLight }}>Q{twy.quarter}</span></PageTitle>
          <PageSubtitle>The 12 Week Year: Ejecución táctica para resultados masivos.</PageSubtitle>
        </div>
        <AddButton onClick={() => { setEditingGoal(null); resetForm(); setShowForm(true); }}>
          <Plus size={18} /> Nuevo objetivo
        </AddButton>
      </TopBar>

      {/* Banner 12 Week Year */}
      <TWYBanner>
        <TWYHeader>
          <TWYTitle>
            <Clock size={20} color={p.primaryLight} />
            Año de 12 Semanas (Q{twy.quarter} {twy.year})
          </TWYTitle>
          <TWYWeekBadge>Semana {twy.week} de 12</TWYWeekBadge>
        </TWYHeader>
        <TWYProgress>
          <TWYProgressBar>
            <TWYProgressFill $progress={twy.progressPct} />
          </TWYProgressBar>
          <TWYProgressStats>
            <span>Progreso del trimestre: {Math.round(twy.progressPct)}%</span>
            <span>{twy.daysLeft} días restantes para cerrar Q{twy.quarter}</span>
          </TWYProgressStats>
        </TWYProgress>
      </TWYBanner>

      {/* Stats rápidas */}
      <StatsRow>
        <QuickStat>
          <QStatNum>{activeGoals.length}</QStatNum>
          <QStatLabel>objetivos activos</QStatLabel>
        </QuickStat>
        <QuickStat>
          <QStatNum>{completedGoals.length}</QStatNum>
          <QStatLabel>completados</QStatLabel>
        </QuickStat>
        <QuickStat>
          <QStatNum>{avgProgress}%</QStatNum>
          <QStatLabel>progreso promedio</QStatLabel>
        </QuickStat>
      </StatsRow>

      {/* Formulario modal */}
      {showForm && (
        <FormOverlay>
          <FormCard>
            <FormHeader>
              <FormTitle>{editingGoal ? 'Editar objetivo' : 'Nuevo objetivo'}</FormTitle>
              <CloseBtn onClick={() => setShowForm(false)}><X size={18} /></CloseBtn>
            </FormHeader>
            <form onSubmit={handleSubmit}>
              <FormGroup>
                <Label>Nombre del objetivo *</Label>
                <Input
                  type="text"
                  placeholder="Ej: Correr 5km sin parar"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  autoFocus
                />
              </FormGroup>
              <FormGroup>
                <Label>Descripción</Label>
                <Textarea
                  placeholder="¿Qué querés lograr? ¿Por qué es importante?"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </FormGroup>
              <FormGroup>
                <Label>Progreso inicial: {formData.progress}%</Label>
                <ProgressSlider
                  type="range"
                  min={0}
                  max={100}
                  value={formData.progress}
                  onChange={e => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                />
              </FormGroup>
              <FormActions>
                <CancelBtn type="button" onClick={() => setShowForm(false)}>Cancelar</CancelBtn>
                <SubmitBtn type="submit"><Save size={16} /> {editingGoal ? 'Guardar cambios' : 'Crear objetivo'}</SubmitBtn>
              </FormActions>
            </form>
          </FormCard>
        </FormOverlay>
      )}

      {goals.length === 0 ? (
        <EmptyState>
          <EmptyIcon>🎯</EmptyIcon>
          <EmptyTitle>Sin objetivos todavía</EmptyTitle>
          <EmptyText>Define a dónde vas. Sin rumbo, cualquier camino sirve.</EmptyText>
          <AddButton onClick={() => setShowForm(true)}><Plus size={18} /> Crear primer objetivo</AddButton>
        </EmptyState>
      ) : (
        <>
          <SectionTitle>Objetivos en Curso</SectionTitle>
          <GoalGrid>
            {activeGoals.map(goal => (
              <GoalCardItem
                key={goal.id}
                goal={goal}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                handleStatusChange={handleStatusChange}
                updateGoal={updateGoal}
              />
            ))}
          </GoalGrid>

          {completedGoals.length > 0 && (
            <>
              <SectionTitle style={{ marginTop: '2rem' }}>Completados 🎉</SectionTitle>
              <GoalGrid>
                {completedGoals.map(goal => (
                  <GoalCard key={goal.id} $completed>
                    <GoalCardHeader>
                      <GoalTitle style={{ textDecoration: 'line-through', color: '#475569' }}>{goal.title}</GoalTitle>
                      <GoalActions>
                        <ActionBtn onClick={() => handleStatusChange(goal, 'active')} title="Reactivar"><RotateCcw size={13} /></ActionBtn>
                        <ActionBtn $danger onClick={() => handleDelete(goal.id)}><Trash2 size={13} /></ActionBtn>
                      </GoalActions>
                    </GoalCardHeader>
                    <ProgressBar>
                      <ProgressFill $progress={100} $color="#10b981" />
                    </ProgressBar>
                  </GoalCard>
                ))}
              </GoalGrid>
            </>
          )}
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
  max-width: 1100px;
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
  margin-bottom: 1.5rem;
  gap: 1rem;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 1rem;
  }
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

const StatsRow = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (max-width: 480px) {
    gap: 0.75rem;
  }
  @media (max-width: 350px) {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
`;

const QuickStat = styled.div`
  background: #0f172a;
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  min-width: 130px;
  flex: 1;

  @media (max-width: 480px) {
    padding: 0.75rem 1rem;
    min-width: 100px;
  }
  @media (max-width: 350px) {
    padding: 0.6rem 0.75rem;
    min-width: 80px;
  }
`;

const TWYBanner = styled.div`
  background: linear-gradient(to right, rgba(82, 183, 136, 0.1), rgba(15, 23, 42, 0));
  border: 1px solid rgba(82, 183, 136, 0.2);
  border-radius: 14px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const TWYHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2rem;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
`;

const TWYTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Unbounded', sans-serif;
  font-weight: 600;
  color: white;
  font-size: 1.1rem;
`;

const TWYWeekBadge = styled.div`
  background: rgba(82, 183, 136, 0.2);
  color: ${p.primaryLight};
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid rgba(82, 183, 136, 0.3);
`;

const TWYProgress = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const TWYProgressBar = styled.div`
  height: 8px;
  background: rgba(255,255,255,0.06);
  border-radius: 4px;
  overflow: hidden;
`;

const TWYProgressFill = styled.div`
  height: 100%;
  width: ${props => props.$progress}%;
  background: linear-gradient(90deg, ${p.primaryLight}, ${p.primary});
  border-radius: 4px;
  transition: width 1s ease;
`;

const TWYProgressStats = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #94a3b8;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.75rem;
  }
`;

const QStatNum = styled.div`
  font-family: 'Unbounded', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: ${p.primaryLight};
`;

const QStatLabel = styled.div`
  font-size: 0.78rem;
  color: #64748b;
  margin-top: 0.2rem;
`;

const SectionTitle = styled.h3`
  font-family: 'Unbounded', sans-serif;
  font-size: 1.1rem;
  color: white;
  margin-bottom: 1rem;
`;

const GoalGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
  padding-bottom: 1rem;

  @media (max-width: 350px) {
    grid-template-columns: 1fr;
  }
`;

const GoalCard = styled.div`
  background: ${props => props.$completed ? 'rgba(255,255,255,0.01)' : '#0f172a'};
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  transition: all 0.2s;
  &:hover { border-color: rgba(255,255,255,0.09); }
`;

const GoalCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
`;

const GoalTitle = styled.div`
  font-weight: 600;
  font-size: 0.95rem;
  color: white;
  flex: 1;
  line-height: 1.4;
`;

const GoalDesc = styled.div`
  font-size: 0.8rem;
  color: #64748b;
  line-height: 1.5;
`;

const GoalActions = styled.div`
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
`;

const ActionBtn = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  color: ${props => props.$danger ? '#f43f5e' : '#475569'};
  padding: 0.25rem;
  border-radius: 6px;
  display: flex;
  transition: all 0.2s;
  &:hover { background: rgba(255,255,255,0.06); color: ${props => props.$danger ? '#f43f5e' : 'white'}; }
`;

const ProgressSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.78rem;
  color: #64748b;
`;

const ProgressBar = styled.div`
  height: 6px;
  background: rgba(255,255,255,0.06);
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${props => Math.min(100, props.$progress || 0)}%;
  background: ${props => props.$color || p.primaryLight};
  border-radius: 3px;
  transition: width 0.4s ease;
`;

const StatusRow = styled.div`
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
`;

const StatusBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.07);
  color: #475569;
  border-radius: 6px;
  padding: 0.25rem 0.5rem;
  font-size: 0.72rem;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: ${props => props.$color}50;
    color: ${props => props.$color};
    background: ${props => props.$color}10;
  }
`;

const FormOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
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
  max-width: 540px;
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
  background: transparent; border: none; color: #64748b; cursor: pointer; display: flex; padding: 0.25rem;
  &:hover { color: white; }
`;

const FormGroup = styled.div`margin-bottom: 1.25rem;`;

const FormRow = styled.div`
  display: flex;
  gap: 1rem;
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

const Textarea = styled.textarea`
  width: 100%;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  color: white;
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
  outline: none;
  resize: vertical;
  box-sizing: border-box;
  font-family: inherit;
  transition: border-color 0.2s;
  &:focus { border-color: ${p.primaryLight}; }
  &::placeholder { color: #475569; }
`;

const Select = styled.select`
  width: 100%;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  color: white;
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
  outline: none;
  box-sizing: border-box;
  cursor: pointer;
  &:focus { border-color: ${p.primaryLight}; }
  option { background: #0f172a; }
`;

const ProgressSlider = styled.input`
  width: 100%;
  accent-color: ${p.primaryLight};
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
  &:hover { color: white; }
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

const EmptyIcon = styled.div`font-size: 3rem;`;
const EmptyTitle = styled.h2`color: white; font-size: 1.25rem; margin: 0;`;
const EmptyText = styled.p`color: #64748b; margin: 0;`;
const LoadingText = styled.div`color: #64748b; padding: 4rem; text-align: center;`;

export default GoalsPage;
