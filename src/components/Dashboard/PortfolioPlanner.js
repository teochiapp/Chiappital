// components/Dashboard/PortfolioPlanner.js - Planificación de Carteras
import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import {
  Plus, Trash2, Edit2, X, ChevronDown, ChevronUp,
  Calendar, Target, AlertTriangle, CheckCircle,
  BarChart3, Layers, Save, Activity, Info
} from 'lucide-react';
import personalApiService from '../../modules/personal/services/personalApiService';
import apiService from '../../services/apiService';

// Palette of colors for items
const PLAN_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#84cc16', '#6366f1',
  '#14b8a6', '#e11d48', '#d97706', '#7c3aed', '#0891b2'
];

// ─── PortfolioPlanner Component ───────────────────────────────────────────────

const PortfolioPlanner = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlanId, setExpandedPlanId] = useState(null);

  // Plan form
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({ title: '', target_date: '', notes: '' });
  const [planSaving, setPlanSaving] = useState(false);

  // Item form (per plan)
  const [itemForm, setItemForm] = useState({}); // { [planId]: { symbol, label, percentage, color } }
  const [showItemForm, setShowItemForm] = useState(null); // planId
  const [editingItem, setEditingItem] = useState(null); // { planId, item }
  const [itemSaving, setItemSaving] = useState(false);

  // Risk metrics cache
  const [metricsCache, setMetricsCache] = useState(() => {
    try {
      const cached = localStorage.getItem('st_risk_metrics');
      return cached ? JSON.parse(cached) : {};
    } catch { return {}; }
  });

  // Effect to fetch missing risk metrics
  useEffect(() => {
    if (!expandedPlanId) return;
    const plan = plans.find(p => p.id === expandedPlanId);
    if (!plan || !plan.items.length) return;

    const symbols = plan.items.map(i => i.symbol.toUpperCase());
    const missing = symbols.filter(s => {
      const cached = metricsCache[s];
      if (!cached) return true;
      // Cache expires in 1 day
      return Date.now() - (cached.timestamp || 0) > 86400000;
    });

    if (missing.length > 0) {
      apiService.getRiskMetrics(missing)
        .then(data => {
          setMetricsCache(prev => {
            const newMetrics = { ...prev };
            const now = Date.now();
            for (const [sym, metric] of Object.entries(data.metrics || {})) {
              newMetrics[sym] = { ...metric, timestamp: now };
            }
            localStorage.setItem('st_risk_metrics', JSON.stringify(newMetrics));
            return newMetrics;
          });
        })
        .catch(err => console.error('Error fetching risk metrics:', err));
    }
  }, [expandedPlanId, plans, metricsCache]);

  // ─── Data loading ────────────────────────────────────────────────────────────

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      const data = await personalApiService.getPortfolioPlans();
      setPlans(data.plans || []);
    } catch (err) {
      console.error('Error cargando planes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  // ─── Plan CRUD ───────────────────────────────────────────────────────────────

  const openPlanForm = (plan = null) => {
    setEditingPlan(plan);
    setPlanForm({
      title: plan?.title || '',
      target_date: plan?.target_date ? String(plan.target_date).split('T')[0] : '',
      notes: plan?.notes || ''
    });
    setShowPlanForm(true);
  };

  const closePlanForm = () => {
    setShowPlanForm(false);
    setEditingPlan(null);
    setPlanForm({ title: '', target_date: '', notes: '' });
  };

  const savePlan = async (e) => {
    e.preventDefault();
    if (!planForm.title.trim()) return;
    setPlanSaving(true);
    try {
      if (editingPlan) {
        const res = await personalApiService.updatePortfolioPlan(editingPlan.id, planForm);
        setPlans(prev => prev.map(p => p.id === editingPlan.id ? res.plan : p));
      } else {
        const res = await personalApiService.createPortfolioPlan(planForm);
        setPlans(prev => [res.plan, ...prev]);
        setExpandedPlanId(res.plan.id);
      }
      closePlanForm();
    } catch (err) {
      console.error('Error guardando plan:', err);
    } finally {
      setPlanSaving(false);
    }
  };

  const deletePlan = async (id) => {
    if (!window.confirm('¿Eliminar este plan y todos sus instrumentos?')) return;
    try {
      await personalApiService.deletePortfolioPlan(id);
      setPlans(prev => prev.filter(p => p.id !== id));
      if (expandedPlanId === id) setExpandedPlanId(null);
    } catch (err) {
      console.error('Error eliminando plan:', err);
    }
  };

  // ─── Item CRUD ───────────────────────────────────────────────────────────────

  const openItemForm = (planId, item = null) => {
    const usedColors = (plans.find(p => p.id === planId)?.items || []).map(i => i.color);
    const nextColor = PLAN_COLORS.find(c => !usedColors.includes(c)) || PLAN_COLORS[0];
    setEditingItem(item ? { planId, item } : null);
    setItemForm(prev => ({
      ...prev,
      [planId]: item
        ? { symbol: item.symbol, label: item.label || '', percentage: item.percentage, color: item.color }
        : { symbol: '', label: '', percentage: '', color: nextColor }
    }));
    setShowItemForm(planId);
  };

  const closeItemForm = () => {
    setShowItemForm(null);
    setEditingItem(null);
  };

  const saveItem = async (e, planId) => {
    e.preventDefault();
    const form = itemForm[planId] || {};
    if (!form.symbol?.trim() || !form.percentage) return;
    setItemSaving(true);
    try {
      if (editingItem && editingItem.planId === planId) {
        const res = await personalApiService.updatePortfolioPlanItem(planId, editingItem.item.id, {
          symbol: form.symbol,
          label: form.label,
          percentage: parseFloat(form.percentage),
          color: form.color
        });
        setPlans(prev => prev.map(p => {
          if (p.id !== planId) return p;
          return { ...p, items: p.items.map(i => i.id === editingItem.item.id ? res.item : i) };
        }));
      } else {
        const res = await personalApiService.addPortfolioPlanItem(planId, {
          symbol: form.symbol,
          label: form.label,
          percentage: parseFloat(form.percentage),
          color: form.color
        });
        setPlans(prev => prev.map(p => {
          if (p.id !== planId) return p;
          return { ...p, items: [...p.items, res.item] };
        }));
      }
      closeItemForm();
    } catch (err) {
      console.error('Error guardando instrumento:', err);
    } finally {
      setItemSaving(false);
    }
  };

  const deleteItem = async (planId, itemId) => {
    try {
      await personalApiService.deletePortfolioPlanItem(planId, itemId);
      setPlans(prev => prev.map(p => {
        if (p.id !== planId) return p;
        return { ...p, items: p.items.filter(i => i.id !== itemId) };
      }));
    } catch (err) {
      console.error('Error eliminando instrumento:', err);
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const getTotalPct = (items) =>
    items.reduce((sum, i) => sum + parseFloat(i.percentage || 0), 0);

  const formatDate = (d) => {
    if (!d) return null;
    try {
      return new Date(d + 'T12:00:00').toLocaleDateString('es-ES', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch { return null; }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <TooltipBox>
          <strong>{payload[0].name}</strong>: {payload[0].value}%
        </TooltipBox>
      );
    }
    return null;
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <Container>
      <Header>
        <HeaderLeft>
          <TitleRow>
            <BarChart3 size={26} color="#3b82f6" />
            <Title>Planificación de Carteras</Title>
          </TitleRow>
          <Subtitle>Diseñá estrategias hipotéticas hasta completar el 100% de tu cartera</Subtitle>
        </HeaderLeft>
        <NewPlanBtn onClick={() => openPlanForm()} id="portfolio-planner-new-plan">
          <Plus size={16} /> Nuevo Plan
        </NewPlanBtn>
      </Header>

      {/* ── Plan Form Modal ── */}
      <AnimatePresence>
        {showPlanForm && (
          <ModalOverlay
            as={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePlanForm}
          >
            <ModalCard
              as={motion.div}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <ModalHeader>
                <ModalTitle>{editingPlan ? 'Editar Plan' : 'Nuevo Plan de Cartera'}</ModalTitle>
                <CloseBtn onClick={closePlanForm}><X size={18} /></CloseBtn>
              </ModalHeader>
              <form onSubmit={savePlan}>
                <FieldGroup>
                  <FieldLabel>Título *</FieldLabel>
                  <FieldInput
                    required
                    autoFocus
                    placeholder="Ej: Cartera Bull 2025"
                    value={planForm.title}
                    onChange={e => setPlanForm({ ...planForm, title: e.target.value })}
                  />
                </FieldGroup>
                <FieldRow>
                  <FieldGroup>
                    <FieldLabel><Calendar size={13} /> Fecha objetivo</FieldLabel>
                    <FieldInput
                      type="date"
                      value={planForm.target_date}
                      onChange={e => setPlanForm({ ...planForm, target_date: e.target.value })}
                    />
                  </FieldGroup>
                </FieldRow>
                <FieldGroup>
                  <FieldLabel>Idea principal / Notas</FieldLabel>
                  <FieldTextarea
                    placeholder="Ej: Cartera defensiva para entorno de tasas altas..."
                    value={planForm.notes}
                    onChange={e => setPlanForm({ ...planForm, notes: e.target.value })}
                    rows={3}
                  />
                </FieldGroup>
                <ModalActions>
                  <CancelBtn type="button" onClick={closePlanForm}>Cancelar</CancelBtn>
                  <SaveBtn type="submit" disabled={planSaving}>
                    <Save size={14} /> {planSaving ? 'Guardando...' : 'Guardar Plan'}
                  </SaveBtn>
                </ModalActions>
              </form>
            </ModalCard>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* ── Plans List ── */}
      {loading ? (
        <LoadingState>Cargando planes...</LoadingState>
      ) : plans.length === 0 ? (
        <EmptyState>
          <EmptyIcon><Layers size={48} strokeWidth={1} /></EmptyIcon>
          <EmptyTitle>Sin planes de cartera</EmptyTitle>
          <EmptyText>Creá tu primer plan para visualizar una estrategia de inversión</EmptyText>
          <NewPlanBtn onClick={() => openPlanForm()} style={{ marginTop: '1rem' }}>
            <Plus size={16} /> Crear Plan
          </NewPlanBtn>
        </EmptyState>
      ) : (
        <PlanGrid>
          {plans.map(plan => {
            const total = getTotalPct(plan.items);
            const isComplete = Math.abs(total - 100) < 0.01;
            const isOver = total > 100.01;
            const isExpanded = expandedPlanId === plan.id;

            // ─── Risk Calculation ───
            let totalBeta = 0;
            let totalDrawdown = 0;
            let betaWeightSum = 0;
            let drawdownWeightSum = 0;

            plan.items.forEach(item => {
              const sym = item.symbol.toUpperCase();
              const metric = metricsCache[sym] || {};
              const pct = parseFloat(item.percentage) || 0;
              
              if (metric.beta !== undefined && metric.beta !== null) {
                totalBeta += metric.beta * pct;
                betaWeightSum += pct;
              } else {
                totalBeta += 1.0 * pct; // Default neutral 1.0
                betaWeightSum += pct;
              }

              if (metric.drawdown_52w !== undefined && metric.drawdown_52w !== null) {
                totalDrawdown += metric.drawdown_52w * pct;
                drawdownWeightSum += pct;
              }
            });

            const weightedBeta = betaWeightSum > 0 ? totalBeta / betaWeightSum : 0;
            const weightedDrawdown = drawdownWeightSum > 0 ? totalDrawdown / drawdownWeightSum : 0;

            const getBetaColor = (b) => {
              if (b > 1.2) return '#f87171'; // Red
              if (b < 0.8) return '#34d399'; // Green
              return '#fbbf24'; // Yellow
            };
            const getBetaDesc = (b) => {
              if (b > 1.2) return 'Agresiva / Alta volatilidad';
              if (b < 0.8) return 'Conservadora / Baja volatilidad';
              return 'Neutral / Mercado';
            };
            const getDrawdownColor = (d) => {
              if (d < -20) return '#f87171';
              if (d < -10) return '#fbbf24';
              if (d < 0) return '#34d399';
              return '#94a3b8';
            };

            return (
              <PlanCard key={plan.id} $isExpanded={isExpanded}>
                {/* ── Card Header ── */}
                <PlanCardHeader onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}>
                  <PlanCardLeft>
                    <PlanTitle $isComplete={isComplete}>{plan.title}</PlanTitle>
                    {plan.target_date && (
                      <PlanDate>
                        <Calendar size={12} /> {formatDate(plan.target_date)}
                      </PlanDate>
                    )}
                    <ProgressRow>
                      <ProgressBarTrack>
                        <ProgressBarFill
                          $pct={Math.min(total, 100)}
                          $isComplete={isComplete}
                          $isOver={isOver}
                        />
                      </ProgressBarTrack>
                      <ProgressLabel $isComplete={isComplete} $isOver={isOver}>
                        {total.toFixed(1)}%
                        {isComplete && <CheckCircle size={13} />}
                        {isOver && <AlertTriangle size={13} />}
                      </ProgressLabel>
                    </ProgressRow>
                  </PlanCardLeft>
                  <PlanCardRight>
                    <ItemCount>{plan.items.length} instrumento{plan.items.length !== 1 ? 's' : ''}</ItemCount>
                    <PlanActions onClick={e => e.stopPropagation()}>
                      <IconBtn onClick={() => openPlanForm(plan)} title="Editar plan">
                        <Edit2 size={14} />
                      </IconBtn>
                      <IconBtn $danger onClick={() => deletePlan(plan.id)} title="Eliminar plan">
                        <Trash2 size={14} />
                      </IconBtn>
                    </PlanActions>
                    {isExpanded ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
                  </PlanCardRight>
                </PlanCardHeader>

                {/* ── Expanded Content ── */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <ExpandedBody>
                        {plan.notes && (
                          <PlanNotes>{plan.notes}</PlanNotes>
                        )}

                        {/* Status banners */}
                        {isComplete && (
                          <StatusBanner $type="success">
                            <CheckCircle size={16} /> Cartera completa al 100% — lista para ejecutar
                          </StatusBanner>
                        )}
                        {isOver && (
                          <StatusBanner $type="warning">
                            <AlertTriangle size={16} /> Superás el 100% — ajustá los porcentajes ({total.toFixed(1)}%)
                          </StatusBanner>
                        )}
                        {!isComplete && !isOver && plan.items.length > 0 && (
                          <StatusBanner $type="info">
                            <Target size={16} /> Faltan {(100 - total).toFixed(1)}% para completar la cartera
                          </StatusBanner>
                        )}

                        <ExpandedContent>
                          {/* ── Pie Chart ── */}
                          {plan.items.length > 0 ? (
                            <ChartSection>
                              <ResponsiveContainer width="100%" height={380}>
                                <PieChart>
                                  <Pie
                                    data={plan.items.map(i => ({
                                      name: i.label || i.symbol,
                                      value: parseFloat(i.percentage)
                                    }))}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={135}
                                    innerRadius={70}
                                    dataKey="value"
                                    labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
                                    label={({ name, value, percent, x, y, textAnchor }) => (
                                      percent > 0.03 ? (
                                        <text x={x} y={y} fill="#e2e8f0" textAnchor={textAnchor} dominantBaseline="central" fontSize={12} fontWeight={500}>
                                          {`${name} ${value}%`}
                                        </text>
                                      ) : null
                                    )}
                                  >
                                    {plan.items.map((item, idx) => (
                                      <Cell key={item.id} fill={item.color || PLAN_COLORS[idx % PLAN_COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                              </ResponsiveContainer>
                            </ChartSection>
                          ) : (
                            <EmptyChart>
                              <BarChart3 size={36} strokeWidth={1} color="#334155" />
                              <p>Agregá instrumentos para ver el gráfico</p>
                            </EmptyChart>
                          )}

                          {/* ── Instruments List ── */}
                          <ItemsSection>
                            <ItemsSectionHeader>
                              <ItemsSectionTitle>Instrumentos</ItemsSectionTitle>
                              <AddItemBtn onClick={() => openItemForm(plan.id)}>
                                <Plus size={14} /> Agregar
                              </AddItemBtn>
                            </ItemsSectionHeader>

                            {/* Item Form */}
                            <AnimatePresence>
                              {showItemForm === plan.id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  style={{ overflow: 'hidden' }}
                                >
                                  <ItemFormBox>
                                    <form onSubmit={(e) => saveItem(e, plan.id)}>
                                      <ItemFormRow>
                                        <ItemFormGroup $flex={1.5}>
                                          <SmallLabel>Símbolo *</SmallLabel>
                                          <SmallInput
                                            required
                                            placeholder="AAPL"
                                            value={(itemForm[plan.id] || {}).symbol || ''}
                                            onChange={e => setItemForm(prev => ({
                                              ...prev,
                                              [plan.id]: { ...(prev[plan.id] || {}), symbol: e.target.value }
                                            }))}
                                          />
                                        </ItemFormGroup>
                                        <ItemFormGroup $flex={2}>
                                          <SmallLabel>Nombre (opcional)</SmallLabel>
                                          <SmallInput
                                            placeholder="Apple Inc."
                                            value={(itemForm[plan.id] || {}).label || ''}
                                            onChange={e => setItemForm(prev => ({
                                              ...prev,
                                              [plan.id]: { ...(prev[plan.id] || {}), label: e.target.value }
                                            }))}
                                          />
                                        </ItemFormGroup>
                                        <ItemFormGroup $flex={1}>
                                          <SmallLabel>% *</SmallLabel>
                                          <SmallInput
                                            required
                                            type="number"
                                            min="0.1"
                                            max="100"
                                            step="0.1"
                                            placeholder="20"
                                            value={(itemForm[plan.id] || {}).percentage || ''}
                                            onChange={e => setItemForm(prev => ({
                                              ...prev,
                                              [plan.id]: { ...(prev[plan.id] || {}), percentage: e.target.value }
                                            }))}
                                          />
                                        </ItemFormGroup>
                                        <ItemFormGroup $flex={0.6}>
                                          <SmallLabel>Color</SmallLabel>
                                          <ColorInput
                                            type="color"
                                            value={(itemForm[plan.id] || {}).color || '#3b82f6'}
                                            onChange={e => setItemForm(prev => ({
                                              ...prev,
                                              [plan.id]: { ...(prev[plan.id] || {}), color: e.target.value }
                                            }))}
                                          />
                                        </ItemFormGroup>
                                      </ItemFormRow>
                                      <ItemFormActions>
                                        <CancelBtn type="button" onClick={closeItemForm} style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                                          Cancelar
                                        </CancelBtn>
                                        <SaveBtn type="submit" disabled={itemSaving} style={{ fontSize: '0.8rem', padding: '0.35rem 0.9rem' }}>
                                          <Save size={12} /> {itemSaving ? 'Guardando...' : editingItem ? 'Actualizar' : 'Agregar'}
                                        </SaveBtn>
                                      </ItemFormActions>
                                    </form>
                                  </ItemFormBox>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Items List */}
                            <ItemsList>
                              {plan.items.length === 0 && showItemForm !== plan.id && (
                                <NoItems>Sin instrumentos aún — agregá uno para empezar</NoItems>
                              )}
                              {[...plan.items]
                                .sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage))
                                .map((item, idx) => (
                                  <ItemRow key={item.id}>
                                    <ItemColorDot style={{ background: item.color || PLAN_COLORS[idx % PLAN_COLORS.length] }} />
                                    <ItemSymbol>{item.symbol}</ItemSymbol>
                                    {item.label && <ItemLabel>{item.label}</ItemLabel>}
                                    <ItemBarWrapper>
                                      <ItemBar style={{ width: `${Math.min(parseFloat(item.percentage), 100)}%`, background: item.color || PLAN_COLORS[idx % PLAN_COLORS.length] }} />
                                    </ItemBarWrapper>
                                    <ItemPct>{parseFloat(item.percentage).toFixed(1)}%</ItemPct>
                                    <ItemActions>
                                      <SmallIconBtn onClick={() => openItemForm(plan.id, item)} title="Editar">
                                        <Edit2 size={12} />
                                      </SmallIconBtn>
                                      <SmallIconBtn $danger onClick={() => deleteItem(plan.id, item.id)} title="Eliminar">
                                        <Trash2 size={12} />
                                      </SmallIconBtn>
                                    </ItemActions>
                                  </ItemRow>
                                ))}
                            </ItemsList>

                            {/* Total row */}
                            {plan.items.length > 0 && (
                              <TotalRow $isOver={isOver} $isComplete={isComplete}>
                                <TotalLabel>Total</TotalLabel>
                                <TotalPct $isOver={isOver} $isComplete={isComplete}>
                                  {total.toFixed(1)}% / 100%
                                </TotalPct>
                              </TotalRow>
                            )}

                            {/* Risk Section */}
                            {plan.items.length > 0 && (
                              <RiskSection>
                                <RiskHeader>
                                  <Activity size={14} /> Análisis de Riesgo Estimado
                                </RiskHeader>
                                <RiskGrid>
                                  <RiskCard>
                                    <RiskLabel>Beta Ponderado <Info size={12} color="#64748b" title="Mide la volatilidad de la cartera respecto al mercado (S&P 500 = 1.0)" style={{ cursor: 'help' }}/></RiskLabel>
                                    <RiskValue $color={getBetaColor(weightedBeta)}>
                                      {weightedBeta.toFixed(2)}
                                    </RiskValue>
                                    <RiskDesc $color={getBetaColor(weightedBeta)}>{getBetaDesc(weightedBeta)}</RiskDesc>
                                  </RiskCard>
                                  <RiskCard>
                                    <RiskLabel>Caída Máxima (1 Año) <Info size={12} color="#64748b" title="Peor caída estimada basada en el drawdown de 52 semanas de los componentes" style={{ cursor: 'help' }}/></RiskLabel>
                                    <RiskValue $color={getDrawdownColor(weightedDrawdown)}>
                                      {weightedDrawdown < 0 ? weightedDrawdown.toFixed(1) : 0}%
                                    </RiskValue>
                                    <RiskDesc $color={getDrawdownColor(weightedDrawdown)}>
                                      Riesgo de pérdida profunda
                                    </RiskDesc>
                                  </RiskCard>
                                </RiskGrid>
                              </RiskSection>
                            )}
                          </ItemsSection>
                        </ExpandedContent>
                      </ExpandedBody>
                    </motion.div>
                  )}
                </AnimatePresence>
              </PlanCard>
            );
          })}
        </PlanGrid>
      )}
    </Container>
  );
};

// ─── Animations ───────────────────────────────────────────────────────────────
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ─── Styled Components ────────────────────────────────────────────────────────

const Container = styled.div`
  background: #1e293b;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  margin-top: 2rem;
  animation: ${fadeUp} 0.4s ease-out;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 2rem 2rem 1.5rem;
  gap: 1rem;

  @media (max-width: 600px) {
    flex-direction: column;
    padding: 1.5rem;
  }
`;

const HeaderLeft = styled.div``;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.35rem;
`;

const Title = styled.h2`
  font-size: 1.8rem;
  font-weight: 600;
  font-family: 'Unbounded', sans-serif;
  color: white;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1.4rem;
  }
`;

const Subtitle = styled.p`
  font-size: 0.95rem;
  font-family: 'Unbounded', sans-serif;
  color: #94a3b8;
  margin: 0;
`;

const NewPlanBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.6rem 1.1rem;
  font-weight: 600;
  font-size: 0.9rem;
  font-family: 'Unbounded', sans-serif;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s;
  &:hover { background: #2563eb; transform: translateY(-1px); }
`;

// Modal
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalCard = styled.div`
  background: #1e293b;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 16px;
  padding: 1.75rem;
  width: 100%;
  max-width: 480px;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
`;

const ModalTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  margin: 0;
  font-family: 'Unbounded', sans-serif;
`;

const CloseBtn = styled.button`
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  display: flex;
  padding: 0.25rem;
  border-radius: 6px;
  &:hover { color: white; background: rgba(255,255,255,0.05); }
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 1rem;
`;

const FieldRow = styled.div`
  display: flex;
  gap: 0.75rem;
  & > * { flex: 1; }
`;

const FieldLabel = styled.label`
  font-size: 0.82rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 0.3rem;
`;

const FieldInput = styled.input`
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  color: white;
  padding: 0.6rem 0.85rem;
  font-family: inherit;
  font-size: 0.92rem;
  outline: none;
  &:focus { border-color: #3b82f6; }
  &::placeholder { color: #475569; }
`;

const FieldTextarea = styled.textarea`
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  color: white;
  padding: 0.6rem 0.85rem;
  font-family: inherit;
  font-size: 0.92rem;
  outline: none;
  resize: vertical;
  &:focus { border-color: #3b82f6; }
  &::placeholder { color: #475569; }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
`;

const CancelBtn = styled.button`
  background: transparent;
  border: 1px solid rgba(255,255,255,0.12);
  color: #94a3b8;
  padding: 0.5rem 1rem;
  border-radius: 7px;
  cursor: pointer;
  font-size: 0.88rem;
  font-family: inherit;
  &:hover { color: white; }
`;

const SaveBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #3b82f6;
  border: none;
  color: white;
  padding: 0.5rem 1.1rem;
  border-radius: 7px;
  font-weight: 600;
  font-size: 0.88rem;
  font-family: inherit;
  cursor: pointer;
  &:hover:not(:disabled) { background: #2563eb; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

// Plans grid

const PlanGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  border-top: 1px solid rgba(255,255,255,0.06);
`;

const PlanCard = styled.div`
  background: ${props => props.$isExpanded ? 'rgba(59,130,246,0.04)' : '#1e293b'};
  border-bottom: 1px solid rgba(255,255,255,0.05);
  transition: background 0.2s;
  &:last-child { border-bottom: none; }
`;

const PlanCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 2rem;
  cursor: pointer;
  gap: 1rem;
  &:hover { background: rgba(255,255,255,0.02); }

  @media (max-width: 600px) {
    padding: 1rem 1.5rem;
    flex-wrap: wrap;
  }
`;

const PlanCardLeft = styled.div`
  flex: 1;
  min-width: 0;
`;

const PlanTitle = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.$isComplete ? '#34d399' : 'white'};
  margin-bottom: 0.25rem;
  font-family: 'Unbounded', sans-serif;
`;

const PlanDate = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.78rem;
  color: #64748b;
  margin-bottom: 0.5rem;
`;

const ProgressRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ProgressBarTrack = styled.div`
  flex: 1;
  height: 6px;
  background: rgba(255,255,255,0.08);
  border-radius: 99px;
  overflow: hidden;
  max-width: 300px;
`;

const ProgressBarFill = styled.div`
  height: 100%;
  width: ${props => props.$pct}%;
  background: ${props =>
    props.$isComplete ? '#34d399' :
    props.$isOver ? '#f87171' :
    '#3b82f6'};
  border-radius: 99px;
  transition: width 0.4s ease;
`;

const ProgressLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: ${props =>
    props.$isComplete ? '#34d399' :
    props.$isOver ? '#f87171' :
    '#94a3b8'};
  white-space: nowrap;
`;

const PlanCardRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
`;

const ItemCount = styled.div`
  font-size: 0.78rem;
  color: #64748b;
  white-space: nowrap;
`;

const PlanActions = styled.div`
  display: flex;
  gap: 0.3rem;
`;

const IconBtn = styled.button`
  background: rgba(255,255,255,0.04);
  border: none;
  border-radius: 6px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$danger ? '#f87171' : '#64748b'};
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    background: ${props => props.$danger ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.08)'};
    color: ${props => props.$danger ? '#ef4444' : 'white'};
  }
`;

// Expanded

const ExpandedBody = styled.div`
  padding: 0 2rem 2rem;

  @media (max-width: 600px) {
    padding: 0 1.5rem 1.5rem;
  }
`;

const PlanNotes = styled.div`
  font-size: 0.88rem;
  color: #94a3b8;
  background: rgba(255,255,255,0.03);
  border-left: 3px solid rgba(59,130,246,0.4);
  padding: 0.75rem 1rem;
  border-radius: 0 8px 8px 0;
  margin-bottom: 1rem;
  line-height: 1.5;
`;

const StatusBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  ${props => props.$type === 'success' && css`
    background: rgba(52,211,153,0.1);
    color: #34d399;
    border: 1px solid rgba(52,211,153,0.2);
  `}
  ${props => props.$type === 'warning' && css`
    background: rgba(248,113,113,0.1);
    color: #f87171;
    border: 1px solid rgba(248,113,113,0.2);
  `}
  ${props => props.$type === 'info' && css`
    background: rgba(59,130,246,0.08);
    color: #60a5fa;
    border: 1px solid rgba(59,130,246,0.2);
  `}
`;

const ExpandedContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const ChartSection = styled.div`
  min-height: 300px;
`;

const EmptyChart = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: 0.75rem;
  color: #334155;
  font-size: 0.85rem;
`;

const ItemsSection = styled.div``;

const ItemsSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const ItemsSectionTitle = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const AddItemBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: rgba(59,130,246,0.12);
  border: 1px solid rgba(59,130,246,0.25);
  color: #60a5fa;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.3rem 0.7rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: rgba(59,130,246,0.2); border-color: #3b82f6; }
`;

const ItemFormBox = styled.div`
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(59,130,246,0.2);
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 0.75rem;
`;

const ItemFormRow = styled.div`
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

const ItemFormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex: ${props => props.$flex || 1};
  min-width: 70px;
`;

const SmallLabel = styled.label`
  font-size: 0.75rem;
  color: #64748b;
`;

const SmallInput = styled.input`
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  color: white;
  padding: 0.4rem 0.6rem;
  font-family: inherit;
  font-size: 0.85rem;
  outline: none;
  width: 100%;
  &:focus { border-color: #3b82f6; }
  &::placeholder { color: #475569; }
`;

const ColorInput = styled.input`
  width: 100%;
  height: 34px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.1);
  padding: 2px;
  background: rgba(255,255,255,0.05);
  cursor: pointer;
`;

const ItemFormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.75rem;
`;

const ItemsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const NoItems = styled.div`
  font-size: 0.82rem;
  color: #475569;
  text-align: center;
  padding: 1rem;
`;

const ItemRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0.6rem;
  background: rgba(255,255,255,0.02);
  border-radius: 7px;
  transition: background 0.15s;
  &:hover { background: rgba(255,255,255,0.04); }
`;

const ItemColorDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
`;

const ItemSymbol = styled.div`
  font-size: 0.82rem;
  font-weight: 700;
  color: white;
  min-width: 45px;
`;

const ItemLabel = styled.div`
  font-size: 0.78rem;
  color: #64748b;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ItemBarWrapper = styled.div`
  flex: 1;
  height: 5px;
  background: rgba(255,255,255,0.07);
  border-radius: 99px;
  overflow: hidden;
`;

const ItemBar = styled.div`
  height: 100%;
  border-radius: 99px;
  transition: width 0.3s ease;
`;

const ItemPct = styled.div`
  font-size: 0.82rem;
  font-weight: 600;
  color: #e2e8f0;
  min-width: 42px;
  text-align: right;
`;

const ItemActions = styled.div`
  display: flex;
  gap: 0.2rem;
`;

const SmallIconBtn = styled.button`
  background: transparent;
  border: none;
  border-radius: 4px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$danger ? '#f87171' : '#475569'};
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    color: ${props => props.$danger ? '#ef4444' : 'white'};
    background: rgba(255,255,255,0.06);
  }
`;

const TotalRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.6rem 0;
  border-top: 1px solid rgba(255,255,255,0.07);
  margin-top: 0.4rem;
`;

const TotalLabel = styled.div`
  font-size: 0.82rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const TotalPct = styled.div`
  font-size: 0.9rem;
  font-weight: 700;
  color: ${props =>
    props.$isComplete ? '#34d399' :
    props.$isOver ? '#f87171' :
    'white'};
`;

const TooltipBox = styled.div`
  background: rgba(255,255,255,0.95);
  color: #1e293b;
  padding: 0.5rem 0.8rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #64748b;
  font-size: 0.9rem;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 0.5rem;
`;

const EmptyIcon = styled.div`
  color: #334155;
  margin-bottom: 0.5rem;
`;

const EmptyTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
  margin: 0;
  font-family: 'Unbounded', sans-serif;
`;

const EmptyText = styled.p`
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
  text-align: center;
`;

const RiskSection = styled.div`
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px dashed rgba(255,255,255,0.1);
`;

const RiskHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const RiskGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const RiskCard = styled.div`
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const RiskLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: #94a3b8;
  text-transform: uppercase;
`;

const RiskValue = styled.div`
  font-size: 1.4rem;
  font-weight: 700;
  font-family: 'Unbounded', sans-serif;
  color: ${props => props.$color || 'white'};
`;

const RiskDesc = styled.div`
  font-size: 0.8rem;
  font-weight: 500;
  color: ${props => props.$color || '#94a3b8'};
`;

export default PortfolioPlanner;
