/* Estado de la IA 2026 — shared namespace and small utilities.
 *
 * Classic script (no ES modules) so the site opens from file://. Every other file adds itself to
 * window.EIA. This file must stay DOM-free at load time: tools/lib/load-data.mjs evaluates it, and
 * the js/data/*.js files, inside a Node vm sandbox.
 *
 *   EIA.data     content transcribed from the knowledge base (js/data/*.js)
 *   EIA.engine   drawing and playback engine (js/engine/*.js)
 *   EIA.laminas  the 17 láminas, one module per file (js/laminas/dNN.js)
 *   EIA.videos   the 9 videos, one module per file (js/videos/vNN-*.js)
 *   EIA.ui       page views and interactions (js/ui/*.js)
 *   EIA.util     helpers shared by all of the above (defined here)
 */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  EIA.data = EIA.data || {};
  EIA.data.sesiones = EIA.data.sesiones || {};
  EIA.engine = EIA.engine || {};
  EIA.laminas = EIA.laminas || {};
  EIA.videos = EIA.videos || {};
  EIA.ui = EIA.ui || {};
  var util = EIA.util = EIA.util || {};

  // ---------------------------------------------------------------------------------------------
  // Spanish number formatting, as the KB writes numbers: thousands with ".", decimals with ",",
  // minus sign "−" (U+2212). Four-digit numbers are grouped too ("1.993"), like the KB.

  util.formatNumber = function (value, decimals) {
    var n = Number(value);
    if (!isFinite(n)) return String(value);
    var s = decimals == null ? String(Math.abs(n)) : Math.abs(n).toFixed(decimals);
    var parts = s.split('.');
    var whole = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (n < 0 ? '−' : '') + whole + (parts[1] ? ',' + parts[1] : '');
  };

  util.formatPercent = function (value, decimals) {
    return util.formatNumber(value, decimals) + '%';
  };

  // "m:ss" (or "h:mm:ss") for player clocks and durations.
  util.formatClock = function (seconds) {
    var t = Math.max(0, Math.floor(Number(seconds) || 0));
    var h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    var ss = (s < 10 ? '0' : '') + s;
    if (h > 0) return h + ':' + (m < 10 ? '0' : '') + m + ':' + ss;
    return m + ':' + ss;
  };

  // Accent- and case-insensitive form of a string, for search and comparisons.
  util.fold = function (text) {
    return String(text == null ? '' : text)
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase();
  };

  // Turns "Sesión 3 · Economía" into "sesion-3-economia".
  util.slug = function (text) {
    return util.fold(text).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  };

  // ---------------------------------------------------------------------------------------------
  // Safe localStorage: every access is wrapped, because file://, private windows and blocked site
  // data can make the accessor throw or come back empty. Keys are prefixed with "eia:".

  util.store = {
    get: function (key, fallback) {
      try {
        var raw = root.localStorage.getItem('eia:' + key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch (err) {
        return fallback;
      }
    },
    set: function (key, value) {
      try {
        root.localStorage.setItem('eia:' + key, JSON.stringify(value));
        return true;
      } catch (err) {
        return false;
      }
    },
    remove: function (key) {
      try {
        root.localStorage.removeItem('eia:' + key);
        return true;
      } catch (err) {
        return false;
      }
    }
  };

  // Query string as a plain object (?render=v02&t=12 -> { render: 'v02', t: '12' }).
  util.query = function () {
    var out = {};
    var search = root.location && root.location.search ? root.location.search.slice(1) : '';
    search.split('&').forEach(function (pair) {
      if (!pair) return;
      var i = pair.indexOf('=');
      var k = decodeURIComponent(i < 0 ? pair : pair.slice(0, i));
      out[k] = i < 0 ? '' : decodeURIComponent(pair.slice(i + 1).replace(/\+/g, ' '));
    });
    return out;
  };

  // ---------------------------------------------------------------------------------------------
  // Figure registry access. Every number shown or spoken resolves through EIA.cifra(id), which reads
  // EIA.data.cifras (js/data/cifras.js) and EIA.data.fuentes (js/data/fuentes.js) at call time.

  var CLASE_POR_TIPO = {
    'capacidad tecnica': 'capacidad',
    'uso declarado': 'uso',
    'resultado observado': 'resultado',
    'expectativa': 'expectativa',
    'proyeccion': 'proyeccion'
  };

  // Evidence class for a KB "Tipo" label: one of the five types, 'neutral' for the other KB labels
  // ("Índice", "Norma", "Uso observado"…) and 'ninguno' for "—".
  util.claseDeTipo = function (tipo) {
    var t = util.fold(tipo).trim();
    if (!t || t === '—' || t === '-') return 'ninguno';
    return CLASE_POR_TIPO[t] || 'neutral';
  };

  // Estado key for a KB estado label, keeping any note out of the key:
  // "Verificada (corrige el «3»)" -> 'verificada'.
  util.estadoKey = function (estado) {
    var e = util.fold(estado);
    if (e.indexOf('verificada') === 0) return 'verificada';
    if (e.indexOf('con matiz') === 0) return 'con-matiz';
    if (e.indexOf('actualizacion') === 0) return 'actualizacion';
    if (e.indexOf('informe base') === 0) return 'informe-base';
    return '';
  };

  var byId = null;
  var resolved = {};

  function index() {
    if (byId) return byId;
    byId = {};
    (EIA.data.cifras || []).forEach(function (c) { byId[c.id] = c; });
    return byId;
  }

  function fuente(key) {
    var f = (EIA.data.fuentes || {})[key];
    if (!f) throw new Error('Fuente desconocida: ' + key);
    return { key: key, etiqueta: f.etiqueta, url: f.url, titulo: f.titulo || f.etiqueta };
  }

  /* EIA.cifra(id) -> the registry entry plus what tags, chips and citations need:
   *   { id, tema, cifra, alcance, alcanceCompleto, tipo, clase, fuentes, estado, sesiones, enBanco,
   *     alcanceTexto,          // alcanceCompleto when the KB says "Ídem", otherwise alcance
   *     estadoKey,             // 'verificada' | 'con-matiz' | 'actualizacion' | 'informe-base'
   *     fuentesList,           // [{ key, etiqueta, url, titulo }] in KB order
   *     etiqueta, url,         // short label and URL of the first source (what a tag shows)
   *     chip: { clase, label } // evidence chip: class + verbatim KB type label
   *   }
   * Throws on an unknown id: a missing figure is a content bug, and check-content.mjs reports it. */
  EIA.cifra = function (id) {
    if (resolved[id]) return resolved[id];
    var c = index()[id];
    if (!c) throw new Error('Cifra desconocida: ' + id);
    var list = (c.fuentes || []).map(fuente);
    var out = {};
    Object.keys(c).forEach(function (k) { out[k] = c[k]; });
    out.clase = c.clase || util.claseDeTipo(c.tipo);
    out.alcanceTexto = c.alcanceCompleto || c.alcance;
    out.estadoKey = util.estadoKey(c.estado);
    out.fuentesList = list;
    out.etiqueta = list.length ? list[0].etiqueta : '';
    out.url = list.length ? list[0].url : '';
    out.chip = { clase: out.clase, label: c.tipo };
    resolved[id] = out;
    return out;
  };

  EIA.cifra.has = function (id) { return !!index()[id]; };
  EIA.cifra.all = function () { return (EIA.data.cifras || []).map(function (c) { return EIA.cifra(c.id); }); };
  // Call after replacing EIA.data.cifras or EIA.data.fuentes at runtime.
  EIA.cifra.reset = function () { byId = null; resolved = {}; };

  /* "Copiar cita" text, exactly:
   *   {cifra} ({alcance}). Tipo de evidencia: {tipo}. Fuente: {fuentes}. Estado en la base del curso: {estado}.
   * {fuentes} is each source as "{etiqueta}, {url}" joined by "; "; the "Tipo de evidencia" sentence is
   * left out when the KB type is "—". Context figures (ctx-*) carry no KB estado, so their estado
   * sentence is left out too instead of being invented. */
  util.citation = function (id) {
    var c = EIA.cifra(id);
    var parts = [c.cifra + ' (' + c.alcanceTexto + ').'];
    if (c.clase !== 'ninguno') parts.push('Tipo de evidencia: ' + c.tipo + '.');
    parts.push('Fuente: ' + c.fuentesList.map(function (f) { return f.etiqueta + ', ' + f.url; }).join('; ') + '.');
    if (c.estado) parts.push('Estado en la base del curso: ' + c.estado + '.');
    return parts.join(' ');
  };

  // ---------------------------------------------------------------------------------------------
  /* Drawing environment handed to every video and lámina module (prompt §5.6):
   *   env = { W, H, ink, chart, tags, fig, pal, ease, rng(seed), cache, cifra(id), id }
   * Engine modules are looked up when makeEnv is called, after every script has loaded. `cache` is a
   * Map private to one module instance (setup results, offscreen canvases). */
  EIA.makeEnv = function (opts) {
    opts = opts || {};
    var E = EIA.engine;
    return {
      W: 1280,
      H: 720,
      id: opts.id || '',
      ink: E.ink,
      chart: E.chart,
      tags: E.tags,
      fig: E.figures,
      pal: E.palette,
      ease: E.easing,
      rng: function (seed) { return E.rng.create(seed); },
      cache: new Map(),
      cifra: EIA.cifra
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
