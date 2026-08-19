import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Mail, X, RefreshCw, Send, CheckSquare, Square } from 'lucide-react';
import alertService from '../../services/alertService';
const EmailConfigModal = ({ isOpen, onClose, initialData = null, onSuccess }) => {
  const FREQUENT_EMAILS = [
    'ciro.chiappero@henriwillig.com',
    'tomasrcv@gmail.com',
    'jchiappero@gmail.com'
  ];

  const [enabled, setEnabled] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('🚨 Alerta activada: {symbol}');
  const [message, setMessage] = useState('Se activó una nueva alerta para {symbol}.\n\nRevisa el panel para más detalles.');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  
  const [includes, setIncludes] = useState({
    price: true,
    opScore: true,
    drawdown: true,
    ema21: true,
    tw: true,
    rsi: false,
    macd: false,
    relativeVolume: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [feedback, setFeedback] = useState({ show: false, msg: '', type: '' });

  useEffect(() => {
    if (isOpen && initialData) {
      setEnabled(initialData.email_enabled === 1 || initialData.email_enabled === true);
      setRecipient(initialData.email_recipient || '');
      setSubject(initialData.email_subject || '🚨 Alerta activada: {symbol}');
      setMessage(initialData.email_template || 'Se activó una alerta para {symbol}.\n\nRevisa el panel para más detalles.');
      setImagePreview(initialData.email_image_url || null);
      setImageFile(null);
      setRemoveImage(false);
      
      try {
        if (initialData.email_includes) {
          const parsed = JSON.parse(initialData.email_includes);
          setIncludes(prev => ({ ...prev, ...parsed }));
        }
      } catch (e) {
        // use defaults
      }
    }
  }, [isOpen, initialData]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setRemoveImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
  };

  if (!isOpen || !initialData) return null;

  const toggleInclude = (key) => {
    setIncludes(prev => ({ ...prev, [key]: !prev[key] }));
  };

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

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const config = {
        email_enabled: enabled ? 1 : 0,
        email_recipient: recipient,
        email_subject: subject,
        email_template: message,
        email_includes: JSON.stringify(includes),
        remove_image: removeImage,
      };
      if (imageFile) {
        config.image = imageFile;
      }
      await alertService.updateAlertEmailConfig(initialData.id, config);
      showFeedback('Configuración guardada correctamente.');
      if (onSuccess) onSuccess();
      setTimeout(onClose, 1000);
    } catch (error) {
      console.error(error);
      showFeedback('Error al guardar la configuración.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const config = {
        email_recipient: recipient,
        email_subject: subject,
        email_template: message,
        email_includes: JSON.stringify(includes),
        existing_image_url: imagePreview && !imageFile ? imagePreview : null
      };
      if (imageFile) {
        config.image = imageFile;
      }
      await alertService.sendTestEmail(initialData.id, config);
      showFeedback('Email de prueba enviado.');
    } catch (error) {
      console.error(error);
      showFeedback('Error enviando email de prueba.', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  // Preview Generation
  const generatePreview = () => {
    let preview = message.replace(/{symbol}/g, initialData.symbol || 'NVDA');
    
    // Simular reemplazos
    preview = preview.replace(/{price}/g, '$184.52');
    preview = preview.replace(/{opScore}/g, '91/100');
    preview = preview.replace(/{drawdown}/g, '-12.4%');
    preview = preview.replace(/{ema21}/g, '$179.30');
    preview = preview.replace(/{tw}/g, 'Alta');
    preview = preview.replace(/{triggerTime}/g, new Date().toLocaleString());

    let statsBlock = '\n\n────────────────────────────────\n';
    if (includes.price) statsBlock += 'Precio actual: $184.52\n';
    if (includes.opScore) statsBlock += 'Puntuación de oportunidad: 91/100\n';
    if (includes.drawdown) statsBlock += 'Distancia a máximos recientes: -12.4%\nEl activo está 12.4% por debajo de sus máximos recientes.\n';
    if (includes.ema21) statsBlock += 'Media de 21 días: $179.30\nEl precio se encuentra por encima de su media de 21 días.\n';
    if (includes.tw) statsBlock += 'Estado de tendencia: Alta\n';
    if (includes.rsi) statsBlock += 'Indicador de fuerza del precio: 65\n';
    if (includes.macd) statsBlock += 'Tendencia y momentum: Alcista\n';
    if (includes.relativeVolume) statsBlock += 'Volumen vs. habitual: 1.5x\n';

    return preview + statsBlock;
  };

  const previewSubject = subject.replace(/{symbol}/g, initialData.symbol || 'NVDA');

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Programar Envío de Email</ModalTitle>
          <CloseBtn onClick={onClose}><X size={18} /></CloseBtn>
        </ModalHeader>
        
        <SplitLayout>
          <FormSide>
            
            <FormGroup style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Label>Activar envío automático</Label>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Enviar email al activarse la alerta</div>
              </div>
              <ToggleSwitch $active={enabled} onClick={() => setEnabled(!enabled)}>
                <div className="handle" />
              </ToggleSwitch>
            </FormGroup>

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
              <Label>Asunto</Label>
              <Input 
                type="text" 
                value={subject} 
                onChange={e => setSubject(e.target.value)}
              />
              <HelpText>Variables: {`{symbol}`}</HelpText>
            </FormGroup>

            <FormGroup>
              <Label>Mensaje Personalizado</Label>
              <Textarea 
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
              <HelpText>Variables: {`{symbol}, {triggerTime}`}</HelpText>
            </FormGroup>

            <FormGroup>
              <Label>Imagen Adjunta</Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  id="imageUpload" 
                  style={{ display: 'none' }} 
                />
                <FileButton as="label" htmlFor="imageUpload">
                  Seleccionar Imagen
                </FileButton>
                {imagePreview && (
                  <RemoveImageBtn type="button" onClick={handleRemoveImage}>
                    Quitar Imagen
                  </RemoveImageBtn>
                )}
              </div>
            </FormGroup>

            <FormGroup>
              <Label>Información Técnica Incluida (Traducida)</Label>
              <CheckboxGrid>
                {Object.entries({
                  price: 'Precio actual',
                  opScore: 'Puntuación de oportunidad',
                  drawdown: 'Distancia a máximos',
                  ema21: 'Media de 21 días',
                  tw: 'Estado de tendencia',
                  rsi: 'Fuerza (RSI)',
                  macd: 'Momentum (MACD)',
                  relativeVolume: 'Volumen relativo'
                }).map(([key, label]) => (
                  <CheckOption key={key} onClick={() => toggleInclude(key)}>
                    {includes[key] ? <CheckSquare size={16} color="#10b981" /> : <Square size={16} color="#64748b" />}
                    <span>{label}</span>
                  </CheckOption>
                ))}
              </CheckboxGrid>
            </FormGroup>

          </FormSide>
          
          <PreviewSide>
            <Label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} /> Vista Previa del Email
            </Label>
            <PreviewCard>
              <PreviewHeader>
                <strong>Asunto:</strong> {previewSubject}
              </PreviewHeader>
              <PreviewBody>
                {generatePreview().split('\n').map((line, i) => (
                  <div key={i} style={{ minHeight: '1rem' }}>{line}</div>
                ))}
                {imagePreview && (
                  <div style={{ marginTop: '16px', textAlign: 'center' }}>
                    <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                  </div>
                )}
              </PreviewBody>
            </PreviewCard>

            <FeedbackWrap>
              {feedback.show && (
                <FeedbackMsg $error={feedback.type === 'error'}>
                  {feedback.msg}
                </FeedbackMsg>
              )}
            </FeedbackWrap>

            <ActionButtons>
              <TestBtn onClick={handleTest} disabled={isTesting || !recipient}>
                {isTesting ? <RefreshCw size={14} className="spin" /> : <Send size={14} />}
                Enviar Prueba
              </TestBtn>
              <SaveBtn onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? <RefreshCw size={14} className="spin" /> : 'Guardar Configuración'}
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

const HelpText = styled.div`
  font-size: 0.7rem; color: #64748b;
`;

const ToggleSwitch = styled.div`
  width: 44px; height: 24px; border-radius: 12px; cursor: pointer;
  background: ${p => p.$active ? '#10b981' : 'rgba(255,255,255,0.1)'};
  position: relative; transition: all 0.2s;
  .handle {
    position: absolute; top: 2px; left: ${p => p.$active ? '22px' : '2px'};
    width: 20px; height: 20px; border-radius: 50%; background: white;
    transition: all 0.2s;
  }
`;

const CheckboxGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;
`;

const CheckOption = styled.div`
  display: flex; align-items: center; gap: 0.5rem; cursor: pointer;
  font-size: 0.85rem; color: #cbd5e1;
  &:hover { color: white; }
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
  padding: 1rem; white-space: pre-wrap; flex: 1; overflow-y: auto; max-height: 400px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

const ActionButtons = styled.div`
  display: flex; gap: 1rem; margin-top: auto;
`;

const SaveBtn = styled.button`
  flex: 2; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  background: linear-gradient(135deg, #f59e0b, #ea580c); color: white;
  border: none; padding: 0.9rem; border-radius: 8px; font-weight: 700; cursor: pointer;
  transition: all 0.2s;
  &:disabled { opacity: 0.7; cursor: not-allowed; }
  .spin { animation: ${spin} 1s linear infinite; }
`;

const TestBtn = styled.button`
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  background: rgba(255,255,255,0.1); color: white;
  border: 1px solid rgba(255,255,255,0.2); padding: 0.9rem; border-radius: 8px; font-weight: 600; cursor: pointer;
  transition: all 0.2s;
  &:hover:not(:disabled) { background: rgba(255,255,255,0.2); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  .spin { animation: ${spin} 1s linear infinite; }
`;

const FeedbackWrap = styled.div`
  min-height: 20px;
`;

const FeedbackMsg = styled.div`
  font-size: 0.8rem; color: ${p => p.$error ? '#ef4444' : '#10b981'}; text-align: center;
`;

const FileButton = styled.label`
  background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.1);
  color: #cbd5e1; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.85rem; cursor: pointer;
  &:hover { background: rgba(255,255,255,0.1); color: white; }
`;

const RemoveImageBtn = styled.button`
  background: transparent; border: 1px solid #ef4444; color: #ef4444;
  padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.85rem; cursor: pointer;
  &:hover { background: rgba(239,68,68,0.1); }
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

export default EmailConfigModal;
