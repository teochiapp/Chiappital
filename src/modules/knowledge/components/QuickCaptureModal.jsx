// src/modules/knowledge/components/QuickCaptureModal.jsx - Modal de captura rápida
import React, { useState } from 'react';
import styled from 'styled-components';
import { X, FileText, Link2, Lightbulb, Sparkles, Send, Check } from 'lucide-react';
import { useKnowledge } from '../context/KnowledgeContext';
import knowledgeApiService from '../services/knowledgeApiService';

const QuickCaptureModal = () => {
  const { isQuickCaptureOpen, closeQuickCapture, quickCaptureType, areas, refreshAll, showToast } = useKnowledge();

  const [type, setType] = useState(quickCaptureType || 'note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isQuickCaptureOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      await knowledgeApiService.createNote({
        title: title.trim(),
        content: url ? `${content}\n\n**Fuente:** [${url}](${url})` : content,
        area_ids: selectedAreaId ? [selectedAreaId] : [],
      });
      showToast('✅ Nota creada en Knowledge Hub');

      setTitle('');
      setContent('');
      setUrl('');
      closeQuickCapture();
      refreshAll();
    } catch (err) {
      console.error('Error al capturar:', err);
      showToast('❌ Error al guardar nota');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Overlay onClick={closeQuickCapture}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <HeaderLeft>
            <Sparkles size={18} color="#8b5cf6" />
            <HeaderTitle>Captura Rápida de Conocimiento</HeaderTitle>
          </HeaderLeft>
          <CloseButton onClick={closeQuickCapture}>
            <X size={18} />
          </CloseButton>
        </ModalHeader>

        {/* Selector de Tipo */}
        <TypeTabs>
          <TabButton $active={type === 'note'} onClick={() => setType('note')}>
            <FileText size={16} /> Nota
          </TabButton>
          <TabButton $active={type === 'url'} onClick={() => setType('url')}>
            <Link2 size={16} /> Enlace / Web
          </TabButton>
          <TabButton $active={type === 'idea'} onClick={() => setType('idea')}>
            <Lightbulb size={16} /> Idea rápida
          </TabButton>
        </TypeTabs>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Título o Concepto Clave *</Label>
            <Input
              type="text"
              placeholder={type === 'url' ? 'Título del recurso o artículo' : 'Ej: Principio de Pareto en Arquitectura'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </FormGroup>

          {type === 'url' && (
            <FormGroup>
              <Label>URL de Origen</Label>
              <Input
                type="text"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </FormGroup>
          )}

          <FormGroup>
            <Label>Contenido, Notas o Extracto</Label>
            <TextArea
              rows={4}
              placeholder="Escribe tus notas, fragmentos destacados o ideas clave..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <Label>Área de Conocimiento (Opcional)</Label>
            <Select value={selectedAreaId} onChange={(e) => setSelectedAreaId(e.target.value)}>
              <option value="">Auto-clasificar o sin área</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </FormGroup>

          <ModalActions>
            <CancelButton type="button" onClick={closeQuickCapture}>
              Cancelar
            </CancelButton>
            <SubmitButton type="submit" disabled={isSaving || !title.trim()}>
              {isSaving ? 'Guardando...' : 'Crear Nota'}
              <Send size={15} />
            </SubmitButton>
          </ModalActions>
        </Form>
      </ModalContainer>
    </Overlay>
  );
};

// ─── Estilos ─────────────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
`;

const ModalContainer = styled.div`
  background: #0f172a;
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 14px;
  width: 100%;
  max-width: 580px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(139, 92, 246, 0.15);
  overflow: hidden;
  color: #f8fafc;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.1rem 1.4rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
`;

const HeaderTitle = styled.h3`
  font-size: 1.05rem;
  font-weight: 600;
  color: #f8fafc;
  margin: 0;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.3rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const TypeTabs = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.4rem 0.5rem;
`;

const TabButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid ${props => props.$active ? '#8b5cf6' : 'rgba(255, 255, 255, 0.1)'};
  background: ${props => props.$active ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)'};
  color: ${props => props.$active ? '#c4b5fd' : '#94a3b8'};
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: #8b5cf6;
    color: #f8fafc;
  }
`;

const Form = styled.form`
  padding: 1rem 1.4rem 1.4rem;
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
  font-size: 0.8rem;
  font-weight: 500;
  color: #cbd5e1;
`;

const Input = styled.input`
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.65rem 0.85rem;
  color: #f8fafc;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
  &:focus {
    border-color: #8b5cf6;
  }
`;

const TextArea = styled.textarea`
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.65rem 0.85rem;
  color: #f8fafc;
  font-size: 0.9rem;
  outline: none;
  resize: vertical;
  min-height: 90px;
  line-height: 1.5;
  transition: border-color 0.2s;
  &:focus {
    border-color: #8b5cf6;
  }
`;

const Select = styled.select`
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.65rem 0.85rem;
  color: #f8fafc;
  font-size: 0.88rem;
  outline: none;
  &:focus {
    border-color: #8b5cf6;
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

const CancelButton = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const SubmitButton = styled.button`
  background: #8b5cf6;
  border: none;
  color: white;
  padding: 0.5rem 1.2rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
  &:hover {
    background: #7c3aed;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default QuickCaptureModal;
