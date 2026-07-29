import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Edit3, Check, X, Clock } from 'lucide-react';
import { colors } from '../../styles/colors';
import { useLabData } from '../../context/LabContext';

const MarketStrategy = () => {
  const { marketStrategy, updateMarketStrategy } = useLabData();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (marketStrategy?.text && !isEditing) {
      setText(marketStrategy.text);
    }
  }, [marketStrategy, isEditing]);

  const handleEditClick = () => {
    setText(marketStrategy?.text || '');
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setText(marketStrategy?.text || '');
    setIsEditing(false);
  };

  const handleSaveClick = async () => {
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      await updateMarketStrategy({ text, lastUpdated: now });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving market strategy:', error);
      // Even if server fails, it is saved locally
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca';
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString('es-AR', options);
  };

  return (
    <StrategyContainer>
      <HeaderSection>
        <TitleGroup>
          <Subtitle>Estrategia y visión actual</Subtitle>
        </TitleGroup>
        
        <ActionsGroup>
          {marketStrategy?.lastUpdated && !isEditing && (
            <LastUpdated>
              <Clock size={14} />
              Última actualización: {formatDate(marketStrategy.lastUpdated)}
            </LastUpdated>
          )}
          
          {!isEditing ? (
            <EditButton onClick={handleEditClick} title="Editar estrategia">
              <Edit3 size={18} />
            </EditButton>
          ) : (
            <EditControls>
              <IconButton onClick={handleSaveClick} disabled={isSaving} className="save" title="Guardar">
                <Check size={18} />
              </IconButton>
              <IconButton onClick={handleCancelClick} disabled={isSaving} className="cancel" title="Cancelar">
                <X size={18} />
              </IconButton>
            </EditControls>
          )}
        </ActionsGroup>
      </HeaderSection>

      <ContentSection>
        {isEditing ? (
          <TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe tus pensamientos del mercado aquí para guiarte en tu toma de decisiones..."
            autoFocus
          />
        ) : (
          <TextDisplay>
            {marketStrategy?.text ? (
              marketStrategy.text.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))
            ) : (
              <EmptyState onClick={handleEditClick}>
                No hay ninguna estrategia definida actualmente. Haz clic aquí o en el botón de editar para añadir tus pensamientos sobre el mercado.
              </EmptyState>
            )}
          </TextDisplay>
        )}
      </ContentSection>
    </StrategyContainer>
  );
};

// ─── Estilos (Modo Oscuro) ──────────────────────────────────────────────────

const StrategyContainer = styled.div`
  background: #111827; /* Darker than normal card */
  border-radius: 24px;
  padding: 2rem 2.5rem;
  color: white;
  margin-bottom: 3rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${colors.gradients.primary};
  }

  @media (max-width: 768px) {
    padding: 1.5rem;
    border-radius: 16px;
  }
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const TitleGroup = styled.div`
  display: flex;
  align-items: center;
`;

const Subtitle = styled.h3`
  font-size: 1.1rem;
  color: #9ca3af;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0;
`;

const ActionsGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const LastUpdated = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: #6b7280;
  background: rgba(255, 255, 255, 0.03);
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const EditButton = styled.button`
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
`;

const EditControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const IconButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  color: white;
  transition: all 0.2s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.save {
    background: rgba(16, 185, 129, 0.2);
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.3);
    &:hover:not(:disabled) { 
      background: rgba(16, 185, 129, 0.4); 
      transform: translateY(-2px);
    }
  }

  &.cancel {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.3);
    &:hover:not(:disabled) { 
      background: rgba(239, 68, 68, 0.4); 
      transform: translateY(-2px);
    }
  }
`;

const ContentSection = styled.div`
  width: 100%;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 12px;
  padding: 1rem;
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.5;
  resize: vertical;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${colors.secondary};
    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const TextDisplay = styled.div`
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 1.05rem;
  line-height: 1.6;
  color: #e5e7eb;
  min-height: 80px;

  p {
    margin-top: 0;
    margin-bottom: 0.75rem;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
`;

const EmptyState = styled.div`
  color: rgba(255, 255, 255, 0.4);
  font-style: italic;
  cursor: pointer;
  padding: 1rem;
  text-align: center;
  transition: color 0.2s ease;
  
  &:hover {
    color: rgba(255, 255, 255, 0.7);
  }
`;

export default MarketStrategy;
