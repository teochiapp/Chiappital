import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const ChartContainer = styled.div`
  width: 100%;
  padding: 2rem 1rem;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-top: 1.5rem;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ChartHeader = styled.h4`
  color: #94a3b8;
  font-family: 'Unbounded', sans-serif;
  font-size: 1rem;
  margin-bottom: 2rem;
  text-align: center;
`;

const SVGContainer = styled.div`
  width: 100%;
  max-width: 700px;
  height: 250px;
  position: relative;
`;

const Label = styled(motion.div)`
  position: absolute;
  color: ${props => props.$color || '#94a3b8'};
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  background: rgba(15, 23, 42, 0.8);
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  border: 1px solid ${props => props.$color ? `${props.$color}40` : 'rgba(255,255,255,0.1)'};
`;

const Legend = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-top: 1.5rem;
  font-size: 0.85rem;
  color: #94a3b8;
  
  div {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  span {
    display: inline-block;
    width: 20px;
    height: 3px;
    border-radius: 2px;
  }
`;

const MarketStagesChart = () => {
  // Price path (jagged lines to simulate real price action)
  const pricePath = `
    M 0,200 
    L 20,220 L 40,170 L 60,210 L 80,180 L 100,220 L 120,180 L 140,210
    L 160,170 L 170,190 L 190,140 L 200,160 L 230,100 L 240,130 L 270,60 L 285,90 L 320,40
    L 340,70 L 360,20 L 380,80 L 400,35 L 420,75 L 440,50 L 460,90
    L 480,150 L 495,130 L 515,190 L 530,170 L 550,230 L 570,200 L 590,240 L 600,220
  `;

  // Moving average (30-week) - smoother and lagging the price
  const maPath = `
    M 0,170 
    Q 75,220 150,205
    C 200,195 240,120 320,70
    C 390,30 430,60 470,100
    C 500,160 550,230 600,215
  `;

  return (
    <ChartContainer>
      <ChartHeader>Ciclo de Vida de una Acción (Las 4 Fases)</ChartHeader>
      
      <SVGContainer>
        <svg viewBox="0 0 600 250" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          
          {/* Grid lines */}
          <line x1="0" y1="50" x2="600" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1="125" x2="600" y2="125" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1="200" x2="600" y2="200" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />

          {/* Phase dividers */}
          <line x1="150" y1="0" x2="150" y2="250" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="2 4" />
          <line x1="330" y1="0" x2="330" y2="250" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="2 4" />
          <line x1="470" y1="0" x2="470" y2="250" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="2 4" />

          {/* 30-Week MA */}
          <motion.path
            d={maPath}
            fill="transparent"
            stroke="#eab308"
            strokeWidth="3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
          />

          {/* Price Action */}
          <motion.path
            d={pricePath}
            fill="transparent"
            stroke="#3b82f6"
            strokeWidth="3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        </svg>

        {/* Phase Labels */}
        <Label 
          $color="#94a3b8" 
          style={{ bottom: '10px', left: '10px' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          Fase 1: Suelo
        </Label>
        
        <Label 
          $color="#22c55e" 
          style={{ top: '80px', left: '180px' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
        >
          Fase 2: Avance (Compra)
        </Label>

        <Label 
          $color="#f59e0b" 
          style={{ top: '10px', left: '350px' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
        >
          Fase 3: Techo
        </Label>

        <Label 
          $color="#ef4444" 
          style={{ top: '100px', left: '490px' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5 }}
        >
          Fase 4: Declive
        </Label>
      </SVGContainer>

      <Legend>
        <div>
          <span style={{ background: '#3b82f6' }}></span> Precio de la Acción
        </div>
        <div>
          <span style={{ background: '#eab308' }}></span> Media Móvil 30 Semanas
        </div>
      </Legend>
    </ChartContainer>
  );
};

export default MarketStagesChart;
