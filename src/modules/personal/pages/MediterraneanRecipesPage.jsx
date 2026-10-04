// modules/personal/pages/MediterraneanRecipesPage.js — Galería de recetas con filtros
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Search, Plus, SlidersHorizontal, ChefHat, ArrowLeft } from 'lucide-react';
import { useMediterranean } from '../../../context/MediterraneanContext';
import RecipeCard from '../components/mediterranean/RecipeCard';
import HealthBadges, { HEALTH_OPTIONS } from '../components/mediterranean/HealthBadges';

const CATEGORIES = ['todas', 'desayuno', 'almuerzo', 'cena', 'snack', 'postre'];
const CATEGORY_LABELS = { todas: 'Todas', desayuno: 'Desayunos', almuerzo: 'Almuerzos', cena: 'Cenas', snack: 'Snacks', postre: 'Postres' };

const MediterraneanRecipesPage = () => {
  const navigate = useNavigate();
  const { recipes, toggleFavorite, loading } = useMediterranean();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('todas');
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    difficulty: '',
    cost: '',
    maxTime: '',
    origin: '',
    healthTags: [],
    onlyFavorites: false,
  });

  const uniqueOrigins = useMemo(() => {
    const origins = new Set(recipes.map(r => r.origin_country).filter(Boolean));
    return Array.from(origins).sort();
  }, [recipes]);

  const toggleHealthFilter = (tag) => {
    setFilters(p => ({
      ...p,
      healthTags: p.healthTags.includes(tag) ? p.healthTags.filter(t => t !== tag) : [...p.healthTags, tag]
    }));
  };

  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      // Helper para parsear JSON si viene como string de forma segura
      const parseArray = (val) => {
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          try { return JSON.parse(val); } catch(e) { return []; }
        }
        return [];
      };
      const rTags = parseArray(r.tags);
      const rIngredients = parseArray(r.ingredients);
      const rHealthTags = parseArray(r.health_tags);

      // Búsqueda
      const q = search.toLowerCase();
      const matchesSearch = !q || 
        (r.name && r.name.toLowerCase().includes(q)) ||
        rTags.some(t => typeof t === 'string' && t.toLowerCase().includes(q)) ||
        rIngredients.some(i => i.name && i.name.toLowerCase().includes(q));
        
      if (!matchesSearch) return false;

      // Categoría
      if (category !== 'todas' && r.category !== category) return false;

      // Filtros avanzados
      if (filters.onlyFavorites && !r.is_favorite) return false;
      if (filters.difficulty && String(r.difficulty) !== String(filters.difficulty)) return false;
      if (filters.cost && r.cost !== filters.cost) return false;
      if (filters.origin && r.origin_country !== filters.origin) return false;
      if (filters.maxTime) {
        const total = (r.prep_time || 0) + (r.cook_time || 0);
        if (total > parseInt(filters.maxTime)) return false;
      }
      if (filters.healthTags.length > 0) {
        const hasAllTags = filters.healthTags.every(t => rHealthTags.includes(t));
        if (!hasAllTags) return false;
      }

      return true;
    });
  }, [recipes, search, category, filters]);

  return (
    <Container>
      <NavBar>
        <BackBtn onClick={() => navigate('/personal/mediterranean')}>
          <ArrowLeft size={18} /> Mediterráneo
        </BackBtn>
      </NavBar>

      <PageHeader>
        <TitleArea>
          <PageTitle>🍽 Recetario</PageTitle>
          <Subtitle>{filteredRecipes.length} recetas {category !== 'todas' && `en ${CATEGORY_LABELS[category].toLowerCase()}`}</Subtitle>
        </TitleArea>
        <HeaderActions>
          <SearchBox>
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar recetas, tags..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </SearchBox>
          <FilterBtn $active={showFilters || filters.onlyFavorites || filters.healthTags.length > 0} onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal size={16} /> Filtros
          </FilterBtn>
          <AddBtn onClick={() => navigate('/personal/mediterranean/recipes/new')}>
            <Plus size={16} /> Nueva Receta
          </AddBtn>
        </HeaderActions>
      </PageHeader>

      <CategoryTabs>
        {CATEGORIES.map(cat => (
          <Tab key={cat} $active={category === cat} onClick={() => setCategory(cat)}>
            {CATEGORY_LABELS[cat]}
          </Tab>
        ))}
      </CategoryTabs>

      {showFilters && (
        <FiltersPanel>
          <FilterGroup>
            <FilterLabel>Dificultad</FilterLabel>
            <Select value={filters.difficulty} onChange={e => setFilters(p => ({ ...p, difficulty: e.target.value }))}>
              <option value="">Cualquiera</option>
              <option value="1">1 — Fácil</option>
              <option value="2">2 — Fácil+</option>
              <option value="3">3 — Medio</option>
              <option value="4">4 — Difícil</option>
              <option value="5">5 — Experto</option>
            </Select>
          </FilterGroup>
          <FilterGroup>
            <FilterLabel>Costo</FilterLabel>
            <Select value={filters.cost} onChange={e => setFilters(p => ({ ...p, cost: e.target.value }))}>
              <option value="">Cualquiera</option>
              <option value="$">$ — Económico</option>
              <option value="$$">$$ — Moderado</option>
              <option value="$$$">$$$ — Costoso</option>
            </Select>
          </FilterGroup>
          <FilterGroup>
            <FilterLabel>Tiempo Max</FilterLabel>
            <Select value={filters.maxTime} onChange={e => setFilters(p => ({ ...p, maxTime: e.target.value }))}>
              <option value="">Cualquiera</option>
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="60">1 hora</option>
            </Select>
          </FilterGroup>
          {uniqueOrigins.length > 0 && (
            <FilterGroup>
              <FilterLabel>Origen</FilterLabel>
              <Select value={filters.origin} onChange={e => setFilters(p => ({ ...p, origin: e.target.value }))}>
                <option value="">Cualquiera</option>
                {uniqueOrigins.map(o => <option key={o} value={o}>{o}</option>)}
              </Select>
            </FilterGroup>
          )}
          <FilterGroup style={{ gridColumn: '1 / -1' }}>
            <FilterLabel>Beneficios</FilterLabel>
            <HealthBadges
              selectable
              selected={filters.healthTags}
              onToggle={toggleHealthFilter}
              size="sm"
            />
          </FilterGroup>
          <CheckboxGroup style={{ gridColumn: '1 / -1' }}>
            <input
              type="checkbox"
              checked={filters.onlyFavorites}
              onChange={e => setFilters(p => ({ ...p, onlyFavorites: e.target.checked }))}
              id="favCheck"
            />
            <label htmlFor="favCheck">⭐ Solo mostrar mis recetas favoritas</label>
          </CheckboxGroup>
        </FiltersPanel>
      )}

      {loading ? (
        <LoadingState><ChefHat size={40} /><LoadingText>Cargando recetas...</LoadingText></LoadingState>
      ) : filteredRecipes.length === 0 ? (
        <EmptyState>
          <ChefHat size={48} color="rgba(255,255,255,0.1)" />
          <EmptyTitle>No hay recetas</EmptyTitle>
          <EmptyText>No encontramos recetas que coincidan con tus filtros.</EmptyText>
          <ClearFiltersBtn onClick={() => {
            setSearch(''); setCategory('todas'); setFilters({ difficulty: '', cost: '', maxTime: '', origin: '', healthTags: [], onlyFavorites: false });
          }}>
            Limpiar filtros
          </ClearFiltersBtn>
        </EmptyState>
      ) : (
        <RecipesGrid>
          {filteredRecipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onFavoriteToggle={toggleFavorite}
            />
          ))}
        </RecipesGrid>
      )}
    </Container>
  );
};

// ─── Animations ───────────────────────────────────────────────────────────────
const fadeUp = keyframes`from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); }`;

// ─── Styled Components ────────────────────────────────────────────────────────

const Container = styled.div`
  color: #e2e8f0; max-width: 1200px; margin: 0 auto;
  padding: 1.5rem 2rem; animation: ${fadeUp} 0.3s ease-out;
  @media (max-width: 768px) { padding: 1rem; }
`;

const NavBar = styled.div`margin-bottom: 1rem;`;
const BackBtn = styled.button`
  display: flex; align-items: center; gap: 0.4rem;
  background: transparent; border: none; color: #94a3b8;
  font-size: 0.88rem; cursor: pointer;
  &:hover { color: white; }
`;

const PageHeader = styled.div`
  display: flex; justify-content: space-between; align-items: flex-end;
  margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap;
`;

const TitleArea = styled.div``;
const PageTitle = styled.h1`
  font-family: 'Unbounded', sans-serif; font-size: 1.5rem;
  font-weight: 700; color: white; margin: 0 0 0.2rem 0;
`;
const Subtitle = styled.div`font-size: 0.85rem; color: #64748b;`;

const HeaderActions = styled.div`display: flex; gap: 0.6rem; flex-wrap: wrap; align-items: center;`;
const SearchBox = styled.div`
  display: flex; align-items: center; gap: 0.5rem;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  padding: 0.5rem 0.75rem; border-radius: 10px; width: 220px;
  color: #94a3b8; transition: border-color 0.2s;
  &:focus-within { border-color: rgba(107, 142, 35, 0.4); color: white; }
  input {
    background: transparent; border: none; color: white; font-size: 0.85rem;
    width: 100%; outline: none; font-family: inherit;
    &::placeholder { color: #475569; }
  }
`;
const FilterBtn = styled.button`
  display: flex; align-items: center; gap: 0.4rem;
  background: ${p => p.$active ? 'rgba(107, 142, 35, 0.15)' : 'rgba(255,255,255,0.04)'};
  color: ${p => p.$active ? '#8FAF35' : '#94a3b8'};
  border: 1px solid ${p => p.$active ? 'rgba(107, 142, 35, 0.3)' : 'rgba(255,255,255,0.08)'};
  padding: 0.5rem 0.85rem; border-radius: 10px; font-size: 0.85rem; font-weight: 500; cursor: pointer;
  transition: all 0.2s;
  &:hover { background: rgba(107, 142, 35, 0.1); border-color: rgba(107, 142, 35, 0.25); color: white; }
`;
const AddBtn = styled.button`
  display: flex; align-items: center; gap: 0.4rem;
  background: linear-gradient(135deg, #6B8E23, #8FAF35); color: white;
  border: none; padding: 0.5rem 1rem; border-radius: 10px; font-size: 0.85rem; font-weight: 700; cursor: pointer;
  transition: opacity 0.2s;
  &:hover { opacity: 0.9; }
`;

const CategoryTabs = styled.div`
  display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.5rem; margin-bottom: 1rem;
  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
`;
const Tab = styled.button`
  background: ${p => p.$active ? 'rgba(107, 142, 35, 0.15)' : 'transparent'};
  color: ${p => p.$active ? '#8FAF35' : '#64748b'};
  border: 1px solid ${p => p.$active ? 'rgba(107, 142, 35, 0.25)' : 'rgba(255,255,255,0.05)'};
  padding: 0.45rem 1rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600; cursor: pointer;
  white-space: nowrap; transition: all 0.2s;
  &:hover { color: white; background: ${p => p.$active ? 'rgba(107, 142, 35, 0.15)' : 'rgba(255,255,255,0.03)'}; }
`;

const FiltersPanel = styled.div`
  background: #0f172a; border: 1px solid rgba(107, 142, 35, 0.2);
  border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem;
  display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem;
  animation: ${fadeUp} 0.2s ease-out;
`;
const FilterGroup = styled.div`display: flex; flex-direction: column; gap: 0.4rem;`;
const FilterLabel = styled.label`font-size: 0.75rem; color: #94a3b8; font-weight: 600; text-transform: uppercase;`;
const Select = styled.select`
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  color: #e2e8f0; padding: 0.45rem; border-radius: 8px; font-size: 0.85rem; outline: none;
  cursor: pointer; option { background: #0f172a; }
  &:focus { border-color: rgba(107, 142, 35, 0.4); }
`;
const CheckboxGroup = styled.div`
  display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;
  label { font-size: 0.85rem; color: #e2e8f0; cursor: pointer; }
  input[type="checkbox"] { cursor: pointer; }
`;

const LoadingState = styled.div`
  display: flex; flex-direction: column; align-items: center; padding: 4rem;
  color: #8FAF35; gap: 1rem;
`;
const LoadingText = styled.div`color: #64748b; font-size: 0.95rem;`;

const EmptyState = styled.div`
  display: flex; flex-direction: column; align-items: center; padding: 4rem; gap: 0.75rem; text-align: center;
`;
const EmptyTitle = styled.div`font-size: 1.1rem; font-weight: 600; color: white;`;
const EmptyText = styled.div`font-size: 0.9rem; color: #64748b; max-width: 300px;`;
const ClearFiltersBtn = styled.button`
  margin-top: 1rem; background: transparent; border: 1px solid rgba(255,255,255,0.1);
  color: #e2e8f0; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer;
  &:hover { background: rgba(255,255,255,0.05); }
`;

const RecipesGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

export default MediterraneanRecipesPage;
