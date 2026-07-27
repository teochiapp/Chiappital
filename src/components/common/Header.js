import React from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, LogOut, Wallet, Users, ArrowLeftRight, GraduationCap, FlaskConical, Search, BellRing } from 'lucide-react';
import { useAccount } from '../../context/AccountContext';
import { useStrapiAuth } from '../../hooks/useApiTrades';
import AppLogo from './Logo';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { accountType } = useAccount();
  const { user, logout } = useStrapiAuth();

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
          {accountType === 'propia' ? 'Cuenta Propia' : 'Cuenta Compartida'}
        </AccountBadge>
      </HeaderBrand>

      <HeaderNav>
        <NavItem
          $active={location.pathname === '/dashboard'}
          onClick={() => navigate('/dashboard')}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </NavItem>
        <NavItem
          $active={location.pathname === '/trades'}
          onClick={() => navigate('/trades')}
        >
          <BookOpen size={18} />
          Portafolio
        </NavItem>
        <NavItem
          $active={location.pathname === '/lab'}
          onClick={() => navigate('/lab')}
        >
          <FlaskConical size={18} />
          Lab
        </NavItem>
        <NavItem
          $active={location.pathname === '/metodologia'}
          onClick={() => navigate('/metodologia')}
        >
          <GraduationCap size={18} />
          Métodología
        </NavItem>
        <NavItem
          $active={location.pathname === '/screener'}
          onClick={() => navigate('/screener')}
        >
          <Search size={18} />
          Screener
        </NavItem>
        <NavItem
          $active={location.pathname === '/alertas'}
          onClick={() => navigate('/alertas')}
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
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#94a3b8'};
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
    background: rgba(255, 255, 255, 0.1);
    color: white;
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

export default Header;
