import React, { useState, useMemo, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { usePersonalHub } from '../../../context/PersonalHubContext';
import { Plus, Search, Trash2, CheckCircle, AlertCircle, RotateCcw, Shield, Edit2, Tag, Terminal } from 'lucide-react';
import { getUTC3DateString, parseHabitDays } from '../../../utils/helpers';

const p = {
  primary: '#06b6d4', // Cyan / Azul ciberseguridad
  primaryLight: '#67e8f9',
  bgDark: '#0f172a',
  bgCard: '#1e293b',
  textMain: '#f8fafc',
  textMuted: '#94a3b8'
};

// Paletas de color para Ciberseguridad por tema/categoría
export const CYBER_PALETTES = [
  {
    name: 'cyan', // Redes
    primary: '#06b6d4',
    light: '#67e8f9',
    bgGlow: 'rgba(6, 182, 212, 0.22)',
    borderColor: 'rgba(6, 182, 212, 0.45)',
    badgeBg: 'rgba(6, 182, 212, 0.2)',
    badgeText: '#67e8f9'
  },
  {
    name: 'emerald', // Criptografía / Defensivo
    primary: '#10b981',
    light: '#34d399',
    bgGlow: 'rgba(16, 185, 129, 0.22)',
    borderColor: 'rgba(16, 185, 129, 0.45)',
    badgeBg: 'rgba(16, 185, 129, 0.2)',
    badgeText: '#6ee7b7'
  },
  {
    name: 'rose', // Malware / Offensive
    primary: '#f43f5e',
    light: '#fb7185',
    bgGlow: 'rgba(244, 63, 94, 0.22)',
    borderColor: 'rgba(244, 63, 94, 0.45)',
    badgeBg: 'rgba(244, 63, 94, 0.2)',
    badgeText: '#fca5a5'
  },
  {
    name: 'amber', // Hacking Ético
    primary: '#f59e0b',
    light: '#fbbf24',
    bgGlow: 'rgba(245, 158, 11, 0.22)',
    borderColor: 'rgba(245, 158, 11, 0.45)',
    badgeBg: 'rgba(245, 158, 11, 0.2)',
    badgeText: '#fde68a'
  },
  {
    name: 'violet', // Seguridad Web
    primary: '#8b5cf6',
    light: '#a78bfa',
    bgGlow: 'rgba(139, 92, 246, 0.22)',
    borderColor: 'rgba(139, 92, 246, 0.45)',
    badgeBg: 'rgba(139, 92, 246, 0.2)',
    badgeText: '#c4b5fd'
  },
  {
    name: 'teal', // Forense / SIEM
    primary: '#14b8a6',
    light: '#2dd4bf',
    bgGlow: 'rgba(20, 184, 166, 0.22)',
    borderColor: 'rgba(20, 184, 166, 0.45)',
    badgeBg: 'rgba(20, 184, 166, 0.2)',
    badgeText: '#5eead4'
  },
  {
    name: 'blue', // DevSecOps / Cloud
    primary: '#3b82f6',
    light: '#60a5fa',
    bgGlow: 'rgba(59, 130, 246, 0.22)',
    borderColor: 'rgba(59, 130, 246, 0.45)',
    badgeBg: 'rgba(59, 130, 246, 0.2)',
    badgeText: '#93c5fd'
  },
  {
    name: 'fuchsia', // OSINT & Recon
    primary: '#d946ef',
    light: '#e879f9',
    bgGlow: 'rgba(217, 70, 239, 0.22)',
    borderColor: 'rgba(217, 70, 239, 0.45)',
    badgeBg: 'rgba(217, 70, 239, 0.2)',
    badgeText: '#f0abfc'
  }
];

export const CPTS_MODULES = [
  'Getting Started',
  'Network Fundamentals',
  'Linux Fundamentals',
  'Windows Fundamentals',
  'Web Requests',
  'Using Web Proxies',
  'Information Gathering - Web',
  'Footprinting',
  'Network Enumeration (Nmap)',
  'Vulnerability Assessment',
  'File Inclusion',
  'File Upload Attacks',
  'Command Injections',
  'SQL Injection (SQLi)',
  'SQLMap Essentials',
  'Cross-Site Scripting (XSS)',
  'Login Attacks',
  'Password Attacks',
  'Attacking Common Services',
  'Pivoting & Tunneling',
  'Active Directory Attacks',
  'Metasploit Framework',
  'Linux PrivEsc',
  'Windows PrivEsc',
  'Documentation & Reporting'
];

const PREDEFINED_CATEGORIES = {
  // HTB CPTS Path Modules
  'getting started': CYBER_PALETTES[4], // violet
  'network fundamentals': CYBER_PALETTES[0], // cyan
  redes: CYBER_PALETTES[0],
  'linux fundamentals': CYBER_PALETTES[3], // amber
  linux: CYBER_PALETTES[3],
  'windows fundamentals': CYBER_PALETTES[6], // blue
  windows: CYBER_PALETTES[6],
  'web requests': CYBER_PALETTES[7], // fuchsia
  'using web proxies': CYBER_PALETTES[7],
  'information gathering - web': CYBER_PALETTES[5], // teal
  'information gathering': CYBER_PALETTES[5],
  footprinting: CYBER_PALETTES[5],
  'network enumeration (nmap)': CYBER_PALETTES[0],
  nmap: CYBER_PALETTES[0],
  'vulnerability assessment': CYBER_PALETTES[1], // emerald
  'file inclusion': CYBER_PALETTES[2], // rose
  'file upload attacks': CYBER_PALETTES[2],
  'command injections': CYBER_PALETTES[2],
  'sql injection (sqli)': CYBER_PALETTES[2],
  sqli: CYBER_PALETTES[2],
  'sqlmap essentials': CYBER_PALETTES[2],
  'cross-site scripting (xss)': CYBER_PALETTES[4],
  xss: CYBER_PALETTES[4],
  'login attacks': CYBER_PALETTES[3],
  'password attacks': CYBER_PALETTES[3],
  'attacking common services': CYBER_PALETTES[1],
  'pivoting & tunneling': CYBER_PALETTES[5],
  'pivoting, tunneling & port forwarding': CYBER_PALETTES[5],
  'active directory attacks': CYBER_PALETTES[6],
  'active directory enumeration & attacks': CYBER_PALETTES[6],
  'active directory': CYBER_PALETTES[6],
  'metasploit framework': CYBER_PALETTES[7],
  'using metasploit framework': CYBER_PALETTES[7],
  'linux privesc': CYBER_PALETTES[3],
  'linux privilege escalation': CYBER_PALETTES[3],
  'windows privesc': CYBER_PALETTES[6],
  'windows privilege escalation': CYBER_PALETTES[6],
  'documentation & reporting': CYBER_PALETTES[1],

  // Fallbacks genéricos
  criptografia: CYBER_PALETTES[1],
  malware: CYBER_PALETTES[2],
  pentesting: CYBER_PALETTES[3],
  web: CYBER_PALETTES[4],
  forense: CYBER_PALETTES[5],
  soc: CYBER_PALETTES[5],
  devsecops: CYBER_PALETTES[6],
  osint: CYBER_PALETTES[7]
};

export const getCyberCategoryTheme = (categoryStr) => {
  if (!categoryStr || !categoryStr.trim()) {
    return CYBER_PALETTES[0]; // cian por defecto
  }
  const clean = categoryStr.trim().toLowerCase();
  if (PREDEFINED_CATEGORIES[clean]) {
    return PREDEFINED_CATEGORIES[clean];
  }
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CYBER_PALETTES.length;
  return CYBER_PALETTES[index];
};

const CybersecurityPage = () => {
  const { cybersecurityCards, createCybersecurityCard, updateCybersecurityCard, reviewCybersecurityCard, deleteCybersecurityCard, loading, habits, toggleHabit } = usePersonalHub();
  const [activeTab, setActiveTab] = useState('review'); // 'review' | 'list'
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [conceptName, setConceptName] = useState('');
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');

  // Flashcard states
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [delayedIds, setDelayedIds] = useState([]);
  const [habitToast, setHabitToast] = useState(null);

  const todayStr = getUTC3DateString();
  const [sessionCardIds, setSessionCardIds] = useState(null);

  useEffect(() => {
    if (!loading && sessionCardIds === null) {
      try {
        const savedRaw = localStorage.getItem('chiappital_cybersecurity_session');
        if (savedRaw) {
          const saved = JSON.parse(savedRaw);
          if (saved && saved.date === todayStr && Array.isArray(saved.cardIds)) {
            setSessionCardIds(saved.cardIds);
            return;
          }
        }
      } catch (e) {
        console.error('Error loading session from localStorage:', e);
      }

      const allDue = cybersecurityCards.filter(c => {
        const nextRevStr = c.next_review ? String(c.next_review).split('T')[0] : todayStr;
        return nextRevStr <= todayStr;
      });

      const byCategory = {};
      allDue.forEach(c => {
        const cat = c.category || 'General';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(c);
      });

      let queue = [];
      Object.values(byCategory).forEach(list => {
        queue = [...queue, ...list];
      });

      const MAX_CARDS = 60; // Límite máximo de 60 por sesión de estudio
      if (queue.length > MAX_CARDS) {
        queue = queue.slice(0, MAX_CARDS);
      }

      const newIds = queue.map(c => c.id);
      try {
        localStorage.setItem('chiappital_cybersecurity_session', JSON.stringify({
          date: todayStr,
          cardIds: newIds
        }));
      } catch (e) {
        console.error('Error saving session to localStorage:', e);
      }

      setSessionCardIds(newIds);
    }
  }, [loading, cybersecurityCards, sessionCardIds, todayStr]);

  const dueCards = useMemo(() => {
    if (sessionCardIds === null) return [];

    const allDue = cybersecurityCards.filter(c => {
      const nextRevStr = c.next_review ? String(c.next_review).split('T')[0] : todayStr;
      return nextRevStr <= todayStr;
    });

    const todayQueue = allDue
      .filter(c => sessionCardIds.includes(c.id))
      .sort((a, b) => sessionCardIds.indexOf(a.id) - sessionCardIds.indexOf(b.id));

    const normal = todayQueue.filter(c => !delayedIds.includes(c.id));
    const delayed = todayQueue.filter(c => delayedIds.includes(c.id));
    return [...normal, ...delayed];
  }, [cybersecurityCards, todayStr, delayedIds, sessionCardIds]);

  const currentCard = dueCards[currentReviewIndex];
  const currentTheme = useMemo(() => getCyberCategoryTheme(currentCard?.category), [currentCard]);

  const filteredCards = useMemo(() => {
    if (!searchTerm.trim()) return cybersecurityCards;
    const term = searchTerm.toLowerCase();
    return cybersecurityCards.filter(c =>
      (c.concept_name && c.concept_name.toLowerCase().includes(term)) ||
      (c.content && c.content.toLowerCase().includes(term)) ||
      (c.topic && c.topic.toLowerCase().includes(term)) ||
      (c.category && c.category.toLowerCase().includes(term))
    );
  }, [cybersecurityCards, searchTerm]);

  const remainingDueTotal = useMemo(() => {
    return cybersecurityCards.filter(c => {
      const nextRevStr = c.next_review ? String(c.next_review).split('T')[0] : todayStr;
      return nextRevStr <= todayStr;
    }).length;
  }, [cybersecurityCards, todayStr]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!conceptName.trim() || !content.trim()) return;
    await createCybersecurityCard({
      concept_name: conceptName,
      content,
      topic,
      author,
      category
    });
    setConceptName('');
    setContent('');
    setTopic('');
    setAuthor('');
    setCategory('');
    setShowAddModal(false);
  };

  const handleEditClick = (card) => {
    setEditingCard(card);
    setConceptName(card.concept_name);
    setContent(card.content);
    setTopic(card.topic || '');
    setAuthor(card.author || '');
    setCategory(card.category || '');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!conceptName.trim() || !content.trim()) return;
    await updateCybersecurityCard(editingCard.id, {
      concept_name: conceptName,
      content,
      topic,
      author,
      category
    });
    setShowEditModal(false);
    setEditingCard(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este concepto de ciberseguridad?')) {
      await deleteCybersecurityCard(id);
    }
  };

  const handleReview = async (quality) => {
    if (!currentCard || isProcessing) return;

    setIsProcessing(true);
    setIsFlipped(false);

    const cardId = currentCard.id;
    const queueLength = dueCards.length;

    setTimeout(async () => {
      if (quality === 0 || (quality === 1 && currentCard.repetition === 0)) {
        setDelayedIds(prev => {
          if (!prev.includes(cardId)) return [...prev, cardId];
          return prev;
        });
        setCurrentReviewIndex(prev => {
          if (queueLength <= 1) return 0;
          return (prev + 1) >= queueLength ? 0 : prev;
        });
      } else {
        setCurrentReviewIndex(prev => {
          const nextQueue = queueLength - 1;
          if (nextQueue <= 0) return 0;
          return prev >= nextQueue ? 0 : prev;
        });
      }
      await reviewCybersecurityCard(cardId, quality);

      const isLeavingQueue = !(quality === 0 || (quality === 1 && currentCard.repetition === 0));
      const willBeEmpty = isLeavingQueue && queueLength <= 1;

      // ── Auto-completar hábito al terminar la sesión del día ──
      if (willBeEmpty && habits && habits.length > 0) {
        const today = getUTC3DateString();
        const todayDow = new Date().getDay();
        const TARGET_NAME = 'tarjetas de ciberseguridad';
        const linked = habits.find(h => {
          const name = (h.name || '').toLowerCase().trim();
          const isScheduled = parseHabitDays(h.days_of_week).includes(todayDow);
          const notDone = !(h.completions || []).includes(today);
          return name === TARGET_NAME && isScheduled && notDone;
        });
        if (linked) {
          await toggleHabit(linked.id, today);
          setHabitToast({ name: linked.name });
          setTimeout(() => setHabitToast(null), 3500);
        }
      }

      setIsProcessing(false);
    }, 300);
  };

  // Cooldowns de menor duración base para Ciberseguridad
  const getIntervalLabel = (quality, card) => {
    if (!card) return '';
    let { repetition, interval_days, ease_factor } = card;
    interval_days = interval_days || 0;
    ease_factor = ease_factor || 2.5;

    if (quality === 0) return 'Hoy';
    if (quality === 1) return '1d';
    if (quality === 2) {
      if (repetition === 0) return '3d';
      if (repetition === 1) return '7d';
      return `~${Math.round(interval_days * 1.8)}d`;
    }
    if (quality === 3) {
      if (repetition === 0) return '7d';
      if (repetition === 1) return '15d';
      return `~${Math.round(interval_days * ease_factor * 1.1)}d`;
    }
    return '';
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showAddModal || showEditModal) return;
      if (activeTab !== 'review' || isProcessing || !currentCard) return;

      if (!isFlipped) {
        if (e.key === 'Enter') {
          e.preventDefault();
          setIsFlipped(true);
        }
        return;
      }

      if (e.key === '0') handleReview(0);
      else if (e.key === '1') handleReview(1);
      else if (e.key === '2') handleReview(2);
      else if (e.key === '3') handleReview(3);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isFlipped, isProcessing, currentCard, showAddModal, showEditModal]);

  if (loading) {
    return <Container><p>Cargando Ciberseguridad...</p></Container>;
  }

  return (
    <Container>
      {habitToast && (
        <HabitToast>
          ✅ Hábito <strong>&ldquo;{habitToast.name}&rdquo;</strong> completado automáticamente
        </HabitToast>
      )}
      <TopSection>
        <PageTitle>
          <Shield size={30} color={p.primaryLight} /> Ciberseguridad
        </PageTitle>
        <PageSubtitle>Estudio de vulnerabilidades, protocolos, comandos y conceptos de seguridad</PageSubtitle>
      </TopSection>

      <Tabs>
        <Tab $active={activeTab === 'review'} onClick={() => { setActiveTab('review'); setIsFlipped(false); }}>
          Sesión de Estudio ({dueCards.length})
        </Tab>
        <Tab $active={activeTab === 'list'} onClick={() => setActiveTab('list')}>
          Biblioteca ({cybersecurityCards.length})
        </Tab>
      </Tabs>

      {activeTab === 'review' && (
        <ReviewContainer>
          {dueCards.length > 0 ? (
            <FlashcardWrapper>
              <Flashcard $flipped={isFlipped} onClick={() => {
                if (!isProcessing) setIsFlipped(true);
              }}>
                <CardFront $theme={currentTheme}>
                  <CardTopAccent $theme={currentTheme} />
                  {currentCard.category && (
                    <CategoryBadge $theme={currentTheme}>
                      <Tag size={12} /> {currentCard.category}
                    </CategoryBadge>
                  )}
                  <CardLabel>Concepto / Comando</CardLabel>
                  <CardWord $theme={currentTheme}>{currentCard.concept_name}</CardWord>
                  <CardHint>Toca para ver la explicación / solución</CardHint>
                </CardFront>
                <CardBack $theme={currentTheme}>
                  <CardTopAccent $theme={currentTheme} />
                  <CardContentContainer>
                    {currentCard.category && (
                      <CategoryBadge $theme={currentTheme} style={{ marginBottom: '1rem' }}>
                        <Tag size={12} /> {currentCard.category}
                      </CategoryBadge>
                    )}
                    <CardTranslation $theme={currentTheme}>{currentCard.content}</CardTranslation>
                    {currentCard.topic && (
                      <BookReference>
                        <Terminal size={15} style={{ marginRight: '6px', opacity: 0.7 }} />
                        <span>Módulo: {currentCard.topic}</span>
                        {currentCard.author && <span> - {currentCard.author}</span>}
                      </BookReference>
                    )}
                  </CardContentContainer>
                </CardBack>
              </Flashcard>

              {isFlipped && (
                <ActionButtons>
                  <EvalBtn $color="#ef4444" onClick={(e) => { e.stopPropagation(); handleReview(0); }}>
                    <RotateCcw size={18} />
                    <span>[0] Otra vez<br /><small>({getIntervalLabel(0, currentCard)})</small></span>
                  </EvalBtn>
                  <EvalBtn $color="#f59e0b" onClick={(e) => { e.stopPropagation(); handleReview(1); }}>
                    <AlertCircle size={18} />
                    <span>[1] Difícil<br /><small>({getIntervalLabel(1, currentCard)})</small></span>
                  </EvalBtn>
                  <EvalBtn $color="#10b981" onClick={(e) => { e.stopPropagation(); handleReview(2); }}>
                    <CheckCircle size={18} />
                    <span>[2] Bien<br /><small>({getIntervalLabel(2, currentCard)})</small></span>
                  </EvalBtn>
                  <EvalBtn $color={currentTheme.primary} onClick={(e) => { e.stopPropagation(); handleReview(3); }}>
                    <CheckCircle size={18} />
                    <span>[3] Fácil<br /><small>({getIntervalLabel(3, currentCard)})</small></span>
                  </EvalBtn>
                </ActionButtons>
              )}
            </FlashcardWrapper>
          ) : (
            <AllDoneState>
              <CheckCircle size={48} color="#10b981" />
              <h3>¡Sesión Completada!</h3>
              <p>No tienes más conceptos pendientes de ciberseguridad para repasar hoy.</p>
              {remainingDueTotal > 0 && (
                <ContinueBtn onClick={() => {
                  try {
                    localStorage.removeItem('chiappital_cybersecurity_session');
                  } catch (e) {}
                  setSessionCardIds(null);
                }}>
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
              <input 
                type="text" 
                placeholder="Buscar por concepto, categoría, tema..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </SearchBox>
            <AddBtn onClick={() => {
              setConceptName('');
              setContent('');
              setTopic('');
              setAuthor('');
              setCategory('');
              setEditingCard(null);
              setShowAddModal(true);
            }}>
              <Plus size={16} /> Nueva Tarjeta
            </AddBtn>
          </ListHeader>

          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <th>Concepto / Comando</th>
                  <th>Categoría</th>
                  <th>Módulo / Tema</th>
                  <th>Próximo Repaso</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCards.map(card => {
                  const cardTheme = getCyberCategoryTheme(card.category);
                  return (
                    <tr key={card.id}>
                      <td><strong>{card.concept_name}</strong></td>
                      <td>
                        {card.category ? (
                          <CategoryBadge $theme={cardTheme} style={{ margin: 0 }}>
                            <Tag size={11} /> {card.category}
                          </CategoryBadge>
                        ) : (
                          <span style={{ color: p.textMuted, fontSize: '0.85rem' }}>-</span>
                        )}
                      </td>
                      <td>{card.topic || '-'}</td>
                      <td>{card.next_review ? String(card.next_review).split('T')[0].split('-').reverse().join('/') : ''}</td>
                      <td>
                        <ActionButtonsRow>
                          <EditBtn onClick={() => handleEditClick(card)}><Edit2 size={16} /></EditBtn>
                          <DelBtn onClick={() => handleDelete(card.id)}><Trash2 size={16} /></DelBtn>
                        </ActionButtonsRow>
                      </td>
                    </tr>
                  );
                })}
                {filteredCards.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No se encontraron tarjetas.</td>
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
            <ModalTitle>{showEditModal ? 'Editar Tarjeta' : 'Nueva Tarjeta'}</ModalTitle>
            <form onSubmit={showEditModal ? handleEditSubmit : handleAdd}>
              <FormGroup>
                <label>Concepto / Comando / Vulnerabilidad *</label>
                <Input value={conceptName} onChange={e => setConceptName(e.target.value)} required autoFocus placeholder="Ej. SQL Injection (SQLi) / nmap -sV" />
              </FormGroup>
              <FormGroup>
                <label>Explicación / Sintaxis / Mitigación *</label>
                <Input as="textarea" rows="4" value={content} onChange={e => setContent(e.target.value)} required placeholder="Inyección de código SQL por falta de sanitización..." />
              </FormGroup>
              <FormRow>
                <FormGroup style={{ flex: 1 }}>
                  <label>Módulo / Referencia</label>
                  <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Ej. OWASP Top 10" />
                </FormGroup>
                <FormGroup style={{ flex: 1 }}>
                  <label>Herramienta / Autor</label>
                  <Input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Ej. Nmap, Metasploit, PortSwigger" />
                </FormGroup>
              </FormRow>
              <FormGroup>
                <label>Módulo / Categoría HTB CPTS *</label>
                <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="Ej. Network Enumeration (Nmap), SQL Injection (SQLi)..." />
                <ChipContainer>
                  {CPTS_MODULES.map(cat => {
                    const catTheme = getCyberCategoryTheme(cat);
                    const isSelected = category.trim().toLowerCase() === cat.toLowerCase();
                    return (
                      <CategoryChip
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        $theme={catTheme}
                        $active={isSelected}
                      >
                        {cat}
                      </CategoryChip>
                    );
                  })}
                </ChipContainer>
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
  gap: 0.6rem;
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
  margin-top: 2rem;
`;

const FlashcardWrapper = styled.div`
  width: 100%;
  max-width: 680px;
  perspective: 1000px;
`;

const Flashcard = styled.div`
  width: 100%;
  min-height: 460px;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
  transform: ${props => props.$flipped ? 'rotateY(180deg)' : 'rotateY(0)'};
  cursor: pointer;
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
  padding: 3rem 2.5rem;
  text-align: center;
  background: radial-gradient(circle at 50% 0%, ${props => props.$theme?.bgGlow || 'rgba(6,182,212,0.2)'}, transparent 75%), ${p.bgCard};
  border: 1px solid ${props => props.$theme?.borderColor || 'rgba(255,255,255,0.08)'};
  box-shadow: 0 14px 36px rgba(0,0,0,0.4), 0 0 28px ${props => props.$theme?.bgGlow || 'transparent'};
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
`;

const CardTopAccent = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, ${props => props.$theme?.primary || p.primary}, ${props => props.$theme?.light || p.primaryLight});
`;

const CardFront = styled(CardFace)`
`;

const CardBack = styled(CardFace)`
  transform: rotateY(180deg);
  align-items: flex-start;
  text-align: left;
`;

const CardLabel = styled.span`
  font-size: 0.8rem;
  color: ${p.textMuted};
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: 0.85rem;
`;

const CardWord = styled.h2`
  font-size: 2.2rem;
  font-family: 'Unbounded', sans-serif;
  margin: 0;
  color: ${props => props.$theme?.light || '#fff'};
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);

  @media (max-width: 480px) {
    font-size: 1.7rem;
  }
`;

const CardHint = styled.p`
  position: absolute;
  bottom: 1.5rem;
  font-size: 0.85rem;
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
  font-size: 1.45rem;
  font-family: 'Unbounded', sans-serif;
  margin: 0 0 1.5rem 0;
  color: ${props => props.$theme?.light || p.primaryLight};
  line-height: 1.5;
  white-space: pre-wrap;

  @media (max-width: 480px) {
    font-size: 1.25rem;
  }
`;

const BookReference = styled.div`
  font-size: 1.05rem;
  color: #cbd5e1;
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const CategoryBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: ${props => props.$theme?.badgeBg || 'rgba(6, 182, 212, 0.2)'};
  color: ${props => props.$theme?.badgeText || p.primaryLight};
  border: 1px solid ${props => props.$theme?.borderColor || 'rgba(6, 182, 212, 0.3)'};
  padding: 0.4rem 0.85rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.3px;
  margin-bottom: 0.85rem;
  transition: all 0.2s ease;
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
  width: 340px;
  border: 1px solid rgba(255,255,255,0.1);
  
  input {
    background: transparent;
    border: none;
    color: #fff;
    outline: none;
    width: 100%;
    font-size: 0.9rem;

    &::placeholder {
      color: ${p.textMuted};
    }
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
    background: rgba(103, 232, 249, 0.1);
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

const ChipContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.6rem;
`;

const CategoryChip = styled.button`
  background: ${props => props.$active ? props.$theme?.badgeBg : 'rgba(255,255,255,0.04)'};
  color: ${props => props.$active ? props.$theme?.badgeText : p.textMuted};
  border: 1px solid ${props => props.$active ? props.$theme?.borderColor : 'rgba(255,255,255,0.1)'};
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$theme?.badgeBg};
    color: ${props => props.$theme?.badgeText};
    border-color: ${props => props.$theme?.borderColor};
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

const HabitToast = styled.div`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: linear-gradient(135deg, rgba(52,211,153,0.95), rgba(16,185,129,0.95));
  color: #0f172a;
  font-size: 0.88rem;
  font-weight: 500;
  padding: 0.75rem 1.25rem;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  z-index: 9999;
  animation: slideInUp 0.3s ease-out;
  @keyframes slideInUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

export default CybersecurityPage;
