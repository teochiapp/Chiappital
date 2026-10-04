// modules/personal/pages/MediterraneanStatsPage.js — Estadísticas del Recetario
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { ArrowLeft, TrendingUp, ChefHat, Star, Clock } from 'lucide-react';
import { useMediterranean } from '../../../context/MediterraneanContext';

const CATEGORY_LABELS = { desayuno: '🌅 Desayuno', almuerzo: '🌿 Almuerzo', cena: '🌙 Cena', snack: '🫒 Snack', postre: '🍯 Postre' };

const MediterraneanStatsPage = () => {
  const navigate = useNavigate();
  const { stats, recipes, loading } = useMediterranean();

  const maxCategoryCount = useMemo(() => {
    if (!stats.categories || stats.categories.length === 0) return 1;
    return Math.max(...stats.categories.map(c => c.count));
  }, [stats.categories]);

  const favoriteRecipes = useMemo(() => recipes.filter(r => r.is_favorite), [recipes]);

  return (
    <Container>
      <NavBar>
        <BackBtn onClick={() => navigate('/personal/mediterranean')}>
          <ArrowLeft size={18} /> Mediterráneo
        </BackBtn>
      </NavBar>

      <PageTitle>📊 Estadísticas</PageTitle>

      {/* Key metrics */}
      <MetricsGrid>
        <MetricCard $accent="#6B8E23">
          <MetricIcon><ChefHat size={24} /></MetricIcon>
          <MetricValue>{loading ? '—' : stats.total}</MetricValue>
          <MetricLabel>Recetas en total</MetricLabel>
        </MetricCard>
        <MetricCard $accent="#C49A1A">
          <MetricIcon><Star size={24} /></MetricIcon>
          <MetricValue>{loading ? '—' : stats.favorites}</MetricValue>
          <MetricLabel>Favoritas</MetricLabel>
        </MetricCard>
        <MetricCard $accent="#2E6E9E">
          <MetricIcon><TrendingUp size={24} /></MetricIcon>
          <MetricValue>{loading ? '—' : stats.this_month}</MetricValue>
          <MetricLabel>Cocinadas este mes</MetricLabel>
        </MetricCard>
        <MetricCard $accent="#C1440E">
          <MetricIcon><Clock size={24} /></MetricIcon>
          <MetricValue>{loading ? '—' : `${stats.avg_time}m`}</MetricValue>
          <MetricLabel>Tiempo promedio</MetricLabel>
        </MetricCard>
      </MetricsGrid>

      <StatsGrid>
        {/* Categories chart */}
        <Panel>
          <PanelTitle>📂 Categorías más cocinadas</PanelTitle>
          {!loading && (!stats.categories || stats.categories.length === 0) ? (
            <EmptyNote>Sin datos aún — cocinando más recetas aparecerán las estadísticas</EmptyNote>
          ) : (
            <BarChart>
              {(stats.categories || []).map(cat => (
                <BarRow key={cat.category}>
                  <BarLabel>{CATEGORY_LABELS[cat.category] || cat.category}</BarLabel>
                  <BarWrapper>
                    <Bar $pct={maxCategoryCount > 0 ? (cat.count / maxCategoryCount) * 100 : 0} />
                  </BarWrapper>
                  <BarCount>{cat.count}x</BarCount>
                </BarRow>
              ))}
            </BarChart>
          )}
        </Panel>

        {/* Top cooked recipes */}
        <Panel>
          <PanelTitle>🔁 Recetas más repetidas</PanelTitle>
          {!loading && (!stats.top_recipes || stats.top_recipes.length === 0) ? (
            <EmptyNote>Aún no cocinaste ninguna receta</EmptyNote>
          ) : (
            <TopList>
              {(stats.top_recipes || []).map((r, i) => (
                <TopItem key={r.id} onClick={() => navigate(`/personal/mediterranean/recipes/${r.id}`)}>
                  <TopRank>#{i + 1}</TopRank>
                  <TopInfo>
                    <TopName>{r.name}</TopName>
                    <TopMeta>
                      {r.times_cooked}x cocinada
                      {r.avg_rating && ` · ⭐ ${parseFloat(r.avg_rating).toFixed(1)}`}
                    </TopMeta>
                  </TopInfo>
                </TopItem>
              ))}
            </TopList>
          )}
        </Panel>

        {/* Favorites */}
        <Panel>
          <PanelTitle>⭐ Favoritas</PanelTitle>
          {favoriteRecipes.length === 0 ? (
            <EmptyNote>Marcá recetas como favoritas para verlas aquí</EmptyNote>
          ) : (
            <FavoriteList>
              {favoriteRecipes.map(r => (
                <FavoriteItem key={r.id} onClick={() => navigate(`/personal/mediterranean/recipes/${r.id}`)}>
                  <FavEmoji>⭐</FavEmoji>
                  <FavInfo>
                    <FavName>{r.name}</FavName>
                    {r.origin_country && <FavOrigin>{r.origin_country}</FavOrigin>}
                  </FavInfo>
                  <FavMeta>{(r.prep_time || 0) + (r.cook_time || 0)} min</FavMeta>
                </FavoriteItem>
              ))}
            </FavoriteList>
          )}
        </Panel>

        {/* Summary */}
        <Panel>
          <PanelTitle>📈 Resumen general</PanelTitle>
          <SummaryGrid>
            <SummaryItem>
              <SummaryLabel>Total cocinadas</SummaryLabel>
              <SummaryValue>{stats.total_cooked || 0}</SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <SummaryLabel>Recetas en biblioteca</SummaryLabel>
              <SummaryValue>{stats.total || 0}</SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <SummaryLabel>% recetas favoritas</SummaryLabel>
              <SummaryValue>
                {stats.total > 0 ? Math.round((stats.favorites / stats.total) * 100) : 0}%
              </SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <SummaryLabel>Tiempo promedio por receta</SummaryLabel>
              <SummaryValue>{stats.avg_time || 0} min</SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <SummaryLabel>Categorías activas</SummaryLabel>
              <SummaryValue>{(stats.categories || []).length}</SummaryValue>
            </SummaryItem>
          </SummaryGrid>
        </Panel>
      </StatsGrid>
    </Container>
  );
};

// ─── Animations ───────────────────────────────────────────────────────────────
const fadeUp = keyframes`from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); }`;

// ─── Styled Components ────────────────────────────────────────────────────────

const Container = styled.div`
  color: #e2e8f0; max-width: 1100px; margin: 0 auto;
  padding: 1.5rem 2rem; animation: ${fadeUp} 0.3s ease-out;
  @media (max-width: 768px) { padding: 1rem; }
  @media (max-width: 350px) { padding: 0.75rem 0.5rem; }
`;

const NavBar = styled.div`margin-bottom: 1rem;`;
const BackBtn = styled.button`
  display: flex; align-items: center; gap: 0.4rem;
  background: transparent; border: none; color: #94a3b8;
  font-size: 0.88rem; cursor: pointer; &:hover { color: white; }
`;
const PageTitle = styled.h1`
  font-family: 'Unbounded', sans-serif; font-size: 1.5rem;
  font-weight: 700; color: white; margin: 0 0 1.5rem 0;
`;

const MetricsGrid = styled.div`
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 1rem; margin-bottom: 1.5rem;
  @media (max-width: 768px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;
const MetricCard = styled.div`
  background: ${p => `${p.$accent}0E`};
  border: 1px solid ${p => `${p.$accent}25`};
  border-radius: 16px; padding: 1.25rem; text-align: center;
`;
const MetricIcon = styled.div`color: #8FAF35; margin-bottom: 0.5rem;`;
const MetricValue = styled.div`
  font-family: 'Unbounded', sans-serif; font-size: 1.8rem;
  font-weight: 700; color: white; margin-bottom: 0.25rem;
`;
const MetricLabel = styled.div`font-size: 0.78rem; color: #64748b;`;

const StatsGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  @media (max-width: 800px) { grid-template-columns: 1fr; }
`;
const Panel = styled.div`
  background: #0f172a; border: 1px solid rgba(255,255,255,0.05);
  border-radius: 16px; padding: 1.25rem;
`;
const PanelTitle = styled.div`
  font-weight: 700; font-size: 0.95rem; color: white;
  margin-bottom: 1rem;
`;
const EmptyNote = styled.div`color: #475569; font-size: 0.85rem; padding: 1rem 0;`;

const BarChart = styled.div`display: flex; flex-direction: column; gap: 0.85rem;`;
const BarRow = styled.div`display: flex; align-items: center; gap: 0.75rem;`;
const BarLabel = styled.div`font-size: 0.82rem; color: #94a3b8; min-width: 110px; flex-shrink: 0;`;
const BarWrapper = styled.div`flex: 1; background: rgba(255,255,255,0.04); border-radius: 4px; height: 10px; overflow: hidden;`;
const Bar = styled.div`
  height: 100%; width: ${p => p.$pct}%;
  background: linear-gradient(90deg, #6B8E23, #8FAF35);
  border-radius: 4px; transition: width 0.8s ease;
`;
const BarCount = styled.div`font-size: 0.78rem; color: #64748b; min-width: 25px; text-align: right;`;

const TopList = styled.div`display: flex; flex-direction: column; gap: 0.6rem;`;
const TopItem = styled.div`
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  background: rgba(255,255,255,0.02); border-radius: 10px;
  cursor: pointer; transition: all 0.2s;
  &:hover { background: rgba(107,142,35,0.08); }
`;
const TopRank = styled.div`
  font-size: 0.75rem; font-weight: 700; color: #C49A1A;
  min-width: 24px;
`;
const TopInfo = styled.div`flex: 1;`;
const TopName = styled.div`font-size: 0.88rem; color: #e2e8f0; font-weight: 500;`;
const TopMeta = styled.div`font-size: 0.75rem; color: #64748b;`;

const FavoriteList = styled.div`display: flex; flex-direction: column; gap: 0.6rem;`;
const FavoriteItem = styled.div`
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.65rem; background: rgba(255,255,255,0.02);
  border-radius: 10px; cursor: pointer;
  &:hover { background: rgba(196,154,26,0.08); }
`;
const FavEmoji = styled.div`font-size: 1rem; flex-shrink: 0;`;
const FavInfo = styled.div`flex: 1;`;
const FavName = styled.div`font-size: 0.88rem; color: #e2e8f0;`;
const FavOrigin = styled.div`font-size: 0.75rem; color: #64748b;`;
const FavMeta = styled.div`font-size: 0.75rem; color: #64748b;`;

const SummaryGrid = styled.div`display: flex; flex-direction: column; gap: 0.6rem;`;
const SummaryItem = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.04);
  &:last-child { border-bottom: none; }
`;
const SummaryLabel = styled.div`font-size: 0.85rem; color: #94a3b8;`;
const SummaryValue = styled.div`font-weight: 700; color: white; font-size: 0.9rem;`;

export default MediterraneanStatsPage;
