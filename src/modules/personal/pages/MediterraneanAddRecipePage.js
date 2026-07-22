// modules/personal/pages/MediterraneanAddRecipePage.js — Formulario agregar/editar receta
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { ArrowLeft, Plus, Trash2, ChefHat, Save } from 'lucide-react';
import { useMediterranean } from '../../../context/MediterraneanContext';
import personalApiService from '../services/personalApiService';
import HealthBadges, { HEALTH_OPTIONS } from '../components/mediterranean/HealthBadges';

const ALL_TAGS = [
  'Pollo', 'Carne', 'Pescado', 'Mariscos', 'Vegetariano', 'Vegano', 'Huevos',
  'Pasta', 'Arroz', 'Legumbres', 'Ensaladas', 'Sopas', 'Sandwiches',
  'Horno', 'Sartén', 'Parrilla', 'Air Fryer', 'Meal Prep',
  'Económico', 'Alto en proteínas', 'Bajo en carbohidratos', 'Sin gluten', 'Sin lactosa'
];

const EMPTY_FORM = {
  name: '', origin_country: '', category: 'almuerzo',
  prep_time: '', cook_time: '', difficulty: 3, cost: '$$', servings: 2,
  calories: '', protein: '', carbs: '', fat: '', fiber: '',
  ingredients: [{ qty: '', unit: '', name: '', optional: false }],
  steps: [''],
  tips: { errors: '', flavor: '', variants: '', storage: '' },
  health_tags: [],
  frequency: 'semanal',
  tags: [],
  learning: { technique: '', cuts: '', tools: '', substitutes: '' },
  image_url: '',
};

const MediterraneanAddRecipePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { createRecipe, updateRecipe } = useMediterranean();

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Load recipe data if editing
  useEffect(() => {
    if (!editId) return;
    personalApiService.getMedRecipe(editId).then(res => {
      const r = res.recipe;
      const parse = (val) => typeof val === 'string' ? JSON.parse(val) : (val || null);
      setForm({
        name: r.name || '',
        origin_country: r.origin_country || '',
        category: r.category || 'almuerzo',
        prep_time: r.prep_time || '',
        cook_time: r.cook_time || '',
        difficulty: r.difficulty || 3,
        cost: r.cost || '$$',
        servings: r.servings || 2,
        calories: r.calories || '',
        protein: r.protein || '',
        carbs: r.carbs || '',
        fat: r.fat || '',
        fiber: r.fiber || '',
        ingredients: parse(r.ingredients) || [{ qty: '', unit: '', name: '', optional: false }],
        steps: parse(r.steps) || [''],
        tips: parse(r.tips) || { errors: '', flavor: '', variants: '', storage: '' },
        health_tags: parse(r.health_tags) || [],
        frequency: r.frequency || 'semanal',
        tags: parse(r.tags) || [],
        learning: parse(r.learning) || { technique: '', cuts: '', tools: '', substitutes: '' },
        image_url: r.image_url || '',
      });
      setLoading(false);
    }).catch(() => navigate('/personal/mediterranean/recipes'));
  }, [editId, navigate]);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));
  const setTip = (key, val) => setForm(p => ({ ...p, tips: { ...p.tips, [key]: val } }));
  const setLearn = (key, val) => setForm(p => ({ ...p, learning: { ...p.learning, [key]: val } }));

  // Ingredients
  const addIngredient = () => setForm(p => ({ ...p, ingredients: [...p.ingredients, { qty: '', unit: '', name: '', optional: false }] }));
  const setIngredient = (i, key, val) => setForm(p => ({ ...p, ingredients: p.ingredients.map((ing, idx) => idx === i ? { ...ing, [key]: val } : ing) }));
  const removeIngredient = (i) => setForm(p => ({ ...p, ingredients: p.ingredients.filter((_, idx) => idx !== i) }));

  // Steps
  const addStep = () => setForm(p => ({ ...p, steps: [...p.steps, ''] }));
  const setStep = (i, val) => setForm(p => ({ ...p, steps: p.steps.map((s, idx) => idx === i ? val : s) }));
  const removeStep = (i) => setForm(p => ({ ...p, steps: p.steps.filter((_, idx) => idx !== i) }));

  // Tags
  const toggleTag = (tag) => setForm(p => ({
    ...p,
    tags: p.tags.includes(tag) ? p.tags.filter(t => t !== tag) : [...p.tags, tag]
  }));

  // Health tags
  const toggleHealthTag = (key) => setForm(p => ({
    ...p,
    health_tags: p.health_tags.includes(key) ? p.health_tags.filter(t => t !== key) : [...p.health_tags, key]
  }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'El nombre es obligatorio';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        prep_time: form.prep_time ? parseInt(form.prep_time) : null,
        cook_time: form.cook_time ? parseInt(form.cook_time) : null,
        difficulty: parseInt(form.difficulty),
        servings: parseInt(form.servings),
        calories: form.calories ? parseInt(form.calories) : null,
        protein: form.protein ? parseFloat(form.protein) : null,
        carbs: form.carbs ? parseFloat(form.carbs) : null,
        fat: form.fat ? parseFloat(form.fat) : null,
        fiber: form.fiber ? parseFloat(form.fiber) : null,
        ingredients: form.ingredients.filter(i => i.name.trim()),
        steps: form.steps.filter(s => s.trim()),
      };

      if (editId) {
        await updateRecipe(parseInt(editId), payload);
        navigate(`/personal/mediterranean/recipes/${editId}`);
      } else {
        const newRecipe = await createRecipe(payload);
        navigate(`/personal/mediterranean/recipes/${newRecipe.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <LoadingScreen><ChefHat size={40} /><LoadingText>Cargando receta...</LoadingText></LoadingScreen>
  );

  return (
    <Container>
      <NavBar>
        <BackBtn onClick={() => navigate(editId ? `/personal/mediterranean/recipes/${editId}` : '/personal/mediterranean/recipes')}>
          <ArrowLeft size={18} /> {editId ? 'Volver a la receta' : 'Recetario'}
        </BackBtn>
        <PageTitle>{editId ? '✏️ Editar receta' : '🍽 Nueva receta'}</PageTitle>
      </NavBar>

      <FormGrid>
        {/* LEFT: Info básica + Nutrición */}
        <FormCol>
          <FormCard>
            <CardTitle>📝 Información básica</CardTitle>
            <FormRow>
              <FormGroup $full>
                <Label>Nombre de la receta *</Label>
                <Input
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="ej: Ensalada Griega"
                  $error={!!errors.name}
                />
                {errors.name && <ErrorMsg>{errors.name}</ErrorMsg>}
              </FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup>
                <Label>País de origen</Label>
                <Input value={form.origin_country} onChange={e => set('origin_country', e.target.value)} placeholder="Grecia" />
              </FormGroup>
              <FormGroup>
                <Label>Categoría</Label>
                <Select value={form.category} onChange={e => set('category', e.target.value)}>
                  <option value="desayuno">Desayuno</option>
                  <option value="almuerzo">Almuerzo</option>
                  <option value="cena">Cena</option>
                  <option value="snack">Snack</option>
                  <option value="postre">Postre</option>
                </Select>
              </FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup>
                <Label>Prep. (min)</Label>
                <Input type="number" value={form.prep_time} onChange={e => set('prep_time', e.target.value)} placeholder="10" />
              </FormGroup>
              <FormGroup>
                <Label>Cocción (min)</Label>
                <Input type="number" value={form.cook_time} onChange={e => set('cook_time', e.target.value)} placeholder="15" />
              </FormGroup>
              <FormGroup>
                <Label>Porciones</Label>
                <Input type="number" value={form.servings} onChange={e => set('servings', e.target.value)} placeholder="2" />
              </FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup>
                <Label>Dificultad</Label>
                <Select value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
                  <option value={1}>1 — Fácil</option>
                  <option value={2}>2 — Fácil+</option>
                  <option value={3}>3 — Medio</option>
                  <option value={4}>4 — Difícil</option>
                  <option value={5}>5 — Experto</option>
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>Costo</Label>
                <Select value={form.cost} onChange={e => set('cost', e.target.value)}>
                  <option value="$">$ — Económico</option>
                  <option value="$$">$$ — Moderado</option>
                  <option value="$$$">$$$ — Costoso</option>
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>Frecuencia</Label>
                <Select value={form.frequency} onChange={e => set('frequency', e.target.value)}>
                  <option value="diaria">Diaria</option>
                  <option value="varias_semana">Varias x sem</option>
                  <option value="semanal">Semanal</option>
                  <option value="ocasional">Ocasional</option>
                </Select>
              </FormGroup>
            </FormRow>
            <FormGroup $full>
              <Label>URL de imagen (opcional)</Label>
              <Input value={form.image_url} onChange={e => set('image_url', e.target.value)} placeholder="https://..." />
            </FormGroup>
          </FormCard>

          <FormCard>
            <CardTitle>📊 Nutrición (por porción)</CardTitle>
            <FormRow>
              <FormGroup>
                <Label>Calorías (kcal)</Label>
                <Input type="number" value={form.calories} onChange={e => set('calories', e.target.value)} placeholder="350" />
              </FormGroup>
              <FormGroup>
                <Label>Proteínas (g)</Label>
                <Input type="number" value={form.protein} onChange={e => set('protein', e.target.value)} placeholder="25" />
              </FormGroup>
              <FormGroup>
                <Label>Carbos (g)</Label>
                <Input type="number" value={form.carbs} onChange={e => set('carbs', e.target.value)} placeholder="30" />
              </FormGroup>
              <FormGroup>
                <Label>Grasas (g)</Label>
                <Input type="number" value={form.fat} onChange={e => set('fat', e.target.value)} placeholder="15" />
              </FormGroup>
              <FormGroup>
                <Label>Fibra (g)</Label>
                <Input type="number" value={form.fiber} onChange={e => set('fiber', e.target.value)} placeholder="5" />
              </FormGroup>
            </FormRow>
          </FormCard>

          <FormCard>
            <CardTitle>💡 Consejos</CardTitle>
            {[['errors', '⚠️ Errores comunes'], ['flavor', '✨ Cómo mejorar el sabor'], ['variants', '🔄 Variantes'], ['storage', '🧊 Cómo conservarla']].map(([key, label]) => (
              <FormGroup key={key} $full>
                <Label>{label}</Label>
                <TextArea value={form.tips[key]} onChange={e => setTip(key, e.target.value)} rows={2} placeholder="Escribe aquí..." />
              </FormGroup>
            ))}
          </FormCard>

          <FormCard>
            <CardTitle>🎓 Aprendizaje</CardTitle>
            {[['technique', 'Técnica culinaria'], ['cuts', 'Cómo cortar ingredientes'], ['tools', 'Qué utensilios usar'], ['substitutes', 'Sustituciones posibles']].map(([key, label]) => (
              <FormGroup key={key} $full>
                <Label>{label}</Label>
                <TextArea value={form.learning[key]} onChange={e => setLearn(key, e.target.value)} rows={2} placeholder="Escribe aquí..." />
              </FormGroup>
            ))}
          </FormCard>
        </FormCol>

        {/* RIGHT: Ingredients, Steps, Tags, Health */}
        <FormCol>
          <FormCard>
            <CardTitle>🛒 Ingredientes</CardTitle>
            {form.ingredients.map((ing, i) => (
              <IngredientRow key={i}>
                <SmallInput value={ing.qty} onChange={e => setIngredient(i, 'qty', e.target.value)} placeholder="Cant." />
                <SmallInput value={ing.unit} onChange={e => setIngredient(i, 'unit', e.target.value)} placeholder="Unidad" />
                <FlexInput value={ing.name} onChange={e => setIngredient(i, 'name', e.target.value)} placeholder="Nombre del ingrediente" />
                <OptCheck title="Opcional">
                  <input type="checkbox" checked={ing.optional} onChange={e => setIngredient(i, 'optional', e.target.checked)} />
                  <span>Opt.</span>
                </OptCheck>
                {form.ingredients.length > 1 && (
                  <RemoveBtn onClick={() => removeIngredient(i)}><Trash2 size={14} /></RemoveBtn>
                )}
              </IngredientRow>
            ))}
            <AddRowBtn onClick={addIngredient}><Plus size={14} /> Agregar ingrediente</AddRowBtn>
          </FormCard>

          <FormCard>
            <CardTitle>📋 Preparación paso a paso</CardTitle>
            {form.steps.map((step, i) => (
              <StepRow key={i}>
                <StepNum>{i + 1}</StepNum>
                <FlexTextArea
                  value={step}
                  onChange={e => setStep(i, e.target.value)}
                  placeholder={`Paso ${i + 1}...`}
                  rows={2}
                />
                {form.steps.length > 1 && (
                  <RemoveBtn onClick={() => removeStep(i)}><Trash2 size={14} /></RemoveBtn>
                )}
              </StepRow>
            ))}
            <AddRowBtn onClick={addStep}><Plus size={14} /> Agregar paso</AddRowBtn>
          </FormCard>

          <FormCard>
            <CardTitle>❤️ Beneficios para la salud</CardTitle>
            <HealthBadges
              selectable
              selected={form.health_tags}
              onToggle={toggleHealthTag}
            />
          </FormCard>

          <FormCard>
            <CardTitle>🏷️ Tags</CardTitle>
            <TagsGrid>
              {ALL_TAGS.map(tag => (
                <TagChip key={tag} $active={form.tags.includes(tag)} onClick={() => toggleTag(tag)}>
                  {tag}
                </TagChip>
              ))}
            </TagsGrid>
          </FormCard>
        </FormCol>
      </FormGrid>

      <SubmitRow>
        <CancelBtn onClick={() => navigate(editId ? `/personal/mediterranean/recipes/${editId}` : '/personal/mediterranean/recipes')}>
          Cancelar
        </CancelBtn>
        <SubmitBtn onClick={handleSubmit} disabled={saving}>
          <Save size={16} />
          {saving ? 'Guardando...' : editId ? 'Actualizar receta' : 'Guardar receta'}
        </SubmitBtn>
      </SubmitRow>
    </Container>
  );
};

// ─── Animations ───────────────────────────────────────────────────────────────
const fadeUp = keyframes`from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); }`;

// ─── Styled Components ────────────────────────────────────────────────────────

const LoadingScreen = styled.div`
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 60vh; gap: 1rem; color: #8FAF35;
`;
const LoadingText = styled.div`color: #64748b; font-size: 0.95rem;`;

const Container = styled.div`color: #e2e8f0; padding: 2rem; animation: ${fadeUp} 0.4s ease-out; max-width: 1200px; margin: 0 auto; @media (max-width: 768px) { padding: 1.25rem 1rem; }`;

const NavBar = styled.div`display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;`;
const BackBtn = styled.button`
  display: flex; align-items: center; gap: 0.4rem; background: transparent;
  border: none; color: #94a3b8; font-size: 0.88rem; cursor: pointer;
  &:hover { color: white; }
`;
const PageTitle = styled.h1`
  font-family: 'Unbounded', sans-serif; font-size: 1.25rem;
  font-weight: 700; color: white; margin: 0;
`;

const FormGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.5rem;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;
const FormCol = styled.div`display: flex; flex-direction: column; gap: 1.25rem;`;
const FormCard = styled.div`
  background: #0f172a; border: 1px solid rgba(255,255,255,0.05);
  border-radius: 16px; padding: 1.25rem;
  display: flex; flex-direction: column; gap: 0.75rem;
`;
const CardTitle = styled.div`
  font-weight: 700; font-size: 0.95rem; color: white;
  padding-bottom: 0.6rem; border-bottom: 1px solid rgba(255,255,255,0.06);
  margin-bottom: 0.25rem;
`;
const FormRow = styled.div`display: flex; gap: 0.65rem; flex-wrap: wrap;`;
const FormGroup = styled.div`
  display: flex; flex-direction: column; gap: 0.3rem;
  flex: ${p => p.$full ? '1 1 100%' : '1 1 120px'}; min-width: 0;
`;
const Label = styled.label`font-size: 0.78rem; color: #94a3b8; font-weight: 600;`;
const baseInput = `
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 9px; color: #e2e8f0;
  padding: 0.55rem 0.75rem; font-size: 0.88rem;
  outline: none; font-family: inherit; width: 100%; box-sizing: border-box;
  transition: border-color 0.2s;
  &::placeholder { color: #475569; }
  &:focus { border-color: rgba(107,142,35,0.4); }
`;
const Input = styled.input`${baseInput} border-color: ${p => p.$error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'};`;
const Select = styled.select`${baseInput} cursor: pointer; option { background: #0f172a; }`;
const TextArea = styled.textarea`${baseInput} resize: vertical;`;
const ErrorMsg = styled.div`font-size: 0.75rem; color: #ef4444;`;

const IngredientRow = styled.div`display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;`;
const SmallInput = styled.input`
  ${baseInput} width: 70px; flex-shrink: 0; min-width: 0;
`;
const FlexInput = styled.input`${baseInput} flex: 1; min-width: 0;`;
const FlexTextArea = styled.textarea`${baseInput} flex: 1; min-width: 0; resize: vertical;`;
const OptCheck = styled.label`
  display: flex; align-items: center; gap: 0.25rem;
  font-size: 0.72rem; color: #64748b; cursor: pointer;
  flex-shrink: 0; white-space: nowrap;
`;
const RemoveBtn = styled.button`
  background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
  color: #ef4444; width: 28px; height: 28px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0;
  &:hover { background: rgba(239,68,68,0.2); }
`;
const AddRowBtn = styled.button`
  display: flex; align-items: center; gap: 0.35rem;
  background: transparent; border: 1px dashed rgba(107,142,35,0.25);
  color: #8FAF35; border-radius: 9px; padding: 0.5rem 0.85rem;
  font-size: 0.82rem; cursor: pointer; transition: all 0.2s;
  &:hover { background: rgba(107,142,35,0.08); border-color: rgba(107,142,35,0.4); }
`;
const IngRow = styled.div`
  display: flex; gap: 0.75rem; margin-bottom: 0.75rem; align-items: flex-start; flex-wrap: wrap;
  & > * { min-width: 100px; }
`;
const StepRow = styled.div`display: flex; gap: 0.6rem; align-items: flex-start;`;
const StepNum = styled.div`
  width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
  background: rgba(107,142,35,0.15); color: #8FAF35;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.78rem; font-weight: 700; margin-top: 4px;
`;

const TagsGrid = styled.div`display: flex; flex-wrap: wrap; gap: 0.4rem;`;
const TagChip = styled.button`
  padding: 0.3rem 0.65rem; border-radius: 20px; font-size: 0.78rem;
  font-weight: 500; cursor: pointer; transition: all 0.15s;
  background: ${p => p.$active ? 'rgba(107,142,35,0.15)' : 'rgba(255,255,255,0.04)'};
  color: ${p => p.$active ? '#8FAF35' : '#94a3b8'};
  border: 1px solid ${p => p.$active ? 'rgba(107,142,35,0.35)' : 'rgba(255,255,255,0.07)'};
  &:hover { border-color: rgba(107,142,35,0.3); color: #8FAF35; }
`;

const SubmitRow = styled.div`display: flex; justify-content: flex-end; gap: 0.75rem;`;
const CancelBtn = styled.button`
  background: transparent; border: 1px solid rgba(255,255,255,0.08); color: #94a3b8;
  padding: 0.75rem 1.5rem; border-radius: 12px; font-size: 0.9rem; cursor: pointer;
  &:hover { color: white; }
`;
const SubmitBtn = styled.button`
  display: flex; align-items: center; gap: 0.5rem;
  background: linear-gradient(135deg, #6B8E23, #8FAF35); color: white;
  border: none; border-radius: 12px; padding: 0.75rem 2rem;
  font-size: 0.92rem; font-weight: 700; cursor: pointer; transition: opacity 0.2s;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
  &:not(:disabled):hover { opacity: 0.9; }
`;

export default MediterraneanAddRecipePage;
