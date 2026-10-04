// components/Trades/MonthlyMovements.js - Movimientos del Mes (compras y ventas)
import React, { useMemo, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  BarChart2,
  DollarSign,
  Layers
} from 'lucide-react';
import { colors, getTradingColor, withOpacity } from '../../styles/colors';

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Retorna true si un trade ocurrió en el año/mes dado.
 * Considera tanto la fecha de apertura (compras) como la de cierre (ventas).
 */
const tradeIsInMonth = (trade, year, month) => {
  const inRange = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getFullYear() === year && d.getMonth() === month;
  };
  return inRange(trade.createdAt) || inRange(trade.closedAt) || inRange(trade.created_at) || inRange(trade.closed_at);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatPrice = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '-';
  return `$${Number(val).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const calcPctGain = (entry, exit) => {
  if (!entry || !exit || entry === 0) return null;
  return ((exit - entry) / entry) * 100;
};

// ─── Componente principal ─────────────────────────────────────────────────────

const MonthlyMovements = ({ trades = [], loading, error }) => {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const goBack = () => {
    if (viewMonth === 0) {
      setViewYear(y => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const goForward = () => {
    if (viewMonth === 11) {
      setViewYear(y => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const canGoForward = !isCurrentMonth;

  // ── Cálculo de movimientos del mes ─────────────────────────────────────────
  const { compras, ventas, summary } = useMemo(() => {
    const compras = [];
    const ventas = [];

    for (const trade of trades) {
      const openDate = trade.createdAt || trade.created_at;
      const closeDate = trade.closedAt || trade.closed_at;

      const openInMonth = (() => {
        if (!openDate) return false;
        const d = new Date(openDate);
        return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
      })();

      const closeInMonth = (() => {
        if (!closeDate) return false;
        const d = new Date(closeDate);
        return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
      })();

      const noteStr = trade.notes || (trade.attributes && trade.attributes.notes) || '';
      const isPartialSale = noteStr.toLowerCase().includes('venta parcial');

      if (openInMonth && !isPartialSale) {
        compras.push({ ...trade, _movDate: openDate });
      }
      if (closeInMonth && trade.status === 'closed') {
        ventas.push({ ...trade, _movDate: closeDate });
      }
    }

    // Ordenar por fecha desc
    const byDate = (a, b) => new Date(b._movDate) - new Date(a._movDate);
    compras.sort(byDate);
    ventas.sort(byDate);

    const totalCompras = compras.length;
    const totalVentas = ventas.length;
    const totalMov = totalCompras + totalVentas;

    // P&L de ventas del mes
    const pnl = ventas.reduce((acc, t) => {
      const result = t.result || t.profit_loss;
      return acc + (typeof result === 'number' ? result : 0);
    }, 0);

    return {
      compras,
      ventas,
      summary: { totalCompras, totalVentas, totalMov, pnl }
    };
  }, [trades, viewYear, viewMonth]);

  // ── Estados de carga ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <LoadingContainer>
        <SpinIcon size={32} />
        <p>Cargando movimientos...</p>
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <ErrorContainer>
        <Activity size={32} color="#f43f5e" />
        <p>Error al cargar movimientos: {error}</p>
      </ErrorContainer>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Container>
      {/* Header + navegación de mes */}
      <PageHeader>
        <HeaderLeft>
          <HeaderTitle>
            <Calendar size={22} />
            Movimientos del Mes
          </HeaderTitle>
          <HeaderSub>
            Compras y ventas registradas en el período seleccionado
          </HeaderSub>
        </HeaderLeft>

        <MonthNav>
          <NavButton onClick={goBack} title="Mes anterior">
            <ChevronLeft size={18} />
          </NavButton>
          <MonthLabel $current={isCurrentMonth}>
            {MONTHS_ES[viewMonth]} {viewYear}
            {isCurrentMonth && <CurrentBadge>HOY</CurrentBadge>}
          </MonthLabel>
          <NavButton onClick={goForward} disabled={!canGoForward} title="Mes siguiente">
            <ChevronRight size={18} />
          </NavButton>
        </MonthNav>
      </PageHeader>

      {/* Tarjetas de resumen */}
      <SummaryGrid>
        <SummaryCard $color="#22c55e">
          <SummaryIcon $color="#22c55e"><ShoppingCart size={20} /></SummaryIcon>
          <SummaryData>
            <SummaryValue>{summary.totalCompras}</SummaryValue>
            <SummaryLabel>Compras</SummaryLabel>
          </SummaryData>
        </SummaryCard>

        <SummaryCard $color="#f43f5e">
          <SummaryIcon $color="#f43f5e"><TrendingDown size={20} /></SummaryIcon>
          <SummaryData>
            <SummaryValue>{summary.totalVentas}</SummaryValue>
            <SummaryLabel>Ventas</SummaryLabel>
          </SummaryData>
        </SummaryCard>

        <SummaryCard $color="#a78bfa">
          <SummaryIcon $color="#a78bfa"><Layers size={20} /></SummaryIcon>
          <SummaryData>
            <SummaryValue>{summary.totalMov}</SummaryValue>
            <SummaryLabel>Total movimientos</SummaryLabel>
          </SummaryData>
        </SummaryCard>

      </SummaryGrid>

      {/* Sin movimientos */}
      {summary.totalMov === 0 ? (
        <EmptyState>
          <BarChart2 size={48} color="#334155" />
          <EmptyTitle>Sin movimientos este mes</EmptyTitle>
          <EmptyDesc>
            No se registraron compras ni ventas en {MONTHS_ES[viewMonth]} {viewYear}.
          </EmptyDesc>
        </EmptyState>
      ) : (
        <TwoColumns>
          {/* ── Compras ── */}
          <Section>
            <SectionHeader $type="buy">
              <ArrowUpRight size={18} />
              Compras ({summary.totalCompras})
            </SectionHeader>

            <AnimatePresence>
              {compras.length === 0 ? (
                <EmptySection>Sin compras este mes</EmptySection>
              ) : (
                compras.map((t, i) => (
                  <MovCard
                    key={`buy-${t.id || i}`}
                    $type="buy"
                    as={motion.div}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                  >
                    <MovTop>
                      <MovSymbol>{t.symbol}</MovSymbol>
                      <TypeBadge $type="buy">COMPRA</TypeBadge>
                    </MovTop>
                    <MovDetails>
                      <MovRow>
                        <MovLabel>Precio entrada</MovLabel>
                        <MovValue>{formatPrice(t.entry_price)}</MovValue>
                      </MovRow>
                      <MovRow>
                        <MovLabel>Fecha</MovLabel>
                        <MovValue>{formatDate(t.createdAt || t.created_at)}</MovValue>
                      </MovRow>
                      {t.notes && (
                        <MovRow>
                          <MovLabel>Notas</MovLabel>
                          <MovNotes>{t.notes}</MovNotes>
                        </MovRow>
                      )}
                    </MovDetails>
                  </MovCard>
                ))
              )}
            </AnimatePresence>
          </Section>

          {/* ── Ventas ── */}
          <Section>
            <SectionHeader $type="sell">
              <ArrowDownRight size={18} />
              Ventas ({summary.totalVentas})
            </SectionHeader>

            <AnimatePresence>
              {ventas.length === 0 ? (
                <EmptySection>Sin ventas este mes</EmptySection>
              ) : (
                ventas.map((t, i) => {
                  const pct = calcPctGain(t.entry_price, t.exit_price);
                  return (
                    <MovCard
                      key={`sell-${t.id || i}`}
                      $type="sell"
                      as={motion.div}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.04 }}
                    >
                      <MovTop>
                        <MovSymbol>{t.symbol}</MovSymbol>
                        <TypeBadge $type="sell">VENTA</TypeBadge>
                      </MovTop>
                      <MovDetails>
                        <MovRow>
                          <MovLabel>Precio entrada</MovLabel>
                          <MovValue>{formatPrice(t.entry_price)}</MovValue>
                        </MovRow>
                        <MovRow>
                          <MovLabel>Precio salida</MovLabel>
                          <MovValue>{formatPrice(t.exit_price)}</MovValue>
                        </MovRow>
                        {pct !== null && (
                          <MovRow>
                            <MovLabel>Ganancia %</MovLabel>
                            <PctValue $positive={pct >= 0}>
                              {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
                            </PctValue>
                          </MovRow>
                        )}

                        <MovRow>
                          <MovLabel>Fecha cierre</MovLabel>
                          <MovValue>{formatDate(t.closedAt || t.closed_at)}</MovValue>
                        </MovRow>
                        {t.notes && (
                          <MovRow>
                            <MovLabel>Notas</MovLabel>
                            <MovNotes>{t.notes}</MovNotes>
                          </MovRow>
                        )}
                      </MovDetails>
                    </MovCard>
                  );
                })
              )}
            </AnimatePresence>
          </Section>
        </TwoColumns>
      )}
    </Container>
  );
};

// ─── Animaciones ─────────────────────────────────────────────────────────────

const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const SpinIcon = styled(RefreshCw)`
  animation: ${spin} 1s linear infinite;
  color: ${colors.primary};
`;

// ─── Estilos ─────────────────────────────────────────────────────────────────

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  animation: fadeInUp 0.4s ease-out;

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1.5rem;
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const HeaderTitle = styled.h2`
  font-family: 'Unbounded', sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
  color: white;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.6rem;
`;

const HeaderSub = styled.p`
  color: #94a3b8;
  margin: 0;
  font-size: 0.95rem;
`;

/* ── Navegación de meses ── */
const MonthNav = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 0.5rem 1rem;
`;

const NavButton = styled.button`
  background: none;
  border: none;
  color: ${p => p.disabled ? '#334155' : '#94a3b8'};
  cursor: ${p => p.disabled ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  padding: 0.25rem;
  border-radius: 6px;
  transition: color 0.2s, background 0.2s;

  &:hover:not(:disabled) {
    color: white;
    background: rgba(255, 255, 255, 0.08);
  }
`;

const MonthLabel = styled.div`
  font-family: 'Unbounded', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: ${p => p.$current ? '#22c55e' : 'white'};
  min-width: 160px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const CurrentBadge = styled.span`
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  font-size: 0.6rem;
  font-weight: 700;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  letter-spacing: 0.05em;
`;

/* ── Resumen ── */
const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
`;

const SummaryCard = styled.div`
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid ${p => withOpacity(p.$color, 0.25)};
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px -4px ${p => withOpacity(p.$color, 0.2)};
  }
`;

const SummaryIcon = styled.div`
  background: ${p => withOpacity(p.$color, 0.15)};
  color: ${p => p.$color};
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const SummaryData = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const SummaryValue = styled.div`
  font-family: 'Unbounded', sans-serif;
  font-size: 1.4rem;
  font-weight: 700;
  color: ${p => p.$pnl !== undefined ? (p.$pnl >= 0 ? '#22c55e' : '#f43f5e') : 'white'};
`;

const SummaryLabel = styled.div`
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
`;

/* ── Dos columnas ── */
const TwoColumns = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SectionHeader = styled.div`
  font-family: 'Unbounded', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  color: ${p => p.$type === 'buy' ? '#22c55e' : '#f43f5e'};
  background: ${p => p.$type === 'buy' ? 'rgba(34,197,94,0.08)' : 'rgba(244,63,94,0.08)'};
  border: 1px solid ${p => p.$type === 'buy' ? 'rgba(34,197,94,0.2)' : 'rgba(244,63,94,0.2)'};
  border-radius: 10px;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  letter-spacing: 0.03em;
`;

const EmptySection = styled.div`
  color: #475569;
  font-size: 0.9rem;
  text-align: center;
  padding: 2rem;
  border: 1px dashed rgba(255,255,255,0.06);
  border-radius: 10px;
`;

/* ── Tarjeta de movimiento ── */
const MovCard = styled.div`
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid ${p => p.$type === 'buy' ? 'rgba(34,197,94,0.12)' : 'rgba(244,63,94,0.12)'};
  border-radius: 10px;
  padding: 1rem 1.1rem;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(30, 41, 59, 0.8);
    transform: translateX(3px);
    border-color: ${p => p.$type === 'buy' ? 'rgba(34,197,94,0.3)' : 'rgba(244,63,94,0.3)'};
  }
`;

const MovTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const MovSymbol = styled.span`
  font-family: 'Unbounded', sans-serif;
  font-size: 1.05rem;
  font-weight: 700;
  color: white;
`;

const TypeBadge = styled.span`
  background: ${p => p.$type === 'buy' ? 'rgba(34,197,94,0.15)' : 'rgba(244,63,94,0.15)'};
  color: ${p => p.$type === 'buy' ? '#22c55e' : '#f43f5e'};
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 5px;
  letter-spacing: 0.07em;
`;

const MovDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const MovRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
`;

const MovLabel = styled.span`
  color: #64748b;
  font-size: 0.8rem;
`;

const MovValue = styled.span`
  color: #cbd5e1;
  font-size: 0.85rem;
  font-weight: 500;
`;

const MovNotes = styled.span`
  color: #94a3b8;
  font-size: 0.78rem;
  font-style: italic;
  text-align: right;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const PctValue = styled.span`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${p => p.$positive ? '#22c55e' : '#f43f5e'};
`;

/* ── Estados vacíos/carga ── */
const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  gap: 1rem;
  text-align: center;
`;

const EmptyTitle = styled.h3`
  font-family: 'Unbounded', sans-serif;
  font-size: 1.2rem;
  color: #475569;
  margin: 0;
`;

const EmptyDesc = styled.p`
  color: #334155;
  font-size: 0.9rem;
  margin: 0;
  max-width: 360px;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #94a3b8;
  gap: 1rem;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #f43f5e;
  gap: 1rem;
`;

export default MonthlyMovements;
