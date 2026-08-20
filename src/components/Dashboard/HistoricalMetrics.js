import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { Table, Edit2, Check, X, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Plus, Mail } from 'lucide-react';
import { colors } from '../../styles/colors';
import { useApiMetrics } from '../../hooks/useApiMetrics';
import { useAccount } from '../../context/AccountContext';
import HistoricalMetricsEmailModal from './HistoricalMetricsEmailModal';

const HistoricalMetrics = () => {
  const { metrics, loading, error, updateMetric, addMetric, refreshMetrics, sendHistoricalSummary } = useApiMetrics();
  const { accountType } = useAccount();
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [expandedYears, setExpandedYears] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('ENERO');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedMetricForEmail, setSelectedMetricForEmail] = useState(null);
  const [ytdDataForEmail, setYtdDataForEmail] = useState(null);

  const months = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
  const yearsOptions = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i); // -2 to +7 years

  // Group metrics by year
  const groupedMetrics = useMemo(() => {
    if (!metrics || metrics.length === 0) return {};
    
    // Sort all metrics chronologically
    const monthMap = { 'ENERO': 0, 'FEBRERO': 1, 'MARZO': 2, 'ABRIL': 3, 'MAYO': 4, 'JUNIO': 5, 'JULIO': 6, 'AGOSTO': 7, 'SEPTIEMBRE': 8, 'OCTUBRE': 9, 'NOVIEMBRE': 10, 'DICIEMBRE': 11 };
    const parseMonthYear = (str) => {
      const match = str.match(/([A-Z]+) \((\d{4})\)/);
      if (match) return new Date(parseInt(match[2]), monthMap[match[1]]);
      return new Date(0);
    };

    const sortedMetrics = [...metrics].sort((a, b) => parseMonthYear(a.month_year) - parseMonthYear(b.month_year));

    // Compute automatic usd_start
    const computedMetrics = sortedMetrics.map((metric, index) => {
      if (index === 0) return { ...metric, isFirstMonth: true }; // First month keeps its own usd_start
      
      const prev = sortedMetrics[index - 1];
      const prevUsdEnd = parseFloat(prev.usd_end) || 0;
      const prevDeposits = parseFloat(prev.deposits) || 0;
      
      return {
        ...metric,
        usd_start: prevUsdEnd + prevDeposits,
        isFirstMonth: false
      };
    });
    
    const groups = {};
    computedMetrics.forEach(metric => {
      const match = metric.month_year.match(/\((\d{4})\)/);
      const year = match ? match[1] : 'Desconocido';
      if (!groups[year]) groups[year] = [];
      groups[year].push(metric);
    });
    return groups;
  }, [metrics]);

  // Set default expanded year to the most recent one
  useEffect(() => {
    const years = Object.keys(groupedMetrics);
    if (years.length > 0 && expandedYears.size === 0) {
      const maxYear = Math.max(...years.filter(y => !isNaN(y)));
      setExpandedYears(new Set([String(maxYear)]));
    }
  }, [groupedMetrics]);

  const toggleYear = (year) => {
    setExpandedYears(prev => {
      const newSet = new Set(prev);
      if (newSet.has(year)) {
        newSet.delete(year);
      } else {
        newSet.add(year);
      }
      return newSet;
    });
  };

  const calculateYTD = (yearMetrics) => {
    let ytdMult = 1;
    let spyMult = 1;

    let totalProfitUSD = 0;

    yearMetrics.forEach(m => {
      ytdMult *= (1 + parseFloat(m.var_percent) / 100);
      spyMult *= (1 + parseFloat(m.var_spy) / 100);
      totalProfitUSD += (parseFloat(m.usd_end) - parseFloat(m.usd_start));
    });

    const ytd = (ytdMult - 1) * 100;
    const spy = (spyMult - 1) * 100;
    const diff = ytd - spy;

    return { ytd, spy, diff, totalProfitUSD };
  };

  if (loading) {
    return (
      <Container>
        <Header>
          <Table size={24} color={colors.secondary} />
          <Title>Rendimiento Histórico</Title>
        </Header>
        <Message>Cargando métricas...</Message>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Header>
          <Table size={24} color={colors.secondary} />
          <Title>Rendimiento Histórico</Title>
        </Header>
        <Message className="error">Error: {error}</Message>
      </Container>
    );
  }

  if (metrics.length === 0) {
    return (
      <Container>
        <Header>
          <Table size={24} color={colors.secondary} />
          <Title>Rendimiento Histórico</Title>
        </Header>
        <Message>No hay datos históricos para esta cuenta.</Message>
      </Container>
    );
  }

  const handleEditClick = (metric) => {
    setEditingId(metric.id);
    setEditForm({
      usd_start: parseFloat(metric.usd_start).toFixed(2).replace(/\.00$/, ''),
      deposits: parseFloat(metric.deposits).toFixed(2).replace(/\.00$/, ''),
      usd_end: parseFloat(metric.usd_end).toFixed(2).replace(/\.00$/, ''),
      var_percent: parseFloat(metric.var_percent).toFixed(2).replace(/\.00$/, ''),
      var_spy: parseFloat(metric.var_spy).toFixed(2).replace(/\.00$/, '')
    });
  };

  const handleEmailClick = (metric, ytd, spy, diff, totalProfitUSD) => {
    setSelectedMetricForEmail(metric);
    setYtdDataForEmail({ ytd, spy, diff, profit: totalProfitUSD });
    setEmailModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleAddMonthSubmit = async () => {
    const formattedMonth = `${selectedMonth} (${selectedYear})`;
    
    const success = await addMetric(formattedMonth, accountType);
    if (success) {
      setShowAddModal(false);
      if (refreshMetrics) refreshMetrics();
    } else {
      alert("Hubo un error al agregar el mes. Verifique que no exista ya.");
    }
  };

  const handleSaveEdit = async (id) => {
    const start = parseFloat(editForm.usd_start) || 0;
    const end = parseFloat(editForm.usd_end) || 0;
    const deposits = parseFloat(editForm.deposits) || 0;
    
    const varPercent = start > 0 ? ((end - start) / start) * 100 : 0;
    const varSpy = parseFloat(editForm.var_spy) || 0;
    const calculatedDiff = varPercent - varSpy;

    const success = await updateMetric(id, {
      usd_start: start,
      deposits: deposits,
      usd_end: end,
      var_percent: varPercent,
      var_spy: varSpy,
      difference: calculatedDiff
    });

    if (success) {
      setEditingId(null);
    }
  };

  const handleChange = (e, field) => {
    setEditForm(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const formatCurrency = (val) => `$${parseFloat(val).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
  const formatPercent = (val) => `${parseFloat(val).toFixed(2)}%`;

  const renderCell = (metric, field, type = 'currency') => {
    const canEditUsdStart = metric.isFirstMonth;

    if (editingId === metric.id && field !== 'difference' && field !== 'profit' && field !== 'var_percent' && (field !== 'usd_start' || canEditUsdStart)) {
      return (
        <Input
          type="number"
          step="0.01"
          value={editForm[field]}
          onChange={(e) => handleChange(e, field)}
        />
      );
    }

    if (type === 'percent') {
      let val = parseFloat(metric[field]);
      
      // Si estamos editando, mostrar la diferencia en vivo
      if (editingId === metric.id) {
        const start = parseFloat(editForm.usd_start) || 0;
        const end = parseFloat(editForm.usd_end) || 0;
        const varP = start > 0 ? ((end - start) / start) * 100 : 0;
        const varS = parseFloat(editForm.var_spy) || 0;

        if (field === 'var_percent') {
          val = varP;
        } else if (field === 'difference') {
          val = varP - varS;
        }
      }

      const isPositive = val > 0;
      const isNegative = val < 0;
      return (
        <PercentWrapper className={isPositive ? 'positive' : isNegative ? 'negative' : ''}>
          {isPositive && <TrendingUp size={14} />}
          {isNegative && <TrendingDown size={14} />}
          {formatPercent(val)}
        </PercentWrapper>
      );
    }

    if (type === 'profit') {
      const val = parseFloat(metric[field]);
      const isPositive = val > 0;
      const isNegative = val < 0;
      return (
        <PercentWrapper className={isPositive ? 'positive' : isNegative ? 'negative' : ''}>
          {isPositive ? '+' : ''}{formatCurrency(val)}
        </PercentWrapper>
      );
    }

    return formatCurrency(metric[field]);
  };

  const renderPercent = (val) => {
    const isPositive = val > 0;
    const isNegative = val < 0;
    return (
      <PercentWrapper className={isPositive ? 'positive' : isNegative ? 'negative' : ''}>
        {isPositive && <TrendingUp size={16} />}
        {isNegative && <TrendingDown size={16} />}
        {formatPercent(val)}
      </PercentWrapper>
    );
  };

  const years = Object.keys(groupedMetrics).sort((a, b) => a.localeCompare(b)); // Ascending order

  return (
    <Container>
      <Header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Table size={24} color={colors.secondary} />
          <Title>Rendimiento Histórico</Title>
        </div>
        <AddButton onClick={() => setShowAddModal(true)}>
          <Plus size={18} /> Agregar Mes
        </AddButton>
      </Header>

      {showAddModal && (
        <ModalOverlay onClick={() => setShowAddModal(false)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalTitle>Agregar Nuevo Mes</ModalTitle>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <ModalSelect 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </ModalSelect>
              
              <ModalSelect 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {yearsOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </ModalSelect>
            </div>
            <ModalActions>
              <button className="cancel" onClick={() => setShowAddModal(false)}>Cancelar</button>
              <button className="confirm" onClick={handleAddMonthSubmit}>Crear Mes</button>
            </ModalActions>
          </ModalBox>
        </ModalOverlay>
      )}

      <HistoricalMetricsEmailModal 
        isOpen={emailModalOpen}
        onClose={() => { setEmailModalOpen(false); setSelectedMetricForEmail(null); setYtdDataForEmail(null); }}
        monthData={selectedMetricForEmail}
        ytdData={ytdDataForEmail}
        onSend={sendHistoricalSummary}
        accountType={accountType}
      />

      <TabsContainer>
        {years.map(year => {
          const yearMetrics = groupedMetrics[year];
          const isExpanded = expandedYears.has(year);
          const { ytd, spy, diff, totalProfitUSD } = calculateYTD(yearMetrics);

          return (
            <YearTab key={year}>
              <TabHeader onClick={() => toggleYear(year)} $expanded={isExpanded}>
                <h4>Año {year}</h4>
                <div className="summary-pills">
                  <span className="pill">Rendimiento: {renderPercent(ytd)}</span>
                </div>
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </TabHeader>
              
              {isExpanded && (
                <TabContent>
                  <TableWrapper>
                    <StyledTable>
                      <thead>
                        <tr>
                          <th>Mes</th>
                          <th>USD Inicio</th>
                          <th>Aportes</th>
                          <th>USD Final</th>
                          <th>Ganancia (USD)</th>
                          <th>Var (%)</th>
                          <th>Var SPY (%)</th>
                          <th>Diferencia</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {yearMetrics.map(metric => (
                          <tr key={metric.id} className={editingId === metric.id ? 'editing' : ''}>
                            <td data-label="Mes"><strong>{metric.month_year.split(' ')[0]}</strong></td>
                            <td data-label="USD Inicio">{renderCell(metric, 'usd_start', 'currency')}</td>
                            <td data-label="Aportes">{renderCell(metric, 'deposits', 'currency')}</td>
                            <td data-label="USD Final">{renderCell(metric, 'usd_end', 'currency')}</td>
                            <td data-label="Ganancia (USD)">{renderCell({ 
                              ...metric, 
                              profit: editingId === metric.id 
                                ? (parseFloat(editForm.usd_end) || 0) - (parseFloat(editForm.usd_start) || 0)
                                : metric.usd_end - metric.usd_start 
                            }, 'profit', 'profit')}</td>
                            <td data-label="Var (%)">{renderCell(metric, 'var_percent', 'percent')}</td>
                            <td data-label="Var SPY (%)">{renderCell(metric, 'var_spy', 'percent')}</td>
                            <td data-label="Diferencia">{renderCell(metric, 'difference', 'percent')}</td>
                            <td data-label="Acciones">
                              {editingId === metric.id ? (
                                <ActionButtons>
                                  <button className="save" onClick={() => handleSaveEdit(metric.id)}><Check size={16} /></button>
                                  <button className="cancel" onClick={handleCancelEdit}><X size={16} /></button>
                                </ActionButtons>
                              ) : (
                                <ActionButtons>
                                  <EditButton onClick={() => handleEmailClick(metric, ytd, spy, diff, totalProfitUSD)}>
                                    <Mail size={16} />
                                  </EditButton>
                                  <EditButton onClick={() => handleEditClick(metric)}>
                                    <Edit2 size={16} />
                                  </EditButton>
                                </ActionButtons>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </StyledTable>
                  </TableWrapper>
                  
                  <YtdConclusion>
                    <div className="conclusion-item">
                      <span className="label">YTD Cartera</span>
                      <span className="value">{renderPercent(ytd)}</span>
                    </div>
                    <div className="divider" />
                    <div className="conclusion-item">
                      <span className="label">Ganancia YTD</span>
                      <span className={`value ${totalProfitUSD > 0 ? 'positive' : totalProfitUSD < 0 ? 'negative' : ''}`}>
                        {totalProfitUSD > 0 ? '+' : ''}{formatCurrency(totalProfitUSD)}
                      </span>
                    </div>
                    <div className="divider" />
                    <div className="conclusion-item">
                      <span className="label">YTD SPY</span>
                      <span className="value">{renderPercent(spy)}</span>
                    </div>
                    <div className="divider" />
                    <div className="conclusion-item diff">
                      <span className="label">Diferencia</span>
                      <span className="value">{renderPercent(diff)}</span>
                    </div>
                  </YtdConclusion>
                </TabContent>
              )}
            </YearTab>
          );
        })}
      </TabsContainer>
    </Container>
  );
};

// ─── Estilos (Modo Oscuro) ──────────────────────────────────────────────────

const Container = styled.div`
  background: #111827; 
  border-radius: 24px;
  padding: 2.5rem;
  color: white;
  margin-top: 3rem;
  margin-bottom: 3rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${colors.gradients.primary};
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
`;

const Title = styled.h3`
  font-size: 1.5rem;
  color: white;
  font-weight: 700;
  font-family: 'Unbounded', sans-serif;
  margin: 0;
`;

const Message = styled.div`
  color: #9ca3af;
  font-size: 1.1rem;
  font-family: 'Unbounded', sans-serif;
  text-align: center;
  padding: 2rem;

  &.error {
    color: #ef4444;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const YearTab = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  overflow: hidden;
`;

const TabHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  cursor: pointer;
  background: ${props => props.$expanded ? 'rgba(255,255,255,0.02)' : 'transparent'};
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  h4 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    font-family: 'Unbounded', sans-serif;
    color: ${colors.secondary};
  }

  .summary-pills {
    display: flex;
    gap: 1rem;
    flex: 1;
    margin-left: 2rem;
    
    .pill {
      background: rgba(0, 0, 0, 0.3);
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
  }
`;

const TabContent = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.1);
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: #111827;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.95rem;

  th, td {
    padding: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    white-space: nowrap;
  }

  th {
    background: rgba(0, 0, 0, 0.2);
    color: #9ca3af;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.8rem;
    letter-spacing: 0.5px;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr {
    transition: background 0.2s ease;
    &:hover {
      background: rgba(255, 255, 255, 0.02);
    }
    
    &.editing {
      background: rgba(212, 175, 55, 0.05);
    }
  }

  strong {
    color: ${colors.secondary};
    font-weight: 600;
  }

  @media (max-width: 768px) {
    thead {
      display: none;
    }

    tbody {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    tr {
      display: flex;
      flex-direction: column;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 12px;
      padding: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    td {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      white-space: normal;
      text-align: right;

      &::before {
        content: attr(data-label);
        font-weight: 600;
        color: #9ca3af;
        text-transform: uppercase;
        font-size: 0.75rem;
        text-align: left;
        margin-right: 1rem;
      }

      &:last-child {
        border-bottom: none;
        padding-bottom: 0;
        justify-content: flex-end;
      }
    }
  }
`;

const YtdConclusion = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3rem;
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: linear-gradient(90deg, rgba(101,29,35,0.1) 0%, rgba(212,175,55,0.1) 100%);
  border-radius: 12px;
  border: 1px solid rgba(212, 175, 55, 0.2);

  .conclusion-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;

    .label {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #9ca3af;
      font-weight: 600;
    }

    .value {
      font-size: 1.5rem;
      font-family: 'Unbounded', sans-serif;
      &.positive { color: #10b981; }
      &.negative { color: #ef4444; }
    }

    &.diff .label {
      color: ${colors.secondary};
    }
  }

  .divider {
    width: 1px;
    height: 40px;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const PercentWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 600;

  &.positive { color: #10b981; }
  &.negative { color: #ef4444; }
`;

const Input = styled.input`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 6px;
  padding: 0.4rem 0.5rem;
  width: 90px;
  font-family: inherit;
  font-size: 0.95rem;

  &:focus {
    outline: none;
    border-color: ${colors.secondary};
  }
`;

const EditButton = styled.button`
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.4rem;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;

  button {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    color: white;
    transition: all 0.2s ease;

    &.save {
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
      &:hover { background: rgba(16, 185, 129, 0.4); }
    }

    &.cancel {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
      &:hover { background: rgba(239, 68, 68, 0.4); }
    }
  }
`;

const AddButton = styled.button`
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  color: ${colors.secondary};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(212, 175, 55, 0.2);
    transform: translateY(-1px);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalBox = styled.div`
  background: #1f2937;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2rem;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
`;

const ModalTitle = styled.h4`
  margin: 0 0 1.5rem 0;
  color: white;
  font-family: 'Unbounded', sans-serif;
  font-size: 1.25rem;
`;

const ModalSelect = styled.select`
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  box-sizing: border-box;
  appearance: none;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${colors.secondary};
  }

  option {
    background: #1f2937;
    color: white;
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;

  button {
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    border: none;
    transition: all 0.2s;

    &.cancel {
      background: transparent;
      color: #9ca3af;
      &:hover { color: white; }
    }

    &.confirm {
      background: ${colors.secondary};
      color: black;
      &:hover { background: #e5c353; transform: translateY(-1px); }
    }
  }
`;

export default HistoricalMetrics;
