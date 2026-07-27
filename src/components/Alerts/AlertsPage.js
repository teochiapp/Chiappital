import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { BellRing, Plus, Edit2, Trash2, RefreshCw, AlertCircle, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { StyledContainer } from '../common/StyledComponents';
import FeedbackModal from '../common/FeedbackModal';
import { useAlerts } from '../../context/AlertsContext';
import alertService from '../../services/alertService';
import { colors } from '../../styles/colors';
import CreateAlertModal from './CreateAlertModal';

const AlertsPage = () => {
  const { alerts, loading, fetchAlerts } = useAlerts();
  
  const [showModal, setShowModal] = useState(false);
  const [alertInitialData, setAlertInitialData] = useState(null);

  // Feedback Modal State
  const [feedback, setFeedback] = useState({ isOpen: false, type: 'info', title: '', message: '', isConfirm: false, onConfirm: null });

  useEffect(() => {
    fetchAlerts();
  }, []);

  const openNewModal = () => {
    setAlertInitialData(null);
    setShowModal(true);
  };

  const openEditModal = (alert) => {
    setAlertInitialData(alert);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleDelete = (id) => {
    setFeedback({
      isOpen: true,
      type: 'warning',
      title: 'Eliminar Alerta',
      message: '¿Estás seguro que deseas eliminar esta alerta? Esta acción no se puede deshacer.',
      isConfirm: true,
      confirmText: 'Eliminar',
      onConfirm: async () => {
        setFeedback(prev => ({ ...prev, isOpen: false }));
        try {
          await alertService.deleteAlert(id);
          fetchAlerts();
        } catch (error) {
          console.error(error);
          setTimeout(() => {
            setFeedback({
              isOpen: true,
              type: 'error',
              title: 'Error',
              message: 'No se pudo eliminar la alerta.',
              isConfirm: false
            });
          }, 300);
        }
      }
    });
  };

  const toggleActive = async (alertData) => {
    try {
      await alertService.updateAlert(alertData.id, {
        is_active: alertData.is_active ? 0 : 1
      });
      fetchAlerts();
    } catch (error) {
      console.error(error);
    }
  };

  const activeAlerts = alerts.filter(a => a.is_active === 1);
  const inactiveAlerts = alerts.filter(a => a.is_active === 0);

  return (
    <Layout>
      <StyledContainer>
        <Header>
          <TitleArea>
            <Title><BellRing size={24} style={{ marginRight: '8px', color: '#f59e0b' }}/> Alertas de Mercado</Title>
            <Sub>Notificaciones globales basadas en precios objetivo · Chequeo cada 15 min</Sub>
          </TitleArea>
          <HeaderBtns>
            <RefreshBtn onClick={fetchAlerts} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              Actualizar
            </RefreshBtn>
            <CreateBtn onClick={openNewModal}>
              <Plus size={16} />
              Nueva Alerta
            </CreateBtn>
          </HeaderBtns>
        </Header>

        {loading && alerts.length === 0 ? (
          <StateBox>
            <RefreshCw size={26} className="spin" color={colors.primary} />
            <p>Cargando alertas...</p>
          </StateBox>
        ) : alerts.length === 0 ? (
          <StateBox>
            <BellRing size={32} color="#475569" />
            <p style={{ color: '#475569' }}>No tienes alertas configuradas.</p>
            <CreateBtn onClick={openNewModal} style={{ marginTop: '1rem' }}>Crear la primera</CreateBtn>
          </StateBox>
        ) : (
          <ContentGrid>
            {/* Activas */}
            <Section>
              <SectionHeader>
                <SectionTitle>Alertas Activas ({activeAlerts.length})</SectionTitle>
              </SectionHeader>
              
              {activeAlerts.length === 0 ? (
                <EmptyState>No hay alertas activas</EmptyState>
              ) : (
                <TableWrap>
                  <Table>
                    <thead>
                      <tr>
                        <th>Símbolo</th>
                        <th>Condición</th>
                        <th>Precio Objetivo</th>
                        <th>Notas</th>
                        <th>Estado</th>
                        <th style={{textAlign: 'right'}}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeAlerts.map((a) => (
                        <Row key={a.id}>
                          <Td><SymTxt>{a.symbol}</SymTxt></Td>
                          <Td>
                            <ConditionBadge $type={a.condition_type}>
                              {a.condition_type === 'above' ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                              {a.condition_type === 'above' ? 'Mayor a' : 'Menor a'}
                            </ConditionBadge>
                          </Td>
                          <Td><PriceTxt>${parseFloat(a.target_price).toFixed(2)}</PriceTxt></Td>
                          <Td><NotesTxt>{a.notes || '—'}</NotesTxt></Td>
                          <Td>
                            <ToggleBtn $active={true} onClick={() => toggleActive(a)}>
                              <Activity size={12}/> Activa
                            </ToggleBtn>
                          </Td>
                          <Td style={{textAlign: 'right'}}>
                            <ActionBtns>
                              <ActionBtn onClick={() => openEditModal(a)}><Edit2 size={14} /></ActionBtn>
                              <ActionBtn $danger onClick={() => handleDelete(a.id)}><Trash2 size={14} /></ActionBtn>
                            </ActionBtns>
                          </Td>
                        </Row>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
              )}
            </Section>

            {/* Inactivas / Disparadas */}
            {inactiveAlerts.length > 0 && (
              <Section style={{ opacity: 0.8, marginTop: '2rem' }}>
                <SectionHeader>
                  <SectionTitle>Historial / Inactivas ({inactiveAlerts.length})</SectionTitle>
                </SectionHeader>
                <TableWrap>
                  <Table>
                    <thead>
                      <tr>
                        <th>Símbolo</th>
                        <th>Condición</th>
                        <th>Precio Objetivo</th>
                        <th>Notas</th>
                        <th>Estado</th>
                        <th style={{textAlign: 'right'}}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inactiveAlerts.map((a) => (
                        <Row key={a.id} $inactive>
                          <Td><SymTxt>{a.symbol}</SymTxt></Td>
                          <Td>
                            <ConditionBadge $type={a.condition_type} $inactive>
                              {a.condition_type === 'above' ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                              {a.condition_type === 'above' ? 'Mayor a' : 'Menor a'}
                            </ConditionBadge>
                          </Td>
                          <Td><PriceTxt $inactive>${parseFloat(a.target_price).toFixed(2)}</PriceTxt></Td>
                          <Td><NotesTxt>{a.notes || '—'}</NotesTxt></Td>
                          <Td>
                            <ToggleBtn $active={false} onClick={() => toggleActive(a)}>
                              Inactiva
                            </ToggleBtn>
                          </Td>
                          <Td style={{textAlign: 'right'}}>
                            <ActionBtns>
                              <ActionBtn onClick={() => openEditModal(a)}><Edit2 size={14} /></ActionBtn>
                              <ActionBtn $danger onClick={() => handleDelete(a.id)}><Trash2 size={14} /></ActionBtn>
                            </ActionBtns>
                          </Td>
                        </Row>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
              </Section>
            )}
          </ContentGrid>
        )}
      </StyledContainer>

      <CreateAlertModal 
        isOpen={showModal} 
        onClose={closeModal}
        initialData={alertInitialData}
        onSuccess={() => {
          fetchAlerts();
          setFeedback({
            isOpen: true,
            type: 'success',
            title: '¡Éxito!',
            message: 'La alerta fue guardada correctamente.',
            isConfirm: false
          });
        }}
      />

      <FeedbackModal
        isOpen={feedback.isOpen}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
        isConfirm={feedback.isConfirm}
        confirmText={feedback.confirmText}
        onConfirm={feedback.onConfirm}
        onClose={() => setFeedback(prev => ({ ...prev, isOpen: false }))}
      />
    </Layout>
  );
};

// --- Styles ---
const fadeIn = keyframes`from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}`;
const spin   = keyframes`from{transform:rotate(0deg)}to{transform:rotate(360deg)}`;

const Layout = styled.div`
  padding: 2rem 0;
  min-height: calc(100vh - 80px);
  background: #0f172a;
  color: #e2e8f0;
  animation: ${fadeIn} 0.35s ease-out;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
  @media(max-width:600px){flex-direction:column;align-items:flex-start;gap:.75rem;}
`;

const TitleArea = styled.div`display:flex;flex-direction:column;gap:.25rem;`;

const Title = styled.h1`
  display: flex;
  align-items: center;
  font-family: 'Unbounded', sans-serif;
  font-size: 1.9rem;
  margin: 0;
  background: linear-gradient(135deg,#fff 0%,#f59e0b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Sub = styled.p`color:#475569;font-size:.85rem;margin:0;`;

const HeaderBtns = styled.div`display:flex;gap:.75rem;align-items:center;`;

const RefreshBtn = styled.button`
  display:flex;align-items:center;gap:.4rem;
  background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
  color:white;padding:.5rem 1rem;border-radius:8px;font-size:.85rem;font-weight:500;
  cursor:pointer;transition:background .2s;
  &:hover{background:rgba(255,255,255,.1);}
  &:disabled{opacity:.5;cursor:not-allowed;}
  .spin{animation:${spin} 1s linear infinite;}
`;

const CreateBtn = styled.button`
  display:flex;align-items:center;gap:.4rem;
  background: linear-gradient(135deg, #f59e0b, #ea580c);
  border: none;
  color: white;
  padding:.5rem 1rem;border-radius:8px;font-size:.85rem;font-weight:600;
  cursor:pointer;transition:all .2s;
  &:hover{
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(245,158,11,0.25);
  }
`;

const StateBox = styled.div`
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  height:260px;gap:1rem;color:#475569;
  background: rgba(30,41,59,.3); border-radius: 16px; border: 1px dashed rgba(255,255,255,0.1);
  .spin{animation:${spin} 1s linear infinite;}
`;

const ContentGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
`;

const SectionTitle = styled.h2`
  font-family: 'Unbounded', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0;
`;

const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
  background: rgba(30,41,59,.25);
  border-radius: 12px;
  color: #64748b;
  font-size: 0.9rem;
`;

const TableWrap = styled.div`
  width: 100%;
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,.05);
  background: rgba(15,23,42,.4);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: .875rem;

  th {
    background: #0b1120;
    color: #475569;
    font-size: .7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .05em;
    padding: .75rem 1rem;
    text-align: left;
    border-bottom: 1px solid rgba(255,255,255,.05);
  }
`;

const Row = styled.tr`
  border-bottom: 1px solid rgba(255,255,255,.03);
  background: ${p => p.$inactive ? 'transparent' : 'rgba(30,41,59,.15)'};
  transition: background .15s;
  &:hover{background:rgba(255,255,255,.03);}
  &:last-child{border-bottom:none;}
`;

const Td = styled.td`
  padding: .85rem 1rem;
  vertical-align: middle;
`;

const SymTxt = styled.span`
  font-family: 'Unbounded', sans-serif;
  font-size: .9rem;
  font-weight: 700;
  color: white;
  letter-spacing: .04em;
  background: rgba(245,158,11,0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  border: 1px solid rgba(245,158,11,0.2);
`;

const ConditionBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: ${p => p.$inactive ? 'rgba(255,255,255,0.05)' : p.$type === 'above' ? 'rgba(52,211,153,0.12)' : 'rgba(244,63,94,0.12)'};
  color: ${p => p.$inactive ? '#64748b' : p.$type === 'above' ? '#34d399' : '#f43f5e'};
  padding: .2rem .5rem;
  border-radius: 6px;
  font-size: .75rem;
  font-weight: 600;
`;

const PriceTxt = styled.span`
  font-weight: 700;
  font-size: .95rem;
  color: ${p => p.$inactive ? '#64748b' : 'white'};
  font-variant-numeric: tabular-nums;
`;

const NotesTxt = styled.span`
  color: #94a3b8;
  font-size: .8rem;
  max-width: 200px;
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ToggleBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: ${p => p.$active ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.05)'};
  border: 1px solid ${p => p.$active ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.1)'};
  color: ${p => p.$active ? '#38bdf8' : '#64748b'};
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: ${p => p.$active ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.1)'};
  }
`;

const ActionBtns = styled.div`
  display: flex;
  gap: 0.4rem;
  justify-content: flex-end;
`;

const ActionBtn = styled.button`
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.05);
  color: ${p => p.$danger ? '#f43f5e' : '#94a3b8'};
  padding: .35rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all .2s;
  display: flex; align-items: center; justify-content: center;
  &:hover {
    background: ${p => p.$danger ? 'rgba(244,63,94,.1)' : 'rgba(255,255,255,.1)'};
    color: ${p => p.$danger ? '#f43f5e' : 'white'};
  }
`;

export default AlertsPage;
