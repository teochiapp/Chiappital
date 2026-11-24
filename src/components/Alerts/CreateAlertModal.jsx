import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { BellRing, X, RefreshCw } from 'lucide-react';
import FeedbackModal from '../common/FeedbackModal';
import alertService from '../../services/alertService';

const CreateAlertModal = ({ isOpen, onClose, initialData = null, onSuccess }) => {
  const [symbol, setSymbol] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState('ema21_above');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ isOpen: false, type: 'error', title: '', message: '' });

  // If initialData is passed (e.g. from Screener), populate fields
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setSymbol(initialData.symbol || '');
        const p = initialData.target_price || initialData.currentPrice;
        setTargetPrice(p ? (Math.round(Number(p) * 10000) / 10000).toString() : '');
        setCondition(initialData.condition_type || 'ema21_above');
        setNotes(initialData.notes || '');
      } else {
        setSymbol('');
        setTargetPrice('');
        setCondition('ema21_above');
        setNotes('');
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symbol.trim() || (condition !== 'ema21_above' && !targetPrice)) return;
    
    setIsSubmitting(true);
    try {
      const alertData = {
        symbol: symbol.trim().toUpperCase(),
        target_price: condition === 'ema21_above' ? null : parseFloat(targetPrice),
        condition_type: condition,
        notes: notes,
      };

      if (initialData && initialData.id) {
        // Editing existing alert
        await alertService.updateAlert(initialData.id, alertData);
      } else {
        // Creating new alert
        await alertService.createAlert(alertData);
      }
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: error.message || 'Ocurrió un error guardando la alerta. Inténtalo nuevamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ModalOverlay onClick={onClose}>
        <ModalContent onClick={e => e.stopPropagation()}>
          <ModalHeader>
            <ModalTitle>
              {initialData && initialData.id ? 'Editar Alerta' : 'Nueva Alerta'}
            </ModalTitle>
            <CloseBtn onClick={onClose}><X size={18} /></CloseBtn>
          </ModalHeader>
          <Form onSubmit={handleSubmit}>
            <FormRow $single>
              <FormGroup>
                <Label>Símbolo (Ticker)</Label>
                <Input 
                  type="text" 
                  placeholder="ej: AAPL, BTC, SPY" 
                  value={symbol} 
                  onChange={e => setSymbol(e.target.value.toUpperCase())}
                  required
                />
              </FormGroup>
            </FormRow>

            <FormRow $single={condition === 'ema21_above'}>
              <FormGroup>
                <Label>Condición</Label>
                <Select value={condition} onChange={e => setCondition(e.target.value)}>
                  <option value="ema21_above">Supera la EMA21 diaria (↑) (Predeterminada)</option>
                  <option value="above">Precio mayor o igual a (↑)</option>
                  <option value="below">Precio menor o igual a (↓)</option>
                </Select>
              </FormGroup>
              {condition !== 'ema21_above' && <FormGroup>
                <Label>Precio Objetivo ($)</Label>
                <Input 
                  type="number" 
                  step="0.0001" 
                  min="0.0001"
                  placeholder="ej: 150.50" 
                  value={targetPrice} 
                  onChange={e => setTargetPrice(e.target.value)}
                  required
                />
              </FormGroup>}
            </FormRow>

            {condition === 'ema21_above' && (
              <HelpText>
                Compara el precio en vivo con la última EMA21 diaria guardada. Se comprueba cada minuto,
                solo con el mercado abierto y Chiappital abierto en el navegador.
                Suena una vez y se desactiva; podés reactivarla desde Alertas.
                Si el precio ya supera la EMA21 al activarla, avisará en la próxima comprobación.
                Si falta la EMA21 o una cotización reciente sin demora, queda esperando datos.
              </HelpText>
            )}

            <FormGroup>
              <Label>Notas / Razón (Opcional)</Label>
              <Textarea 
                placeholder="¿Por qué esta alerta? ej: Rompe resistencia clave"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
              />
            </FormGroup>

            <SubmitBtn type="submit" disabled={isSubmitting}>
              {isSubmitting ? <RefreshCw size={16} className="spin" /> : <BellRing size={16} />}
              {initialData && initialData.id ? 'Guardar Cambios' : 'Crear Alerta'}
            </SubmitBtn>
          </Form>
        </ModalContent>
      </ModalOverlay>

      <FeedbackModal
        isOpen={feedback.isOpen}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
        onClose={() => setFeedback(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
};

// --- Styles ---
const fadeIn = keyframes`from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}`;
const spin   = keyframes`from{transform:rotate(0deg)}to{transform:rotate(360deg)}`;

const ModalOverlay = styled.div`
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex; justify-content: center; align-items: center;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContent = styled.div`
  background: #1e293b;
  width: 90%; max-width: 480px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 20px 40px rgba(0,0,0,0.5);
  max-height: calc(100dvh - 2rem);
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 1.25rem 1.5rem;
  background: rgba(0,0,0,0.2);
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

const Form = styled.form`
  display: flex; flex-direction: column; gap: 1.25rem;
  padding: 1.5rem;
`;

const FormRow = styled.div`
  display: grid; grid-template-columns: ${p => p.$single ? '1fr' : '1fr 1fr'}; gap: 1rem;
  @media(max-width:400px){ grid-template-columns: 1fr; }
`;

const FormGroup = styled.div`
  display: flex; flex-direction: column; gap: 0.4rem;
  min-width: 0;
`;

const HelpText = styled.p`
  margin: 0; color: #94a3b8; font-size: .8rem; line-height: 1.6;
`;

const Label = styled.label`
  font-size: 0.75rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
`;

const Input = styled.input`
  background: rgba(15,23,42,0.6);
  border: 1px solid rgba(255,255,255,0.1);
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;
  &:focus { outline: none; border-color: #f59e0b; box-shadow: 0 0 0 2px rgba(245,158,11,0.2); }
`;

const Select = styled.select`
  background: rgba(15,23,42,0.6);
  border: 1px solid rgba(255,255,255,0.1);
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.95rem;
  width: 100%;
  box-sizing: border-box;
  text-overflow: ellipsis;
  &:focus { outline: none; border-color: #f59e0b; box-shadow: 0 0 0 2px rgba(245,158,11,0.2); }
  option { background: #1e293b; }
`;

const Textarea = styled.textarea`
  background: rgba(15,23,42,0.6);
  border: 1px solid rgba(255,255,255,0.1);
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  width: 100%;
  box-sizing: border-box;
  &:focus { outline: none; border-color: #f59e0b; box-shadow: 0 0 0 2px rgba(245,158,11,0.2); }
`;

const SubmitBtn = styled.button`
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  background: linear-gradient(135deg, #f59e0b, #ea580c);
  color: white; border: none; padding: 0.9rem; border-radius: 8px;
  font-weight: 700; font-size: 1rem; cursor: pointer; transition: all 0.2s;
  margin-top: 0.5rem;
  .spin { animation: ${spin} 1s linear infinite; }
  &:hover { transform: translateY(-2px); box-shadow: 0 6px 15px rgba(245,158,11,0.3); }
  &:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
`;

export default CreateAlertModal;
