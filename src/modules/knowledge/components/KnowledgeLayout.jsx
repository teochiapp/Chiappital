// src/modules/knowledge/components/KnowledgeLayout.jsx - Layout y navegación interna de Knowledge Hub
import React from 'react';
import styled from 'styled-components';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  BrainCircuit,
  LayoutDashboard,
  FileText,
  Network,
  FolderTree,
  Plus,
  Search,
  Download
} from 'lucide-react';
import { useKnowledge } from '../context/KnowledgeContext';
import QuickCaptureModal from './QuickCaptureModal';
import ExportModal from './ExportModal';

const KnowledgeLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { openQuickCapture, openExportModal, toastMessage } = useKnowledge();

  const navItems = [
    { path: '/personal/knowledge', label: 'Overview', icon: LayoutDashboard, exact: true },
    { path: '/personal/knowledge/notes', label: 'All Notes', icon: FileText },
    { path: '/personal/knowledge/graph', label: 'Knowledge Graph', icon: Network },
    { path: '/personal/knowledge/categories', label: 'Categories', icon: FolderTree },
  ];

  const isCurrentActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <Container>
      {/* Sub-Header específico de Knowledge Hub */}
      <SubHeader>
        <SubHeaderContent>
          <BrandSection>
            <BrandIconWrapper>
              <BrainCircuit size={20} color="#a78bfa" />
            </BrandIconWrapper>
            <BrandText>
              <Title>Knowledge Hub</Title>
              <Subtitle>Second Brain & Network</Subtitle>
            </BrandText>
          </BrandSection>

          {/* Navegación Interna */}
          <InternalNav>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isCurrentActive(item);
              return (
                <NavItem
                  key={item.path}
                  $active={active}
                  $highlight={item.highlight}
                  onClick={() => navigate(item.path)}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  {item.badge > 0 && <Badge>{item.badge}</Badge>}
                </NavItem>
              );
            })}
          </InternalNav>

          {/* Acciones Rápidas */}
          <ActionsSection>
            <ExportBtn onClick={() => openExportModal()} title="Exportar categoría a Markdown consolidado y ZIP">
              <Download size={15} />
              <span>Exportar</span>
            </ExportBtn>
            <QuickCaptureBtn onClick={() => openQuickCapture('note')}>
              <Plus size={16} />
              <span>Captura Rápida</span>
            </QuickCaptureBtn>
          </ActionsSection>
        </SubHeaderContent>
      </SubHeader>

      {/* Contenido Principal */}
      <MainWrapper>
        <Outlet />
      </MainWrapper>

      {/* Modal de Captura Rápida Global */}
      <QuickCaptureModal />

      {/* Modal de Exportación */}
      <ExportModal />

      {/* Toast Notificaciones */}
      {toastMessage && (
        <ToastContainer>
          <ToastCard>{toastMessage}</ToastCard>
        </ToastContainer>
      )}
    </Container>
  );
};

// ─── Estilos ─────────────────────────────────────────────────────────────────

const Container = styled.div`
  min-height: calc(100vh - 110px);
  background: #0a0f1e;
  color: #f8fafc;
  display: flex;
  flex-direction: column;
`;

const SubHeader = styled.div`
  background: #0f172a;
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
  padding: 0.6rem 2rem;
  position: sticky;
  top: 96px; /* Justo debajo del PersonalHeader */
  z-index: 900;
  backdrop-filter: blur(10px);

  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    top: 55px;
  }
`;

const SubHeaderContent = styled.div`
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;

  @media (max-width: 900px) {
    gap: 0.8rem;
  }
`;

const BrandSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const BrandIconWrapper = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const BrandText = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.h1`
  font-size: 0.95rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0;
  line-height: 1.2;
`;

const Subtitle = styled.span`
  font-size: 0.7rem;
  color: #a78bfa;
  font-weight: 500;
  letter-spacing: 0.5px;
`;

const InternalNav = styled.nav`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  overflow-x: auto;
  padding: 0.2rem 0;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const NavItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 500;
  white-space: nowrap;
  border: 1px solid ${props => props.$active ? (props.$highlight ? 'rgba(236, 72, 153, 0.4)' : 'rgba(139, 92, 246, 0.4)') : 'transparent'};
  background: ${props => props.$active ? (props.$highlight ? 'rgba(236, 72, 153, 0.15)' : 'rgba(139, 92, 246, 0.15)') : 'transparent'};
  color: ${props => props.$active ? (props.$highlight ? '#f472b6' : '#c4b5fd') : '#94a3b8'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(139, 92, 246, 0.1);
    color: #e2e8f0;
  }
`;

const Badge = styled.span`
  background: #ef4444;
  color: white;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.1rem 0.45rem;
  border-radius: 10px;
  margin-left: 0.2rem;
`;

const ActionsSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ExportBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(139, 92, 246, 0.35);
  color: #c4b5fd;
  padding: 0.42rem 0.85rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(139, 92, 246, 0.15);
    color: white;
    border-color: #8b5cf6;
  }
`;

const QuickCaptureBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  color: white;
  border: none;
  padding: 0.45rem 0.95rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25);
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(139, 92, 246, 0.35);
  }
`;

const MainWrapper = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ToastContainer = styled.div`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 3000;
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

const ToastCard = styled.div`
  background: #1e293b;
  border: 1px solid #8b5cf6;
  color: #f8fafc;
  padding: 0.75rem 1.25rem;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  font-size: 0.88rem;
  font-weight: 500;
`;

export default KnowledgeLayout;
