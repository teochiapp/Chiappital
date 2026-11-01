// src/modules/knowledge/components/ExportModal.jsx - Modal de Configuración y Exportación de Conocimiento
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import {
  Download,
  X,
  FileText,
  Paperclip,
  Network,
  Sparkles,
  FolderTree,
  CheckCircle2,
  Archive,
  Layers,
  ChevronRight,
  Loader2,
  Globe,
  CheckSquare,
  Square,
  Search,
  Check
} from 'lucide-react';
import { useKnowledge } from '../context/KnowledgeContext';
import knowledgeApiService from '../services/knowledgeApiService';

const ExportModal = () => {
  const {
    isExportModalOpen,
    closeExportModal,
    exportModalCategory,
    areas,
    showToast
  } = useKnowledge();

  // Modo de ámbito: 'area' (Categoría grande/macro) | 'category' (Categoría individual) | 'multiple' (Múltiples subcategorías)
  const [scopeMode, setScopeMode] = useState('category');

  // Selección según modo
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [includeSubcategories, setIncludeSubcategories] = useState(true);

  // Filtro de búsqueda en la selección múltiple
  const [subcatSearch, setSubcatSearch] = useState('');

  // Opciones de contenido
  const [includeAttachments, setIncludeAttachments] = useState(true);
  const [includeRelationships, setIncludeRelationships] = useState(true);
  const [generateAiSummaries, setGenerateAiSummaries] = useState(true);

  // Estados de vista previa y generación
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(null);

  // Lista plana de todas las categorías disponibles para selección múltiple
  const allCategoriesFlat = useMemo(() => {
    return areas.flatMap(a => (a.categories || []).map(c => ({
      ...c,
      area_id: a.id,
      area_name: a.name,
      area_color: a.color || '#8b5cf6'
    })));
  }, [areas]);

  // Inicializar estado al abrir el modal
  useEffect(() => {
    if (isExportModalOpen) {
      setExportSuccess(null);
      if (exportModalCategory) {
        if (exportModalCategory.categories) {
          // Se abrió desde un área
          setScopeMode('area');
          setSelectedAreaId(String(exportModalCategory.id));
        } else {
          // Se abrió desde una categoría
          setScopeMode('category');
          setSelectedCategoryId(String(exportModalCategory.id));
        }
      } else {
        if (areas.length > 0) {
          setSelectedAreaId(String(areas[0].id));
          if (areas[0].categories?.length > 0) {
            setSelectedCategoryId(String(areas[0].categories[0].id));
            setSelectedCategoryIds([areas[0].categories[0].id]);
          }
        }
      }
    }
  }, [isExportModalOpen, exportModalCategory, areas]);

  // Cargar vista previa según el ámbito seleccionado
  const fetchPreview = useCallback(async () => {
    const payload = {
      scope_type: scopeMode,
      include_subcategories: includeSubcategories
    };

    if (scopeMode === 'area') {
      if (!selectedAreaId) return;
      payload.area_id = selectedAreaId;
    } else if (scopeMode === 'multiple') {
      if (!selectedCategoryIds || selectedCategoryIds.length === 0) {
        setPreviewData(null);
        return;
      }
      payload.category_ids = selectedCategoryIds;
    } else {
      if (!selectedCategoryId) return;
      payload.category_id = selectedCategoryId;
    }

    setLoadingPreview(true);
    try {
      const res = await knowledgeApiService.getExportPreview(payload);
      setPreviewData(res.preview);
    } catch (err) {
      console.error('Error al cargar vista previa de exportación:', err);
    } finally {
      setLoadingPreview(false);
    }
  }, [scopeMode, selectedAreaId, selectedCategoryId, selectedCategoryIds, includeSubcategories]);

  useEffect(() => {
    if (isExportModalOpen) {
      fetchPreview();
    }
  }, [isExportModalOpen, fetchPreview]);

  if (!isExportModalOpen) return null;

  // Manejo de checkboxes en selección múltiple
  const toggleCategorySelection = (catId) => {
    setSelectedCategoryIds(prev => {
      if (prev.includes(catId)) {
        return prev.filter(id => id !== catId);
      } else {
        return [...prev, catId];
      }
    });
  };

  const selectAllInArea = (areaId) => {
    const areaCats = allCategoriesFlat.filter(c => String(c.area_id) === String(areaId)).map(c => c.id);
    setSelectedCategoryIds(prev => Array.from(new Set([...prev, ...areaCats])));
  };

  const deselectAllInArea = (areaId) => {
    const areaCatSet = new Set(allCategoriesFlat.filter(c => String(c.area_id) === String(areaId)).map(c => c.id));
    setSelectedCategoryIds(prev => prev.filter(id => !areaCatSet.has(id)));
  };

  const selectAllCategories = () => {
    setSelectedCategoryIds(allCategoriesFlat.map(c => c.id));
  };

  const clearCategorySelection = () => {
    setSelectedCategoryIds([]);
  };

  // Generar y descargar el paquete ZIP
  const handleGenerateExport = async () => {
    if (isExporting) return;

    const payload = {
      scope_type: scopeMode,
      include_subcategories: includeSubcategories,
      include_attachments: includeAttachments,
      include_relationships: includeRelationships,
      generate_ai_summaries: generateAiSummaries
    };

    if (scopeMode === 'area') {
      if (!selectedAreaId) return;
      payload.area_id = selectedAreaId;
    } else if (scopeMode === 'multiple') {
      if (!selectedCategoryIds.length) return;
      payload.category_ids = selectedCategoryIds;
    } else {
      if (!selectedCategoryId) return;
      payload.category_id = selectedCategoryId;
    }

    setIsExporting(true);
    try {
      const res = await knowledgeApiService.createExport(payload);
      const exp = res.export;
      setExportSuccess(exp);
      showToast(`📦 Exportación completada: ${exp.filename}`);

      // Descargar archivo automáticamente
      await knowledgeApiService.downloadExportZip(exp.download_url, exp.filename);
    } catch (err) {
      console.error('Error generando exportación:', err);
      showToast('❌ Error al generar el paquete de exportación');
    } finally {
      setIsExporting(false);
    }
  };

  // Filtrado de categorías para selección múltiple
  const filteredCategoriesForMulti = allCategoriesFlat.filter(c => {
    if (!subcatSearch.trim()) return true;
    const q = subcatSearch.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.area_name.toLowerCase().includes(q);
  });

  const selectedCategoryObj = allCategoriesFlat.find(c => String(c.id) === String(selectedCategoryId));

  return (
    <Overlay onClick={closeExportModal}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        {/* Cabecera */}
        <ModalHeader>
          <HeaderLeft>
            <HeaderIconWrapper>
              <Archive size={20} color="#a78bfa" />
            </HeaderIconWrapper>
            <div>
              <ModalTitle>Exportador de Conocimiento</ModalTitle>
              <ModalSubtitle>Genera un paquete consolidado en Markdown, adjuntos y grafo</ModalSubtitle>
            </div>
          </HeaderLeft>
          <CloseButton onClick={closeExportModal}>
            <X size={18} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          {/* 1. Selección de Ámbito de Exportación */}
          <Section>
            <SectionHeaderRow>
              <SectionLabel>
                <FolderTree size={15} color="#8b5cf6" />
                1. Ámbito de Exportación
              </SectionLabel>
              {scopeMode === 'multiple' && (
                <SelectedBadge>
                  {selectedCategoryIds.length} seleccionadas
                </SelectedBadge>
              )}
            </SectionHeaderRow>

            {/* Selector de modo de ámbito */}
            <ScopeTabs>
              <ScopeTabBtn
                $active={scopeMode === 'area'}
                onClick={() => setScopeMode('area')}
                type="button"
              >
                <Globe size={14} /> Área Completa (Macro)
              </ScopeTabBtn>
              <ScopeTabBtn
                $active={scopeMode === 'category'}
                onClick={() => setScopeMode('category')}
                type="button"
              >
                <FolderTree size={14} /> Categoría Individual
              </ScopeTabBtn>
              <ScopeTabBtn
                $active={scopeMode === 'multiple'}
                onClick={() => setScopeMode('multiple')}
                type="button"
              >
                <CheckSquare size={14} /> Selección Múltiple
              </ScopeTabBtn>
            </ScopeTabs>

            {/* MODO A: ÁREA COMPLETA */}
            {scopeMode === 'area' && (
              <AreaScopeContainer>
                <ScopeHelpText>
                  Exporta una categoría grande o área temática completa con todas sus categorías, subcategorías y notas asociadas.
                </ScopeHelpText>
                <AreaCardsGrid>
                  {areas.map(area => {
                    const isSelected = String(area.id) === String(selectedAreaId);
                    return (
                      <AreaCardItem
                        key={area.id}
                        $selected={isSelected}
                        $color={area.color}
                        onClick={() => setSelectedAreaId(String(area.id))}
                        type="button"
                      >
                        <AreaCardTop>
                          <AreaCardDot $color={area.color} />
                          <AreaCardTitle>{area.name}</AreaCardTitle>
                          {isSelected && <Check size={14} color="#8b5cf6" />}
                        </AreaCardTop>
                        <AreaCardMeta>
                          {area.categories?.length || 0} categorías contenidas
                        </AreaCardMeta>
                      </AreaCardItem>
                    );
                  })}
                </AreaCardsGrid>
              </AreaScopeContainer>
            )}

            {/* MODO B: CATEGORÍA INDIVIDUAL */}
            {scopeMode === 'category' && (
              <>
                <FormGroup>
                  <SelectInput
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    disabled={isExporting}
                  >
                    {areas.map(a => (
                      <optgroup key={a.id} label={a.name}>
                        {(a.categories || []).map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </SelectInput>
                </FormGroup>

                {selectedCategoryObj && (
                  <HierarchyBreadcrumb>
                    <AreaTag $color={selectedCategoryObj.area_color}>
                      {selectedCategoryObj.area_name}
                    </AreaTag>
                    <ChevronRight size={13} color="#64748b" />
                    <CategoryHighlight>{selectedCategoryObj.name}</CategoryHighlight>
                  </HierarchyBreadcrumb>
                )}

                <CheckboxItem>
                  <Checkbox
                    type="checkbox"
                    id="includeSubcategories"
                    checked={includeSubcategories}
                    onChange={(e) => setIncludeSubcategories(e.target.checked)}
                    disabled={isExporting}
                  />
                  <CheckboxLabel htmlFor="includeSubcategories">
                    Incluir subcategorías anidadas automáticamente
                  </CheckboxLabel>
                </CheckboxItem>
              </>
            )}

            {/* MODO C: SELECCIÓN MÚLTIPLE DE SUBCATEGORÍAS */}
            {scopeMode === 'multiple' && (
              <MultiSelectContainer>
                <MultiSelectToolbar>
                  <SearchSubcatWrapper>
                    <Search size={13} color="#94a3b8" />
                    <SearchSubcatInput
                      type="text"
                      placeholder="Filtrar categorías..."
                      value={subcatSearch}
                      onChange={(e) => setSubcatSearch(e.target.value)}
                    />
                    {subcatSearch && (
                      <ClearBtn onClick={() => setSubcatSearch('')}>×</ClearBtn>
                    )}
                  </SearchSubcatWrapper>

                  <ToolbarActions>
                    <ToolbarBtn type="button" onClick={selectAllCategories}>
                      Seleccionar todas
                    </ToolbarBtn>
                    <ToolbarBtn type="button" onClick={clearCategorySelection}>
                      Limpiar
                    </ToolbarBtn>
                  </ToolbarActions>
                </MultiSelectToolbar>

                <ChecklistScroll>
                  {areas.map(area => {
                    const areaCats = filteredCategoriesForMulti.filter(c => String(c.area_id) === String(area.id));
                    if (areaCats.length === 0) return null;

                    const allAreaSelected = areaCats.every(c => selectedCategoryIds.includes(c.id));

                    return (
                      <AreaGroupBlock key={area.id}>
                        <AreaGroupHeader>
                          <AreaGroupTitle>
                            <AreaCardDot $color={area.color} />
                            <span>{area.name}</span>
                          </AreaGroupTitle>
                          <AreaQuickToggleBtn
                            type="button"
                            onClick={() => allAreaSelected ? deselectAllInArea(area.id) : selectAllInArea(area.id)}
                          >
                            {allAreaSelected ? 'Deseleccionar área' : 'Marcar área'}
                          </AreaQuickToggleBtn>
                        </AreaGroupHeader>

                        <CategoryChecklistGrid>
                          {areaCats.map(cat => {
                            const isChecked = selectedCategoryIds.includes(cat.id);
                            return (
                              <CategoryCheckItem
                                key={cat.id}
                                $checked={isChecked}
                                onClick={() => toggleCategorySelection(cat.id)}
                              >
                                <Checkbox
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}} // Manejado por onClick del contenedor
                                />
                                <CategoryCheckLabel>{cat.name}</CategoryCheckLabel>
                              </CategoryCheckItem>
                            );
                          })}
                        </CategoryChecklistGrid>
                      </AreaGroupBlock>
                    );
                  })}
                </ChecklistScroll>

                <CheckboxItem style={{ marginTop: '0.6rem' }}>
                  <Checkbox
                    type="checkbox"
                    id="includeSubcategoriesMulti"
                    checked={includeSubcategories}
                    onChange={(e) => setIncludeSubcategories(e.target.checked)}
                    disabled={isExporting}
                  />
                  <CheckboxLabel htmlFor="includeSubcategoriesMulti">
                    Incluir automáticamente cualquier subcategoría anidada bajo las seleccionadas
                  </CheckboxLabel>
                </CheckboxItem>
              </MultiSelectContainer>
            )}
          </Section>

          {/* 2. Formato de Exportación */}
          <Section>
            <SectionLabel>
              <FileText size={15} color="#3b82f6" />
              2. Formato de Salida
            </SectionLabel>
            <FormatCard $selected={true}>
              <FormatHeader>
                <FormatIconWrapper>
                  <FileText size={18} color="#60a5fa" />
                </FormatIconWrapper>
                <div>
                  <FormatTitle>Single Consolidated Markdown (.md + ZIP)</FormatTitle>
                  <FormatDesc>
                    Un único documento Markdown estructurado con índice interactivo, metadatos y carpeta de adjuntos.
                  </FormatDesc>
                </div>
              </FormatHeader>
            </FormatCard>
          </Section>

          {/* 3. Opciones de Contenido */}
          <Section>
            <SectionLabel>
              <Layers size={15} color="#10b981" />
              3. Opciones de Contenido
            </SectionLabel>

            <OptionsGrid>
              <OptionCheckboxCard $checked={includeAttachments}>
                <Checkbox
                  type="checkbox"
                  id="includeAttachments"
                  checked={includeAttachments}
                  onChange={(e) => setIncludeAttachments(e.target.checked)}
                  disabled={isExporting}
                />
                <OptionInfo htmlFor="includeAttachments">
                  <OptionTitleRow>
                    <Paperclip size={14} color="#60a5fa" />
                    <OptionTitle>Incluir Archivos Adjuntos</OptionTitle>
                  </OptionTitleRow>
                  <OptionDesc>
                    Empaqueta imágenes, PDFs y documentos en carpetas relativas portables.
                  </OptionDesc>
                </OptionInfo>
              </OptionCheckboxCard>

              <OptionCheckboxCard $checked={includeRelationships}>
                <Checkbox
                  type="checkbox"
                  id="includeRelationships"
                  checked={includeRelationships}
                  onChange={(e) => setIncludeRelationships(e.target.checked)}
                  disabled={isExporting}
                />
                <OptionInfo htmlFor="includeRelationships">
                  <OptionTitleRow>
                    <Network size={14} color="#34d399" />
                    <OptionTitle>Preservar Relaciones</OptionTitle>
                  </OptionTitleRow>
                  <OptionDesc>
                    Enlaces internos navegables por ancla y referencias contextuales externas.
                  </OptionDesc>
                </OptionInfo>
              </OptionCheckboxCard>

              <OptionCheckboxCard $checked={generateAiSummaries}>
                <Checkbox
                  type="checkbox"
                  id="generateAiSummaries"
                  checked={generateAiSummaries}
                  onChange={(e) => setGenerateAiSummaries(e.target.checked)}
                  disabled={isExporting}
                />
                <OptionInfo htmlFor="generateAiSummaries">
                  <OptionTitleRow>
                    <Sparkles size={14} color="#ec4899" />
                    <OptionTitle>Generar Resúmenes con IA</OptionTitle>
                  </OptionTitleRow>
                  <OptionDesc>
                    Crea una síntesis general del ámbito y resúmenes para cada nota.
                  </OptionDesc>
                </OptionInfo>
              </OptionCheckboxCard>
            </OptionsGrid>
          </Section>

          {/* 4. Vista Previa del Paquete */}
          <Section>
            <SectionLabel>
              <Archive size={15} color="#f59e0b" />
              4. Vista Previa del Paquete
            </SectionLabel>

            {loadingPreview ? (
              <PreviewLoading>
                <Loader2 size={18} className="spin" />
                <span>Calculando elementos y tamaño del paquete...</span>
              </PreviewLoading>
            ) : previewData ? (
              <PreviewStatsGrid>
                <StatBox>
                  <StatValue>{previewData.note_count}</StatValue>
                  <StatLabel>Notas</StatLabel>
                </StatBox>
                <StatBox>
                  <StatValue>{previewData.categories_count || (previewData.subcategories?.length || 1)}</StatValue>
                  <StatLabel>Categorías</StatLabel>
                </StatBox>
                <StatBox>
                  <StatValue>{includeRelationships ? previewData.relationship_count : 0}</StatValue>
                  <StatLabel>Relaciones</StatLabel>
                </StatBox>
                <StatBox>
                  <StatValue>{includeAttachments ? previewData.attachment_count : 0}</StatValue>
                  <StatLabel>Adjuntos</StatLabel>
                </StatBox>
                <StatBox>
                  <StatValue>{previewData.estimated_size_formatted}</StatValue>
                  <StatLabel>Tamaño Est.</StatLabel>
                </StatBox>
              </PreviewStatsGrid>
            ) : (
              <PreviewEmpty>Selecciona al menos una categoría o área para calcular la vista previa.</PreviewEmpty>
            )}
          </Section>

          {/* Notificación de éxito si ya se generó */}
          {exportSuccess && (
            <SuccessBanner>
              <CheckCircle2 size={18} color="#10b981" />
              <div>
                <strong>Paquete ZIP generado exitosamente:</strong> {exportSuccess.filename} ({exportSuccess.size_formatted}).
              </div>
            </SuccessBanner>
          )}
        </ModalBody>

        {/* Footer y Acciones */}
        <ModalFooter>
          <CancelButton type="button" onClick={closeExportModal} disabled={isExporting}>
            Cerrar
          </CancelButton>
          <GenerateButton
            type="button"
            onClick={handleGenerateExport}
            disabled={isExporting || (previewData && previewData.note_count === 0) || !previewData}
          >
            {isExporting ? (
              <>
                <Loader2 size={16} className="spin" />
                <span>Empaquetando Conocimiento...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Generar y Descargar Exportación</span>
              </>
            )}
          </GenerateButton>
        </ModalFooter>
      </ModalContainer>
    </Overlay>
  );
};

// ─── Estilos ─────────────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(10, 15, 30, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.5rem;
  animation: fadeIn 0.15s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContainer = styled.div`
  background: #0f172a;
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 14px;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(30, 41, 59, 0.4);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.85rem;
`;

const HeaderIconWrapper = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalTitle = styled.h2`
  font-size: 1.15rem;
  font-weight: 600;
  color: #f8fafc;
  margin: 0;
`;

const ModalSubtitle = styled.p`
  font-size: 0.78rem;
  color: #94a3b8;
  margin: 0.15rem 0 0;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.4rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  &:hover {
    color: white;
    background: rgba(255, 255, 255, 0.05);
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SectionHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SectionLabel = styled.label`
  font-size: 0.82rem;
  font-weight: 600;
  color: #e2e8f0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SelectedBadge = styled.span`
  font-size: 0.75rem;
  color: #c4b5fd;
  background: rgba(139, 92, 246, 0.2);
  border: 1px solid rgba(139, 92, 246, 0.4);
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  font-weight: 500;
`;

const ScopeTabs = styled.div`
  display: flex;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 3px;
  gap: 3px;
`;

const ScopeTabBtn = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.45rem 0.75rem;
  border-radius: 6px;
  font-size: 0.78rem;
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

const ScopeHelpText = styled.p`
  font-size: 0.76rem;
  color: #94a3b8;
  margin: 0.2rem 0 0.5rem;
`;

const AreaScopeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const AreaCardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.6rem;
`;

const AreaCardItem = styled.button`
  background: ${props => props.$selected ? 'rgba(139, 92, 246, 0.2)' : 'rgba(30, 41, 59, 0.4)'};
  border: 1px solid ${props => props.$selected ? '#8b5cf6' : 'rgba(255, 255, 255, 0.08)'};
  border-radius: 8px;
  padding: 0.65rem 0.85rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;

  &:hover {
    border-color: rgba(139, 92, 246, 0.5);
    background: rgba(139, 92, 246, 0.1);
  }
`;

const AreaCardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

const AreaCardDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$color || '#8b5cf6'};
  flex-shrink: 0;
`;

const AreaCardTitle = styled.span`
  font-size: 0.82rem;
  font-weight: 600;
  color: #f8fafc;
  flex: 1;
`;

const AreaCardMeta = styled.span`
  font-size: 0.7rem;
  color: #94a3b8;
`;

const MultiSelectContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 0.75rem;
`;

const MultiSelectToolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const SearchSubcatWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 0.25rem 0.55rem;
  flex: 1;
  min-width: 160px;
`;

const SearchSubcatInput = styled.input`
  background: transparent;
  border: none;
  color: #f8fafc;
  font-size: 0.76rem;
  outline: none;
  width: 100%;
  &::placeholder {
    color: #64748b;
  }
`;

const ClearBtn = styled.button`
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.8rem;
`;

const ToolbarActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const ToolbarBtn = styled.button`
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
  padding: 0.25rem 0.55rem;
  border-radius: 4px;
  font-size: 0.72rem;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: #334155;
    color: white;
  }
`;

const ChecklistScroll = styled.div`
  max-height: 180px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-right: 0.25rem;
`;

const AreaGroupBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const AreaGroupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`;

const AreaGroupTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.74rem;
  font-weight: 600;
  color: #cbd5e1;
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const AreaQuickToggleBtn = styled.button`
  background: transparent;
  border: none;
  color: #8b5cf6;
  font-size: 0.68rem;
  cursor: pointer;
  padding: 0;
  &:hover {
    text-decoration: underline;
  }
`;

const CategoryChecklistGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.35rem;
`;

const CategoryCheckItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.5rem;
  border-radius: 5px;
  background: ${props => props.$checked ? 'rgba(139, 92, 246, 0.15)' : 'rgba(30, 41, 59, 0.3)'};
  border: 1px solid ${props => props.$checked ? 'rgba(139, 92, 246, 0.3)' : 'transparent'};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: rgba(139, 92, 246, 0.12);
  }
`;

const CategoryCheckLabel = styled.span`
  font-size: 0.76rem;
  color: #e2e8f0;
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const SelectInput = styled.select`
  width: 100%;
  padding: 0.6rem 0.85rem;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #f8fafc;
  font-size: 0.85rem;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;

  &:focus {
    border-color: #8b5cf6;
  }

  optgroup {
    background: #0f172a;
    color: #94a3b8;
    font-weight: 600;
  }

  option {
    background: #1e293b;
    color: #f8fafc;
  }
`;

const HierarchyBreadcrumb = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.76rem;
  color: #94a3b8;
  padding: 0.35rem 0.6rem;
  background: rgba(30, 41, 59, 0.4);
  border-radius: 6px;
  width: fit-content;
`;

const AreaTag = styled.span`
  color: ${props => props.$color || '#8b5cf6'};
  font-weight: 500;
`;

const CategoryHighlight = styled.span`
  color: #f8fafc;
  font-weight: 600;
`;

const CheckboxItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
`;

const Checkbox = styled.input`
  width: 15px;
  height: 15px;
  accent-color: #8b5cf6;
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  font-size: 0.78rem;
  color: #cbd5e1;
  cursor: pointer;
  user-select: none;
`;

const FormatCard = styled.div`
  background: ${props => props.$selected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(30, 41, 59, 0.4)'};
  border: 1px solid ${props => props.$selected ? '#3b82f6' : 'rgba(255, 255, 255, 0.08)'};
  border-radius: 10px;
  padding: 0.85rem;
`;

const FormatHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
`;

const FormatIconWrapper = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: rgba(59, 130, 246, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const FormatTitle = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: #f8fafc;
`;

const FormatDesc = styled.div`
  font-size: 0.74rem;
  color: #94a3b8;
  margin-top: 0.2rem;
  line-height: 1.35;
`;

const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.6rem;
`;

const OptionCheckboxCard = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 0.85rem;
  background: ${props => props.$checked ? 'rgba(139, 92, 246, 0.08)' : 'rgba(30, 41, 59, 0.3)'};
  border: 1px solid ${props => props.$checked ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.06)'};
  border-radius: 8px;
  transition: all 0.2s;
`;

const OptionInfo = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  cursor: pointer;
  user-select: none;
`;

const OptionTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const OptionTitle = styled.span`
  font-size: 0.82rem;
  font-weight: 600;
  color: #f8fafc;
`;

const OptionDesc = styled.span`
  font-size: 0.72rem;
  color: #94a3b8;
  line-height: 1.3;
`;

const PreviewLoading = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.8rem;
  color: #94a3b8;
  padding: 1rem;
  background: rgba(30, 41, 59, 0.4);
  border-radius: 8px;
  justify-content: center;

  .spin {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const PreviewStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
`;

const StatBox = styled.div`
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 0.65rem 0.4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.05rem;
  font-weight: 700;
  color: #f8fafc;
`;

const StatLabel = styled.div`
  font-size: 0.68rem;
  color: #94a3b8;
  text-transform: uppercase;
  margin-top: 0.15rem;
`;

const PreviewEmpty = styled.div`
  font-size: 0.78rem;
  color: #64748b;
  font-style: italic;
  padding: 0.75rem;
  text-align: center;
  background: rgba(30, 41, 59, 0.2);
  border-radius: 8px;
`;

const SuccessBanner = styled.div`
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.4);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.8rem;
  color: #34d399;
`;

const ModalFooter = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.75rem;
  background: rgba(30, 41, 59, 0.4);
`;

const CancelButton = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #cbd5e1;
  padding: 0.55rem 1rem;
  border-radius: 8px;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s;
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.05);
    color: white;
  }
`;

const GenerateButton = styled.button`
  background: #8b5cf6;
  border: none;
  color: white;
  padding: 0.55rem 1.25rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(139, 92, 246, 0.35);

  &:hover:not(:disabled) {
    background: #7c3aed;
    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }

  .spin {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

export default ExportModal;
