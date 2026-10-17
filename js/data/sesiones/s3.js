/* js/data/sesiones/s3.js — sesión 3, KB §6 (prompt §5.3; shape in odd/spec/data-model.md).
 * Transcribed verbatim from contenido/base-estado-ia-2026.md (KB v1.1). Edit the KB and this file together,
 * then run `node tools/check-content.mjs`.
 *
 * EIA.data.sesiones[3] = { n, titulo, tema, signo, tesis, diapositivas, diapositivasMapa, laminas, videos,
 *   producto, productoSesion, pregunta, resultados, agendaTitulo, agenda: [{ desde, hasta, minutos, bloque, recurso }],
 *   bloques, contenido: [{ n, titulo, complemento?, cuerpo, bloque? }], actualizaciones: [{ contenido, fuente, caja? }],
 *   errores, actividades, discusionTitulo, discusion, quiz: [{ pregunta, opciones, respuesta, letra, explicacion, pista }], lecturas,
 *   facilitador: { laminas: { dNN: { decir, nota } }, claves: [{ actividad, titulo }] } }
 * Text fields keep the KB markup: [Etiqueta][clave], **negrita**, *cursiva*, "- " lists (two spaces per level),
 * "1. " lists, pipe tables; numbers from registered figures are wrapped as {{id|texto}}.
 */
EIA.data.sesiones[3] = {
  n: 3,
  titulo: 'Economía y adopción: capital, embudo del valor y productividad',
  tema: 'Economía y adopción',
  signo: 'puente',
  tesis: 'El capital llega rápido y el valor tarda. La inversión privada en IA creció {{eco-1|127,5%}} en 2025 ([Stanford, cap. 4][hai4]), mientras solo {{adop-5|39%}} de las organizaciones reporta algún efecto en EBIT, casi siempre menor de {{adop-5|5%}} ([McKinsey, 2025][mck25]).',
  diapositivas: '6, 7 y 8',
  diapositivasMapa: '6–8',
  laminas: ['d06', 'd07', 'd08'],
  videos: ['v04'],
  producto: 'Línea base y costo total',
  productoSesion: 'línea base y costo total del caso',
  pregunta: '¿Por qué el uso no se convierte en valor?',
  resultados: [
    'Describir la cadena capital → cómputo → modelos → productos y su concentración.',
    'Explicar por qué el uso no se convierte automáticamente en valor.',
    'Interpretar la evidencia heterogénea sobre productividad y separar asociación de causalidad.'
  ],
  agendaTitulo: 'Agenda (120 min)',
  agenda: [
    {
      desde: 0,
      hasta: 30,
      minutos: '0–30',
      bloque: 'Capital, cómputo e infraestructura',
      recurso: 'Diapositiva 6'
    },
    {
      desde: 30,
      hasta: 55,
      minutos: '30–55',
      bloque: 'Del uso al valor: el embudo',
      recurso: 'Diapositiva 7'
    },
    {
      desde: 55,
      hasta: 75,
      minutos: '55–75',
      bloque: 'Productividad: la balanza de la evidencia',
      recurso: 'Diapositiva 8'
    },
    {
      desde: 75,
      hasta: 110,
      minutos: '75–110',
      bloque: 'Línea base y costo total del caso',
      recurso: 'Actividad'
    },
    { desde: 110, hasta: 120, minutos: '110–120', bloque: 'Discusión y quiz', recurso: '—' }
  ],
  bloques: [],
  contenido: [
    {
      n: 1,
      titulo: 'Capital concentrado',
      cuerpo: '- En 2025 la inversión privada en IA llegó a {{eco-1|344.700 millones de dólares}}, {{eco-1|127,5%}} más que el año anterior ([Stanford, cap. 4][hai4]).\n- La IA generativa creció más de {{eco-1|200%}} y captó casi la mitad de esa inversión.\n- La inversión corporativa más que se duplicó, hasta {{eco-2|581.700 millones de dólares}}.\n- Estados Unidos invirtió {{eco-3|23 veces}} más capital privado que China. Stanford advierte que China puede estar subestimada por sus fondos estatales de orientación.\n- China lidera en publicaciones, citaciones, patentes concedidas e instalación de robots industriales.'
    },
    {
      n: 2,
      titulo: 'El costo que no se ve',
      cuerpo: 'La corrida final de entrenamiento fue solo una parte del gasto de cómputo de I+D: {{eco-6|9,6%}} en OpenAI (2024), {{eco-6|22,6%}} en MiniMax y {{eco-6|12,3%}} en Z.ai ([Epoch AI][epoch]). El resto se va en experimentos, datos, evaluaciones e iteraciones. Mirar solo el entrenamiento final subestima las barreras de entrada.'
    },
    {
      n: 3,
      titulo: 'Infraestructura, energía y soberanía',
      cuerpo: '- La capacidad eléctrica de los centros de datos de IA llegó a cerca de {{eco-4|29,6 GW}} al cierre de 2025 ([Stanford, cap. 1][hai1]).\n- Si la demanda crece más rápido que la eficiencia, el consumo total sube. Es el efecto rebote.\n- Entre 2018 y 2025, Europa y Asia Central pasaron de {{eco-7|3}} a {{eco-7|44}} clústeres de supercomputación con respaldo estatal. América Latina y el Caribe llegó a {{eco-7|8}}, China tiene {{eco-7|85}} y Norteamérica {{eco-7|41}} ([Stanford, cap. 8][hai8]).'
    },
    {
      n: 4,
      titulo: 'Del uso al valor (McKinsey 2025)',
      cuerpo: '- {{adop-1|88%}} usa IA regularmente en al menos una función ({{adop-1|78%}} un año antes) ([McKinsey, 2025][mck25]).\n- {{adop-2|62%}} experimenta con agentes o los escala: {{adop-2|23%}} los escala y {{adop-2|39%}} experimenta.\n- Cerca de un tercio escala la IA a toda la organización.\n- {{adop-5|39%}} reporta algún impacto en EBIT, casi siempre menor de {{adop-5|5%}}.\n- {{adop-6|64%}} dice que la IA facilita la innovación.\n- Ojo: los niveles salen de preguntas distintas de la misma encuesta. Muestran un patrón, no una cohorte que avanza de nivel en nivel.\n- *Actualización:* la edición 2026, del 25 de agosto de 2026, tiene {{adop-7|1.719}} participantes de {{adop-7|97}} países ([McKinsey, 2026][mck26]). Reporta que cerca de nueve de cada diez organizaciones usan IA, {{adop-7|44%}} la escala a toda la empresa ({{adop-7|38%}} un año antes, según esa edición) y {{adop-7|37%}} reporta algún impacto en EBIT. El curso usa la edición 2025 del informe base. No mezcles ambas ediciones como si fueran una serie.'
    },
    {
      n: 5,
      titulo: 'Seis etapas de madurez',
      cuerpo: 'Acceso → experimentación → integración → rediseño → escala → transformación. La mayoría de las organizaciones está entre la experimentación y la integración. Las de alto desempeño no se distinguen tanto por la tecnología como por rediseñar flujos, tener liderazgo, definir métricas y apuntar a la transformación ([McKinsey, 2025, PDF][mck25pdf]).'
    },
    {
      n: 6,
      titulo: 'Productividad real, pero heterogénea',
      cuerpo: '- Estudios reunidos por Stanford: {{prod-1|+14–15%}} en soporte al cliente, {{prod-1|+26%}} en desarrollo de software y {{prod-1|+50%}} en producción de marketing ([Stanford, cap. 4][hai4]).\n- Un experimento de campo con {{prod-2|4.867}} desarrolladores estimó un aumento de {{prod-2|26,08%}} en las tareas completadas, con más beneficio para los menos experimentados ([Stanford AI Index 2025, cap. 4][hai25-4]).\n- En cambio, en un ensayo aleatorio con {{prod-3|16}} desarrolladores experimentados y {{prod-3|246}} tareas en sus propios repositorios, las herramientas de comienzos de 2025 aumentaron {{prod-3|19%}} el tiempo ([METR, 2025][metr-rct]).\n- METR marca hoy ese estudio como desactualizado. Su seguimiento de febrero de 2026 no fue concluyente: {{prod-4|−18%}} de tiempo, con un intervalo de confianza de {{prod-4|95%}} entre {{prod-4|−38%}} y {{prod-4|+9%}} ([METR, 2026][metr-up]).'
    },
    {
      n: 7,
      titulo: 'Asociación no es causalidad',
      cuerpo: '- Entre 2018 y 2024, el ingreso por empleado creció {{prod-5|27,0%}} en las industrias más expuestas a la IA, frente a {{prod-5|8,5%}} (redondeado a {{prod-5|9%}}) en las menos expuestas ([PwC, 2025][pwc25]).\n- Las habilidades de IA tuvieron una prima salarial media de {{prod-6|56%}} en 2024.\n- Pero esas industrias también tienen más capital, datos, capacidad gerencial y trabajo remoto.\n- Para atribuir causalidad hacen falta adopciones escalonadas, experimentos de campo, discontinuidades o instrumentos plausibles.\n- El barómetro 2026 de PwC reporta una prima de {{prod-7|62%}} ([PwC, 2026][pwc26]).'
    },
    {
      n: 8,
      titulo: 'Intención no es adopción',
      cuerpo: 'El {{adop-8|81%}} de los líderes espera integrar agentes de forma moderada o extensa en {{adop-8|12–18}} meses. El {{adop-8|32%}} prevé contratar especialistas en agentes y el {{adop-8|28%}}, gestores de fuerza laboral de IA ([Microsoft, 2025][msft]). Son expectativas, no impacto realizado.'
    }
  ],
  actualizaciones: [
    { contenido: 4, fuente: 'mck26', caja: true },
    { contenido: 6, fuente: 'metr-up' },
    { contenido: 7, fuente: 'pwc26' }
  ],
  errores: [
    'Contar licencias, usuarios o pilotos como si fueran madurez.',
    'Leer el embudo como si fuera una cohorte.',
    'Pasar de «mejora en una tarea» a «mejora de la empresa».',
    'Tomar la correlación sectorial de PwC como un efecto causal.'
  ],
  actividades: ['s3-embudo', 's3-linea-base'],
  discusionTitulo: 'Discusión',
  discusion: [
    '¿Por qué un experto puede volverse más lento con IA aunque crea que va más rápido?',
    '¿Qué inversión complementaria (datos, procesos, formación) necesita su caso?'
  ],
  quiz: [
    {
      pregunta: 'Según McKinsey 2025, ¿qué porcentaje reporta algún impacto de la IA en EBIT?',
      opciones: ['88%', '62%', '39%'],
      respuesta: 2,
      letra: 'c',
      explicacion: '',
      pista: 'en el embudo, el uso es la primera barra y el impacto, la última.'
    },
    {
      pregunta: 'En el ensayo de METR de julio de 2025, los desarrolladores experimentados con IA:',
      opciones: ['fueron 26% más rápidos', 'tardaron 19% más', 'no cambiaron'],
      respuesta: 1,
      letra: 'b',
      explicacion: 'METR marca hoy ese estudio como desactualizado.',
      pista: 'en la balanza de la evidencia, ese ensayo está en el platillo del reloj de arena.'
    },
    {
      pregunta: 'En OpenAI, la corrida final de entrenamiento representó:',
      opciones: ['la mayor parte del cómputo de I+D', '9,6%', '50%'],
      respuesta: 1,
      letra: 'b',
      explicacion: '',
      pista: 'recuerda «el costo que no se ve»: la corrida final es solo una parte del gasto de cómputo de I+D.'
    }
  ],
  lecturas: [
    'informe base («Economía y adopción» e «Infraestructura y ambiente»)',
    '[Stanford, Economía][hai-eco]',
    '[METR, 2025][metr-rct]'
  ],
  facilitador: {
    laminas: {
      d06: { decir: '', nota: '' },
      d07: { decir: 'los niveles vienen de preguntas distintas; mencionar la edición 2026.', nota: '' },
      d08: { decir: '', nota: '' }
    },
    claves: []
  }
};
