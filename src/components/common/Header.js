import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, LogOut, Wallet, Users, ArrowLeftRight, GraduationCap, FlaskConical, Search, BellRing, Menu, X } from 'lucide-react';
import { useAccount } from '../../context/AccountContext';
import { useStrapiAuth } from '../../hooks/useApiTrades';
import AppLogo from './Logo';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { accountType } = useAccount();
  const { user, logout } = useStrapiAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // No renderizar el header en login, selección de cuenta o en el Personal Hub
  if (
    location.pathname === '/login' || 
    location.pathname === '/select-account' ||
    location.pathname.startsWith('/personal')
  ) {
    return null;
  }

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  return (
    <HeaderContainer>
      <HeaderBrand>
        <AppLogo size="32px" fontSize="1.5rem" />
        <AccountBadge className={accountType}>
          {accountType === 'propia' ? <Wallet size={14} /> : <Users size={14} />}
          <span className="badge-text">
            {accountType === 'propia' ? 'Cuenta Propia' : 'Cuenta Compartida'}
          </span>
        </AccountBadge>
        <MobileMenuButton onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </MobileMenuButton>
      </HeaderBrand>

      <HeaderNav $isOpen={isMobileMenuOpen}>
        <NavItem
          $active={location.pathname === '/dashboard'}
          onClick={() => { navigate('/dashboard'); setIsMobileMenuOpen(false); }}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </NavItem>
        <NavItem
          $active={location.pathname === '/trades'}
          onClick={() => { navigate('/trades'); setIsMobileMenuOpen(false); }}
        >
          <BookOpen size={18} />
          Portafolio
        </NavItem>
        <NavItem
          $active={location.pathname === '/lab'}
          onClick={() => { navigate('/lab'); setIsMobileMenuOpen(false); }}
        >
          <FlaskConical size={18} />
          Lab
        </NavItem>
        <NavItem
          $active={location.pathname === '/metodologia'}
          onClick={() => { navigate('/metodologia'); setIsMobileMenuOpen(false); }}
        >
          <GraduationCap size={18} />
          Métodología
        </NavItem>
        <NavItem
          $active={location.pathname === '/screener'}
          onClick={() => { navigate('/screener'); setIsMobileMenuOpen(false); }}
        >
          <Search size={18} />
          Screener
        </NavItem>
        <NavItem
          $active={location.pathname === '/alertas'}
          onClick={() => { navigate('/alertas'); setIsMobileMenuOpen(false); }}
        >
          <BellRing size={18} />
          Alertas
        </NavItem>
      </HeaderNav>

      <HeaderActions>
        <SwitchButton onClick={() => navigate('/select-account')}>
          <ArrowLeftRight size={18} />
          Cambiar Cartera
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
  background-color: #1e293b;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
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

const AccountBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 600;

  &.propia {
    background: rgba(101, 29, 35, 0.15);
    color: #A9333F;
    border: 1px solid rgba(101, 29, 35, 0.2);
  }

  &.compartida {
    background: rgba(16, 185, 129, 0.15);
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.2);
  }

  @media (max-width: 1200px) {
    .badge-text {
      display: none;
    }
  }

  @media (max-width: 350px) {
    font-size: 0.7rem;
    padding: 0.25rem 0.5rem;
  }
`;

const HeaderNav = styled.nav`
  display: flex;
  gap: 1.5rem; /* Más espacio entre items para notebook */
  flex: 1;
  justify-content: center;

  @media (min-width: 1201px) {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  @media (max-width: 1200px) {
    gap: 0.75rem;
  }

  @media (max-width: 768px) {
    display: ${props => props.$isOpen ? 'flex' : 'none'};
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    transform: none;
    flex-direction: column;
    background-color: #1e293b;
    padding: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    z-index: 999;
  }
`;

const NavItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#94a3b8'};
  border: none;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  font-size: 0.8rem; /* Letra más chica para notebook */
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-height: 36px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  @media (max-width: 1024px) {
    font-size: 0.75rem;
    padding: 0.35rem 0.6rem;
  }

  @media (max-width: 768px) {
    font-size: 0.9rem; /* En mobile, el menú hamburguesa puede tener letra normal */
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

export default Header;
