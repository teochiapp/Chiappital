// api/data/books_relations.js - Mapa de relaciones semánticas del Knowledge Graph

module.exports = [
  // 1. Cluster de Trading y Análisis Técnico
  {
    from: 'secrets-weinstein',
    to: 'analisis-tecnico-gregorio',
    type: 'supports',
    desc: 'Las figuras chartistas y velas japonesas confirman los puntos de ruptura y soporte/resistencia de la Etapa 2 de Weinstein'
  },
  {
    from: 'secrets-weinstein',
    to: 'nuevo-vivir-del-trading',
    type: 'extends',
    desc: 'El sistema de Triple Pantalla de Elder y la regla del 2% perfeccionan la gestión de riesgo del método de etapas de Weinstein'
  },
  {
    from: 'analisis-tecnico-gregorio',
    to: 'nuevo-vivir-del-trading',
    type: 'related_to',
    desc: 'Ambos integran chartismo clásico y osciladores para sincronizar entradas y salidas con rigor técnico'
  },
  {
    from: 'nuevo-vivir-del-trading',
    to: 'pensar-rapido-despacio',
    type: 'extends',
    desc: 'La psicología del trading y el autosabotaje emocional se explican por los sesgos del Sistema 1 y la aversión a la pérdida de Kahneman'
  },
  {
    from: 'secrets-weinstein',
    to: 'university-berkshire',
    type: 'related_to',
    desc: 'Contraste metodológico de mercado: el análisis técnico de etapas de Weinstein frente al análisis fundamental de fosos económicos de Buffett'
  },

  // 2. Cluster de Inversión Fundamental & Value Investing
  {
    from: 'intelligent-investor',
    to: 'university-berkshire',
    type: 'organizes',
    desc: 'Buffett y Munger aplican y expanden las enseñanzas fundamentales de Benjamin Graham: Mr. Market y Margen de Seguridad'
  },
  {
    from: 'university-berkshire',
    to: 'road-less-stupid',
    type: 'supports',
    desc: 'Ambos enfatizan que el éxito en los negocios y la inversión no radica en ser un genio, sino en evitar sistemáticamente cometer estupideces'
  },
  {
    from: 'intelligent-investor',
    to: 'same-as-ever',
    type: 'related_to',
    desc: 'Los ciclos de euforia y pánico en los mercados bursátiles reflejan patrones inmutables de la psicología humana'
  },
  {
    from: 'intelligent-investor',
    to: 'pensar-rapido-despacio',
    type: 'extends',
    desc: 'El comportamiento errático de Mr. Market es la manifestación colectiva de los sesgos cognitivos y la aversión al dolor'
  },
  {
    from: 'university-berkshire',
    to: 'same-as-ever',
    type: 'supports',
    desc: 'El éxito de Berkshire a lo largo de 50 años se basa en navegar la volatilidad entendiendo las constantes del comportamiento humano'
  },

  // 3. Cluster de Riqueza, Libertad Financiera e Interés Compuesto
  {
    from: 'your-money-your-life',
    to: 'almanack-naval',
    type: 'related_to',
    desc: 'Ambos redefinen el dinero no como estatus o consumo, sino como compra de libertad, tiempo y autonomía personal'
  },
  {
    from: 'your-money-your-life',
    to: 'intelligent-investor',
    type: 'supports',
    desc: 'El concepto de capital como energía vital que produce ingresos pasivos se apoya en la inversión en activos generadores de valor'
  },
  {
    from: 'almanack-naval',
    to: 'compound-effect',
    type: 'supports',
    desc: 'El apalancamiento y el capital se multiplican exponencialmente mediante el poder del interés compuesto a largo plazo'
  },
  {
    from: 'compound-effect',
    to: 'atomic-habits',
    type: 'supports',
    desc: 'Las micro-elecciones diarias consistentes son el motor subyacente que acciona el efecto compuesto'
  },
  {
    from: 'your-money-your-life',
    to: 'compound-effect',
    type: 'related_to',
    desc: 'Reducir gastos superfluos y acumular capital genera el efecto bola de nieve hacia el punto de cruce'
  },

  // 4. Cluster de Filosofía Estoica & Resiliencia
  {
    from: 'little-book-stoicism',
    to: 'daily-stoic',
    type: 'related_to',
    desc: 'Ambos libros estructuran las disciplinas de Percepción, Acción y Voluntad de la filosofía estoica antigua'
  },
  {
    from: 'daily-stoic',
    to: 'obstacle-is-the-way',
    type: 'extends',
    desc: 'La disciplina estoica de la Acción y la Voluntad se concreta en convertir cada obstáculo y adversidad en combustible para crecer'
  },
  {
    from: 'obstacle-is-the-way',
    to: 'ego-is-the-enemy',
    type: 'supports',
    desc: 'Para convertir los obstáculos en oportunidades, primero se debe domar el ego y la queja en la ambición, el éxito y el fracaso'
  },
  {
    from: 'daily-stoic',
    to: 'ego-is-the-enemy',
    type: 'related_to',
    desc: 'La humildad y la templanza estoica como antídoto directo a la arrogancia y la auto-importancia'
  },
  {
    from: 'little-book-stoicism',
    to: 'obstacle-is-the-way',
    type: 'supports',
    desc: 'La dicotomía del control es el fundamento filosófico para transformar obstáculos en oportunidades de virtud'
  },
  {
    from: 'almanack-naval',
    to: 'daily-stoic',
    type: 'related_to',
    desc: 'La paz mental como habilidad interior y la renuncia al deseo constante se inspiran directamente en la filosofía estoica'
  },

  // 5. Cluster de Hábitos, Enfoque y Neuroproductividad
  {
    from: 'atomic-habits',
    to: 'deep-work',
    type: 'supports',
    desc: 'Los sistemas y rituales de hábitos atómicos son la base práctica para sostener bloques ininterrumpidos de trabajo profundo'
  },
  {
    from: 'deep-work',
    to: 'eat-that-frog',
    type: 'supports',
    desc: 'Comerse el sapo primero y aplicar el principio 80/20 exige bloques de máxima intensidad cognitiva sin distracciones superficiales'
  },
  {
    from: 'atomic-habits',
    to: 'hackea-tu-cerebro',
    type: 'supports',
    desc: 'La neuroplasticidad, los circuitos de recompensa dopaminérgica y la poda sináptica explican la ciencia biológica de los hábitos'
  },
  {
    from: 'hackea-tu-cerebro',
    to: 'fitness-mindset',
    type: 'supports',
    desc: 'El descanso en ciclos REM de 90 min y la nutrición metabólica proveen la energía neurobiológica para aprender y rendir'
  },
  {
    from: 'atomic-habits',
    to: 'eat-that-frog',
    type: 'related_to',
    desc: 'El método ABCDE y la regla de no romper la cadena optimizan la ejecución diaria sin postergación'
  },
  {
    from: 'almanack-naval',
    to: 'deep-work',
    type: 'supports',
    desc: 'El juicio y la dirección de alto impacto requieren bloques continuos de trabajo cognitivo profundo'
  },

  // 6. Cluster de Poder, Influencia & Dinámicas Sociales
  {
    from: '48-laws-of-power',
    to: 'win-friends',
    type: 'contradicts',
    desc: 'Carnegie promueve la empatía genuina y la calidez sincera, mientras Greene expone el lado estratégico y la cautela ante el ego y la envidia'
  },
  {
    from: 'win-friends',
    to: 'surrounded-by-idiots',
    type: 'supports',
    desc: 'La empatía y la influencia interpersonal requieren adaptar el mensaje y el ritmo al perfil de comportamiento DISC de cada persona'
  },
  {
    from: '48-laws-of-power',
    to: 'ego-is-the-enemy',
    type: 'related_to',
    desc: 'El error más fatal en el juego del poder (Ley 1: eclipsar al maestro, o la grandiosidad) nace directamente del ego descontrolado'
  },

  // 7. Cluster de Toma de Decisiones & Modelos Mentales
  {
    from: 'road-less-stupid',
    to: 'pensar-rapido-despacio',
    type: 'supports',
    desc: 'El Thinking Time de Cunningham fuerza al cerebro a apagar el impulsivo Sistema 1 y activar el analítico Sistema 2'
  },
  {
    from: 'road-less-stupid',
    to: 'same-as-ever',
    type: 'related_to',
    desc: 'Comprender los sesgos inmutables de la naturaleza humana permite blindar las decisiones de negocios contra errores catastróficos'
  },
  {
    from: 'road-less-stupid',
    to: 'deep-work',
    type: 'supports',
    desc: 'La disciplina del Thinking Time requiere aislamiento y enfoque cognitivo profundo sin interrupciones'
  },

  // 8. Relaciones con Notas Preexistentes (The Laws of Human Nature - ID 8)
  {
    from: '48-laws-of-power',
    toExternalId: 8,
    type: 'organizes',
    desc: 'Las 48 leyes del poder y las 18 leyes de la naturaleza humana forman la síntesis maestra de Robert Greene sobre la conducta humana'
  },
  {
    from: 'pensar-rapido-despacio',
    toExternalId: 8,
    type: 'supports',
    desc: 'Los sesgos cognitivos del Sistema 1 sustentan empíricamente la Ley 1 de la irracionalidad de Robert Greene'
  },
  {
    from: 'same-as-ever',
    toExternalId: 8,
    type: 'related_to',
    desc: 'Los comportamientos humanos inmutables a través de la historia reflejan las leyes profundas de la naturaleza humana'
  },
  {
    from: 'daily-stoic',
    toExternalId: 8,
    type: 'related_to',
    desc: 'La aceptación de la mortalidad (Memento Mori / Ley 18) y la serenidad estoica atraviesan toda la obra de Greene'
  }
];
