// src/modules/knowledge/pages/NotesPage.jsx - Workspace de Notas estilo Obsidian (3 columnas)
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import {
  FileText,
  Plus,
  Search,
  Star,
  Pin,
  Trash2,
  Save,
  Clock,
  Eye,
  Edit3,
  Columns,
  FolderTree,
  Tag,
  Paperclip,
  Network,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  CheckSquare,
  Code,
  Quote,
  Table as TableIcon,
  Link as LinkIcon,
  ExternalLink,
  History,
  RotateCcw,
  X,
  UploadCloud,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { useKnowledge } from '../context/KnowledgeContext';
import knowledgeApiService from '../services/knowledgeApiService';

const NotesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { areas, refreshAll, showToast } = useKnowledge();

  // Estados de navegación y filtros
  const noteIdParam = searchParams.get('noteId');
  const areaFilter = searchParams.get('area_id');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Lista de notas
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(true);

  // Nota activa actual
  const [activeNote, setActiveNote] = useState(null);
  const [loadingActiveNote, setLoadingActiveNote] = useState(false);

  // Campos del editor
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [primaryCategoryId, setPrimaryCategoryId] = useState('');
  const [noteAreaIds, setNoteAreaIds] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Layout y columnas (responsive)
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [editorMode, setEditorMode] = useState('split'); // 'edit' | 'preview' | 'split'

  // Modal / Paneles secundarios
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [versions, setVersions] = useState([]);
  const [isAddRelationOpen, setIsAddRelationOpen] = useState(false);
  const [relationTargetId, setRelationTargetId] = useState('');
  const [relationType, setRelationType] = useState('related_to');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingAi, setLoadingAi] = useState(false);

  // Autocompletado de Obsidian [[
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [autocompleteCursor, setAutocompleteCursor] = useState({ start: 0, end: 0 });
  const editorTextareaRef = useRef(null);

  // Cargar lista de notas
  const fetchNotes = useCallback(async () => {
    setLoadingNotes(true);
    try {
      const res = await knowledgeApiService.getNotes({
        search: searchQuery,
        area_id: areaFilter,
        tag: selectedTag,
        is_favorite: onlyFavorites ? '1' : undefined,
      });
      setNotes(res.notes || []);

      // Si no hay nota seleccionada o la que estaba ya no existe, seleccionar la primera
      if (res.notes && res.notes.length > 0) {
        if (!noteIdParam) {
          setSearchParams({ noteId: res.notes[0].id });
        }
      }
    } catch (err) {
      console.error('Error cargando notas:', err);
    } finally {
      setLoadingNotes(false);
    }
  }, [searchQuery, areaFilter, selectedTag, onlyFavorites, noteIdParam, setSearchParams]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Cargar detalle de la nota activa seleccionada
  const fetchActiveNote = useCallback(async (id) => {
    if (!id) return;
    setLoadingActiveNote(true);
    try {
      const res = await knowledgeApiService.getNote(id);
      const n = res.note;
      setActiveNote(n);
      setTitle(n.title || '');
      setContent(n.content || '');
      setPrimaryCategoryId(n.primary_category_id || '');
      setNoteAreaIds((n.secondary_areas || []).map(a => a.id));
      setTags((n.tags || []).map(t => t.name));
      setIsFavorite(!!n.is_favorite);
      setIsPinned(!!n.pinned);
      setLastSaved(new Date(n.updated_at));
    } catch (err) {
      console.error('Error cargando nota activa:', err);
    } finally {
      setLoadingActiveNote(false);
    }
  }, []);

  useEffect(() => {
    if (noteIdParam) {
      fetchActiveNote(noteIdParam);
    }
  }, [noteIdParam, fetchActiveNote]);

  // Guardar nota (Auto-save o Manual)
  const saveNote = async (overrideData = {}) => {
    if (!activeNote) return;
    setIsSaving(true);
    try {
      const payload = {
        title: overrideData.title !== undefined ? overrideData.title : title,
        content: overrideData.content !== undefined ? overrideData.content : content,
        primary_category_id: overrideData.primaryCategoryId !== undefined ? overrideData.primaryCategoryId : primaryCategoryId,
        area_ids: noteAreaIds,
        tags: overrideData.tags !== undefined ? overrideData.tags : tags,
        is_favorite: isFavorite,
        pinned: isPinned,
      };
      await knowledgeApiService.updateNote(activeNote.id, payload);
      setLastSaved(new Date());

      // Actualizar en la lista local de notas
      setNotes(prev => prev.map(n => n.id === activeNote.id ? { ...n, title: payload.title, preview: payload.content.substring(0, 100) } : n));
    } catch (err) {
      console.error('Error guardando nota:', err);
      showToast('❌ Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  // Debounced auto-save para el contenido
  const timeoutRef = useRef(null);
  const handleContentChange = (newContent) => {
    setContent(newContent);
    handleWikiLinkTrigger(newContent);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      saveNote({ content: newContent });
    }, 1500);
  };

  // Manejar trigger de autocompletado [[ al escribir
  const handleWikiLinkTrigger = (text) => {
    const textarea = editorTextareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastOpenIndex = textBeforeCursor.lastIndexOf('[[');

    if (lastOpenIndex !== -1 && lastOpenIndex >= cursorPos - 40) {
      const queryPart = textBeforeCursor.substring(lastOpenIndex + 2);
      if (!queryPart.includes(']]') && !queryPart.includes('\n')) {
        setAutocompleteQuery(queryPart);
        setAutocompleteCursor({ start: lastOpenIndex, end: cursorPos });
        setAutocompleteOpen(true);

        knowledgeApiService.autocompleteNotes(queryPart).then(res => {
          setAutocompleteResults(res.notes || []);
        });
        return;
      }
    }
    setAutocompleteOpen(false);
  };

  // Insertar wiki-link seleccionado
  const selectWikiLink = (note) => {
    const linkText = `[[${note.title}]]`;
    const before = content.substring(0, autocompleteCursor.start);
    const after = content.substring(autocompleteCursor.end);
    const newContent = `${before}${linkText}${after}`;
    setContent(newContent);
    setAutocompleteOpen(false);

    // Guardar inmediatamente y resincronizar
    saveNote({ content: newContent });
    fetchActiveNote(activeNote.id);
  };

  // Crear una nueva nota en blanco
  const handleCreateNewNote = async () => {
    try {
      const res = await knowledgeApiService.createNote({
        title: 'Nota sin título',
        content: '# Nueva Nota\n\nComienza a escribir tus ideas aquí...',
        primary_category_id: null,
      });
      showToast('✨ Nueva nota creada');
      await fetchNotes();
      setSearchParams({ noteId: res.note.id });
    } catch (err) {
      console.error('Error creando nota:', err);
    }
  };

  // Eliminar nota
  const handleDeleteNote = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta nota?')) return;
    try {
      await knowledgeApiService.deleteNote(id);
      showToast('🗑️ Nota eliminada');
      refreshAll();
      const updatedNotes = notes.filter(n => n.id !== id);
      setNotes(updatedNotes);
      if (updatedNotes.length > 0) {
        setSearchParams({ noteId: updatedNotes[0].id });
      } else {
        setActiveNote(null);
        setSearchParams({});
      }
    } catch (err) {
      console.error('Error eliminando nota:', err);
    }
  };

  // Alternar favorito
  const handleToggleFavorite = async () => {
    if (!activeNote) return;
    try {
      const res = await knowledgeApiService.toggleFavorite(activeNote.id);
      setIsFavorite(res.is_favorite);
      setNotes(prev => prev.map(n => n.id === activeNote.id ? { ...n, is_favorite: res.is_favorite ? 1 : 0 } : n));
    } catch (err) {
      console.error(err);
    }
  };

  // Subir adjunto
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeNote) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('note_id', activeNote.id);

    try {
      const res = await knowledgeApiService.uploadAttachment(formData);
      showToast('📎 Archivo adjuntado');
      // Insertar markdown de imagen o archivo en el editor
      const isImg = file.type.startsWith('image/');
      const snippet = isImg ? `\n\n![${file.name}](${res.attachment.url})\n` : `\n\n[📎 ${file.name}](${res.attachment.url})\n`;
      handleContentChange(content + snippet);
      fetchActiveNote(activeNote.id);
    } catch (err) {
      console.error('Error subiendo archivo:', err);
      showToast('❌ Error al subir archivo');
    }
  };

  // Formato markdown helpers
  const insertMarkdown = (prefix, suffix = '') => {
    const textarea = editorTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = `${prefix}${selectedText || 'texto'}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    handleContentChange(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText.length || 5));
    }, 50);
  };

  // Parsear markdown para preview con enlaces [[wiki-link]] interactivos
  const renderedHtml = useMemo(() => {
    if (!content) return '';
    try {
      // Reemplazar [[Título]] con spans clicables
      const parsedWikiLinks = content.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, noteTitle, alias) => {
        const display = alias || noteTitle;
        return `<span class="internal-wiki-link" data-title="${encodeURIComponent(noteTitle)}">🔗 ${display}</span>`;
      });
      return marked.parse(parsedWikiLinks);
    } catch (e) {
      return content;
    }
  }, [content]);

  // Manejar clics en wiki-links dentro del preview
  const handlePreviewClick = (e) => {
    const linkSpan = e.target.closest('.internal-wiki-link');
    if (linkSpan) {
      const noteTitle = decodeURIComponent(linkSpan.dataset.title);
      // Buscar nota con ese título
      const found = notes.find(n => n.title.toLowerCase() === noteTitle.toLowerCase());
      if (found) {
        setSearchParams({ noteId: found.id });
      } else {
        if (window.confirm(`La nota "${noteTitle}" no existe aún. ¿Deseas crearla ahora?`)) {
          knowledgeApiService.createNote({ title: noteTitle, content: `# ${noteTitle}\n\n` }).then(res => {
            fetchNotes();
            setSearchParams({ noteId: res.note.id });
          });
        }
      }
    }
  };

  // Consultar IA para sugerencias de relaciones en esta nota
  const handleFetchAiSuggestions = async () => {
    if (!activeNote) return;
    setLoadingAi(true);
    try {
      const res = await knowledgeApiService.aiSuggestRelations(activeNote.id);
      setAiSuggestions(res.suggestions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  // Aprobar sugerencia de IA
  const handleApproveAiSuggestion = async (sug) => {
    try {
      await knowledgeApiService.createRelation({
        source_note_id: activeNote.id,
        target_note_id: sug.target_note_id,
        relation_type: 'related_to',
        origin: 'ai_approved',
        description: sug.explanation
      });
      showToast('✅ Conexión agregada al Grafo');
      setAiSuggestions(prev => prev.filter(s => s.target_note_id !== sug.target_note_id));
      fetchActiveNote(activeNote.id);
    } catch (err) {
      console.error(err);
    }
  };

  // Crear relación manual
  const handleAddManualRelation = async () => {
    if (!relationTargetId || !activeNote) return;
    try {
      await knowledgeApiService.createRelation({
        source_note_id: activeNote.id,
        target_note_id: relationTargetId,
        relation_type: relationType,
        origin: 'manual'
      });
      showToast('🔗 Relación creada');
      setIsAddRelationOpen(false);
      fetchActiveNote(activeNote.id);
    } catch (err) {
      console.error(err);
    }
  };

  // Versiones
  const handleOpenVersions = async () => {
    if (!activeNote) return;
    try {
      const res = await knowledgeApiService.getNoteVersions(activeNote.id);
      setVersions(res.versions || []);
      setIsVersionModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestoreVersion = async (versionId) => {
    if (!window.confirm('¿Restaurar esta versión? Los cambios actuales se guardarán como nueva versión.')) return;
    try {
      await knowledgeApiService.restoreNoteVersion(activeNote.id, versionId);
      showToast('🔄 Versión restaurada');
      setIsVersionModalOpen(false);
      fetchActiveNote(activeNote.id);
    } catch (err) {
      console.error(err);
    }
  };

  // Manejo de tags
  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#/, '');
      if (!tags.includes(clean)) {
        const nextTags = [...tags, clean];
        setTags(nextTags);
        saveNote({ tags: nextTags });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagName) => {
    const nextTags = tags.filter(t => t !== tagName);
    setTags(nextTags);
    saveNote({ tags: nextTags });
  };

  return (
    <WorkspaceWrapper>
      {/* ─── 1. LEFT EXPLORER COLUMN ────────────────────────────────────────── */}
      <LeftColumn $collapsed={isLeftCollapsed}>
        {!isLeftCollapsed && (
          <LeftColumnContent>
            {/* Header del Explorer */}
            <ExplorerHeader>
              <ExplorerTitle>
                <FolderTree size={16} color="#a78bfa" />
                Explorador
              </ExplorerTitle>
              <NewNoteButton onClick={handleCreateNewNote}>
                <Plus size={16} /> Nueva
              </NewNoteButton>
            </ExplorerHeader>

            {/* Buscador de notas */}
            <SearchBox>
              <Search size={14} color="#94a3b8" />
              <SearchInput
                type="text"
                placeholder="Buscar notas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </SearchBox>

            {/* Filtros Rápidos */}
            <FiltersRow>
              <FilterPill $active={onlyFavorites} onClick={() => setOnlyFavorites(!onlyFavorites)}>
                <Star size={12} fill={onlyFavorites ? '#f59e0b' : 'none'} color="#f59e0b" /> Favoritos
              </FilterPill>
              {selectedTag && (
                <FilterPill $active={true} onClick={() => setSelectedTag('')}>
                  #{selectedTag} <X size={10} />
                </FilterPill>
              )}
            </FiltersRow>

            {/* Lista de Notas */}
            <NotesScrollList>
              {loadingNotes ? (
                <LoadingText>Cargando notas...</LoadingText>
              ) : notes.length === 0 ? (
                <EmptyNotesText>No se encontraron notas.</EmptyNotesText>
              ) : (
                notes.map((n) => {
                  const isSelected = activeNote?.id === n.id;
                  return (
                    <NoteCardItem
                      key={n.id}
                      $active={isSelected}
                      onClick={() => setSearchParams({ noteId: n.id })}
                    >
                      <NoteCardHeader>
                        <NoteCardTitle $active={isSelected}>{n.title || 'Sin título'}</NoteCardTitle>
                        {n.is_favorite === 1 && <Star size={12} color="#f59e0b" fill="#f59e0b" />}
                      </NoteCardHeader>
                      <NoteCardPreview>{n.preview || 'Nota vacía...'}</NoteCardPreview>
                      <NoteCardFooter>
                        {n.category_name && (
                          <CategoryBadge $color={n.area_color}>{n.category_name}</CategoryBadge>
                        )}
                        <NoteCardDate>
                          {new Date(n.updated_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </NoteCardDate>
                      </NoteCardFooter>
                    </NoteCardItem>
                  );
                })
              )}
            </NotesScrollList>
          </LeftColumnContent>
        )}

        <CollapseToggle onClick={() => setIsLeftCollapsed(!isLeftCollapsed)} title="Alternar panel izquierdo">
          {isLeftCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </CollapseToggle>
      </LeftColumn>

      {/* ─── 2. CENTER EDITOR & PREVIEW COLUMN ─────────────────────────────── */}
      <CenterColumn>
        {loadingActiveNote ? (
          <CenterLoading>
            <Sparkles size={24} color="#8b5cf6" />
            <p>Cargando nota...</p>
          </CenterLoading>
        ) : !activeNote ? (
          <CenterEmpty>
            <FileText size={48} color="#475569" />
            <h3>Ninguna nota seleccionada</h3>
            <p>Selecciona una nota del explorador o crea una nueva.</p>
            <NewNoteButton onClick={handleCreateNewNote}>
              <Plus size={16} /> Crear Nota
            </NewNoteButton>
          </CenterEmpty>
        ) : (
          <EditorContainer>
            {/* Top Toolbar del Editor */}
            <EditorTopBar>
              <TitleInput
                type="text"
                placeholder="Título de la nota..."
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  saveNote({ title: e.target.value });
                }}
              />

              <EditorControls>
                <SaveStatus>
                  {isSaving ? 'Guardando...' : lastSaved ? `Guardado ${lastSaved.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}` : 'Guardado'}
                </SaveStatus>

                <IconButton onClick={handleToggleFavorite} title="Favorito">
                  <Star size={18} fill={isFavorite ? '#f59e0b' : 'none'} color={isFavorite ? '#f59e0b' : '#94a3b8'} />
                </IconButton>

                <IconButton onClick={handleOpenVersions} title="Historial de versiones">
                  <History size={18} />
                </IconButton>

                {/* Switcher Modo de Visualización */}
                <ViewModeSwitch>
                  <ModeBtn $active={editorMode === 'edit'} onClick={() => setEditorMode('edit')} title="Solo Editor">
                    <Edit3 size={15} />
                  </ModeBtn>
                  <ModeBtn $active={editorMode === 'split'} onClick={() => setEditorMode('split')} title="Editor y Preview">
                    <Columns size={15} />
                  </ModeBtn>
                  <ModeBtn $active={editorMode === 'preview'} onClick={() => setEditorMode('preview')} title="Solo Preview">
                    <Eye size={15} />
                  </ModeBtn>
                </ViewModeSwitch>

                <IconButton onClick={() => handleDeleteNote(activeNote.id)} title="Eliminar nota" $danger>
                  <Trash2 size={18} />
                </IconButton>
              </EditorControls>
            </EditorTopBar>

            {/* Barra de Formato Markdown */}
            <MarkdownToolbar>
              <ToolbarGroup>
                <ToolbarBtn onClick={() => insertMarkdown('**', '**')} title="Negrita">
                  <Bold size={15} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => insertMarkdown('*', '*')} title="Cursiva">
                  <Italic size={15} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => insertMarkdown('# ')} title="Título 1">
                  <Heading1 size={15} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => insertMarkdown('## ')} title="Título 2">
                  <Heading2 size={15} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => insertMarkdown('### ')} title="Título 3">
                  <Heading3 size={15} />
                </ToolbarBtn>
              </ToolbarGroup>

              <ToolbarDivider />

              <ToolbarGroup>
                <ToolbarBtn onClick={() => insertMarkdown('- ')} title="Lista">
                  <List size={15} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => insertMarkdown('- [ ] ')} title="Checklist">
                  <CheckSquare size={15} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => insertMarkdown('> ')} title="Cita">
                  <Quote size={15} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => insertMarkdown('```\n', '\n```')} title="Código">
                  <Code size={15} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => insertMarkdown('| Columna 1 | Columna 2 |\n|---|---|\n| Valor 1 | Valor 2 |\n')} title="Tabla">
                  <TableIcon size={15} />
                </ToolbarBtn>
              </ToolbarGroup>

              <ToolbarDivider />

              {/* Obsidian Wiki-link button */}
              <ToolbarGroup>
                <WikiLinkToolbarBtn onClick={() => insertMarkdown('[[', ']]')} title="Enlace interno a otra nota [[Título]]">
                  <Network size={14} /> [[Nota]]
                </WikiLinkToolbarBtn>

                <FileInputLabel title="Subir adjunto (imagen o documento)">
                  <Paperclip size={15} />
                  <HiddenFileInput type="file" onChange={handleFileUpload} />
                </FileInputLabel>
              </ToolbarGroup>
            </MarkdownToolbar>

            {/* Área de Trabajo: Editor / Preview */}
            <EditorWorkspace $mode={editorMode}>
              {/* Panel de Edición */}
              {(editorMode === 'edit' || editorMode === 'split') && (
                <EditorPanel>
                  <Textarea
                    ref={editorTextareaRef}
                    value={content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder="Escribe en Markdown... Escribe [[ para enlazar a otra nota."
                    spellCheck="false"
                  />

                  {/* Dropdown de Autocompletado [[ */}
                  {autocompleteOpen && autocompleteResults.length > 0 && (
                    <AutocompleteDropdown>
                      <AutocompleteHeader>Enlazar nota existente:</AutocompleteHeader>
                      {autocompleteResults.map((res) => (
                        <AutocompleteItem key={res.id} onClick={() => selectWikiLink(res)}>
                          <FileText size={14} color="#8b5cf6" />
                          <AutocompleteItemTitle>{res.title}</AutocompleteItemTitle>
                          {res.category_name && (
                            <AutocompleteItemCat>{res.category_name}</AutocompleteItemCat>
                          )}
                        </AutocompleteItem>
                      ))}
                    </AutocompleteDropdown>
                  )}
                </EditorPanel>
              )}

              {/* Panel de Preview */}
              {(editorMode === 'preview' || editorMode === 'split') && (
                <PreviewPanel onClick={handlePreviewClick}>
                  <PreviewContent dangerouslySetInnerHTML={{ __html: renderedHtml }} />
                </PreviewPanel>
              )}
            </EditorWorkspace>
          </EditorContainer>
        )}
      </CenterColumn>

      {/* ─── 3. RIGHT SIDEBAR (Propiedades, Backlinks, Relaciones) ─────────── */}
      <RightColumn $collapsed={isRightCollapsed}>
        <CollapseToggleRight onClick={() => setIsRightCollapsed(!isRightCollapsed)} title="Alternar panel de propiedades">
          {isRightCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </CollapseToggleRight>

        {!isRightCollapsed && activeNote && (
          <RightColumnContent>
            {/* Propiedades Principales */}
            <SidebarSection>
              <SidebarSectionTitle>Propiedades</SidebarSectionTitle>
              <PropertyItem>
                <PropertyLabel>Categoría Principal</PropertyLabel>
                <PropertySelect
                  value={primaryCategoryId}
                  onChange={(e) => {
                    setPrimaryCategoryId(e.target.value);
                    saveNote({ primaryCategoryId: e.target.value });
                  }}
                >
                  <option value="">Sin categoría</option>
                  {areas.flatMap(a => (a.categories || []).map(c => (
                    <option key={c.id} value={c.id}>
                      {a.name} → {c.name}
                    </option>
                  )))}
                </PropertySelect>
              </PropertyItem>

              {/* Tags */}
              <PropertyItem>
                <PropertyLabel>Etiquetas / Tags</PropertyLabel>
                <TagsWrapper>
                  {tags.map((t) => (
                    <TagChip key={t}>
                      #{t}
                      <TagRemoveBtn onClick={() => handleRemoveTag(t)}>×</TagRemoveBtn>
                    </TagChip>
                  ))}
                  <TagInputBox
                    type="text"
                    placeholder="+ Tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                  />
                </TagsWrapper>
              </PropertyItem>
            </SidebarSection>

            {/* Backlinks (Menciones entrantes) */}
            <SidebarSection>
              <SidebarHeaderBetween>
                <SidebarSectionTitle>
                  Backlinks ({activeNote.backlinks?.length || 0})
                </SidebarSectionTitle>
              </SidebarHeaderBetween>
              <LinksList>
                {(!activeNote.backlinks || activeNote.backlinks.length === 0) ? (
                  <EmptySubtext>Ninguna nota enlaza a esta aún.</EmptySubtext>
                ) : (
                  activeNote.backlinks.map((bl) => (
                    <LinkCard key={bl.relation_id} onClick={() => setSearchParams({ noteId: bl.source_id })}>
                      <LinkTitleRow>
                        <FileText size={13} color="#a78bfa" />
                        <LinkTitle>{bl.source_title}</LinkTitle>
                      </LinkTitleRow>
                      {bl.preview && <LinkSnippet>{bl.preview}...</LinkSnippet>}
                    </LinkCard>
                  ))
                )}
              </LinksList>
            </SidebarSection>

            {/* Relaciones Salientes / Explícitas */}
            <SidebarSection>
              <SidebarHeaderBetween>
                <SidebarSectionTitle>
                  Relaciones ({activeNote.relations?.length || 0})
                </SidebarSectionTitle>
                <MiniActionBtn onClick={() => setIsAddRelationOpen(true)}>
                  <Plus size={13} /> Conectar
                </MiniActionBtn>
              </SidebarHeaderBetween>

              {isAddRelationOpen && (
                <AddRelationBox>
                  <RelationSelect
                    value={relationTargetId}
                    onChange={(e) => setRelationTargetId(e.target.value)}
                  >
                    <option value="">Seleccionar nota destino...</option>
                    {notes.filter(n => n.id !== activeNote.id).map(n => (
                      <option key={n.id} value={n.id}>{n.title}</option>
                    ))}
                  </RelationSelect>

                  <RelationSelect value={relationType} onChange={(e) => setRelationType(e.target.value)}>
                    <option value="related_to">Relacionado con</option>
                    <option value="references">Referencia a</option>
                    <option value="explains">Explica / Desarrolla</option>
                    <option value="depends_on">Depende de</option>
                    <option value="contradicts">Contradice</option>
                    <option value="part_of">Parte de</option>
                  </RelationSelect>

                  <RelationButtonsRow>
                    <MiniCancelBtn onClick={() => setIsAddRelationOpen(false)}>Cancelar</MiniCancelBtn>
                    <MiniSaveBtn onClick={handleAddManualRelation}>Conectar</MiniSaveBtn>
                  </RelationButtonsRow>
                </AddRelationBox>
              )}

              <LinksList>
                {(!activeNote.relations || activeNote.relations.length === 0) ? (
                  <EmptySubtext>Sin relaciones explícitas.</EmptySubtext>
                ) : (
                  activeNote.relations.map((rel) => (
                    <LinkCard key={rel.relation_id} onClick={() => setSearchParams({ noteId: rel.target_id })}>
                      <LinkTitleRow>
                        <Network size={13} color="#34d399" />
                        <LinkTitle>{rel.target_title}</LinkTitle>
                        <RelationTypeBadge>{rel.relation_type}</RelationTypeBadge>
                      </LinkTitleRow>
                    </LinkCard>
                  ))
                )}
              </LinksList>
            </SidebarSection>

            {/* Sugerencias de IA */}
            <SidebarSection>
              <SidebarHeaderBetween>
                <SidebarSectionTitle>
                  <Sparkles size={14} color="#ec4899" /> Sugerencias IA
                </SidebarSectionTitle>
                <MiniActionBtn onClick={handleFetchAiSuggestions} disabled={loadingAi}>
                  {loadingAi ? 'Buscando...' : 'Analizar'}
                </MiniActionBtn>
              </SidebarHeaderBetween>

              {aiSuggestions.length > 0 ? (
                <AiSuggestionsList>
                  {aiSuggestions.map((sug) => (
                    <AiSuggestionCard key={sug.target_note_id}>
                      <AiCardHeader>
                        <FileText size={13} color="#ec4899" />
                        <AiTargetTitle>{sug.target_title}</AiTargetTitle>
                      </AiCardHeader>
                      <AiExplanation>{sug.explanation}</AiExplanation>
                      <AiActionRow>
                        <ApproveAiBtn onClick={() => handleApproveAiSuggestion(sug)}>
                          <CheckCircle2 size={13} /> Aprobar
                        </ApproveAiBtn>
                      </AiActionRow>
                    </AiSuggestionCard>
                  ))}
                </AiSuggestionsList>
              ) : (
                <EmptySubtext>Toca "Analizar" para descubrir conexiones inteligentes.</EmptySubtext>
              )}
            </SidebarSection>

            {/* Archivos Adjuntos */}
            <SidebarSection>
              <SidebarSectionTitle>
                <Paperclip size={14} /> Adjuntos ({activeNote.attachments?.length || 0})
              </SidebarSectionTitle>
              <LinksList>
                {(!activeNote.attachments || activeNote.attachments.length === 0) ? (
                  <EmptySubtext>No hay archivos adjuntos.</EmptySubtext>
                ) : (
                  activeNote.attachments.map((att) => (
                    <AttachmentItem key={att.id}>
                      <a href={att.storage_path} target="_blank" rel="noopener noreferrer">
                        {att.filename}
                      </a>
                    </AttachmentItem>
                  ))
                )}
              </LinksList>
            </SidebarSection>
          </RightColumnContent>
        )}
      </RightColumn>

      {/* ─── MODAL HISTORIAL DE VERSIONES ─────────────────────────────────── */}
      {isVersionModalOpen && (
        <VersionModalOverlay onClick={() => setIsVersionModalOpen(false)}>
          <VersionModalContainer onClick={(e) => e.stopPropagation()}>
            <ModalTitleRow>
              <h3>Historial de Versiones</h3>
              <CloseModalBtn onClick={() => setIsVersionModalOpen(false)}>×</CloseModalBtn>
            </ModalTitleRow>
            <VersionList>
              {versions.length === 0 ? (
                <p>No hay versiones anteriores.</p>
              ) : (
                versions.map((ver) => (
                  <VersionItem key={ver.id}>
                    <div>
                      <strong>{ver.title}</strong>
                      <VersionDate>
                        {new Date(ver.created_at).toLocaleString('es-ES')} • {ver.content_length} caracteres
                      </VersionDate>
                    </div>
                    <RestoreBtn onClick={() => handleRestoreVersion(ver.id)}>
                      <RotateCcw size={14} /> Restaurar
                    </RestoreBtn>
                  </VersionItem>
                ))
              )}
            </VersionList>
          </VersionModalContainer>
        </VersionModalOverlay>
      )}
    </WorkspaceWrapper>
  );
};

// ─── Estilos ─────────────────────────────────────────────────────────────────

const WorkspaceWrapper = styled.div`
  display: flex;
  height: calc(100vh - 160px);
  width: 100%;
  overflow: hidden;
  background: #0a0f1e;
  position: relative;
`;

const LeftColumn = styled.aside`
  width: ${props => props.$collapsed ? '32px' : '300px'};
  min-width: ${props => props.$collapsed ? '32px' : '260px'};
  background: #0f172a;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  position: relative;
  transition: width 0.25s ease, min-width 0.25s ease;
  z-index: 10;

  @media (max-width: 768px) {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: ${props => props.$collapsed ? '0' : '280px'};
    min-width: 0;
    overflow: hidden;
  }
`;

const LeftColumnContent = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const ExplorerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.85rem;
`;

const ExplorerTitle = styled.h3`
  font-size: 0.9rem;
  font-weight: 600;
  color: #f8fafc;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
`;

const NewNoteButton = styled.button`
  background: #8b5cf6;
  border: none;
  color: white;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #7c3aed;
  }
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
  margin-bottom: 0.75rem;
`;

const SearchInput = styled.input`
  background: transparent;
  border: none;
  color: #f8fafc;
  font-size: 0.82rem;
  outline: none;
  width: 100%;
  &::placeholder {
    color: #64748b;
  }
`;

const FiltersRow = styled.div`
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
`;

const FilterPill = styled.button`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.55rem;
  border-radius: 12px;
  font-size: 0.72rem;
  border: 1px solid ${props => props.$active ? '#f59e0b' : 'rgba(255, 255, 255, 0.08)'};
  background: ${props => props.$active ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.03)'};
  color: ${props => props.$active ? '#fbbf24' : '#94a3b8'};
  cursor: pointer;
`;

const NotesScrollList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding-right: 0.25rem;
`;

const NoteCardItem = styled.div`
  background: ${props => props.$active ? 'rgba(139, 92, 246, 0.18)' : 'rgba(30, 41, 59, 0.4)'};
  border: 1px solid ${props => props.$active ? '#8b5cf6' : 'rgba(255, 255, 255, 0.05)'};
  border-radius: 8px;
  padding: 0.65rem 0.75rem;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(139, 92, 246, 0.12);
    border-color: rgba(139, 92, 246, 0.4);
  }
`;

const NoteCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
`;

const NoteCardTitle = styled.h4`
  font-size: 0.84rem;
  font-weight: 600;
  color: ${props => props.$active ? '#c4b5fd' : '#f8fafc'};
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NoteCardPreview = styled.p`
  font-size: 0.74rem;
  color: #94a3b8;
  margin: 0 0 0.4rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NoteCardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CategoryBadge = styled.span`
  font-size: 0.68rem;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  background: ${props => props.$color ? `${props.$color}20` : 'rgba(139, 92, 246, 0.15)'};
  color: ${props => props.$color || '#c4b5fd'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
`;

const NoteCardDate = styled.span`
  font-size: 0.68rem;
  color: #64748b;
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 2rem;
  font-size: 0.8rem;
  color: #94a3b8;
`;

const EmptyNotesText = styled.div`
  text-align: center;
  padding: 2rem;
  font-size: 0.8rem;
  color: #64748b;
`;

const CollapseToggle = styled.button`
  position: absolute;
  top: 12px;
  right: -12px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 20;
  &:hover {
    color: white;
    background: #8b5cf6;
  }
`;

const CollapseToggleRight = styled(CollapseToggle)`
  right: auto;
  left: -12px;
`;

const CenterColumn = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #0a0f1e;
  overflow: hidden;
`;

const CenterLoading = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 0.75rem;
  color: #94a3b8;
`;

const CenterEmpty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 1rem;
  color: #94a3b8;
  text-align: center;
  padding: 2rem;
`;

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const EditorTopBar = styled.div`
  padding: 0.85rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  background: #0f172a;
`;

const TitleInput = styled.input`
  font-size: 1.25rem;
  font-weight: 700;
  color: #f8fafc;
  background: transparent;
  border: none;
  outline: none;
  flex: 1;
  &::placeholder {
    color: #475569;
  }
`;

const EditorControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SaveStatus = styled.span`
  font-size: 0.74rem;
  color: #64748b;
  margin-right: 0.5rem;
`;

const IconButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.$danger ? '#ef4444' : '#94a3b8'};
  padding: 0.35rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: ${props => props.$danger ? '#f87171' : 'white'};
  }
`;

const ViewModeSwitch = styled.div`
  display: flex;
  background: #1e293b;
  border-radius: 6px;
  padding: 2px;
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

const ModeBtn = styled.button`
  background: ${props => props.$active ? '#8b5cf6' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#94a3b8'};
  border: none;
  padding: 0.3rem 0.55rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MarkdownToolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 1.5rem;
  background: rgba(15, 23, 42, 0.7);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  overflow-x: auto;
`;

const ToolbarGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.2rem;
`;

const ToolbarDivider = styled.div`
  width: 1px;
  height: 18px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 0.35rem;
`;

const ToolbarBtn = styled.button`
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 0.3rem 0.45rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: white;
  }
`;

const WikiLinkToolbarBtn = styled.button`
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: #c4b5fd;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  &:hover {
    background: rgba(139, 92, 246, 0.3);
    color: white;
  }
`;

const FileInputLabel = styled.label`
  background: transparent;
  color: #94a3b8;
  padding: 0.3rem 0.45rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: white;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const EditorWorkspace = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: ${props => props.$mode === 'split' ? '1fr 1fr' : '1fr'};
  overflow: hidden;
`;

const EditorPanel = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
`;

const Textarea = styled.textarea`
  flex: 1;
  width: 100%;
  background: #0a0f1e;
  border: none;
  color: #f1f5f9;
  padding: 1.5rem;
  font-size: 0.95rem;
  line-height: 1.7;
  font-family: 'Fira Code', monospace;
  outline: none;
  resize: none;
  overflow-y: auto;
  &::placeholder {
    color: #475569;
  }
`;

const AutocompleteDropdown = styled.div`
  position: absolute;
  bottom: 2rem;
  left: 2rem;
  background: #1e293b;
  border: 1px solid #8b5cf6;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  width: 280px;
  max-height: 220px;
  overflow-y: auto;
  z-index: 50;
`;

const AutocompleteHeader = styled.div`
  font-size: 0.72rem;
  color: #a78bfa;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-weight: 600;
`;

const AutocompleteItem = styled.div`
  padding: 0.5rem 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: background 0.15s;
  &:hover {
    background: rgba(139, 92, 246, 0.2);
  }
`;

const AutocompleteItemTitle = styled.span`
  font-size: 0.82rem;
  color: #f8fafc;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AutocompleteItemCat = styled.span`
  font-size: 0.68rem;
  color: #94a3b8;
`;

const PreviewPanel = styled.div`
  padding: 1.5rem 2rem;
  overflow-y: auto;
  background: #0d1326;
  height: 100%;
`;

const PreviewContent = styled.div`
  color: #e2e8f0;
  line-height: 1.7;
  font-size: 0.95rem;

  h1, h2, h3, h4 {
    color: #f8fafc;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
  }
  h1 { font-size: 1.6rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 0.3em; }
  h2 { font-size: 1.3rem; }
  h3 { font-size: 1.1rem; }

  p { margin-bottom: 1em; }

  ul, ol {
    margin-left: 1.5em;
    margin-bottom: 1em;
  }

  blockquote {
    border-left: 3px solid #8b5cf6;
    padding-left: 1rem;
    color: #94a3b8;
    margin: 1em 0;
    font-style: italic;
  }

  pre {
    background: #050811;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 1rem;
    overflow-x: auto;
    margin: 1em 0;
  }

  code {
    background: rgba(255, 255, 255, 0.08);
    padding: 0.15em 0.35em;
    border-radius: 4px;
    font-family: 'Fira Code', monospace;
    font-size: 0.85em;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
  }

  th, td {
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0.5rem 0.75rem;
    text-align: left;
  }

  th {
    background: rgba(255, 255, 255, 0.05);
  }

  img {
    max-width: 100%;
    border-radius: 8px;
    margin: 1em 0;
  }

  /* Estilo especial para enlaces internos [[Wiki-links]] */
  .internal-wiki-link {
    color: #a78bfa;
    background: rgba(139, 92, 246, 0.15);
    border: 1px solid rgba(139, 92, 246, 0.3);
    padding: 0.1em 0.45em;
    border-radius: 5px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;

    &:hover {
      background: #8b5cf6;
      color: white;
    }
  }
`;

const RightColumn = styled.aside`
  width: ${props => props.$collapsed ? '32px' : '290px'};
  min-width: ${props => props.$collapsed ? '32px' : '260px'};
  background: #0f172a;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  position: relative;
  transition: width 0.25s ease, min-width 0.25s ease;
  z-index: 10;

  @media (max-width: 1100px) {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    width: ${props => props.$collapsed ? '0' : '280px'};
    min-width: 0;
    overflow: hidden;
  }
`;

const RightColumnContent = styled.div`
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  height: 100%;
`;

const SidebarSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`;

const SidebarSectionTitle = styled.h4`
  font-size: 0.82rem;
  font-weight: 600;
  color: #cbd5e1;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const SidebarHeaderBetween = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MiniActionBtn = styled.button`
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: #c4b5fd;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.72rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.2rem;
  &:hover {
    background: #8b5cf6;
    color: white;
  }
`;

const PropertyItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const PropertyLabel = styled.label`
  font-size: 0.74rem;
  color: #94a3b8;
`;

const PropertySelect = styled.select`
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  font-size: 0.8rem;
  outline: none;
`;

const TagsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
`;

const TagChip = styled.span`
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: #c4b5fd;
  font-size: 0.72rem;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const TagRemoveBtn = styled.button`
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.85rem;
  line-height: 1;
  padding: 0;
  &:hover {
    color: white;
  }
`;

const TagInputBox = styled.input`
  background: transparent;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #f8fafc;
  font-size: 0.72rem;
  padding: 0.15rem 0.4rem;
  width: 75px;
  outline: none;
  &::placeholder {
    color: #64748b;
  }
`;

const LinksList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const LinkCard = styled.div`
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 0.45rem 0.65rem;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    background: rgba(30, 41, 59, 0.9);
    border-color: rgba(139, 92, 246, 0.3);
  }
`;

const LinkTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const LinkTitle = styled.span`
  font-size: 0.78rem;
  font-weight: 500;
  color: #f8fafc;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LinkSnippet = styled.p`
  font-size: 0.7rem;
  color: #94a3b8;
  margin: 0.2rem 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RelationTypeBadge = styled.span`
  font-size: 0.64rem;
  color: #34d399;
  background: rgba(52, 211, 153, 0.15);
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
`;

const EmptySubtext = styled.span`
  font-size: 0.74rem;
  color: #64748b;
  font-style: italic;
`;

const AddRelationBox = styled.div`
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.65rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const RelationSelect = styled.select`
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  padding: 0.35rem;
  border-radius: 4px;
  font-size: 0.75rem;
  outline: none;
`;

const RelationButtonsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.4rem;
`;

const MiniCancelBtn = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  font-size: 0.72rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
`;

const MiniSaveBtn = styled.button`
  background: #8b5cf6;
  border: none;
  color: white;
  font-size: 0.72rem;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
`;

const AiSuggestionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const AiSuggestionCard = styled.div`
  background: rgba(236, 72, 153, 0.08);
  border: 1px solid rgba(236, 72, 153, 0.25);
  border-radius: 6px;
  padding: 0.55rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const AiCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
`;

const AiTargetTitle = styled.span`
  font-size: 0.78rem;
  font-weight: 600;
  color: #f472b6;
`;

const AiExplanation = styled.p`
  font-size: 0.72rem;
  color: #cbd5e1;
  margin: 0;
  line-height: 1.3;
`;

const AiActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const ApproveAiBtn = styled.button`
  background: #ec4899;
  border: none;
  color: white;
  font-size: 0.7rem;
  font-weight: 500;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  &:hover {
    background: #db2777;
  }
`;

const AttachmentItem = styled.div`
  font-size: 0.76rem;
  a {
    color: #60a5fa;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;

const VersionModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2500;
  padding: 1rem;
`;

const VersionModalContainer = styled.div`
  background: #0f172a;
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  padding: 1.25rem;
  color: #f8fafc;
`;

const ModalTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  h3 { margin: 0; font-size: 1rem; font-weight: 600; }
`;

const CloseModalBtn = styled.button`
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.2rem;
  cursor: pointer;
`;

const VersionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  max-height: 350px;
  overflow-y: auto;
`;

const VersionItem = styled.div`
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 0.65rem 0.85rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const VersionDate = styled.div`
  font-size: 0.72rem;
  color: #94a3b8;
  margin-top: 0.2rem;
`;

const RestoreBtn = styled.button`
  background: rgba(139, 92, 246, 0.2);
  border: 1px solid #8b5cf6;
  color: #c4b5fd;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  cursor: pointer;
  &:hover {
    background: #8b5cf6;
    color: white;
  }
`;

export default NotesPage;
