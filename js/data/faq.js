/* js/data/faq.js — frequently asked questions, KB §15 verbatim, with citations (prompt §9.8).
 * Transcribed verbatim from contenido/base-estado-ia-2026.md (KB v1.1). Edit the KB and this file together,
 * then run `node tools/check-content.mjs`.
 *
 * EIA.data.faq  [{ n, id, pregunta, respuesta }]
 *   id         'p<n>', the anchor of #preguntas/<id>
 *   respuesta  KB answer (markup: [Etiqueta][clave] citations, {{id|texto}} figures, **negrita**, *cursiva*)
 */
EIA.data.faq = [
  {
    n: 1,
    id: 'p1',
    pregunta: '¿La IA va a eliminar empleos?',
    respuesta: 'La evidencia disponible no apunta a una sustitución masiva inmediata. La OIT estima que {{trab-1|25%}} del empleo mundial tiene alguna exposición y solo {{trab-2|3,3%}} está en la categoría más alta, y considera más probable la transformación de tareas que la desaparición de puestos ([OIT, 2025][ilo]). Sí hay señales de presión en los puestos de entrada: el empleo de desarrolladores de {{trab-4|22}} a {{trab-4|25}} años cayó casi {{trab-4|20%}} desde 2024 ([Stanford, cap. 4][hai4]). Exposición no es desempleo.'
  },
  {
    n: 2,
    id: 'p2',
    pregunta: 'Si casi todas las empresas usan IA, ¿por qué no ven resultados?',
    respuesta: 'Porque el cuello de botella es organizacional. En 2025, {{adop-1|88%}} usaba IA, pero cerca de dos tercios no la habían escalado y solo {{adop-5|39%}} reportaba algún impacto en EBIT, casi siempre menor de {{adop-5|5%}} ([McKinsey, 2025][mck25]). La edición 2026 reporta {{adop-7|44%}} de organizaciones que escalan y {{adop-7|37%}} con impacto ([McKinsey, 2026][mck26]). El valor exige rediseñar flujos, integrar datos, formar personas y medir contra una línea base.'
  },
  {
    n: 3,
    id: 'p3',
    pregunta: '¿La IA ya supera a los humanos?',
    respuesta: 'En algunas pruebas sí y en otras no: es la frontera irregular. Supera la referencia de expertos en GPQA, pero queda por debajo del mejor experto en MMMU ([Stanford, cap. 2][hai2]). Además, logra menos de {{cap-5|20%}} al replicar investigaciones de astrofísica y {{cap-6|38,8%}} frente a {{cap-6|83,5%}} de los expertos en PaperArena ([Stanford, cap. 5][hai5]).'
  },
  {
    n: 4,
    id: 'p4',
    pregunta: '¿Puedo confiar en un agente de IA?',
    respuesta: 'Depende de la tarea y del costo de un error. En OSWorld los agentes llegan a {{cap-1|66,3%}} frente a una referencia humana de {{cap-1|72,35%}}, y fallan cerca de uno de cada tres intentos ([Stanford, cap. 2][hai2]). En las empresas, {{adop-2|23%}} escala agentes y en ninguna función el escalamiento supera {{adop-3|10%}} ([McKinsey, 2025][mck25]). Conviene empezar con permisos mínimos, entornos aislados y revisión humana.'
  },
  {
    n: 5,
    id: 'p5',
    pregunta: '¿La IA aumenta la productividad?',
    respuesta: 'En algunas tareas sí: {{prod-1|+14–15%}} en soporte, {{prod-1|+26%}} en software y {{prod-1|+50%}} en marketing ([Stanford, cap. 4][hai4]). En otras no: en el ensayo de METR de 2025, los expertos tardaron {{prod-3|19%}} más ([METR, 2025][metr-rct]), aunque METR marca hoy ese estudio como desactualizado ([METR, 2026][metr-up]). Las cifras sectoriales de PwC son asociaciones, no efectos causales ([PwC, 2025][pwc25]).'
  },
  {
    n: 6,
    id: 'p6',
    pregunta: '¿Cómo evito que mis estudiantes hagan trampa con IA?',
    respuesta: 'Cambiando la pregunta: no «¿usó IA?», sino «¿qué aprendió y puede justificarlo?». Combine el producto auténtico, la bitácora de proceso, la defensa oral y el uso declarado de IA ([EDUCAUSE, 2026][edu]). Defina qué usos están permitidos y preserve actividades sin IA cuando formen habilidades fundamentales. La detección perfecta de texto generado no es sostenible.'
  },
  {
    n: 7,
    id: 'p7',
    pregunta: '¿Qué exige la Ley de IA de la UE y desde cuándo?',
    respuesta: 'Para modelos de propósito general, las obligaciones rigen desde el {{ries-3|2 de agosto de 2025}} y la Comisión puede hacerlas cumplir desde el {{ries-3|2 de agosto de 2026}}. Los modelos anteriores tienen plazo hasta el {{ries-3|2 de agosto de 2027}} ([Comisión Europea][ec-gpai-gl]). El Ómnibus Digital aplazó las reglas de alto riesgo al {{ries-4|2 de diciembre de 2027}} (anexo III) y al {{ries-4|2 de agosto de 2028}} (anexo I) ([calendario][aisd]). La norma importa en América Latina si se ofrecen servicios en la UE o se usan proveedores sujetos a ella. Esto es información, no asesoría jurídica.'
  },
  {
    n: 8,
    id: 'p8',
    pregunta: '¿Cómo está Colombia en IA?',
    respuesta: 'Obtuvo {{alc-3|55,84 puntos}} en el ILIA 2025 y es cuarta entre {{alc-3|19}} países, dentro del grupo de adoptantes ([Minciencias][minciencias]; [MinTIC][mintic]). El CONPES {{alc-4|4144}} prevé {{alc-4|106}} acciones y {{alc-4|479.273 millones de pesos}} hasta 2030 ([DNP][dnp]). El reto es pasar de una política declarativa a capacidades y resultados verificables ([UNESCO][unesco-co]).'
  },
  {
    n: 9,
    id: 'p9',
    pregunta: '¿Hay más riesgo porque hay más incidentes?',
    respuesta: 'No necesariamente. Los incidentes documentados pasaron de {{ries-1|233}} a {{ries-1|362}} ([Stanford, cap. 3][hai3]), pero el aumento puede reflejar más uso y más reporte. Sin una tasa por unidad de adopción, el conteo bruto no basta. El IASR 2026 agrupa los riesgos en uso malicioso, fallos y riesgos sistémicos ([IASR 2026][iasr]).'
  },
  {
    n: 10,
    id: 'p10',
    pregunta: '¿Qué significa «valor verificable»?',
    respuesta: 'Es una mejora medida frente a una línea base, con costo total y riesgo conocidos (definición del curso). Se evalúa con el marco de indicadores de la sesión 7: insumos, uso, integración, resultado, aprendizaje, distribución, seguridad, sostenibilidad y gobernanza.'
  }
];
