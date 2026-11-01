// src/modules/knowledge/pages/KnowledgeDashboard.jsx - Overview de Knowledge Hub
import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Link2,
  Lightbulb,
  Sparkles,
  FolderTree,
  Network,
  Clock,
  ArrowRight,
  Star,
  AlertCircle,
  Hash,
  Compass,
  Code,
  DollarSign,
  Landmark,
  BookOpen,
  Folder,
  Layers,
  Activity,
  Download,
  Archive
} from 'lucide-react';
import { useKnowledge } from '../context/KnowledgeContext';

// Helper de iconos para áreas
const getAreaIcon = (iconName) => {
  const map = {
    Code: Code,
    DollarSign: DollarSign,
    Compass: Compass,
    Landmark: Landmark,
    BookOpen: BookOpen,
    Folder: Folder,
  };
  return map[iconName] || Folder;
};

const KnowledgeDashboard = () => {
  const navigate = useNavigate();
  const { overview, areas, loading, openQuickCapture, openExportModal } = useKnowledge();

  if (loading && !overview) {
    return (
      <LoadingWrapper>
        <Sparkles size={28} color="#8b5cf6" />
        <p>Cargando tu ecosistema de conocimiento...</p>
      </LoadingWrapper>
    );
  }

  const metrics = overview?.metrics || {
    totalNotes: 0,
    totalAreas: 5,
    totalCategories: 26,
    totalRelations: 0,
    favoritesCount: 0
  };

  const recentNotes = overview?.recentNotes || [];
  const insights = overview?.insights || { uncategorizedNotes: 0, isolatedNotes: 0 };

  return (
    <DashboardContainer>
      {/* ─── A. Quick Capture Bar ────────────────────────────────────────── */}
      <QuickCaptureSection>
        <SectionHeader>
          <SectionTitle>Captura Inmediata</SectionTitle>
          <SectionSubtitle>Registra pensamientos, recursos o enlaces con un solo clic</SectionSubtitle>
        </SectionHeader>
        <QuickCaptureGrid>
          <CaptureCard onClick={() => openQuickCapture('note')}>
            <IconBox $bg="rgba(139, 92, 246, 0.15)" $color="#a78bfa">
              <FileText size={20} />
            </IconBox>
            <CaptureCardInfo>
              <CaptureCardTitle>Nueva Nota</CaptureCardTitle>
              <CaptureCardDesc>Redacta una idea o nota estructurada</CaptureCardDesc>
            </CaptureCardInfo>
          </CaptureCard>

          <CaptureCard onClick={() => openQuickCapture('url')}>
            <IconBox $bg="rgba(59, 130, 246, 0.15)" $color="#60a5fa">
              <Link2 size={20} />
            </IconBox>
            <CaptureCardInfo>
              <CaptureCardTitle>Capturar URL</CaptureCardTitle>
              <CaptureCardDesc>Guarda referencias y páginas web como notas</CaptureCardDesc>
            </CaptureCardInfo>
          </CaptureCard>

          <CaptureCard onClick={() => openQuickCapture('idea')}>
            <IconBox $bg="rgba(245, 158, 11, 0.15)" $color="#fbbf24">
              <Lightbulb size={20} />
            </IconBox>
            <CaptureCardInfo>
              <CaptureCardTitle>Idea Rápida</CaptureCardTitle>
              <CaptureCardDesc>Captura pensamientos fugaces al instante</CaptureCardDesc>
            </CaptureCardInfo>
          </CaptureCard>


          <CaptureCard onClick={() => openExportModal()}>
            <IconBox $bg="rgba(16, 185, 129, 0.15)" $color="#34d399">
              <Archive size={20} />
            </IconBox>
            <CaptureCardInfo>
              <CaptureCardTitle>Exportar Categoría</CaptureCardTitle>
              <CaptureCardDesc>Descarga un paquete Markdown y adjuntos</CaptureCardDesc>
            </CaptureCardInfo>
          </CaptureCard>
        </QuickCaptureGrid>
      </QuickCaptureSection>

      {/* ─── Métricas Globales ───────────────────────────────────────────── */}
      <MetricsRow>
        <MetricCard onClick={() => navigate('/personal/knowledge/notes')}>
          <MetricValue>{metrics.totalNotes}</MetricValue>
          <MetricLabel>Notas Totales</MetricLabel>
        </MetricCard>
        <MetricCard onClick={() => navigate('/personal/knowledge/categories')}>
          <MetricValue>{metrics.totalAreas}</MetricValue>
          <MetricLabel>Áreas de Conocimiento</MetricLabel>
        </MetricCard>
        <MetricCard onClick={() => navigate('/personal/knowledge/categories')}>
          <MetricValue>{metrics.totalCategories}</MetricValue>
          <MetricLabel>Categorías</MetricLabel>
        </MetricCard>
        <MetricCard onClick={() => navigate('/personal/knowledge/graph')}>
          <MetricValue>{metrics.totalRelations}</MetricValue>
          <MetricLabel>Conexiones en Grafo</MetricLabel>
        </MetricCard>
      </MetricsRow>

      {/* ─── B. Knowledge Areas Cards ────────────────────────────────────── */}
      <SectionWrapper>
        <SectionHeaderBetween>
          <div>
            <SectionTitle>Áreas de Conocimiento</SectionTitle>
            <SectionSubtitle>Tus pilares organizativos principales</SectionSubtitle>
          </div>
          <ViewAllBtn onClick={() => navigate('/personal/knowledge/categories')}>
            Gestionar Áreas y Categorías <ArrowRight size={14} />
          </ViewAllBtn>
        </SectionHeaderBetween>

        <AreasGrid>
          {areas.map((area) => {
            const Icon = getAreaIcon(area.icon);
            return (
              <AreaCard
                key={area.id}
                $color={area.color}
                onClick={() => navigate(`/personal/knowledge/notes?area_id=${area.id}`)}
              >
                <AreaCardHeader>
                  <AreaIconWrapper $color={area.color}>
                    <Icon size={22} />
                  </AreaIconWrapper>
                  <AreaBadges>
                    <AreaBadge>{area.notes_count || 0} notas</AreaBadge>
                    <AreaBadge>{area.categories?.length || area.subcategories_count || 0} cat.</AreaBadge>
                  </AreaBadges>
                </AreaCardHeader>
                <AreaName>{area.name}</AreaName>
                <AreaDescription>{area.description || 'Sin descripción'}</AreaDescription>

                {area.categories && area.categories.length > 0 && (
                  <CategoryPills>
                    {area.categories.slice(0, 4).map((cat) => (
                      <CategoryPill key={cat.id}>{cat.name}</CategoryPill>
                    ))}
                    {area.categories.length > 4 && (
                      <CategoryPill>+{area.categories.length - 4} más</CategoryPill>
                    )}
                  </CategoryPills>
                )}
              </AreaCard>
            );
          })}
        </AreasGrid>
      </SectionWrapper>

      {/* ─── C & D. Notas Recientes & Insights ───────────────────────────── */}
      <TwoColumnsRow>
        {/* Notas Recientes */}
        <RecentNotesSection>
          <SectionHeaderBetween>
            <div>
              <SectionTitle>Notas Recientes</SectionTitle>
              <SectionSubtitle>Últimas actualizaciones en tu Second Brain</SectionSubtitle>
            </div>
            <ViewAllBtn onClick={() => navigate('/personal/knowledge/notes')}>
              Ver Todas <ArrowRight size={14} />
            </ViewAllBtn>
          </SectionHeaderBetween>

          {recentNotes.length === 0 ? (
            <EmptyState>
              <FileText size={32} color="#64748b" />
              <p>Aún no tienes notas creadas.</p>
              <CreateFirstNoteBtn onClick={() => openQuickCapture('note')}>
                Crear tu primera nota
              </CreateFirstNoteBtn>
            </EmptyState>
          ) : (
            <NotesList>
              {recentNotes.map((note) => (
                <NoteItem
                  key={note.id}
                  onClick={() => navigate(`/personal/knowledge/notes?noteId=${note.id}`)}
                >
                  <NoteHeaderRow>
                    <NoteTitleWrapper>
                      {note.is_favorite === 1 && <Star size={14} color="#f59e0b" fill="#f59e0b" />}
                      <NoteTitle>{note.title}</NoteTitle>
                    </NoteTitleWrapper>
                    {note.category_name && (
                      <CategoryTag $color={note.area_color}>{note.category_name}</CategoryTag>
                    )}
                  </NoteHeaderRow>
                  {note.preview && <NotePreview>{note.preview}...</NotePreview>}
                  <NoteMetaRow>
                    <NoteDate>
                      <Clock size={12} /> {new Date(note.updated_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </NoteDate>
                    {note.area_name && (
                      <AreaNameIndicator $color={note.area_color}>
                        • {note.area_name}
                      </AreaNameIndicator>
                    )}
                  </NoteMetaRow>
                </NoteItem>
              ))}
            </NotesList>
          )}
        </RecentNotesSection>

        {/* Knowledge Insights */}
        <InsightsSection>
          <SectionHeader>
            <SectionTitle>Knowledge Insights</SectionTitle>
            <SectionSubtitle>Sugerencias para fortalecer tu red</SectionSubtitle>
          </SectionHeader>

        </InsightsSection>
      </TwoColumnsRow>
    </DashboardContainer>
  );
};

// ─── Estilos ─────────────────────────────────────────────────────────────────

const DashboardContainer = styled.div`
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
  padding: 1.5rem 2rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
    gap: 1.5rem;
  }
`;

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 1rem;
  gap: 1rem;
  color: #94a3b8;
`;

const SectionHeader = styled.div`
  margin-bottom: 1rem;
`;

const SectionHeaderBetween = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.15rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 0.2rem;
`;

const SectionSubtitle = styled.p`
  font-size: 0.82rem;
  color: #94a3b8;
  margin: 0;
`;

const ViewAllBtn = styled.button`
  background: transparent;
  border: none;
  color: #a78bfa;
  font-size: 0.82rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  transition: color 0.2s;
  &:hover {
    color: #c4b5fd;
  }
`;

const QuickCaptureSection = styled.section`
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 1.25rem 1.5rem;
`;

const QuickCaptureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 1rem;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const CaptureCard = styled.div`
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(30, 41, 59, 0.95);
    border-color: rgba(139, 92, 246, 0.4);
    transform: translateY(-2px);
  }
`;

const IconBox = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: ${props => props.$bg};
  color: ${props => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const CaptureCardInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const CaptureCardTitle = styled.span`
  font-size: 0.88rem;
  font-weight: 600;
  color: #f8fafc;
`;

const CaptureCardDesc = styled.span`
  font-size: 0.74rem;
  color: #94a3b8;
  line-height: 1.3;
`;

const MetricsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const MetricCard = styled.div`
  background: #0f172a;
  border: 1px solid ${props => props.$highlight ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.06)'};
  border-radius: 12px;
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(139, 92, 246, 0.4);
    transform: translateY(-2px);
  }
`;

const MetricValue = styled.span`
  font-size: 1.6rem;
  font-weight: 700;
  color: #f8fafc;
  line-height: 1;
`;

const MetricLabel = styled.span`
  font-size: 0.78rem;
  color: #94a3b8;
  font-weight: 500;
`;

const SectionWrapper = styled.section`
  display: flex;
  flex-direction: column;
`;

const AreasGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
`;

const AreaCard = styled.div`
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-top: 3px solid ${props => props.$color || '#8b5cf6'};
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #131d36;
    border-color: ${props => props.$color || '#8b5cf6'};
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }
`;

const AreaCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const AreaIconWrapper = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: ${props => `${props.$color}20`};
  color: ${props => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AreaBadges = styled.div`
  display: flex;
  gap: 0.4rem;
`;

const AreaBadge = styled.span`
  font-size: 0.72rem;
  padding: 0.2rem 0.5rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  color: #cbd5e1;
  font-weight: 500;
`;

const AreaName = styled.h3`
  font-size: 1.05rem;
  font-weight: 600;
  color: #f8fafc;
  margin: 0;
`;

const AreaDescription = styled.p`
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 0;
  line-height: 1.4;
  flex: 1;
`;

const CategoryPills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.5rem;
`;

const CategoryPill = styled.span`
  font-size: 0.72rem;
  padding: 0.15rem 0.5rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  color: #cbd5e1;
`;

const TwoColumnsRow = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 1.5rem;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const RecentNotesSection = styled.div`
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 1.25rem 1.5rem;
`;

const NotesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const NoteItem = styled.div`
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 0.85rem 1rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(30, 41, 59, 0.9);
    border-color: rgba(139, 92, 246, 0.3);
    transform: translateX(3px);
  }
`;

const NoteHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.3rem;
`;

const NoteTitleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const NoteTitle = styled.h4`
  font-size: 0.92rem;
  font-weight: 600;
  color: #f8fafc;
  margin: 0;
`;

const CategoryTag = styled.span`
  font-size: 0.72rem;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  background: ${props => props.$color ? `${props.$color}20` : 'rgba(139, 92, 246, 0.15)'};
  color: ${props => props.$color || '#c4b5fd'};
  font-weight: 500;
`;

const NotePreview = styled.p`
  font-size: 0.78rem;
  color: #94a3b8;
  margin: 0 0 0.4rem;
  line-height: 1.4;
`;

const NoteMetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const NoteDate = styled.span`
  font-size: 0.72rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const AreaNameIndicator = styled.span`
  font-size: 0.72rem;
  color: ${props => props.$color || '#94a3b8'};
  font-weight: 500;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: #94a3b8;
  font-size: 0.88rem;
`;

const CreateFirstNoteBtn = styled.button`
  background: #8b5cf6;
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.82rem;
  cursor: pointer;
  margin-top: 0.5rem;
`;

const InsightsSection = styled.div`
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InsightCard = styled.div`
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 1rem;
  display: flex;
  gap: 0.85rem;
`;

const InsightIconBox = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: ${props => props.$bg};
  color: ${props => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const InsightContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const InsightTitle = styled.h4`
  font-size: 0.88rem;
  font-weight: 600;
  color: #f8fafc;
  margin: 0;
`;

const InsightDesc = styled.p`
  font-size: 0.78rem;
  color: #94a3b8;
  margin: 0;
  line-height: 1.4;
`;

const InsightAction = styled.button`
  background: transparent;
  border: none;
  color: #a78bfa;
  font-size: 0.76rem;
  font-weight: 500;
  padding: 0;
  margin-top: 0.3rem;
  cursor: pointer;
  text-align: left;
  &:hover {
    text-decoration: underline;
  }
`;

export default KnowledgeDashboard;
