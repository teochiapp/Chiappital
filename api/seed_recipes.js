require('dotenv').config();
const { getPool, initializeDatabase } = require('./database/db');

const recipes = [
  {
    name: 'Gazpacho Andaluz',
    origin_country: 'España',
    category: 'almuerzo',
    prep_time: 15,
    cook_time: 0,
    difficulty: 1,
    cost: '$',
    servings: 4,
    calories: 120,
    protein: 2.5,
    carbs: 12.0,
    fat: 7.0,
    fiber: 3.5,
    ingredients: [
      { qty: '1', unit: 'kg', name: 'Tomates perita maduros', optional: false },
      { qty: '1', unit: 'ud', name: 'Pimiento verde italiano', optional: false },
      { qty: '1', unit: 'ud', name: 'Pepino', optional: false },
      { qty: '1/2', unit: 'ud', name: 'Cebolla', optional: true },
      { qty: '1', unit: 'diente', name: 'Ajo', optional: false },
      { qty: '50', unit: 'ml', name: 'Aceite de oliva virgen extra', optional: false },
      { qty: '30', unit: 'ml', name: 'Vinagre de Jerez', optional: false },
      { qty: '1', unit: 'pizca', name: 'Sal', optional: false }
    ],
    steps: [
      'Lavar bien los tomates, el pimiento y el pepino.',
      'Trocear todos los vegetales y ponerlos en una batidora o procesadora de alimentos.',
      'Triturar hasta conseguir una mezcla líquida homogénea.',
      'Añadir la sal, el vinagre y el aceite de oliva. Volver a triturar para emulsionar.',
      'Pasar el gazpacho por un colador fino si se desea una textura más suave.',
      'Enfriar en la heladera durante al menos 2 horas antes de servir.'
    ],
    tips: {
      errors: 'No emulsionar correctamente el aceite al final.',
      flavor: 'Usar tomates muy maduros y un buen vinagre.',
      variants: 'Añadir sandía o fresas para un toque dulce.',
      storage: 'Conservar en recipiente cerrado en la heladera hasta 3 días.'
    },
    health_tags: ['Antioxidantes', 'Hidratación', 'Vitamina C'],
    frequency: 'semanal',
    tags: ['Sopas', 'Vegetariano', 'Vegano', 'Económico'],
    learning: { technique: 'Emulsión en frío', cuts: 'Mirepoix rústico', tools: 'Licuadora de alta potencia', substitutes: 'Vinagre de manzana por Jerez' }
  },
  {
    name: 'Pisto Manchego',
    origin_country: 'España',
    category: 'cena',
    prep_time: 15,
    cook_time: 45,
    difficulty: 2,
    cost: '$',
    servings: 4,
    calories: 250,
    protein: 4.0,
    carbs: 20.0,
    fat: 16.0,
    fiber: 6.0,
    ingredients: [
      { qty: '1', unit: 'ud', name: 'Calabacín / Zapallito', optional: false },
      { qty: '1', unit: 'ud', name: 'Berenjena', optional: false },
      { qty: '1', unit: 'ud', name: 'Pimiento verde', optional: false },
      { qty: '1', unit: 'ud', name: 'Pimiento rojo', optional: false },
      { qty: '1', unit: 'ud', name: 'Cebolla', optional: false },
      { qty: '400', unit: 'g', name: 'Tomate triturado', optional: false },
      { qty: '4', unit: 'cda', name: 'Aceite de oliva virgen extra', optional: false }
    ],
    steps: [
      'Picar todas las verduras en dados de tamaño similar.',
      'En una sartén grande con aceite, sofreír la cebolla a fuego medio.',
      'Añadir los pimientos y cocinar por 10 minutos.',
      'Incorporar la berenjena y el calabacín, y cocinar otros 15 minutos.',
      'Añadir el tomate triturado, salpimentar y dejar cocinar a fuego lento por 20 minutos hasta que el tomate reduzca y espese.'
    ],
    tips: {
      errors: 'Cocinar todo a fuego muy alto, quemando la verdura antes de ablandarse.',
      flavor: 'Paciencia en el sofrito, es la clave del sabor.',
      variants: 'Servir con un huevo frito o poché encima.',
      storage: 'Excelente para Meal Prep; aguanta 5 días en heladera.'
    },
    health_tags: ['Fibra', 'Vegetales', 'Grasas Saludables'],
    frequency: 'semanal',
    tags: ['Sartén', 'Vegetariano', 'Vegano', 'Meal Prep'],
    learning: { technique: 'Sofrito lento', cuts: 'Brunoise gruesa', tools: 'Sartén honda o cazuela', substitutes: 'Tomate natural por triturado de lata' }
  },
  {
    name: 'Ensalada de Garbanzos',
    origin_country: 'Grecia',
    category: 'almuerzo',
    prep_time: 10,
    cook_time: 0,
    difficulty: 1,
    cost: '$',
    servings: 2,
    calories: 380,
    protein: 15.0,
    carbs: 45.0,
    fat: 14.0,
    fiber: 12.0,
    ingredients: [
      { qty: '400', unit: 'g', name: 'Garbanzos cocidos', optional: false },
      { qty: '1', unit: 'ud', name: 'Pepino', optional: false },
      { qty: '150', unit: 'g', name: 'Tomates cherry', optional: false },
      { qty: '1/2', unit: 'ud', name: 'Cebolla morada', optional: false },
      { qty: '50', unit: 'g', name: 'Queso Feta', optional: true },
      { qty: '3', unit: 'cda', name: 'Aceite de oliva', optional: false },
      { qty: '1', unit: 'ud', name: 'Limón (jugo)', optional: false }
    ],
    steps: [
      'Enjuagar y escurrir bien los garbanzos.',
      'Cortar el pepino, los tomates cherry por la mitad y picar la cebolla finamente.',
      'Mezclar todos los ingredientes en un bol grande.',
      'Preparar un aderezo con el aceite, jugo de limón, sal y pimienta.',
      'Verter sobre la ensalada, mezclar bien y espolvorear el queso feta desmenuzado por encima.'
    ],
    tips: {
      errors: 'No secar bien los garbanzos.',
      flavor: 'Dejar reposar 15 min antes de comer para que se integren los sabores.',
      variants: 'Añadir aceitunas kalamata o palta.',
      storage: 'Heladera 3 días (sin aliñar dura más).'
    },
    health_tags: ['Alto en proteínas', 'Fibra', 'Corazón Sano'],
    frequency: 'varias_semana',
    tags: ['Legumbres', 'Ensaladas', 'Vegetariano', 'Meal Prep'],
    learning: { technique: 'Vinagreta simple', cuts: 'Cortes irregulares rústicos', tools: 'Bol amplio', substitutes: 'Porotos blancos en vez de garbanzos' }
  },
  {
    name: 'Ensalada de Lentejas',
    origin_country: 'Líbano',
    category: 'almuerzo',
    prep_time: 15,
    cook_time: 0,
    difficulty: 1,
    cost: '$',
    servings: 3,
    calories: 320,
    protein: 14.0,
    carbs: 42.0,
    fat: 10.0,
    fiber: 14.0,
    ingredients: [
      { qty: '400', unit: 'g', name: 'Lentejas cocidas', optional: false },
      { qty: '1', unit: 'ud', name: 'Pimiento rojo', optional: false },
      { qty: '1', unit: 'ud', name: 'Zanahoria', optional: false },
      { qty: '1', unit: 'puñado', name: 'Perejil fresco', optional: false },
      { qty: '1', unit: 'cda', name: 'Mostaza Dijon', optional: true },
      { qty: '3', unit: 'cda', name: 'Aceite de oliva', optional: false },
      { qty: '2', unit: 'cda', name: 'Vinagre de manzana', optional: false }
    ],
    steps: [
      'Escurrir las lentejas si son de lata.',
      'Picar muy fino el pimiento rojo y rallar la zanahoria.',
      'Picar el perejil fresco.',
      'Mezclar las lentejas con las verduras en un bol.',
      'Batir el aceite, vinagre, mostaza, sal y pimienta. Aliñar la ensalada.'
    ],
    tips: {
      errors: 'Dejar las lentejas muy blandas si se hierven en casa.',
      flavor: 'La mostaza emulsiona la vinagreta y da un toque increíble.',
      variants: 'Agregar atún o huevo duro para más proteína.',
      storage: 'Excelente para llevar al trabajo al día siguiente.'
    },
    health_tags: ['Hierro', 'Fibra', 'Bajo IG'],
    frequency: 'varias_semana',
    tags: ['Legumbres', 'Ensaladas', 'Vegetariano'],
    learning: { technique: 'Rallado y picado fino', cuts: 'Brunoise fina', tools: 'Rallador', substitutes: 'Cilantro por perejil' }
  },
  {
    name: 'Ensalada de Atún Mediterránea',
    origin_country: 'Italia',
    category: 'almuerzo',
    prep_time: 10,
    cook_time: 0,
    difficulty: 1,
    cost: '$$',
    servings: 2,
    calories: 350,
    protein: 28.0,
    carbs: 12.0,
    fat: 18.0,
    fiber: 5.0,
    ingredients: [
      { qty: '2', unit: 'latas', name: 'Atún al natural', optional: false },
      { qty: '150', unit: 'g', name: 'Hojas verdes (espinaca/rúcula)', optional: false },
      { qty: '15', unit: 'ud', name: 'Aceitunas negras', optional: false },
      { qty: '150', unit: 'g', name: 'Tomates cherry', optional: false },
      { qty: '2', unit: 'cda', name: 'Aceite de oliva extra virgen', optional: false },
      { qty: '1', unit: 'cda', name: 'Jugo de limón', optional: false }
    ],
    steps: [
      'Escurrir el atún.',
      'Colocar las hojas verdes como base en un plato o bol.',
      'Añadir los tomates cherry cortados a la mitad y las aceitunas.',
      'Desmenuzar el atún por encima.',
      'Aliñar con el aceite de oliva, limón, sal y pimienta.'
    ],
    tips: {
      errors: 'Ahogar las hojas verdes en demasiado aliño.',
      flavor: 'Usar un aceite de oliva de muy buena calidad; hace la diferencia.',
      variants: 'Añadir huevo duro o porotos blancos.',
      storage: 'Consumir en el momento para evitar que las hojas se marchiten.'
    },
    health_tags: ['Omega-3', 'Alto en proteínas', 'Bajo en carbohidratos'],
    frequency: 'semanal',
    tags: ['Ensaladas', 'Pescado', 'Bajo en carbohidratos'],
    learning: { technique: 'Emplatado en capas', cuts: 'Mitades', tools: 'Plato hondo', substitutes: 'Caballa o sardinas por atún' }
  },
  {
    name: 'Arroz Integral con Verduras',
    origin_country: 'España',
    category: 'almuerzo',
    prep_time: 10,
    cook_time: 40,
    difficulty: 2,
    cost: '$',
    servings: 4,
    calories: 310,
    protein: 7.0,
    carbs: 60.0,
    fat: 5.0,
    fiber: 6.0,
    ingredients: [
      { qty: '200', unit: 'g', name: 'Arroz integral', optional: false },
      { qty: '1', unit: 'ud', name: 'Zanahoria', optional: false },
      { qty: '1/2', unit: 'ud', name: 'Pimiento rojo', optional: false },
      { qty: '1', unit: 'ud', name: 'Calabacín', optional: false },
      { qty: '2', unit: 'diente', name: 'Ajo', optional: false },
      { qty: '500', unit: 'ml', name: 'Caldo de verduras', optional: false },
      { qty: '1', unit: 'cda', name: 'Pimentón dulce', optional: true }
    ],
    steps: [
      'Picar el ajo y todas las verduras en dados pequeños.',
      'En una cazuela, sofreír el ajo y las verduras por 5 minutos.',
      'Añadir el arroz integral y remover un par de minutos para tostar el grano.',
      'Agregar el pimentón y el caldo de verduras caliente.',
      'Dejar cocer a fuego medio-bajo durante 35-40 minutos (el arroz integral tarda más).',
      'Dejar reposar 5 minutos tapado antes de servir.'
    ],
    tips: {
      errors: 'Quedarse sin líquido (el arroz integral absorbe más).',
      flavor: 'Sofreír bien el arroz antes de echar el caldo potencia el sabor a nuez.',
      variants: 'Añadir guisantes o champiñones.',
      storage: 'Heladera hasta 4 días.'
    },
    health_tags: ['Carbohidratos complejos', 'Fibra', 'Vitaminas'],
    frequency: 'semanal',
    tags: ['Arroz', 'Vegetariano', 'Sartén'],
    learning: { technique: 'Nacarado de arroz', cuts: 'Mirepoix', tools: 'Cazuela ancha', substitutes: 'Quinoa en vez de arroz' }
  },
  {
    name: 'Pollo al Limón y Romero',
    origin_country: 'Grecia',
    category: 'cena',
    prep_time: 10,
    cook_time: 25,
    difficulty: 1,
    cost: '$$',
    servings: 2,
    calories: 280,
    protein: 40.0,
    carbs: 2.0,
    fat: 10.0,
    fiber: 0.5,
    ingredients: [
      { qty: '400', unit: 'g', name: 'Pechuga o muslo de pollo', optional: false },
      { qty: '2', unit: 'ud', name: 'Limón', optional: false },
      { qty: '2', unit: 'rama', name: 'Romero fresco', optional: false },
      { qty: '3', unit: 'diente', name: 'Ajo', optional: false },
      { qty: '2', unit: 'cda', name: 'Aceite de oliva', optional: false }
    ],
    steps: [
      'Cortar el pollo en filetes o dados.',
      'Marinar el pollo por 15 minutos con el jugo de 1 limón, ajo picado, romero, sal y pimienta.',
      'En una sartén a fuego medio-alto, calentar el aceite.',
      'Cocinar el pollo hasta que esté dorado por ambos lados y cocido por dentro (unos 10-12 min).',
      'Cortar el otro limón en rodajas y añadir a la sartén en los últimos 2 minutos.'
    ],
    tips: {
      errors: 'Cocinar demasiado la pechuga, dejándola seca.',
      flavor: 'El marinado prolongado ablanda la carne.',
      variants: 'Hornear entero en lugar de sartén.',
      storage: 'Heladera 3 días.'
    },
    health_tags: ['Alto en proteínas', 'Bajo en carbohidratos'],
    frequency: 'varias_semana',
    tags: ['Pollo', 'Sartén', 'Alto en proteínas'],
    learning: { technique: 'Marinado', cuts: 'Fileteado', tools: 'Sartén gruesa', substitutes: 'Pavo por pollo' }
  },
  {
    name: 'Pollo al Horno con Papas',
    origin_country: 'Italia',
    category: 'almuerzo',
    prep_time: 15,
    cook_time: 45,
    difficulty: 1,
    cost: '$',
    servings: 4,
    calories: 450,
    protein: 35.0,
    carbs: 30.0,
    fat: 18.0,
    fiber: 4.0,
    ingredients: [
      { qty: '1', unit: 'ud', name: 'Pollo troceado', optional: false },
      { qty: '4', unit: 'ud', name: 'Papas medianas', optional: false },
      { qty: '1', unit: 'ud', name: 'Cebolla', optional: false },
      { qty: '1', unit: 'vaso', name: 'Vino blanco', optional: true },
      { qty: '3', unit: 'cda', name: 'Aceite de oliva', optional: false },
      { qty: '1', unit: 'cda', name: 'Orégano o tomillo', optional: false }
    ],
    steps: [
      'Precalentar el horno a 200°C.',
      'Pelar y cortar las papas en gajos y la cebolla en juliana gruesa.',
      'Colocar las verduras en una bandeja de horno como base.',
      'Colocar el pollo troceado encima. Salpimentar y añadir el orégano.',
      'Rociar todo con el aceite de oliva y el vino blanco.',
      'Hornear durante 45-50 minutos, dando vuelta el pollo a la mitad del tiempo para que se dore parejo.'
    ],
    tips: {
      errors: 'No precalentar el horno; el pollo no quedará crujiente.',
      flavor: 'Dorar bien la piel al final encendiendo el grill 5 minutos.',
      variants: 'Añadir zanahorias o batatas.',
      storage: 'Heladera 3 días, recalentar en horno.'
    },
    health_tags: ['Proteína de calidad', 'Energía'],
    frequency: 'semanal',
    tags: ['Pollo', 'Horno'],
    learning: { technique: 'Asado al horno', cuts: 'Gajos rústicos', tools: 'Bandeja de horno', substitutes: 'Batatas por papas' }
  },
  {
    name: 'Trucha al Horno',
    origin_country: 'España',
    category: 'cena',
    prep_time: 10,
    cook_time: 15,
    difficulty: 1,
    cost: '$$',
    servings: 2,
    calories: 320,
    protein: 26.0,
    carbs: 2.0,
    fat: 22.0,
    fiber: 0.0,
    ingredients: [
      { qty: '2', unit: 'filetes', name: 'Trucha (o Merluza)', optional: false },
      { qty: '1', unit: 'ud', name: 'Limón', optional: false },
      { qty: '2', unit: 'cda', name: 'Aceite de oliva extra virgen', optional: false },
      { qty: '1', unit: 'cda', name: 'Perejil fresco picado', optional: false },
      { qty: '1', unit: 'diente', name: 'Ajo', optional: false }
    ],
    steps: [
      'Precalentar el horno a 180°C.',
      'En un mortero o bol, mezclar el ajo muy picado, perejil, aceite y jugo de medio limón.',
      'Colocar los filetes de pescado en una fuente de horno.',
      'Untar el pescado con la mezcla de ajo y perejil.',
      'Colocar rodajas del medio limón restante sobre el pescado.',
      'Hornear por 12-15 minutos (no más, para que no se seque).'
    ],
    tips: {
      errors: 'Pasarse del tiempo de horno, el pescado queda seco y pastoso.',
      flavor: 'La grasa natural de la trucha requiere poco aceite extra.',
      variants: 'Añadir un lecho de cebolla cortada muy fina debajo del pescado.',
      storage: 'Consumir en el día preferentemente.'
    },
    health_tags: ['Omega-3', 'Corazón Sano', 'Bajo en carbohidratos'],
    frequency: 'semanal',
    tags: ['Pescado', 'Horno', 'Cena ligera'],
    learning: { technique: 'Papillote o Asado corto', cuts: 'Rodajas', tools: 'Horno', substitutes: 'Salmón o Merluza' }
  },
  {
    name: 'Sardinas a la Plancha',
    origin_country: 'Portugal',
    category: 'cena',
    prep_time: 5,
    cook_time: 5,
    difficulty: 1,
    cost: '$',
    servings: 2,
    calories: 250,
    protein: 24.0,
    carbs: 0.0,
    fat: 15.0,
    fiber: 0.0,
    ingredients: [
      { qty: '500', unit: 'g', name: 'Sardinas frescas limpias', optional: false },
      { qty: '1', unit: 'cda', name: 'Sal gruesa', optional: false },
      { qty: '1', unit: 'ud', name: 'Limón', optional: false },
      { qty: '1', unit: 'cda', name: 'Aceite de oliva', optional: false }
    ],
    steps: [
      'Lavar y secar bien las sardinas.',
      'Calentar a fuego fuerte una plancha o sartén gruesa con unas gotas de aceite.',
      'Colocar las sardinas y espolvorear sal gruesa.',
      'Cocinar unos 2-3 minutos por lado, dependiendo del tamaño.',
      'Servir inmediatamente con unas gotas de limón fresco.'
    ],
    tips: {
      errors: 'Moverlas antes de tiempo; se romperá la piel.',
      flavor: 'La sal gruesa ayuda a que la piel quede crujiente.',
      variants: 'Si se usan sardinas en conserva, saltar cocción y servir en ensalada o tostada.',
      storage: 'Consumir de inmediato.'
    },
    health_tags: ['Omega-3', 'Calcio', 'Grasas Saludables'],
    frequency: 'semanal',
    tags: ['Pescado', 'Sartén', 'Económico'],
    learning: { technique: 'Plancha muy caliente', cuts: 'Enteras', tools: 'Plancha de hierro', substitutes: 'Boquerones o Anchoas' }
  },
  {
    name: 'Pasta Aglio e Olio',
    origin_country: 'Italia',
    category: 'cena',
    prep_time: 5,
    cook_time: 15,
    difficulty: 2,
    cost: '$',
    servings: 2,
    calories: 400,
    protein: 10.0,
    carbs: 60.0,
    fat: 14.0,
    fiber: 3.0,
    ingredients: [
      { qty: '200', unit: 'g', name: 'Espaguetis (ideal integral)', optional: false },
      { qty: '4', unit: 'diente', name: 'Ajo', optional: false },
      { qty: '4', unit: 'cda', name: 'Aceite de oliva virgen extra', optional: false },
      { qty: '1', unit: 'ud', name: 'Peperoncino o guindilla', optional: true },
      { qty: '1', unit: 'puñado', name: 'Perejil fresco', optional: true }
    ],
    steps: [
      'Hervir la pasta en abundante agua salada 1 minuto menos del tiempo del paquete.',
      'Mientras, laminar los ajos y sofreírlos suavemente en una sartén grande con el aceite, junto con el peperoncino.',
      'El ajo debe dorarse MUY levemente (si se quema, amarga).',
      'Apagar el fuego. Escurrir la pasta guardando medio cucharón del agua de cocción.',
      'Volcar la pasta en la sartén, añadir el agua de cocción, el perejil picado y saltear vigorosamente (fuego medio) para emulsionar la salsa.'
    ],
    tips: {
      errors: 'Quemar el ajo. Mantener fuego bajo.',
      flavor: 'La clave absoluta es el agua de cocción con almidón para emulsionar el aceite y formar una crema.',
      variants: 'Añadir queso parmesano al final, aunque la receta tradicional no lleva.',
      storage: 'Se come en el momento, no recalentar.'
    },
    health_tags: ['Energía', 'Carbohidratos complejos', 'Grasas Saludables'],
    frequency: 'ocasional',
    tags: ['Pasta', 'Sartén', 'Económico', 'Vegetariano'],
    learning: { technique: 'Emulsión (Manteca)', cuts: 'Laminado', tools: 'Sartén grande', substitutes: 'Espaguetis comunes' }
  },
  {
    name: 'Pasta Primavera',
    origin_country: 'Italia',
    category: 'almuerzo',
    prep_time: 15,
    cook_time: 15,
    difficulty: 1,
    cost: '$$',
    servings: 2,
    calories: 420,
    protein: 12.0,
    carbs: 65.0,
    fat: 12.0,
    fiber: 8.0,
    ingredients: [
      { qty: '200', unit: 'g', name: 'Pasta corta (Penne o Fusilli)', optional: false },
      { qty: '1', unit: 'ud', name: 'Calabacín', optional: false },
      { qty: '150', unit: 'g', name: 'Tomates cherry', optional: false },
      { qty: '100', unit: 'g', name: 'Guisantes / Arvejas', optional: false },
      { qty: '1', unit: 'ud', name: 'Zanahoria pequeña', optional: false },
      { qty: '3', unit: 'cda', name: 'Aceite de oliva', optional: false },
      { qty: '30', unit: 'g', name: 'Queso Parmesano', optional: true }
    ],
    steps: [
      'Cortar la zanahoria y el calabacín en bastones finos. Partir los tomates a la mitad.',
      'Cocer la pasta en agua salada según el paquete. En los últimos 3 minutos, echar los guisantes y la zanahoria al agua.',
      'En una sartén con aceite, saltear el calabacín y los tomates por 3 minutos.',
      'Escurrir la pasta con sus verduras y volcar a la sartén.',
      'Mezclar todo bien, añadir queso parmesano rallado y servir.'
    ],
    tips: {
      errors: 'Sobre-cocinar las verduras.',
      flavor: 'Dejar las verduras crujientes (al dente).',
      variants: 'Añadir pollo salteado.',
      storage: 'Heladera 2 días, excelente fría como ensalada de pasta.'
    },
    health_tags: ['Vegetales', 'Fibra'],
    frequency: 'semanal',
    tags: ['Pasta', 'Vegetariano', 'Almuerzo fácil'],
    learning: { technique: 'Blanqueado junto a la pasta', cuts: 'Juliana gruesa', tools: 'Olla grande', substitutes: 'Brócoli por guisantes' }
  },
  {
    name: 'Lasaña de Verduras',
    origin_country: 'Italia',
    category: 'cena',
    prep_time: 30,
    cook_time: 40,
    difficulty: 3,
    cost: '$$',
    servings: 6,
    calories: 380,
    protein: 16.0,
    carbs: 42.0,
    fat: 15.0,
    fiber: 7.0,
    ingredients: [
      { qty: '12', unit: 'laminas', name: 'Masa para lasaña', optional: false },
      { qty: '1', unit: 'ud', name: 'Berenjena grande', optional: false },
      { qty: '1', unit: 'ud', name: 'Calabacín', optional: false },
      { qty: '200', unit: 'g', name: 'Espinacas frescas', optional: false },
      { qty: '500', unit: 'g', name: 'Salsa de tomate casera', optional: false },
      { qty: '200', unit: 'g', name: 'Ricota o requesón', optional: false },
      { qty: '100', unit: 'g', name: 'Queso mozzarella rallado', optional: false }
    ],
    steps: [
      'Cortar berenjena y calabacín en láminas finas. Asarlas en horno o plancha.',
      'Saltear las espinacas hasta que reduzcan y mezclarlas con la ricota. Salpimentar.',
      'En una fuente para horno, montar capas: capa de salsa, láminas de pasta, verduras asadas, mezcla de ricota.',
      'Repetir capas y terminar con pasta, abundante salsa de tomate y el queso mozzarella encima.',
      'Hornear a 190°C por 30-35 minutos hasta que burbujee y dore.'
    ],
    tips: {
      errors: 'Usar mucha agua en las verduras, haciendo que la lasaña quede aguada (asar antes elimina el agua).',
      flavor: 'Añadir nuez moscada a la ricota.',
      variants: 'Salsa bechamel ligera en lugar de ricota.',
      storage: 'Heladera 4 días o congelar en porciones (excelente para congelar).'
    },
    health_tags: ['Vegetales', 'Lácteos saludables', 'Calcio'],
    frequency: 'ocasional',
    tags: ['Horno', 'Vegetariano', 'Familiar'],
    learning: { technique: 'Ensamblado en capas', cuts: 'Láminas finas', tools: 'Fuente profunda', substitutes: 'Láminas de berenjena en vez de masa para opción low-carb' }
  },
  {
    name: 'Tomates Rellenos',
    origin_country: 'Grecia',
    category: 'almuerzo',
    prep_time: 20,
    cook_time: 45,
    difficulty: 2,
    cost: '$$',
    servings: 4,
    calories: 310,
    protein: 8.0,
    carbs: 45.0,
    fat: 10.0,
    fiber: 6.0,
    ingredients: [
      { qty: '4', unit: 'ud', name: 'Tomates grandes y firmes', optional: false },
      { qty: '150', unit: 'g', name: 'Arroz de grano corto', optional: false },
      { qty: '1', unit: 'ud', name: 'Cebolla', optional: false },
      { qty: '1', unit: 'puñado', name: 'Perejil y menta fresca', optional: false },
      { qty: '3', unit: 'cda', name: 'Aceite de oliva', optional: false },
      { qty: '50', unit: 'g', name: 'Queso feta', optional: true }
    ],
    steps: [
      'Cortar la tapa superior de los tomates y vaciarlos con cuidado usando una cuchara. Guardar la pulpa.',
      'Triturar la pulpa de los tomates.',
      'En una sartén, sofreír la cebolla, añadir el arroz crudo y tostar. Añadir la pulpa de tomate triturada y las hierbas.',
      'Cocinar 10 minutos (el arroz quedará a media cocción).',
      'Rellenar los tomates (no hasta arriba porque el arroz crece).',
      'Colocar las tapas, rociar con aceite y hornear a 180°C por 45 minutos.'
    ],
    tips: {
      errors: 'Rellenar el tomate hasta el borde (el arroz rebalsará al cocerse).',
      flavor: 'La menta es el toque mágico griego.',
      variants: 'Rellenar también pimientos con la misma mezcla.',
      storage: 'Heladera 3 días, recalentan muy bien.'
    },
    health_tags: ['Antioxidantes', 'Vegetales', 'Vitamina C'],
    frequency: 'semanal',
    tags: ['Horno', 'Vegetariano', 'Arroz'],
    learning: { technique: 'Vaciado de vegetales', cuts: 'Corte de tapa', tools: 'Cuchara sacabolas', substitutes: 'Quinoa por arroz' }
  },
  {
    name: 'Brócoli Gratinado',
    origin_country: 'Francia',
    category: 'cena',
    prep_time: 10,
    cook_time: 25,
    difficulty: 1,
    cost: '$',
    servings: 3,
    calories: 220,
    protein: 12.0,
    carbs: 10.0,
    fat: 14.0,
    fiber: 5.0,
    ingredients: [
      { qty: '500', unit: 'g', name: 'Brócoli fresco', optional: false },
      { qty: '200', unit: 'ml', name: 'Leche (o bebida vegetal sin azúcar)', optional: false },
      { qty: '1', unit: 'cda', name: 'Harina integral o maicena', optional: false },
      { qty: '1', unit: 'cda', name: 'Aceite de oliva', optional: false },
      { qty: '50', unit: 'g', name: 'Queso rallado (mozzarella/parmesano)', optional: false },
      { qty: '1', unit: 'pizca', name: 'Nuez moscada', optional: false }
    ],
    steps: [
      'Separar el brócoli en ramilletes y cocer al vapor o en agua hirviendo por 4 minutos (debe quedar firme).',
      'En una sartén, calentar el aceite, añadir la harina y remover 1 minuto.',
      'Añadir la leche poco a poco sin dejar de remover hasta formar una bechamel ligera. Salpimentar y añadir nuez moscada.',
      'Colocar el brócoli en una fuente, verter la salsa por encima y espolvorear el queso.',
      'Gratinar en el horno a 200°C por 10-15 minutos.'
    ],
    tips: {
      errors: 'Hervir el brócoli hasta que esté blando (se hará papilla en el horno).',
      flavor: 'Un toque de pimienta negra recién molida al salir del horno.',
      variants: 'Añadir coliflor o trozos de jamón cocido.',
      storage: 'Heladera 2 días.'
    },
    health_tags: ['Calcio', 'Fibra', 'Bajo en carbohidratos'],
    frequency: 'semanal',
    tags: ['Horno', 'Vegetariano', 'Guarnición'],
    learning: { technique: 'Roux para salsa blanca', cuts: 'Ramilletes', tools: 'Varillas para batir', substitutes: 'Coliflor por brócoli' }
  },
  {
    name: 'Crema de Calabaza',
    origin_country: 'España',
    category: 'cena',
    prep_time: 10,
    cook_time: 30,
    difficulty: 1,
    cost: '$',
    servings: 4,
    calories: 180,
    protein: 3.0,
    carbs: 25.0,
    fat: 8.0,
    fiber: 4.0,
    ingredients: [
      { qty: '800', unit: 'g', name: 'Calabaza / Zapallo pelado', optional: false },
      { qty: '1', unit: 'ud', name: 'Cebolla', optional: false },
      { qty: '1', unit: 'ud', name: 'Zanahoria', optional: false },
      { qty: '2', unit: 'cda', name: 'Aceite de oliva virgen extra', optional: false },
      { qty: '500', unit: 'ml', name: 'Caldo de verduras o agua', optional: false },
      { qty: '30', unit: 'g', name: 'Semillas de calabaza tostadas', optional: true }
    ],
    steps: [
      'Trocear la calabaza, cebolla y zanahoria.',
      'En una olla, pochar la cebolla con el aceite durante 5 minutos.',
      'Añadir la calabaza y la zanahoria. Rehogar 5 minutos más.',
      'Cubrir con el caldo, llevar a ebullición y cocer a fuego medio tapado durante 20 minutos (hasta que la calabaza esté tierna).',
      'Triturar todo hasta lograr una crema muy fina.',
      'Servir caliente adornado con las semillas tostadas por encima.'
    ],
    tips: {
      errors: 'Añadir demasiado caldo al principio; es mejor añadirlo poco a poco para ajustar la textura.',
      flavor: 'Un poco de jengibre fresco rallado en el sofrito.',
      variants: 'Añadir un toque de crema de leche o leche de coco.',
      storage: 'Heladera 4 días o congelar en porciones.'
    },
    health_tags: ['Vitamina A', 'Bajo en calorías', 'Reconfortante'],
    frequency: 'semanal',
    tags: ['Sopas', 'Vegano', 'Olla'],
    learning: { technique: 'Triturado de potaje', cuts: 'Troceado irregular', tools: 'Licuadora de mano', substitutes: 'Batata o boniato en vez de zanahoria' }
  },
  {
    name: 'Pan Integral con Palta y Huevo',
    origin_country: 'Internacional',
    category: 'desayuno',
    prep_time: 5,
    cook_time: 5,
    difficulty: 1,
    cost: '$$',
    servings: 1,
    calories: 320,
    protein: 15.0,
    carbs: 22.0,
    fat: 20.0,
    fiber: 8.0,
    ingredients: [
      { qty: '1', unit: 'rebanada', name: 'Pan integral de masa madre', optional: false },
      { qty: '1/2', unit: 'ud', name: 'Palta (aguacate) madura', optional: false },
      { qty: '1', unit: 'ud', name: 'Huevo', optional: false },
      { qty: '1', unit: 'cda', name: 'Aceite de oliva', optional: true },
      { qty: '1', unit: 'pizca', name: 'Sal, pimienta y semillas', optional: false }
    ],
    steps: [
      'Tostar el pan integral.',
      'Pisar la media palta con un tenedor, añadir una gota de jugo de limón y sal.',
      'Hacer el huevo a la plancha (con una gota de aceite), poché o duro.',
      'Untar la palta sobre la tostada y colocar el huevo encima.',
      'Espolvorear con pimienta negra recién molida y semillas (chía o sésamo).'
    ],
    tips: {
      errors: 'Usar una palta muy dura.',
      flavor: 'El pan de masa madre grueso hace que la textura contraste perfecto con la palta cremosa.',
      variants: 'Añadir rodajas de tomate o queso feta desmenuzado.',
      storage: 'Preparar y comer de inmediato.'
    },
    health_tags: ['Grasas Saludables', 'Proteína de calidad', 'Omega-3'],
    frequency: 'diaria',
    tags: ['Desayuno', 'Rápido', 'Vegetariano'],
    learning: { technique: 'Huevo poché', cuts: 'Pisado rústico', tools: 'Tostadora', substitutes: 'Huevo revuelto' }
  },
  {
    name: 'Yogur con Frutas y Frutos Secos',
    origin_country: 'Grecia',
    category: 'desayuno',
    prep_time: 5,
    cook_time: 0,
    difficulty: 1,
    cost: '$',
    servings: 1,
    calories: 280,
    protein: 14.0,
    carbs: 25.0,
    fat: 12.0,
    fiber: 5.0,
    ingredients: [
      { qty: '200', unit: 'g', name: 'Yogur griego natural (sin azúcar)', optional: false },
      { qty: '1', unit: 'puñado', name: 'Frutos rojos (arándanos, frutillas)', optional: false },
      { qty: '30', unit: 'g', name: 'Nueces o almendras', optional: false },
      { qty: '1', unit: 'cda', name: 'Avena en hojuelas', optional: true },
      { qty: '1', unit: 'cdta', name: 'Miel natural', optional: true }
    ],
    steps: [
      'Colocar el yogur en un bol pequeño.',
      'Lavar las frutas y cortarlas si son grandes.',
      'Trocear ligeramente los frutos secos.',
      'Agregar las frutas, avena y frutos secos sobre el yogur.',
      'Añadir un hilo muy fino de miel si se desea un toque dulce.'
    ],
    tips: {
      errors: 'Usar yogur de sabores comerciales, llenos de azúcar.',
      flavor: 'Tostar los frutos secos 2 minutos en una sartén seca realza su sabor.',
      variants: 'Usar manzana picada con canela.',
      storage: 'Excelente para dejar armado en la heladera la noche anterior (Overnight oats).'
    },
    health_tags: ['Probióticos', 'Calcio', 'Antioxidantes'],
    frequency: 'diaria',
    tags: ['Desayuno', 'Snack', 'Rápido', 'Sin cocción'],
    learning: { technique: 'Ensamblado', cuts: 'Enteros', tools: 'Bol', substitutes: 'Kéfir por yogur' }
  },
  {
    name: 'Manzanas al Horno con Canela',
    origin_country: 'Francia',
    category: 'postre',
    prep_time: 10,
    cook_time: 30,
    difficulty: 1,
    cost: '$',
    servings: 2,
    calories: 150,
    protein: 1.0,
    carbs: 35.0,
    fat: 2.0,
    fiber: 6.0,
    ingredients: [
      { qty: '2', unit: 'ud', name: 'Manzanas (ideal variedad reineta o verde)', optional: false },
      { qty: '1', unit: 'cdta', name: 'Canela en polvo', optional: false },
      { qty: '20', unit: 'g', name: 'Nueces picadas', optional: true },
      { qty: '1', unit: 'cdta', name: 'Miel', optional: true },
      { qty: '1', unit: 'chorrito', name: 'Agua o jugo de naranja', optional: false }
    ],
    steps: [
      'Precalentar el horno a 190°C.',
      'Lavar las manzanas y quitarles el corazón (la parte central de las semillas) sin llegar al fondo.',
      'Rellenar el hueco de cada manzana con media cucharadita de miel, canela y nueces.',
      'Poner las manzanas en una fuente pequeña de horno. Echar un chorrito de agua en el fondo de la fuente.',
      'Hornear por 30-35 minutos hasta que estén muy tiernas y la piel empiece a arrugarse.'
    ],
    tips: {
      errors: 'No echar agua en el fondo de la fuente (se pegarán).',
      flavor: 'La canela resalta el dulzor natural de la fruta.',
      variants: 'Usar peras en lugar de manzanas.',
      storage: 'Duran 4 días en la heladera. Se pueden comer frías o recalentadas.'
    },
    health_tags: ['Postre Saludable', 'Fibra', 'Bajo en grasas'],
    frequency: 'ocasional',
    tags: ['Postre', 'Horno', 'Dulce natural'],
    learning: { technique: 'Vaciado de centro', cuts: 'Entera', tools: 'Descorazonador de manzanas', substitutes: 'Peras por manzanas' }
  }
];

async function seed() {
  console.log('Iniciando semilla de recetas mediterraneas...');
  try {
    await initializeDatabase();
  } catch (e) {
    console.error('Error inicializando db:', e);
  }
  const db = getPool();
  try {
    // Buscar ID del usuario actual (probablemente el id=1, pero buscamos el primero)
    const [users] = await db.execute('SELECT id FROM users LIMIT 1');
    if (users.length === 0) {
      console.error('No hay usuarios en la base de datos. Por favor, crea un usuario primero.');
      process.exit(1);
    }
    const userId = users[0].id;
    console.log('Insertando recetas para el usuario ID:', userId);

    let inserted = 0;
    for (const recipe of recipes) {
      // Evitar duplicados por nombre
      const [existing] = await db.execute(
        'SELECT id FROM med_recipes WHERE name = ? AND user_id = ?',
        [recipe.name, userId]
      );

      if (existing.length === 0) {
        await db.execute(
          `INSERT INTO med_recipes
            (user_id, name, origin_country, category, prep_time, cook_time, difficulty, cost, servings,
             calories, protein, carbs, fat, fiber, ingredients, steps, tips, health_tags, frequency, tags, learning)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            recipe.name,
            recipe.origin_country,
            recipe.category,
            recipe.prep_time,
            recipe.cook_time,
            recipe.difficulty,
            recipe.cost,
            recipe.servings,
            recipe.calories,
            recipe.protein,
            recipe.carbs,
            recipe.fat,
            recipe.fiber,
            JSON.stringify(recipe.ingredients),
            JSON.stringify(recipe.steps),
            JSON.stringify(recipe.tips),
            JSON.stringify(recipe.health_tags),
            recipe.frequency,
            JSON.stringify(recipe.tags),
            JSON.stringify(recipe.learning)
          ]
        );
        inserted++;
        console.log(`✅ Insertada: ${recipe.name}`);
      } else {
        console.log(`⚠️ Omitida (ya existe): ${recipe.name}`);
      }
    }
    
    console.log(`\n✨ Proceso completado. Se insertaron ${inserted} nuevas recetas.`);
    process.exit(0);
  } catch (err) {
    console.error('Error insertando recetas:', err);
    process.exit(1);
  }
}

seed();
