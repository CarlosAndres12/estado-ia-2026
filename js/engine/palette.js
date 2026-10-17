/* Estado de la IA 2026 — palettes and course legend (prompt §3.9 and §4), in ONE place.
 *
 * Mirrored as CSS custom properties in css/tokens.css; change both together.
 *
 *   EIA.engine.palette = {
 *     mundo      warm world: paper, ink, flat primaries, earths, gold
 *     pieles     five skin tones, light to deep
 *     maquina    the AI's world and controlled conditions (navy, pale-blue line, grid, two glows)
 *     evidencia  the five evidence-type colors (used for nothing else, prompt §4.1)
 *     decor      the colors decorative signs may use (never the evidence colors)
 *     legend     verbatim legend constants: evidence types, neutral chip, "Ejemplo ilustrativo",
 *                warnings, estados, session signs, clinical traffic light, ladder of evidence,
 *                risk families, governance cycle, scenario patterns, fixed legend words
 *     rgba(hex, a), mix(hexA, hexB, t), shade(hex, amount)   small color helpers
 *   }
 *
 * The Spanish strings below are verbatim legend copy (prompt §4 / KB §3.1, §3.4, §13). They are
 * the only Spanish text the engine owns; everything else comes from js/data/.
 */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  var E = EIA.engine = EIA.engine || {};

  var mundo = {
    lienzo: '#F4EEDF',      // paper, page background
    lienzoOcre: '#E7D3A8',  // washed grounds
    tinta: '#15120F',       // line, text
    rojo: '#D7261E',        // suns, accents
    amarillo: '#F5C518',    // stars, light
    azul: '#1C3F95',        // azul ultramar: sea, night, shapes
    verde: '#1E8A4C',       // mountains, plants
    celeste: '#86BEE3',     // sky, rivers, ice
    tierra: '#C68A2E',      // ochre
    siena: '#94461C',       // sienna
    madera: '#6B4426',      // wood
    oro: '#E2B33C'          // coins (capital)
  };
  mundo.tierras = [mundo.tierra, mundo.siena, mundo.madera];

  var pieles = ['#F2CDAE', '#DDA77A', '#B97B4B', '#8A5634', '#5C3A24'];

  var maquina = {
    noche: '#0E1A3B',
    linea: '#A9D6FF',
    rejilla: '#2A3D6E',
    brilloVerde: '#46F0B0',
    brilloMagenta: '#F45CCF'
  };

  var evidencia = {
    capacidad: '#0072B2',
    uso: '#E69F00',
    resultado: '#009E73',
    expectativa: '#CC79A7',
    proyeccion: '#D55E00'
  };

  // Colors that decorative (non-meaning) signs may use: never the five evidence colors.
  var decor = [mundo.rojo, mundo.amarillo, mundo.azul, mundo.verde, mundo.tinta];

  // ---------------------------------------------------------------------------------------------
  // Legend (prompt §4)

  // 4.1 — five evidence types: color + sign + verbatim label + verbatim "Qué es" (KB §3.1).
  var tipos = [
    { clase: 'capacidad', label: 'Capacidad técnica', color: evidencia.capacidad, sign: 'matraz',
      que: 'Desempeño en evaluaciones controladas (benchmarks)' },
    { clase: 'uso', label: 'Uso declarado', color: evidencia.uso, sign: 'bocadillo',
      que: 'Lo que personas u organizaciones dicen hacer' },
    { clase: 'resultado', label: 'Resultado observado', color: evidencia.resultado, sign: 'lupa',
      que: 'Cambio medido en tiempo, costo, calidad o empleo' },
    { clase: 'expectativa', label: 'Expectativa', color: evidencia.expectativa, sign: 'catalejo',
      que: 'Intenciones declaradas' },
    { clase: 'proyeccion', label: 'Proyección', color: evidencia.proyeccion, sign: 'cometa',
      que: 'Estimación a futuro' }
  ];
  var tipoByClase = {};
  tipos.forEach(function (t) { tipoByClase[t.clase] = t; });

  // Other KB "Tipo" labels ("Índice", "Norma", "Uso observado"…): tinta outline, small square sign,
  // label verbatim from the figure. Rows whose type is "—" get no chip (clase 'ninguno').
  var neutral = { clase: 'neutral', color: mundo.tinta, sign: 'cuadrado' };

  var ilustrativo = { label: 'Ejemplo ilustrativo · no es un dato', sign: 'lapiz', dashed: true };

  // 4.2 — the four warnings (KB §3.4), stamps in tinta only: signs[0] ≠ signs[1].
  var advertencias = [
    { n: 1, texto: 'Uso no es valor.', signs: ['bocadillo', 'moneda'] },
    { n: 2, texto: 'Benchmark no es desempeño real.', signs: ['matraz', 'mesa'] },
    { n: 3, texto: 'Exposición no es desempleo.', signs: ['sol-escritorio', 'silla-vacia'] },
    { n: 4, texto: 'Asociación no es causalidad.', signs: ['dos-pajaros', 'flecha-empuja'] }
  ];

  // 4.3 — estado of a figure (KB §13): sign + verbatim meaning. Keys match EIA.util.estadoKey().
  var estados = {
    'verificada': { label: 'Verificada', sign: 'sello-visto',
      meaning: 'contrastada con la fuente original el 17 de octubre de 2026.' },
    'con-matiz': { label: 'Con matiz', sign: 'asterisco',
      meaning: 'verificada, pero con una precisión de alcance que conviene decir.' },
    'actualizacion': { label: 'Actualización', sign: 'luna',
      meaning: 'dato posterior al informe base.' },
    'informe-base': { label: 'Informe base', sign: 'libro',
      meaning: 'tomada del informe base y no verificada individualmente.' }
  };

  // 4.4 — session signs.
  var sesiones = {
    1: { sign: 'iceberg' },
    2: { sign: 'cordillera' },
    3: { sign: 'puente' },
    4: { sign: 'escalera-sin-peldano' },
    5: { sign: 'microscopio' },
    6: { sign: 'volante' },
    7: { sign: 'faro' }
  };

  // 4.4 — clinical traffic light (KB §8): fixed positions top → bottom, sign + label always.
  var semaforo = [
    { key: 'rojo', label: 'Rojo', sign: 'cruz', color: mundo.rojo, pos: 0 },
    { key: 'ambar', label: 'Ámbar', sign: 'medio-disco', color: mundo.amarillo, pos: 1 },
    { key: 'verde', label: 'Verde', sign: 'estrella-visto', color: mundo.verde, pos: 2 }
  ];

  // 4.4 — ladder of evidence (KB §8, contenido 6): six numbered rungs; rung labels live in data.
  var escalera = { rungs: 6 };

  // 4.4 — risk families (KB §9).
  var riesgos = [
    { key: 'uso-malicioso', label: 'Uso malicioso', sign: 'anzuelo' },
    { key: 'fallos', label: 'Fallos', sign: 'grieta' },
    { key: 'riesgos-sistemicos', label: 'Riesgos sistémicos', sign: 'red-pueblo' }
  ];

  // 4.4 — governance cycle (KB §9): six numbered stations; station labels live in data.
  var gobernanza = { stations: 6 };

  // 4.4 — scenarios (KB §10): four windows with pattern fills; agenda blocks and rubric levels
  // reuse the same patterns (meaning by number and pattern, never by the evidence colors).
  var escenarios = [
    { n: 1, pattern: 'puntos' },
    { n: 2, pattern: 'rayas' },
    { n: 3, pattern: 'estrellas' },
    { n: 4, pattern: 'cuadros' }
  ];
  var patterns = ['puntos', 'rayas', 'estrellas', 'cuadros', 'ondas', 'espirales'];

  // Fixed legend words the engine draws (prompt §3.7, §3.8, §4, §12.1).
  var words = {
    noComparable: 'No se compara directamente',
    hasta: 'hasta',
    aprox: '≈',
    advertencia: 'Advertencia',
    ideaCentral: 'Idea central',
    cero: '0'
  };

  // ---------------------------------------------------------------------------------------------
  // Small color helpers (pure).

  function parseHex(hex) {
    var h = String(hex).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function toHex(rgb) {
    return '#' + rgb.map(function (v) {
      var s = Math.max(0, Math.min(255, Math.round(v))).toString(16);
      return s.length < 2 ? '0' + s : s;
    }).join('').toUpperCase();
  }
  var rgbaCache = {};
  function rgba(hex, a) {
    var k = hex + '|' + a;
    var v = rgbaCache[k];
    if (v) return v;
    var c = parseHex(hex);
    v = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
    rgbaCache[k] = v;
    return v;
  }
  function mix(a, b, t) {
    var x = parseHex(a), y = parseHex(b);
    return toHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
  }
  // amount < 0 darkens toward tinta, > 0 lightens toward lienzo.
  var shadeCache = {};
  function shade(hex, amount) {
    var k = hex + '|' + amount;
    if (shadeCache[k]) return shadeCache[k];
    var v = amount < 0 ? mix(hex, mundo.tinta, -amount) : mix(hex, mundo.lienzo, amount);
    shadeCache[k] = v;
    return v;
  }

  E.palette = {
    mundo: mundo,
    pieles: pieles,
    maquina: maquina,
    evidencia: evidencia,
    decor: decor,
    legend: {
      tipos: tipos,
      tipoByClase: tipoByClase,
      neutral: neutral,
      ilustrativo: ilustrativo,
      advertencias: advertencias,
      estados: estados,
      sesiones: sesiones,
      semaforo: semaforo,
      escalera: escalera,
      riesgos: riesgos,
      gobernanza: gobernanza,
      escenarios: escenarios,
      patterns: patterns,
      words: words
    },
    rgba: rgba,
    mix: mix,
    shade: shade,
    parseHex: parseHex
  };
})(typeof window !== 'undefined' ? window : globalThis);
