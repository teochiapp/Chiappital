import styled from 'styled-components';
import { colors } from '../../styles/colors';

export const StyledButton = styled.button`
  background: ${props => props.$primary ? colors.gradients.primary : 'transparent'};
  color: ${props => props.$primary ? colors.white : colors.primary};
  border: ${props => props.$primary ? 'none' : `2px solid ${colors.primary}`};
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  font-family: 'Unbounded', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: ${props => props.$primary ? colors.primaryDark : colors.primary};
    color: ${colors.white};
    transform: translateY(-2px);
    box-shadow: ${props => props.$primary ? colors.shadows.primary : colors.shadows.base};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

export const StyledCard = styled.div`
  background: ${colors.white};
  padding: 2rem;
  border-radius: 12px;
  box-shadow: ${colors.shadows.base};
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: ${colors.shadows.lg};
  }
`;

export const StyledInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid ${colors.gray[200]};
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: ${colors.primary};
  }
  
  &::placeholder {
    color: ${colors.gray[400]};
  }
`;

export const StyledContainer = styled.div`
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 2rem;

  @media (max-width: 768px) {
    padding: 0 0.5rem;
  }
`;
