// components/mediterranean/RecipeCard.js — Tarjeta de receta para la galería
import React from 'react';
import styled from 'styled-components';
import { Clock, Star, Heart, ChefHat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CATEGORY_LABELS = {
  desayuno: { label: 'Desayuno', emoji: '🌅' },
  almuerzo: { label: 'Almuerzo', emoji: '🌿' },
  cena: { label: 'Cena', emoji: '🌙' },
  snack: { label: 'Snack', emoji: '🫒' },
  postre: { label: 'Postre', emoji: '🍯' },
};

const DIFF_LABELS = ['', 'Fácil', 'Fácil+', 'Medio', 'Difícil', 'Experto'];

const RecipeCard = ({ recipe, onFavoriteToggle }) => {
  const navigate = useNavigate();
  const cat = CATEGORY_LABELS[recipe.category] || { label: recipe.category, emoji: '🍽' };
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

  const handleFavorite = (e) => {
    e.stopPropagation();
    if (onFavoriteToggle) onFavoriteToggle(recipe.id);
  };

  return (
    <Card onClick={() => navigate(`/personal/mediterranean/recipes/${recipe.id}`)}>
      <ImageArea>
        {recipe.image_url ? (
          <RecipeImage src={recipe.image_url} alt={recipe.name} />
        ) : (
          <ImagePlaceholder>
            <ChefHat size={32} />
          </ImagePlaceholder>
        )}
        <CategoryBadge>{cat.emoji} {cat.label}</CategoryBadge>
        <FavButton $active={recipe.is_favorite} onClick={handleFavorite}>
          <Heart size={16} fill={recipe.is_favorite ? '#C49A1A' : 'none'} />
        </FavButton>
        <CostBadge>{recipe.cost || '$$'}</CostBadge>
      </ImageArea>

      <CardBody>
        <RecipeName>{recipe.name}</RecipeName>
        {recipe.origin_country && <Origin>🌍 {recipe.origin_country}</Origin>}

        <MetaRow>
          {totalTime > 0 && (
            <MetaItem>
              <Clock size={13} />
              {totalTime} min
            </MetaItem>
          )}
          {recipe.difficulty && (
            <MetaItem>
              <Star size={13} />
              {DIFF_LABELS[recipe.difficulty] || recipe.difficulty}
            </MetaItem>
          )}
          {recipe.servings && (
            <MetaItem>🍽 {recipe.servings} porciones</MetaItem>
          )}
        </MetaRow>

        {recipe.calories && (
          <MacroRow>
            <MacroItem $color="#C49A1A">{recipe.calories} kcal</MacroItem>
            {recipe.protein && <MacroItem $color="#6B8E23">{recipe.protein}g prot</MacroItem>}
            {recipe.carbs && <MacroItem $color="#2E6E9E">{recipe.carbs}g carbs</MacroItem>}
          </MacroRow>
        )}

        {recipe.tags && Array.isArray(recipe.tags) && recipe.tags.length > 0 && (
          <TagsRow>
            {recipe.tags.slice(0, 3).map(tag => (
              <Tag key={tag}>{tag}</Tag>
            ))}
            {recipe.tags.length > 3 && <Tag>+{recipe.tags.length - 3}</Tag>}
          </TagsRow>
        )}
      </CardBody>
    </Card>
  );
};

const Card = styled.div`
  background: #0f1a05;
  border: 1px solid rgba(107, 142, 35, 0.15);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-3px);
    border-color: rgba(107, 142, 35, 0.35);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }
`;

const ImageArea = styled.div`
  position: relative;
  height: 160px;
  background: #0E1A06;
  flex-shrink: 0;
`;

const RecipeImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ImagePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(107, 142, 35, 0.3);
  background: linear-gradient(135deg, #0E1A06 0%, #1A2409 100%);
`;

const CategoryBadge = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  color: #8FAF35;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.25rem 0.6rem;
  border-radius: 20px;
  border: 1px solid rgba(107, 142, 35, 0.25);
`;

const CostBadge = styled.div`
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: rgba(196, 154, 26, 0.85);
  color: #0a0f1e;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
`;

const FavButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(196, 154, 26, ${p => p.$active ? '0.4' : '0.15'});
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${p => p.$active ? '#C49A1A' : '#64748b'};
  transition: all 0.2s;
  &:hover { border-color: rgba(196, 154, 26, 0.5); color: #C49A1A; }
`;

const CardBody = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
`;

const RecipeName = styled.div`
  font-weight: 700;
  font-size: 0.95rem;
  color: #e2e8f0;
  line-height: 1.3;
`;

const Origin = styled.div`
  font-size: 0.78rem;
  color: #64748b;
`;

const MetaRow = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.78rem;
  color: #94a3b8;
`;

const MacroRow = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const MacroItem = styled.div`
  font-size: 0.72rem;
  font-weight: 600;
  color: ${p => p.$color || '#94a3b8'};
  background: ${p => p.$color ? `${p.$color}18` : 'transparent'};
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
`;

const TagsRow = styled.div`
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  margin-top: auto;
`;

const Tag = styled.span`
  font-size: 0.68rem;
  color: #475569;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
`;

export default RecipeCard;
