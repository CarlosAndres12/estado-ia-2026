/* js/data/fuentes.js — references keyed by the KB link labels (prompt §5.4, contracts §2).
 * Transcribed verbatim from contenido/base-estado-ia-2026.md (KB v1.1). Edit the KB and this file together,
 * then run `node tools/check-content.mjs`.
 *
 * EIA.data.fuentes  { [key]: { etiqueta, url, titulo, autor, grupo } }, in KB link-definition order:
 *   etiqueta  short label for tags and citations: the most specific label the KB uses for the key
 *             (e.g. "McKinsey, 2025", "Stanford AI Index 2026, cap. 4", "METR, 2025")
 *   url       the KB's URL, exactly
 *   titulo    the link text of the key in KB §16, verbatim (e.g. "The state of AI in 2025", "1 I+D")
 *   autor     the author/year lead of its KB §16 entry ('' when the link text names the work)
 *   grupo     its KB §16 group ("Informes de síntesis", …)
 * EIA.data.referencias  [{ grupo, items: ['…markup…'] }]  KB §16 exactly as grouped there; items keep the
 *             KB markup ([Etiqueta][clave], *cursiva*) for js/core/markup.js.
 */
EIA.data.fuentes = {
  mck25: {
    etiqueta: 'McKinsey, 2025',
    url: 'https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai-2025',
    titulo: 'The state of AI in 2025',
    autor: 'McKinsey (2025)',
    grupo: 'Encuestas y estudios empresariales'
  },
  mck25pdf: {
    etiqueta: 'McKinsey, 2025, PDF',
    url: 'https://www.mckinsey.com/~/media/mckinsey/business%20functions/quantumblack/our%20insights/the%20state%20of%20ai/the-state-of-ai-in-2025-vf.pdf',
    titulo: 'informe (PDF)',
    autor: 'McKinsey (2025)',
    grupo: 'Encuestas y estudios empresariales'
  },
  mck26: {
    etiqueta: 'McKinsey, 2026',
    url: 'https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai',
    titulo: 'The state of AI in 2026: on the road to ROI',
    autor: 'McKinsey (2026)',
    grupo: 'Encuestas y estudios empresariales'
  },
  msft: {
    etiqueta: 'Microsoft, 2025',
    url: 'https://www.microsoft.com/en-us/worklab/work-trend-index/2025-the-year-the-frontier-firm-is-born',
    titulo: 'Work Trend Index 2025',
    autor: 'Microsoft (2025)',
    grupo: 'Encuestas y estudios empresariales'
  },
  hai: {
    etiqueta: 'Stanford AI Index 2026',
    url: 'https://hai.stanford.edu/ai-index/2026-ai-index-report',
    titulo: 'The 2026 AI Index Report',
    autor: 'Stanford HAI (2026)',
    grupo: 'Informes de síntesis'
  },
  'hai-eco': {
    etiqueta: 'Stanford AI Index 2026, Economía',
    url: 'https://hai.stanford.edu/ai-index/2026-ai-index-report/economy',
    titulo: 'Economía',
    autor: 'Stanford HAI (2026)',
    grupo: 'Informes de síntesis'
  },
  'hai-sci': {
    etiqueta: 'Stanford AI Index 2026, Ciencia',
    url: 'https://hai.stanford.edu/ai-index/2026-ai-index-report/science',
    titulo: 'Ciencia',
    autor: 'Stanford HAI (2026)',
    grupo: 'Informes de síntesis'
  },
  'hai-med': {
    etiqueta: 'Stanford AI Index 2026, Medicina',
    url: 'https://hai.stanford.edu/ai-index/2026-ai-index-report/medicine',
    titulo: 'Medicina',
    autor: 'Stanford HAI (2026)',
    grupo: 'Informes de síntesis'
  },
  'hai-edu': {
    etiqueta: 'Stanford AI Index 2026, Educación',
    url: 'https://hai.stanford.edu/ai-index/2026-ai-index-report/education',
    titulo: 'Educación',
    autor: 'Stanford HAI (2026)',
    grupo: 'Informes de síntesis'
  },
  'hai-pol': {
    etiqueta: 'Stanford AI Index 2026, Políticas y gobernanza',
    url: 'https://hai.stanford.edu/ai-index/2026-ai-index-report/policy-and-governance',
    titulo: 'Políticas y gobernanza',
    autor: 'Stanford HAI (2026)',
    grupo: 'Informes de síntesis'
  },
  hai1: {
    etiqueta: 'Stanford AI Index 2026, cap. 1',
    url: 'https://hai.stanford.edu/assets/files/ai_index_report_2026_chapter_1_research_development.pdf',
    titulo: '1 I+D',
    autor: 'Stanford HAI (2026)',
    grupo: 'Informes de síntesis'
  },
  hai2: {
    etiqueta: 'Stanford AI Index 2026, cap. 2',
    url: 'https://hai.stanford.edu/assets/files/ai_index_report_2026_chapter_2_technical.pdf',
    titulo: '2 Desempeño técnico',
    autor: 'Stanford HAI (2026)',
    grupo: 'Informes de síntesis'
  },
  hai3: {
    etiqueta: 'Stanford AI Index 2026, cap. 3',
    url: 'https://hai.stanford.edu/assets/files/ai_index_report_2026_chapter_3_responsible_ai.pdf',
    titulo: '3 IA responsable',
    autor: 'Stanford HAI (2026)',
    grupo: 'Informes de síntesis'
  },
  hai4: {
    etiqueta: 'Stanford AI Index 2026, cap. 4',
    url: 'https://hai.stanford.edu/assets/files/ai_index_report_2026_chapter_4_economy.pdf',
    titulo: '4 Economía',
    autor: 'Stanford HAI (2026)',
    grupo: 'Informes de síntesis'
  },
  hai5: {
    etiqueta: 'Stanford AI Index 2026, cap. 5',
    url: 'https://hai.stanford.edu/assets/files/ai_index_report_2026_chapter_5_science.pdf',
    titulo: '5 Ciencia',
    autor: 'Stanford HAI (2026)',
    grupo: 'Informes de síntesis'
  },
  hai6: {
    etiqueta: 'Stanford AI Index 2026, cap. 6',
    url: 'https://hai.stanford.edu/assets/files/ai_index_report_2026_chapter_6_medicine.pdf',
    titulo: '6 Medicina',
    autor: 'Stanford HAI (2026)',
    grupo: 'Informes de síntesis'
  },
  hai7: {
    etiqueta: 'Stanford AI Index 2026, cap. 7',
    url: 'https://hai.stanford.edu/assets/files/ai_index_report_2026_chapter_7_education.pdf',
    titulo: '7 Educación',
    autor: 'Stanford HAI (2026)',
    grupo: 'Informes de síntesis'
  },
  hai8: {
    etiqueta: 'Stanford AI Index 2026, cap. 8',
    url: 'https://hai.stanford.edu/assets/files/ai_index_report_2026_chapter_8_policy_and_governance.pdf',
    titulo: '8 Políticas y gobernanza',
    autor: 'Stanford HAI (2026)',
    grupo: 'Informes de síntesis'
  },
  hai12: {
    etiqueta: 'Stanford HAI, 2026',
    url: 'https://hai.stanford.edu/news/inside-the-ai-index-12-takeaways-from-the-2026-report',
    titulo: 'Inside the AI Index: 12 takeaways from the 2026 report',
    autor: 'Stanford HAI (2026)',
    grupo: 'Informes de síntesis'
  },
  'hai25-4': {
    etiqueta: 'Stanford AI Index 2025, cap. 4',
    url: 'https://hai.stanford.edu/assets/files/hai_ai-index-report-2025_chapter4_final.pdf',
    titulo: 'AI Index 2025, capítulo 4: Economía (PDF)',
    autor: 'Stanford HAI (2025)',
    grupo: 'Informes de síntesis'
  },
  unu: {
    etiqueta: 'UNU C3',
    url: 'https://c3.unu.edu/blog/2026-stanford-ai-index-report-takeaways',
    titulo: 'UNU C3 sobre el AI Index 2026',
    autor: '',
    grupo: 'Informes de síntesis'
  },
  ibm25: {
    etiqueta: 'IBM sobre el AI Index 2025',
    url: 'https://www.ibm.com/think/news/stanford-hai-2025-ai-index-report',
    titulo: 'IBM sobre el AI Index 2025',
    autor: '',
    grupo: 'Informes de síntesis'
  },
  iasr: {
    etiqueta: 'IASR 2026',
    url: 'https://internationalaisafetyreport.org/publication/international-ai-safety-report-2026',
    titulo: 'Página de la publicación',
    autor: 'International AI Safety Report (2026)',
    grupo: 'Informes de síntesis'
  },
  'iasr-es': {
    etiqueta: 'IASR 2026, resumen ejecutivo',
    url: 'https://internationalaisafetyreport.org/publication/2026-report-executive-summary',
    titulo: 'resumen ejecutivo',
    autor: 'International AI Safety Report (2026)',
    grupo: 'Informes de síntesis'
  },
  'iasr-pdf': {
    etiqueta: 'IASR 2026, informe completo (PDF)',
    url: 'https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026.pdf',
    titulo: 'informe completo (PDF)',
    autor: 'International AI Safety Report (2026)',
    grupo: 'Informes de síntesis'
  },
  pwc25: {
    etiqueta: 'PwC, 2025',
    url: 'https://www.pwc.com/gx/en/news-room/press-releases/2025/ai-linked-to-a-fourfold-increase-in-productivity-growth.html',
    titulo: '2025 Global AI Jobs Barometer',
    autor: 'PwC (2025)',
    grupo: 'Encuestas y estudios empresariales'
  },
  pwc25pdf: {
    etiqueta: 'PwC, 2025, PDF',
    url: 'https://www.pwc.com/gx/en/issues/artificial-intelligence/job-barometer/2025/report.pdf',
    titulo: 'informe (PDF)',
    autor: 'PwC (2025)',
    grupo: 'Encuestas y estudios empresariales'
  },
  pwc26: {
    etiqueta: 'PwC, 2026',
    url: 'https://www.pwc.com/gx/en/news-room/press-releases/2026/pwc-2026-ai-jobs-barometer.html',
    titulo: '2026 Global AI Jobs Barometer',
    autor: 'PwC (2026)',
    grupo: 'Encuestas y estudios empresariales'
  },
  wef: {
    etiqueta: 'WEF, 2025',
    url: 'https://www.weforum.org/publications/the-future-of-jobs-report-2025/digest/',
    titulo: 'Future of Jobs Report 2025',
    autor: 'Foro Económico Mundial (2025)',
    grupo: 'Encuestas y estudios empresariales'
  },
  'wef-jobs': {
    etiqueta: 'WEF, 2025',
    url: 'https://www.weforum.org/stories/jobs-and-the-future-of-work/future-of-jobs-report-2025-the-fastest-growing-and-declining-jobs/',
    titulo: 'empleos de mayor crecimiento',
    autor: 'Foro Económico Mundial (2025)',
    grupo: 'Encuestas y estudios empresariales'
  },
  'metr-th': {
    etiqueta: 'METR, 2025',
    url: 'https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/',
    titulo: 'Measuring AI ability to complete long tasks',
    autor: 'METR (2025)',
    grupo: 'Evaluaciones técnicas'
  },
  'metr-rct': {
    etiqueta: 'METR, 2025',
    url: 'https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/',
    titulo: 'ensayo con desarrolladores experimentados',
    autor: 'METR (2025)',
    grupo: 'Evaluaciones técnicas'
  },
  'metr-th11': {
    etiqueta: 'METR, 2026',
    url: 'https://metr.org/blog/2026-1-29-time-horizon-1-1/',
    titulo: 'Time Horizon 1.1',
    autor: 'METR (2026)',
    grupo: 'Evaluaciones técnicas'
  },
  'metr-up': {
    etiqueta: 'METR, 2026',
    url: 'https://metr.org/blog/2026-02-24-uplift-update/',
    titulo: 'actualización del estudio de productividad',
    autor: 'METR (2026)',
    grupo: 'Evaluaciones técnicas'
  },
  epoch: {
    etiqueta: 'Epoch AI',
    url: 'https://epoch.ai/gradient-updates/r-and-d-vs-training-compute',
    titulo: 'Final training runs account for a minority of R&D compute spending',
    autor: 'Epoch AI (2026)',
    grupo: 'Evaluaciones técnicas'
  },
  ilo: {
    etiqueta: 'OIT, 2025',
    url: 'https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure',
    titulo: 'Índice global refinado de exposición a la IA generativa',
    autor: 'OIT (2025)',
    grupo: 'Trabajo y educación'
  },
  'ilo-pdf': {
    etiqueta: 'OIT, 2025, PDF',
    url: 'https://www.ilo.org/sites/default/files/2025-05/WP140_web.pdf',
    titulo: 'documento (PDF)',
    autor: 'OIT (2025)',
    grupo: 'Trabajo y educación'
  },
  'ilo-news': {
    etiqueta: 'OIT, 2025, nota de prensa',
    url: 'https://www.ilo.org/resource/news/one-four-jobs-risk-being-transformed-genai-new-ilo%E2%80%93nask-global-index-shows',
    titulo: 'nota de prensa',
    autor: 'OIT (2025)',
    grupo: 'Trabajo y educación'
  },
  dec: {
    etiqueta: 'Digital Education Council, 2024',
    url: 'https://www.digitaleducationcouncil.com/post/what-students-want-key-results-from-dec-global-ai-student-survey-2024',
    titulo: 'Global AI Student Survey 2024',
    autor: 'Digital Education Council (2024)',
    grupo: 'Trabajo y educación'
  },
  ct: {
    etiqueta: 'Campus Technology',
    url: 'https://campustechnology.com/articles/2024/08/28/survey-86-of-students-already-use-ai-in-their-studies.aspx',
    titulo: 'Campus Technology',
    autor: '',
    grupo: 'Trabajo y educación'
  },
  unesco: {
    etiqueta: 'UNESCO, 2025',
    url: 'https://www.unesco.org/en/articles/unesco-survey-two-thirds-higher-education-institutions-have-or-are-developing-guidance-ai-use',
    titulo: 'Encuesta sobre IA en educación superior',
    autor: 'UNESCO (2025)',
    grupo: 'Trabajo y educación'
  },
  'unesco-dlw': {
    etiqueta: 'UNESCO, Digital Learning Week 2025',
    url: 'https://www.unesco.org/en/articles/unesco-convenes-global-leaders-digital-learning-week-2025-shape-inclusive-human-centred-futures-ai',
    titulo: 'Digital Learning Week 2025',
    autor: 'UNESCO (2025)',
    grupo: 'Trabajo y educación'
  },
  edu: {
    etiqueta: 'EDUCAUSE Horizon Report 2026',
    url: 'https://library.educause.edu/-/media/files/library/2026/5/2026hrteachinglearning.pdf',
    titulo: 'Horizon Report, Teaching and Learning Edition (PDF)',
    autor: 'EDUCAUSE (2026)',
    grupo: 'Trabajo y educación'
  },
  csun: {
    etiqueta: 'CSUN',
    url: 'https://news.csun.edu/faculty-and-staff/2026-educause-horizon-report-teaching-and-learning/',
    titulo: 'resumen de CSUN',
    autor: 'EDUCAUSE (2026)',
    grupo: 'Trabajo y educación'
  },
  'ec-aia': {
    etiqueta: 'Comisión Europea',
    url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai',
    titulo: 'Marco regulatorio de la Ley de IA',
    autor: 'Comisión Europea',
    grupo: 'Regulación'
  },
  'ec-gpai-obl': {
    etiqueta: 'Comisión Europea, obligaciones GPAI',
    url: 'https://digital-strategy.ec.europa.eu/en/factpages/general-purpose-ai-obligations-under-ai-act',
    titulo: 'obligaciones GPAI',
    autor: 'Comisión Europea',
    grupo: 'Regulación'
  },
  'ec-gpai-faq': {
    etiqueta: 'Comisión Europea, preguntas frecuentes GPAI',
    url: 'https://digital-strategy.ec.europa.eu/en/faqs/guidelines-obligations-general-purpose-ai-providers',
    titulo: 'preguntas frecuentes GPAI',
    autor: 'Comisión Europea',
    grupo: 'Regulación'
  },
  'ec-gpai-gl': {
    etiqueta: 'Comisión Europea, directrices GPAI',
    url: 'https://digital-strategy.ec.europa.eu/en/policies/guidelines-gpai-providers',
    titulo: 'directrices GPAI',
    autor: 'Comisión Europea',
    grupo: 'Regulación'
  },
  aisd: {
    etiqueta: 'AI Act Service Desk',
    url: 'https://ai-act-service-desk.ec.europa.eu/en/ai-act/timeline/timeline-implementation-eu-ai-act',
    titulo: 'Calendario de aplicación',
    autor: 'AI Act Service Desk',
    grupo: 'Regulación'
  },
  eurlex: {
    etiqueta: 'EUR-Lex',
    url: 'https://eur-lex.europa.eu/eli/reg/2026/1744/oj',
    titulo: 'Reglamento (UE) 2026/1744, Ómnibus Digital sobre IA',
    autor: 'Unión Europea (2026)',
    grupo: 'Regulación'
  },
  'cepal-pr': {
    etiqueta: 'CEPAL, comunicado',
    url: 'https://www.cepal.org/es/comunicados/america-latina-caribe-acelera-la-adopcion-la-inteligencia-artificial-aunque-desafios',
    titulo: 'comunicado',
    autor: 'CEPAL y CENIA (2025)',
    grupo: 'América Latina y Colombia'
  },
  'cepal-nota': {
    etiqueta: 'CEPAL, nota',
    url: 'https://www.cepal.org/es/notas/ilia-2025-se-consolida-como-instrumento-diseno-politicas-inteligencia-artificial-la-region',
    titulo: 'nota',
    autor: 'CEPAL y CENIA (2025)',
    grupo: 'América Latina y Colombia'
  },
  ilia: {
    etiqueta: 'CEPAL, ILIA 2025',
    url: 'https://www.cepal.org/es/publicaciones/82514-indice-latinoamericano-inteligencia-artificial-ilia-2025',
    titulo: 'ILIA 2025',
    autor: 'CEPAL y CENIA (2025)',
    grupo: 'América Latina y Colombia'
  },
  'ilia-pdf': {
    etiqueta: 'CEPAL, ILIA 2025, PDF',
    url: 'https://repositorio.cepal.org/server/api/core/bitstreams/d7f13839-caee-4abb-8ef9-9df335698e39/content',
    titulo: 'PDF',
    autor: 'CEPAL y CENIA (2025)',
    grupo: 'América Latina y Colombia'
  },
  'ilia-repo': {
    etiqueta: 'CEPAL, ILIA 2025, repositorio',
    url: 'https://repositorio.cepal.org/handle/11362/82514',
    titulo: 'repositorio',
    autor: 'CEPAL y CENIA (2025)',
    grupo: 'América Latina y Colombia'
  },
  'ilia-perf': {
    etiqueta: 'CEPAL, perfiles de país (2026)',
    url: 'https://hdl.handle.net/11362/86020',
    titulo: 'perfiles de país (2026)',
    autor: 'CEPAL y CENIA (2025)',
    grupo: 'América Latina y Colombia'
  },
  minciencias: {
    etiqueta: 'Minciencias',
    url: 'https://minciencias.gov.co/sala_de_prensa/colombia-consolida-su-liderazgo-regional-en-inteligencia-artificial-gracias-la',
    titulo: 'Colombia consolida su liderazgo regional en IA',
    autor: 'Minciencias (2025)',
    grupo: 'América Latina y Colombia'
  },
  mintic: {
    etiqueta: 'MinTIC',
    url: 'https://mintic.gov.co/portal/inicio/Sala-de-prensa/Noticias/416782:Colombia-asciende-al-cuarto-lugar-en-el-Indice-Latinoamericano-de-Inteligencia-Artificial-de-la-CEPAL',
    titulo: 'Colombia asciende al cuarto lugar en el ILIA',
    autor: 'MinTIC',
    grupo: 'América Latina y Colombia'
  },
  dnp: {
    etiqueta: 'DNP, CONPES 4144',
    url: 'https://www.dnp.gov.co/publicaciones/Planeacion/Paginas/conpes-4144-hoja-de-ruta-colombia-inteligencia-artificial-retos-actuales-transformacion-futura.aspx',
    titulo: 'CONPES 4144',
    autor: 'DNP (2025)',
    grupo: 'América Latina y Colombia'
  },
  'dnp-art': {
    etiqueta: 'DNP, artículo',
    url: 'https://colaboracion.dnp.gov.co/CDT/PublishingImages/Planeacion-y-desarrollo/2025/Abril/Articulos/Inteligencia-Artificial.pdf',
    titulo: 'artículo (PDF)',
    autor: 'DNP (2025)',
    grupo: 'América Latina y Colombia'
  },
  siteal: {
    etiqueta: 'SITEAL–UNESCO, CONPES 4144',
    url: 'https://siteal.iiep.unesco.org/pt/node/5203',
    titulo: 'SITEAL–UNESCO, CONPES 4144',
    autor: '',
    grupo: 'América Latina y Colombia'
  },
  datos: {
    etiqueta: 'datos.gov.co',
    url: 'https://www.datos.gov.co/stories/en/s/Estrategia-de-Datos-Abiertos-para-Inteligencia-Art/4g7r-j7xi/',
    titulo: 'Estrategia de Datos Abiertos para IA',
    autor: 'datos.gov.co (2026)',
    grupo: 'América Latina y Colombia'
  },
  'unesco-co': {
    etiqueta: 'UNESCO, Observatorio',
    url: 'https://www.unesco.org/ethics-ai/es/colombia',
    titulo: 'Observatorio Global de Ética y Gobernanza de la IA: Colombia',
    autor: 'UNESCO',
    grupo: 'América Latina y Colombia'
  }
};

EIA.data.referencias = [
  {
    grupo: 'Informe base',
    items: [
      '*Estado del arte de la inteligencia artificial en 2026*, corte al 14 de octubre de 2026 (documento del curso).'
    ]
  },
  {
    grupo: 'Informes de síntesis',
    items: [
      'Stanford HAI (2026). [The 2026 AI Index Report][hai]. Capítulos web: [Economía][hai-eco], [Ciencia][hai-sci], [Medicina][hai-med], [Educación][hai-edu], [Políticas y gobernanza][hai-pol].',
      'Stanford HAI (2026). Capítulos en PDF: [1 I+D][hai1], [2 Desempeño técnico][hai2], [3 IA responsable][hai3], [4 Economía][hai4], [5 Ciencia][hai5], [6 Medicina][hai6], [7 Educación][hai7], [8 Políticas y gobernanza][hai8].',
      'Stanford HAI (2026). [Inside the AI Index: 12 takeaways from the 2026 report][hai12].',
      'Stanford HAI (2025). [AI Index 2025, capítulo 4: Economía (PDF)][hai25-4].',
      'International AI Safety Report (2026). [Página de la publicación][iasr]; [resumen ejecutivo][iasr-es]; [informe completo (PDF)][iasr-pdf].',
      'Resúmenes secundarios: [UNU C3 sobre el AI Index 2026][unu]; [IBM sobre el AI Index 2025][ibm25].'
    ]
  },
  {
    grupo: 'Encuestas y estudios empresariales',
    items: [
      'McKinsey (2025). [The state of AI in 2025][mck25]; [informe (PDF)][mck25pdf].',
      'McKinsey (2026). [The state of AI in 2026: on the road to ROI][mck26].',
      'Microsoft (2025). [Work Trend Index 2025][msft].',
      'PwC (2025). [2025 Global AI Jobs Barometer][pwc25]; [informe (PDF)][pwc25pdf]. PwC (2026). [2026 Global AI Jobs Barometer][pwc26].',
      'Foro Económico Mundial (2025). [Future of Jobs Report 2025][wef]; [empleos de mayor crecimiento][wef-jobs].'
    ]
  },
  {
    grupo: 'Evaluaciones técnicas',
    items: [
      'METR (2025). [Measuring AI ability to complete long tasks][metr-th]; [ensayo con desarrolladores experimentados][metr-rct].',
      'METR (2026). [Time Horizon 1.1][metr-th11]; [actualización del estudio de productividad][metr-up].',
      'Epoch AI (2026). [Final training runs account for a minority of R&D compute spending][epoch].'
    ]
  },
  {
    grupo: 'Trabajo y educación',
    items: [
      'OIT (2025). [Índice global refinado de exposición a la IA generativa][ilo]; [documento (PDF)][ilo-pdf]; [nota de prensa][ilo-news].',
      'Digital Education Council (2024). [Global AI Student Survey 2024][dec]; [Campus Technology][ct].',
      'UNESCO (2025). [Encuesta sobre IA en educación superior][unesco]; [Digital Learning Week 2025][unesco-dlw].',
      'EDUCAUSE (2026). [Horizon Report, Teaching and Learning Edition (PDF)][edu]; [resumen de CSUN][csun].'
    ]
  },
  {
    grupo: 'Regulación',
    items: [
      'Comisión Europea. [Marco regulatorio de la Ley de IA][ec-aia]; [obligaciones GPAI][ec-gpai-obl]; [preguntas frecuentes GPAI][ec-gpai-faq]; [directrices GPAI][ec-gpai-gl].',
      'AI Act Service Desk. [Calendario de aplicación][aisd].',
      'Unión Europea (2026). [Reglamento (UE) 2026/1744, Ómnibus Digital sobre IA][eurlex].'
    ]
  },
  {
    grupo: 'América Latina y Colombia',
    items: [
      'CEPAL y CENIA (2025). [ILIA 2025][ilia]; [PDF][ilia-pdf]; [repositorio][ilia-repo]; [comunicado][cepal-pr]; [nota][cepal-nota]; [perfiles de país (2026)][ilia-perf].',
      'Minciencias (2025). [Colombia consolida su liderazgo regional en IA][minciencias]. MinTIC. [Colombia asciende al cuarto lugar en el ILIA][mintic].',
      'DNP (2025). [CONPES 4144][dnp]; [artículo (PDF)][dnp-art]. [SITEAL–UNESCO, CONPES 4144][siteal].',
      'datos.gov.co (2026). [Estrategia de Datos Abiertos para IA][datos].',
      'UNESCO. [Observatorio Global de Ética y Gobernanza de la IA: Colombia][unesco-co].'
    ]
  }
];
