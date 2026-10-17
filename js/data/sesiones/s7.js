/* js/data/sesiones/s7.js — sesión 7, KB §10 (prompt §5.3; shape in odd/spec/data-model.md).
 * Transcribed verbatim from contenido/base-estado-ia-2026.md (KB v1.1). Edit the KB and this file together,
 * then run `node tools/check-content.mjs`.
 *
 * EIA.data.sesiones[7] = { n, titulo, tema, signo, tesis, diapositivas, diapositivasMapa, laminas, videos,
 *   producto, productoSesion, pregunta, resultados, agendaTitulo, agenda: [{ desde, hasta, minutos, bloque, recurso }],
 *   bloques, contenido: [{ n, titulo, complemento?, cuerpo, bloque? }], actualizaciones: [{ contenido, fuente, caja? }],
 *   actividades, discusionTitulo, discusion, lecturas,
 *   facilitador: { laminas: { dNN: { decir, nota } }, claves: [{ actividad, titulo }] } }
 * Sesión 7 has no "Errores de lectura frecuentes" and no quiz: those keys are absent.
 * Text fields keep the KB markup: [Etiqueta][clave], **negrita**, *cursiva*, "- " lists (two spaces per level),
 * "1. " lists, pipe tables; numbers from registered figures are wrapped as {{id|texto}}.
 */
EIA.data.sesiones[7] = {
  n: 7,
  titulo: 'América Latina, Colombia y agenda 2026–2028',
  tema: 'América Latina, Colombia y agenda',
  signo: 'faro',
  tesis: 'América Latina consume IA por encima de su peso digital: concentra {{alc-1|14%}} de las visitas mundiales a soluciones de IA con {{alc-1|11%}} de los usuarios de Internet ([CEPAL, 2025][cepal-pr]). Pero su capacidad propia está por construir.',
  diapositivas: '15, 16 y 17',
  diapositivasMapa: '15–17',
  laminas: ['d15', 'd16', 'd17'],
  videos: ['v09'],
  producto: 'Presentación del proyecto final',
  productoSesion: 'presentación y defensa del proyecto final',
  pregunta: '¿Qué hacemos en 2026–2028 y cómo lo medimos?',
  resultados: [
    'Describir la posición de la región y de Colombia en el ILIA 2025.',
    'Explicar la ruta de país adoptante a capacidad propia: cómputo, datos y talento.',
    'Formular una agenda 2026–2028 con indicadores de valor verificable, costo total y riesgo controlado.'
  ],
  agendaTitulo: 'Agenda (120 min)',
  agenda: [
    { desde: 0, hasta: 25, minutos: '0–25', bloque: 'América Latina y Colombia', recurso: 'Diapositiva 15' },
    {
      desde: 25,
      hasta: 40,
      minutos: '25–40',
      bloque: 'Agenda 2026–2028 y escenarios',
      recurso: 'Diapositiva 16'
    },
    {
      desde: 40,
      hasta: 100,
      minutos: '40–100',
      bloque: 'Presentación y defensa de proyectos (7 min más 3 de preguntas por equipo)',
      recurso: 'Proyecto final'
    },
    {
      desde: 100,
      hasta: 120,
      minutos: '100–120',
      bloque: 'Cinco mensajes para decidir y cierre',
      recurso: 'Diapositiva 17'
    }
  ],
  bloques: [],
  contenido: [
    {
      n: 1,
      titulo: 'Una región que adopta rápido',
      cuerpo: 'El ILIA 2025, de CEPAL y CENIA, mide más de {{ctx-ilia-indicadores|100}} subindicadores para {{ctx-ilia-indicadores|19}} países ([CEPAL, ILIA 2025][ilia]). Los agrupa en tres dimensiones: factores habilitantes; investigación, desarrollo y adopción; y gobernanza. La región concentra {{alc-1|14%}} de las visitas mundiales a soluciones de IA con {{alc-1|11%}} de los usuarios de Internet, y es la tercera región del mundo en descargas de aplicaciones generativas ([CEPAL, comunicado][cepal-pr]).'
    },
    {
      n: 2,
      titulo: 'Consumo frente a capacidad',
      cuerpo: '- El uso se concentra en herramientas listas para el consumidor y de bajo requerimiento técnico, incluidas las de las mipymes ([CEPAL, comunicado][cepal-pr]). Eso da productividad a corto plazo, pero también dependencia tecnológica, salida de datos y captura externa del valor.\n- Los pioneros son Chile ({{alc-2|70,56 puntos}}), Brasil ({{alc-2|67,39}}) y Uruguay ({{alc-2|62,32}}). Colombia, Ecuador, Costa Rica y República Dominicana están entre los adoptantes ([CEPAL, ILIA 2025][ilia]).\n- En 2025 la región tenía {{eco-7|8}} clústeres de supercomputación con respaldo estatal, frente a {{eco-7|44}} en Europa y Asia Central ([Stanford, cap. 8][hai8]).'
    },
    {
      n: 3,
      titulo: 'Colombia en el ILIA 2025',
      cuerpo: 'Obtuvo {{alc-3|55,84 puntos}} y subió del quinto al cuarto lugar entre {{alc-3|19}} países, con {{alc-3|3,2 puntos}} más que en la edición anterior ([Minciencias][minciencias]; [MinTIC][mintic]; [perfiles de país][ilia-perf]). Está {{alc-3|12,86 puntos}} por encima del promedio regional. Tiene {{alc-3|67,29 puntos}} en adopción y {{alc-3|76,01}} en gobernanza, lo que la ubica en el grupo de «gobernanza avanzada». En la clasificación general Colombia es «adoptante», no «pionero».'
    },
    {
      n: 4,
      titulo: 'CONPES 4144',
      cuerpo: 'Se aprobó el {{alc-4|14 de febrero de 2025}} y fija la Política Nacional de IA hasta 2030, con {{alc-4|106}} acciones y una inversión indicativa de {{alc-4|479.273 millones de pesos}} ([DNP][dnp]). Sus ejes son:\n- ética y gobernanza;\n- datos e infraestructura;\n- investigación, desarrollo e innovación;\n- capacidades y talento;\n- mitigación de riesgos;\n- adopción pública, empresarial y territorial.\n\nEn 2026, la Estrategia de Datos Abiertos para IA empezó a poner en práctica el componente de datos ([datos.gov.co][datos]).'
    },
    {
      n: 5,
      titulo: 'Lo que falta',
      cuerpo: 'UNESCO reconoce avances en gobernanza, pero señala que los instrumentos regulatorios colombianos son sobre todo orientativos ([UNESCO, Observatorio][unesco-co]). Pide más coordinación institucional, gobernanza de datos, supervisión basada en riesgos, formación interdisciplinaria y capacidad pública. El reto es pasar de una política declarativa a un portafolio verificable, con indicadores periódicos.'
    },
    {
      n: 6,
      titulo: 'Agenda 2026–2028',
      complemento: '(informe base)',
      cuerpo: 'El indicador común para todos los actores es valor verificable, costo total y riesgo controlado.\n\n| Actor | Prioridades |\n|---|---|\n| Gobiernos | Medición que separe acceso, adopción, escala e impacto; cómputo y datos compartidos; regulación proporcional al riesgo; evaluación independiente; compras públicas que exijan interoperabilidad, seguridad y evidencia; capacitación con atención a mujeres, jóvenes y puestos de entrada |\n| Universidades | Política común adaptable por disciplina; alfabetización transversal en IA, datos, ética y verificación; evaluación auténtica; herramientas institucionales seguras; repositorios de casos y rúbricas; medición de efectos en aprendizaje, carga docente e inclusión |\n| Organizaciones | Pocos flujos de alto valor, con línea base previa; costo total; agentes con permisos mínimos, entornos aislados y revisión humana; rediseño de roles; impactos por experiencia, género y ocupación; gobernanza de proveedores |\n| Investigación | Diseños causales (ensayos de campo, cuasiexperimentos, estudios longitudinales); reportar versión del modelo, instrucciones, herramientas y fecha; comparar IA sola, humano solo y equipos humano–IA; publicar resultados nulos; evaluaciones en español y en contextos latinoamericanos |'
    },
    {
      n: 7,
      titulo: 'Cuatro escenarios plausibles',
      complemento: '(informe base)',
      cuerpo: '- *Difusión con bajo impacto:* más licencias sin rediseño de procesos, con un efecto financiero modesto. Es coherente con {{adop-1|88%}} de uso y {{adop-5|39%}} de impacto en EBIT ([McKinsey, 2025][mck25]).\n- *Transformación agéntica controlada:* agentes con permisos limitados, evaluación continua y supervisión humana. Logra mejoras sustantivas en TI, gestión del conocimiento, soporte y operaciones.\n- *Automatización desigual:* se reducen puestos de entrada y tareas administrativas antes de que existan rutas de transición. Sus señales son la exposición desigual y la caída del empleo juvenil en software ([OIT][ilo]; [Stanford][hai4]).\n- *Reacción regulatoria:* incidentes o impactos distributivos aceleran las obligaciones de evaluación, transparencia y responsabilidad, con la Ley de IA europea como referencia ([calendario][aisd]).'
    },
    {
      n: 8,
      titulo: 'Marco de indicadores',
      complemento: 'para el proyecto final',
      cuerpo: '| Nivel | Indicadores | Pregunta evaluativa |\n|---|---|---|\n| Insumos | Inversión, cómputo, datos, licencias, talento | ¿Qué capacidades están disponibles y para quién? |\n| Uso | Usuarios activos, frecuencia, funciones y tareas | ¿Quién usa IA y con qué finalidad? |\n| Integración | Procesos conectados, calidad de datos, herramientas y controles | ¿La IA forma parte del flujo real o es un piloto aislado? |\n| Resultado | Tiempo, costo, calidad, ingresos, satisfacción | ¿Mejora el desempeño frente a una línea base? |\n| Aprendizaje | Retención, transferencia, pensamiento crítico, autonomía | ¿La mejora se sostiene cuando se retira la ayuda? |\n| Distribución | Efectos por género, edad, territorio, experiencia y ocupación | ¿Quién recibe los beneficios y quién soporta los riesgos? |\n| Seguridad | Incidentes, severidad, recuperación, sesgo, privacidad | ¿Los riesgos están identificados y controlados? |\n| Sostenibilidad | Energía, agua, carbono, vida útil del hardware | ¿El valor justifica la huella material? |\n| Gobernanza | Evaluaciones, auditorías, responsables, reparación | ¿Existe rendición de cuentas efectiva? |'
    },
    {
      n: 9,
      titulo: 'Cinco mensajes para decidir',
      cuerpo: '1. La capacidad es irregular.\n2. Adopción no es valor ({{adop-1|88%}} de uso frente a {{adop-5|39%}} con impacto en EBIT).\n3. En el trabajo cambian tareas, no solo puestos.\n4. En educación se evalúa el aprendizaje, no el texto.\n5. La gobernanza es proporcional al riesgo.\n\nFrase de cierre: no importa cuánta IA se usa, sino cuánto valor verificable produce.'
    }
  ],
  actualizaciones: [],
  actividades: ['s7-indicadores', 's7-plan', 's7-presentacion'],
  discusionTitulo: 'Discusión de cierre',
  discusion: [
    '¿Qué escenario ve más probable para su organización en 2028 y qué señal temprana lo confirmaría?',
    '¿Qué indicador de la agenda podría empezar a medir el próximo mes?'
  ],
  lecturas: [
    'informe base («América Latina», «Agenda 2026–2028», «Marco de indicadores», «Escenarios plausibles» y «Conclusiones»)',
    '[CEPAL, ILIA 2025][ilia]',
    '[DNP, CONPES 4144][dnp]'
  ],
  facilitador: {
    laminas: {
      d15: { decir: '', nota: '' },
      d16: {
        decir: '',
        nota: 'el orden por año es una secuencia propuesta; el informe no fija un año para cada acción.'
      },
      d17: { decir: '', nota: '' }
    },
    claves: []
  }
};
