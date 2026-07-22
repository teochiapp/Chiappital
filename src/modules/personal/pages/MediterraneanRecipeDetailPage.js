// modules/personal/pages/MediterraneanRecipeDetailPage.js — Vista detallada de receta
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import {
  ArrowLeft, Heart, ShoppingCart, ChefHat, Clock, Star, Users,
  DollarSign, CheckCircle2, Circle, Edit, Trash2, Plus, X, Globe
} from 'lucide-react';
import { useMediterranean } from '../../../context/MediterraneanContext';
import personalApiService from '../services/personalApiService';
import HealthBadges from '../components/mediterranean/HealthBadges';
import MacroBar from '../components/mediterranean/MacroBar';

const CATEGORY_EMOJIS = { desayuno: '🌅', almuerzo: '🌿', cena: '🌙', snack: '🫒', postre: '🍯' };
const DIFF_LABELS = ['', 'Fácil', 'Fácil+', 'Medio', 'Difícil', 'Experto'];
const FREQ_LABELS = { diaria: 'Diaria', varias_semana: 'Varias x semana', semanal: 'Semanal', ocasional: 'Ocasional' };

const formatDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const MediterraneanRecipeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { recipes, toggleFavorite, addCookingEntry, addShoppingItems, deleteRecipe } = useMediterranean();

  const [recipe, setRecipe] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkedSteps, setCheckedSteps] = useState([]);
  const [showCookModal, setShowCookModal] = useState(false);
  const [cookForm, setCookForm] = useState({ rating: 5, notes: '', would_change: '' });
  const [saving, setSaving] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    const loadRecipe = async () => {
      setLoading(true);
      try {
        const res = await personalApiService.getMedRecipe(id);
        setRecipe(res.recipe);
        setHistory(res.history || []);
      } catch {
        navigate('/personal/mediterranean/recipes');
      } finally {
        setLoading(false);
      }
    };
    loadRecipe();
  }, [id, navigate]);

  // Sync from context when toggling favorite
  useEffect(() => {
    const fromCtx = recipes.find(r => String(r.id) === String(id));
    if (fromCtx && recipe) {
      setRecipe(prev => ({ ...prev, is_favorite: fromCtx.is_favorite }));
    }
  }, [recipes, id, recipe]);

  if (loading) return <LoadingScreen><ChefHat size={40} /><LoadingText>Cargando receta...</LoadingText></LoadingScreen>;
  if (!recipe) return null;

  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : (typeof recipe.ingredients === 'string' ? JSON.parse(recipe.ingredients) : []);
  const steps = Array.isArray(recipe.steps) ? recipe.steps : (typeof recipe.steps === 'string' ? JSON.parse(recipe.steps) : []);
  const tips = recipe.tips && typeof recipe.tips === 'string' ? JSON.parse(recipe.tips) : (recipe.tips || {});
  const healthTags = Array.isArray(recipe.health_tags) ? recipe.health_tags : (typeof recipe.health_tags === 'string' ? JSON.parse(recipe.health_tags) : []);
  const tags = Array.isArray(recipe.tags) ? recipe.tags : (typeof recipe.tags === 'string' ? JSON.parse(recipe.tags) : []);
  const learning = recipe.learning && typeof recipe.learning === 'string' ? JSON.parse(recipe.learning) : (recipe.learning || {});
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

  const toggleStep = (i) => setCheckedSteps(prev => prev.includes(i) ? prev.filter(s => s !== i) : [...prev, i]);

  const handleAddToCart = async () => {
    const items = ingredients
      .filter(ing => !ing.optional)
      .map(ing => ({
        name: ing.name,
        qty: ing.qty,
        unit: ing.unit,
        category: 'otros',
        recipe_id: recipe.id,
      }));
    if (items.length === 0) return;
    await addShoppingItems(items);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  const handleSaveCooking = async () => {
    setSaving(true);
    try {
      await addCookingEntry({ recipe_id: recipe.id, ...cookForm });
      const res = await personalApiService.getMedRecipe(id);
      setHistory(res.history || []);
      setShowCookModal(false);
      setCookForm({ rating: 5, notes: '', would_change: '' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`¿Eliminar "${recipe.name}"?`)) return;
    await deleteRecipe(recipe.id);
    navigate('/personal/mediterranean/recipes');
  };

  return (
    <Container>
      {/* Header nav */}
      <NavBar>
        <BackBtn onClick={() => navigate('/personal/mediterranean/recipes')}>
          <ArrowLeft size={18} /> Recetario
        </BackBtn>
        <NavActions>
          <IconBtn onClick={() => toggleFavorite(recipe.id)} $gold={recipe.is_favorite}>
            <Heart size={18} fill={recipe.is_favorite ? '#C49A1A' : 'none'} />
          </IconBtn>
          <IconBtn onClick={() => navigate(`/personal/mediterranean/recipes/new?edit=${id}`)}>
            <Edit size={18} />
          </IconBtn>
          <IconBtn $danger onClick={handleDelete}>
            <Trash2 size={18} />
          </IconBtn>
        </NavActions>
      </NavBar>

      {/* Hero image + title */}
      <Hero>
        <HeroImage>
          {recipe.image_url
            ? <img src={recipe.image_url} alt={recipe.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <HeroPlaceholder><ChefHat size={60} /></HeroPlaceholder>
          }
          <HeroOverlay />
          <HeroInfo>
            <HeroCategoryBadge>{CATEGORY_EMOJIS[recipe.category] || '🍽'} {recipe.category}</HeroCategoryBadge>
            <HeroTitle>{recipe.name}</HeroTitle>
            {recipe.origin_country && (
              <HeroOrigin><Globe size={14} /> {recipe.origin_country}</HeroOrigin>
            )}
          </HeroInfo>
        </HeroImage>
      </Hero>

      {/* Quick Info */}
      <InfoBar>
        {totalTime > 0 && <InfoItem><Clock size={15} color="#8FAF35" /><span>{totalTime} min total</span></InfoItem>}
        {recipe.prep_time > 0 && <InfoItem><span>⏱ {recipe.prep_time} prep</span></InfoItem>}
        {recipe.cook_time > 0 && <InfoItem><span>🔥 {recipe.cook_time} cocción</span></InfoItem>}
        {recipe.difficulty && <InfoItem><Star size={15} color="#C49A1A" /><span>{DIFF_LABELS[recipe.difficulty]}</span></InfoItem>}
        {recipe.cost && <InfoItem><DollarSign size={14} color="#94a3b8" /><span>{recipe.cost}</span></InfoItem>}
        {recipe.servings && <InfoItem><Users size={14} color="#94a3b8" /><span>{recipe.servings} porciones</span></InfoItem>}
        {recipe.frequency && <InfoItem><span>📅 {FREQ_LABELS[recipe.frequency] || recipe.frequency}</span></InfoItem>}
      </InfoBar>

      {/* Tags */}
      {tags.length > 0 && (
        <TagsRow>
          {tags.map(t => <Tag key={t}>{t}</Tag>)}
        </TagsRow>
      )}

      {/* Action Buttons */}
      <ActionRow>
        <ActionBtn $primary onClick={() => setShowCookModal(true)}>
          🍳 Marcar como cocinada
        </ActionBtn>
        <ActionBtn $secondary onClick={handleAddToCart}>
          <ShoppingCart size={16} />
          {addedToCart ? '✓ Agregado' : 'Agregar a lista de compras'}
        </ActionBtn>
      </ActionRow>

      <ContentGrid>
        {/* Left column */}
        <LeftCol>
          {/* Macros */}
          {recipe.calories && (
            <Section>
              <SectionTitle>📊 Información nutricional</SectionTitle>
              <MacroBar
                calories={recipe.calories}
                protein={recipe.protein}
                carbs={recipe.carbs}
                fat={recipe.fat}
                fiber={recipe.fiber}
              />
            </Section>
          )}

          {/* Ingredients */}
          {ingredients.length > 0 && (
            <Section>
              <SectionTitle>🛒 Ingredientes</SectionTitle>
              <IngredientList>
                {ingredients.map((ing, i) => (
                  <IngredientItem key={i}>
                    <IngredientQty>{ing.qty} {ing.unit}</IngredientQty>
                    <IngredientName>{ing.name}</IngredientName>
                    {ing.optional && <OptionalBadge>opcional</OptionalBadge>}
                  </IngredientItem>
                ))}
              </IngredientList>
            </Section>
          )}

          {/* Health */}
          {healthTags.length > 0 && (
            <Section>
              <SectionTitle>❤️ Beneficios para la salud</SectionTitle>
              <HealthBadges tags={healthTags} size="md" />
            </Section>
          )}
        </LeftCol>

        {/* Right column */}
        <RightCol>
          {/* Steps */}
          {steps.length > 0 && (
            <Section>
              <SectionTitle>📋 Preparación paso a paso</SectionTitle>
              <StepList>
                {steps.map((step, i) => (
                  <StepItem key={i} $done={checkedSteps.includes(i)} onClick={() => toggleStep(i)}>
                    <StepNumber $done={checkedSteps.includes(i)}>
                      {checkedSteps.includes(i) ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </StepNumber>
                    <StepText $done={checkedSteps.includes(i)}>{step}</StepText>
                  </StepItem>
                ))}
              </StepList>
              {checkedSteps.length > 0 && (
                <ClearStepsBtn onClick={() => setCheckedSteps([])}>Reiniciar pasos</ClearStepsBtn>
              )}
            </Section>
          )}

          {/* Tips */}
          {(tips.errors || tips.flavor || tips.variants || tips.storage) && (
            <Section>
              <SectionTitle>💡 Consejos</SectionTitle>
              <TipsGrid>
                {tips.errors && <TipCard $color="#ef4444"><TipLabel>⚠️ Errores comunes</TipLabel><TipText>{tips.errors}</TipText></TipCard>}
                {tips.flavor && <TipCard $color="#C49A1A"><TipLabel>✨ Cómo mejorar el sabor</TipLabel><TipText>{tips.flavor}</TipText></TipCard>}
                {tips.variants && <TipCard $color="#6B8E23"><TipLabel>🔄 Variantes</TipLabel><TipText>{tips.variants}</TipText></TipCard>}
                {tips.storage && <TipCard $color="#2E6E9E"><TipLabel>🧊 Cómo conservarla</TipLabel><TipText>{tips.storage}</TipText></TipCard>}
              </TipsGrid>
            </Section>
          )}

          {/* Learning */}
          {(learning.technique || learning.cuts || learning.tools || learning.substitutes) && (
            <Section>
              <SectionTitle>🎓 Aprendizaje</SectionTitle>
              <LearnGrid>
                {learning.technique && <LearnItem><LearnKey>Técnica</LearnKey><LearnVal>{learning.technique}</LearnVal></LearnItem>}
                {learning.cuts && <LearnItem><LearnKey>Cortes</LearnKey><LearnVal>{learning.cuts}</LearnVal></LearnItem>}
                {learning.tools && <LearnItem><LearnKey>Utensilios</LearnKey><LearnVal>{learning.tools}</LearnVal></LearnItem>}
                {learning.substitutes && <LearnItem><LearnKey>Sustituciones</LearnKey><LearnVal>{learning.substitutes}</LearnVal></LearnItem>}
              </LearnGrid>
            </Section>
          )}
        </RightCol>
      </ContentGrid>

      {/* Cooking History */}
      <Section>
        <SectionHeader>
          <SectionTitle>📅 Historial de cocinadas</SectionTitle>
          <AddHistoryBtn onClick={() => setShowCookModal(true)}>+ Agregar entrada</AddHistoryBtn>
        </SectionHeader>
        {history.length === 0 ? (
          <EmptyHistory>Aún no cocinaste esta receta. ¡Anotalo cuando la hagas!</EmptyHistory>
        ) : (
          <HistoryList>
            {history.map(entry => (
              <HistoryEntry key={entry.id}>
                <HistoryDate>{formatDate(entry.cooked_on)}</HistoryDate>
                {entry.rating && <HistoryRating>{'⭐'.repeat(entry.rating)}</HistoryRating>}
                {entry.notes && <HistoryNote>{entry.notes}</HistoryNote>}
                {entry.would_change && <HistoryChange>🔄 Cambiaría: {entry.would_change}</HistoryChange>}
              </HistoryEntry>
            ))}
          </HistoryList>
        )}
      </Section>

      {/* Cook Modal */}
      {showCookModal && (
        <ModalOverlay onClick={() => setShowCookModal(false)}>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>🍳 La cocinaste hoy</ModalTitle>
              <CloseModalBtn onClick={() => setShowCookModal(false)}><X size={18} /></CloseModalBtn>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <Label>Calificación</Label>
                <RatingRow>
                  {[1, 2, 3, 4, 5].map(n => (
                    <StarBtn key={n} $active={cookForm.rating >= n} onClick={() => setCookForm(p => ({ ...p, rating: n }))}>★</StarBtn>
                  ))}
                </RatingRow>
              </FormGroup>
              <FormGroup>
                <Label>Notas (opcional)</Label>
                <TextArea
                  value={cookForm.notes}
                  onChange={e => setCookForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="¿Cómo quedó? ¿Qué te pareció?"
                  rows={3}
                />
              </FormGroup>
              <FormGroup>
                <Label>¿Qué cambiarías? (opcional)</Label>
                <TextArea
                  value={cookForm.would_change}
                  onChange={e => setCookForm(p => ({ ...p, would_change: e.target.value }))}
                  placeholder="Menos sal, más ajo, cocción más corta..."
                  rows={2}
                />
              </FormGroup>
              <SaveBtn onClick={handleSaveCooking} disabled={saving}>
                {saving ? 'Guardando...' : '✓ Guardar entrada'}
              </SaveBtn>
            </ModalBody>
          </Modal>
        </ModalOverlay>
      )}
    </Container>
  );
};

// ─── Animations ───────────────────────────────────────────────────────────────
const fadeUp = keyframes`from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); }`;

// ─── Styled Components ────────────────────────────────────────────────────────

const LoadingScreen = styled.div`
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 60vh; gap: 1rem; color: #8FAF35;
`;
const LoadingText = styled.div`color: #64748b; font-size: 0.95rem;`;

const Container = styled.div`
  color: #e2e8f0; max-width: 1200px; margin: 0 auto;
  padding: 1.5rem 2rem; animation: ${fadeUp} 0.3s ease-out;
  @media (max-width: 768px) { padding: 1rem; }
`;

const NavBar = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;`;
const BackBtn = styled.button`
  display: flex; align-items: center; gap: 0.5rem;
  background: transparent; border: none; color: #94a3b8;
  font-size: 0.9rem; cursor: pointer; transition: color 0.2s;
  &:hover { color: white; }
`;
const NavActions = styled.div`display: flex; gap: 0.5rem;`;
const IconBtn = styled.button`
  width: 36px; height: 36px; border-radius: 10px; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all 0.2s;
  background: rgba(255,255,255,0.05);
  color: ${p => p.$gold ? '#C49A1A' : p.$danger ? '#ef4444' : '#94a3b8'};
  &:hover {
    background: ${p => p.$gold ? 'rgba(196,154,26,0.15)' : p.$danger ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.1)'};
  }
`;

const Hero = styled.div`margin-bottom: 1.5rem;`;
const HeroImage = styled.div`
  position: relative; height: 320px; border-radius: 20px;
  overflow: hidden; background: #0E1A06;
  @media (max-width: 600px) { height: 220px; }
`;
const HeroPlaceholder = styled.div`
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  color: rgba(107,142,35,0.3);
  background: linear-gradient(135deg, #0E1A06, #1A2409);
`;
const HeroOverlay = styled.div`
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%);
`;
const HeroInfo = styled.div`
  position: absolute; bottom: 1.5rem; left: 1.5rem; right: 1.5rem;
`;
const HeroCategoryBadge = styled.div`
  display: inline-block;
  background: rgba(107,142,35,0.85); color: white;
  padding: 0.25rem 0.7rem; border-radius: 20px;
  font-size: 0.78rem; font-weight: 600; margin-bottom: 0.5rem;
`;
const HeroTitle = styled.h1`
  font-family: 'Unbounded', sans-serif; font-size: 1.8rem;
  font-weight: 700; color: white; margin: 0 0 0.35rem 0;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
  @media (max-width: 600px) { font-size: 1.3rem; }
`;
const HeroOrigin = styled.div`
  display: flex; align-items: center; gap: 0.35rem;
  color: rgba(255,255,255,0.7); font-size: 0.88rem;
`;

const InfoBar = styled.div`
  display: flex; flex-wrap: wrap; gap: 1.25rem;
  padding: 1rem 1.25rem;
  background: #0f172a; border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px; margin-bottom: 1rem;
`;
const InfoItem = styled.div`
  display: flex; align-items: center; gap: 0.35rem;
  font-size: 0.85rem; color: #94a3b8;
`;

const TagsRow = styled.div`display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1.25rem;`;
const Tag = styled.span`
  font-size: 0.75rem; color: #64748b;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
  padding: 0.2rem 0.55rem; border-radius: 20px;
`;

const ActionRow = styled.div`display: flex; gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap;`;
const ActionBtn = styled.button`
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.7rem 1.25rem; border-radius: 12px;
  font-size: 0.88rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
  ${p => p.$primary ? `
    background: linear-gradient(135deg, #6B8E23, #8FAF35);
    color: white; border: none;
    &:hover { opacity: 0.9; transform: translateY(-1px); }
  ` : `
    background: rgba(196,154,26,0.12); color: #C49A1A;
    border: 1px solid rgba(196,154,26,0.25);
    &:hover { background: rgba(196,154,26,0.2); }
  `}
`;

const ContentGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1.2fr;
  gap: 1.5rem; margin-bottom: 1.5rem;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;
const LeftCol = styled.div`display: flex; flex-direction: column; gap: 1.25rem;`;
const RightCol = styled.div`display: flex; flex-direction: column; gap: 1.25rem;`;

const Section = styled.div`
  background: #0f172a;
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 16px; padding: 1.25rem;
`;
const SectionHeader = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;`;
const SectionTitle = styled.div`
  font-weight: 700; font-size: 1rem; color: white; margin-bottom: 1rem;
`;
const AddHistoryBtn = styled.button`
  background: transparent; border: 1px solid rgba(107,142,35,0.25);
  color: #8FAF35; font-size: 0.8rem; padding: 0.3rem 0.7rem;
  border-radius: 8px; cursor: pointer; margin-bottom: 1rem;
  &:hover { background: rgba(107,142,35,0.1); }
`;

const IngredientList = styled.div`display: flex; flex-direction: column; gap: 0.5rem;`;
const IngredientItem = styled.div`
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255,255,255,0.02); border-radius: 8px;
`;
const IngredientQty = styled.div`
  font-weight: 600; font-size: 0.82rem; color: #C49A1A; min-width: 70px; flex-shrink: 0;
`;
const IngredientName = styled.div`font-size: 0.88rem; color: #e2e8f0; flex: 1;`;
const OptionalBadge = styled.span`
  font-size: 0.68rem; color: #64748b;
  background: rgba(255,255,255,0.04); border-radius: 4px;
  padding: 0.1rem 0.4rem;
`;

const StepList = styled.div`display: flex; flex-direction: column; gap: 0.75rem;`;
const StepItem = styled.div`
  display: flex; gap: 0.75rem;
  padding: 0.85rem;
  background: ${p => p.$done ? 'rgba(107,142,35,0.06)' : 'rgba(255,255,255,0.02)'};
  border: 1px solid ${p => p.$done ? 'rgba(107,142,35,0.15)' : 'rgba(255,255,255,0.04)'};
  border-radius: 10px; cursor: pointer; transition: all 0.2s;
  &:hover { border-color: rgba(107,142,35,0.2); }
`;
const StepNumber = styled.div`
  flex-shrink: 0; color: ${p => p.$done ? '#8FAF35' : '#475569'};
  transition: color 0.2s;
`;
const StepText = styled.div`
  font-size: 0.88rem; line-height: 1.5;
  color: ${p => p.$done ? '#64748b' : '#e2e8f0'};
  text-decoration: ${p => p.$done ? 'line-through' : 'none'};
  transition: all 0.2s;
`;
const ClearStepsBtn = styled.button`
  margin-top: 0.75rem; background: transparent; border: none;
  color: #475569; font-size: 0.78rem; cursor: pointer;
  &:hover { color: #64748b; }
`;

const TipsGrid = styled.div`display: flex; flex-direction: column; gap: 0.75rem;`;
const TipCard = styled.div`
  padding: 0.85rem 1rem;
  background: ${p => `${p.$color}08`};
  border: 1px solid ${p => `${p.$color}20`};
  border-left: 3px solid ${p => p.$color};
  border-radius: 10px;
`;
const TipLabel = styled.div`font-size: 0.8rem; font-weight: 700; color: #94a3b8; margin-bottom: 0.35rem;`;
const TipText = styled.div`font-size: 0.85rem; color: #e2e8f0; line-height: 1.5;`;

const LearnGrid = styled.div`display: flex; flex-direction: column; gap: 0.6rem;`;
const LearnItem = styled.div`display: flex; gap: 0.75rem; align-items: flex-start;`;
const LearnKey = styled.div`
  font-size: 0.78rem; font-weight: 700; color: #8FAF35;
  min-width: 90px; flex-shrink: 0; padding-top: 1px;
`;
const LearnVal = styled.div`font-size: 0.85rem; color: #94a3b8; line-height: 1.4;`;

const EmptyHistory = styled.div`color: #475569; font-size: 0.9rem; padding: 1rem 0;`;
const HistoryList = styled.div`display: flex; flex-direction: column; gap: 0.75rem;`;
const HistoryEntry = styled.div`
  padding: 0.85rem; background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05); border-radius: 10px;
`;
const HistoryDate = styled.div`font-weight: 600; font-size: 0.88rem; color: #e2e8f0; margin-bottom: 0.25rem;`;
const HistoryRating = styled.div`font-size: 0.85rem; margin-bottom: 0.25rem;`;
const HistoryNote = styled.div`font-size: 0.85rem; color: #94a3b8; margin-bottom: 0.2rem; line-height: 1.4;`;
const HistoryChange = styled.div`font-size: 0.82rem; color: #64748b;`;

// Modal
const ModalOverlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.65);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 1rem;
`;
const Modal = styled.div`
  background: #0f172a; border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px; padding: 1.5rem;
  width: 100%; max-width: 480px;
  animation: ${fadeUp} 0.25s ease-out;
`;
const ModalHeader = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;`;
const ModalTitle = styled.div`font-weight: 700; font-size: 1.1rem; color: white;`;
const CloseModalBtn = styled.button`
  background: transparent; border: none; color: #64748b; cursor: pointer;
  &:hover { color: #94a3b8; }
`;
const ModalBody = styled.div`display: flex; flex-direction: column; gap: 1rem;`;
const FormGroup = styled.div`display: flex; flex-direction: column; gap: 0.4rem;`;
const Label = styled.label`font-size: 0.82rem; color: #94a3b8; font-weight: 600;`;
const RatingRow = styled.div`display: flex; gap: 0.5rem;`;
const StarBtn = styled.button`
  font-size: 1.5rem; background: transparent; border: none; cursor: pointer;
  color: ${p => p.$active ? '#C49A1A' : '#334155'};
  transition: color 0.1s; line-height: 1;
`;
const TextArea = styled.textarea`
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px; color: #e2e8f0; padding: 0.75rem; font-size: 0.88rem;
  outline: none; resize: vertical; font-family: inherit;
  &:focus { border-color: rgba(107,142,35,0.4); }
`;
const SaveBtn = styled.button`
  background: linear-gradient(135deg, #6B8E23, #8FAF35);
  color: white; border: none; border-radius: 12px;
  padding: 0.85rem; font-size: 0.92rem; font-weight: 700;
  cursor: pointer; transition: opacity 0.2s;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
  &:not(:disabled):hover { opacity: 0.9; }
`;

export default MediterraneanRecipeDetailPage;
