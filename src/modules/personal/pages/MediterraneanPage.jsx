// modules/personal/pages/MediterraneanPage.js — Dashboard del Recetario Mediterráneo
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import {
  ChefHat, ShoppingCart, BarChart3, Plus, ArrowRight,
  Star, BookOpen
} from 'lucide-react';
import { useMediterranean } from '../../../context/MediterraneanContext';
import { getUTC3DateString } from '../../../utils/helpers';

const m = {
  primary: '#6B8E23',
  light: '#8FAF35',
  gold: '#C49A1A',
  terra: '#C1440E',
  azure: '#2E6E9E',
  dark: '#1A2409',
};

const MediterraneanPage = () => {
  const navigate = useNavigate();
  const { recipes, shoppingList, stats, loading, favoriteRecipes, pendingShoppingCount } = useMediterranean();
  const today = getUTC3DateString();

  const recentRecipes = recipes.slice(0, 4);

  return (
    <Container>
      {/* Hero */}
      <HeroSection>
        <HeroGlow />
        <HeroContent>
          <HeroBadge>🫒 Recetario Mediterráneo</HeroBadge>
          <HeroTitle>Tu libro de cocina personal</HeroTitle>
          <HeroSubtitle>Cocinando sano, comiendo bien, viviendo mejor.</HeroSubtitle>
        </HeroContent>
        <StatsRow>
          <StatCard>
            <StatEmoji>🍽</StatEmoji>
            <StatNumber>{loading ? '—' : stats.this_month}</StatNumber>
            <StatLabel>cocinadas este mes</StatLabel>
          </StatCard>
          <StatCard>
            <StatEmoji>⭐</StatEmoji>
            <StatNumber>{loading ? '—' : favoriteRecipes.length}</StatNumber>
            <StatLabel>favoritas</StatLabel>
          </StatCard>
          <StatCard>
            <StatEmoji>📖</StatEmoji>
            <StatNumber>{loading ? '—' : stats.total}</StatNumber>
            <StatLabel>recetas</StatLabel>
          </StatCard>
        </StatsRow>
      </HeroSection>

      <MainGrid>
        {/* Lista de compras pendiente */}
        <Panel>
          <PanelHeader>
            <PanelTitle><ShoppingCart size={16} color={m.gold} /> Lista de compras</PanelTitle>
            <ActionLink onClick={() => navigate('/personal/mediterranean/shopping')}>
              Ver lista <ArrowRight size={13} />
            </ActionLink>
          </PanelHeader>
          {loading ? (
            <SkeletonList>{[1, 2, 3].map(i => <SkeletonItem key={i} />)}</SkeletonList>
          ) : shoppingList.filter(i => !i.checked).length === 0 ? (
            <EmptyMini>🛒 Lista vacía</EmptyMini>
          ) : (
            <ShoppingPreview>
              {shoppingList.filter(i => !i.checked).slice(0, 5).map(item => (
                <ShoppingItem key={item.id}>
                  <ShoppingDot />
                  <ShoppingName>{item.name}</ShoppingName>
                  {item.qty && <ShoppingQty>{item.qty} {item.unit}</ShoppingQty>}
                </ShoppingItem>
              ))}
              {pendingShoppingCount > 5 && (
                <ShoppingMore>+{pendingShoppingCount - 5} más</ShoppingMore>
              )}
            </ShoppingPreview>
          )}
        </Panel>

        {/* Recetas recientes */}
        <Panel>
          <PanelHeader>
            <PanelTitle><BookOpen size={16} color={m.light} /> Recetas recientes</PanelTitle>
            <ActionLink onClick={() => navigate('/personal/mediterranean/recipes')}>
              Ver todas <ArrowRight size={13} />
            </ActionLink>
          </PanelHeader>
          {loading ? (
            <SkeletonList>{[1, 2, 3].map(i => <SkeletonItem key={i} />)}</SkeletonList>
          ) : recentRecipes.length === 0 ? (
            <EmptyMini>🍽 Sin recetas aún</EmptyMini>
          ) : (
            <MiniRecipeList>
              {recentRecipes.map(r => (
                <MiniRecipe key={r.id} onClick={() => navigate(`/personal/mediterranean/recipes/${r.id}`)}>
                  <MiniRecipeIcon>{r.is_favorite ? '⭐' : '🍽'}</MiniRecipeIcon>
                  <MiniRecipeName>{r.name}</MiniRecipeName>
                  <MiniRecipeTime>{(r.prep_time || 0) + (r.cook_time || 0)} min</MiniRecipeTime>
                </MiniRecipe>
              ))}
            </MiniRecipeList>
          )}
        </Panel>
      </MainGrid>

      {/* Quick Access */}
      <QuickGrid>
        <QuickCard onClick={() => navigate('/personal/mediterranean/recipes')}>
          <QuickIcon color={m.light}><BookOpen size={26} /></QuickIcon>
          <QuickName>Explorar Recetas</QuickName>
          <QuickDesc>{stats.total} recetas guardadas</QuickDesc>
          <ArrowRight size={16} color="#475569" style={{ position: 'absolute', top: '1.25rem', right: '1.25rem' }} />
        </QuickCard>
        <QuickCard onClick={() => navigate('/personal/mediterranean/recipes/new')}>
          <QuickIcon color={m.gold}><Plus size={26} /></QuickIcon>
          <QuickName>Nueva Receta</QuickName>
          <QuickDesc>Agregar al recetario</QuickDesc>
          <ArrowRight size={16} color="#475569" style={{ position: 'absolute', top: '1.25rem', right: '1.25rem' }} />
        </QuickCard>
        <QuickCard onClick={() => navigate('/personal/mediterranean/shopping')}>
          <QuickIcon color={m.terra}><ShoppingCart size={26} /></QuickIcon>
          <QuickName>Lista de Compras</QuickName>
          <QuickDesc>{pendingShoppingCount} items pendientes</QuickDesc>
          <ArrowRight size={16} color="#475569" style={{ position: 'absolute', top: '1.25rem', right: '1.25rem' }} />
        </QuickCard>
        <QuickCard onClick={() => navigate('/personal/mediterranean/stats')}>
          <QuickIcon color={m.azure}><BarChart3 size={26} /></QuickIcon>
          <QuickName>Estadísticas</QuickName>
          <QuickDesc>{stats.total_cooked} recetas cocinadas</QuickDesc>
          <ArrowRight size={16} color="#475569" style={{ position: 'absolute', top: '1.25rem', right: '1.25rem' }} />
        </QuickCard>
      </QuickGrid>
    </Container>
  );
};

// ─── Animations ───────────────────────────────────────────────────────────────
const fadeUp = keyframes`from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); }`;

// ─── Styled Components ────────────────────────────────────────────────────────

const Container = styled.div`
  color: #e2e8f0;
  padding: 2rem;
  animation: ${fadeUp} 0.4s ease-out;
  max-width: 1200px;
  margin: 0 auto;
  @media (max-width: 768px) { padding: 1.25rem 1rem; }
`;

const HeroSection = styled.div`
  position: relative;
  background: linear-gradient(135deg, #1A2409 0%, #0f172a 60%, #0a0f1e 100%);
  border: 1px solid rgba(107, 142, 35, 0.15);
  border-radius: 20px;
  padding: 2.5rem;
  margin-bottom: 1.5rem;
  overflow: hidden;
  @media (max-width: 480px) { padding: 1.5rem 1.25rem; }
`;

const HeroGlow = styled.div`
  position: absolute;
  top: -50px; right: -50px;
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(107, 142, 35, 0.2) 0%, transparent 70%);
  pointer-events: none;
`;

const HeroContent = styled.div`margin-bottom: 1.5rem;`;

const HeroBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(107, 142, 35, 0.12);
  color: #8FAF35;
  border: 1px solid rgba(107, 142, 35, 0.25);
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const HeroTitle = styled.h1`
  font-family: 'Unbounded', sans-serif;
  font-size: 1.8rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.4rem 0;
  @media (max-width: 480px) { font-size: 1.3rem; }
`;

const HeroSubtitle = styled.p`color: #94a3b8; margin: 0; font-size: 1rem;`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  @media (max-width: 768px) { grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 500px) { grid-template-columns: 1fr; }
`;

const StatCard = styled.div`
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px;
  padding: 1rem;
`;

const StatEmoji = styled.div`font-size: 1.2rem; margin-bottom: 0.35rem;`;
const StatNumber = styled.div`font-family: 'Unbounded', sans-serif; font-size: 1.3rem; font-weight: 700; color: white;`;
const StatLabel = styled.div`font-size: 0.75rem; color: #64748b;`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  margin-bottom: 1.25rem;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const Panel = styled.div`
  background: #0f172a;
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 16px;
  padding: 1.25rem;
  grid-column: ${p => p.$span ? `span ${p.$span}` : 'auto'};
  @media (max-width: 900px) { grid-column: auto; }
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const PanelTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.95rem;
  color: white;
`;

const ActionLink = styled.button`
  display: flex; align-items: center; gap: 0.25rem;
  background: transparent; border: none;
  color: #8FAF35; font-size: 0.82rem;
  cursor: pointer; transition: opacity 0.2s;
  &:hover { opacity: 0.75; }
`;



const ShoppingPreview = styled.div`display: flex; flex-direction: column; gap: 0.5rem;`;
const ShoppingItem = styled.div`
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.5rem 0.6rem;
  background: rgba(255,255,255,0.02); border-radius: 8px;
`;
const ShoppingDot = styled.div`
  width: 6px; height: 6px; border-radius: 50%; background: #C49A1A; flex-shrink: 0;
`;
const ShoppingName = styled.div`font-size: 0.85rem; color: #e2e8f0; flex: 1;`;
const ShoppingQty = styled.div`font-size: 0.75rem; color: #64748b;`;
const ShoppingMore = styled.div`font-size: 0.78rem; color: #64748b; text-align: center; padding-top: 0.25rem;`;

const MiniRecipeList = styled.div`display: flex; flex-direction: column; gap: 0.5rem;`;
const MiniRecipe = styled.div`
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.5rem 0.6rem;
  background: rgba(255,255,255,0.02); border-radius: 8px;
  cursor: pointer; transition: all 0.2s;
  &:hover { background: rgba(107,142,35,0.08); }
`;
const MiniRecipeIcon = styled.div`font-size: 1rem; flex-shrink: 0;`;
const MiniRecipeName = styled.div`font-size: 0.85rem; color: #e2e8f0; flex: 1;`;
const MiniRecipeTime = styled.div`font-size: 0.75rem; color: #64748b;`;

const EmptyMini = styled.div`
  text-align: center; color: #475569; font-size: 0.9rem; padding: 1.5rem;
`;

const QuickGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const QuickCard = styled.div`
  background: #0f172a;
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 14px;
  padding: 1.25rem;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  &:hover {
    background: rgba(26, 36, 9, 0.5);
    border-color: rgba(107,142,35,0.2);
    transform: translateY(-2px);
  }
`;
const QuickIcon = styled.div`color: ${p => p.color}; margin-bottom: 0.75rem;`;
const QuickName = styled.div`font-weight: 600; font-size: 0.95rem; color: white; margin-bottom: 0.25rem;`;
const QuickDesc = styled.div`font-size: 0.78rem; color: #64748b;`;

const SkeletonList = styled.div`display: flex; flex-direction: column; gap: 0.6rem;`;
const pulse = keyframes`0%,100%{opacity:0.4}50%{opacity:0.8}`;
const SkeletonItem = styled.div`
  height: 40px; border-radius: 8px;
  background: rgba(255,255,255,0.04);
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

export default MediterraneanPage;
