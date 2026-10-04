import React, { useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { usePersonalHub } from '../../../context/PersonalHubContext';
import { Clock, Play, Pause, X, CheckCircle2 } from 'lucide-react';
import { colors } from '../../../styles/colors';

const p = colors.personal;

const FocusSessionAlert = () => {
  const { activeFocusSession, setActiveFocusSession } = usePersonalHub();
  const [isPlaying, setIsPlaying] = useState(false); // For TheEndBegins.mp3
  const [timerMode, setTimerMode] = useState(false);
  const [timerFinished, setTimerFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const bgAudioRef = useRef(null);
  const alarmAudioRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!activeFocusSession) {
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
        bgAudioRef.current.currentTime = 0;
      }
      if (alarmAudioRef.current) {
        alarmAudioRef.current.pause();
        alarmAudioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      setTimerMode(false);
      setTimerFinished(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [activeFocusSession]);

  // Manejador del contador
  useEffect(() => {
    if (timerMode && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimerFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerMode, timeLeft]);

  const handleTimerFinish = () => {
    setTimerFinished(true);
    setTimerMode(false);
    
    // Detener música de fondo
    if (bgAudioRef.current) {
      bgAudioRef.current.pause();
      setIsPlaying(false);
    }
    
    // Reproducir alarma
    if (alarmAudioRef.current) {
      alarmAudioRef.current.play().catch(e => console.warn('Error reproduciendo alarma', e));
    }
  };

  const startTimer = () => {
    setTimerMode(true);
    setTimeLeft(activeFocusSession.duration * 60);
    
    // Detener música de fondo durante el bloque de focus
    if (bgAudioRef.current) {
      bgAudioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const dismissAlert = () => {
    if (bgAudioRef.current) bgAudioRef.current.pause();
    if (alarmAudioRef.current) alarmAudioRef.current.pause();
    setActiveFocusSession(null);
  };

  if (!activeFocusSession) return null;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <>
      <Overlay onClick={dismissAlert} />
      <ModalContainer>
        <ModalContent $isTimer={timerMode}>
          {!timerMode && !timerFinished ? (
            <>
              <IconWrapper>
                <Clock size={40} color={p.primaryLight} />
              </IconWrapper>
              <Title>¡Hora de Focus Session!</Title>
              <Description>{activeFocusSession.description}</Description>
              
              <TimeInfo>
                Comienza a las: {new Date(activeFocusSession.session_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                <br />
                Duración: {activeFocusSession.duration} minutos
              </TimeInfo>

              <AudioControls>
                <ControlBtn onClick={startTimer}>
                  <Play size={20} />
                  Iniciar Bloque de Focus
                </ControlBtn>
              </AudioControls>
            </>
          ) : timerFinished ? (
            <>
              <IconWrapper>
                <CheckCircle2 size={40} color="#34d399" />
              </IconWrapper>
              <Title>¡Bloque Terminado!</Title>
              <Description>Excelente trabajo completando tu sesión.</Description>
              <AudioControls style={{ marginTop: '2rem' }}>
                <ControlBtn onClick={dismissAlert}>
                  Cerrar
                </ControlBtn>
              </AudioControls>
            </>
          ) : (
            <>
              <TimerTitle>{activeFocusSession.description}</TimerTitle>
              <TimerDisplay>
                {formatTime(timeLeft)}
              </TimerDisplay>
            </>
          )}
          
          <audio ref={bgAudioRef} src="/TheEndBegins.mp3" autoPlay loop />
          <audio ref={alarmAudioRef} src="/Sacrifice.mp3" />
          
          <CloseBtn onClick={dismissAlert}>
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
  border: 1px solid rgba(82, 183, 136, 0.4);
  border-radius: 20px;
  z-index: 9999;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(82, 183, 136, 0.2);
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
  background: rgba(82, 183, 136, 0.15);
  padding: 1.25rem;
  border-radius: 50%;
  margin-bottom: 1.5rem;
  box-shadow: 0 0 20px rgba(82, 183, 136, 0.2);
`;

const TimerTitle = styled.div`
  color: #94a3b8;
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 1rem;
`;

const TimerDisplay = styled.div`
  font-family: 'Unbounded', sans-serif;
  font-size: 4rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 0 30px rgba(82, 183, 136, 0.4);
  letter-spacing: 2px;
`;

const Title = styled.h2`
  font-family: 'Unbounded', sans-serif;
  color: white;
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
`;

const Description = styled.p`
  color: #e2e8f0;
  font-size: 1.1rem;
  margin: 0 0 1.5rem 0;
  font-weight: 500;
`;

const TimeInfo = styled.div`
  background: rgba(255, 255, 255, 0.03);
  padding: 1rem;
  border-radius: 12px;
  color: #94a3b8;
  font-size: 0.95rem;
  width: 100%;
  line-height: 1.5;
  margin-bottom: 2rem;
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
  background: ${p.primaryLight};
  color: #0f172a;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  justify-content: center;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(82, 183, 136, 0.3);
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

export default FocusSessionAlert;
