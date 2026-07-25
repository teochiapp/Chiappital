import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Terminal, Copy, Trash2, X, RefreshCw, Layers } from 'lucide-react';
import loggerService from '../../services/loggerService';
import { colors, withOpacity } from '../../styles/colors';

const DebugConsole = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState({
    twelveDataCalls: 0,
    twelveDataLimitReached: 0,
    cacheHits: 0,
    cacheMisses: 0,
    proxyStats: {}
  });
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [copied, setCopied] = useState(false);
  
  const terminalEndRef = useRef(null);

  useEffect(() => {
    // Escuchar atajo de teclado Ctrl + Shift + D
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Suscribirse a logs del loggerService
    const unsubscribe = loggerService.subscribe((updatedLogs, updatedMetrics) => {
      setLogs([...updatedLogs]);
      setMetrics(updatedMetrics);
    });

    // Carga inicial
    setLogs([...loggerService.logs]);
    setMetrics({ ...loggerService.metrics });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unsubscribe();
    };
  }, []);

  // El scroll se mantiene al final nativamente gracias a flex-direction: column-reverse

  if (!isOpen) return null;

  const handleCopyReport = () => {
    const report = loggerService.getDiagnosticReport();
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearCache = () => {
    if (window.confirm('¿Estás seguro de que quieres limpiar toda la caché de precios y EMAs de localStorage?')) {
      // Limpiar precios
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('price_') || key.startsWith('ema21_')) {
          localStorage.removeItem(key);
        }
      });
      loggerService.clearLogs();
      loggerService.success('Caché de localStorage y memoria completamente purgada.', 'CACHE');
    }
  };

  const filteredLogs = logs.filter(log => {
    const levelMatch = filterLevel === 'ALL' || log.level === filterLevel;
    const categoryMatch = filterCategory === 'ALL' || log.category === filterCategory;
    return levelMatch && categoryMatch;
  });

  // Calcular métricas
  const totalCache = metrics.cacheHits + metrics.cacheMisses;
  const cacheRatio = totalCache > 0 ? ((metrics.cacheHits / totalCache) * 100).toFixed(1) : '0.0';

  return (
    <ConsoleOverlay onClick={() => setIsOpen(false)}>
      <ConsoleContainer onClick={e => e.stopPropagation()}>
        {/* Header */}
        <ConsoleHeader>
          <HeaderTitle>
            <Terminal size={18} color={colors.primary} />
            Consola de Diagnóstico & Debug
            <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 'normal' }}>(Ctrl + Shift + D para cerrar)</span>
          </HeaderTitle>
          <CloseBtn onClick={() => setIsOpen(false)}>
            <X size={18} />
          </CloseBtn>
        </ConsoleHeader>

        {/* Content grid */}
        <ConsoleBody>
          {/* Panel Izquierdo: Métricas en tiempo real */}
          <Sidebar>
            <PanelTitle>Métricas Generales</PanelTitle>
            <MetricCard>
              <MetricLabel>TwelveData Calls</MetricLabel>
              <MetricValue>{metrics.twelveDataCalls} / 800</MetricValue>
              <ProgressBar $percent={(metrics.twelveDataCalls / 800) * 100} $color={colors.primary} />
            </MetricCard>

            <MetricCard>
              <MetricLabel>API Limits Reached (429)</MetricLabel>
              <MetricValue style={{ color: metrics.twelveDataLimitReached > 0 ? colors.danger : colors.textSecondary }}>
                {metrics.twelveDataLimitReached}
              </MetricValue>
            </MetricCard>

            <MetricCard>
              <MetricLabel>Cache Hit Ratio</MetricLabel>
              <MetricValue style={{ color: colors.success }}>{cacheRatio}%</MetricValue>
              <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '4px' }}>
                Hits: {metrics.cacheHits} / Misses: {metrics.cacheMisses}
              </div>
            </MetricCard>

            <PanelTitle style={{ marginTop: '1rem' }}>Proxies CORS (Yahoo)</PanelTitle>
            {Object.keys(metrics.proxyStats).length === 0 ? (
              <NoDataText>Sin llamadas a proxies aún</NoDataText>
            ) : (
              Object.keys(metrics.proxyStats).map(idx => {
                const stat = metrics.proxyStats[idx];
                const total = stat.success + stat.fail;
                const rate = total > 0 ? ((stat.success / total) * 100).toFixed(0) : '0';
                const avgSpeed = total > 0 ? (stat.totalTime / total).toFixed(0) : '0';
                
                return (
                  <ProxyRow key={idx}>
                    <ProxyInfo>
                      <strong>{stat.name}</strong>
                      <span>Vel: {avgSpeed}ms</span>
                    </ProxyInfo>
                    <ProxyBadge $rate={parseFloat(rate)}>
                      {rate}% Ok ({total})
                    </ProxyBadge>
                  </ProxyRow>
                );
              })
            )}

            {/* Acciones */}
            <ActionsContainer>
              <ActionButton onClick={handleCopyReport}>
                <Copy size={14} />
                {copied ? '¡Copiado!' : 'Copiar Diagnóstico'}
              </ActionButton>
              <ActionButton onClick={() => loggerService.clearLogs()} style={{ background: 'rgba(255,255,255,0.02)' }}>
                <Trash2 size={14} />
                Limpiar Terminal
              </ActionButton>
              <ActionButton onClick={handleClearCache} style={{ background: 'rgba(239, 68, 68, 0.1)', color: colors.danger, borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                <RefreshCw size={14} />
                Limpiar Caché
              </ActionButton>
            </ActionsContainer>
          </Sidebar>

          {/* Panel Derecho: Terminal de logs */}
          <TerminalArea>
            {/* Filtros */}
            <FilterRow>
              <FilterGroup>
                <span>Nivel:</span>
                {['ALL', 'INFO', 'SUCCESS', 'WARNING', 'ERROR'].map(lvl => (
                  <FilterBtn key={lvl} $active={filterLevel === lvl} onClick={() => setFilterLevel(lvl)}>
                    {lvl}
                  </FilterBtn>
                ))}
              </FilterGroup>

              <FilterGroup>
                <span>Origen:</span>
                {['ALL', 'API', 'CACHE', 'PROXY', 'SYSTEM'].map(cat => (
                  <FilterBtn key={cat} $active={filterCategory === cat} onClick={() => setFilterCategory(cat)}>
                    {cat}
                  </FilterBtn>
                ))}
              </FilterGroup>
            </FilterRow>

            {/* Consola de comandos */}
            <LogTerminal>
              {filteredLogs.length === 0 ? (
                <div style={{ color: '#475569', fontStyle: 'italic', fontSize: '0.85rem' }}>No hay logs que coincidan con los filtros seleccionados...</div>
              ) : (
                filteredLogs.map(log => (
                  <LogLine key={log.id} $level={log.level}>
                    <span className="time">[{log.timestamp}]</span>
                    <span className="level">[{log.level}]</span>
                    <span className="category">[{log.category}]</span>
                    <span className="msg">{log.message}</span>
                  </LogLine>
                ))
              )}
            </LogTerminal>
          </TerminalArea>
        </ConsoleBody>
      </ConsoleContainer>
    </ConsoleOverlay>
  );
};

// Styled Components
const ConsoleOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
`;

const ConsoleContainer = styled.div`
  width: min(1000px, 95vw);
  height: min(650px, 85vh);
  background: #090d16;
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.6), 0 0 20px rgba(245, 158, 11, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Fira Code', 'Courier New', Courier, monospace;
`;

const ConsoleHeader = styled.div`
  background: #0d1321;
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderTitle = styled.h3`
  margin: 0;
  font-size: 0.9rem;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
`;

const CloseBtn = styled.button`
  background: transparent;
  border: none;
  color: #475569;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  &:hover { background: rgba(255,255,255,0.05); color: white; }
`;

const ConsoleBody = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 280px 1fr;
  overflow: hidden;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Sidebar = styled.div`
  background: #0b111e;
  border-right: 1px solid rgba(255,255,255,0.04);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  overflow-y: auto;
  scrollbar-width: thin;
`;

const PanelTitle = styled.h4`
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.5px;
  font-weight: 700;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  padding-bottom: 0.25rem;
`;

const MetricCard = styled.div`
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 8px;
  padding: 0.75rem;
`;

const MetricLabel = styled.div`
  font-size: 0.7rem;
  color: #64748b;
`;

const MetricValue = styled.div`
  font-size: 1.15rem;
  font-weight: 700;
  color: white;
  margin-top: 2px;
`;

const ProgressBar = styled.div`
  height: 4px;
  background: rgba(255,255,255,0.05);
  border-radius: 2px;
  margin-top: 6px;
  position: relative;
  overflow: hidden;
  &::after {
    content: '';
    position: absolute;
    top: 0; left: 0; bottom: 0;
    width: ${props => props.$percent || 0}%;
    background: ${props => props.$color || colors.primary};
  }
`;

const ProxyRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  background: rgba(255,255,255,0.01);
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.02);
`;

const ProxyInfo = styled.div`
  display: flex;
  flex-direction: column;
  strong { color: white; }
  span { color: #475569; font-size: 0.65rem; }
`;

const ProxyBadge = styled.span`
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
  background: ${props => props.$rate > 70 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
  color: ${props => props.$rate > 70 ? colors.success : colors.danger};
`;

const NoDataText = styled.div`
  font-size: 0.75rem;
  color: #475569;
  font-style: italic;
`;

const ActionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 1rem;
`;

const ActionButton = styled.button`
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  color: white;
  font-family: inherit;
  font-size: 0.75rem;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  transition: all 0.2s;
  &:hover {
    background: ${colors.primary};
    border-color: ${colors.primary};
  }
`;

const TerminalArea = styled.div`
  display: flex;
  flex-direction: column;
  background: #05070c;
  overflow: hidden;
`;

const FilterRow = styled.div`
  background: #080c14;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.75rem;
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  span { color: #64748b; font-weight: bold; }
`;

const FilterBtn = styled.button`
  background: ${props => props.$active ? 'rgba(245, 158, 11, 0.15)' : 'transparent'};
  border: 1px solid ${props => props.$active ? colors.primary : 'transparent'};
  color: ${props => props.$active ? colors.primary : '#64748b'};
  font-family: inherit;
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: ${props => props.$active ? 'bold' : 'normal'};
  &:hover { color: white; }
`;

const LogTerminal = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column-reverse; /* El log más nuevo queda arriba/abajo dinámico */
  gap: 0.4rem;
  scrollbar-width: thin;
  font-size: 0.75rem;
  line-height: 1.4;
`;

const LogLine = styled.div`
  display: flex;
  gap: 0.5rem;
  word-break: break-all;
  
  .time { color: #475569; }
  
  .level {
    font-weight: bold;
    color: ${props => {
      if (props.$level === 'SUCCESS') return colors.success;
      if (props.$level === 'WARNING') return colors.warning;
      if (props.$level === 'ERROR') return colors.danger;
      return '#64748b';
    }};
  }
  
  .category { color: ${colors.primary}; font-weight: 500; }
  .msg { 
    color: ${props => {
      if (props.$level === 'SUCCESS') return '#a7f3d0'; // verde clarito
      if (props.$level === 'WARNING') return '#fde68a'; // amarillo clarito
      if (props.$level === 'ERROR') return '#fca5a5'; // rojo clarito
      return '#cbd5e1'; // gris claro
    }};
  }
`;

export default DebugConsole;
