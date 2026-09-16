import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Target, Dumbbell, Briefcase, Globe, ChefHat, Brain, Shield, Timer, Menu, X } from 'lucide-react';
import AppLogo from '../../../components/common/Logo';

const PersonalHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!location.pathname.startsWith('/personal')) {
    return null;
  }

  return (
    <HeaderContainer>
      <HeaderTop>
        <HeaderBrand>
          <AppLogo size="32px" fontSize="1.5rem" />
          <Badge>
            <span>🌱</span>
            Personal OS
          </Badge>
          <MobileMenuButton onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </MobileMenuButton>
        </HeaderBrand>

        <HeaderActions>
          <SwitchButton onClick={() => navigate('/dashboard')}>
            <Briefcase size={18} />
            Ir a Inversiones
          </SwitchButton>
        </HeaderActions>
      </HeaderTop>

      <HeaderBottom>
        <HeaderNav $isOpen={isMobileMenuOpen}>
          <NavItem
            $active={location.pathname === '/personal'}
            onClick={() => { navigate('/personal'); setIsMobileMenuOpen(false); }}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </NavItem>
          <NavItem
            $active={location.pathname === '/personal/habits'}
            onClick={() => { navigate('/personal/habits'); setIsMobileMenuOpen(false); }}
          >
            <Dumbbell size={18} />
            Hábitos
          </NavItem>
          <NavItem
            $active={location.pathname === '/personal/goals'}
            onClick={() => { navigate('/personal/goals'); setIsMobileMenuOpen(false); }}
          >
            <Target size={18} />
            Objetivos
          </NavItem>
          <NavItem
            $active={location.pathname === '/personal/focus'}
            onClick={() => { navigate('/personal/focus'); setIsMobileMenuOpen(false); }}
          >
            <Timer size={18} />
            Focus
          </NavItem>
          <NavItem
            $active={location.pathname === '/personal/languages'}
            onClick={() => { navigate('/personal/languages'); setIsMobileMenuOpen(false); }}
          >
            <Globe size={18} />
            Idiomas
          </NavItem>
          <NavItem
            $active={location.pathname === '/personal/mental-models'}
            onClick={() => { navigate('/personal/mental-models'); setIsMobileMenuOpen(false); }}
          >
            <Brain size={18} />
            Mental Models
          </NavItem>
          <NavItem
            $active={location.pathname === '/personal/cybersecurity'}
            onClick={() => { navigate('/personal/cybersecurity'); setIsMobileMenuOpen(false); }}
          >
            <Shield size={18} />
            Ciberseguridad
          </NavItem>
          <NavItem
            $active={location.pathname.startsWith('/personal/mediterranean')}
            $med
            onClick={() => { navigate('/personal/mediterranean'); setIsMobileMenuOpen(false); }}
          >
            <ChefHat size={18} />
            Recetario
          </NavItem>
        </HeaderNav>
      </HeaderBottom>
    </HeaderContainer>
  );
};

// ─── Estilos ─────────────────────────────────────────────────────────────────

const HeaderContainer = styled.header`
  display: flex;
  flex-direction: column;
  background-color: #0f172a;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  color: white;
  position: sticky;
  top: 0;
  z-index: 1000;
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 2rem;
  
  @media (max-width: 768px) {
    padding: 0.6rem 1rem;
  }

  @media (max-width: 480px) {
    padding: 0.5rem 0.75rem;
  }
`;

const HeaderBottom = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.5rem 2rem;
  background-color: rgba(0, 0, 0, 0.15);
  border-top: 1px solid rgba(16, 185, 129, 0.1);

  @media (max-width: 768px) {
    padding: 0;
    background-color: transparent;
    border-top: none;
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
  gap: 1rem;
  justify-content: center;
  width: 100%;

  @media (max-width: 1200px) {
    gap: 0.5rem;
  }

  @media (max-width: 768px) {
    display: ${props => props.$isOpen ? 'flex' : 'none'};
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    transform: none;
    flex-direction: column;
    background-color: #0f172a;
    padding: 1rem;
    border-bottom: 1px solid rgba(16, 185, 129, 0.1);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    z-index: 999;
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

  @media (max-width: 1024px) {
    font-size: 0.75rem;
    padding: 0.35rem 0.6rem;
  }

  @media (max-width: 768px) {
    font-size: 0.9rem;
    padding: 0.75rem 1rem;
    width: 100%;
    justify-content: flex-start;
  }

  @media (max-width: 350px) {
    font-size: 0.85rem;
    padding: 0.6rem 0.8rem;
    gap: 0.5rem;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: transparent;
  border: none;
  color: #e2e8f0;
  cursor: pointer;
  padding: 0.25rem;
  margin-left: 0.5rem;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
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
