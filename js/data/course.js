/* js/data/course.js — course-wide copy: KB metadata, hero, ficha (KB §1), mapa (KB §2), marco (KB §3), evaluación (KB §11),
 * banco intro (KB §13), legend labels, footer and the UI chrome strings (prompt §9–§10).
 * Transcribed verbatim from contenido/base-estado-ia-2026.md (KB v1.1). Edit the KB and this file together,
 * then run `node tools/check-content.mjs`.
 *
 * EIA.data.course = {
 *   kb, hero, pregunta, ficha, comoUsar, mapa, marco, evaluacion, banco, leyenda, footer,
 *   ui: { sitio, nav, inicio, mapa, evidencia, sesion, videos, citas, banco, proyecto, glosario, preguntas,
 *         referencias, asistente, feedback, cuaderno, rubrica, laminas, modoClase }
 * }
 * Sub-objects kb, ficha, mapa (except hilo, versiones, trabajoAutonomo.texto), marco, evaluacion and banco hold
 * KB text only. UI strings may hold {placeholders} ("{n} cifras"). Later owners add their own sub-objects to
 * EIA.data.course.ui (e.g. ui.player) after this file loads.
 */
EIA.data.course = {
  kb: {
    titulo: 'Base de conocimiento del curso',
    version: '1.1',
    fecha: '17 de octubre de 2026',
    versionTexto: '1.1, 17 de octubre de 2026',
    informeBase: 'Estado del arte de la inteligencia artificial en 2026',
    corte: '14 de octubre de 2026',
    verificacion: '17 de octubre de 2026 (secciones 13 y 14)',
    materiales: 'deck *Estado de la IA 2026* (17 diapositivas con notas del orador) y este documento',
    idioma: 'español',
    archivo: 'contenido/base-estado-ia-2026.md'
  },
  hero: {
    kicker: 'Curso · 7 sesiones · 24 horas',
    titulo: 'Estado de la IA 2026',
    subtitulo: 'Adopción masiva, valor aún por demostrar',
    lead: 'Forma criterio para decidir dónde produce la IA valor verificable, con qué evidencia y con qué controles.',
    linea: 'Base de conocimiento del curso · versión 1.1 · 17 de octubre de 2026',
    botones: [
      { id: 'empezar', label: 'Empezar', href: '#mapa' },
      { id: 'banco', label: 'Banco de cifras', href: '#cifras' },
      { id: 'modo-clase', label: 'Modo clase', accion: 'modo-clase' }
    ],
    rotulos: {
      punta: { text: '88% de organizaciones usa IA', cifras: ['adop-1'] },
      masa: { text: 'Escala · Valor · Gobernanza' }
    }
  },
  pregunta: '¿Cuánto valor verificable produce la IA, para quién y con qué controles?',
  ficha: {
    descripcion: {
      label: 'Descripción',
      texto: 'Curso de 24 horas (14 en sesión y 10 de trabajo autónomo) que forma criterio para decidir dónde produce la IA valor verificable, con qué evidencia y con qué controles. Recorre el estado de la IA en 2026 a partir del informe base y sus fuentes primarias. Sigue la ruta de las 17 diapositivas: capacidad técnica, economía y adopción, trabajo y educación, ciencia y salud, riesgo y gobernanza, y agenda 2026–2028.'
    },
    publico: {
      label: 'Público',
      texto: 'Docentes, investigadores, directivos, servidores públicos y profesionales que deciden sobre el uso de IA. No hace falta programar, pero sí leer cifras con espíritu crítico.'
    },
    modalidad: {
      label: 'Modalidad',
      texto: 'Siete sesiones de 2 horas, presenciales o sincrónicas, con equipos de 3 o 4 personas. Hay dos versiones alternativas:',
      versiones: [
        'un taller de 4 horas con las sesiones 1, 3, 4 y 7 condensadas;',
        'un curso semestral con una sesión cada dos semanas.'
      ]
    },
    objetivo: {
      label: 'Objetivo general',
      texto: 'Evaluar con evidencia las capacidades, la adopción, los impactos y los riesgos de la IA, y traducir ese análisis en decisiones proporcionales al riesgo.'
    },
    resultados: {
      label: 'Resultados de aprendizaje',
      intro: 'Al terminar, cada participante podrá:',
      items: [
        'Clasificar una cifra sobre IA como capacidad técnica, uso declarado, resultado observado, expectativa o proyección.',
        'Explicar la frontera irregular y por qué un benchmark alto no equivale a desempeño real.',
        'Analizar la brecha entre uso, escala y valor en una organización.',
        'Diferenciar exposición, automatización y desplazamiento laboral, con atención a género, edad y puestos de entrada.',
        'Rediseñar una evaluación para que mida aprendizaje y no solo texto producido.',
        'Graduar la evidencia sobre IA en ciencia y medicina, del benchmark al ensayo aleatorizado.',
        'Diseñar un ciclo de gobernanza proporcional al riesgo para un caso real.',
        'Formular una agenda 2026–2028 con indicadores de valor verificable, costo total y riesgo controlado.'
      ]
    },
    metodologia: {
      label: 'Metodología',
      intro: 'Cada sesión tiene cuatro bloques:',
      bloques: [
        'exposición con diapositivas (30–35 min);',
        'lectura de cifras y fuentes (20–25 min);',
        'actividad aplicada (40 min);',
        'cierre con discusión y quiz (15 min).'
      ],
      cierre: 'El hilo conductor es un caso de uso que cada equipo elige en la sesión 1 y desarrolla hasta el proyecto final.'
    },
    fuentes: {
      label: 'Fuentes y citas',
      texto: 'Cada cifra lleva su fuente. Las encuestas (McKinsey, Microsoft, Digital Education Council) recogen respuestas de informantes, no censos. Los benchmarks miden desempeño en condiciones controladas.'
    }
  },
  comoUsar: {
    tarjetas: [
      {
        id: 'participas',
        titulo: 'Si participas',
        texto: 'Antes de cada sesión, mira el video y revisa las lecturas. En la sesión, trabaja con tu equipo en el cuaderno del caso. Cuando cites una cifra, cópiala desde el banco: así va con su fuente.'
      },
      {
        id: 'facilitas',
        titulo: 'Si facilitas',
        texto: 'Proyecta cada sesión con Modo clase: láminas, video, actividad y quiz, con el reloj de la agenda. Las notas del orador y las claves están en «Para el facilitador».'
      }
    ]
  },
  mapa: {
    titulo: 'Mapa del curso',
    columnas: ['Sesión', 'Tema', 'Diapositivas', 'Pregunta guía', 'Producto del equipo'],
    filas: [
      {
        sesion: 1,
        tema: 'Adopción masiva, valor por demostrar',
        diapositivas: '1–2',
        pregunta: '¿Qué mide realmente cada cifra sobre IA?',
        producto: 'Ficha del caso de uso'
      },
      {
        sesion: 2,
        tema: 'Capacidad técnica',
        diapositivas: '3–5',
        pregunta: '¿Dónde es confiable la IA y dónde no?',
        producto: 'Mapa de picos y valles'
      },
      {
        sesion: 3,
        tema: 'Economía y adopción',
        diapositivas: '6–8',
        pregunta: '¿Por qué el uso no se convierte en valor?',
        producto: 'Línea base y costo total'
      },
      {
        sesion: 4,
        tema: 'Trabajo y educación',
        diapositivas: '9–10',
        pregunta: '¿Qué tareas cambian y cómo evaluamos el aprendizaje?',
        producto: 'Análisis de tareas y evaluación rediseñada'
      },
      {
        sesion: 5,
        tema: 'Ciencia y medicina',
        diapositivas: '11–12',
        pregunta: '¿Qué evidencia basta para confiar?',
        producto: 'Semáforo de evidencia'
      },
      {
        sesion: 6,
        tema: 'Riesgo y gobernanza',
        diapositivas: '13–14',
        pregunta: '¿Qué controles son proporcionales al riesgo?',
        producto: 'Ciclo de gobernanza'
      },
      {
        sesion: 7,
        tema: 'América Latina, Colombia y agenda',
        diapositivas: '15–17',
        pregunta: '¿Qué hacemos en 2026–2028 y cómo lo medimos?',
        producto: 'Presentación del proyecto final'
      }
    ],
    trabajoAutonomo: {
      kb: 'Trabajo autónomo: de 1 a 1,5 horas entre sesiones para lecturas y avance del caso.',
      texto: 'De 1 a 1,5 horas entre sesiones para lecturas y avance del caso.'
    },
    hilo: { texto: 'Cada equipo elige un caso de uso en la sesión 1 y lo desarrolla hasta el proyecto final.' },
    versiones: [
      'Siete sesiones de 2 horas, presenciales o sincrónicas, con equipos de 3 o 4 personas',
      'Taller de 4 horas con las sesiones 1, 3, 4 y 7 condensadas',
      'Curso semestral con una sesión cada dos semanas'
    ],
    ruta: { lamina: 'd02' }
  },
  marco: {
    titulo: 'Marco transversal: cómo leer la evidencia sobre IA',
    tipos: {
      titulo: 'Cinco tipos de evidencia',
      columnas: ['Tipo', 'Qué es', 'Ejemplo del curso'],
      items: [
        {
          clase: 'capacidad',
          tipo: 'Capacidad técnica',
          queEs: 'Desempeño en evaluaciones controladas (benchmarks)',
          ejemplo: 'Agentes en OSWorld: de cerca de {{cap-1|12%}} a {{cap-1|66,3%}} ([Stanford, cap. 2][hai2])',
          cifras: ['cap-1']
        },
        {
          clase: 'uso',
          tipo: 'Uso declarado',
          queEs: 'Lo que personas u organizaciones dicen hacer',
          ejemplo: '{{adop-1|88%}} de organizaciones usa IA en al menos una función ([McKinsey, 2025][mck25])',
          cifras: ['adop-1']
        },
        {
          clase: 'resultado',
          tipo: 'Resultado observado',
          queEs: 'Cambio medido en tiempo, costo, calidad o empleo',
          ejemplo: 'Desarrolladores expertos tardaron {{prod-3|19%}} más con IA en un ensayo aleatorio ([METR, 2025][metr-rct])',
          cifras: ['prod-3']
        },
        {
          clase: 'expectativa',
          tipo: 'Expectativa',
          queEs: 'Intenciones declaradas',
          ejemplo: '{{adop-8|81%}} de los líderes espera integrar agentes en {{adop-8|12–18}} meses ([Microsoft, 2025][msft])',
          cifras: ['adop-8']
        },
        {
          clase: 'proyeccion',
          tipo: 'Proyección',
          queEs: 'Estimación a futuro',
          ejemplo: '{{trab-5|39%}} de las competencias centrales cambiará hacia 2030 ([WEF, 2025][wef])',
          cifras: ['trab-5']
        }
      ]
    },
    fuentes: {
      titulo: 'Qué mide cada fuente',
      columnas: ['Fuente', 'Qué aporta', 'Límite principal'],
      filas: [
        {
          fuente: 'Stanford AI Index',
          aporta: 'Integra múltiples bases y evaluaciones',
          limite: 'Muchas cifras son de laboratorio o de un solo país'
        },
        {
          fuente: 'OIT y CEPAL',
          aporta: 'Indicadores comparables entre países',
          limite: 'Miden exposición o un índice compuesto, no impacto'
        },
        {
          fuente: 'McKinsey y Microsoft',
          aporta: 'Percepciones de directivos y trabajadores',
          limite: 'Autoinforme, sesgo de selección e interés comercial'
        },
        {
          fuente: 'PwC',
          aporta: 'Vacantes y estados financieros',
          limite: 'Asociaciones sectoriales, no causalidad'
        },
        {
          fuente: 'Benchmarks (OSWorld, PaperArena, METR)',
          aporta: 'Desempeño en condiciones controladas',
          limite: 'Saturación y distancia del trabajo real'
        }
      ]
    },
    coberturas: {
      titulo: 'Coberturas de las encuestas',
      items: [
        'McKinsey 2025: 1.993 participantes de 105 países, entre el 25 de junio y el 29 de julio de 2025 ([McKinsey, 2025][mck25]).',
        'Microsoft: {{adop-8|31.000}} trabajadores del conocimiento de {{adop-8|31}} mercados ([Microsoft, 2025][msft]).',
        'Foro Económico Mundial: más de {{trab-5|1.000}} empleadores de {{trab-5|22}} sectores y {{trab-5|55}} economías ([WEF, 2025][wef]).'
      ],
      cierre: 'Una cobertura amplia mejora la descripción, pero no elimina los sesgos de selección, autoinforme o interés comercial.'
    },
    criterios: {
      titulo: 'Criterios de interpretación (informe base)',
      items: [
        {
          label: 'Avance técnico',
          texto: 'mejora verificable en evaluaciones, costo, velocidad, multimodalidad, autonomía o desempeño especializado.'
        },
        { label: 'Adopción', texto: 'uso regular de IA. No equivale a integración ni a transformación.' },
        {
          label: 'Escala',
          texto: 'despliegue sostenido en procesos, unidades o funciones, con infraestructura, gobernanza y métricas.'
        },
        {
          label: 'Impacto',
          texto: 'cambio atribuible en costos, ingresos, productividad, calidad, empleo, aprendizaje, equidad o riesgo.'
        },
        {
          label: 'Estado del arte',
          texto: 'la mejor combinación disponible de capacidades, evidencia de uso e instituciones para aplicarlas con responsabilidad.'
        }
      ]
    },
    advertencias: {
      titulo: 'Cuatro advertencias del curso',
      items: [
        'Uso no es valor.',
        'Benchmark no es desempeño real.',
        'Exposición no es desempleo.',
        'Asociación no es causalidad.'
      ]
    }
  },
  evaluacion: {
    titulo: 'Evaluación y proyecto final',
    pesos: {
      columnas: ['Componente', 'Peso', 'Momento'],
      filas: [
        { componente: 'Participación y quizzes', peso: '15%', momento: 'Sesiones 1–7' },
        { componente: 'Productos de sesión (los 4 mejores de 6)', peso: '25%', momento: 'Sesiones 1–6' },
        {
          componente: 'Proyecto final: documento de máximo 6 páginas',
          peso: '40%',
          momento: 'Antes de la sesión 7'
        },
        { componente: 'Proyecto final: presentación y defensa oral', peso: '20%', momento: 'Sesión 7' }
      ]
    },
    proyecto: {
      titulo: 'Proyecto final · Diagnóstico de valor verificable',
      intro: 'El documento reúne los productos de las sesiones y responde ocho preguntas:',
      preguntas: [
        {
          n: 1,
          titulo: 'Caso y tareas',
          texto: 'qué hace la IA, qué hace la persona y quién verifica.',
          hojas: ['s1-ficha', 's4-tareas']
        },
        {
          n: 2,
          titulo: 'Frontera irregular',
          texto: 'dónde rinde la IA, dónde falla y qué nivel de autonomía se eligió.',
          hojas: ['s2-picos']
        },
        {
          n: 3,
          titulo: 'Valor',
          texto: 'línea base, indicador verificable y costo total.',
          hojas: ['s3-linea-base']
        },
        {
          n: 4,
          titulo: 'Personas',
          texto: 'efectos en tareas, puestos de entrada y aprendizaje; quién gana y quién asume los riesgos.',
          hojas: ['s4-tareas']
        },
        {
          n: 5,
          titulo: 'Evidencia',
          texto: 'escalón actual en la escalera de evidencia y lo que falta.',
          hojas: ['s5-semaforo']
        },
        {
          n: 6,
          titulo: 'Gobernanza',
          texto: 'ciclo de seis pasos con responsables y criterio de suspensión.',
          hojas: ['s6-ciclo']
        },
        {
          n: 7,
          titulo: 'Plan 2026–2028',
          texto: 'tres hitos con indicadores del marco de la sesión 7.',
          hojas: ['s7-plan']
        },
        {
          n: 8,
          titulo: 'Fuentes y uso de IA',
          texto: 'cada cifra con su fuente enlazada y una declaración de cómo se usó la IA.',
          hojas: ['fuentes-ia', 'bitacora']
        }
      ],
      cierre: 'El proyecto incluye una bitácora de decisiones del equipo y una defensa oral. Así, el curso aplica a sí mismo su principio de evaluar el aprendizaje, no el texto.'
    },
    retro: {
      titulo: 'Cómo retroalimenta el agente un avance',
      pasos: [
        'Nombra el criterio de la rúbrica.',
        'Indica el nivel actual con una evidencia tomada del texto del equipo.',
        'Propone una acción concreta para subir un nivel.',
        'No reescribe el trabajo.'
      ]
    }
  },
  banco: {
    titulo: 'Banco de cifras',
    estadosTitulo: 'Estado de cada cifra',
    estados: [
      {
        key: 'verificada',
        label: 'Verificada',
        texto: 'contrastada con la fuente original el 17 de octubre de 2026.'
      },
      {
        key: 'con-matiz',
        label: 'Con matiz',
        texto: 'verificada, pero con una precisión de alcance que conviene decir.'
      },
      { key: 'actualizacion', label: 'Actualización', texto: 'dato posterior al informe base.' },
      {
        key: 'informe-base',
        label: 'Informe base',
        texto: 'tomada del informe base y no verificada individualmente.'
      }
    ]
  },
  leyenda: {
    tipos: [
      { clase: 'capacidad', label: 'Capacidad técnica', signo: 'matraz' },
      { clase: 'uso', label: 'Uso declarado', signo: 'bocadillo' },
      { clase: 'resultado', label: 'Resultado observado', signo: 'lupa' },
      { clase: 'expectativa', label: 'Expectativa', signo: 'catalejo' },
      { clase: 'proyeccion', label: 'Proyección', signo: 'cometa' }
    ],
    otros: 'Otros',
    ilustrativo: 'Ejemplo ilustrativo · no es un dato',
    advertencia: 'Advertencia {n}',
    advertencias: [
      { n: 1, texto: 'Uso no es valor.', sello: ['bocadillo', 'moneda'] },
      { n: 2, texto: 'Benchmark no es desempeño real.', sello: ['matraz', 'mesa de trabajo'] },
      { n: 3, texto: 'Exposición no es desempleo.', sello: ['sol sobre un escritorio', 'silla vacía'] },
      {
        n: 4,
        texto: 'Asociación no es causalidad.',
        sello: ['dos pájaros que vuelan juntos', 'flecha que empuja']
      }
    ],
    estados: [
      { key: 'verificada', label: 'Verificada', signo: 'sello' },
      { key: 'con-matiz', label: 'Con matiz', signo: 'asterisco' },
      { key: 'actualizacion', label: 'Actualización', signo: 'luna' },
      { key: 'informe-base', label: 'Informe base', signo: 'libro' }
    ],
    actualizacion: 'Actualización',
    noCompara: 'No se compara directamente',
    semaforo: [
      { luz: 'rojo', label: 'Rojo', signo: 'cruz' },
      { luz: 'ambar', label: 'Ámbar', signo: 'medio-disco' },
      { luz: 'verde', label: 'Verde', signo: 'estrella' }
    ],
    signosSesion: { 1: 'iceberg', 2: 'cordillera', 3: 'puente', 4: 'escalera', 5: 'microscopio', 6: 'volante', 7: 'faro' },
    escenarios: [
      { patron: 'puntos' },
      { patron: 'rayas' },
      { patron: 'estrellas' },
      { patron: 'cuadros' }
    ]
  },
  footer: {
    texto: 'Ilustraciones y animaciones dibujadas con código, con un lenguaje visual inspirado en el arte de Joan Miró. Narración con voces sintéticas. Contenido: Base de conocimiento del curso «Estado de la IA 2026», versión 1.1 (17 de octubre de 2026), a partir del informe base *Estado del arte de la inteligencia artificial en 2026* (corte: 14 de octubre de 2026). Cifras verificadas contra las fuentes originales el 17 de octubre de 2026, salvo las marcadas como «Informe base». Revisado por [nombre del facilitador].',
    placeholder: '[nombre del facilitador]'
  },
  ui: {
    sitio: { titulo: 'Estado de la IA 2026' },
    nav: {
      inicio: 'Inicio',
      mapa: 'Mapa',
      evidencia: 'Evidencia',
      sesiones: 'Sesiones',
      cifras: 'Cifras',
      proyecto: 'Proyecto',
      glosario: 'Glosario',
      preguntas: 'Preguntas',
      referencias: 'Referencias',
      asistente: 'Asistente',
      modoClase: 'Modo clase',
      sesionesMenu: [
        '1 · Adopción masiva, valor por demostrar',
        '2 · Capacidad técnica',
        '3 · Economía y adopción',
        '4 · Trabajo y educación',
        '5 · Ciencia y medicina',
        '6 · Riesgo y gobernanza',
        '7 · América Latina, Colombia y agenda'
      ],
      anterior: 'Anterior',
      siguiente: 'Siguiente',
      buscar: 'Buscar en el curso'
    },
    inicio: { pregunta: 'La pregunta del curso', ficha: 'Ficha del curso', comoUsar: 'Cómo usar este sitio' },
    mapa: {
      titulo: 'Mapa del curso',
      sesion: 'Sesión',
      tema: 'Tema',
      diapositivas: 'Diapositivas',
      pregunta: 'Pregunta guía',
      producto: 'Producto del equipo',
      hilo: 'El hilo conductor',
      trabajoAutonomo: 'Trabajo autónomo',
      versiones: 'Versiones del curso',
      ruta: 'Ruta de lectura'
    },
    evidencia: {
      titulo: 'Cómo leer la evidencia sobre IA',
      queEs: 'Qué es',
      ejemplo: 'Ejemplo del curso',
      fuentes: 'Qué mide cada fuente',
      coberturas: 'Coberturas de las encuestas',
      criterios: 'Criterios de interpretación',
      practica: 'Practica con el juego «¿Qué mide esta cifra?»'
    },
    sesion: {
      sesion: 'Sesión {n}',
      pregunta: 'Pregunta guía',
      diapositivas: 'Diapositivas',
      producto: 'Producto del equipo',
      resultados: 'Resultados de aprendizaje',
      agenda: 'Agenda (120 min)',
      laminas: 'Láminas',
      video: 'En video',
      contenido: 'Contenido',
      errores: 'Errores de lectura frecuentes',
      actividad: 'Actividad',
      discusion: 'Discusión',
      anotar: 'Anotar en el cuaderno',
      quiz: 'Quiz',
      lecturas: 'Lecturas',
      trabajoAutonomo: 'Trabajo autónomo',
      facilitador: 'Para el facilitador',
      clave: 'Clave para el docente',
      claveOrientativa: 'Clave orientativa para el docente'
    },
    videos: { duracion: 'Duración: {duracion}' },
    citas: {
      abrirFuente: 'Abrir fuente ↗',
      verEnBanco: 'Ver en el banco',
      copiarCita: 'Copiar cita',
      copiado: '¡Copiado!'
    },
    banco: {
      titulo: 'Banco de cifras',
      tema: 'Tema',
      tipo: 'Tipo de evidencia',
      estado: 'Estado',
      sesion: 'Sesión',
      otros: 'Otros',
      contador: '{n} cifras',
      verCorreccion: 'Ver corrección',
      imprimir: 'Imprimir esta selección',
      correcciones: 'Correcciones: no uses las versiones originales',
      versionBase: 'Versión del informe base',
      noUses: 'No uses esta versión',
      versionCorrecta: 'Versión correcta',
      actualizaciones: 'Actualizaciones que conviene mencionar'
    },
    proyecto: {
      titulo: 'Evaluación y proyecto final',
      proyecto: 'Proyecto final · Diagnóstico de valor verificable',
      cuaderno: 'Cuaderno del equipo',
      rubrica: 'Rúbrica',
      retro: 'Cómo se retroalimenta un avance'
    },
    glosario: { titulo: 'Glosario', verEnGlosario: 'Ver en el glosario' },
    preguntas: { titulo: 'Preguntas frecuentes' },
    referencias: { titulo: 'Referencias', abrirFuente: 'Abrir fuente ↗', cifrasDeEstaFuente: 'Cifras de esta fuente' },
    asistente: {
      titulo: 'Trabaja con el asistente del curso',
      instrucciones: 'Instrucciones del asistente',
      copiarInstrucciones: 'Copiar instrucciones',
      base: 'Base de conocimiento',
      plantillas: 'Instrucciones listas para copiar',
      copiar: 'Copiar'
    },
    feedback: { bien: '¡Muy bien!', casi: 'Casi. Pista: {pista}', repetir: 'Repetir' },
    cuaderno: {
      titulo: 'Cuaderno del equipo',
      exportar: 'Exportar',
      importar: 'Importar',
      copiarTexto: 'Copiar como texto',
      imprimir: 'Imprimir cuaderno',
      datoPersonal: '¿Es un dato personal? Describe la situación sin identificar a nadie.'
    },
    rubrica: {
      puntaje: 'Puntaje de la rúbrica: {puntaje}/100',
      nota: 'Autoevaluación orientativa: la calificación la asigna el docente.',
      evidencia: 'Evidencia tomada del texto',
      accion: 'Acción para subir un nivel'
    },
    laminas: { notas: 'Notas', imprimir: 'Imprimir láminas' },
    modoClase: {
      titulo: 'Modo clase',
      sesion: 'Sesión {n}',
      videoOpcional: 'Opcional en clase',
      avisoNotas: 'Las notas se ven en la proyección',
      queDecir: 'Qué decir',
      errores: 'Errores de lectura frecuentes',
      vistaFacilitador: 'Abrir vista del facilitador',
      iniciar: 'Iniciar',
      pausar: 'Pausar',
      reiniciar: 'Reiniciar'
    }
  }
};

/* [player] Copy of the video player chrome (js/engine/player.js, recorder.js and the linear cards of
 * captions.js). Owner: T05. Words in {braces} are filled in by the player. */
EIA.data.course = EIA.data.course || {}; EIA.data.course.ui = EIA.data.course.ui || {}; EIA.data.course.ui.player = {
  region: 'Video: {titulo}',
  lienzo: 'Video «{titulo}». En pantalla: {escena}',
  atajos: 'Atajos de teclado: Espacio o K reproduce o pausa; las flechas izquierda y derecha retroceden o avanzan 5 segundos; con Mayús, cambian de capítulo; C muestra u oculta los subtítulos; F activa la pantalla completa.',
  cargando: 'Preparando el video…',
  error: 'No se pudo preparar este video.',
  escenaPendiente: 'Escena en preparación',

  reproducir: 'Reproducir',
  pausar: 'Pausar',
  reproducirVideo: 'Reproducir el video «{titulo}»',
  verDeNuevo: 'Ver de nuevo',
  continuarDonde: 'Continuar donde ibas ({tiempo})',
  desdeInicio: 'Desde el inicio',

  barra: 'Posición en el video',
  barraValor: '{actual} de {total}',
  barraValorCapitulo: '{actual} de {total}, capítulo {n}: {capitulo}',
  tiempo: '{actual} / {total}',
  duracion: 'Duración: {tiempo}',
  vistaPrevia: '{tiempo} · {capitulo}',

  capitulos: 'Capítulos',
  capituloBoton: '{n} · {titulo}',
  capituloAria: 'Ir al capítulo {n}: {titulo}',
  continuarCon: 'Continuar con: {titulo}',
  finCapitulo: 'Terminó el capítulo «{titulo}».',
  finVideo: 'Terminó el video.',

  opciones: 'Opciones del video',
  subtitulos: 'Subtítulos',
  voz: 'Voz',
  velocidad: 'Velocidad',
  velocidadLenta: '0,75×',
  velocidadNormal: '1×',
  velocidadAria: 'Velocidad {valor}',
  preguntasInteractivas: 'Preguntas interactivas',
  pausarCapitulo: 'Pausar al final de cada capítulo',
  pantallaCompleta: 'Pantalla completa',
  salirPantallaCompleta: 'Salir de pantalla completa',

  vozNavegador: 'Voz del navegador',
  sinVoz: 'Este navegador no tiene una voz en español: sigue el video con los subtítulos.',

  narrador: 'Narrador',
  lectora: 'Lectora',

  transcripcion: 'Transcripción',
  escena: 'Escena {n}',
  irA: 'Ir a {tiempo}',
  fuenteLinea: 'Fuente:',
  ilustrativo: 'Ejemplo ilustrativo · no es un dato',
  pregunta: 'Pregunta',
  respuesta: 'Respuesta: {opcion}',

  fuentes: 'Fuentes de este video',
  fuentesVacio: 'Este video no usa cifras del banco.',
  tipoEvidencia: 'Tipo de evidencia:',
  estado: 'Estado:',
  enlaceFuente: 'Abrir la fuente: {fuente}',
  copiarCita: 'Copiar cita',
  copiado: '¡Copiado!',
  noCopiado: 'No se pudo copiar. Selecciona el texto de la cita y cópialo a mano.',

  laminas: 'Láminas relacionadas',
  lamina: 'D{n} · {titulo}',
  abrirLamina: 'Abrir la lámina D{n}: {titulo}',

  advertencia: 'Advertencia {n}',

  checkpoint: {
    titulo: 'Pausa: piensa y responde',
    opciones: 'Elige una respuesta',
    muyBien: '¡Muy bien!',
    casi: 'Casi. Pista: {pista}',
    casiSinPista: 'Casi. Vuelve a intentarlo.',
    continuar: 'Continuar',
    lineal: 'Pausa el video y respondan en grupo',
    respuesta: 'Respuesta'
  },

  descarga: {
    titulo: 'Descargar video',
    mp4: 'Descargar MP4',
    mp4Detalle: 'Video ya exportado · {tamano} · {tiempo}',
    megabytes: '{n} MB',
    grabar: 'Grabar y descargar el video',
    grabarDetalle: 'Se graba aquí, en tiempo real: {tiempo}.',
    capitulo: 'Descargar este capítulo',
    capituloDetalle: 'Capítulo {n}: {titulo} · {tiempo}',
    aviso: 'La grabación se hace en tiempo real: tarda lo mismo que lo que vas a grabar, {tiempo}. Mantén esta pestaña visible hasta que termine.',
    sinVozArchivo: 'Abriste el sitio como archivo (file://) y así el navegador no deja grabar la voz: el video se grabará sin voz, con subtítulos. Para grabarla, abre el sitio desde un servidor local (el README explica cómo).',
    sinVozNavegador: 'La voz del navegador no se puede grabar: el video se grabará sin voz, con subtítulos.',
    sinVozNinguna: 'Este video todavía no tiene narración grabada: se grabará sin voz, con subtítulos.',
    sinVozApagada: 'La voz está apagada: el video se grabará sin voz.',
    empezar: 'Empezar a grabar',
    cancelar: 'Cancelar',
    grabando: 'Grabando: {actual} de {total}',
    progreso: 'Progreso de la grabación',
    detener: 'Detener y descartar',
    enPausa: 'Grabación en pausa: vuelve a esta pestaña para continuar.',
    listo: 'Listo: se descargó «{archivo}».',
    descartada: 'Grabación descartada.',
    noSoportado: 'Este navegador no permite grabar el video. Prueba con una versión reciente de Chrome, Edge o Firefox.',
    error: 'La grabación se detuvo por un error: {detalle}',
    archivoCapitulo: 'capitulo-{n}'
  }
};

/* [page] Copy of the page shell: router, markup, views, nav, hero, chips and popovers, banco, glossary,
 * references, assistant and footer (js/core/router.js, js/core/markup.js, js/ui/*.js). Owner: T07.
 * Words in {braces} are filled in by the page. Strings already in EIA.data.course.ui.<view> are reused
 * from there; only the missing chrome lives here. */
EIA.data.course = EIA.data.course || {}; EIA.data.course.ui = EIA.data.course.ui || {}; EIA.data.course.ui.page = {
  documento: '{vista} · {sitio}',
  vivo: 'Avisos del sitio',
  markup: {
    fuente: 'Fuente:',
    tabla: 'Tabla',
    nuevaPestana: 'se abre en una pestaña nueva'
  },
  nav: {
    principal: 'Navegación principal',
    irInicio: 'Estado de la IA 2026: ir al inicio',
    menu: 'Menú',
    cerrarMenu: 'Cerrar el menú',
    sesionesMenu: 'Sesiones del curso',
    vecinos: 'Recorrido del curso',
    anterior: 'Anterior: {titulo}',
    siguiente: 'Siguiente: {titulo}',
    sesion: 'Sesión {n} · {titulo}'
  },
  buscar: {
    abrir: 'Buscar en el curso',
    etiqueta: 'Buscar en el curso',
    ayuda: 'Busca en las sesiones, el banco de cifras, el glosario y las preguntas frecuentes. No importan las tildes ni las mayúsculas.',
    resultados: '{n} resultados',
    unResultado: '1 resultado',
    sinResultados: 'No hay resultados para «{q}».',
    minimo: 'Escribe al menos dos letras.',
    cerrar: 'Cerrar la búsqueda',
    tipos: {
      sesion: 'Sesión {n}',
      cifra: 'Banco de cifras',
      glosario: 'Glosario',
      pregunta: 'Preguntas frecuentes',
      vista: 'Sitio'
    }
  },
  popover: {
    cerrar: 'Cerrar',
    cifra: 'Cifra',
    alcance: 'Alcance',
    fuente: 'Fuente',
    fuentes: 'Fuentes',
    estado: 'Estado',
    tipo: 'Tipo de evidencia',
    referencia: 'Referencia',
    contexto: 'Esta cifra está en el texto de la sesión; no es una fila del banco de cifras.',
    dialogoCifra: 'Ficha de la cifra {texto}',
    dialogoFuente: 'Fuente: {fuente}',
    dialogoTermino: 'Glosario: {termino}',
    verEnReferencias: 'Ver en las referencias'
  },
  copia: {
    error: 'No se pudo copiar. Selecciona el texto y cópialo a mano.'
  },
  chips: {
    tipo: 'Tipo de evidencia:',
    estado: 'Estado:'
  },
  hero: {
    region: 'Presentación del curso',
    lienzo: 'Ilustración animada: un iceberg en un mar nocturno. En la punta luminosa, iluminada por una pequeña lámpara de IA: «{punta}». En la masa sumergida: «{masa}».',
    pausar: 'Pausar la animación',
    reanudar: 'Reanudar la animación'
  },
  inicio: {
    video: 'En video'
  },
  mapa: {
    camino: 'Camino del curso: siete estaciones, una por sesión.',
    irSesion: 'Ir a la sesión {n}',
    caso: 'Caso del equipo',
    casoTexto: 'Cada sesión deja un producto en el cuaderno del equipo:',
    sello: 'Sello de la sesión {n}',
    rutaLamina: 'Abrir la lámina D{n}: {titulo}',
    fechas: {
      titulo: 'Fechas del curso semestral',
      inicio: 'Fecha de la primera sesión',
      ayuda: 'Elige la fecha de la primera sesión: las demás quedan cada dos semanas.',
      sesion: 'Sesión {n}: {fecha}'
    }
  },
  evidencia: {
    video: 'En video',
    sello: 'Advertencia {n}: {texto}'
  },
  sesion: {
    bloques: 'En esta sesión',
    agendaColumnas: ['Minutos', 'Bloque', 'Recurso'],
    numero: 'Número del bloque',
    regla:'Regla de 120 minutos con {n} bloques, cada uno del largo de su duración.',
    minutos: 'min',
    lamina: 'D{n} · {titulo}',
    abrirLamina: 'Abrir la lámina D{n}: {titulo}',
    laminas: 'Láminas de la sesión',
    herramientaPendiente: 'La herramienta interactiva de esta actividad todavía se está preparando. Mientras tanto, trabajen con la consigna.',
    quizPendiente: 'El quiz interactivo todavía se está preparando. Estas son sus preguntas:',
    anotado: 'Pregunta anotada en el cuaderno del equipo.',
    cuadernoPendiente: 'El cuaderno del equipo todavía no está disponible en esta versión del sitio.',
    nota: 'Nota',
    claves: 'Claves de las actividades',
    quizRespuestas: 'Quiz con respuestas',
    respuesta: 'Respuesta: {letra}) {opcion}',
    agenda: 'Agenda',
    imprimirGuia: 'Imprimir guía de la sesión',
    lecturaEvidencia: 'El bloque de lectura de esta sesión es la vista «Cómo leer la evidencia sobre IA».',
    irEvidencia: 'Ir a «Cómo leer la evidencia sobre IA»'
  },
  video: {
    cargar: 'Cargar el video «{titulo}»'
  },
  banco: {
    intro: 'Introducción al banco',
    lista: 'Las cifras del banco',
    buscar: 'Buscar en el banco',
    buscarAyuda: 'Busca en la cifra, el alcance y la fuente. No importan las tildes ni las mayúsculas.',
    filtros: 'Filtros del banco',
    limpiar: 'Quitar los filtros',
    vista: 'Vista',
    tarjetas: 'Tarjetas',
    tabla: 'Tabla',
    columnas: ['Cifra', 'Alcance', 'Tipo de evidencia', 'Estado', 'Fuente', 'Sesiones', 'Cita'],
    alcance: 'Alcance',
    fuente: 'Fuente',
    fuentes: 'Fuentes',
    sesiones: 'Sesiones',
    sesionN: 'Sesión {n}',
    irSesion: 'Ir a la sesión {n}',
    sinResultados: 'Ninguna cifra coincide con la búsqueda y los filtros.',
    unaCifra: '1 cifra',
    abrirFuente: 'Abrir la fuente: {fuente}',
    cifrasRelacionadas: 'Cifras del banco',
    hoja: {
      titulo: 'Banco de cifras · selección para citar',
      nota: 'Base de conocimiento del curso «Estado de la IA 2026», versión {version} ({fecha}).',
      tipo: 'Tipo de evidencia',
      estado: 'Estado',
      url: 'Fuente'
    }
  },
  proyecto: {
    hojas: 'Hojas del cuaderno que la alimentan:',
    cuadernoPendiente: 'El cuaderno del equipo todavía se está preparando: aquí podrán llenar la hoja de cada sesión.',
    rubricaPendiente: 'La rúbrica interactiva todavía se está preparando. Esta es la rúbrica del curso:'
  },
  glosario: {
    buscar: 'Buscar en el glosario',
    contador: '{n} términos',
    unTermino: '1 término',
    sinResultados: 'Ningún término coincide con la búsqueda.',
    letras: 'Índice alfabético'
  },
  referencias: {
    abrirFuenteDe: 'Abrir fuente: {fuente}',
    cifrasN: 'Cifras de esta fuente ({n})'
  },
  asistente: {
    abrirBase: 'Abrir la base de conocimiento del curso',
    blanco: 'Espacio para: {blanco}',
    ayuda: 'Completa los espacios en blanco y copia la instrucción. Lo que dejes vacío se copia entre corchetes.'
  },
  clase: {
    elegir: 'Elige qué vas a proyectar',
    pendiente: 'El Modo clase todavía se está preparando. Mientras tanto, abre la sesión y proyecta sus láminas y su video desde allí.',
    abrirSesion: 'Abrir la sesión {n}'
  },
  footer: {
    region: 'Créditos del sitio'
  }
};

/* [interactions] Copy of the interactive tools: quizzes, games, calculator, team notebook, rubric,
 * láminas viewer and Modo clase (js/ui/quiz.js, games.js, worksheets.js, proyecto.js, rubrica.js,
 * laminas-viewer.js, presenter.js). Owner: T08. Tool-specific copy lives in each tool's entry of
 * js/data/actividades.js; this block holds the shared chrome. Words in {braces} are filled in by
 * the tools. The prompt-quoted strings stay in ui.feedback, ui.cuaderno, ui.rubrica, ui.laminas and
 * ui.modoClase above; the keys added here only complete them. */
EIA.data.course = EIA.data.course || {}; EIA.data.course.ui = EIA.data.course.ui || {};
EIA.data.course.ui.quiz = {
  region: 'Quiz de la sesión {n}',
  progreso: 'Pregunta {n} de {total}',
  opciones: 'Opciones de respuesta',
  probada: 'ya la intentaste',
  respuesta: 'Respuesta: {letra}) {opcion}',
  siguiente: 'Siguiente pregunta',
  terminar: 'Ver el puntaje',
  fin: 'Terminaste el quiz de la sesión {n}.',
  puntaje: 'Puntaje: {n} de {total} al primer intento'
};
// Completes ui.cuaderno (the prompt-quoted keys above stay as they are).
(function (cq) {
  var add = {
    region: 'Cuaderno del equipo',
    cuaderno: 'Cuaderno',
    sinNombre: 'Equipo sin nombre',
    nuevo: 'Nuevo cuaderno',
    eliminar: 'Eliminar este cuaderno',
    confirmarEliminar: 'Pulsa otra vez para eliminar «{equipo}» de este navegador',
    eliminado: 'Se eliminó el cuaderno «{equipo}» de este navegador.',
    guardado: 'Guardado en este navegador.',
    noGuardado: 'Este navegador no deja guardar: exporten el cuaderno para no perder lo escrito.',
    exportado: 'Se descargó «{archivo}».',
    archivo: 'cuaderno-{equipo}',
    importado: 'Cuaderno importado: «{equipo}».',
    importadoCopia: 'Ya había una versión más reciente de ese cuaderno en este navegador: el archivo se importó como una copia.',
    errorImportar: 'Ese archivo no es un cuaderno del equipo exportado desde este sitio.',
    ayuda: 'Cada equipo tiene su propio cuaderno, guardado solo en este navegador. Para compartirlo dentro del equipo, expórtenlo e impórtenlo.',
    propio: 'El sitio no escribe por el equipo: cada respuesta es suya.',
    hojas: 'Hojas del cuaderno',
    general: 'Todo el curso',
    agregarFila: 'Agregar fila',
    quitarFila: 'Quitar {fila}',
    elegirOpcion: 'Elige una opción',
    si: 'Sí',
    no: 'No',
    soloSi: 'Solo si es «{valor}»',
    elegidos: 'Elegidos: {n} de {total}',
    monto: 'Monto',
    unidad: 'Unidad',
    unidadAyuda: 'por ejemplo: pesos al mes',
    suma: 'Suma de los costos marcados: {total} {unidad}',
    sumaPendiente: 'La suma aparece cuando todos los montos marcados tienen la misma unidad.',
    buscarCifra: 'Buscar en el banco de cifras',
    buscarAyuda: 'Escriban parte de la cifra, de su fuente o de su tema.',
    resultados: 'Cifras encontradas: {n}',
    agregarCifra: 'Agregar',
    agregarCifraDe: 'Agregar al cuaderno: {cifra}',
    yaAgregada: 'Ya está en el cuaderno',
    quitarCifra: 'Quitar',
    quitarCifraDe: 'Quitar del cuaderno: {cifra}',
    copiarCita: 'Copiar cita',
    sinCifras: 'Todavía no han agregado cifras del banco.',
    notas: 'Preguntas anotadas en las sesiones',
    sinNotas: 'Aún no hay preguntas anotadas: usen «Anotar en el cuaderno» en la discusión de cada sesión.',
    respuesta: 'Respuesta del equipo',
    quitarNota: 'Quitar esta pregunta',
    sesion: 'Sesión {n}',
    cuadernoDe: 'Se guarda en el cuaderno de «{equipo}».',
    abrirCuaderno: 'Abrir el cuaderno completo',
    impresoNota: 'Base de conocimiento del curso «Estado de la IA 2026», versión {version} ({fecha}).',
    rubrica: 'Rúbrica: autoevaluación del equipo',
    nivelElegido: 'Nivel elegido',
    sinNivel: 'sin elegir',
    vacio: '—'
  };
  Object.keys(add).forEach(function (k) { if (!(k in cq)) cq[k] = add[k]; });
})(EIA.data.course.ui.cuaderno = EIA.data.course.ui.cuaderno || {});
