// context/MediterraneanContext.js — Estado global del Recetario Mediterráneo
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import personalApiService from '../modules/personal/services/personalApiService';
import { getUTC3DateString } from '../utils/helpers';

const MediterraneanContext = createContext();

export const useMediterranean = () => useContext(MediterraneanContext);

// ─── Recetas de ejemplo ────────────────────────────────────────────────────────
const EXAMPLE_RECIPES = [
  {
    name: 'Ensalada Griega',
    origin_country: 'Grecia',
    category: 'almuerzo',
    prep_time: 10,
    cook_time: 0,
    difficulty: 1,
    cost: '$',
    servings: 2,
    calories: 280,
    protein: 8,
    carbs: 12,
    fat: 22,
    fiber: 3,
    ingredients: [
      { qty: '3', unit: 'und', name: 'Tomates grandes', optional: false },
      { qty: '1', unit: 'und', name: 'Pepino', optional: false },
      { qty: '1', unit: 'und', name: 'Cebolla morada pequeña', optional: false },
      { qty: '150', unit: 'g', name: 'Queso feta', optional: false },
      { qty: '100', unit: 'g', name: 'Aceitunas Kalamata', optional: false },
      { qty: '1', unit: 'und', name: 'Pimiento verde', optional: true },
      { qty: '3', unit: 'cdas', name: 'Aceite de oliva extra virgen', optional: false },
      { qty: '1', unit: 'cda', name: 'Orégano seco', optional: false },
      { qty: 'c/n', unit: '', name: 'Sal y pimienta negra', optional: false },
    ],
    steps: [
      'Cortar los tomates en trozos grandes y el pepino en rodajas gruesas.',
      'Cortar la cebolla morada en juliana fina y el pimiento en tiras.',
      'Colocar todas las verduras en un bowl amplio.',
      'Agregar las aceitunas Kalamata enteras.',
      'Incorporar el queso feta en bloque o en trozos grandes sobre la ensalada.',
      'Rociar con aceite de oliva extra virgen generosamente.',
      'Espolvorear orégano, sal y pimienta negra al gusto.',
      'No revolver en exceso — dejar el feta en bloques es lo auténtico.',
    ],
    tips: {
      errors: 'No cortes el queso feta en trozos pequeños; el bloque entero es lo tradicional y queda mejor. Evitá usar aceitunas verdes — las Kalamata son esenciales.',
      flavor: 'El truco está en un buen aceite de oliva y dejar reposar 5 minutos antes de servir. Añadí un chorrito de limón para más frescura.',
      variants: 'Podés agregar anchoas para más umami, o pan pita tostado al costado. Versión vegana: reemplazá el feta por tofu marinado.',
      storage: 'Guardar máximo 1 día en la heladera. No mezclar el aceite hasta servir si la preparás con anticipación.',
    },
    health_tags: ['cardiovascular', 'grasas_saludables', 'fibra', 'bajo_ultraprocesados'],
    frequency: 'varias_semana',
    tags: ['Vegetariano', 'Ensalada', 'Sin gluten', 'Económico', 'Bajo en carbohidratos'],
    learning: {
      technique: 'Ensalada cruda sin cocción — clave cortar en trozos grandes para preservar textura',
      cuts: 'Tomates en gajos, pepino en rodajas de 1cm, cebolla en juliana fina',
      tools: 'Bowl amplio, cuchillo de chef, tabla de cortar',
      substitutes: 'Feta → tofu marinado (vegano) | Kalamata → aceitunas negras regulares',
    },
  },
  {
    name: 'Hummus Casero',
    origin_country: 'Líbano',
    category: 'snack',
    prep_time: 15,
    cook_time: 0,
    difficulty: 2,
    cost: '$',
    servings: 4,
    calories: 180,
    protein: 7,
    carbs: 20,
    fat: 9,
    fiber: 5,
    ingredients: [
      { qty: '400', unit: 'g', name: 'Garbanzos cocidos (lata)', optional: false },
      { qty: '3', unit: 'cdas', name: 'Tahini (pasta de sésamo)', optional: false },
      { qty: '2', unit: 'und', name: 'Dientes de ajo', optional: false },
      { qty: '1', unit: 'und', name: 'Limón (jugo)', optional: false },
      { qty: '3', unit: 'cdas', name: 'Aceite de oliva', optional: false },
      { qty: '4', unit: 'cdas', name: 'Agua fría', optional: false },
      { qty: '1/2', unit: 'cdita', name: 'Comino molido', optional: false },
      { qty: 'c/n', unit: '', name: 'Sal', optional: false },
      { qty: '1', unit: 'cdita', name: 'Pimentón ahumado (para decorar)', optional: true },
    ],
    steps: [
      'Escurrir los garbanzos y guardar el líquido de la lata (aquafaba).',
      'Pelar los ajos. Para un sabor más suave, pasarlos 30 segundos por agua hirviendo.',
      'Procesar el tahini con el jugo de limón por 1 minuto hasta que aclare.',
      'Agregar el ajo y el comino, procesar 30 segundos.',
      'Incorporar los garbanzos de a poco mientras se procesa.',
      'Agregar el agua fría de a cucharadas hasta lograr la textura cremosa deseada.',
      'Probar y ajustar sal y limón.',
      'Servir en un plato hondo, hacer un hoyo en el centro, verter aceite de oliva y espolvorear pimentón.',
    ],
    tips: {
      errors: 'El error más común es no procesar lo suficiente. El hummus necesita al menos 3-4 minutos de procesado para quedar realmente cremoso.',
      flavor: 'El tahini de buena calidad hace toda la diferencia. Usá agua bien fría para que quede más esponjoso. Un toque de comino es clave.',
      variants: 'Hummus de remolacha (agregar 1 remolacha cocida), hummus picante (pimiento asado y cayena), hummus de aguacate.',
      storage: 'Se conserva 5 días en heladera en recipiente hermético. Cubrir con film en contacto para evitar que oxide.',
    },
    health_tags: ['cardiovascular', 'cerebral', 'proteinas', 'fibra', 'grasas_saludables', 'bajo_ultraprocesados'],
    frequency: 'varias_semana',
    tags: ['Vegetariano', 'Vegano', 'Legumbres', 'Sin gluten', 'Sin lactosa', 'Económico', 'Meal Prep'],
    learning: {
      technique: 'Emulsificación en procesadora — la grasa del tahini + ácido del limón crean una emulsión suave',
      cuts: 'No aplica — todo va procesado',
      tools: 'Procesadora de alimentos (no licuadora — el resultado es diferente)',
      substitutes: 'Tahini → pasta de maní sin sal | Garbanzos lata → cocidos en casa (mejor sabor)',
    },
  },
  {
    name: 'Salmón al Horno con Hierbas',
    origin_country: 'España',
    category: 'cena',
    prep_time: 10,
    cook_time: 15,
    difficulty: 2,
    cost: '$$$',
    servings: 2,
    calories: 420,
    protein: 42,
    carbs: 2,
    fat: 26,
    fiber: 0.5,
    ingredients: [
      { qty: '2', unit: 'filetes', name: 'Salmón (200g c/u)', optional: false },
      { qty: '3', unit: 'cdas', name: 'Aceite de oliva', optional: false },
      { qty: '3', unit: 'dientes', name: 'Ajo picado', optional: false },
      { qty: '1', unit: 'und', name: 'Limón (jugo y ralladura)', optional: false },
      { qty: '2', unit: 'cdas', name: 'Eneldo fresco (o seco)', optional: false },
      { qty: '1', unit: 'cda', name: 'Perejil fresco picado', optional: false },
      { qty: 'c/n', unit: '', name: 'Sal y pimienta negra', optional: false },
      { qty: '1', unit: 'cda', name: 'Alcaparras', optional: true },
    ],
    steps: [
      'Precalentar el horno a 200°C.',
      'En un bol, mezclar aceite de oliva, ajo picado, jugo de limón, ralladura y hierbas.',
      'Secar bien los filetes de salmón con papel de cocina.',
      'Colocar el salmón en una fuente para horno con papel manteca.',
      'Untar generosamente la mezcla de hierbas sobre los filetes.',
      'Hornear 12-15 minutos según el grosor.',
      'Agregar las alcaparras los últimos 2 minutos si se usan.',
      'Servir inmediatamente con rodajas de limón y una ensalada verde.',
    ],
    tips: {
      errors: 'No sobrecocinar el salmón — queda seco y pierde nutrientes. Mejor que quede levemente rosado en el centro.',
      flavor: 'Marinar 30 minutos en heladera antes de hornear intensifica mucho el sabor. El eneldo fresco es superior al seco.',
      variants: 'En sartén: 4 min cada lado a fuego medio-alto. En papel aluminio: cocción más húmeda, +5 minutos.',
      storage: 'Consumir el mismo día o máximo al día siguiente refrigerado. No congelar una vez cocinado.',
    },
    health_tags: ['cardiovascular', 'cerebral', 'proteinas', 'omega3', 'grasas_saludables', 'entrenamiento'],
    frequency: 'varias_semana',
    tags: ['Pescado', 'Horno', 'Alto en proteínas', 'Sin gluten', 'Sin lactosa', 'Bajo en carbohidratos'],
    learning: {
      technique: 'Horneado seco con marinada — el aceite forma una costra aromática que sella los jugos',
      cuts: 'No aplica para el pescado; asegurar que los filetes tengan grosor uniforme',
      tools: 'Fuente para horno, papel manteca, brocha de cocina para aplicar la marinada',
      substitutes: 'Salmón → trucha, merluza o atún fresco | Eneldo → estragón o albahaca',
    },
  },
  {
    name: 'Shakshuka',
    origin_country: 'Israel / Túnez',
    category: 'desayuno',
    prep_time: 10,
    cook_time: 20,
    difficulty: 3,
    cost: '$',
    servings: 2,
    calories: 320,
    protein: 18,
    carbs: 22,
    fat: 18,
    fiber: 5,
    ingredients: [
      { qty: '4', unit: 'und', name: 'Huevos', optional: false },
      { qty: '400', unit: 'g', name: 'Tomates pelados (lata)', optional: false },
      { qty: '2', unit: 'und', name: 'Pimientos rojos', optional: false },
      { qty: '1', unit: 'und', name: 'Cebolla', optional: false },
      { qty: '3', unit: 'dientes', name: 'Ajo', optional: false },
      { qty: '2', unit: 'cdas', name: 'Aceite de oliva', optional: false },
      { qty: '1', unit: 'cdita', name: 'Comino molido', optional: false },
      { qty: '1', unit: 'cdita', name: 'Pimentón dulce', optional: false },
      { qty: '1/2', unit: 'cdita', name: 'Cayena o ají molido', optional: true },
      { qty: '1', unit: 'puñado', name: 'Perejil o cilantro fresco', optional: false },
    ],
    steps: [
      'Calentar el aceite de oliva en una sartén profunda a fuego medio.',
      'Sofreír la cebolla en juliana hasta que esté transparente (5 min).',
      'Agregar el ajo picado, los pimientos en tiras y cocinar 3 minutos más.',
      'Incorporar el comino, pimentón y cayena. Cocinar 1 minuto para tostar las especias.',
      'Agregar los tomates y su líquido. Romperlos con cuchara. Reducir a fuego medio-bajo.',
      'Cocinar la salsa 10 minutos hasta que espese. Salpimentar.',
      'Hacer 4 hoyos en la salsa con una cuchara.',
      'Romper un huevo en cada hoyo. Tapar la sartén.',
      'Cocinar 5-7 minutos (claras cuajadas, yemas aún líquidas).',
      'Servir con perejil picado y pan pita.',
    ],
    tips: {
      errors: 'No revolver los huevos después de agregarlos. No subir el fuego: la salsa se quema y los huevos quedan gomosos.',
      flavor: 'Tostar las especias en seco antes de agregar los tomates potencia mucho el sabor.',
      variants: 'Verde (shakshuka de espinaca y jalapeño), con garbanzos para más proteína, con chorizo picante.',
      storage: 'La salsa se conserva 3 días en heladera (sin los huevos). Agregar los huevos frescos al recalentar.',
    },
    health_tags: ['cardiovascular', 'proteinas', 'fibra', 'bajo_ultraprocesados'],
    frequency: 'semanal',
    tags: ['Huevos', 'Vegetariano', 'Sartén', 'Económico', 'Sin gluten', 'Sin lactosa'],
    learning: {
      technique: 'Pochado en salsa — los huevos se cocinan con el vapor atrapado por la tapa',
      cuts: 'Cebolla en juliana fina para cocción pareja, pimientos en tiras medianas',
      tools: 'Sartén profunda con tapa (o cazuela de hierro fundido para mejor resultado)',
      substitutes: 'Tomates lata → tomates frescos maduros picados | Huevos → tofu firme para versión vegana',
    },
  },
  {
    name: 'Pasta al Pesto Genovés',
    origin_country: 'Italia',
    category: 'almuerzo',
    prep_time: 10,
    cook_time: 10,
    difficulty: 2,
    cost: '$$',
    servings: 2,
    calories: 520,
    protein: 16,
    carbs: 65,
    fat: 24,
    fiber: 4,
    ingredients: [
      { qty: '200', unit: 'g', name: 'Pasta (linguine o spaghetti)', optional: false },
      { qty: '60', unit: 'g', name: 'Albahaca fresca (2 manojos)', optional: false },
      { qty: '30', unit: 'g', name: 'Piñones (o nueces)', optional: false },
      { qty: '2', unit: 'dientes', name: 'Ajo', optional: false },
      { qty: '50', unit: 'g', name: 'Parmesano rallado', optional: false },
      { qty: '80', unit: 'ml', name: 'Aceite de oliva extra virgen', optional: false },
      { qty: '1', unit: 'taza', name: 'Agua de cocción de la pasta', optional: false },
    ],
    steps: [
      'Cocinar la pasta en abundante agua con sal hasta al dente.',
      'Antes de escurrir, reservar 1 taza del agua de cocción.',
      'Para el pesto: procesar en mortero o procesadora: ajo, piñones y una pizca de sal.',
      'Agregar la albahaca de a poco y procesar.',
      'Incorporar el parmesano rallado.',
      'Agregar el aceite de oliva en hilo fino mientras se procesa.',
      'En un bowl grande, mezclar la pasta escurrida con el pesto.',
      'Agregar agua de cocción de a cucharadas para ligar la salsa.',
      'Servir inmediatamente con más parmesano y hojas de albahaca.',
    ],
    tips: {
      errors: 'Nunca calentar el pesto — pierde el color verde brillante y el sabor fresco.',
      flavor: 'El mortero da mejor textura y sabor que la procesadora. Los piñones tostados previamente 2 min en sartén seca potencian el sabor.',
      variants: 'Pesto rojo (tomates secos + piñones), pesto de rúcula, pesto de espinaca y nueces.',
      storage: 'El pesto se conserva 1 semana en heladera con una capa de aceite encima.',
    },
    health_tags: ['cerebral', 'grasas_saludables', 'entrenamiento'],
    frequency: 'semanal',
    tags: ['Vegetariano', 'Pasta', 'Sartén', 'Económico'],
    learning: {
      technique: 'Emulsificación con agua de cocción — el almidón crea una emulsión que liga el aceite del pesto',
      cuts: 'Albahaca no se corta con cuchillo (oxida) — se desoja a mano',
      tools: 'Mortero y maja (tradicional) o mini procesadora | Olla grande para pasta',
      substitutes: 'Piñones → nueces o almendras | Parmesano → pecorino | Pasta regular → pasta sin gluten',
    },
  },
];

// ─── Provider ──────────────────────────────────────────────────────────────────

export const MediterraneanProvider = ({ children }) => {
  const [recipes, setRecipes] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [weeklyGoals, setWeeklyGoals] = useState(null);
  const [stats, setStats] = useState({ total: 0, favorites: 0, this_month: 0, total_cooked: 0, categories: [], top_recipes: [], avg_time: 0 });
  const [loading, setLoading] = useState(true);
  const [seeded, setSeeded] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [recipesData, shoppingData, goalsData, statsData] = await Promise.all([
        personalApiService.getMedRecipes(),
        personalApiService.getMedShopping(),
        personalApiService.getMedWeeklyGoals(),
        personalApiService.getMedStats().catch(() => ({ total: 0, favorites: 0, this_month: 0, total_cooked: 0, categories: [], top_recipes: [], avg_time: 0 })),
      ]);
      setRecipes(recipesData.recipes || []);
      setShoppingList(shoppingData.items || []);
      setWeeklyGoals(goalsData.goals || null);
      setStats(statsData);
    } catch (err) {
      console.error('Error cargando Recetario Mediterráneo:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Seed initial recipes if none exist
  useEffect(() => {
    const seedIfEmpty = async () => {
      if (seeded) return;
      try {
        const data = await personalApiService.getMedRecipes();
        const existing = data.recipes || [];
        if (existing.length === 0) {
          const created = [];
          for (const r of EXAMPLE_RECIPES) {
            try {
              const res = await personalApiService.createMedRecipe(r);
              created.push(res.recipe);
            } catch (e) {
              console.error('Error creando receta de ejemplo:', e);
            }
          }
          setRecipes(created);
        } else {
          setRecipes(existing);
        }
        setSeeded(true);
      } catch (e) {
        console.error('Error en seed:', e);
      }
    };
    seedIfEmpty();
  }, [seeded]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ─── Recipes ───────────────────────────────────────────────────────────────

  const createRecipe = async (data) => {
    const res = await personalApiService.createMedRecipe(data);
    setRecipes(prev => [res.recipe, ...prev]);
    return res.recipe;
  };

  const updateRecipe = async (id, data) => {
    const res = await personalApiService.updateMedRecipe(id, data);
    setRecipes(prev => prev.map(r => r.id === id ? res.recipe : r));
    return res.recipe;
  };

  const toggleFavorite = async (id) => {
    const recipe = recipes.find(r => r.id === id);
    if (!recipe) return;
    const newVal = !recipe.is_favorite;
    const res = await personalApiService.updateMedRecipe(id, { is_favorite: newVal });
    setRecipes(prev => prev.map(r => r.id === id ? res.recipe : r));
  };

  const deleteRecipe = async (id) => {
    await personalApiService.deleteMedRecipe(id);
    setRecipes(prev => prev.filter(r => r.id !== id));
  };

  // ─── Cooking History ───────────────────────────────────────────────────────

  const addCookingEntry = async (data) => {
    const res = await personalApiService.addMedHistory(data);
    const statsData = await personalApiService.getMedStats().catch(() => stats);
    setStats(statsData);
    return res.entry;
  };

  // ─── Shopping List ─────────────────────────────────────────────────────────

  const addShoppingItems = async (items) => {
    const res = await personalApiService.addMedShoppingItems(items);
    setShoppingList(prev => [...prev, ...(res.items || [])]);
    return res.items;
  };

  const toggleShoppingItem = async (id, checked) => {
    const res = await personalApiService.toggleMedShoppingItem(id, checked);
    setShoppingList(prev => prev.map(i => i.id === id ? res.item : i));
  };

  const deleteShoppingItem = async (id) => {
    await personalApiService.deleteMedShoppingItem(id);
    setShoppingList(prev => prev.filter(i => i.id !== id));
  };

  const clearShopping = async (onlyChecked = false) => {
    await personalApiService.clearMedShopping(onlyChecked);
    if (onlyChecked) {
      setShoppingList(prev => prev.filter(i => !i.checked));
    } else {
      setShoppingList([]);
    }
  };

  // ─── Weekly Goals ──────────────────────────────────────────────────────────

  const updateWeeklyGoals = async (data) => {
    const res = await personalApiService.updateMedWeeklyGoals(data);
    setWeeklyGoals(res.goals);
    return res.goals;
  };

  // Helpers
  const pendingShoppingCount = shoppingList.filter(i => !i.checked).length;
  const favoriteRecipes = recipes.filter(r => r.is_favorite);

  return (
    <MediterraneanContext.Provider
      value={{
        recipes,
        shoppingList,
        weeklyGoals,
        stats,
        loading,
        favoriteRecipes,
        pendingShoppingCount,
        createRecipe,
        updateRecipe,
        toggleFavorite,
        deleteRecipe,
        addCookingEntry,
        addShoppingItems,
        toggleShoppingItem,
        deleteShoppingItem,
        clearShopping,
        updateWeeklyGoals,
        refresh: fetchAll,
      }}
    >
      {children}
    </MediterraneanContext.Provider>
  );
};
