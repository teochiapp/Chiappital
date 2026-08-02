import styled, { keyframes } from 'styled-components';

export const pulseAnimation = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
`;

export const MacroContainer = styled.div`
  min-height: 100vh;
  background-color: #0f172a; // Slate 900
  color: #f8fafc; // Slate 50
  padding: 2rem;
  font-family: 'Inter', sans-serif;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 1.5rem;
  
  @media(max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
`;

export const TitleArea = styled.div`
  display: flex;
  flex-direction: column;
`;

export const Title = styled.h1`
  font-family: 'Unbounded', sans-serif;
  font-size: 1.9rem;
  margin: 0;
  background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

export const Sub = styled.p`
  color: #64748b;
  font-size: 0.95rem;
  margin: 0;
`;

export const MacroGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1.5rem;
  
  @media (max-width: 1280px) {
    grid-template-columns: repeat(8, 1fr);
    & > .col-span-4 { grid-column: span 4; }
    & > .col-span-12 { grid-column: span 8; }
  }

  @media (max-width: 1024px) {
    display: flex;
    flex-direction: column;
  }
`;

export const CommoditiesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;

  @media (max-width: 1280px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

export const MacroCard = styled.div`
  background: rgba(30, 41, 59, 0.7); // Slate 800 with opacity
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 1.5rem;
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
  }

  /* Span classes for grid */
  &.col-span-4 { grid-column: span 4; }
  &.col-span-8 { grid-column: span 8; }
  &.col-span-12 { grid-column: span 12; }
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 0.75rem;

  h2 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    color: #e2e8f0; // Slate 200
  }
`;

export const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const ListItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.4); // Slate 900 with opacity
  border: 1px solid transparent;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background: rgba(15, 23, 42, 0.6);
    border-color: rgba(56, 189, 248, 0.2);

    .tv-link {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .item-left {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    
    .item-title {
      font-weight: 600;
      color: #f1f5f9; // Slate 100
      font-size: 0.95rem;
    }
    
    .item-subtitle {
      font-size: 0.8rem;
      color: #94a3b8; // Slate 400
    }
  }

  .item-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.2rem;

    .item-value {
      font-weight: 700;
      font-size: 1rem;
      color: #f8fafc;
    }

    .item-change {
      font-size: 0.8rem;
      font-weight: 600;
      
      &.positive {
        color: #34d399; // Emerald 400
      }
      &.negative {
        color: #f87171; // Red 400
      }
      &.neutral {
        color: #94a3b8; // Slate 400
      }
    }
  }
`;

export const NewsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
`;

export const NewsCard = styled.a`
  display: flex;
  flex-direction: column;
  text-decoration: none;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
  height: 100%;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    border-color: rgba(56, 189, 248, 0.3);
  }

  .news-image {
    width: 100%;
    height: 140px;
    object-fit: cover;
    background-color: #1e293b;
  }

  .news-content {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    flex: 1;

    .news-source {
      font-size: 0.75rem;
      color: #38bdf8;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .news-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: #f1f5f9;
      line-height: 1.4;
      margin-bottom: 0.75rem;
      flex: 1;
    }

    .news-date {
      font-size: 0.75rem;
      color: #64748b;
    }
  }
`;

export const SectionDivider = styled.div`
  width: 100%;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 1rem 0;
`;

export const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
  color: #38bdf8;
  font-size: 1.2rem;
  font-weight: 500;
  
  /* Animación pulsante para el logo */
  animation: ${pulseAnimation} 2s infinite ease-in-out;
`;

export const TVLink = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  border-radius: 6px;
  padding: 6px;
  margin-left: 10px;
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.2s ease;
  text-decoration: none;

  &:hover {
    background: rgba(56, 189, 248, 0.2);
    color: #0ea5e9;
  }
`;

export const ItemRightContainer = styled.div`
  display: flex;
  align-items: center;
`;
