// src/modules/knowledge/pages/AIAssistantPage.jsx - Asistente Conversacional AI para Knowledge Hub
import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  FileText,
  ExternalLink,
  Bot,
  User,
  Compass,
  ArrowRight,
  BookOpen,
  Layers,
  HelpCircle,
  PlusCircle
} from 'lucide-react';
import { useKnowledge } from '../context/KnowledgeContext';
import knowledgeApiService from '../services/knowledgeApiService';

const SUGGESTED_PROMPTS = [
  '¿Qué conceptos clave tengo registrados sobre ciberseguridad?',
  '¿Qué conexiones existen entre macroeconomía y política monetaria?',
  '¿Cuáles son mis notas sobre Frontend y arquitectura React?',
  'Identificar conceptos frecuentes y posibles vacíos en mi conocimiento',
  'Ayúdame a sintetizar mis notas de lectura y filosofía'
];

const AIAssistantPage = () => {
  const navigate = useNavigate();
  const { openQuickCapture } = useKnowledge();

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: '¡Hola, Teo! Soy tu asistente de conocimiento personal. Tengo acceso a tus notas, categorías y enlaces en el Knowledge Hub para responder preguntas, sintetizar aprendizajes y descubrir conexiones.',
      citations: []
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (msgToSend = inputMessage) => {
    const text = (msgToSend || '').trim();
    if (!text || isLoading) return;

    setInputMessage('');
    const newMessages = [...messages, { role: 'user', text }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const data = await knowledgeApiService.aiChat(text);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          text: data.reply || 'No se obtuvo respuesta.',
          citations: data.citations || []
        }
      ]);
    } catch (err) {
      console.error(err);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          text: 'Ocurrió un error al consultar tu base de conocimiento. Por favor, intenta nuevamente.',
          citations: []
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader>
        <HeaderLeft>
          <BotIconWrapper>
            <Sparkles size={20} color="#ec4899" />
          </BotIconWrapper>
          <div>
            <Title>AI Knowledge Assistant</Title>
            <Subtitle>Consultas inteligentes y síntesis basadas en tus notas reales</Subtitle>
          </div>
        </HeaderLeft>
      </PageHeader>

      {/* Área de Conversación */}
      <ChatContainer>
        <MessagesList>
          {messages.map((m, idx) => (
            <MessageRow key={idx} $isUser={m.role === 'user'}>
              <Avatar $isUser={m.role === 'user'}>
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </Avatar>

              <MessageBubble $isUser={m.role === 'user'}>
                <MessageContent>{m.text}</MessageContent>

                {/* Citas de notas si existen */}
                {m.citations && m.citations.length > 0 && (
                  <CitationsBox>
                    <CitationsHeader>
                      <FileText size={12} color="#a78bfa" />
                      <span>Notas citadas como referencia:</span>
                    </CitationsHeader>
                    <CitationsGrid>
                      {m.citations.map((c) => (
                        <CitationPill
                          key={c.id}
                          onClick={() => navigate(`/personal/knowledge/notes?noteId=${c.id}`)}
                        >
                          <FileText size={12} />
                          <span>{c.title}</span>
                          <ArrowRight size={10} />
                        </CitationPill>
                      ))}
                    </CitationsGrid>
                  </CitationsBox>
                )}
              </MessageBubble>
            </MessageRow>
          ))}

          {isLoading && (
            <MessageRow $isUser={false}>
              <Avatar $isUser={false}>
                <Bot size={16} />
              </Avatar>
              <ThinkingBubble>
                <Sparkles size={14} color="#ec4899" />
                <span>Analizando tus notas y conexiones...</span>
              </ThinkingBubble>
            </MessageRow>
          )}

          <div ref={messagesEndRef} />
        </MessagesList>

        {/* Sugerencias Rápidas */}
        {messages.length === 1 && (
          <SuggestedSection>
            <SuggestedTitle>Prueba preguntar sobre:</SuggestedTitle>
            <SuggestedGrid>
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <PromptPill key={idx} onClick={() => handleSendMessage(prompt)}>
                  <span>{prompt}</span>
                  <ArrowRight size={12} />
                </PromptPill>
              ))}
            </SuggestedGrid>
          </SuggestedSection>
        )}

        {/* Input Bar */}
        <InputArea>
          <InputForm onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
            <ChatInput
              type="text"
              placeholder="Haz una pregunta sobre tus notas, ideas o conexiones..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
            <SendButton type="submit" disabled={!inputMessage.trim() || isLoading}>
              <Send size={16} />
            </SendButton>
          </InputForm>
        </InputArea>
      </ChatContainer>
    </PageContainer>
  );
};

// ─── Estilos ─────────────────────────────────────────────────────────────────

const PageContainer = styled.div`
  max-width: 1000px;
  width: 100%;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 160px);
  overflow: hidden;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const BotIconWrapper = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(236, 72, 153, 0.15);
  border: 1px solid rgba(236, 72, 153, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Title = styled.h2`
  font-size: 1.15rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 0.78rem;
  color: #94a3b8;
  margin: 0.1rem 0 0;
`;

const ChatContainer = styled.div`
  flex: 1;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const MessagesList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const MessageRow = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-direction: ${props => props.$isUser ? 'row-reverse' : 'row'};
  align-items: flex-start;
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${props => props.$isUser ? '#3b82f6' : 'rgba(236, 72, 153, 0.2)'};
  color: ${props => props.$isUser ? 'white' : '#f472b6'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const MessageBubble = styled.div`
  max-width: 78%;
  background: ${props => props.$isUser ? '#1e293b' : 'rgba(30, 41, 59, 0.7)'};
  border: 1px solid ${props => props.$isUser ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.06)'};
  border-radius: 12px;
  padding: 0.85rem 1.1rem;
  color: #f1f5f9;
  font-size: 0.88rem;
  line-height: 1.6;
`;

const MessageContent = styled.div`
  white-space: pre-wrap;
`;

const ThinkingBubble = styled.div`
  background: rgba(30, 41, 59, 0.5);
  border: 1px dashed rgba(236, 72, 153, 0.3);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  color: #f472b6;
  font-size: 0.82rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CitationsBox = styled.div`
  margin-top: 0.85rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const CitationsHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: #a78bfa;
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const CitationsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
`;

const CitationPill = styled.button`
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: #c4b5fd;
  border-radius: 6px;
  padding: 0.2rem 0.5rem;
  font-size: 0.74rem;
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

const SuggestedSection = styled.div`
  padding: 0 1.5rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const SuggestedTitle = styled.span`
  font-size: 0.76rem;
  font-weight: 600;
  color: #94a3b8;
`;

const SuggestedGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

const PromptPill = styled.button`
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 0.55rem 0.85rem;
  color: #cbd5e1;
  font-size: 0.8rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: rgba(139, 92, 246, 0.15);
    border-color: rgba(139, 92, 246, 0.4);
    color: #f8fafc;
  }
`;

const InputArea = styled.div`
  padding: 0.85rem 1.25rem;
  background: rgba(15, 23, 42, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

const InputForm = styled.form`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 0.35rem 0.65rem 0.35rem 1rem;
  transition: border-color 0.2s;
  &:focus-within {
    border-color: #ec4899;
  }
`;

const ChatInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  color: #f8fafc;
  font-size: 0.88rem;
  outline: none;
  &::placeholder {
    color: #64748b;
  }
`;

const SendButton = styled.button`
  background: #ec4899;
  border: none;
  color: white;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: #db2777;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export default AIAssistantPage;
