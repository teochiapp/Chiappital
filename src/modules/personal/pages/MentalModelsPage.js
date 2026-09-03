import React, { useState, useMemo, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { usePersonalHub } from '../../../context/PersonalHubContext';
import { BookOpen, Plus, Search, Trash2, CheckCircle, AlertCircle, RotateCcw, Brain, Edit2 } from 'lucide-react';
import { getUTC3DateString } from '../../../utils/helpers';

const p = {
  primary: '#8b5cf6', // Violeta para Mental Models
  primaryLight: '#a78bfa',
  bgDark: '#0f172a',
  bgCard: '#1e293b',
  textMain: '#f8fafc',
  textMuted: '#94a3b8'
};

const MentalModelsPage = () => {
  const { mentalModels, createMentalModel, updateMentalModel, reviewMentalModel, deleteMentalModel, loading } = usePersonalHub();
  const [activeTab, setActiveTab] = useState('review'); // 'review' | 'list'
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingModel, setEditingModel] = useState(null);

  // Form states
  const [conceptName, setConceptName] = useState('');
  const [content, setContent] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');

  // Flashcard states
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [delayedIds, setDelayedIds] = useState([]);

  const todayStr = getUTC3DateString();

  const [sessionCardIds, setSessionCardIds] = useState(null);

  useEffect(() => {
    if (!loading && sessionCardIds === null) {
      const allDue = mentalModels.filter(m => {
        const nextRevStr = m.next_review ? String(m.next_review).split('T')[0] : todayStr;
        return nextRevStr <= todayStr;
      });

      const byBook = {};
      allDue.forEach(m => {
        const b = m.book_title || 'Desconocido';
        if (!byBook[b]) byBook[b] = [];
        byBook[b].push(m);
      });

      const sortedBooks = Object.entries(byBook)
        .sort((a, b) => b[1].length - a[1].length)
        .map(entry => entry[0]);

      const selectedBooks = sortedBooks.slice(0, 2);

      let queue = [];
      selectedBooks.forEach(b => {
        queue = [...queue, ...byBook[b]];
      });

      const MAX_CARDS = 60;
      if (queue.length > MAX_CARDS) {
        queue = queue.slice(0, MAX_CARDS);
      }

      setSessionCardIds(queue.map(m => m.id));
    }
  }, [loading, mentalModels, sessionCardIds, todayStr]);

  const dueModels = useMemo(() => {
    if (sessionCardIds === null) return [];

    // 1. Filtrar las pendientes para hoy
    const allDue = mentalModels.filter(m => {
      const nextRevStr = m.next_review ? String(m.next_review).split('T')[0] : todayStr;
      return nextRevStr <= todayStr;
    });

    // 2. Solo quedarnos con las que se seleccionaron para la sesión inicial
    const todayQueue = allDue
      .filter(m => sessionCardIds.includes(m.id))
      .sort((a, b) => sessionCardIds.indexOf(a.id) - sessionCardIds.indexOf(b.id));

    // 3. Aplicar la lógica de "Otra vez" (mandar al final de la cola)
    const normal = todayQueue.filter(m => !delayedIds.includes(m.id));
    const delayed = todayQueue.filter(m => delayedIds.includes(m.id));
    return [...normal, ...delayed];
  }, [mentalModels, todayStr, delayedIds, sessionCardIds]);

  const currentModel = dueModels[currentReviewIndex];

  const remainingDueTotal = useMemo(() => {
    return mentalModels.filter(m => {
      const nextRevStr = m.next_review ? String(m.next_review).split('T')[0] : todayStr;
      return nextRevStr <= todayStr;
    }).length;
  }, [mentalModels, todayStr]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!conceptName.trim() || !content.trim() || !bookTitle.trim()) return;
    await createMentalModel({
      concept_name: conceptName,
      content,
      book_title: bookTitle,
      author,
      category
    });
    setConceptName('');
    setContent('');
    setBookTitle('');
    setAuthor('');
    setCategory('');
    setShowAddModal(false);
  };

  const handleEditClick = (model) => {
    setEditingModel(model);
    setConceptName(model.concept_name);
    setContent(model.content);
    setBookTitle(model.book_title);
    setAuthor(model.author || '');
    setCategory(model.category || '');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!conceptName.trim() || !content.trim() || !bookTitle.trim()) return;
    await updateMentalModel(editingModel.id, {
      concept_name: conceptName,
      content,
      book_title: bookTitle,
      author,
      category
    });
    setShowEditModal(false);
    setEditingModel(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este concepto?')) {
      await deleteMentalModel(id);
    }
  };

  const handleReview = async (quality) => {
    if (!currentModel || isProcessing) return;

    setIsProcessing(true);
    setIsFlipped(false);

    const modelId = currentModel.id;
    const queueLength = dueModels.length;

    setTimeout(async () => {
      if (quality === 0 || (quality === 1 && currentModel.repetition === 0)) {
        // Mover al final
        setDelayedIds(prev => {
          if (!prev.includes(modelId)) return [...prev, modelId];
          return prev;
        });
        setCurrentReviewIndex(prev => {
          if (queueLength <= 1) return 0;
          return (prev + 1) >= queueLength ? 0 : prev;
        });
      } else {
        // La tarjeta sale de la cola hoy
        setCurrentReviewIndex(prev => {
          const nextQueue = queueLength - 1;
          if (nextQueue <= 0) return 0;
          return prev >= nextQueue ? 0 : prev;
        });
      }
      await reviewMentalModel(modelId, quality);
      setIsProcessing(false);
    }, 300);
  };

  const getIntervalLabel = (quality, model) => {
    if (!model) return '';
    let { repetition, interval_days, ease_factor } = model;
    interval_days = interval_days || 0;
    ease_factor = ease_factor || 2.5;

    if (quality === 0) return 'Hoy';
    if (quality === 1) {
      if (repetition === 0) return 'Hoy';
      return `~${Math.max(1, Math.round(interval_days * 1.2))}d`;
    }
    if (quality === 2) {
      if (repetition === 0) return '14d';
      if (repetition === 1) return '30d';
      return `~${Math.round(interval_days * ease_factor)}d`;
    }
    if (quality === 3) {
      if (repetition === 0) return '21d';
      if (repetition === 1) return '45d';
      return `~${Math.round(interval_days * ease_factor * 1.5)}d`;
    }
    return '';
  };

  if (loading) {
    return <Container><p>Cargando Mental Models...</p></Container>;
  }

  return (
    <Container>
      <TopSection>
        <PageTitle>
          <Brain size={28} color={p.primaryLight} /> Mental Models
        </PageTitle>
        <PageSubtitle>Ideas, conceptos y modelos mentales extraídos de libros</PageSubtitle>
      </TopSection>

      <Tabs>
        <Tab $active={activeTab === 'review'} onClick={() => { setActiveTab('review'); setIsFlipped(false); }}>
          Sesión de Estudio ({dueModels.length})
        </Tab>
        <Tab $active={activeTab === 'list'} onClick={() => setActiveTab('list')}>
          Biblioteca ({mentalModels.length})
        </Tab>
      </Tabs>

      {activeTab === 'review' && (
        <ReviewContainer>
          {dueModels.length > 0 ? (
            <FlashcardWrapper>
              <Flashcard $flipped={isFlipped} onClick={() => {
                if (!isProcessing) setIsFlipped(true);
              }}>
                <CardFront>
                  <CardLabel>Concepto</CardLabel>
                  <CardWord>{currentModel.concept_name}</CardWord>
                  <CardHint>Toca para ver el contenido</CardHint>
                </CardFront>
                <CardBack>
                  <CardContentContainer>
                    <CardTranslation>{currentModel.content}</CardTranslation>
                    <BookReference>
                      <BookOpen size={14} style={{ marginRight: '6px', opacity: 0.7 }} />
                      <span>{currentModel.book_title}</span>
                      {currentModel.author && <span> - {currentModel.author}</span>}
                    </BookReference>
                    {currentModel.category && <CategoryBadge>{currentModel.category}</CategoryBadge>}
                  </CardContentContainer>
                </CardBack>
              </Flashcard>

              {isFlipped && (
                <ActionButtons>
                  <EvalBtn $color="#ef4444" onClick={(e) => { e.stopPropagation(); handleReview(0); }}>
                    <RotateCcw size={18} />
                    <span>Otra vez<br /><small>({getIntervalLabel(0, currentModel)})</small></span>
                  </EvalBtn>
                  <EvalBtn $color="#f59e0b" onClick={(e) => { e.stopPropagation(); handleReview(1); }}>
                    <AlertCircle size={18} />
                    <span>Difícil<br /><small>({getIntervalLabel(1, currentModel)})</small></span>
                  </EvalBtn>
                  <EvalBtn $color="#10b981" onClick={(e) => { e.stopPropagation(); handleReview(2); }}>
                    <CheckCircle size={18} />
                    <span>Bien<br /><small>({getIntervalLabel(2, currentModel)})</small></span>
                  </EvalBtn>
                  <EvalBtn $color="#8b5cf6" onClick={(e) => { e.stopPropagation(); handleReview(3); }}>
                    <CheckCircle size={18} />
                    <span>Fácil<br /><small>({getIntervalLabel(3, currentModel)})</small></span>
                  </EvalBtn>
                </ActionButtons>
              )}
            </FlashcardWrapper>
          ) : (
            <AllDoneState>
              <CheckCircle size={48} color="#10b981" />
              <h3>¡Sesión Completada!</h3>
              <p>No tienes más conceptos pendientes de la sesión actual.</p>
              {remainingDueTotal > 0 && (
                <ContinueBtn onClick={() => setSessionCardIds(null)}>
                  Seguir repasando (+60)
                </ContinueBtn>
              )}
            </AllDoneState>
          )}
        </ReviewContainer>
      )}

      {activeTab === 'list' && (
        <ListContainer>
          <ListHeader>
            <SearchBox>
              <Search size={16} />
              <input type="text" placeholder="Buscar conceptos..." disabled />
            </SearchBox>
            <AddBtn onClick={() => {
              setConceptName('');
              setContent('');
              setBookTitle('');
              setAuthor('');
              setCategory('');
              setEditingModel(null);
              setShowAddModal(true);
            }}>
              <Plus size={16} /> Nueva Tarjeta
            </AddBtn>
          </ListHeader>

          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th>Libro</th>
                  <th>Próximo Repaso</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mentalModels.map(model => (
                  <tr key={model.id}>
                    <td><strong>{model.concept_name}</strong></td>
                    <td>{model.book_title}</td>
                    <td>{model.next_review ? String(model.next_review).split('T')[0].split('-').reverse().join('/') : ''}</td>
                    <td>
                      <ActionButtonsRow>
                        <EditBtn onClick={() => handleEditClick(model)}><Edit2 size={16} /></EditBtn>
                        <DelBtn onClick={() => handleDelete(model.id)}><Trash2 size={16} /></DelBtn>
                      </ActionButtonsRow>
                    </td>
                  </tr>
                ))}
                {mentalModels.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No hay conceptos guardados.</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </TableWrapper>
        </ListContainer>
      )}

      {(showAddModal || showEditModal) && (
        <ModalOverlay onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalTitle>{showEditModal ? 'Editar Concepto' : 'Nueva Tarjeta'}</ModalTitle>
            <form onSubmit={showEditModal ? handleEditSubmit : handleAdd}>
              <FormGroup>
                <label>Concepto / Título *</label>
                <Input value={conceptName} onChange={e => setConceptName(e.target.value)} required autoFocus placeholder="Ej. Circle of Competence" />
              </FormGroup>
              <FormGroup>
                <label>Contenido (Cita, idea, frase) *</label>
                <Input as="textarea" rows="4" value={content} onChange={e => setContent(e.target.value)} required placeholder="Know what you know and know what you don't know..." />
              </FormGroup>
              <FormRow>
                <FormGroup style={{ flex: 1 }}>
                  <label>Libro *</label>
                  <Input value={bookTitle} onChange={e => setBookTitle(e.target.value)} required placeholder="Ej. Poor Charlie's Almanack" />
                </FormGroup>
                <FormGroup style={{ flex: 1 }}>
                  <label>Autor</label>
                  <Input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Ej. Charlie Munger" />
                </FormGroup>
              </FormRow>
              <FormGroup>
                <label>Categoría Temática</label>
                <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="Ej. Inversión" />
              </FormGroup>
              <ModalActions>
                <CancelBtn type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>Cancelar</CancelBtn>
                <SaveBtn type="submit">Guardar</SaveBtn>
              </ModalActions>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  padding: 2rem;
  color: ${p.textMain};
  max-width: 1000px;
  margin: 0 auto;
  animation: ${fadeUp} 0.4s ease-out;

  @media (max-width: 768px) {
    padding: 1.25rem 1rem;
  }
`;

const TopSection = styled.div`
  margin-bottom: 2rem;
`;

const PageTitle = styled.h1`
  font-size: 1.6rem;
  font-family: 'Unbounded', sans-serif;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PageSubtitle = styled.p`
  color: ${p.textMuted};
`;

const Tabs = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  padding-bottom: 0.5rem;
`;

const Tab = styled.button`
  background: none;
  border: none;
  color: ${props => props.$active ? '#fff' : p.textMuted};
  font-family: 'Unbounded', sans-serif;
  font-size: 1rem;
  font-weight: ${props => props.$active ? '600' : '400'};
  cursor: pointer;
  position: relative;
  padding: 0.5rem;
  
  &:after {
    content: '';
    position: absolute;
    bottom: -0.6rem;
    left: 0;
    width: 100%;
    height: 2px;
    background: ${p.primary};
    transform: scaleX(${props => props.$active ? 1 : 0});
    transition: transform 0.2s;
  }
`;

// Review Mode

const ReviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 3rem;
`;

const FlashcardWrapper = styled.div`
  width: 100%;
  max-width: 500px;
  perspective: 1000px;
`;

const Flashcard = styled.div`
  width: 100%;
  min-height: 350px;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
  transform: ${props => props.$flipped ? 'rotateY(180deg)' : 'rotateY(0)'};
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  border-radius: 16px;
`;

const CardFace = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.5rem;
  text-align: center;
  background: ${p.bgCard};
  border: 1px solid rgba(255,255,255,0.05);
`;

const CardFront = styled(CardFace)`
`;

const CardBack = styled(CardFace)`
  transform: rotateY(180deg);
  background: linear-gradient(135deg, ${p.bgCard}, #1e293b);
  align-items: flex-start;
  text-align: left;
`;

const CardLabel = styled.span`
  font-size: 0.8rem;
  color: ${p.textMuted};
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 1rem;
`;

const CardWord = styled.h2`
  font-size: 2rem;
  font-family: 'Unbounded', sans-serif;
  margin: 0;
  color: #fff;
`;

const CardHint = styled.p`
  position: absolute;
  bottom: 1.5rem;
  font-size: 0.8rem;
  color: ${p.textMuted};
`;

const CardContentContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
`;

const CardTranslation = styled.h2`
  font-size: 1.3rem;
  font-family: 'Unbounded', sans-serif;
  margin: 0 0 2rem 0;
  color: ${p.primaryLight};
  line-height: 1.5;
`;

const BookReference = styled.div`
  font-size: 0.95rem;
  color: #cbd5e1;
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const CategoryBadge = styled.span`
  display: inline-block;
  background: rgba(139, 92, 246, 0.2);
  color: ${p.primaryLight};
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-top: 0.5rem;
  align-self: flex-start;
`;

const ActionButtons = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  margin-top: 1.5rem;
  animation: ${fadeUp} 0.3s ease-out;
  width: 100%;

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const EvalBtn = styled.button`
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 1rem 0.5rem;
  color: #fff;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  
  span {
    font-size: 0.85rem;
    font-weight: 500;
  }
  
  small {
    color: ${p.textMuted};
    font-size: 0.7rem;
  }

  svg {
    color: ${props => props.$color};
  }

  &:hover {
    background: ${props => props.$color}15;
    border-color: ${props => props.$color}50;
    transform: translateY(-2px);
  }
`;

const AllDoneState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  color: ${p.textMuted};
  padding: 4rem 2rem;
  background: ${p.bgCard};
  border-radius: 16px;
  border: 1px dashed rgba(255,255,255,0.1);
  
  h3 {
    margin: 1rem 0 0.5rem 0;
    color: #fff;
  }
`;

const ContinueBtn = styled.button`
  background: ${p.primary};
  color: #fff;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-family: 'Unbounded', sans-serif;
  font-size: 0.9rem;
  margin-top: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${p.primaryLight};
    transform: translateY(-2px);
  }
`;

// List Mode

const ListContainer = styled.div``;

const ListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255,255,255,0.05);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  width: 300px;
  
  input {
    background: transparent;
    border: none;
    color: #fff;
    outline: none;
    width: 100%;
  }

  @media (max-width: 480px) {
    width: 100%;
  }
`;

const AddBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: ${p.primary};
  color: #fff;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: ${p.primaryLight};
  }
`;

const TableWrapper = styled.div`
  background: ${p.bgCard};
  border-radius: 12px;
  overflow-x: auto;
  border: 1px solid rgba(255,255,255,0.05);
  -webkit-overflow-scrolling: touch;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  
  th {
    color: ${p.textMuted};
    font-weight: 500;
    font-size: 0.9rem;
    background: rgba(255,255,255,0.02);
  }
`;

const ActionButtonsRow = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const EditBtn = styled.button`
  background: transparent;
  border: none;
  color: ${p.primaryLight};
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  
  &:hover {
    background: rgba(167, 139, 250, 0.1);
  }
`;

const DelBtn = styled.button`
  background: transparent;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  
  &:hover {
    background: rgba(239, 68, 68, 0.1);
  }
`;

// Modals

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: ${p.bgCard};
  padding: 2rem;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  border: 1px solid rgba(255,255,255,0.1);
`;

const ModalTitle = styled.h2`
  margin: 0 0 1.5rem 0;
  font-family: 'Unbounded', sans-serif;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
  label {
    display: block;
    margin-bottom: 0.5rem;
    color: ${p.textMuted};
    font-size: 0.9rem;
  }
`;

const FormRow = styled.div`
  display: flex;
  gap: 1rem;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 0;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.05);
  color: #fff;
  font-family: inherit;
  outline: none;
  resize: vertical;
  
  &:focus {
    border-color: ${p.primary};
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
`;

const CancelBtn = styled.button`
  background: transparent;
  border: none;
  color: ${p.textMuted};
  cursor: pointer;
  padding: 0.5rem 1rem;
  
  &:hover {
    color: #fff;
  }
`;

const SaveBtn = styled.button`
  background: ${p.primary};
  color: #fff;
  border: none;
  padding: 0.6rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background: ${p.primaryLight};
  }
`;

export default MentalModelsPage;
