/* js/data/actividades.js — data for the tools of prompt §10–§11, the team notebook, the rubric and Modo clase.
 * Transcribed verbatim from contenido/base-estado-ia-2026.md (KB v1.1). Edit the KB and this file together,
 * then run `node tools/check-content.mjs`.
 * Tool copy lives here (titles, labels, hints, notes); shared chrome (feedback, buttons) is EIA.data.course.ui.
 *
 * EIA.data.actividades  { [id]: { id, sesion, tipo, titulo, kb?, hoja?, … } }  (ids listed by sesiones[n].actividades)
 *   kb      the KB "Actividad" block, verbatim: { titulo, duracion, consigna, pasos, tabla?: { header, rows }, clave? }
 *   tipo    juego-tipos | ficha | calculadora | tabla | embudo | escalera | calendario | indicadores |
 *           escenarios | plan | temporizador (see odd/spec/data-model.md for each shape)
 * EIA.data.cuaderno     { campos, hojas: [{ id, sesion, titulo, actividad, secciones: [{ id, tipo, … }] }] }
 * EIA.data.rubrica      { titulo, nota, columnas, niveles, fracciones, criterios: [{ id, criterio, peso, niveles }] }
 * EIA.data.modoClase    { opciones: [{ id, label, sesion | sesiones, minutos? }], bloques: { [n]: [{ agenda, … }] } }
 */
EIA.data.actividades = {
  's1-que-mide': {
    id: 's1-que-mide',
    sesion: 1,
    tipo: 'juego-tipos',
    titulo: '¿Qué mide esta cifra?',
    kb: {
      titulo: 'Actividad 1 · ¿Qué mide esta cifra?',
      duracion: '25 min',
      consigna: 'En parejas, los participantes clasifican cada cifra y nombran su fuente.',
      pasos: []
    },
    bins: [
      { clase: 'capacidad', label: 'Capacidad técnica', pista: '¿Se midió en una prueba controlada?' },
      { clase: 'uso', label: 'Uso declarado', pista: '¿Es lo que alguien dice que hace?' },
      { clase: 'resultado', label: 'Resultado observado', pista: '¿Se midió un cambio real?' },
      { clase: 'expectativa', label: 'Expectativa', pista: '¿Es una intención?' },
      { clase: 'proyeccion', label: 'Proyección', pista: '¿Es una estimación del futuro?' }
    ],
    cards: [
      {
        id: 'mckinsey-88',
        cifra: '88% usa IA en al menos una función',
        fuente: 'McKinsey 2025',
        claveKB: 'Uso declarado',
        tipo: 'Uso declarado',
        clase: 'uso',
        nota: '',
        cifras: ['adop-1']
      },
      {
        id: 'osworld',
        cifra: 'Agentes en OSWorld: de ~12% a 66,3%',
        fuente: 'Stanford AI Index 2026',
        claveKB: 'Capacidad técnica',
        tipo: 'Capacidad técnica',
        clase: 'capacidad',
        nota: '',
        cifras: ['cap-1']
      },
      {
        id: 'metr-19',
        cifra: 'Los expertos tardaron 19% más con IA',
        fuente: 'METR 2025',
        claveKB: 'Resultado observado (ensayo aleatorio; METR lo marca hoy como desactualizado)',
        tipo: 'Resultado observado',
        clase: 'resultado',
        nota: 'ensayo aleatorio; METR lo marca hoy como desactualizado',
        cifras: ['prod-3']
      },
      {
        id: 'microsoft-81',
        cifra: '81% de los líderes espera integrar agentes',
        fuente: 'Microsoft 2025',
        claveKB: 'Expectativa',
        tipo: 'Expectativa',
        clase: 'expectativa',
        nota: '',
        cifras: ['adop-8']
      },
      {
        id: 'wef-39',
        cifra: '39% de las competencias cambiará hacia 2030',
        fuente: 'WEF 2025',
        claveKB: 'Proyección',
        tipo: 'Proyección',
        clase: 'proyeccion',
        nota: '',
        cifras: ['trab-5']
      },
      {
        id: 'pwc',
        cifra: 'Ingreso por empleado: 27,0% vs 8,5%',
        fuente: 'PwC 2025',
        claveKB: 'Resultado observado (asociación, no causalidad)',
        tipo: 'Resultado observado',
        clase: 'resultado',
        nota: 'asociación, no causalidad',
        cifras: ['prod-5'],
        correccion: 'pwc'
      },
      {
        id: 'dec-86',
        cifra: '86% de los estudiantes usa IA',
        fuente: 'Digital Education Council 2024',
        claveKB: 'Uso declarado',
        tipo: 'Uso declarado',
        clase: 'uso',
        nota: '',
        cifras: ['edu-1']
      },
      {
        id: 'incidentes',
        cifra: 'Incidentes: 233 → 362',
        fuente: 'Stanford AI Index 2026',
        claveKB: 'Resultado observado (conteo bruto, sin denominador)',
        tipo: 'Resultado observado',
        clase: 'resultado',
        nota: 'conteo bruto, sin denominador',
        cifras: ['ries-1']
      }
    ],
    clave: { titulo: 'Clave para el docente', columnas: ['Cifra', 'Fuente', 'Clave para el docente'] },
    // Tool copy (prompt §10.3), not KB text.
    ui: {
      instrucciones: 'Arrastra cada tarjeta hasta su tipo de evidencia. Sin mouse, toca o elige con el teclado una tarjeta y luego su tipo.',
      tarjetas: 'Cifras por clasificar',
      tipos: 'Tipos de evidencia',
      elegida: 'Elegiste «{cifra}». Ahora elige su tipo de evidencia.',
      soltar: 'Llevar «{cifra}» a {tipo}',
      clasificadas: 'Cifras clasificadas como {tipo}',
      progreso: 'Clasificadas: {n} de {total}',
      fin: 'Clasificaste todas las cifras. Esta es la clave completa:'
    }
  },
  's1-ficha-caso': {
    id: 's1-ficha-caso',
    sesion: 1,
    tipo: 'ficha',
    titulo: 'Ficha del caso de uso',
    hoja: 's1-ficha',
    kb: {
      titulo: 'Actividad 2 · Elegir el caso de uso',
      duracion: '35 min',
      consigna: 'Cada equipo elige un uso de IA real o probable en su contexto: tutoría, atención a ciudadanos, revisión de literatura, clasificación de solicitudes o apoyo a la redacción clínica. Luego completa una ficha con estos puntos:',
      pasos: [
        'La tarea que hace la IA y la que sigue haciendo una persona.',
        'Los usuarios y las personas afectadas.',
        'Los datos que usa y quién responde por ellos.',
        'El resultado esperado y cómo se sabría que mejoró.',
        'Quién verifica la salida y qué pasa si la IA falla.'
      ]
    }
  },
  's2-pasos': {
    id: 's2-pasos',
    sesion: 2,
    tipo: 'calculadora',
    titulo: 'Pasos que se acumulan',
    contenido: 4,
    bloque: 'Cálculo en vivo: acumulación de errores',
    formula: 'P = p^n',
    p: { label: 'Probabilidad de éxito por paso', min: 80, max: 99.9, paso: 0.1, inicial: 95, unidad: '%' },
    n: { label: 'Número de pasos', min: 1, max: 50, paso: 1, inicial: 20 },
    presets: [
      { label: '95% · 20 pasos', p: 95, n: 20, resultado: '≈ 0,36 · 36%', ilustrativo: true },
      { label: '99% · 20 pasos', p: 99, n: 20, resultado: '≈ 0,82 · 82%', ilustrativo: true }
    ],
    sello: {
      text: 'Ejemplo ilustrativo: supone pasos independientes. No es un dato de las fuentes.',
      ilustrativo: true
    }
  },
  's2-picos-valles': {
    id: 's2-picos-valles',
    sesion: 2,
    tipo: 'tabla',
    titulo: 'Picos y valles del caso',
    hoja: 's2-picos',
    kb: {
      titulo: 'Actividad · Picos y valles del caso',
      duracion: '40 min',
      consigna: '',
      pasos: [
        'Dividan el caso en 6 a 8 subtareas.',
        'Marquen cada una como pico (bien delimitada y verificable) o valle (larga, abierta o con contexto cambiante).',
        'Cuenten los pasos de cada valle y describan el costo de un error en él.',
        'Asignen un nivel de autonomía a cada subtarea: la IA sugiere; ejecuta con aprobación humana; o ejecuta sola con monitoreo.',
        'Elijan los tres criterios que más pesan para escoger entre una API cerrada y un modelo abierto: costo, latencia, privacidad, auditabilidad o dependencia del proveedor.'
      ]
    }
  },
  's3-embudo': {
    id: 's3-embudo',
    sesion: 3,
    tipo: 'embudo',
    titulo: 'El embudo, con cuidado',
    lamina: 'd07',
    barras: ['adop-1', 'adop-2', 'adop-4', 'adop-5'],
    nota: 'Cada barra sale de una pregunta distinta de la misma encuesta: muestra un patrón, no una cohorte.',
    edicion2026: {
      panel: 'edicion-2026',
      label: 'Ver la edición 2026',
      nota: 'No se compara directamente con la edición 2025',
      cifras: ['adop-7']
    }
  },
  's3-linea-base': {
    id: 's3-linea-base',
    sesion: 3,
    tipo: 'tabla',
    titulo: 'Línea base y costo total',
    hoja: 's3-linea-base',
    kb: {
      titulo: 'Actividad · Línea base y costo total',
      duracion: '35 min',
      consigna: '',
      pasos: [
        'Ubiquen el caso en una de las seis etapas de madurez.',
        'Midan la línea base antes del despliegue: tiempo, calidad, errores y satisfacción.',
        'Calculen el costo total: licencias, integración, cómputo, revisión humana, errores, seguridad y formación.',
        'Definan un indicador de valor verificable y quién lo verifica.'
      ],
      tabla: {
        header: ['Componente', 'Línea base', 'Meta', 'Cómo se mide', 'Quién verifica'],
        rows: [
          ['Tiempo por tarea', '', '', '', ''],
          ['Calidad o tasa de error', '', '', '', ''],
          ['Costo total por tarea', '', '', '', ''],
          ['Riesgo o incidentes', '', '', '', '']
        ]
      }
    }
  },
  's4-tareas': {
    id: 's4-tareas',
    sesion: 4,
    tipo: 'tabla',
    titulo: 'Tareas del caso',
    hoja: 's4-tareas',
    kb: {
      titulo: 'Actividad A · Tareas del caso',
      duracion: '20 min',
      consigna: '',
      pasos: [
        'Desagreguen la ocupación principal del caso en 6 a 8 tareas.',
        'Marquen cada tarea con una de tres opciones: la IA apoya; la IA podría realizarla; la persona es indispensable.',
        'Señalen qué tareas sirven de escalón de entrada a las personas nuevas y cómo se preservará ese aprendizaje.'
      ]
    }
  },
  's4-evaluacion': {
    id: 's4-evaluacion',
    sesion: 4,
    tipo: 'tabla',
    titulo: 'Evaluación rediseñada',
    hoja: 's4-tareas',
    kb: {
      titulo: 'Actividad B · Rediseñar una evaluación',
      duracion: '35 min',
      consigna: 'Tomen una evaluación real y rediséñenla con las cuatro piezas de la tabla. Definan qué usos de IA están permitidos, cómo se declaran y qué parte se hace sin IA.',
      pasos: [],
      tabla: {
        header: ['Pieza', 'Qué se entrega', 'Qué evidencia de aprendizaje aporta'],
        rows: [
          ['Producto auténtico', '', ''],
          ['Bitácora de proceso', '', ''],
          ['Defensa oral', '', ''],
          ['Uso declarado de IA', '', '']
        ]
      }
    }
  },
  's5-escalera': {
    id: 's5-escalera',
    sesion: 5,
    tipo: 'escalera',
    titulo: 'Sube la escalera de evidencia',
    contenido: 6,
    consigna: 'Ubiquen en la escalera las afirmaciones del contenido 5 y digan qué escalón falta para confiar en cada una.',
    peldanos: [
      'Puntaje en un benchmark o examen.',
      'Casos publicados o simulados.',
      'Datos retrospectivos reales del contexto.',
      'Validación externa en otra institución o población.',
      'Ensayo aleatorizado o diseño cuasiexperimental sólido.',
      'Seguimiento posdespliegue con monitoreo de daños.'
    ],
    afirmaciones: [
      {
        id: 'notas-clinicas',
        text: 'notas clínicas',
        escalon: 3,
        color: 'verde',
        clave: 'notas clínicas: escalón 3, datos reales de uso (verde, uso de apoyo);',
        detalle: [
          '*Verde, apoyo al flujo de trabajo:* médicos de Sharp HealthCare reportan hasta 83% menos tiempo escribiendo notas clínicas.'
        ],
        cifras: ['med-1']
      },
      {
        id: 'sistema-multiagente',
        text: 'sistema multiagente',
        escalon: 2,
        color: 'ambar',
        clave: 'sistema multiagente: escalón 2, casos publicados (ámbar);',
        detalle: [
          '*Ámbar, resultado de laboratorio:* un sistema multiagente logró 85,5% en casos difíciles publicados en NEJM. Un grupo de 21 médicos con 5 a 20 años de experiencia, que trabajó sin sus herramientas habituales, logró cerca de 20%. No es práctica clínica.'
        ],
        cifras: ['med-2']
      },
      {
        id: 'estudios-dispositivos',
        text: 'revisión de estudios y dispositivos',
        escalon: 1,
        color: 'rojo',
        clave: 'revisión de estudios y dispositivos: la mayoría de la evidencia está en el escalón 1 y casi nunca llega al 5 (rojo).',
        detalle: [
          'De más de 500 estudios, casi la mitad usó preguntas tipo examen y solo 5% usó datos clínicos reales.',
          'En una evaluación abierta, modelos generales dieron entre 11,8 y 14,6 recomendaciones gravemente dañinas por cada 100 casos (dato del informe base).',
          'La FDA autorizó 258 dispositivos con IA en 2025, cerca de 1.400 en total. La mayoría entró por vías que no exigen nuevos ensayos.',
          'De 1.016 autorizaciones hasta diciembre de 2024, solo 2,4% de los dispositivos con estudios clínicos tuvo evidencia de ensayos aleatorizados.'
        ],
        cifras: ['med-3', 'med-4', 'med-5', 'med-6']
      }
    ],
    claveTitulo: 'Clave orientativa para el docente',
    colores: [
      { id: 'verde', label: 'Verde', signo: 'estrella' },
      { id: 'ambar', label: 'Ámbar', signo: 'medio-disco' },
      { id: 'rojo', label: 'Rojo', signo: 'cruz' }
    ]
  },
  's5-semaforo': {
    id: 's5-semaforo',
    sesion: 5,
    tipo: 'tabla',
    titulo: 'Semáforo de evidencia',
    hoja: 's5-semaforo',
    kb: {
      titulo: 'Actividad · Semáforo de evidencia',
      duracion: '35 min',
      consigna: '',
      pasos: [
        'Ubiquen en la escalera las afirmaciones del contenido 5 y digan qué escalón falta para confiar en cada una.',
        'Apliquen el semáforo a su caso: qué evidencia existe, cuál falta antes de escalar y quién la produciría.'
      ],
      tabla: {
        header: ['Afirmación del caso', 'Escalón actual', 'Color', 'Evidencia que falta', 'Quién la produce'],
        rows: [['', '', '', '', '']]
      },
      clave: {
        titulo: 'Clave orientativa para el docente',
        items: [
          'notas clínicas: escalón 3, datos reales de uso (verde, uso de apoyo);',
          'sistema multiagente: escalón 2, casos publicados (ámbar);',
          'revisión de estudios y dispositivos: la mayoría de la evidencia está en el escalón 1 y casi nunca llega al 5 (rojo).'
        ]
      }
    }
  },
  's6-calendario': {
    id: 's6-calendario',
    sesion: 6,
    tipo: 'calendario',
    titulo: 'Calendario de la Ley de IA',
    contenido: [4, 5],
    capas: [
      { id: 'ley', label: 'La ley', contenido: 4 },
      {
        id: 'omnibus',
        label: 'Ómnibus Digital (Reglamento (UE) 2026/1744)',
        contenido: 5,
        texto: 'El Reglamento (UE) 2026/1744, del 8 de julio de 2026 y vigente desde el 27 de julio de 2026, modificó la Ley de IA',
        cifras: ['ries-4']
      }
    ],
    hitos: [
      {
        id: 'vigor',
        capa: 'ley',
        fecha: '1 de agosto de 2024',
        iso: '2024-08-01',
        etiqueta: 'Entró en vigor',
        texto: 'Entró en vigor el 1 de agosto de 2024',
        cifras: ['ctx-ley-vigor']
      },
      {
        id: 'prohibiciones',
        capa: 'ley',
        fecha: '2 de febrero de 2025',
        iso: '2025-02-02',
        etiqueta: 'se aplican las prohibiciones y la obligación de alfabetización en IA',
        texto: '2 de febrero de 2025: se aplican las prohibiciones y la obligación de alfabetización en IA.',
        tarjeta: 'texto',
        cifras: ['ctx-ley-prohibiciones']
      },
      {
        id: 'gpai',
        capa: 'ley',
        fecha: '2 de agosto de 2025',
        iso: '2025-08-02',
        etiqueta: 'se aplican las obligaciones para modelos de propósito general (GPAI)',
        texto: '2 de agosto de 2025: se aplican las obligaciones para modelos de propósito general (GPAI): documentación técnica, política de derechos de autor y resumen público del contenido de entrenamiento. Los modelos con riesgo sistémico deben además evaluar y mitigar riesgos, reportar incidentes graves y proteger su ciberseguridad.',
        gpai: true,
        estadoConOmnibus: 'sin cambios',
        cifras: ['ries-3']
      },
      {
        id: 'mayoria',
        capa: 'ley',
        fecha: '2 de agosto de 2026',
        iso: '2026-08-02',
        etiqueta: 'se aplica la mayoría de las reglas, incluida la transparencia del artículo 50',
        texto: '2 de agosto de 2026: se aplica la mayoría de las reglas, incluida la transparencia del artículo 50. La Comisión puede hacer cumplir las obligaciones GPAI, incluso con multas.',
        gpai: true,
        estadoConOmnibus: 'sin cambios',
        cifras: ['ctx-ley-mayoria', 'ries-3']
      },
      {
        id: 'gpai-previos',
        capa: 'ley',
        fecha: '2 de agosto de 2027',
        iso: '2027-08-02',
        etiqueta: 'plazo para los modelos GPAI comercializados antes del 2 de agosto de 2025',
        texto: '2 de agosto de 2027: plazo para los modelos GPAI comercializados antes del 2 de agosto de 2025.',
        gpai: true,
        estadoConOmnibus: 'sin cambios',
        cifras: ['ries-3']
      },
      {
        id: 'prohibicion-deepfakes',
        capa: 'omnibus',
        fecha: '2 de diciembre de 2026',
        iso: '2026-12-02',
        etiqueta: 'prohíbe los sistemas que generan deepfakes sexuales no consentidos y material de abuso sexual infantil',
        texto: 'Desde el 2 de diciembre de 2026 prohíbe los sistemas que generan deepfakes sexuales no consentidos y material de abuso sexual infantil.',
        tarjeta: 'texto',
        cifras: ['ries-4']
      },
      {
        id: 'transitorio',
        capa: 'omnibus',
        fecha: '2 de diciembre de 2026',
        iso: '2026-12-02',
        etiqueta: 'plazo transitorio del artículo 50(2)',
        texto: 'Fija esa misma fecha como plazo transitorio del artículo 50(2) para los sistemas de contenido sintético que ya estaban en el mercado antes del 2 de agosto de 2026.',
        cifras: ['ries-4', 'ctx-omnibus-transitorio']
      },
      {
        id: 'sandbox',
        capa: 'omnibus',
        fecha: '2 de agosto de 2027',
        iso: '2027-08-02',
        etiqueta: 'al menos un sandbox regulatorio operativo',
        texto: 'Pide que cada país tenga al menos un sandbox regulatorio operativo al 2 de agosto de 2027.',
        cifras: ['ries-4']
      },
      {
        id: 'anexo-iii',
        capa: 'omnibus',
        fecha: '2 de diciembre de 2027',
        iso: '2027-12-02',
        etiqueta: 'reglas para sistemas de alto riesgo: anexo III',
        texto: 'Aplazó las reglas para sistemas de alto riesgo: las del anexo III al 2 de diciembre de 2027 y las del anexo I (productos regulados) al 2 de agosto de 2028.',
        estado: 'aplazado',
        cifras: ['ries-4']
      },
      {
        id: 'anexo-i',
        capa: 'omnibus',
        fecha: '2 de agosto de 2028',
        iso: '2028-08-02',
        etiqueta: 'reglas para sistemas de alto riesgo: anexo I (productos regulados)',
        texto: 'Aplazó las reglas para sistemas de alto riesgo: las del anexo III al 2 de diciembre de 2027 y las del anexo I (productos regulados) al 2 de agosto de 2028.',
        estado: 'aplazado',
        cifras: ['ries-4']
      }
    ],
    sinCambios: { texto: 'No cambió las fechas para modelos de propósito general.', cifras: ['ries-4'] },
    sellos: { aplazado: 'aplazado', sinCambios: 'sin cambios' },
    nota: 'Información, no asesoría jurídica.'
  },
  's6-ciclo': {
    id: 's6-ciclo',
    sesion: 6,
    tipo: 'tabla',
    titulo: 'Ciclo de gobernanza',
    hoja: 's6-ciclo',
    kb: {
      titulo: 'Actividad · Ciclo de gobernanza del caso',
      duracion: '40 min',
      consigna: '',
      pasos: [
        'Clasifiquen el riesgo del caso por impacto (bajo, medio o alto) y reversibilidad.',
        'Completen la matriz con un control, un responsable y un indicador por paso.',
        'Escriban el criterio de suspensión: qué evento detiene el sistema y quién decide.'
      ],
      tabla: {
        header: ['Paso', 'Control concreto', 'Responsable', 'Indicador'],
        rows: [
          ['Inventario', '', '', ''],
          ['Clasificar riesgo', '', '', ''],
          ['Evaluar', '', '', ''],
          ['Supervisar', '', '', ''],
          ['Monitorear incidentes', '', '', ''],
          ['Corregir', '', '', '']
        ]
      }
    }
  },
  's7-indicadores': {
    id: 's7-indicadores',
    sesion: 7,
    tipo: 'indicadores',
    titulo: 'Marco de indicadores',
    contenido: 8,
    columnas: ['Nivel', 'Indicadores', 'Pregunta evaluativa'],
    niveles: [
      {
        id: 'insumos',
        nivel: 'Insumos',
        indicadores: 'Inversión, cómputo, datos, licencias, talento',
        pregunta: '¿Qué capacidades están disponibles y para quién?'
      },
      {
        id: 'uso',
        nivel: 'Uso',
        indicadores: 'Usuarios activos, frecuencia, funciones y tareas',
        pregunta: '¿Quién usa IA y con qué finalidad?'
      },
      {
        id: 'integracion',
        nivel: 'Integración',
        indicadores: 'Procesos conectados, calidad de datos, herramientas y controles',
        pregunta: '¿La IA forma parte del flujo real o es un piloto aislado?'
      },
      {
        id: 'resultado',
        nivel: 'Resultado',
        indicadores: 'Tiempo, costo, calidad, ingresos, satisfacción',
        pregunta: '¿Mejora el desempeño frente a una línea base?'
      },
      {
        id: 'aprendizaje',
        nivel: 'Aprendizaje',
        indicadores: 'Retención, transferencia, pensamiento crítico, autonomía',
        pregunta: '¿La mejora se sostiene cuando se retira la ayuda?'
      },
      {
        id: 'distribucion',
        nivel: 'Distribución',
        indicadores: 'Efectos por género, edad, territorio, experiencia y ocupación',
        pregunta: '¿Quién recibe los beneficios y quién soporta los riesgos?'
      },
      {
        id: 'seguridad',
        nivel: 'Seguridad',
        indicadores: 'Incidentes, severidad, recuperación, sesgo, privacidad',
        pregunta: '¿Los riesgos están identificados y controlados?'
      },
      {
        id: 'sostenibilidad',
        nivel: 'Sostenibilidad',
        indicadores: 'Energía, agua, carbono, vida útil del hardware',
        pregunta: '¿El valor justifica la huella material?'
      },
      {
        id: 'gobernanza',
        nivel: 'Gobernanza',
        indicadores: 'Evaluaciones, auditorías, responsables, reparación',
        pregunta: '¿Existe rendición de cuentas efectiva?'
      }
    ]
  },
  's7-escenarios': {
    id: 's7-escenarios',
    sesion: 7,
    tipo: 'escenarios',
    titulo: 'Cuatro escenarios plausibles',
    contenido: 7,
    escenarios: [
      {
        id: 'difusion-con-bajo-impacto',
        titulo: 'Difusión con bajo impacto',
        texto: 'más licencias sin rediseño de procesos, con un efecto financiero modesto. Es coherente con {{adop-1|88%}} de uso y {{adop-5|39%}} de impacto en EBIT ([McKinsey, 2025][mck25]).',
        patron: 'puntos'
      },
      {
        id: 'transformacion-agentica-controlada',
        titulo: 'Transformación agéntica controlada',
        texto: 'agentes con permisos limitados, evaluación continua y supervisión humana. Logra mejoras sustantivas en TI, gestión del conocimiento, soporte y operaciones.',
        patron: 'rayas'
      },
      {
        id: 'automatizacion-desigual',
        titulo: 'Automatización desigual',
        texto: 'se reducen puestos de entrada y tareas administrativas antes de que existan rutas de transición. Sus señales son la exposición desigual y la caída del empleo juvenil en software ([OIT][ilo]; [Stanford][hai4]).',
        patron: 'estrellas'
      },
      {
        id: 'reaccion-regulatoria',
        titulo: 'Reacción regulatoria',
        texto: 'incidentes o impactos distributivos aceleran las obligaciones de evaluación, transparencia y responsabilidad, con la Ley de IA europea como referencia ([calendario][aisd]).',
        patron: 'cuadros'
      }
    ]
  },
  's7-plan': {
    id: 's7-plan',
    sesion: 7,
    tipo: 'plan',
    titulo: 'Plan 2026–2028',
    hoja: 's7-plan',
    niveles: 's7-indicadores'
  },
  's7-presentacion': {
    id: 's7-presentacion',
    sesion: 7,
    tipo: 'temporizador',
    titulo: 'Presentación y defensa: 7 minutos + 3 de preguntas por equipo',
    agenda: 2,
    fases: [
      { id: 'presentacion', label: 'Presentación y defensa', minutos: 7 },
      { id: 'preguntas', label: 'Preguntas', minutos: 3 }
    ]
  }
};

EIA.data.cuaderno = {
  campos: [
    { id: 'equipo', label: 'Nombre del equipo' },
    { id: 'caso', label: 'Nombre del caso' }
  ],
  hojas: [
    {
      id: 's1-ficha',
      sesion: 1,
      titulo: 'Ficha del caso de uso',
      actividad: 's1-ficha-caso',
      secciones: [
        {
          id: 'ficha',
          tipo: 'campos',
          campos: [
            {
              id: 'tarea',
              label: 'La tarea que hace la IA y la que sigue haciendo una persona.',
              tipo: 'texto'
            },
            { id: 'usuarios', label: 'Los usuarios y las personas afectadas.', tipo: 'texto' },
            { id: 'datos', label: 'Los datos que usa y quién responde por ellos.', tipo: 'texto' },
            { id: 'resultado', label: 'El resultado esperado y cómo se sabría que mejoró.', tipo: 'texto' },
            {
              id: 'verificacion',
              label: 'Quién verifica la salida y qué pasa si la IA falla.',
              tipo: 'texto'
            }
          ]
        }
      ]
    },
    {
      id: 's2-picos',
      sesion: 2,
      titulo: 'Picos y valles del caso',
      actividad: 's2-picos-valles',
      secciones: [
        {
          id: 'subtareas',
          tipo: 'filas',
          min: 6,
          max: 8,
          columnas: [
            { id: 'subtarea', label: 'Subtarea', tipo: 'texto' },
            {
              id: 'tipo',
              label: 'Pico o valle',
              tipo: 'opcion',
              opciones: [
                { id: 'pico', label: 'pico (bien delimitada y verificable)' },
                { id: 'valle', label: 'valle (larga, abierta o con contexto cambiante)' }
              ]
            },
            {
              id: 'pasos',
              label: 'Pasos de cada valle',
              tipo: 'numero',
              si: { campo: 'tipo', valor: 'valle' }
            },
            { id: 'costo', label: 'Costo de un error', tipo: 'texto' },
            {
              id: 'autonomia',
              label: 'Nivel de autonomía',
              tipo: 'opcion',
              opciones: [
                { id: 'la-ia-sugiere', label: 'La IA sugiere' },
                { id: 'ejecuta-con-aprobacion-humana', label: 'Ejecuta con aprobación humana' },
                { id: 'ejecuta-sola-con-monitoreo', label: 'Ejecuta sola con monitoreo' }
              ]
            }
          ]
        },
        {
          id: 'criterios',
          tipo: 'eleccion',
          titulo: 'Criterios para elegir entre una API cerrada y un modelo abierto',
          elegir: 3,
          opciones: [
            { id: 'costo', label: 'costo' },
            { id: 'latencia', label: 'latencia' },
            { id: 'privacidad', label: 'privacidad' },
            { id: 'auditabilidad', label: 'auditabilidad' },
            { id: 'dependencia-del-proveedor', label: 'dependencia del proveedor' }
          ],
          campo: { id: 'porque', label: 'Por qué', tipo: 'texto' }
        }
      ]
    },
    {
      id: 's3-linea-base',
      sesion: 3,
      titulo: 'Línea base y costo total',
      actividad: 's3-linea-base',
      secciones: [
        {
          id: 'etapa',
          tipo: 'opcion',
          label: 'Seis etapas de madurez',
          opciones: [
            { id: 'acceso', label: 'Acceso' },
            { id: 'experimentacion', label: 'experimentación' },
            { id: 'integracion', label: 'integración' },
            { id: 'rediseno', label: 'rediseño' },
            { id: 'escala', label: 'escala' },
            { id: 'transformacion', label: 'transformación' }
          ]
        },
        {
          id: 'tabla',
          tipo: 'matriz',
          encabezado: 'Componente',
          columnas: ['Línea base', 'Meta', 'Cómo se mide', 'Quién verifica'],
          filas: ['Tiempo por tarea', 'Calidad o tasa de error', 'Costo total por tarea', 'Riesgo o incidentes']
        },
        {
          id: 'costo',
          tipo: 'costos',
          titulo: 'Costo total',
          items: [
            { id: 'licencias', label: 'licencias' },
            { id: 'integracion', label: 'integración' },
            { id: 'computo', label: 'cómputo' },
            { id: 'revision-humana', label: 'revisión humana' },
            { id: 'errores', label: 'errores' },
            { id: 'seguridad', label: 'seguridad' },
            { id: 'formacion', label: 'formación' }
          ],
          sumaSoloMismaUnidad: true
        },
        { id: 'indicador', tipo: 'texto', label: 'Indicador de valor verificable' },
        { id: 'verifica', tipo: 'texto', label: 'Quién lo verifica' }
      ]
    },
    {
      id: 's4-tareas',
      sesion: 4,
      titulo: 'Tareas del caso',
      actividad: 's4-tareas',
      secciones: [
        {
          id: 'tareas',
          tipo: 'filas',
          min: 6,
          max: 8,
          columnas: [
            { id: 'tarea', label: 'Tarea', tipo: 'texto' },
            {
              id: 'opcion',
              label: 'Opción',
              tipo: 'opcion',
              opciones: [
                { id: 'la-ia-apoya', label: 'la IA apoya' },
                { id: 'la-ia-podria-realizarla', label: 'la IA podría realizarla' },
                { id: 'la-persona-es-indispensable', label: 'la persona es indispensable' }
              ]
            },
            { id: 'escalon', label: '¿Sirve de escalón de entrada?', tipo: 'sino' },
            { id: 'preservar', label: 'Cómo se preservará ese aprendizaje', tipo: 'texto' }
          ]
        },
        {
          id: 'evaluacion',
          tipo: 'matriz',
          titulo: 'Evaluación rediseñada',
          encabezado: 'Pieza',
          columnas: ['Qué se entrega', 'Qué evidencia de aprendizaje aporta'],
          filas: ['Producto auténtico', 'Bitácora de proceso', 'Defensa oral', 'Uso declarado de IA']
        },
        { id: 'usos', tipo: 'texto', label: 'Usos de IA permitidos' },
        { id: 'declaran', tipo: 'texto', label: 'Cómo se declaran' },
        { id: 'sin-ia', tipo: 'texto', label: 'Qué parte se hace sin IA' }
      ]
    },
    {
      id: 's5-semaforo',
      sesion: 5,
      titulo: 'Semáforo de evidencia',
      actividad: 's5-semaforo',
      secciones: [
        {
          id: 'afirmaciones',
          tipo: 'filas',
          min: 1,
          max: 8,
          columnas: [
            { id: 'afirmacion', label: 'Afirmación del caso', tipo: 'texto' },
            {
              id: 'escalon',
              label: 'Escalón actual',
              tipo: 'opcion',
              opciones: [
                { id: '1', label: '1' },
                { id: '2', label: '2' },
                { id: '3', label: '3' },
                { id: '4', label: '4' },
                { id: '5', label: '5' },
                { id: '6', label: '6' }
              ],
              ayuda: 's5-escalera'
            },
            {
              id: 'color',
              label: 'Color',
              tipo: 'opcion',
              opciones: [
                { id: 'verde', label: 'Verde' },
                { id: 'ambar', label: 'Ámbar' },
                { id: 'rojo', label: 'Rojo' }
              ]
            },
            { id: 'falta', label: 'Evidencia que falta', tipo: 'texto' },
            { id: 'produce', label: 'Quién la produce', tipo: 'texto' }
          ]
        }
      ]
    },
    {
      id: 's6-ciclo',
      sesion: 6,
      titulo: 'Ciclo de gobernanza',
      actividad: 's6-ciclo',
      secciones: [
        {
          id: 'impacto',
          tipo: 'opcion',
          label: 'Impacto',
          opciones: [
            { id: 'bajo', label: 'bajo' },
            { id: 'medio', label: 'medio' },
            { id: 'alto', label: 'alto' }
          ]
        },
        { id: 'reversibilidad', tipo: 'texto', label: 'Reversibilidad' },
        {
          id: 'matriz',
          tipo: 'matriz',
          encabezado: 'Paso',
          columnas: ['Control concreto', 'Responsable', 'Indicador'],
          filas: ['Inventario', 'Clasificar riesgo', 'Evaluar', 'Supervisar', 'Monitorear incidentes', 'Corregir']
        },
        {
          id: 'suspension',
          tipo: 'texto',
          label: 'Criterio de suspensión: qué evento detiene el sistema y quién decide'
        }
      ]
    },
    {
      id: 's7-plan',
      sesion: 7,
      titulo: 'Plan 2026–2028',
      actividad: 's7-plan',
      secciones: [
        {
          id: 'hitos',
          tipo: 'filas',
          min: 3,
          max: 3,
          columnas: [
            {
              id: 'anio',
              label: 'Año',
              tipo: 'opcion',
              opciones: [
                { id: '2026', label: '2026' },
                { id: '2027', label: '2027' },
                { id: '2028', label: '2028' }
              ]
            },
            { id: 'accion', label: 'Acción', tipo: 'texto' },
            {
              id: 'nivel',
              label: 'Nivel del marco de indicadores',
              tipo: 'opcion',
              opcionesDe: 's7-indicadores'
            },
            { id: 'indicador', label: 'Indicador', tipo: 'texto' },
            { id: 'responsable', label: 'Responsable', tipo: 'texto' }
          ]
        }
      ]
    },
    {
      id: 'bitacora',
      sesion: null,
      titulo: 'Bitácora de decisiones',
      secciones: [
        {
          id: 'entradas',
          tipo: 'filas',
          min: 0,
          max: null,
          columnas: [
            { id: 'fecha', label: 'Fecha', tipo: 'fecha' },
            { id: 'decision', label: 'Decisión', tipo: 'texto' },
            { id: 'porque', label: 'Por qué', tipo: 'texto' },
            { id: 'quien', label: 'Quién', tipo: 'texto' }
          ]
        }
      ]
    },
    {
      id: 'fuentes-ia',
      sesion: null,
      titulo: 'Fuentes y uso de IA',
      secciones: [
        { id: 'cifras', tipo: 'cifras' },
        { id: 'declaracion', tipo: 'texto', label: 'Declaración de cómo se usó la IA' }
      ]
    }
  ]
};

EIA.data.rubrica = {
  titulo: 'Rúbrica',
  nota: 'Cada nivel vale una fracción del peso del criterio: 4 = 100%, 3 = 75%, 2 = 50% y 1 = 25%.',
  columnas: ['Criterio', 'Peso', 'Excelente (4)', 'Adecuado (3)', 'En desarrollo (2)', 'Insuficiente (1)'],
  niveles: [
    { n: 4, label: 'Excelente' },
    { n: 3, label: 'Adecuado' },
    { n: 2, label: 'En desarrollo' },
    { n: 1, label: 'Insuficiente' }
  ],
  fracciones: { 1: 0.25, 2: 0.5, 3: 0.75, 4: 1 },
  criterios: [
    {
      id: 'evidencia',
      criterio: 'Evidencia y fuentes',
      peso: 20,
      niveles: {
        1: 'Cifras sin fuente',
        2: 'Fuentes secundarias o incompletas',
        3: 'Casi todas las cifras tienen fuente; falta precisar algún tipo de evidencia',
        4: 'Toda cifra tiene fuente primaria enlazada y tipo de evidencia identificado'
      }
    },
    {
      id: 'capacidad',
      criterio: 'Capacidad y autonomía',
      peso: 15,
      niveles: {
        1: 'Sin análisis',
        2: 'Análisis genérico de la tecnología',
        3: 'Picos y valles razonables; autonomía poco justificada',
        4: 'Picos y valles justificados; autonomía coherente con el costo del error'
      }
    },
    {
      id: 'valor',
      criterio: 'Valor y costo total',
      peso: 20,
      niveles: {
        1: 'Sin indicador de valor',
        2: 'Beneficios descritos sin medición',
        3: 'Línea base e indicador; costo total parcial',
        4: 'Línea base medible, indicador verificable y costo total completo'
      }
    },
    {
      id: 'personas',
      criterio: 'Personas y equidad',
      peso: 15,
      niveles: {
        1: 'Sin análisis de personas',
        2: 'Mención general del impacto laboral',
        3: 'Efectos en tareas con alguna mirada distributiva',
        4: 'Efectos en tareas, aprendizaje y distribución, con grupos concretos'
      }
    },
    {
      id: 'gobernanza',
      criterio: 'Gobernanza y riesgo',
      peso: 20,
      niveles: {
        1: 'Sin gobernanza',
        2: 'Controles sueltos',
        3: 'Ciclo completo sin criterio de suspensión',
        4: 'Ciclo completo con responsables, indicadores y criterio de suspensión'
      }
    },
    {
      id: 'defensa',
      criterio: 'Defensa oral',
      peso: 10,
      niveles: {
        1: 'No sostiene el trabajo',
        2: 'Respuestas vagas',
        3: 'Justifica la mayoría de las decisiones',
        4: 'Justifica las decisiones y responde con evidencia'
      }
    }
  ]
};

EIA.data.modoClase = {
  opciones: [
    { id: 's1', sesion: 1, label: 'Sesión 1' },
    { id: 's2', sesion: 2, label: 'Sesión 2' },
    { id: 's3', sesion: 3, label: 'Sesión 3' },
    { id: 's4', sesion: 4, label: 'Sesión 4' },
    { id: 's5', sesion: 5, label: 'Sesión 5' },
    { id: 's6', sesion: 6, label: 'Sesión 6' },
    { id: 's7', sesion: 7, label: 'Sesión 7' },
    { id: 'taller', label: 'Taller de 4 horas (sesiones 1, 3, 4 y 7)', sesiones: [1, 3, 4, 7], minutos: 240 }
  ],
  bloques: {
    1: [
      { agenda: 0, laminas: ['d01'], videos: ['v01'] },
      { agenda: 1, evidencia: true, videos: ['v02'] },
      { agenda: 2, actividades: ['s1-que-mide'] },
      { agenda: 3, actividades: ['s1-ficha-caso'] },
      { agenda: 4, laminas: ['d02'], discusion: true, quiz: true }
    ],
    2: [
      { agenda: 0, pregunta: true },
      { agenda: 1, laminas: ['d03', 'd04', 'd05'], videos: ['v03'] },
      { agenda: 2, actividades: ['s2-pasos'] },
      { agenda: 3, actividades: ['s2-picos-valles'] },
      { agenda: 4, discusion: true, quiz: true }
    ],
    3: [
      { agenda: 0, laminas: ['d06'], videos: ['v04'] },
      { agenda: 1, laminas: ['d07'], actividades: ['s3-embudo'] },
      { agenda: 2, laminas: ['d08'] },
      { agenda: 3, actividades: ['s3-linea-base'] },
      { agenda: 4, discusion: true, quiz: true }
    ],
    4: [
      { agenda: 0, laminas: ['d09'], videos: ['v05'] },
      { agenda: 1, actividades: ['s4-tareas'] },
      { agenda: 2, laminas: ['d10'], videos: ['v06'] },
      { agenda: 3, actividades: ['s4-evaluacion'] },
      { agenda: 4, discusion: true, quiz: true }
    ],
    5: [
      { agenda: 0, laminas: ['d11'], videos: ['v07'] },
      { agenda: 1, laminas: ['d12'] },
      { agenda: 2, actividades: ['s5-escalera'] },
      { agenda: 3, actividades: ['s5-semaforo'] },
      { agenda: 4, discusion: true, quiz: true }
    ],
    6: [
      { agenda: 0, laminas: ['d13'], videos: ['v08'] },
      { agenda: 1, laminas: ['d14'], actividades: ['s6-calendario'] },
      { agenda: 2, contenido: [7] },
      { agenda: 3, actividades: ['s6-ciclo'] },
      { agenda: 4, discusion: true, quiz: true }
    ],
    7: [
      { agenda: 0, laminas: ['d15'], videos: ['v09'] },
      { agenda: 1, laminas: ['d16'], contenido: [6, 7], actividades: ['s7-indicadores'] },
      { agenda: 2, actividades: ['s7-presentacion'] },
      { agenda: 3, laminas: ['d17'], discusion: true }
    ]
  }
};
