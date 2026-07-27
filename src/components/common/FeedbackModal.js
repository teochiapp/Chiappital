import React from 'react';
import styled, { keyframes } from 'styled-components';
import { AlertTriangle, XCircle, CheckCircle, Info, X } from 'lucide-react';

const FeedbackModal = ({ 
  isOpen, 
  onClose,
  onConfirm, 
  title, 
  message, 
  type = 'info', // 'warning', 'error', 'success', 'info'
  isConfirm = false,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar'
}) => {
  if (!isOpen) return null;

  const icons = {
    warning: <AlertTriangle size={36} color="#f59e0b" />,
    error: <XCircle size={36} color="#f43f5e" />,
    success: <CheckCircle size={36} color="#10b981" />,
    info: <Info size={36} color="#3b82f6" />
  };

  const getButtonBg = () => {
    switch(type) {
      case 'error': return 'linear-gradient(135deg, #f43f5e, #be123c)';
      case 'success': return 'linear-gradient(135deg, #10b981, #047857)';
      case 'warning': return 'linear-gradient(135deg, #f59e0b, #b45309)';
      default: return 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
    }
  };

  return (
    <Overlay onClick={isConfirm ? onClose : onClose}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <IconWrapper $type={type}>
          {icons[type]}
        </IconWrapper>
        
        <Title>{title}</Title>
        <Message>{message}</Message>

        <ButtonGroup>
          {isConfirm && (
            <CancelBtn onClick={onClose}>
              {cancelText}
            </CancelBtn>
          )}
          <ConfirmBtn $bg={getButtonBg()} onClick={isConfirm ? onConfirm : onClose}>
            {confirmText || 'Aceptar'}
          </ConfirmBtn>
        </ButtonGroup>

        <CloseIcon onClick={onClose}>
          <X size={18} />
        </CloseIcon>
      </ModalContainer>
    </Overlay>
  );
};

// --- Styles ---
const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const popIn = keyframes`from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); }`;

const Overlay = styled.div`
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.65); backdrop-filter: blur(5px);
  z-index: 10000;
  display: flex; justify-content: center; align-items: center;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContainer = styled.div`
  background: #1e293b;
  width: 90%; max-width: 400px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  padding: 2rem;
  display: flex; flex-direction: column; align-items: center; text-align: center;
  position: relative;
  animation: ${popIn} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
`;

const IconWrapper = styled.div`
  background: ${p => {
    switch(p.$type){
      case 'error': return 'rgba(244,63,94,0.1)';
      case 'success': return 'rgba(16,185,129,0.1)';
      case 'warning': return 'rgba(245,158,11,0.1)';
      default: return 'rgba(59,130,246,0.1)';
    }
  }};
  padding: 1rem;
  border-radius: 50%;
  margin-bottom: 1.5rem;
`;

const Title = styled.h3`
  font-family: 'Unbounded', sans-serif;
  font-size: 1.2rem;
  color: white;
  margin: 0 0 0.75rem 0;
`;

const Message = styled.p`
  color: #94a3b8;
  font-size: 0.95rem;
  margin: 0 0 2rem 0;
  line-height: 1.5;
`;

const ButtonGroup = styled.div`
  display: flex; gap: 1rem; width: 100%;
`;

const CancelBtn = styled.button`
  flex: 1;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: #cbd5e1;
  padding: 0.8rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: rgba(255,255,255,0.1); color: white; }
`;

const ConfirmBtn = styled.button`
  flex: 1;
  background: ${p => p.$bg};
  border: none;
  color: white;
  padding: 0.8rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  &:hover { transform: translateY(-2px); filter: brightness(1.1); }
`;

const CloseIcon = styled.button`
  position: absolute; top: 1rem; right: 1rem;
  background: transparent; border: none; color: #64748b;
  cursor: pointer; padding: 0.25rem; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
  &:hover { background: rgba(255,255,255,0.1); color: white; }
`;

export default FeedbackModal;
