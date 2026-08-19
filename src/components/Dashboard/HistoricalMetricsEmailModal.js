import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Mail, X, RefreshCw, Send } from 'lucide-react';

const FREQUENT_EMAILS = [
  'ciro.chiappero@henriwillig.com',
  'tomasrcv@gmail.com',
  'jchiappero@gmail.com'
];

const HistoricalMetricsEmailModal = ({ isOpen, onClose, monthData, ytdData, onSend }) => {
  const [recipient, setRecipient] = useState('');
  const [customMessage, setCustomMessage] = useState('Adjunto el resumen de rendimiento del mes. ¡Saludos!');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ show: false, msg: '', type: '' });

  if (!isOpen || !monthData) return null;

  const toggleFrequentEmail = (email) => {
    let currentEmails = recipient.split(',').map(e => e.trim()).filter(e => e);
    if (currentEmails.includes(email)) {
      currentEmails = currentEmails.filter(e => e !== email);
    } else {
      currentEmails.push(email);
    }
    setRecipient(currentEmails.join(', '));
  };

  const showFeedback = (msg, type = 'success') => {
    setFeedback({ show: true, msg, type });
    setTimeout(() => setFeedback({ show: false, msg: '', type: '' }), 3000);
  };

  const handleSend = async () => {
    if (!recipient) {
      showFeedback('Por favor, ingresa un destinatario', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSend({
        recipient,
        customMessage,
        monthData,
        ytdData
      });
      showFeedback('Resumen enviado correctamente');
      setTimeout(onClose, 1500);
    } catch (error) {
      showFeedback('Error al enviar el resumen', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val) => `$${parseFloat(val).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
  const formatPercent = (val) => `${parseFloat(val).toFixed(2)}%`;
  const profit = parseFloat(monthData.usd_end) - parseFloat(monthData.usd_start);

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Enviar Resumen: {monthData.month_year}</ModalTitle>
          <CloseBtn onClick={onClose}><X size={18} /></CloseBtn>
        </ModalHeader>
        
        <SplitLayout>
          <FormSide>
            <FormGroup>
              <Label>Destinatarios</Label>
              <Input 
                type="text" 
                placeholder="ej: tu@email.com, otro@email.com" 
                value={recipient} 
                onChange={e => setRecipient(e.target.value)}
              />
              <ChipsContainer>
                {FREQUENT_EMAILS.map(email => (
                  <Chip 
                    key={email} 
                    $active={recipient.includes(email)}
                    onClick={() => toggleFrequentEmail(email)}
                  >
                    {email}
                  </Chip>
                ))}
              </ChipsContainer>
            </FormGroup>

            <FormGroup>
              <Label>Mensaje Personalizado</Label>
              <Textarea 
                rows={5}
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                placeholder="Escribe un mensaje para acompañar el resumen..."
              />
            </FormGroup>

            <FeedbackWrap>
              {feedback.show && (
                <FeedbackMsg $error={feedback.type === 'error'}>
                  {feedback.msg}
                </FeedbackMsg>
              )}
            </FeedbackWrap>
          </FormSide>
          
          <PreviewSide>
            <Label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} /> Datos a Enviar
            </Label>
            <PreviewCard>
              <PreviewHeader>
                <strong>Asunto:</strong> Resumen Mensual: {monthData.month_year} - Chiappital
              </PreviewHeader>
              <PreviewBody>
                {customMessage && <div style={{ marginBottom: '16px', fontStyle: 'italic', color: '#64748b' }}>"{customMessage}"</div>}
                
                <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Rendimiento del Mes</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', fontSize: '0.85rem' }}>
                  <li>Capital Inicial: <strong>{formatCurrency(monthData.usd_start)}</strong></li>
                  <li>Aportes: <strong>{formatCurrency(monthData.deposits)}</strong></li>
                  <li>Capital Final: <strong>{formatCurrency(monthData.usd_end)}</strong></li>
                  <li>Ganancia: <strong style={{ color: profit >= 0 ? '#10b981' : '#ef4444' }}>{profit > 0 ? '+' : ''}{formatCurrency(profit)}</strong></li>
                  <li>Var. Cartera: <strong style={{ color: parseFloat(monthData.var_percent) >= 0 ? '#10b981' : '#ef4444' }}>{formatPercent(monthData.var_percent)}</strong></li>
                  <li>Var. SPY: <strong>{formatPercent(monthData.var_spy)}</strong></li>
                  <li>Diferencia: <strong style={{ color: parseFloat(monthData.difference) >= 0 ? '#10b981' : '#ef4444' }}>{formatPercent(monthData.difference)}</strong></li>
                </ul>

                {ytdData && (
                  <>
                    <h4 style={{ margin: '16px 0 8px 0', color: '#1e293b' }}>Resumen Anual (YTD)</h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', fontSize: '0.85rem' }}>
                      <li>YTD Cartera: <strong style={{ color: ytdData.ytd >= 0 ? '#10b981' : '#ef4444' }}>{formatPercent(ytdData.ytd)}</strong></li>
                      <li>YTD Ganancia: <strong style={{ color: ytdData.profit >= 0 ? '#10b981' : '#ef4444' }}>{ytdData.profit > 0 ? '+' : ''}{formatCurrency(ytdData.profit)}</strong></li>
                      <li>YTD SPY: <strong>{formatPercent(ytdData.spy)}</strong></li>
                      <li>Diferencia: <strong style={{ color: ytdData.diff >= 0 ? '#10b981' : '#ef4444' }}>{formatPercent(ytdData.diff)}</strong></li>
                    </ul>
                  </>
                )}
              </PreviewBody>
            </PreviewCard>

            <ActionButtons>
              <SaveBtn onClick={handleSend} disabled={isSubmitting}>
                {isSubmitting ? <RefreshCw size={14} className="spin" /> : <><Send size={14} /> Enviar Resumen</>}
              </SaveBtn>
            </ActionButtons>
          </PreviewSide>
        </SplitLayout>
      </ModalContent>
    </ModalOverlay>
  );
};

// --- Styles ---
const fadeIn = keyframes`from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}`;
const spin = keyframes`from{transform:rotate(0deg)}to{transform:rotate(360deg)}`;

const ModalOverlay = styled.div`
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  z-index: 9999; display: flex; justify-content: center; align-items: center;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContent = styled.div`
  background: #1e293b;
  width: 95%; max-width: 900px;
  border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 20px 40px rgba(0,0,0,0.5); overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 1.25rem 1.5rem; background: rgba(0,0,0,0.2);
  border-bottom: 1px solid rgba(255,255,255,0.05);
`;

const ModalTitle = styled.h3`
  margin: 0; color: white; font-family: 'Unbounded', sans-serif; font-size: 1.1rem;
`;

const CloseBtn = styled.button`
  background: transparent; border: none; color: #64748b; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  padding: 0.25rem; border-radius: 6px;
  &:hover { background: rgba(255,255,255,0.1); color: white; }
`;

const SplitLayout = styled.div`
  display: grid; grid-template-columns: 1fr 1fr;
  @media(max-width: 768px) { grid-template-columns: 1fr; }
`;

const FormSide = styled.div`
  padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem;
  border-right: 1px solid rgba(255,255,255,0.05);
`;

const PreviewSide = styled.div`
  padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;
  background: rgba(0,0,0,0.1);
`;

const FormGroup = styled.div`
  display: flex; flex-direction: column; gap: 0.4rem;
`;

const Label = styled.label`
  font-size: 0.75rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
`;

const Input = styled.input`
  background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.1);
  color: white; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.95rem; font-family: inherit;
  width: 100%; box-sizing: border-box;
  &:focus { outline: none; border-color: #f59e0b; box-shadow: 0 0 0 2px rgba(245,158,11,0.2); }
`;

const Textarea = styled.textarea`
  background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.1);
  color: white; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.9rem; font-family: inherit;
  resize: vertical; width: 100%; box-sizing: border-box;
  &:focus { outline: none; border-color: #f59e0b; box-shadow: 0 0 0 2px rgba(245,158,11,0.2); }
`;

const ChipsContainer = styled.div`
  display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.25rem;
`;

const Chip = styled.div`
  background: ${p => p.$active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)'};
  color: ${p => p.$active ? '#10b981' : '#94a3b8'};
  border: 1px solid ${p => p.$active ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255,255,255,0.1)'};
  padding: 0.35rem 0.6rem; border-radius: 12px; font-size: 0.75rem; cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: ${p => p.$active ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'};
    color: white;
  }
`;

const PreviewCard = styled.div`
  background: white; border-radius: 8px; color: #1e293b; overflow: hidden;
  font-size: 0.85rem; flex: 1; display: flex; flex-direction: column;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
`;

const PreviewHeader = styled.div`
  padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0; background: #f8fafc;
`;

const PreviewBody = styled.div`
  padding: 1rem; flex: 1; overflow-y: auto; max-height: 400px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

const ActionButtons = styled.div`
  display: flex; gap: 1rem; margin-top: auto;
`;

const SaveBtn = styled.button`
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  background: linear-gradient(135deg, #10b981, #059669); color: white;
  border: none; padding: 0.9rem; border-radius: 8px; font-weight: 700; cursor: pointer;
  transition: all 0.2s;
  &:disabled { opacity: 0.7; cursor: not-allowed; }
  .spin { animation: ${spin} 1s linear infinite; }
`;

const FeedbackWrap = styled.div`
  min-height: 20px; margin-top: auto;
`;

const FeedbackMsg = styled.div`
  font-size: 0.8rem; color: ${p => p.$error ? '#ef4444' : '#10b981'};
`;

export default HistoricalMetricsEmailModal;
