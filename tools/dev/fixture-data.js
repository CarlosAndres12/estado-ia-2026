/* Dev-only fixtures for tools/dev/gallery.html (T04). Not loaded by the site.
 *
 * The real js/data/*.js files may still be stubs while the engine is built, so the gallery adds a
 * few KB §13 rows (cifra, alcance, tipo, fuentes and estado copied VERBATIM from
 * contenido/base-estado-ia-2026.md, shapes per odd/spec/contracts.md §2), their sources (KB §16
 * URLs; short labels as the KB §13 links write them), one deck entry (D7, KB "Guion de
 * diapositivas" of Sesión 3) and a fixture lámina module. Entries are added only when the real data
 * does not already define them, so the gallery prefers real data once it exists.
 */
(function (EIA) {
  'use strict';

  var MCK25_ALCANCE = 'Encuesta a 1.993 participantes de 105 países, del 25 de junio al 29 de julio de 2025';

  var fuentes = {
    mck25: { etiqueta: 'McKinsey, 2025', url: 'https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai-2025',
      titulo: 'The state of AI in 2025', grupo: 'Encuestas y estudios empresariales' },
    mck26: { etiqueta: 'McKinsey, 2026', url: 'https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai',
      titulo: 'The state of AI in 2026: on the road to ROI', grupo: 'Encuestas y estudios empresariales' },
    msft: { etiqueta: 'Microsoft, 2025', url: 'https://www.microsoft.com/en-us/worklab/work-trend-index/2025-the-year-the-frontier-firm-is-born',
      titulo: 'Work Trend Index 2025', grupo: 'Encuestas y estudios empresariales' },
    hai1: { etiqueta: 'Stanford, cap. 1', url: 'https://hai.stanford.edu/assets/files/ai_index_report_2026_chapter_1_research_development.pdf',
      titulo: '1 I+D', grupo: 'Informes de síntesis' },
    hai2: { etiqueta: 'Stanford, cap. 2', url: 'https://hai.stanford.edu/assets/files/ai_index_report_2026_chapter_2_technical.pdf',
      titulo: '2 Desempeño técnico', grupo: 'Informes de síntesis' },
    hai3: { etiqueta: 'Stanford, cap. 3', url: 'https://hai.stanford.edu/assets/files/ai_index_report_2026_chapter_3_responsible_ai.pdf',
      titulo: '3 IA responsable', grupo: 'Informes de síntesis' },
    hai4: { etiqueta: 'Stanford, cap. 4', url: 'https://hai.stanford.edu/assets/files/ai_index_report_2026_chapter_4_economy.pdf',
      titulo: '4 Economía', grupo: 'Informes de síntesis' },
    hai5: { etiqueta: 'Stanford, cap. 5', url: 'https://hai.stanford.edu/assets/files/ai_index_report_2026_chapter_5_science.pdf',
      titulo: '5 Ciencia', grupo: 'Informes de síntesis' },
    hai6: { etiqueta: 'Stanford, cap. 6', url: 'https://hai.stanford.edu/assets/files/ai_index_report_2026_chapter_6_medicine.pdf',
      titulo: '6 Medicina', grupo: 'Informes de síntesis' },
    'metr-rct': { etiqueta: 'METR, 2025', url: 'https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/',
      titulo: 'ensayo con desarrolladores experimentados', grupo: 'Evaluaciones técnicas' },
    'metr-up': { etiqueta: 'METR, 2026', url: 'https://metr.org/blog/2026-02-24-uplift-update/',
      titulo: 'actualización del estudio de productividad', grupo: 'Evaluaciones técnicas' },
    ilo: { etiqueta: 'OIT, 2025', url: 'https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure',
      titulo: 'Índice global refinado de exposición a la IA generativa', grupo: 'Trabajo y educación' },
    wef: { etiqueta: 'WEF, 2025', url: 'https://www.weforum.org/publications/the-future-of-jobs-report-2025/digest/',
      titulo: 'Future of Jobs Report 2025', grupo: 'Encuestas y estudios empresariales' },
    iasr: { etiqueta: 'IASR 2026', url: 'https://internationalaisafetyreport.org/publication/international-ai-safety-report-2026',
      titulo: 'Página de la publicación', grupo: 'Informes de síntesis' },
    minciencias: { etiqueta: 'Minciencias', url: 'https://minciencias.gov.co/sala_de_prensa/colombia-consolida-su-liderazgo-regional-en-inteligencia-artificial-gracias-la',
      titulo: 'Colombia consolida su liderazgo regional en IA', grupo: 'América Latina y Colombia' },
    mintic: { etiqueta: 'MinTIC', url: 'https://mintic.gov.co/portal/inicio/Sala-de-prensa/Noticias/416782:Colombia-asciende-al-cuarto-lugar-en-el-Indice-Latinoamericano-de-Inteligencia-Artificial-de-la-CEPAL',
      titulo: 'Colombia asciende al cuarto lugar en el ILIA', grupo: 'América Latina y Colombia' },
    'ilia-perf': { etiqueta: 'perfiles', url: 'https://hdl.handle.net/11362/86020',
      titulo: 'perfiles de país (2026)', grupo: 'América Latina y Colombia' },
    dnp: { etiqueta: 'DNP', url: 'https://www.dnp.gov.co/publicaciones/Planeacion/Paginas/conpes-4144-hoja-de-ruta-colombia-inteligencia-artificial-retos-actuales-transformacion-futura.aspx',
      titulo: 'CONPES 4144', grupo: 'América Latina y Colombia' }
  };

  function row(id, tema, cifra, alcance, tipo, clase, fuentesList, estado, extra) {
    var r = { id: id, tema: tema, cifra: cifra, alcance: alcance, tipo: tipo, clase: clase,
      fuentes: fuentesList, estado: estado, sesiones: [], enBanco: true };
    if (extra) for (var k in extra) r[k] = extra[k];
    return r;
  }

  var cifras = [
    row('adop-1', 'adopcion-y-valor', '88% usa IA regularmente en al menos una función (78% un año antes)', MCK25_ALCANCE,
      'Uso declarado', 'uso', ['mck25'], 'Verificada', { sesiones: [1, 3, 7] }),
    row('adop-2', 'adopcion-y-valor', '62% experimenta o escala agentes (23% escala y 39% experimenta)', 'Ídem',
      'Uso declarado', 'uso', ['mck25'], 'Verificada', { alcanceCompleto: MCK25_ALCANCE }),
    row('adop-3', 'adopcion-y-valor', 'En ninguna función más de 10% escala agentes', 'Ídem',
      'Uso declarado', 'uso', ['mck25'], 'Verificada', { alcanceCompleto: MCK25_ALCANCE }),
    row('adop-4', 'adopcion-y-valor', 'Cerca de dos tercios no escala la IA a toda la organización (~1/3 sí)', 'Ídem',
      'Uso declarado', 'uso', ['mck25'], 'Verificada', { alcanceCompleto: MCK25_ALCANCE }),
    row('adop-5', 'adopcion-y-valor', '39% reporta algún impacto en EBIT, casi siempre menor de 5%', 'Ídem',
      'Uso declarado', 'uso', ['mck25'], 'Verificada', { alcanceCompleto: MCK25_ALCANCE }),
    row('adop-7', 'adopcion-y-valor', 'Edición 2026: ~9 de 10 usan IA; 44% escala a toda la empresa (38% un año antes); 37% impacto en EBIT; ~2 de 10 escalan agentes',
      '1.719 participantes de 97 países, del 4 de mayo al 8 de junio de 2026; no se compara directamente con 2025',
      'Uso declarado', 'uso', ['mck26'], 'Actualización'),
    row('adop-8', 'adopcion-y-valor', '81% de los líderes espera integrar agentes en 12–18 meses; 32% contratará especialistas en agentes; 28%, gestores de fuerza laboral de IA',
      '31.000 trabajadores de 31 mercados', 'Expectativa', 'expectativa', ['msft'], 'Informe base'),
    row('cap-1', 'capacidad-tecnica', 'OSWorld: de ~12% a 66,3%; referencia humana 72,35%; fallan ~1 de cada 3 intentos',
      'Benchmark de tareas en computador', 'Capacidad técnica', 'capacidad', ['hai2'], 'Verificada'),
    row('cap-3', 'capacidad-tecnica', 'GPQA por encima de la referencia de expertos (81,2%); MMMU 88,2%, 0,4 puntos bajo el mejor experto; AIME al nivel o por encima de los mejores concursantes',
      'Benchmarks', 'Capacidad técnica', 'capacidad', ['hai2'], 'Con matiz'),
    row('cap-5', 'capacidad-tecnica', 'Replicación de investigaciones de astrofísica (ReplicationBench): <20%',
      'Benchmark científico', 'Capacidad técnica', 'capacidad', ['hai5'], 'Verificada'),
    row('cap-6', 'capacidad-tecnica', 'PaperArena: 38,8% del mejor agente (Gemini 2.5 Pro multiagente) frente a 83,5% de expertos',
      'Benchmark científico', 'Capacidad técnica', 'capacidad', ['hai5'], 'Verificada'),
    row('cap-9', 'capacidad-tecnica', 'Más de 90% (91,2%) de los modelos notables de 2025 viene de la industria',
      'Conteo del AI Index', 'Capacidad técnica', 'capacidad', ['hai1'], 'Verificada'),
    row('cap-10', 'capacidad-tecnica', 'Modelos notables 2025: EE. UU. 59, China 35, Corea del Sur 8', 'Ídem',
      'Capacidad técnica', 'capacidad', ['hai1'], 'Verificada', { alcanceCompleto: 'Conteo del AI Index' }),
    row('eco-4', 'economia-e-infraestructura', 'Centros de datos de IA: ~29,6 GW', 'Al cierre de 2025',
      'Resultado observado', 'resultado', ['hai1'], 'Verificada'),
    row('eco-7', 'economia-e-infraestructura', 'Clústeres de supercomputación estatales 2018–2025: Europa y Asia Central de 3 a 44; ALC 8; China 85; Norteamérica 41',
      'Conteo regional', 'Resultado observado', 'resultado', ['hai8'], 'Verificada (corrige el «3»)'),
    row('prod-3', 'productividad', 'Expertos tardan +19% más con IA',
      'Ensayo aleatorio de julio de 2025 con 16 desarrolladores y 246 tareas; METR lo marca hoy como desactualizado',
      'Resultado observado', 'resultado', ['metr-rct'], 'Verificada'),
    row('prod-4', 'productividad', 'Seguimiento de METR: −18% de tiempo (IC 95%: −38% a +9%), no concluyente', 'Febrero de 2026',
      'Resultado observado', 'resultado', ['metr-up'], 'Actualización'),
    row('trab-1', 'trabajo', '25% del empleo mundial con alguna exposición; 34% en ingresos altos frente a 11% en ingresos bajos',
      'Índice de exposición', 'Proyección/índice', 'neutral', ['ilo'], 'Verificada'),
    row('trab-5', 'trabajo', '39% de las competencias centrales cambiará hacia 2030',
      'Más de 1.000 empleadores, 22 sectores y 55 economías', 'Proyección', 'proyeccion', ['wef'], 'Verificada'),
    row('med-1', 'medicina', 'Hasta −83% de tiempo de redacción de notas clínicas', 'Sharp HealthCare',
      'Resultado observado', 'resultado', ['hai6'], 'Verificada'),
    row('med-6', 'medicina', '2,4% de los dispositivos con estudios clínicos tuvo ensayos aleatorizados',
      'Sobre 1.016 autorizaciones hasta diciembre de 2024, no sobre los 258 de 2025', 'Resultado observado', 'resultado', ['hai6'], 'Con matiz'),
    row('ries-1', 'riesgo-y-regulacion', 'Incidentes: 233 (2024) → 362 (2025), +55%', 'AI Incident Database; los conteos se revisan',
      'Resultado observado', 'resultado', ['hai3'], 'Verificada'),
    row('ries-2', 'riesgo-y-regulacion', 'IASR 2026: publicado el 3 de febrero de 2026; más de 100 expertos; más de 30 países y organizaciones; tres familias de riesgo',
      'Informe internacional', '—', 'ninguno', ['iasr'], 'Verificada'),
    row('alc-3', 'america-latina-y-colombia', 'Colombia: 55,84 puntos; 4.º de 19 (+3,2 puntos); 12,86 sobre el promedio regional (42,98); 67,29 en adopción; 76,01 en gobernanza («gobernanza avanzada»); grupo adoptante',
      'ILIA 2025', 'Índice', 'neutral', ['minciencias', 'mintic', 'ilia-perf'], 'Verificada'),
    row('alc-4', 'america-latina-y-colombia', 'CONPES 4144: aprobado el 14 de febrero de 2025; 106 acciones hasta 2030; 479.273 millones de pesos',
      'Política nacional', 'Norma/plan', 'neutral', ['dnp'], 'Verificada')
  ];
  fuentes.hai8 = { etiqueta: 'Stanford, cap. 8', url: 'https://hai.stanford.edu/assets/files/ai_index_report_2026_chapter_8_policy_and_governance.pdf',
    titulo: '8 Políticas y gobernanza', grupo: 'Informes de síntesis' };

  EIA.data.fuentes = EIA.data.fuentes || {};
  Object.keys(fuentes).forEach(function (k) { if (!EIA.data.fuentes[k]) EIA.data.fuentes[k] = fuentes[k]; });
  EIA.data.cifras = EIA.data.cifras || [];
  var have = {};
  EIA.data.cifras.forEach(function (c) { have[c.id] = true; });
  cifras.forEach(function (c) { if (!have[c.id]) EIA.data.cifras.push(c); });
  if (EIA.cifra && EIA.cifra.reset) EIA.cifra.reset();

  EIA.dev = EIA.dev || {};
  EIA.dev.fixtureIds = cifras.map(function (c) { return c.id; });
})(window.EIA);
