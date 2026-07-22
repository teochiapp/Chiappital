require('dotenv').config();
const { getPool, initializeDatabase } = require('./database/db');

const recipes = [
  {
    name: 'Pasta al Pesto',
    origin_country: 'Italia',
    category: 'almuerzo',
    prep_time: 15,
    cook_time: 15,
    difficulty: 2,
    cost: '$$',
    servings: 2,
    calories: 450,
    protein: 14.0,
    carbs: 55.0,
    fat: 22.0,
    fiber: 5.0,
    ingredients: [
      { qty: '200', unit: 'g', name: 'Pasta (ej. Linguine o Fusilli)', optional: false },
      { qty: '1', unit: 'atado', name: 'Albahaca fresca grande', optional: false },
      { qty: '30', unit: 'g', name: 'Nueces o Piñones', optional: false },
      { qty: '50', unit: 'g', name: 'Queso Parmesano rallado', optional: false },
      { qty: '1', unit: 'diente', name: 'Ajo', optional: false },
      { qty: '5', unit: 'cda', name: 'Aceite de oliva virgen extra', optional: false },
      { qty: '1', unit: 'pizca', name: 'Sal gruesa', optional: false }
    ],
    steps: [
      'Hervir agua y cocinar la pasta según las instrucciones (guardar 1 taza del agua de cocción al final).',
      'En un mortero o procesadora, triturar el ajo con la sal gruesa y los piñones/nueces.',
      'Añadir las hojas de albahaca lavadas y muy secas, triturando o procesando en tandas cortas.',
      'Incorporar el queso rallado y, por último, añadir el aceite de oliva poco a poco hasta lograr una pasta.',
      'Colocar el pesto en un bol grande. Añadir un par de cucharadas del agua de cocción de la pasta para diluir un poco.',
      'Escurrir la pasta y volcarla al bol con el pesto fuera del fuego. Mezclar bien.'
    ],
    tips: {
      errors: 'Cocinar el pesto en la sartén. La albahaca se oxida y amarga.',
      flavor: 'Lavar y SECAR muy bien la albahaca; el agua arruina el pesto.',
      variants: 'Añadir 5 tomates secos hidratados para un pesto rojo (Trapanese).',
      storage: 'La salsa dura 4 días en frasco de vidrio en heladera, cubierta con un hilo de aceite.'
    },
    health_tags: ['Grasas Saludables', 'Antioxidantes', 'Calcio'],
    frequency: 'ocasional',
    tags: ['Pasta', 'Vegetariano', 'Salsa fría'],
    learning: { technique: 'Maceración', cuts: 'Triturado', tools: 'Mortero o Procesadora', substitutes: 'Nueces en vez de piñones (más barato)' }
  },
  {
    name: 'Ñoquis con Salsa de Tomate',
    origin_country: 'Italia',
    category: 'almuerzo',
    prep_time: 20,
    cook_time: 20,
    difficulty: 2,
    cost: '$',
    servings: 2,
    calories: 420,
    protein: 10.0,
    carbs: 75.0,
    fat: 6.0,
    fiber: 5.0,
    ingredients: [
      { qty: '400', unit: 'g', name: 'Ñoquis de papa (frescos o envasados)', optional: false },
      { qty: '400', unit: 'g', name: 'Tomate triturado (passata)', optional: false },
      { qty: '1', unit: 'ud', name: 'Cebolla pequeña', optional: false },
      { qty: '1', unit: 'diente', name: 'Ajo', optional: false },
      { qty: '1', unit: 'puñado', name: 'Albahaca fresca', optional: false },
      { qty: '2', unit: 'cda', name: 'Aceite de oliva', optional: false }
    ],
    steps: [
      'Picar muy fino el ajo y la cebolla.',
      'En una sartén, sofreírlos con el aceite a fuego medio hasta que estén transparentes.',
      'Añadir el tomate triturado, sal, pimienta y unas hojas de albahaca.',
      'Dejar reducir la salsa a fuego lento durante 15 minutos.',
      'Mientras, hervir los ñoquis en abundante agua con sal. Estarán listos cuando suban a la superficie (1-2 minutos).',
      'Sacar los ñoquis con una espumadera y echarlos directamente en la sartén con la salsa.',
      'Mezclar 1 minuto y servir con parmesano.'
    ],
    tips: {
      errors: 'Hervir los ñoquis demasiado tiempo; se vuelven un puré pegajoso.',
      flavor: 'Cocinar la salsa a fuego muy lento para que espese bien.',
      variants: 'Añadir ricota fresca por encima al servir.',
      storage: 'Ideal consumir en el momento, pero duran 2 días en heladera.'
    },
    health_tags: ['Energía', 'Carbohidratos complejos'],
    frequency: 'semanal',
    tags: ['Pasta', 'Vegetariano', 'Rápido'],
    learning: { technique: 'Reducción de salsa', cuts: 'Brunoise', tools: 'Espumadera', substitutes: 'Ñoquis de calabaza por los de papa' }
  },
  {
    name: 'Berenjenas a la Parmesana',
    origin_country: 'Italia',
    category: 'cena',
    prep_time: 25,
    cook_time: 40,
    difficulty: 3,
    cost: '$$',
    servings: 4,
    calories: 360,
    protein: 18.0,
    carbs: 15.0,
    fat: 25.0,
    fiber: 6.0,
    ingredients: [
      { qty: '2', unit: 'ud', name: 'Berenjenas medianas', optional: false },
      { qty: '500', unit: 'g', name: 'Salsa de tomate casera', optional: false },
      { qty: '250', unit: 'g', name: 'Mozzarella fresca (bolas)', optional: false },
      { qty: '80', unit: 'g', name: 'Parmesano rallado', optional: false },
      { qty: '1', unit: 'puñado', name: 'Albahaca fresca', optional: false },
      { qty: '3', unit: 'cda', name: 'Aceite de oliva', optional: false }
    ],
    steps: [
      'Cortar las berenjenas en rodajas de 5mm. Salarlas y dejarlas sudar 20 min para quitarles el amargor.',
      'Secarlas bien con papel absorbente.',
      'En una plancha o sartén con unas gotas de aceite, asar las rodajas por ambos lados. (Tradicionalmente se fríen, pero asarlas es más ligero).',
      'En una fuente para horno, colocar una base de salsa de tomate, luego rodajas de berenjena, mozzarella picada, parmesano y hojas de albahaca.',
      'Repetir las capas hasta terminar, finalizando con salsa, mozzarella y parmesano.',
      'Hornear a 200°C por 30 minutos hasta que el queso esté dorado y burbujeante.'
    ],
    tips: {
      errors: 'No dejar reposar la preparación 10 minutos al salir del horno; si la cortas enseguida, se desarmará.',
      flavor: 'Usar mozzarella fior di latte muy bien escurrida.',
      variants: 'Intercalar capas con jamón cocido (aunque no es la receta original).',
      storage: 'Heladera 4 días; de hecho sabe mejor recalentada al día siguiente.'
    },
    health_tags: ['Calcio', 'Vegetales', 'Grasas Saludables'],
    frequency: 'ocasional',
    tags: ['Horno', 'Vegetariano', 'Comida Reconfortante'],
    learning: { technique: 'Desamargado de berenjenas (Purga)', cuts: 'Rodajas', tools: 'Horno', substitutes: 'Horneado en vez de fritura profunda' }
  },
  {
    name: 'Zapallitos Rellenos',
    origin_country: 'Argentina/España',
    category: 'almuerzo',
    prep_time: 15,
    cook_time: 30,
    difficulty: 2,
    cost: '$',
    servings: 2,
    calories: 250,
    protein: 20.0,
    carbs: 15.0,
    fat: 10.0,
    fiber: 5.0,
    ingredients: [
      { qty: '4', unit: 'ud', name: 'Zapallitos redondos o calabacines', optional: false },
      { qty: '200', unit: 'g', name: 'Carne picada magra (o soja texturizada)', optional: false },
      { qty: '1', unit: 'ud', name: 'Cebolla', optional: false },
      { qty: '1/2', unit: 'ud', name: 'Pimiento rojo', optional: false },
      { qty: '1', unit: 'ud', name: 'Huevo duro', optional: true },
      { qty: '2', unit: 'cda', name: 'Queso rallado para gratinar', optional: false }
    ],
    steps: [
      'Lavar los zapallitos, cortar la tapa superior y vaciar el interior con una cuchara. Reservar la pulpa picada.',
      'Blanquear (hervir) los zapallitos vacíos en agua con sal por 5 minutos. Escurrir boca abajo.',
      'En una sartén, sofreír la cebolla y el pimiento picados. Agregar la carne picada y cocinar.',
      'Añadir la pulpa de los zapallitos a la sartén. Condimentar con sal, pimienta, orégano y pimentón. Cocinar hasta evaporar el agua.',
      'Mezclar el relleno con el huevo duro picado y rellenar los zapallitos.',
      'Espolvorear queso y hornear 15 minutos a 200°C para gratinar.'
    ],
    tips: {
      errors: 'No escurrir bien los zapallitos hervidos antes de rellenar.',
      flavor: 'Se le puede agregar una cucharada de salsa blanca (bechamel) al relleno para más cremosidad.',
      variants: 'Hacerlo vegetariano con lentejas en vez de carne.',
      storage: 'Heladera 3 días, recalentan excelente.'
    },
    health_tags: ['Proteína de calidad', 'Vegetales', 'Bajo en calorías'],
    frequency: 'semanal',
    tags: ['Horno', 'Relleno', 'Carne'],
    learning: { technique: 'Blanqueado', cuts: 'Vaciado', tools: 'Olla y Horno', substitutes: 'Soja texturizada por carne' }
  },
  {
    name: 'Sopa de Verduras',
    origin_country: 'Mediterráneo',
    category: 'cena',
    prep_time: 15,
    cook_time: 40,
    difficulty: 1,
    cost: '$',
    servings: 4,
    calories: 120,
    protein: 4.0,
    carbs: 18.0,
    fat: 3.0,
    fiber: 5.0,
    ingredients: [
      { qty: '1', unit: 'ud', name: 'Cebolla', optional: false },
      { qty: '2', unit: 'ud', name: 'Zanahorias', optional: false },
      { qty: '1', unit: 'ud', name: 'Apio (rama)', optional: false },
      { qty: '1', unit: 'ud', name: 'Papa mediana', optional: false },
      { qty: '1', unit: 'ud', name: 'Puerro', optional: true },
      { qty: '100', unit: 'g', name: 'Acelga o espinaca', optional: false },
      { qty: '1.5', unit: 'L', name: 'Agua o caldo', optional: false }
    ],
    steps: [
      'Lavar, pelar y picar todas las verduras en dados pequeños (mirepoix).',
      'En una olla grande con un chorrito de aceite, rehogar la cebolla, el puerro, la zanahoria y el apio por 5 minutos.',
      'Añadir la papa cortada y el agua o caldo. Salpimentar.',
      'Llevar a ebullición y cocinar a fuego medio tapado durante 30 minutos.',
      'Cinco minutos antes de terminar, añadir las hojas de acelga cortadas finas.',
      'Servir caliente, opcionalmente con unas gotas de jugo de limón.'
    ],
    tips: {
      errors: 'Hervir el agua a borbotones todo el tiempo (rompe las verduras). Fuego medio es mejor.',
      flavor: 'Rehogar las verduras base antes de echar el agua potencia inmensamente el sabor del caldo.',
      variants: 'Añadir fideos cabello de ángel al final.',
      storage: 'Heladera 5 días, o congelar hasta 3 meses.'
    },
    health_tags: ['Hidratación', 'Vitaminas', 'Fibra'],
    frequency: 'semanal',
    tags: ['Sopas', 'Vegano', 'Olla'],
    learning: { technique: 'Mirepoix y Sofrito', cuts: 'Dados pequeños', tools: 'Olla grande', substitutes: 'Cualquier verdura de temporada' }
  },
  {
    name: 'Sopa de Garbanzos',
    origin_country: 'España (Revuelto / Potaje)',
    category: 'almuerzo',
    prep_time: 10,
    cook_time: 25,
    difficulty: 1,
    cost: '$',
    servings: 4,
    calories: 290,
    protein: 14.0,
    carbs: 40.0,
    fat: 8.0,
    fiber: 10.0,
    ingredients: [
      { qty: '400', unit: 'g', name: 'Garbanzos cocidos (lata)', optional: false },
      { qty: '150', unit: 'g', name: 'Espinacas frescas', optional: false },
      { qty: '1', unit: 'ud', name: 'Cebolla', optional: false },
      { qty: '2', unit: 'diente', name: 'Ajo', optional: false },
      { qty: '1', unit: 'cdta', name: 'Pimentón dulce (o ahumado)', optional: false },
      { qty: '1', unit: 'L', name: 'Caldo de verduras', optional: false }
    ],
    steps: [
      'Picar la cebolla y el ajo muy finos.',
      'En una olla con aceite, sofreír la cebolla y el ajo hasta dorar.',
      'Apartar la olla del fuego un momento, añadir el pimentón y remover rápido para que no se queme.',
      'Añadir inmediatamente el caldo y los garbanzos escurridos. Llevar a ebullición y cocer 15 minutos.',
      'Para espesar, se puede sacar un cucharón de garbanzos, triturarlo y volver a echarlo a la olla.',
      'Añadir las espinacas, dejar cocer 2 minutos más y apagar.'
    ],
    tips: {
      errors: 'Quemar el pimentón; da un sabor muy amargo y arruina la sopa.',
      flavor: 'Triturar una pequeña parte de los garbanzos hace que el caldo quede muy cremoso.',
      variants: 'Añadir huevo duro picado al servir.',
      storage: 'Heladera 4 días.'
    },
    health_tags: ['Proteína Vegetal', 'Fibra', 'Hierro'],
    frequency: 'varias_semana',
    tags: ['Sopas', 'Legumbres', 'Vegano'],
    learning: { technique: 'Espesado natural', cuts: 'Picado fino', tools: 'Olla', substitutes: 'Lentejas por garbanzos' }
  },
  {
    name: 'Sopa de Tomate',
    origin_country: 'Italia',
    category: 'cena',
    prep_time: 10,
    cook_time: 30,
    difficulty: 1,
    cost: '$',
    servings: 4,
    calories: 160,
    protein: 3.0,
    carbs: 15.0,
    fat: 9.0,
    fiber: 3.0,
    ingredients: [
      { qty: '1', unit: 'kg', name: 'Tomates muy maduros', optional: false },
      { qty: '1', unit: 'ud', name: 'Cebolla', optional: false },
      { qty: '2', unit: 'diente', name: 'Ajo', optional: false },
      { qty: '1', unit: 'taza', name: 'Caldo de verduras', optional: false },
      { qty: '2', unit: 'cda', name: 'Aceite de oliva', optional: false },
      { qty: '1', unit: 'puñado', name: 'Albahaca fresca', optional: false }
    ],
    steps: [
      'Cortar la cebolla y los ajos.',
      'En una olla, pochar la cebolla y los ajos con el aceite hasta que estén tiernos.',
      'Cortar los tomates en cuartos (con piel y semillas) y añadirlos a la olla. Cocinar por 10 minutos.',
      'Añadir el caldo, sal y pimienta. Dejar cocer a fuego lento tapado por 20 minutos.',
      'Añadir la albahaca fresca y triturar todo muy bien.',
      'Pasar por un pasapuré o colador fino para quitar restos de piel y semillas.'
    ],
    tips: {
      errors: 'No colar la sopa si los tomates tenían mucha piel dura.',
      flavor: 'Asar los tomates en el horno previamente le da un sabor ahumado espectacular.',
      variants: 'Servir con un chorrito de crema y crutones de pan integral.',
      storage: 'Congela perfecto o 4 días en heladera.'
    },
    health_tags: ['Licopeno', 'Antioxidantes', 'Vitamina C'],
    frequency: 'semanal',
    tags: ['Sopas', 'Vegano', 'Cena ligera'],
    learning: { technique: 'Pasapuré', cuts: 'Cuartos', tools: 'Batidora y Colador', substitutes: 'Tomates de lata enteros (pelados)' }
  },
  {
    name: 'Tostadas con Ricota y Miel',
    origin_country: 'Italia',
    category: 'desayuno',
    prep_time: 5,
    cook_time: 0,
    difficulty: 1,
    cost: '$',
    servings: 1,
    calories: 250,
    protein: 10.0,
    carbs: 35.0,
    fat: 8.0,
    fiber: 4.0,
    ingredients: [
      { qty: '2', unit: 'rebanadas', name: 'Pan integral', optional: false },
      { qty: '3', unit: 'cda', name: 'Ricota magra', optional: false },
      { qty: '1', unit: 'cdta', name: 'Miel', optional: false },
      { qty: '1', unit: 'pizca', name: 'Canela', optional: true },
      { qty: '5', unit: 'ud', name: 'Almendras fileteadas', optional: true }
    ],
    steps: [
      'Tostar las rebanadas de pan.',
      'Untar generosamente la ricota sobre las tostadas.',
      'Dejar caer un hilo fino de miel por encima.',
      'Espolvorear con canela y agregar las almendras.'
    ],
    tips: {
      errors: 'Usar pan de molde muy blando que no soporte el peso de la ricota.',
      flavor: 'Batir un poco la ricota antes con un tenedor para que quede más cremosa.',
      variants: 'Añadir rodajas de higos frescos o duraznos encima.',
      storage: 'Preparar en el momento.'
    },
    health_tags: ['Calcio', 'Energía rápida', 'Bajo en grasa'],
    frequency: 'diaria',
    tags: ['Desayuno', 'Rápido', 'Dulce'],
    learning: { technique: 'Ensamblado', cuts: 'Untado', tools: 'Tostadora', substitutes: 'Queso cottage por ricota' }
  },
  {
    name: 'Pera Asada con Nueces',
    origin_country: 'Francia/España',
    category: 'postre',
    prep_time: 10,
    cook_time: 30,
    difficulty: 1,
    cost: '$',
    servings: 2,
    calories: 180,
    protein: 2.0,
    carbs: 28.0,
    fat: 8.0,
    fiber: 5.0,
    ingredients: [
      { qty: '2', unit: 'ud', name: 'Peras grandes y maduras pero firmes', optional: false },
      { qty: '20', unit: 'g', name: 'Nueces', optional: false },
      { qty: '1', unit: 'cdta', name: 'Miel o jarabe de arce', optional: false },
      { qty: '1', unit: 'cdta', name: 'Canela', optional: false },
      { qty: '1', unit: 'cda', name: 'Yogur natural (para servir)', optional: true }
    ],
    steps: [
      'Precalentar el horno a 200°C.',
      'Lavar las peras, cortarlas a la mitad a lo largo y quitarles las semillas del centro con una cucharita.',
      'Colocarlas boca arriba en una bandeja de horno cubierta con papel manteca.',
      'Espolvorear canela, colocar nueces troceadas en el hueco de las semillas y rociar con la miel.',
      'Hornear por 25-30 minutos hasta que la pera esté muy tierna.',
      'Servir caliente, idealmente con una cucharada de yogur natural frío encima.'
    ],
    tips: {
      errors: 'Usar peras demasiado maduras; se desharán en el horno.',
      flavor: 'El contraste de calor de la pera asada con el yogur frío es espectacular.',
      variants: 'Añadir un poco de jengibre molido o cardamomo.',
      storage: 'Duran 3 días en heladera.'
    },
    health_tags: ['Postre Saludable', 'Fibra', 'Bajo IG'],
    frequency: 'ocasional',
    tags: ['Postre', 'Horno', 'Dulce natural'],
    learning: { technique: 'Asado de frutas', cuts: 'Mitades descorazonadas', tools: 'Bandeja de horno', substitutes: 'Duraznos en vez de peras (en verano)' }
  }
];

async function seedPart2() {
  console.log('Iniciando semilla de recetas mediterraneas (Parte 2)...');
  try {
    await initializeDatabase();
  } catch (e) {
    console.error('Error inicializando db:', e);
  }
  const db = getPool();
  try {
    const [users] = await db.execute('SELECT id FROM users LIMIT 1');
    if (users.length === 0) {
      console.error('No hay usuarios en la base de datos.');
      process.exit(1);
    }
    const userId = users[0].id;
    console.log('Insertando recetas para el usuario ID:', userId);

    let inserted = 0;
    for (const recipe of recipes) {
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
            userId, recipe.name, recipe.origin_country, recipe.category, recipe.prep_time, recipe.cook_time,
            recipe.difficulty, recipe.cost, recipe.servings, recipe.calories, recipe.protein, recipe.carbs,
            recipe.fat, recipe.fiber, JSON.stringify(recipe.ingredients), JSON.stringify(recipe.steps),
            JSON.stringify(recipe.tips), JSON.stringify(recipe.health_tags), recipe.frequency,
            JSON.stringify(recipe.tags), JSON.stringify(recipe.learning)
          ]
        );
        inserted++;
        console.log(`✅ Insertada: ${recipe.name}`);
      } else {
        console.log(`⚠️ Omitida (ya existe): ${recipe.name}`);
      }
    }
    
    console.log(`\n✨ Proceso 2 completado. Se insertaron ${inserted} nuevas recetas.`);
    process.exit(0);
  } catch (err) {
    console.error('Error insertando recetas:', err);
    process.exit(1);
  }
}

seedPart2();
