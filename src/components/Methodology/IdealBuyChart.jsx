import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const ChartContainer = styled.div`
  width: 100%;
  padding: 1.5rem;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  
  @media (min-width: 768px) {
    flex-direction: row;
    gap: 1rem;
  }
`;

const ChartBox = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
`;

const ChartHeader = styled.h4`
  color: #e2e8f0;
  font-family: 'Unbounded', sans-serif;
  font-size: 0.95rem;
  margin-bottom: 1rem;
  text-align: center;
`;

const SVGContainer = styled.div`
  width: 100%;
  max-width: 400px;
  height: 250px;
  position: relative;
`;

const Label = styled(motion.div)`
  position: absolute;
  color: ${props => props.$color || '#94a3b8'};
  font-size: 0.75rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  background: rgba(15, 23, 42, 0.9);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  border: 1px solid ${props => props.$color ? `${props.$color}40` : 'rgba(255,255,255,0.1)'};
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Legend = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  gap: 1.5rem;
  margin-top: 1rem;
  font-size: 0.8rem;
  color: #94a3b8;
  
  div {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  
  span {
    display: inline-block;
    width: 16px;
    height: 3px;
    border-radius: 2px;
  }
`;

const IdealBuyChart = () => {
  // --- INVESTOR CHART ---
  const investorPrice = `M 10,20 L 25,60 L 35,50 L 55,120 L 75,160 L 95,135 L 115,165 L 135,145 L 155,170 L 175,140 L 185,115 L 200,135 L 225,90 L 245,105 L 275,50`;
  const investorMA = `M 20,20 Q 90,145 160,150 T 280,140`;
  const investorRes = `M 80,135 L 220,135`;

  // --- TRADER CHART ---
  const traderPrice = `M 10,170 Q 30,120 50,110 L 70,125 L 90,85 L 115,125 L 145,95 L 165,120 L 180,95 L 195,120 L 205,85 L 225,35 L 245,55 L 275,10`;
  const traderMA = `M 10,210 Q 150,150 280,70`;
  const traderTopLine = `M 80,85 L 220,100`;
  const traderBotLine = `M 85,125 L 210,125`;

  // Volume bars (approximate for both)
  const renderVolume = (type) => {
    const bars = [];
    for (let i = 0; i < 28; i++) {
      const x = 10 + i * 10;
      let h = Math.random() * 20 + 5;
      
      if (type === 'investor') {
        if (i < 5) h += 30; // initial drop high volume
        if (i > 17 && i < 21) h += 40; // breakout high volume
      } else {
        if (i < 6) h += 30; // initial runup
        if (i > 19 && i < 23) h += 45; // breakout volume
      }
      
      bars.push(
        <rect key={i} x={x} y={230 - h} width="4" height={h} fill="rgba(148, 163, 184, 0.3)" />
      );
    }
    return bars;
  };

  return (
    <div style={{ width: '100%' }}>
      <ChartContainer>
        
        {/* INVESTOR CHART */}
        <ChartBox>
          <ChartHeader>Compra Ideal para Inversores</ChartHeader>
          <SVGContainer>
            <svg viewBox="0 0 300 250" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              {/* Background grid */}
              <line x1="0" y1="50" x2="300" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="125" x2="300" y2="125" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="200" x2="300" y2="200" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="4 4" />
              
              {renderVolume('investor')}
              <text x="10" y="190" fill="#94a3b8" fontSize="10" fontFamily="Inter">Volumen</text>

              {/* Resistance */}
              <motion.path d={investorRes} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" />

              {/* MA */}
              <motion.path
                d={investorMA}
                fill="none"
                stroke="#eab308"
                strokeWidth="2.5"
                strokeDasharray="5 5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut", delay: 0.2 }}
              />

              {/* Price */}
              <motion.path
                d={investorPrice}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />

              {/* Breakout Arrow (Pullback for Investor) */}
              <motion.path
                d="M 200,105 L 200,130 L 195,125 M 200,130 L 205,125"
                stroke="#ef4444"
                strokeWidth="2"
                fill="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.2 }}
              />
            </svg>

            <Label 
              $color="#ef4444" 
              style={{ top: '75px', left: '170px' }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2.3 }}
            >
              <span>Compra 'A'</span>
            </Label>
            <Label style={{ top: '150px', left: '180px', background: 'transparent', border: 'none' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
              MM 30
            </Label>
          </SVGContainer>
        </ChartBox>

        {/* TRADER CHART */}
        <ChartBox>
          <ChartHeader>Compra Ideal para Traders</ChartHeader>
          <SVGContainer>
            <svg viewBox="0 0 300 250" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              {/* Background grid */}
              <line x1="0" y1="50" x2="300" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="125" x2="300" y2="125" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="200" x2="300" y2="200" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="4 4" />

              {renderVolume('trader')}
              <text x="10" y="210" fill="#94a3b8" fontSize="10" fontFamily="Inter">Volumen</text>

              {/* Consolidation */}
              <motion.path d={traderTopLine} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" />
              <motion.path d={traderBotLine} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" />

              {/* MA */}
              <motion.path
                d={traderMA}
                fill="none"
                stroke="#eab308"
                strokeWidth="2.5"
                strokeDasharray="5 5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut", delay: 0.2 }}
              />

              {/* Price */}
              <motion.path
                d={traderPrice}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />

              {/* Breakout Arrow (Trader) */}
              <motion.path
                d="M 200,70 L 200,95 L 195,90 M 200,95 L 205,90"
                stroke="#22c55e"
                strokeWidth="2"
                fill="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.2 }}
              />
            </svg>

            <Label 
              $color="#22c55e" 
              style={{ top: '45px', left: '170px' }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2.3 }}
            >
              <span>Compra 'A'</span>
            </Label>
            <Label style={{ top: '130px', left: '200px', background: 'transparent', border: 'none' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
              MM 30
            </Label>
          </SVGContainer>
        </ChartBox>

      </ChartContainer>

      <Legend>
        <div><span style={{ background: '#3b82f6' }}></span> Precio</div>
        <div><span style={{ background: '#eab308' }}></span> MM 30-Sem</div>
        <div><span style={{ background: 'rgba(255,255,255,0.3)' }}></span> Resistencia/Soporte</div>
      </Legend>
    </div>
  );
};

export default IdealBuyChart;
