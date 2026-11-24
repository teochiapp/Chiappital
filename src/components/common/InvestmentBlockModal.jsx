import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';
import { Palmtree, PauseCircle, LogOut } from 'lucide-react';
import { useStrapiAuth } from '../../hooks/useApiTrades';
import { getInvestmentLockState, toggleInvestmentLockState, INVESTMENT_LOCK_CONFIG } from '../../config/investmentLock';
import { colors } from '../../styles/colors';

const InvestmentBlockModal = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useStrapiAuth();
  const [isLocked, setIsLocked] = useState(() => getInvestmentLockState());

  // Escuchar cambios de estado de bloqueo y atajo rápido Ctrl + Shift + L
  useEffect(() => {
    setIsLocked(getInvestmentLockState());
  }, [location.search]);

  useEffect(() => {
    const handleLockChange = (e) => {
      setIsLocked(Boolean(e.detail));
    };

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        toggleInvestmentLockState();
      }
    };

    window.addEventListener('investment-lock-change', handleLockChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('investment-lock-change', handleLockChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Si el bloqueo no está activo, o estamos en login o en Personal Hub, no mostrar nada
  const isExcludedRoute = 
    location.pathname === '/login' || 
    location.pathname.startsWith('/personal');

  const shouldBlock = isLocked && !isExcludedRoute;

  // Bloquear scroll de fondo mientras esté activo
  useEffect(() => {
    if (shouldBlock) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [shouldBlock]);

  if (!shouldBlock) return null;

  const handleLogout = () => {
    if (logout) logout();
    navigate('/login');
  };

  return (
    <Overlay>
      <ModalCard onClick={(e) => e.stopPropagation()}>
        {/* Glow ambient effects */}
        <GlowBackdrop />

        {/* Top Badge */}
        <BadgeWrapper>
          <Badge>
            <Palmtree size={15} />
            {INVESTMENT_LOCK_CONFIG.badge}
          </Badge>
        </BadgeWrapper>

        {/* Hero Icon */}
        <IconContainer>
          <IconCircle>
            <Palmtree size={44} color="#f59e0b" />
          </IconCircle>
          <SubIconBadge>
            <PauseCircle size={20} color="#fbbf24" />
          </SubIconBadge>
        </IconContainer>

        {/* Main Cartel */}
        <CartelSign>
          <CartelGlowBar />
          <CartelQuotes>“</CartelQuotes>
          <CartelText>
            {INVESTMENT_LOCK_CONFIG.cartelText}
          </CartelText>
          <CartelQuotesEnd>”</CartelQuotesEnd>
        </CartelSign>

        {/* Descriptions */}
        <Description>
          {INVESTMENT_LOCK_CONFIG.subtitle}
        </Description>

        {/* Action Button */}
        <ButtonGroup>
          <LogoutButton onClick={handleLogout} type="button">
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </LogoutButton>
        </ButtonGroup>
      </ModalCard>
    </Overlay>
  );
};

// ─── Animaciones ─────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const scaleUp = keyframes`
  from {
    opacity: 0;
    transform: scale(0.92) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
`;

const pulseGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 25px rgba(245, 158, 11, 0.25);
  }
  50% {
    box-shadow: 0 0 45px rgba(245, 158, 11, 0.45);
  }
`;

// ─── Estilos ─────────────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(10, 15, 30, 0.94);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  animation: ${fadeIn} 0.3s ease-out;
  overflow-y: auto;
`;

const ModalCard = styled.div`
  background: linear-gradient(160deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 28px;
  width: 100%;
  max-width: 540px;
  padding: 2.75rem 2.25rem;
  box-shadow: 0 35px 70px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(245, 158, 11, 0.15);
  position: relative;
  overflow: hidden;
  text-align: center;
  animation: ${scaleUp} 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;

  @media (max-width: 520px) {
    padding: 2rem 1.5rem;
    border-radius: 20px;
  }
`;

const GlowBackdrop = styled.div`
  position: absolute;
  top: -80px;
  left: 50%;
  transform: translateX(-50%);
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 70%);
  pointer-events: none;
`;

const BadgeWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
`;

const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 1rem;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 9999px;
  color: #fbbf24;
  font-size: 0.78rem;
  font-weight: 700;
  font-family: 'Unbounded', sans-serif;
  letter-spacing: 0.5px;
  text-transform: uppercase;
`;

const IconContainer = styled.div`
  position: relative;
  display: inline-block;
  margin-bottom: 1.75rem;
`;

const IconCircle = styled.div`
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(245, 158, 11, 0.25), rgba(15, 23, 42, 0.8));
  border: 2px solid rgba(245, 158, 11, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  animation: ${pulseGlow} 3s infinite ease-in-out;
`;

const SubIconBadge = styled.div`
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: #0f172a;
  border: 2px solid #fbbf24;
  border-radius: 50%;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CartelSign = styled.div`
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.05) 100%);
  border: 2px dashed rgba(245, 158, 11, 0.45);
  border-radius: 18px;
  padding: 1.5rem 1.75rem;
  margin-bottom: 1.5rem;
  position: relative;
  box-shadow: inset 0 2px 10px rgba(245, 158, 11, 0.05);

  @media (max-width: 520px) {
    padding: 1.25rem 1rem;
  }
`;

const CartelGlowBar = styled.div`
  position: absolute;
  top: 0;
  left: 20%;
  right: 20%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #fbbf24, transparent);
`;

const CartelQuotes = styled.span`
  position: absolute;
  top: 4px;
  left: 12px;
  font-size: 2.2rem;
  line-height: 1;
  color: rgba(245, 158, 11, 0.35);
  font-family: Georgia, serif;
`;

const CartelQuotesEnd = styled.span`
  position: absolute;
  bottom: 0px;
  right: 12px;
  font-size: 2.2rem;
  line-height: 1;
  color: rgba(245, 158, 11, 0.35);
  font-family: Georgia, serif;
`;

const CartelText = styled.h2`
  font-family: 'Unbounded', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.45;
  color: #fef3c7;
  margin: 0;
  letter-spacing: -0.2px;

  @media (max-width: 520px) {
    font-size: 1.05rem;
  }
`;

const Description = styled.p`
  font-size: 0.95rem;
  line-height: 1.55;
  color: #94a3b8;
  margin: 0 0 1.25rem 0;

  @media (max-width: 520px) {
    font-size: 0.88rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  margin-top: 1.75rem;
`;

const LogoutButton = styled.button`
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(185, 28, 28, 0.25) 100%);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 14px;
  padding: 1rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  font-family: 'Unbounded', sans-serif;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  transition: all 0.25s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

  &:hover {
    color: #ffffff;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(185, 28, 28, 0.45) 100%);
    border-color: rgba(239, 68, 68, 0.6);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(239, 68, 68, 0.25);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 520px) {
    padding: 0.85rem 1.25rem;
    font-size: 0.88rem;
  }
`;

export default InvestmentBlockModal;
