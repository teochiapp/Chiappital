import React from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Target, Dumbbell, Briefcase, Globe, ChefHat, Brain } from 'lucide-react';
import AppLogo from '../../../components/common/Logo';

const PersonalHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();

  if (!location.pathname.startsWith('/personal')) {
    return null;
  }

  return (
    <HeaderContainer>
      <HeaderBrand>
        <AppLogo size="32px" fontSize="1.5rem" />
        <Badge>
          <span>🌱</span>
          Personal OS
        </Badge>
      </HeaderBrand>

      <HeaderNav>
        <NavItem
          $active={location.pathname === '/personal'}
          onClick={() => navigate('/personal')}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </NavItem>
        <NavItem
          $active={location.pathname === '/personal/habits'}
          onClick={() => navigate('/personal/habits')}
        >
          <Dumbbell size={18} />
          Hábitos
        </NavItem>
        <NavItem
          $active={location.pathname === '/personal/goals'}
          onClick={() => navigate('/personal/goals')}
        >
          <Target size={18} />
          Objetivos
        </NavItem>
        <NavItem
          $active={location.pathname === '/personal/languages'}
          onClick={() => navigate('/personal/languages')}
        >
          <Globe size={18} />
          Idiomas
        </NavItem>
        <NavItem
          $active={location.pathname === '/personal/mental-models'}
          onClick={() => navigate('/personal/mental-models')}
        >
          <Brain size={18} />
          Mental Models
        </NavItem>
        <NavItem
          $active={location.pathname.startsWith('/personal/mediterranean')}
          $med
          onClick={() => navigate('/personal/mediterranean')}
        >
          <ChefHat size={18} />
          Recetario
        </NavItem>
      </HeaderNav>

      <HeaderActions>
        <SwitchButton onClick={() => navigate('/dashboard')}>
          <Briefcase size={18} />
          Ir a Inversiones
        </SwitchButton>
      </HeaderActions>
    </HeaderContainer>
  );
};

// ─── Estilos ─────────────────────────────────────────────────────────────────

const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 2rem;
  background-color: #0f172a;
  border-bottom: 1px solid rgba(16, 185, 129, 0.1);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  color: white;
  position: sticky;
  top: 0;
  z-index: 1000;
  gap: 0.5rem;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    padding: 0.6rem 1rem;
    gap: 0.5rem;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
    padding: 0.5rem 0.75rem;
    gap: 0.4rem;
  }

  @media (max-width: 350px) {
    padding: 0.4rem 0.5rem;
    gap: 0.3rem;
  }
`;

const HeaderBrand = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;

  @media (max-width: 480px) {
    justify-content: space-between;
    width: 100%;
  }
`;

const Badge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 600;
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);

  @media (max-width: 350px) {
    font-size: 0.7rem;
    padding: 0.25rem 0.5rem;
  }
`;

const HeaderNav = styled.nav`
  display: flex;
  gap: 0.5rem;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);

  @media (max-width: 768px) {
    position: static;
    transform: none;
    justify-content: center;
    flex-wrap: wrap;
  }

  @media (max-width: 480px) {
    width: 100%;
    overflow-x: auto;
    flex-wrap: nowrap;
    justify-content: flex-start;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
    padding-bottom: 2px;
  }
`;

const NavItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: ${props => props.$active ? (props.$med ? 'rgba(107, 142, 35, 0.15)' : 'rgba(16, 185, 129, 0.15)') : 'transparent'};
  color: ${props => props.$active ? (props.$med ? '#8FAF35' : '#10b981') : '#94a3b8'};
  border: none;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-height: 36px;

  &:hover {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }

  @media (max-width: 480px) {
    font-size: 0.78rem;
    padding: 0.35rem 0.6rem;
  }

  @media (max-width: 350px) {
    font-size: 0.72rem;
    padding: 0.3rem 0.5rem;
    gap: 0.25rem;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;

  @media (max-width: 480px) {
    display: none;
  }
`;

const SwitchButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.05);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 36px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

export default PersonalHeader;
