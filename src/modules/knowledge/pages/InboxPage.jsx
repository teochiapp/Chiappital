// src/modules/knowledge/pages/InboxPage.jsx - Bandeja de Entrada y Captura de Recursos
import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import {
  Inbox,
  Plus,
  Link2,
  FileText,
  Lightbulb,
  Sparkles,
  ArrowRight,
  Trash2,
  CheckCircle,
  ExternalLink,
  Clock,
  Layers,
  Tag,
  X
} from 'lucide-react';
import { useKnowledge } from '../context/KnowledgeContext';
import knowledgeApiService from '../services/knowledgeApiService';

const InboxPage = () => {
  const navigate = useNavigate();
  const { areas, refreshAll, showToast, openQuickCapture } = useKnowledge();

  const [inboxItems, setInboxItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  // Modal para procesar / convertir en Nota
  const [processingItem, setProcessingItem] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isAiClassifying, setIsAiClassifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchInbox = useCallback(async () => {
    setLoading(true);
    try {
      const res = await knowledgeApiService.getInbox('inbox');
      setInboxItems(res.items || []);
    } catch (err) {
      console.error('Error cargando inbox:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  // Abrir modal de conversión en nota con sugerencias de IA
  const handleOpenProcessModal = async (item) => {
    setProcessingItem(item);
    setNoteTitle(item.title);
    setNoteContent(item.raw_content || '');
    setSelectedAreaId(item.ai_suggested_area_id ? String(item.ai_suggested_area_id) : '');
    setSelectedCategoryId(item.ai_suggested_category_id ? String(item.ai_suggested_category_id) : '');
    setSuggestedTags(item.ai_suggested_tags || ['inbox']);

    // Si no tiene sugerencias previas, pedir clasificación a la IA
    if (!item.ai_suggested_area_id) {
      setIsAiClassifying(true);
      try {
        const aiRes = await knowledgeApiService.aiClassify({
          title: item.title,
          content: item.raw_content
        });
        if (aiRes.suggested_area_id) setSelectedAreaId(String(aiRes.suggested_area_id));
        if (aiRes.suggested_category_id) setSelectedCategoryId(String(aiRes.suggested_category_id));
        if (aiRes.suggested_tags?.length) setSuggestedTags(aiRes.suggested_tags);
      } catch (err) {
        console.error(err);
      } finally {
        setIsAiClassifying(false);
      }
    }
  };

  // Guardar y convertir a Nota permanente
  const handleProcessSubmit = async (e) => {
    e.preventDefault();
    if (!processingItem || !noteTitle.trim()) return;

    setIsSaving(true);
    try {
      await knowledgeApiService.processInboxItem(processingItem.id, {
        title: noteTitle.trim(),
        content: noteContent,
        primary_category_id: selectedCategoryId || null,
        area_ids: selectedAreaId ? [selectedAreaId] : [],
        tags: suggestedTags
      });

      showToast('🎉 Recurso transformado en Nota permanente');
      setProcessingItem(null);
      fetchInbox();
      refreshAll();
    } catch (err) {
      console.error(err);
      showToast('❌ Error al procesar recurso');
    } finally {
      setIsSaving(false);
    }
  };

  // Eliminar elemento del Inbox
  const handleDeleteItem = async (id) => {
    if (!window.confirm('¿Eliminar este elemento del Inbox?')) return;
    try {
      await knowledgeApiService.deleteInboxItem(id);
      showToast('🗑️ Elemento eliminado');
      setInboxItems(prev => prev.filter(i => i.id !== id));
      refreshAll();
    } catch (err) {
      console.error(err);
    }
  };

  // Filtrar items
  const filteredItems = inboxItems.filter((item) => {
    if (filterType === 'all') return true;
    return item.resource_type === filterType;
  });

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <Title>Inbox de Captura</Title>
          <Subtitle>Entrada rápida para ideas, URLs y notas antes de estructurarlas en el Second Brain</Subtitle>
        </div>
        <ActionButtonsRow>
          <QuickCaptureBtn onClick={() => openQuickCapture('note')}>
            <Plus size={16} /> Capturar al Inbox
          </QuickCaptureBtn>
        </ActionButtonsRow>
      </PageHeader>

      {/* Filtros de tipo de recurso */}
      <FilterTabs>
        <TabBtn $active={filterType === 'all'} onClick={() => setFilterType('all')}>
          Todos ({inboxItems.length})
        </TabBtn>
        <TabBtn $active={filterType === 'text'} onClick={() => setFilterType('text')}>
          <FileText size={14} /> Notas / Texto
        </TabBtn>
        <TabBtn $active={filterType === 'url'} onClick={() => setFilterType('url')}>
          <Link2 size={14} /> Enlaces Web
        </TabBtn>
        <TabBtn $active={filterType === 'idea'} onClick={() => setFilterType('idea')}>
          <Lightbulb size={14} /> Ideas
        </TabBtn>
      </FilterTabs>

      {/* Lista de Recursos en Inbox */}
      {loading ? (
        <LoadingText>Cargando bandeja de entrada...</LoadingText>
      ) : filteredItems.length === 0 ? (
        <EmptyInbox>
          <Inbox size={48} color="#64748b" />
          <h3>Tu Inbox está al día</h3>
          <p>No tienes elementos pendientes de organizar. Captura nuevos conocimientos cuando surjan.</p>
          <QuickCaptureBtn onClick={() => openQuickCapture('url')}>
            <Plus size={16} /> Capturar URL o Idea
          </QuickCaptureBtn>
        </EmptyInbox>
      ) : (
        <InboxGrid>
          {filteredItems.map((item) => (
            <InboxCard key={item.id}>
              <CardTopRow>
                <TypeBadge $type={item.resource_type}>
                  {item.resource_type === 'url' ? <Link2 size={13} /> : item.resource_type === 'idea' ? <Lightbulb size={13} /> : <FileText size={13} />}
                  <span>{item.resource_type.toUpperCase()}</span>
                </TypeBadge>

                <CardDate>
                  <Clock size={12} /> {new Date(item.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </CardDate>
              </CardTopRow>

              <CardTitle>{item.title}</CardTitle>

              {item.raw_content && (
                <CardSnippet>{item.raw_content}</CardSnippet>
              )}

              {item.url && (
                <SourceLink href={item.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={12} /> {item.source_name || item.url}
                </SourceLink>
              )}

              {/* Sugerencias de IA si están disponibles */}
              {(item.suggested_area_name || item.suggested_category_name) && (
                <AiSuggestionPill>
                  <Sparkles size={12} color="#ec4899" />
                  <span>Sugerido: {item.suggested_area_name} → {item.suggested_category_name}</span>
                </AiSuggestionPill>
              )}

              <CardActions>
                <DeleteBtn onClick={() => handleDeleteItem(item.id)} title="Eliminar">
                  <Trash2 size={15} />
                </DeleteBtn>
                <ProcessBtn onClick={() => handleOpenProcessModal(item)}>
                  Convertir en Nota <ArrowRight size={14} />
                </ProcessBtn>
              </CardActions>
            </InboxCard>
          ))}
        </InboxGrid>
      )}

      {/* ─── MODAL PROCESAR RECURSO ────────────────────────────────────────── */}
      {processingItem && (
        <ModalOverlay onClick={() => setProcessingItem(null)}>
          <ModalBox onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitleWrapper>
                <Sparkles size={18} color="#ec4899" />
                <h3>Estructurar y Guardar en Knowledge Base</h3>
              </ModalTitleWrapper>
              <CloseBtn onClick={() => setProcessingItem(null)}>
                <X size={18} />
              </CloseBtn>
            </ModalHeader>

            {isAiClassifying && (
              <AiNotice>
                <Sparkles size={14} color="#ec4899" />
                Analizando con IA para sugerir Área, Categoría y Etiquetas...
              </AiNotice>
            )}

            <ModalForm onSubmit={handleProcessSubmit}>
              <FormGroup>
                <Label>Título de la Nota Permanente *</Label>
                <Input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  required
                />
              </FormGroup>

              <Row>
                <FormGroup style={{ flex: 1 }}>
                  <Label>Área de Conocimiento</Label>
                  <Select
                    value={selectedAreaId}
                    onChange={(e) => {
                      setSelectedAreaId(e.target.value);
                      setSelectedCategoryId('');
                    }}
                  >
                    <option value="">Seleccionar Área...</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </Select>
                </FormGroup>

                <FormGroup style={{ flex: 1 }}>
                  <Label>Categoría</Label>
                  <Select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                  >
                    <option value="">Seleccionar Categoría...</option>
                    {areas
                      .find(a => String(a.id) === String(selectedAreaId))
                      ?.categories?.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </Select>
                </FormGroup>
              </Row>

              <FormGroup>
                <Label>Contenido / Resumen</Label>
                <TextArea
                  rows={6}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label>Etiquetas / Tags</Label>
                <TagsRow>
                  {suggestedTags.map(t => (
                    <TagPill key={t}>
                      #{t}
                      <RemoveTagBtn
                        type="button"
                        onClick={() => setSuggestedTags(suggestedTags.filter(item => item !== t))}
                      >
                        ×
                      </RemoveTagBtn>
                    </TagPill>
                  ))}
                  <AddTagInput
                    type="text"
                    placeholder="+ Tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tagInput.trim()) {
                        e.preventDefault();
                        const clean = tagInput.trim().replace(/^#/, '');
                        if (!suggestedTags.includes(clean)) {
                          setSuggestedTags([...suggestedTags, clean]);
                        }
                        setTagInput('');
                      }
                    }}
                  />
                </TagsRow>
              </FormGroup>

              <ModalFooter>
                <CancelBtn type="button" onClick={() => setProcessingItem(null)}>
                  Cancelar
                </CancelBtn>
                <SaveBtn type="submit" disabled={isSaving || !noteTitle.trim()}>
                  {isSaving ? 'Guardando...' : 'Crear Nota Permanente'}
                </SaveBtn>
              </ModalFooter>
            </ModalForm>
          </ModalBox>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

// ─── Estilos ─────────────────────────────────────────────────────────────────

const PageContainer = styled.div`
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 1.5rem 2rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 0.82rem;
  color: #94a3b8;
  margin: 0.2rem 0 0;
`;

const ActionButtonsRow = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const QuickCaptureBtn = styled.button`
  background: #8b5cf6;
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: #7c3aed;
  }
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 0.5rem;
  overflow-x: auto;
`;

const TabBtn = styled.button`
  background: ${props => props.$active ? 'rgba(139, 92, 246, 0.15)' : 'transparent'};
  color: ${props => props.$active ? '#c4b5fd' : '#94a3b8'};
  border: 1px solid ${props => props.$active ? 'rgba(139, 92, 246, 0.3)' : 'transparent'};
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    color: white;
  }
`;

const InboxGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
`;

const InboxCard = styled.div`
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(139, 92, 246, 0.3);
    transform: translateY(-2px);
  }
`;

const CardTopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TypeBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  background: ${props => props.$type === 'url' ? 'rgba(59, 130, 246, 0.15)' : props.$type === 'idea' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(139, 92, 246, 0.15)'};
  color: ${props => props.$type === 'url' ? '#60a5fa' : props.$type === 'idea' ? '#fbbf24' : '#c4b5fd'};
`;

const CardDate = styled.span`
  font-size: 0.72rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const CardTitle = styled.h3`
  font-size: 0.95rem;
  font-weight: 600;
  color: #f8fafc;
  margin: 0;
  line-height: 1.3;
`;

const CardSnippet = styled.p`
  font-size: 0.78rem;
  color: #94a3b8;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const SourceLink = styled.a`
  font-size: 0.74rem;
  color: #60a5fa;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  &:hover {
    text-decoration: underline;
  }
`;

const AiSuggestionPill = styled.div`
  background: rgba(236, 72, 153, 0.08);
  border: 1px solid rgba(236, 72, 153, 0.2);
  border-radius: 6px;
  padding: 0.35rem 0.6rem;
  font-size: 0.72rem;
  color: #f472b6;
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const CardActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
`;

const DeleteBtn = styled.button`
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.3rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }
`;

const ProcessBtn = styled.button`
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: #c4b5fd;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: #8b5cf6;
    color: white;
  }
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 3rem;
  color: #94a3b8;
`;

const EmptyInbox = styled.div`
  text-align: center;
  padding: 4rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #94a3b8;
  h3 { color: #f8fafc; margin: 0; }
  p { max-width: 400px; margin: 0; font-size: 0.85rem; }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2500;
  padding: 1rem;
`;

const ModalBox = styled.div`
  background: #0f172a;
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  width: 100%;
  max-width: 580px;
  padding: 1.5rem;
  color: #f8fafc;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ModalTitleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  h3 { margin: 0; font-size: 1.05rem; }
`;

const CloseBtn = styled.button`
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
`;

const AiNotice = styled.div`
  background: rgba(236, 72, 153, 0.1);
  border: 1px solid rgba(236, 72, 153, 0.25);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.78rem;
  color: #f472b6;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 1rem;
`;

const ModalForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const Label = styled.label`
  font-size: 0.78rem;
  font-weight: 500;
  color: #cbd5e1;
`;

const Input = styled.input`
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  padding: 0.55rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  outline: none;
`;

const TextArea = styled.textarea`
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  padding: 0.65rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  outline: none;
  resize: vertical;
  line-height: 1.5;
`;

const Row = styled.div`
  display: flex;
  gap: 1rem;
`;

const Select = styled.select`
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  padding: 0.55rem 0.75rem;
  border-radius: 6px;
  font-size: 0.82rem;
  outline: none;
`;

const TagsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
`;

const TagPill = styled.span`
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: #c4b5fd;
  font-size: 0.74rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.3rem;
`;

const RemoveTagBtn = styled.button`
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.85rem;
  line-height: 1;
`;

const AddTagInput = styled.input`
  background: transparent;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #f8fafc;
  font-size: 0.75rem;
  padding: 0.2rem 0.45rem;
  width: 80px;
  outline: none;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

const CancelBtn = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #cbd5e1;
  padding: 0.45rem 0.85rem;
  border-radius: 6px;
  font-size: 0.82rem;
  cursor: pointer;
`;

const SaveBtn = styled.button`
  background: #8b5cf6;
  border: none;
  color: white;
  padding: 0.45rem 1rem;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  &:hover {
    background: #7c3aed;
  }
`;

export default InboxPage;
