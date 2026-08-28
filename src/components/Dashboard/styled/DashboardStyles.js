import styled from 'styled-components';
import { colors } from '../../../styles/colors';

export const DashboardContainer = styled.div`
  min-height: 100vh;
  background: #030712;
`;

export const DashboardSplitLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

export const DashboardHeaderStyled = styled.header`
  background: ${colors.gradients.primary};
  color: ${colors.white};
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: ${colors.shadows.primary};

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
  }
`;

export const DashboardBrand = styled.div`
  h1 {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 600;
    font-family: 'Unbounded', sans-serif;
  }
`;

export const DashboardNav = styled.nav`
  ul {
    list-style: none;
    display: flex;
    gap: 2rem;
    margin: 0;
    padding: 0;
  }

  a {
    color: ${colors.white};
    text-decoration: none;
    transition: all 0.3s ease;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;

    &:hover {
      color: ${colors.secondary};
      transform: translateY(-2px);
    }
  }
`;

export const DashboardActions = styled.div`
  display: flex;
  align-items: center;
`;

export const LogoutButton = styled.button`
  background: ${colors.secondary};
  color: ${colors.white};
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  font-family: 'Unbounded', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: ${colors.shadows.secondary};

  &:hover {
    background: #022d2d;
    transform: translateY(-2px);
    box-shadow: ${colors.shadows.lg};
  }
`;

export const DashboardContentStyled = styled.main`
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 0.5rem 0;
  }
`;

export const DashboardContainerStyled = styled.div`
  max-width: 1500px;
  margin: 0 auto;
`;

export const WelcomeSection = styled.div`
  text-align: center;
  margin-bottom: 3rem;

  h2 {
    color: ${colors.black};
    font-size: 2.5rem;
    font-weight: 600;
    font-family: 'Unbounded', sans-serif;
    margin-bottom: 1rem;

    @media (max-width: 768px) {
      font-size: 2rem;
    }
  }

  p {
    color: ${colors.gray[600]};
    font-size: 1.2rem;
    font-weight: 300;
    font-family: 'Unbounded', sans-serif;
  }
`;

export const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const DashboardCard = styled.div`
  background: ${colors.white};
  padding: 2rem;
  border-radius: 12px;
  box-shadow: ${colors.shadows.base};
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: ${colors.shadows.lg};
  }

  .card-icon {
    width: 56px;
    height: 56px;
    margin: 0 auto 1rem;
    border-radius: 16px;
    background: ${colors.gradients.secondary};
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: ${colors.shadows.secondary};

    svg {
      width: 28px;
      height: 28px;
      color: ${colors.white};
    }
  }

  h3 {
    color: ${colors.black};
    margin-bottom: 1rem;
    font-size: 1.5rem;
    font-weight: 500;
    font-family: 'Unbounded', sans-serif;
  }

  p {
    color: ${colors.gray[600]};
    line-height: 1.6;
  }
`;
