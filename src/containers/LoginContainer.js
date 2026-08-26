import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useStrapiAuth } from '../hooks/useApiTrades';
import { Lock, ArrowRight } from 'lucide-react';
import Logo from '../components/common/Logo';

const LoginContainer = () => {
  const [name, setName] = useState('');
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');
  const { familyLogin, error, user } = useStrapiAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/select-account';

  // Si ya está logueado, redirigir a selección de cuenta o a la ruta original
  if (user) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNameError('');
    if (!name.trim() || !answer.trim()) return;

    const allowedNames = ['teo', 'fausto', 'ciro', 'jorge'];
    if (!allowedNames.includes(name.trim().toLowerCase())) {
      setNameError('Acceso denegado: Nombre no reconocido.');
      return;
    }

    setIsSubmitting(true);
    const result = await familyLogin(answer);
    setIsSubmitting(false);

    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <Container>
      <GradientOverlay />

      <LoginCard>
        <LogoWrapper>
          <Logo size="100px" fontSize="5rem" />
        </LogoWrapper>

        <Title>
          <Lock size={24} />
          Acceso Familiar
        </Title>

        <Form onSubmit={handleSubmit}>
          <Label>Nombre</Label>
          <InputWrapper>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre..."
              disabled={isSubmitting}
              autoFocus
            />
          </InputWrapper>

          <Label style={{ marginTop: '1rem' }}>¿Cuál es el nombre de tu perra salchicha?</Label>
          <InputWrapper>
            <Input
              type="password"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Escribe la respuesta..."
              disabled={isSubmitting}
            />
          </InputWrapper>

          {nameError && <ErrorMessage>{nameError}</ErrorMessage>}
          {error && <ErrorMessage>{error}</ErrorMessage>}

          <SubmitButton type="submit" disabled={isSubmitting || !answer.trim() || !name.trim()}>
            {isSubmitting ? 'Verificando...' : 'Entrar'}
            <ArrowRight size={20} />
          </SubmitButton>
        </Form>
      </LoginCard>
    </Container>
  );
};

// ─── Estilos (Similares a DevAuth pero más modernos) ─────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #0f172a;
  position: relative;
  overflow: hidden;
`;

const GradientOverlay = styled.div`
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at center, rgba(101, 29, 35, 0.15) 0%, rgba(15, 23, 42, 1) 50%);
  pointer-events: none;
`;

const LoginCard = styled.div`
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 3rem;
  border-radius: 24px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  z-index: 1;
  animation: ${fadeIn} 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;

  @media (max-width: 480px) {
    padding: 2rem 1.5rem;
    border-radius: 16px;
    max-width: 100%;
  }

  @media (max-width: 350px) {
    padding: 1.5rem 1rem;
    border-radius: 12px;
  }
`;

const LogoWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2.5rem;
`;



const Title = styled.h2`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  font-size: 1.1rem;
  color: #94a3b8;
  font-weight: 500;
  margin-bottom: 2rem;

  @media (max-width: 350px) {
    font-size: 0.95rem;
    gap: 0.5rem;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Label = styled.label`
  font-size: 0.88rem;
  font-weight: 500;
  color: #e2e8f0;
  text-align: center;

  @media (max-width: 350px) {
    font-size: 0.8rem;
  }
`;

const InputWrapper = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem 1.25rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-size: 1.1rem;
  transition: all 0.2s ease;
  text-align: center;

  &:focus {
    outline: none;
    border-color: #651D23;
    box-shadow: 0 0 0 4px rgba(101, 29, 35, 0.1);
  }

  &::placeholder {
    color: #64748b;
  }
`;

const ErrorMessage = styled.div`
  color: #ef4444;
  font-size: 0.95rem;
  background: rgba(239, 68, 68, 0.1);
  padding: 0.75rem;
  border-radius: 8px;
  text-align: center;
  border: 1px solid rgba(239, 68, 68, 0.2);
`;

const SubmitButton = styled.button`
  background: linear-gradient(135deg, #651D23 0%, #49151A 100%);
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.5rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px -10px rgba(101, 29, 35, 0.5);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

export default LoginContainer;
