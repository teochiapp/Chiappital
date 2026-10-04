import React, { useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useAlerts } from '../../context/AlertsContext';
import { BellRing, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { colors } from '../../styles/colors';

const p = colors.personal || { primaryLight: '#34d399' }; // fallback

const MarketAlertModal = () => {
  const { triggeredAlerts, dismissTriggeredAlert } = useAlerts();
  const bgAudioRef = useRef(null);

  // Take the first triggered alert if there are multiple, to show one by one
  const currentAlert = triggeredAlerts[0];

  useEffect(() => {
    if (currentAlert && bgAudioRef.current) {
      bgAudioRef.current.volume = 0.5; // Ajustar volumen si es necesario
      bgAudioRef.current.play().catch(e => console.warn('Audio play failed:', e));
    }
  }, [currentAlert]);

  if (!currentAlert) return null;

  const handleDismiss = () => {
    if (bgAudioRef.current) {
      bgAudioRef.current.pause();
      bgAudioRef.current.currentTime = 0;
    }
    dismissTriggeredAlert(currentAlert.id);
  };

  const isAbove = currentAlert.condition_type === 'above';

  return (
    <>
      <Overlay onClick={handleDismiss} />
      <ModalContainer>
        <ModalContent>
          <IconWrapper $isAbove={isAbove}>
            {isAbove ? <ArrowUpRight size={40} color="#34d399" /> : <ArrowDownRight size={40} color="#f43f5e" />}
          </IconWrapper>
          <Title>¡Alerta de Mercado!</Title>
          <SymbolDisplay>{currentAlert.symbol}</SymbolDisplay>
          
          <Description>
            Ha cruzado el precio objetivo que configuraste.
          </Description>

          <PriceInfo>
            <PriceRow>
              <span>Objetivo:</span>
              <TargetPrice>${parseFloat(currentAlert.target_price).toFixed(2)}</TargetPrice>
            </PriceRow>
            <PriceRow>
              <span>Actual:</span>
              <CurrentPrice $isAbove={isAbove}>${parseFloat(currentAlert.triggered_price).toFixed(2)}</CurrentPrice>
            </PriceRow>
          </PriceInfo>

          {currentAlert.notes && (
            <NotesBox>
              <strong>Notas:</strong> {currentAlert.notes}
            </NotesBox>
          )}

          <AudioControls>
            <ControlBtn onClick={handleDismiss}>
              Cerrar Alerta
            </ControlBtn>
          </AudioControls>

          {/* Audio from public folder */}
          <audio ref={bgAudioRef} src="/TheEndBegins.mp3" loop />
          
          <CloseBtn onClick={handleDismiss}>
            <X size={20} />
          </CloseBtn>
        </ModalContent>
      </ModalContainer>
    </>
  );
};

// --- Styles ---

const slideUp = keyframes`
  from { opacity: 0; transform: translate(-50%, 20px) scale(0.95); }
  to { opacity: 1; transform: translate(-50%, 0) scale(1); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(4px);
  z-index: 9998;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ModalContainer = styled.div`
  position: fixed;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 450px;
  background: #1e293b;
  border: 1px solid rgba(245, 158, 11, 0.4);
  border-radius: 20px;
  z-index: 9999;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(245, 158, 11, 0.2);
  animation: ${slideUp} 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
`;

const ModalContent = styled.div`
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
`;

const IconWrapper = styled.div`
  background: ${p => p.$isAbove ? 'rgba(52, 211, 153, 0.15)' : 'rgba(244, 63, 94, 0.15)'};
  padding: 1.25rem;
  border-radius: 50%;
  margin-bottom: 1.5rem;
  box-shadow: 0 0 20px ${p => p.$isAbove ? 'rgba(52, 211, 153, 0.2)' : 'rgba(244, 63, 94, 0.2)'};
`;

const SymbolDisplay = styled.div`
  font-family: 'Unbounded', sans-serif;
  font-size: 3.5rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 0 30px rgba(245, 158, 11, 0.4);
  letter-spacing: 2px;
  margin-bottom: 0.5rem;
`;

const Title = styled.h2`
  font-family: 'Unbounded', sans-serif;
  color: #f59e0b;
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
`;

const Description = styled.p`
  color: #e2e8f0;
  font-size: 1rem;
  margin: 0 0 1.5rem 0;
  font-weight: 500;
`;

const PriceInfo = styled.div`
  background: rgba(255, 255, 255, 0.03);
  padding: 1.2rem;
  border-radius: 12px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const PriceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.1rem;
  color: #94a3b8;
`;

const TargetPrice = styled.span`
  font-weight: 700;
  color: #cbd5e1;
`;

const CurrentPrice = styled.span`
  font-weight: 700;
  color: ${p => p.$isAbove ? '#34d399' : '#f43f5e'};
`;

const NotesBox = styled.div`
  background: rgba(245, 158, 11, 0.1);
  border-left: 4px solid #f59e0b;
  padding: 0.8rem;
  border-radius: 4px;
  width: 100%;
  font-size: 0.9rem;
  color: #e2e8f0;
  text-align: left;
  margin-bottom: 1.5rem;
`;

const AudioControls = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;

const ControlBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #f59e0b, #ea580c);
  color: white;
  border: none;
  padding: 0.85rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  justify-content: center;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
  }
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255,255,255,0.1);
    color: white;
  }
`;

export default MarketAlertModal;
