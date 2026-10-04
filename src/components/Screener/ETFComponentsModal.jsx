import React from 'react';
import styled from 'styled-components';
import { Layers, X, ChevronRight, BellRing } from 'lucide-react';
import { getTVSymbol, RegionFlag, OpScoreCircle, ScanResultRow, ScanResultLeft, ScanResultSymbol, ScanResultName, ScanResultMeta, ScanResultSector, ScanResultRight, ScanResultPrice, ScanEmaChip, ScanTVLink, AlertActionBtn, ActionsWrap } from './ScreenerPage';

// Estilos específicos para el Modal Centrado
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContent = styled.div`
  background: #0f172a;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  width: 1050px;
  max-width: 98vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  animation: scaleUp 0.2s ease-out;

  @keyframes scaleUp {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  background: rgba(30,41,59,0.5);
`;

const Body = styled.div`
  padding: 0;
  overflow-y: auto;
  flex: 1;
  
  /* Scrollbar custom */
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
  &::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
`;

const MetaHeader = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  font-size: 0.9rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255,255,255,0.1);
    color: white;
  }
`;

const ETFComponentsModal = ({ 
  selectedETF, 
  etfComponents, 
  onClose, 
  onOpenOpScore, 
  onOpenAlert 
}) => {
  if (!selectedETF) return null;

  return (
    <Overlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <Header>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Layers size={24} color="#6366f1" />
            <h3 style={{ margin: 0, color: 'white', fontSize: '1.35rem', letterSpacing: '.02em', fontWeight: 600 }}>
              {selectedETF.title}
            </h3>
          </div>
          <CloseButton onClick={onClose}>
            <X size={22} />
          </CloseButton>
        </Header>
        
        <MetaHeader>
          <span style={{ color: '#10b981' }}>✅ {selectedETF.type}</span>
          <span>·</span>
          <span>{etfComponents.length} componente{etfComponents.length !== 1 ? 's' : ''} vinculado{etfComponents.length !== 1 ? 's' : ''}</span>
        </MetaHeader>

        <Body>
          <div style={{ padding: '8px 12px' }}>
            {etfComponents.map(s => (
              <ScanResultRow key={s.symbol}>
                <ScanResultLeft>
                  <ScanResultSymbol>{s.symbol}</ScanResultSymbol>
                  <ScanResultName>{s.name}</ScanResultName>
                  <ScanResultMeta>
                    <RegionFlag code={s.region} showName={false} />
                    {s.sector && s.sector !== 'General' && <ScanResultSector>{s.sector}</ScanResultSector>}
                  </ScanResultMeta>
                </ScanResultLeft>
                <ScanResultRight style={{ display: 'flex', gap: '30px', alignItems: 'center', flexWrap: 'nowrap', flexDirection: 'row' }}>
                  
                  {/* OP Score */}
                  <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}>
                    <OpScoreCircle $score={s.opScore || 0} onClick={() => onOpenOpScore(s)} style={{ width: '32px', height: '32px', fontSize: '0.8rem', cursor: 'pointer' }}>
                      {s.opScore || 0}
                    </OpScoreCircle>
                  </div>
                  
                  {/* Setup / TW */}
                  <div style={{ width: '150px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                    {s.setupState && s.setupVerdict && s.setupState !== 'neutral' ? (
                      <div 
                        style={{
                          fontSize: '0.7rem',
                          lineHeight: '1.2',
                          textAlign: 'right',
                          whiteSpace: 'normal',
                          color: 
                            s.setupState === 'strong_uptrend' ? '#10b981' :
                            s.setupState === 'bullish_breakout' ? '#f97316' :
                            s.setupState === 'bullish_pullback' ? '#3b82f6' :
                            s.setupState === 'bullish_reversal_confirmed' ? '#8b5cf6' :
                            s.setupState === 'early_bullish_reversal' ? '#d946ef' :
                            s.setupState === 'bearish_trend' ? '#ef4444' :
                            s.setupState === 'lateral_trend' ? '#eab308' :
                            '#94a3b8'
                        }}
                      >
                        {s.setupVerdict}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Sin Setup</div>
                    )}
                  </div>

                  {/* Price & EMA */}
                  <div style={{ width: '140px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <ScanResultPrice>{s.price ? `$${s.price.toFixed(2)}` : '—'}</ScanResultPrice>
                    {s.emaDistance !== null && (
                      <ScanEmaChip $pos={s.emaDistance >= 0} $close={Math.abs(s.emaDistance) < 0.5}>
                        {s.emaDistance >= 0 ? '+' : ''}{s.emaDistance.toFixed(2)}% EMA21
                      </ScanEmaChip>
                    )}
                  </div>

                  {/* Actions */}
                  <ActionsWrap style={{ marginLeft: '12px' }}>
                    <ScanTVLink
                      href={`https://es.tradingview.com/chart/iI2KiaxW/?symbol=${getTVSymbol(s.symbol)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Ver en TradingView"
                    >
                      <ChevronRight size={16} />
                    </ScanTVLink>
                    <AlertActionBtn style={{ padding: '6px' }} onClick={() => onOpenAlert(s.symbol, s.price)} title="Crear Alerta">
                      <BellRing size={15} />
                    </AlertActionBtn>
                  </ActionsWrap>
                </ScanResultRight>
              </ScanResultRow>
            ))}
            
            {etfComponents.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.95rem' }}>
                No se encontraron componentes asociados.
              </div>
            )}
          </div>
        </Body>
      </ModalContent>
    </Overlay>
  );
};

export default ETFComponentsModal;
