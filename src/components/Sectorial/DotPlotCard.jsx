import React from 'react';
import styled from 'styled-components';
import { SiTradingview } from 'react-icons/si';
import { getTVSymbol } from '../Screener/ScreenerPage';

const DotPlotCard = ({ title, subtitle, data, dataKey }) => {
  if (!data || data.length === 0) return null;

  // Calculate stats
  const validValues = data.map(d => d[dataKey]).filter(v => typeof v === 'number' && !isNaN(v));
  if (validValues.length === 0) return null;

  const maxAbsValue = Math.max(...validValues.map(Math.abs));
  // Scale max slightly so dots don't touch the edges
  const scaleMax = maxAbsValue === 0 ? 1 : maxAbsValue * 1.2;

  const average = validValues.reduce((a, b) => a + b, 0) / validValues.length;
  
  // Median
  const sortedVals = [...validValues].sort((a, b) => a - b);
  const mid = Math.floor(sortedVals.length / 2);
  const median = sortedVals.length % 2 !== 0 ? sortedVals[mid] : (sortedVals[mid - 1] + sortedVals[mid]) / 2;

  // Sparkline Component
  const Sparkline = ({ points, isPositive }) => {
    if (!points || points.length < 2) return <div style={{ width: 60 }} />;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min === 0 ? 1 : max - min;
    
    const width = 60;
    const height = 24;
    
    const coords = points.map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    const color = isPositive ? '#10b981' : '#f43f5e';

    return (
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          points={coords}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardSubtitle>{subtitle}</CardSubtitle>
      </CardHeader>

      <Table>
        <TableHeader>
          <ColSector>SECTOR</ColSector>
          <ColPlot>
            <PlotLabelDown>▼ BAJÓ</PlotLabelDown>
            <PlotLabelUp>▲ SUBIÓ</PlotLabelUp>
          </ColPlot>
          <ColTrend>TENDENCIA</ColTrend>
          <ColPerf>RENDIMIENTO</ColPerf>
        </TableHeader>

        <TableBody>
          {data.map((row) => {
            if (row.error) return null;
            const val = row[dataKey];
            const isPos = val >= 0;
            const color = isPos ? '#10b981' : '#f43f5e';
            
            // Calculate width percentage relative to half the plot area
            const widthPct = (Math.abs(val) / scaleMax) * 50;
            
            return (
              <Row key={row.id}>
                <ColSector>
                  <Name>{row.name}</Name>
                  <TickerContainer>
                    <Ticker>{row.ticker}</Ticker>
                    <TVLink 
                      href={`https://es.tradingview.com/chart/iI2KiaxW/?symbol=${getTVSymbol(row.ticker)}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="Abrir en TradingView"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <SiTradingview size={12} />
                    </TVLink>
                  </TickerContainer>
                </ColSector>
                <ColPlot>
                  <PlotTrack>
                    <CenterLine />
                    <Bar
                      $isPos={isPos}
                      style={{
                        width: `${widthPct}%`,
                        left: isPos ? '50%' : `${50 - widthPct}%`
                      }}
                    />
                    <Dot
                      $color={color}
                      style={{
                        left: isPos ? `${50 + widthPct}%` : `${50 - widthPct}%`
                      }}
                    />
                  </PlotTrack>
                </ColPlot>
                <ColTrend>
                  <Sparkline points={row.sparkline} isPositive={isPos} />
                </ColTrend>
                <ColPerf>
                  <Pill $color={color}>
                    {isPos ? '+' : ''}{val.toFixed(2)}%
                  </Pill>
                </ColPerf>
              </Row>
            );
          })}
        </TableBody>
      </Table>

      <CardFooter>
        <FooterStat>
          <FooterLabel>PROMEDIO DEL SECTOR</FooterLabel>
          <FooterValue $isPos={average >= 0}>
            {average >= 0 ? '+' : ''}{average.toFixed(2)}%
          </FooterValue>
        </FooterStat>
        <FooterStat>
          <FooterLabel>MEDIANA DEL SECTOR</FooterLabel>
          <FooterValue $isPos={median >= 0}>
            {median >= 0 ? '+' : ''}{median.toFixed(2)}%
          </FooterValue>
        </FooterStat>
      </CardFooter>
    </Card>
  );
};

// ─── Estilos ─────────────────────────────────────────────────────────────────

const Card = styled.div`
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const CardHeader = styled.div`
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;

const CardTitle = styled.h3`
  margin: 0;
  font-family: 'Unbounded', sans-serif;
  font-size: 1.1rem;
  color: white;
`;

const CardSubtitle = styled.p`
  margin: 0.25rem 0 0 0;
  color: #94a3b8;
  font-size: 0.85rem;
`;

const Table = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 1.5rem;
`;

const TableHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem 0 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 0.5rem;
`;

const ColSector = styled.div`
  flex: 0 0 25%;
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const ColPlot = styled.div`
  flex: 1;
  display: flex;
  justify-content: space-between;
  padding: 0 1rem;
`;

const PlotLabelDown = styled.span`
  font-size: 0.75rem;
  color: #f43f5e;
  font-weight: 700;
  letter-spacing: 0.05em;
`;

const PlotLabelUp = styled.span`
  font-size: 0.75rem;
  color: #10b981;
  font-weight: 700;
  letter-spacing: 0.05em;
`;

const ColTrend = styled.div`
  flex: 0 0 80px;
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-align: center;
`;

const ColPerf = styled.div`
  flex: 0 0 100px;
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-align: right;
`;

const TableBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-bottom: 1rem;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  padding: 0.4rem 0;
  
  &:hover {
    background: rgba(255, 255, 255, 0.02);
    border-radius: 6px;
  }
`;

const Name = styled.span`
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TickerContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const Ticker = styled.span`
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
`;

const TVLink = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  transition: all 0.2s ease;
  padding: 2px;
  border-radius: 4px;
  
  &:hover {
    color: #3b82f6; /* Color de TV o azul brillante */
    background: rgba(59, 130, 246, 0.1);
  }
`;

const PlotTrack = styled.div`
  position: relative;
  width: 100%;
  height: 24px;
  display: flex;
  align-items: center;
`;

const CenterLine = styled.div`
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(255, 255, 255, 0.1);
`;

const Bar = styled.div`
  position: absolute;
  height: 2px;
  background: ${props => props.$isPos ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'};
  z-index: 1;
`;

const Dot = styled.div`
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${props => props.$color};
  transform: translate(-50%, 0);
  z-index: 2;
  box-shadow: 0 0 8px ${props => props.$color}40;
`;

const Pill = styled.div`
  display: inline-flex;
  justify-content: center;
  align-items: center;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  background: ${props => props.$color}15;
  color: ${props => props.$color};
  border: 1px solid ${props => props.$color}30;
  width: 100%;
  box-sizing: border-box;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  margin-top: auto;
`;

const FooterStat = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const FooterLabel = styled.span`
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
`;

const FooterValue = styled.span`
  color: ${props => props.$isPos ? '#10b981' : '#f43f5e'};
  font-size: 0.95rem;
  font-weight: 700;
`;

export default DotPlotCard;
