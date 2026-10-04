import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { ShieldAlert, TrendingDown, Target, AlertTriangle } from 'lucide-react';

const Container = styled.div`
  background: #1e293b;
  border-radius: 12px;
  padding: 2.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const SectionTitle = styled.h2`
  font-family: 'Unbounded', sans-serif;
  font-size: 1.8rem;
  color: white;
  margin: 0 0 2rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const RulesList = styled(motion.div)`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
`;

const RuleItem = styled(motion.div)`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background: rgba(15, 23, 42, 0.4);
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.03);
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: translateX(5px) !important;
    background: rgba(15, 23, 42, 0.8);
    border-color: rgba(59, 130, 246, 0.3);
  }
`;

const IconWrapper = styled.div`
  background: ${props => props.$color || 'rgba(59, 130, 246, 0.1)'};
  color: ${props => props.$iconColor || '#3b82f6'};
  padding: 0.5rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const RuleText = styled.p`
  margin: 0;
  color: #cbd5e1;
  line-height: 1.5;
  font-size: 1.05rem;
`;

const rules = [
  { text: "No cambiar de plan mientras la operación esté activa.", icon: Target, color: "rgba(59, 130, 246, 0.1)", iconColor: "#3b82f6" },
  { text: "No comprar acciones cuando la tendencia del mercado global es bajista.", icon: TrendingDown, color: "rgba(239, 68, 68, 0.1)", iconColor: "#ef4444" },
  { text: "No comprar acciones pertenecientes a un sector bajista.", icon: TrendingDown, color: "rgba(239, 68, 68, 0.1)", iconColor: "#ef4444" },
  { text: "No mantener posiciones en una acción durante un reporte de ganancias.", icon: AlertTriangle, color: "rgba(234, 179, 8, 0.1)", iconColor: "#eab308" },
  { text: "No mantener posiciones durante eventos conocidos (por ejemplo, elecciones).", icon: AlertTriangle, color: "rgba(234, 179, 8, 0.1)", iconColor: "#eab308" },
  { text: "Seguir el plan de riesgo-beneficio y no invertir en exceso en una sola posición.", icon: ShieldAlert, color: "rgba(16, 185, 129, 0.1)", iconColor: "#10b981" },
  { text: "Si pierdo más del 6% en un mes, dejar de operar ese mes y replantear la estrategia.", icon: ShieldAlert, color: "rgba(239, 68, 68, 0.1)", iconColor: "#ef4444" },
  { text: "No compre un valor por debajo de la EMA de 30 semanal.", icon: TrendingDown, color: "rgba(239, 68, 68, 0.1)", iconColor: "#ef4444" },
  { text: "No compre un valor que tenga una EMA de 30 semanas descendente, aunque el valor esté por encima de la MM.", icon: TrendingDown, color: "rgba(239, 68, 68, 0.1)", iconColor: "#ef4444" },
  { text: "No importa lo alcista que sea un valor, no lo compre demasiado tarde en el avance, cuando esté muy por encima del punto de entrada ideal.", icon: Target, color: "rgba(234, 179, 8, 0.1)", iconColor: "#eab308" },
  { text: "No compre un valor que tenga poco volumen en la fuga.", icon: Target, color: "rgba(234, 179, 8, 0.1)", iconColor: "#eab308" },
  { text: "No compre un valor que muestre poca fuerza relativa.", icon: TrendingDown, color: "rgba(239, 68, 68, 0.1)", iconColor: "#ef4444" },
  { text: "No compre un valor que tenga cerca una fuerte resistencia por encima.", icon: ShieldAlert, color: "rgba(234, 179, 8, 0.1)", iconColor: "#eab308" },
  { text: "No se imagine los suelos. Lo que puede parecer una ganga, podría acabar convirtiéndose en un caro desastre. Compre en las fugas por encima de la resistencia.", icon: AlertTriangle, color: "rgba(239, 68, 68, 0.1)", iconColor: "#ef4444" }
];

// Variantes de Framer Motion para el contenedor padre
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1 // 100ms de retraso entre cada hijo
    }
  }
};

// Variantes de Framer Motion para cada hijo (regla)
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const RulesTab = () => {
  return (
    <Container>
      <SectionTitle>Restricciones</SectionTitle>
      <RulesList
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {rules.map((rule, index) => {
          const IconComponent = rule.icon;
          return (
            <RuleItem key={index} variants={itemVariants}>
              <IconWrapper $color={rule.color} $iconColor={rule.iconColor}>
                <IconComponent size={20} />
              </IconWrapper>
              <RuleText>{rule.text}</RuleText>
            </RuleItem>
          );
        })}
      </RulesList>
    </Container>
  );
};

export default RulesTab;
