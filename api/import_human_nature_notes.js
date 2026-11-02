// Chiappital/api/import_human_nature_notes.js
const fs = require('fs');
const path = require('path');
require('./node_modules/dotenv').config({ path: path.join(__dirname, '.env.local') });
const { getPool, initializeDatabase } = require('./database/db');

const USER_ID = 1;

// ─── Directorio de destino para los archivos optimizados en disco ─────────────
const optimizedDir = path.resolve(__dirname, '../notion/The Laws of Human Nature/optimized');
if (!fs.existsSync(optimizedDir)) {
  fs.mkdirSync(optimizedDir, { recursive: true });
}

// ─── Definición estructurada y optimizada de las 18 Leyes + Master Hub ────────
const lawsData = [
  {
    order: 0,
    title: 'The Laws of Human Nature — Master Hub (Robert Greene)',
    filename: '00 - The Laws of Human Nature - Master Hub.md',
    tags: ['human-nature', 'psychology', 'robert-greene', 'mental-models', 'self-mastery'],
    categoryName: 'The Laws of Human Nature',
    content: `# The Laws of Human Nature — Master Hub
*Autor:* **Robert Greene** | *Categoría:* **Psicología & Modelos Mentales**

> [!NOTE]
> **Tesis Central del Libro:**
> Somos animales sociales gobernados por fuerzas psicológicas inconscientes, arcaicas y emocionales. Creer que somos puramente racionales es la mayor ilusión. La verdadera maestría y libertad provienen de convertirnos en observadores lúcidos de la naturaleza humana —primero en nosotros mismos, y luego en los demás.

---

## 🗺️ Mapa Temático del Libro

Las 18 leyes se dividen en 4 dimensiones fundamentales de la experiencia humana:

### 1. Autodominio & Dinámicas Internas (El Yo Profundo)
* [[01 - The Law of Irrationality]]: Dominar el ser emocional y contrarrestar sesgos cognitivos.
* [[04 - The Law of Compulsive Behavior]]: Evaluar la fuerza del carácter más allá de la reputación superficial.
* [[08 - The Law of Self-Sabotage]]: Cambiar las circunstancias cambiando la actitud mental.
* [[09 - The Law of Repression]]: Integrar la Sombra inconsciente y la energía asertiva.
* [[11 - The Law of Grandiosity]]: Mantener el contacto con la realidad y neutralizar el ego post-éxito.
* [[13 - The Law of Aimlessness]]: Avanzar con un sentido de propósito vital (*Calling*).

### 2. Empatía & Relaciones Interpersonales (El Otro)
* [[02 - The Law of Narcissism]]: Transformar el auto-amor en empatía profunda y escucha activa.
* [[03 - The Law of Role-Playing]]: Leer el lenguaje no verbal y ver a través de las máscaras sociales.
* [[05 - The Law of Covetousness]]: Convertirse en objeto elusivo del deseo mediante la ausencia estratégica.
* [[07 - The Law of Defensiveness]]: Suavizar la resistencia confirmando la auto-opinión del prójimo.
* [[10 - The Law of Envy]]: Detectar el ego frágil, el schadenfreude y transformar la envidia en admiración.
* [[12 - The Law of Gender Rigidity]]: Reconectar con el contragénero interno (*Ánima / Ánimus*).

### 3. Dinámicas de Grupo, Poder & Sociedad
* [[14 - The Law of Conformity]]: Resistir la presión despersonalizadora y el pensamiento tribal de grupo.
* [[15 - The Law of Fickleness]]: Liderar con autoridad moral, visión lejana y ecuanimidad emocional.
* [[16 - The Law of Aggression]]: Identificar agresores sofisticados y canalizar la asertividad productivamente.
* [[17 - The Law of Generational Myopia]]: Comprender el espíritu de la época (*Zeitgeist*) y los ciclos históricos.

### 4. Perspectiva Temporal & Dimensión Existencial
* [[06 - The Law of Shortsightedness]]: Elevar la perspectiva, evitar la gratificación inmediata y prever efectos de segundo orden.
* [[18 - The Law of Death Denial]]: Meditar en la mortalidad común (*Memento Mori*) y abrazar el *Amor Fati*.

---

## 🔗 Conexión con otros Módulos de Conocimiento
* **Inversiones & Trading:** [[Psicología del Inversor y Sesgos Cognitivos]] conecta directamente con las Leyes 1, 6, 8 y 11 (FOMO, sesgo de confirmación, codicia y pánico).
* **Filosofía Personal:** Los conceptos de Pericles, Marco Aurelio, Séneca y Nietzsche (*Amor Fati*) atraviesan todo el compendio.
`
  },
  {
    order: 1,
    title: '01 - The Law of Irrationality: Master Your Emotional Self',
    filename: '01 - The Law of Irrationality.md',
    tags: ['human-nature', 'psychology', 'irrationality', 'cognitive-biases', 'self-mastery'],
    categoryName: 'The Laws of Human Nature',
    content: `# 01 - The Law of Irrationality: Master Your Emotional Self
*Las Leyes de la Naturaleza Humana — Robert Greene*

> [!IMPORTANT]
> **Ley Fundamental:**
> En gran medida desconocemos cuánto dominan nuestras emociones nuestras decisiones. La racionalidad no es un estado natural; es una facultad que debe ser deliberadamente cultivada mediante la introspección y la pausa consciente.

---

## 🧠 Claves de la Naturaleza Humana
* **La Ilusión de Racionalidad:** Las personas racionales no son inmunes a las emociones; la diferencia radica en que son conscientes de ellas, analizan sus causas y logran postergar la reacción hasta recuperar el pensamiento claro.
* **Patrones en la Vida:** Las personas irracionales se delatan por patrones destructivos recurrentes: proyectos inconclusos, conflictos innecesarios, búsqueda constante de culpables y deseos de cambio que jamás cristalizan en acciones concretas.

---

## ⚠️ Paso 1: Reconocer los Sesgos Cognitivos Subyacentes
1. **Sesgo de Confirmación (*Confirmation Bias*):**
   * Creemos evaluar objetivamente la evidencia, pero solo buscamos datos que validen lo que ya queremos creer.
   * *Regla:* Nunca aceptes la validez de una idea solo porque alguien te presente "estudios" o "pruebas"; en internet siempre hay evidencia para ambos lados.
2. **Sesgo de Apariencia (*Appearance Bias*):**
   * Juzgamos a las personas no como son, sino como nos parecen. Asumimos que la gente atractiva o exitosa es moral, competente y confiable.
3. **Sesgo de Grupo (*The Group Bias*):**
   * Nos creemos independientes y no conformistas, cuando en realidad adoptamos inadvertidamente los dogmas del grupo social con el que nos identificamos.
4. **Sesgo de Culpa (*The Blame Bias*):**
   * Es doloroso mirar nuestros propios errores porque amenaza nuestro ego y superioridad moral. La respuesta natural e irracional es culpar a circunstancias externas o a terceros.
5. **Sesgo de Superioridad (*Superiority Bias*):**
   * La convicción casi universal de que *"yo soy más racional, ético y objetivo que el promedio"*.

---

## 🔥 Paso 2: Factores Inflamatorios que Destruyen la Razón
* **Éxito o Ganancias Súbitas:** Provocan una sobreestimación peligrosa de nuestras capacidades. El éxito duradero solo proviene del trabajo constante.
  * *Solución:* Ante ganancias extraordinarias o euforia, contrapesa deliberadamente con una dosis rigurosa de escepticismo y prudencia.
* **Presión y Estrés Extremo:** Bajo amenaza, las partes primitivas del cerebro (amígdala) secuestran el cortex prefrontal. Observa a la gente en crisis para conocer su verdadero carácter.

---

## 🛠️ Paso 3: Estrategias Prácticas para Despertar el Yo Racional
* **Conócete a fondo:** Rastrea tus emociones hasta sus raíces infantiles o de inseguridad.
* **Aumenta tu tiempo de reacción (*Pause Button*):** Entrénate para jamás responder en caliente. Cada hora de demora multiplica la perspectiva y neutraliza el impulso.
* **Acepta a la gente como hechos de la realidad:** Dejar de desear que los demás sean como tú quisieras. Míralos como piezas de un rompecabezas o una comedia humana fascinante.
* **La Metáfora del Jinete y el Caballo (Griegos):**
  * El caballo representa el apetito, la energía vital y la emoción: salvaje y poderoso.
  * El jinete es la mente reflexiva. Sin el jinete, el caballo se despeña; sin el caballo, el jinete no se mueve. La meta es la alineación perfecta entre ambos.

---

## 🔗 Conexiones en el Grafo
* [[00 - The Laws of Human Nature - Master Hub]]
* [[06 - The Law of Shortsightedness]]
* [[08 - The Law of Self-Sabotage]]
* [[14 - The Law of Conformity]]
* [[Psicología del Inversor y Sesgos Cognitivos]]
`
  },
  {
    order: 2,
    title: '02 - The Law of Narcissism: Transform Self-Love into Empathy',
    filename: '02 - The Law of Narcissism.md',
    tags: ['human-nature', 'psychology', 'narcissism', 'empathy', 'social-skills'],
    categoryName: 'The Laws of Human Nature',
    content: `# 02 - The Law of Narcissism: Transform Self-Love into Empathy
*Las Leyes de la Naturaleza Humana — Robert Greene*

> [!IMPORTANT]
> **Ley Fundamental:**
> Todos poseemos una inclinación natural hacia el auto-ensimismamiento. El instrumento más poderoso de conexión y poder social es la **empatía activa**: dirigir la curiosidad hacia afuera para entrar en la mente y motivaciones de los demás.

---

## 🧭 El Espectro del Narcisismo
* **El Aislamiento Tecnológico:** La continua interrupción de smartphones y redes sociales amplifica el narcisismo defensivo, impidiéndonos sintonizar con la realidad interior ajena.
* **Cada Persona es un País Desconocido:** Acércate a cada individuo como un explorador ante una geografía psicológica única y fascinante.

---

## 🎯 Principios para Cultivar la Empatía Profunda
1. **Invierte el Impulso de Hablar:**
   * En lugar de esperar tu turno para opinar o contar tu historia, entrena el deseo genuino de comprender la perspectiva ajena.
2. **Escucha con Calidad & Espejado (*Mirroring*):**
   * Refleja de vuelta con tus propias palabras lo que la otra persona expresó (o lo que intuyes que sintió pero no verbalizó).
   * *Advertencia:* El espejado debe ser sutil y respetuoso; si es forzado, resulta invasivo o manipulador.
3. **Aceptación Incondicional del Carácter Propio:**
   * La empatía hacia los demás requiere primero reconciliarte con tus propios defectos y vulnerabilidades.
4. **Sintonía con el Tono Emocional:**
   * Presta atención al lenguaje no verbal y al tono de voz: detecta si la música de sus palabras coincide con su contenido verbal.

---

## 💬 Citas & Máximas
> *"No me agrada ese hombre; debo conocerlo mejor."*
> — **Abraham Lincoln**

> *"El principio más profundo de la naturaleza humana es el anhelo ardiente de ser apreciado."*
> — **William James**

---

## 🔗 Conexiones en el Grafo
* [[00 - The Laws of Human Nature - Master Hub]]
* [[03 - The Law of Role-Playing]]
* [[07 - The Law of Defensiveness]]
* [[10 - The Law of Envy]]
`
  },
  {
    order: 3,
    title: '03 - The Law of Role-Playing: See Through People’s Masks',
    filename: '03 - The Law of Role-Playing.md',
    tags: ['human-nature', 'psychology', 'body-language', 'persuasion', 'masks'],
    categoryName: 'The Laws of Human Nature',
    content: `# 03 - The Law of Role-Playing: See Through People’s Masks
*Las Leyes de la Naturaleza Humana — Robert Greene*

> [!IMPORTANT]
> **Ley Fundamental:**
> En sociedad todos usamos máscaras que nos muestran bajo la mejor luz posible (seguros, humildes, colaboradores). Tomar las apariencias por realidades nos vuelve vulnerables al engaño y a la manipulación.

---

## 🎭 Claves para Decodificar el Comportamiento No Verbal
1. **Microexpresiones & Fugas Involuntarias (*Leakage*):**
   * Cuando la gente dice "sí" pero siente "no", la discrepancia se filtra en muecas de microsegundos, tensión en la mandíbula o rigidez corporal.
   * Las verdaderas emociones se escapan especialmente bajo fatiga, estrés, frustración, enojo o tras consumir alcohol.
2. **Dilatación de Pupilas & Contacto Visual:**
   * Las pupilas se dilatan automáticamente cuando algo nos gusta o nos hace sentir cómodos. Aprende a observar sutilmente este detalle.
3. **Sonrisa Genuina vs. Sonrisa Social:**
   * La sonrisa real compromete los ojos (músculo orbicular) y surge de forma espontánea; la forzada solo mueve la boca y desaparece abruptamente.
4. **La Voz como Revelador Inconsciente:**
   * El tono y la cadencia expresan excitación, reserva o hostilidad con mucha mayor precisión que las palabras elegidas.

---

## 🎩 Gestión de la Impresión Propia (*Impression Management*)
* **Jugar el Rol Adecuado:** Conoce el código social del entorno y proyéctalo con relajación y soltura (la verdadera confianza relaja el rostro).
* **Ausencia Estratégica:** Si eres demasiado predecible o estás siempre disponible, pierdes misterio y valor social. Saber dosificar tu presencia genera atracción y respeto.

---

## 🔗 Conexiones en el Grafo
* [[00 - The Laws of Human Nature - Master Hub]]
* [[02 - The Law of Narcissism]]
* [[05 - The Law of Covetousness]]
* [[09 - The Law of Repression]]
* [[16 - The Law of Aggression]]
`
  },
  {
    order: 4,
    title: '04 - The Law of Compulsive Behavior: Determine the Strength of Character',
    filename: '04 - The Law of Compulsive Behavior.md',
    tags: ['human-nature', 'psychology', 'character', 'habits', 'toxic-types'],
    categoryName: 'The Laws of Human Nature',
    content: `# 04 - The Law of Compulsive Behavior: Determine the Strength of Character
*Las Leyes de la Naturaleza Humana — Robert Greene*

> [!IMPORTANT]
> **Ley Fundamental:**
> El carácter de una persona se forja en sus primeros años y en sus hábitos cotidianos. Es lo que la empuja a repetir patrones de conducta una y otra vez. **"La gente nunca hace algo solo una vez: inevitablemente lo repetirá."**

---

## 🏛️ Carácter vs. Reputación
* No son dioses ni el destino quienes nos dominan, sino nuestro propio carácter.
* Si alguien posterga tareas menores, postergará compromisos cruciales. Si se irrita ante pequeños contratiempos, colapsará en las crisis reales.
* *"Si quieres poner a prueba el carácter de un hombre, dale poder."* — El poder no cambia a las personas; simplemente desinhibe lo que siempre fueron.

---

## ⚠️ Tipos Tóxicos para Aprender a Detectar y Evitar
1. **El Hiper-perfeccionista:** Necesidad neurótica de control; incapaz de delegar; sofoca la iniciativa ajena.
2. **El Rebelde Compulsivo:** Se rebela por hábito y vanidad, no por ideales; incapaz de construir instituciones o sostener estructuras.
3. **El Personalizador:** Todo comentario o situación lo asume como un ataque deliberado hacia su persona; vive en perpetuo agravio.
4. **El Imán de Dramas:** Crea caos inconscientemente para ser el centro de atención; agota emocionalmente a su entorno.
5. **El Gran Charlatán (*Big Talker*):** Fascinante narrador de planes colosales, pero huye o inventa excusas cuando se le exigen resultados medibles.
6. **El Complaciente (*The Pleaser*):** Amabilidad exagerada y halagos empalagosos que encubren envidia o temor patológico al conflicto.

---

## 🔗 Conexiones en el Grafo
* [[00 - The Laws of Human Nature - Master Hub]]
* [[08 - The Law of Self-Sabotage]]
* [[11 - The Law of Grandiosity]]
* [[16 - The Law of Aggression]]
`
  },
  {
    order: 5,
    title: '05 - The Law of Covetousness: Become an Elusive Object of Desire',
    filename: '05 - The Law of Covetousness.md',
    tags: ['human-nature', 'psychology', 'desire', 'absence-presence', 'seduction'],
    categoryName: 'The Laws of Human Nature',
    content: `# 05 - The Law of Covetousness: Become an Elusive Object of Desire
*Las Leyes de la Naturaleza Humana — Robert Greene*

> [!IMPORTANT]
> **Ley Fundamental:**
> La presencia y la ausencia tienen efectos primarios en la mente humana. Demasiada presencia asfixia y devalúa; un grado de ausencia estimula la imaginación y el deseo de posesión.

---

## 💎 El Misterio como Motor del Deseo
* **La Ilusión de lo Prohibido o Inalcanzable:** Lo que está fácilmente disponible pierde valor instantáneamente. Codiciamos lo que otros poseen o lo que parece estar fuera de nuestro alcance.
* **El Caso de Coco Chanel:** Creó un imperio de moda entendiendo que la elegancia radica en la sustracción y la exclusividad, provocando que las clientas desearan fervientemente aquello que no se les ofrecía de inmediato.

---

## 🎯 Estrategias para Volverse un Objeto Elusivo
1. **Crea un Aura de Misterio:** No expongas todos tus pensamientos, logros o vida personal. Deja espacios en blanco para que los demás proyecten sus fantasías.
2. **Retírate en el Momento Culminante:** Concluye reuniones o conversaciones antes de que decaiga el interés, dejando al interlocutor deseando más.
3. **Asociación con Valores Elevados:** Vincula tus creaciones o presencia a causas o ideales que trasciendan lo meramente transaccional.

---

## 🔗 Conexiones en el Grafo
* [[00 - The Laws of Human Nature - Master Hub]]
* [[03 - The Law of Role-Playing]]
* [[10 - The Law of Envy]]
* [[15 - The Law of Fickleness]]
`
  },
  {
    order: 6,
    title: '06 - The Law of Shortsightedness: Elevate Your Perspective',
    filename: '06 - The Law of Shortsightedness.md',
    tags: ['human-nature', 'psychology', 'perspective', 'long-term-thinking', 'decision-making'],
    categoryName: 'The Laws of Human Nature',
    content: `# 06 - The Law of Shortsightedness: Elevate Your Perspective
*Las Leyes de la Naturaleza Humana — Robert Greene*

> [!IMPORTANT]
> **Ley Fundamental:**
> Nuestra naturaleza primitiva nos predispone a reaccionar ante lo inmediato y buscar gratificación instantánea. Elevar la perspectiva hacia el largo plazo es la ventaja competitiva más decisiva en la vida y los negocios.

---

## 🔭 Pensamiento Lineal vs. Pensamiento Sistémico
* **La Falacia de Causa y Efecto Simple:** En la vida real, una acción $A$ rara vez produce únicamente el resultado $B$. Desencadena una red de efectos dominó e implicancias de segundo y tercer orden.
* **El Peligro de Apagar Incendios Constantes:** Quien vive reaccionando a la última notificación o crisis superficial pierde el control de su trayectoria y termina trabajando para los objetivos de otros.

---

## 🛠️ Prácticas para Elevar la Mirada
1. **Pausar antes de Actuar en Crisis:** Cuando el entorno entre en histeria colectiva o euforia de mercado, da un paso atrás y evalúa el panorama a 5 y 10 años.
2. **Priorizar Consecuencias de Segundo Orden:** Pregúntate siempre: *"¿Y después de esto, qué pasa?"*
3. **El Valor de la Paciencia Estratégica:** Las victorias más sólidas requieren sembrar sin exigir frutos en el corto plazo.

---

## 🔗 Conexiones en el Grafo
* [[00 - The Laws of Human Nature - Master Hub]]
* [[01 - The Law of Irrationality]]
* [[13 - The Law of Aimlessness]]
* [[17 - The Law of Generational Myopia]]
* [[18 - The Law of Death Denial]]
`
  },
  {
    order: 7,
    title: '07 - The Law of Defensiveness: Soften People’s Resistance',
    filename: '07 - The Law of Defensiveness.md',
    tags: ['human-nature', 'psychology', 'persuasion', 'communication', 'influence'],
    categoryName: 'The Laws of Human Nature',
    content: `# 07 - The Law of Defensiveness: Soften People’s Resistance
*Las Leyes de la Naturaleza Humana — Robert Greene*

> [!IMPORTANT]
> **Ley Fundamental:**
> La vida es hostil y las personas viven a la defensiva. Intentar convencerlas atacando sus ideas genera un cierre inmediato. Para persuadir, debes confirmar su auto-opinión y hacer que sientan que actúan con total autonomía.

---

## 🛡️ Las Tres Auto-Opiniones Universales
Casi todo ser humano cree firmemente de sí mismo:
1. *"Soy autónomo y actúo por mi propia voluntad."*
2. *"Soy inteligente a mi manera."*
3. *"Soy fundamentalmente una persona buena y decente."*

Si tus palabras o críticas amenazan cualquiera de estos tres pilares, levantarás una muralla impenetrable.

---

## 🎯 5 Estrategias para Convertirte en un Maestro Persuasor
1. **Transformarte en un Oyente Profundo:**
   * La mayoría de la gente oye solo para responder con su propia anécdota. Deja que el otro sea la estrella del show.
   * Mantén contacto visual sereno y valida sus reflexiones con tus propias palabras.
2. **Infectar con el Estado de Ánimo Adecuado:**
   * La aceptación incondicional desarma cualquier hostilidad.
3. **Confirmar su Sentido de Competencia e Inteligencia:**
   * Pide consejo: pedir la opinión de alguien envía el poderoso mensaje implícito de que respetas su sabiduría.
4. **Aliviar sus Inseguridades Ocultas:**
   * Elogia el esfuerzo y la perseverancia, no el talento innato. Todos quieren sentir que su éxito fue ganado con mérito.
5. **Aprovechar la Resistencia y la Terquedad:**
   * Guía las conversaciones para que la conclusión deseada parezca una idea nacida de ellos mismos.

---

## 🔗 Conexiones en el Grafo
* [[00 - The Laws of Human Nature - Master Hub]]
* [[02 - The Law of Narcissism]]
* [[03 - The Law of Role-Playing]]
* [[15 - The Law of Fickleness]]
`
  },
  {
    order: 8,
    title: '08 - The Law of Self-Sabotage: Change Your Circumstances by Changing Your Attitude',
    filename: '08 - The Law of Self-Sabotage.md',
    tags: ['human-nature', 'psychology', 'mindset', 'self-sabotage', 'resilience'],
    categoryName: 'The Laws of Human Nature',
    content: `# 08 - The Law of Self-Sabotage: Change Your Circumstances by Changing Your Attitude
*Las Leyes de la Naturaleza Humana — Robert Greene*

> [!IMPORTANT]
> **Ley Fundamental:**
> Nuestra actitud frente a la vida no es un reflejo pasivo de los hechos, sino una lente activa que moldea la realidad. Una actitud temerosa y hostil genera profecías autocumplidas de fracaso; una actitud expansiva crea oportunidades de la nada.

---

## 🧩 La Conexión Mente-Cuerpo
* El cuerpo y la mente forman un único sistema indivisible. Los pensamientos derrotistas secretan química de estrés y fatiga, mientras que el propósito firme acelera la recuperación y el vigor físico.
* Quien espera traición o rechazo en cada interacción, adopta inconscientemente un lenguaje corporal distante y arisco que provoca exactamente el rechazo que temía.

---

## 💬 Citas Clave
> *"El mayor descubrimiento de mi generación es el hecho de que los seres humanos pueden alterar sus vidas alterando sus actitudes mentales."*
> — **William James**

---

## 🛠️ Transición hacia una Actitud Expansiva
* **Adopta la Mente de Principiante:** Reemplaza la rigidez defensiva por la curiosidad activa ante los contratiempos.
* **El Obstáculo es el Maestro:** Todo error o rechazo contiene datos empíricos invaluables para calibrar la siguiente acción.

---

## 🔗 Conexiones en el Grafo
* [[00 - The Laws of Human Nature - Master Hub]]
* [[01 - The Law of Irrationality]]
* [[04 - The Law of Compulsive Behavior]]
* [[13 - The Law of Aimlessness]]
`
  },
  {
    order: 9,
    title: '09 - The Law of Repression: Confront Your Dark Side (The Shadow)',
    filename: '09 - The Law of Repression.md',
    tags: ['human-nature', 'psychology', 'the-shadow', 'repression', 'jung'],
    categoryName: 'The Laws of Human Nature',
    content: `# 09 - The Law of Repression: Confront Your Dark Side (The Shadow)
*Las Leyes de la Naturaleza Humana — Robert Greene*

> [!IMPORTANT]
> **Ley Fundamental:**
> En el proceso de socialización reprimimos nuestros impulsos agresivos, egoístas o ambiciosos. Estos no desaparecen: se sumergen en el inconsciente formando **La Sombra** (*The Shadow*). Ignorarla nos vuelve hipócritas, pasivo-agresivos y vulnerables a explosiones destructivas.

---

## 🌑 Signos de la Sombra no Integrada
* **Moralismo Agresivo:** Quienes condenan con más furia pública ciertos pecados ajenos suelen estar combatiendo desesperadamente ese mismo impulso en su interior.
* **Resentimiento Pasivo:** La incapacidad de decir "no" abiertamente se transforma en procrastinación, sabotajes indirectos o sarcasmo corrosivo.
* **Atracción hacia lo Auténtico:** Nos fascinan las personas que aceptan sus sombras sin fingimiento, porque añoramos la espontaneidad perdida de la infancia.

---

## ⚡ Integración de la Energía de la Sombra
1. **Acepta tus Flaws y Ríete de Ti Mismo:** El sentido del humor y la auto-ironía son la mejor vacuna contra la rigidez moralista.
2. **Aprende a Ser Asertivo:** Quien siempre es complaciente paga un costo psíquico enorme. Empieza a defender tus posturas con calma y firmeza.
3. **Despreocúpate de Agradar a Todos:** Sentirás una inmensa liberación al aceptar que discrepar y marcar límites firmes es sano y necesario.
4. **Canaliza la Agresión en el Trabajo y el Arte:** La ambición y la agresividad bien orientadas son el combustible indispensable para obras maestras y proyectos de gran envergadura.

---

## 🔗 Conexiones en el Grafo
* [[00 - The Laws of Human Nature - Master Hub]]
* [[03 - The Law of Role-Playing]]
* [[12 - The Law of Gender Rigidity]]
* [[16 - The Law of Aggression]]
`
  },
  {
    order: 10,
    title: '10 - The Law of Envy: Beware the Fragile Ego',
    filename: '10 - The Law of Envy.md',
    tags: ['human-nature', 'psychology', 'envy', 'schadenfreude', 'relationships'],
    categoryName: 'The Laws of Human Nature',
    content: `# 10 - The Law of Envy: Beware the Fragile Ego
*Las Leyes de la Naturaleza Humana — Robert Greene*

> [!IMPORTANT]
> **Ley Fundamental:**
> El ser humano se evalúa por comparación continua. Cuando la comparación genera frustración e inferioridad, se desata la **envidia**: una emoción dolorosa que rara vez se admite y que suele esconderse detrás de falsas sonrisas y sabotajes sutiles.

---

## 👁️ La Dinámica Oculta de la Envidia
* **La Paradoja de la Amistad:** La envidia ocurre con mayor virulencia entre iguales y supuestos amigos, no hacia figuras lejanas.
* **El Test de la Buena y la Mala Noticia:**
  * Al compartir un logro extraordinario, el envidioso revela microexpresiones de tensión, forzando la felicitación.
  * Al compartir un problema o desgracia, el envidioso muestra un brillo efímero de alivio o regocijo en los ojos (*Schadenfreude*).

---

## 💬 Citas Clave
> *"Cada vez que un amigo tiene éxito, una parte de mí muere."*
> — **Gore Vidal**

---

## 🛡️ Estrategias de Manejo y Transformación
1. **Desviar la Envidia Ajena con Auto-desprecio Moderado:** Comparte tus fracasos pasados, errores y la cuota de suerte que tuviste para no herir egos frágiles.
2. **Transformar la Envidia en Emulación Positiva:** Si alguien destaca en algo que valoras, úsalo como inspiración para elevar tu propio nivel técnico en vez de intentar derribarlo.
3. **Celebrar la Grandeza Ajena:** La admiración sincera es el antídoto definitivo de la envidia: reconoce el mérito sin sentir que disminuye tu propio valor.

---

## 🔗 Conexiones en el Grafo
* [[00 - The Laws of Human Nature - Master Hub]]
* [[02 - The Law of Narcissism]]
* [[05 - The Law of Covetousness]]
* [[11 - The Law of Grandiosity]]
`
  },
  {
    order: 11,
    title: '11 - The Law of Grandiosity: Know Your Limits',
    filename: '11 - The Law of Grandiosity.md',
    tags: ['human-nature', 'psychology', 'grandiosity', 'ego', 'humility'],
    categoryName: 'The Laws of Human Nature',
    content: `# 11 - The Law of Grandiosity: Know Your Limits
*Las Leyes de la Naturaleza Humana — Robert Greene*

> [!IMPORTANT]
> **Ley Fundamental:**
> Tras un éxito notable, tendemos a inflar nuestra auto-imagen y atribuirnos todo el mérito, olvidando el papel de la suerte, el timing y la ayuda ajena. Esta grandiosidad nos desconecta de la realidad y conduce a catástrofes inevitables.

---

## 🪽 El Síndrome de Ícaro
* **La Ilusión del Toque Dorado:** Cuando las cosas salen bien, imaginamos poseer un talento infalible. Desoímos críticas, abandonamos la disciplina que nos llevó a la cima y nos creemos expertos en campos que desconocemos.
* **La Ilusión de la Facilidad Digital:** La cultura contemporánea alimenta la creencia de que se puede dominar cualquier disciplina en pocas semanas mediante trucos y atajos. La maestría real exige años de inmersión y fracasos.

---

## 🛡️ Salvaguardas contra la Grandiosidad
1. **Desarmar el Éxito Post-Mortem:** Tras cada victoria, haz un inventario honesto del factor suerte, el momento del mercado y los mentores o colaboradores clave.
2. **Enfocarse en Metas Acotadas y Retos Concretos:** Canaliza tu energía en proyectos que puedas medir en meses y que exijan destreza técnica tangible.
3. **Aceptar los Propios Límites:** No puedes ser excelente en todo. El autoconocimiento real consiste en saber con precisión qué no sabes hacer.

---

## 🔗 Conexiones en el Grafo
* [[00 - The Laws of Human Nature - Master Hub]]
* [[04 - The Law of Compulsive Behavior]]
* [[10 - The Law of Envy]]
* [[14 - The Law of Conformity]]
`
  },
  {
    order: 12,
    title: '12 - The Law of Gender Rigidity: Reconnect to the Countergender',
    filename: '12 - The Law of Gender Rigidity.md',
    tags: ['human-nature', 'psychology', 'gender-rigidity', 'jung', 'creativity'],
    categoryName: 'The Laws of Human Nature',
    content: `# 12 - The Law of Gender Rigidity: Reconnect to the Countergender
*Las Leyes de la Naturaleza Humana — Robert Greene*

> [!IMPORTANT]
> **Ley Fundamental:**
> Todos poseemos cualidades tanto masculinas (enfoque, asertividad, rigor analítico) como femeninas (empatía, intuición, pensamiento holístico). La rigidez de aferrarnos a un único rol empobrece nuestro pensamiento y creatividad.

---

## ☯️ La Danza del Ánima y el Ánimus (Carl Jung)
* La polarización forzada hacia una hiper-masculinidad o hiper-feminidad defensiva genera personalidades estereotipadas y frágiles.
* Las mentes más brillantes de la historia supieron integrar ambos polos: el rigor lógico para estructurar ideas, combinado con la sensibilidad intuitiva para captar matices emocionales y tendencias sutiles.

---

## 🎨 Aplicación Práctica
* Si tiendes al análisis frío y lineal, ejercita la contemplación de patrones amplios y la empatía relacional.
* Si tiendes a la dispersión intuitiva o emocional, cultiva la disciplina del método, la concentración sostenida y el pensamiento crítico implacable.

---

## 🔗 Conexiones en el Grafo
* [[00 - The Laws of Human Nature - Master Hub]]
* [[02 - The Law of Narcissism]]
* [[09 - The Law of Repression]]
`
  },
  {
    order: 13,
    title: '13 - The Law of Aimlessness: Advance with a Sense of Purpose',
    filename: '13 - The Law of Aimlessness.md',
    tags: ['human-nature', 'psychology', 'purpose', 'calling', 'mastery'],
    categoryName: 'The Laws of Human Nature',
    content: `# 13 - The Law of Aimlessness: Advance with a Sense of Purpose
*Las Leyes de la Naturaleza Humana — Robert Greene*

> [!IMPORTANT]
> **Ley Fundamental:**
> Sin un sentido claro de propósito y dirección vital, somos arrastrados por las corrientes del momento, las modas pasajeras y las opiniones ajenas. El propósito (*Calling*) es la brújula que protege nuestra energía y nos confiere resiliencia inquebrantable.

---

## 🧭 El Vacío de la Falta de Rumbo
* La deriva existencial genera aburrimiento crónico y vulnerabilidad a adicciones, distracciones superficiales o falsos profetas.
* Quien tiene un propósito claro utiliza los contratiempos no como desgracias personales, sino como material de aprendizaje para perfeccionar su oficio.

---

## 🛠️ Cómo Cultivar tu Sentido de Propósito
1. **Reconecta con tus Inclinaciones Primarias:** Aquellas actividades infantiles o juveniles que absorbían tu atención durante horas sin esfuerzo aparente.
2. **Resiste los Falsos Propósitos:** Búsqueda exclusiva de dinero, fama o aprobación paterna. Estos conducen inevitablemente al desencanto y al vacío.
3. **Adopta una Trayectoria de Maestría a Largo Plazo:** Comprométete con un dominio específico donde puedas construir habilidades acumulativas irremplazables.

---

## 🔗 Conexiones en el Grafo
* [[00 - The Laws of Human Nature - Master Hub]]
* [[06 - The Law of Shortsightedness]]
* [[08 - The Law of Self-Sabotage]]
* [[18 - The Law of Death Denial]]
`
  },
  {
    order: 14,
    title: '14 - The Law of Conformity: Resist the Downward Pull of the Group',
    filename: '14 - The Law of Conformity.md',
    tags: ['human-nature', 'psychology', 'conformity', 'groupthink', 'tribalism'],
    categoryName: 'The Laws of Human Nature',
    content: `# 14 - The Law of Conformity: Resist the Downward Pull of the Group
*Las Leyes de la Naturaleza Humana — Robert Greene*

> [!IMPORTANT]
> **Ley Fundamental:**
> Al ingresar en un grupo, nuestra psicología muta: el pensamiento crítico individual disminuye y emerge la presión inconsciente hacia el conformismo y la lealtad tribal. Proteger la independencia de criterio exige una vigilancia constante.

---

## 👥 La Mente Colectiva & Pensamiento Grupal (*Groupthink*)
* **La Simplificación Afectiva:** Los grupos no operan con matices ni análisis profundos; piensan en términos dicotómicos de "buenos contra malos", "con nosotros o contra nosotros".
* **El Miedo al Rechazo:** Nos aterra ser excluidos o juzgados por la manada, lo que nos lleva a autocensurarnos y defender dogmas que individualmente cuestionaríamos.

---

## 🛡️ Cómo Mantener la Autonomía en Sociedades de Masas
1. **Vigilancia Interior en Entornos Grupales:** Observa cómo cambia tu lenguaje corporal y tus opiniones cuando estás en una asamblea o reunión masiva.
2. **Cultivar la Soledad Reflexiva:** Aparta tiempo a solas para auditar tus creencias y verificar si son genuinamente tuyas o implantadas por tu entorno.
3. **El Coraje de la Herejía Intelectual:** Valora la verdad y los datos empíricos por encima de la comodidad de la aprobación colectiva.

---

## 🔗 Conexiones en el Grafo
* [[00 - The Laws of Human Nature - Master Hub]]
* [[01 - The Law of Irrationality]]
* [[15 - The Law of Fickleness]]
* [[17 - The Law of Generational Myopia]]
`
  },
  {
    order: 15,
    title: '15 - The Law of Fickleness: Make Them Want to Follow You (Leadership)',
    filename: '15 - The Law of Fickleness.md',
    tags: ['human-nature', 'psychology', 'leadership', 'power', 'authority'],
    categoryName: 'The Laws of Human Nature',
    content: `# 15 - The Law of Fickleness: Make Them Want to Follow You (Leadership)
*Las Leyes de la Naturaleza Humana — Robert Greene*

> [!IMPORTANT]
> **Ley Fundamental:**
> La actitud de las masas hacia sus líderes es profundamente ambivalente: desean ser guiadas pero resienten la subordinación. Ante la menor señal de debilidad o torpeza, se volverán contra el líder. La autoridad duradera se conquista mediante el ejemplo, la ecuanimidad y el servicio al grupo.

---

## 👑 El Arte del Liderazgo Verdadero
* **Visión a Largo Plazo:** El rol primordial de un líder es ofrecer un horizonte claro que los demás no pueden vislumbrar por estar atrapados en el presente inmediato.
* **Liderar con el Ejemplo y la Autodisciplina:** Si exiges sacrificio y rigor, debes ser el primero en practicarlos visiblemente.
* **Aislamiento Emocional Estratégico:** Nunca reacciones con indignación o histeria pública ante las críticas; conserva la calma mayestática y la firmeza serena.

---

## 🔗 Conexiones en el Grafo
* [[00 - The Laws of Human Nature - Master Hub]]
* [[07 - The Law of Defensiveness]]
* [[14 - The Law of Conformity]]
* [[16 - The Law of Aggression]]
`
  },
  {
    order: 16,
    title: '16 - The Law of Aggression: See the Hostility Behind the Friendly Façade',
    filename: '16 - The Law of Aggression.md',
    tags: ['human-nature', 'psychology', 'aggression', 'assertiveness', 'power'],
    categoryName: 'The Laws of Human Nature',
    content: `# 16 - The Law of Aggression: See the Hostility Behind the Friendly Façade
*Las Leyes de la Naturaleza Humana — Robert Greene*

> [!IMPORTANT]
> **Ley Fundamental:**
> En el fondo, todos los seres humanos albergamos una dosis inherente de energía agresiva y territorial. La ingenuidad de creer que todos son benevolentes nos convierte en víctimas propicias para agresores sofisticados.

---

## 🦈 Agresores Primitivos vs. Agresores Sofisticados
* **El Agresor Primitivo:** Explota con facilidad ante ofensas menores, recurre a la intimidación burda y termina autodestruyéndose por falta de autocontrol.
* **El Agresor Sofisticado (Ej. John D. Rockefeller):** Oculta sus maniobras detrás de una fachada afable, filantrópica o cooperativa. Explota la aversión de los demás al conflicto para desgastarlos pacientemente y ganar posiciones irreversibles.

---

## ⚡ Canalizar la Asertividad Controlada
1. **Reconocer tu Propia Agresividad:** No la reprimas; encamínala hacia la tenacidad implacable en tus proyectos y metas.
2. **Marcar Límites Tempranos:** Los agresores tantean el terreno con pequeñas transgresiones. Si no respondes con firmeza inmediata, intensificarán su avance.

---

## 🔗 Conexiones en el Grafo
* [[00 - The Laws of Human Nature - Master Hub]]
* [[03 - The Law of Role-Playing]]
* [[09 - The Law of Repression]]
* [[15 - The Law of Fickleness]]
`
  },
  {
    order: 17,
    title: '17 - The Law of Generational Myopia: Seize the Historical Moment',
    filename: '17 - The Law of Generational Myopia.md',
    tags: ['human-nature', 'psychology', 'generations', 'zeitgeist', 'history'],
    categoryName: 'The Laws of Human Nature',
    content: `# 17 - The Law of Generational Myopia: Seize the Historical Moment
*Las Leyes de la Naturaleza Humana — Robert Greene*

> [!IMPORTANT]
> **Ley Fundamental:**
> Cada generación está moldeada por el clima emocional y los eventos traumáticos de su juventud (*Zeitgeist*). Solemos juzgar el mundo creyendo que los valores de nuestra época son universales. La verdadera conciencia histórica implica trascender la miopía generacional.

---

## ⏳ El Péndulo Generacional
* Las generaciones jóvenes reaccionan visceralmente contra los excesos o debilidades de sus predecesores, creando movimientos oscilatorios pendulares a lo largo de la historia.
* A medida que envejecemos, corremos el riesgo de cerrar la mente y asumir actitudes sentenciosas hacia la juventud.

---

## 💬 Citas Clave
> *"Los defectos de un hombre pertenecen a su época; sus virtudes y su grandeza le pertenecen a él mismo."*
> — **Johann Wolfgang von Goethe**

---

## 🛠️ Práctica: Trascender tu Época
* Si eres joven, busca dialogar y aprender con mentes veteranas que han visto ciclos enteros nacer y morir.
* Si eres mayor, interactúa con la juventud como un par curioso, desprendiéndote de la arrogancia de creer que "en mis tiempos todo era mejor".

---

## 🔗 Conexiones en el Grafo
* [[00 - The Laws of Human Nature - Master Hub]]
* [[06 - The Law of Shortsightedness]]
* [[14 - The Law of Conformity]]
`
  },
  {
    order: 18,
    title: '18 - The Law of Death Denial: Meditate on Our Common Mortality (Memento Mori)',
    filename: '18 - The Law of Death Denial.md',
    tags: ['human-nature', 'psychology', 'memento-mori', 'amor-fati', 'existentialism'],
    categoryName: 'The Laws of Human Nature',
    content: `# 18 - The Law of Death Denial: Meditate on Our Common Mortality (Memento Mori)
*Las Leyes de la Naturaleza Humana — Robert Greene*

> [!IMPORTANT]
> **Ley Fundamental:**
> Vivimos negando la realidad ineludible de la muerte, lo que nos adormece en una existencia tibia y llena de preocupaciones mezquinas. Integrar la certeza de la muerte despierta una urgencia vital sublime y nos conecta con una empatía cósmica hacia todo ser vivo.

---

## 💀 La Muerte como Clarificador Supremo
* **El Plazo Definitivo (*The Ultimate Deadline*):** La conciencia de la brevedad de la vida concentra la mente, desvanece el miedo al juicio ajeno y nos empuja a culminar lo verdaderamente importante.
* **Igualdad Esencial:** Ante la muerte, todas las jerarquías de riqueza, poder o vanidad se disuelven. Ver la fragilidad en los demás suaviza la hostilidad y profundiza el amor.

---

## 🌟 Amor Fati & Lo Sublime
> *"Mi fórmula para la grandeza en el ser humano es el amor fati: no querer que nada sea diferente, ni en el futuro ni en el pasado, ni por toda la eternidad. No solo soportar lo necesario... sino amarlo."*
> — **Friedrich Nietzsche**

* **Apertura a lo Sublime:** Contemplar la inmensidad del cosmos, la naturaleza indómita o el paso del tiempo es el antídoto contra la queja cotidiana.

---

## 🔗 Conexiones en el Grafo
* [[00 - The Laws of Human Nature - Master Hub]]
* [[06 - The Law of Shortsightedness]]
* [[08 - The Law of Self-Sabotage]]
* [[13 - The Law of Aimlessness]]
`
  }
];

// ─── Lógica de Inserción en Base de Datos ──────────────────────────────────────
async function main() {
  console.log('🚀 Iniciando optimización e importación de Las Leyes de la Naturaleza Humana...');
  await initializeDatabase();
  const db = getPool();

  // 1. Asegurar o crear la categoría específica "The Laws of Human Nature"
  let categoryId;
  const [existingCat] = await db.query(
    'SELECT id FROM knowledge_categories WHERE user_id = ? AND name = ?',
    [USER_ID, 'The Laws of Human Nature']
  );

  if (existingCat.length > 0) {
    categoryId = existingCat[0].id;
    console.log(`📁 Categoría existente encontrada: ID ${categoryId}`);
  } else {
    // Vincular al Área 3: Personal Development (o 5: Books & Learning) con parent_id 13 (Psychology)
    const [catRes] = await db.query(
      `INSERT INTO knowledge_categories (user_id, area_id, parent_id, name, description, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        USER_ID,
        3, // Personal Development
        13, // Subcategoría de Psychology
        'The Laws of Human Nature',
        'Modelos mentales, psicología profunda y leyes de conducta humana de Robert Greene',
        1
      ]
    );
    categoryId = catRes.insertId;
    console.log(`✅ Nueva categoría creada: "The Laws of Human Nature" (ID ${categoryId})`);
  }

  // 2. Gestionar tags en knowledge_tags
  const allTags = new Set();
  lawsData.forEach(l => l.tags.forEach(t => allTags.add(t)));
  const tagMap = new Map(); // tagName -> tagId

  for (const tagName of allTags) {
    const [tagRows] = await db.query(
      'SELECT id FROM knowledge_tags WHERE user_id = ? AND name = ?',
      [USER_ID, tagName]
    );
    if (tagRows.length > 0) {
      tagMap.set(tagName, tagRows[0].id);
    } else {
      const colors = ['#8b5cf6', '#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const [newTag] = await db.query(
        'INSERT INTO knowledge_tags (user_id, name, color) VALUES (?, ?, ?)',
        [USER_ID, tagName, randomColor]
      );
      tagMap.set(tagName, newTag.insertId);
    }
  }
  console.log(`🏷️ ${tagMap.size} tags listos y mapeados.`);

  // 3. Insertar / Actualizar las Notas y guardar archivos en disco
  const noteMap = new Map(); // order -> noteId

  for (const law of lawsData) {
    // Guardar archivo optimizado en disco
    const filePath = path.join(optimizedDir, law.filename);
    fs.writeFileSync(filePath, law.content, 'utf8');

    // Verificar si ya existe una nota con ese título
    const [existingNote] = await db.query(
      'SELECT id FROM knowledge_notes WHERE user_id = ? AND title = ?',
      [USER_ID, law.title]
    );

    let noteId;
    if (existingNote.length > 0) {
      noteId = existingNote[0].id;
      await db.query(
        `UPDATE knowledge_notes 
         SET content = ?, primary_category_id = ?, updated_at = NOW() 
         WHERE id = ?`,
        [law.content, categoryId, noteId]
      );
      console.log(`🔄 Nota actualizada: [${law.order}] "${law.title}" (ID ${noteId})`);
    } else {
      const [insertRes] = await db.query(
        `INSERT INTO knowledge_notes 
         (user_id, title, content, content_format, primary_category_id, note_type, status, is_favorite, pinned)
         VALUES (?, ?, ?, 'markdown', ?, 'permanent', 'active', ?, ?)`,
        [USER_ID, law.title, law.content, categoryId, law.order === 0 ? 1 : 0, law.order === 0 ? 1 : 0]
      );
      noteId = insertRes.insertId;
      console.log(`📝 Nota creada: [${law.order}] "${law.title}" (ID ${noteId})`);
    }

    noteMap.set(law.order, noteId);

    // Asociar a áreas: Área 3 (Personal Development) y Área 5 (Books & Learning)
    await db.query('DELETE FROM knowledge_note_areas WHERE note_id = ?', [noteId]);
    await db.query('INSERT IGNORE INTO knowledge_note_areas (note_id, area_id) VALUES (?, 3), (?, 5)', [noteId, noteId]);

    // Asociar tags
    await db.query('DELETE FROM knowledge_note_tags WHERE note_id = ?', [noteId]);
    for (const tagName of law.tags) {
      const tagId = tagMap.get(tagName);
      if (tagId) {
        await db.query('INSERT IGNORE INTO knowledge_note_tags (note_id, tag_id) VALUES (?, ?)', [noteId, tagId]);
      }
    }
  }

  // 4. Crear relaciones bidireccionales en knowledge_relations para el Grafo
  console.log('🕸️ Creando relaciones explícitas en el grafo...');
  const hubId = noteMap.get(0);

  // Helper para insertar relación
  async function addRelation(srcId, tgtId, type, desc) {
    if (!srcId || !tgtId || srcId === tgtId) return;
    try {
      await db.query(
        `INSERT INTO knowledge_relations (user_id, source_note_id, target_note_id, relation_type, origin, description)
         VALUES (?, ?, ?, ?, 'manual', ?)
         ON DUPLICATE KEY UPDATE description = VALUES(description)`,
        [USER_ID, srcId, tgtId, type, desc]
      );
    } catch (e) {
      // Ignorar duplicados
    }
  }

  // A. El Master Hub se conecta con TODAS las 18 leyes
  for (let i = 1; i <= 18; i++) {
    const lawId = noteMap.get(i);
    if (lawId) {
      await addRelation(hubId, lawId, 'organizes', `Leyes de la Naturaleza Humana: Ley ${i}`);
    }
  }

  // B. Relaciones inter-leyes temáticas
  const interRelations = [
    [1, 6, 'related_to', 'Irracionalidad y miopía temporal comparten raíces emocionales'],
    [1, 8, 'related_to', 'El sesgo y la irracionalidad alimentan el auto-sabotaje'],
    [1, 14, 'related_to', 'El sesgo de grupo es la base del conformismo de masas'],
    [2, 3, 'related_to', 'El narcisismo utiliza máscaras sociales defensivas'],
    [2, 7, 'related_to', 'La auto-opinión narcisista genera reactividad defensiva'],
    [2, 10, 'related_to', 'El ego frágil oscila entre la vanidad y la envidia'],
    [3, 9, 'related_to', 'Las máscaras ocultan la Sombra reprimida'],
    [3, 16, 'related_to', 'La cortesía excesiva enmascara la agresión sofisticada'],
    [4, 8, 'related_to', 'El carácter compulsivo perpetúa patrones de auto-sabotaje'],
    [4, 11, 'related_to', 'El carácter no integrado sucumbe a la grandiosidad tras el éxito'],
    [5, 10, 'related_to', 'La codicia de lo ajeno y la envidia comparten la comparación social'],
    [5, 15, 'related_to', 'La ausencia estratégica y el misterio sostienen la autoridad del líder'],
    [6, 13, 'related_to', 'La visión a largo plazo requiere un propósito vital firme'],
    [6, 17, 'related_to', 'La miopía temporal se manifiesta a escala histórica y generacional'],
    [6, 18, 'related_to', 'La perspectiva más elevada nace de contemplar la finitud de la vida'],
    [7, 15, 'related_to', 'Un líder sabio suaviza la resistencia validando a su gente'],
    [8, 13, 'related_to', 'La falta de propósito acelera el auto-sabotaje'],
    [9, 12, 'related_to', 'Reprimir el contragénero mutila la expresión de la psique'],
    [9, 16, 'related_to', 'La agresión reprimida alimenta resentimiento pasivo o destructivo'],
    [10, 11, 'related_to', 'La grandiosidad despierta la envidia hostil del entorno'],
    [13, 18, 'related_to', 'El Memento Mori otorga urgencia visceral al propósito'],
    [14, 15, 'related_to', 'El líder debe navegar la volatilidad y el conformismo de la masa'],
    [14, 17, 'related_to', 'El espíritu de grupo define la mentalidad de cada época']
  ];

  for (const [s, t, rel, desc] of interRelations) {
    const sId = noteMap.get(s);
    const tId = noteMap.get(t);
    if (sId && tId) {
      await addRelation(sId, tId, rel, desc);
    }
  }

  // C. Vincular Ley 1 con la nota preexistente de Psicología del Inversor (ID 4)
  const law1Id = noteMap.get(1);
  if (law1Id) {
    await addRelation(law1Id, 4, 'extends', 'Los sesgos de confirmación y superioridad explican los errores en el trading');
  }

  console.log(`\n🎉 PROCESO COMPLETADO CON ÉXITO:`);
  console.log(`📁 19 Archivos Markdown optimizados guardados en: ${optimizedDir}`);
  console.log(`📚 19 Notas insertadas/actualizadas en Knowledge Hub`);
  console.log(`🕸️ Decenas de relaciones semánticas agregadas al Knowledge Graph`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error fatal en importador:', err);
  process.exit(1);
});
