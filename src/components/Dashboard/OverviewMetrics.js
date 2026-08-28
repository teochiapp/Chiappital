import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, Activity } from 'lucide-react';
import { colors } from '../../styles/colors';
import { useApiMetrics } from '../../hooks/useApiMetrics';
import { useStrapiTrades } from '../../hooks/useApiTrades';
import priceService from '../../services/priceService';

const OverviewMetrics = () => {
  const { metrics, loading: balanceLoading } = useApiMetrics();
  const { openTrades } = useStrapiTrades();
  const [dolarMep, setDolarMep] = useState(null);
  const [loadingDolar, setLoadingDolar] = useState(true);
  
  const [dailyGainUSD, setDailyGainUSD] = useState(0);
  const [dailyGainPercent, setDailyGainPercent] = useState(0);
  const [loadingDailyGain, setLoadingDailyGain] = useState(true);

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

  const fetchDailyGain = useCallback(async () => {
    if (!openTrades || openTrades.length === 0 || !balance) {
      setDailyGainUSD(0);
      setDailyGainPercent(0);
      setLoadingDailyGain(false);
      return;
    }

    setLoadingDailyGain(true);
    try {
      const symbols = [...new Set(openTrades.map(t => t.symbol || t.attributes?.symbol).filter(Boolean))];
      const quotes = await priceService.getMultipleQuotes(symbols);
      
      let totalGainPercent = 0;

      openTrades.forEach(trade => {
        const symbol = trade.symbol || trade.attributes?.symbol;
        const portfolioPercentage = parseFloat(trade.portfolio_percentage || trade.attributes?.portfolio_percentage || 0);
        const quote = quotes[symbol];

        if (quote && quote.changePercent && portfolioPercentage > 0) {
           const weightedPercent = (quote.changePercent * portfolioPercentage) / 100;
           totalGainPercent += trade.type === 'buy' ? weightedPercent : -weightedPercent;
        }
      });

      const totalGainUSD = (balance * totalGainPercent) / 100;

      setDailyGainUSD(totalGainUSD);
      setDailyGainPercent(totalGainPercent);
      setLoadingDailyGain(false);
    } catch (err) {
      console.error('Error fetching daily gain:', err);
      setLoadingDailyGain(false);
    }
  }, [openTrades, balance]);

  useEffect(() => {
    fetchDailyGain();
    const interval = setInterval(fetchDailyGain, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchDailyGain]);

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
        <MetricCard className="narrow">
          <MetricHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Ganancia HOY</span>
              {dailyGainUSD >= 0 ? <TrendingUp size={14} color="#4ade80" /> : <TrendingDown size={14} color="#f87171" />}
            </div>
            <button onClick={fetchDailyGain} title="Actualizar ganancia" className="refresh-btn">
              <RefreshCw size={14} className={loadingDailyGain ? 'spin' : ''} />
            </button>
          </MetricHeader>
          <MetricValue className={dailyGainUSD >= 0 ? 'positive' : 'negative'}>
            {loadingDailyGain ? '...' : `${dailyGainPercent >= 0 ? '+' : ''}${dailyGainPercent.toFixed(2)}%`}
          </MetricValue>
          <MetricSub className={dailyGainUSD >= 0 ? 'positive' : 'negative'}>
            {loadingDailyGain ? '...' : `${dailyGainUSD >= 0 ? '+' : ''}$${Math.abs(dailyGainUSD).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`}
          </MetricSub>
        </MetricCard>

        <MetricCard className="narrow">
          <MetricHeader>
            <span>Dólar Blue (Ref.)</span>
            <button onClick={fetchDolar} title="Actualizar cotización" className="refresh-btn">
              <RefreshCw size={14} className={loadingDolar ? 'spin' : ''} />
            </button>
          </MetricHeader>
          <MetricValue>
            ${loadingDolar ? '...' : dolarMep?.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </MetricValue>
          <MetricSub>api.bluelytics.com.ar</MetricSub>
        </MetricCard>

        <MetricCard className="highlight wide">
          <MetricHeader>
            <span>Equivalente ARS</span>
            <Activity size={16} color={colors.secondary} />
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

  @media (max-width: 1440px) {
    padding: 1.5rem;
    gap: 1.5rem;
  }

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
    padding: 1rem;
    border-radius: 16px;
    margin-bottom: 1.5rem;
    gap: 1.5rem;
  }
`;

const BalanceSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 0.8;
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
  grid-template-columns: minmax(110px, 1fr) minmax(110px, 1fr) minmax(160px, 1.4fr);
  gap: 1.2rem;
  flex: 2.2;

  @media (max-width: 1440px) {
    gap: 0.8rem;
  }

  @media (max-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const MetricCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  padding: 1.2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  @media (max-width: 1440px) {
    padding: 1rem;
  }

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
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;

  @media (max-width: 1440px) {
    font-size: 0.75rem;
    white-space: normal;
  }

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
  font-size: 1.6rem;
  font-weight: 700;
  color: white;
  font-family: 'Unbounded', sans-serif;

  &.gold {
    color: ${colors.secondary}; /* Gold text */
    font-size: 1.8rem;
  }

  &.positive {
    color: #4ade80;
  }

  &.negative {
    color: #f87171;
  }
  
  @media (max-width: 1440px) {
    font-size: 1.35rem;
    &.gold { font-size: 1.45rem; }
  }

  @media (max-width: 1200px) {
    font-size: 1.2rem;
    &.gold { font-size: 1.3rem; }
  }
`;

const MetricSub = styled.div`
  font-size: 0.8rem;
  color: #6b7280;

  &.positive {
    color: rgba(74, 222, 128, 0.8);
  }

  &.negative {
    color: rgba(248, 113, 113, 0.8);
  }
`;

export default OverviewMetrics;
