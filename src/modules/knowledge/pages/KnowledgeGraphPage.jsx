// src/modules/knowledge/pages/KnowledgeGraphPage.jsx - Visualizador Interactivo del Grafo de Conocimiento (Obsidian Style)
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as d3Force from 'd3-force';
import {
  Network,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  Filter,
  Layers,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Info,
  Sliders,
  X,
  Compass,
  FileText,
  Eye,
  EyeOff,
  Maximize2,
  Pin,
  PinOff
} from 'lucide-react';
import { useKnowledge } from '../context/KnowledgeContext';
import knowledgeApiService from '../services/knowledgeApiService';

const KnowledgeGraphPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { areas } = useKnowledge();

  // Modos de Grafo: 'global' | 'category' | 'local'
  const initialMode = searchParams.get('mode') || (searchParams.get('note_id') ? 'local' : 'global');
  const [graphMode, setGraphMode] = useState(initialMode);
  const [selectedAreaId, setSelectedAreaId] = useState(searchParams.get('area_id') || '');
  const [selectedNoteId, setSelectedNoteId] = useState(searchParams.get('note_id') || '');
  const [localDepth, setLocalDepth] = useState(parseInt(searchParams.get('depth') || '1', 10));

  // Filtros visuales
  const [graphSearch, setGraphSearch] = useState('');
  const [showAiEdges, setShowAiEdges] = useState(true);
  const [hideOrphans, setHideOrphans] = useState(false);
  const [labelMode, setLabelMode] = useState('hover_and_hubs'); // 'always' | 'hover_and_hubs' | 'selection'

  // Ajustes de física (estilo Obsidian)
  const [showSettings, setShowSettings] = useState(false);
  const [physicsParams, setPhysicsParams] = useState({
    chargeStrength: -280,
    linkDistance: 90,
    collisionRadius: 18,
    centerStrength: 0.05
  });

  // Datos del Grafo
  const [rawGraphData, setRawGraphData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);

  // Estados interactivos
  const [inspectedNode, setInspectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  // Referencias Canvas, Animación y D3
  const canvasRef = useRef(null);
  const simulationRef = useRef(null);
  const transformRef = useRef({ x: 0, y: 0, k: 1 });
  const nodePositionsRef = useRef(new Map()); // id -> { x, y, vx, vy, fx, fy }
  const animationFrameRef = useRef(null);
  const isDraggingRef = useRef(false);
  const draggedNodeRef = useRef(null);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);

  // Cargar datos según filtros
  const fetchGraphData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (graphMode === 'category' && selectedAreaId) {
        params.area_id = selectedAreaId;
      } else if (graphMode === 'local' && selectedNoteId) {
        params.note_id = selectedNoteId;
        params.depth = localDepth;
      }
      const data = await knowledgeApiService.getGraph(params);
      setRawGraphData(data);
    } catch (err) {
      console.error('Error cargando grafo:', err);
    } finally {
      setLoading(false);
    }
  }, [graphMode, selectedAreaId, selectedNoteId, localDepth]);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  // Filtrar nodos huérfanos o bordes IA si el usuario lo solicita
  const filteredData = useMemo(() => {
    let edges = rawGraphData.edges || [];
    if (!showAiEdges) {
      edges = edges.filter(e => e.origin !== 'ai_suggested');
    }

    let nodes = rawGraphData.nodes || [];
    if (hideOrphans) {
      const connectedNodeIds = new Set();
      edges.forEach(e => {
        connectedNodeIds.add(e.source?.id || e.source);
        connectedNodeIds.add(e.target?.id || e.target);
      });
      nodes = nodes.filter(n => connectedNodeIds.has(n.id));
    }

    return { nodes, edges };
  }, [rawGraphData, showAiEdges, hideOrphans]);

  // Calcular vecindario activo (conexiones directas al nodo seleccionado o en hover)
  const activeNeighborhood = useMemo(() => {
    const active = hoveredNode || inspectedNode;
    if (!active) return null;

    const neighborIds = new Set([active.id]);
    const edgeIds = new Set();

    (filteredData.edges || []).forEach(edge => {
      const sId = edge.source?.id || edge.source;
      const tId = edge.target?.id || edge.target;
      if (sId === active.id) {
        neighborIds.add(tId);
        edgeIds.add(edge.id || `${sId}-${tId}`);
      } else if (tId === active.id) {
        neighborIds.add(sId);
        edgeIds.add(edge.id || `${sId}-${tId}`);
      }
    });

    return {
      activeId: active.id,
      neighborIds,
      edgeIds,
      totalConnected: neighborIds.size - 1
    };
  }, [hoveredNode, inspectedNode, filteredData.edges]);

  // Función principal de renderizado Canvas (independiente de físicas)
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.save();
    ctx.clearRect(0, 0, width, height);

    const t = transformRef.current;
    ctx.translate(t.x, t.y);
    ctx.scale(t.k, t.k);

    const sim = simulationRef.current;
    const nodes = sim ? sim.nodes() : [];
    const linkForce = sim ? sim.force('link') : null;
    const links = linkForce ? linkForce.links() : [];

    const neighborhood = activeNeighborhood;
    const searchQuery = graphSearch.trim().toLowerCase();

    // ─── 1. DIBUJAR ENLACES ───────────────────────────────────────────
    links.forEach(link => {
      const s = link.source;
      const tNode = link.target;
      if (!s.x || !tNode.x) return;

      const isAi = link.origin === 'ai_suggested';
      const edgeKey = link.id || `${s.id}-${tNode.id}`;
      const isHighlighted = neighborhood && neighborhood.edgeIds.has(edgeKey);
      const isDimmed = neighborhood && !isHighlighted;

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tNode.x, tNode.y);

      if (isDimmed) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([]);
      } else if (isHighlighted) {
        ctx.strokeStyle = isAi ? '#f472b6' : '#a78bfa';
        ctx.lineWidth = 2.4;
        ctx.setLineDash(isAi ? [5, 4] : []);
      } else if (isAi) {
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
      } else {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
        ctx.lineWidth = 1.3;
        ctx.setLineDash([]);
      }

      ctx.stroke();
      ctx.setLineDash([]);
    });

    // ─── 2. DIBUJAR NODOS ─────────────────────────────────────────────
    nodes.forEach(node => {
      if (!node.x || !node.y) return;

      const isMatchesSearch = searchQuery && node.label.toLowerCase().includes(searchQuery);
      const isInspected = inspectedNode?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;
      const isNeighbor = neighborhood?.neighborIds.has(node.id);
      const isDimmed = neighborhood && !isNeighbor && !isMatchesSearch;

      const baseRadius = node.size || 14;
      const radius = (isHovered || isInspected) ? baseRadius * 1.3 : baseRadius;

      ctx.save();
      if (isDimmed) {
        ctx.globalAlpha = 0.14;
      }

      // Halo resplandeciente para nodo seleccionado, hovered o coincidencia de búsqueda
      if (isHovered || isInspected || isMatchesSearch) {
        const glowRadius = radius + (isHovered || isInspected ? 9 : 6);
        const grad = ctx.createRadialGradient(node.x, node.y, radius, node.x, node.y, glowRadius);
        const glowColor = node.color || '#8b5cf6';
        grad.addColorStop(0, `${glowColor}99`);
        grad.addColorStop(1, `${glowColor}00`);

        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRadius, 0, 2 * Math.PI);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Círculo principal del nodo
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = node.color || '#8b5cf6';
      ctx.fill();

      // Borde del nodo
      ctx.lineWidth = (isHovered || isInspected) ? 2.5 : 1.5;
      ctx.strokeStyle = (isHovered || isInspected) ? '#ffffff' : 'rgba(255, 255, 255, 0.3)';
      ctx.stroke();

      // Indicador de nodo anclado (Pin)
      if (node.fx != null && node.fy != null) {
        ctx.beginPath();
        ctx.arc(node.x + radius * 0.7, node.y - radius * 0.7, 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // ─── 3. ETIQUETAS DE TEXTO ──────────────────────────────────────
      let shouldShowLabel = false;
      if (labelMode === 'always') {
        shouldShowLabel = true;
      } else if (labelMode === 'selection') {
        shouldShowLabel = isInspected || isHovered || isMatchesSearch;
      } else {
        // 'hover_and_hubs'
        const isHub = (node.connection_count || 0) >= 3;
        const isZoomedIn = t.k >= 0.85;
        shouldShowLabel = isHovered || isInspected || isNeighbor || isMatchesSearch || (isHub && isZoomedIn);
      }

      if (shouldShowLabel && !isDimmed) {
        ctx.font = `${(isInspected || isHovered) ? '600 12px' : '500 11px'} 'Inter', -apple-system, sans-serif`;
        ctx.textAlign = 'center';

        // Sombra de contraste para legibilidad sobre el fondo
        ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
        const textY = node.y + radius + 14;
        ctx.fillText(node.label, node.x + 1, textY + 1);

        ctx.fillStyle = (isHovered || isInspected) ? '#ffffff' : '#e2e8f0';
        ctx.fillText(node.label, node.x, textY);
      }

      ctx.restore();
    });

    ctx.restore();
  }, [activeNeighborhood, graphSearch, inspectedNode, hoveredNode, labelMode]);

  // Animación suave de cámara a coordenadas mundo (targetX, targetY)
  const smoothPanTo = useCallback((targetWorldX, targetWorldY, targetK = null, duration = 400) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const startX = transformRef.current.x;
    const startY = transformRef.current.y;
    const startK = transformRef.current.k;
    const endK = targetK !== null ? targetK : startK;

    const screenCenterX = canvas.width / 2;
    const screenCenterY = canvas.height / 2;
    const endX = screenCenterX - targetWorldX * endK;
    const endY = screenCenterY - targetWorldY * endK;

    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);

      transformRef.current.x = startX + (endX - startX) * ease;
      transformRef.current.y = startY + (endY - startY) * ease;
      transformRef.current.k = startK + (endK - startK) * ease;

      renderCanvas();

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);
  }, [renderCanvas]);

  // Inicializar o actualizar la simulación física D3 (SOLO cuando cambian los datos de nodos/aristas o parámetros de física)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || filteredData.nodes.length === 0) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // Centrar vista en la primera carga si transform está en (0, 0)
    if (transformRef.current.x === 0 && transformRef.current.y === 0) {
      transformRef.current = {
        x: (width / 2) * dpr,
        y: (height / 2) * dpr,
        k: 1
      };
    }

    // ─── PERSISTENCIA DE COORDENADAS PARA EVITAR EXPLOSIONES AL CAMBIAR FILTROS ───
    const prevPositions = nodePositionsRef.current;
    const isFirstRun = prevPositions.size === 0;

    const nodes = filteredData.nodes.map(d => {
      const existing = prevPositions.get(d.id);
      if (existing) {
        return {
          ...d,
          x: existing.x,
          y: existing.y,
          vx: existing.vx * 0.15,
          vy: existing.vy * 0.15,
          fx: existing.fx,
          fy: existing.fy
        };
      }
      // Nodos nuevos: posicionar suavemente cerca del centro con pequeña dispersión
      return {
        ...d,
        x: (Math.random() - 0.5) * 80,
        y: (Math.random() - 0.5) * 80
      };
    });

    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    const links = filteredData.edges
      .filter(e => nodeMap.has(e.source?.id || e.source) && nodeMap.has(e.target?.id || e.target))
      .map(e => ({
        ...e,
        source: nodeMap.get(e.source?.id || e.source),
        target: nodeMap.get(e.target?.id || e.target)
      }));

    // Configurar fuerzas de simulación física con alta estabilidad (Obsidian-style)
    const simulation = d3Force.forceSimulation(nodes)
      .force('link', d3Force.forceLink(links).id(d => d.id).distance(physicsParams.linkDistance))
      .force('charge', d3Force.forceManyBody().strength(physicsParams.chargeStrength))
      .force('center', d3Force.forceCenter(0, 0).strength(physicsParams.centerStrength))
      .force('collision', d3Force.forceCollide().radius(d => (d.size || 14) + physicsParams.collisionRadius))
      .velocityDecay(0.55) // Damping amortiguado para estabilización rápida
      .alphaDecay(0.04);   // Se asienta en menos de 1 segundo

    // En cambios posteriores, usar arranque cálido (alpha bajo) para evitar sacudidas
    const startAlpha = isFirstRun ? 0.75 : 0.22;
    simulation.alpha(startAlpha);

    simulation.on('tick', () => {
      // Guardar posiciones para persistencia continua
      nodes.forEach(n => {
        nodePositionsRef.current.set(n.id, {
          x: n.x,
          y: n.y,
          vx: n.vx,
          vy: n.vy,
          fx: n.fx,
          fy: n.fy
        });
      });
      renderCanvas();
    });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
    };
  }, [filteredData, physicsParams, renderCanvas]);

  // Re-renderizar canvas cuando cambian estados visuales (búsqueda, hover, inspección, etiquetas)
  // ¡Sin reiniciar la simulación física!
  useEffect(() => {
    renderCanvas();
  }, [graphSearch, inspectedNode, hoveredNode, labelMode, showAiEdges, renderCanvas]);

  // Manejador de Zoom hacia la posición del cursor (Natural Wheel Zoom)
  const handleWheel = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const mouseX = (e.clientX - rect.left) * dpr;
    const mouseY = (e.clientY - rect.top) * dpr;

    const t = transformRef.current;
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newK = Math.max(0.15, Math.min(4, t.k * zoomFactor));

    // Mantener la posición del mouse anclada en coordenadas mundo
    t.x = mouseX - (mouseX - t.x) * (newK / t.k);
    t.y = mouseY - (mouseY - t.y) * (newK / t.k);
    t.k = newK;

    renderCanvas();
  };

  // Convertir coordenadas del puntero de pantalla a coordenadas mundo del Canvas
  const screenToWorld = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const canvasX = (clientX - rect.left) * dpr;
    const canvasY = (clientY - rect.top) * dpr;
    const t = transformRef.current;
    return {
      x: (canvasX - t.x) / t.k,
      y: (canvasY - t.y) / t.k,
      screenX: clientX,
      screenY: clientY,
      canvasX,
      canvasY
    };
  }, []);

  const handleMouseDown = (e) => {
    const { x, y, canvasX, canvasY } = screenToWorld(e.clientX, e.clientY);

    hasDraggedRef.current = false;
    isDraggingRef.current = true;
    dragStartPosRef.current = { x: canvasX, y: canvasY };

    if (simulationRef.current) {
      const node = simulationRef.current.find(x, y, 25);
      if (node) {
        draggedNodeRef.current = node;
        node.fx = node.x;
        node.fy = node.y;
        simulationRef.current.alphaTarget(0.2).restart();
      }
    }
  };

  const handleMouseMove = (e) => {
    const { x, y, screenX, screenY, canvasX, canvasY } = screenToWorld(e.clientX, e.clientY);

    if (isDraggingRef.current) {
      hasDraggedRef.current = true;
      const dx = canvasX - dragStartPosRef.current.x;
      const dy = canvasY - dragStartPosRef.current.y;

      if (draggedNodeRef.current) {
        // Arrastrar el nodo
        draggedNodeRef.current.fx = x;
        draggedNodeRef.current.fy = y;
        simulationRef.current?.alphaTarget(0.2).restart();
      } else {
        // Panear el canvas
        transformRef.current.x += dx;
        transformRef.current.y += dy;
        renderCanvas();
      }

      dragStartPosRef.current = { x: canvasX, y: canvasY };
    } else {
      // Detección de Hover sobre nodos cuando el mouse se mueve libremente
      if (simulationRef.current) {
        const found = simulationRef.current.find(x, y, 22);
        if (found !== hoveredNode) {
          setHoveredNode(found || null);
          if (found) {
            setHoverPos({ x: screenX, y: screenY });
          }
        } else if (found) {
          setHoverPos({ x: screenX, y: screenY });
        }
      }
    }
  };

  const handleMouseUp = () => {
    if (draggedNodeRef.current) {
      // Si no mantuvo presionado Shift, liberar el anclaje físico suavemente
      draggedNodeRef.current.fx = null;
      draggedNodeRef.current.fy = null;
      draggedNodeRef.current = null;
      simulationRef.current?.alphaTarget(0);
    }
    isDraggingRef.current = false;
  };

  const handleClick = (e) => {
    // Si fue un arrastre de paneo, ignorar como click de selección
    if (hasDraggedRef.current) return;

    const { x, y } = screenToWorld(e.clientX, e.clientY);
    if (simulationRef.current) {
      const node = simulationRef.current.find(x, y, 25);
      if (node) {
        setInspectedNode(node);
        // Suave centrado en el nodo seleccionado
        smoothPanTo(node.x, node.y);
      } else {
        setInspectedNode(null);
      }
    }
  };

  const handleDoubleClick = (e) => {
    const { x, y } = screenToWorld(e.clientX, e.clientY);
    if (simulationRef.current) {
      const node = simulationRef.current.find(x, y, 25);
      if (node) {
        // Doble click: abrir directamente en el editor (estilo Obsidian)
        navigate(`/personal/knowledge/notes?noteId=${node.id}`);
      }
    }
  };

  // Botones de Zoom
  const zoomIn = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const t = transformRef.current;
    const newK = Math.min(4, t.k * 1.3);
    t.x = cx - (cx - t.x) * (newK / t.k);
    t.y = cy - (cy - t.y) * (newK / t.k);
    t.k = newK;
    renderCanvas();
  };

  const zoomOut = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const t = transformRef.current;
    const newK = Math.max(0.15, t.k * 0.75);
    t.x = cx - (cx - t.x) * (newK / t.k);
    t.y = cy - (cy - t.y) * (newK / t.k);
    t.k = newK;
    renderCanvas();
  };

  const resetView = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dpr = window.devicePixelRatio || 1;
      smoothPanTo(0, 0, 1, 500);
      simulationRef.current?.alpha(0.2).restart();
    }
  };

  // Centrar en el primer resultado de búsqueda
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && graphSearch.trim()) {
      const q = graphSearch.trim().toLowerCase();
      const match = (filteredData.nodes || []).find(n => n.label.toLowerCase().includes(q));
      if (match) {
        setInspectedNode(match);
        smoothPanTo(match.x, match.y, 1.4, 500);
      }
    }
  };

  return (
    <GraphPageContainer>
      {/* ─── BARRA SUPERIOR DE CONTROLES ──────────────────────────────────── */}
      <ControlBar>
        {/* Selector de Modo */}
        <ModeTabs>
          <ModeTabButton
            $active={graphMode === 'global'}
            onClick={() => {
              setGraphMode('global');
              setSearchParams({ mode: 'global' });
            }}
          >
            <Network size={15} /> Grafo Global
          </ModeTabButton>
          <ModeTabButton
            $active={graphMode === 'category'}
            onClick={() => {
              setGraphMode('category');
              setSearchParams({ mode: 'category' });
            }}
          >
            <Layers size={15} /> Por Área
          </ModeTabButton>
          <ModeTabButton
            $active={graphMode === 'local'}
            onClick={() => {
              setGraphMode('local');
              setSearchParams({ mode: 'local' });
            }}
          >
            <Compass size={15} /> Grafo Local
          </ModeTabButton>
        </ModeTabs>

        {/* Filtros específicos según modo */}
        <FiltersSection>
          {graphMode === 'category' && (
            <SelectBox
              value={selectedAreaId}
              onChange={(e) => {
                setSelectedAreaId(e.target.value);
                setSearchParams({ mode: 'category', area_id: e.target.value });
              }}
            >
              <option value="">Todas las Áreas</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </SelectBox>
          )}

          {graphMode === 'local' && (
            <DepthControl>
              <DepthLabel>Profundidad:</DepthLabel>
              <DepthBtn $active={localDepth === 1} onClick={() => setLocalDepth(1)}>1</DepthBtn>
              <DepthBtn $active={localDepth === 2} onClick={() => setLocalDepth(2)}>2</DepthBtn>
              <DepthBtn $active={localDepth === 3} onClick={() => setLocalDepth(3)}>3</DepthBtn>
            </DepthControl>
          )}

          {/* Buscador dentro del grafo */}
          <SearchWrapper>
            <Search size={14} color="#94a3b8" />
            <SearchInput
              type="text"
              placeholder="Buscar nota (Enter para ir)..."
              value={graphSearch}
              onChange={(e) => setGraphSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            {graphSearch && (
              <ClearSearchBtn onClick={() => setGraphSearch('')}>×</ClearSearchBtn>
            )}
          </SearchWrapper>

          {/* Toggle de Conexiones IA */}
          <AiToggleBtn
            $active={showAiEdges}
            onClick={() => setShowAiEdges(!showAiEdges)}
            title="Mostrar u ocultar sugerencias de IA en el grafo"
          >
            <Sparkles size={14} /> Sugerencias IA
          </AiToggleBtn>

          {/* Botón de Ajustes Físicos (Obsidian HUD) */}
          <SettingsToggleBtn
            $active={showSettings}
            onClick={() => setShowSettings(!showSettings)}
            title="Configurar físicas y visualización del grafo"
          >
            <Sliders size={14} /> Ajustes
          </SettingsToggleBtn>
        </FiltersSection>
      </ControlBar>

      {/* ─── CANVAS DEL GRAFO ─────────────────────────────────────────────── */}
      <CanvasWrapper>
        {loading && (
          <GraphLoadingOverlay>
            <Sparkles size={28} color="#8b5cf6" />
            <p>Sincronizando constelación de conocimiento...</p>
          </GraphLoadingOverlay>
        )}

        <GraphCanvas
          ref={canvasRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        />

        {/* Tooltip Cursor Flotante al pasar el mouse por un nodo */}
        {hoveredNode && !isDraggingRef.current && (
          <CursorTooltip
            style={{
              left: `${hoverPos.x + 14}px`,
              top: `${hoverPos.y + 14}px`
            }}
          >
            <TooltipHeader>
              <TooltipDot $color={hoveredNode.color} />
              <TooltipTitle>{hoveredNode.label}</TooltipTitle>
            </TooltipHeader>
            <TooltipMeta>
              <span>{hoveredNode.area || 'General'}</span>
              <span>•</span>
              <span>{hoveredNode.connection_count || 0} conexiones</span>
            </TooltipMeta>
            <TooltipHint>Doble clic para abrir nota</TooltipHint>
          </CursorTooltip>
        )}

        {/* Panel HUD de Ajustes Físicos y de Visualización */}
        {showSettings && (
          <SettingsHud>
            <SettingsHudHeader>
              <SettingsHudTitle><Sliders size={15} /> Ajustes del Grafo</SettingsHudTitle>
              <CloseHudBtn onClick={() => setShowSettings(false)}><X size={15} /></CloseHudBtn>
            </SettingsHudHeader>

            <SettingsSection>
              <SettingsSectionTitle>Filtros</SettingsSectionTitle>
              <SettingCheckboxRow>
                <input
                  type="checkbox"
                  id="chk-orphans"
                  checked={hideOrphans}
                  onChange={(e) => setHideOrphans(e.target.checked)}
                />
                <label htmlFor="chk-orphans">Ocultar notas sin enlaces</label>
              </SettingCheckboxRow>
              <SettingCheckboxRow>
                <input
                  type="checkbox"
                  id="chk-ai"
                  checked={showAiEdges}
                  onChange={(e) => setShowAiEdges(e.target.checked)}
                />
                <label htmlFor="chk-ai">Mostrar enlaces sugeridos por IA</label>
              </SettingCheckboxRow>
            </SettingsSection>

            <SettingsSection>
              <SettingsSectionTitle>Etiquetas de Texto</SettingsSectionTitle>
              <LabelSelect
                value={labelMode}
                onChange={(e) => setLabelMode(e.target.value)}
              >
                <option value="hover_and_hubs">Automático (Hover y Nodos Principales)</option>
                <option value="always">Mostrar siempre todas</option>
                <option value="selection">Solo al seleccionar</option>
              </LabelSelect>
            </SettingsSection>

            <SettingsSection>
              <SettingsSectionTitle>Física & Fuerzas</SettingsSectionTitle>
              <SettingSliderRow>
                <SettingSliderLabel>
                  <span>Repulsión</span>
                  <span>{Math.abs(physicsParams.chargeStrength)}</span>
                </SettingSliderLabel>
                <SliderInput
                  type="range"
                  min="100"
                  max="600"
                  step="20"
                  value={Math.abs(physicsParams.chargeStrength)}
                  onChange={(e) => {
                    const val = -parseInt(e.target.value, 10);
                    setPhysicsParams(prev => ({ ...prev, chargeStrength: val }));
                    simulationRef.current?.force('charge')?.strength(val);
                    simulationRef.current?.alpha(0.18).restart();
                  }}
                />
              </SettingSliderRow>

              <SettingSliderRow>
                <SettingSliderLabel>
                  <span>Distancia de enlaces</span>
                  <span>{physicsParams.linkDistance}px</span>
                </SettingSliderLabel>
                <SliderInput
                  type="range"
                  min="40"
                  max="180"
                  step="10"
                  value={physicsParams.linkDistance}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setPhysicsParams(prev => ({ ...prev, linkDistance: val }));
                    simulationRef.current?.force('link')?.distance(val);
                    simulationRef.current?.alpha(0.18).restart();
                  }}
                />
              </SettingSliderRow>
            </SettingsSection>
          </SettingsHud>
        )}

        {/* Controles de Navegación Flotantes */}
        <FloatingControls>
          <FloatBtn onClick={zoomIn} title="Acercar (o usa la rueda del mouse)">
            <ZoomIn size={18} />
          </FloatBtn>
          <FloatBtn onClick={zoomOut} title="Alejar (o usa la rueda del mouse)">
            <ZoomOut size={18} />
          </FloatBtn>
          <FloatBtn onClick={resetView} title="Centrar todo el grafo">
            <RotateCcw size={18} />
          </FloatBtn>
        </FloatingControls>

        {/* Leyenda Visual */}
        <LegendCard>
          <LegendTitle>Leyenda</LegendTitle>
          <LegendItem>
            <SolidLine /> Relación Manual
          </LegendItem>
          <LegendItem>
            <DottedLine /> Sugerencia IA
          </LegendItem>
          <LegendDivider />
          <LegendCount>
            {filteredData.nodes.length} notas • {filteredData.edges.length} enlaces
          </LegendCount>
        </LegendCard>

        {/* Drawer de Detalle del Nodo Seleccionado */}
        {inspectedNode && (
          <NodeDrawer>
            <DrawerHeader>
              <DrawerTitleRow>
                <NodeColorDot $color={inspectedNode.color} />
                <DrawerTitle>{inspectedNode.label}</DrawerTitle>
              </DrawerTitleRow>
              <CloseDrawerBtn onClick={() => setInspectedNode(null)}>
                <X size={16} />
              </CloseDrawerBtn>
            </DrawerHeader>

            <DrawerBody>
              <DrawerMetaItem>
                <DrawerMetaLabel>Área:</DrawerMetaLabel>
                <DrawerMetaValue>{inspectedNode.area || 'General'}</DrawerMetaValue>
              </DrawerMetaItem>
              <DrawerMetaItem>
                <DrawerMetaLabel>Categoría:</DrawerMetaLabel>
                <DrawerMetaValue>{inspectedNode.category || 'Sin categoría'}</DrawerMetaValue>
              </DrawerMetaItem>
              <DrawerMetaItem>
                <DrawerMetaLabel>Conexiones:</DrawerMetaLabel>
                <DrawerMetaValue>{inspectedNode.connection_count || 0}</DrawerMetaValue>
              </DrawerMetaItem>
            </DrawerBody>

            <DrawerFooter>
              <OpenNoteBtn onClick={() => navigate(`/personal/knowledge/notes?noteId=${inspectedNode.id}`)}>
                <FileText size={15} /> Abrir Nota en Editor
              </OpenNoteBtn>
              <FocusLocalBtn
                onClick={() => {
                  setGraphMode('local');
                  setSelectedNoteId(inspectedNode.id);
                  setSearchParams({ mode: 'local', note_id: inspectedNode.id });
                }}
              >
                <Compass size={15} /> Ver Grafo Local
              </FocusLocalBtn>
              <CenterNodeBtn onClick={() => smoothPanTo(inspectedNode.x, inspectedNode.y, 1.4, 400)}>
                <Maximize2 size={15} /> Centrar en Vista
              </CenterNodeBtn>
            </DrawerFooter>
          </NodeDrawer>
        )}
      </CanvasWrapper>
    </GraphPageContainer>
  );
};

// ─── Estilos ─────────────────────────────────────────────────────────────────

const GraphPageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 160px);
  width: 100%;
  background: #0a0f1e;
  overflow: hidden;
  position: relative;
`;

const ControlBar = styled.div`
  padding: 0.75rem 1.5rem;
  background: #0f172a;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const ModeTabs = styled.div`
  display: flex;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 3px;
  gap: 3px;
`;

const ModeTabButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  border: none;
  background: ${props => props.$active ? '#8b5cf6' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#94a3b8'};
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    color: white;
  }
`;

const FiltersSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const SelectBox = styled.select`
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  font-size: 0.8rem;
  outline: none;
`;

const DepthControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 2px 6px;
  border-radius: 6px;
`;

const DepthLabel = styled.span`
  font-size: 0.74rem;
  color: #94a3b8;
  margin-right: 0.2rem;
`;

const DepthBtn = styled.button`
  background: ${props => props.$active ? '#8b5cf6' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#94a3b8'};
  border: none;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
`;

const SearchWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 0.3rem 0.65rem;
  position: relative;
`;

const SearchInput = styled.input`
  background: transparent;
  border: none;
  color: #f8fafc;
  font-size: 0.8rem;
  outline: none;
  width: 170px;
  &::placeholder {
    color: #64748b;
  }
`;

const ClearSearchBtn = styled.button`
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.85rem;
`;

const AiToggleBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 500;
  border: 1px solid ${props => props.$active ? '#ec4899' : 'rgba(255, 255, 255, 0.1)'};
  background: ${props => props.$active ? 'rgba(236, 72, 153, 0.15)' : 'transparent'};
  color: ${props => props.$active ? '#f472b6' : '#94a3b8'};
  cursor: pointer;
  transition: all 0.2s;
`;

const SettingsToggleBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 500;
  border: 1px solid ${props => props.$active ? '#8b5cf6' : 'rgba(255, 255, 255, 0.1)'};
  background: ${props => props.$active ? 'rgba(139, 92, 246, 0.2)' : 'transparent'};
  color: ${props => props.$active ? '#c4b5fd' : '#94a3b8'};
  cursor: pointer;
  transition: all 0.2s;
`;

const CanvasWrapper = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
  background: radial-gradient(circle at center, #11182e 0%, #080c18 100%);
`;

const GraphLoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(10, 15, 30, 0.75);
  gap: 0.75rem;
  color: #94a3b8;
  z-index: 20;
`;

const GraphCanvas = styled.canvas`
  width: 100%;
  height: 100%;
  display: block;
  cursor: grab;
  &:active {
    cursor: grabbing;
  }
`;

const CursorTooltip = styled.div`
  position: fixed;
  background: rgba(15, 23, 42, 0.94);
  border: 1px solid rgba(139, 92, 246, 0.4);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  pointer-events: none;
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  animation: fadeIn 0.15s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const TooltipHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const TooltipDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$color || '#8b5cf6'};
`;

const TooltipTitle = styled.span`
  font-size: 0.82rem;
  font-weight: 600;
  color: #f8fafc;
`;

const TooltipMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  color: #94a3b8;
`;

const TooltipHint = styled.span`
  font-size: 0.68rem;
  color: #64748b;
  font-style: italic;
  margin-top: 2px;
`;

const SettingsHud = styled.div`
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  width: 280px;
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
  z-index: 35;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  animation: hudSlide 0.2s ease-out;

  @keyframes hudSlide {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const SettingsHudHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 0.5rem;
`;

const SettingsHudTitle = styled.h4`
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #f8fafc;
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const CloseHudBtn = styled.button`
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
  &:hover {
    color: white;
  }
`;

const SettingsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const SettingsSectionTitle = styled.span`
  font-size: 0.72rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const SettingCheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.78rem;
  color: #cbd5e1;

  input[type='checkbox'] {
    accent-color: #8b5cf6;
    cursor: pointer;
  }
  label {
    cursor: pointer;
  }
`;

const LabelSelect = styled.select`
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
  font-size: 0.78rem;
  outline: none;
`;

const SettingSliderRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const SettingSliderLabel = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.74rem;
  color: #cbd5e1;
`;

const SliderInput = styled.input`
  width: 100%;
  accent-color: #8b5cf6;
  cursor: pointer;
`;

const FloatingControls = styled.div`
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 30;
`;

const FloatBtn = styled.button`
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.2s;
  &:hover {
    background: #8b5cf6;
    color: white;
  }
`;

const LegendCard = styled.div`
  position: absolute;
  bottom: 2rem;
  left: 2rem;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: #cbd5e1;
  z-index: 30;
`;

const LegendTitle = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SolidLine = styled.div`
  width: 20px;
  height: 2px;
  background: #94a3b8;
`;

const DottedLine = styled.div`
  width: 20px;
  height: 2px;
  border-top: 2px dashed #ec4899;
`;

const LegendDivider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 0.2rem 0;
`;

const LegendCount = styled.span`
  font-size: 0.7rem;
  color: #64748b;
`;

const NodeDrawer = styled.div`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  width: 300px;
  background: #0f172a;
  border: 1px solid rgba(139, 92, 246, 0.4);
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
  padding: 1.25rem;
  z-index: 40;
  animation: slideIn 0.2s ease-out;

  @keyframes slideIn {
    from { transform: translateX(20px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`;

const DrawerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.85rem;
`;

const DrawerTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const NodeColorDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${props => props.$color || '#8b5cf6'};
  flex-shrink: 0;
`;

const DrawerTitle = styled.h3`
  font-size: 0.95rem;
  font-weight: 600;
  color: #f8fafc;
  margin: 0;
  line-height: 1.3;
`;

const CloseDrawerBtn = styled.button`
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
  &:hover {
    color: white;
  }
`;

const DrawerBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin-bottom: 1rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const DrawerMetaItem = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
`;

const DrawerMetaLabel = styled.span`
  color: #94a3b8;
`;

const DrawerMetaValue = styled.span`
  color: #f8fafc;
  font-weight: 500;
`;

const DrawerFooter = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const OpenNoteBtn = styled.button`
  background: #8b5cf6;
  border: none;
  color: white;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  cursor: pointer;
  &:hover {
    background: #7c3aed;
  }
`;

const FocusLocalBtn = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #cbd5e1;
  padding: 0.45rem;
  border-radius: 6px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  cursor: pointer;
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const CenterNodeBtn = styled.button`
  background: transparent;
  border: 1px solid rgba(139, 92, 246, 0.25);
  color: #c4b5fd;
  padding: 0.45rem;
  border-radius: 6px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  cursor: pointer;
  &:hover {
    background: rgba(139, 92, 246, 0.1);
  }
`;

export default KnowledgeGraphPage;
