import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { DollarSign, TrendingUp, RefreshCw } from 'lucide-react';
import { colors } from '../../styles/colors';
import { useApiMetrics } from '../../hooks/useApiMetrics';

const OverviewMetrics = () => {
  const { metrics, loading: balanceLoading } = useApiMetrics();
  const [dolarMep, setDolarMep] = useState(null);
  const [loadingDolar, setLoadingDolar] = useState(true);

  const balance = useMemo(() => {
    if (!metrics || metrics.length === 0) return 0;
    
    const monthMap = { 'ENERO': 0, 'FEBRERO': 1, 'MARZO': 2, 'ABRIL': 3, 'MAYO': 4, 'JUNIO': 5, 'JULIO': 6, 'AGOSTO': 7, 'SEPTIEMBRE': 8, 'OCTUBRE': 9, 'NOVIEMBRE': 10, 'DICIEMBRE': 11 };
    const parseMonthYear = (str) => {
      if (!str) return new Date(0);
      const match = str.match(/([A-Z]+) \((\d{4})\)/);
      if (match) return new Date(parseInt(match[2]), monthMap[match[1]]);
      return new Date(0);
    };

    const sortedMetrics = [...metrics].sort((a, b) => parseMonthYear(a.month_year) - parseMonthYear(b.month_year));
    const lastMetric = sortedMetrics[sortedMetrics.length - 1];
    
    return parseFloat(lastMetric.usd_end) || 0;
  }, [metrics]);

  const fetchDolar = async () => {
    try {
      setLoadingDolar(true);
      // Bluelytics is a very stable API for Dolar Blue/Oficial
      const res = await fetch('https://api.bluelytics.com.ar/v2/latest');
      const data = await res.json();
      setDolarMep(data.blue.value_sell); // Usamos Dólar Blue como referencia
    } catch (err) {
      console.error('Error fetching dolar MEP:', err);
    } finally {
      setLoadingDolar(false);
    }
  };

  useEffect(() => {
    fetchDolar();
    // Refresh exchange rate every 5 minutes
    const interval = setInterval(fetchDolar, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const balanceARS = balance && dolarMep ? balance * dolarMep : 0;

  return (
    <OverviewContainer>
      <BalanceSection>
        <Subtitle>Capital Total (USD)</Subtitle>
        <BalanceWrapper>
          <DollarIcon>
            <DollarSign size={32} />
          </DollarIcon>
          
          <MainBalance>
            {balanceLoading ? '...' : `$${balance.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
          </MainBalance>
        </BalanceWrapper>
      </BalanceSection>

      <MetricsGrid>
        <MetricCard>
          <MetricHeader>
            <span>Dólar Blue (Referencia)</span>
            <button onClick={fetchDolar} title="Actualizar cotización" className="refresh-btn">
              <RefreshCw size={14} className={loadingDolar ? 'spin' : ''} />
            </button>
          </MetricHeader>
          <MetricValue>
            ${loadingDolar ? '...' : dolarMep?.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </MetricValue>
          <MetricSub>api.bluelytics.com.ar</MetricSub>
        </MetricCard>

        <MetricCard className="highlight">
          <MetricHeader>
            <span>Equivalente ARS</span>
            <TrendingUp size={16} color={colors.secondary} />
          </MetricHeader>
          <MetricValue className="gold">
            ${balanceLoading || loadingDolar ? '...' : balanceARS.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </MetricValue>
          <MetricSub>ARS Totales</MetricSub>
        </MetricCard>
      </MetricsGrid>
    </OverviewContainer>
  );
};

// ─── Estilos (Modo Oscuro) ──────────────────────────────────────────────────

const OverviewContainer = styled.div`
  background: #111827; /* Darker than normal card */
  border-radius: 24px;
  padding: 2.5rem;
  color: white;
  margin-bottom: 3rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  position: relative;
  overflow: hidden;

  @media (max-width: 1024px) {
    flex-direction: column;
    align-items: stretch;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${colors.gradients.primary};
  }

  @media (max-width: 768px) {
    padding: 1.5rem;
    border-radius: 16px;
  }
`;

const BalanceSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
`;

const Subtitle = styled.h3`
  font-size: 1.1rem;
  color: #9ca3af;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0;
`;

const BalanceWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const DollarIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 14px;
  background: rgba(101, 29, 35, 0.2);
  color: ${colors.secondary}; /* Gold */
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(212, 175, 55, 0.3);
`;

const MainBalance = styled.h1`
  font-size: 3.5rem;
  font-weight: 800;
  margin: 0;
  color: white;
  letter-spacing: -1px;
  font-family: 'Unbounded', sans-serif;

  @media (max-width: 768px) {
    font-size: 2.2rem;
  }
`;



const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  flex: 1.5;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const MetricCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  &.highlight {
    background: rgba(212, 175, 55, 0.05); /* Tint of gold */
    border-color: rgba(212, 175, 55, 0.2);
  }
`;

const MetricHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #9ca3af;
  font-size: 0.95rem;
  font-weight: 500;

  .refresh-btn {
    background: transparent;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover { color: white; }
    
    .spin {
      animation: spin 1s linear infinite;
    }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const MetricValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: white;
  font-family: 'Unbounded', sans-serif;

  &.gold {
    color: ${colors.secondary}; /* Gold text */
  }
`;

const MetricSub = styled.div`
  font-size: 0.85rem;
  color: #6b7280;
`;

export default OverviewMetrics;
