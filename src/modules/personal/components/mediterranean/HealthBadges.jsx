// components/mediterranean/HealthBadges.js — Badges de beneficios para la salud
import React from 'react';
import styled from 'styled-components';

export const HEALTH_OPTIONS = [
  { key: 'cardiovascular', emoji: '❤️', label: 'Salud cardiovascular', color: '#ef4444' },
  { key: 'cerebral', emoji: '🧠', label: 'Salud cerebral', color: '#8b5cf6' },
  { key: 'proteinas', emoji: '💪', label: 'Proteínas altas', color: '#f59e0b' },
  { key: 'fibra', emoji: '🥦', label: 'Rica en fibra', color: '#22c55e' },
  { key: 'omega3', emoji: '🐟', label: 'Omega 3', color: '#3b82f6' },
  { key: 'grasas_saludables', emoji: '🫒', label: 'Grasas saludables', color: '#84cc16' },
  { key: 'entrenamiento', emoji: '⚡', label: 'Buena para entrenar', color: '#eab308' },
  { key: 'bajo_ultraprocesados', emoji: '🥗', label: 'Baja en ultraprocesados', color: '#10b981' },
];

const HEALTH_MAP = Object.fromEntries(HEALTH_OPTIONS.map(o => [o.key, o]));

const HealthBadges = ({ tags = [], size = 'md', selectable = false, selected = [], onToggle }) => {
  const list = selectable ? HEALTH_OPTIONS : tags.map(t => HEALTH_MAP[t]).filter(Boolean);
  if (list.length === 0) return null;

  return (
    <BadgesGrid $size={size}>
      {list.map(option => {
        const isSelected = selectable ? selected.includes(option.key) : true;
        return (
          <Badge
            key={option.key}
            $color={option.color}
            $active={isSelected}
            $selectable={selectable}
            $size={size}
            onClick={selectable && onToggle ? () => onToggle(option.key) : undefined}
            title={option.label}
          >
            <span>{option.emoji}</span>
            {size !== 'sm' && <span>{option.label}</span>}
          </Badge>
        );
      })}
    </BadgesGrid>
  );
};

const BadgesGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${p => p.$size === 'sm' ? '0.35rem' : '0.5rem'};
`;

const Badge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: ${p => p.$size === 'sm' ? '0.2rem 0.4rem' : '0.35rem 0.65rem'};
  border-radius: ${p => p.$size === 'sm' ? '6px' : '8px'};
  font-size: ${p => p.$size === 'sm' ? '0.72rem' : '0.8rem'};
  font-weight: 500;
  cursor: ${p => p.$selectable ? 'pointer' : 'default'};
  transition: all 0.2s;
  background: ${p => p.$active ? `${p.$color}18` : 'rgba(255,255,255,0.04)'};
  color: ${p => p.$active ? p.$color : '#475569'};
  border: 1px solid ${p => p.$active ? `${p.$color}35` : 'rgba(255,255,255,0.06)'};
  user-select: none;

  ${p => p.$selectable && `
    &:hover {
      background: ${p.$color}22;
      border-color: ${p.$color}50;
      color: ${p.$color};
    }
  `}
`;

export default HealthBadges;
