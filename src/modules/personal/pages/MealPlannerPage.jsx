import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useMediterranean } from '../../../context/MediterraneanContext';
import { GripVertical, Trash2, CalendarDays, ChefHat, Search, Plus, X, Info } from 'lucide-react';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MEALS = ['Almuerzo', 'Merienda', 'Cena', 'Night Meal'];

const MealPlannerPage = () => {
  const { recipes } = useMediterranean();
  const [searchTerm, setSearchTerm] = useState('');

  // Custom Meal Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ day: null, meal: null });
  const [customName, setCustomName] = useState('');

  // Notes State
  const [notes, setNotes] = useState(() => {
    return localStorage.getItem('chiappital_meal_planner_notes') || '';
  });

  // Try to load from localStorage, otherwise empty grid
  const [planner, setPlanner] = useState(() => {
    const saved = localStorage.getItem('chiappital_meal_planner');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old data (objects/null) to arrays
      DAYS.forEach(day => {
        if (!parsed[day]) parsed[day] = {};
        MEALS.forEach(meal => {
          const item = parsed[day][meal];
          if (item === null || item === undefined) {
            parsed[day][meal] = [];
          } else if (!Array.isArray(item)) {
            parsed[day][meal] = [item];
          }
        });
      });
      return parsed;
    }

    const initial = {};
    DAYS.forEach(day => {
      initial[day] = {};
      MEALS.forEach(meal => {
        initial[day][meal] = [];
      });
    });
    return initial;
  });

  useEffect(() => {
    localStorage.setItem('chiappital_meal_planner', JSON.stringify(planner));
  }, [planner]);

  useEffect(() => {
    localStorage.setItem('chiappital_meal_planner_notes', notes);
  }, [notes]);

  const handleDragStart = (e, recipe) => {
    e.dataTransfer.setData('recipe', JSON.stringify(recipe));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, day, meal) => {
    e.preventDefault();
    const recipeData = e.dataTransfer.getData('recipe');
    if (recipeData) {
      const recipe = JSON.parse(recipeData);
      setPlanner(prev => ({
        ...prev,
        [day]: {
          ...prev[day],
          [meal]: [...(prev[day][meal] || []), recipe]
        }
      }));
    }
  };

  const removeRecipe = (day, meal, index) => {
    setPlanner(prev => {
      const currentList = prev[day][meal] || [];
      return {
        ...prev,
        [day]: {
          ...prev[day],
          [meal]: currentList.filter((_, i) => i !== index)
        }
      };
    });
  };

  const openCustomModal = (day, meal) => {
    setModalData({ day, meal });
    setCustomName('');
    setModalOpen(true);
  };

  const closeCustomModal = () => {
    setModalOpen(false);
    setModalData({ day: null, meal: null });
  };

  const handleSaveCustomMeal = () => {
    if (customName && customName.trim() !== '') {
      setPlanner(prev => ({
        ...prev,
        [modalData.day]: {
          ...prev[modalData.day],
          [modalData.meal]: [
            ...(prev[modalData.day][modalData.meal] || []),
            { id: `custom-${Date.now()}`, name: customName, isCustom: true }
          ]
        }
      }));
      closeCustomModal();
    }
  };

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const clearPlanner = () => {
    if (window.confirm('¿Estás seguro de que deseas limpiar todo el planificador?')) {
      const initial = {};
      DAYS.forEach(day => {
        initial[day] = {};
        MEALS.forEach(meal => {
          initial[day][meal] = [];
        });
      });
      setPlanner(initial);
    }
  };

  return (
    <Container>
      <Header>
        <TitleContainer>
          <CalendarDays size={28} color="#10b981" />
          <Title>Meal Planner</Title>
        </TitleContainer>
        <HeaderActions>
          <Subtitle>Arrastra las recetas del recetario a los días correspondientes.</Subtitle>
          <ClearButton onClick={clearPlanner}>
            <Trash2 size={16} />
            Limpiar Plan
          </ClearButton>
        </HeaderActions>
      </Header>

      <Content>
        <Sidebar>
          <SidebarHeader>
            <ChefHat size={20} color="#10b981" />
            <SidebarTitle>Recetas Disponibles</SidebarTitle>
          </SidebarHeader>
          <SearchContainer>
            <Search size={16} color="#94a3b8" />
            <SearchInput
              type="text"
              placeholder="Buscar recetas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>
          <RecipesList>
            {filteredRecipes.length === 0 && <EmptyRecipes>No hay recetas encontradas.</EmptyRecipes>}
            {filteredRecipes.map(recipe => (
              <RecipeCard
                key={recipe.id}
                draggable
                onDragStart={(e) => handleDragStart(e, recipe)}
              >
                <DragHandle>
                  <GripVertical size={16} />
                </DragHandle>
                <RecipeInfo>
                  <RecipeName>{recipe.name}</RecipeName>
                  <RecipeCategory>{recipe.category}</RecipeCategory>
                </RecipeInfo>
              </RecipeCard>
            ))}
          </RecipesList>
        </Sidebar>

        <PlannerContainer>
          <PlannerGrid>
            <GridHeader>
              <TimeColumn></TimeColumn>
              {DAYS.map(day => (
                <DayHeader key={day}>{day}</DayHeader>
              ))}
            </GridHeader>

            <GridBody>
              {MEALS.map(meal => (
                <GridRow key={meal}>
                  <MealHeader>{meal}</MealHeader>
                  {DAYS.map(day => {
                    const assignedRecipes = planner[day][meal] || [];
                    const hasRecipes = assignedRecipes.length > 0;
                    return (
                      <MealCell
                        key={`${day}-${meal}`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, day, meal)}
                        $hasRecipe={hasRecipes}
                      >
                        {hasRecipes ? (
                          <RecipesContainer>
                            {assignedRecipes.map((assignedRecipe, idx) => (
                              <AssignedRecipe key={`${assignedRecipe.id}-${idx}`}>
                                <AssignedName>{assignedRecipe.name}</AssignedName>
                                <RemoveButton onClick={() => removeRecipe(day, meal, idx)}>
                                  <Trash2 size={12} />
                                </RemoveButton>
                              </AssignedRecipe>
                            ))}
                          </RecipesContainer>
                        ) : (
                          <EmptyCellText>Arrastrar aquí</EmptyCellText>
                        )}
                        <AddCustomButton onClick={() => openCustomModal(day, meal)} title="Agregar comida">
                          <Plus size={14} />
                        </AddCustomButton>
                      </MealCell>
                    );
                  })}
                </GridRow>
              ))}
            </GridBody>
          </PlannerGrid>
        </PlannerContainer>
      </Content>

      <NotesSection>
        <NotesHeader>
          <Info size={18} color="#3b82f6" />
          <NotesTitle>Info & Notas Semanales</NotesTitle>
        </NotesHeader>
        <NotesArea
          placeholder="Escribe aquí tus ideas, reglas de alimentación o cómo planear la semana (soporta indentación y múltiples líneas, estilo Notion)..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          spellCheck="false"
        />
      </NotesSection>

      {modalOpen && (
        <ModalOverlay onClick={closeCustomModal}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Comida Personalizada</ModalTitle>
              <CloseButton onClick={closeCustomModal}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              <ModalLabel>Nombre para {modalData.day} - {modalData.meal}</ModalLabel>
              <ModalInput
                autoFocus
                type="text"
                placeholder="Ej: Salida a cenar, Delivery..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveCustomMeal()}
              />
            </ModalBody>
            <ModalFooter>
              <CancelButton onClick={closeCustomModal}>Cancelar</CancelButton>
              <SaveButton onClick={handleSaveCustomMeal}>Agregar Comida</SaveButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

// --- Styles ---

const Container = styled.div`
  padding: 2rem;
  color: white;
  min-height: 100vh;
  background-color: #0b0f19;

  @media (max-width: 1024px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const HeaderActions = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    @media (max-width: 768px) {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }
`;

const Subtitle = styled.p`
  color: #94a3b8;
  margin: 0;
  font-size: 1rem;
`;

const ClearButton = styled.button`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.2);
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: rgba(239, 68, 68, 0.2);
    }
`;

const Content = styled.div`
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 1.5rem;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const Sidebar = styled.div`
  background: rgba(30, 41, 59, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  height: calc(70vh - 160px);
  position: sticky;
  top: 100px;
  display: flex;
  flex-direction: column;

  @media (max-width: 1024px) {
    height: 300px;
    position: static;
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const SidebarTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: #e2e8f0;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  margin-bottom: 1rem;
`;

const SearchInput = styled.input`
  background: transparent;
  border: none;
  color: #e2e8f0;
  font-size: 0.9rem;
  width: 100%;
  outline: none;

  &::placeholder {
    color: #475569;
  }
`;

const RecipesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  padding-right: 0.5rem;

  /* Scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }
`;

const EmptyRecipes = styled.div`
    color: #94a3b8;
    text-align: center;
    padding: 2rem 0;
    font-size: 0.9rem;
`;

const RecipeCard = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 0.75rem;
  border-radius: 12px;
  cursor: grab;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(30, 41, 59, 0.8);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    border-color: rgba(16, 185, 129, 0.3);
  }

  &:active {
    cursor: grabbing;
  }
`;

const DragHandle = styled.div`
  color: #64748b;
  display: flex;
  align-items: center;
`;

const RecipeInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const RecipeName = styled.span`
  font-weight: 500;
  color: #f1f5f9;
  font-size: 0.95rem;
`;

const RecipeCategory = styled.span`
  font-size: 0.75rem;
  color: #94a3b8;
  text-transform: capitalize;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  width: fit-content;
`;

const PlannerContainer = styled.div`
  overflow-x: auto;
  background: rgba(30, 41, 59, 0.3);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
`;

const PlannerGrid = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 800px; /* Ensure horizontal scrolling on small screens */
`;

const GridHeader = styled.div`
  display: grid;
  grid-template-columns: 100px repeat(7, 1fr);
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const TimeColumn = styled.div``;

const DayHeader = styled.div`
  text-align: center;
  font-weight: 600;
  color: #e2e8f0;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
`;

const GridBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const GridRow = styled.div`
  display: grid;
  grid-template-columns: 100px repeat(7, 1fr);
  gap: 0.5rem;
`;

const MealHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  text-align: center;
  font-weight: 500;
  color: #94a3b8;
  font-size: 0.9rem;
`;

const MealCell = styled.div`
  background: ${props => props.$hasRecipe ? 'rgba(16, 185, 129, 0.1)' : 'rgba(15, 23, 42, 0.4)'};
  border: 1px dashed ${props => props.$hasRecipe ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 8px;
  min-height: 80px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$hasRecipe ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)'};
    border-color: ${props => props.$hasRecipe ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.3)'};
  }
`;

const EmptyCellText = styled.span`
  color: #475569;
  font-size: 0.8rem;
  pointer-events: none; /* Let drops fall to the cell */
  margin-top: auto;
  margin-bottom: auto;
`;

const AddCustomButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;

  &:hover {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
    border-color: rgba(16, 185, 129, 0.5);
    transform: scale(1.1);
  }
`;

const RecipesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  width: 100%;
`;

const AssignedRecipe = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  width: 100%;
  
  &:hover button {
    opacity: 1;
  }
`;

const AssignedName = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: #10b981;
  line-height: 1.2;
  text-align: left;
  flex: 1;
  word-break: break-word;
`;

const RemoveButton = styled.button`
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: none;
  border-radius: 4px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-left: 0.25rem;

  &:hover {
    background: #ef4444;
    color: white;
  }
`;

// --- Modal Styles ---

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContent = styled.div`
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.02);
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #f8fafc;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f8fafc;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ModalLabel = styled.label`
  font-size: 0.85rem;
  color: #94a3b8;
  font-weight: 500;
`;

const ModalInput = styled.input`
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #f8fafc;
  font-size: 1rem;
  outline: none;
  transition: all 0.2s;

  &:focus {
    border-color: #10b981;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
  }

  &::placeholder {
    color: #475569;
  }
`;

const ModalFooter = styled.div`
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`;

const CancelButton = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const SaveButton = styled.button`
  background: #10b981;
  border: none;
  color: #0f172a;
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #059669;
  }
`;

// --- Notes Styles ---

const NotesSection = styled.div`
  margin-top: 2rem;
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const NotesHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const NotesTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #e2e8f0;
`;

const NotesArea = styled.textarea`
  width: 100%;
  min-height: 150px;
  background: transparent;
  border: none;
  color: #f8fafc;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 0.95rem;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  white-space: pre-wrap;

  &::placeholder {
    color: #475569;
    font-style: italic;
  }

  /* Scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }
`;

export default MealPlannerPage;
