// modules/personal/pages/MediterraneanShoppingPage.js — Lista de compras mediterránea
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { ArrowLeft, Plus, Trash2, ShoppingCart, CheckCheck, X } from 'lucide-react';
import { useMediterranean } from '../../../context/MediterraneanContext';

const CATEGORIES_ORDER = [
  'verduras', 'frutas', 'proteínas', 'lácteos', 'granos', 'legumbres', 'hierbas', 'condimentos', 'otros'
];

const MediterraneanShoppingPage = () => {
  const navigate = useNavigate();
  const { shoppingList, toggleShoppingItem, deleteShoppingItem, clearShopping, addShoppingItems, loading } = useMediterranean();

  const [newItem, setNewItem] = useState({ name: '', qty: '', unit: '', category: 'otros' });
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const grouped = useMemo(() => {
    const map = {};
    shoppingList.forEach(item => {
      const cat = item.category || 'otros';
      if (!map[cat]) map[cat] = [];
      map[cat].push(item);
    });
    // Sort categories
    const sorted = {};
    CATEGORIES_ORDER.forEach(c => { if (map[c]) sorted[c] = map[c]; });
    Object.keys(map).forEach(c => { if (!sorted[c]) sorted[c] = map[c]; });
    return sorted;
  }, [shoppingList]);

  const totalItems = shoppingList.length;
  const checkedItems = shoppingList.filter(i => i.checked).length;
  const pendingItems = totalItems - checkedItems;
  const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  const handleAddItem = async () => {
    if (!newItem.name.trim()) return;
    setAdding(true);
    try {
      await addShoppingItems([{ ...newItem }]);
      setNewItem({ name: '', qty: '', unit: '', category: 'otros' });
      setShowAddForm(false);
    } finally {
      setAdding(false);
    }
  };

  const handleClearChecked = async () => {
    if (checkedItems === 0) return;
    if (window.confirm(`¿Eliminar ${checkedItems} items comprados?`)) {
      await clearShopping(true);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('¿Vaciar toda la lista de compras?')) {
      await clearShopping(false);
    }
  };

  return (
    <Container>
      <NavBar>
        <BackBtn onClick={() => navigate('/personal/mediterranean')}>
          <ArrowLeft size={18} /> Mediterráneo
        </BackBtn>
      </NavBar>

      <PageHeader>
        <TitleArea>
          <PageTitle>🛒 Lista de Compras</PageTitle>
          <Subtitle>{pendingItems} items pendientes · {checkedItems} comprados</Subtitle>
        </TitleArea>
        <HeaderActions>
          <ActionBtn $ghost onClick={() => setShowAddForm(p => !p)}>
            <Plus size={15} /> Agregar item
          </ActionBtn>
          {checkedItems > 0 && (
            <ActionBtn $secondary onClick={handleClearChecked}>
              <CheckCheck size={15} /> Limpiar comprados
            </ActionBtn>
          )}
          {totalItems > 0 && (
            <ActionBtn $danger onClick={handleClearAll}>
              <Trash2 size={14} /> Vaciar lista
            </ActionBtn>
          )}
        </HeaderActions>
      </PageHeader>

      {/* Progress bar */}
      {totalItems > 0 && (
        <ProgressSection>
          <ProgressText>{progress}% completado</ProgressText>
          <ProgressBar>
            <ProgressFill $pct={progress} />
          </ProgressBar>
        </ProgressSection>
      )}

      {/* Add item form */}
      {showAddForm && (
        <AddItemCard>
          <AddItemTitle>Nuevo item</AddItemTitle>
          <AddItemRow>
            <SmallInput value={newItem.qty} onChange={e => setNewItem(p => ({ ...p, qty: e.target.value }))} placeholder="Cant." />
            <SmallInput value={newItem.unit} onChange={e => setNewItem(p => ({ ...p, unit: e.target.value }))} placeholder="Unidad" />
            <FlexInput
              value={newItem.name}
              onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
              placeholder="Nombre del producto"
              onKeyDown={e => e.key === 'Enter' && handleAddItem()}
            />
            <Select value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}>
              {CATEGORIES_ORDER.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </AddItemRow>
          <AddItemActions>
            <CancelAddBtn onClick={() => setShowAddForm(false)}><X size={14} /> Cancelar</CancelAddBtn>
            <SaveItemBtn onClick={handleAddItem} disabled={adding || !newItem.name.trim()}>
              {adding ? 'Agregando...' : '+ Agregar'}
            </SaveItemBtn>
          </AddItemActions>
        </AddItemCard>
      )}

      {/* Empty state */}
      {!loading && totalItems === 0 && (
        <EmptyState>
          <EmptyIcon><ShoppingCart size={48} /></EmptyIcon>
          <EmptyTitle>Lista vacía</EmptyTitle>
          <EmptyText>Agregá items manualmente o desde el detalle de una receta.</EmptyText>
          <ActionBtn $ghost onClick={() => setShowAddForm(true)}>
            <Plus size={15} /> Agregar primer item
          </ActionBtn>
        </EmptyState>
      )}

      {/* Grouped items */}
      {Object.entries(grouped).map(([category, items]) => (
        <CategoryGroup key={category}>
          <CategoryHeader>
            <CategoryName>{category.charAt(0).toUpperCase() + category.slice(1)}</CategoryName>
            <CategoryCount>{items.filter(i => !i.checked).length} pendientes</CategoryCount>
          </CategoryHeader>
          <ItemList>
            {items.map(item => (
              <ShoppingItem key={item.id} $checked={item.checked}>
                <ItemCheck onClick={() => toggleShoppingItem(item.id, !item.checked)}>
                  {item.checked
                    ? <CheckedIcon>✓</CheckedIcon>
                    : <UncheckedBox />
                  }
                </ItemCheck>
                <ItemContent>
                  <ItemName $checked={item.checked}>{item.name}</ItemName>
                  {(item.qty || item.unit) && (
                    <ItemMeta>{item.qty} {item.unit}</ItemMeta>
                  )}
                </ItemContent>
                <ItemDelete onClick={() => deleteShoppingItem(item.id)}>
                  <X size={13} />
                </ItemDelete>
              </ShoppingItem>
            ))}
          </ItemList>
        </CategoryGroup>
      ))}
    </Container>
  );
};

// ─── Animations ───────────────────────────────────────────────────────────────
const fadeUp = keyframes`from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); }`;

// ─── Styled Components ────────────────────────────────────────────────────────

const Container = styled.div`
  color: #e2e8f0; max-width: 800px; margin: 0 auto;
  padding: 1.5rem 2rem; animation: ${fadeUp} 0.3s ease-out;
  @media (max-width: 768px) { padding: 1rem; }
`;

const NavBar = styled.div`margin-bottom: 1rem;`;
const BackBtn = styled.button`
  display: flex; align-items: center; gap: 0.4rem;
  background: transparent; border: none; color: #94a3b8;
  font-size: 0.88rem; cursor: pointer;
  &:hover { color: white; }
`;

const PageHeader = styled.div`
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 1.25rem; gap: 1rem; flex-wrap: wrap;
`;
const TitleArea = styled.div``;
const PageTitle = styled.h1`
  font-family: 'Unbounded', sans-serif; font-size: 1.4rem;
  font-weight: 700; color: white; margin: 0 0 0.2rem 0;
`;
const Subtitle = styled.div`font-size: 0.85rem; color: #64748b;`;

const HeaderActions = styled.div`display: flex; gap: 0.6rem; flex-wrap: wrap;`;
const ActionBtn = styled.button`
  display: flex; align-items: center; gap: 0.35rem;
  padding: 0.5rem 0.9rem; border-radius: 10px;
  font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
  ${p => p.$ghost ? `
    background: rgba(107,142,35,0.12); color: #8FAF35;
    border: 1px solid rgba(107,142,35,0.25);
    &:hover { background: rgba(107,142,35,0.2); }
  ` : p.$secondary ? `
    background: rgba(196,154,26,0.1); color: #C49A1A;
    border: 1px solid rgba(196,154,26,0.2);
    &:hover { background: rgba(196,154,26,0.2); }
  ` : p.$danger ? `
    background: rgba(239,68,68,0.1); color: #ef4444;
    border: 1px solid rgba(239,68,68,0.2);
    &:hover { background: rgba(239,68,68,0.2); }
  ` : `
    background: transparent; color: #94a3b8;
    border: 1px solid rgba(255,255,255,0.08);
  `}
`;

const ProgressSection = styled.div`margin-bottom: 1.25rem;`;
const ProgressText = styled.div`font-size: 0.8rem; color: #64748b; margin-bottom: 0.4rem;`;
const ProgressBar = styled.div`height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden;`;
const ProgressFill = styled.div`
  height: 100%; width: ${p => p.$pct}%;
  background: linear-gradient(90deg, #6B8E23, #8FAF35);
  border-radius: 3px; transition: width 0.5s ease;
`;

const AddItemCard = styled.div`
  background: #0f172a; border: 1px solid rgba(107,142,35,0.2);
  border-radius: 14px; padding: 1.25rem; margin-bottom: 1.25rem;
  animation: ${fadeUp} 0.2s ease-out;
`;
const AddItemTitle = styled.div`font-weight: 600; color: white; margin-bottom: 0.75rem; font-size: 0.9rem;`;
const AddItemRow = styled.div`display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem;`;
const baseInput = `
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 9px; color: #e2e8f0; padding: 0.55rem 0.75rem;
  font-size: 0.88rem; outline: none; font-family: inherit;
  &::placeholder { color: #475569; }
  &:focus { border-color: rgba(107,142,35,0.4); }
`;
const SmallInput = styled.input`${baseInput} width: 75px; flex-shrink: 0;`;
const FlexInput = styled.input`${baseInput} flex: 1; min-width: 150px;`;
const Select = styled.select`${baseInput} cursor: pointer; option { background: #0f172a; }`;
const AddItemActions = styled.div`display: flex; gap: 0.6rem; justify-content: flex-end;`;
const CancelAddBtn = styled.button`
  display: flex; align-items: center; gap: 0.3rem;
  background: transparent; border: 1px solid rgba(255,255,255,0.08);
  color: #94a3b8; border-radius: 9px; padding: 0.45rem 0.85rem;
  font-size: 0.82rem; cursor: pointer;
`;
const SaveItemBtn = styled.button`
  background: linear-gradient(135deg, #6B8E23, #8FAF35); color: white;
  border: none; border-radius: 9px; padding: 0.45rem 1rem;
  font-size: 0.85rem; font-weight: 700; cursor: pointer;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const EmptyState = styled.div`
  display: flex; flex-direction: column; align-items: center;
  padding: 4rem 2rem; gap: 0.75rem; text-align: center;
`;
const EmptyIcon = styled.div`color: rgba(107,142,35,0.25);`;
const EmptyTitle = styled.div`font-size: 1.1rem; font-weight: 600; color: #e2e8f0;`;
const EmptyText = styled.div`font-size: 0.9rem; color: #64748b; max-width: 300px;`;

const CategoryGroup = styled.div`margin-bottom: 1.25rem;`;
const CategoryHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.4rem 0; margin-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.05);
`;
const CategoryName = styled.div`
  font-size: 0.78rem; font-weight: 700; color: #64748b;
  text-transform: uppercase; letter-spacing: 0.06em;
`;
const CategoryCount = styled.div`font-size: 0.72rem; color: #475569;`;

const ItemList = styled.div`display: flex; flex-direction: column; gap: 0.4rem;`;
const ShoppingItem = styled.div`
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  background: ${p => p.$checked ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)'};
  border: 1px solid ${p => p.$checked ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)'};
  border-radius: 10px; transition: all 0.2s;
  opacity: ${p => p.$checked ? 0.55 : 1};
`;
const ItemCheck = styled.button`
  background: transparent; border: none; cursor: pointer;
  display: flex; align-items: center; flex-shrink: 0;
`;
const CheckedIcon = styled.div`
  width: 20px; height: 20px; border-radius: 50%;
  background: rgba(107,142,35,0.2); border: 2px solid #6B8E23;
  color: #8FAF35; font-size: 0.7rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
`;
const UncheckedBox = styled.div`
  width: 20px; height: 20px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.12); transition: border-color 0.2s;
  &:hover { border-color: rgba(107,142,35,0.4); }
`;
const ItemContent = styled.div`flex: 1; min-width: 0;`;
const ItemName = styled.div`
  font-size: 0.9rem; color: ${p => p.$checked ? '#64748b' : '#e2e8f0'};
  text-decoration: ${p => p.$checked ? 'line-through' : 'none'};
  transition: all 0.2s;
`;
const ItemMeta = styled.div`font-size: 0.75rem; color: #64748b;`;
const ItemDelete = styled.button`
  background: transparent; border: none; color: #334155; cursor: pointer;
  display: flex; align-items: center; flex-shrink: 0;
  &:hover { color: #ef4444; }
`;

export default MediterraneanShoppingPage;
