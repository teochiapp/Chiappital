// src/modules/knowledge/pages/CategoriesPage.jsx - Gestión de Áreas y Categorías Jerárquicas
import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  Folder,
  Code,
  DollarSign,
  Compass,
  Landmark,
  BookOpen,
  Palette,
  FileText,
  X,
  Check,
  ArrowRight,
  Download
} from 'lucide-react';
import { useKnowledge } from '../context/KnowledgeContext';
import knowledgeApiService from '../services/knowledgeApiService';

const ICON_OPTIONS = ['Folder', 'Code', 'DollarSign', 'Compass', 'Landmark', 'BookOpen'];
const COLOR_OPTIONS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#f97316', '#64748b'];

const getIconComponent = (name) => {
  const map = {
    Code,
    DollarSign,
    Compass,
    Landmark,
    BookOpen,
    Folder
  };
  return map[name] || Folder;
};

const CategoriesPage = () => {
  const navigate = useNavigate();
  const { areas, refreshAll, showToast, openExportModal } = useKnowledge();

  // Estados de modales de creación / edición
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [areaName, setAreaName] = useState('');
  const [areaDesc, setAreaDesc] = useState('');
  const [areaIcon, setAreaIcon] = useState('Folder');
  const [areaColor, setAreaColor] = useState('#8b5cf6');

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');
  const [categoryAreaId, setCategoryAreaId] = useState('');

  // Abrir modal de área (nueva o editar)
  const openAreaModal = (area = null) => {
    if (area) {
      setEditingArea(area);
      setAreaName(area.name);
      setAreaDesc(area.description || '');
      setAreaIcon(area.icon || 'Folder');
      setAreaColor(area.color || '#8b5cf6');
    } else {
      setEditingArea(null);
      setAreaName('');
      setAreaDesc('');
      setAreaIcon('Folder');
      setAreaColor('#8b5cf6');
    }
    setIsAreaModalOpen(true);
  };

  // Guardar Área
  const handleSaveArea = async (e) => {
    e.preventDefault();
    if (!areaName.trim()) return;

    try {
      if (editingArea) {
        await knowledgeApiService.updateArea(editingArea.id, {
          name: areaName.trim(),
          description: areaDesc,
          icon: areaIcon,
          color: areaColor
        });
        showToast('✅ Área actualizada');
      } else {
        await knowledgeApiService.createArea({
          name: areaName.trim(),
          description: areaDesc,
          icon: areaIcon,
          color: areaColor
        });
        showToast('✨ Nueva área de conocimiento creada');
      }
      setIsAreaModalOpen(false);
      refreshAll();
    } catch (err) {
      console.error(err);
      showToast('❌ Error al guardar área');
    }
  };

  // Eliminar Área
  const handleDeleteArea = async (areaId) => {
    if (!window.confirm('¿Eliminar esta área? Las notas asociadas se conservarán intactas.')) return;
    try {
      await knowledgeApiService.deleteArea(areaId);
      showToast('🗑️ Área eliminada (notas conservadas)');
      refreshAll();
    } catch (err) {
      console.error(err);
      showToast('❌ Error al eliminar área');
    }
  };

  // Abrir modal de categoría
  const openCategoryModal = (targetAreaId, category = null) => {
    setCategoryAreaId(targetAreaId);
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
      setCategoryDesc(category.description || '');
    } else {
      setEditingCategory(null);
      setCategoryName('');
      setCategoryDesc('');
    }
    setIsCategoryModalOpen(true);
  };

  // Guardar Categoría
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim() || !categoryAreaId) return;

    try {
      if (editingCategory) {
        await knowledgeApiService.updateCategory(editingCategory.id, {
          name: categoryName.trim(),
          description: categoryDesc,
          area_id: categoryAreaId
        });
        showToast('✅ Categoría actualizada');
      } else {
        await knowledgeApiService.createCategory({
          name: categoryName.trim(),
          description: categoryDesc,
          area_id: categoryAreaId
        });
        showToast('✨ Categoría creada');
      }
      setIsCategoryModalOpen(false);
      refreshAll();
    } catch (err) {
      console.error(err);
      showToast('❌ Error al guardar categoría');
    }
  };

  // Eliminar Categoría
  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('¿Eliminar categoría? Las notas de esta categoría no se borrarán.')) return;
    try {
      await knowledgeApiService.deleteCategory(catId);
      showToast('🗑️ Categoría eliminada');
      refreshAll();
    } catch (err) {
      console.error(err);
      showToast('❌ Error al eliminar categoría');
    }
  };

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <Title>Estructura de Conocimiento</Title>
          <Subtitle>Áreas principales, categorías y organización de tu Second Brain</Subtitle>
        </div>
        <HeaderButtonsRow>
          <ExportCategoryHeaderBtn onClick={() => openExportModal()}>
            <Download size={15} /> Exportar Categoría
          </ExportCategoryHeaderBtn>
          <NewAreaButton onClick={() => openAreaModal()}>
            <Plus size={16} /> Nueva Área
          </NewAreaButton>
        </HeaderButtonsRow>
      </PageHeader>

      {/* Grid de Áreas */}
      <AreasContainer>
        {areas.map((area) => {
          const AreaIcon = getIconComponent(area.icon);
          const categories = area.categories || [];

          return (
            <AreaBlock key={area.id} $color={area.color}>
              <AreaHeader>
                <AreaTitleWrapper>
                  <IconWrapper $color={area.color}>
                    <AreaIcon size={20} />
                  </IconWrapper>
                  <div>
                    <AreaName>{area.name}</AreaName>
                    <AreaMeta>{area.notes_count || 0} notas • {categories.length} categorías</AreaMeta>
                  </div>
                </AreaTitleWrapper>

                <AreaActions>
                  <ActionIconButton onClick={() => openAreaModal(area)} title="Editar área">
                    <Edit2 size={15} />
                  </ActionIconButton>
                  <ActionIconButton onClick={() => handleDeleteArea(area.id)} title="Eliminar área" $danger>
                    <Trash2 size={15} />
                  </ActionIconButton>
                </AreaActions>
              </AreaHeader>

              {area.description && <AreaDescription>{area.description}</AreaDescription>}

              {/* Lista de Categorías */}
              <CategoriesList>
                {categories.map((cat) => (
                  <CategoryRow key={cat.id}>
                    <CategoryInfo onClick={() => navigate(`/personal/knowledge/notes?category_id=${cat.id}`)}>
                      <ChevronRight size={14} color="#8b5cf6" />
                      <CategoryName>{cat.name}</CategoryName>
                      <CategoryNotesCount>{cat.notes_count || 0} notas</CategoryNotesCount>
                    </CategoryInfo>

                    <CategoryActions>
                      <MiniBtn onClick={() => openExportModal(cat)} title="Exportar esta categoría a Markdown consolidado">
                        <Download size={12} />
                      </MiniBtn>
                      <MiniBtn onClick={() => openCategoryModal(area.id, cat)} title="Editar">
                        <Edit2 size={12} />
                      </MiniBtn>
                      <MiniBtn onClick={() => handleDeleteCategory(cat.id)} title="Eliminar" $danger>
                        <Trash2 size={12} />
                      </MiniBtn>
                    </CategoryActions>
                  </CategoryRow>
                ))}

                {/* Botón para agregar subcategoría */}
                <AddCategoryRowBtn onClick={() => openCategoryModal(area.id)}>
                  <Plus size={14} /> Agregar Subcategoría a {area.name}
                </AddCategoryRowBtn>
              </CategoriesList>
            </AreaBlock>
          );
        })}
      </AreasContainer>

      {/* ─── MODAL ÁREA ────────────────────────────────────────────────────── */}
      {isAreaModalOpen && (
        <ModalOverlay onClick={() => setIsAreaModalOpen(false)}>
          <ModalBox onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>{editingArea ? 'Editar Área de Conocimiento' : 'Nueva Área de Conocimiento'}</h3>
              <CloseBtn onClick={() => setIsAreaModalOpen(false)}>
                <X size={18} />
              </CloseBtn>
            </ModalHeader>

            <ModalForm onSubmit={handleSaveArea}>
              <FormGroup>
                <Label>Nombre del Área *</Label>
                <Input
                  type="text"
                  placeholder="Ej: Finanzas, Programación, Filosofía..."
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  required
                  autoFocus
                />
              </FormGroup>

              <FormGroup>
                <Label>Descripción</Label>
                <Input
                  type="text"
                  placeholder="Breve propósito de esta área..."
                  value={areaDesc}
                  onChange={(e) => setAreaDesc(e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label>Color Distintivo</Label>
                <ColorsGrid>
                  {COLOR_OPTIONS.map((c) => (
                    <ColorOption
                      key={c}
                      $color={c}
                      $selected={areaColor === c}
                      type="button"
                      onClick={() => setAreaColor(c)}
                    >
                      {areaColor === c && <Check size={14} color="white" />}
                    </ColorOption>
                  ))}
                </ColorsGrid>
              </FormGroup>

              <FormGroup>
                <Label>Icono</Label>
                <IconsGrid>
                  {ICON_OPTIONS.map((iconName) => {
                    const Comp = getIconComponent(iconName);
                    return (
                      <IconOption
                        key={iconName}
                        $selected={areaIcon === iconName}
                        type="button"
                        onClick={() => setAreaIcon(iconName)}
                      >
                        <Comp size={18} />
                      </IconOption>
                    );
                  })}
                </IconsGrid>
              </FormGroup>

              <ModalFooter>
                <CancelBtn type="button" onClick={() => setIsAreaModalOpen(false)}>
                  Cancelar
                </CancelBtn>
                <SaveBtn type="submit">
                  {editingArea ? 'Guardar Cambios' : 'Crear Área'}
                </SaveBtn>
              </ModalFooter>
            </ModalForm>
          </ModalBox>
        </ModalOverlay>
      )}

      {/* ─── MODAL CATEGORÍA ───────────────────────────────────────────────── */}
      {isCategoryModalOpen && (
        <ModalOverlay onClick={() => setIsCategoryModalOpen(false)}>
          <ModalBox onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>{editingCategory ? 'Editar Categoría' : 'Nueva Subcategoría'}</h3>
              <CloseBtn onClick={() => setIsCategoryModalOpen(false)}>
                <X size={18} />
              </CloseBtn>
            </ModalHeader>

            <ModalForm onSubmit={handleSaveCategory}>
              <FormGroup>
                <Label>Nombre de la Categoría *</Label>
                <Input
                  type="text"
                  placeholder="Ej: Frontend Development, Macroeconomía..."
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                  autoFocus
                />
              </FormGroup>

              <FormGroup>
                <Label>Descripción (Opcional)</Label>
                <Input
                  type="text"
                  placeholder="Detalles sobre este tema..."
                  value={categoryDesc}
                  onChange={(e) => setCategoryDesc(e.target.value)}
                />
              </FormGroup>

              <ModalFooter>
                <CancelBtn type="button" onClick={() => setIsCategoryModalOpen(false)}>
                  Cancelar
                </CancelBtn>
                <SaveBtn type="submit">
                  {editingCategory ? 'Guardar Cambios' : 'Crear Subcategoría'}
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

const HeaderButtonsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ExportCategoryHeaderBtn = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(139, 92, 246, 0.35);
  color: #c4b5fd;
  padding: 0.5rem 0.95rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: rgba(139, 92, 246, 0.15);
    border-color: #8b5cf6;
    color: white;
  }
`;

const NewAreaButton = styled.button`
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

const AreasContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 1.5rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const AreaBlock = styled.div`
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-top: 3px solid ${props => props.$color || '#8b5cf6'};
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const AreaHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const AreaTitleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const IconWrapper = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: ${props => `${props.$color}20`};
  color: ${props => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AreaName = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #f8fafc;
  margin: 0;
`;

const AreaMeta = styled.span`
  font-size: 0.74rem;
  color: #94a3b8;
`;

const AreaActions = styled.div`
  display: flex;
  gap: 0.35rem;
`;

const ActionIconButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.$danger ? '#ef4444' : '#94a3b8'};
  padding: 0.3rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: ${props => props.$danger ? '#f87171' : 'white'};
  }
`;

const AreaDescription = styled.p`
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 0;
  line-height: 1.4;
`;

const CategoriesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

const CategoryRow = styled.div`
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.15s;
  &:hover {
    background: rgba(30, 41, 59, 0.8);
    border-color: rgba(139, 92, 246, 0.3);
  }
`;

const CategoryInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  flex: 1;
`;

const CategoryName = styled.span`
  font-size: 0.84rem;
  font-weight: 500;
  color: #f1f5f9;
`;

const CategoryNotesCount = styled.span`
  font-size: 0.7rem;
  color: #64748b;
  margin-left: 0.5rem;
`;

const CategoryActions = styled.div`
  display: flex;
  gap: 0.2rem;
`;

const MiniBtn = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.$danger ? '#ef4444' : '#64748b'};
  padding: 0.2rem;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    color: ${props => props.$danger ? '#f87171' : 'white'};
  }
`;

const AddCategoryRowBtn = styled.button`
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  color: #a78bfa;
  padding: 0.45rem;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  transition: all 0.2s;
  &:hover {
    background: rgba(139, 92, 246, 0.1);
    border-color: #8b5cf6;
    color: white;
  }
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
  max-width: 480px;
  padding: 1.25rem;
  color: #f8fafc;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  h3 { margin: 0; font-size: 1.05rem; }
`;

const CloseBtn = styled.button`
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
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
  &:focus {
    border-color: #8b5cf6;
  }
`;

const ColorsGrid = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const ColorOption = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: ${props => props.$color};
  border: 2px solid ${props => props.$selected ? 'white' : 'transparent'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const IconsGrid = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const IconOption = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background: ${props => props.$selected ? 'rgba(139, 92, 246, 0.25)' : '#1e293b'};
  border: 1px solid ${props => props.$selected ? '#8b5cf6' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.$selected ? '#c4b5fd' : '#94a3b8'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
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

export default CategoriesPage;
