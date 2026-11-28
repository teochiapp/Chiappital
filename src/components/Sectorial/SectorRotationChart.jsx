import React, { useMemo, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Compass, Info } from 'lucide-react';

const QUADRANTS = {
  improving: {
    key: 'improving',
    label: 'MEJORANDO',
    shortDesc: 'Débil vs SPY, pero acelerando',
    color: '#60a5fa',
    stroke: '#3b82f6',
    glow: 'rgba(96, 165, 250, 0.7)',
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(96, 165, 250, 0.28)',
    corner: 'rgba(96, 165, 250, 0.42)'
  },
  leading: {
    key: 'leading',
    label: 'LÍDERES',
    shortDesc: 'Fuerte vs SPY y acelerando',
    color: '#34d399',
    stroke: '#10b981',
    glow: 'rgba(52, 211, 153, 0.72)',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(52, 211, 153, 0.28)',
    corner: 'rgba(52, 211, 153, 0.44)'
  },
  lagging: {
    key: 'lagging',
    label: 'REZAGADOS',
    shortDesc: 'Débil vs SPY y frenando',
    color: '#f87171',
    stroke: '#ef4444',
    glow: 'rgba(248, 113, 113, 0.72)',
    bg: 'rgba(239, 68, 68, 0.11)',
    border: 'rgba(248, 113, 113, 0.28)',
    corner: 'rgba(248, 113, 113, 0.40)'
  },
  weakening: {
    key: 'weakening',
    label: 'DEBILITÁNDOSE',
    shortDesc: 'Fuerte vs SPY, pero frenando',
    color: '#fbbf24',
    stroke: '#f59e0b',
    glow: 'rgba(251, 191, 36, 0.72)',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(251, 191, 36, 0.28)',
    corner: 'rgba(251, 191, 36, 0.44)'
  }
};

const QUADRANT_ORDER = ['leading', 'improving', 'weakening', 'lagging'];

const TRAIL_OPTIONS = [
  { id: 'short', label: 'Corto', count: 4 },
  { id: 'medium', label: 'Medio', count: 7 },
  { id: 'long', label: 'Largo', count: 10 }
];

// Partículas ambientales determinísticas para dar profundidad sutil al canvas oscuro
const AMBIENT_DOTS = [
  { x: 0.08, y: 0.34, r: 1.4, c: '#38bdf8', o: 0.22 },
  { x: 0.14, y: 0.62, r: 1.1, c: '#60a5fa', o: 0.16 },
  { x: 0.21, y: 0.18, r: 1.0, c: '#94a3b8', o: 0.15 },
  { x: 0.39, y: 0.25, r: 2.0, c: '#34d399', o: 0.22 },
  { x: 0.48, y: 0.46, r: 1.2, c: '#34d399', o: 0.18 },
  { x: 0.54, y: 0.55, r: 1.8, c: '#10b981', o: 0.22 },
  { x: 0.68, y: 0.15, r: 1.1, c: '#34d399', o: 0.18 },
  { x: 0.76, y: 0.39, r: 1.3, c: '#34d399', o: 0.20 },
  { x: 0.88, y: 0.28, r: 1.8, c: '#34d399', o: 0.22 },
  { x: 0.92, y: 0.72, r: 1.3, c: '#fbbf24', o: 0.18 },
  { x: 0.28, y: 0.78, r: 1.2, c: '#f87171', o: 0.15 },
  { x: 0.62, y: 0.84, r: 1.1, c: '#fbbf24', o: 0.15 }
];

const VIEW_W = 1120;
const VIEW_H = 620;
const PAD = { left: 78, right: 36, top: 30, bottom: 60 };
const PLOT_W = VIEW_W - PAD.left - PAD.right;
const PLOT_H = VIEW_H - PAD.top - PAD.bottom;

function buildSmoothPath(points) {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].px.toFixed(1)} ${points[0].py.toFixed(1)}`;
  if (points.length === 2) {
    return `M ${points[0].px.toFixed(1)} ${points[0].py.toFixed(1)} L ${points[1].px.toFixed(1)} ${points[1].py.toFixed(1)}`;
  }
  let d = `M ${points[0].px.toFixed(1)} ${points[0].py.toFixed(1)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].px + points[i + 1].px) / 2;
    const midY = (points[i].py + points[i + 1].py) / 2;
    d += ` Q ${points[i].px.toFixed(1)} ${points[i].py.toFixed(1)}, ${midX.toFixed(1)} ${midY.toFixed(1)}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.px.toFixed(1)} ${last.py.toFixed(1)}`;
  return d;
}

// Relajación ligera para evitar que los tickers se superpongan entre sí
function resolveLabelPositions(nodes) {
  const placed = nodes.map(n => {
    const cleanTicker = n.ticker.replace('-USD', '');
    const width = Math.max(30, cleanTicker.length * 7.6 + 10);
    const height = 16;
    const defaultSide = n.px > PAD.left + PLOT_W - 85 ? -1 : 1;
    return {
      id: n.id,
      anchorX: n.px,
      anchorY: n.py,
      x: n.px + (defaultSide > 0 ? 12 : -(width + 10)),
      y: n.py - 8,
      w: width,
      h: height,
      label: cleanTicker
    };
  });

  for (let iter = 0; iter < 28; iter++) {
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i];
        const b = placed[j];
        const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) + 4;
        const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) + 3;
        if (overlapX > 0 && overlapY > 0) {
          if (overlapY <= overlapX) {
            const dy = overlapY / 2 + 0.6;
            if (a.y <= b.y) { a.y -= dy; b.y += dy; }
            else { a.y += dy; b.y -= dy; }
          } else {
            const dx = overlapX / 2 + 0.6;
            if (a.x <= b.x) { a.x -= dx; b.x += dx; }
            else { a.x += dx; b.x -= dx; }
          }
        }
      }
      // Mantener dentro del área del gráfico
      const p = placed[i];
      p.x = Math.max(PAD.left + 8, Math.min(PAD.left + PLOT_W - p.w - 8, p.x));
      p.y = Math.max(PAD.top + 8, Math.min(PAD.top + PLOT_H - p.h - 8, p.y));
    }
  }

  return new Map(placed.map(p => [p.id, p]));
}

const formatSigned = (val, digits = 2, suffix = '') => {
  if (typeof val !== 'number' || !Number.isFinite(val)) return '—';
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(digits)}${suffix}`;
};

const TRAIL_STORAGE_KEY = 'chiappital_rrg_trail_size';

const SectorRotationChart = ({ items = [], loading = false, activeTab = 'sectores' }) => {
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedQuadrant, setSelectedQuadrant] = useState('all');
  const [trailSize, setTrailSize] = useState(() => {
    try {
      const saved = localStorage.getItem(TRAIL_STORAGE_KEY);
      if (saved && TRAIL_OPTIONS.some(o => o.id === saved)) return saved;
    } catch { /* ignorar */ }
    return 'long';
  });

  const handleTrailSizeChange = (id) => {
    setTrailSize(id);
    try {
      localStorage.setItem(TRAIL_STORAGE_KEY, id);
    } catch { /* ignorar */ }
  };

  const trailCount = TRAIL_OPTIONS.find(o => o.id === trailSize)?.count || 10;

  // Calcular dominio simétrico alrededor de 0
  const { domainX, domainY, projected, labelMap, counts } = useMemo(() => {
    const valid = (items || []).filter(it => Array.isArray(it.trail) && it.trail.length > 0);
    const countsObj = { all: valid.length, leading: 0, improving: 0, weakening: 0, lagging: 0 };
    valid.forEach(it => {
      if (countsObj[it.quadrant] !== undefined) countsObj[it.quadrant]++;
    });

    let maxAbsX = 2.15;
    let maxAbsY = 2.0;
    for (const it of valid) {
      const sliced = it.trail.slice(-trailCount);
      for (const pt of sliced) {
        if (Math.abs(pt.x) > maxAbsX) maxAbsX = Math.abs(pt.x);
        if (Math.abs(pt.y) > maxAbsY) maxAbsY = Math.abs(pt.y);
      }
    }
    const dX = Math.min(2.75, Math.max(2.35, maxAbsX * 1.12));
    const dY = Math.min(2.75, Math.max(2.15, maxAbsY * 1.15));

    const toPx = (x) => PAD.left + ((x + dX) / (2 * dX)) * PLOT_W;
    const toPy = (y) => PAD.top + ((dY - y) / (2 * dY)) * PLOT_H;

    const proj = valid.map(it => {
      const sliced = it.trail.slice(-trailCount);
      const pts = sliced.map(p => ({ ...p, px: toPx(p.x), py: toPy(p.y) }));
      const head = pts[pts.length - 1];
      const start = pts[0];
      return {
        ...it,
        px: head.px,
        py: head.py,
        startPx: start.px,
        startPy: start.py,
        pts,
        pathD: buildSmoothPath(pts),
        qMeta: QUADRANTS[it.quadrant] || QUADRANTS.leading
      };
    });

    const visibleForLabels = selectedQuadrant === 'all'
      ? proj
      : proj.filter(p => p.quadrant === selectedQuadrant);

    return {
      domainX: dX,
      domainY: dY,
      projected: proj,
      labelMap: resolveLabelPositions(visibleForLabels),
      counts: countsObj
    };
  }, [items, trailCount, selectedQuadrant]);

  const zeroX = PAD.left + PLOT_W / 2;
  const zeroY = PAD.top + PLOT_H / 2;

  const toPx = (x) => PAD.left + ((x + domainX) / (2 * domainX)) * PLOT_W;
  const toPy = (y) => PAD.top + ((domainY - y) / (2 * domainY)) * PLOT_H;

  const hoveredItem = projected.find(p => p.id === hoveredId) || null;

  const xTicks = [-2, -1, 0, 1, 2];
  const yTicks = [-2, -1, 1, 2];

  const entityLabel = activeTab === 'sectores' ? 'sectores' : 'regiones';

  return (
    <Wrapper>
      <HeaderBar>
        <TitleBlock>
          <TitleRow>
            <Compass size={19} color="#34d399" />
            <CardTitle>Mapa de Rotación Relativa vs SPY</CardTitle>
            <BenchmarkBadge>BENCHMARK: SPY (0, 0)</BenchmarkBadge>
          </TitleRow>
          <CardSubtitle>
            Evolución de la fuerza relativa y su momentum en 4 cuadrantes para los {entityLabel}. Pasá el cursor por cualquier trayectoria o ticker para inspeccionar su rotación.
          </CardSubtitle>
        </TitleBlock>

        <ControlsGroup>
          <ControlPillGroup role="group" aria-label="Longitud de trayectoria">
            <ControlLabel>Estela:</ControlLabel>
            {TRAIL_OPTIONS.map(opt => (
              <SmallPill
                key={opt.id}
                $active={trailSize === opt.id}
                onClick={() => handleTrailSizeChange(opt.id)}
              >
                {opt.label}
              </SmallPill>
            ))}
          </ControlPillGroup>

          <FilterRow>
            <FilterChip
              $active={selectedQuadrant === 'all'}
              $accent="#94a3b8"
              onClick={() => setSelectedQuadrant('all')}
            >
              Todos <span>{counts.all}</span>
            </FilterChip>
            {QUADRANT_ORDER.map(qKey => {
              const q = QUADRANTS[qKey];
              return (
                <FilterChip
                  key={qKey}
                  $active={selectedQuadrant === qKey}
                  $accent={q.color}
                  onClick={() => setSelectedQuadrant(prev => prev === qKey ? 'all' : qKey)}
                >
                  <DotIndicator $color={q.color} />
                  {q.label.charAt(0) + q.label.slice(1).toLowerCase()}
                  <span>{counts[qKey]}</span>
                </FilterChip>
              );
            })}
          </FilterRow>
        </ControlsGroup>
      </HeaderBar>

      {loading && projected.length === 0 ? (
        <EmptyChart>Calculando fuerza relativa y momentum contra SPY…</EmptyChart>
      ) : projected.length === 0 ? (
        <EmptyChart>
          <Info size={18} />
          Todavía no hay historial suficiente para calcular la rotación relativa. Presioná «Cargar / Actualizar».
        </EmptyChart>
      ) : (
        <CanvasFrame onMouseLeave={() => setHoveredId(null)}>
          <StyledSvg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            role="img"
            aria-label="Mapa de rotación relativa en 4 cuadrantes contra SPY"
          >
            <defs>
              {/* Glow suave para cada color de cuadrante */}
              <filter id="rrg-glow-leading" x="-120%" y="-120%" width="340%" height="340%">
                <feGaussianBlur stdDeviation="5.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="rrg-glow-improving" x="-120%" y="-120%" width="340%" height="340%">
                <feGaussianBlur stdDeviation="5.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="rrg-glow-weakening" x="-120%" y="-120%" width="340%" height="340%">
                <feGaussianBlur stdDeviation="5.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="rrg-glow-lagging" x="-120%" y="-120%" width="340%" height="340%">
                <feGaussianBlur stdDeviation="5.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Gradientes sutiles por cuadrante */}
              <radialGradient id="quad-improving" cx="15%" cy="15%" r="85%">
                <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.24" />
                <stop offset="100%" stopColor="#070d19" stopOpacity="0.06" />
              </radialGradient>
              <radialGradient id="quad-leading" cx="85%" cy="15%" r="85%">
                <stop offset="0%" stopColor="#065f46" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#070d19" stopOpacity="0.06" />
              </radialGradient>
              <radialGradient id="quad-lagging" cx="15%" cy="85%" r="85%">
                <stop offset="0%" stopColor="#7f1d1d" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#090b12" stopOpacity="0.06" />
              </radialGradient>
              <radialGradient id="quad-weakening" cx="85%" cy="85%" r="85%">
                <stop offset="0%" stopColor="#78350f" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#090b12" stopOpacity="0.06" />
              </radialGradient>

              {/* Gradiente de estela por cada instrumento */}
              {projected.map(item => (
                <linearGradient
                  key={`grad-${item.id}`}
                  id={`trail-grad-${item.id}`}
                  gradientUnits="userSpaceOnUse"
                  x1={item.startPx}
                  y1={item.startPy}
                  x2={item.px}
                  y2={item.py}
                >
                  <stop offset="0%" stopColor={item.qMeta.stroke} stopOpacity="0.20" />
                  <stop offset="55%" stopColor={item.qMeta.stroke} stopOpacity="0.68" />
                  <stop offset="100%" stopColor={item.qMeta.color} stopOpacity="0.98" />
                </linearGradient>
              ))}
            </defs>

            {/* Fondo base profundo */}
            <rect
              x={PAD.left}
              y={PAD.top}
              width={PLOT_W}
              height={PLOT_H}
              rx="10"
              fill="#070b14"
              stroke="rgba(148, 163, 184, 0.14)"
              strokeWidth="1"
            />

            {/* 4 Cuadrantes tintados */}
            <rect x={PAD.left} y={PAD.top} width={PLOT_W / 2} height={PLOT_H / 2} fill="url(#quad-improving)" />
            <rect x={zeroX} y={PAD.top} width={PLOT_W / 2} height={PLOT_H / 2} fill="url(#quad-leading)" />
            <rect x={PAD.left} y={zeroY} width={PLOT_W / 2} height={PLOT_H / 2} fill="url(#quad-lagging)" />
            <rect x={zeroX} y={zeroY} width={PLOT_W / 2} height={PLOT_H / 2} fill="url(#quad-weakening)" />

            {/* Partículas ambientales sutiles */}
            {AMBIENT_DOTS.map((d, idx) => (
              <circle
                key={idx}
                cx={PAD.left + d.x * PLOT_W}
                cy={PAD.top + d.y * PLOT_H}
                r={d.r}
                fill={d.c}
                opacity={d.o}
                pointerEvents="none"
              />
            ))}

            {/* Grilla secundaria ultra tenue */}
            {xTicks.filter(t => t !== 0).map(t => {
              const x = toPx(t);
              return (
                <line
                  key={`gx-${t}`}
                  x1={x}
                  y1={PAD.top}
                  x2={x}
                  y2={PAD.top + PLOT_H}
                  stroke="rgba(148, 163, 184, 0.055)"
                  strokeWidth="1"
                />
              );
            })}
            {yTicks.map(t => {
              const y = toPy(t);
              return (
                <line
                  key={`gy-${t}`}
                  x1={PAD.left}
                  y1={y}
                  x2={PAD.left + PLOT_W}
                  y2={y}
                  stroke="rgba(148, 163, 184, 0.055)"
                  strokeWidth="1"
                />
              );
            })}

            {/* Ejes centrales en (0, 0) punteados */}
            <line
              x1={zeroX}
              y1={PAD.top}
              x2={zeroX}
              y2={PAD.top + PLOT_H}
              stroke="rgba(148, 163, 184, 0.24)"
              strokeDasharray="4 5"
              strokeWidth="1.2"
            />
            <line
              x1={PAD.left}
              y1={zeroY}
              x2={PAD.left + PLOT_W}
              y2={zeroY}
              stroke="rgba(148, 163, 184, 0.24)"
              strokeDasharray="4 5"
              strokeWidth="1.2"
            />

            {/* Etiquetas de los 4 cuadrantes en las esquinas */}
            <text x={PAD.left + 14} y={PAD.top + 20} fill={QUADRANTS.improving.corner} fontSize="11" fontWeight="700" letterSpacing="1.8" fontFamily="monospace">
              MEJORANDO
            </text>
            <text x={PAD.left + PLOT_W - 14} y={PAD.top + 20} textAnchor="end" fill={QUADRANTS.leading.corner} fontSize="11" fontWeight="700" letterSpacing="1.8" fontFamily="monospace">
              LÍDERES
            </text>
            <text x={PAD.left + 14} y={PAD.top + PLOT_H - 12} fill={QUADRANTS.lagging.corner} fontSize="11" fontWeight="700" letterSpacing="1.8" fontFamily="monospace">
              REZAGADOS
            </text>
            <text x={PAD.left + PLOT_W - 14} y={PAD.top + PLOT_H - 12} textAnchor="end" fill={QUADRANTS.weakening.corner} fontSize="11" fontWeight="700" letterSpacing="1.8" fontFamily="monospace">
              DEBILITÁNDOSE
            </text>

            {/* Ticks numéricos del eje Y */}
            {yTicks.map(t => (
              <text
                key={`ty-${t}`}
                x={PAD.left - 10}
                y={toPy(t) + 4}
                textAnchor="end"
                fill="#64748b"
                fontSize="11"
                fontWeight="500"
                fontFamily="monospace"
              >
                {t > 0 ? `+${t}` : `${t}`}
              </text>
            ))}

            {/* Ticks numéricos del eje X */}
            {xTicks.map(t => (
              <text
                key={`tx-${t}`}
                x={toPx(t)}
                y={PAD.top + PLOT_H + 19}
                textAnchor="middle"
                fill={t === 0 ? '#cbd5e1' : '#64748b'}
                fontSize="11"
                fontWeight={t === 0 ? '700' : '500'}
                fontFamily="monospace"
              >
                {t > 0 ? `+${t}` : `${t}`}
              </text>
            ))}

            {/* Títulos y direcciones de ejes (fiel a la imagen de referencia) */}
            <text x={PAD.left + 4} y={VIEW_H - 12} fill="#64748b" fontSize="11" fontFamily="monospace">
              ◀ más débil que SPY
            </text>
            <text x={zeroX} y={VIEW_H - 12} textAnchor="middle" fill="#94a3b8" fontSize="11.5" fontWeight="700" letterSpacing="1.6" fontFamily="monospace">
              FUERZA RELATIVA vs SPY
            </text>
            <text x={PAD.left + PLOT_W - 4} y={VIEW_H - 12} textAnchor="end" fill="#64748b" fontSize="11" fontFamily="monospace">
              más fuerte que SPY ▶
            </text>

            {/* Eje Y vertical */}
            <text
              x={22}
              y={PAD.top + 38}
              textAnchor="middle"
              fill="#64748b"
              fontSize="10.5"
              fontFamily="monospace"
              transform={`rotate(-90, 22, ${PAD.top + 38})`}
            >
              acelera ▶
            </text>
            <text
              x={22}
              y={zeroY}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="11"
              fontWeight="700"
              letterSpacing="1.4"
              fontFamily="monospace"
              transform={`rotate(-90, 22, ${zeroY})`}
            >
              MOMENTUM DE LA FUERZA RELATIVA
            </text>
            <text
              x={22}
              y={PAD.top + PLOT_H - 34}
              textAnchor="middle"
              fill="#64748b"
              fontSize="10.5"
              fontFamily="monospace"
              transform={`rotate(-90, 22, ${PAD.top + PLOT_H - 34})`}
            >
              ◀ frena
            </text>

            {/* Trayectorias y Nodos */}
            {projected.map(item => {
              const matchesFilter = selectedQuadrant === 'all' || item.quadrant === selectedQuadrant;
              if (!matchesFilter) return null;

              const isHovered = hoveredId === item.id;
              const isDimmed = hoveredId !== null && !isHovered;
              const opacity = isDimmed ? 0.14 : 1;
              const labelPos = labelMap.get(item.id);

              return (
                <g
                  key={item.id}
                  style={{
                    opacity,
                    transition: 'opacity 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={() => setHoveredId(item.id)}
                >
                  {/* Hitbox invisible más ancho para facilitar hover */}
                  <path
                    d={item.pathD}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="14"
                  />

                  {/* Estela principal con gradiente de opacidad */}
                  <path
                    d={item.pathD}
                    fill="none"
                    stroke={`url(#trail-grad-${item.id})`}
                    strokeWidth={isHovered ? 3.1 : 2.15}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Punto de origen sutil */}
                  <circle
                    cx={item.startPx}
                    cy={item.startPy}
                    r={isHovered ? 3 : 2}
                    fill={item.qMeta.stroke}
                    opacity={isHovered ? 0.85 : 0.45}
                  />

                  {/* Puntos intermedios visibles cuando se hace hover */}
                  {isHovered && item.pts.slice(1, -1).map((pt, idx) => (
                    <circle
                      key={idx}
                      cx={pt.px}
                      cy={pt.py}
                      r={2.5}
                      fill={item.qMeta.color}
                      opacity={0.45 + (idx / item.pts.length) * 0.45}
                    />
                  ))}

                  {/* Halo luminoso externo de la cabeza */}
                  <circle
                    cx={item.px}
                    cy={item.py}
                    r={isHovered ? 12 : 8.5}
                    fill={item.qMeta.color}
                    opacity={isHovered ? 0.34 : 0.24}
                    filter={`url(#rrg-glow-${item.quadrant})`}
                  />

                  {/* Anillo de color del cuadrante */}
                  <circle
                    cx={item.px}
                    cy={item.py}
                    r={isHovered ? 6.5 : 5}
                    fill={item.qMeta.color}
                    filter={`url(#rrg-glow-${item.quadrant})`}
                  />

                  {/* Núcleo blanco brillante */}
                  <circle
                    cx={item.px}
                    cy={item.py}
                    r={isHovered ? 3.2 : 2.4}
                    fill="#ffffff"
                  />

                  {/* Etiqueta del ticker con anti-colisión */}
                  {labelPos && (
                    <g pointerEvents="none">
                      {Math.hypot(labelPos.x - item.px, labelPos.y + 8 - item.py) > 22 && (
                        <line
                          x1={item.px}
                          y1={item.py}
                          x2={labelPos.x + (labelPos.x > item.px ? 0 : labelPos.w)}
                          y2={labelPos.y + 8}
                          stroke={item.qMeta.color}
                          strokeOpacity="0.35"
                          strokeWidth="1"
                        />
                      )}
                      <text
                        x={labelPos.x + 2}
                        y={labelPos.y + 12}
                        fill={isHovered ? '#ffffff' : '#e2e8f0'}
                        fontSize={isHovered ? '12.5' : '11'}
                        fontWeight="800"
                        fontFamily="monospace"
                        style={{
                          textShadow: '0 1px 6px rgba(2, 6, 23, 0.95), 0 0 12px rgba(2, 6, 23, 0.9)'
                        }}
                      >
                        {labelPos.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </StyledSvg>

          {/* Tooltip flotante glassmorphism */}
          {hoveredItem && (
            <TooltipCard
              $alignRight={hoveredItem.px > VIEW_W * 0.62}
              $alignBottom={hoveredItem.py > VIEW_H * 0.55}
              $borderColor={hoveredItem.qMeta.border}
            >
              <TooltipTop>
                <div>
                  <TooltipTicker>{hoveredItem.ticker}</TooltipTicker>
                  <TooltipName>{hoveredItem.name}</TooltipName>
                </div>
                <QuadrantPill $color={hoveredItem.qMeta.color} $bg={hoveredItem.qMeta.bg} $border={hoveredItem.qMeta.border}>
                  {hoveredItem.qMeta.label}
                </QuadrantPill>
              </TooltipTop>

              <TooltipGrid>
                <MetricCell>
                  <span>Fuerza Rel. vs SPY</span>
                  <strong style={{ color: hoveredItem.x >= 0 ? '#34d399' : '#f87171' }}>
                    {formatSigned(hoveredItem.x, 2)} ({formatSigned(hoveredItem.rawRs, 2, '%')})
                  </strong>
                </MetricCell>
                <MetricCell>
                  <span>Momentum RS</span>
                  <strong style={{ color: hoveredItem.y >= 0 ? '#60a5fa' : '#fbbf24' }}>
                    {formatSigned(hoveredItem.y, 2)} ({hoveredItem.y >= 0 ? 'acelera' : 'frena'})
                  </strong>
                </MetricCell>
                <MetricCell>
                  <span>Semanal</span>
                  <strong style={{ color: (hoveredItem.weeklyPerf || 0) >= 0 ? '#34d399' : '#f87171' }}>
                    {formatSigned(hoveredItem.weeklyPerf, 2, '%')}
                  </strong>
                </MetricCell>
                <MetricCell>
                  <span>Mensual</span>
                  <strong style={{ color: (hoveredItem.monthlyPerf || 0) >= 0 ? '#34d399' : '#f87171' }}>
                    {formatSigned(hoveredItem.monthlyPerf, 2, '%')}
                  </strong>
                </MetricCell>
              </TooltipGrid>

              <TooltipFoot>
                Trayectoria: {hoveredItem.pts[0]?.date} → {hoveredItem.pts[hoveredItem.pts.length - 1]?.date}
              </TooltipFoot>
            </TooltipCard>
          )}
        </CanvasFrame>
      )}

      {/* Resumen interactivo de los 4 cuadrantes */}
      {projected.length > 0 && (
        <QuadrantSummaryGrid>
          {['improving', 'leading', 'lagging', 'weakening'].map(qKey => {
            const q = QUADRANTS[qKey];
            const qItems = projected.filter(p => p.quadrant === qKey);
            return (
              <QuadrantBox key={qKey} $border={q.border} $bg={q.bg}>
                <QuadrantBoxHeader>
                  <QuadrantBoxTitle $color={q.color}>{q.label}</QuadrantBoxTitle>
                  <QuadrantCount $color={q.color}>{qItems.length}</QuadrantCount>
                </QuadrantBoxHeader>
                <QuadrantDesc>{q.shortDesc}</QuadrantDesc>
                <ChipList>
                  {qItems.length === 0 ? (
                    <EmptyTag>Sin {entityLabel}</EmptyTag>
                  ) : (
                    qItems.map(it => (
                      <SectorChip
                        key={it.id}
                        $color={q.color}
                        $active={hoveredId === it.id}
                        onMouseEnter={() => {
                          setSelectedQuadrant('all');
                          setHoveredId(it.id);
                        }}
                        onMouseLeave={() => setHoveredId(null)}
                        title={`${it.name} · RS: ${formatSigned(it.x, 2)} · Mom: ${formatSigned(it.y, 2)}`}
                      >
                        <DotIndicator $color={q.color} />
                        <strong>{it.ticker.replace('-USD', '')}</strong>
                        <span>{it.name}</span>
                      </SectorChip>
                    ))
                  )}
                </ChipList>
              </QuadrantBox>
            );
          })}
        </QuadrantSummaryGrid>
      )}
    </Wrapper>
  );
};

// ─── Estilos ─────────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Wrapper = styled.section`
  margin-bottom: 2.25rem;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.92) 0%, rgba(10, 16, 30, 0.96) 100%);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 16px;
  padding: 1.5rem 1.75rem 1.75rem;
  box-shadow: 0 20px 50px rgba(2, 6, 23, 0.45);
  animation: ${fadeIn} 0.35s ease-out;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const HeaderBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.25rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
`;

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

const CardTitle = styled.h2`
  font-family: 'Unbounded', sans-serif;
  font-size: 1.15rem;
  font-weight: 600;
  color: #f8fafc;
  margin: 0;
`;

const BenchmarkBadge = styled.span`
  font-family: monospace;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #94a3b8;
  background: rgba(148, 163, 184, 0.1);
  border: 1px solid rgba(148, 163, 184, 0.2);
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
`;

const CardSubtitle = styled.p`
  margin: 0;
  color: #94a3b8;
  font-size: 0.86rem;
  max-width: 720px;
`;

const ControlsGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.6rem;

  @media (max-width: 900px) {
    align-items: flex-start;
  }
`;

const ControlPillGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(2, 6, 23, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 8px;
  padding: 0.2rem 0.25rem 0.2rem 0.6rem;
`;

const ControlLabel = styled.span`
  font-size: 0.75rem;
  color: #64748b;
  margin-right: 0.25rem;
`;

const SmallPill = styled.button`
  border: none;
  background: ${p => p.$active ? 'rgba(59, 130, 246, 0.22)' : 'transparent'};
  color: ${p => p.$active ? '#60a5fa' : '#94a3b8'};
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.28rem 0.65rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: #f8fafc;
  }
`;

const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`;

const FilterChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: ${p => p.$active ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.55)'};
  color: ${p => p.$active ? '#f8fafc' : '#94a3b8'};
  border: 1px solid ${p => p.$active ? p.$accent : 'rgba(148, 163, 184, 0.14)'};
  border-radius: 999px;
  padding: 0.28rem 0.7rem;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;

  span {
    font-family: monospace;
    font-size: 0.72rem;
    opacity: 0.75;
  }

  &:hover {
    border-color: ${p => p.$accent};
    color: #f8fafc;
  }
`;

const DotIndicator = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${p => p.$color};
  box-shadow: 0 0 8px ${p => p.$color};
  display: inline-block;
  flex-shrink: 0;
`;

const CanvasFrame = styled.div`
  position: relative;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: #050911;
  border: 1px solid rgba(148, 163, 184, 0.12);
`;

const StyledSvg = styled.svg`
  display: block;
  width: 100%;
  height: auto;
  user-select: none;
`;

const EmptyChart = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  min-height: 220px;
  border-radius: 12px;
  background: rgba(7, 11, 20, 0.8);
  border: 1px dashed rgba(148, 163, 184, 0.18);
  color: #94a3b8;
  font-size: 0.9rem;
  padding: 1.5rem;
`;

const TooltipCard = styled.div`
  position: absolute;
  top: ${p => p.$alignBottom ? 'auto' : '16px'};
  bottom: ${p => p.$alignBottom ? '56px' : 'auto'};
  left: ${p => p.$alignRight ? '18px' : 'auto'};
  right: ${p => p.$alignRight ? 'auto' : '18px'};
  width: 278px;
  background: rgba(10, 15, 28, 0.92);
  backdrop-filter: blur(12px);
  border: 1px solid ${p => p.$borderColor || 'rgba(148, 163, 184, 0.22)'};
  border-radius: 12px;
  padding: 0.85rem 1rem;
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.55);
  pointer-events: none;
  z-index: 5;

  @media (max-width: 640px) {
    position: static;
    width: auto;
    margin: 0.75rem;
  }
`;

const TooltipTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.65rem;
`;

const TooltipTicker = styled.div`
  font-family: monospace;
  font-size: 1rem;
  font-weight: 800;
  color: #ffffff;
`;

const TooltipName = styled.div`
  font-size: 0.78rem;
  color: #94a3b8;
`;

const QuadrantPill = styled.span`
  font-family: monospace;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: ${p => p.$color};
  background: ${p => p.$bg};
  border: 1px solid ${p => p.$border};
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  white-space: nowrap;
`;

const TooltipGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.55rem 0.75rem;
  padding-top: 0.55rem;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
`;

const MetricCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;

  span {
    font-size: 0.68rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  strong {
    font-family: monospace;
    font-size: 0.82rem;
    font-weight: 700;
  }
`;

const TooltipFoot = styled.div`
  margin-top: 0.6rem;
  padding-top: 0.45rem;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  font-family: monospace;
  font-size: 0.7rem;
  color: #64748b;
`;

const QuadrantSummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.9rem;
  margin-top: 1.15rem;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const QuadrantBox = styled.div`
  background: linear-gradient(160deg, ${p => p.$bg} 0%, rgba(10, 15, 28, 0.65) 100%);
  border: 1px solid ${p => p.$border};
  border-radius: 12px;
  padding: 0.85rem 0.95rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

const QuadrantBoxHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const QuadrantBoxTitle = styled.span`
  font-family: monospace;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: ${p => p.$color};
`;

const QuadrantCount = styled.span`
  font-family: monospace;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${p => p.$color};
  background: rgba(2, 6, 23, 0.45);
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
`;

const QuadrantDesc = styled.span`
  font-size: 0.74rem;
  color: #94a3b8;
`;

const ChipList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.2rem;
`;

const SectorChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: ${p => p.$active ? 'rgba(30, 41, 59, 0.95)' : 'rgba(2, 6, 23, 0.45)'};
  border: 1px solid ${p => p.$active ? p.$color : 'rgba(148, 163, 184, 0.16)'};
  border-radius: 7px;
  padding: 0.26rem 0.52rem;
  cursor: pointer;
  transition: all 0.15s ease;

  strong {
    font-family: monospace;
    font-size: 0.75rem;
    color: #f8fafc;
  }

  span {
    font-size: 0.72rem;
    color: #94a3b8;
    max-width: 115px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover {
    border-color: ${p => p.$color};
    transform: translateY(-1px);
  }
`;

const EmptyTag = styled.span`
  font-size: 0.75rem;
  color: #475569;
  font-style: italic;
`;

export default SectorRotationChart;
