// modules/personal/pages/JournalPage.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Book, Edit3, Clock, ChevronLeft, ChevronRight, RefreshCw,
  Search, Calendar as CalendarIcon, Save
} from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { usePersonalHub } from '../../../context/PersonalHubContext';
import { colors } from '../../../styles/colors';
import { getUTC3DateString } from '../../../utils/helpers';

const p = colors.personal;

const PROMPTS = [
  "¿Qué fue lo mejor de hoy y por qué?",
  "¿Qué aprendí hoy?",
  "¿Qué hice hoy que mi yo de hace un año admiraría?",
  "¿Qué estoy evitando?",
  "¿Cuál es la única cosa que haría que mañana fuera un buen día?",
  "¿Qué conversación o persona tuvo un impacto en mí hoy?",
];

const stripHtml = (html) => {
  if (!html) return '';
  // Reemplazar tags de bloque con espacio para evitar que palabras de distintos párrafos se peguen
  const withSpaces = html
    .replace(/<\/?(p|h[1-6]|div|li|br|blockquote)[^>]*>/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const doc = new DOMParser().parseFromString(withSpaces, 'text/html');
  return (doc.body.textContent || '').replace(/\s{2,}/g, ' ').trim();
};

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link', 'clean']
  ],
};

const JournalPage = () => {
  const { journals, createJournal, updateJournal, loading } = usePersonalHub();
  const [activeTab, setActiveTab] = useState('write'); // 'write' | 'history'
  const [currentContent, setCurrentContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'error'
  const [promptIndex, setPromptIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isEditingHistory, setIsEditingHistory] = useState(false);
  const [historyEditContent, setHistoryEditContent] = useState('');
  const [historySaveStatus, setHistorySaveStatus] = useState('saved'); // 'saved' | 'saving' | 'error'

  const today = getUTC3DateString();

  // Encuentra la entrada de hoy
  const todayEntry = useMemo(() => {
    return (journals || []).find(j => j.date === today);
  }, [journals, today]);

  useEffect(() => {
    // Si estamos cargando, no hacemos nada
    if (loading) return;

    if (todayEntry) {
      setCurrentContent(todayEntry.content || '');
    } else {
      setCurrentContent('');
    }
  }, [loading, todayEntry]);

  const handleSave = useCallback(async () => {
    if (loading) return;
    if (todayEntry && todayEntry.content === currentContent) return;
    if (!todayEntry && currentContent.trim() === '') return;

    setSaveStatus('saving');

    try {
      if (todayEntry) {
        await updateJournal(todayEntry.id, { content: currentContent });
      } else {
        await createJournal({ date: today, content: currentContent });
      }
      setSaveStatus('saved');

      // Volver al estado saved y desaparecer feedback a los 3 segundos no es necesario, el botón se deshabilita
    } catch (err) {
      console.error("Error guardando journal:", err);
      setSaveStatus('error');
    }
  }, [currentContent, todayEntry, updateJournal, createJournal, loading, today]);

  // Actualizar el estado si hay cambios sin guardar
  useEffect(() => {
    if (loading) return;
    const hasChanged = todayEntry
      ? todayEntry.content !== currentContent
      : currentContent.trim() !== '';

    if (hasChanged && saveStatus !== 'saving' && saveStatus !== 'error') {
      setSaveStatus('unsaved');
    } else if (!hasChanged && saveStatus !== 'saving') {
      setSaveStatus('saved');
    }
  }, [currentContent, todayEntry, loading, saveStatus]);

  // Auto-save en segundo plano cada 1 minuto
  useEffect(() => {
    const interval = setInterval(() => {
      handleSave();
    }, 60000); // 1 minuto

    return () => clearInterval(interval);
  }, [handleSave]);

  const handleShufflePrompt = () => {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * PROMPTS.length);
    } while (nextIndex === promptIndex);
    setPromptIndex(nextIndex);
  };

  const formatDate = (dateStr) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es', options);
  };

  const filteredHistory = useMemo(() => {
    return (journals || [])
      .filter(j => j.date !== today) // Excluir hoy del historial principal
      .filter(j => stripHtml(j.content)?.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [journals, searchQuery, today]);

  const openHistoryEntry = (entry) => {
    setSelectedEntry(entry);
    setIsEditingHistory(false);
  };

  const closeHistoryEntry = () => {
    setSelectedEntry(null);
    setIsEditingHistory(false);
  };

  const handleEditHistory = () => {
    setHistoryEditContent(selectedEntry.content || '');
    setIsEditingHistory(true);
  };

  const handleSaveHistory = async () => {
    if (loading || !selectedEntry) return;
    if (historyEditContent === selectedEntry.content) {
      setIsEditingHistory(false);
      return;
    }
    
    setHistorySaveStatus('saving');
    try {
      const updated = await updateJournal(selectedEntry.id, { content: historyEditContent });
      setSelectedEntry(updated);
      setIsEditingHistory(false);
      setHistorySaveStatus('saved');
    } catch (err) {
      console.error("Error guardando journal histórico:", err);
      setHistorySaveStatus('error');
    }
  };

  return (
    <Container>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap');
      `}</style>
      <Header>
        <div>
          <Title><Book size={24} color={p.primaryLight} /> Daily Journal</Title>
          <Subtitle>Reflexiones, aprendizajes y pensamientos</Subtitle>
        </div>
        <Tabs>
          <Tab $active={activeTab === 'write'} onClick={() => { setActiveTab('write'); setSelectedEntry(null); }}>
            <Edit3 size={16} /> Hoy
          </Tab>
          <Tab $active={activeTab === 'history'} onClick={() => setActiveTab('history')}>
            <Clock size={16} /> Historial
          </Tab>
        </Tabs>
      </Header>

      <AnimatePresence mode="wait">
        {activeTab === 'write' ? (
          <motion.div
            key="write"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <WriteGrid>
              <MainEditor>
                <EditorHeader>
                  <DateDisplay>
                    <CalendarIcon size={18} />
                    {formatDate(today)}
                  </DateDisplay>
                  <SaveAction
                    onClick={handleSave}
                    $status={saveStatus}
                    disabled={saveStatus === 'saved' || saveStatus === 'saving'}
                  >
                    {saveStatus === 'unsaved' && <><Save size={14} /> Guardar</>}
                    {saveStatus === 'saving' && <><RefreshCw size={14} className="spin" /> Guardando...</>}
                    {saveStatus === 'saved' && <><Save size={14} /> Guardado</>}
                    {saveStatus === 'error' && 'Error al guardar'}
                  </SaveAction>
                </EditorHeader>
                <StyledQuill
                  value={currentContent}
                  onChange={setCurrentContent}
                  modules={quillModules}
                  placeholder="Empieza a escribir aquí..."
                />
              </MainEditor>

              <Sidebar>
                <PromptCard>
                  <PromptLabel>Inspiración del día</PromptLabel>
                  <PromptText>"{PROMPTS[promptIndex]}"</PromptText>
                  <PromptAction onClick={handleShufflePrompt}>
                    <RefreshCw size={14} /> Cambiar prompt
                  </PromptAction>
                </PromptCard>
              </Sidebar>
            </WriteGrid>
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <HistoryContainer>
              {selectedEntry ? (
                <BookView
                  initial={{ rotateY: -90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: 90, opacity: 0 }}
                  transition={{ duration: 0.6, type: "spring", bounce: 0.2 }}
                  style={{ transformOrigin: 'left center' }}
                >
                  <BookHeader>
                    <BackButton onClick={closeHistoryEntry}>
                      <ChevronLeft size={16} /> Volver al índice
                    </BackButton>
                    <BookDate>{formatDate(selectedEntry.date)}</BookDate>
                    
                    {!isEditingHistory ? (
                      <HistoryAction onClick={handleEditHistory}>
                        <Edit3 size={14} /> Editar
                      </HistoryAction>
                    ) : (
                      <HistorySaveAction 
                        onClick={handleSaveHistory}
                        disabled={historySaveStatus === 'saving'}
                      >
                        {historySaveStatus === 'saving' ? (
                          <><RefreshCw size={14} className="spin" /> Guardando...</>
                        ) : (
                          <><Save size={14} /> Guardar</>
                        )}
                      </HistorySaveAction>
                    )}
                  </BookHeader>
                  
                  {isEditingHistory ? (
                    <HistoryEditorContainer>
                      <StyledQuill
                        value={historyEditContent}
                        onChange={setHistoryEditContent}
                        modules={quillModules}
                      />
                    </HistoryEditorContainer>
                  ) : (
                    <BookContent dangerouslySetInnerHTML={{ __html: selectedEntry.content }} />
                  )}
                </BookView>
              ) : (
                <>
                  <SearchContainer>
                    <SearchIcon><Search size={18} /></SearchIcon>
                    <SearchInput
                      type="text"
                      placeholder="Buscar en entradas pasadas..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </SearchContainer>

                  {filteredHistory.length === 0 ? (
                    <EmptyHistory>
                      <Book size={48} color="#334155" />
                      <p>No se encontraron entradas anteriores.</p>
                    </EmptyHistory>
                  ) : (
                    <HistoryGrid>
                      {filteredHistory.map(entry => (
                        <HistoryCard key={entry.id} onClick={() => openHistoryEntry(entry)}>
                          <CardDate>{formatDate(entry.date)}</CardDate>
                          <CardPreview>
                            {stripHtml(entry.content).substring(0, 120)}
                            {(stripHtml(entry.content).length) > 120 && '...'}
                          </CardPreview>
                          <ReadMore>Leer entrada <ChevronRight size={14} /></ReadMore>
                        </HistoryCard>
                      ))}
                    </HistoryGrid>
                  )}
                </>
              )}
            </HistoryContainer>
          </motion.div>
        )}
      </AnimatePresence>
    </Container>
  );
};

// ─── Animations & Styles ───────────────────────────────────────────────────

const spinAnimation = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  color: #e2e8f0;
  min-height: calc(100vh - 80px);

  @media (max-width: 768px) {
    padding: 1.25rem 1rem;
  }

  @media (max-width: 480px) {
    padding: 1rem 0.75rem;
  }

  @media (max-width: 350px) {
    padding: 0.75rem 0.5rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
  }
`;

const Title = styled.h1`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: 'Unbounded', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: white;

  @media (max-width: 480px) {
    font-size: 1.2rem;
  }

  @media (max-width: 350px) {
    font-size: 1rem;
    gap: 0.5rem;
  }
`;

const Subtitle = styled.p`
  margin: 0;
  color: #94a3b8;
  font-size: 0.95rem;
`;

const Tabs = styled.div`
  display: flex;
  background: rgba(255, 255, 255, 0.03);
  padding: 0.3rem;
  border-radius: 12px;
  gap: 0.3rem;
`;

const Tab = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: ${props => props.$active ? 'rgba(82, 183, 136, 0.15)' : 'transparent'};
  color: ${props => props.$active ? p.primaryLight : '#94a3b8'};
  border: 1px solid ${props => props.$active ? 'rgba(82, 183, 136, 0.3)' : 'transparent'};
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: ${props => props.$active ? p.primaryLight : '#e2e8f0'};
  }
`;

// ─── Write View ─────────────────────────────────────────────────────────────

const WriteGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
  
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 480px) {
    gap: 1rem;
  }
`;

const MainEditor = styled.div`
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  min-height: 60vh;
  box-shadow: 0 10px 40px -10px rgba(0,0,0,0.3);
`;

const EditorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  flex-wrap: wrap;
  gap: 0.5rem;

  @media (max-width: 480px) {
    padding: 0.75rem 1rem;
  }
  
  @media (max-width: 350px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const DateDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.95rem;
  color: white;
  text-transform: capitalize;

  @media (max-width: 350px) {
    font-size: 0.82rem;
  }
`;

const SaveAction = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: ${props => props.$status === 'unsaved' ? 'rgba(82, 183, 136, 0.15)' : 'rgba(255,255,255,0.02)'};
  border: 1px solid ${props => props.$status === 'unsaved' ? 'rgba(82, 183, 136, 0.4)' : 'transparent'};
  color: ${props => {
    if (props.$status === 'saving') return '#fbbf24';
    if (props.$status === 'error') return '#ef4444';
    if (props.$status === 'unsaved') return p.primaryLight;
    return '#64748b'; // saved
  }};
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: ${props => props.disabled ? 'default' : 'pointer'};
  transition: all 0.2s;

  &:hover {
    background: ${props => !props.disabled && 'rgba(82, 183, 136, 0.25)'};
  }

  .spin {
    animation: ${spinAnimation} 1s linear infinite;
  }
`;

const StyledQuill = styled(ReactQuill)`
  flex: 1;
  display: flex;
  flex-direction: column;
  
  .ql-toolbar {
    border: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    padding: 1rem 1.5rem;
    font-family: 'Inter', sans-serif;
    
    button {
      color: #94a3b8;
      &:hover {
        color: white;
      }
    }
    
    .ql-stroke {
      stroke: #94a3b8;
    }
    .ql-fill {
      fill: #94a3b8;
    }
    .ql-picker {
      color: #94a3b8;
    }
    .ql-active {
      .ql-stroke { stroke: ${p.primaryLight} !important; }
      .ql-fill { fill: ${p.primaryLight} !important; }
      color: ${p.primaryLight} !important;
    }
    button:hover {
      .ql-stroke { stroke: white !important; }
      .ql-fill { fill: white !important; }
    }
    .ql-picker-options {
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
    }
  }
  
  .ql-container {
    border: none;
    flex: 1;
    font-size: 1.15rem;
    font-family: 'Lora', 'Merriweather', 'Georgia', serif;
    color: #e2e8f0;
    
    .ql-editor {
      padding: 2rem;
      min-height: 400px;
      line-height: 1.8;
      overflow-wrap: break-word;
      word-break: break-word;
      min-width: 0;
      
      &.ql-blank::before {
        color: #475569;
        font-style: italic;
        left: 2rem;
      }

      h1, h2, h3 {
        font-family: 'Unbounded', 'Inter', sans-serif;
        color: white;
        margin-top: 1.5rem;
        margin-bottom: 0.75rem;
        font-weight: 600;
      }
      
      p {
        margin-bottom: 1rem;
      }
      
      ul, ol {
        margin-bottom: 1rem;
        padding-left: 1.5rem;
      }
    }
  }
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const PromptCard = styled.div`
  background: linear-gradient(145deg, #1e293b, #0f172a);
  border: 1px solid rgba(82, 183, 136, 0.2);
  border-radius: 16px;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
    background: linear-gradient(90deg, ${p.primary}, ${p.primaryLight});
  }
`;

const PromptLabel = styled.div`
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${p.primaryLight};
  font-weight: 600;
  margin-bottom: 1rem;
`;

const PromptText = styled.div`
  font-size: 1.15rem;
  font-weight: 500;
  color: white;
  line-height: 1.5;
  margin-bottom: 1.5rem;
  font-style: italic;
`;

const PromptAction = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: #94a3b8;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  justify-content: center;

  &:hover {
    background: rgba(255,255,255,0.1);
    color: white;
  }
`;

// ─── History View ───────────────────────────────────────────────────────────

const HistoryContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  min-height: 60vh;
`;

const SearchContainer = styled.div`
  position: relative;
  max-width: 500px;
  width: 100%;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
`;

const SearchInput = styled.input`
  width: 100%;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem 1rem 1rem 2.75rem;
  color: white;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: ${p.primary};
  }
`;

const HistoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const HistoryCard = styled.div`
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(82, 183, 136, 0.3);
    box-shadow: 0 10px 30px -10px rgba(0,0,0,0.3);
  }
`;

const CardDate = styled.div`
  font-weight: 600;
  font-size: 0.95rem;
  color: white;
  margin-bottom: 0.75rem;
  text-transform: capitalize;
`;

const CardPreview = styled.div`
  color: #94a3b8;
  font-size: 0.9rem;
  line-height: 1.6;
  flex: 1;
  margin-bottom: 1.5rem;
`;

const ReadMore = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: ${p.primaryLight};
  font-size: 0.85rem;
  font-weight: 500;
`;

const EmptyHistory = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #64748b;
  text-align: center;
  gap: 1rem;
  background: #0f172a;
  border-radius: 16px;
  border: 1px dashed rgba(255,255,255,0.1);
`;

const BookView = styled(motion.div)`
  background: #0f172a;
  border: 1px solid rgba(82, 183, 136, 0.2);
  border-radius: 8px 24px 24px 8px;
  padding: 3rem;
  min-height: 60vh;
  overflow: hidden;
  min-width: 0;
  box-shadow: 
    inset 4px 0 10px rgba(0,0,0,0.1),
    0 20px 50px -10px rgba(0,0,0,0.4);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    left: 20px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: rgba(255,255,255,0.05);
  }

  @media (max-width: 480px) {
    padding: 1.5rem;
    border-radius: 8px 16px 16px 8px;
  }
  @media (max-width: 350px) {
    padding: 1rem;
  }
`;

const BookHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.95rem;
  transition: color 0.2s;

  &:hover {
    color: white;
  }
`;

const BookDate = styled.div`
  font-family: 'Unbounded', sans-serif;
  color: ${p.primaryLight};
  font-weight: 500;
  text-transform: capitalize;
`;

const BookContent = styled.div`
  color: #e2e8f0;
  font-size: 1.15rem;
  line-height: 1.8;
  font-family: 'Lora', 'Merriweather', 'Georgia', serif;
  padding-left: 1rem;
  overflow-wrap: break-word;
  word-break: break-word;
  min-width: 0;
  
  h1, h2, h3 {
    font-family: 'Unbounded', 'Inter', sans-serif;
    color: white;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    font-weight: 600;
    overflow-wrap: break-word;
  }
  
  p {
    margin-bottom: 1rem;
  }
  
  ul, ol {
    margin-bottom: 1rem;
    padding-left: 1.5rem;
  }

  blockquote {
    border-left: 3px solid ${p.primary};
    margin: 1rem 0;
    padding-left: 1.25rem;
    color: #94a3b8;
    font-style: italic;
  }

  strong {
    color: white;
    font-weight: 600;
  }

  em {
    color: #cbd5e1;
  }

  a {
    color: ${p.primaryLight};
    text-decoration: underline;
  }
`;

const HistoryAction = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
`;

const HistorySaveAction = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(82, 183, 136, 0.15);
  border: 1px solid rgba(82, 183, 136, 0.4);
  color: ${p.primaryLight};
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(82, 183, 136, 0.25);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .spin {
    animation: ${spinAnimation} 1s linear infinite;
  }
`;

const HistoryEditorContainer = styled.div`
  margin-top: 1rem;
  min-height: 400px;
  display: flex;
  flex-direction: column;
`;

export default JournalPage;
