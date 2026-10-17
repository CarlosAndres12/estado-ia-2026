/* js/data/glosario.js — glossary, KB §12 in KB order (contracts §2).
 * Transcribed verbatim from contenido/base-estado-ia-2026.md (KB v1.1). Edit the KB and this file together,
 * then run `node tools/check-content.mjs`.
 *
 * EIA.data.glosario  [{ id, termino, definicion, variantes, excluir? }]
 *   id          EIA.util.slug(termino), the anchor of #glosario/<id>
 *   termino     KB term, verbatim;  definicion  KB definition, verbatim
 *   variantes   lowercase forms that detect the term in text (whole words; first occurrence per view)
 *   excluir     lowercase phrases where a variant means something else and gets no tooltip
 */
EIA.data.glosario = [
  {
    id: 'agente',
    termino: 'Agente',
    definicion: 'Sistema de IA que persigue un objetivo en varios pasos: planifica, usa herramientas, ejecuta acciones y verifica resultados.',
    variantes: ['agente', 'agentes']
  },
  {
    id: 'benchmark',
    termino: 'Benchmark',
    definicion: 'Prueba estandarizada que mide desempeño en condiciones controladas; no equivale a desempeño en el trabajo real.',
    variantes: ['benchmark', 'benchmarks']
  },
  {
    id: 'colas-de-error',
    termino: 'Colas de error',
    definicion: 'Fallos poco frecuentes pero graves que el promedio oculta.',
    variantes: ['colas de error']
  },
  {
    id: 'conciencia-situacional-de-la-evaluacion',
    termino: 'Conciencia situacional de la evaluación',
    definicion: 'Capacidad de un modelo para detectar que está siendo evaluado y comportarse distinto.',
    variantes: ['conciencia situacional de la evaluación', 'conciencia situacional']
  },
  {
    id: 'costo-total',
    termino: 'Costo total',
    definicion: 'Suma de licencias, integración, cómputo, revisión humana, errores, seguridad y formación de un uso de IA.',
    variantes: ['costo total']
  },
  {
    id: 'ebit',
    termino: 'EBIT',
    definicion: 'Utilidad antes de intereses e impuestos; mide el resultado operativo de una empresa.',
    variantes: ['ebit']
  },
  {
    id: 'efecto-rebote',
    termino: 'Efecto rebote',
    definicion: 'Aumento del consumo total cuando la eficiencia abarata el uso y la demanda crece más rápido que la eficiencia.',
    variantes: ['efecto rebote']
  },
  {
    id: 'escala',
    termino: 'Escala',
    definicion: 'Despliegue sostenido en procesos, unidades o funciones, con infraestructura, gobernanza y métricas.',
    variantes: ['escala'],
    excluir: ['escala agentes', 'escala la ia', 'escala a toda', 'la escala a toda', 'los escala', '% escala y']
  },
  {
    id: 'evaluacion-autentica',
    termino: 'Evaluación auténtica',
    definicion: 'Evaluación basada en productos y desempeños cercanos a la práctica real, con evidencia del proceso.',
    variantes: ['evaluación auténtica', 'evaluaciones auténticas']
  },
  {
    id: 'exposicion-ocupacional',
    termino: 'Exposición ocupacional',
    definicion: 'Proporción de tareas de una ocupación que la IA puede apoyar o realizar; no es un pronóstico de pérdida de empleo.',
    variantes: ['exposición ocupacional', 'exposición'],
    excluir: ['exposición con diapositivas']
  },
  {
    id: 'frontera-irregular',
    termino: 'Frontera irregular',
    definicion: 'Coexistencia de capacidades sobresalientes en tareas delimitadas con fallos elementales en otras.',
    variantes: ['frontera irregular']
  },
  {
    id: 'horizonte-de-tareas',
    termino: 'Horizonte de tareas',
    definicion: 'Duración de las tareas que un agente completa con 50% de éxito, según la medición de METR.',
    variantes: ['horizonte de tareas']
  },
  {
    id: 'ilia',
    termino: 'ILIA',
    definicion: 'Índice Latinoamericano de Inteligencia Artificial, de CEPAL y CENIA.',
    variantes: ['ilia']
  },
  {
    id: 'modelo-de-proposito-general-gpai',
    termino: 'Modelo de propósito general (GPAI)',
    definicion: 'Modelo capaz de realizar tareas muy diversas; categoría con obligaciones propias en la Ley de IA de la UE.',
    variantes: ['modelo de propósito general', 'modelos de propósito general', 'gpai']
  },
  {
    id: 'modelo-notable',
    termino: 'Modelo notable',
    definicion: 'Modelo que el AI Index incluye en su conteo por su influencia o su desempeño.',
    variantes: ['modelo notable', 'modelos notables']
  },
  {
    id: 'pesos-abiertos',
    termino: 'Pesos abiertos',
    definicion: 'Modelo cuyos parámetros se publican; no implica acceso a los datos, el código ni el proceso de entrenamiento.',
    variantes: ['pesos abiertos']
  },
  {
    id: 'reward-hacking',
    termino: 'Reward hacking',
    definicion: 'Conducta de un sistema que optimiza la métrica de la prueba sin cumplir el objetivo que esta pretendía medir.',
    variantes: ['reward hacking']
  },
  {
    id: 'riesgo-sistemico',
    termino: 'Riesgo sistémico',
    definicion: 'En el IASR 2026, daño que surge del efecto agregado de la IA en la sociedad. En la Ley de IA de la UE, categoría de modelos de propósito general con capacidades de alto impacto.',
    variantes: ['riesgo sistémico', 'riesgos sistémicos']
  },
  {
    id: 'uso-declarado',
    termino: 'Uso declarado',
    definicion: 'Lo que personas u organizaciones dicen hacer con IA en una encuesta.',
    variantes: ['uso declarado']
  },
  {
    id: 'valor-verificable',
    termino: 'Valor verificable',
    definicion: 'Mejora medida frente a una línea base, con costo total y riesgo conocidos.',
    variantes: ['valor verificable']
  }
];
