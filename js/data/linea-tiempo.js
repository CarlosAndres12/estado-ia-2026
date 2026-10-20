/* js/data/linea-tiempo.js — sesión 0, the AI timeline 1950–2026 (#s0, js/ui/linea-tiempo.js).
 * The 24 milestones are copied literally from base_linea_del_tiempo/linea_tiempo_evolucion_IA_1950_2026.csv
 * (one object per row, in file order); tools/check-content.mjs compares them field by field with the CSV.
 * Edit the CSV and this file together.
 *
 * EIA.data.lineaTiempo = {
 *   csv, titulo, kicker, lead, intro: { narracion }, ui: { … chrome strings },
 *   eras: [{ id, titulo, subtitulo }],
 *   hitos: [{ id, era, fecha, hito, actores, lugar, avance, importancia, fuente, nota, narracion }]
 * }
 *   fecha … nota   the CSV columns Fecha, Hito, Organización/personas, Lugar/contexto, Descripción del avance
 *                  técnico, Importancia histórica, Fuente de verificación (one or more URLs joined by " ; ")
 *                  and Nota de verificación, verbatim
 *   narracion      the narrated line (assets/audio/s0/<id>.mp3, captions in assets/audio/s0/manifest.js),
 *                  composed only from that row's own text: no other facts or figures
 *   id             the deep link #s0/<id> and the audio file name
 * Era titles come from the timeline poster in base_linea_del_tiempo/Untitled.jpg. */
EIA.data.lineaTiempo = {
  csv: 'base_linea_del_tiempo/linea_tiempo_evolucion_IA_1950_2026.csv',
  titulo: 'Línea del tiempo de la IA',
  kicker: 'Sesión 0',
  lead: 'Veinticuatro hitos de la inteligencia artificial, de 1950 a 2026. Selecciona un hito para leer su ficha y escuchar su narración.',
  intro: {
    narracion: 'Esta línea del tiempo recorre 24 hitos de la inteligencia artificial, de 1950 a 2026: del Test de Turing a la IA multimodal, física y gobernada. Selecciona un hito para escuchar su historia.'
  },
  ui: {
    nav: 'Línea del tiempo de la IA',
    pista: 'Hitos de la línea del tiempo',
    pistaAyuda: 'Usa las flechas izquierda y derecha para recorrer los hitos; Enter o Espacio selecciona y reproduce.',
    controles: 'Controles de la línea del tiempo',
    anterior: 'Hito anterior',
    siguiente: 'Hito siguiente',
    reproducirTodo: 'Reproducir todo',
    detenerTodo: 'Detener',
    escuchar: 'Escuchar',
    pausar: 'Pausar',
    introduccion: 'Escuchar la introducción',
    posicion: 'Hito {n} de {total}',
    seleccionado: '{fecha} · {hito}',
    subtitulos: 'Subtítulos',
    sinAudio: 'Audio no disponible: se muestran solo los subtítulos.',
    campos: {
      actores: 'Organización/personas',
      lugar: 'Lugar/contexto',
      avance: 'Descripción del avance técnico',
      importancia: 'Importancia histórica',
      fuente: 'Fuente de verificación',
      nota: 'Nota de verificación'
    },
    fuenteDe: 'CSV de la línea del tiempo del curso'
  },
  eras: [
    { id: 'fundamentos', titulo: 'De los fundamentos a los primeros logros', subtitulo: '1950–2011' },
    { id: 'generativa', titulo: 'De la IA generativa a la era agéntica', subtitulo: '2016–2026' }
  ],
  hitos: [
    {
      id: 'test-de-turing',
      era: 'fundamentos',
      fecha: '1950',
      hito: 'Test de Turing',
      actores: 'Alan Turing',
      lugar: 'Reino Unido',
      avance: 'Propone evaluar si una máquina puede producir respuestas indistinguibles de las de una persona en una conversación.',
      importancia: 'Plantea una pregunta fundacional sobre la inteligencia de las máquinas.',
      fuente: 'https://doi.org/10.1093/mind/LIX.236.433',
      nota: 'Artículo original: Computing Machinery and Intelligence.',
      narracion: '1950, Test de Turing. Alan Turing propone evaluar si una máquina puede producir respuestas indistinguibles de las de una persona en una conversación. Plantea una pregunta fundacional sobre la inteligencia de las máquinas.'
    },
    {
      id: 'dartmouth',
      era: 'fundamentos',
      fecha: '1956',
      hito: 'Conferencia de Dartmouth',
      actores: 'John McCarthy, Marvin Minsky, Nathaniel Rochester, Claude Shannon y otros',
      lugar: 'Dartmouth College, EE. UU.',
      avance: 'Taller de investigación que contribuye a consolidar la inteligencia artificial como campo de estudio y populariza el término.',
      importancia: 'Punto de referencia institucional para el nacimiento del campo moderno de IA.',
      fuente: 'https://home.dartmouth.edu/about/artificial-intelligence-ai-coined-dartmouth',
      nota: 'Fuente institucional de Dartmouth.',
      narracion: '1956, Conferencia de Dartmouth. Taller de investigación que contribuye a consolidar la inteligencia artificial como campo de estudio y populariza el término. Punto de referencia institucional para el nacimiento del campo moderno de IA.'
    },
    {
      id: 'lisp',
      era: 'fundamentos',
      fecha: '1958',
      hito: 'Lisp y programación simbólica',
      actores: 'John McCarthy',
      lugar: 'MIT, EE. UU.',
      avance: 'McCarthy desarrolla Lisp, un lenguaje para manipular símbolos que se vuelve fundamental en la investigación temprana de IA.',
      importancia: 'Proporciona herramientas para representar conocimiento y construir sistemas simbólicos.',
      fuente: 'https://www-formal.stanford.edu/jmc/recursive.html',
      nota: 'Precisión: la cronología original menciona SLIP; el hito más reconocido de McCarthy en 1958 es Lisp. SLIP fue un lenguaje distinto.',
      narracion: '1958, Lisp y programación simbólica. McCarthy desarrolla Lisp, un lenguaje para manipular símbolos que se vuelve fundamental en la investigación temprana de IA. Proporciona herramientas para representar conocimiento y construir sistemas simbólicos.'
    },
    {
      id: 'eliza',
      era: 'fundamentos',
      fecha: '1964–1967',
      hito: 'ELIZA',
      actores: 'Joseph Weizenbaum',
      lugar: 'MIT, EE. UU.',
      avance: 'Programa pionero de procesamiento del lenguaje natural que simula conversaciones mediante reglas y patrones; el guion DOCTOR imitaba una entrevista terapéutica.',
      importancia: 'Ilustra la simulación del diálogo y el riesgo de atribuir comprensión humana a un sistema.',
      fuente: 'https://news.mit.edu/2008/obit-weizenbaum-0410',
      nota: 'Fuente institucional del MIT.',
      narracion: 'Entre 1964 y 1967, ELIZA, de Joseph Weizenbaum. Programa pionero de procesamiento del lenguaje natural que simula conversaciones mediante reglas y patrones. Ilustra la simulación del diálogo y el riesgo de atribuir comprensión humana a un sistema.'
    },
    {
      id: 'shakey',
      era: 'fundamentos',
      fecha: '1972',
      hito: 'SHAKEY',
      actores: 'SRI International',
      lugar: 'Estados Unidos',
      avance: 'Robot móvil experimental que combina percepción, planificación y movimiento para realizar tareas en un entorno controlado.',
      importancia: 'Precursor de la robótica autónoma basada en percepción y planificación.',
      fuente: 'https://www.sri.com/hoi/shakey-the-robot/',
      nota: 'Fuente institucional de SRI.',
      narracion: '1972, SHAKEY, de SRI International. Robot móvil experimental que combina percepción, planificación y movimiento para realizar tareas en un entorno controlado. Precursor de la robótica autónoma basada en percepción y planificación.'
    },
    {
      id: 'deep-blue',
      era: 'fundamentos',
      fecha: '1997',
      hito: 'Deep Blue derrota a Garry Kasparov',
      actores: 'IBM; Garry Kasparov',
      lugar: 'Nueva York, EE. UU.',
      avance: 'El sistema de ajedrez de IBM vence al campeón mundial en una competición de seis partidas.',
      importancia: 'Demuestra la potencia de búsqueda y cálculo especializado en un dominio estratégico.',
      fuente: 'https://www.ibm.com/history/deep-blue',
      nota: 'Distinguir la victoria de 1997 del enfrentamiento de 1996, que Kasparov ganó.',
      narracion: '1997, Deep Blue derrota a Garry Kasparov. El sistema de ajedrez de IBM vence al campeón mundial en una competición de seis partidas. Demuestra la potencia de búsqueda y cálculo especializado en un dominio estratégico.'
    },
    {
      id: 'stanley',
      era: 'fundamentos',
      fecha: '2005',
      hito: 'STANLEY gana el DARPA Grand Challenge',
      actores: 'Equipo de Stanford dirigido por Sebastian Thrun',
      lugar: 'Desierto de Mojave, EE. UU.',
      avance: 'Vehículo autónomo que completa el recorrido del desafío de DARPA en un entorno desértico no estructurado.',
      importancia: 'Impulsa la investigación en percepción, planificación y navegación autónoma.',
      fuente: 'https://robots.stanford.edu/papers/thrun.stanley05.pdf',
      nota: 'Artículo técnico del equipo de Stanford.',
      narracion: '2005, STANLEY gana el DARPA Grand Challenge. Vehículo autónomo que completa el recorrido del desafío de DARPA en un entorno desértico no estructurado. Impulsa la investigación en percepción, planificación y navegación autónoma.'
    },
    {
      id: 'watson',
      era: 'fundamentos',
      fecha: '2011',
      hito: 'IBM Watson gana Jeopardy!',
      actores: 'IBM',
      lugar: 'Estados Unidos',
      avance: 'Sistema de preguntas y respuestas que compite con campeones humanos en un concurso basado en pistas en lenguaje natural.',
      importancia: 'Muestra avances en recuperación de información, análisis lingüístico y respuesta a preguntas.',
      fuente: 'https://www.ibm.com/history/watson',
      nota: 'Fuente histórica oficial de IBM.',
      narracion: '2011, IBM Watson gana Jeopardy. Sistema de preguntas y respuestas que compite con campeones humanos en un concurso basado en pistas en lenguaje natural. Muestra avances en recuperación de información, análisis lingüístico y respuesta a preguntas.'
    },
    {
      id: 'alphago',
      era: 'generativa',
      fecha: '2016',
      hito: 'AlphaGo derrota a Lee Sedol',
      actores: 'Google DeepMind; Lee Sedol',
      lugar: 'Seúl, Corea del Sur',
      avance: 'Sistema de Go que combina redes neuronales profundas, búsqueda de árbol y aprendizaje por refuerzo; vence 4–1 en marzo de 2016.',
      importancia: 'Hito en aprendizaje por refuerzo y juegos de alta complejidad combinatoria.',
      fuente: 'https://doi.org/10.1038/nature16961',
      nota: 'Artículo en Nature; la victoria pública ocurrió en marzo de 2016.',
      narracion: '2016, AlphaGo derrota a Lee Sedol. Sistema de Go que combina redes neuronales profundas, búsqueda de árbol y aprendizaje por refuerzo; vence 4–1 en marzo de 2016. Hito en aprendizaje por refuerzo y juegos de alta complejidad combinatoria.'
    },
    {
      id: 'transformer',
      era: 'generativa',
      fecha: '2017',
      hito: 'Transformer',
      actores: 'Equipo de investigación de Google',
      lugar: 'Investigación en aprendizaje automático',
      avance: 'Arquitectura basada en atención que modela secuencias sin recurrencia como mecanismo principal.',
      importancia: 'Base técnica de numerosos modelos modernos de lenguaje y sistemas multimodales.',
      fuente: 'https://arxiv.org/abs/1706.03762',
      nota: 'Artículo original: Attention Is All You Need.',
      narracion: '2017, Transformer, del equipo de investigación de Google. Arquitectura basada en atención que modela secuencias sin recurrencia como mecanismo principal. Base técnica de numerosos modelos modernos de lenguaje y sistemas multimodales.'
    },
    {
      id: 'bert',
      era: 'generativa',
      fecha: '2018',
      hito: 'BERT',
      actores: 'Google',
      lugar: 'Estados Unidos',
      avance: 'Modelo preentrenado con representaciones bidireccionales que mejora tareas de comprensión textual.',
      importancia: 'Populariza el preentrenamiento contextual para tareas de lenguaje natural.',
      fuente: 'https://arxiv.org/abs/1810.04805',
      nota: 'Artículo técnico original.',
      narracion: '2018, BERT, de Google. Modelo preentrenado con representaciones bidireccionales que mejora tareas de comprensión textual. Populariza el preentrenamiento contextual para tareas de lenguaje natural.'
    },
    {
      id: 'gpt',
      era: 'generativa',
      fecha: '2018',
      hito: 'GPT inicial',
      actores: 'OpenAI',
      lugar: 'Estados Unidos',
      avance: 'Presenta el preentrenamiento generativo de modelos de lenguaje seguido de adaptación a tareas posteriores.',
      importancia: 'Precursor de la familia GPT y de modelos generativos de gran escala.',
      fuente: 'https://openai.com/index/language-unsupervised/',
      nota: 'Publicación técnica: Improving Language Understanding by Generative Pre-Training.',
      narracion: '2018, GPT inicial, de OpenAI. Presenta el preentrenamiento generativo de modelos de lenguaje seguido de adaptación a tareas posteriores. Precursor de la familia GPT y de modelos generativos de gran escala.'
    },
    {
      id: 'gpt-3',
      era: 'generativa',
      fecha: '2020',
      hito: 'GPT-3',
      actores: 'OpenAI',
      lugar: 'Estados Unidos',
      avance: 'Modelo de lenguaje de gran escala que demuestra aprendizaje de tareas mediante instrucciones y ejemplos en el contexto.',
      importancia: 'Acelera el interés en modelos de propósito general y aprendizaje few-shot.',
      fuente: 'https://arxiv.org/abs/2005.14165',
      nota: 'Artículo original: Language Models are Few-Shot Learners.',
      narracion: '2020, GPT-3, de OpenAI. Modelo de lenguaje de gran escala que demuestra aprendizaje de tareas mediante instrucciones y ejemplos en el contexto. Acelera el interés en modelos de propósito general y aprendizaje few-shot.'
    },
    {
      id: 'dall-e',
      era: 'generativa',
      fecha: '2021',
      hito: 'DALL·E',
      actores: 'OpenAI',
      lugar: 'Estados Unidos',
      avance: 'Modelo que genera imágenes a partir de descripciones textuales.',
      importancia: 'Hace más visible la generación de imágenes condicionada por lenguaje natural.',
      fuente: 'https://openai.com/index/dall-e/',
      nota: 'Anuncio oficial del modelo original en enero de 2021.',
      narracion: '2021, DALL·E, de OpenAI. Modelo que genera imágenes a partir de descripciones textuales. Hace más visible la generación de imágenes condicionada por lenguaje natural.'
    },
    {
      id: 'stable-diffusion',
      era: 'generativa',
      fecha: '2022',
      hito: 'Stable Diffusion',
      actores: 'Stability AI y colaboradores',
      lugar: 'Ecosistema de modelos de difusión',
      avance: 'Modelo de generación de imágenes basado en difusión latente cuyos pesos se distribuyeron públicamente.',
      importancia: 'Amplía el acceso a la generación de imágenes y a la experimentación comunitaria.',
      fuente: 'https://arxiv.org/abs/2112.10752',
      nota: 'Artículo técnico sobre síntesis de imágenes; el lanzamiento público de Stable Diffusion fue en 2022.',
      narracion: '2022, Stable Diffusion, de Stability AI y colaboradores. Modelo de generación de imágenes basado en difusión latente cuyos pesos se distribuyeron públicamente. Amplía el acceso a la generación de imágenes y a la experimentación comunitaria.'
    },
    {
      id: 'chatgpt',
      era: 'generativa',
      fecha: '2022',
      hito: 'ChatGPT',
      actores: 'OpenAI',
      lugar: 'Producto conversacional',
      avance: 'Interfaz conversacional basada en modelos generativos, optimizada para seguir instrucciones y dialogar con usuarios.',
      importancia: 'Populariza el acceso público a la IA generativa mediante lenguaje natural.',
      fuente: 'https://openai.com/index/chatgpt/',
      nota: 'Anuncio oficial de noviembre de 2022.',
      narracion: '2022, ChatGPT, de OpenAI. Interfaz conversacional basada en modelos generativos, optimizada para seguir instrucciones y dialogar con usuarios. Populariza el acceso público a la IA generativa mediante lenguaje natural.'
    },
    {
      id: 'gpt-4',
      era: 'generativa',
      fecha: '2023',
      hito: 'GPT-4',
      actores: 'OpenAI',
      lugar: 'Estados Unidos',
      avance: 'Modelo que acepta texto e imágenes como entrada, con disponibilidad variable según producto, y mejora el desempeño en múltiples tareas.',
      importancia: 'Expande capacidades multimodales y de rendimiento general.',
      fuente: 'https://openai.com/index/gpt-4-research/',
      nota: 'Fuente oficial; no confundir capacidad anunciada con disponibilidad simultánea en todos los productos.',
      narracion: '2023, GPT-4, de OpenAI. Modelo que acepta texto e imágenes como entrada, con disponibilidad variable según producto, y mejora el desempeño en múltiples tareas. Expande capacidades multimodales y de rendimiento general.'
    },
    {
      id: 'llama',
      era: 'generativa',
      fecha: '2023',
      hito: 'Llama',
      actores: 'Meta',
      lugar: 'Estados Unidos',
      avance: 'Familia de modelos de lenguaje distribuida para investigación y desarrollo bajo licencias específicas.',
      importancia: 'Impulsa un ecosistema amplio de modelos con pesos disponibles; no equivale necesariamente a código abierto en todos los sentidos.',
      fuente: 'https://ai.meta.com/blog/large-language-model-llama-meta-ai/',
      nota: 'Revisar la licencia de cada generación.',
      narracion: '2023, Llama, de Meta. Familia de modelos de lenguaje distribuida para investigación y desarrollo bajo licencias específicas. Impulsa un ecosistema amplio de modelos con pesos disponibles; no equivale necesariamente a código abierto en todos los sentidos.'
    },
    {
      id: 'gemini',
      era: 'generativa',
      fecha: '2023–2024',
      hito: 'Gemini',
      actores: 'Google',
      lugar: 'Modelos multimodales',
      avance: 'Familia diseñada para procesar y combinar modalidades como texto, imagen, audio y código, con capacidades que varían según versión.',
      importancia: 'Refuerza la transición desde modelos principalmente textuales hacia sistemas multimodales.',
      fuente: 'https://blog.google/technology/google-deepmind/google-gemini-ai/',
      nota: 'Lanzamiento inicial en diciembre de 2023; las versiones y disponibilidades posteriores variaron.',
      narracion: 'Entre 2023 y 2024, Gemini, de Google. Familia diseñada para procesar y combinar modalidades como texto, imagen, audio y código, con capacidades que varían según versión. Refuerza la transición desde modelos principalmente textuales hacia sistemas multimodales.'
    },
    {
      id: 'sora',
      era: 'generativa',
      fecha: '2023–2024',
      hito: 'Generación de video: Sora',
      actores: 'OpenAI',
      lugar: 'Generación de video',
      avance: 'Modelos que generan secuencias de video a partir de instrucciones y otros tipos de entrada, con disponibilidad escalonada.',
      importancia: 'Extiende la IA generativa hacia secuencias temporales audiovisuales.',
      fuente: 'https://openai.com/index/sora/',
      nota: 'Anuncio de investigación en febrero de 2024; disponibilidad de producto posterior.',
      narracion: 'Entre 2023 y 2024, generación de video: Sora, de OpenAI. Modelos que generan secuencias de video a partir de instrucciones y otros tipos de entrada, con disponibilidad escalonada. Extiende la IA generativa hacia secuencias temporales audiovisuales.'
    },
    {
      id: 'claude-3-5-sonnet',
      era: 'generativa',
      fecha: '2024',
      hito: 'Claude 3.5 Sonnet',
      actores: 'Anthropic',
      lugar: 'Estados Unidos',
      avance: 'Modelo con mejoras reportadas en programación, razonamiento y tareas que implican interacción con interfaces informáticas.',
      importancia: 'Contribuye al desarrollo de modelos que ayudan a operar herramientas y entornos digitales.',
      fuente: 'https://www.anthropic.com/news/claude-3-5-sonnet',
      nota: 'Fuente oficial del lanzamiento de junio de 2024.',
      narracion: '2024, Claude 3.5 Sonnet, de Anthropic. Modelo con mejoras reportadas en programación, razonamiento y tareas que implican interacción con interfaces informáticas. Contribuye al desarrollo de modelos que ayudan a operar herramientas y entornos digitales.'
    },
    {
      id: 'razonamiento-avanzado',
      era: 'generativa',
      fecha: '2025',
      hito: 'Hito agrupado 1: razonamiento avanzado',
      actores: 'DeepSeek, Anthropic, OpenAI y otros',
      lugar: 'Modelos de razonamiento',
      avance: 'Modelos como DeepSeek-R1, Claude 4 y GPT-5 impulsan el razonamiento mediante aprendizaje por refuerzo, programación y resolución de problemas complejos.',
      importancia: 'El foco se amplía desde la fluidez de las respuestas hacia la resolución de problemas de varios pasos.',
      fuente: 'https://arxiv.org/abs/2501.12948 ; https://www.anthropic.com/news/claude-4 ; https://openai.com/index/introducing-gpt-5/',
      nota: 'Hito agrupado por tendencia; modelos lanzados en fechas distintas. Las comparaciones requieren evaluaciones independientes.',
      narracion: '2025, razonamiento avanzado. Modelos como DeepSeek-R1, Claude 4 y GPT-5 impulsan el razonamiento mediante aprendizaje por refuerzo, programación y resolución de problemas complejos. El foco se amplía desde la fluidez de las respuestas hacia la resolución de problemas de varios pasos.'
    },
    {
      id: 'era-agentica',
      era: 'generativa',
      fecha: '2025–2026',
      hito: 'Hito agrupado 2: era agéntica',
      actores: 'OpenAI, Anthropic y otros desarrolladores',
      lugar: 'Agentes digitales y herramientas',
      avance: 'Agentes como Operator, Claude Code y ChatGPT Agent combinan modelos con navegación, herramientas y ejecución de tareas digitales de varios pasos, bajo distintos grados de supervisión.',
      importancia: 'La IA pasa de responder a solicitudes a ejecutar flujos de trabajo digitales.',
      fuente: 'https://openai.com/index/introducing-operator/ ; https://www.anthropic.com/news/claude-3-7-sonnet ; https://openai.com/index/introducing-chatgpt-agent/',
      nota: 'Hito agrupado por tendencia; el grado de autonomía depende del producto, permisos y controles humanos.',
      narracion: 'Entre 2025 y 2026, la era agéntica. Agentes como Operator, Claude Code y ChatGPT Agent combinan modelos con navegación, herramientas y ejecución de tareas digitales de varios pasos, bajo distintos grados de supervisión. La IA pasa de responder a solicitudes a ejecutar flujos de trabajo digitales.'
    },
    {
      id: 'ia-multimodal-fisica',
      era: 'generativa',
      fecha: '2025–2026',
      hito: 'Hito agrupado 3: IA multimodal, física y gobernada',
      actores: 'Google DeepMind, Meta, NIST y otros',
      lugar: 'Modelos multimodales, robótica y gobernanza',
      avance: 'Avances multimodales y robóticos conectan la IA con el entorno físico, mientras iniciativas de estándares abordan interoperabilidad, seguridad y confianza.',
      importancia: 'La IA amplía su interacción con el mundo y aumenta la importancia de la seguridad y la gobernanza.',
      fuente: 'https://deepmind.google/blog/gemini-robotics-brings-ai-into-the-physical-world/ ; https://www.nist.gov/',
      nota: 'Hito agrupado; para publicación académica, añadir una fuente primaria específica por cada iniciativa regulatoria o de estándares.',
      narracion: 'Entre 2025 y 2026, IA multimodal, física y gobernada. Avances multimodales y robóticos conectan la IA con el entorno físico, mientras iniciativas de estándares abordan interoperabilidad, seguridad y confianza. La IA amplía su interacción con el mundo y aumenta la importancia de la seguridad y la gobernanza.'
    }
  ]
};
