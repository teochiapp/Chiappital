import React from 'react';
import styled from 'styled-components';
import { colors } from '../../styles/colors';

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.gap || '0'};
`;

const LogoImage = styled.img`
  width: ${props => props.size || '48px'};
  height: ${props => props.size || '48px'};
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const LogoText = styled.span`
  font-family: 'Vanilla Whale', sans-serif;
  font-weight: ${props => props.weight || 'normal'};
  font-size: 4rem;
  letter-spacing: normal;
  color: #9B1B30;
  margin: 0;
  line-height: 1;
  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
`;

const Logo = ({
  size = '82px',
  fontSize = '4rem',
  weight = 'normal',
  gap = '0',
  showText = true,
  className,
  onClick,
  style,
  ...props
}) => {
  const handleClick = onClick ? (e) => {
    e.preventDefault();
    onClick();
  } : undefined;

  return (
    <LogoContainer
      gap={gap}
      className={className}
      onClick={handleClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: onClick ? 'transform 0.2s ease' : 'none',
        ...style
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'scale(1.05)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'scale(1)';
        }
      }}
      {...props}
    >
      <LogoImage src="/logo-simple-trade.png" alt="Logo" size={size} />
      {showText && (
        <LogoText
          fontSize={fontSize}
          weight={weight}
        >
          Chiappital
        </LogoText>
      )}
    </LogoContainer>
  );
};

export default Logo;
