import React, { useMemo } from 'react';
import styled from 'styled-components';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Table } from 'lucide-react';
import { colors } from '../../styles/colors';
import { useApiMetrics } from '../../hooks/useApiMetrics';

const PerformanceChart = () => {
  const { metrics, loading, error } = useApiMetrics();

  const chartData = useMemo(() => {
    if (!metrics || metrics.length === 0) return [];

    const monthMap = { 'ENERO': 0, 'FEBRERO': 1, 'MARZO': 2, 'ABRIL': 3, 'MAYO': 4, 'JUNIO': 5, 'JULIO': 6, 'AGOSTO': 7, 'SEPTIEMBRE': 8, 'OCTUBRE': 9, 'NOVIEMBRE': 10, 'DICIEMBRE': 11 };
    const parseMonthYear = (str) => {
      const match = str.match(/([A-Z]+) \((\d{4})\)/);
      if (match) return new Date(parseInt(match[2]), monthMap[match[1]]);
      return new Date(0);
    };

    const sortedMetrics = [...metrics].sort((a, b) => parseMonthYear(a.month_year) - parseMonthYear(b.month_year));

    let portfolioMult = 1;
    let spyMult = 1;

    const data = [{
      name: 'Inicio',
      Cartera: 0,
      SPY: 0
    }];

    sortedMetrics.forEach(m => {
      portfolioMult *= (1 + parseFloat(m.var_percent || 0) / 100);
      spyMult *= (1 + parseFloat(m.var_spy || 0) / 100);

      // Extract short month and year, e.g., "ENE 24"
      let shortMonth = m.month_year.split(' ')[0].substring(0, 3);
      let year = m.month_year.match(/\((\d{4})\)/)?.[1]?.substring(2, 4) || '';
      const label = `${shortMonth} '${year}`;

      data.push({
        name: label,
        Cartera: parseFloat(((portfolioMult - 1) * 100).toFixed(2)),
        SPY: parseFloat(((spyMult - 1) * 100).toFixed(2))
      });
    });

    return data;
  }, [metrics]);

  if (loading) {
    return (
      <Container>
        <Header>
          <TrendingUp size={24} color={colors.secondary} />
          <Title>Evolución Compuesta</Title>
        </Header>
        <Message>Cargando gráfico...</Message>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Header>
          <TrendingUp size={24} color={colors.secondary} />
          <Title>Evolución Compuesta</Title>
        </Header>
        <Message className="error">Error: {error}</Message>
      </Container>
    );
  }

  if (metrics.length === 0) {
    return null;
  }

  return (
    <Container>
      <Header>
        <TrendingUp size={24} color={colors.secondary} />
        <Title>Evolución Compuesta: Cartera vs SPY</Title>
      </Header>
      <ChartWrapper>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 0,
              bottom: 25,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#9ca3af" 
              fontSize={12} 
              tickMargin={15}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              stroke="#9ca3af" 
              fontSize={12} 
              tickFormatter={(tick) => `${tick}%`}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              domain={[-10, 'auto']}
              allowDataOverflow={true}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
              itemStyle={{ color: '#fff', fontWeight: 600 }}
              labelStyle={{ color: '#9ca3af', marginBottom: '0.5rem' }}
              formatter={(value, name) => [`${value}%`, name]}
            />
            <Legend 
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '20px' }}
            />
            <Line 
              type="monotone" 
              dataKey="Cartera" 
              name="Mi Cartera"
              stroke={colors.secondary} 
              strokeWidth={4} 
              dot={{ r: 4, fill: '#111827', stroke: colors.secondary, strokeWidth: 2 }} 
              activeDot={{ r: 6, fill: colors.secondary, stroke: '#fff', strokeWidth: 2 }} 
            />
            <Line 
              type="monotone" 
              dataKey="SPY" 
              name="S&P 500 (SPY)"
              stroke="#3b82f6" 
              strokeWidth={4} 
              dot={{ r: 4, fill: '#111827', stroke: '#3b82f6', strokeWidth: 2 }} 
              activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </Container>
  );
};

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
  gap: 1rem;
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

const ChartWrapper = styled.div`
  width: 100%;
  height: 400px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  padding: 1.5rem 1rem 1rem 0;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

export default PerformanceChart;
